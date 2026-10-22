#!/usr/bin/env python3
"""Scrape the road-bike tire dataset from bicyclerollingresistance.com.

Outputs:
  data/tires.json   normalized dataset (listing columns + review-page details)
  data/tires.csv    flat table for spreadsheet use
  data/raw/*.html   cached source pages (so re-parsing needs no network)
  public/tires/*.jpg  tire photos
"""

from __future__ import annotations

import csv
import json
import os
import re
import shutil
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import lxml.html

BASE = "https://www.bicyclerollingresistance.com"
LIST_URL = f"{BASE}/road-bike-reviews"
ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
IMG_DIR = ROOT / "public" / "tires"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
DELAY = 0.35
_print_lock = threading.Lock()


def log(*args):
    with _print_lock:
        print(*args, flush=True)


def fetch(url: str, cache: Path, tries: int = 4) -> str:
    if cache.exists() and cache.stat().st_size > 2000:
        return cache.read_text(encoding="utf-8", errors="replace")
    cache.parent.mkdir(parents=True, exist_ok=True)
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": UA,
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
            with urllib.request.urlopen(req, timeout=40) as resp:
                data = resp.read()
            cache.write_bytes(data)
            time.sleep(DELAY)
            return data.decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            last = e
            time.sleep(1.5 * (attempt + 1))
        except Exception as e:  # network hiccup
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last}")


def num(text: str | None) -> float | None:
    if text is None:
        return None
    m = re.search(r"-?\d+(?:\.\d+)?", text.replace(",", ""))
    return float(m.group(0)) if m else None


def cell_text(td) -> str:
    """Text of a cell with <br> preserved as separators."""
    td = lxml.html.fromstring(lxml.html.tostring(td))
    for br in td.xpath(".//br"):
        br.tail = "\n" + (br.tail or "")
    return re.sub(r"[ \t\r\f\v]+", " ", td.text_content()).strip()


