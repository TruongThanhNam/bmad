---
title: 'Story 2.2 — Ô soạn thảo sẵn con trỏ, chữ tự lưu'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
baseline_commit: '097a00f9ae4d6dce9ae79bf1e7c780838c56f2b0'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ô soạn thảo hiện chỉ là một `<textarea>` hình dạng tĩnh (Story 2.1): không tự focus, không nối vào store, không lưu gì. Lõi đã có đủ `datBanNhap` / `khoiDongBanNhap` từ Epic 1 nhưng chưa có một dòng view nào gọi tới, nên khoảng cách từ "có một ý nghĩ" tới "ý nghĩ đó đã an toàn" vẫn là vô cực.

**Approach:** Nối tầng 1 vào store: con trỏ nằm sẵn trong ô lúc tải, mỗi phím gõ gọi `store.datBanNhap(text)` (lõi tự debounce `AUTOSAVE_MS` và tự ghi xuống store `drafts`), và bản nháp giành được lúc khởi động được đồng bộ trở lại vào ô. Đồng thời hoàn tất vật liệu của ô: bóng lõm bằng token mới, min-height 92px, tự cao thêm theo nội dung, dòng nhắc `Ctrl+Enter để chốt` bên dưới. Đây là file view đầu tiên của dự án.

## Boundaries & Constraints

**Always:**
- Con trỏ ở trong ô soạn thảo khi trang tải xong, không cần click; placeholder trống hoàn toàn.
- Dưới ô đúng một dòng nhỏ, nguyên văn `Ctrl+Enter để chốt`, phông `--font-foot`, màu `--ink-2`.
- Ô: `--surface`, **bóng lõm** qua token mới, min-height 92px qua token mới, tự cao thêm theo nội dung, `resize: none` giữ nguyên.
- Mọi phép ghi nháp đi qua `store.datBanNhap()`. View **chỉ đọc** state, không giữ state riêng, không tự gọi cổng.
- Focus có viền `--focus` + ring 3px; không `outline: none` ở bất cứ đâu.
- Mọi giá trị qua token trong hai khối `:root`; không màu/số trần ngoài token; không `@media`, không CSS lồng.
- Không số literal nào trong JS ngoài `app/core/limits.js`; không tự dựng `Date`.

**Never:**
- Không nút "Lưu", không chỉ báo "đã lưu"/"chưa chốt", không đếm ký tự, không viền khác khi có nháp chưa chốt.
- Không `Ctrl+Enter` (Story 2.3), không mẩu giấy/lưới thật (2.4, 2.5), không trạng thái rỗng (2.6), không dải băng thông báo (3.1).
- Không `maxlength` trên `<textarea>` và không cắt chữ ở bất kỳ đâu — cắt im lặng bị cấm tuyệt đối.
- Không thêm action/trường state mới vào `app/core/state.js`, không thêm cơ chế subscribe, không tạo store thứ hai.
- Không import `app/adapters/` ngoài `app/main.js`; không dependency mới; không hành vi cho tầng 2/tầng 4.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tải trang, kho nháp rỗng | `claimDraft` trả `text: ''` | Ô trống, con trỏ đã ở trong ô, không chữ nào hiện ra | N/A |
| Tải lại sau khi gõ dở | Kho nháp có chữ của tab này | Ô hiện lại **nguyên trạng** (giữ đủ xuống dòng), con trỏ ở cuối chữ | N/A |
| Gõ rồi dừng tay | Một chuỗi `input` | Đúng một phép ghi sau `AUTOSAVE_MS` kể từ phím cuối, không ghi cho từng phím | Ghi hỏng → `banner` của lõi, view không nói gì |
| Gõ trong lúc `claimDraft` chưa trả lời | `draft.seq` đã tăng | Chữ Nam đang gõ **thắng**; kết quả giành được bị bỏ; ô không bị đè | N/A |
| Nội dung dài nhiều dòng | Chữ cao hơn 92px | Ô tự cao thêm khít nội dung, không thanh cuộn trong ô; tầng lưới vẫn là vùng cuộn duy nhất | N/A |
| Xóa hết chữ | `text: ''` | Ô cao trở lại đúng 92px, bản nháp rỗng được ghi xuống | N/A |
| Dán chữ vượt `MAX_NOTE_CHARS` | `text.length > 20000` | Chữ **vẫn nằm nguyên** trong ô và trong state; lõi **không** gọi cổng; không ký tự nào bị cắt | `banner = TOO_LONG` dừng ở tầng action, không có chỗ nói (suy giảm có ý thức) |
| CSS hoặc JS không tải được | Chỉ HTML | Ô vẫn hiện, vẫn có con trỏ sẵn (thuộc tính `autofocus`), dòng nhắc vẫn đọc được | N/A |

