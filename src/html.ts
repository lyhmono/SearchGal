// SearchGAL 前端 HTML - 主从布局版
// 左侧平台列表 + 右侧详情面板，保留动态背景（极光/网格/二次元图片）
// 包含：Resource Hints、移动端堆叠、键盘导航、客户端 fan-out 分批、结果排序

import { PLATFORMS_GAL, PLATFORMS_PATCH } from "./core";

// 平台名称清单：注入到前端，供「客户端 fan-out」按批拆分平台。
// 浏览器每批对 /__batch 发起一次【独立】Worker 调用，每次调用各有专属的 50 子请求预算，
// 从而在不升级付费计划的前提下搜完 37+ 平台（服务端同区自调用在免费计划下被 Cloudflare 拦截）。
const SG_PLATFORM_NAMES: Record<string, string[]> = {
  gal: PLATFORMS_GAL.map((p) => p.name),
  patch: PLATFORMS_PATCH.map((p) => p.name),
};

export const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SearchGAL · Gal资源聚合搜索</title>
<meta name="description" content="聚合搜索37+ Gal资源平台，SSE流式返回">
<meta name="theme-color" content="#0a0614">
<meta property="og:title" content="SearchGAL">
<meta property="og:description" content="聚合搜索37+ Gal资源平台，一键发现资源">

<!-- Resource Hints -->
<link rel="dns-prefetch" href="//www.kungal.com">
<link rel="dns-prefetch" href="//gal.saop.cc">
<link rel="preconnect" href="https://www.kungal.com" crossorigin>
<link rel="preconnect" href="https://gal.saop.cc" crossorigin>

<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%238b5cf6'/><stop offset='100%25' stop-color='%236366f1'/></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23g)' opacity='.1'/><text y='.7em' font-size='48' text-anchor='middle' fill='url(%23g)'>🔍</text></svg>">
<style>
:root{
  --bg0:#090915;--bg1:#151124;--bgc:rgba(19,20,36,0.58);--bgi:rgba(255,255,255,0.075);
  --bd:rgba(255,255,255,0.11);--bdh:rgba(255,210,232,0.34);
  --t:#f7eef7;--t2:#c9bfd2;--t3:#81798f;
  --a:#ff86b7;--a2:#8bd7ff;--a3:#ffd28f;--ag:rgba(255,134,183,0.18);
  --l:#9fddff;--e:#ff6f91;--s:#53e0a8;--w:#ffd166;
  --tag-g:rgba(52,211,153,0.13);--tag-gt:#6ee7b7;
  --tag-a:rgba(251,191,36,0.13);--tag-at:#fcd34d;
  --tag-x:rgba(255,255,255,0.06);--tag-xt:#9d95b5;
  --tag-r:rgba(248,113,113,0.1);
  --skb:rgba(255,255,255,0.045);--sks:rgba(255,255,255,0.11);
  --sh:0 18px 46px rgba(0,0,0,0.42);--sg:0 14px 36px rgba(255,134,183,0.16);
  --rs:8px;--r:8px;--rl:8px;--rf:999px;
}
@media(prefers-color-scheme:light){
  :root{
    --bg0:#fff7fb;--bg1:#f4f8ff;--bgc:rgba(255,255,255,0.64);--bgi:rgba(255,255,255,0.9);
    --bd:rgba(77,62,82,0.1);--bdh:rgba(226,92,146,0.24);
    --t:#211927;--t2:#66576f;--t3:#a692ad;--ag:rgba(255,134,183,0.11);
    --l:#2563eb;--e:#dc2626;
    --tag-g:rgba(16,185,129,0.1);--tag-gt:#059669;
    --tag-a:rgba(245,158,11,0.1);--tag-at:#d97706;
    --tag-x:rgba(0,0,0,0.05);--tag-xt:#6b7280;
    --skb:rgba(0,0,0,0.04);--sks:rgba(0,0,0,0.08);
    --sh:0 8px 30px rgba(0,0,0,0.06);--sg:0 8px 40px rgba(99,102,241,0.04);
  }
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
body{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  background:linear-gradient(180deg,var(--bg0),var(--bg1));color:var(--t);min-height:100vh;overflow-x:hidden;
  transition:background .5s,color .5s;-webkit-tap-highlight-color:transparent;
}

/* === 动态背景层（保留） === */
.bg-aurora{position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(120deg,rgba(255,134,183,.18),transparent 34%),linear-gradient(250deg,rgba(139,215,255,.13),transparent 42%),linear-gradient(180deg,rgba(9,9,21,.1),rgba(9,9,21,.9));mix-blend-mode:screen}
.bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.07;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(135deg,rgba(255,134,183,.08) 1px,transparent 1px);background-size:56px 56px,56px 56px,140px 140px}
.bg-acg{position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;opacity:.5;z-index:-1;pointer-events:none;transition:opacity .5s;filter:saturate(1.22) contrast(1.05) brightness(.98)}

.app{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:clamp(1rem,3vw,2.25rem) clamp(.8rem,2.5vw,2rem) 4rem}

/* 顶部 —— 克制 */
.header{text-align:center;margin-bottom:2.5rem}
.logo{display:inline-flex;align-items:center;gap:.4rem;font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;letter-spacing:-.02em;color:var(--t);cursor:pointer;text-decoration:none}
.logo .ic{font-size:.8em;opacity:.8}
.tagline{color:var(--t3);font-size:clamp(.78rem,1.6vw,.88rem);margin-top:.3rem;letter-spacing:.04em}

