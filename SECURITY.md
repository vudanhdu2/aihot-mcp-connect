# 🛡️ Chính Sách Bảo Mật, Kiểm Chứng Độc Lập & Lịch Sử Chuyển Đổi (SECURITY.md)

Kho mã nguồn [`vudanhdu2/aihot-mcp-connect`](https://github.com/vudanhdu2/aihot-mcp-connect) tuân thủ nguyên tắc **Zero-Trust Client & Zero Background Daemons**: người dùng không cần tin vào lời hứa tiếp thị mà có thể tự kiểm chứng bằng các công cụ nguyên bản của hệ điều hành trước khi thực thi bất kỳ dòng lệnh nào.

---

## 1. Tự Kiểm Chứng Mã Băm SHA-256 Bằng Công Cụ Hệ Điều Hành (Không Cần Chạy CLI)

Để tránh rủi ro "công cụ tự in mã băm của chính nó", bạn hãy dùng trực tiếp lệnh của hệ điều hành (`curl` + `shasum` hoặc `Get-FileHash`) để tải và kiểm tra file [`bin/aihot-mcp.mjs`](bin/aihot-mcp.mjs) tại phiên bản đã ghim (`v1.1.0` / commit `dadac38482447eb2a4937cdcddcc912405c0519b`):

- **Mã băm SHA-256 chuẩn (`v1.1.0` · `bin/aihot-mcp.mjs`)**:
  `8d37e381a7ed810bc7fc9ae27031b2407555386354a49a93639b1add75de10d2`

### Trên macOS / Linux:
```bash
curl -fsSL https://raw.githubusercontent.com/vudanhdu2/aihot-mcp-connect/v1.1.0/bin/aihot-mcp.mjs | shasum -a 256
```

### Trên Windows PowerShell:
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vudanhdu2/aihot-mcp-connect/v1.1.0/bin/aihot-mcp.mjs" -OutFile "$env:TEMP\aihot-mcp.mjs"
Get-FileHash "$env:TEMP\aihot-mcp.mjs" -Algorithm SHA256
```

---

## 2. Ghim Phiên Bản Bất Biến (`#v1.1.0` hoặc `#dadac38`)

Khi chạy qua `npx`, luôn ghim thẻ phiên bản `#v1.1.0` (hoặc mã commit `#dadac38482447eb2a4937cdcddcc912405c0519b`) để đảm bảo `npx` không tự động kéo nhánh `main` mới chưa qua kiểm tra của bạn:

```bash
# Cấu hình MCP (khuyên dùng biến môi trường AIHOT_KEY để không lưu key vào lịch sử lệnh shell):
AIHOT_KEY=sk-MÃ_TOKEN_CỦA_BẠN npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 setup

# Đổi nhanh tài khoản AI (tự đọc khóa từ mcp_config.json, không lộ key trên CLI):
npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 switch --account <account_id>

# Xem trước thao tác mà không ghi ổ cứng (--dry-run):
npx github:vudanhdu2/aihot-mcp-connect#v1.1.0 setup --dry-run
```

---

## 3. Công Bố Chuyển Đổi Kiến Trúc (10/11/2026) & Hướng Dẫn Dọn Sạch Bản Cũ (Legacy Cleanup)

### Vì sao AIHOT.VN ngừng hoàn toàn file `.exe` và cầu nối chạy ngầm cũ?
Trước ngày **10/11/2026**, hệ thống có cung cấp tùy chọn bộ cài đóng gói và cầu nối cục bộ tự khởi động trên Windows để hỗ trợ bấm nút đổi tài khoản trực tiếp từ trình duyệt web. Tuy nhiên, qua kiểm toán bảo mật độc lập, cơ chế chạy ngầm gây ra 2 vấn đề lớn:
1. Người dùng và lập trình viên mới không thể đọc trực tiếp mã nguồn bên trong file đóng gói `.exe`, dễ bị Microsoft Defender SmartScreen cảnh báo.
2. Việc duy trì tiến trình đợi lệnh ngầm không cần thiết đối với 95% nhu cầu sử dụng cổng Remote HTTP MCP (`https://aihot.vn/mcp`).

Từ ngày **10/11/2026**, AIHOT.VN **loại bỏ hoàn toàn file `.exe` và ngừng phục vụ script cầu nối ngầm tại `/api/public/install-mcp`**, chuyển 100% sang:
- **Cấp 1 (Zero-Code JSON)**: Chỉ thêm 12 dòng cấu hình JSON tĩnh vào `~/.gemini/antigravity/mcp_config.json` (0% mã thực thi).
- **Cấp 2 (Open-Source GitHub CLI `#v1.1.0`)**: Chỉ chạy đúng lúc người dùng gõ lệnh trên Terminal rồi thoát ngay (`0% tiến trình chạy ngầm`, `0 npm dependencies`, phân quyền file `0600`).

### Lệnh hệ điều hành độc lập để kiểm tra & dọn sạch bản cũ (Dành cho thành viên từng cài trước 10/11/2026)
Nếu bạn từng chạy bộ cài cầu nối cũ trước ngày 10/11/2026 và muốn tự tay kiểm tra / xóa sạch hoàn toàn bằng lệnh gốc của hệ điều hành (không phụ thuộc vào công cụ của chúng tôi):

#### Trên Windows (Chạy trong PowerShell):
```powershell
# 1. Xóa tác vụ hẹn giờ cũ (nếu từng cài bản trước 10/11/2026)
Unregister-ScheduledTask -TaskName "AgAihotBridgeWatchdog" -Confirm:$false -ErrorAction SilentlyContinue

# 2. Xóa khóa khởi động cùng Windows cũ (nếu có)
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AntigravityAihotBridge" -ErrorAction SilentlyContinue

# 3. Xóa các tệp cầu nối cũ trong thư mục ~/.gemini (nếu có)
Remove-Item -Path "$HOME\.gemini\ag-startup-silent.*", "$HOME\.gemini\ag-protocol.*", "$HOME\.gemini\ag-client-bridge.*" -Force -ErrorAction SilentlyContinue
```

#### Trên macOS / Linux:
```bash
rm -f ~/.gemini/ag-client-bridge.* ~/Library/LaunchAgents/vn.aihot.bridge.plist
```

---

## 4. Giới Hạn Quyền Admin & Bảo Vệ Hội Thoại 3 Lớp (Zero-Data-Leak Server Policy)

Để thành viên yên tâm tuyệt đối khi sử dụng hạ tầng dùng chung, cả **hệ thống máy chủ lẫn tài khoản Admin** trên [https://aihot.vn](https://aihot.vn) đều **không thể đọc được nội dung hội thoại, prompt hay mã nguồn** của bất kỳ thành viên nào:

1. **Lớp 1 · Máy trạm (Client Sync — `tokens_only`)**: Các script đồng bộ thống kê chỉ truyền bộ đếm định lượng (`conv_id`, `step_idx`, model, `timestamp` và số token) về `/api/member/sync-ide-usage`, không đính kèm văn bản prompt hay câu trả lời AI.
2. **Lớp 2 · Máy chủ API (`sync_conversations_enabled = false`)**: Backend khóa cứng trạng thái tắt đồng bộ hội thoại (`tokens_only`) và tự động xóa sạch mọi tệp hội thoại cũ nếu có (`purge_member_remote_conversations`).
3. **Lớp 3 · Gateway `ProxyMonitor`**: Khi lưu nhật ký qua Gateway dùng chung, máy chủ tự động xóa trắng (`None`) toàn bộ `request_body`, `upstream_request_body`, `response_body`, `request_headers` và `upstream_request_headers` cho mọi thành viên.

### Đối chiếu quyền truy cập dữ liệu của Admin
- **Không thể xem (kể cả Admin)**: Nội dung prompt, phản hồi/suy nghĩ AI, mã nguồn, nội dung file trên máy cá nhân và payload request/response qua Gateway.
- **Chỉ xem được chỉ số định lượng (để điều phối Pool & chống gian lận)**: Danh tính thành viên, trạng thái đang đốt token / tốc độ TPM, số lượng prompt (trực tiếp / ngầm), số hội thoại (trực tiếp / ngầm), số bước AI, thống kê token/chi phí USD theo model và tài khoản Pool đang gắn.

Tham chiếu công khai trên cổng web: [Điều 4 — Cam Kết Bảo Mật & Giới Hạn Quyền Admin](https://aihot.vn/dieu-khoan.html#dieu-4) · [Bảng Xếp Hạng 16 Phòng 3D](https://aihot.vn/virtual-office/index.html).

---

## 5. Lưu Ý Về Điều Khoản Dịch Vụ Bên Thứ Ba (ToS Disclosure)

- **Cổng Remote HTTP MCP (`https://aihot.vn/mcp`)**: Kết nối qua giao thức HTTP chuẩn của Model Context Protocol để tra cứu thư viện bài viết AI, chợ Skill và điều phối mô hình hợp lệ.
- **Tính năng Đổi Nhanh Tài Khoản (`switch`)**: Ghi tệp xác thực OAuth vào thư mục cấu hình cục bộ (`~/.gemini/` hoặc `~/.codex/`) dành cho thành viên trong nhóm nghiên cứu nội bộ CLB. Người dùng lưu ý việc sử dụng chung hoặc xoay vòng tài khoản giữa nhiều thiết bị cần tuân thủ quy tắc hạn mức công bằng (Fair-Use) của CLB và có thể chịu giới hạn theo Điều khoản dịch vụ (ToS) của nhà cung cấp IDE/mô hình gốc.

---

## 6. Báo Cáo Lỗ Hổng Bảo Mật (Vulnerability Disclosure)

Mọi phát hiện hoặc góp ý về an toàn thông tin xin gửi trực tiếp qua:
- **GitHub Issues**: [https://github.com/vudanhdu2/aihot-mcp-connect/issues](https://github.com/vudanhdu2/aihot-mcp-connect/issues)
- **Chủ nhiệm dự án**: Vũ Danh Dự (`@vudanhdu2` · Zalo `0908549999`)
