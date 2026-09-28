---
title: 'Story 2.1 — Bốn tầng cố định trên nền bàn'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
baseline_commit: '0789d2026ddb67be38f5fa3a060213765b0ac38b'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `<body>` hiện chỉ có `<main></main>` rỗng: sản phẩm chưa có một hình dạng nào trên màn hình, và mọi story còn lại của Epic 2 (ô soạn thảo, lưới, trạng thái rỗng) không có chỗ để đổ nội dung vào.

**Approach:** Dựng khung bốn tầng dọc cố định — ô soạn thảo → khay tìm kiếm + lọc ngày → lưới ghi chú → chân trang — trong đó ba tầng ngoài cùng không cuộn và tầng lưới là vùng cuộn duy nhất của trang; lưới chia cột bằng `auto-fill` không một breakpoint nào. Đây là story **chỉ hình dạng**: không hành vi, không state, không nối store.

## Boundaries & Constraints

**Always:**
- Bốn tầng đúng thứ tự trên→dưới; ba tầng đầu không cuộn, tầng lưới là vùng cuộn duy nhất của trang (trang không bao giờ có thanh cuộn ngoài).
- Lưới: `grid-template-columns: repeat(auto-fill, minmax(var(--note-min-col), 1fr))`, `gap: var(--grid-gap)`, vùng chứa `max-width: var(--container-max)` căn giữa, lề `var(--page-gutter)`.
- Mọi giá trị đi qua token đã có trong `:root` của `app/style.css`. Không màu viết thẳng, không px cứng ngoài token, không `@media`, không khối CSS lồng — `test/token-style.test.js` cưỡng chế cả bốn.
- Single-surface: không điều hướng, không route, không màn hình thứ hai, không webfont, không tài nguyên mạng.
- Markup ngữ nghĩa, thứ tự DOM = thứ tự đọc = thứ tự tab; không tắt focus ring ở bất cứ đâu.

**Never:**
- Không hành vi nào: không nghe phím, không đọc/ghi state, không import `app/core/` hay `app/ports/`, không sửa `app/main.js`.
- Không dựng mẩu giấy thật, không nội dung mẫu/placeholder giả trong lưới (trạng thái rỗng thuộc Story 2.6, và lưới rỗng ở story này phải trống thật).
- Không thêm/sửa/xóa token trong `:root`, không sửa bảng ghim của `test/token-style.test.js`.
- Không đưa bóng (`shadow`) vào story này — bóng lõm ô soạn thảo thuộc Story 2.2, bóng nhị mẩu giấy thuộc Story 2.5; cả hai cần token mới nên là quyết định riêng của story đó.
- Không breakpoint cố định nào, không nhánh mobile.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cửa sổ siêu rộng (≥1600px) | Lưới có ≥4 ô | Trần thực tế **3 cột**; vùng chứa dừng ở 1040px, căn giữa | N/A |
| Cửa sổ ~800px (dải 560–828px) | Lưới có ≥3 ô | Rớt về 2 cột, không khai báo mốc nào. Ranh giới 3↔2 cột ở đúng **828px** (`3×260 + 2×8 + 2×16`) là **hệ quả số học của token**, không phải một mốc — 900px vẫn là 3 cột | N/A |
| Cửa sổ ~500px hoặc phóng 200% | Lưới có ≥2 ô | Rớt về 1 cột, nội dung không bị cắt ngang | N/A |
| Lưới dài hơn chỗ còn lại | Nhiều ô trong lưới | Chỉ tầng lưới cuộn; ô soạn thảo, khay, chân trang đứng yên | N/A |
| Lưới rỗng | Không ô nào | Lưới chiếm chỗ còn lại, trống hoàn toàn, chân trang vẫn ở đáy | N/A |
| CSS không tải được | Chỉ có HTML | Bốn tầng vẫn hiện đúng thứ tự đọc, không tầng nào biến mất | N/A |

### Quyết định của người dùng

