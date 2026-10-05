// Dev network viewer. Run: npm run network  ->  open http://localhost:9090
// The app (src/lib/devNetworkLogger.ts) POSTs each fetch call to /log; this
// server keeps them in memory and pushes them to the page over SSE.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.NETWORK_VIEWER_PORT) || 9090;
const MAX_ENTRIES = 500;

const entries = [];
const clients = new Set();

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && pathname === '/log') {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      try {
        const entry = JSON.parse(raw);
        const i = entries.findIndex((e) => e.id === entry.id);
        if (i >= 0) entries[i] = entry;
        else entries.push(entry);
        if (entries.length > MAX_ENTRIES) entries.shift();
        for (const c of clients) c.write(`data: ${JSON.stringify(entry)}\n\n`);
        res.writeHead(204).end();
      } catch {
        res.writeHead(400).end();
      }
    });
    return;
  }

  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    for (const e of entries) res.write(`data: ${JSON.stringify(e)}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'POST' && pathname === '/clear') {
    entries.length = 0;
    res.writeHead(204).end();
    return;
  }

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(__dirname, 'network-viewer.html')));
    return;
  }

  res.writeHead(404).end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Network viewer: http://localhost:${PORT}`);
});
