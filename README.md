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

**Cục bộ chạy ở `/`, sản xuất chạy ở `/bmad/`.** Hai điều rút ra:

- Đường dẫn tuyệt đối từ gốc như `/app/style.css` **chạy được ở localhost nhưng 404 trên sản
  xuất**, vì trên GitHub Pages gốc site là `truongthanhnam.github.io`, không phải `/bmad/`. Luôn
  dùng đường dẫn tương đối (`app/style.css`) trong `index.html` và trong mã.
- `http://localhost:8080` và `https://truongthanhnam.github.io` là **hai origin khác nhau**, nên
  IndexedDB và `localStorage` của chúng **không bao giờ dùng chung**. Ghi chú gõ lúc phát triển
  không xuất hiện trên bản sản xuất, và ngược lại. Đổi cả cổng của server cục bộ cũng là đổi origin.

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

1. **Bump `APP_VERSION`** — bắt buộc ở **mọi** lần deploy. Đây là cách tab đang mở bản cũ biết
   mình cũ và vào chế độ chỉ đọc thay vì ghi đè dữ liệu do mã mới viết. Bỏ bước này là chấp nhận
   rủi ro mất dữ liệu.
   > **Chưa làm được ở thời điểm này.** Hằng số `APP_VERSION` sẽ nằm trong `app/core/limits.js`,
   > file đó **do Story 1.2 tạo** và hiện chưa tồn tại. Cho tới khi Story 1.2 xong thì bỏ qua
   > bước này; sau đó nó thành bắt buộc và không có ngoại lệ.
2. `npm test` — toàn bộ pass.
3. Chạy hết danh sách thử tay `app/adapters/` bên dưới.
4. Commit và push lên nhánh `main`.
5. Mở `https://truongthanhnam.github.io/bmad/` và kiểm: Console sạch, và sau khi trang tải
   ổn định thì tab Network không ghi nhận thêm request nào.

Không có CI, không staging, không rollback tự động. Đường lui là `git revert` cộng một lần
bump `APP_VERSION` nữa.

### Bật GitHub Pages (làm một lần)

Việc này làm bằng tay trong repo, không có tự động hóa nào:

1. Repo `TruongThanhNam/bmad` → **Settings** → **Pages**.
2. *Source*: **Deploy from a branch**.
3. *Branch*: **`main`**, folder **`/` (root)** → **Save**.
4. Đợi vài phút rồi mở `https://truongthanhnam.github.io/bmad/`.

Đúng ba lựa chọn đó là những gì làm nên origin sản xuất ở trên. Đổi nhánh hay đổi folder là đổi
đường dẫn, và theo mục *Origin* là mất toàn bộ ghi chú.

### Vì sao có `.nojekyll`

GitHub Pages mặc định đẩy nội dung qua Jekyll trước khi phục vụ. Repo này chứa nhiều markdown
planning trong `_bmad-output/` — Jekyll có thể build lỗi vì chúng, và mặc định nó cũng bỏ qua mọi
file/thư mục bắt đầu bằng `_`. File rỗng `.nojekyll` ở gốc tắt hẳn Jekyll, nên site được phục vụ
**nguyên trạng** đúng như cây thư mục trong repo. Đừng xóa nó.

## Danh sách thử tay cho `app/adapters/`

`app/adapters/` không có test tự động — chúng mỏng theo thiết kế và bằng chứng duy nhất là
danh sách thử tay dưới đây. Các story sau điền vào mục này.

<!-- Mục để trống có ý thức — Story 1.1 chỉ tạo tiêu đề. -->
