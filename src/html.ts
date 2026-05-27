// SearchGAL 前端 HTML - 优化版
// 包含：Resource Hints、移动端优化、加载动画、深色模式切换、结果排序优化

export const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>SearchGAL · Gal资源聚合搜索</title>
<meta name="description" content="聚合搜索32+ Gal资源平台，SSE流式返回">
<meta name="theme-color" content="#0a0614">
<meta property="og:title" content="SearchGAL">
<meta property="og:description" content="聚合搜索32+ Gal资源平台，一键发现资源">

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
.bg-aurora{position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(120deg,rgba(255,134,183,.18),transparent 34%),linear-gradient(250deg,rgba(139,215,255,.13),transparent 42%),linear-gradient(180deg,rgba(9,9,21,.1),rgba(9,9,21,.9));mix-blend-mode:screen}
.bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.07;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(135deg,rgba(255,134,183,.08) 1px,transparent 1px);background-size:56px 56px,56px 56px,140px 140px}

/* 二次元图片背景 */
.bg-acg{position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;opacity:.28;z-index:-1;pointer-events:none;transition:opacity .5s;filter:saturate(1.18) contrast(1.08) brightness(.72)}

.app{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:clamp(1rem,3vw,2.25rem) clamp(.8rem,2.5vw,2rem) 4rem}
.header{text-align:center;margin-bottom:clamp(.9rem,2.4vw,1.4rem)}
.logo{display:inline-flex;align-items:center;gap:.45rem;font-size:clamp(2rem,5vw,3.25rem);font-weight:850;letter-spacing:0;background:linear-gradient(135deg,var(--a2),var(--a) 48%,var(--a3));background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:ls 5s linear infinite;cursor:pointer;text-decoration:none;text-shadow:0 0 28px rgba(255,134,183,.18)}
@keyframes ls{to{background-position:200% center}}
.logo .ic{font-size:.75em;-webkit-text-fill-color:initial}
.tagline{color:var(--t2);font-size:clamp(.82rem,1.8vw,.95rem);margin-top:.25rem}

.launcher{position:relative;max-width:760px;margin:0 auto 1.2rem;padding:1rem;border:1px solid var(--bd);border-radius:var(--r);background:linear-gradient(180deg,rgba(20,21,38,.58),rgba(12,13,26,.42));box-shadow:var(--sh);backdrop-filter:blur(22px);overflow:hidden}
.launcher::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--a),var(--a2),var(--a3));opacity:.85}
.launcher::after{content:'Gal资料终端';position:absolute;right:.9rem;top:.65rem;font-size:.68rem;color:var(--t3);pointer-events:none}

/* tabs */
.tabs{display:inline-flex;gap:4px;margin-bottom:.8rem;background:rgba(255,255,255,.045);border-radius:var(--rs);padding:4px;border:1px solid var(--bd)}
.tab{padding:.48rem 1.2rem;border-radius:6px;border:none;background:transparent;color:var(--t2);cursor:pointer;font-size:.85rem;font-weight:650;font-family:inherit;transition:all .25s;white-space:nowrap}
.tab.on{background:linear-gradient(135deg,rgba(255,134,183,.24),rgba(139,215,255,.18));color:var(--t);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 6px 16px rgba(0,0,0,.18)}
.tab:hover:not(.on){color:var(--t);background:rgba(255,255,255,.055)}
.tab .badge{font-size:.7rem;margin-left:.3rem;opacity:.5}

/* search */
.swrap{position:relative;max-width:650px;margin:0 auto .65rem}
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

