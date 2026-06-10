import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple API Key Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Proxy for GitHub API
  app.get('/api/github/*/*', async (req, res) => {
    try {
      const url = `https://api.github.com/${req.params[0]}/${req.params[1]}`;
      // Prefer header token over env token for client-side configuration
      const tokenHeader = req.headers['x-github-token'] || req.headers.authorization;
      const tokenRaw = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
      const token = tokenRaw?.replace('Bearer ', '') || process.env.GITHUB_ACCESS_TOKEN;
      
      if (!token) return res.status(401).json({ error: 'GITHUB_ACCESS_TOKEN not configured or provided via headers.' });
      
      const response = await axios({
        method: req.method,
        url: url + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'GitHub API error' });
    }
  });

  // Proxy for Jira API
  app.all('/api/jira/*', async (req, res) => {
    try {
      const domainHeader = req.headers['x-jira-domain'];
      const domain = domainHeader ? (Array.isArray(domainHeader) ? domainHeader[0] : domainHeader) : process.env.JIRA_DOMAIN;
      
      const emailHeader = req.headers['x-jira-email'];
      const email = emailHeader ? (Array.isArray(emailHeader) ? emailHeader[0] : emailHeader) : process.env.JIRA_USER_EMAIL;
      
      const tokenHeader = req.headers['x-jira-token'];
      const token = tokenHeader ? (Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader) : process.env.JIRA_API_TOKEN;
      
      if (!domain || !email || !token) return res.status(401).json({ error: 'JIRA config missing' });

      // example: /api/jira/rest/api/3/search -> https://{domain}/rest/api/3/search
      const pathPart = req.params[0];
      const url = `https://${domain}/${pathPart}`;

      const basicAuth = Buffer.from(`${email}:${token}`).toString('base64');
      const response = await axios({
        method: req.method,
        url: url + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''),
        data: req.body,
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: 'Jira API error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
