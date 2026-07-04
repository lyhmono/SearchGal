// SearchGAL 前端 HTML - 主从布局版
// 左侧平台列表 + 右侧详情面板，保留动态背景（极光/网格/二次元图片）
// 包含：Resource Hints、移动端堆叠、键盘导航、SSE 流式、结果排序

export const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>SearchGAL · Gal资源聚合搜索</title>
<meta name="description" content="聚合搜索33+ Gal资源平台，SSE流式返回">
<meta name="theme-color" content="#0a0614">
<meta property="og:title" content="SearchGAL">
<meta property="og:description" content="聚合搜索33+ Gal资源平台，一键发现资源">

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
.bg-acg{position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;opacity:.28;z-index:-1;pointer-events:none;transition:opacity .5s;filter:saturate(1.18) contrast(1.08) brightness(.72)}

.app{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:clamp(1rem,3vw,2.25rem) clamp(.8rem,2.5vw,2rem) 4rem}

/* 顶部 */
.header{text-align:center;margin-bottom:clamp(.9rem,2.4vw,1.4rem)}
.logo{display:inline-flex;align-items:center;gap:.45rem;font-size:clamp(2rem,5vw,3.25rem);font-weight:850;letter-spacing:0;background:linear-gradient(135deg,var(--a2),var(--a) 48%,var(--a3));background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:ls 5s linear infinite;cursor:pointer;text-decoration:none;text-shadow:0 0 28px rgba(255,134,183,.18)}
@keyframes ls{to{background-position:200% center}}
.logo .ic{font-size:.75em;-webkit-text-fill-color:initial}
.tagline{color:var(--t2);font-size:clamp(.82rem,1.8vw,.95rem);margin-top:.25rem}

/* 搜索区 */
.launcher{position:relative;max-width:880px;margin:0 auto 1.2rem;padding:1rem;border:1px solid var(--bd);border-radius:var(--r);background:linear-gradient(180deg,rgba(20,21,38,.58),rgba(12,13,26,.42));box-shadow:var(--sh);backdrop-filter:blur(22px);overflow:visible}
.launcher::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--a),var(--a2),var(--a3));opacity:.85}

.tabs{display:inline-flex;gap:4px;margin-bottom:.8rem;background:rgba(255,255,255,.045);border-radius:var(--rs);padding:4px;border:1px solid var(--bd)}
.tab{padding:.48rem 1.2rem;border-radius:6px;border:none;background:transparent;color:var(--t2);cursor:pointer;font-size:.85rem;font-weight:650;font-family:inherit;transition:all .25s;white-space:nowrap}
.tab.on{background:linear-gradient(135deg,rgba(255,134,183,.24),rgba(139,215,255,.18));color:var(--t);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 6px 16px rgba(0,0,0,.18)}
.tab:hover:not(.on){color:var(--t);background:rgba(255,255,255,.055)}
.tab .badge{font-size:.7rem;margin-left:.3rem;opacity:.5}

