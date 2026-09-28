// 카탈로그 → CSV 변환. datasets/ 의 모든 CSV 는 여기서만 만들어진다.
// hand-edited CSV 는 drift 의 원천이므로 허용하지 않는다.
function esc(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (/[",]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCSV(headers, rows) {
  const out = [headers.join(',')];
  for (const r of rows) out.push(headers.map((h) => esc(r[h])).join(','));
  return out.join('\n') + '\n';
}

const K = (n) => (n == null ? '' : n.toLocaleString('en-US'));

export function writeCSVs(data) {
  const out = {};

  /* ── plugins.csv ── */
  out['plugins.csv'] = toCSV(
    ['id', 'role', 'in_default_registration', 'registration', 'files', 'bytes', 'button_manifest', 'hook_files', 'top_files'],
    data.plugins.plugins.map((p) => ({
      id: p.id,
      role: p.role,
      in_default_registration: p.inDefaultRegistration ? 'yes' : 'NO',
      registration: p.registration,
      files: p.files,
      bytes: p.bytes,
      button_manifest: p.button ? p.button.file + (p.button.count ? ` (${p.button.count})` : '') : (p.manifest ? p.manifest.file : ''),
      hook_files: p.hooksFiles.join(' '),
      top_files: p.topFiles.join(' '),
    }))
  );

  /* ── config-keys.csv ── */
  out['config-keys.csv'] = toCSV(
    ['path', 'kind', 'value', 'line', 'source'],
    data.configKeys.keys.map((k) => ({
      path: k.path, kind: k.kind, value: k.value, line: k.line,
      source: 'T2Editor/config/t2_hard_config.php',
    }))
  );

  /* ── css-contract.csv ── */
  const cc = data.cssContract;
  out['css-contract.csv'] = toCSV(
    ['code', 'title', 'kind', 'line', 'source'],
    [
      ...cc.rules.map((r) => ({ code: r.code, title: r.title, kind: cc.labels[r.code] ? 'enforced' : 'section', line: r.line, source: cc.source })),
      ...cc.retired.map((r) => ({ code: r.code, title: r.note, kind: 'RETIRED', line: '', source: cc.source })),
    ]
  );

  /* ── release-history.csv (교정본) ── */
  const L = data.legacy;
  out['release-history.csv'] = toCSV(
    ['id', 'family', 'edition', 'tag', 'real_deploy_date', 'archive_published_at', 'state', 'license_at_release', 'regression_signal', 'zip', 'sha256', 'lede', 'body_sha'],
    L.releases.map((r) => ({
      id: r.id, family: r.family, edition: r.edition, tag: r.tag,
      real_deploy_date: r.realDate, archive_published_at: r.archivePublishedAt,
      state: r.state, license_at_release: r.licenseAtRelease,
      regression_signal: r.regressionSignal ? r.regressionSignal.keyword : '',
      zip: r.zip, sha256: r.sha256, lede: r.lede, body_sha: r.bodySha,
    }))
  );

  /* ── families.csv ── */
  out['families.csv'] = toCSV(
    ['family', 'releases', 'first_edition', 'last_edition', 'first_date', 'last_date', 'states', 'licenses', 'missing_real_date'],
    L.families.map((f) => ({
      family: f.family, releases: f.count, first_edition: f.first, last_edition: f.last,
      first_date: f.firstDate, last_date: f.lastDate,
      states: f.states.join(' '), licenses: f.licenses.join(' '), missing_real_date: f.missingRealDate,
    }))
  );

  /* ── inventory.csv ── */
  out['inventory.csv'] = toCSV(
    ['area', 'files', 'bytes', 'top_exts'],
    [
      ...Object.entries(data.inventory.top).map(([k, v]) => ({
        area: 'T2Editor/' + k, files: v.files, bytes: v.bytes,
        top_exts: Object.entries(v.ext).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, n]) => `${e}:${n}`).join(' '),
      })),
      ...Object.entries(data.inventory.outside).map(([k, v]) => ({
        area: k + (v.exists ? '' : ' (없음)'), files: v.files ?? 0, bytes: v.bytes ?? 0, top_exts: '',
      })),
    ]
  );

  /* ── endpoints.csv ── */
  out['endpoints.csv'] = toCSV(
    ['file', 'pair', 'bytes', 'lines', 'functions', 'has_request_guard'],
    data.endpoints.endpoints.map((e) => ({
      file: e.file, pair: e.pair, bytes: e.bytes, lines: e.lines,
      functions: e.functions.join(' '), has_request_guard: e.hasAbortGuard ? 'yes' : 'no',
    }))
  );

  /* ── gate.csv ── */
  out['release-gate.csv'] = toCSV(
    ['n', 'name', 'command', 'line'],
    data.gate.steps.map((s) => ({ n: s.n, name: s.name, command: s.command, line: s.line }))
  );

  /* ── vendor.csv ── */
  out['vendor.csv'] = toCSV(
    ['package', 'files', 'bytes', 'detected_versions', 'largest_files'],
    data.vendor.packages.map((v) => ({
      package: v.package, files: v.files, bytes: v.bytes,
      detected_versions: v.versions.map((x) => `${x.file}=${x.version}`).join(' '),
      largest_files: v.largest.map((x) => `${x.f}:${K(x.b)}`).join(' '),
    }))
  );

  return out;
}