- **Tầng 2 và tầng 4 dựng đủ hình dạng tĩnh, không hành vi.** Khay tìm kiếm có nhãn `tìm` + ô từ khóa (giãn nở) và nhãn `ngày` + ô ngày (cố định 118px) kèm icon lịch **inline SVG 16px** — icon duy nhất của sản phẩm. Chân trang có hai link `xuất sao lưu` · `nạp lại` và nút theme nhãn chữ `nền tối` đẩy sang phải. Không một cái nào có hành vi ở story này: hành vi tra cứu thuộc Epic 6, hai link thuộc Story 4.1, nút theme thuộc Story 3.3. Chúng tồn tại để hình dạng và mật độ đo được ngay bây giờ.
- **Không bóng ở story này.** Token `--shadow-*` do story đầu tiên thật sự cần nó mở đường (2.2 cho bóng lõm ô soạn thảo, 2.5 cho bóng nhị mẩu giấy). Bất biến "`:root` khai báo đúng tập token đã ghim" của Story 1.8 giữ nguyên qua story này.
- **Kiểm thử hai lớp.** Một file Vitest quét văn bản `index.html` + `app/style.css` chạy trong `npm test`; cộng một script npm riêng dùng `tools/cdp.mjs` mở Chrome thật để đo số cột ở ba bề rộng và xác nhận chỉ lưới cuộn. Script CDP **không** vào `npm test` — cùng quy ước với `npm run thu-tay`.

</frozen-after-approval>

## Code Map

- `index.html` -- `<body>` chỉ có `<main></main>` (dòng 44); đây là chỗ dựng bốn tầng. **Không đụng `<head>`**: script theme nội tuyến và vị trí của nó trước `<link>` bị `test/token-style.test.js` khóa; thêm `<script>` thứ hai vào `<head>` làm đỏ ca "có đúng một `<script>` trong `<head>`".
- `app/style.css` -- hai khối `:root` (33–92) là token, **chỉ đọc** ở story này. Đã có sẵn dùng được: `.container` (max-width + `margin-inline:auto` + `padding-inline: var(--page-gutter)`), `html`/`body`. Luật CSS mới viết tiếp vào cuối file.
- `test/token-style.test.js` -- nguồn của mọi ràng buộc CSS: không màu viết thẳng, không `width: <số>px` trần, không `@media`/at-rule có khối, không ngoặc lồng quá một tầng, không tắt focus ring (quét cả chú thích), `:root` chỉ ở `app/style.css`. Đọc trước khi viết CSS; **không sửa**.
- `test/trang-tinh.test.js` -- ghim: mọi `href`/`src` cục bộ phải tồn tại, không tài nguyên ngoài/webfont/CDN. File CSS/JS mới phải được nạp bằng đường dẫn có thật.
- `app/view/` -- thư mục rỗng (chỉ `.gitkeep`), là chỗ của mã view. Story này có thể không cần file JS nào.
- `app/main.js` -- dòng 80–82 nói view của Epic 2+ nối vào đây và nhận `store` qua tham số. Story này **không** nối gì.
- `_bmad-output/planning-artifacts/ux-designs/.../DESIGN.md` -- dòng 235–261 (lưới, mật độ đã siết, bốn tầng), 285–300 (anatomy từng component). `mockups/key-hom-nay.html` dòng 159–194 là cấu trúc tham chiếu.
- `tools/cdp.mjs` -- export `phucVuTinh(goc)` dựng HTTP server tĩnh cổng động và điều khiển Chrome qua CDP, **không dependency**. `tools/` không đi vào `npm test` theo thiết kế; `tools/thu-tay-ban-nhap.mjs` là mẫu để bắt chước.
- `package.json` -- chỉ một devDependency (`vitest`), và luật đó có lý do. **Không thêm dependency nào** (không jsdom, không Playwright).
- `README.md` -- mục "Danh sách thử tay" (dòng 90+); các story sau bổ sung mục vào đây.

## Tasks & Acceptance

