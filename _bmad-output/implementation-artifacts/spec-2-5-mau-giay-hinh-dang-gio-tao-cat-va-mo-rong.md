---
title: 'Story 2.5 — Mẩu giấy: hình dạng, giờ tạo, cắt và mở rộng'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
baseline_commit: '2309677e1fb7c3e223fd645a2135d5683406e010'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Lưới hôm nay (Story 2.4) đang vẽ mỗi ghi chú thành một `div.o-luoi` trần trụi: không nền giấy, không giờ tạo, không nút `xóa`, và không bị cắt — một ghi chú dài kéo cao cả hàng, phá đúng lời hứa "liếc một cái quét được cả ngày". Toàn bộ ngôn ngữ vật liệu phân biệt *chỗ đang viết* với *thứ đã ghi* vẫn chỉ nằm trong token chưa ai dùng (`--paper`, `--paper-tape`, `--radius-paper`).

**Approach:** Cho mỗi ô lưới hình dạng thật của một mẩu giấy dán — nền `--paper`, bóng nhị, dải keo mép trên, bo góc 3px, đầu mẩu có `HH:mm` monospace bên trái và nút `xóa` bên phải — và thêm nhịp mở rộng: mẩu vượt `COLLAPSED_LINES` bị cắt kèm dòng `còn N dòng ▾`, click một lần mở tại chỗ, dòng đổi thành `thu lại ▴`. Trạng thái mở rộng là state tầng C trong lõi, chỉ RAM, nên tải lại trang là mọi mẩu về thu gọn — theo thiết kế chứ không tình cờ.

## Boundaries & Constraints

**Always:**
- **Một màu giấy duy nhất** cho mọi mẩu. Không màu thứ hai theo ngày, tuổi, độ dài hay bất kỳ thuộc tính nào.
- Mọi màu, bóng, bo góc, khoảng cách đi qua **token** của `:root`; token mới phải được khai báo ở cả hai bảng light/dark khi nó đổi theo theme, và phải được thêm vào bảng ghim của `test/token-style.test.js`.
- Trạng thái mở rộng nằm ở **tầng C của `app/core/state.js`**, đổi bằng **một action của lõi**, và **không bao giờ** chạm kho bền. View vẫn chỉ đọc `store.state` và gọi action; view không giữ state riêng, không đo layout để suy ra state.
- Nội dung ghi chú luôn đặt bằng `textContent`. Xuống dòng giữ nguyên; không markup, không đậm/nghiêng, không danh sách, không ảnh.
- Giờ tạo dẫn xuất từ `createdAt` **bên trong `app/core/time.js`** — nơi duy nhất được dựng mốc thời gian — và hiện đúng `HH:mm` bằng token `--font-time`.
- `Ctrl+Enter` chốt xong lưới vẽ lại; mẩu vừa chốt hiện ở dạng **thu gọn**.
- Im lặng khi thành công: ngoài mẩu giấy, dòng `còn N dòng ▾`/`thu lại ▴` và giờ tạo, không một chữ hay chỉ báo nào khác.

