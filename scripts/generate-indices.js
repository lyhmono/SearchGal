import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const platformsDir = path.join(__dirname, '../src/platforms');
const htmlPath = path.join(__dirname, '../src/html.ts');
const helperFiles = new Set(['htmlSearch.ts']);

// 已禁用的平台：源文件保留，但不再被索引引用（在生成的 index.ts 中以注释形式标出）。
// key 为平台目录，value 为对应被禁用的文件名（不含 .ts）。
const DISABLED = {
  gal: {
    GGBases: 'openresty WAF 按 searchgal UA 屏蔽，换 UA 即绕过站长主动屏蔽，故停用',
    TouchGal: 'Cloudflare 人机质询 + 源站按 searchgal UA 屏蔽，无法抓取，故停用',
    BiAnXingLu: '源站返回 521（Cloudflare 回源失败），站点已宕机，故停用',
    LiSiTanACG: '已迁站 singureo.com 并改为 SPA 客户端搜索，原 search.xml 索引下线，无可调用接口，故停用',
    QingJiACG: '全站 Cloudflare 人机质询，所有 UA 均被拦截，无法抓取，故停用',
    GalgameDaWanJia: 'TLS 证书 CN=cp.huyuncdn.com 不匹配域名（ERR_TLS_CERT_ALTNAME_INVALID），站长证书配错，故停用',
    GalgameX: '站点改版为 Next.js SPA，.top→.net 重定向后 /api/search 返回 404，旧 API 下线，故停用',
    YouYuDeloli: 'SSL 证书过期（CERT_HAS_EXPIRED），等站长续证后可恢复，暂停用',
  },
  patch: {},
};

function generateIndexFile(directory) {
  const dirPath = path.join(platformsDir, directory);
  if (!fs.existsSync(dirPath)) return 0;

  const disabled = DISABLED[directory] || {};

  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts' && !helperFiles.has(file));

  if (files.length === 0) return 0;

  const imports = files.map(file => {
    const platformName = path.basename(file, '.ts');
    if (disabled[platformName]) {
      return `// import ${platformName} from "./${platformName}"; // 已禁用：${disabled[platformName]}`;
    }
    return `import ${platformName} from "./${platformName}";`;
  }).join('\n');

  const platformLines = files.map(file => {
    const platformName = path.basename(file, '.ts');
    if (disabled[platformName]) {
      return `  // ${platformName}, // 已禁用`;
    }
    return `  ${platformName},`;
  }).join('\n');

  const activeCount = files.length - Object.keys(disabled).filter(name => files.includes(`${name}.ts`)).length;

  const content = `import type { Platform } from "../../types";
${imports}

const platforms: Platform[] = [
${platformLines}
];

export default platforms;
`;

  fs.writeFileSync(path.join(dirPath, 'index.ts'), content.trim() + '\n');
  const disabledCount = files.length - activeCount;
  console.log(`Generated index for ${directory} with ${activeCount} active platforms${disabledCount ? ` (${disabledCount} disabled)` : ''}.`);
  return activeCount;
}

console.log('Generating platform indices...');
const galCount = generateIndexFile('gal');
const patchCount = generateIndexFile('patch');

// ── 同步更新 html.ts 中的平台计数 ──
if (galCount > 0 || patchCount > 0) {
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // 更新 meta description 和 og:description
  html = html.replace(
    /(聚合搜索)\d+\+( Gal资源平台)/g,
    `$1${galCount}+$2`
  );
  // 更新资源 tab badge
  html = html.replace(
    /(资源<span class="badge">)\d+(<\/span>)/g,
    `$1${galCount}$2`
  );
  // 更新补丁 tab badge
  html = html.replace(
    /(补丁<span class="badge">)\d+(<\/span>)/g,
    `$1${patchCount}$2`
  );
  // 更新 pcount 中的资源站数字
  html = html.replace(
    /(已接入 <b>)\d+(<\/b> 个资源站 \+ <b>)\d+(<\/b> 个补丁站)/g,
    `$1${galCount}$2${patchCount}$3`
  );

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Updated html.ts: ${galCount} gal + ${patchCount} patch.`);
}

console.log('Done.');
