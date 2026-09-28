---
title: 'Story 3.3 — Nút theme và tương phản ở cả hai bảng màu'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'ed71adf2caeca0ea913aebebaee647847b437d5b'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nút `.nut-theme` ở chân trang đã có hình dạng đúng từ Story 2.1 nhưng **không có một dòng hành vi nào**: bấm vào không đổi gì, `ghichu.theme` không bao giờ được ghi, và bảng dark — đã khai đủ 12 token từ Story 1.8 — chưa một lần nào **với tới được** trong lúc dùng thật. Hệ quả thứ hai nặng hơn: ngưỡng tương phản ≥ 4.5:1 mới chỉ được *khai báo* trong chú thích, chưa có ca nào **đo** nó, nên bốn epic sau có thể thêm cặp chữ/nền không đạt mà suite vẫn xanh.

**Approach:** Nối hành vi cho đúng một nút đã tồn tại (đổi `data-theme`, ghi khóa cấu hình, đổi nhãn chữ, phát tín hiệu phiên đổi), rồi biến ngưỡng tương phản từ lời hứa thành **phép đo tự động trên cả hai bảng màu** — cộng một cảnh báo tại chỗ cho cặp `danger`/`chip-bg` bản dark vốn chỉ còn 4.55:1.

## Boundaries & Constraints

**Always:**
- Nhãn là **chữ**: `nền tối` khi đang sáng, `nền sáng` khi đang tối. Viền mảnh, bo tròn hoàn toàn (`--radius-full`) — CSS đã đúng, không sửa.
- Lựa chọn ghi qua cổng `sessionStore` với khóa `theme` (tên thật `ghichu.theme`, bảng khóa đóng băng ở `app/adapters/localstorage.js`). Không module nào dưới `app/view/` được chạm thẳng `localStorage`.
- Script nội tuyến trong `<head>` của `index.html` là **nơi duy nhất** đọc theme lúc tải; nó **không bao giờ ghi**. Không sửa ngữ nghĩa của nó.
- Chỉ đặt/đọc `data-theme` trên `<html>`. Hai khối khai báo token giữ nguyên số lượng và giá trị.
- `style.css` vẫn **không một giá trị màu viết thẳng nào** ngoài hai khối token.
- Mọi phép đo tương phản dùng công thức WCAG đã có sẵn (`tuongPhan` trong `tools/thu-bo-cuc.mjs`), không viết công thức thứ hai.

**Never:**
- Không icon mặt trời/mặt trăng, không phím tắt cho theme (sản phẩm có đúng bốn phím).
- Không thêm token mới, không thêm `@media`, không đổi bất kỳ hex nào của `DESIGN.md` để "cho dễ đạt ngưỡng".
- Không dựng hộp chọn ba trạng thái (sáng/tối/theo hệ thống) — nút là một phép lật hai chiều.
- Không đụng `app/view/mau-giay.js`, `luoi.js`, `banner.js`, và không nối hành vi cho hai link `xuất sao lưu` / `nạp lại` (Story 4.1, 4.3).
- Không hoạt ảnh chuyển theme (Story 3.4 sở hữu luật chuyển động).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lật sang tối | `data-theme="light"`, bấm nút | `data-theme="dark"`, nhãn thành `nền sáng`, `ghichu.theme` = `'dark'` | N/A |
| Lật về sáng | `data-theme="dark"`, bấm nút | `data-theme="light"`, nhãn thành `nền tối`, khóa = `'light'` | N/A |
| Nhớ lại lần sau | khóa = `'dark'`, tải lại trang | Khung hình ĐẦU TIÊN đã tối; nhãn đọc `nền sáng` | N/A |
| Chưa từng chọn | khóa vắng mặt, hệ thống đang tối | Trang tối theo hệ thống; nhãn `nền sáng`; khóa **vẫn vắng mặt** cho tới lần bấm đầu | N/A |
| Kho bị chặn | `sessionStore.write` ném `QUOTA`/`DB` | Theme **không** đổi (ghi trước, đặt sau); nhãn giữ nguyên; dải băng hiện microcopy của mã lỗi | Qua `core/errors.js`, không chuỗi lỗi thô |
| Không có kênh | Môi trường thiếu `BroadcastChannel` | Ghi theme vẫn thành công; không bản tin nào phát; không lỗi nào nổi lên | Dựng kênh lười, bỏ qua trong im lặng |
| Chuột vs bàn phím | click / `Enter` trên nút | Cùng một kết quả; click không bật vòng sáng, bàn phím thì có | N/A |

