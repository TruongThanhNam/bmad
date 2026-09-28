---
title: 'Story 2.3 — Chốt bản nháp thành ghi chú'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
baseline_commit: '6d8808919ae6b26932a20b61ae198f0e12a331e8'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chữ Nam gõ hiện chỉ đi tới bản nháp và nằm lại đó — không có đường nào biến nó thành một ghi chú mang dấu thời gian. `Ctrl+Enter` trong `<textarea>` chỉ xuống dòng, và lõi chưa có action `chotGhiChu`: `themGhiChu(text)` tạo được bản ghi nhưng **không** chạm `draft`, không hủy hẹn tự lưu, và ghi `notes` bằng một transaction tách rời với `drafts`. Hành trình UJ-1 đứt đúng ở nhịp cuối.

**Approach:** Dựng action `chotGhiChu()` trong lõi: hủy hẹn tự lưu đang treo trước khi làm gì khác, ghi bản ghi `notes` mới **cùng transaction** với việc làm rỗng bản ghi `drafts` của tab này, rồi mới đổi state. Việc "một transaction hai kho" cần một phương thức cổng mới (`commitDraft`) và việc nới `trongGiaoDich` của adapter IndexedDB sang nhiều kho. Ở view, thêm đúng một bộ nghe `keydown` vào `app/view/o-soan.js`: `Ctrl+Enter` chốt và làm trống ô (con trỏ ở lại), `Enter` trần vẫn xuống dòng.

## Boundaries & Constraints

**Always:**
- `chotGhiChu()` **không nhận tham số**: nguồn chữ duy nhất là `state.draft.text`. Bản nháp là thứ được chốt.
- Bước hủy hẹn tự lưu đi **trước mọi thứ khác**, bằng cơ chế `seq` của AD-8 (tăng `draft.seq`), không bằng `clearTimeout`.
- `xoaHetDieuKien()` được gọi ngay trong `chotGhiChu`, đúng ngay từ epic này dù chưa có cách nào đặt điều kiện (AD-15).
- Ghi trước, đổi state sau. Adapter ném lỗi → `notes` không đổi, `draft.text` **vẫn nguyên** trong state và trong ô, dải băng mang mã lỗi.
- Ghi `notes` và làm rỗng `drafts` nằm trong **một** transaction IndexedDB duy nhất (AD-8).
- `createdAt` là thời điểm **chốt**, sinh qua `nowIso()` của `core/time.js`; `id` qua `crypto.randomUUID()` — cả hai đã có trong `banGhiMoi`.
- Bản nháp rỗng (`trim() === ''`): không tạo, không dải băng, không chạm cổng, không nhấp nháy.
- Thành công thì giao diện **im lặng tuyệt đối** — ô trống lại, con trỏ ở lại, hết.
- View vẫn chỉ đọc state; mọi phép ghi qua action. Không số literal ngoài `limits.js`, không `new Date()`, không import `app/adapters/` ngoài `main.js`.

