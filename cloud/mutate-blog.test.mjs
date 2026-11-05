import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMutation } from './mutate-blog.mjs';

function empty() { return {profile:{}, posts:[], moments:[], albums:[], projects:[], settings:{}, activity:{}, activityLog:[]}; }
test('post create, update and stale deletion preserve other content', () => {
  const payload = {kind:'post',slug:'my-post',title:'示例',body:'正文',category:'随笔',tags:['测试'],excerpt:'',cover:'',section:'posts'};
  const source = empty();
  const created = applyMutation(source, payload);
  assert.equal(source.posts.length, 0);
  assert.equal(created.posts[0].body, '正文');
  assert.equal(created.activityLog[0].action, 'create');
  const updated = applyMutation(created, {...payload, body:'修改后'});
  assert.equal(updated.posts[0].body, '修改后');
  assert.equal(updated.activityLog[0].action, 'update');
  assert.throws(() => applyMutation(updated, {kind:'delete-post',slug:'missing'}), /不存在/);
});
test('album mutations reject stale deletes and invalid image paths', () => {
  const album = {kind:'album',index:-1,title:'相册',description:'',images:[]};
  const created = applyMutation(empty(), album);
  assert.throws(() => applyMutation(created, {kind:'delete-album',index:0,album:{title:'different'}}), /已变化/);
  assert.throws(() => applyMutation(empty(), {...album, images:['https://invalid.example/image.png']}), /路径无效/);
  const removed = applyMutation(created, {kind:'delete-album',index:0,album:created.albums[0]});
  assert.equal(removed.albums.length, 0);
});
test('profile, moments and project edits keep their existing validation', () => {
  let data = applyMutation(empty(), {kind:'profile',name:'name',signature:'sig',tags:['tag'],avatar:''});
  data = applyMutation(data, {kind:'moment',index:-1,text:'moment',tags:[],images:[],mood:'☀ 开心'});
  data = applyMutation(data, {kind:'project',index:-1,title:'project',description:'',category:'',url:'https://example.com'});
  assert.equal(data.profile.name, 'name');
  assert.equal(data.moments[0].text, 'moment');
  assert.equal(data.projects[0].title, 'project');
  assert.throws(() => applyMutation(data, {kind:'project',index:-1,title:'bad',description:'',category:'',url:'javascript:alert(1)'}), /链接须以/);
});