## Quyết định đã chốt

- **QĐ-1 — Theme là một trường state, không phải một biến closure.** Thêm `theme` vào `stateRong()` (tầng B′ — bền, dùng chung cho mọi tab) và một action `datTheme` trong `app/core/state.js`. Tập khóa state nới **7 → 8**, và sáu chỗ ghim con số bảy trong `test/core-state.test.js` được cập nhật **có chủ ý** cùng một chú thích nêu lý do. Đổi lấy: phép ghi kho bền vẫn nằm trong `state.js` — không ngoại lệ nào cho tầng view — và lỗi ghi tự đi ra dải băng qua khuôn `ghiTruocDatSau` đã có.
- **QĐ-2 — Dựng adapter `BroadcastChannel` tối giản ngay trong story này.** `app/adapters/broadcast.js` hiện thực đúng hai phương thức của `CHANNEL_METHODS`, nối vào `congThat()` ở `app/main.js`. Hình dạng bản tin chốt ngay theo `app/ports/channel.js`: `{ v: 1, type: 'session-changed', from: <danh tính tab>, appVersion: <phiên bản mã> }`. `subscribe` được hiện thực nhưng **chưa ai đăng ký nghe** — xử lý tin đến là Epic 7. Một môi trường không có `BroadcastChannel` (Node lúc chạy `trang-tinh.test.js`) phải dựng được adapter mà **không** chạm global — mở kênh LƯỜI, đúng khuôn hai adapter hiện có.
- **QĐ-3 — Giữ nguyên spec đầy đủ** dù vượt ngưỡng 1.600 token; phần lớn độ dài là Code Map dạng tra cứu, đúng tiền lệ Story 3.1 và 3.2.

</frozen-after-approval>

## Code Map

