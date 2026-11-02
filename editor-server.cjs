// 仅在本机运行的博客编辑器；无需第三方依赖。
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = __dirname;
const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const dataPath = path.join(root, 'blog-data.js');
if (!fs.existsSync(dataPath)) fs.copyFileSync(path.join(root, 'blog-data.example.js'), dataPath, fs.constants.COPYFILE_EXCL);
const initialContext = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), initialContext, {timeout:1000});
const initial = JSON.parse(JSON.stringify(initialContext.window.BLOG));
function readData() {
  const content = fs.readFileSync(dataPath,'utf8');
  const match = content.match(/^window\.BLOG_DATA\s*=\s*([\s\S]*);\s*$/);
  if (!match) throw new Error('数据文件格式无效，请检查 blog-data.js');
  return JSON.parse(match[1]);
}
function writeData(data) {
  const temp = dataPath + '.tmp';
  fs.writeFileSync(temp, `window.BLOG_DATA = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
  fs.renameSync(temp, dataPath);
}
function fullData() {
  const data = readData();
  if (!Array.isArray(data.posts)) data.posts = initial.posts;
  if (!Array.isArray(data.moments)) data.moments = initial.moments;
  if (!Array.isArray(data.projects)) data.projects = initial.projects;
  if (!Array.isArray(data.albums)) data.albums = [];
  data.settings = {...Object.fromEntries(['title','description','about','interests','timeline','github'].map(key => [key,initial[key]])), ...(data.settings || {})};
  return data;
}
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function nowMinute() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function text(value, max = 5000) { if (typeof value !== 'string' || value.length > max) throw new Error('输入内容无效或过长'); return value.trim(); }
function list(value) { if (!Array.isArray(value) || value.length > 30) throw new Error('标签格式无效'); return value.map(v => text(v, 40)).filter(Boolean); }
function imagePath(value) { if (typeof value !== 'string' || (value && !/^\/personal\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(value))) throw new Error('图片路径无效'); return value; }
function postBody(post) {
  if (typeof post.body === 'string') return post.body;
  if (!/^posts\/[a-zA-Z0-9_-]+\.md$/.test(post.file || '')) throw new Error('文章路径无效');
  return fs.readFileSync(path.join(root,post.file),'utf8');
}
function reply(res, status, body, type = 'application/json; charset=utf-8') { res.writeHead(status, {'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); }
const files = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/home.css':'home.css','/app.js':'app.js','/config.js':'config.js','/blog-data.js':'blog-data.js','/editor':'editor.html','/editor.html':'editor.html','/editor.js':'editor.js','/editor.css':'editor.css','/assets/wallpaper.png':'assets/wallpaper.png','/personal/character.png':'personal/character.png','/personal/character-mask.png':'personal/character-mask.png'};
http.createServer((req,res) => {
  try {
    const pathname = new URL(req.url,origin).pathname;
    if (req.method === 'GET' && pathname === '/api/data') { const data = fullData(); data.posts = data.posts.map(p => ({...p,body:postBody(p)})); return reply(res,200,data); }
    if (req.method === 'POST' && pathname === '/api/image') {
      if (req.headers.origin !== origin || req.headers['x-blog-editor'] !== '1' || !String(req.headers['content-type']).startsWith('application/json')) return reply(res,403,{error:'请求来源无效'});
      let body = ''; req.setEncoding('utf8');
      req.on('data', chunk => { body += chunk; if (body.length > 14500000) req.destroy(); });
      req.on('end', () => { try {
        const match = JSON.parse(body).image?.match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
        if (!match) throw new Error('请选择 PNG、JPG、WebP 或 GIF 图片');
        const bytes = Buffer.from(match[2], 'base64');
        if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('图片不能超过 10 MB');
        const signatures = {png: () => bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')), jpeg: () => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255, gif: () => /^GIF8[79]a$/.test(bytes.subarray(0,6).toString('ascii')), webp: () => bytes.subarray(0,4).toString('ascii') === 'RIFF' && bytes.subarray(8,12).toString('ascii') === 'WEBP'};
        if (!signatures[match[1]]()) throw new Error('图片文件内容与格式不符');
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const name = `${crypto.randomUUID()}.${ext}`;
        const dir = path.join(root, 'personal', 'uploads'); fs.mkdirSync(dir, {recursive:true});
        fs.writeFileSync(path.join(dir,name),bytes,{flag:'wx'});
        reply(res,200,{url:`/personal/uploads/${name}`});
      } catch(error) { reply(res,400,{error:error.message}); } });
      return;
    }
    if (req.method === 'POST' && pathname === '/api/save') {
      if (req.headers.origin !== origin || req.headers['x-blog-editor'] !== '1' || !String(req.headers['content-type']).startsWith('application/json')) return reply(res,403,{error:'请求来源无效'});
      let body = ''; req.setEncoding('utf8');
      req.on('data',chunk => { body += chunk; if (body.length > 8000000) req.destroy(); });
      req.on('end',() => { try {
        const payload = JSON.parse(body), data = readData();
        data.activity ||= {};
        if (payload.kind === 'profile') {
          const avatar = payload.avatar || '';
          if (typeof avatar !== 'string' || avatar.length > 1400000 || (avatar && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar))) throw new Error('头像格式无效或图片过大');
          data.profile = {name:text(payload.name,80),signature:text(payload.signature,300),tags:list(payload.tags),avatar};
          if (typeof payload.title === 'string' && typeof payload.description === 'string') { data.settings ||= {}; data.settings.title = text(payload.title,120); data.settings.description = text(payload.description,500); }
          if (typeof payload.coverQuote === 'string' && typeof payload.coverAuthor === 'string') { data.settings ||= {}; data.settings.coverQuote = text(payload.coverQuote,120); data.settings.coverAuthor = text(payload.coverAuthor,120); }
          if (typeof payload.coverWallpaper === 'string') { const wall = payload.coverWallpaper; if (wall.length > 4200000 || (wall && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(wall))) throw new Error('壁纸格式无效或图片过大'); data.settings ||= {}; data.settings.coverWallpaper = wall; }
        } else if (payload.kind === 'post') {
          if (!Array.isArray(data.posts)) data.posts = initial.posts;
          const slug = text(payload.slug,80); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('文章标识只能包含小写字母、数字和连字符');
          const title = text(payload.title,150), content = text(payload.body,200000); if (!title || !content) throw new Error('请填写标题和文章内容');
          const index = data.posts.findIndex(p => p.slug === slug), old = data.posts[index];
          const cover = imagePath(payload.cover || '');
          const section = payload.section === undefined ? (old?.section === 'talk' ? 'talk' : 'posts') : payload.section;
          if (!['posts','talk'].includes(section)) throw new Error('文章栏目无效');
          const next = {slug,title,date:old?.date || nowMinute(),category:text(payload.category,40) || '随笔',tags:list(payload.tags),excerpt:text(payload.excerpt,300),reading:old?.reading || '阅读文章',body:content,cover,section};
          const comparable = old && {slug:old.slug,title:old.title,date:old.date,category:old.category,tags:old.tags || [],excerpt:old.excerpt,reading:old.reading || '阅读文章',body:postBody(old).trim(),cover:old.cover || '',section:old.section === 'talk' ? 'talk' : 'posts'};
          if (JSON.stringify(next) !== JSON.stringify(comparable)) { if (index < 0) data.posts.unshift(next); else data.posts[index] = next; data.activity[today()] = (data.activity[today()] || 0) + 1; }
        } else if (payload.kind === 'moment') {
          if (!Array.isArray(data.moments)) data.moments = initial.moments;
          const content = text(payload.text,5000); if (!content) throw new Error('请填写动态内容');
          const index = Number(payload.index); if (!Number.isInteger(index) || index < -1 || index >= data.moments.length) throw new Error('动态不存在');
          const old = index < 0 ? null : data.moments[index]; const images = payload.images || []; if (!Array.isArray(images) || images.length > 9) throw new Error('一条动态最多添加 9 张图片'); const next = {date:old?.date || nowMinute(),text:content,tags:list(payload.tags),images:images.map(imagePath)};
          const comparable = old && {...old, images:old.images || []};
          if (JSON.stringify(next) !== JSON.stringify(comparable)) { if (index < 0) data.moments.unshift(next); else data.moments[index] = next; data.activity[today()] = (data.activity[today()] || 0) + 1; }
        } else if (payload.kind === 'delete-post') {
          if (!Array.isArray(data.posts)) data.posts = initial.posts;
          const slug = text(payload.slug,80), index = data.posts.findIndex(p => p.slug === slug);
          if (index < 0) throw new Error('文章不存在，请刷新后重试');
          data.posts.splice(index,1);
        } else if (payload.kind === 'delete-moment') {
          if (!Array.isArray(data.moments)) data.moments = initial.moments;
          const index = Number(payload.index), old = data.moments[index];
          if (!Number.isInteger(index) || index < 0 || !old || old.date !== payload.date || old.text !== payload.text) throw new Error('动态已变化或不存在，请刷新后重试');
          data.moments.splice(index,1);
        } else if (payload.kind === 'album') {
          if (!Array.isArray(data.albums)) data.albums = [];
          const index = Number(payload.index);
          if (!Number.isInteger(index) || index < -1 || index >= data.albums.length) throw new Error('相册不存在');
          const title = text(payload.title,120), description = text(payload.description || '',500), images = payload.images;
          if (!title) throw new Error('请填写相册名称');
          if (!Array.isArray(images) || images.length < 1 || images.length > 50) throw new Error('相册需要 1 至 50 张照片');
          const checked = images.map(imagePath); if (checked.some(x => !x)) throw new Error('照片路径无效');
          const old = index < 0 ? null : data.albums[index];
          const next = {title,description,date:old?.date || today(),images:checked};
          if (index < 0) data.albums.unshift(next); else data.albums[index] = next;
        } else if (payload.kind === 'home') {
          data.settings ||= {};
          data.settings.title = text(payload.title,120);
          data.settings.description = text(payload.description,500);
        } else if (payload.kind === 'about') {
          data.settings ||= {};
          data.settings.about = text(payload.about,5000);
          const github = text(payload.github,1000); if (github && !/^https?:\/\//i.test(github)) throw new Error('链接须以 http:// 或 https:// 开头'); data.settings.github = github;
          data.settings.interests = list(payload.interests);
          if (!Array.isArray(payload.timeline) || payload.timeline.length > 50) throw new Error('经历格式无效');
          data.settings.timeline = payload.timeline.map(row => ({date:text(row.date,80),title:text(row.title,150),text:text(row.text,1000)}));
        } else if (payload.kind === 'project') {
          if (!Array.isArray(data.projects)) data.projects = initial.projects;
  if (!Array.isArray(data.albums)) data.albums = [];
          const index = Number(payload.index); if (!Number.isInteger(index) || index < -1 || index >= data.projects.length) throw new Error('项目不存在');
          const title = text(payload.title,150), url = text(payload.url,1000); if (!title) throw new Error('请填写项目名称');
          if (url && !/^https?:\/\//i.test(url)) throw new Error('链接须以 http:// 或 https:// 开头');
          const next = {title,description:text(payload.description,1000),category:text(payload.category,40) || '收藏',url};
          if (index < 0) data.projects.unshift(next); else data.projects[index] = next;
        } else throw new Error('未知的保存类型');
        writeData(data); reply(res,200,{ok:true});
      } catch(error) { reply(res,400,{error:error.message}); } });
      return;
    }
    if (req.method !== 'GET') return reply(res,405,'Method not allowed','text/plain; charset=utf-8');
    let file = files[pathname]; if (!file && /^\/posts\/[a-zA-Z0-9_-]+\.md$/.test(pathname)) file = pathname.slice(1);
    if (!file && /^\/personal\/wallpapers\/wallpaper-[0-9]{2}\.png$/.test(pathname)) file = pathname.slice(1);
    if (!file && /^\/personal\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(pathname)) file = pathname.slice(1);
    if (!file) return reply(res,404,'Not found','text/plain; charset=utf-8');
    const ext = path.extname(file); const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.webp':'image/webp'};
    if (!fs.existsSync(path.join(root,file))) return reply(res,404,'Not found','text/plain; charset=utf-8');
    reply(res,200,['.png','.jpg','.gif','.webp'].includes(ext) ? fs.readFileSync(path.join(root,file)) : fs.readFileSync(path.join(root,file),'utf8'),types[ext] || 'text/plain; charset=utf-8');
  } catch(error) { reply(res,500,{error:error.message}); }
}).listen(port,'127.0.0.1',() => console.log(`博客编辑器：${origin}/editor\n博客预览：${origin}/`));