**Execution:**
- [x] `index.html` -- dựng bốn tầng trong `<body>` bằng thẻ ngữ nghĩa (`<main>` chứa ba tầng đầu, `<footer>` là tầng bốn), thứ tự DOM đúng thứ tự đọc; tầng 2 và tầng 4 có đủ hình dạng tĩnh theo quyết định đã chốt (ô từ khóa, ô ngày + icon lịch SVG, hai link, nút theme) -- đây là bộ khung mọi story sau đổ nội dung vào
- [x] `app/style.css` -- viết luật bố cục: cột dọc chiếm trọn chiều cao khung nhìn, ba tầng ngoài không co, tầng lưới chiếm phần còn lại và là vùng cuộn duy nhất; lưới `auto-fill`/`gap`/`max-width` theo token; khay `--chip-bg` + `--radius-tray`, ô nhập `--radius-input`, nút theme `--radius-full`, **không bóng** -- hiện thực AC lưới, AC "một vùng cuộn" và hình dạng hai tầng tĩnh
- [x] `test/bo-cuc-bon-tang.test.js` -- test Vitest quét văn bản: bốn tầng có mặt đúng thứ tự trong `index.html`, lưới khai báo đủ `auto-fill`/`gap`/`max-width` bằng `var(--…)`, không chuỗi breakpoint nào, icon lịch là inline SVG không `url(`, không bóng -- không có nó thì "không breakpoint" chỉ là lời hứa
- [x] `tools/thu-bo-cuc.mjs` + `package.json` -- script CDP dùng `phucVuTinh` của `tools/cdp.mjs`: mở Chrome thật, bơm tạm N ô vào lưới, đo số cột ở ~1600/~900/~500px (kỳ vọng 3/2/1) và xác nhận chỉ tầng lưới cuộn; thêm `npm run thu-bo-cuc` -- phủ đúng những ca I/O Matrix mà quét văn bản không đo được
- [x] `README.md` -- bổ sung mục thử tay cho phần còn lại (phóng 200%, đối chiếu hai theme) và nhắc lệnh `npm run thu-bo-cuc` -- tiếp tục quy ước đã dùng từ Story 1.6

**Acceptance Criteria:**
- Given trang đã tải, when nhìn từ trên xuống, then thấy đúng bốn tầng theo thứ tự ô soạn thảo → khay tìm kiếm + lọc ngày → lưới → chân trang
- Given nội dung lưới dài hơn màn hình, when cuộn, then chỉ tầng lưới cuộn và trang không có thanh cuộn ngoài
- Given `app/style.css`, when tìm chuỗi `@media` hoặc một khai báo breakpoint nào cho lưới, then không có kết quả
- Given `npm test`, when chạy, then toàn bộ suite xanh — kể cả `token-style` và `trang-tinh` chưa hề bị sửa
- Given DevTools, when đo, then khe lưới `8px` và lề trang `16px` đều đến từ token, không giá trị rộng hơn của file HTML hướng (padding mẩu giấy `8px/12px` chỉ đo được từ Story 2.5, khi mẩu giấy thật tồn tại)
- Given tầng 2 và tầng 4, when bấm vào bất kỳ ô nhập, link hay nút nào, then không có gì xảy ra — chúng là hình dạng, chưa có hành vi

## Implementation Notes

- **`~900px` của I/O Matrix là ước lượng, không phải phép đo.** Số học của token đặt ranh giới
  3↔2 cột ở đúng `3×260 + 2×8 + 2×16 = 828px`, nên một cửa sổ 900px thật sự vẫn cho **3 cột**.
  Không sửa CSS để chiều theo con số đó — làm vậy là thêm đúng cái breakpoint mà story cấm.
  `tools/thu-bo-cuc.mjs` lấy mẫu dải 2 cột ở **800px** và ghim riêng ranh giới 828px bằng cặp
  830/826px, nên một lần đổi `--note-min-col`/`--grid-gap`/`--page-gutter` sẽ làm nó lệch ồn ào.
- **"Ô ngày cố định 118px" viết bằng token, không bằng số trần:**
  `inline-size: calc(var(--space-7) * 3 - var(--space-1) / 2)` = 120 − 2 = 118px. Một
  `width: 118px` trần vừa đỏ `test/token-style.test.js` vừa phá luật "mọi giá trị đi qua token".
- **Chiều cao ô soạn thảo đặt bằng `rows="3"`,** không bằng `min-height: 92px` — cùng lý do.
  Bóng lõm và chiều cao thật của ô soạn thảo thuộc Story 2.2.
- **`body` mang `overflow: hidden`** bên cạnh `display: flex`. Nó không thừa: đó là cái chốt
  làm "trang không bao giờ có thanh cuộn ngoài" thành bất biến cưỡng chế được, thay vì một hệ
  quả may mắn của việc mọi tầng đang vừa chỗ.
