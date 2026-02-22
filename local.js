const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 4000);
const PUBLIC_DIR = path.join(__dirname, 'public');

const apiHandlers = {
  '/api/state': require('./api/state'),
  '/api/claim': require('./api/claim')
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function serveStatic(req, res, pathname) {
  const urlPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(urlPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(content);
  });
}

function collectJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function createVercelLikeRes(nodeRes) {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      const statusCode = this.statusCode || 200;
      nodeRes.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      nodeRes.end(JSON.stringify(payload));
    }
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsed.pathname;

    if (pathname.startsWith('/api/')) {
      const handler = apiHandlers[pathname];
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: 'Not found' }));
        return;
      }

      if (req.method === 'POST') {
        req.body = await collectJsonBody(req);
      }

      const vRes = createVercelLikeRes(res);
      await handler(req, vRes);
      return;
    }

    if (req.method === 'GET') {
      serveStatic(req, res, pathname);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: err.message || 'Server error' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Local dev server running at http://${HOST}:${PORT}`);
  console.log(`Timezone: ${process.env.RESET_TIMEZONE || 'Asia/Seoul'}`);
});
