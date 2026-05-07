import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH } from "./core";
import { buildRedirectResponse } from "./redirect";
import type { Platform } from "./types";
export type Env = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleSearch(request: Request, _env: Env, ctx: ExecutionContext, platforms: Platform[]) {
  try {
    const formData = await request.formData();
    const game = formData.get("game") as string;

    if (!game || typeof game !== 'string') {
      return new Response(JSON.stringify({ error: "Game name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    ctx.waitUntil(
      handleSearchRequestStream(game.trim(), platforms, writer)
        .catch(err => console.error("Streaming error:", err))
        .finally(() => writer.close())
    );

    return new Response(readable {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...corsHeaders
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SearchGAL - 清爽搜索</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui, sans-serif;background:#121212;color:#e0e0e0;padding:2rem}
    .box{max-width:800px;margin:0 auto}
    h1{margin-bottom:1.5rem;color:#fff}
    .search{display:flex;gap:10px;margin-bottom:1.5rem}
    input{flex:1;padding:12px 14px;border-radius:8px;border:none;background:#1e1e1e;color:#fff;font-size:16px}
    button{padding:12px 18px;border-radius:8px;border:none;background:#4f46e5;color:#fff;font-weight:bold}
    .item{background:#1a1a1a;padding:12px 14px;border-radius:8px;margin-bottom:10px}
    .title{color:#a5f3fc;font-weight:bold;margin-bottom:4px}
    .url{color:#9ca3af;font-size:14px}
    .platform{margin:10px 0 6px 0;color:#bbf7d0;font-weight:bold}
  </style>
</head>
<body>
  <div class="box">
    <h1>SearchGAL 游戏搜索</h1>
    <form class="search" id="form">
      <input type="text" name="game" placeholder="输入游戏名" required>
      <button type="submit">搜索</button>
    </form>
    <div id="result"></div>
  </div>

  <script>
    const form = document.getElementById('form');
    const res = document.getElementById('result');

    form.onsubmit = async e => {
      e.preventDefault();
      res.innerHTML = '搜索中...';

      const resp = await fetch('/gal', {
        method: 'POST',
        body: new FormData(form)
      });

      res.innerHTML = '';
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while(1){
        const { done, value } = await reader.read();
        if(done) break;
        const txt = decoder.decode(value);
        const lines = txt.split('\\n').filter(i=>i.trim());

        for(const line of lines){
          try{
            const json = JSON.parse(line);
            if(json.result){
              const p = json.result;
              res.innerHTML += '<div class="platform">『' + p.name + '』</div>';
              (p.items||[]).forEach(i=>{
                res.innerHTML += '<div class="item"><div class="title">'+i.name+'</div><div class="url">'+i.url+'</div></div>';
              })
            }
          }catch(e){}
        }
      }
    }
  </script>
</body>
</html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      if (url.pathname === "/gal") {
        return handleSearch(request, env, ctx, PLATFORMS_GAL);
      }
      if (url.pathname === "/patch") {
        return handleSearch(request, env, ctx, PLATFORMS_PATCH);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
