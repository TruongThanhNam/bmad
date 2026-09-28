---
title: 'Story 3.2: Focus ring và thứ tự tab'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'be1b7a63175341aa972fb034ac218ea6c6753994'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sản phẩm cố ý chỉ có bốn phím (`Ctrl+Enter`, `Enter`, `Esc`, `Tab`/`Shift+Tab`), nên focus ring là **bản đồ di chuyển duy nhất** — nhưng hôm nay chỉ `.o-soan` có ring tùy biến (`style.css:310`); nút `✕` dải băng, mẩu giấy bị cắt, `o-tim`, `o-ngay`, hai `.chan-link` và `.nut-theme` đều **phó mặc ring mặc định của trình duyệt** (`style.css:199`, `:503`) — thứ không phải `var(--focus)` và không ai đo tương phản ≥ 3:1. Ngoài ra ba bất biến của sàn a11y (`outline: none` bị cấm, không `tabindex` dương, không phím tắt ngoài bốn phím) hiện **đúng do may** chứ chưa có ca nào ghim.

**Approach:** Thêm **một** quy tắc `:focus-visible` dùng `var(--focus)` phủ mọi phần tử tương tác, giữ nguyên ring riêng của `.o-soan`; rồi biến ba bất biến trên từ "đang đúng" thành "không lùi được" bằng test quét nguồn, cộng phép đo thứ tự Tab **thật** trong harness trình duyệt.

## Boundaries & Constraints

**Always:**
- `outline: none` / `outline: 0` **cấm tuyệt đối** dưới `app/` — kể cả trong chú thích.
- Không `tabindex` dương ở bất kỳ đâu (`index.html` và `app/`); `0` và `-1` được phép.
- Thứ tự tab **bám đúng thứ tự DOM** — không `order`, không `*-reverse`, không `tabindex` dương để nắn.
- Ring dùng **token `--focus` đã có**; mọi màu qua `var(--…)`, không hex, không token mới.
- Nghiệm thu **chỉ trên phần tử đã tồn tại**: `✕` dải băng → `o-soan` → `o-tim` → `o-ngay` → mẩu giấy (bị cắt) trái-sang-phải → `xuất sao lưu` → `nạp lại` → nút theme. `về hôm nay` (Epic 6), nút xóa có hành vi (Epic 5), hai link sao lưu có hành vi (Epic 4) chưa tính.
- CSS phải **phẳng một tầng**, không `@media`, không `@supports` — `token-style.test.js:430` chỉ hiểu CSS phẳng.

**Never:**
- **Không** thêm token màu mới (`token-style.test.js:293` ghim đúng tập token; thêm là đỏ ba ca và phải sửa cả `DESIGN.md`).
- **Không** thêm phím tắt, **không** listener bàn phím cấp `document`/`window`, **không** đụng `/` hay `Ctrl+K`.
- **Không** nối hành vi cho `.mau-xoa`, `.chan-link`, `.nut-theme` — chúng vẫn là vỏ rỗng của Epic 4/5 và của Story 3.3.
- **Không** đổi `core/`, `ports/`, `adapters/`, `state.js` — story này không chạm state.
- **Không** thêm `@media (prefers-reduced-motion)` — đó là Story 3.4.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tab từ đầu, không dải băng | Trang vừa tải, focus ở `o-soan` (autofocus) | `Tab` đi `o-tim` → `o-ngay` → (mẩu bị cắt) → `xuất sao lưu` → `nạp lại` → nút theme, đúng thứ tự DOM | N/A |
| Tab từ đầu, có dải băng đóng được | `banner` = `BAD_FILE` | `✕` là điểm dừng **đầu tiên**, trước `o-soan` | N/A |
| Dải băng không đóng được | `banner` = `QUOTA` | Không `✕`, không điểm dừng thêm; thứ tự còn lại y nguyên | N/A |
| Focus bằng bàn phím | `Tab` tới từng phần tử tương tác | `matches(':focus-visible')` đúng **và** ring nhìn thấy được, màu lấy từ `--focus` | N/A |
| Focus bằng chuột | Click vào `.chan-link` / mẩu giấy | Không ring (`:focus-visible` không khớp) — ring là bản đồ bàn phím, không phải phản hồi chuột | N/A |
| Mẩu không bị cắt | Ghi chú ≤ `COLLAPSED_LINES` dòng | Không vào thứ tự Tab (không `tabindex`) — nó không có hành vi nào | N/A |
| Phím ngoài bốn phím | Gõ `/` hoặc `Ctrl+K` ở bất kỳ đâu ngoài ô nhập | Không có gì xảy ra; không handler nào chạy | N/A |
| Đổi sang theme tối | `data-theme="dark"` | Ring đổi theo `--focus` dark (`#D3B269`), vẫn nhìn thấy được | N/A |

