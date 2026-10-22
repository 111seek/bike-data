import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-[900px] place-items-center px-4 py-24 text-center">
      <p className="num text-[11px] font-semibold tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-3 text-[30px] font-bold tracking-tight">这条胎不在数据库里</h1>
      <p className="mt-3 max-w-md text-[13px] leading-6 text-muted">
        链接可能已失效，或者该型号尚未收录。回到数据库按品牌、年份或滚阻筛一筛。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-ink px-5 text-[12.5px] font-semibold text-paper hover:bg-accent"
      >
        返回数据库
      </Link>
    </main>
  );
}