### Quyết định của người dùng

- **Padding ô soạn thảo về đúng `DESIGN.md`: `--space-3 --space-4` (12px/16px).** Story 2.1 tạm viết `8px/12px`; con số đã siết của epic ("padding mẩu giấy 8/12, khe lưới 8, lề trang 16") nói về **mẩu giấy và lưới**, không về composer. `DESIGN.md` L81-89 là nguồn có thẩm quyền cho composer.
- **Trần ký tự: không chặn ở view.** AC "không nhận thêm ký tự" được thực hiện ở **tầng ghi** — lõi từ chối gọi cổng khi quá trần (`state.js:600`) và nhịp tim cũng từ chối (`state.js:624`). Chặn ở view chỉ có hai cách — `maxlength` (cắt im lặng) hoặc hoàn nguyên ô (mất chữ vừa dán) — cả hai trái AD-14/AD-17.
- **Bóng là token, buộc phải vậy.** Giá trị có `rgba()` nên đặt ngoài hai khối `:root` là đỏ ca "không màu viết thẳng". Bản dark cần giá trị khác, nên nó là token **thứ 13 đổi theo theme** và ca "khối dark ghi đè đúng 12 tên" phải được nới, không phải lách.

</frozen-after-approval>

## Code Map

- `index.html` -- L55-62 tầng 1: `<textarea class="o-soan" rows="3" aria-label="Ghi chú mới">` ở L60, chưa có `id`, chưa có dòng nhắc. Thêm `autofocus`, bỏ `rows` (chiều cao chuyển sang token), thêm dòng nhắc sau `<textarea>` trong cùng `.container`. Cập nhật chú thích L50-52 và L57-59 (chúng đang nói "chỉ hình dạng, không script" và "chiều cao đặt bằng `rows`" — cả hai hết đúng). **Không đụng `<head>` L3-42**: `token-style.test.js` khóa đúng một `<script>` ở đó. `<script type="module" src="app/main.js">` đã có ở L112.
- `app/style.css` -- `:root` L33-72, khối dark L78-92 (thêm token mới vào cả hai). `.o-soan` L179-194: đổi padding, thêm `min-block-size`, `box-shadow`, `:focus-visible`; giữ `resize: none` (L187) và lý do ở L183-186. Luật mới viết tiếp vào cuối file.
- `app/core/state.js` -- `datBanNhap(text)` L595 (đồng bộ, void, tự hẹn ghi), `khoiDongBanNhap()` L544 trả `Promise<void>` **không bao giờ bị từ chối**, đã xử lý đua bằng `seq` (L552-566). Chỉ đọc — **không sửa**.
- `app/core/limits.js` -- `AUTOSAVE_MS = 400` (L27), `MAX_NOTE_CHARS = 20000` (L10). Chỉ import.
- `app/main.js` -- L68-78 cửa `typeof document !== 'undefined'`; L73 gọi `store.khoiDongBanNhap()` không đợi; L80-82 là chỗ nối view. Đây là file duy nhất được `import` view và truyền `store` qua tham số.
- `test/token-style.test.js` -- `SPACING` L87-101, `BO_GOC` L103-108, `TOKEN_CUA_ROOT` L111-116; ca "khối dark ghi đè ĐÚNG 12 tên" L234-238; ca ":root khai báo ĐÚNG tập token" L249-253; ca "7 bậc thang spacing cộng 6 token bố cục" L271. Bốn chỗ này phải sửa cùng nhau và **chỉ** để mở đường cho token mới.
- `test/bo-cuc-bon-tang.test.js` -- L182-190 `describe('Không bóng trong story này')`: cửa chặn có phạm vi story, do 2.2 thay bằng ca hẹp hơn (bóng duy nhất được phép là `var(--shadow-inset)` trên `.o-soan`).
- `test/nguong-tap-trung.test.js`, `test/state-tap-trung.test.js`, `test/trang-tinh.test.js` -- ghim: không số literal ngoài `limits.js`, một store duy nhất + không trường "đã lưu", không tài nguyên ngoài. **Không sửa.**
- `test/helpers/quet-nguon.js` -- helper quét cây cho các test "tập trung".
- `tools/thu-bo-cuc.mjs` -- L252 đã đo `getComputedStyle('.o-soan').resize` qua `tools/cdp.mjs`; là chỗ thêm phép đo min-height/bóng/autosize. `npm run thu-bo-cuc` không nằm trong `npm test` (quy ước đã chốt).
- `_bmad-output/planning-artifacts/ux-designs/ux-Sticky Notes-2026-09-09/DESIGN.md` -- L81-89 frontmatter `components.composer` (nguồn có thẩm quyền), L268-269 bóng lõm + bản dark. `EXPERIENCE.md` L98-100 microcopy, L155 "không dấu hiệu nào".