.swrap{position:relative;max-width:760px;margin:0 auto .65rem}
.sform{display:flex;gap:.5rem}
.iwrap{flex:1;position:relative;display:flex;align-items:center;background:rgba(255,255,255,.08);backdrop-filter:blur(24px);border:1.5px solid var(--bd);border-radius:var(--rs);transition:all .3s cubic-bezier(.22,1,.36,1);overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.iwrap:focus-within{border-color:var(--a);background:rgba(255,255,255,.105);box-shadow:0 0 0 4px var(--ag),inset 0 0 0 1px rgba(255,134,183,.36)}
.iwrap .sicon{position:absolute;left:1rem;font-size:1.05rem;color:var(--t3);pointer-events:none;transition:all .3s}
.iwrap:focus-within .sicon{color:var(--a);transform:scale(1.1)}
#q{width:100%;padding:.9rem 3rem .9rem 2.7rem;border:none;border-radius:inherit;background:transparent;color:var(--t);font-size:clamp(.9rem,2vw,1rem);outline:none;font-family:inherit}
#q::placeholder{color:var(--t3)}
#q[readonly]{opacity:.5;cursor:not-allowed}
.iclear{position:absolute;right:.5rem;width:30px;height:30px;border-radius:6px;border:none;background:transparent;color:var(--t3);cursor:pointer;font-size:1.2rem;display:none;align-items:center;justify-content:center;transition:all .2s;line-height:1;padding:0}
.iclear:hover{background:rgba(255,255,255,.1);color:var(--t)}
.iclear.on{display:flex}

.hdrop{display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:80;max-height:min(280px,45vh);background:rgba(14,15,29,.9);backdrop-filter:blur(28px);border:1px solid var(--bd);border-radius:var(--r);overflow-x:hidden;overflow-y:auto;box-shadow:var(--sh)}
.hdrop.show{display:block;animation:fs .2s ease-out}
.hitem{padding:.65rem 1.1rem;cursor:pointer;font-size:.9rem;color:var(--t);border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;transition:background .15s}
.hitem:hover{background:rgba(129,140,248,.06)}
.hitem span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hitem .del{background:none;border:none;color:var(--t3);cursor:pointer;font-size:1rem;padding:.15rem .4rem;border-radius:4px;line-height:1;transition:all .15s}
.hitem .del:hover{color:var(--e);background:rgba(248,113,113,.07)}
.hclear{padding:.5rem;text-align:center;font-size:.78rem;color:var(--t3);cursor:pointer;border-top:1px solid var(--bd)}
.hclear:hover{color:var(--e)}
.pcount{text-align:center;font-size:.76rem;color:var(--t3);margin-bottom:.95rem}
.pcount b{color:var(--a2);font-weight:700}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:.3rem;border:none;font-weight:600;cursor:pointer;font-family:inherit;transition:all .25s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden;white-space:nowrap}
.btn1{padding:.9rem 1.65rem;border-radius:var(--rs);background:linear-gradient(135deg,#ff7eb3,#7ed8ff 58%,#ffd28f);color:#160d1c;font-size:clamp(.85rem,1.8vw,.95rem);box-shadow:0 8px 24px rgba(255,134,183,.24);letter-spacing:0}
.btn1:hover{transform:translateY(-1.5px);box-shadow:0 10px 30px rgba(139,215,255,.28)}
.btn1:active{transform:scale(.95)}
.btn1:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.btn2{background:transparent;border:1.5px solid var(--bd);color:var(--t2);padding:.4rem 1rem;font-size:.8rem;border-radius:var(--rs)}
.btn2:hover{background:var(--bgc);border-color:var(--bdh);color:var(--t)}

/* 状态栏 + 进度 */
.sbar{display:none;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin:.2rem auto .7rem;max-width:880px;font-size:.82rem;color:var(--t2);animation:fs .3s ease-out}
@keyframes fs{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.sdot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:.25rem;vertical-align:middle}
.sdot.ok{background:var(--s);box-shadow:0 0 6px var(--s)}
.sdot.err{background:var(--e);box-shadow:0 0 6px var(--e)}
.pwrap{display:flex;align-items:center;gap:.6rem;margin:0 auto .1rem;max-width:760px}
.ptrack{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden}
.pfill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--a),var(--a2),var(--a3));background-size:200% 100%;transition:width .35s ease;animation:ps 2s linear infinite}
@keyframes ps{to{background-position:200% 0}}
.pfill.done{animation:none;background:var(--s)}
#ptext{min-width:70px;font-size:.82rem;color:var(--t2);text-align:right}

/* === 主从布局 === */
.master-detail{display:grid;grid-template-columns:300px 1fr;gap:1rem;max-width:1280px;margin:0 auto;align-items:start}

/* 左侧平台列表 */
.plist{background:linear-gradient(180deg,rgba(24,25,44,.62),rgba(12,13,26,.48));backdrop-filter:blur(18px);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden;position:sticky;top:1rem;max-height:calc(100vh - 2rem);display:flex;flex-direction:column;box-shadow:var(--sh)}
.plist-hd{padding:.9rem 1rem .6rem;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;background:linear-gradient(90deg,rgba(255,255,255,.032),rgba(255,255,255,.006));gap:.5rem}
.ph-title{font-size:.82rem;color:var(--t2);font-weight:600}
.ph-count{font-size:.7rem;color:var(--t3);margin-top:.15rem}
.ph-sort{background:transparent;border:1px solid var(--bd);color:var(--t2);font-size:.7rem;padding:.25rem .5rem;border-radius:5px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .2s}
.ph-sort:hover{border-color:var(--bdh);color:var(--t)}

