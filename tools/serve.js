const http=require('http'),fs=require('fs'),path=require('path');
const server=http.createServer((req,res)=>{if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(__dirname,'../index.html')));});
server.listen(0,'127.0.0.1',()=>console.log('LOCAL_PREVIEW=http://127.0.0.1:'+server.address().port));