## Quyết định đã chốt

- **QĐ-1 — `.mau-xoa` giữ `tabindex="-1"`.** AC liệt kê "thân rồi nút xóa", nhưng nút chưa có hành vi; Epic 5 gỡ `-1` khi nối hành vi thật. Một điểm dừng bàn phím dẫn tới một nút không làm gì là đúng thứ "điều khiển ma" mà sàn a11y dựng ra để tránh. Vế "nút xóa" của AC **hoãn sang Epic 5** — ghi rõ trong test, không im lặng bỏ qua.
- **QĐ-2 — chỉ mẩu BỊ CẮT vào thứ tự Tab.** Giữ nguyên `mau-giay.js:141-153`. Chỉ phần tử có hành vi mới là điểm dừng; một lưới toàn mẩu ngắn thì `Tab` đi thẳng từ `o-ngay` xuống chân trang, và đó là **đúng**. `app/view/mau-giay.js` **không bị chạm** trong story này.
- **QĐ-3 — ring dùng `outline` + `outline-offset`, `.o-soan` giữ nguyên `box-shadow` của nó.** Một khối CSS phủ hết, không bị tổ tiên `overflow: hidden` xén (`body:129`, `.tang-luoi:193`), và đúng tinh thần AD-20: lệnh cấm là cấm **tắt** outline, không cấm **vẽ lại** nó. Hai chất liệu ring khác nhau là đánh đổi đã nhận: `.o-soan` nằm trong ô có bóng lõm nên ring của nó phải là bóng.

</frozen-after-approval>

## Code Map