**Never:**
- Không nối hành vi cho nút `xóa`. Ở story này nó chỉ tồn tại **về mặt hình dạng** — hộp thoại xác nhận và việc xóa thật thuộc Epic 5.
- Không nhịp click thứ hai (vào chế độ sửa) — Story 5.1.
- Không dải băng thông báo, không `aria-live`, không `role="list"` — thuộc Epic 3 và epic dải băng.
- Không thêm breakpoint, `@media`, `@container` nào; không sửa luật `.luoi` hiện có.
- Không số literal ngoài `app/core/limits.js`; không `new Date`/`Date.now` ngoài `app/core/time.js`.
- Không đổi hành vi lọc của `app/core/query.js` và không thêm trường bền vào bản ghi ghi chú.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mẩu ngắn | ghi chú ≤ `COLLAPSED_LINES` | Nền giấy, `HH:mm`, nút `xóa`, toàn văn, **không** dòng `còn N dòng ▾` | N/A |
| Mẩu dài | ghi chú vượt ngưỡng | Cắt ở ngưỡng + dòng `còn N dòng ▾`; mọi mẩu thu gọn cùng chiều cao trần | N/A |
| Click mẩu bị cắt | mẩu thu gọn | Mở rộng tại chỗ, dòng đổi `thu lại ▴`, hàng dưới bị đẩy xuống | N/A |
| Click lần nữa | mẩu đang mở rộng | Thu lại, dòng về `còn N dòng ▾` | N/A |
| Click mẩu ngắn | mẩu không bị cắt | **Không đổi gì cả**, kể cả focus — không có gì để mở rộng | N/A |
| Nhiều mẩu mở | click hai mẩu bị cắt | **Cả hai** cùng mở rộng | N/A |
| Tải lại trang | vài mẩu đang mở rộng | **Mọi mẩu về thu gọn** | N/A |
| Chốt khi đang mở | một mẩu mở rộng, `Ctrl+Enter` | Mẩu mới thu gọn ở đầu; các mẩu đang mở **giữ nguyên** trạng thái mở | N/A |
| Chữ nhiều dòng | `a\n\nb` | Xuống dòng giữ nguyên, đếm dòng tính đúng | N/A |
| Chữ mang thẻ HTML | `<b>x</b>` | Hiện nguyên văn, không thành markup | N/A |
| `createdAt` hỏng | bản ghi lỗi trong kho | `time.js` ném `TypeError` — sập ồn ào, không cắt im lặng | ném |
| Không có `.luoi` | DOM thiếu phần tử | `noiLuoi` no-op, không ném | N/A |
| Đoạn dài không `\n` | một dòng logic, wrap 10 dòng hiển thị | Bị trần CSS cắt, hàng vẫn đều; **không** có dòng `còn N dòng ▾` | N/A |

### Quyết định của người dùng

- **Cắt = trần cứng bằng CSS, `N` = số dòng logic còn lại.** `max-height` đúng `COLLAPSED_LINES` lần chiều cao dòng kèm `overflow: hidden` giữ cho mọi mẩu thu gọn cùng chiều cao trần, kể cả một đoạn dài không xuống dòng. Dòng `còn N dòng ▾` chỉ xuất hiện khi **số dòng logic** vượt `COLLAPSED_LINES`, và `N` là số dòng logic còn lại. Hệ quả đã chấp nhận: một đoạn dài một-dòng-logic bị trần CSS cắt mà không có dòng báo — đây là **suy giảm có ý thức**, không phải khiếm khuyết cần sửa ở story này.
- **Chỉ mẩu bị cắt mới vào thứ tự Tab** (`tabindex="0"`). Mẩu không bị cắt không nhận focus và click vào nó **không đổi gì cả**. Thứ tự Tab vì thế chỉ dài thêm đúng bằng số mẩu có hành vi; focus ring và thứ tự tab đầy đủ vẫn là việc của Story 3.2.
- **Giữ spec đầy đủ** dù vượt ngưỡng token: 2.5 là một deliverable duy nhất, và độ dày Code Map là thứ đã giữ cho 2.1–2.4 không phải dò lại các cửa chặn test.

</frozen-after-approval>

## Code Map