/* history */
.hdrop{display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;background:rgba(14,15,29,.88);backdrop-filter:blur(28px);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh)}
.hdrop.show{display:block;animation:fs .2s ease-out}
.hitem{padding:.65rem 1.1rem;cursor:pointer;font-size:.9rem;color:var(--t);border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;transition:background .15s}
.hitem:hover{background:rgba(129,140,248,.06)}
.hitem .del{background:none;border:none;color:var(--t3);cursor:pointer;font-size:1rem;padding:.15rem .4rem;border-radius:4px;line-height:1;transition:all .15s}
.hitem .del:hover{color:var(--e);background:rgba(248,113,113,.07)}
.hclear{padding:.5rem;text-align:center;font-size:.78rem;color:var(--t3);cursor:pointer;border-top:1px solid var(--bd)}
.hclear:hover{color:var(--e)}
.pcount{text-align:center;font-size:.76rem;color:var(--t3);margin-bottom:.95rem}
.pcount b{color:var(--a2);font-weight:700}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.3rem;border:none;font-weight:600;cursor:pointer;font-family:inherit;transition:all .25s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden;white-space:nowrap}
.btn1{padding:.9rem 1.65rem;border-radius:var(--rs);background:linear-gradient(135deg,#ff7eb3,#7ed8ff 58%,#ffd28f);color:#160d1c;font-size:clamp(.85rem,1.8vw,.95rem);box-shadow:0 8px 24px rgba(255,134,183,.24);letter-spacing:0}
.btn1:hover{transform:translateY(-1.5px);box-shadow:0 10px 30px rgba(139,215,255,.28)}
.btn1:active{transform:scale(.95)}
.btn1:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.btn1::after{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at center,rgba(255,255,255,.35) 0%,transparent 70%);opacity:0;transform:scale(.4);transition:all .5s}
.btn1:active::after{opacity:1;transform:scale(2.5);transition:all 0s}
.btn2{background:transparent;border:1.5px solid var(--bd);color:var(--t2);padding:.4rem 1rem;font-size:.8rem;border-radius:var(--rs)}
.btn2:hover{background:var(--bgc);border-color:var(--bdh);color:var(--t)}

/* stats */
.sbar{display:none;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin:.2rem auto .7rem;max-width:760px;font-size:.82rem;color:var(--t2);animation:fs .3s ease-out}
@keyframes fs{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.sdot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:.25rem;vertical-align:middle}
.sdot.ok{background:var(--s);box-shadow:0 0 6px var(--s)}
.sdot.err{background:var(--e);box-shadow:0 0 6px var(--e)}

/* progress */
.pwrap{display:flex;align-items:center;gap:.6rem;margin:0 auto .1rem;max-width:650px}
.ptrack{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden}
.pfill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--a),var(--a2),var(--a3));background-size:200% 100%;transition:width .35s ease;animation:ps 2s linear infinite}
@keyframes ps{to{background-position:200% 0}}
.pfill.done{animation:none;background:var(--s)}
#ptext{min-width:70px;font-size:.82rem;color:var(--t2);text-align:right}