/* 搜索区 —— 无容器，扁平 */
.launcher{max-width:760px;margin:0 auto 3rem;padding:0}

.tabs{display:inline-flex;gap:0;margin-bottom:1.5rem;border-bottom:1px solid var(--bd);width:100%}
.tab{padding:.5rem 1.1rem;border:none;background:transparent;color:var(--t3);cursor:pointer;font-size:.82rem;font-weight:500;font-family:inherit;transition:color .2s;white-space:nowrap;position:relative;margin-bottom:-1px;border-bottom:2px solid transparent}
.tab.on{color:var(--t);border-bottom-color:var(--a)}
.tab:hover:not(.on){color:var(--t2)}
.tab .badge{font-size:.66rem;margin-left:.25rem;opacity:.5;font-weight:400}

.swrap{position:relative;margin:0 0 .5rem}
.sform{display:flex;gap:.75rem;align-items:stretch}
.iwrap{flex:1;position:relative;display:flex;align-items:center;background:transparent;border:none;border-bottom:1.5px solid var(--bd);transition:border-color .3s;overflow:visible}
.iwrap:focus-within{border-bottom-color:var(--a)}
.iwrap .sicon{position:absolute;left:0;font-size:1rem;color:var(--t3);pointer-events:none;transition:color .3s}
.iwrap:focus-within .sicon{color:var(--a)}
#q{width:100%;padding:.7rem 2.5rem .7rem 1.8rem;border:none;border-radius:0;background:transparent;color:var(--t);font-size:clamp(.95rem,2vw,1.05rem);outline:none;font-family:inherit}
#q::placeholder{color:var(--t3)}
#q[readonly]{opacity:.5;cursor:not-allowed}
.iclear{position:absolute;right:0;width:28px;height:28px;border-radius:4px;border:none;background:transparent;color:var(--t3);cursor:pointer;font-size:1.1rem;display:none;align-items:center;justify-content:center;transition:color .2s;line-height:1;padding:0}
.iclear:hover{color:var(--t)}
.iclear.on{display:flex}

