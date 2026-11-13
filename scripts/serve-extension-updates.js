// 极简本地更新服务：为 Chrome 强制安装提供 crx 与 update.xml
// 用法: node serve-extension-updates.js [目录]  (默认 <repo>/dist/selfhost)
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist', 'selfhost'))
const PORT = 8930

http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname)
    const filePath = path.join(ROOT, path.basename(urlPath))
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404)
        res.end('not found')
        return
    }
    const contentType = filePath.endsWith('.crx') ? 'application/x-chrome-extension' : 'text/xml'
    res.writeHead(200, { 'Content-Type': contentType })
    fs.createReadStream(filePath).pipe(res)
}).listen(PORT, '127.0.0.1', () => {
    console.log(`extension update server: http://127.0.0.1:${PORT} serving ${ROOT}`)
})
