import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API Proxy
  if (req.url === '/api/chat-messages' && req.method === 'POST') {
    try {
      const DIFY_API_URL = process.env.DIFY_API_URL;
      const DIFY_API_KEY = process.env.DIFY_API_KEY;

      // Allow overrides from headers
      const targetUrl = req.headers['x-dify-url'] || DIFY_API_URL;
      const authHeader = req.headers['authorization'] || `Bearer ${DIFY_API_KEY}`;

      if (!targetUrl || !authHeader) {
        res.statusCode = 500;
        res.end('Missing configuration');
        return;
      }

      // Read body
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const body = Buffer.concat(buffers).toString();

      const response = await fetch(`${targetUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: body,
      });

      // Stream response back
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        // @ts-ignore - response.body is iterable in Node 18+
        for await (const chunk of response.body) {
          res.write(chunk);
        }
      }
      res.end();
    } catch (error) {
      console.error('Proxy error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
    return;
  }

  // Handle Static Files
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // Check if file exists, if not fallback to index.html (SPA)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Should have been caught by existsSync check above, but just in case
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(500);
      res.end(`Server Error: ${error.code}`);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