/* skeleton */
.skel{background:linear-gradient(180deg,rgba(255,255,255,.052),rgba(255,255,255,.024));backdrop-filter:blur(12px);border:1px solid var(--bd);border-radius:var(--r);padding:1.1rem;animation:fs .35s ease-out both,fadeIn .6s ease-out;content-visibility:auto;contain-intrinsic-size:0 130px}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.skel-h{display:flex;align-items:center;gap:.5rem;margin-bottom:.7rem}
.skel-d{width:10px;height:10px;border-radius:50%;background:var(--sks);flex-shrink:0;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.skel-l{height:12px;border-radius:6px;margin-bottom:.5rem;background:linear-gradient(90deg,var(--skb) 25%,var(--sks) 50%,var(--skb) 75%);background-size:200% 100%;animation:sh 1.5s infinite}
@keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skel-l.w30{width:30%}.skel-l.w50{width:50%}.skel-l.w70{width:70%}.skel-l.w90{width:90%}

/* results */
#results{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:.85rem;align-items:start}
@media(min-width:1400px){#results{grid-template-columns:repeat(3,1fr)}}

/* card */
.card{position:relative;background:linear-gradient(180deg,rgba(24,25,44,.62),rgba(12,13,26,.48));backdrop-filter:blur(18px);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden;transition:all .35s cubic-bezier(.22,1,.36,1);content-visibility:auto;contain-intrinsic-size:0 200px;animation:ci .45s cubic-bezier(.16,1,.3,1) both;box-shadow:0 10px 30px rgba(0,0,0,.22)}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;opacity:.75;transition:all .35s;background:var(--ca,transparent)}
.card::after{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.24),transparent);opacity:.8}
.card:hover{transform:translateY(-3px);border-color:var(--bdh);box-shadow:var(--sg)}
.card:hover::before{opacity:1;box-shadow:0 0 16px var(--ca,transparent)}
.card.err{border-color:rgba(248,113,113,.2)}
.card.err::before{background:var(--e)!important}
@keyframes ci{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

.chd{display:flex;align-items:center;gap:.55rem;padding:1.05rem 1rem .75rem 1.15rem;background:linear-gradient(90deg,rgba(255,255,255,.032),rgba(255,255,255,.006));border-bottom:1px solid var(--bd);position:relative}
.chd::before{content:'ARCHIVE';position:absolute;left:1.15rem;top:.35rem;font-size:.58rem;color:var(--t3);font-weight:700;letter-spacing:0}
.cdot{display:inline-block;width:10px;height:10px;border-radius:50%;flex-shrink:0;position:relative}
.cdot::after{content:'';position:absolute;inset:-3px;border-radius:50%;background:inherit;opacity:.25;filter:blur(5px)}
.cname{font-weight:750;font-size:.93rem;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cbadge{margin-left:auto;font-size:.72rem;color:#0b1220;background:linear-gradient(135deg,var(--a2),var(--a3));padding:.16rem .5rem;border-radius:6px;white-space:nowrap;flex-shrink:0;font-weight:750}
.ctags{margin-left:.3rem;display:flex;gap:.25rem;flex-wrap:wrap;flex-shrink:0}
.tag{font-size:.7rem;padding:.15rem .5rem;border-radius:6px;font-weight:650;white-space:nowrap;letter-spacing:0;border:1px solid rgba(255,255,255,.06)}
.tag.g{background:var(--tag-g);color:var(--tag-gt)}.tag.a{background:var(--tag-a);color:var(--tag-at)}.tag.x{background:var(--tag-x);color:var(--tag-xt)}.tag.r{background:var(--tag-r);color:var(--e)}

.cbody{padding:.55rem .9rem .9rem 1.15rem}
.cbody .empty{color:var(--t3);font-style:italic;margin:.3rem 0;font-size:.88rem}
.cbody .err{color:var(--e);font-size:.85rem;padding:.2rem 0}

.rlist{list-style:none}
.rlist li{display:flex;align-items:center;gap:.35rem;padding:.42rem .45rem;border-radius:var(--rs);transition:background .15s,transform .15s;position:relative}
.rlist li:hover{background:rgba(139,215,255,.07);transform:translateX(2px)}
.rlist li+li{border-top:1px solid rgba(255,255,255,.025)}
.rlist a{color:var(--l);text-decoration:none;font-size:.9rem;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s}
.rlist a:hover{color:var(--a2);text-decoration:underline;text-underline-offset:3px}
/* 结果分区：有结果 vs 空/错误 之间留间距 */
.card[data-rank="0"]+.card:not([data-rank="0"]){margin-top:1.2rem}
.rlist li::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--a);flex-shrink:0;opacity:.55;box-shadow:0 0 8px var(--a)}
.cpbtn{background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:.8rem;padding:.2rem .35rem;border-radius:4px;transition:all .2s;flex-shrink:0;line-height:1;opacity:0}
.rlist li:hover .cpbtn,.cpbtn.mv{opacity:1}
.cpbtn:hover{color:var(--l);background:rgba(255,255,255,.06)}
.cpbtn.ok{color:var(--s)}

.more{display:block;width:100%;margin-top:.45rem;padding:.45rem;border-radius:var(--rs);border:1px solid var(--bd);background:rgba(255,255,255,.025);color:var(--l);cursor:pointer;font-size:.83rem;font-family:inherit;transition:all .2s}
.more:hover{background:rgba(139,215,255,.08);color:var(--a2)}

/* empty */
.empt{text-align:center;padding:3.5rem 1rem;grid-column:1/-1;animation:fs .4s ease-out;border:1px solid var(--bd);border-radius:var(--r);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.018));backdrop-filter:blur(18px)}
.empt .eicon{font-size:3.5rem;display:block;margin-bottom:.8rem;opacity:.68}
.empt h3{font-size:1.1rem;color:var(--t2);margin-bottom:.3rem;font-weight:650}
.empt p{color:var(--t3);font-size:.88rem}