.plist-body{overflow-y:auto;flex:1;min-height:200px}
.plist-body::-webkit-scrollbar{width:6px}
.plist-body::-webkit-scrollbar-thumb{background:var(--sks);border-radius:3px}
.plist-body::-webkit-scrollbar-track{background:transparent}

.pitem{display:flex;align-items:center;gap:.55rem;padding:.6rem .9rem;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s;position:relative}
.pitem:hover{background:rgba(139,215,255,.06)}
.pitem.active{background:linear-gradient(90deg,rgba(255,134,183,.14),rgba(139,215,255,.08))}
.pitem.active::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--a),var(--a2))}
.pdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--t3)}
.pdot.ok{background:var(--s);box-shadow:0 0 6px var(--s)}
.pdot.err{background:var(--e)}
.pdot.empty{background:var(--t3);opacity:.4}
.pdot.pending{background:var(--a3);animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.pinfo{flex:1;min-width:0}
.pname{font-size:.85rem;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.pmeta{font-size:.68rem;color:var(--t3);margin-top:.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pmeta .pm-ok{color:var(--tag-gt)}
.pmeta .pm-err{color:var(--e)}
.pbadge{font-size:.72rem;font-weight:700;padding:.15rem .45rem;border-radius:5px;background:var(--tag-g);color:var(--tag-gt);min-width:24px;text-align:center;flex-shrink:0}
.pbadge.zero{background:var(--tag-x);color:var(--tag-xt)}
.pbadge.err{background:var(--tag-r);color:var(--e)}

.plist-empty{padding:2rem 1rem;text-align:center;color:var(--t3);font-size:.85rem}
.plist-empty .pe-icon{font-size:2rem;display:block;margin-bottom:.5rem;opacity:.5}

/* 右侧详情 */
.detail{background:linear-gradient(180deg,rgba(24,25,44,.62),rgba(12,13,26,.48));backdrop-filter:blur(18px);border:1px solid var(--bd);border-radius:var(--rl);min-height:400px;overflow:hidden;box-shadow:var(--sh);transition:box-shadow .35s}
.detail.flash{box-shadow:var(--sg)}
.detail-empty{padding:4rem 2rem;text-align:center;color:var(--t3)}
.detail-empty .de-icon{font-size:3rem;display:block;margin-bottom:1rem;opacity:.5}
.detail-empty h3{font-size:1rem;color:var(--t2);margin-bottom:.4rem;font-weight:600}
.detail-empty p{font-size:.85rem}

.detail-hd{padding:1.1rem 1.25rem .9rem;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:.7rem;background:linear-gradient(90deg,rgba(255,255,255,.032),rgba(255,255,255,.006));position:relative;flex-wrap:wrap}
.detail-hd::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--ca,transparent)}
.dcdot{width:12px;height:12px;border-radius:50%;flex-shrink:0;position:relative}
.dcdot::after{content:'';position:absolute;inset:-3px;border-radius:50%;background:inherit;opacity:.25;filter:blur(5px)}
.dinfo{flex:1;min-width:0}
.dname{font-size:1.05rem;font-weight:700;color:var(--t)}
.dsub{font-size:.72rem;color:var(--t3);margin-top:.15rem}
.dtags{display:flex;gap:.25rem;flex-wrap:wrap}
.tag{font-size:.7rem;padding:.15rem .5rem;border-radius:6px;font-weight:650;white-space:nowrap;border:1px solid rgba(255,255,255,.06)}
.tag.g{background:var(--tag-g);color:var(--tag-gt)}.tag.a{background:var(--tag-a);color:var(--tag-at)}.tag.x{background:var(--tag-x);color:var(--tag-xt)}.tag.r{background:var(--tag-r);color:var(--e)}
.dcount{font-size:.78rem;color:var(--tag-gt);background:var(--tag-g);padding:.2rem .6rem;border-radius:6px;font-weight:700;flex-shrink:0}
.dcount.zero{background:var(--tag-x);color:var(--tag-xt)}
.dcount.err{background:var(--tag-r);color:var(--e)}

.detail-body{padding:.8rem 1.25rem 1.2rem}
.detail-err{padding:1.5rem;text-align:center;color:var(--e)}
.detail-err .de-ico{font-size:2rem;display:block;margin-bottom:.5rem}
.detail-empty-msg{color:var(--t3);font-style:italic;padding:1rem 0;text-align:center;font-size:.88rem}

.rlist{list-style:none}
.rlist li{display:flex;align-items:center;gap:.5rem;padding:.55rem .5rem;border-radius:var(--rs);transition:background .15s,transform .15s;position:relative}
.rlist li:hover{background:rgba(139,215,255,.07);transform:translateX(2px)}
.rlist li+li{border-top:1px solid rgba(255,255,255,.025)}
.rlist li::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--a);flex-shrink:0;opacity:.55;box-shadow:0 0 8px var(--a)}
.rlist a{color:var(--l);text-decoration:none;font-size:.92rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s}
.rlist a:hover{color:var(--a2);text-decoration:underline;text-underline-offset:3px}
.rurl{font-size:.7rem;color:var(--t3);flex-shrink:0;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cpbtn{background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:.8rem;padding:.2rem .35rem;border-radius:4px;transition:all .2s;flex-shrink:0;line-height:1;opacity:0}
.rlist li:hover .cpbtn,.cpbtn.mv{opacity:1}
.cpbtn:hover{color:var(--l);background:rgba(255,255,255,.06)}
.cpbtn.ok{color:var(--s)}
.more{display:block;width:100%;margin-top:.45rem;padding:.45rem;border-radius:var(--rs);border:1px solid var(--bd);background:rgba(255,255,255,.025);color:var(--l);cursor:pointer;font-size:.83rem;font-family:inherit;transition:all .2s}
.more:hover{background:rgba(139,215,255,.08);color:var(--a2)}

/* skeleton */
.skel{background:linear-gradient(180deg,rgba(255,255,255,.052),rgba(255,255,255,.024));border-bottom:1px solid rgba(255,255,255,.03);padding:.7rem .9rem;animation:fs .35s ease-out both}
.skel-h{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
.skel-d{width:8px;height:8px;border-radius:50%;background:var(--sks);flex-shrink:0;animation:pulse 1.5s infinite}
.skel-l{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--skb) 25%,var(--sks) 50%,var(--skb) 75%);background-size:200% 100%;animation:sh 1.5s infinite}
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
  .master-detail{grid-template-columns:1fr}
  .plist{position:relative;max-height:none;top:0}
  .plist-body{max-height:340px}
  .detail{min-height:300px}
}
@media(max-width:640px){
  .app{padding:.8rem .7rem 4rem}.header{margin-bottom:1rem}
  .launcher{padding:.85rem .7rem;margin-bottom:.9rem}
  .sform{flex-direction:column;gap:.5rem}.btn1{width:100%;padding:.85rem}
  .rlist a{white-space:normal;overflow:visible;text-overflow:unset;font-size:.88rem;line-height:1.4}
  .rurl{display:none}
  .cpbtn{opacity:.7;min-width:44px;min-height:44px}
  .b2t{width:38px;height:38px;bottom:1rem;right:.8rem}.kbd{display:none}
  .detail-hd{padding:.85rem 1rem .7rem}
  .detail-body{padding:.6rem .9rem 1rem}
}
@media(hover:none){.cpbtn{opacity:.7}.btn1:hover{transform:none}}
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
<div style="text-align:center">
  <div class="tabs" id="tabs">
    <button class="tab on" data-m="gal">🎮 资源<span class="badge">33</span></button>
    <button class="tab" data-m="patch">🩹 补丁<span class="badge">2</span></button>
  </div>
