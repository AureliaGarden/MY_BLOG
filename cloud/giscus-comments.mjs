// One stable discussion key per article, independent of the SPA hash and domain.
export function createCommentScript(document, slug, theme = 'light') {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new TypeError('Invalid article identifier');
  }
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  const attributes = {
    'data-repo': 'Camellia-Garden/MY_BLOG',
    'data-repo-id': 'R_kgDOVb7Qcg',
    'data-category': 'Announcements',
    'data-category-id': 'DIC_kwDOVb7Qcs4DKbRU',
    'data-mapping': 'specific',
    'data-term': `post:${slug}`,
    'data-strict': '1',
    'data-reactions-enabled': '1',
    'data-emit-metadata': '0',
    'data-input-position': 'bottom',
    'data-theme': theme === 'dark' ? 'dark' : 'light',
    'data-lang': 'zh-CN',
    crossorigin: 'anonymous',
  };
  for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
  script.async = true;
  return script;
}