- `app/style.css:310-313` — ring tùy biến **duy nhất** hiện có (`.o-soan:focus-visible`: `border-color: var(--focus)` + `box-shadow` ring 3px qua `color-mix`). Đây là khuôn mẫu và cũng là thứ **không được phá**.
- `app/style.css:199-203` và `:501-504` — hai chú thích khẳng định "KHÔNG đụng tới `outline` — giữ ring mặc định trình duyệt" cho `.dai-bang-dong` và `.chan-link`. Chính hai chỗ này là thứ story phải **đảo lại**: chú thích phải viết lại cho khớp quyết định mới.
- `app/style.css:45` (`--focus: #8A6A22`) và `:113` (`--focus: #D3B269`) — token đã có ở cả hai bảng. **Không thêm token.**
- `app/style.css:506-530` — `.chan-link` (`padding: 0; border: 0; background: none`) và `.nut-theme`. `.chan-link` có vùng bấm **bằng đúng chữ**, nên ring cần `outline-offset` để không dính chữ.
- `app/style.css:129,168,180,193` — `body` flex column + `overflow: hidden`; `.tang-luoi` `overflow-y: auto`. Quan trọng cho Open Question 3 (ring bị xén).
- `index.html:73` (`div.dai-bang`), `:90` (`textarea#o-soan[autofocus]`), `:108` (`input#o-tim`), `:111` (`input#o-ngay`), `:115` (SVG lịch, `aria-hidden` + `focusable="false"` — **không** phải điểm dừng), `:136` (`div.luoi`), `:147`/`:149` (`.chan-link`), `:150` (`.nut-theme`). Đây là **toàn bộ** thứ tự DOM tĩnh — không có `tabindex` nào trong HTML.
- `app/view/banner.js:116-120` — `button.dai-bang-dong` (`aria-label="đóng thông báo"`), chỉ dựng khi `dongDuoc(loai)`; là con của `div.dai-bang` đứng trước `<main>` → tự là điểm dừng đầu tiên **nhờ thứ tự DOM**, không nhờ `tabindex`.
- `app/view/mau-giay.js:60-67` (hằng `TAB_CO='0'`, `TAB_KHONG='-1'`, `THUOC_TINH_TAB`), `:114` (`.mau-xoa` đặt `-1`, nhãn chữ `'xóa'` ở `:47` — **đã** có nhãn chữ, AC nhãn chữ đã đạt), `:141-153` (chỉ mẩu **bị cắt** mới `tabindex="0"` + nghe `click` và `keydown` `Enter`/`Space`). Ba chỗ của Open Question 1 và 2.
- `app/view/luoi.js:60-74` — `replaceChildren` theo thứ tự mảng `hienThi`; CSS không có `order`/`*-reverse` (`bo-cuc-bon-tang.test.js` đã ghim), nên **thứ tự thị giác trái-sang-phải = thứ tự DOM = thứ tự Tab**. Không cần code mới cho vế này, chỉ cần một ca ghim.
- `app/view/o-soan.js:74-92` và `app/view/mau-giay.js:149-153` — **hai** handler bàn phím duy nhất trong toàn `app/` (Ctrl+Enter; Enter/Space). Không listener cấp `document`/`window`. Đây là bằng chứng "chỉ bốn phím" cần được ghim.
- `test/token-style.test.js:333-343` — đã có `TAT_FOCUS_RING` quét `outline: none|0` trên **bản thô** mọi `.css` dưới `app/`. AC "grep `outline: none` không ra kết quả" **đã được ghim sẵn** — đừng viết lại ca này, hãy dẫn chiếu nó.
- `test/token-style.test.js:293,261,265,269,405,422,430` — các ca sẽ đỏ nếu thêm token, thêm `@media`, lồng khối, hay viết màu không qua `var(--)`. Đọc trước khi sửa CSS.
- `test/helpers/quet-nguon.js` — `boChuThich(duongDan, ma)` dispatch theo đuôi (`.js`/`.css`/`.html`). Khuôn bắt buộc cho mọi test quét nguồn mới.
- `test/state-tap-trung.test.js:196-259` và `test/nguong-tap-trung.test.js:155-208` — khuôn chuẩn cho một test bất biến kiến trúc: quét đệ quy, báo `file:dòng`, **kèm khối self-test dương/âm tính** cho chính bộ quét. Bắt chước cả phần self-test.
- `tools/thu-bo-cuc.mjs:117` (`document.activeElement`), `:440-458` (`o.focus()` + `matches(':focus-visible')` + so viền/ring trước-sau), `:709` (ca đo `tabIndex` từng mẩu) — **đã có sẵn** mọi thứ cần để đo thứ tự Tab thật. `tools/cdp.mjs:168` (`cdp.chay`), `:96` (`datKhungNhin`), `ghi(ten, dat, chiTiet)` ở `thu-bo-cuc.mjs:19`.
- `test/banner.test.js:41-55` / `test/luoi.test.js:44-62` — `phanTuGia()` **không** có `focus()`, `tabIndex`, `matches()`, không tính layout. Mọi phép đo focus thật phải xuống harness, không lên Vitest.
- `_bmad-output/planning-artifacts/epics.md:954-986` — AC nguyên văn Story 3.2.

## Tasks & Acceptance