</div>
<div class="swrap" id="swrap">
  <form class="sform" id="sf" autocomplete="off">
    <div class="iwrap">
      <span class="sicon">🔎</span>
      <input type="text" name="game" id="q" placeholder="输入 Galgame 名称，如：千恋万花" required autofocus maxlength="100" autocomplete="off">
      <button type="button" class="iclear" id="icl" aria-label="清空">&times;</button>
    </div>
    <button type="submit" class="btn btn1" id="sb">🔍 搜索</button>
  </form>
  <div class="hdrop" id="hd"></div>
</div>
<p class="pcount">已接入 <b>33</b> 个资源站 + <b>2</b> 个补丁站 · 实时聚合</p>
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
      <button class="ph-sort" id="ph-sort" title="切换排序">结果数↓</button>
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
var platforms=new Map(),selName=null,sortBy='count',total=0,done=0;

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
function lb(){var img=$('bg-acg');if(img)img.src='/api/bg?t='+Date.now()}
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
  var html='';h.forEach(function(kw){html+='<div class="hitem" data-k="'+kw.replace(/"/g,'&quot;')+'"><span>'+kw+'</span><button class="del" data-d="'+kw.replace(/"/g,'&quot;')+'">&times;</button></div>'});
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
  if(a){platforms.clear();selName=null;done=0;rc=0;ec=0;tp=0;total=0;renderPlist();renderDetail();pf.style.width='0%';pf.classList.remove('done');pt.textContent='搜索中...';sBar.style.display='none';t0=Date.now();hd.classList.remove('show');
    var skHtml='';for(var i=0;i<5;i++){skHtml+='<div class="skel"><div class="skel-h"><div class="skel-d"></div><div class="skel-l w30"></div></div><div class="skel-l w70"></div><div class="skel-l w50"></div></div>'}
    plistBody.innerHTML=skHtml;
  }
  else{pf.classList.add('done');sBar.style.display='flex';ust()}}
