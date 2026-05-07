// 安全显示错误
function showError(msg) {
  resultsContainer.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'error';
  p.textContent = msg;
  resultsContainer.appendChild(p);
}

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
      showError('错误：' + err.error);
      progressText.textContent = '失败';
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

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

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        processMessage(data);
      } catch { /* 忽略 */ }
    }

    // 无结果判定
    if (resultsContainer.children.length === 0) {
      progressText.textContent = '无结果';
    }
  } catch (error) {
    showError('网络或解析错误：' + error.message);
    progressText.textContent = '错误';
  }
});

// processMessage 和 addPlatformResult 保持不变（已经使用 textContent 等安全方式）
