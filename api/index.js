const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    message: 'GitHub API Proxy is running (Node.js)',
    endpoints: [
      '/health',
      '/api/contents/{path}',
      '/api/commits/{path}'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/contents/*', async (req, res) => {
  const path = req.params[0] || '';
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = 'android-greenhand';
  const repoName = 'Logseq';

  if (!githubToken) {
    return res.status(500).send('Error: GitHub token not configured');
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    const data = await response.text();
    res.type('json').send(data);
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
});

app.get('/api/commits/*', async (req, res) => {
  const path = req.params[0] || '';
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = 'android-greenhand';
  const repoName = 'Logseq';

  if (!githubToken) {
    return res.status(500).send('Error: GitHub token not configured');
  }

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/commits?path=${encodeURIComponent(path)}&per_page=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    const data = await response.text();
    res.type('json').send(data);
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
});

module.exports = app; 