- `index.html:18-40` — script theme đồng bộ nội tuyến; đọc `ghichu.theme`, dự phòng `prefers-color-scheme`, đặt `data-theme`. **Không ghi, không sửa ngữ nghĩa.**
- `index.html:150` — `<button class="nut-theme" type="button">nền tối</button>`, nhãn TĨNH. Đây là phần tử cần nối hành vi.
- `app/style.css:33-95` (`:root`) và `:103-119` (`:root[data-theme="dark"]`) — 24 hex, chỗ **duy nhất** màu được phép tồn tại. `:19-22` đã có cảnh báo về `--danger`/`--chip-bg` dark; AC đòi nó nói rõ "tính lại **trước khi commit**".
- `app/style.css:571-579` (`.nut-theme`) — viền `--rule`, `--radius-full`, chữ `--ink-2`. **Đã đạt AC hình dạng, không sửa.**
- `app/adapters/localstorage.js:22-26,55-77` — `BANG_KHOA.theme = 'ghichu.theme'`; `read`/`write` **đồng bộ và NÉM** (`MA_LOI.QUOTA` / `MA_LOI.DB`).
- `app/core/state.js:154-173` (`stateRong`, bảy trường), `:267-269` (`taoStore`), `:311-327` (`datLai` + phép gác ưu tiên dải băng), `:429-448` (`ghiTruocDatSau` — khuôn "ghi cổng trước, đặt state sau, hỏng thì ra dải băng"). Liên quan Open Question 1.
- `app/main.js:60-66` (`congThat`), `:72-135` (cửa `typeof document !== 'undefined'`, `veTatCa`, thứ tự nối view). Chỗ **duy nhất** nối view mới.
- `app/view/tieu-de.js:72-85` — khuôn view nhỏ nhất: nhận `store` + `doc` qua **tham số**, trả `{ ve }`, không import adapter, không giữ state riêng. Bắt chước đúng khuôn này.
- `app/ports/channel.js:12-23,48` — hình dạng `ChannelMessage` và `CHANNEL_METHODS`. Liên quan Open Question 2.
- `test/core-state.test.js:40,64,232,1077,1088,1175` — sáu chỗ ghim tập **bảy** khóa. Đọc trước khi chọn phương án 1A.
- `test/bo-cuc-bon-tang.test.js:159-180` — ghim nhãn tĩnh `nền tối` trong HTML và ba luật CSS của nút. Ca này **phải vẫn xanh**.
- `test/token-style.test.js:256-290` (hai khối token, 12 token dark, `color-scheme`), `:455-616` (script theme: hình dạng + chạy thật với kho/`matchMedia` giả). Nơi đúng để thêm ca tương phản trên bảng token.
- `tools/thu-bo-cuc.mjs:1183-1230` (`tuongPhan`, đọc màu thật qua `getComputedStyle`), `:1341-1390` (khuôn lặp **cả hai theme** bằng `document.documentElement.dataset.theme`). Tái dùng cả hai, **không viết công thức mới**.
- `test/helpers/quet-nguon.js` — `boChuThich(duongDan, ma)`, khuôn bắt buộc cho mọi test quét nguồn.
- `_bmad-output/planning-artifacts/epics.md:988-1017` — AC nguyên văn Story 3.3.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/state.js` — thêm trường `theme` vào `stateRong()` (QĐ-1) và action `datTheme(giaTri)`: chỉ nhận `'light'`/`'dark'`, ghi cổng `sessionStore.write('theme', …)` **trước**, đặt state **sau**, hỏng thì ra dải băng theo khuôn `ghiTruocDatSau`; sau khi ghi thành công thì `channel.publish` một bản tin `session-changed` (QĐ-2). Giá trị khởi tạo đọc từ `data-theme` mà script `<head>` đã đặt, đi vào qua `khoiDong` chứ không qua một global.
- [x] `test/core-state.test.js` — cập nhật `KHOA_STATE` 7 → 8 ở cả sáu chỗ, kèm chú thích nêu QĐ-1; thêm ca cho `datTheme`: giá trị lạ bị từ chối, ghi ném thì state **không** đổi và dải băng mang đúng mã lỗi.
- [x] `app/adapters/broadcast.js` — **file mới**: hiện thực `publish`/`subscribe` của `CHANNEL_METHODS` trên `BroadcastChannel`, mở kênh **lười** (không chạm global lúc import, đúng khuôn hai adapter hiện có), tên kênh mang tiền tố `ghichu.`.
- [x] `app/view/nut-theme.js` — **file mới** theo khuôn `tieu-de.js` (nhận `store` + `doc` qua tham số, trả `{ ve }`, không import adapter): `ve()` đặt nhãn chữ và `data-theme` từ `store.state.theme`; `click` gọi `store.datTheme(<chiều ngược lại>)` rồi vẽ lại. Không giữ state riêng, không đọc `localStorage`.
- [x] `app/main.js` — thêm `broadcast` vào `congThat()`, nối view mới trong cửa `typeof document !== 'undefined'` và thêm nó vào `veTatCa`; không đổi thứ tự nối của bốn view cũ.
- [x] `index.html` — giữ nhãn tĩnh `nền tối`; thêm chú thích nêu rõ vì sao nhãn tĩnh và nhãn thật có thể lệch một khung hình, và ai sửa thì sửa cùng lúc với `bo-cuc-bon-tang.test.js:168`.
- [x] `app/style.css` — viết lại cảnh báo ở `:19-22` cho đúng chữ AC: đổi `--chip-bg` bản dark thì **phải tính lại cặp `--danger`/`--chip-bg` trước khi commit**; thêm cùng câu đó vào `README.md`.
- [x] `test/theme.test.js` — **file mới**: (a) mọi cặp chữ/nền **thực sự được dùng** trong `style.css` đạt ≥ 4.5:1 ở **cả hai** bảng token, tính từ chính hai khối token; (b) cặp `--danger` trên `--chip-bg` dark ra **đúng 4.55** (làm tròn 2 chữ số) — ca này đỏ ngay khi ai đó đổi một trong hai hex; (c) quét nguồn: `--ink-decor` **không bao giờ** là giá trị của `color`; (d) mọi luật đặt `font: var(--font-foot)` đều đi cùng `color: var(--ink-2)` hoặc đậm hơn.
- [x] `test/theme.test.js` (tiếp) — hành vi nút với `document` giả và cổng giả: lật hai chiều, nhãn đúng chiều, ghi đúng khóa `theme`, phát **đúng một** bản tin `session-changed` đúng hình dạng bốn trường, và khi cổng ghi **ném** thì state không đổi còn dải băng mang đúng mã lỗi.
- [x] `tools/thu-bo-cuc.mjs` — thêm nhóm ca đo **thật** trên trình duyệt: bấm nút bằng chuột và bằng `Enter` đều lật `data-theme`; sau khi lật, mọi phần tử mang chữ có tỉ lệ ≥ 4.5:1 với nền thật của nó (đo `getComputedStyle`, dùng `tuongPhan` sẵn có) ở **cả hai** theme.
- [x] `README.md` — thêm mục thử tay: lật theme, tải lại trang, xác nhận không nháy khung sáng và nhãn đọc đúng chiều.

**Acceptance Criteria:**
- Given một bảng token bị đổi một hex làm tụt một cặp xuống dưới 4.5:1, when `npm test`, then ca tương phản **đỏ** và nêu đúng tên cặp token.
- Given `style.css`, when grep giá trị màu ngoài hai khối token, then không một kết quả nào (`test/token-style.test.js` giữ nguyên xanh).
- Given trang chạy trên trình duyệt thật ở **cả hai** theme, when `npm run thu-bo-cuc`, then mọi phần tử mang chữ đạt ≥ 4.5:1 và toàn bộ ca của Story 3.1/3.2 vẫn xanh.
- Given `test/bo-cuc-bon-tang.test.js` và `test/focus-va-tab.test.js`, when chạy sau thay đổi, then **không ca nào** phải sửa để xanh trở lại (trừ những ca mà quyết định của Open Question 1 buộc phải đổi, và mỗi ca đó phải được nêu tên trong Implementation Notes).
- Given một phép đột biến (gỡ lời gọi ghi `ghichu.theme`), when chạy suite, then có ca **đỏ** — chứng minh AC "nhớ lại lần sau" thật sự được ghim.

## Implementation Notes

**Ba luật CSS phải đổi token màu — phép đo bắt được một cặp dưới ngưỡng đã tồn tại từ trước.**
Ngay khi ca (a) chạy thật, hai cặp đang dùng lộ ra là **không** đạt 4.5:1, và cả hai đã ở trong
mã từ Story 2.1/3.1 — chú thích khai ngưỡng, nhưng chưa ai đo:

- `--ink-2` trên `--chip-bg` bản **light** = **4.24:1**. Nó là chỗ đứng của `.khay-nhan` (nhãn
  `tìm`/`ngày`) và `.dai-bang-dong` (nút `✕`). Cả hai đổi sang `var(--ink)` → 10.49:1. Hex
  **không** đổi một giá trị nào — AC cấm, và không cần: chỗ hỏng là phép DÙNG token, không phải
  bảng token.
- `--ink-decor` trên `--bg` = **2.31:1** ở light, 3.40:1 ở dark. Nó là `color` của `.chan-cham`
  (dấu `·`), tức đúng thứ AC "`ink-decor` không bao giờ là chữ" cấm. Đổi sang `var(--ink-2)` →
  4.92:1. `--ink-decor` vẫn ở nguyên vai của nó làm màu `border` chấm chấm của `.mau-xoa`.

**Bốn ca test phải sửa, và không ca nào thuộc hai file mà AC bảo vệ** (`bo-cuc-bon-tang.test.js`
và `focus-va-tab.test.js` không đổi một dòng):

1. `test/core-state.test.js` — sáu chỗ ghim tập **bảy** khóa thành **tám** (QĐ-1), kèm chú thích
   nêu lý do, cộng khối `describe('datTheme …')` mới.
2. `test/banner.test.js:537` — ghim `.dai-bang-dong` dùng `--ink-2`; đổi thành `--ink` cùng lý do
   đo được ở trên.
3. `test/luoi.test.js` — ghim lượt vẽ chung gồm **ba** view; nới thành **bốn** (`nutTheme`). Đây
   chính là cái bẫy mà ca đó tự đặt ra cho mình ("một view thứ tư thêm vào ngày mai vẫn phải đọc
   lại chú thích này").
4. `test/luoi.test.js` + `test/banner.test.js` — regex `khoiDong\(\)\.then\(…)` nới thành
   `khoiDong\(…\)\.then\(…)`, vì `khoiDong` nay nhận theme lúc tải qua tham số.

**Công thức tương phản không bị viết lần thứ hai ở phía trình duyệt.** `tools/thu-bo-cuc.mjs`
dùng lại `tuongPhan` sẵn có trong `HAM_TEN`; đoạn đó được **nâng lên phạm vi module** (nó vốn
nằm trong khối Story 3.2) để khối mới dùng chung, không chép lại. Phía Node thì không import
được đoạn chuỗi ấy, nên bản Node sống ở `test/helpers/tuong-phan.js` — một file, một công thức,
có chú thích trỏ về bản kia.

**Nút theme lật bằng chính nó trong harness.** Khối đo tương phản ở hai theme không gán
`dataset.theme` như khối Story 3.2 làm: nó bấm CHUỘT thật vào nút, nên phép đo chạy trên đúng
trạng thái mà một cú bấm để lại. Mẩu giấy giả được bơm LẠI sau mỗi lần lật — lượt vẽ chung do
cú lật gây ra `replaceChildren` lưới bằng state thật (rỗng), nên bơm một lần chỉ đo được
`--paper` ở theme đầu tiên.

**Rủi ro còn lại:** một ca có sẵn của Story 2.5 trong `npm run thu-bo-cuc` ("tải lại trang: mọi
mẩu về thu gọn") đỏ một lần trong bốn lần chạy rồi tự xanh lại — nó đo chiều cao ngay sau một
lần tải lại và có vẻ nhạy với thời điểm. Không liên quan tới story này (nó không chạm lưới,
không chạm `mau-giay.js`), nhưng nó là một ca đỏ-không-đều đã có thật và nên được vá riêng.

**Bổ sung ở bước nghiệm thu — nửa ÂM TÍNH của hàng "chuột vs bàn phím".** Hàng I/O Matrix ấy có
hai vế, và chỉ vế `Enter` được ghim: "click không bật vòng sáng" mới chỉ được đo trên
`.chan-link` và mẩu giấy (khối Story 3.2), chưa trên chính nút theme. Thêm một ca vào
`tools/thu-bo-cuc.mjs` ngay **sau** cú bấm chuột thật đã có trong khối Story 3.3 — không chen
vào vòng lặp của Story 3.2, vì một cú click lên nút này LẬT cả bảng màu và sẽ đổi âm thầm môi
trường đo của mọi ca sau nó. Harness: **63/63**.

**Ca đỏ-không-đều thứ hai, cùng một dáng.** Ở lần chạy harness ngay sau khi thêm ca trên, ca
NFR-1 ("2000 ghi chú trong kho") đỏ với `kho 0 bản ghi` — phép bơm dữ liệu báo về 0 — rồi xanh
lại ở lần chạy kế tiếp mà không sửa gì.

**Rồi phép đo cho thấy hai ca ấy KHÔNG cùng một câu chuyện.** Dựng một worktree ở đúng commit
nền `ed71adf` và chạy harness **7 lần**: NFR-1 đỏ **2/7** — có trước story này; còn ca Story 2.5
("tải lại trang: mọi mẩu về thu gọn") xanh **7/7**, trong khi ở HEAD nó đỏ **2/4**. Nên nó
không phải "sẵn có" như báo cáo hiện thực nói, và được vá trong story này:

- Ca ấy luôn đỏ ở đúng **một** vế — chiều cao một mẩu `128 → 106` — còn ba vế thật sự của AC
  (mọi mẩu thu gọn, `expandedIds` rỗng, không khóa nào trong `localStorage`) luôn đúng. Tức là
  phép đo trúng một khung hình chưa dựng xong, không phải sản phẩm lùi.
- Story 3.3 thêm view thứ tư vào lượt vẽ chung và một phép đặt theme đồng bộ trong `khoiDong`,
  nên khung hình đầu sau `taiLai` dịch đi vài mili giây — vừa đủ để nhịp `nghi(100)` cố định
  hết ăn chắc.
- Phép vá: chờ tới khi **ổn định** (đọc lại cho tới khi hai lần đọc liên tiếp cho cùng dãy
  chiều cao, tối đa ~1s) thay vì chờ một con số. Phép so **không** yếu đi — dãy vẫn phải khớp
  từng số với `thuGon`. Sau khi vá: **4/4 lần chạy 66/66**.

NFR-1 thì ở lại `deferred-work.md` với bằng chứng nó đỏ ở cả commit nền.

## Spec Change Log

## Review Triage Log

**Vòng 1** — ba lớp: `blind-hunter` (14 finding), `edge-case-hunter` (9), `verification-gap` (1 + 2 phụ). Không entry nào là `intent_gap` hay `bad_spec` → không loopback.

| # | Finding | Verdict | Bằng chứng | Route |
|---|---------|---------|-----------|-------|
| 1 | `main.js` truyền theme lúc tải vào `khoiDong` nhưng không ca nào chạy đường đó | high | Lớp verification-gap (tin theo hồ sơ): hai ca Vitest truyền `'dark'` bằng tay, hai ca regex khớp cả `khoiDong()` rỗng, harness luôn ép `light` trước khi nhìn. Gỡ tham số ở `main.js` → suite vẫn xanh, còn người dùng chọn dark thì mỗi lần tải lại bị giật về light | patch |
| 2 | `new BroadcastChannel`/`postMessage` có thể ném, thoát qua `phatPhienDoi` vào `datTheme` | medium | Cả edge-case lẫn verification-gap nêu. `phatPhienDoi` chỉ bọc `tabIdentity`; `nut-theme.js` cố ý không `.catch`. Adapter hôm nay không ném, nên bất biến "không bao giờ bị từ chối" đúng do MAY, không do dựng | patch |
| 3 | Cửa ≥ 4.5:1 so trên tỉ lệ ĐÃ LÀM TRÒN | medium | `theme.test.js:171` — `tuongPhanLamTron(...) < NGUONG`: tỉ lệ thật 4.496 làm tròn thành 4.5 và lọt. Chính dụng cụ đo có một dải mù ngay tại ngưỡng của nó | patch |
| 4 | `kenhRgb` trả `NaN` cho hex không đọc được → mọi cửa ngưỡng xanh im lặng | medium | `test/helpers/tuong-phan.js` chỉ ném khi có dưới ba cặp; `#zzzzzz` → `NaN` → `NaN < 4.5` là `false` | patch |
| 5 | Hai bản công thức WCAG (Node và trình duyệt) khai là "không được lệch" nhưng không ai canh | medium | Chú thích `test/helpers/tuong-phan.js` nói thẳng ràng buộc đó; không ca nào đối chiếu hai bản | patch |
| 6 | Vòng lặp hai theme của harness không xác nhận lại cú lật | medium | `thu-bo-cuc.mjs:1769-1777` — click rồi đo ngay; click trượt thì cả hai lượt đo cùng một bảng màu và cả hai ca vẫn PASS | patch |
| 7 | Chú thích "import lại sẽ đỏ" ở ca broadcast là một lời khai sai | low | `theme.test.js:494` — ESM cache: lần import thứ hai không chạy lại thân module. Thứ thật sự chứng minh tính lười là `expect(tenKenh).toEqual([])` | patch |
| 8 | `@returns` của `datTheme` hứa "không bao giờ bị từ chối" trong khi giá trị lạ NÉM đồng bộ | low | `state.js` — `datTheme(x).catch(...)` không bao giờ thấy `TypeError` đó | patch |
| 9 | `index.html` trỏ tới `bo-cuc-bon-tang.test.js:168` bằng số dòng | low | Sửa một dòng phía trên là con trỏ sai trong im lặng | patch |
| 10 | Bộ phân tích CSS không nhìn được vào `@media`/`@supports` | maybe-false | `cacKhoi` dùng regex một tầng. Hôm nay `style.css` KHÔNG có at-rule nào và `token-style.test.js` đỏ nếu ai thêm — nên chưa tới được. Story 3.4 thêm đúng một `@media`, và lúc đó cửa "mọi luật có `color` đều khai chỗ đứng" thành mù | defer |
| 11 | `subscribe` không có đường gỡ, kênh không đóng được | low | Thật, nhưng chưa ai đăng ký nghe; xử lý tin đến là Epic 7 | defer |
| 12 | `nenSau` (trong `HAM_TEN`) và `nenThat` (trong `DO_CHU`) gần như trùng nhau | low | Thân giống nhau, chỉ khác điểm bắt đầu. Sửa là một phép refactor trên mã harness đang xanh, không phải một phép sửa thẳng | defer |
| 13 | Vòng sáng ở bản dark chỉ được khai trong README, không được đo | false | Sai: `thu-bo-cuc.mjs:1364-1390` đã lặp cả hai theme từ Story 3.2 — lần chạy này in "theme dark: vòng sáng tương phản ≥ 3:1 … thấp nhất 6.56:1" | — |
| 14 | Không ca nào ghim script nội tuyến trong `<head>` (chỗ chặn cú nháy sáng) | false | Sai: `token-style.test.js:492-616` đã ghim nó đồng bộ, nội tuyến, trong `<head>`, trước `<link>`, khóa khớp `BANG_KHOA`, KHÔNG `setItem`, và chạy thật cả nhánh `matchMedia` | — |
| 15 | Không ca nào phủ đường "chưa chọn" (theo hệ thống) | false | Cùng bằng chứng với #14 — sáu ca I/O của script chạy thật với kho vắng mặt và `matchMedia` bật/tắt | — |
| 16 | `removeItem('ghichu.theme')` lúc dọn làm các khối sau phụ thuộc theme của máy | false | Đúng một khối chạy sau nó, và nó đo bề rộng `.o-ngay-boc` — không token màu nào đổi được con số đó | — |
| 17 | Hai cú bấm nhanh liên tiếp không được tuần tự hóa | low | Cổng `sessionStore` ĐỒNG BỘ nên thứ tự ghi xác định và state/kho không bao giờ lệch nhau; hại nhất là hai cú bấm rất nhanh chỉ lật một lần. Phép sửa là thêm một cờ gác — thêm nhánh cho một chuyện gần như không gặp | bác bỏ |
| 18 | Lật theme có thể đúc danh tính tab như một hiệu ứng lề | low | `tabIdentity()` bất biến theo lời gọi, và `main.js` gọi `khoiDongBanNhap()` ngay lúc tải — danh tính có mặt trước cú bấm đầu tiên trong mọi đường chạy thật | bác bỏ |
| 19 | `khaiBaoCua` đòi selector khớp nguyên văn, đổi cách viết CSS là hỏng phép đo | false | Nó NÉM nêu đúng tên khối không tìm thấy — hỏng ồn ào, không phải xanh sai | — |
| 20 | Cửa `--font-foot` không thấy màu thừa hưởng từ tổ tiên | false | `npm run thu-bo-cuc` đo màu THẬT sau khi phân giải thừa hưởng, trên mọi phần tử mang chữ, ở cả hai theme — đúng lỗ mà lớp Vitest không bịt được | — |

