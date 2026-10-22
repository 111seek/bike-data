#!/usr/bin/env python3
"""Build data/frames.json from TOUR Magazin test measurements.

Input : data/frames_raw.json  (one row per measured bike; see scrape_frames.py)
Output: data/frames.json, data/frames.csv, public/data/frames.{json,csv}

Weights are TOUR's own measurements (frame incl. paint, fork, headset).
Prices are the tested complete bike's price in EUR, not frame-only prices.
"""

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Curated selection: (test date, model_raw substring, brand, model, category, material)
SELECTION = [
    ("2025-09-05", "Cervélo", "Cervélo", "R5", "race", "carbon"),
    ("2025-02-26", "Basso SV", "Basso", "SV", "race", "carbon"),
    ("2023-12-26", "Factor O2 VAM", "Factor", "O2 VAM", "race", "carbon"),
    ("2023-12-25", "Van Rysel RCR", "Van Rysel", "RCR Dura-Ace Di2", "race", "carbon"),
    ("2023-12-01", "Ridley Falcn RS", "Ridley", "Falcn RS", "aero", "carbon"),
    ("2023-11-04", "Bianchi Specialissima RC", "Bianchi", "Specialissima RC", "race", "carbon"),
    ("2023-11-03", "Canyon Ultimate CFR", "Canyon", "Ultimate CFR Di2", "race", "carbon"),
    ("2023-11-02", "Giant TCR Advanced SL", "Giant", "TCR Advanced SL", "race", "carbon"),
    ("2023-11-01", "monda SLR9", "Trek", "Émonda SLR 9", "race", "carbon"),
    ("2023-10-31", "Storck Aernario.3 Platinum", "Storck", "Aernario.3 Platinum", "race", "carbon"),
    ("2023-10-22", "Cervélo R5-CX", "Cervélo", "R5-CX Force AXS", "cyclocross", "carbon"),
    ("2023-10-20", "Canyon Endurace CFR Di2", "Canyon", "Endurace CFR Di2", "endurance", "carbon"),
    ("2023-09-21", "Enve Melee", "ENVE", "Melee", "race", "carbon"),
    ("2023-09-17", "Trek Madone SLR9 AXS", "Trek", "Madone SLR 9 AXS", "aero", "carbon"),
    ("2023-08-19", "Look 795 Blade RS", "Look", "795 Blade RS", "aero", "carbon"),
    ("2023-08-19", "Rose Reveal AL", "Rose", "Reveal AL", "endurance", "aluminium"),
    ("2023-08-17", "Time ADHX", "Time", "ADHX", "allroad", "carbon"),
    ("2023-08-16", "Lapierre Xelius SL 10.0", "Lapierre", "Xelius SL 10.0", "race", "carbon"),
    ("2023-07-31", "Vitus Venon", "Vitus", "Venon", "endurance", "carbon"),
    ("2023-07-30", "Wilier Granturismo SLR", "Wilier", "Granturismo SLR", "endurance", "carbon"),
    ("2023-05-22", "Ridley Grifn", "Ridley", "Grifn", "allroad", "carbon"),
    ("2023-05-21", "Look 765 Optimum", "Look", "765 Optimum", "endurance", "carbon"),
    ("2023-05-20", "Canyon Endurace CF 7 Di2", "Canyon", "Endurace CF 7 Di2", "endurance", "carbon"),
    ("2023-05-19", "BH SL1 2.9", "BH", "SL1 2.9", "endurance", "carbon"),
    ("2023-02-26", "Liteville 4-One Mk2", "Liteville", "4-One Mk2", "gravel", "carbon"),
    ("2023-02-25", "Stoll S1 Race", "Stoll", "S1 Race", "race", "carbon"),
    ("2023-12-28", "Cinelli XCr 75th", "Cinelli", "XCr 75th", "race", "steel"),
    ("2023-12-30", "Canyon Grail CFR Di2", "Canyon", "Grail CFR Di2", "gravel", "carbon"),
    ("2023-12-31", "Specialized Diverge STR Expert", "Specialized", "Diverge STR Expert", "gravel", "carbon"),
    ("2022-11-20", "Radon Regard 10.0", "Radon", "Regard 10.0", "gravel", "aluminium"),
    ("2022-10-22", "Giant Propel Advanced SL", "Giant", "Propel Advanced SL", "aero", "carbon"),
    ("2022-10-15", "Scott Foil RC Ultimate", "Scott", "Foil RC Ultimate", "aero", "carbon"),
    ("2022-09-15", "Argon 18 Sum", "Argon 18", "Sum", "race", "carbon"),
    ("2022-08-01", "Canyon Aeroad CF SL 8", "Canyon", "Aeroad CF SL 8", "aero", "carbon"),
    ("2022-08-01", "Canyon Aeroad CFR Disc MVDP", "Canyon", "Aeroad CFR Disc MVDP", "aero", "carbon"),
    ("2022-08-01", "Giant TCR Advanced 1", "Giant", "TCR Advanced 1", "race", "carbon"),
    ("2022-08-01", "Merida Scultura Team", "Merida", "Scultura Team", "race", "carbon"),
    ("2022-08-01", "Specialized Tarmac SL7 Comp", "Specialized", "Tarmac SL7 Comp", "race", "carbon"),
    ("2022-08-01", "Specialized S-Works Tarmac SL7", "Specialized", "S-Works Tarmac SL7", "race", "carbon"),
    ("2022-08-01", "Wilier Zero SLR", "Wilier", "Zero SLR", "race", "carbon"),
    ("2022-07-08", "Colnago C68", "Colnago", "C68", "race", "carbon"),
    ("2022-06-29", "Rose XLite", "Rose", "XLite 06", "race", "carbon"),
    ("2022-06-17", "Rose Backroad", "Rose", "Backroad", "gravel", "carbon"),
    ("2022-06-01", "Langma Advanced Pro 1", "Liv", "Langma Advanced Pro 1", "race", "carbon"),
    ("2022-05-28", "Wilier Garda", "Wilier", "Garda", "endurance", "carbon"),
    ("2022-03-25", "Trek Checkpoint SL 6 eTap", "Trek", "Checkpoint SL 6 eTap", "gravel", "carbon"),
    ("2022-03-24", "Orbea Orca Aero M10iLTD", "Orbea", "Orca Aero M10iLTD", "aero", "carbon"),
    ("2022-03-23", "Cannondale Synapse Carbon 2 RL", "Cannondale", "Synapse Carbon 2 RL", "endurance", "carbon"),
    ("2022-03-22", "Cube Agree C:62 SLT", "Cube", "Agree C:62 SLT", "endurance", "carbon"),
]