**Execution:**
- [x] `app/style.css` — thêm **một** khối `:focus-visible` phủ mọi phần tử tương tác (`.dai-bang-dong`, `.o-nhap`, `.o-luoi`, `.chan-link`, `.nut-theme`) dùng `outline: … var(--focus)` + `outline-offset` (QĐ-3); giữ nguyên `.o-soan:focus-visible`; viết lại hai chú thích ở `:199` và `:501` cho khớp. Không token mới, không at-rule, khối phẳng một tầng.
- [x] `test/focus-va-tab.test.js` — **file mới**, quét nguồn theo khuôn `state-tap-trung.test.js` (dùng `quet-nguon.js`, báo `file:dòng`, kèm self-test dương/âm tính): (a) **không `tabindex` dương** trong `index.html` và mọi `.js`/`.html` dưới `app/` — chỉ `0` và `-1`; (b) **không listener bàn phím cấp `document`/`window`** và không mã nào nhắc `'/'`, `'k'`, `'K'`, `ctrlKey`/`metaKey` ngoài `o-soan.js`; (c) mọi phần tử tương tác trong `index.html` + mọi phần tử focusable do view dựng đều có một selector `:focus-visible` phủ nó trong `style.css`; (d) dẫn chiếu (không nhân bản) ca `outline: none` đã có ở `token-style.test.js:336`.
- [x] `tools/thu-bo-cuc.mjs` — thêm nhóm ca **đo thật**: (a) `Tab` liên tiếp từ đầu trang cho ra đúng dãy phần tử của I/O Matrix, có và không có dải băng đóng được; (b) `Shift+Tab` cho ra đúng dãy ngược; (c) mỗi phần tử tương tác khi nhận focus bàn phím có ring **khác** lúc không focus và màu ring bắt nguồn từ `--focus` (so `getComputedStyle` trước/sau, ở **cả hai** theme); (d) click chuột **không** bật ring; (e) thứ tự Tab qua lưới trùng thứ tự trái-sang-phải đo bằng `getBoundingClientRect`.
- [x] `app/view/mau-giay.js` — **KHÔNG chạm** (QĐ-1 và QĐ-2 đều giữ nguyên hiện trạng). Thay vào đó, `test/focus-va-tab.test.js` ghim hai quyết định này thành bất biến có chú thích: `.mau-xoa` phải còn `-1` cho tới Epic 5, và chỉ mẩu bị cắt mới mang `tabindex`.
- [x] `README.md` — thêm mục thử tay: `Tab` một vòng qua toàn trang ở cả hai theme, kiểm ring nhìn thấy ở từng điểm dừng và không có điểm dừng lạ.

**Acceptance Criteria:**
- Given `app/style.css`, when grep `outline: none` / `outline: 0`, then không một kết quả nào (`npm test` giữ ca `token-style.test.js:336` xanh).
- Given toàn bộ `index.html` và `app/`, when quét `tabindex`, then chỉ thấy `0` và `-1`, **không** giá trị dương — và ca này đỏ khi cố tình thêm `tabindex="1"`.
- Given toàn bộ `app/`, when tìm listener bàn phím, then chỉ hai chỗ đã biết (`o-soan.js`, `mau-giay.js`) và **không** listener nào ở `document`/`window`.
- Given harness chạy trên trình duyệt thật, when `Tab` liên tiếp từ đầu ở cả hai trạng thái dải băng, then dãy phần tử khớp đúng I/O Matrix, và một phép đột biến (thêm `tabindex="1"` vào nút theme, hoặc `order: -1` vào một tầng) làm ca đó **đỏ**.
- Given `npm test` và `npm run thu-bo-cuc`, when chạy, then toàn bộ ca cũ vẫn xanh — đặc biệt `token-style`, `bo-cuc-bon-tang`, `nguong-tap-trung`, `state-tap-trung`, `harness`, `trang-tinh`.

## Implementation Notes

- `app/view/mau-giay.js` KHÔNG bị chạm, đúng QĐ-1 và QĐ-2. Đổi mã chỉ ở `app/style.css` (một khối
  `:focus-visible` phẳng, cộng hai chú thích viết lại ở `.dai-bang-dong` và `.chan-link`).
- Khối `:focus-visible` gồm cả `.mau-xoa` dù nút đó mang `tabindex="-1"` và hôm nay không bao giờ
  nhận tiêu điểm bàn phím: Epic 5 gỡ `-1` khi nối hành vi thật, và lúc đó vòng sáng phải đã có sẵn
  chứ không phải là một việc phải nhớ làm thêm.
- `test/focus-va-tab.test.js` phải giải được hằng số: `mau-giay.js` cố ý không viết số literal nào
  (AD-14) nên nó đặt `tabindex` qua `setAttribute(THUOC_TINH_TAB, TAB_KHONG)`. Bộ quét vì thế dựng
  một bảng `const TEN = 'giá trị'` rồi giải biểu thức — một bộ quét chỉ tìm `tabindex="…"` sẽ không
  thấy gì ở đúng cái tệp duy nhất trong dự án đặt `tabindex`. Một giá trị KHÔNG giải được cũng bị
  tính là vi phạm.
- Ba mẩu bị cắt của nhóm ca harness dựng qua `noiLuoi` với một store GIẢ, không qua `chotGhiChu`:
  không một phép ghi nào xuống IndexedDB, nên khối này không cần bước dọn kho như các khối khác.
