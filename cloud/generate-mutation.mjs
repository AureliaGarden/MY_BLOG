// Prepare an isolated cloud adapter from the existing, locally maintained
// validation and editing rules. Does not alter the user's project or data.
import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('../editor-server.cjs', import.meta.url), 'utf8');
const start = source.indexOf('        data.activity ||= {};');
const end = source.indexOf('        writeData(data); reply(res,200,{ok:true});', start);
if (start < 0 || end < 0) throw new Error('The local editor structure changed; inspect it before adapting.');
const rules = source.slice(start, end);
const prefix = String.raw`
// Generated from the local editor's validated mutation rules.
const initial = {posts: [], moments: [], projects: []};
function timestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return {day: p.year + '-' + p.month + '-' + p.day, minute: p.year + '-' + p.month + '-' + p.day + ' ' + p.hour + ':' + p.minute};
}
function today() { return timestamp().day; }
function nowMinute() { return timestamp().minute; }
function recordUpdate(data, entry) {
  if (data.activityLog == null) data.activityLog = [];
  if (!Array.isArray(data.activityLog)) throw new Error('更新日志格式无效');
  data.activityLog.unshift({id:crypto.randomUUID(), at:nowMinute(), ...entry});
}
function text(value, max = 5000) { if (typeof value !== 'string' || value.length > max) throw new Error('输入内容无效或过长'); return value.trim(); }
function list(value) { if (!Array.isArray(value) || value.length > 30) throw new Error('标签格式无效'); return value.map(v => text(v, 40)).filter(Boolean); }
function imagePath(value) { if (typeof value !== 'string' || (value && !/^\/personal\/uploads\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(value))) throw new Error('图片路径无效'); return value; }
function postBody(post) { if (typeof post.body !== 'string') throw new Error('文章正文尚未迁移'); return post.body; }
export function applyMutation(original, payload) {
  if (!original || typeof original !== 'object' || !payload || typeof payload !== 'object') throw new Error('请求数据无效');
  const data = structuredClone(original);
`;
const suffix = '\n  return data;\n}\n';
await writeFile(new URL('./mutate-blog.mjs', import.meta.url), prefix + rules + suffix, 'utf8');
console.log('Generated isolated mutation adapter from the current editor rules.');