- **Icon lịch dùng `stroke="currentColor"`** và ăn màu từ `.o-ngay-boc`, nên SVG nội tuyến
  không viết ra một giá trị màu nào — `test/token-style.test.js` quét cả `index.html`.

## Spec Change Log

## Review Triage Log

Vòng 1 — ba lớp: `blind-hunter`, `edge-case-hunter`, `verification-gap`.

| # | Phát hiện | Verdict | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Phép kiểm hai theme trong `thu-bo-cuc.mjs` không chứng minh gì: chỉ khẳng định giá trị bắt đầu bằng `rgb` và token bắt đầu bằng `#` — đúng vô điều kiện | medium | `getComputedStyle` luôn trả `rgb(...)`; hai bảng token đều là hex. Thay `var(--chip-bg)` bằng hex viết thẳng vẫn PASS. Nó là phép kiểm tự xanh | patch |
| 2 | Ca "phóng 200%" trùng hệt mẫu 500px: `setDeviceMetricsOverride.width` đã là điểm ảnh CSS, `deviceScaleFactor` chỉ đổi mật độ điểm ảnh vật lý | medium | Cùng 500 điểm ảnh CSS với mẫu `[500, 1]` ở trên. Dòng I/O Matrix "phóng 200%" thật ra chưa có phép đo độc lập nào | patch |
| 3 | `resize: vertical` trên `.o-soan` + `body { overflow: hidden }`: kéo ô soạn thảo cao quá khung nhìn thì lưới và chân trang bị đẩy khỏi màn hình, không một thanh cuộn nào để với tới | medium | `.tang` là `flex: none`, `.tang-luoi` đáy ở `min-block-size: 0`, `body` cấm cuộn. Trạng thái này người dùng chạm tới được bằng chuột. Mọi phép đo hiện có chạy ở chiều cao mặc định `rows="3"` | patch |
| 4 | Hai link chân trang `<a href="#">`: bấm vào là đổi URL và thêm một mục lịch sử — trái AC "bấm vào thì không có gì xảy ra"; chúng cũng là hành động chứ không phải điều hướng | medium | Hành vi mặc định của neo tới fragment. Nút theme cạnh đó đã là `<button>`, nên lệch chuẩn nằm ngay trong cùng một hàng | patch |
| 5 | `.o-ngay-boc` thiếu `box-sizing: border-box`: 118px nội dung + 8px đệm + 2px viền = hộp ngoài 128px, không phải 118px như DESIGN.md chốt | low | Chỉ `.o-soan` và `.o-nhap` có `box-sizing`. Sửa là thêm đúng một dòng — sửa trực tiếp, không thêm phức tạp | patch |
| 6 | `cdp.tabMoi()` nằm ngoài `try/finally`: nó ném thì tiến trình trình duyệt và hồ sơ tạm bị bỏ lại | low | `const tab = await cdp.tabMoi(...)` đứng trước `try`. Sửa là dời một dòng vào trong | patch |
| 7 | Biểu thức kiểm "chỉ một vùng cuộn" bỏ sót `overflow-x` và dạng viết tắt `overflow: hidden auto` | low | Mẫu hiện tại là `overflow(-y\|-block)?`. Một vùng cuộn thứ hai thêm sau bằng hai cách viết đó sẽ lọt. Sửa là nới đúng một biểu thức | patch |
| 8 | Trạng thái rò rỉ giữa các pha của bộ đo: khối phóng 200% để lại `deviceScaleFactor: 2` và các ô đã bơm; vòng lặp theme chạy dưới điều kiện đó | low | Không ảnh hưởng kết quả hôm nay, nhưng phép đo thêm sau sẽ hỏng khó hiểu. Sửa là đặt lại ở cuối khối | patch |
| 9 | Không có luật `:focus-visible` nào dù README mục 19 đòi thấy focus ring | low | Ring mặc định của trình duyệt vẫn còn — không chỗ nào tắt nó, `token-style.test.js` cấm tuyệt đối — nên mục 19 vẫn kiểm được. Viền focus 3px là đặc tả của Story 2.2. Fix thêm bề mặt CSS mới | bác bỏ |
| 10 | `overflow-y: auto` kéo theo `overflow-x: auto`: dưới ~292px điểm ảnh CSS sẽ có thanh cuộn ngang trong lưới | low | Chỉ chạm tới ở phóng 400%; yêu cầu đã chốt là 200% và phép đo thật đã đạt. Fix (`minmax(min(…), 1fr)`) sửa đúng chuỗi mà khối đóng băng ghim nguyên văn | bác bỏ |
| 11 | Ranh giới 828px có thể lệch nếu thanh cuộn dọc ăn mất bề rộng | low | 9 ô cao 120px trong khung 900px không tràn, nên không có thanh cuộn. Fix là thêm một phép khẳng định phòng xa | bác bỏ |
| 12 | Chờ cứng 150ms sau `setDeviceMetricsOverride` có thể đo trên layout cũ | low | Chưa từng chớp trong các lần chạy. Fix là một vòng poll — thêm phức tạp cho một rủi ro chưa xuất hiện | bác bỏ |
| 13 | Biểu thức `/<div class="luoi"\s*>…/` và bộ cắt khối CSS dễ vỡ | low | Ca "lưới rỗng" cố ý chỉ đúng cho story này; Story 2.5 sẽ viết lại nó cùng lúc dựng mẩu giấy. At-rule đã bị `token-style.test.js` chặn ồn ào | bác bỏ |
| 14 | `calc(var(--space-7) * 3 - var(--space-1) / 2)` là số ma khoác áo token | low | Đúng về nguyên tắc, nhưng `--space-7` bị bảng ghim khóa nên không đổi được vô ý. Fix là thêm một token — điều khối đóng băng cấm ở story này | bác bỏ |
| 15 | Phép đo 200% không đo "nội dung bị cắt", chỉ đo số cột và tràn ngang | low | README mục 18 vẫn giữ phần nhìn bằng mắt cho đúng chỗ này. Fix là thêm phép đo clipping từng phần tử — hơn một sửa trực tiếp | bác bỏ |
| 16 | README mở danh sách ở số `18.` không có ngữ cảnh | false | README đã có mục 1–17 ở phần trên (dòng 147–217); 18–19 nối tiếp đúng quy ước, và tham chiếu "mục 14" trỏ tới một mục có thật | bác bỏ |
| 17 | `npm run thu-bo-cuc` không nằm trong `npm test`, nên mọi bất biến layout tính toán chỉ được bảo vệ khi có người nhớ chạy nó | medium (chưa xác minh được mức) | Đúng như mô tả, nhưng đây là quy ước đã chốt từ `npm run thu-tay` (cần trình duyệt thật trên máy, không thêm dependency). Nối nó vào một runner là quyết định cấp dự án, không phải của story này | defer |