**Never:**
- Không nút "Chốt", không chỉ báo "đã lưu", không đếm ký tự, không hiệu ứng nhấp nháy khi chốt rỗng.
- Không mẩu giấy, không luật CSS cho `.luoi`, không render ghi chú (Story 2.4, 2.5) — lưới vẫn trống về mặt markup.
- Không dải băng hiển thị (Story 3.1): lỗi và `TOO_LONG` dừng ở tầng action, `state.banner` được đặt nhưng không có chỗ nói.
- Không cắt chữ ở bất kỳ đâu; không `maxlength`.
- Không thêm trường state mới ngoài những gì đã có; không cơ chế subscribe; không store thứ hai.
- Không đụng `app/core/draft.js`, `app/core/time.js`, `app/core/limits.js`, và không sửa các test ghim bất biến ngoài **đúng một** cửa chặn phạm vi story được nêu ở Code Map.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Chốt bình thường | `draft.text = 'phở'`, bấm `Ctrl+Enter` | Một bản ghi vào `notes` đầu mảng (đã `sapGiamDan`); `draft.text = ''`; ô trống, con trỏ vẫn trong ô; `banner = null` | N/A |
| Gõ đêm, chốt sáng | Gõ lúc `23:00`, chốt lúc `09:00` hôm sau | `createdAt`/`localDate` là mốc **chốt** (`09:00` hôm sau), không phải lúc gõ | N/A |
| Bản nháp rỗng | `draft.text` là `''` hoặc chỉ khoảng trắng | Không gọi cổng, `notes` không đổi, `banner` không đổi, ô không đổi | N/A |
| `Enter` đơn thuần | Bấm `Enter` không giữ `Ctrl` | Chèn xuống dòng như mặc định, **không** chốt, không `preventDefault` | N/A |
| Hẹn tự lưu đang treo | Gõ chữ rồi chốt trong vòng `AUTOSAVE_MS` | Hẹn cũ nổ ra bị bỏ vì `draft.seq` đã tăng — bản nháp đã chốt **không hồi sinh** | N/A |
| Adapter ném lỗi | `commitDraft` bị từ chối | `notes` không đổi, `draft.text` giữ nguyên, ô vẫn đủ chữ, `banner` mang mã lỗi; hẹn tự lưu được đặt lại để chữ chưa an toàn còn đường xuống kho | `banner = maBanner(loi)` |
| Quá trần ký tự | `draft.text.length > MAX_NOTE_CHARS` | Cổng **không** bị gọi, không tạo ghi chú, chữ nằm nguyên trong ô | `banner = TOO_LONG`, không có chỗ nói (suy giảm có ý thức) |
| Chưa giành được bản nháp | `tabCuaMinh === null` (`claimDraft` hỏng/chưa trả lời) | Vẫn chốt được: ghi **chỉ** bản ghi `notes` — không có bản ghi `drafts` nào của tab này để làm rỗng | Cùng đường dải băng như trên |
| Chốt liên tiếp | `Ctrl+Enter`, gõ tiếp, `Ctrl+Enter` | Hai ghi chú với `id` khác nhau, mẩu mới hơn đứng trước; không mẩu trùng nội dung | N/A |

### Quyết định của người dùng

- **Gác rỗng đi TRƯỚC `xoaHetDieuKien()`.** AC của epic gọi `xoaHetDieuKien()` là "bước đầu tiên", nhưng AC khác nói bản nháp rỗng thì "không làm gì cả" — hai câu va nhau đúng ở ca ô trống. Đọc đúng là: **bước đầu tiên của một lần chốt THẬT**. `Ctrl+Enter` trên ô trống không được đổi một byte state nào, để ở Epic 6 một cú bấm nhầm không âm thầm xóa bộ lọc Nam đang bật. Thứ tự bắt buộc trong `chotGhiChu`: (1) tăng `draft.seq` hủy hẹn treo, (2) gác rỗng → thoát, (3) gác trần → dải băng rồi thoát, (4) `xoaHetDieuKien()`, (5) dựng bản ghi và ghi xuống kho.
- **`themGhiChu` hạ xuống hàm nội bộ, không còn là action công khai.** `chotGhiChu()` dùng lại nó cho phần dựng-và-ghi bản ghi, nhưng store chỉ xuất `chotGhiChu`. Hai action tạo ghi chú với hai luật ghi khác nhau (một cái không nguyên tử với `drafts`) đúng là loại lệch AD-8 muốn chặn, và glossary của ARCHITECTURE-SPINE (L443) chỉ biết `chotGhiChu`. Kèm theo: khối `describe('themGhiChu…')` của `core-state.test.js` (L469-586) được **viết lại** sang `chotGhiChu` — các ca `trim()`/trần/`TypeError` phải sống tiếp dưới tên mới, không được mất ca nào. Ca ghim danh sách action (L770) bỏ `themGhiChu`, thêm `chotGhiChu`.
- **Giữ spec đầy đủ** dù vượt ngưỡng token: Story 2.3 là một deliverable duy nhất, tách ra sẽ để lại nửa tính nguyên tử của AD-8.