def clean_label(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def is_pro(value: str | None) -> bool:
    return value is not None and "pro data" in value.lower()


def cell_number(td) -> float | None:
    """First number in a listing cell, unless the cell exposes Pro-only data."""
    text = cell_text(td)
    if not re.search(r"\d", text):
        return None
    if "pro data" in text.lower():
        return None
    return num(text)


# ---------------------------------------------------------------- listing page
LIST_FIELDS = [
    "slug", "brand", "model", "review_title", "url", "year", "tire_type",
    "inner_tube", "price_range", "buy_at", "width_spec", "width_measured",
    "weight_spec", "weight_measured", "rr_medium", "rr_high", "rr_extra_high",
    "rr_ultra_high", "grip_avg", "grip_center", "grip_edge", "puncture_tread",
    "puncture_sidewall", "thickness_tread", "thickness_sidewall", "rating",
]


def parse_listing(html: str) -> list[dict]:
    doc = lxml.html.fromstring(html)
    table = doc.xpath('//table[@id="tableTirePagesData"]')[0]
    tires = []
    for tr in table.xpath("./tbody/tr"):
        tds = tr.xpath("./td")
        if len(tds) < 18:
            continue
        checkbox = tr.xpath(".//input[@type='checkbox']")
        slug = checkbox[0].get("id") if checkbox else None
        link = tds[2].xpath(".//a")[0]
        href = link.get("href", "")
        brand = cell_text(tds[1])
        model = (link.xpath(".//b[@class='model']/text()") or [cell_text(link)])[0].strip()

        def span(cls, td):
            nodes = td.xpath(f".//span[contains(@class,'{cls}')]")
            if not nodes:
                return None
            if is_pro(nodes[0].text_content()):
                return None
            return num(nodes[0].text_content())

        rr = [cell_number(tds[i]) for i in (10, 11, 12, 13)]
        grip = [cell_number(tds[14])] + [span(c, tds[14]) for c in ("wgc", "wge")]
        puncture = [cell_number(tds[15])] + [span("prsw", tds[15])]
        thickness = [cell_number(tds[16])] + [span("thicksw", tds[16])]

        price = cell_text(tds[6]).replace("\n", "")
        tires.append(
            {
                "slug": slug,
                "brand": brand,
                "model": model,
                "review_title": link.get("title", ""),
                "url": urllib.parse.urljoin(BASE, href),
                "year": int(num(cell_text(tds[3])) or 0) or None,
                "tire_type": cell_text(tds[4]),
                "inner_tube": cell_text(tds[5]) or None,
                "price_range": price or None,
                "buy_at": [
                    {"text": a.text_content().strip(), "href": urllib.parse.urljoin(BASE, a.get("href", ""))}
                    for a in tds[7].xpath(".//a")
                ],
                "width_spec": num(tds[8].xpath(".//span[contains(@class,'widths')]/text()")[0])
                if tds[8].xpath(".//span[contains(@class,'widths')]")
                else None,
                "width_measured": num(tds[8].xpath(".//span[contains(@class,'widthm')]/text()")[0])
                if tds[8].xpath(".//span[contains(@class,'widthm')]")
                else None,
                "weight_spec": span("sweight", tds[9]),
                "weight_measured": span("mweight", tds[9]),
                "rr_medium": rr[0],
                "rr_high": rr[1],
                "rr_extra_high": rr[2],
                "rr_ultra_high": rr[3],
                "grip_avg": grip[0],
                "grip_center": grip[1],
                "grip_edge": grip[2],
                "puncture_tread": puncture[0],
                "puncture_sidewall": puncture[1],
                "thickness_tread": thickness[0],
                "thickness_sidewall": thickness[1],
                "rating": num(cell_text(tds[17])),
            }
        )
    return tires


# ------------------------------------------------------------- review page
SPEC_KEYS = {
    "brand": "brand",
    "model": "model",
    "year": "year",
    "tire type": "tire_type",
    "supplied by": "supplied_by",
    "new or used": "condition",
    "mileage": "mileage",
    "price range": "price_range",
    "buy at": "buy_at",
    "manufacturer part number": "mpn",
    "ean": "ean",
    "tpi": "tpi",
    "compound": "compound",
    "bead": "bead",
    "etrto": "etrto",
    "size inch": "size_inch",
    "specified width (mm)": "width_spec",
    "specified weight": "weight_spec",
    "max air pressure (psi)": "max_pressure",
    "made in": "made_in",
    "available sizes": "available_sizes",
}

MEASURE_KEYS = {
    "specified weight": "weight_spec",
    "measured weight": "weight_measured",
    "system adjusted weight": "weight_system",
    "measured width": "width_measured",
    "measured height": "height_measured",
    "tire circumference": "circumference",
    "total tire thickness center": "thickness_tread",
    "total tire thickness sidewall": "thickness_sidewall",
    "unmounted casing width": "casing_width",
    "unmounted tread width": "tread_width",
    "tread cover": "tread_cover",
}


def table_pairs(table) -> list[tuple[str, str]]:
    pairs = []
    for tr in table.xpath(".//tr"):
        tds = tr.xpath("./td|./th")
        if len(tds) < 2:
            continue
        pairs.append((cell_text(tds[0]), cell_text(tds[1])))
    return pairs


def lookup(mapping: dict[str, str], label: str) -> str | None:
    """Match a table label against a mapping of label prefixes."""
    ll = clean_label(label)
    for key, value in mapping.items():
        if ll == key or ll.startswith(key):
            return value
    return None


TEXT_KEYS = {
    "available_sizes", "compound", "bead", "etrto", "size_inch", "made_in",
    "price_range", "supplied_by", "condition", "mileage", "mpn", "ean", "tire_type",
    "brand", "model", "tpi",
}


def parse_review(html: str) -> dict:
    doc = lxml.html.fromstring(html)
    tables = doc.xpath("//table")
    props = {el.get("itemprop"): (el.get("content") or el.text_content().strip()) for el in doc.xpath("//*[@itemprop]")}
    date_el = doc.xpath("//*[contains(text(),'Published:')]")
    published = None
    if date_el:
        m = re.search(r"Published:\s*(\d{4}-\d{2}-\d{2})", date_el[0].text_content())
        published = m.group(1) if m else None
    published = published or props.get("datePublished")

    specs: dict = {}
    measurements: dict = {}
    rr: dict = {}
    puncture: dict = {}
    grip: dict = {}
    gated: set[str] = set()

    def put(dst, key, raw, gated_key=None):
        if is_pro(raw):
            dst[key] = None
            gated.add(gated_key or key)
            return
        if key == "available_sizes":
            dst[key] = [
                re.sub(r"\s+", " ", s).strip() for s in raw.split("\n") if s.strip()
            ]
            return
        value = re.sub(r"\s+", " ", raw).strip()
        if value in ("", None, "-"):
            dst[key] = None
            return
        if key in TEXT_KEYS:
            dst[key] = value
        else:
            dst[key] = num(value)

    for table in tables:
        pairs = table_pairs(table)
        if not pairs:
            continue
        title = re.sub(r"\s+", " ", " ".join(t.strip() for t in table.xpath(".//text()") if t.strip())).lower()
        if title.startswith("manufacturer specifications"):
            for label, value in pairs:
                key = lookup(SPEC_KEYS, label)
                if not key:
                    continue
                if key == "buy_at":
                    specs[key] = [
                        {
                            "text": a.text_content().strip(),
                            "href": urllib.parse.urljoin(BASE, a.get("href", "")),
                        }
                        for a in table.xpath(".//a")
                        if "pro data" not in a.text_content().lower()
                    ]
                else:
                    put(specs, key, value, f"spec.{key}")
        elif title.startswith("size, weight and thickness"):
            for label, value in pairs:
                key = lookup(MEASURE_KEYS, label)
                if key:
                    put(measurements, key, value, f"measurement.{key}")
        elif title.startswith("rolling resistance test results"):
            for label, value in pairs:
                ll = clean_label(label)
                for name, needle in (
                    ("ultra_high", "ultra high air pressure"),
                    ("extra_high", "extra high air pressure"),
                    ("high", "high air pressure"),
                    ("medium", "medium air pressure"),
                ):
                    if needle in ll:
                        if is_pro(value):
                            rr[name] = {"watts": None, "crr": None}
                            gated.add(f"rr.{name}")
                        else:
                            crr = None
                            m = re.search(r"crr:\s*([\d.]+)", value, re.I)
                            if m:
                                crr = float(m.group(1))
                            rr[name] = {"watts": num(value), "crr": crr}
                        break
        elif title.startswith("puncture resistance test results"):
            for label, value in pairs:
                ll = clean_label(label)
                for needle, key in (
                    ("total puncture score tread", "score_tread"),
                    ("total puncture score sidewall", "score_sidewall"),
                    ("tread puncture force sharp", "force_sharp_tread"),
                    ("tread puncture force blunt", "force_blunt_tread"),
                    ("tread total tire thickness", "thickness_tread"),
                    ("sidewall puncture force sharp", "force_sharp_sidewall"),
                    ("sidewall puncture force blunt", "force_blunt_sidewall"),
                    ("sidewall total tire thickness", "thickness_sidewall"),
                ):
                    if needle in ll:
                        put(puncture, key, value, f"puncture.{key}")
                        break
        elif title.startswith("static grip test results"):
            for label, value in pairs:
                ll = clean_label(label)
                for needle, key in (
                    ("wet grip average", "wet_avg"),
                    ("wet grip center", "wet_center"),
                    ("wet grip edge", "wet_edge"),
                ):
                    if needle in ll:
                        put(grip, key, value, f"grip.{key}")
                        break

    rating = props.get("ratingValue")
    description = None
    metas = doc.xpath('//meta[@name="description"]/@content')
    if metas:
        description = metas[0].strip()
    images = [c.strip() for c in doc.xpath("//*[@itemprop='image']/@content") if c and c.strip()]
    if not images:
        images = [c.strip() for c in doc.xpath("//img[@itemprop='image']/@data-src") if c and c.strip()]
    image = images[0] if images else None

    verdict = None
    for el in doc.xpath("//p[contains(.,'TEST VERDICT')]"):
        m = re.search(r"TEST VERDICT:\s*(.+)", el.text_content(), re.S | re.I)
        if m:
            verdict = re.sub(r"\s+", " ", m.group(1)).strip()
            break

    return {
        "published": published,
        "author": props.get("author"),
        "rating": float(rating) if rating else None,
        "verdict": verdict,
        "image": image,
        "description": description,
        "specs": specs,
        "measurements": measurements,
        "rr": rr,
        "puncture": puncture,
        "grip": grip,
        "pro_gated": sorted(gated),
    }


# ------------------------------------------------------------------ images
def download_image(url: str, dest: Path) -> str | None:
    if not url:
        return None
    if dest.exists() and dest.stat().st_size > 1000:
        return f"/tires/{dest.name}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": LIST_URL})
        with urllib.request.urlopen(req, timeout=40) as resp:
            data = resp.read()
        if len(data) < 500:
            return None
        dest.write_bytes(data)
        time.sleep(0.1)
        return f"/tires/{dest.name}"
    except Exception as e:
        log(f"  ! image failed {url}: {e}")
        return None