- Phím và chuột gửi bằng `Input.dispatchKeyEvent` / `Input.dispatchMouseEvent` của CDP, cộng
  `Emulation.setFocusEmulationEnabled`. Một `KeyboardEvent` tổng hợp không di chuyển tiêu điểm và
  không bật trạng thái "lần tương tác cuối là bàn phím" — nó sẽ đo đúng không gì cả.

**Phép đột biến đã chạy (cả hai đều làm suite ĐỎ, rồi hoàn nguyên):**

- `tabindex="1"` trên nút theme → `test/focus-va-tab.test.js` đỏ 2 ca, `npm run thu-bo-cuc` đỏ 5 ca
  (46/51).
- `order: -1` trên `.tang-luoi` → `npm run thu-bo-cuc` đỏ 5 ca (46/51).

**Đo lại độc lập ở bước nghiệm thu (không tin báo cáo):** cùng phép đột biến `tabindex="1"` trên
nút theme cho `npm test` **498/500** (đỏ đúng 2 ca của cửa (a), khớp báo cáo) và `npm run thu-bo-cuc`
**48/51** — đỏ 3 ca chứ không phải 5: "Tab liên tiếp từ đầu trang" cộng hai ca vòng sáng
light/dark. Con số 5 ở trên không tái lập được; điều cần chứng minh — ca đỏ được — thì đúng.
Sau khi hoàn nguyên: `npm test` 500/500, `npm run thu-bo-cuc` 51/51.

## Spec Change Log

## Review Triage Log

**Vòng 1** — ba lớp: `blind-hunter` (11 finding), `edge-case-hunter` (16), `verification-gap` (2 + 3 phụ). Không entry nào là `intent_gap` hay `bad_spec` → không loopback.