</frozen-after-approval>

## Code Map

- `app/core/state.js` -- `themGhiChu(text)` L421-438 (mẫu cho luật gác rỗng/trần), `ghiTruocDatSau` L343-352 (luồng ghi-trước-state-sau, tự tắt/bật dải băng), `henGhiBanNhapDiSau` L523-530 + chú thích L354-363 (luật `seq`, **không** `clearTimeout` — đọc trước khi viết bước hủy hẹn), `datBanNhap` L595-606 (cách tăng `seq`), `ghiBanNhap` L504-515, `banGhiMoi` L119-128 (hình dạng bản ghi), `sapGiamDan` L107-110, `xoaHetDieuKien` L326-328, `datLai` L284-287 (**đường đổi state duy nhất**, phải thay cả nhánh), `tabCuaMinh` (đặt ở L560), danh sách export L629-642 (thêm `chotGhiChu`, và JSDoc L257 phải theo).
- `app/ports/note-store.js` -- typedef `NoteRecord` L18-24, `DraftRecord` L65-69, `NoteStorePort` L102-110, và `NOTE_STORE_METHODS` L113-120. Thêm `commitDraft` vào **cả** JSDoc lẫn mảng — mảng là dữ liệu `kiemTraPorts` dùng, quên một bên là thêm một phương thức không ai cưỡng chế. Tệp này **không được** nêu tên công nghệ nào (`state-tap-trung.test.js` ghim).
- `app/adapters/indexeddb.js` -- `trongGiaoDich(tenStore, cheDo, thanTac)` L211-256: hiện chỉ mở **một** kho (`kho.transaction([tenStore], …)` L217) và trao `giaoDich.objectStore(tenStore)` cho `thanTac` (L234). Đây là chỗ phải nới sang nhiều kho. Sáu chỗ gọi: `readAll` L260, `put` L266, `remove` L272, `claimDraft` L294, `putDraft` L313, `replaceAll` L322. Hằng `STORE_NOTES`/`STORE_DRAFTS` L32-38; chuẩn hóa bản ghi `banGhiChuan` / `banNhapChuan`. **Adapter không có test tự động theo thiết kế** — phép kiểm của nó là `npm run thu-tay`.
- `app/view/o-soan.js` -- `noiOSoan(store, goc)` L28, bộ nghe `input` L52-55, `caoTheoNoiDung` L46-50, `dongBoTuState` L79-88, `return` L92. Thêm `keydown` cạnh `input`; sau khi `chotGhiChu()` chốt xong thì gọi `dongBoTuState()` + `caoTheoNoiDung()` để ô co lại. Header L1-14 liệt kê ba luật của view — giữ nguyên tinh thần.
- `app/main.js` -- L68-88 khối nối view; `noiOSoan(store)` ở L76 đã truyền cả store. **Nhiều khả năng không phải sửa** — kiểm tra rồi mới kết luận.
- `index.html` -- `<textarea id="o-soan">` L69-70, chú thích L73 đang nói `Ctrl+Enter` thuộc Story 2.3 (hết đúng, phải cập nhật). `.luoi` L112 giữ **rỗng nguyên**.
- `test/o-soan.test.js` -- **cửa chặn phạm vi story duy nhất được nới**: L476-480 ghim tập thành viên store mà view chạm là `['datBanNhap','state']`; nới thành `['chotGhiChu','datBanNhap','state']`. Quét văn bản `index.html` L404-409 (`/\bLưu\b/`, `/đã lưu/i`, `/chưa chốt/i`, `/ký tự/i`) **giữ nguyên** và phải còn xanh.
- `test/core-state.test.js` -- khối `themGhiChu` L469-586 (mẫu cho các ca mới), ca ghim danh sách action L770, ca `main.js` L1108.
- `test/bo-cuc-bon-tang.test.js` -- L69-74 `.luoi` phải rỗng, L178-184 đúng hai `<script>` + không `on*=` inline, L201-209 chỉ `.o-soan` được mang bóng. **Không sửa** — bộ ba này phải tự nhiên còn xanh.
- `test/state-tap-trung.test.js`, `test/nguong-tap-trung.test.js`, `test/date-tap-trung.test.js`, `test/harness.test.js`, `test/trang-tinh.test.js`, `test/token-style.test.js` -- ghim bất biến toàn cây. **Không sửa một dòng nào.**
- `tools/thu-tay-ban-nhap.mjs` -- bộ đo Chromium thật cho bản nháp; chỗ thêm phép đo tính nguyên tử của `commitDraft` (thứ Vitest không chạm tới được). `tools/cdp.mjs` là driver. `npm run thu-tay` không nằm trong `npm test`.
- `_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md` -- AD-8 L190-214 (luật hủy hẹn + một transaction, nguyên văn lý do "bản nháp ma → ghi chú trùng"), AD-15 L334, glossary tên action L443.