- `app/core/state.js` -- `stateRong()` L153-169: tầng C **đã có** `expandedId: null` (L160) — *một* mẩu, trong khi AC đòi **nhiều mẩu cùng mở**; phải nới thành tập hợp (ví dụ `expandedIds: []`). Danh sách action đóng băng L706-719 (`Object.freeze`) — thêm action mở/thu vào đúng đây. Chú thích tầng state L145-147 mô tả tầng C, cập nhật cho khớp. `banGhiMoi` L119-128: năm trường bền — **không thêm trường nào**.
- `app/core/time.js` -- `nowIso()` L107, `localStamp(note)` L133 (`createdAt.slice(0,19)`), `localDate(note)` L138. **Chưa có** hàm nào trả `HH:mm`; đây là nơi duy nhất được dựng mốc (`test/date-tap-trung.test.js:27`). Thêm một export mới lấy `HH:mm` từ `createdAt`, dùng hằng của `limits.js` thay vì literal.
- `app/core/limits.js` -- `COLLAPSED_LINES = 3` L17 (ghi rõ "Epic 2 dùng để đặt chiều cao trần"), `TIME_FIELD_CHARS = 2` L65, `LOCAL_STAMP_CHARS = 19` L44, `LOCAL_DATE_CHARS = 10` L48. **File duy nhất** được chứa số literal. Chỉ số cắt cho `HH:mm` phải thành hằng ở đây.
- `app/view/luoi.js` -- `CHON_LUOI='.luoi'` L29, `THE_O='div'` L32, `LOP_O='o-luoi'` L37, `noiLuoi(store, goc=document, mocHienTai=nowIso)` L49, no-op branch L53, chỗ dựng ô L67-72 (`createElement`/`className`/`textContent`), `replaceChildren(...)` L75. **Điểm nối duy nhất** cho bộ vẽ mẩu; giữ nguyên `replaceChildren` một lần một lượt.
- `app/view/mau-giay.js` -- **FILE MỚI**. Bộ vẽ thuần một mẩu: `veMau(note, ownerDocument, dangMoRong, khiClick)` → `Element`. Không import adapter, không đọc `document` toàn cục, không `new Date`, không literal.
- `app/main.js` -- khối `document` L69-88: `noiLuoi(store)` phải đứng **trước** `store.khoiDong()` (ghim ở `test/luoi.test.js:275`), `khoiDong().then(luoi.ve)` L72, `noiOSoan(store, document, luoi.ve)`. Lượt vẽ lại sau khi mở/thu nối tay ở đây hoặc trong chính `ve()` — không có subscribe.
- `app/style.css` -- token: `--paper` L38, `--paper-tape` L39, `--ink` L41, `--ink-2` L42, `--font-note` L49, `--font-time` L51, `--tracking-time` L54, `--note-padding-y` L62, `--note-padding-x` L63, `--radius-paper` L78, `--shadow-inset` L76 (**bóng duy nhất đang có**). Chú thích L148-150 nói rõ bóng nổi của mẩu giấy là việc của Story 2.5 và **phải có token riêng**. `.luoi` L323-328 và `.o-luoi` L335-338: `.o-luoi` hiện chỉ có `white-space`/`overflow-wrap`.
- `test/token-style.test.js` -- bảng ghim: `BONG` L114 / `BONG_DARK` L118 (chỉ `--shadow-inset`), `BO_GOC` L122, `TOKEN_CUA_ROOT` L130 (`:root` phải khai báo **đúng** tập này, kiểm ở L281), `TOKEN_DOI_THEO_THEME` L139 (kiểm ở L257). Token bóng mới **bắt buộc** phải thêm vào các bảng này. Cấm literal màu L392-408, cấm `outline:none` L324.
- `test/bo-cuc-bon-tang.test.js` -- L186-213: **mọi** `box-shadow` phải mở đầu bằng `var(--shadow-inset)` (L196) và tập selector mang `box-shadow` bị ghim đúng `['.o-soan','.o-soan:focus-visible']` (L207). Cả hai phải được **renegotiate có chủ ý** trong story này. L69-73: regex lưới rỗng đòi `<div class="luoi">` **không thuộc tính nào khác** — vẫn không được thêm `id`. L155 đúng một `<svg>`, L167 không `<a>`, L181 đúng hai `<script>`, L182 không `on*=` inline, L117-131 không `@media`/`@container`.
- `test/luoi.test.js` -- L225 ghim khối `.o-luoi` **không được** chứa `color|background|border|radius|shadow|padding` — cửa chặn này chặn đúng vật liệu giấy, phải nới (giấy chuyển sang class riêng hoặc điều khoản được ghi lại). L244 ghim tập thành viên store mà view chạm tới **đúng `['state']`** — thêm lời gọi action sẽ làm đỏ, phải cập nhật cùng lý do. L258 chỉ cho literal `0`/`1`; L263 bắt buộc `.textContent =`, L264 cấm `innerHTML`. L267-276 ghim thứ tự nối trong `main.js`.
- `test/state-tap-trung.test.js` L206 -- chỉ `state.js` được gán vào state. `test/nguong-tap-trung.test.js` L15/L20 -- ngoài `limits.js` chỉ `0`/`1`. `test/harness.test.js` L135 -- `app/core/**` không nhắc `window|document|indexedDB`. **Không sửa ba file này.**
- `tools/thu-bo-cuc.mjs` -- đã bơm ghi chú thật qua IndexedDB (`BOM_O`) và đo hàng/cột/chiều cao, dọn dẹp ở cuối. Đây là nơi duy nhất đo được "cùng chiều cao trần" và "hàng dưới bị đẩy xuống".
- `_bmad-output/implementation-artifacts/spec-2-4-luoi-ghi-chu-cua-hom-nay.md` -- Implementation Notes L101-116: lý do `.luoi` **không** có `id`, và tiền lệ "một luật CSS ngữ nghĩa chữ" khi phải nới cửa chặn.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/limits.js` -- thêm hằng chỉ số cắt `HH:mm` từ chuỗi ISO (vị trí bắt đầu và độ dài), đặt cạnh `LOCAL_STAMP_CHARS` -- file duy nhất được chứa số literal, nên mọi chỉ số cắt phải sinh ra ở đây
- [x] `app/core/time.js` -- thêm một export trả `HH:mm` từ `note.createdAt`, dùng cùng phép kiểm hợp lệ như `localStamp`/`localDate` (hỏng thì ném `TypeError`) -- đây là nơi duy nhất được dựng mốc thời gian, view không được tự cắt chuỗi
- [x] `app/core/state.js` -- nới tầng C từ `expandedId` (một) sang tập hợp nhiều mẩu, thêm action bật/tắt trạng thái mở rộng của một `id` vào danh sách đóng băng L706-719, cập nhật chú thích tầng state -- AC đòi nhiều mẩu mở cùng lúc, và state chỉ được đổi bên trong một action của lõi
- [x] `app/view/mau-giay.js` -- file mới theo khuôn `luoi.js`/`o-soan.js` (header ba luật, không literal, không `document` toàn cục): dựng một mẩu giấy — đầu mẩu `HH:mm` + nút `xóa`, thân đặt bằng `textContent`, dòng `còn N dòng ▾`/`thu lại ▴` **và** `tabindex="0"` chỉ khi số dòng logic vượt `COLLAPSED_LINES` -- tách bộ vẽ khỏi bộ lọc giữ `luoi.js` đúng một việc và cho phép kiểm từng mẩu không cần cả lưới
- [x] `app/view/luoi.js` -- thay ba dòng dựng ô L67-72 bằng lời gọi bộ vẽ, truyền trạng thái mở rộng đọc từ `store.state` và handler gọi action rồi `ve()` lại -- điểm nối duy nhất; `replaceChildren` một lần một lượt giữ nguyên
- [x] `app/style.css` -- thêm token bóng nổi (light + dark) và luật vật liệu mẩu giấy: nền `--paper`, dải keo `inset 0 3px 0 var(--paper-tape)`, `--radius-paper`, padding `--note-padding-y/x`, `--font-time`/`--tracking-time` cho giờ, và **trần chiều cao khi thu gọn** = `COLLAPSED_LINES` × chiều cao dòng kèm `overflow: hidden` -- mọi giá trị phải là token; đây là file CSS duy nhất
- [x] `test/token-style.test.js` -- thêm token bóng mới vào `BONG`, `BONG_DARK`, `TOKEN_CUA_ROOT`, `TOKEN_DOI_THEO_THEME`, và token số-dòng-thu-gọn/chiều-cao-dòng vào bảng `SPACING` + `TOKEN_CUA_ROOT` -- các bảng ghim *đúng* tập token, nên token mới phải được khai báo có chủ ý chứ không lọt vào
- [x] `test/bo-cuc-bon-tang.test.js` -- nới đúng hai chỗ: luật "`box-shadow` mở đầu bằng `var(--shadow-inset)`" (L196) và tập selector mang `box-shadow` (L207), để mẩu giấy có bóng nổi; **không** chạm chỗ nào khác -- renegotiate có ghi chép thay vì lách
- [x] `test/luoi.test.js` -- nới cửa chặn `.o-luoi` (L225) và tập thành viên store (L244) cho đúng bề mặt mới, giữ nguyên mọi ca hành vi cũ -- cửa chặn phải mô tả luật hiện hành, không phải luật cũ
- [x] `test/mau-giay.test.js` -- file mới phủ toàn bộ I/O Matrix ở tầng view: mẩu ngắn/dài, dòng `còn N dòng ▾` đúng số, mở rộng đổi thành `thu lại ▴`, click mẩu ngắn không đổi gì, `HH:mm` đúng, thẻ HTML hiện nguyên văn, `createdAt` hỏng thì ném; cộng cửa chặn tầng view của riêng file -- mỗi view mới mang cửa chặn của chính nó
- [x] `test/core-state.test.js` + `test/core-time.test.js` -- ca cho action mở/thu (nhiều mẩu cùng mở, bật/tắt, `id` lạ) và cho hàm `HH:mm` (nửa đêm, đúng trưa, offset khác) -- state phù du và phép cắt giờ là hai thứ kiểm được không cần DOM
- [x] `tools/thu-bo-cuc.mjs` + `README.md` -- thêm phép đo Chromium: mọi mẩu thu gọn cùng chiều cao, mẩu dài mở rộng đẩy hàng dưới xuống, hai mẩu mở cùng lúc được, tải lại trang mọi mẩu về thu gọn; dọn dẹp theo `id` đã tạo -- chiều cao và thứ tự hàng là phép đo hình học, Vitest không với tới

**Acceptance Criteria:**
- Given `npm test`, when chạy, then toàn bộ suite xanh, và trong `test/` **chỉ** ba file `token-style`, `bo-cuc-bon-tang`, `luoi` bị sửa — mỗi file đúng những dòng Tasks nêu — cộng các file mới
- Given `app/view/**`, when đọc, then không file nào nhắc `new Date`, `innerHTML`, `adapters/`, hay số literal ngoài `0`/`1`
- Given `app/style.css`, when đọc, then không một mã màu, cỡ chữ hay bóng viết thẳng nào trong luật mẩu giấy; mọi giá trị là `var(--…)`
- Given kho có ghi chú của hôm qua, when tải trang, then chúng vẫn không hiện — story này không đụng bộ lọc
- Given hai mẩu đang mở rộng, when tải lại trang, then cả hai về thu gọn và không dấu vết nào của trạng thái mở trong IndexedDB/localStorage
- Given một lần chốt, when nhìn, then mẩu mới nhô lên ở ô trên-cùng-trái ở dạng thu gọn và không một chỉ báo nào khác xuất hiện

## Implementation Notes

**Mẩu giấy KHÔNG có class mới ở gốc — nó là chính `.o-luoi`.** Code Map để ngỏ hai đường ("giấy chuyển sang class riêng hoặc điều khoản được ghi lại"), và đường class riêng vướng một cửa chặn mà Tasks không cho phép sửa: `luoi.test.js` ghim `luoi.con.map((c) => c.className)` bằng đúng `['o-luoi','o-luoi']`. Nên gốc ô giữ nguyên tên của Story 2.4 và vật liệu treo thẳng lên nó; class mới chỉ có ở bên trong (`mau-dau`, `mau-gio`, `mau-xoa`, `mau-than`, `mau-gap`). Tên `o-luoi` vẫn đúng nghĩa: nó là "một ô của lưới", và 2.5 chỉ nói ô đó làm bằng gì.

**Trần chiều cao nằm ở `.mau-than`, không ở gốc mẩu.** Kẹp cả mẩu thì đúng thứ nói `còn N dòng ▾` lại là thứ bị `overflow: hidden` cắt mất, và đầu mẩu (giờ + nút xóa) cũng đi theo khi mẩu đủ dài. Hệ quả: cả `.o-luoi` lẫn `.mau-than` đều cần `white-space: pre-wrap` thừa hưởng đúng, và hai khối cố định (`mau-dau`, `mau-gap`) đặt lại `white-space: normal` để `pre-wrap` không áp lên hai nhãn không phải chữ của Nam.

**Bốn cửa chặn bị nới, không phải ba.** Ba cửa đã dự liệu: `bo-cuc-bon-tang:196/207` (bóng) và `luoi.test:225` (vật liệu `.o-luoi`), cộng `luoi.test:244` (bề mặt store). Cửa thứ tư lộ ra lúc làm: `luoi.test:263` đòi `luoi.js` chứa `.textContent =`. Phép đặt nội dung chuyển sang `mau-giay.js` cùng với hình dạng mẩu, nên yêu cầu đó không còn mô tả luật hiện hành. Nó được **chuyển chỗ** chứ không bị bỏ: `mau-giay.test.js` ghim `.textContent =` và lệnh cấm `innerHTML` ở đúng file thật sự dựng nội dung, còn `luoi.test.js` giữ lại vế không bao giờ đổi (không dựng DOM từ chuỗi) và thêm vế mới (giao hình dạng cho `veMau`).

**Bộ đồ nghề DOM giả của `luoi.test.js` phải nâng lên.** Mỗi ô giờ là một cây nhỏ, nên phần tử giả cần `append`/`setAttribute`/`addEventListener`, và `luoi.chu()` đọc chữ qua `.mau-than` thay vì qua gốc ô. Đây là đồ nghề, không phải ca hành vi: mọi phép nghiệm thu của Story 2.4 giữ nguyên từng chữ. Cùng một lý do và cùng một sửa đổi ở `tools/thu-bo-cuc.mjs` (khối Story 2.4 đọc `textContent` của gốc ô).

**Nút `xóa` ở ngoài thứ tự Tab (`tabindex="-1"`).** Quyết định của người dùng nói "thứ tự Tab chỉ dài thêm đúng bằng số mẩu có hành vi". Một `<button>` chưa nối hành vi mà vẫn nhận focus là một điểm dừng bàn phím dẫn tới không đâu, nhân với số mẩu trên lưới. Nó vẫn là `<button type="button">` để Epic 5 chỉ phải gỡ một thuộc tính. Clic vào nó vẫn nổi bọt lên mẩu và mở/thu như clic vào chỗ khác — chặn nổi bọt là *nối hành vi* cho nút, thứ story này cấm.

**`test/core-limits.test.js` cũng phải sửa**, ngoài ba file mà AC#1 nêu: bảng của nó ghim ĐÚNG tập tên export của `limits.js`, nên mọi hằng mới đều đi qua đó. Đây là cửa chặn làm đúng việc của nó, không phải một phạm vi bị nới.

## Spec Change Log

- **Cửa chặn thứ tư được nới:** `test/luoi.test.js:263` (`.textContent =` trong `luoi.js`). Lý do và cách xử ở Implementation Notes; yêu cầu chuyển sang `test/mau-giay.test.js`.
- **Phạm vi AC#1 rộng hơn một file:** `test/core-limits.test.js` (bảng ghim tập export của `limits.js`) và `test/core-state.test.js` (`expandedId` → `expandedIds`, danh sách action) đều buộc phải sửa — cả hai đã nằm trong Tasks hoặc là hệ quả trực tiếp của chúng.
- **Tên đã chốt lúc làm:** hằng `LOCAL_TIME_START`/`LOCAL_TIME_CHARS`, hàm `localTime`, action `batTatMoRong`, token `--shadow-paper` / `--note-collapsed-lines` / `--note-line-h`.

## Review Triage Log

Vòng 1 — ba lớp: `blind-hunter`, `edge-case-hunter`, `verification-gap`.

| # | Phát hiện | Verdict | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Click nút `xóa` **nổi bọt** lên thẻ mẩu và bật/tắt mở rộng — cả ba lớp cùng nêu | medium | Bộ nghe gắn ở `mau` (`mau-giay.js:540`), `xoa` là con của nó, không có `stopPropagation` nào. README hứa "bấm vào nó không xóa gì cả" — đúng, nhưng hiệu ứng quan sát được **không phải** là không có gì. Không ca nào ghim chuyện này | patch |
| 2 | Mẩu bị cắt vào thứ tự Tab nhưng **không mở được bằng bàn phím**: `tabindex="0"` mà chỉ nghe `click`, không `keydown` | medium | `mau-giay.js:539-540`. `<div tabindex=0>` không tự sinh `click` từ Enter/Space. Đúng thứ chú thích của chính nút `xóa` lập luận chống lại — một điểm dừng bàn phím dẫn tới không đâu. Quyết định "chỉ mẩu bị cắt mới vào Tab" là của story này, nên lỗ này do thay đổi này tạo ra | patch |
| 3 | **Không ca Vitest nào chạy đường nối `luoi.js` ↔ `veMau`**: xóa `ve()` khỏi handler, hay thay `dangMo.includes(note.id)` bằng `false`, cả suite vẫn xanh | medium | Lớp verification-gap đã chứng minh: mọi ca `luoi.test.js` (12 ca) không dựng trạng thái mở, không gọi `boNghe.click` nào; ca ở L289 chỉ soi **văn bản**; `mau-giay.test.js` được đưa thẳng cờ và callback. Phủ thật chỉ có `thu-bo-cuc`, không nằm trong `npm test` | patch |
| 4 | `--note-line-h` **không bị ràng** với line-height của `--font-note`; và ở dạng `em` nó ăn theo cỡ chữ của `.mau-than`, thứ luật đó không hề đặt | medium | Hai lớp cùng nêu. `token-style` ghim `'1.55em'` như một chuỗi, `mau-giay.test.js` ghim `--note-collapsed-lines` với `COLLAPSED_LINES` — nhưng vế "1.55 phải bằng line-height của `--font-note`" không có người canh. Đổi `--font-note` thì trần cắt lệch giữa dòng, đúng thứ ca hàng xóm sinh ra để chặn | patch |
| 5 | Chú thích `batTatMoRong` nói nó là "action **DUY NHẤT** không đi qua `ghiTruocDatSau`" — **sai** | low | Đọc thẳng `state.js`: `datDieuKien` (L307-335) và `xoaHetDieuKien` (L338-340) cũng chỉ gọi `datLai`. Một bất biến bịa ra là thứ người sau sẽ "sửa" bằng cách làm yếu một trong hai vế | patch |
| 6 | `xoaGhiChu` **không dọn** `id` khỏi `expandedIds` | low | Thật: `state.js:565-568` chỉ lọc `notes`. Vô hại cho lượt vẽ (không mẩu nào mang `id` đó), nhưng tập phù du phình dần trong một phiên dài, và phép sửa là đúng một `filter` trong closure sẵn có | patch |
| 7 | Bộ đo bỏ qua **im lặng** khi tra `id` của mẩu vừa chốt trả `null` → mẩu được tạo nhưng không vào danh sách dọn dẹp | medium | `thu-bo-cuc.mjs`: `if (moi !== null) idMau.push(moi)`. Cùng lớp với mục 4 của vòng review 2.4 đã được patch: bộ đo không được để lại rác trong kho thật của Nam | patch |
| 8 | Sau mỗi lượt bật/tắt, `ve()` thay toàn bộ con → phần tử đang focus bị hủy, focus rơi về `<body>` | low | Thật. Nhưng phép sửa đòi view nhớ phần tử nào đang focus — một ô nhớ thứ hai ở tầng view, đúng thứ luật tầng view cấm — hoặc một trường state mới. Focus ring và hành vi focus là `3-2-focus-ring-và-thứ-tự-tab` | defer |
| 9 | Mẩu click được nhưng không có `cursor: pointer`, và mẩu vào Tab được nhưng không có `:focus-visible` | low | Thật. `bo-cuc-bon-tang` ghim ring focus ở đúng `.o-soan`, và ranh giới accessibility là của Epic 3, không phải do spec vẽ ra | defer |
| 10 | `batTatMoRong` gọi được cả khi `state.readOnly` là `true` | false | `readOnly` (AD-21) từ chối các action **có ghi**; mở một mẩu ra để **đọc** trong chế độ chỉ-đọc là hành vi đúng, không phải lỗ. Không nêu được tác hại nào | bác bỏ |
| 11 | `note.text`/`note.id` hỏng thì `soDong`/`batTatMoRong` ném từ trong handler | false | Chỉ tới được từ một bản ghi hỏng trong kho — trạng thái chưa ai chỉ ra đường đi tới. Sập ồn ào ở đó là tiền lệ đã chốt ở vòng review 2.2 (mục 11) và 2.4 (mục 11) | bác bỏ |
| 12 | `khiClick` không phải hàm thì `addEventListener` im lặng nhận `undefined` | false | `veMau` là API nội bộ và `luoi.js` là chỗ gọi duy nhất, luôn truyền một hàm. Không có đường đi tới | bác bỏ |
| 13 | Cửa chặn bóng nới từ neo `^var(--shadow-inset)` sang so khớp không neo → một bóng viết thẳng dùng **tên màu** (`black`) lọt qua cả hai phép kiểm | low | Thật ở đúng ca đó, nhưng `token-style.test.js:392-408` cấm tên màu trong **mọi** CSS dưới `app/`, nên đường đi vẫn đóng. Nới thêm một regex cho một lỗ đã bịt ở chỗ khác là thêm phức tạp không mua được gì | bác bỏ |
| 14 | `LOCAL_TIME_START = 11` là `LOCAL_DATE_CHARS + 1` viết lại bằng tay, ghim lần nữa bằng literal `11` trong test | low | Thật, nhưng `limits.js` **là** file của các số literal — đó là cả tiền đề của AD-14 — và ghim bằng literal trong test là khuôn đã chốt từ `core-limits.test.js` (so hằng với chính hằng thì đổi hằng cũng xanh) | bác bỏ |
| 15 | `N` có thể sai theo chiều ngược lại: 4 dòng logic mà dòng đầu wrap thành 5 dòng hiển thị thì "còn 1 dòng" giấu nhiều hơn thế | low | Thật, và là mặt kia của đúng suy giảm mà người dùng đã chọn và ghi vào khối đóng băng (`Quyết định của người dùng`, ý 1). Sửa nó là đo layout trong view — thứ luật tầng view cấm | bác bỏ |
| 16 | `phanTuGia`/`theoLop` chép đôi giữa `luoi.test.js` và `mau-giay.test.js` với hai bản khác nhau; `luoiGia().chu()` ném `TypeError` mờ khi một ô không phải mẩu giấy | low | Thật, nhưng `test/helpers/` là nơi nó thuộc về và phép dọn là một lần chuyển nhà — hơn một phép sửa thẳng, cho một khiếm khuyết chỉ người viết test gặp | bác bỏ |
| 17 | AC#1 nói trong `test/` chỉ ba file bị sửa, nhưng diff sửa thêm `core-limits`, `core-state`, `core-time` | low | Thật. `core-state`/`core-time` **có** trong Tasks (mục 11), nên AC#1 đếm sót chính hai file mà chính nó đặt hàng; `core-limits` là hệ quả bắt buộc của một cửa chặn ghim đúng tập export, và đã được ghi ở Implementation Notes. Phép sửa duy nhất là sửa spec của chính lần build này | bác bỏ |

## Design Notes

**Vì sao tách `mau-giay.js` khỏi `luoi.js`.** `luoi.js` đang giữ đúng một trách nhiệm — lọc rồi thay danh sách con. Nhồi hình dạng mẩu vào đó sẽ trộn "chọn hiển thị cái gì" với "hiển thị ra sao", và làm cửa chặn của `luoi.test.js` phải nới rộng hơn mức cần. Bộ vẽ nhận `ownerDocument` qua tham số vì view không được chạm `document` toàn cục — cùng lý do `luoi.js` dùng `luoi.ownerDocument`.

**Vì sao trạng thái mở rộng phải vào lõi, dù nó chỉ là chuyện hiển thị.** Luật "view không giữ state riêng" được ghim bằng test, và tầng C của `stateRong()` đã dành sẵn chỗ (`expandedId`). Giữ nó trong closure của view là dựng đường đổi state thứ hai — đúng thứ AD-1 cấm. Việc nó **không** đi qua kho bền là chuyện của adapter, không phải của chỗ nó sống.

**`COLLAPSED_LINES` xuất hiện ở hai nơi, có chủ ý.** JS đếm dòng logic bằng hằng của `limits.js`; CSS dựng trần chiều cao bằng một token `:root`. Không có cách nào cho CSS đọc hằng JS mà không sinh một đường ghi style từ view — thứ luật tầng view cấm. Hai nơi phải **cùng giá trị**, và một ca Vitest đọc cả `limits.js` lẫn `style.css` để ghim rằng chúng không trôi khỏi nhau.

**Ba cửa chặn bị nới, và chỉ ba.** `bo-cuc-bon-tang:196/207` và `luoi.test:225` được viết khi mẩu giấy chưa tồn tại; chúng ghim "chưa có vật liệu nổi nào", không ghim một bất biến thật. Nới chúng là renegotiate công khai. `luoi.test:244` nới vì view giờ gọi một action — bề mặt mới, không phải lách luật. Mọi file ghim còn lại (`harness`, `trang-tinh`, `state-tap-trung`, `nguong-tap-trung`, `date-tap-trung`, `fold-tap-trung`) **không đổi một dòng nào**.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ suite xanh; diff trong `test/` đúng phạm vi AC#1
- `npm run thu-bo-cuc` -- expected: mọi phép đo của 2.1–2.4 vẫn đạt, cộng các phép đo chiều cao/mở rộng mới
- `npm run thu-tay` -- expected: các phép đo bản nháp và tính nguyên tử của `commitDraft` vẫn đạt

**Manual checks (if no CLI):**
- Chốt một ghi chú 10 dòng và một ghi chú 1 dòng: cả hai thu gọn cùng chiều cao, mẩu dài có `còn N dòng ▾`, mẩu ngắn không có
- Click mẩu dài: mở tại chỗ, dòng đổi `thu lại ▴`, hàng dưới bị đẩy xuống; click mẩu dài thứ hai: **cả hai** cùng mở
- Tải lại trang: cả hai về thu gọn; DevTools → IndexedDB và localStorage không có dấu vết trạng thái mở
- Bật theme tối: nền giấy và bóng nổi đều đổi, chữ vẫn đọc được
- Phóng 200%: mẩu vẫn dùng được, không tràn ngang