## Tasks & Acceptance

**Execution:**
- [x] `test/token-style.test.js` -- thêm bảng ghim `BONG` (`--shadow-inset`) + đưa vào `TOKEN_CUA_ROOT`, thêm token `--composer-min-h` vào `SPACING` (sửa tiêu đề ca L271 cho khớp số), nới ca L234 thành "12 màu + `--shadow-inset`" bằng một danh sách ghim `TOKEN_DOI_THEO_THEME`, thêm một ca so `BONG` bản light -- sửa cửa chặn **trước** khi viết CSS, để token mới là quyết định được ghim chứ không phải một chỗ lọt
- [x] `app/style.css` -- thêm `--shadow-inset` và `--composer-min-h: 92px` vào `:root`, ghi đè `--shadow-inset` trong khối dark; `.o-soan` đổi padding sang `var(--space-3) var(--space-4)`, thêm `min-block-size: var(--composer-min-h)`, `box-shadow: var(--shadow-inset)`, `overflow-y: hidden`; thêm `.o-soan:focus-visible` (border-color `--focus` + ring 3px bằng `color-mix` trên `var(--focus)`); thêm luật cho dòng nhắc -- hiện thực vật liệu và focus của composer
- [x] `index.html` -- thêm `autofocus` + `id` cho `<textarea>`, bỏ `rows`, thêm dòng nhắc `Ctrl+Enter để chốt`, cập nhật hai khối chú thích đã hết đúng -- con trỏ sẵn không cần JS, và dòng nhắc là microcopy ghim
- [x] `app/view/o-soan.js` -- file view đầu tiên: `noiOSoan(store, goc = document)` gắn `input` → `store.datBanNhap(value)`, tự cao theo `scrollHeight`, trả về `{ dongBoTuState }` chỉ đặt `value` khi lệch `store.state.draft.text` rồi đưa con trỏ về cuối -- view chỉ đọc state, mọi phép ghi qua action
- [x] `app/main.js` -- import và gọi `noiOSoan(store)` trong cửa `document`, gắn `dongBoTuState` vào `store.khoiDongBanNhap().then(...)` (thay lời gọi trần ở L73), thay chú thích L80-82 -- nối view mà không mất chữ Nam gõ trong lúc `claimDraft` chưa trả lời
- [x] `test/o-soan.test.js` -- Vitest cho toàn bộ I/O Matrix đo được không cần trình duyệt: dùng store thật với cổng giả + một `goc` DOM tối giản tự dựng (không jsdom) cho debounce một-lần-ghi, đua `seq`, khôi phục nguyên trạng, quá trần không gọi cổng và không cắt chữ; cộng quét văn bản: `index.html` có `autofocus` + nguyên văn dòng nhắc + không `maxlength`, CSS có `min-block-size`/`box-shadow` bằng `var(--…)` -- không có nó thì "một lần ghi" và "không cắt im lặng" chỉ là lời hứa
- [x] `tools/thu-bo-cuc.mjs` + `README.md` -- thêm phép đo Chrome thật: min-height 92px lúc ô trống, ô cao thêm khi nội dung dài mà trang vẫn không có thanh cuộn ngoài, bóng lõm khác rỗng ở cả hai theme, focus ring hiện; bổ sung mục thử tay (con trỏ sẵn lúc tải, đóng tab giữa lúc gõ rồi mở lại) -- phủ đúng phần quét văn bản không đo được