function ust(){var el=((Date.now()-t0)/1000).toFixed(1);st.innerHTML='<span class="sdot ok"></span>已搜 <b>'+rc+'</b> 平台'+(ec>0?' · <span class="sdot err"></span><b>'+ec+'</b> 错误':'')+' · '+el+'s'}
window.clr=function(){platforms.clear();selName=null;renderPlist();renderDetail();sBar.style.display='none';pt.textContent='就绪';pf.style.width='0%';pf.classList.remove('done');tp=0;total=0;done=0;phCount.textContent='等待搜索'}

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
    var badgeCls=cnt>0?'':(p.error?'err':'zero');
    var badgeTxt=p.error?'×':cnt;
    var meta='';
    if(p.error)meta='<span class="pm-err">'+p.error.slice(0,24)+'</span>';
    else if(cnt>0)meta='<span class="pm-ok">'+(p.tags?p.tags.slice(0,3).join(' · '):'')+'</span>';
    else meta='空结果';
    var safeName=p.name.replace(/"/g,'&quot;');
    html+='<div class="pitem'+(p.name===selName?' active':'')+'" data-name="'+safeName+'">'+
      '<span class="pdot '+dotCls+'"></span>'+
      '<div class="pinfo"><div class="pname">'+p.name+'</div><div class="pmeta">'+meta+'</div></div>'+
      '<span class="pbadge '+badgeCls+'">'+badgeTxt+'</span></div>';
  });
  plistBody.innerHTML=html;
  phCount.textContent=done+'/'+total+' · '+rc+' 命中';
  // 绑定点击
  plistBody.querySelectorAll('.pitem').forEach(function(el){
    el.addEventListener('click',function(){
      selName=el.getAttribute('data-name');
      renderPlist();renderDetail();
      detailEl.classList.add('flash');setTimeout(function(){detailEl.classList.remove('flash')},350);
      // 移动端：滚动到详情
      if(window.innerWidth<860){detailEl.scrollIntoView({behavior:'smooth',block:'start'})}
    });
  });
}