## Design Notes

**Ngưỡng tương phản phải được *đo*, không được *khai*.** Story 1.8 đã ghim đúng 24 hex khớp `DESIGN.md`, nhưng "khớp mockup" và "đạt 4.5:1" là hai câu khác nhau — và chỉ câu thứ hai là thứ AD-20 hứa. Vì thế ca tương phản tính tỉ lệ **từ chính hai khối token trong `style.css`**, không từ một bảng hex chép lại: một bảng chép tay là chỗ hai nguồn sự thật bắt đầu trôi khỏi nhau, đúng lúc không ai nhìn.

**Đo ở hai tầng, mỗi tầng một câu hỏi khác nhau.** Vitest trả lời "bảng màu có hợp lệ không" — thuần, nhanh, đỏ được bằng một phép đổi hex. Harness trả lời "cặp chữ/nền *thực sự xuất hiện trên màn hình* có đạt không" — chỉ trình duyệt thật biết một phần tử `--ink-2` cuối cùng nằm trên `--paper` hay `--chip-bg`. Bỏ tầng nào cũng để lại đúng một loại lỗi không ai bắt được.

**Cặp 4.55:1 là một khoản nợ đã được ghi sổ, không phải một chỗ hỏng.** Nó đạt ngưỡng, nên không sửa; nhưng biên còn 0.05 nghĩa là **bất kỳ** phép chỉnh `--chip-bg` dark nào cũng có thể đánh tụt nó mà mắt không thấy. Ca (b) ghim đúng con số 4.55 chính là cái chuông: nó đỏ **trước** khi cặp kia kịp tụt xuống dưới ngưỡng.

