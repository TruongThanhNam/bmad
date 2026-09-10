# Ghi chú hàng ngày

Ứng dụng ghi chú tĩnh, không backend, không tài khoản, không đồng bộ. Dữ liệu nằm trong
IndexedDB của trình duyệt, gắn với origin của trang.

Không bundler, không transpile, không thư viện chạy lúc runtime. `package.json` tồn tại
**chỉ** để chạy test.

## Chạy cục bộ

App phải được phục vụ qua một HTTP server ở `localhost`:

```sh
python -m http.server 8080
# hoặc
npx --yes http-server -p 8080 .
```

Rồi mở `http://localhost:8080/`.

### Cấm mở bằng `file://`

**Không mở `index.html` trực tiếp từ đĩa.** `file://` không phải secure context: ES module bị
chặn và `crypto.randomUUID()` không tồn tại, nên trang sẽ hỏng. Đây là hành vi dự kiến, không
phải lỗi — luôn dùng HTTP server ở `localhost` như trên.

## Origin — KHÔNG ĐƯỢC ĐỔI

Origin sản xuất là **`https://truongthanhnam.github.io/bmad/`** (repo `TruongThanhNam/bmad`,
nhánh `main`, thư mục gốc).

Dữ liệu IndexedDB và `localStorage` gắn chặt vào origin **và đường dẫn** này. **Đổi tên miền
hoặc đổi đường dẫn là mất toàn bộ ghi chú** — trình duyệt sẽ coi đó là một site khác và không
có cách nào lấy lại dữ liệu cũ ngoài file sao lưu do người dùng tự xuất. Đừng đổi tên repo,
đừng chuyển sang custom domain, đừng chuyển sang phục vụ từ thư mục con khác.

## Chạy test

```sh
npm install
npm test        # vitest run
npm run test:watch
```

## Checklist deploy

1. **Bump `APP_VERSION`** (hằng số trong `app/core/limits.js`) — bắt buộc ở **mọi** lần deploy.
   Đây là cách tab đang mở bản cũ biết mình cũ và vào chế độ chỉ đọc thay vì ghi đè dữ liệu
   do mã mới viết. Bỏ bước này là chấp nhận rủi ro mất dữ liệu.
2. `npm test` — toàn bộ pass.
3. Chạy hết danh sách thử tay `app/adapters/` bên dưới.
4. Commit và push lên nhánh `main`.
5. Mở `https://truongthanhnam.github.io/bmad/` và kiểm: Console sạch, và sau khi trang tải
   ổn định thì tab Network không ghi nhận thêm request nào.

Không có CI, không staging, không rollback tự động. Đường lui là `git revert` cộng một lần
bump `APP_VERSION` nữa.

## Danh sách thử tay cho `app/adapters/`

`app/adapters/` không có test tự động — chúng mỏng theo thiết kế và bằng chứng duy nhất là
danh sách thử tay dưới đây. Các story sau điền vào mục này.

<!-- Mục để trống có ý thức — Story 1.1 chỉ tạo tiêu đề. -->