**Acceptance Criteria:**
- Given trang vừa tải xong, when Nam gõ ngay không click gì, then ký tự đầu tiên vào ô soạn thảo
- Given giao diện ở bất kỳ trạng thái nào, when tìm một nút "Lưu", một chữ "đã lưu", một dấu hiệu "chưa chốt" hay một số đếm ký tự, then không có
- Given `npm test`, when chạy, then toàn bộ suite xanh, và `nguong-tap-trung`, `state-tap-trung`, `trang-tinh`, `core-state` **không bị sửa một dòng nào**
- Given `app/view/o-soan.js`, when đọc, then không import `app/adapters/`, không `new Date()`, không số literal, không ghi vào state ngoài lời gọi action
- Given `Ctrl+Enter`, when bấm, then chưa có gì xảy ra — chốt ghi chú thuộc Story 2.3

## Implementation Notes

- **Autosize phải cộng `offsetHeight - clientHeight`, không chỉ `scrollHeight`.** `box-sizing`
  là `border-box`, nên `block-size` đếm cả viền còn `scrollHeight` thì không — thiếu hiệu số
  đó thì vùng nội dung hụt đúng 2px và dòng cuối bị nuốt một phần. Hiệu số được **đo**, nên
  không có số literal nào trong JS và luật CSS đổi thì nó tự đúng theo.
- **Ô tự cao phải có TRẦN, và spec không nói ra điều đó.** `.tang` là `flex: none` và `body`
  là `overflow: hidden`, nên một bản nháp vài chục dòng ép lưới về 0 và đẩy chân trang ra
  khỏi khung nhìn vĩnh viễn. Thêm token `--composer-max-h: 320px` (token bố cục, không đổi
  theo theme) cùng `max-block-size`, và `overflow-y` là `auto` chứ không `hidden` — một ô đã
  bị kẹp mà không cuộn được là một ô có chữ và con trỏ nằm ở chỗ không ai tới được. Đây là
  vùng cuộn thứ hai duy nhất của trang, và `bo-cuc-bon-tang.test.js` ghim đúng hai cái tên đó.
- **Autosize cũng phải chạy theo `resize` của cửa sổ**, không chỉ theo `input`: hẹp cửa sổ là
  ngắt dòng lại, nên chiều cao đã ghim lúc gõ không còn đúng. Cửa sổ lấy qua
  `o.ownerDocument.defaultView`, nên tệp view vẫn không chạm một global nào.
- **`--shadow-inset` là token thứ 13 đổi theo theme**, và ca "khối dark ghi đè ĐÚNG 12 tên"
  được thay bằng một danh sách ghim `TOKEN_DOI_THEO_THEME` (12 màu + 1 bóng) chứ không nới
  thành "có chứa". Giá trị của bóng bị ghim ở **cả hai** theme: hai khối `:root` là chỗ mù duy
  nhất của bộ quét màu, nên một `rgba()` gõ sai trong đó không có cửa nào khác bắt được.
- **Cửa chặn bóng của Story 2.1 hẹp lại, không biến mất.** `bo-cuc-bon-tang.test.js` giờ đòi
  mọi `box-shadow` bắt đầu bằng `var(--shadow-inset)` và chỉ hai selector `.o-soan` /
  `.o-soan:focus-visible` được mang bóng — nên bóng nhị mẩu giấy vẫn phải là quyết định của
  Story 2.5, kèm token riêng của nó.
- **`test/o-soan.test.js` dùng store THẬT với cổng giả, và một gốc DOM tự dựng** (không
  jsdom): `noiOSoan(store, goc)` nhận gốc qua tham số, nên vài chục dòng ô giả đủ cho mọi ca —
  và dự án giữ được lời hứa "không dependency runtime, không dependency test ngoài vitest". Ô
  giả mô phỏng đúng cái bẫy của autosize: `scrollHeight` chỉ tính theo nội dung khi
  `block-size` là `auto`, nên một hàm thiếu bước đó sẽ đỏ ở ca "xóa hết chữ".
- **`npm run thu-bo-cuc` đo được cả `document.activeElement` lúc trang vừa tải**, nên "con trỏ
  nằm sẵn trong ô" không còn hoàn toàn là một mục thử tay — mục 20 của README chỉ còn giữ phần
  mắt thấy (con trỏ **nháy**, placeholder trống). Bộ đo gõ vào ô bằng `input` event thật, và
  nó dọn sau mình: bản nháp cuối cùng ghi xuống là bản rỗng.

## Spec Change Log

## Review Triage Log

