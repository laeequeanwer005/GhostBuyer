import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=join(import.meta.dirname,'..');
const html=readFileSync(join(root,'public/index.html'),'utf8');
test('ambient light treatment keeps standalone preview fully embedded',()=>{
 assert.match(html,/GHOSTBUYER \/ AMBIENT GRAPHITE/);
 assert.match(html,/class="ambient-atmosphere"/);
 assert.match(html,/class="ambient-orbits"/);
 assert.match(html,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(html,/<link[^>]*rel="stylesheet"/);
});
test('glow layer is decorative and not focusable',()=>{
 assert.match(html,/<div class="ambient-atmosphere" aria-hidden="true">/);
 assert.match(html,/pointer-events:none/);
});