**Nhãn nút là nơi duy nhất theme trở thành chữ.** Vì `index.html` phải mang một nhãn tĩnh (bàn phím và trình đọc màn hình cần một nút có tên ngay cả khi không module nào chạy), nhãn tĩnh `nền tối` có thể lệch một khung hình khi đang ở bản dark. Đó là đánh đổi chấp nhận: sai **chữ** một khung hình nhẹ hơn hẳn sai **màu** cả trang — và sửa nó đòi ghi DOM từ `<head>`, nơi `<body>` còn chưa tồn tại.

## Verification

**Commands:**
- `npm test` — expected: toàn bộ xanh, kể cả `test/theme.test.js` mới; `core-state`, `token-style`, `bo-cuc-bon-tang`, `focus-va-tab`, `state-tap-trung` không ca nào đỏ.
- `npm run thu-bo-cuc` — expected: toàn bộ xanh, kể cả nhóm ca lật theme và đo tương phản thật.

**Manual checks:**
- Mở qua HTTP localhost: bấm nút ở chân trang → cả trang đổi bảng màu, nhãn đổi chiều, không hoạt ảnh.
- Tải lại trang: khung hình đầu tiên đã đúng theme vừa chọn, không nháy một khung sáng.
- Đặt hệ thống sang dark rồi xóa khóa `ghichu.theme` trong DevTools, tải lại: trang tối, nhãn đọc `nền sáng`, khóa vẫn vắng mặt.
- `Tab` tới nút rồi `Enter`: lật đúng như bấm chuột, vòng sáng nhìn rõ ở cả hai bảng màu.
