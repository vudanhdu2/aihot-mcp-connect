# Chính Sách & Kiến Trúc Bảo Mật (Security Architecture)

## 1. Phạm vi hoạt động của `aihot-mcp-connect`

Công cụ `aihot-mcp-connect` được thiết kế theo nguyên tắc **Đặc quyền tối thiểu (Least Privilege)**:

| Hành động | Trạng thái | Giải thích chi tiết |
| :--- | :--- | :--- |
| Ghi file cấu hình MCP (`mcp_config.json`, `.claude.json`, `.codex/config.toml`) | ✅ Có (Khi chạy `setup`) | Luôn tạo bản sao lưu `*.aihot.bak` trước khi sửa và từ chối ghi đè nếu phát hiện Symbolic Link. |
| Đổi thông tin xác thực IDE (`oauth_creds.json`, `.codex/auth.json`) | ✅ Có (Chỉ khi chạy `switch`) | Chỉ thực thi một lần khi người dùng truyền `--account <id>`, không chạy dịch vụ lắng nghe ngầm. |
| Chạy dịch vụ nền (`wscript.exe`, `ScheduledTask`, `LaunchAgent`, cổng `18456`) | ❌ **Không bao giờ** | Loại bỏ hoàn toàn mọi cơ chế tự khởi động cùng hệ điều hành hoặc mở cổng nội bộ. |
| Tự động tải và chạy code từ máy chủ (`eval`, `iex`, `curl \| bash`) | ❌ **Không bao giờ** | Mã nguồn cố định theo commit trên GitHub, không tự cập nhật ngầm. |
| Đọc lịch sử hội thoại, mã nguồn dự án hoặc `state.vscdb` | ❌ **Không bao giờ** | Công cụ hoàn toàn không truy cập cơ sở dữ liệu IDE hay thư mục làm việc của thành viên. |

## 2. Cách tự kiểm tra nhanh mã nguồn

Bạn có thể kiểm tra toàn bộ kho mã chỉ bằng 1 lệnh:

```bash
git clone https://github.com/vudanhdu2/aihot-mcp-connect.git
cd aihot-mcp-connect
node ./bin/aihot-mcp.mjs --audit
```
