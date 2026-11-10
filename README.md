# 🛡️ AIHOT.VN — Open-Source MCP Configurator & Quick-Switch CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Zero Background Daemons](https://img.shields.io/badge/Background_Daemons-ZERO-blue.svg)](#cam-kết-bảo-mật-5-không)
[![Dependencies](https://img.shields.io/badge/NPM_Dependencies-0-brightgreen.svg)](package.json)

<table>
  <tr>
    <td width="72" align="center">
      <a href="https://facebook.com/vudanhdu999">
        <img src="assets/founder-vudanhdu.png" width="56" height="56" alt="Vũ Danh Dự" />
      </a>
    </td>
    <td>
      <b>Chủ nhiệm dự án: Vũ Danh Dự (<a href="https://github.com/vudanhdu2">@vudanhdu2</a>)</b><br/>
      Founder <b><a href="https://aihot.vn">AIHOT.VN — CLB Nghiên Cứu & Thực Hành AI</a></b> · <a href="https://facebook.com/vudanhdu999">Facebook chính chủ</a> · Zalo: <code>0908549999</code>
    </td>
  </tr>
</table>

Kho mã nguồn mở chính thức giúp các thành viên **Câu Lạc Bộ Nghiên Cứu & Thực Hành AI ([https://aihot.vn](https://aihot.vn))** kết nối **Cổng MCP (`ag-aihot`)** và chuyển đổi tài khoản AI trên máy tính cá nhân (**Antigravity IDE, Claude Code, Cursor, ChatGPT Codex**) với **sự minh bạch 100%**.

---

## 🔒 Cam Kết Bảo Mật "5 KHÔNG" (Có thể kiểm toán trực tiếp hoặc nhờ AI đọc code)

Để giải quyết triệt để nỗi lo bảo mật khi kết nối máy tính cá nhân với hệ thống cộng đồng, toàn bộ công cụ trong kho này tuân thủ nghiêm ngặt 5 nguyên tắc:

1. **KHÔNG chạy tiến trình ngầm (`Zero Background Daemons`)**: Tuyệt đối không dùng `wscript.exe` ẩn, không cài `ScheduledTask` (Windows) hay `LaunchAgents` (macOS). Công cụ chỉ chạy đúng lúc bạn gõ lệnh rồi thoát ngay.
2. **KHÔNG tự động tải code đè từ xa (`No Silent Remote Execution`)**: Không có vòng lặp tự tải script mới từ máy chủ về ghi đè. Phiên bản bạn kiểm tra trên GitHub chính là phiên bản chạy trên máy bạn.
3. **KHÔNG quét ổ cứng hay cơ sở dữ liệu cá nhân (`Zero Disk Scanning`)**: Không đọc `state.vscdb`, không quét trình duyệt Chrome/Edge, không chạm vào Keychain hệ thống.
4. **KHÔNG đồng bộ nội dung chat hay mã nguồn (`Zero Code/Prompt Sync`)**: Cổng MCP hoạt động theo giao thức HTTP chuẩn, hoàn toàn không thu thập lịch sử hội thoại hay code dự án trên máy cá nhân.
5. **KHÔNG phụ thuộc thư viện bên thứ 3 (`Zero Third-Party Dependencies`)**: Toàn bộ mã nguồn trong [`bin/aihot-mcp.mjs`](bin/aihot-mcp.mjs) chỉ dài ~250 dòng, sử dụng duy nhất thư viện chuẩn của Node.js (`node:fs`, `node:path`, `node:os`, `node:https`).

---

## 🚀 Cách 1 (Khuyên dùng cho 90% thành viên): Kết nối MCP bằng JSON Thuần Túy (0% Code Thực Thi)

Thực chất, cổng MCP của [https://aihot.vn](https://aihot.vn) là **Remote HTTP MCP** (`https://aihot.vn/mcp`). Bạn **không cần cài đặt bất kỳ phần mềm hay chạy script nào**, chỉ cần dán cấu hình JSON tĩnh vào IDE của mình:

### 1A. Antigravity IDE (`~/.gemini/antigravity/mcp_config.json`) hoặc Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "ag-aihot": {
      "serverUrl": "https://aihot.vn/mcp?key=sk-MÃ_TOKEN_CỦA_BẠN",
      "url": "https://aihot.vn/mcp?key=sk-MÃ_TOKEN_CỦA_BẠN",
      "headers": {
        "Authorization": "Bearer sk-MÃ_TOKEN_CỦA_BẠN"
      }
    }
  }
}
```

### 1B. Claude Code CLI (Chạy lệnh chính chủ của Anthropic)

```bash
claude mcp add --scope user --transport http ag-aihot https://aihot.vn/mcp --header "Authorization: Bearer sk-MÃ_TOKEN_CỦA_BẠN"
```

### 1C. ChatGPT Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.ag-aihot]
url = "https://aihot.vn/mcp?key=sk-MÃ_TOKEN_CỦA_BẠN"
```

---

## ⚡ Cách 2: Tự động ghi cấu hình MCP hoặc Đổi Nhanh TK qua GitHub CLI

Nếu muốn tự động điền cấu hình cho cả 4 công cụ (kèm tự động tạo file sao lưu `*.aihot.bak`), bạn có thể chạy trực tiếp từ GitHub:

### 1. Xem báo cáo kiểm toán bảo mật (kèm SHA-256) hoặc chạy thử (`--dry-run`)

- **File thực thi duy nhất**: [`bin/aihot-mcp.mjs`](bin/aihot-mcp.mjs)
- **Chính sách bảo mật & Lệnh kiểm chứng SHA-256 độc lập**: [`SECURITY.md`](SECURITY.md)
- **Mã băm toàn vẹn (SHA-256 v1.1.0)**: `8d37e381a7ed810bc7fc9ae27031b2407555386354a49a93639b1add75de10d2`

```bash
# Kiểm chứng SHA-256 độc lập bằng lệnh hệ điều hành trước khi chạy:
curl -fsSL https://raw.githubusercontent.com/vudanhdu2/aihot-mcp-connect/v1.1.0/bin/aihot-mcp.mjs | shasum -a 256

# Chạy kiểm toán hoặc xem trước (--dry-run) với phiên bản đã ghim #v1.1.0:
npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 --audit
npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 setup --key sk-MÃ_TOKEN_CỦA_BẠN --dry-run
```

### 2. Tự động cấu hình MCP cho Antigravity, Claude Code, Cursor & Codex (Quyền file `0600` + Backup `*.aihot.bak`)

```bash
# Truyền qua biến môi trường để không lưu key trong lịch sử lệnh (Shell History):
AIHOT_KEY=sk-MÃ_TOKEN_CỦA_BẠN npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 setup
```

### 3. Đổi nhanh tài khoản AI theo yêu cầu (On-Demand Switch, không chạy ngầm)

Sau khi đã có `mcp_config.json`, CLI tự động đọc mã Token từ cấu hình cục bộ nên bạn **không cần truyền lại `--key` trên dòng lệnh**:

```bash
npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 switch --account <account_id>
```

### 4. Gỡ bỏ hoàn toàn cấu hình MCP bất cứ lúc nào (`uninstall`)

```bash
npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 uninstall
```

---

## 🤖 Cách 3: Nhờ chính AI trên máy của bạn đọc kiểm tra code trước khi cài

Bạn có thể copy câu lệnh dưới đây dán vào khung chat của **Antigravity / Claude Code / Cursor** để chính AI của bạn kiểm toán độc lập trước khi cấu hình:

```text
Hãy đọc mã nguồn tại https://github.com/vudanhdu2/aihot-mcp-connect (file bin/aihot-mcp.mjs), kiểm tra xác nhận công cụ này không cài tiến trình chạy ngầm và không đọc dữ liệu cá nhân, sau đó thêm cấu hình Remote HTTP MCP "ag-aihot" (URL: https://aihot.vn/mcp, Authorization: Bearer sk-MÃ_TOKEN_CỦA_BẠN) vào file mcp_config.json giúp tôi.
```

---

## 📄 Giấy phép (License)

Phát hành dưới giấy phép [MIT License](LICENSE). Mọi đóng góp và kiểm toán bảo mật từ cộng đồng đều được hoan nghênh qua Issues / Pull Requests.