## Tasks & Acceptance

**Execution:**
- [x] `app/ports/note-store.js` -- thêm callback typedef `NoteStoreCommitDraft` (nhận `{ note, draft }`, trả `Promise<void>`, nêu rõ **một giao dịch duy nhất trên cả hai kho**), đưa vào `NoteStorePort` và `NOTE_STORE_METHODS` -- hợp đồng đi trước hiện thực, và `kiemTraPorts` chỉ cưỡng chế được thứ có trong mảng
- [x] `app/adapters/indexeddb.js` -- nới `trongGiaoDich` nhận **danh sách** tên kho và trao chính `giaoDich` cho `thanTac` (sửa cả sáu chỗ gọi cho khớp), rồi thêm `commitDraft({ note, draft })` ghi `notes.put` và `drafts.put` trong cùng một giao dịch `readwrite`; `draft === null` thì chỉ ghi `notes` -- tính nguyên tử của AD-8 là thứ duy nhất chặn bản nháp ma hồi sinh
- [x] `app/core/state.js` -- thêm action `chotGhiChu()` theo đúng năm bước đã chốt (hủy hẹn → gác rỗng → gác trần → `xoaHetDieuKien()` → ghi), dùng `ghiTruocDatSau(() => ports.noteStore.commitDraft(...), …)` đặt `notes` đã sắp lại **và** `draft` rỗng trong cùng một `datLai`; hỏng thì đặt lại hẹn tự lưu cho chữ còn trên màn hình. **Hạ `themGhiChu` xuống hàm nội bộ**: bỏ khỏi khối `Object.freeze` (L629-642) và khỏi JSDoc L257, thêm `chotGhiChu` vào cả hai -- một đường tạo ghi chú công khai, đúng luật ghi của AD-8
- [x] `app/view/o-soan.js` -- thêm bộ nghe `keydown`: chỉ `Ctrl+Enter` mới `preventDefault()` và gọi `store.chotGhiChu()`, rồi `.then(...)` đồng bộ ô từ state và đo lại chiều cao; mọi phím khác đi qua nguyên vẹn -- `Enter` xuống dòng là hành vi mặc định, không phải thứ phải dựng lại
- [x] `index.html` -- cập nhật chú thích L73 (nó đang hoãn `Ctrl+Enter` sang story này) -- chú thích sai còn nguy hơn không có chú thích
- [x] `test/core-state.test.js` -- viết lại khối `describe('themGhiChu…')` L469-586 sang `chotGhiChu` (không mất ca nào cho `trim()`/trần/`TypeError`) và sửa ca ghim danh sách action L770; thêm ca cho toàn bộ I/O Matrix ở tầng lõi bằng cổng giả: chốt bình thường, rỗng/khoảng trắng (**và** `dieuKien` không đổi ở ca rỗng), quá trần, adapter ném lỗi (state không đổi, `draft.text` còn nguyên), hẹn treo bị bỏ sau khi chốt, `tabCuaMinh === null`, `xoaHetDieuKien` được gọi ở lần chốt thật, `createdAt` là mốc chốt, chốt liên tiếp cho hai `id` khác nhau; cộng ca ghim rằng `commitDraft` nhận **cả hai** bản ghi trong **một** lời gọi -- "một transaction" ở tầng lõi quan sát được đúng bằng "đúng một lời gọi cổng"
- [x] `test/o-soan.test.js` -- nới cửa chặn L476-480 thêm `chotGhiChu`; ca mới: `Ctrl+Enter` gọi action và ô trống lại sau khi lời hứa chốt, `Enter` trần **không** gọi action và **không** bị `preventDefault`, chốt lỗi thì ô giữ nguyên chữ, ô co về chiều cao sàn sau khi chốt -- không có nó thì "con trỏ vẫn ở trong ô" chỉ là lời hứa
- [x] `tools/thu-tay-ban-nhap.mjs` + `README.md` -- thêm phép đo Chromium thật: gõ chữ, chốt trong vòng `AUTOSAVE_MS`, tải lại trang và khẳng định kho `drafts` rỗng còn `notes` có đúng một bản ghi; cộng mục thử tay cho nhịp gõ-chốt-gõ-chốt không rời bàn phím -- tính nguyên tử hai kho là thứ Vitest không với tới

