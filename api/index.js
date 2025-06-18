const express = require('express');
const fetch = require('node-fetch');

const app = express();

// 添加 CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 默认仓库配置
const DEFAULT_REPO_OWNER = 'android-greenhand';
const DEFAULT_REPO_NAME = 'Logseq';

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.1.0',
    message: 'GitHub API Proxy is running (Node.js)',
    endpoints: [
      '/health',
      '/test',
      '/api/contents/{path}?owner={owner}&repo={repo}',
      '/api/commits/{path}?owner={owner}&repo={repo}'
    ],
    examples: [
      '/api/contents/README.md',
      '/api/contents/README.md?owner=facebook&repo=react',
      '/api/commits/README.md?owner=microsoft&repo=vscode'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 测试路由 - 获取默认仓库的 README.md
app.get('/test', async (req, res) => {
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    return res.status(500).json({
      error: 'GitHub token not configured',
      message: '请在 Vercel 环境变量中设置 GITHUB_TOKEN'
    });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${DEFAULT_REPO_OWNER}/${DEFAULT_REPO_NAME}/contents/README.md`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API 返回 ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    res.json({
      status: 'success',
      message: 'GitHub API 连接成功！',
      data: {
        name: data.name,
        path: data.path,
        size: data.size,
        type: data.type,
        content_preview: data.content ? data.content.substring(0, 100) + '...' : null
      }
    });
  } catch (e) {
    res.status(500).json({
      error: 'GitHub API 请求失败',
      message: e.message
    });
  }
});

app.get('/api/contents/*', async (req, res) => {
  const path = req.params[0] || '';
  const owner = req.query.owner || DEFAULT_REPO_OWNER;
  const repo = req.query.repo || DEFAULT_REPO_NAME;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return res.status(500).json({
      error: 'GitHub token not configured',
      message: '请在 Vercel 环境变量中设置 GITHUB_TOKEN'
    });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API 返回 ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({
      error: 'GitHub API 请求失败',
      message: e.message,
      details: {
        owner,
        repo,
        path
      }
    });
  }
});

app.get('/api/commits/*', async (req, res) => {
  const path = req.params[0] || '';
  const owner = req.query.owner || DEFAULT_REPO_OWNER;
  const repo = req.query.repo || DEFAULT_REPO_NAME;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return res.status(500).json({
      error: 'GitHub token not configured',
      message: '请在 Vercel 环境变量中设置 GITHUB_TOKEN'
    });
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API 返回 ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({
      error: 'GitHub API 请求失败',
      message: e.message,
      details: {
        owner,
        repo,
        path
      }
    });
  }
});

module.exports = app; 