<div align="center">

# 🔍 SearchGal · Gal资源聚合搜索工具

🚀 **极速响应** | 🌊 **SSE 流式传输** | 🎮 **37+ 平台聚合** | ☁️ **边缘部署**

[在线预览](https://gal.hhoo.cc.cd) • [快速部署](#-快速部署) • [API 文档](#-api-文档) • [开发者接入](#-开发者接入指南)

</div>

---

## 🖥️ 在线预览

🌐 **预览地址**: [gal.hhoo.cc.cd](https://gal.hhoo.cc.cd)  

|          电脑端          |          移动端          |
| :------------------------: | :----------------------: |
| ![电脑端](./docs/img/pc_search_view.png) | ![移动端](./docs/img/phone_search_view.jpg) |

---

## 🌟 项目亮点

| 特性 | 说明 |
|:----:|------|
| ✅ **多端适配** | PC/移动端完美适配，PC端支持展示游戏封面、介绍、标签 |
| 💡 **多源聚合** | 实时聚合 **37+** Gal资源平台 + **2+** 补丁站 |
| 🏷️ **智能标注** | 自动标注：🟢免登录 / 🟡需魔法 / ⚪特殊条件 |
| ☁️ **部署平台** | Cloudflare Workers |
| 🌊 **流式响应** | SSE 实时返回搜索结果，无需等待全部完成 |

> 📜 **历史版本**: Python 版本请查看 [`old`](https://github.com/Moe-Sakura/SearchGal/tree/old) 分支 **(已停止维护)**

---

## 🚀 已收录平台

### 🟢 免登录直链下载

[![VNS](https://img.shields.io/badge/VNS-00C853)](https://gal.saop.cc/)
[![真红小站](https://img.shields.io/badge/真红小站-00C853)](https://shinnku.com)
[![KisuGal](https://img.shields.io/badge/KisuGal-00C853)](https://www.kisuacg.moe/)
[![Galgamex](https://img.shields.io/badge/Galgamex-00C853)](https://www.galgamex.net/)
[![忧郁的loli](https://img.shields.io/badge/忧郁的loli-00C853)](https://www.ttloli.com/)
[![GAL图书馆](https://img.shields.io/badge/GAL图书馆-00C853)](https://gallibrary.pw/)
[![绮梦ACG](https://img.shields.io/badge/绮梦ACG-00C853)](https://game.acgs.one/)
[![鲲Galgame](https://img.shields.io/badge/鲲Galgame-00C853)](https://www.kungal.com/zh-cn/)
[![未知云盘](https://img.shields.io/badge/未知云盘-00C853)](https://www.nullcloud.top/)
[![梓澪の妙妙屋](https://img.shields.io/badge/梓澪の妙妙屋-00C853)](https://zi0.cc/)
[![猫猫网盘](https://img.shields.io/badge/猫猫网盘-00C853)](https://catcat.cloud/)
[![稻荷GAL](https://img.shields.io/badge/稻荷GAL-00C853)](https://inarigal.com/)
[![Koyso](https://img.shields.io/badge/Koyso-00C853)](https://koyso.to/)
[![萤ノ光](https://img.shields.io/badge/萤ノ光-00C853)](https://www.yinghu.asia/)
[![月谣](https://img.shields.io/badge/月谣-00C853)](https://www.sayafx.vip/)
[![05的资源小站](https://img.shields.io/badge/05的资源小站-00C853)](https://05fx.022016.xyz/)
[![紫缘Gal](https://img.shields.io/badge/紫缘Gal-00C853)](https://galzy.eu.org)

#### 🟢 补丁站

[![鲲Galgame补丁](https://img.shields.io/badge/鲲Galgame补丁-00C853)](https://www.moyu.moe/)
[![2dfan](https://img.shields.io/badge/2dfan-00C853)](https://2dfan.com)

### ⚪ 需登录/特殊条件

[![量子ACG](https://img.shields.io/badge/量子ACG-AAAAAA)](https://lzacg.org/)
[![FuFuGal](https://img.shields.io/badge/FuFuGal-AAAAAA)](https://www.fufugal.com/)
[![ACG嘤嘤怪](https://img.shields.io/badge/ACG嘤嘤怪-AAAAAA)](https://acgyyg.ru/)
[![喵源领域](https://img.shields.io/badge/喵源领域-AAAAAA)](https://www.nyantaku.com/)
[![玖黎ACG](https://img.shields.io/badge/玖黎ACG-AAAAAA)](https://jiuliacg.com/)

### 🟡 需魔法访问

[![VikaACG](https://img.shields.io/badge/VikaACG-FFC107)](https://www.vikacg.com/)
[![绅仕天堂](https://img.shields.io/badge/绅仕天堂-FFC107)](https://www.gogalgame.com/)
[![天游二次元](https://img.shields.io/badge/天游二次元-FFC107)](https://www.tiangal.com/)
[![Nysoure](https://img.shields.io/badge/Nysoure-FFC107)](https://res.nyne.dev/)
[![xxacg](https://img.shields.io/badge/xxacg-FFC107)](https://xxacg.net/)

---

## 🚀 快速部署

### ☁️ 一键云部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Moe-Sakura/SearchGal)

### 🧭 服务器配置参考

| 档位 | CPU | 内存 | 适用场景 |
|:----:|:---:|:----:|:--------:|
| 最低 | 1 vCPU | 512MB–1GB | 低并发 |
| 推荐 | 2 vCPU | 1–2GB | 中小规模 |
| 高并发 | 4+ vCPU | 2–4GB | 高并发 |

### 💻 本地开发

```bash
pnpm install        # 安装依赖
pnpm wrangler dev   # 启动开发服务器
```

---

## ☁️ Cloudflare 免费计划架构（重要）

本站的核心挑战：**Cloudflare 免费计划单次 Worker 调用硬限 50 个子请求**。37+ 资源站累加远超上限，曾导致一半左右平台报 `Too many subrequests`。

### 解决方案：客户端分批 fan-out

网页搜索**不依赖服务端同区自调用**（免费计划会静默拦截），而是把平台列表在**浏览器端**切成每批 8 个，每批对内部端点 `POST /__batch` 发起一次**独立**的 Worker 调用——每次调用各有专属的 50 子请求预算，并行执行后合并结果。这样免费计划也能搜完全部平台，且零额外配置。

> 为什么不在服务端分批？因为 Cloudflare 免费计划禁止同一 Zone 内 Worker 用 `fetch` 自调用（共享入站请求，会被直接丢弃）。服务端 fan-out 只在配置了 **Service Binding**（`SELF`）的付费计划下才启用，作为对外 `/gal`、`/patch` 的 SSE 接口。

### KV 缓存

每个 `/__batch` 的响应按 `游戏名 + 本批平台集合` 写入 KV（`SEARCHGAL_KV`），TTL 默认 30 分钟。重复搜索会直接命中缓存、秒回，并省下子请求额度。命中缓存的批次，前端对应平台会显示 **⚡ 缓存命中** 标记（左侧闪电图标 + 右侧详情胶囊）。

### 本地开发

```bash
pnpm install
pnpm wrangler dev      # 默认 8787 端口，/health 可查平台数
```

### 部署到 Cloudflare

```bash
pnpm wrangler deploy   # 需先 wrangler login
```

变量/绑定（均可在 `wrangler.toml` 配置）：
- `SEARCHGAL_KV` — KV 命名空间（缓存，可选但强烈建议）
- `SEARCHGAL_RATELIMIT` — Cloudflare Rate Limiting 绑定（分布式限流，可选；缺省降级为内存限流）
- `SEARCHGAL_BATCH_SIZE` — 单批平台数（默认 8，上限 20，仅影响服务端 fan-out）
- `SEARCHGAL_TIMEOUT_MS` / `SEARCHGAL_CONCURRENCY` / `SEARCHGAL_SUBREQUEST_BUDGET` — 超时/并发/子请求预算调优
- `[[services]] binding = "SELF"` — **仅付费计划**：指向自身的 Service Binding，启用服务端 SSE `/gal`、`/patch`（免费计划保持客户端分批即可，无需此配置）

---

## 📡 API 文档

### 接口说明

| 方法 | 路径 | 说明 |
|:----:|------|------|
| POST | `/gal` | 搜索游戏资源（**SSE 流式**，仅当配置了 `SELF` Service Binding 的付费计划可用；免费计划前端改走客户端分批，直接调此接口会返回 400 指引） |
| POST | `/patch` | 搜索补丁资源（同上） |
| POST | `/__batch` | **内部端点**：接收 `{game, type, platforms[]}`，返回 `{total, results[], cached}`。网页客户端据此分批并行调用，每批 = 一次独立 Worker 调用（各有专属 50 子请求预算），合并后即为完整搜索结果。`cached=true` 表示本批命中 KV 缓存 |

---

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|:------:|:----:|:----:|------|
| `game` | string | ✅ | 搜索关键词 |

**支持的 Content-Type**:
- `multipart/form-data` (推荐)
- `application/x-www-form-urlencoded`

---

### 请求示例

#### 使用 cURL

```bash
# 搜索游戏资源
curl -X POST "https://gal.hhoo.cc.cd/gal" \
  -F "game=千恋万花"

# 搜索补丁资源
curl -X POST "https://gal.hhoo.cc.cd/patch" \
  -F "game=千恋万花"
```

#### 使用 JavaScript (Fetch API)

```javascript
// 搜索游戏资源并处理 SSE 流式响应
async function searchGal(keyword) {
  const formData = new FormData();
  formData.append('game', keyword);

  const response = await fetch('https://gal.hhoo.cc.cd/gal', {
    method: 'POST',
    body: formData
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      const data = JSON.parse(line);
      
      if (data.total) {
        console.log(`总共 ${data.total} 个搜索源`);
      }
      if (data.progress) {
        console.log(`进度: ${data.progress.completed}/${data.progress.total}`);
      }
      if (data.result) {
        console.log('搜索结果:', data.result);
      }
      if (data.done) {
        console.log('搜索完成');
      }
    }
  }
}

searchGal('千恋万花');
```

---

### 响应格式 (SSE 流式)

```json
{"total": 10}                                    // 总搜索源数量
{"progress": {"completed": 1, "total": 10}}      // 进度更新
{"progress": {"completed": 2, "total": 10}, "result": {"name": "xx资源站", "color": "lime", "tags": ["NoReq", "SuDrive"], "items": [{"name": "千恋万花", "url": "https://xx.com/game/12345"}]}}  // 搜索结果
{"done": true}                                   // 结束信号
```

### 内部批量接口 `/__batch`（JSON）

网页默认走此接口做客户端 fan-out。也可直接调用：

```bash
curl -X POST "https://你的域名/__batch" \
  -H "Content-Type: application/json" \
  -d '{"game":"千恋万花","type":"gal","platforms":["鲲Galgame","Koyso"]}'
```

响应（每批独立，命中缓存时 `cached:true`）：

```json
{
  "total": 2,
  "cached": false,
  "results": [
    {"name": "鲲Galgame", "color": "#3b82f6", "tags": ["NoReq"], "items": [{"name": "千恋万花", "url": "https://www.kungal.com/..."}]},
    {"name": "Koyso", "color": "#a855f7", "tags": ["magic"], "items": []}
  ]
}
```

---

### 🏷️ 标签说明

| 标签 | 含义 | 标签 | 含义 |
|:----:|:----:|:----:|:----:|
| `NoReq` | 无门槛 | `Login` | 需登录 |
| `LoginPay` | 需付费 | `LoginRep` | 需回复 |
| `SuDrive` | 自建盘 | `NoSplDrive` | 不限速盘 |
| `SplDrive` | 限速盘 | `MixDrive` | 混合盘 |
| `BTmag` | BT/磁力 | `magic` | 需魔法 |

---

## 🛠️ 使用指南

| 步骤 | 技巧 |
|:----:|------|
| 🔍 **精准搜索** | 使用中文关键词效果最佳，如 `Senren＊Banka` → `千恋万花` → `千恋` |
| 🎯 **结果筛选** | 优先选择 🟢绿色标签 (免登录)，🟡金色需代理，⚪白色需对应条件 |
| ⬇️ **下载建议** | 推荐 IDM/FDM 加速，遇 Cloudflare 验证耐心等待 |

---

## 🤝 开发者接入指南

想要将您的站点接入聚合搜索？只需三步：

**1. 创建适配器** - 在 `src/platforms/gal/` 下创建 `YourSite.ts`

**2. 实现接口**
```typescript
import type { Platform, PlatformSearchResult } from "../../types";

const YourSite: Platform = {
  name: "站点名称",
  color: "lime",
  tags: ["NoReq"],
  search: async (game) => {
    // 实现搜索逻辑
    return { count: 0, items: [] };
  },
};
export default YourSite;
```

**3. 注册 & 提交**
```bash
pnpm run generate   # 自动注册
git push && PR      # 提交贡献
```

---

## ⚠️ 注意事项

**📢 广告白名单**: 本站无广告，但收录的资源站建站不易，请加入广告白名单支持站长！<br>
**✉️ 写给站长**: 本程序仅提供游戏发布页链接（非下载链接），不提供解压码。如不想被搜索，请过滤 UA 含 `Searchgal` 的请求。<br>
**🔐 安全声明**: 本工具仅提供搜索聚合，不托管资源，请自行校验文件安全性。<br>

---

## 📂 项目结构

```
SearchGal/
├── src/                     # 核心源码
│   ├── index.ts             # Cloudflare Workers 入口
│   ├── core.ts              # 搜索引擎核心逻辑
│   ├── types.ts             # TypeScript 类型定义
│   ├── platforms/           # 平台适配器目录
│   │   ├── gal/             # 游戏资源平台
│   │   └── patch/           # 补丁资源平台
│   └── utils/               # 工具函数
├── scripts/                 # 构建脚本
├── docs/                    # 文档资源
├── wrangler.toml            # Cloudflare Workers 配置
```

---

## 🌱 支持正版

本工具旨在提供资源索引便利，**请通过 Steam/DLSite 等正规渠道支持开发者！**

---

<div align="center">

**欢迎各位 GalGame 爱好者优化本项目 ❤️**

[MIT License](./LICENSE) © SearchGal

</div>
