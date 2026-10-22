# 滚阻库 · 公路车轮胎实测数据库

一个对标 [Bicycle Rolling Resistance](https://www.bicyclerollingresistance.com/road-bike-reviews) 的中文数据站。
抓取公路车列表页与 182 条评测详情，清洗成结构化数据后，提供可搜索、可筛选、可排序、可对比的界面。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

生产构建会预渲染 214 个静态页面（首页、排行榜、品牌页、全部轮胎详情、关于页）。

## 数据抓取

```bash
python3 -m pip install -r scripts/requirements.txt
npm run scrape
```

脚本会：

1. 抓取 `https://www.bicyclerollingresistance.com/road-bike-reviews` 列表页（品牌、型号、年份、类型、价位、标称/实测宽度与重量、滚阻、抓地、防刺、厚度、评分）。
2. 逐条访问评测详情页，补充厂商规格（TPI、胶料、胎唇、ETRTO、最大胎压、可选尺寸、EAN/MPN）以及测试表格（各胎压滚阻与 CRR、防刺分项、抓地分项、尺寸重量实测）。
3. 下载产品图到 `public/tires/`。
4. 输出：
   - `data/tires.json` — 站点直接读取的完整数据集
   - `data/tires.csv` — 扁平表格，方便 Excel 分析
   - `data/raw/*.html` — 原始页面缓存（已在 `.gitignore` 中忽略），删掉后会重新联网抓取
   - `public/data/tires.json`、`public/data/tires.csv` — 站点上「下载数据」按钮指向的静态副本

抓取按 4 个并发、每次请求间隔约 0.35s 进行，单次全量约 1–2 分钟。站点 `robots.txt` 未禁止评测页。

## 数据说明

- **滚阻**：单胎、28.8 km/h、42.5 kg 负载；列表与默认排序使用「高胎压」档（25–27 mm 用 80 psi，28–30 mm 用 72 psi）。
- **湿地抓地**：静态摩擦测试，分数 = 摩擦系数 × 100，越高越好。
- **防刺**：胎面总防刺分数，综合尖锐物、钝器穿刺力与胎体厚度，越高越好。
- **Pro 数据**：原始站点把多胎压滚阻、抓地中心/边缘、胎侧防刺、产地、部分尺寸数据放在付费会员中。本站不抓取、不绕过这部分，页面上显示为「会员数据」。每条轮胎缺失的字段记录在 `detail.pro_gated` 中。
- 产品图与测试数据版权归 Jarno Bierman / Bicycle Rolling Resistance 所有，本项目仅作技术演示与个人选胎参考。

## 站点结构

```
app/
  page.tsx                 首页：Hero、最快榜单、筛选表格
  tires/[slug]/page.tsx    轮胎详情：规格、测试结果、百分位、近似胎
  compare/page.tsx         对比页（最多 4 款，自动标注每项最佳）
  rankings/page.tsx        滚阻 / 抓地 / 防刺 / 重量榜单
  brands/                  品牌索引与单品牌车型表
  about/page.tsx           测试方法、数据覆盖、来源声明
  sitemap.ts / robots.ts   SEO
components/
  tire-explorer.tsx        客户端表格：搜索、筛选、排序、勾选对比
  compare-client.tsx       对比表与增删轮胎
lib/
  data.ts                  数据读取、品牌聚合、相似胎推荐
  ui.ts                    中文标签、单位格式化、百分位与配色
  types.ts                 数据类型
scripts/scrape.py          抓取与解析脚本
data/tires.json            完整数据集
public/tires/*.jpg         产品图
```

## 技术栈

Next.js 16（App Router、静态生成）+ React 19 + Tailwind CSS 4，无数据库；数据在构建时从 JSON 读取。

## 提交约定

- 远程仓库：`git@github.com:111seek/bike-data.git`，主分支 `main`。
- 每次提交后自动推送到 `origin/main`。钩子不随仓库分发，新克隆后执行一次：

```bash
sh scripts/install-hooks.sh
```

推送日志在 `.git/auto-push.log`。