**Acceptance Criteria:**
- Given `npm test`, when chạy, then toàn bộ suite xanh, và `nguong-tap-trung`, `state-tap-trung`, `date-tap-trung`, `harness`, `trang-tinh`, `token-style`, `bo-cuc-bon-tang` **không bị sửa một dòng nào**
- Given giao diện sau một lần chốt thành công, when nhìn, then không một chữ hay chỉ báo nào mới xuất hiện — lưới vẫn trống vì mẩu giấy thuộc Story 2.4/2.5
- Given `app/core/state.js`, when đọc `chotGhiChu`, then nó không nhận tham số, không đọc đồng hồ ngoài `banGhiMoi`, và mọi phép đổi state đi qua đúng một `datLai` cho mỗi nhánh kết quả
- Given `app/view/o-soan.js`, when đọc, then nó chạm đúng ba thành viên của store (`state`, `datBanNhap`, `chotGhiChu`), không giữ state riêng, không số literal

## Implementation Notes

- **Ô trống vẫn đi qua bước (1).** Thứ tự bắt buộc của spec đặt phép tăng `draft.seq` TRƯỚC gác
  rỗng, nên `Ctrl+Enter` trên ô trống vẫn nhích `draft.seq` một nhịp (và hủy hẹn treo của bản
  nháp rỗng). Câu "không đổi một byte state nào" được hiện thực đúng ở chỗ nó nhắm tới:
  `dieuKien`, `notes`, `banner` và chữ trong ô đều không đổi — ca test ghim cả bốn. Ca cũ
  `expect(store.state).toBe(truoc)` (so sánh theo tham chiếu) vì thế được thay bằng bốn phép so
  sánh theo giá trị.
- **Ca `TypeError` của `themGhiChu` sống tiếp dưới dạng khác.** `chotGhiChu()` không nhận tham
  số nên không còn đối số nào để sai kiểu; ca mới ghim `chotGhiChu.length === 0` và ghim rằng
  một đối số lạc vào KHÔNG được dùng — nguồn chữ duy nhất vẫn là `state.draft.text`.
- **`themGhiChu` nội bộ đổi chữ ký:** `themGhiChu(text, seqLucChot)`, chỉ còn phần dựng-và-ghi
  (guard rỗng/trần và `xoaHetDieuKien` chuyển lên `chotGhiChu` để giữ đúng năm bước), trả về
  `Promise<boolean>` "đã chốt được chưa" để `chotGhiChu` biết lúc nào phải đặt lại hẹn tự lưu.