Vòng 1 — ba lớp: `blind-hunter`, `edge-case-hunter`, `verification-gap`.

| # | Phát hiện | Verdict | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Autosize **không có trần**: gõ đủ dài thì ô soạn thảo cao hơn khung nhìn, `.tang { flex: none }` nên lưới co về 0 và chân trang bị đẩy ra ngoài `body { overflow: hidden }` — không thanh cuộn nào với tới, và đáy ô (chỗ con trỏ) cũng nằm ngoài màn hình | high | `style.css` 161-183: `.tang` không co, `.khung` `min-block-size: 0`, `body` cấm cuộn. Bộ đo chỉ thử 12 dòng (305px/700px); ~30 dòng là chạm trần. Đây đúng trạng thái mà `resize: none` của Story 2.1 đã chặn, nay autosize mở lại bằng cửa khác | patch |
| 2 | `overflow-y: hidden` không có đường lui khi JS chết: quá 92px là chữ bị cắt và không với tới được | low | Thật, nhưng dòng "CSS hoặc JS không tải được" của I/O Matrix chỉ đòi ô hiện + con trỏ sẵn + dòng nhắc đọc được. Cùng gốc với #1 và tan theo bản sửa của #1 (`overflow-y: auto`) | patch (gộp #1) |
| 3 | Không đo lại khi cửa sổ đổi bề rộng: chữ xuống dòng lại, `scrollHeight` vượt `block-size` đã ghim, phần dôi bị cắt im lặng | medium | `o-soan.js` chỉ gọi `caoTheoNoiDung` ở `input` và `dongBoTuState`. Thu hẹp cửa sổ là hành động thường ngày | patch |
| 4 | Nối dây ở `app/main.js` **không có phép kiểm nào**: xóa `.then(oSoan.dongBoTuState)` hoặc đảo thứ tự `noiOSoan`/`khoiDongBanNhap` vẫn xanh cả `npm test`, `thu-bo-cuc` lẫn `thu-tay` | medium | Lớp verification-gap đã chứng minh bằng cách thử: `o-soan.test.js` tự dựng lại chuỗi `.then` trong thân test; `core-state.test.js` import `main.js` ở Node nên cửa `document` không chạy; `thu-tay-ban-nhap.mjs` chỉ đọc `state.draft.text`, không đọc `.o-soan.value` | patch |
| 5 | Ca "xóa hết chữ" chỉ khẳng định `toBeLessThan`, đạt cả khi ô co về một chiều cao sai | medium | `o-soan.test.js` 637. Sàn giả là `CAO_DONG + VIEN`, khẳng định đúng được — tên ca hứa nhiều hơn phần nó đo | patch |
| 6 | Dòng nhắc không nối với ô bằng `aria-describedby`: chỉ dẫn duy nhất của app không được đọc lên, trong khi placeholder cố ý trống | low | `index.html`: `<textarea>` chỉ có `aria-label`. Sửa là thêm một `id` và một thuộc tính — sửa trực tiếp, không thêm phức tạp | patch |
| 7 | README mục 20 nói bấm `Ctrl+Enter` thì "chưa có gì xảy ra" — trong `<textarea>` không có bộ nghe phím, nó **xuống dòng** | low | Hành vi mặc định của trình duyệt. Câu đúng là "chỉ xuống dòng, không chốt gì" | patch |
| 8 | Trần ký tự: chữ quá `MAX_NOTE_CHARS` thì bản nháp im lặng ngừng xuống kho, và không mục thử tay nào ghi lại đánh đổi đó | low | Bản thân sự im lặng là quyết định đã đóng băng (dải băng thuộc Story 3.1) nên không sửa mã; nhưng ghi một dòng vào README là sửa trực tiếp và giữ được dấu vết | patch (chỉ README) |
| 9 | Ca "chỉ .o-soan mang bóng" so mảng có thứ tự: đổi chỗ hai luật CSS là đỏ dù không đổi một pixel nào | low | `bo-cuc-bon-tang.test.js` 197-201. Sửa là `.sort()` hai vế | patch |
| 10 | `92` và `12px 16px` viết thẳng trong `tools/thu-bo-cuc.mjs` thay vì đọc từ token | false | Đó đúng là việc của bộ đo: 2.1 đã cố ý ghim `828`, `1040`, `118` để một lần đổi token làm nó **lệch ồn ào**. Đọc token rồi so với chính nó là phép kiểm tự xanh — đúng lỗi mà vòng review 2.1 (mục 1) đã bác | bác bỏ |
| 11 | `document.querySelector('.o-soan')` không chắn `null` trong các đoạn CDP: đổi tên lớp là cả bộ đo sập | false | Toàn bộ thân bộ đo nằm trong `try/finally` nên trình duyệt vẫn được dọn, và mọi khối sẵn có (`.luoi`, `.chan-link`, `.icon-lich`, `.o-ngay-boc`) đều viết như vậy. Sập ồn ào trước một trạng thái chỉ lập trình viên tạo ra là hành vi đúng | bác bỏ |
| 12 | Bỏ `rows` làm ô tụt về 2 dòng mặc định khi CSS chết | false | Dòng "CSS không tải được" của I/O Matrix không nói gì về chiều cao — nó đòi ô hiện, con trỏ sẵn, dòng nhắc đọc được, và cả ba vẫn đúng. Bỏ `rows` cũng là việc spec giao | bác bỏ |
| 13 | README mâu thuẫn: "hơn 400 ms" ở đầu mục, "hơn một giây" ở mục 10/21; và "Hai mục còn lại" nay là bốn | false | "Hơn một giây" là tập bao của "hơn 400 ms", không phải mâu thuẫn. "Hai mục còn lại" vẫn đứng đúng trước mục 18-19 trong phần của nó; 20-21 nằm dưới một tiêu đề riêng | bác bỏ |
| 14 | Phép quét `/\bLưu\b/` và `/ký tự/i` trải cả `index.html`, sẽ đỏ vì câu chữ hợp lệ của story sau | low | Thật về lâu dài, nhưng AC viết "ở bất kỳ đâu trong giao diện" nên phạm vi toàn trang là đúng ý; thu hẹp là định nghĩa lại AC, không phải một phép sửa trực tiếp | bác bỏ |
| 15 | `tabIdentity()` ném hoặc `claimDraft` bị từ chối thì `tabCuaMinh` ở lại `null`: mọi phím gõ chỉ nằm trong RAM, không một dấu hiệu nào | medium | Thật, nhưng đây là hành vi lõi có từ Story 1.7 (`state.js` 527, 620) chứ không do thay đổi này gây ra, và chỗ nói ra là dải băng của Story 3.1. Bản vá do lớp review đề nghị còn thêm một trường state mới — thứ khối đóng băng cấm | defer |