| # | Finding | Verdict | Bằng chứng | Route |
|---|---|---|---|---|
| 1 | Cửa (c) KHÔNG quét `app/view/` — chỉ một bảng viết tay 3 dòng; một điều khiển mới do view dựng sẽ không có ring mà suite vẫn xanh | medium | Tự xác nhận trên diff: `FOCUS_DO_VIEW_DUNG` là literal 3 phần tử, ca ở `:808` chỉ lặp bảng đó. Chú thích `style.css:76-78` lại khẳng định "quét `index.html` cộng `app/view/`" — chú thích nói quá so với test. `verification-gap` đã chứng minh bằng cách thêm `<button class="mau-ghim">`: 23/23 vẫn xanh | patch |
| 2 | Cửa (b) không quét `index.html` — đúng tệp duy nhất đã mang một `<script>` nội tuyến | medium | `:748-750` dựng corpus bằng `danhSachNguon(appDir).filter(.js)`, lọc bỏ luôn `.html`. Cửa (a) thì dùng `cacFileNguon()` có `index.html`. Một `document.addEventListener('keydown', …)` trong script theme lọt sạch | patch |
| 3 | Cửa (a) bị vòng qua bởi `setAttribute('tabindex', String(n))` và `el['tabIndex'] = 1` | medium | `[^,()]+?` của regex `setAttribute` không khớp đối số có ngoặc → bỏ qua **im lặng**, trái hẳn ý đồ đã ghi "không giải được = vi phạm". Mẫu `\.\s*tabIndex\s*=` không thấy truy cập bằng ngoặc vuông | patch |
| 4 | Từ vựng phím tắt thiếu (`e.code`/`'KeyK'`, `keyCode`, `altKey`) và `NGHE_PHIM` không xử lý `document?.addEventListener` | medium | `document?.` cho `noiGan === 'document?'`, `GOC_TOAN_CUC` neo `$` nên không khớp → báo là listener **không** toàn cục. `if (e.altKey && e.code === 'KeyK')` qua sạch cả ba ca | patch |
| 5 | Bộ lọc `:focus` trần là mã chết, và `:focus-within` lọt | low | `/:focus(?![\w-])/` đã tự loại `:focus-visible` (dấu `-` nằm trong `[\w-]`), nên `.filter(startsWith(':focus-visible'))` không bao giờ bỏ gì. Cùng lookahead đó cũng cho `:focus-within` đi qua | patch |
| 6 | `DO_NEN` khóa map bằng `ten(el)` → hai `button.chan-link` và ba `div.o-luoi` gộp thành một khóa | medium | `:216` ghi `ra[ten(el)] = vong(el)` trong vòng lặp; phần tử sau ghi đè phần tử trước. Hôm nay vô hại vì các giá trị trùng nhau, nhưng phép so `d.vong !== nen[d.ten]` đang đối chiếu với nền của **phần tử khác** | patch |
| 7 | `vong` nối 5 thuộc tính rồi `includes(mauFocus)` → màu `--focus` ở `border-top-color` cũng làm ca xanh | low | `:189-193` và `:331-335`. Phép `daDoi` vẫn bắt được "gỡ hẳn outline", nên lỗ này hẹp — nhưng khẳng định cốt lõi đang lỏng hơn câu nó tự nói | patch |
| 8 | Trạng thái CÓ dải băng chỉ được đo **một** bước `Shift+Tab`, không đo dãy tiến | medium | `:379-398` chỉ gọi `nhanTab(true)` một lần. AC viết "`Tab` liên tiếp từ đầu **ở cả hai trạng thái** dải băng" — vế "thứ tự còn lại y nguyên" chưa có phép đo nào | patch |
| 9 | Hàng I/O Matrix "focus bằng chuột" nói `.chan-link` **/ mẩu giấy**, harness chỉ click `.chan-link` | medium | `:414` chỉ lấy rect của `.chan-link`. `div.o-luoi[tabindex=0]` là loại phần tử dễ bật ring khi click nhất (div focusable), và nó không được đo | patch |
| 10 | `laDangNhan` được đo nhưng không được khẳng định — click trượt thì ca vẫn xanh | low | `:427-431` chỉ dùng `!d.khop && d.vong === nen[…]`; cả hai đều đúng khi cú click không trúng gì cả | patch |
| 11 | `Emulation.setFocusEmulationEnabled(true)` bật ở `:148` và không bao giờ tắt | low | Không có `finally`, khối kết thúc bằng `cdp.taiLai`. Mọi khối đo sau chạy trong trạng thái tiêu điểm giả lập — một thay đổi trạng thái toàn cục không hiển lộ | patch |
| 12 | Không phép đo nào tính tỉ lệ tương phản ≥ 3:1, dù AC và chính chú thích CSS khẳng định con số đó | medium | Vitest chỉ kiểm `var(--focus)` **được nhắc tới**; harness chỉ kiểm màu ring **bằng** `--focus`. Không nơi nào tính tỉ lệ so với `--paper`/`--bg`/`--surface`. Đây là con số duy nhất máy tính được mà lại bị đẩy cho mắt người ở README mục 26. `.o-soan` (`color-mix` 28%) là chỗ khả nghi nhất và cũng là chỗ không có phép đo nào | patch |
| 13 | `lopCoFocusRing` không đọc được at-rule lồng (`@media`) | false | Bác bỏ: `token-style.test.js:430` **cấm** mọi at-rule có khối và mọi ngoặc lồng >1 tầng trong `style.css`. Một luật `:focus-visible` trong `@media` không tồn tại được để mà lọt | reject |
| 14 | Harness đổi theme bằng `dataset.theme` chứ không qua đường thật, và reset cứng về `light` | false | Câu hỏi của khối là màu ring, không phải đường áp theme (`token-style.test.js:577-617` đã chạy thật thân script đó). Và khối kết thúc bằng `cdp.taiLai()`, nên `dataset` được dựng lại từ script thật — phép reset cứng là thừa, không phải sai | reject |
| 15 | `danhSachNguon` chỉ đi `.js`/`.html`; một `app/**/*.mjs` sẽ thoát cửa (a) và (b) | low | Không có đường tới: `harness.test.js:104` đòi mọi specifier tương đối kết thúc bằng `.js`/`.css` và trỏ tới file có thật, nên một `.mjs` dưới `app/` không import được vào đâu cả | reject |
| 16 | Không ca nào kiểm hai đầu vòng Tab (rời tài liệu ra chrome trình duyệt rồi quay lại) | low | Hành vi ở hai đầu phụ thuộc trình duyệt/host, không phải sản phẩm; ghim nó là ghim môi trường đo. Chính người cài đặt đã nêu giới hạn này trong phần rủi ro | reject |
| 17 | `querySelector('.o-soan'/'.dai-bang'/'.chan-link')` trả `null` → `TypeError` làm vỡ khối harness thay vì đỏ một ca | low | Không chứng minh được đường tới: ba phần tử này là tĩnh trong `index.html` và `trang-tinh.test.js` đã ghim chúng. Gác một trạng thái chưa chứng minh là tới được → từ chối | reject |
| 18 | Alias `const d = document; d.addEventListener('keydown', …)` thoát cửa (b) | low | Có thật nhưng rất hẹp: ca `:762` đã ghim **đúng hai tệp** mang listener bàn phím, nên một alias ở tệp thứ ba vẫn đỏ. Chỉ lọt được nếu viết bên trong chính `o-soan.js`/`mau-giay.js` | patch (gộp #4) |
| 19 | `THE_TUONG_TAC` bỏ sót `<a href>`, `[contenteditable]`, `<div tabindex="0">`; `lopCoFocusRing` bỏ sót selector ghép (`.a.b:focus-visible`, `button:focus-visible`) | low | Cả hai làm cửa (c) sai theo hai chiều ngược nhau: bỏ sót điều khiển mới, và báo đỏ oan một điều khiển đã được phủ | patch (gộp #1) |
| 20 | Không có CI; nửa nghiệm thu bằng trình duyệt chỉ chạy khi ai đó nhớ gọi | — | Chính lớp `verification-gap` nói rõ đây là quy ước sẵn có của repo và **không** đệ trình như một gap. Ghi lại để không mất dấu | defer |

**Kết quả 12 patch — tự kiểm chứng độc lập, không tin báo cáo.** Agent cài đặt dừng giữa chừng vì
giới hạn phiên, để lại tệp test hỏng (15 ca đỏ); phần còn lại do session này áp trực tiếp.

- **Lỗi gốc của 15 ca đỏ:** `cacLoiGoi` dùng lookbehind `(?<![\w$.])` — chặn cả dấu chấm, trong khi
  **mọi** lời gọi thật đều là `el.setAttribute(…)`. Bộ quét khớp **zero** kết quả, nên cửa (a) và
  cả hai ca QĐ-1/QĐ-2 tự rỗng. Đã sửa thành `(?<![\w$])`.
- #1 (cửa c): thay bảng viết tay bằng `focusableDoViewDung()` — suy tên class từ chính
  `app/view/*.js`. **Phép đột biến:** thêm một `<button class="mau-ghim">` vào `banner.js` →
  trước patch 23/23 xanh (đúng như `verification-gap` chứng minh), sau patch **đỏ** đúng ca đó.
  `FOCUS_DO_VIEW_DUNG` ở lại làm bảng canh chính bộ quét, cộng một ca `thay > 0` để một bộ quét
  trả rỗng không thành ca luôn xanh. Chú thích `style.css` đã viết lại cho khớp.
- #2 (cửa b): đổi sang corpus `cacFileNguon()`. **Phép đột biến:** `document.addEventListener('keydown', …)`
  trong `<script>` nội tuyến của `index.html` → **3 ca đỏ**, báo đúng `index.html:32`.
- #12 (tương phản): harness tính tỉ lệ WCAG thật giữa màu outline và nền leo-tổ-tiên, ở cả hai
  theme, cộng một ca riêng cho vòng `color-mix` của `.o-soan`. Đo được: light thấp nhất **3.63:1**
  (`.o-soan` 4.21:1), dark thấp nhất **6.56:1** (`.o-soan` 8.91:1). **Phép đột biến:** đổi ring
  sang `var(--bg)` → **4 ca đỏ**, tỉ lệ rơi về 1.0.
- #7: khẳng định đổi sang đọc riêng `outlineStyle`/`outlineColor` thay vì `includes` trên chuỗi
  nối năm thuộc tính. #6: `DO_NEN` khóa theo vị trí DOM (`ten#i`), hết gộp hai `.chan-link` và ba
  `.o-luoi`. #8: thêm dãy Tab **tiến** đầy đủ khi dải băng đang hiện. #10: `laDangNhan` vào điều
  kiện đạt. #11: tắt lại `setFocusEmulationEnabled` khi hết khối.
- #9 (click chuột trên mẩu giấy) **lộ ra một giả định sai của chính tôi**: click mẩu bật mở rộng →
  `luoi.js` vẽ lại toàn phần → phần tử vừa bấm bị **thay**, nên `laDangNhan` không bao giờ đúng ở
  đó. Ca được viết lại quanh câu hỏi AC thật sự hỏi: sau một cú chuột, `document.querySelectorAll(':focus-visible').length === 0`
  trên **cả trang**, cộng một phép kiểm "cú click có trúng không" thay cho `laDangNhan`.
- **Ngoài phạm vi review, nhưng tìm ra khi sửa:** khối harness bơm ba mẩu **trước** khi
  `khoiDong().then(veTatCa)` của app kịp chạy, nên lượt vẽ đó xóa sạch mẩu vừa bơm — một cuộc đua
  làm cả nhóm ca đỏ không đều. `cdp.doiSan` chỉ đợi `main.js` **nạp**, không đợi lượt vẽ đầu.
  Đã thêm một phép đợi kèm lý do tại chỗ.

**Verification cuối (tự chạy):** `npm test` **503/503** xanh, 22 tệp; `npm run thu-bo-cuc` **57/57**
— kể cả ca "tải lại trang" vốn đỏ không đều từ trước Story 3.1.

## Design Notes

**Ring là thứ được *vẽ lại*, không phải thứ được *tắt*.** AD-20 cấm `outline: none`, và cách duy nhất vừa giữ lệnh cấm vừa đạt "ring `{colors.focus}` ≥ 3:1" là **khai một `outline` của mình** — cấm là cấm tắt, không cấm thay. Chú thích hiện có ở `style.css:199` và `:501` ("giữ ring mặc định của trình duyệt") là một quyết định **đúng ở Story 2.x** và **hết đúng ở đây**: ring mặc định của Chrome là cặp trắng/đen tự chọn theo nền, không phải `--focus`, và không ai đo được tương phản của nó. Viết lại chú thích, đừng để hai câu mâu thuẫn cùng sống trong file.

**`:focus-visible` chứ không `:focus`.** Ring là bản đồ **bàn phím**. `:focus` bật cả khi click, và một ring nhảy ra sau mỗi cú chuột là nhiễu thị giác — đó cũng là lý do I/O Matrix có hẳn một hàng "focus bằng chuột → không ring".

**Ba bất biến này không cần code mới, chúng cần *ca đo*.** Không `tabindex` dương, thứ tự Tab bám DOM, chỉ bốn phím — cả ba **đang đúng** hôm nay. Giá trị của story không nằm ở việc sửa chúng mà ở việc làm chúng **không lùi được**, đúng lúc bốn epic sau sắp đổ thêm điều khiển vào trang. Vì thế mỗi ca mới phải kèm một **phép đột biến** chứng minh nó đỏ được — một ca ghim thứ tự Tab mà không đỏ khi thêm `tabindex="1"` là một ca vô dụng.

**Chỗ đo đúng tầng.** `phanTuGia()` không có `focus()`, `tabIndex`, `matches()` hay layout, nên mọi câu hỏi "thật sự Tab đi đâu / ring có hiện không" **phải** ở `tools/thu-bo-cuc.mjs` (trình duyệt thật, CDP). Vitest chỉ nhận phần quét nguồn. Nhầm tầng ở đây là cách viết ra một suite xanh mà không chứng minh gì.

## Verification

**Commands:**
- `npm test` — expected: toàn bộ xanh, kể cả `test/focus-va-tab.test.js` mới và mọi test bất biến kiến trúc đã kể ở AC.
- `npm run thu-bo-cuc` — expected: toàn bộ xanh, kể cả nhóm ca thứ tự Tab và focus ring mới.

**Manual checks:**
- Mở `index.html` qua HTTP localhost, `Tab` một vòng từ đầu tới cuối: mỗi điểm dừng có ring nhìn rõ, không điểm dừng nào là phần tử vô hình hay không tương tác, `Shift+Tab` quay đúng đường.
- Ép `banner` sang một hàng đóng được: `✕` là điểm dừng đầu tiên. Ép sang hàng không đóng được: không điểm dừng thêm.
- Đổi sang theme tối và lặp lại: ring vẫn nhìn rõ trên mọi nền.
- Gõ `/` và `Ctrl+K` khi focus ở chân trang: không có gì xảy ra.
</content>
