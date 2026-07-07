const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const dataDir = path.join(dir, 'sync_data');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const mime = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.json': 'application/json',
};

// 发送 JSON 响应
function jsonRes(res, code, data) {
    res.writeHead(code, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
}

// 读取请求 body
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// API 路由处理
async function handleAPI(req, res, url, method) {
    // CORS 预检
    if (method === 'OPTIONS') {
        jsonRes(res, 204, {});
        return true;
    }

    // POST /api/save - 保存数据
    if (url === '/api/save' && method === 'POST') {
        try {
            const body = await readBody(req);
            const { key, data } = body;
            if (!key || !data) {
                jsonRes(res, 400, { ok: false, msg: '缺少 key 或 data' });
                return true;
            }
            // 用 key 的哈希作为文件名，避免路径问题
            const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
            const filePath = path.join(dataDir, safeKey + '.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 0));
            jsonRes(res, 200, { ok: true, msg: '保存成功' });
        } catch (e) {
            jsonRes(res, 500, { ok: false, msg: '服务器错误: ' + e.message });
        }
        return true;
    }

    // POST /api/load - 加载数据
    if (url === '/api/load' && method === 'POST') {
        try {
            const body = await readBody(req);
            const { key } = body;
            if (!key) {
                jsonRes(res, 400, { ok: false, msg: '缺少 key' });
                return true;
            }
            const safeKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
            const filePath = path.join(dataDir, safeKey + '.json');
            if (!fs.existsSync(filePath)) {
                jsonRes(res, 404, { ok: false, msg: '未找到数据，请先在另一台电脑上保存' });
                return true;
            }
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            jsonRes(res, 200, { ok: true, data });
        } catch (e) {
            jsonRes(res, 500, { ok: false, msg: '读取失败: ' + e.message });
        }
        return true;
    }

    return false;
}

http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost').pathname;
    const method = req.method.toUpperCase();

    // API 路由
    const isAPI = await handleAPI(req, res, url, method);
    if (isAPI) return;

    // 静态文件服务
    const filePath = path.join(dir, url === '/' ? 'index.html' : url);
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
