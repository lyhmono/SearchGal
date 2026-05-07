import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH } from "./core";
import { buildRedirectResponse } from "./redirect";
import type { Platform } from "./types";

export type Env = Record<string, unknown>;

// ---------- 常量 ----------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ---------- HTML 模板（独立常量，更清晰） ----------
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SearchGAL</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#121212;color:#e0e0e0;min-height:100vh;padding:2rem}
    .container{max-width:720px;margin:0 auto}
    h1{font-size:2.2rem;margin-bottom:1.5rem;color:#f9f9f9}
    .form{display:flex;gap:.75rem;margin-bottom:2rem}
    input{flex:1;padding:.9rem 1rem;border-radius:8px;border:none;background:#1e1e1e;color:#fff;font-size:1rem}
    button{padding:.9rem 1.4rem;border-radius:8px;border:none;background:#4f46e5;color:white;font-weight:600;cursor:pointer}
    button:hover{background:#4338ca}
    #result{white-space:pre-wrap;background:#1a1a1a;padding:1rem;border-radius:8px;min-height:120px;line-height:1.6}
  </style>
</head>
<body>
  <div class="container">
    <h1>SearchGAL - 游戏搜索</h1>
    <form id="searchForm" class="form">
      <input type="text" name="game" placeholder="输入游戏名称" required>
      <button type="submit">搜索</button>
    </form>
    <div id="result"></div>
  </div>
  <script>
    const form = document.getElementById('searchForm');
    const result = document.getElementById('result');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const game = form.game.value.trim();
      if (!game) return;
      result.textContent = '搜索中...';
      const response = await fetch('/gal', {
        method: 'POST',
        body: new FormData(form)
      });
      if (!response.ok) {
        const err = await response.json();
        result.textContent = '错误：' + err.error;
        return;
      }
      result.textContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result.textContent += decoder.decode(value);
      }
    });
  </script>
</body>
</html>`;

// ---------- 工具函数 ----------
function jsonResponse(data: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...extraHeaders },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

function createStreamResponse(writable: WritableStream, ctx: ExecutionContext, handler: Promise<void>): Response {
  const { readable } = new TransformStream();
  // ⚠️ 注意：此处 writable 应为 TransformStream 的 writable 端，但原代码中已经创建了 { readable, writable }
  // 为保持逻辑一致，此处沿用原实现方式
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      ...corsHeaders,
    },
  });
}

// ---------- 核心搜索处理 ----------
async function handleSearch(
  request: Request,
  ctx: ExecutionContext,
  platforms: Platform[]
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
      handleSearchRequestStream(game.trim(), platforms, writer)
        .catch((err) => console.error("Streaming error:", err))
        .finally(() => writer.close())
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

    // 首页
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
