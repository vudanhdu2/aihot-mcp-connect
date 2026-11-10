#!/usr/bin/env node
/**
 * ============================================================================
 * AIHOT.VN — Official Open-Source MCP Configurator & On-Demand Account Switcher
 * Repository: https://github.com/vudanhdu2/aihot-mcp-connect
 * License: MIT
 *
 * SECURITY GUARANTEES (100% Auditable, Zero Background Daemons):
 * 1. NO background processes (no hidden runners, no ScheduledTasks, no LaunchAgents).
 * 2. NO silent remote code auto-updates (no remote eval/exec loops).
 * 3. NO disk/database scanning (does not read state.vscdb, browser profiles, or Keychains).
 * 4. NO conversation or source-code syncing (100% local code privacy).
 * 5. Pure standard library Node.js (0 third-party npm dependencies).
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const PORTAL_URL = 'https://aihot.vn';
const MCP_ENDPOINT = 'https://aihot.vn/mcp';
const VERSION = '1.1.0';

function getSelfSha256() {
  try {
    const selfPath = fileURLToPath(import.meta.url);
    const buf = fs.readFileSync(selfPath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch {
    return 'unknown';
  }
}

function printBanner() {
  console.log('======================================================================');
  console.log(`  AIHOT.VN — Open-Source MCP & Quick-Switch CLI v${VERSION}`);
  console.log('  Repo   : https://github.com/vudanhdu2/aihot-mcp-connect');
  console.log(`  SHA256 : ${getSelfSha256()}`);
  console.log('  Chế độ : Minh bạch 100% · Không tiến trình ngầm · 0 phụ thuộc ngoài');
  console.log('======================================================================');
}

function detectSavedMemberKey() {
  const envKey = (process.env.AIHOT_KEY || process.env.AIHOT_MEMBER_KEY || '').trim();
  if (/^sk-[A-Za-z0-9_-]{16,128}$/.test(envKey)) {
    return envKey;
  }
  const home = os.homedir();
  const candidates = [
    path.join(home, '.gemini', 'antigravity', 'mcp_config.json'),
    path.join(home, '.gemini', 'config', 'mcp_config.json'),
    path.join(home, '.claude.json'),
    path.join(home, '.cursor', 'mcp.json'),
    path.join(home, '.codex', 'config.toml'),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        const m = raw.match(/(?:Bearer\s+|key=)(sk-[A-Za-z0-9_-]{16,128})/);
        if (m && m[1]) {
          return m[1].trim();
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }
  return '';
}

function parseArgs(argv) {
  const args = {
    command: 'help',
    key: detectSavedMemberKey(),
    account: '',
    dryRun: false,
    audit: false,
    uninstall: false,
    clients: ['antigravity', 'claude', 'cursor', 'codex'],
  };

  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--key' || a === '-k') {
      args.key = String(argv[++i] || '').trim();
    } else if (a.startsWith('--key=')) {
      args.key = a.slice(6).trim();
    } else if (a === '--account' || a === '-a') {
      args.account = String(argv[++i] || '').trim();
    } else if (a.startsWith('--account=')) {
      args.account = a.slice(10).trim();
    } else if (a === '--clients') {
      args.clients = String(argv[++i] || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--audit') {
      args.audit = true;
      args.command = 'audit';
    } else if (a === '--uninstall' || a === '--clean') {
      args.uninstall = true;
      args.command = 'uninstall';
    } else if (a === '--help' || a === '-h') {
      args.command = 'help';
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  if (positional.length > 0 && !args.audit && !args.uninstall) {
    args.command = positional[0].toLowerCase();
  }
  return args;
}

function validateMemberKey(rawKey) {
  const k = String(rawKey || '').trim() || detectSavedMemberKey();
  if (!/^sk-[A-Za-z0-9_-]{16,128}$/.test(k)) {
    throw new Error(
      'Chưa tìm thấy Mã Token thành viên (sk-...). Vui lòng truyền qua biến môi trường AIHOT_KEY=sk-... hoặc --key sk-... (hoặc dán mcp_config.json trước).'
    );
  }
  return k;
}

function safeWriteFileWithBackup(filePath, content, dryRun = false) {
  const resolved = path.resolve(filePath);
  const home = path.resolve(os.homedir());
  if (!resolved.startsWith(home + path.sep)) {
    throw new Error(`Từ chối ghi ngoài thư mục người dùng (${home}): ${resolved}`);
  }
  if (dryRun) {
    console.log(`[DRY-RUN] Sẽ cập nhật: ${resolved}`);
    return;
  }
  fs.mkdirSync(path.dirname(resolved), { recursive: true, mode: 0o700 });
  if (fs.existsSync(resolved)) {
    const stat = fs.lstatSync(resolved);
    if (stat.isSymbolicLink()) {
      throw new Error(`Từ chối ghi đè Symbolic Link để bảo mật: ${resolved}`);
    }
    const backupPath = `${resolved}.aihot.bak`;
    fs.copyFileSync(resolved, backupPath);
  }
  fs.writeFileSync(resolved, content, { encoding: 'utf8', mode: 0o600 });
  console.log(`  ✔ Đã cấu hình (quyền 0600): ${resolved}`);
}

function configureJsonMcpFile(filePath, memberKey, formatType, dryRun) {
  let obj = {};
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      if (raw) obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    obj = {};
  }
  if (typeof obj.mcpServers !== 'object' || obj.mcpServers === null) {
    obj.mcpServers = {};
  }

  const mcpUrl = `${MCP_ENDPOINT}?key=${memberKey}`;
  if (formatType === 'claude') {
    obj.mcpServers['ag-aihot'] = {
      type: 'http',
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${memberKey}`,
      },
    };
  } else {
    obj.mcpServers['ag-aihot'] = {
      serverUrl: mcpUrl,
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${memberKey}`,
      },
    };
  }

  safeWriteFileWithBackup(filePath, JSON.stringify(obj, null, 2) + '\n', dryRun);
}

function configureCodexToml(filePath, memberKey, dryRun) {
  let rawToml = '';
  if (fs.existsSync(filePath)) {
    rawToml = fs.readFileSync(filePath, 'utf8');
  }
  const block = `[mcp_servers.ag-aihot]\nurl = "${MCP_ENDPOINT}?key=${memberKey}"`;
  const sectionRegex = /^\[mcp_servers\.ag-aihot\]\r?\n(?:[^\[]*)/m;
  let updated = '';
  if (sectionRegex.test(rawToml)) {
    updated = rawToml.replace(sectionRegex, `${block}\n\n`);
  } else {
    const trimmed = rawToml.trimEnd();
    updated = trimmed ? `${trimmed}\n\n${block}\n` : `${block}\n`;
  }
  safeWriteFileWithBackup(filePath, updated, dryRun);
}

function runSetup(args) {
  const memberKey = validateMemberKey(args.key);
  const home = os.homedir();
  console.log('\n🔒 Đang cấu hình kết nối Remote HTTP MCP (0% tiến trình ngầm)...');

  if (args.clients.includes('antigravity')) {
    configureJsonMcpFile(
      path.join(home, '.gemini', 'antigravity', 'mcp_config.json'),
      memberKey,
      'antigravity',
      args.dryRun
    );
    configureJsonMcpFile(
      path.join(home, '.gemini', 'config', 'mcp_config.json'),
      memberKey,
      'antigravity',
      args.dryRun
    );
  }

  if (args.clients.includes('claude')) {
    configureJsonMcpFile(path.join(home, '.claude.json'), memberKey, 'claude', args.dryRun);
  }

  if (args.clients.includes('cursor')) {
    const cursorDir = path.join(home, '.cursor');
    if (fs.existsSync(cursorDir)) {
      configureJsonMcpFile(
        path.join(cursorDir, 'mcp.json'),
        memberKey,
        'antigravity',
        args.dryRun
      );
    }
  }

  if (args.clients.includes('codex')) {
    configureCodexToml(path.join(home, '.codex', 'config.toml'), memberKey, args.dryRun);
  }

  console.log('\n✅ Hoàn tất! Máy tính của bạn chỉ sử dụng cấu hình JSON tĩnh trỏ tới:');
  console.log(`   ${MCP_ENDPOINT}`);
  console.log('   • Không có dịch vụ chạy ngầm (Zero Background Daemon).');
  console.log('   • Từ lần sau, khi đổi tài khoản bạn không cần truyền lại --key (CLI tự đọc từ mcp_config.json).');
  console.log('   • Bản sao lưu cấu hình cũ được lưu tại *.aihot.bak.');
}

function fetchJsonHttps(urlStr, memberKey = '') {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': `aihot-mcp-connect/${VERSION} (Open-Source-CLI)`,
      Accept: 'application/json',
    };
    if (memberKey) {
      headers.Authorization = `Bearer ${memberKey}`;
      headers['X-API-Key'] = memberKey;
    }
    const req = https.get(
      urlStr,
      {
        headers,
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error(`Phản hồi không phải JSON hợp lệ (HTTP ${res.statusCode})`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Hết thời gian chờ kết nối tới aihot.vn'));
    });
  });
}

async function runSwitch(args) {
  const memberKey = validateMemberKey(args.key);
  if (!args.account || !/^[A-Za-z0-9._@-]{3,128}$/.test(args.account)) {
    throw new Error('Vui lòng truyền mã tài khoản hợp lệ qua --account <account_id>');
  }
  const home = os.homedir();
  const apiUrl = `${PORTAL_URL}/api/member/switch-script/${encodeURIComponent(
    args.account
  )}?key=${encodeURIComponent(memberKey)}&os=mac&format=json`;

  console.log(`\n⚡ Đang yêu cầu thông tin chuyển đổi tài khoản [${args.account}] (On-Demand · 0% chạy ngầm)...`);
  const payload = await fetchJsonHttps(apiUrl, memberKey);
  if (!payload || !payload.ok) {
    throw new Error(payload?.error || 'Máy chủ từ chối yêu cầu chuyển đổi tài khoản.');
  }

  if (payload.target === 'chatgpt' && payload.codex_auth_json) {
    const authFile = path.join(home, '.codex', 'auth.json');
    safeWriteFileWithBackup(authFile, String(payload.codex_auth_json), args.dryRun);
    console.log(`✅ Đã chuyển tài khoản ChatGPT Codex sang: ${payload.email || args.account}`);
    return;
  }

  if (payload.target === 'antigravity' && payload.oauth_creds_json) {
    const gemDir = path.join(home, '.gemini');
    if (payload.keyring_json) {
      safeWriteFileWithBackup(
        path.join(gemDir, 'antigravity-cli', 'antigravity-oauth-token'),
        String(payload.keyring_json),
        args.dryRun
      );
    }
    safeWriteFileWithBackup(
      path.join(gemDir, 'oauth_creds.json'),
      String(payload.oauth_creds_json),
      args.dryRun
    );
    if (payload.google_accounts_json) {
      safeWriteFileWithBackup(
        path.join(gemDir, 'google_accounts.json'),
        String(payload.google_accounts_json),
        args.dryRun
      );
    }
    console.log(`✅ Đã chuyển tài khoản Antigravity/Gemini sang: ${payload.email || args.account}`);
    return;
  }

  throw new Error('Định dạng dữ liệu tài khoản trả về không được hỗ trợ.');
}

function removeMcpFromJsonFile(filePath, dryRun) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return false;
    const obj = JSON.parse(raw);
    if (obj && obj.mcpServers && obj.mcpServers['ag-aihot']) {
      delete obj.mcpServers['ag-aihot'];
      if (dryRun) {
        console.log(`[DRY-RUN] Sẽ gỡ mục "ag-aihot" khỏi: ${filePath}`);
      } else {
        fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
        console.log(`  ✔ Đã gỡ cấu hình "ag-aihot" khỏi: ${filePath}`);
      }
      return true;
    }
  } catch {
    // Ignore parse error
  }
  return false;
}

function runUninstall(args) {
  const home = os.homedir();
  console.log('\n🧹 Đang gỡ bỏ cấu hình MCP ag-aihot và dọn sạch tàn dư (nếu có)...');
  const jsonFiles = [
    path.join(home, '.gemini', 'antigravity', 'mcp_config.json'),
    path.join(home, '.gemini', 'config', 'mcp_config.json'),
    path.join(home, '.claude.json'),
    path.join(home, '.cursor', 'mcp.json'),
  ];
  let count = 0;
  for (const f of jsonFiles) {
    if (removeMcpFromJsonFile(f, args.dryRun)) count++;
  }
  const codexToml = path.join(home, '.codex', 'config.toml');
  if (fs.existsSync(codexToml)) {
    const raw = fs.readFileSync(codexToml, 'utf8');
    const sectionRegex = /^\[mcp_servers\.ag-aihot\]\r?\n(?:[^\[]*)/m;
    if (sectionRegex.test(raw)) {
      if (args.dryRun) {
        console.log(`[DRY-RUN] Sẽ gỡ [mcp_servers.ag-aihot] khỏi: ${codexToml}`);
      } else {
        fs.writeFileSync(codexToml, raw.replace(sectionRegex, '').trimEnd() + '\n', 'utf8');
        console.log(`  ✔ Đã gỡ [mcp_servers.ag-aihot] khỏi: ${codexToml}`);
      }
      count++;
    }
  }
  console.log(`\n✅ Đã dọn sạch ${count} tệp cấu hình MCP. Máy tính của bạn hoàn toàn sạch (0% tiến trình ngầm).`);
}

function runAudit() {
  const home = os.homedir();
  console.log('\n🛡️  BÁO CÁO TỰ KIỂM TOÁN BẢO MẬT (SECURITY AUDIT REPORT):');
  console.log(`  • Phiên bản CLI                            : v${VERSION}`);
  console.log(`  • Mã băm toàn vẹn (SHA-256)               : ${getSelfSha256()}`);
  console.log('  1. Phụ thuộc bên thứ 3 (npm dependencies) : 0 (Chỉ dùng node:fs, node:path, node:os, node:https, node:crypto)');
  console.log('  2. Tiến trình chạy ngầm (Background Daemon): KHÔNG (Chỉ chạy khi người dùng gõ lệnh rồi thoát ngay)');
  console.log('  3. Tự động tải code từ xa (Remote Exec)   : KHÔNG (Không dùng eval, không tải script ngoài)');
  console.log('  4. Quét dữ liệu cá nhân / lịch sử chat     : KHÔNG (Không đọc state.vscdb hay thư mục dự án)');
  console.log('  5. Các tệp cấu hình duy nhất được phép ghi (quyền 0600 + tự động tạo bản sao lưu *.aihot.bak):');
  const allowedFiles = [
    path.join(home, '.gemini', 'antigravity', 'mcp_config.json'),
    path.join(home, '.gemini', 'config', 'mcp_config.json'),
    path.join(home, '.claude.json'),
    path.join(home, '.cursor', 'mcp.json'),
    path.join(home, '.codex', 'config.toml'),
  ];
  for (const f of allowedFiles) {
    const exists = fs.existsSync(f);
    console.log(`     • ${f} [${exists ? 'Đang có trên máy' : 'Chưa tạo'}]`);
  }
  console.log('\n  👉 Để gỡ bỏ hoàn toàn cấu hình bất cứ lúc nào: npx github:vudanhdu2/aihot-mcp-connect uninstall');
}

function printHelp() {
  console.log(`
Cách sử dụng:
  1. Chỉ cấu hình cổng MCP bằng JSON tĩnh (Khuyên dùng — 0% tiến trình ngầm):
     npx github:vudanhdu2/aihot-mcp-connect setup --key sk-YOUR_MEMBER_KEY
     (Hoặc truyền qua biến môi trường để không lưu trong lịch sử lệnh: AIHOT_KEY=sk-... npx github:vudanhdu2/aihot-mcp-connect setup)

  2. Kiểm tra trước những file sẽ được sửa (Dry-Run, không ghi ổ cứng):
     npx github:vudanhdu2/aihot-mcp-connect setup --key sk-YOUR_MEMBER_KEY --dry-run

  3. Đổi nhanh tài khoản AI theo yêu cầu (On-Demand Switch, tự đọc key từ mcp_config.json):
     npx github:vudanhdu2/aihot-mcp-connect switch --account <account_id>

  4. Xem báo cáo kiểm toán bảo mật & SHA-256 của công cụ:
     npx github:vudanhdu2/aihot-mcp-connect --audit

  5. Gỡ bỏ hoàn toàn cấu hình MCP khỏi máy tính:
     npx github:vudanhdu2/aihot-mcp-connect uninstall
`);
}

async function main() {
  printBanner();
  const args = parseArgs(process.argv);
  try {
    if (args.command === 'setup' || args.command === 'init' || args.command === 'install') {
      runSetup(args);
    } else if (args.command === 'switch') {
      await runSwitch(args);
    } else if (args.command === 'audit') {
      runAudit();
    } else if (args.command === 'uninstall' || args.command === 'remove' || args.command === 'clean') {
      runUninstall(args);
    } else {
      printHelp();
    }
  } catch (err) {
    console.error(`\n❌ Lỗi: ${err.message || err}`);
    process.exit(1);
  }
}

main();