/* toast */
.toast{position:fixed;bottom:clamp(1.5rem,4vw,2.5rem);left:50%;transform:translateX(-50%) translateY(120px);background:var(--bgc);backdrop-filter:blur(24px);border:1px solid var(--bd);border-radius:var(--rf);padding:.6rem 1.4rem;color:var(--t);font-size:.85rem;box-shadow:var(--sh);z-index:100;transition:transform .4s cubic-bezier(.16,1,.3,1);pointer-events:none;display:flex;align-items:center;gap:.45rem;white-space:nowrap}
.toast.show{transform:translateX(-50%) translateY(0)}

/* back2top */
.b2t{position:fixed;bottom:clamp(1rem,3vw,1.5rem);right:clamp(.8rem,2.5vw,1.5rem);width:42px;height:42px;border-radius:50%;z-index:50;background:var(--bgc);backdrop-filter:blur(16px);border:1px solid var(--bd);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;transition:all .3s;opacity:0;visibility:hidden;transform:translateY(10px);box-shadow:0 2px 8px rgba(0,0,0,.25)}
.b2t.on{opacity:1;visibility:visible;transform:translateY(0)}
.b2t:hover{background:rgba(129,140,248,.1);color:var(--a);border-color:var(--a)}

/* footer */
.kbd{text-align:center;font-size:.73rem;color:var(--t3);margin-top:2.5rem;opacity:.7}
.kbd kbd{display:inline-block;padding:.12rem .45rem;border-radius:4px;background:var(--bgc);border:1px solid var(--bd);font-family:inherit;font-size:inherit;margin:0 .12rem;font-weight:500}
.ft{text-align:center;margin-top:.6rem;font-size:.7rem;color:var(--t3);opacity:.5}

