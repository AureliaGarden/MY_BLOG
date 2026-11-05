import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommentScript } from './giscus-comments.mjs';

function fakeDocument() {
  return { createElement(tag) { return { tag, attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } }; } };
}

test('different articles receive different stable discussion keys', () => {
  const first = createCommentScript(fakeDocument(), 'hello-world');
  const second = createCommentScript(fakeDocument(), 'another-post');
  assert.equal(first.attributes['data-mapping'], 'specific');
  assert.equal(first.attributes['data-term'], 'post:hello-world');
  assert.equal(second.attributes['data-term'], 'post:another-post');
  assert.equal(first.attributes['data-strict'], '1');
  assert.equal(first.attributes['data-category-id'], 'DIC_kwDOVb7Qcs4DKbRU');
});

test('invalid identifiers cannot become comment keys', () => {
  assert.throws(() => createCommentScript(fakeDocument(), '../another-post'), TypeError);
  assert.throws(() => createCommentScript(fakeDocument(), ''), TypeError);
});
