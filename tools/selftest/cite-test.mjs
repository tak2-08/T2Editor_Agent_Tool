import { parseCitations, verifyAll } from '../lib/cite.mjs';

const t = [
  '값은 `T2Editor/config/t2_upload.php:705` 이다.',
  '그리고 `tools/t2-release-gate.sh:84-94` 10단계.',
  '`js/core.js:2783-2819` 도 그렇다.',
  '`css/t2-visual-system.css:498` 참고.',
  '여러 개: `endpoints/run.php:1, run.core.php:2`.',
].join('\n');

const r = parseCitations(t);
console.log('파싱', r.length, '건');
for (const x of r) console.log('  ', x.path, x.spec, '→', x.start + '-' + x.end);
console.log('검증', JSON.stringify(verifyAll(r).map((v) => [v.path, v.spec, v.status]), null, 0));