## Design Notes

`khoiDongBanNhap()` đã tự lo phần khó của cuộc đua (`state.js:552-566`): nó bỏ kết quả giành được nếu `draft.seq` đã nhảy. Nên view **không** cần một cơ chế nghe thay đổi state — và không được dựng một cái. Đúng một lần đồng bộ sau khi lời hứa chốt là đủ, với điều kiện `dongBoTuState` so sánh trước khi gán:

```js
function dongBoTuState() {
  const text = store.state.draft.text;
  if (o.value === text) return;   // Nam đã gõ — chữ trên màn hình mới hơn
  o.value = text;
  o.setSelectionRange(text.length, text.length);
  caoTheoNoiDung();
}
```

Thiếu phép so sánh đó thì mọi lần tải mà kho trả lời chậm đều đè lên chữ vừa gõ.

Autosize phải đặt `block-size` về `auto` **trước** khi đọc `scrollHeight`, nếu không chiều cao chỉ tăng một chiều và không bao giờ co lại khi xóa chữ. `min-block-size` giữ sàn 92px, nên hàm không cần biết con số nào — không có số literal trong JS.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ suite xanh; diff chỉ chạm `token-style.test.js` (bốn chỗ mở đường cho token mới) và `bo-cuc-bon-tang.test.js` (thay cửa chặn bóng bằng ca hẹp hơn)
- `npm run thu-bo-cuc` -- expected: các phép đo layout của 2.1 vẫn đạt, cộng các phép đo mới của composer

**Manual checks (if no CLI):**
- Mở trang qua HTTP server, gõ ngay không click: chữ vào ô
- Gõ vài dòng, đóng tab đột ngột, mở lại: chữ trở lại nguyên trạng kèm xuống dòng
- Gõ dài dần: ô cao thêm khít chữ, trang không có thanh cuộn ngoài
- Đối chiếu hai theme: bóng lõm thấy được ở cả hai, không màu nào lệch khỏi token
