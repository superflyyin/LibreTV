// generate_customer_site.cjs
// Usage: node generate_customer_site.cjs <input_json> <output_js>
const fs = require('fs');
const path = require('path');

function makeKey(name) {
  let k = String(name).replace(/[^a-zA-Z0-9]/g, '_');
  if (/^[0-9]/.test(k)) k = 's_' + k;
  k = k.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return k.toLowerCase();
}

function quoteSingle(s) {
  return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\'';
}

function generate(customerSitesObj) {
  const lines = [];
  lines.push('const CUSTOMER_SITES = {');
  const keys = Object.keys(customerSitesObj);
  keys.forEach((key) => {
    const site = customerSitesObj[key];
    const id = makeKey(key);
    const api = site.api || site.url || '';
    const name = site.name || site.title || key;
    lines.push(`  ${id}: {`);
    lines.push(`    api: ${quoteSingle(api)},`);
    lines.push(`    name: ${quoteSingle(name)},`);
    lines.push('  },');
  });
  lines.push('};');
  lines.push('');
  lines.push('// 调用全局方法合并');
  lines.push('if (typeof window !== "undefined" && window.extendAPISites) {');
  lines.push('  window.extendAPISites(CUSTOMER_SITES);');
  lines.push('} else if (typeof globalThis !== "undefined") {');
  lines.push('  // In Node, export the object for tests or further processing');
  lines.push('  try { module.exports = CUSTOMER_SITES; } catch (e) {}');
  lines.push('} else {');
  lines.push("  console.error('错误：请先加载 config.js 或在浏览器环境运行！');");
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

(async function(){
  try {
    const inPath = process.argv[2] || './scripts/jingjian.json';
    const outPath = process.argv[3] || './js/customer_site.js';
    const raw = fs.readFileSync(inPath, 'utf8');
    const content = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
    const src = JSON.parse(content);
    const api_site = src.api_site || src.apiSite || src.sites || {};
    const normalized = {};
    for (const k of Object.keys(api_site)) {
      const v = api_site[k] || {};
      normalized[k] = {
        api: v.api || v.url || '',
        name: v.name || v.title || k
      };
    }
    const out = generate(normalized);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, out, 'utf8');
    console.log('Written', outPath);
  } catch (e) {
    console.error('Error generating customer_site.js', e);
    process.exit(1);
  }
})();