// 渲染右侧详情
function renderDetail(){
  if(!selName){
    detailEl.innerHTML='<div class="detail-empty"><span class="de-icon">📚</span><h3>选择左侧平台查看详情</h3><p>搜索结果会实时填充到平台列表</p></div>';
    return;
  }
  var p=platforms.get(selName);
  if(!p){
    detailEl.innerHTML='<div class="detail-empty"><span class="de-icon">⏳</span><h3>'+selName+'</h3><p>正在搜索…</p></div>';
    return;
  }
  if(p.error){
    detailEl.innerHTML='<div class="detail-hd" style="--ca:var(--e)"><span class="dcdot" style="background:var(--e)"></span><div class="dinfo"><div class="dname">'+p.name+'</div><div class="dsub">搜索失败</div></div><span class="dcount err">错误</span></div><div class="detail-body"><div class="detail-err"><span class="de-ico">⚠️</span>'+p.error+'</div></div>';
    return;
  }
  if(!p.items||p.items.length===0){
    var etags=p.tags?p.tags.map(function(t){return '<span class="tag '+tc(t)+'">'+t+'</span>'}).join(''):'';
    detailEl.innerHTML='<div class="detail-hd" style="--ca:var(--t3)"><span class="dcdot" style="background:var(--t3)"></span><div class="dinfo"><div class="dname">'+p.name+'</div><div class="dsub">'+(p.tags?p.tags.join(' · '):'')+'</div></div><div class="dtags">'+etags+'</div><span class="dcount zero">0</span></div><div class="detail-body"><div class="detail-empty-msg">该平台无匹配结果</div></div>';
    return;
  }
  // 按相关性排序
  if(p.items.length>1){
    var query=q.value.trim();
    p.items.sort(function(a,b){return scoreItem(b.name,query)-scoreItem(a.name,query)});
  }
  var ca=p.color||'#888';
  var tagsHtml=p.tags?p.tags.map(function(t){return '<span class="tag '+tc(t)+'">'+t+'</span>'}).join(''):'';
  var all=p.items;
  var expanded=p.expanded||all.length<=LM;
  var shown=expanded?all:all.slice(0,LM);
  var itemsHtml='';
  shown.forEach(function(it){
    var tmp=document.createElement('a');tmp.href=it.url;var host=tmp.hostname||'';
    var safeUrl=it.url.replace(/"/g,'&quot;');
    itemsHtml+='<li><a href="'+it.url+'" target="_blank" rel="noopener noreferrer">'+it.name+'</a><span class="rurl">'+host+'</span><button class="cpbtn" data-url="'+safeUrl+'">📋</button></li>';
  });
  var moreBtn='';
  if(all.length>LM){
    moreBtn=expanded?'<button class="more" id="dmore">收起 ▴</button>':'<button class="more" id="dmore">展开全部 '+all.length+' 条 ▾</button>';
  }
  detailEl.innerHTML='<div class="detail-hd" style="--ca:'+ca+'"><span class="dcdot" style="background:'+ca+'"></span><div class="dinfo"><div class="dname">'+p.name+'</div><div class="dsub">'+all.length+' 条结果</div></div><div class="dtags">'+tagsHtml+'</div><span class="dcount">'+all.length+'</span></div><div class="detail-body"><ul class="rlist">'+itemsHtml+'</ul>'+moreBtn+'</div>';
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

// submit
sf.addEventListener('submit',function(e){
  e.preventDefault();var kw=q.value.trim();if(!kw||busy)return;var n=Date.now();if(n-lt<CD)return;lt=n;sbz(true);sh(kw);
  fetch('/'+m,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'game='+encodeURIComponent(kw)}).then(function(r){
    if(!r.ok)return r.json().then(function(err){throw new Error(err.error||'搜索失败('+r.status+')')});
    var rd=r.body.getReader(),dc=new TextDecoder();buf='';
    function pump(){return rd.read().then(function(v){if(v.value){buf+=dc.decode(v.value,{stream:true});var ls=buf.split('\\n');buf=ls.pop()||'';ls.forEach(function(l){if(!l.trim())return;try{pm(JSON.parse(l))}catch(e){}})}
      if(v.done){if(buf.trim())try{pm(JSON.parse(buf))}catch(e){}finish();return}return pump()})}return pump()})
  .catch(function(err){plistBody.innerHTML='<div class="plist-empty"><span class="pe-icon">⚠️</span>'+err.message+'</div>';pt.textContent='失败';sbz(false)})
});

function pm(d){
  if(typeof d.total==='number'&&!d.progress){tp=d.total;total=tp;pt.textContent='0/'+tp;phCount.textContent='0/'+tp+' · 等待中';return}
  if(d.progress){
    var c=d.progress.completed,t=d.progress.total;if(!tp)tp=t;pf.style.width=(c/t*100)+'%';pt.textContent=c+'/'+t;done=c;
    if(d.result){
      // 清除 skeleton
      var sk=plistBody.querySelector('.skel');if(sk)plistBody.innerHTML='';
      var r=d.result;
      // 保留之前的 expanded 状态
      var prev=platforms.get(r.name);
      platforms.set(r.name,{name:r.name,color:r.color,tags:r.tags,items:r.items,error:r.error,expanded:prev?prev.expanded:false});
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
    else if(platforms.size>0){
      plistBody.innerHTML='<div class="plist-empty"><span class="pe-icon">📭</span>没有找到相关资源<p style="margin-top:.5rem;font-size:.8rem">试试缩短关键词，或使用中文名称</p></div>';
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
