const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const mime = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
};

http.createServer((req, res) => {
    const filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }
        res.writeHead(200, {
            'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
        });
        res.end(data);
    });
}).listen(5500, () => {
    console.log('Server running at http://localhost:5500');
});
