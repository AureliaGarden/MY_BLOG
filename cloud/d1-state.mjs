// Up to 40 chunks for the 8M document limit, leaving room for the pointer
// update and cleanup under the Workers Free subrequest ceiling.
const CHUNK_CHARS = 200_000;
const MAX_DOCUMENT_CHARS = 8_000_000;

function chunksFor(document) {
  const serialized = JSON.stringify(document);
  if (typeof serialized !== 'string' || serialized.length > MAX_DOCUMENT_CHARS) throw new Error('博客数据过大');
  const chunks = [];
  for (let i = 0; i < serialized.length;) {
    let end = Math.min(i + CHUNK_CHARS, serialized.length);
    const last = serialized.charCodeAt(end - 1);
    if (end < serialized.length && last >= 0xD800 && last <= 0xDBFF) end--;
    chunks.push(serialized.slice(i, end));
    i = end;
  }
  return chunks;
}

// A single SELECT obtains a consistent snapshot even while another save runs.
export async function readState(db) {
  const result = await db.prepare('SELECT m.revision, c.ordinal, c.content FROM blog_meta m JOIN blog_chunks c ON c.revision = m.revision WHERE m.id = 1 ORDER BY c.ordinal').all();
  const rows = result.results || [];
  if (!rows.length) return null;
  if (rows.some((row, index) => row.ordinal !== index || row.revision !== rows[0].revision)) throw new Error('博客数据不完整');
  return {revision: rows[0].revision, data: JSON.parse(rows.map(row => row.content).join(''))};
}

// Initialization is deliberately explicit: runtime requests never silently
// replace an uninitialized production database with sample content.
export async function initializeState(db, document) {
  const revision = crypto.randomUUID();
  const parts = chunksFor(document);
  const statements = parts.map((part, index) => db.prepare('INSERT INTO blog_chunks (revision, ordinal, content) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM blog_meta WHERE id = 1)').bind(revision, index, part));
  statements.push(db.prepare('INSERT OR IGNORE INTO blog_meta (id, revision) VALUES (1, ?)').bind(revision));
  const results = await db.batch(statements);
  if (results.at(-1)?.meta?.changes !== 1) throw new Error('数据库已经初始化');
}

// The compare-and-swap avoids silently overwriting an edit from another device.
export async function writeState(db, expectedRevision, document) {
  if (typeof expectedRevision !== 'string' || !expectedRevision) throw new Error('缺少数据版本');
  const revision = crypto.randomUUID();
  const parts = chunksFor(document);
  const statements = parts.map((part, index) => db.prepare('INSERT INTO blog_chunks (revision, ordinal, content) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM blog_meta WHERE id = 1 AND revision = ?)').bind(revision, index, part, expectedRevision));
  statements.push(db.prepare('UPDATE blog_meta SET revision = ? WHERE id = 1 AND revision = ?').bind(revision, expectedRevision));
  statements.push(db.prepare('DELETE FROM blog_chunks WHERE revision <> (SELECT revision FROM blog_meta WHERE id = 1)'));
  const results = await db.batch(statements);
  if (results.at(-2)?.meta?.changes !== 1) throw new Error('内容已在其他设备更新，请刷新后重试');
  return revision;
}