@media(max-width:1023px){#results{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}}
@media(max-width:640px){
  .app{padding:.8rem .7rem 4rem}.header{margin-bottom:1rem}
  .launcher{padding:.85rem .7rem;margin-bottom:.9rem}.launcher::after{display:none}
  .sform{flex-direction:column;gap:.5rem}.btn1{width:100%;padding:.85rem}
  #results{grid-template-columns:1fr}
  .chd{flex-wrap:wrap;padding:.6rem .8rem}.cbody{padding-left:.8rem;padding-right:.6rem}
  .chd::before{display:none}
  .rlist a{white-space:normal;overflow:visible;text-overflow:unset;font-size:.88rem;line-height:1.4}
  .cpbtn{opacity:.7;min-width:44px;min-height:44px}
  .b2t{width:38px;height:38px;bottom:1rem;right:.8rem}.pcount{font-size:.72rem}.kbd{display:none}
  .card{margin:0 -.3rem}
}
@media(max-width:380px){.tab{padding:.35rem .8rem;font-size:.78rem}#q{font-size:.85rem}.tag{font-size:.65rem;padding:.12rem .4rem}}
@media(hover:none){.cpbtn{opacity:.7}.card:hover{transform:none;box-shadow:none}.btn1:hover{transform:none}}
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
    <button class="tab on" data-m="gal">🎮 资源<span class="badge">31</span></button>
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
<p class="pcount">已接入 <b>31</b> 个资源站 + <b>2</b> 个补丁站 · 实时聚合</p>
<div class="sbar" id="sbar"><span id="st"></span><button class="btn btn2" onclick="clr()">清空</button></div>
<div class="pwrap"><div class="ptrack"><div class="pfill" id="pf" style="width:0%"></div></div><span id="ptext">就绪</span></div>
</section>
<main id="results"></main>
<p class="ft">SearchGAL · 请支持正版</p>
</div>
<button class="b2t" id="b2t" aria-label="回到顶部">↑</button>
<div class="toast" id="toast"><span id="ticon"></span><span id="tmsg"></span></div>
<script>
var $=function(id){return document.getElementById(id)};
var sf=$('sf'),q=$('q'),sb=$('sb'),icl=$('icl'),hd=$('hd'),pf=$('pf'),pt=$('ptext'),
    res=$('results'),sBar=$('sbar'),st=$('st'),toast=$('toast'),tmsg=$('tmsg'),ticon=$('ticon'),b2t=$('b2t');
var m='gal',buf='',busy=false,t0=0,rc=0,ec=0,lt=0,tp=0,CD=2000,LM=8,HK='sgh',MH=5,tt=null;

// tabs
$('tabs').addEventListener('click',function(e){var t=e.target.closest('.tab');if(!t||busy)return;m=t.dataset.m;
  this.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on')});t.classList.add('on');clr();q.focus()});

// clear btn
function ucl(){icl.classList.toggle('on',q.value.length>0)}
q.addEventListener('input',ucl);
icl.addEventListener('click',function(){q.value='';ucl();q.focus();clr()});

// 背景图片加载
function lb(){
  var img = $('bg-acg');
  if(img) img.src = '/api/bg?t=' + Date.now();
}
lb(); // 初始加载

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

// skeleton
function skels(n){
  res.querySelectorAll('.skel').forEach(function(el){el.remove()});n=Math.min(n,6);var f=document.createDocumentFragment();
  for(var i=0;i<n;i++){var c=document.createElement('div');c.className='skel';c.innerHTML='<div class="skel-h"><div class="skel-d"></div><div class="skel-l w30"></div></div><div class="skel-l w90"></div><div class="skel-l w70"></div><div class="skel-l w50"></div>';c.style.animationDelay=(i*.06)+'s';f.appendChild(c)}
  res.appendChild(f)}

// state
function sbz(a){busy=a;sb.disabled=a;q.readOnly=a;
  if(a){res.innerHTML='';pf.style.width='0%';pf.classList.remove('done');pt.textContent='搜索中...';sBar.style.display='none';t0=Date.now();rc=0;ec=0;tp=0;hd.classList.remove('show')}
  else{pf.classList.add('done');sBar.style.display='flex';ust()}}
function ust(){var el=((Date.now()-t0)/1000).toFixed(1);st.innerHTML='<span class="sdot ok"></span>已搜索 <b>'+rc+'</b> 个平台'+(ec>0?' · <span class="sdot err"></span><b>'+ec+'</b> 错误':'')+' · '+el+'s'}
window.clr=function(){res.innerHTML='';sBar.style.display='none';pt.textContent='就绪';pf.style.width='0%';pf.classList.remove('done');tp=0}

// tags
function tc(t){if(t==='breaker')return'tag r';if(t==='NoReq'||t==='SuDrive'||t==='NoSplDrive')return'tag g';if(t==='magic'||t==='SplDrive'||t==='BTmag'||t==='MixDrive')return'tag a';return'tag x'}

// 结果排序评分
function scoreItem(name,query){
  var n=name.toLowerCase(),q=query.toLowerCase();
  if(n===q)return 3; // 完全匹配
  if(n.indexOf(q)===0)return 2; // 开头匹配
  if(n.indexOf(q)>-1)return 1; // 包含
  return 0; // 不匹配
}

// submit
sf.addEventListener('submit',function(e){
  e.preventDefault();var kw=q.value.trim();if(!kw||busy)return;var n=Date.now();if(n-lt<CD)return;lt=n;sbz(true);sh(kw);
  fetch('/'+m,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'game='+encodeURIComponent(kw)}).then(function(r){
    if(!r.ok)return r.json().then(function(err){throw new Error(err.error||'搜索失败('+r.status+')')});
    var rd=r.body.getReader(),dc=new TextDecoder();buf='';
    function pump(){return rd.read().then(function(v){if(v.value){buf+=dc.decode(v.value,{stream:true});var ls=buf.split('\\n');buf=ls.pop()||'';ls.forEach(function(l){if(!l.trim())return;try{pm(JSON.parse(l))}catch(e){}})}
      if(v.done){if(buf.trim())try{pm(JSON.parse(buf))}catch(e){}if(!res.children.length)se();sbz(false);return}return pump()})}return pump()})
  .catch(function(err){res.innerHTML='<div class="empt"><span class="eicon">⚠️</span><h3>搜索出错</h3><p>'+err.message+'</p></div>';pt.textContent='失败';sbz(false)})
});

function pm(d){
  if(typeof d.total==='number'&&!d.progress){tp=d.total;pt.textContent='0/'+tp;skels(Math.min(tp,6));return}
  if(d.progress){var c=d.progress.completed,t=d.progress.total;if(!tp)tp=t;pf.style.width=(c/t*100)+'%';pt.textContent=c+'/'+t;
    if(d.result){res.querySelectorAll('.skel').forEach(function(el){el.remove()});ac(d.result);rc++;if(d.result.error)ec++}}
  if(d.done){res.querySelectorAll('.skel').forEach(function(el){el.remove()});sortCards();if(!res.children.length)se()}
}
function se(){res.innerHTML='<div class="empt"><span class="eicon">📭</span><h3>没有找到相关资源</h3><p>试试缩短关键词，或使用中文名称</p></div>';pt.textContent='无结果'}

function ac(r){
  var c=document.createElement('div');c.className='card';
  if(r.error){c.classList.add('err');c.setAttribute('data-rank','2')}
  else if(r.items&&r.items.length){
    c.setAttribute('data-rank','0');
    // 按相关性排序结果
    if(r.items.length>1){
      var query=q.value.trim();
      r.items.sort(function(a,b){return scoreItem(b.name,query)-scoreItem(a.name,query)});
    }
  }
  else{c.setAttribute('data-rank','1')}
  if(r.color)c.style.setProperty('--ca',r.color);else if(r.error)c.style.setProperty('--ca','var(--e)');
  var hd=document.createElement('div');hd.className='chd';
  var dot=document.createElement('span');dot.className='cdot';dot.style.background=r.color||'#888';
  var nm=document.createElement('span');nm.className='cname';nm.textContent=r.name;hd.appendChild(dot);hd.appendChild(nm);
  if(!r.error&&r.items&&r.items.length){var bd=document.createElement('span');bd.className='cbadge';bd.textContent=r.items.length+'条';hd.appendChild(bd)}
  if(r.tags&&r.tags.length){var tw=document.createElement('div');tw.className='ctags';r.tags.forEach(function(t){var s=document.createElement('span');s.className='tag '+tc(t);s.textContent=t;tw.appendChild(s)});hd.appendChild(tw)}
  c.appendChild(hd);
  var bd=document.createElement('div');bd.className='cbody';
  if(r.error){var ep=document.createElement('p');ep.className='err';ep.textContent='⚠️ '+r.error;bd.appendChild(ep)}
  else if(r.items&&r.items.length){
    var all=r.items,ul=document.createElement('ul');ul.className='rlist';
    function rn(ex){ul.innerHTML='';var its=ex?all:all.slice(0,LM);its.forEach(function(it){var li=document.createElement('li');var a=document.createElement('a');a.href=it.url;a.textContent=it.name;a.target='_blank';a.rel='noopener noreferrer';li.appendChild(a);var cb=document.createElement('button');cb.className='cpbtn';cb.textContent='📋';cb.title='复制';cb.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();cp(it.url,cb)});li.appendChild(cb);ul.appendChild(li)})}
    rn(false);bd.appendChild(ul);
    if(all.length>LM){var lb=document.createElement('button');lb.className='more';lb.textContent='查看全部 '+all.length+' 个';var ex=false;lb.addEventListener('click',function(){ex=!ex;rn(ex);lb.textContent=ex?'收起':'查看全部 '+all.length+' 个'});bd.appendChild(lb)}
  }else{var nr=document.createElement('p');nr.className='empty';nr.textContent='无结果';bd.appendChild(nr)}
  c.appendChild(bd);
  var sk=res.querySelector('.skel');if(sk)sk.replaceWith(c);else res.appendChild(c)
}

function sortCards(){
  var cards=Array.from(res.children).filter(function(c){return c.classList.contains('card')});
  if(!cards.length)return;
  cards.sort(function(a,b){return (a.getAttribute('data-rank')||'1')-(b.getAttribute('data-rank')||'1')});
  cards.forEach(function(c){res.appendChild(c)})
}

// keyboard
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(hd.classList.contains('show'))hd.classList.remove('show');else if(!busy){sf.reset();ucl();clr()}}
  if(e.key==='/'&&document.activeElement!==q&&!busy){e.preventDefault();q.focus()}
});
q.addEventListener('focus',function(){if(!busy)rdd()});
q.addEventListener('input',function(){ucl();if(!busy&&!q.value.trim())rdd();else hd.classList.remove('show')});
document.addEventListener('click',function(e){if(!hd.contains(e.target)&&e.target!==q)hd.classList.remove('show')});
ucl();
</script>
</body>
</html>`;
