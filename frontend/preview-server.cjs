const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const mimeTypes = {
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

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve preview.html for the root or /preview path
  if (pathname === '/' || pathname === '/preview') {
    fs.readFile(path.join(__dirname, 'public', 'preview.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading preview');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Serve static files from public directory
  let filePath = path.join(__dirname, 'public', pathname);
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve preview.html for /blog/:shareCode routes
        if (pathname.startsWith('/blog/')) {
          fs.readFile(path.join(__dirname, 'public', 'preview.html'), (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading preview');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎨 Vibe Preview Server                                  ║
║                                                           ║
║   Local Preview: http://localhost:${PORT}                    ║
║                                                           ║
║   Share Link Format:                                      ║
║   http://localhost:${PORT}/preview                          ║
║     ?template=minimal-simple                              ║
║     &image=URL_ENCODED_IMAGE                              ║
║     &name=Your%20Name                                     ║
║     &bio=Your%20Bio                                       ║
║     &content=Your%20Content                               ║
║                                                           ║
║   Example:                                                 ║
║   http://localhost:${PORT}/preview?template=glass-morphism&image=https://...  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