def de(raw):
    """German-formatted integer: 1.096 -> 1096."""
    if raw in (None, ""):
        return None
    return int(float(str(raw).replace(".", "").replace(",", ".")))


def slugify(text):
    text = (
        text.lower()
        .replace("é", "e").replace("è", "e").replace("ê", "e")
        .replace("ü", "u").replace("ö", "o").replace("ä", "a").replace("ß", "ss")
    )
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def main():
    rows = json.loads((ROOT / "data" / "frames_raw.json").read_text(encoding="utf-8"))
    frames, used, missing = [], set(), []
    for date, needle, brand, model, category, material in SELECTION:
        candidates = [
            r for r in rows
            if r["date"] == date and needle.lower() in r["model_raw"].lower()
        ]
        if not candidates:
            missing.append((date, needle))
            continue
        row = candidates[0]
        key = (brand, model)
        if key in used:
            continue
        used.add(key)
        frames.append(
            {
                "slug": slugify(f"{brand}-{model}"),
                "brand": brand,
                "model": model,
                "year": int(date[:4]),
                "category": category,
                "material": material,
                "frame_weight": de(row["frame"]),
                "fork_weight": de(row["fork"]),
                "headset_weight": de(row["headset"]),
                "price": de(row["price"]),
                "currency": "EUR",
                "price_basis": "complete",
                "tested_at": date,
                "source_url": row["url"],
            }
        )

    frames.sort(key=lambda f: (f["frame_weight"] is None, f["frame_weight"] or 9999))

    payload = {
        "source": "https://www.tour-magazin.de",
        "source_name": "TOUR Magazin",
        "note": "车架/前叉/碗组重量为 TOUR 实测值；价格为被测整车参考价（欧元），不是车架组单独售价。",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(frames),
        "frames": frames,
    }

    (ROOT / "data" / "frames.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    fields = [
        "slug", "brand", "model", "year", "category", "material",
        "frame_weight", "fork_weight", "headset_weight", "price", "currency",
        "price_basis", "tested_at", "source_url",
    ]
    (ROOT / "public" / "data").mkdir(parents=True, exist_ok=True)
    with (ROOT / "data" / "frames.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(frames)

    for name in ("frames.json", "frames.csv"):
        src = ROOT / "data" / name
        (ROOT / "public" / "data" / name).write_bytes(src.read_bytes())

    print(f"frames: {len(frames)}")
    if missing:
        print("missing:", missing)


if __name__ == "__main__":
    main()
