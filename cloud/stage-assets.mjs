// Stage the known public application shell only. Personal data and photos are
// deliberately excluded; migration is handled separately and explicitly.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '..');
const target = path.join(here, 'public');
const files = ['index.html','app.js','config.js','style.css','home.css','editor.html','editor.js','editor.css','posts/hello-world.md','assets/wallpaper.png','assets/wallpaper-night.png','assets/uptime-mascot.png'];
await mkdir(target, {recursive:true});
for (const file of files) {
  await mkdir(path.dirname(path.join(target, file)), {recursive:true});
  await copyFile(path.join(source,file), path.join(target,file));
}
await copyFile(path.join(here, 'giscus-comments.mjs'), path.join(target, 'giscus-comments.mjs'));
await copyFile(path.join(here, 'cloud.css'), path.join(target, 'cloud.css'));
function replaceOnce(text, from, to, name) {
  if (!text.includes(from) || text.indexOf(from) !== text.lastIndexOf(from)) throw new Error(`Cannot safely adapt ${name}; inspect current source.`);
  return text.replace(from, to);
}
const indexFile = path.join(target,'index.html');
let index = (await readFile(indexFile, 'utf8')).replaceAll('\r\n', '\n');
index = replaceOnce(index, '<script src="app.js"></script>', '<script type="module" src="app.js"></script>', 'app module');
index = replaceOnce(index, '<link rel="stylesheet" href="home.css">', '<link rel="stylesheet" href="home.css">\n  <link rel="stylesheet" href="cloud.css">', 'cloud stylesheet');
await writeFile(indexFile, index);
const appFile = path.join(target,'app.js');
let app = (await readFile(appFile, 'utf8')).replaceAll('\r\n', '\n');
app = `import { createCommentScript } from './giscus-comments.mjs';\n${app}`;
app = replaceOnce(app, '  const app = document.querySelector(\'#app\');', "  const app = document.querySelector('#app');\n  let cloudAdmin = false;", 'admin state');
app = replaceOnce(app, "    if (location.hostname !== '127.0.0.1' || location.port !== '4173') return;", '    if (!cloudAdmin) return;', 'edit visibility');
const commentAnchor = "    try {\n      let content = post.body;";
const commentMount = `    const comments = app.querySelector('.comments-placeholder');
    if (comments) {
      comments.replaceChildren();
      comments.classList.add('comments-active');
      const heading = document.createElement('h3'); heading.textContent = '留言';
      const widget = document.createElement('div'); widget.className = 'giscus';
      // giscus preserves this anchor during its GitHub login redirect.
      widget.id = 'post/' + slug;
      comments.append(heading, widget);
      try {
        const route = location.hash;
        const returningFromGiscus = new URL(location.href).searchParams.has('giscus');
        const script = createCommentScript(document, slug, document.body.classList.contains('night-mode') ? 'dark' : 'light');
        script.addEventListener('load', () => {
          // giscus removes its login parameter with replaceState, also dropping the hash.
          if (returningFromGiscus && route === '#post/' + slug && !location.hash) {
            history.replaceState(history.state, '', location.pathname + location.search + route);
          }
        });
        comments.append(script);
      }
      catch { widget.textContent = '留言暂时不可用。'; }
    }
    try {
      let content = post.body;`;
app = replaceOnce(app, commentAnchor, commentMount, 'comment mount');
const bootstrap = `  const adminLink = document.createElement('a');
  adminLink.href = '/auth/login'; adminLink.textContent = '管理员登录';
  document.querySelector('footer.footer').append(adminLink);
  fetch('/api/session', {cache:'no-store'}).then(r => r.ok ? r.json() : null).then(session => {
    if (!session?.authenticated) return;
    cloudAdmin = true;
    adminLink.textContent = '退出管理'; adminLink.href = '#';
    adminLink.addEventListener('click', async event => {
      event.preventDefault();
      const result = await fetch('/auth/logout', {method:'POST',headers:{'X-Blog-Editor':'1'}});
      if (result.ok) location.reload();
    });
    render(true);
  }).catch(() => {});
`;
app = replaceOnce(app, "  document.querySelector('#year').textContent = new Date().getFullYear();", bootstrap + "  document.querySelector('#year').textContent = new Date().getFullYear();", 'admin bootstrap');
await writeFile(appFile, app);
const editorFile = path.join(target,'editor.js');
let editor = (await readFile(editorFile, 'utf8')).replaceAll('\r\n', '\n');
editor = replaceOnce(editor, "  const notice = byId('notice'); let data, avatar = '',", "  let dataVersion = '';\n  const notice = byId('notice'); let data, avatar = '',", 'editor revision state');
const oldUpload = "    const image = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('图片读取失败')); reader.readAsDataURL(file); });\n    const res = await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json','X-Blog-Editor':'1'},body:JSON.stringify({image})});";
const newUpload = "    const res = await fetch('/api/image',{method:'POST',headers:{'Content-Type':file.type,'X-Blog-Editor':'1'},body:file});";
editor = replaceOnce(editor, oldUpload, newUpload, 'binary upload');
editor = replaceOnce(editor, "    const res = await fetch('/api/data'); if (!res.ok) throw new Error('无法读取博客数据'); data = await res.json();", "    const res = await fetch('/api/data'); if (!res.ok) throw new Error('无法读取博客数据'); dataVersion = res.headers.get('ETag') || ''; data = await res.json();", 'editor load revision');
editor = replaceOnce(editor, "headers:{'Content-Type':'application/json','X-Blog-Editor':'1'},body:JSON.stringify(payload)", "headers:{'Content-Type':'application/json','X-Blog-Editor':'1','If-Match':dataVersion},body:JSON.stringify(payload)", 'editor write revision');
await writeFile(editorFile, editor);
console.log('Staged application shell and cloud adapters; personal content excluded.');
