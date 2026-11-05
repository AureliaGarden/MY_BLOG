import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase} from './test-db.mjs';
import worker from './migration-d1.mjs';
test('initialization is authenticated, exact and does not overwrite existing state',async()=>{const env={DB:createTestDatabase(),MIGRATION_TOKEN:'token'}, url='http://localhost/'; const req=(method,body,auth='token')=>new Request(url,{method,headers:{Authorization:`Bearer ${auth}`},...(body?{body:JSON.stringify(body)}:{})});assert.equal((await worker.fetch(req('GET',null,'wrong'),env)).status,401);assert.equal((await worker.fetch(req('GET'),env)).status,404);const first=await worker.fetch(req('POST',{text:'你好',n:7}),env);assert.equal(first.status,200);const one=await first.json();assert.equal((await worker.fetch(req('POST',{text:'changed'}),env)).status,409);assert.deepEqual(await (await worker.fetch(req('GET'),env)).json(),one);});