.hdrop{display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:80;max-height:min(280px,45vh);background:var(--bg0);border:1px solid var(--bd);border-radius:0;overflow-x:hidden;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.hdrop.show{display:block;animation:fs .2s ease-out}
.hitem{padding:.55rem 1rem;cursor:pointer;font-size:.88rem;color:var(--t);border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;transition:background .15s}
.hitem:hover{background:rgba(255,255,255,.04)}
.hitem span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hitem .del{background:none;border:none;color:var(--t3);cursor:pointer;font-size:1rem;padding:.1rem .3rem;border-radius:3px;line-height:1;transition:color .15s}
.hitem .del:hover{color:var(--e)}
.hclear{padding:.45rem;text-align:center;font-size:.75rem;color:var(--t3);cursor:pointer;border-top:1px solid var(--bd)}
.hclear:hover{color:var(--e)}
.pcount{text-align:center;font-size:.72rem;color:var(--t3);margin-bottom:0;letter-spacing:.02em}
.pcount b{color:var(--a2);font-weight:600}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:.3rem;border:none;font-weight:500;cursor:pointer;font-family:inherit;transition:all .2s;white-space:nowrap}
.btn1{padding:.7rem 1.8rem;border-radius:0;background:var(--t);color:var(--bg0);font-size:clamp(.85rem,1.8vw,.92rem);letter-spacing:.02em}
.btn1:hover{background:var(--a);color:#fff}
.btn1:active{transform:scale(.97)}
.btn1:disabled{opacity:.35;cursor:not-allowed}
.btn2{background:transparent;border:none;color:var(--t3);padding:.2rem .6rem;font-size:.78rem;border-radius:0}
.btn2:hover{color:var(--a)}

/* 状态栏 + 进度 —— 扁平 */
.sbar{display:none;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin:0 0 .6rem;font-size:.78rem;color:var(--t3);animation:fs .3s ease-out}
@keyframes fs{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.sdot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:.2rem;vertical-align:middle}
.sdot.ok{background:var(--s)}
.sdot.err{background:var(--e)}
.pwrap{display:flex;align-items:center;gap:.75rem;margin:0 0 .8rem}
.ptrack{flex:1;height:1px;background:var(--bd);overflow:visible;position:relative}
.pfill{height:100%;background:var(--a);transition:width .35s ease;position:absolute;left:0;top:0}
.pfill.done{background:var(--s)}
#ptext{min-width:60px;font-size:.72rem;color:var(--t3);text-align:right;font-variant-numeric:tabular-nums}

/* === 主从布局（扁平无容器） === */
.master-detail{display:grid;grid-template-columns:280px 1fr;gap:2.5rem;max-width:1280px;margin:0 auto;align-items:start}

/* 左侧平台列表 —— 无容器，靠右分隔线 */
.plist{position:sticky;top:1.5rem;max-height:calc(100vh - 3rem);display:flex;flex-direction:column;border-right:1px solid var(--bd);padding-right:1.5rem}
.plist-hd{padding:0 0 .8rem;display:flex;justify-content:space-between;align-items:flex-end;gap:.5rem}
.ph-title{font-size:.7rem;color:var(--t3);font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.ph-count{font-size:.7rem;color:var(--t3);margin-top:.2rem}
.ph-sort{background:transparent;border:none;color:var(--t3);font-size:.7rem;padding:.15rem .35rem;border-radius:4px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .2s}
.ph-sort:hover{color:var(--t);background:rgba(255,255,255,.04)}

.plist-body{overflow-y:auto;flex:1;min-height:200px;margin:0 -.5rem}
.plist-body::-webkit-scrollbar{width:4px}
.plist-body::-webkit-scrollbar-thumb{background:var(--sks);border-radius:2px}
.plist-body::-webkit-scrollbar-track{background:transparent}

.pitem{display:flex;align-items:center;gap:.6rem;padding:.5rem .6rem;cursor:pointer;border-radius:6px;transition:background .15s;position:relative}
.pitem:hover{background:rgba(255,255,255,.035)}
.pitem.active{background:rgba(255,255,255,.06)}
.pitem.active .pname{color:var(--a)}
.pitem.active::before{content:'';position:absolute;left:-1.5rem;top:50%;transform:translateY(-50%);width:2px;height:60%;background:var(--a);border-radius:1px}
.pdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:var(--t3);transition:all .2s}
.pdot.ok{background:var(--s)}
.pdot.err{background:var(--e)}
.pdot.empty{background:var(--t3);opacity:.3}
.pdot.pending{background:var(--a3);animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.pinfo{flex:1;min-width:0}
.pname{font-size:.88rem;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:400;transition:color .15s}
.pitem.active .pname,.pitem:hover .pname{color:var(--t)}
.pmeta{font-size:.66rem;color:var(--t3);margin-top:.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pmeta .pm-ok{color:var(--tag-gt);opacity:.7}
.pmeta .pm-err{color:var(--e);opacity:.8}
.pcount-num{font-size:.78rem;color:var(--t3);font-weight:500;font-variant-numeric:tabular-nums;flex-shrink:0;min-width:20px;text-align:right}
.pcount-num.ok{color:var(--tag-gt)}
.pcount-num.err{color:var(--e)}
/* 缓存命中标记：左侧列表闪电图标 + 右侧详情胶囊 */
.pcache{font-size:.62rem;margin-left:.3rem;color:var(--a3);opacity:.9;vertical-align:middle;-webkit-user-select:none;user-select:none}
.dcache{display:inline-block;margin-top:.35rem;font-size:.66rem;color:var(--a3);border:1px solid rgba(255,210,143,.28);background:rgba(255,210,143,.08);padding:.08rem .35rem;border-radius:3px;letter-spacing:.02em}

.plist-empty{padding:2rem .6rem;color:var(--t3);font-size:.82rem}
.plist-empty .pe-icon{font-size:1.5rem;display:block;margin-bottom:.5rem;opacity:.4}

/* 右侧详情 —— 无容器，纯排版 */
.detail{min-height:400px;transition:opacity .25s}
.detail.flash{animation:flash .4s ease-out}
@keyframes flash{0%{opacity:.4}100%{opacity:1}}
.detail-empty{padding:5rem 1rem;color:var(--t3)}
.detail-empty .de-icon{font-size:2rem;display:block;margin-bottom:.8rem;opacity:.4}
.detail-empty h3{font-size:.95rem;color:var(--t2);margin-bottom:.3rem;font-weight:500}
.detail-empty p{font-size:.82rem}

.detail-hd{padding:0 0 1.2rem;display:flex;align-items:flex-start;gap:.8rem;position:relative;flex-wrap:wrap;border-bottom:1px solid var(--bd);margin-bottom:.4rem}
.dcdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:.5rem;position:relative}
.dcdot::after{content:'';position:absolute;inset:-2px;border-radius:50%;background:inherit;opacity:.2;filter:blur(4px)}
.dinfo{flex:1;min-width:0}
.dname{font-size:1.4rem;font-weight:600;color:var(--t);letter-spacing:-.01em;line-height:1.2}
.dsub{font-size:.75rem;color:var(--t3);margin-top:.25rem}
.dtags{display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.5rem}
.tag{font-size:.66rem;padding:.1rem .4rem;border-radius:3px;font-weight:500;white-space:nowrap;border:1px solid var(--bd);background:transparent;color:var(--t3)}
.tag.g{color:var(--tag-gt);border-color:rgba(52,211,153,.2)}.tag.a{color:var(--tag-at);border-color:rgba(251,191,36,.2)}.tag.x{color:var(--tag-xt)}.tag.r{color:var(--e);border-color:rgba(248,113,113,.2)}
.dcount{font-size:.8rem;color:var(--t2);font-weight:500;font-variant-numeric:tabular-nums;flex-shrink:0;margin-top:.3rem}
.dcount.err{color:var(--e)}
.dcount.zero{color:var(--t3)}

.detail-body{padding:0}
.detail-err{padding:2rem 0;color:var(--e);font-size:.88rem}
.detail-err .de-ico{font-size:1.5rem;display:block;margin-bottom:.5rem}
.detail-empty-msg{color:var(--t3);padding:2rem 0;text-align:center;font-size:.85rem}

.rlist{list-style:none}
.rlist li{display:flex;align-items:center;gap:.75rem;padding:.7rem 0;border-bottom:1px solid var(--bd);transition:padding .2s;position:relative}
.rlist li:hover{padding-left:.4rem}
.rlist li:last-child{border-bottom:none}
.rlist a{color:var(--t);text-decoration:none;font-size:.92rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s}
.rlist a:hover{color:var(--a)}
.rurl{font-size:.7rem;color:var(--t3);flex-shrink:0;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.cpbtn{background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:.8rem;padding:.2rem .35rem;border-radius:4px;transition:all .2s;flex-shrink:0;line-height:1;opacity:0}
.rlist li:hover .cpbtn,.cpbtn.mv{opacity:.6}
.cpbtn:hover{color:var(--a);opacity:1}
.cpbtn.ok{color:var(--s);opacity:1}
.more{display:inline-block;margin-top:.8rem;padding:.3rem .8rem;border:none;background:transparent;color:var(--t3);cursor:pointer;font-size:.78rem;font-family:inherit;transition:color .2s;border-bottom:1px solid transparent}
.more:hover{color:var(--a);border-bottom-color:var(--a)}

/* skeleton */
.skel{padding:.6rem;border-bottom:1px solid var(--bd);animation:fs .35s ease-out both}
.skel-h{display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem}
.skel-d{width:6px;height:6px;border-radius:50%;background:var(--sks);flex-shrink:0;animation:pulse 1.5s infinite}
.skel-l{height:9px;border-radius:4px;background:linear-gradient(90deg,var(--skb) 25%,var(--sks) 50%,var(--skb) 75%);background-size:200% 100%;animation:sh 1.5s infinite}
@keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skel-l.w30{width:30%}.skel-l.w50{width:50%}.skel-l.w70{width:70%}

/* toast */
.toast{position:fixed;bottom:clamp(1.5rem,4vw,2.5rem);left:50%;transform:translateX(-50%) translateY(120px);background:var(--bgc);backdrop-filter:blur(24px);border:1px solid var(--bd);border-radius:var(--rf);padding:.6rem 1.4rem;color:var(--t);font-size:.85rem;box-shadow:var(--sh);z-index:100;transition:transform .4s cubic-bezier(.16,1,.3,1);pointer-events:none;display:flex;align-items:center;gap:.45rem;white-space:nowrap}
.toast.show{transform:translateX(-50%) translateY(0)}

/* back2top */
.b2t{position:fixed;bottom:clamp(1rem,3vw,1.5rem);right:clamp(.8rem,2.5vw,1.5rem);width:42px;height:42px;border-radius:50%;z-index:50;background:var(--bgc);backdrop-filter:blur(16px);border:1px solid var(--bd);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;transition:all .3s;opacity:0;visibility:hidden;transform:translateY(10px);box-shadow:0 2px 8px rgba(0,0,0,.25)}
.b2t.on{opacity:1;visibility:visible;transform:translateY(0)}
.b2t:hover{background:rgba(129,140,248,.1);color:var(--a);border-color:var(--a)}

.kbd{text-align:center;font-size:.73rem;color:var(--t3);margin-top:2.5rem;opacity:.7}
.kbd kbd{display:inline-block;padding:.12rem .45rem;border-radius:4px;background:var(--bgc);border:1px solid var(--bd);font-family:inherit;font-size:inherit;margin:0 .12rem;font-weight:500}
.ft{text-align:center;margin-top:.6rem;font-size:.7rem;color:var(--t3);opacity:.5}

/* 移动端：堆叠布局 */
@media(max-width:860px){
  .master-detail{grid-template-columns:1fr;gap:1.5rem}
  .plist{position:relative;max-height:none;top:0;border-right:none;border-bottom:1px solid var(--bd);padding-right:0;padding-bottom:1.5rem}
  .plist-body{max-height:340px}
  .detail{min-height:300px}
}
@media(max-width:640px){
  .app{padding:.8rem .7rem 4rem}.header{margin-bottom:1.5rem}
  .launcher{margin-bottom:2rem}
  .sform{flex-direction:column;gap:.6rem}.btn1{width:100%;padding:.8rem}
  .rlist a{white-space:normal;overflow:visible;text-overflow:unset;font-size:.88rem;line-height:1.4}
  .rurl{display:none}
  .cpbtn{opacity:.7;min-width:44px;min-height:44px}
  .b2t{width:38px;height:38px;bottom:1rem;right:.8rem}.kbd{display:none}
  .detail-hd{padding:0 0 1rem}
  .detail-body{padding:0}
}
@media(hover:none){.cpbtn{opacity:.7}.btn1:hover{transform:none}}
@media(prefers-reduced-motion:reduce){
  *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
  .pfill{transition:width .35s ease}
  .detail.flash{animation:none}
}
</style>
</head>
<body>
<div class="bg-aurora"></div><div class="bg-grid"></div>
<img id="bg-acg" class="bg-acg" alt="">
<div class="app">
<header class="header">
  <a class="logo" onclick="clr();document.getElementById('q').focus()"><span class="ic">🌸</span>SearchGAL</a>
  <p class="tagline">Gal检索台</p>
</header>
<section class="launcher">
  <div class="tabs" id="tabs">
    <button class="tab on" data-m="gal">资源<span class="badge">37</span></button>
    <button class="tab" data-m="patch">补丁<span class="badge">2</span></button>
  </div>
<div class="swrap" id="swrap">
  <form class="sform" id="sf" autocomplete="off">
    <div class="iwrap">
      <span class="sicon">🔎</span>
      <input type="text" name="game" id="q" placeholder="输入 Galgame 名称，如：千恋万花" required autofocus maxlength="100" autocomplete="off">
      <button type="button" class="iclear" id="icl" aria-label="清空">&times;</button>
    </div>
    <button type="submit" class="btn btn1" id="sb">搜索</button>
  </form>
  <div class="hdrop" id="hd"></div>
</div>
<p class="pcount">已接入 <b>37</b> 个资源站 + <b>2</b> 个补丁站 · 实时聚合</p>
<div class="sbar" id="sbar"><span id="st"></span><button class="btn btn2" onclick="clr()">清空</button></div>
<div class="pwrap"><div class="ptrack"><div class="pfill" id="pf" style="width:0%"></div></div><span id="ptext">就绪</span></div>
</section>
<div class="master-detail">
  <aside class="plist" id="plist">
    <div class="plist-hd">
      <div>
        <div class="ph-title">平台列表</div>
        <div class="ph-count" id="ph-count">等待搜索</div>
      </div>
      <button class="ph-sort" id="ph-sort" title="切换排序" aria-label="切换排序方式，当前按结果数降序">结果数↓</button>
    </div>
    <div class="plist-body" id="plist-body">
      <div class="plist-empty"><span class="pe-icon">🔍</span>输入关键词开始搜索</div>
    </div>
  </aside>
  <main class="detail" id="detail">
    <div class="detail-empty">
      <span class="de-icon">📚</span>
      <h3>选择左侧平台查看详情</h3>
      <p>搜索结果会实时填充到平台列表</p>
    </div>
  </main>
</div>
<p class="kbd">↑↓ 切换平台 · <kbd>/</kbd> 聚焦搜索框 · <kbd>esc</kbd> 清空</p>
<p class="ft">SearchGAL · 请支持正版</p>
</div>
<button class="b2t" id="b2t" aria-label="回到顶部">↑</button>
<div class="toast" id="toast"><span id="ticon"></span><span id="tmsg"></span></div>
<script>
var $=function(id){return document.getElementById(id)};
var sf=$('sf'),q=$('q'),sb=$('sb'),icl=$('icl'),hd=$('hd'),pf=$('pf'),pt=$('ptext'),
    detailEl=$('detail'),plistBody=$('plist-body'),phCount=$('ph-count'),phSort=$('ph-sort'),
    sBar=$('sbar'),st=$('st'),toast=$('toast'),tmsg=$('tmsg'),ticon=$('ticon'),b2t=$('b2t');
var m='gal',buf='',busy=false,t0=0,rc=0,ec=0,lt=0,tp=0,CD=2000,LM=8,HK='sgh',MH=5,tt=null;
var platforms=new Map(),selName=null,sortBy='count',total=0,done=0,noResult=false;

// 平台清单（服务端注入）：客户端 fan-out 分批的权威来源
var SG_PLATFORMS=${JSON.stringify(SG_PLATFORM_NAMES)};
// 用真实平台数刷新 tab 角标
document.querySelectorAll('.tab').forEach(function(t){var mm=t.dataset.m;var b=t.querySelector('.badge');if(b&&SG_PLATFORMS[mm])b.textContent=SG_PLATFORMS[mm].length});

// HTML 转义，防 XSS（item name/url 来自外部爬虫数据）
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

// URL 协议白名单，防 javascript:/data:/vbscript: 等危险协议 XSS（Gal 下载常用 http/https/magnet/ed2k）
function safeUrl(u){
  try{var a=document.createElement('a');a.href=u;var p=(a.protocol||'').toLowerCase();
    if(p==='http:'||p==='https:'||p==='magnet:'||p==='ed2k:')return u}catch(e){}
  return '#';
}

// tabs
$('tabs').addEventListener('click',function(e){var t=e.target.closest('.tab');if(!t||busy)return;m=t.dataset.m;
  this.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on')});t.classList.add('on');clr();q.focus()});

// sort toggle
phSort.addEventListener('click',function(){
  sortBy=sortBy==='count'?'name':'count';
  phSort.textContent=sortBy==='count'?'结果数↓':'名称A-Z';
  renderPlist();
});

// clear btn
function ucl(){icl.classList.toggle('on',q.value.length>0)}
q.addEventListener('input',ucl);
icl.addEventListener('click',function(){q.value='';ucl();q.focus();clr()});

// 背景图片加载（保留动态二次元背景）
function lb(){var img=$('bg-acg');if(img){img.onerror=function(){img.style.display='none'};img.src='/api/bg?t='+Date.now()}}
lb();

// toast
function toast(msg,icon){icon=icon||'✅';ticon.textContent=icon;tmsg.textContent=msg;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('show')},2000)}

// back2top
function ub2t(){b2t.classList.toggle('on',window.scrollY>500)}
window.addEventListener('scroll',ub2t,{passive:true});
b2t.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});

// history
function gh(){try{return JSON.parse(localStorage.getItem(HK)||'[]')}catch(e){return[]}}
function sh(kw){var h=gh();h=[kw].concat(h.filter(function(k){return k!==kw})).slice(0,MH);try{localStorage.setItem(HK,JSON.stringify(h))}catch(e){}}
function rh(kw,e){e.stopPropagation();var h=gh().filter(function(k){return k!==kw});try{localStorage.setItem(HK,JSON.stringify(h))}catch(e){};rdd()}
function cah(){try{localStorage.removeItem(HK)}catch(e){};rdd()}
function rdd(){var h=gh();if(!h.length){hd.classList.remove('show');return}
  var html='';h.forEach(function(kw){var safeKw=esc(kw);html+='<div class="hitem" data-k="'+safeKw+'"><span>'+safeKw+'</span><button class="del" data-d="'+safeKw+'" aria-label="删除">&times;</button></div>'});
  html+='<div class="hclear">清除全部历史</div>';hd.innerHTML=html;hd.classList.add('show');
  hd.querySelectorAll('.hitem').forEach(function(el){el.addEventListener('click',function(){q.value=el.getAttribute('data-k');ucl();hd.classList.remove('show');sf.dispatchEvent(new Event('submit'))})});
  hd.querySelectorAll('.del').forEach(function(b){b.addEventListener('click',function(e){rh(b.getAttribute('data-d'),e)})});
  var ca=hd.querySelector('.hclear');if(ca)ca.addEventListener('click',cah)}

// clipboard
function cp(url,btn){
  function d(){if(btn){btn.textContent='✓';btn.classList.add('ok');setTimeout(function(){btn.textContent='📋';btn.classList.remove('ok')},1500)}toast('链接已复制')}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(url).then(d).catch(function(){toast('复制失败','⚠️')})}
  else{var ta=document.createElement('textarea');ta.value=url;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');d()}catch(e){toast('复制失败','⚠️')};document.body.removeChild(ta)}
}

// tags
function tc(t){if(t==='breaker')return'tag r';if(t==='NoReq'||t==='SuDrive'||t==='NoSplDrive')return'tag g';if(t==='magic'||t==='SplDrive'||t==='BTmag'||t==='MixDrive')return'tag a';return'tag x'}

// 相关性评分
function scoreItem(name,query){
  var n=name.toLowerCase(),qq=query.toLowerCase();
  if(n===qq)return 3;
  if(n.indexOf(qq)===0)return 2;
  if(n.indexOf(qq)>-1)return 1;
  return 0;
}

// state
function sbz(a){busy=a;sb.disabled=a;q.readOnly=a;
  if(a){platforms.clear();selName=null;noResult=false;done=0;rc=0;ec=0;tp=0;total=0;renderPlist();renderDetail();pf.style.width='0%';pf.classList.remove('done');pt.textContent='搜索中...';sBar.style.display='none';t0=Date.now();hd.classList.remove('show');
    var skHtml='';for(var i=0;i<5;i++){skHtml+='<div class="skel"><div class="skel-h"><div class="skel-d"></div><div class="skel-l w30"></div></div><div class="skel-l w70"></div><div class="skel-l w50"></div></div>'}
    plistBody.innerHTML=skHtml;
  }
  else{pf.classList.add('done');sBar.style.display='flex';ust()}}
function ust(){var el=((Date.now()-t0)/1000).toFixed(1);st.innerHTML='<span class="sdot ok"></span>已搜 <b>'+rc+'</b> 平台'+(ec>0?' · <span class="sdot err"></span><b>'+ec+'</b> 错误':'')+' · '+el+'s'}
window.clr=function(){platforms.clear();selName=null;noResult=false;renderPlist();renderDetail();sBar.style.display='none';pt.textContent='就绪';pf.style.width='0%';pf.classList.remove('done');tp=0;total=0;done=0;phCount.textContent='等待搜索'}

// 渲染左侧平台列表
function renderPlist(){
  var arr=Array.from(platforms.values());
  if(arr.length===0){
    if(!busy)plistBody.innerHTML='<div class="plist-empty"><span class="pe-icon">🔍</span>输入关键词开始搜索</div>';
    phCount.textContent=done+'/'+total+(total?' · 等待中':'');
    return;
  }
  // 排序
  arr.sort(function(a,b){
    if(sortBy==='count'){
      var ca=a.error?-1:(a.items?a.items.length:0);
      var cb=b.error?-1:(b.items?b.items.length:0);
      return cb-ca;
    }
    return a.name.localeCompare(b.name,'zh');
  });
  var html='';
  arr.forEach(function(p){
    var cnt=p.items?p.items.length:0;
    var dotCls=p.error?'err':(cnt>0?'ok':'empty');
    var numCls=cnt>0?'ok':(p.error?'err':'');
    var numTxt=p.error?'×':cnt;
    var meta='';
    if(p.error)meta='<span class="pm-err">'+esc(p.error.slice(0,24))+'</span>';
    else if(cnt>0)meta='<span class="pm-ok">'+(p.tags?p.tags.slice(0,3).map(esc).join(' · '):'')+'</span>';
    else meta='空结果';
    var safeName=esc(p.name);
    var cacheBadge=(p.cached&&!p.error)?'<span class="pcache" title="结果来自 KV 缓存，秒回">⚡</span>':'';
    var active=p.name===selName?' active':'';
    html+='<div class="pitem'+active+'" data-name="'+safeName+'" tabindex="0" role="button" aria-label="'+safeName+(cnt>0?'，'+cnt+' 条结果':'')+(p.cached?'，缓存命中':'')+'">'+
      '<span class="pdot '+dotCls+'"></span>'+
      '<div class="pinfo"><div class="pname">'+safeName+cacheBadge+'</div><div class="pmeta">'+meta+'</div></div>'+
      '<span class="pcount-num '+numCls+'">'+numTxt+'</span></div>';
  });
  plistBody.innerHTML=html;
  phCount.textContent=done+'/'+total+' · '+rc+' 命中';
}

// 事件委托：点击/键盘激活平台项
plistBody.addEventListener('click',function(e){
  var el=e.target.closest('.pitem');if(!el)return;
  selectPlatform(el.getAttribute('data-name'));
});
plistBody.addEventListener('keydown',function(e){
  if(e.key!=='Enter'&&e.key!==' ')return;
  var el=e.target.closest('.pitem');if(!el)return;
  e.preventDefault();selectPlatform(el.getAttribute('data-name'));
});

function selectPlatform(name){
  selName=name;renderPlist();renderDetail();
  detailEl.classList.add('flash');setTimeout(function(){detailEl.classList.remove('flash')},350);
  if(window.innerWidth<860){detailEl.scrollIntoView({behavior:'smooth',block:'start'})}
}

// 渲染右侧详情
function renderDetail(){
  if(noResult&&!selName){
    detailEl.innerHTML='<div class="detail-empty"><span class="de-icon">📭</span><h3>没有找到相关资源</h3><p>试试缩短关键词，或使用中文名称</p></div>';
    return;
  }
  if(!selName){
    detailEl.innerHTML='<div class="detail-empty"><span class="de-icon">📚</span><h3>选择左侧平台查看详情</h3><p>搜索结果会实时填充到平台列表</p></div>';
    return;
  }
  var p=platforms.get(selName);
  if(!p){
    detailEl.innerHTML='<div class="detail-empty"><span class="de-icon">⏳</span><h3>'+esc(selName)+'</h3><p>正在搜索…</p></div>';
    return;
  }
  if(p.error){
    var cBadge=(p.cached&&!p.error?'<div class="dcache">⚡ 缓存命中</div>':'');
    detailEl.innerHTML='<div class="detail-hd" style="--ca:var(--e)"><span class="dcdot" style="background:var(--e)"></span><div class="dinfo"><div class="dname">'+esc(p.name)+'</div><div class="dsub">搜索失败</div>'+cBadge+'</div><span class="dcount err">错误</span></div><div class="detail-body"><div class="detail-err"><span class="de-ico">⚠️</span>'+esc(p.error)+'</div></div>';
    return;
  }
  if(!p.items||p.items.length===0){
    var cBadge2=(p.cached&&!p.error?'<div class="dcache">⚡ 缓存命中</div>':'');
    var etags=p.tags?p.tags.map(function(t){return '<span class="tag '+tc(t)+'">'+esc(t)+'</span>'}).join(''):'';
    detailEl.innerHTML='<div class="detail-hd" style="--ca:var(--t3)"><span class="dcdot" style="background:var(--t3)"></span><div class="dinfo"><div class="dname">'+esc(p.name)+'</div><div class="dsub">'+(p.tags?p.tags.map(esc).join(' · '):'')+'</div>'+cBadge2+'</div><div class="dtags">'+etags+'</div><span class="dcount zero">0</span></div><div class="detail-body"><div class="detail-empty-msg">该平台无匹配结果</div></div>';
    return;
  }
  // 按相关性排序
  if(p.items.length>1){
    var query=q.value.trim();
    p.items.sort(function(a,b){return scoreItem(b.name,query)-scoreItem(a.name,query)});
  }
  var ca=p.color||'#888';
  // 校验 color 格式，防 CSS 注入（只允许 #hex / 命名色 / var()）
  if(!/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+|var\\(--[a-z0-9-]+\\)$)$/.test(ca))ca='#888';
  var tagsHtml=p.tags?p.tags.map(function(t){return '<span class="tag '+tc(t)+'">'+esc(t)+'</span>'}).join(''):'';
  var all=p.items;
  var expanded=p.expanded||all.length<=LM;
  var shown=expanded?all:all.slice(0,LM);
  var itemsHtml='';
  shown.forEach(function(it){
    var raw=it.url||'';
    var href=safeUrl(raw);
    var tmp=document.createElement('a');tmp.href=raw;var host=tmp.hostname||'';
    var uHtml=esc(href),nHtml=esc(it.name),hHtml=esc(host);
    itemsHtml+='<li><a href="'+uHtml+'" target="_blank" rel="noopener noreferrer">'+nHtml+'</a><span class="rurl">'+hHtml+'</span><button class="cpbtn" data-url="'+uHtml+'" aria-label="复制链接">📋</button></li>';
  });
  var moreBtn='';
  if(all.length>LM){
    moreBtn=expanded?'<button class="more" id="dmore">收起 ▴</button>':'<button class="more" id="dmore">展开全部 '+all.length+' 条 ▾</button>';
  }
  var cBadge3=(p.cached&&!p.error?'<div class="dcache">⚡ 缓存命中</div>':'');
  detailEl.innerHTML='<div class="detail-hd" style="--ca:'+esc(ca)+'"><span class="dcdot" style="background:'+esc(ca)+'"></span><div class="dinfo"><div class="dname">'+esc(p.name)+'</div><div class="dsub">'+all.length+' 条结果</div>'+cBadge3+'</div><div class="dtags">'+tagsHtml+'</div><span class="dcount">'+all.length+'</span></div><div class="detail-body"><ul class="rlist">'+itemsHtml+'</ul>'+moreBtn+'</div>';
  // 绑定复制按钮
  detailEl.querySelectorAll('.cpbtn').forEach(function(b){
    b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();cp(b.getAttribute('data-url'),b)});
  });
  // 绑定 more
  var dm=$('dmore');
  if(dm){
    dm.addEventListener('click',function(){
      var pp=platforms.get(selName);
      if(pp){pp.expanded=!pp.expanded;renderDetail()}
    });
  }
}

