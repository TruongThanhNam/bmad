<!-- bmad:context -->
<!-- Verified 2026-09-17 against 1b551ef. Managed by bmad-project-context; nội dung trong block này bị thay khi refresh. Muốn giữ gì thì để ngoài hai marker. -->

## Ghi chú hàng ngày

App ghi chú tĩnh chạy thẳng trong trình duyệt: ES module thuần, không bundler, không
transpile, không thư viện runtime. `package.json` tồn tại chỉ để chạy Vitest. Tài liệu
gốc: `README.md` (vận hành + checklist thủ công 1–27) và
`_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md`
— spine thắng khi lệch với `solution-design.md`.

## Chính sách

- Không thêm dependency runtime, CDN, webfont, hay bất kỳ request mạng nào sau khi tải
  trang. Mọi asset phải là file cục bộ trong repo.
- Không đổi origin/đường dẫn production (`https://truongthanhnam.github.io/bmad/`), tên DB
  IndexedDB `ghichu`, tên BroadcastChannel `ghichu`, hay cấu hình Pages (nhánh `main`,
  folder `/`) — đổi là mất sạch ghi chú của người dùng. Không xóa `.nojekyll`.
- Mỗi lần deploy phải bump `APP_VERSION` trong `app/core/limits.js` bằng tay; đừng bump
  `version` trong `package.json`, app không đọc nó.
- Commit tiếng Việt theo conventional-commits, một commit mỗi story, push thẳng `main`.
  Không CI, không staging: đường lui là `git revert` cộng một lần bump `APP_VERSION` nữa.

## Nơi để tìm

- `app/main.js` — bootstrap, và là file DUY NHẤT được import từ `app/adapters/`
- `app/core/limits.js` — mọi hằng số, ngưỡng, và `APP_VERSION`
- `app/core/time.js` — mọi chỗ dựng/đọc `Date`; `app/core/fold.js` — bỏ dấu tiếng Việt
- `app/core/errors.js` — tập mã lỗi đóng + microcopy; `app/core/banner.js` — bảng ưu tiên dải băng
- `app/adapters/` không có test tự động theo luật; kiểm nó bằng checklist 1–27 trong `README.md`

## Chạy và kiểm chứng

- `npm test` chạy toàn bộ (~690 test, vài giây). `tools/` cố ý nằm ngoài phạm vi đó.
- Đừng mở `index.html` bằng `file://` — không phải secure context, module bị chặn và
  `crypto.randomUUID` không tồn tại. Phục vụ qua HTTP localhost (`phucVuTinh()` trong
  `tools/cdp.mjs`); không có script `npm start`.
- `npm run thu-tay` và `npm run thu-bo-cuc` lái Chrome/Edge thật qua CDP: cần trình duyệt
  cài sẵn, đặt `GHICHU_BROWSER` nếu nó dò không ra. `thu-tay` chậm có chủ ý (chờ hết
  `DRAFT_STALE_MS`).
- Suite ghim `TZ=Asia/Kolkata`; đừng gỡ — múi lệch nửa giờ là thứ duy nhất bắt được lỗi
  dựng hậu tố offset.
- Không có lint/formatter/CI. Test là cổng duy nhất.

## Quy ước khác mặc định

- Định danh, comment, tên file, tên test, commit, microcopy đều bằng tiếng Việt. Ngoại lệ
  có chủ ý: bề mặt API của `ports`/`adapters` và tên trường bản ghi là tiếng Anh. Cấm chữ
  `card` trong mã sản phẩm — dùng `mẩu giấy` / `mau-giay`.
- Tầng: `core` và `ports` chỉ JS thuần, không DOM và không API trình duyệt; `view` chỉ đọc
  state và phát action, không tự đổi state, không import lẫn nhau — nối chéo bằng callback
  từ `main.js`; `adapters` không bao giờ gọi vào view, kể cả để báo lỗi.
- Import tương đối phải ghi đuôi `.js`/`.css`; không bare specifier trong `app/`.
- Tập trung hóa bắt buộc, có test quét mã nguồn chặn: số (`limits.js`), `Date` (`time.js`),
  bỏ dấu (`fold.js`), đổi state (`core/state.js`), màu và token (`app/style.css` theo DESIGN.md).
- Tĩnh tuyệt đối: không `transition`, `animation`, `@keyframes`, `:hover`, kéo-thả, hay menu
  chuột phải. Cần chuyển động thì nâng bộ quét trong `test/token-style.test.js` trước.
- Không có state nghĩa là "đang lưu / đã lưu / còn lại bao nhiêu ký tự"; tên biến chứa các
  chữ đó bị test chặn.

## Bẫy đã gặp

- Đừng đoán "có tab khác đang sống" bằng `heartbeat`: sau một lần tải lại, nhịp tim mới
  tinh chính là của tab này ở kiếp trước, nên nó tự bỏ rơi bản nháp của mình. Dùng khóa
  sống `navigator.locks` (README mục 10–11).
- Ghi chú chỉ sống trong IndexedDB. `localStorage` chỉ mang đúng ba khóa `ghichu.theme`,
  `ghichu.lastBackupAt`, `ghichu.persistDenied` (khóa lạ → `TypeError`); `sessionStorage`
  chỉ `ghichu.tabId`.
- Nhập file sao lưu là hai pha, gộp theo `id`, chỉ thêm: kiểm toàn bộ file trước, rồi ghi
  trong MỘT transaction. `commitDraft` cũng phải một transaction, nếu không sinh ghi chú
  trùng nội dung với `id` khác — gộp theo id không sửa được.
- Cặp `--danger` trên `--chip-bg` bản dark đúng 4.55:1; đổi một trong hai màu đó thì tính
  lại tương phản trước khi commit.
- Trong `main.js`, adapter thật phải đứng sau `...congTam()` khi spread, nếu không stub âm
  thầm đè lên.
- Đừng export `store` ra `window` để debug.

<!-- /bmad:context -->
