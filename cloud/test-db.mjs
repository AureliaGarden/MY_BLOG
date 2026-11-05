import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function createTestDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const prepare = sql => {
    const statement = sqlite.prepare(sql);
    let args = [];
    const wrapper = {
      bind(...values) { args = values; return wrapper; },
      async all() { return {results: statement.all(...args)}; },
      run() { return {meta: {changes: statement.run(...args).changes}}; },
    };
    return wrapper;
  };
  return {prepare, async batch(statements) {
    sqlite.exec('BEGIN');
    try { const result = statements.map(statement => statement.run()); sqlite.exec('COMMIT'); return result; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  }};
}