- `tools/cdp.mjs` có thêm `DOC_NOTES` (đọc store `notes` bằng giao dịch riêng), song sinh với
  `DOC_DRAFTS` — phép đo 22a/22b cần nhìn cả hai kho từ bên ngoài mã của app.

## Spec Change Log

## Review Triage Log

Vòng 1 — ba lớp: `blind-hunter`, `edge-case-hunter`, `verification-gap`.

| # | Phát hiện | Verdict | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Hai `Ctrl+Enter` trước khi giao dịch chốt sinh **hai ghi chú trùng nội dung, khác `id`** — không có chốt chặn nào cho lần chốt đang bay | high | **Chạy thật**: cổng treo, gọi `chotGhiChu()` hai lần rồi nhả → `commitDraft` chạy 2 lần, `state.notes.length === 2`. Giữ phím (auto-repeat) chạm được mà không cần thao tác lạ. Đúng cái hỏng AD-8 sinh ra để chặn, và bộ test cũ chỉ `await` nối tiếp nên không thấy | patch |
| 2 | Xóa sạch chữ rồi `Ctrl+Enter`: bước tăng `seq` hủy hẹn tự lưu của ô rỗng mà nhánh rỗng **không đặt lại** — đĩa giữ nguyên chữ cũ, tải lại là chữ đã xóa sống lại | high | **Chạy thật**: gõ `phở bò` (đã `putDraft`), `datBanNhap('')`, `chotGhiChu()`, đẩy đồng hồ qua `AUTOSAVE_MS*5` → không có `putDraft:""`, đĩa còn `"phở bò"`. Nhánh hỏng đã đặt lại hẹn (state.js:489), nhánh rỗng thì không — bất đối xứng không ai viết ra. Ca test hiện có không thấy vì nó không đẩy đồng hồ | patch |
| 3 | `trongGiaoDich` đổi chữ ký và **viết lại** `put`/`remove`/`replaceAll`, nhưng không phép kiểm nào — tự động hay script — chạm ba phương thức đó trên kho thật | medium | Lớp verification-gap đã chứng minh: không file test nào import `app/adapters/indexeddb.js`; `thu-tay` chỉ lái `putDraft`/`claimDraft`/`commitDraft`/`readAll`. Gõ nhầm tên kho trong `remove` vẫn xanh cả ba lệnh, và ẩn tới tận Story 5.3. (Tôi đã đọc diff: cả sáu chỗ hiện ĐÚNG — lỗ hổng là ở phép kiểm, không phải ở mã) | patch (`put`/`remove`) |
| 4 | Không chắn `isComposing`: bấm `Ctrl+Enter` giữa lúc bộ gõ tiếng Việt đang dựng âm sẽ chốt một âm tiết dở | medium | Sản phẩm là tiếng Việt trước hết. Unikey mức driver thì không sinh sự kiện composition, nhưng bộ gõ tiếng Việt sẵn có của Windows thì có. Sửa là một dòng, không thêm bề mặt nào | patch |
| 5 | `trongGiaoDich` còn JSDoc nửa vời: đổi sang `tenStores` và trao cả `giaoDich`, nhưng chỉ thêm một `@param` | low | Đúng như mô tả; sửa là một phép chép đúng, không thêm phức tạp | patch |
| 6 | `const kho = …` trong `commitDraft` là danh sách **tên kho**, trong khi `kho` ở khắp file là handle của database | low | `moKho()` và `(kho) => …` dùng đúng tên đó cho thứ khác. Đổi tên là sửa trực tiếp | patch |
| 7 | Hai mốc chờ `900` và `AUTOSAVE_MS + 600` trong bộ đo không có lời giải thích, khác lệ của file | low | Thật; thêm chú thích là sửa trực tiếp | patch |
| 8 | `xoaHetDieuKien()` chạy TRƯỚC phép ghi, nên một lần chốt **hỏng** vẫn xóa mất bộ lọc đang bật dù không có gì được lưu | low | Thật về lâu dài, nhưng epic này **không có cách nào** đặt điều kiện — không chạm tới được cho tới Epic 6. Bản sửa phải cất giữ rồi hoàn nguyên `dieuKien`, tức thêm nhánh và trạng thái, trong khi thứ tự năm bước nằm trong khối đóng băng | defer |
| 9 | `tabCuaMinh` chuyển từ `null` sang có giá trị trong lúc giao dịch đang bay: bản ghi `drafts` giành được sau đó giữ lại chữ vừa chốt | low | Thật nhưng rất hẹp (phải chốt đúng trước khi `claimDraft` trả lời). Dòng "Chưa giành được bản nháp" của I/O Matrix đã **đóng băng** cách xử lý này, nên sửa là đụng khối đóng băng | defer |
| 10 | `Ctrl+Enter` trong lúc `khoiDong()` còn đang đọc: `datLai({ notes })` của nó đè mất mẩu vừa chốt | low | Thật, nhưng là hành vi sẵn có của `khoiDong` từ Story 1.6, không do thay đổi này gây ra, và `themGhiChu` cũ cũng vậy | defer |
| 11 | `replaceAll` cũng bị viết lại mà không phép kiểm nào chạm | low | Cùng gốc với #3 nhưng **chưa có chỗ gọi nào** trong repo — nó là việc của Epic 4 | defer |
| 12 | Chữ chốt xuống không `trim()`, dù phép gác rỗng dùng `trim()` | false | Cắt chữ người dùng vừa gõ là thứ AD-14 **cấm tuyệt đối** ("không cắt im lặng"); giữ nguyên trạng là hành vi đúng, không phải thiếu sót | bác bỏ |
| 13 | `commitDraft` nên ném `TypeError` khi `draft` là `undefined` thay vì để nó thành dải băng `DB` | false | `undefined` chỉ tới được từ một chỗ gọi sai trong chính lõi — trạng thái chỉ lập trình viên dựng ra. Sập ồn ào ở đó là hành vi đúng theo tiền lệ đã chốt ở vòng review 2.2 (mục 11) | bác bỏ |
| 14 | Không có đường chốt trên macOS (`Cmd+Enter` không được nhận) | false | Ý định nói nguyên văn `Ctrl+Enter`, và sản phẩm là desktop Windows một người dùng. Thêm `metaKey` là nới ý định, không phải sửa lỗi | bác bỏ |
| 15 | Quá trần ký tự: `seq` bị tăng làm mất hẹn tự lưu mà không đặt lại | false | `datBanNhap` **không hẹn gì cả** cho chữ quá trần (state.js:600-603), nên không có hẹn nào để mất | bác bỏ |
| 16 | AC "đúng một `datLai` cho mỗi nhánh" bị vi phạm: bước tăng `seq` là một `datLai` riêng | false | Thứ tự năm bước nằm trong khối đóng băng và nó **buộc** phải vậy; bản sửa duy nhất là sửa spec của chính vòng build này | bác bỏ |
| 17 | Sáu chỗ gọi lặp lại `giaoDich.objectStore(...)`; nên có helper một-kho | false | Không nêu được tác hại cụ thể nào — không chỗ gọi nào sẽ lệch, không luật nào vỡ. Một lớp bọc thêm để tiết kiệm sáu dòng là thêm gián tiếp, không phải bớt | bác bỏ |
| 18 | `DOC_NOTES` trùng `DOC_DRAFTS` gần như từng chữ | false | Bộ đo cố ý viết thẳng: nó tồn tại để **lệch ồn ào** khi thứ nó đo đổi. Gộp lại là đúng loại trừu tượng mà vòng review 2.1 (mục 1) đã bác | bác bỏ |
| 19 | Chú thích `index.html` chỉ nói ca thành công, bỏ ca chốt hỏng | false | Chú thích đó nói về **microcopy ghim**; dải băng lúc hỏng thuộc Story 3.1 và nói trước ở đây là hứa một thứ chưa tồn tại | bác bỏ |
| 20 | README mục 22 quảng cáo là chạy máy được nhưng nhịp "gõ-chốt-gõ-chốt" vẫn là việc tay | false | Đọc README L192-198: mục 22 mô tả đúng phép thử tay của nó, không nơi nào nói cả mục đã cơ giới hóa | bác bỏ |