def main() -> int:
    RAW.mkdir(parents=True, exist_ok=True)
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    listing_html = fetch(LIST_URL, RAW / "listing.html")
    tires = parse_listing(listing_html)
    log(f"listing: {len(tires)} tires")

    errors = []

    def work(tire):
        slug = tire["slug"]
        try:
            html = fetch(tire["url"], RAW / f"{slug}.html")
            detail = parse_review(html)
            tire["detail"] = detail
            img = detail.get("image")
            if img:
                ext = os.path.splitext(urllib.parse.urlparse(img).path)[1] or ".jpg"
                tire["image"] = download_image(img, IMG_DIR / f"{slug}{ext}")
            log(f"  ok {slug}")
        except Exception as e:
            errors.append((slug, str(e)))
            log(f"  FAIL {slug}: {e}")
            tire["detail"] = None
        return tire

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(work, t): t for t in tires}
        for fut in as_completed(futures):
            fut.result()

    # sort: fastest rolling resistance first (high-pressure RR), unknown last
    tires.sort(key=lambda t: (t.get("rr_high") is None, t.get("rr_high") or 999, t["brand"].lower()))

    payload = {
        "source": LIST_URL,
        "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(tires),
        "tires": tires,
    }
    (ROOT / "data" / "tires.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (ROOT / "public" / "data").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "data" / "tires.json", ROOT / "public" / "data" / "tires.json")

    flat_fields = LIST_FIELDS + ["published", "verdict", "tpi", "compound", "bead", "etrto", "max_pressure", "made_in"]
    with (ROOT / "data" / "tires.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=flat_fields, extrasaction="ignore")
        writer.writeheader()
        for t in tires:
            row = dict(t)
            d = t.get("detail") or {}
            specs = d.get("specs") or {}
            buys = t.get("buy_at") or specs.get("buy_at") or []
            row["buy_at"] = "; ".join(f"{b.get('text', '')} {b.get('href', '')}".strip() for b in buys)
            row.update(
                published=d.get("published"),
                verdict=d.get("verdict"),
                tpi=specs.get("tpi"),
                compound=specs.get("compound"),
                bead=specs.get("bead"),
                etrto=specs.get("etrto"),
                max_pressure=specs.get("max_pressure"),
                made_in=specs.get("made_in"),
            )
            writer.writerow(row)

    shutil.copyfile(ROOT / "data" / "tires.csv", ROOT / "public" / "data" / "tires.csv")

    log(f"done: {len(tires)} tires, {len(errors)} errors")
    for slug, err in errors:
        log("  error:", slug, err)
    return 0


if __name__ == "__main__":
    sys.exit(main())
