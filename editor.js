(() => {
  const byId = id => document.getElementById(id);
  const profile = byId('profile-form'), posts = byId('post-form'), moments = byId('moment-form'), projects = byId('project-form'), about = byId('about-form'), albums = byId('album-form');
  const notice = byId('notice'); let data, avatar = '', coverWallpaper = '', postCover = '', momentImages = [], albumImages = [], uploading = false;
  const params = new URLSearchParams(location.search);
  if (params.get('embedded') === '1') document.body.classList.add('embedded');
  const message = (text,error=false) => { notice.textContent = text; notice.classList.toggle('error',error); };
  const tags = value => value.split(/[,，]/).map(x => x.trim()).filter(Boolean);
  const preview = () => { const el = byId('avatar-preview'); el.replaceChildren(); if (avatar) { const img = document.createElement('img'); img.src = avatar; img.alt = '头像预览'; el.append(img); } else el.textContent = '✳'; };
  function option(select,value,label) { const item = document.createElement('option'); item.value = value; item.textContent = label; select.append(item); }
  function refreshLists() {
    const ps = posts.elements.selection, ms = moments.elements.selection, rs = projects.elements.selection, as = albums.elements.selection;
    const pv = ps.value, mv = ms.value, rv = rs.value, av = as.value; ps.replaceChildren(); ms.replaceChildren(); rs.replaceChildren(); as.replaceChildren();
    option(ps,'','＋ 新建文章'); data.posts.forEach(p => option(ps,p.slug,p.title));
    option(ms,'-1','＋ 新建动态'); data.moments.forEach((m,i) => option(ms,String(i),`${m.date} · ${m.text.slice(0,30)}`));
    option(rs,'-1','＋ 新建项目'); data.projects.forEach((p,i) => option(rs,String(i),p.title));
    option(as,'-1','＋ 新建相册'); data.albums.forEach((a,i) => option(as,String(i),a.title));
    for (const [select,value] of [[ps,pv],[ms,mv],[rs,rv],[as,av]]) if ([...select.options].some(o => o.value === value)) select.value = value;
  }
  function loadPost() { const p = data.posts.find(item => item.slug === posts.elements.selection.value); for (const key of ['slug','title','category','excerpt','body']) posts.elements[key].value = p?.[key] || ''; posts.elements.tags.value = (p?.tags || []).join(', '); posts.elements.slug.readOnly = !!p; postCover = p?.cover || ''; byId('delete-post').hidden = !p; imagePreviews(); }
  function loadMoment() { const m = data.moments[Number(moments.elements.selection.value)]; moments.elements.text.value = m?.text || ''; moments.elements.tags.value = (m?.tags || []).join(', '); momentImages = [...(m?.images || [])]; byId('delete-moment').hidden = !m; imagePreviews(); }
  function loadAlbum() { const a = data.albums[Number(albums.elements.selection.value)]; albums.elements.title.value = a?.title || ''; albums.elements.description.value = a?.description || ''; albumImages = [...(a?.images || [])]; imagePreviews(); }
  function imagePreviews() {
    for (const [id, paths] of [['post-cover-preview', postCover ? [postCover] : []], ['moment-image-preview', momentImages], ['album-image-preview', albumImages]]) {
      const root = byId(id); root.replaceChildren();
      paths.forEach((path,index) => { const item = document.createElement('div'); item.className = 'image-preview'; const img = document.createElement('img'); img.src = path; img.alt = '图片预览'; const button = document.createElement('button'); button.type = 'button'; button.textContent = '移除'; button.setAttribute('aria-label', `移除图片 ${index + 1}`); button.addEventListener('click', () => { if (id === 'post-cover-preview') postCover = ''; else if (id === 'moment-image-preview') momentImages.splice(index,1); else albumImages.splice(index,1); imagePreviews(); }); item.append(img,button); root.append(item); });
    }
  }
  async function upload(file) {
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('请选择不超过 10 MB 的 PNG、JPG、WebP 或 GIF 图片');
    const image = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('图片读取失败')); reader.readAsDataURL(file); });
    const res = await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json','X-Blog-Editor':'1'},body:JSON.stringify({image})}); const result = await res.json(); if (!res.ok) throw new Error(result.error || '图片上传失败'); return result.url;
  }
  async function uploadFiles(input, callback) {
    if (uploading) return; uploading = true; const buttons = document.querySelectorAll('button[type=submit]'); buttons.forEach(button => button.disabled = true); message('正在添加图片…');
    try { for (const file of input.files) await callback(await upload(file)); message('图片已添加，请保存内容。'); } catch(error) { message(error.message,true); } finally { input.value = ''; uploading = false; buttons.forEach(button => button.disabled = false); }
  }
  const postFormatTools = document.querySelector('.post-format-tools');
  postFormatTools.addEventListener('mousedown', event => { if (event.target.closest('button')) event.preventDefault(); });
  postFormatTools.addEventListener('click', event => {
    const button = event.target.closest('button[data-post-format]'); if (!button) return;
    const field = posts.elements.body, position = field.selectionStart;
    const start = position === 0 ? 0 : field.value.lastIndexOf('\n', position - 1) + 1;
    const endAt = field.value.indexOf('\n', position), end = endAt < 0 ? field.value.length : endAt;
    const line = field.value.slice(start, end).replace(/^#{1,3}\s+/, '');
    const level = Number(button.dataset.postFormat), prefix = level ? '#'.repeat(level) + ' ' : '';
    field.setRangeText(prefix + line, start, end, 'end'); field.focus();
  });
  byId('post-cover-file').addEventListener('change', e => uploadFiles(e.target, async url => { postCover = url; imagePreviews(); }));
  byId('remove-post-cover').addEventListener('click', () => { postCover = ''; imagePreviews(); });
  byId('post-image-file').addEventListener('change', e => { const field = posts.elements.body; let position = field.selectionStart; uploadFiles(e.target, async url => { const value = `\n![文章图片](${url})\n`; field.setRangeText(value, position, position, 'end'); position += value.length; }); });
  byId('moment-image-file').addEventListener('change', e => { if (momentImages.length + e.target.files.length > 9) { message('一条动态最多添加 9 张图片',true); e.target.value = ''; return; } uploadFiles(e.target, async url => { momentImages.push(url); imagePreviews(); }); });
  byId('album-image-file').addEventListener('change', e => { if (albumImages.length + e.target.files.length > 50) { message('每本相册最多添加 50 张照片',true); e.target.value = ''; return; } uploadFiles(e.target, async url => { albumImages.push(url); imagePreviews(); }); });
  function loadProject() { const p = data.projects[Number(projects.elements.selection.value)]; for (const key of ['title','description','category','url']) projects.elements[key].value = p?.[key] || ''; }
  async function load() {
    const res = await fetch('/api/data'); if (!res.ok) throw new Error('无法读取博客数据'); data = await res.json();
    const p = data.profile || {}, settings = data.settings || {};
    profile.elements.name.value = p.name || ''; profile.elements.signature.value = p.signature || ''; profile.elements.tags.value = (p.tags || []).join(', '); avatar = p.avatar || ''; preview();
    profile.elements.title.value = settings.title || ''; profile.elements.description.value = settings.description || '';
    profile.elements.coverQuote.value = settings.coverQuote || ''; profile.elements.coverAuthor.value = settings.coverAuthor || ''; coverWallpaper = settings.coverWallpaper || '';
    about.elements.about.value = settings.about || ''; about.elements.github.value = settings.github || ''; about.elements.interests.value = (settings.interests || []).join(', ');
    about.elements.timeline.value = (settings.timeline || []).map(x => `${x.date} | ${x.title} | ${x.text}`).join('\n'); refreshLists();
  }
  async function save(payload) { const res = await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json','X-Blog-Editor':'1'},body:JSON.stringify(payload)}); const result = await res.json(); if (!res.ok) throw new Error(result.error || '保存失败'); if (window.parent !== window) window.parent.postMessage({type:'blog-editor-saved'}, location.origin); await load(); message('已保存，关闭面板后页面会更新。'); }
  function selectPanel(panel) { document.querySelectorAll('.editor-nav button').forEach(b => b.classList.toggle('selected',b.dataset.panel === panel)); document.querySelectorAll('.editor-panel').forEach(p => p.hidden = p.id !== panel); message(''); }
  document.querySelector('.editor-nav').addEventListener('click', e => { const button = e.target.closest('button'); if (button) selectPanel(button.dataset.panel); });
  byId('avatar-file').addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; if (file.size > 1024*1024 || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) { message('请选择不超过 1 MB 的 PNG、JPG、WebP 或 GIF 图片。',true); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => { avatar = reader.result; preview(); }; reader.readAsDataURL(file); });
  byId('remove-avatar').addEventListener('click',() => { avatar = ''; byId('avatar-file').value = ''; preview(); });
  byId('cover-file').addEventListener('change', e => { const file=e.target.files[0]; if (!file) return; if(file.size>3*1024*1024 || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)){message('请选择不超过 3 MB 的 PNG、JPG、WebP 或 GIF 图片。',true);e.target.value='';return} const reader=new FileReader(); reader.onload=()=>{coverWallpaper=reader.result}; reader.readAsDataURL(file); });
  byId('remove-cover').addEventListener('click',()=>{coverWallpaper='';byId('cover-file').value='';message('已选择默认壁纸，保存后生效。');});
  profile.addEventListener('submit',async e => { e.preventDefault(); try { await save({kind:'profile',name:profile.elements.name.value,signature:profile.elements.signature.value,tags:tags(profile.elements.tags.value),title:profile.elements.title.value,description:profile.elements.description.value,coverQuote:profile.elements.coverQuote.value,coverAuthor:profile.elements.coverAuthor.value,coverWallpaper,avatar}); } catch(error) { message(error.message,true); } });
  posts.elements.selection.addEventListener('change',loadPost); moments.elements.selection.addEventListener('change',loadMoment); projects.elements.selection.addEventListener('change',loadProject); albums.elements.selection.addEventListener('change',loadAlbum);
  posts.addEventListener('submit',async e => { e.preventDefault(); try { const payload = {kind:'post'}; for (const key of ['slug','title','category','excerpt','body']) payload[key] = posts.elements[key].value; payload.tags = tags(posts.elements.tags.value); payload.cover = postCover; await save(payload); posts.elements.selection.value = payload.slug; loadPost(); } catch(error) { message(error.message,true); } });
  moments.addEventListener('submit',async e => { e.preventDefault(); try { const index = Number(moments.elements.selection.value); await save({kind:'moment',index,text:moments.elements.text.value,tags:tags(moments.elements.tags.value),images:momentImages}); moments.elements.selection.value = String(index < 0 ? 0 : index); loadMoment(); } catch(error) { message(error.message,true); } });
  byId('delete-post').addEventListener('click',async () => { const p = data.posts.find(item => item.slug === posts.elements.selection.value); if (!p || !confirm(`确定删除文章“${p.title}”？删除后无法从编辑器恢复。`)) return; try { await save({kind:'delete-post',slug:p.slug}); posts.elements.selection.value = ''; loadPost(); message('文章已删除，上传的图片文件保留在本机。'); } catch(error) { message(error.message,true); } });
  byId('delete-moment').addEventListener('click',async () => { const index = Number(moments.elements.selection.value), m = data.moments[index]; if (!m || !confirm('确定删除这条动态？删除后无法从编辑器恢复。')) return; try { await save({kind:'delete-moment',index,date:m.date,text:m.text}); moments.elements.selection.value = '-1'; loadMoment(); message('动态已删除，上传的图片文件保留在本机。'); } catch(error) { message(error.message,true); } });
  albums.addEventListener('submit',async e => { e.preventDefault(); try { const index = Number(albums.elements.selection.value); await save({kind:'album',index,title:albums.elements.title.value,description:albums.elements.description.value,images:albumImages}); albums.elements.selection.value = String(index < 0 ? 0 : index); loadAlbum(); } catch(error) { message(error.message,true); } });
  projects.addEventListener('submit',async e => { e.preventDefault(); try { const index = Number(projects.elements.selection.value), payload = {kind:'project',index}; for (const key of ['title','description','category','url']) payload[key] = projects.elements[key].value; await save(payload); projects.elements.selection.value = String(index < 0 ? 0 : index); loadProject(); } catch(error) { message(error.message,true); } });
  about.addEventListener('submit',async e => { e.preventDefault(); try { const timeline = about.elements.timeline.value.split('\n').filter(line => line.trim()).map(line => { const [date='',title='',...rest] = line.split('|'); return {date,title,text:rest.join('|')}; }); await save({kind:'about',about:about.elements.about.value,github:about.elements.github.value,interests:tags(about.elements.interests.value),timeline}); } catch(error) { message(error.message,true); } });
  load().then(() => { if (params.get('slug')) posts.elements.selection.value = params.get('slug'); loadPost(); loadMoment(); loadProject(); loadAlbum(); if (['profile','posts','moments','albums','projects','about'].includes(params.get('panel'))) selectPanel(params.get('panel')); }).catch(error => message(error.message,true));
})();
