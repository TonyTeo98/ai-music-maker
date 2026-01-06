/**
 * 浏览器控制台文档提取脚本
 *
 * 使用方法：
 * 1. 打开 https://docs.cqtai.com/suno
 * 2. 打开浏览器开发者工具 (F12 或 Cmd+Option+I)
 * 3. 切换到 Console 标签页
 * 4. 复制下面的代码粘贴到控制台，按回车运行
 * 5. 脚本会自动遍历所有 suno 相关页面并提取内容
 * 6. 完成后会自动下载 cqtai-suno-docs.json 文件
 */

(async function extractDocs() {
  const results = {};
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // 获取侧边栏中所有 suno 相关链接
  function getLinks() {
    const links = [];
    document.querySelectorAll('a[href*="suno"]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !links.includes(href)) {
        links.push(href);
      }
    });
    return links;
  }

  // 提取当前页面内容
  function extractContent() {
    const content = {};

    // 尝试获取标题
    const h1 = document.querySelector('h1, .markdown h1, article h1');
    if (h1) content.title = h1.textContent.trim();

    // 尝试获取 API 端点信息
    const endpoint = document.querySelector('[class*="endpoint"], [class*="url"], .api-url, code');
    if (endpoint) content.endpoint = endpoint.textContent.trim();

    // 获取请求方法
    const method = document.querySelector('[class*="method"], .http-method');
    if (method) content.method = method.textContent.trim();

    // 获取主要内容区域
    const mainContent = document.querySelector('article, .markdown, main, [class*="content"]');
    if (mainContent) {
      content.html = mainContent.innerHTML;
      content.text = mainContent.innerText;
    }

    // 获取代码示例
    const codeBlocks = [];
    document.querySelectorAll('pre code, .code-block, [class*="highlight"]').forEach(code => {
      codeBlocks.push(code.textContent);
    });
    if (codeBlocks.length > 0) content.codeExamples = codeBlocks;

    // 获取参数表格
    const tables = [];
    document.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach(cell => {
          cells.push(cell.textContent.trim());
        });
        if (cells.length > 0) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });
    if (tables.length > 0) content.tables = tables;

    return content;
  }

  // 获取所有链接
  const links = getLinks();
  console.log(`发现 ${links.length} 个 suno 相关链接:`, links);

  // 遍历每个链接
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    console.log(`[${i + 1}/${links.length}] 正在提取: ${link}`);

    try {
      // 导航到页面
      window.location.hash = '';
      const fullUrl = link.startsWith('http') ? link : window.location.origin + link;

      // 使用 History API 或直接修改 href
      if (link.startsWith('/')) {
        history.pushState(null, '', link);
        // 触发路由更新（适用于大多数 SPA 框架）
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      // 等待内容加载
      await delay(1500);

      // 提取内容
      const content = extractContent();
      if (content.text && content.text.length > 50) {
        results[link] = content;
        console.log(`  ✓ 提取成功 (${content.text.length} 字符)`);
      } else {
        console.log(`  ✗ 内容太少，跳过`);
      }
    } catch (e) {
      console.log(`  ✗ 错误: ${e.message}`);
    }
  }

  // 导出结果
  console.log('\n提取完成！正在下载文件...');
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cqtai-suno-docs.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`\n完成! 共提取 ${Object.keys(results).length} 个页面`);
  console.log('文件已下载: cqtai-suno-docs.json');

  return results;
})();
