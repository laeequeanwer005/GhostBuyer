import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
const root = join(import.meta.dirname, '..');
const read = path => readFileSync(join(root, path), 'utf8');
const brandmark = read('public/brandmark.svg');
const homepage = read('public/index.html');
const storefront = read('public/shop.html');

test('header, intro, storefront and favicons use the same GhostBuyer icon', () => {
  const path = brandmark.match(/<path d="([^"]+)"/);
  assert.ok(path, 'Canonical logo shape is present');
  assert.equal(homepage.split(path[1]).length - 1, 3, 'Header, loader, and Judge Mode share the canonical logo outline');
  assert.match(brandmark, /#8cc6ff/i);
  assert.match(brandmark, /#3377fb/i);
  assert.match(homepage, /rel="icon"[^>]*href="\.\/brandmark\.svg"/);
  assert.match(storefront, /rel="icon"[^>]*href="\.\/brandmark\.svg"/);
  assert.match(storefront, /class="shop-logo-image" src="\.\/brandmark\.svg"/);
});

test('old verification-eye logo is absent from active pages', () => {
  assert.doesNotMatch(brandmark, /viewBox="0 0 100 100"/);
  assert.doesNotMatch(storefront, /class="gb-mark"/);
  assert.match(read('public/shop.css'), /--background: #111319/);
});

test('release source contains no stale duplicates or unused bundles', () => {
  for (const file of ['OPEN_PREVIEW.html','public/app.js','public/app.css',
    'docs/FINAL_HANDOFF.md','docs/TEAM_PLAN.md','docs/TROUBLESHOOTING.md']) {
    assert.equal(existsSync(join(root,file)),false, `${file} should not be packaged`);
  }
});