**Kết quả vá (vòng 1).** Bảy mục tuyến `patch` đã sửa và được thẩm định LẠI bằng phép chứng minh độc lập, không dùng test của agent hiện thực: hai `Ctrl+Enter` chồng nhau giờ cho đúng một `commitDraft` và một mẩu (và lần chốt kế tiếp vẫn chạy — chốt chặn có nhả); xóa sạch chữ rồi `Ctrl+Enter` giờ đưa bản nháp rỗng xuống kho, chữ cũ không sống lại. Bốn mục `defer` đã ghi vào `deferred-work.md`. Verification đầy đủ: `npm test` 348/348, `thu-bo-cuc` 23/23, `thu-tay` 18/18 (thêm 23a/23b đóng lỗ hổng `put`/`remove`). Bảy file ghim bất biến và `app/style.css` không bị chạm một dòng nào.

## Design Notes

Hủy hẹn tự lưu **là** phép tăng `draft.seq` — `henGhiBanNhapDiSau` đã gác `noiBo.draft.seq !== seqCuaHen` (state.js:525), nên một `seq` mới làm mọi hẹn treo tự rụng. Đó là lý do bước này phải đi trước cả phép gác rỗng: một `Ctrl+Enter` xảy ra **giữa** hai phím gõ và một hẹn cũ nổ sau lúc chốt sẽ ghi lại đúng chữ vừa biến thành ghi chú.

