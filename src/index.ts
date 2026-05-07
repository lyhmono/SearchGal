<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SearchGAL</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      background:#121212;color:#e0e0e0;min-height:100vh;padding:2rem;
    }
    .container{max-width:860px;margin:0 auto}
    h1{
      font-size:2rem;margin-bottom:0.25rem;color:#f9f9f9;
      display:flex;align-items:center;gap:0.5rem;
    }
    .form{
      display:flex;gap:0.75rem;margin:1.5rem 0 1rem;
    }
    input{
      flex:1;padding:0.75rem 1rem;border-radius:8px;border:none;
      background:#1e1e1e;color:#fff;font-size:1rem;outline:none;
    }
    button{
      padding:0.75rem 1.4rem;border-radius:8px;border:none;
      background:#4f46e5;color:white;font-weight:600;cursor:pointer;
    }
    button:hover{background:#4338ca}

    .progress-wrap{
      display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;
    }
    progress{
      flex:1;height:8px;border-radius:4px;appearance:none;
    }
    progress::-webkit-progress-bar{background:#2a2a2a;border-radius:4px}
    progress::-webkit-progress-value{background:#4f46e5;border-radius:4px}
    #progressText{min-width:70px;font-size:0.9rem;color:#aaa}

    #results{
      display:flex;flex-direction:column;gap:1rem;
    }
    .platform-card{
      background:#1a1a1a;border-radius:10px;overflow:hidden;
      border:1px solid #2a2a2a;
    }
    .platform-header{
      display:flex;align-items:center;gap:0.5rem;padding:0.75rem 1rem;
      background:#232323;font-size:0.95rem;
    }
    .platform-dot{
      display:inline-block;width:10px;height:10px;border-radius:50%;
    }
    .tags{
      margin-left:auto;font-size:0.8rem;color:#888;
      background:#2a2a2a;padding:0.2rem 0.5rem;border-radius:4px;
    }
    .platform-content{padding:0.5rem 1rem 0.75rem}
    .platform-content p{color:#aaa;font-style:italic;margin:0.5rem 0}
    .platform-content .error{color:#f87171}
    ul.item-list{list-style:none}
    ul.item-list li{
      padding:0.35rem 0;border-bottom:1px solid #222;
      display:flex;align-items:center;gap:0.4rem;
    }
    ul.item-list li:last-child{border-bottom:none}
    ul.item-list a{
      color:#93c5fd;text-decoration:none;font-size:0.95rem;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    }
    ul.item-list a:hover{text-decoration:underline;color:#a5b4fc}
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
    const form = document.getElementById('searchForm');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultsContainer = document.getElementById('results');

    let buffer = '';

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
          resultsContainer.innerHTML = `<p class="error">错误：${err.error}</p>`;
          progressText.textContent = '失败';
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // 按换行切割，保留最后一个不完整行
          const lines = buffer.split('\n');
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

        // 处理残留的最终行
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            processMessage(data);
          } catch (err) {
            console.warn('最终行无效 JSON:', buffer);
          }
        }

        if (progressBar.value === 0) {
          progressText.textContent = '无结果';
        }
      } catch (error) {
        resultsContainer.innerHTML = `<p class="error">网络或解析错误：${error.message}</p>`;
        progressText.textContent = '错误';
      }
    });

    function processMessage(data) {
      // 初始总数消息
      if (typeof data.total === 'number' && !data.progress) {
        progressBar.max = data.total;
        progressBar.value = 0;
        progressText.textContent = `0 / ${data.total}`;
        return;
      }

      // 进度+结果消息
      if (data.progress && data.result) {
        const { completed, total } = data.progress;
        progressBar.max = total;
        progressBar.value = completed;
        progressText.textContent = `${completed} / ${total}`;
        addPlatformResult(data.result);
      }
    }

    function addPlatformResult(result) {
      const card = document.createElement('div');
      card.className = 'platform-card';

      // 头部：颜色圆点 + 平台名 + 标签
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
        errP.textContent = `⚠️ ${result.error}`;
        content.appendChild(errP);
      } else if (result.items && result.items.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'item-list';
        result.items.forEach(item => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = item.url;
          a.textContent = item.name;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          li.appendChild(a);
          ul.appendChild(li);
        });
        content.appendChild(ul);
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
</html>
