import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeState, readState, writeState } from './d1-state.mjs';
import { createTestDatabase } from './test-db.mjs';

test('initialization is explicit and never replaces existing content', async () => {
  const db = createTestDatabase();
  assert.equal(await readState(db), null);
  await initializeState(db, {posts: [{title: 'first'}]});
  await assert.rejects(() => initializeState(db, {posts: []}), /已经初始化/);
  assert.equal((await readState(db)).data.posts[0].title, 'first');
});

test('concurrent stale edits cannot overwrite the winning version', async () => {
  const db = createTestDatabase();
  await initializeState(db, {text: 'original'});
  const original = await readState(db);
  const newRevision = await writeState(db, original.revision, {text: 'new'});
  await assert.rejects(() => writeState(db, original.revision, {text: 'stale'}), /其他设备更新/);
  assert.deepEqual(await readState(db), {revision: newRevision, data: {text: 'new'}});
});

test('large content and Unicode survive chunk boundaries exactly', async () => {
  const db = createTestDatabase();
  const text = 'a'.repeat(199990) + '🐱' + 'b'.repeat(200020);
  await initializeState(db, {text});
  assert.equal((await readState(db)).data.text, text);
});