## Design Notes

Chiều cao khung nhìn là cái trục của cả story: ba tầng ngoài `flex: none`, tầng lưới `flex: 1` + `overflow-y: auto` + `min-height: 0`. Thiếu `min-height: 0` thì flex item không co dưới kích thước nội dung và thanh cuộn nhảy ra ngoài trang — đúng thứ AC cấm.

`--container-max` **không** phải trang trí: 1040px trừ hai lề 16px còn 1008px, vừa 3 cột (`3×260 + 2×8 = 796`) và thiếu so với 4 cột (`4×260 + 3×8 = 1064`). Trần 3 cột là **hệ quả số học** của token, không phải một mốc khai báo — đừng "giúp" nó bằng một breakpoint.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ suite xanh, không sửa một dòng nào trong `test/token-style.test.js` hay `test/trang-tinh.test.js`

**Manual checks (if no CLI):**
- Mở trang qua HTTP server (không `file://`), kéo cửa sổ từ siêu rộng về hẹp: đếm 3 → 2 → 1 cột, không có bước nhảy nào khác
- Đổ tạm nhiều ô vào lưới bằng DevTools rồi cuộn: ô soạn thảo, khay và chân trang đứng yên; trang không có thanh cuộn ngoài
- Phóng trình duyệt 200%: còn dùng được, lưới về 1 cột, không chữ nào bị cắt
- Thử ở cả hai theme: không màu nào lệch khỏi token
