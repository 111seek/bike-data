import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-paper/70">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-2 text-paper">
            <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-paper/80">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="text-sm font-bold tracking-tight">滚阻库 · ROLLING DATA</span>
          </div>
          <p className="mt-4 max-w-sm text-[13px] leading-6">
            一个非官方的公路车轮胎实测数据库。滚阻、湿地抓地、防刺、厚度与重量数据来自
            Bicycle Rolling Resistance 的公开测试结果，仅作技术演示与选胎参考。
          </p>
          <p className="mt-4 text-[12px] text-paper/40">
            原始测试方法、图表与完整评测版权归 Jarno Bierman / Bicycle Rolling Resistance 所有。
          </p>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.18em] text-paper/40">浏览</h3>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li><Link className="hover:text-paper" href="/">全部轮胎</Link></li>
            <li><Link className="hover:text-paper" href="/rankings">排行榜</Link></li>
            <li><Link className="hover:text-paper" href="/brands">品牌索引</Link></li>
            <li><Link className="hover:text-paper" href="/compare">轮胎对比</Link></li>
            <li><Link className="hover:text-paper" href="/about">数据与测试方法</Link></li>
            <li><a className="hover:text-paper" href="/data/tires.csv" download>下载数据 CSV ↓</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.18em] text-paper/40">单位说明</h3>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li>滚阻：瓦特（W），28.8 km/h、单胎、42.5 kg 负载</li>
            <li>湿地抓地：分数（摩擦系数 × 100），越高越好</li>
            <li>防刺：总分，越高越好</li>
            <li>厚度：毫米（mm）</li>
            <li>重量：克（g）</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-5 text-[11px] text-paper/35 md:flex-row md:items-center md:justify-between md:px-8">
          <span>非官方镜像 · 数据抓取自公开页面 · 请以原始站点为准</span>
          <span className="num">BRR · road bike · {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