// submit —— 客户端 fan-out：浏览器把平台拆成多批，每批对 /__batch 发起一次
// 【独立】Worker 调用（每次调用各有专属的 50 子请求预算），并行执行后合并结果。
// 这绕开了 Cloudflare 免费计划「单次调用 50 子请求」硬上限，且无需服务端同区自调用。
var abortCtrl=null;
var BATCH_SIZE=8; // 单批平台数（与 resolveBatchSize 默认一致）
function chunkArr(a,n){var o=[];for(var i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o}
function emitResult(res,signal,doneRef,tot){
  if(signal.aborted)return;
  doneRef.v++;
  pm({progress:{completed:doneRef.v,total:tot},result:res});
}
sf.addEventListener('submit',function(e){
  e.preventDefault();var kw=q.value.trim();if(!kw||busy)return;var n=Date.now();if(n-lt<CD)return;lt=n;sbz(true);sh(kw);
  if(abortCtrl)abortCtrl.abort();
  abortCtrl=new AbortController();
  var signal=abortCtrl.signal;
  var names=SG_PLATFORMS[m]||[];
  total=names.length;tp=total;
  pm({total:total});
  var batches=chunkArr(names,BATCH_SIZE);
  var doneRef={v:0};
  var promises=batches.map(function(batch){
    if(signal.aborted)return Promise.resolve();
    return fetch('/__batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game:kw,type:m,platforms:batch}),signal:signal})
      .then(function(r){if(!r.ok)throw new Error('批处理失败('+r.status+')');return r.json()})
      .then(function(data){
        // 本批命中 KV 缓存时，给每条结果打 cached 标记（前端据此显示「⚡ 缓存命中」）
        var hit=!!data.cached;
        (data.results||[]).forEach(function(res){if(hit)res.cached=true;emitResult(res,signal,doneRef,total)})
      })
      .catch(function(err){
        if(signal.aborted)return;
        // 整批请求失败：把该批每个平台标记为错误，保证进度条能走完
        batch.forEach(function(name){emitResult({name:name,color:'#555',tags:[],items:[],error:'请求失败：'+(err.message||err)},signal,doneRef,total)})
      })
  });
  Promise.allSettled(promises).then(function(){
    if(signal.aborted)return;
    pm({done:true});
    finish();
  })
});

function pm(d){
  if(d.done){pf.style.width='100%';pt.textContent=total+'/'+total;return}
  if(typeof d.total==='number'&&!d.progress){tp=d.total;total=tp;pt.textContent='0/'+tp;phCount.textContent='0/'+tp+' · 等待中';return}
  if(d.progress){
    var c=d.progress.completed,t=d.progress.total;if(!tp)tp=t;pf.style.width=(c/t*100)+'%';pt.textContent=c+'/'+t;done=c;
    if(d.result){
      // 清除 skeleton
      var sk=plistBody.querySelector('.skel');if(sk)plistBody.innerHTML='';
      var r=d.result;
      // 保留之前的 expanded 状态
      var prev=platforms.get(r.name);
      platforms.set(r.name,{name:r.name,color:r.color,tags:r.tags,items:r.items,error:r.error,cached:!!r.cached,expanded:prev?prev.expanded:false});
      rc++;
      if(r.error)ec++;
      renderPlist();
      // 如果当前选中的平台更新了，刷新右侧
      if(r.name===selName)renderDetail();
      // 自动选中第一个有结果的平台
      if(!selName&&r.items&&r.items.length>0){selName=r.name;renderPlist();renderDetail()}
    }
  }
}

function finish(){
  sbz(false);
  if(!selName){
    // 自动选第一个有结果的
    var first=null;
    platforms.forEach(function(p){if(!first&&p.items&&p.items.length>0)first=p.name});
    if(first){selName=first;renderPlist();renderDetail()}
    else{
      // 全部无结果：保留左侧列表（让用户看到哪些平台响应了），右侧显示无结果提示
      noResult=true;
      renderDetail();
    }
  }
}

// keyboard
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(hd.classList.contains('show'))hd.classList.remove('show');else if(!busy){sf.reset();ucl();clr()}}
  if(e.key==='/'&&document.activeElement!==q&&!busy){e.preventDefault();q.focus()}
  // ↑↓ 切换平台（仅在有结果的平台间切换）
  if((e.key==='ArrowUp'||e.key==='ArrowDown')&&document.activeElement!==q&&!busy&&platforms.size>0){
    var arr=Array.from(platforms.values()).filter(function(p){return p.items&&p.items.length>0});
    if(arr.length===0)return;
    if(sortBy==='name')arr.sort(function(a,b){return a.name.localeCompare(b.name,'zh')});
    else arr.sort(function(a,b){return b.items.length-a.items.length});
    var idx=-1;for(var i=0;i<arr.length;i++){if(arr[i].name===selName){idx=i;break}}
    if(e.key==='ArrowDown'){e.preventDefault();selName=arr[(idx+1)%arr.length].name;renderPlist();renderDetail();detailEl.classList.add('flash');setTimeout(function(){detailEl.classList.remove('flash')},350)}
    else if(e.key==='ArrowUp'){e.preventDefault();selName=arr[(idx-1+arr.length)%arr.length].name;renderPlist();renderDetail();detailEl.classList.add('flash');setTimeout(function(){detailEl.classList.remove('flash')},350)}
  }
});
q.addEventListener('focus',function(){if(!busy)rdd()});
q.addEventListener('input',function(){ucl();if(!busy&&!q.value.trim())rdd();else hd.classList.remove('show')});
document.addEventListener('click',function(e){if(!hd.contains(e.target)&&e.target!==q)hd.classList.remove('show')});
ucl();
</script>
</body>
</html>`;
