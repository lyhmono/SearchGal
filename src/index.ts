import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH } from "./core";
import type { Platform } from "./types";

export type Env = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ---------- 赞美伟大的DeepSeek ----------
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SearchGAL</title>
  <style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  background: radial-gradient(ellipse at top, #1a1a2e, #0d0d0d);
  color:#e0e0e0;min-height:100vh;padding:2rem;
}
.container{max-width:1100px;margin:0 auto}
h1{
  font-size:2.5rem;margin-bottom:0.25rem;
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  display:flex;align-items:center;gap:0.5rem;
}
.form{
  display:flex;gap:0.75rem;margin:1.5rem 0 1rem;
}
input{
  flex:1;padding:0.85rem 1.2rem;border-radius:999px;border:none;
  background:rgba(255,255,255,0.07);color:#fff;font-size:1rem;outline:none;
  backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);
  transition:all 0.2s;
}
input:focus{
  border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,0.25);
}
button{
  padding:0.85rem 1.8rem;border-radius:999px;border:none;
  background:linear-gradient(135deg, #6366f1, #8b5cf6);
  color:white;font-weight:600;cursor:pointer;
  transition:all 0.2s;
}
button:hover{
  background:linear-gradient(135deg, #4f46e5, #7c3aed);
  transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,0.4);
}
button:active{transform:scale(0.97)}

.progress-wrap{
  display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;
}
progress{
  flex:1;height:6px;border-radius:3px;appearance:none;
  overflow:hidden;
}
progress::-webkit-progress-bar{
  background:rgba(255,255,255,0.05);border-radius:3px;
}
progress::-webkit-progress-value{
  background:linear-gradient(90deg, #6366f1, #a78bfa);
  border-radius:3px;box-shadow:0 0 8px #818cf8;
  animation:progressGlow 1.5s infinite alternate;
}
@keyframes progressGlow{
  from{box-shadow:0 0 6px #818cf8}
  to{box-shadow:0 0 14px #a78bfa}
}
#progressText{min-width:70px;font-size:0.9rem;color:#aaa}

#results{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
  gap:1rem;
}
.platform-card{
  background:rgba(255,255,255,0.03);
  backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:16px;overflow:hidden;
  animation:fadeInUp 0.35s ease-out both;
  transition:all 0.2s;
}
.platform-card:hover{
  transform:translateY(-4px);
  box-shadow:0 12px 28px rgba(0,0,0,0.6);
  border-color:rgba(255,255,255,0.15);
}
@keyframes fadeInUp{
  from{opacity:0;transform:translateY(20px)}
  to{opacity:1;transform:translateY(0)}
}

.platform-header{
  display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1rem;
  background:rgba(255,255,255,0.04);font-size:0.95rem;
}
.platform-dot{
  display:inline-block;width:10px;height:10px;border-radius:50%;
}
.tags{
  margin-left:auto;font-size:0.8rem;color:#c7d2fe;
  background:rgba(99,102,241,0.2);padding:0.15rem 0.6rem;border-radius:20px;
}
.platform-content{padding:0.5rem 1rem 0.75rem}
.platform-content p{color:#aaa;font-style:italic;margin:0.5rem 0}
.platform-content .error{color:#f87171}
ul.item-list{list-style:none}
ul.item-list li{
  padding:0.35rem 0;border-bottom:1px solid rgba(255,255,255,0.05);
  display:flex;align-items:center;gap:0.4rem;
}
ul.item-list li:last-child{border-bottom:none}
ul.item-list a{
  color:#93c5fd;text-decoration:none;font-size:0.95rem;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
ul.item-list a:hover{text-decoration:underline;color:#a5b4fc}

/* 查看更多按钮 */
button.show-more{
  margin-top:0.5rem;padding:0.4rem 0.8rem;border-radius:6px;
  border:1px solid #4f46e5;background:transparent;color:#93c5fd;
  cursor:pointer;font-size:0.9rem;transition:all 0.2s;
}
button.show-more:hover{
  background:rgba(79,70,229,0.15);color:#c7d2fe;
}

/* 移动端适配 */
@media(max-width:640px){
  body{padding:1rem}
  h1{font-size:1.8rem}
  .form{flex-direction:column}
  button{width:100%}
  .platform-header{flex-wrap:wrap}
  #results{grid-template-columns:1fr}
  ul.item-list a{
    white-space:normal;overflow:visible;text-overflow:unset;
  }
}
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 SearchGAL</h1>
    <form id="searchForm" class="form">
      <input type="text" name="game" placeholder="输入游戏名称" required autofocus>
      <button type="submit">搜索</button>
    </form>

    <div class="progress-wrap">
      <progress id="progressBar" value="0" max="100"></progress>
      <span id="progressText">就绪</span>
    </div>
    <div id="results"></div>
  </div>

  <script>
    // ========== 安全的前端逻辑 (均在 HTML 字符串内) ==========
    const form = document.getElementById('searchForm');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultsContainer = document.getElementById('results');

    let buffer = '';

    function showError(msg) {
      resultsContainer.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'error';
      p.textContent = msg;
      resultsContainer.appendChild(p);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const game = form.game.value.trim();
      if (!game) return;

      // 重置 UI
      progressBar.value = 0;
      progressBar.max = 100;
      progressText.textContent = '搜索中...';
      resultsContainer.innerHTML = '';
      buffer = '';

      try {
        const response = await fetch('/gal', {
          method: 'POST',
          body: new FormData(form)
        });

        if (!response.ok) {
          const err = await response.json();
          showError('错误：' + (err.error || 'Unknown'));
          progressText.textContent = '失败';
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              processMessage(data);
            } catch (err) {
              console.warn('跳过无效 JSON:', line);
            }
          }
        }

        // 处理残留行
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            processMessage(data);
          } catch {}
        }

        if (resultsContainer.children.length === 0) {
          progressText.textContent = '无结果';
        }
      } catch (error) {
        showError('网络或解析错误：' + error.message);
        progressText.textContent = '错误';
      }
    });

    function processMessage(data) {
      // 初始总数消息
      if (typeof data.total === 'number' && !data.progress) {
        progressBar.max = data.total;
        progressBar.value = 0;
        progressText.textContent = '0 / ' + data.total;
        return;
      }

      // 进度+结果消息
      if (data.progress && data.result) {
        const { completed, total } = data.progress;
        progressBar.max = total;
        progressBar.value = completed;
        progressText.textContent = completed + ' / ' + total;
        addPlatformResult(data.result);
      }
    }

function addPlatformResult(result) {
  const card = document.createElement('div');
  card.className = 'platform-card';

  // 头部
  const header = document.createElement('div');
  header.className = 'platform-header';

  const dot = document.createElement('span');
  dot.className = 'platform-dot';
  dot.style.background = result.color || '#888';

  const name = document.createElement('strong');
  name.textContent = result.name;

  header.appendChild(dot);
  header.appendChild(name);

  if (result.tags && result.tags.length) {
    const tagsSpan = document.createElement('span');
    tagsSpan.className = 'tags';
    tagsSpan.textContent = result.tags.join(', ');
    header.appendChild(tagsSpan);
  }

  card.appendChild(header);

  // 内容区
  const content = document.createElement('div');
  content.className = 'platform-content';

  if (result.error) {
    const errP = document.createElement('p');
    errP.className = 'error';
    errP.textContent = '⚠️ ' + result.error;
    content.appendChild(errP);
  } else if (result.items && result.items.length > 0) {
    const allItems = result.items;
    const showLimit = 5;  // 默认只显示5个

    const ul = document.createElement('ul');
    ul.className = 'item-list';

    function renderItems(expanded) {
      ul.innerHTML = '';
      const itemsToShow = expanded ? allItems : allItems.slice(0, showLimit);
      itemsToShow.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        li.appendChild(a);
        ul.appendChild(li);
      });
    }

    renderItems(false);
    content.appendChild(ul);

    if (allItems.length > showLimit) {
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = '查看更多 (' + (allItems.length - showLimit) + ')';
      toggleBtn.style.cssText = 'margin-top:0.5rem;padding:0.4rem 0.8rem;border-radius:6px;border:1px solid #4f46e5;background:transparent;color:#93c5fd;cursor:pointer;font-size:0.9rem';

      let expanded = false;
      toggleBtn.addEventListener('click', () => {
        expanded = !expanded;
        renderItems(expanded);
        toggleBtn.textContent = expanded ? '收起' : '查看更多 (' + (allItems.length - showLimit) + ')';
      });

      content.appendChild(toggleBtn);
    }
  } else {
    const noRes = document.createElement('p');
    noRes.textContent = '无结果';
    content.appendChild(noRes);
  }

  card.appendChild(content);
  resultsContainer.appendChild(card);
}

  </script>
</body>
</html>`;

// ---------- 工具函数 ----------
function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ---------- 核心搜索处理 ----------
async function handleSearch(
  request: Request,
  ctx: ExecutionContext,
  platforms: 平台[]
): Promise<Response> {
  try {
    const formData = await request.formData();
    const game = formData.get("game");

    if (typeof game !== "string" || !game.trim()) {
      return errorResponse("Game name is required", 400);
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

ctx.waitUntil(
  handleSearchRequestStream(game.trim(), platforms, writer)['catch']((err) => console.error("Streaming error:", err))
    ['finally'](() => writer.close())
);
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...corsHeaders,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return errorResponse(message, 500);
  }
}

// ---------- 路由分发 ----------
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // 首页 (直接返回 HTML，不跳转)
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(HTML_TEMPLATE, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // POST 接口
    if (request.method === "POST") {
      switch (pathname) {
        case "/gal":
          return handleSearch(request, ctx, PLATFORMS_GAL);
        case "/patch":
          return handleSearch(request, ctx, PLATFORMS_PATCH);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