Trên đường thành công, `notes` và `draft` phải đổi trong **một** `datLai` (không phải hai), vì `ghiTruocDatSau` trộn kết quả với `banner: null` đúng một lần:

```js
() => ({
  notes: sapGiamDan([banGhi, ...noiBo.notes]),
  draft: { text: '', seq: noiBo.draft.seq },
})
```

Đọc `noiBo.draft.seq` **tại lúc ghi xong** chứ không dùng biến bắt được lúc bắt đầu: Nam có thể đã gõ tiếp trong lúc đĩa còn quay, và lúc đó chữ mới phải thắng — cùng chiều với phép so sánh của `khoiDongBanNhap` (state.js:563-566). Nếu `seq` đã nhảy, ô **không** được làm trống; hãy để phép so sánh của `dongBoTuState` (nó chỉ gán khi lệch) lo phần hiển thị.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ suite xanh; diff trong `test/` chỉ chạm `core-state.test.js` và `o-soan.test.js` (nới đúng một cửa chặn phạm vi story)
- `npm run thu-bo-cuc` -- expected: mọi phép đo layout của 2.1/2.2 vẫn đạt, không lệch
- `npm run thu-tay` -- expected: các phép đo bản nháp cũ vẫn đạt, cộng phép đo nguyên tử mới của `commitDraft`

**Manual checks (if no CLI):**
- Mở trang qua HTTP server, gõ `phở`, bấm `Ctrl+Enter`: ô trống lại ngay, con trỏ còn nháy trong ô, không một chữ nào hiện ra
- Gõ ba dòng bằng `Enter`: xuống dòng bình thường, ô cao thêm, không có gì bị chốt
- Bấm `Ctrl+Enter` trên ô trống: tuyệt đối không có gì xảy ra
- Gõ chữ rồi bấm `Ctrl+Enter` thật nhanh, tải lại trang: ô trống (bản nháp không hồi sinh), và DevTools → IndexedDB → `ghichu` có một bản ghi `notes`, `drafts` rỗng
