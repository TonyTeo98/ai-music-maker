#!/usr/bin/env node
/**
 * CQTAI API 文档爬虫
 * 用法: node scripts/crawl-cqtai-docs.js
 * 输出: scripts/cqtai-docs.json
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://docs.cqtai.com';

// Suno 相关的端点路径（根据截图整理）
const SUNO_ENDPOINTS = [
  '/suno',
  '/suno/suno生成',
  '/suno/suno延长音乐',
  '/suno/suno生成-扩展延长',
  '/suno/suno生成-替换音乐',
  '/suno/suno生成-从URL生成音乐',
  '/suno/suno生成-从音频ID生成音乐',
  '/suno/suno生成-合并音乐',
  '/suno/suno生成-覆盖音乐',
  '/suno/suno生成mp4',
  '/suno/suno生成歌词',
  '/suno/suno生成图片',
  '/suno/suno采样标签',
  '/suno/suno上传',
  '/suno/suno获取结果',
  '/suno/suno获取歌词结果',
  '/suno/suno获取上传结果',
  '/suno/suno获取歌曲歌词timing',
  '/suno/suno获取歌曲节拍',
  '/suno/suno获取Mp4结果',
  '/suno/suno格式化wav',
  '/suno/suno获取分离人声结果',
  '/suno/suno获取生成音轨结果',
  '/suno/suno生成-persona',
  '/suno/suno生成-扩展功能可附带persona',
  '/suno/suno生成-分离人声',
  '/suno/suno生成-生成音轨',
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetch(redirectUrl).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, url }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// 从 HTML 中提取文本内容
function extractContent(html) {
  // 移除 script 和 style
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 提取 main 或 article 内容
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || text.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (mainMatch) {
    text = mainMatch[1];
  }

  // 保留代码块
  const codeBlocks = [];
  text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    codeBlocks.push(code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    return `\n\`\`\`\n{{CODE_BLOCK_${codeBlocks.length - 1}}}\n\`\`\`\n`;
  });

  // 转换常见标签
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // 移除剩余标签
  text = text.replace(/<[^>]+>/g, ' ');

  // 还原代码块
  codeBlocks.forEach((code, i) => {
    text = text.replace(`{{CODE_BLOCK_${i}}}`, code);
  });

  // 清理
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');

  return text.trim();
}

// 从页面提取所有链接
function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith('/') && !href.startsWith('//')) {
      links.push(new URL(href, baseUrl).href);
    } else if (href.startsWith(baseUrl)) {
      links.push(href);
    }
  }
  return [...new Set(links)];
}

async function crawl() {
  const results = {};
  const visited = new Set();
  const toVisit = [];

  // 先尝试获取首页，提取真实链接
  console.log('正在获取首页链接...');
  try {
    const indexRes = await fetch(`${BASE_URL}/suno`);
    if (indexRes.status === 200) {
      const links = extractLinks(indexRes.body, BASE_URL);
      const sunoLinks = links.filter(l => l.includes('/suno'));
      console.log(`发现 ${sunoLinks.length} 个 suno 相关链接`);
      toVisit.push(...sunoLinks);
    }
  } catch (e) {
    console.log('首页获取失败，使用预定义路径');
  }

  // 添加预定义路径
  for (const path of SUNO_ENDPOINTS) {
    const url = `${BASE_URL}${encodeURI(path)}`;
    if (!toVisit.includes(url)) {
      toVisit.push(url);
    }
  }

  console.log(`\n开始爬取 ${toVisit.length} 个页面...\n`);

  for (const url of toVisit) {
    if (visited.has(url)) continue;
    visited.add(url);

    const shortUrl = url.replace(BASE_URL, '');
    process.stdout.write(`爬取: ${decodeURI(shortUrl)} ... `);

    try {
      const res = await fetch(url);
      if (res.status === 200) {
        const content = extractContent(res.body);
        if (content.length > 100) {
          results[decodeURI(shortUrl)] = content;
          console.log(`✓ (${content.length} 字符)`);
        } else {
          console.log('✗ (内容太少)');
        }
      } else {
        console.log(`✗ (${res.status})`);
      }
    } catch (e) {
      console.log(`✗ (${e.message})`);
    }

    // 礼貌延迟
    await new Promise(r => setTimeout(r, 500));
  }

  // 保存结果
  const fs = require('fs');
  const outputPath = __dirname + '/cqtai-docs.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n完成! 共爬取 ${Object.keys(results).length} 个页面`);
  console.log(`输出文件: ${outputPath}`);

  // 同时输出 markdown 版本方便阅读
  const mdPath = __dirname + '/cqtai-docs.md';
  let md = '# CQTAI Suno API 文档\n\n';
  for (const [path, content] of Object.entries(results)) {
    md += `\n---\n\n## ${path}\n\n${content}\n`;
  }
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`Markdown: ${mdPath}`);
}

crawl().catch(console.error);
