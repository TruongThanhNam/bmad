---
title: 'Story 5.2: Ghi chú rỗng tự biến mất'
type: 'feature'
created: '2026-09-18'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '2c95fd176864809a946c8052ead9a70525dc95a4'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Trong chế độ sửa tại chỗ (Story 5.1), xóa sạch chữ của một mẩu rồi rời mẩu chỉ lưu
lại một ghi chú rỗng vĩnh viễn trên lưới — không có cách nào dọn nó ngoài việc chờ Story 5.3 (xóa
qua xác nhận), vốn chưa tồn tại.

**Approach:** Khi `roiCheDoSua()` chạy mà chữ đang sửa của mẩu đó rỗng, gọi thẳng `xoaGhiChu(id)`
đã có sẵn thay vì `datLai` bình thường — xóa không hỏi gì, không qua hộp thoại xác nhận (ngoại lệ
đã chốt ở epic). Quyết định nằm trong `core/state.js`, đúng nguyên tắc action quyết định, view chỉ
phát sự kiện.

## Boundaries & Constraints

**Always:**
- Kiểm tra rỗng dùng `noiBo.editing.text` của đúng `id` đang rời — đây là chữ đang gõ mới nhất,
  đồng bộ theo từng phím qua `tuLuuNoiDung`, không đọc `notes` (có thể chưa `put` xong).
- Rỗng nghĩa là `noiBo.editing.text.trim() === ''` — chuỗi chỉ toàn khoảng trắng cũng bị xóa
  **(Nam chốt)**: khớp cảm nhận người dùng về "rỗng", đánh đổi việc một ghi chú cố ý chỉ chứa
  khoảng trắng cũng biến mất.
- Hủy hẹn tự lưu đang treo của mẩu đó **trước khi** xóa: gọi `xoaGhiChu(id)` đã tự làm việc này
  (nó xóa `chuDangCho.get(id)` và `seq[id]`, nên hẹn `henGhiDiSau` cũ nổ ra sẽ lệch `seq` và bị bỏ,
  đúng kỷ luật `seq` đã ghim — không dùng `clearTimeout`).
- `roiCheDoSua()` trả về một `Promise` (giống `tuLuuNoiDung`) để `app/main.js` có thể đợi việc xóa
  (nếu có) xong trước khi vẽ lại và trả tiêu điểm — nếu không, lưới vẽ lại bằng dữ liệu cũ.
- Ghi hỏng khi xóa (`ports.noteStore.remove` từ chối) đi theo đúng luồng `ghiTruocDatSau` hiện có
  của `xoaGhiChu`: state giữ nguyên, mẩu rỗng vẫn còn trên lưới, dải băng lên theo mã lỗi sẵn có
  (`QUOTA`/`DB`) — không thêm mã lỗi thứ bảy.
- Nếu chữ không rỗng, `roiCheDoSua()` giữ nguyên hành vi cũ của Story 5.1 (thoát chế độ sửa, thu
  gọn `expandedIds`), chỉ khác ở việc bọc kết quả thành `Promise.resolve()` để chữ ký nhất quán.
- `app/main.js` — `roiSuaRoiVe` phải chain trên promise trả về của `roiCheDoSua()` rồi mới
  `setTimeout(veGiuTieuDiem)`, theo đúng khuôn `mocSua.go` đã dùng cho `tuLuuNoiDung`.

**Never:**
- Không hộp thoại xác nhận, không banner "đã xóa" — im lặng tuyệt đối khi thành công, đúng quy tắc
  epic.
- Không đụng tới `xoaGhiChu`, `ports.noteStore.remove`, hay bất kỳ action xóa nào khác — dùng lại
  nguyên vẹn.
- Không thêm hằng số mới vào `core/limits.js`; phép so sánh rỗng dùng `''`/`.length === 0`, không
  phải một ngưỡng số.
- Không đụng tới hành vi ở `tuLuuNoiDung`/autosave khi đang gõ — rỗng chỉ kích hoạt xóa lúc **rời**
  chế độ sửa, không phải lúc gõ tới ký tự rỗng cuối cùng.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Xóa sạch chữ rồi rời mẩu (click ra ngoài / `Tab`) | `editing.id = X`, `editing.text = ''` | Mẩu biến khỏi lưới ngay, không hỏi gì; `notes` không còn `X`; `expandedIds`/`seq[X]` dọn sạch | N/A |
| Chữ chỉ toàn khoảng trắng rồi rời mẩu | `editing.text = '   '` | Xử lý y hệt chuỗi rỗng — mẩu biến mất, không hỏi gì (`trim()` rỗng) | N/A |
| Xóa sạch chữ nhưng lệnh xóa thất bại | `ports.noteStore.remove` từ chối `QUOTA`/`DB` | Mẩu **vẫn còn** trên lưới, vẫn rỗng, `editing.id` về `null` như bình thường; dải băng theo mã lỗi hiện ra | qua `maBanner` |
| Rời mẩu còn chữ (không rỗng) | `editing.text = 'a'` | Hành vi y hệt Story 5.1: thoát sửa, thu gọn, không xóa gì | N/A |
| Gõ tới rỗng nhưng CHƯA rời mẩu (còn `editing.id = X`) | `editing.text = ''`, focus vẫn ở ô sửa | Không xóa gì — autosave vẫn chạy bình thường (ghi chuỗi rỗng nếu hẹn nổ), chỉ xóa khi rời | N/A |
| Rời mẩu rỗng rồi mở lại đúng mẩu đó trong `AUTOSAVE_MS` | mẩu đã bị xóa, hẹn cũ (nếu có) sắp nổ | Hẹn cũ bị bỏ do `seq` lệch (đã dọn khi xóa); không có gì để mở lại | N/A |

</frozen-after-approval>

## Code Map

- `app/core/state.js:1205-1212` (`roiCheDoSua`) -- điểm móc chính. Đọc `noiBo.editing.text` của
  `dangSua` trước khi `datLai`; nếu `.trim() === ''`, gọi `return xoaGhiChu(dangSua)` thay cho
  `datLai` thường; nếu không, giữ `datLai` cũ nhưng bọc `return Promise.resolve()`.
- `app/core/state.js:1080-1105` (`xoaGhiChu`) -- dùng lại nguyên vẹn, không sửa. Đã tự dọn
  `chuDangCho`, `seq[id]`, `notes`, `expandedIds` qua `ghiTruocDatSau`.
- `app/core/state.js:334-338` (JSDoc chữ ký `roiCheDoSua`) -- cập nhật kiểu trả về từ `void` sang
  `Promise<void>`.
- `app/main.js:139-143` (`roiSuaRoiVe`) -- đổi `store.roiCheDoSua(); setTimeout(veGiuTieuDiem);`
  thành `store.roiCheDoSua().then(() => setTimeout(veGiuTieuDiem));`, theo khuôn `mocSua.go`
  (`main.js:160`: `store.tuLuuNoiDung(id, text).then(veTatCa)`).
- `test/core-state.test.js` -- describe block `roiCheDoSua` (khoảng dòng 1293) và block `xoaGhiChu`
  (khoảng dòng 970): thêm ca "rời mẩu với chữ rỗng thì gọi xóa", ca "rời mẩu còn chữ thì không
  xóa", ca "xóa thất bại thì mẩu và state giữ nguyên", ca "seq/hẹn cũ bị bỏ sau khi xóa". Kiểm
  dòng 1147/1222 gọi `store.roiCheDoSua()` trong test khác không giả định giá trị trả về đồng bộ.
- `test/main.test.js` hoặc file test nối tương ứng (nếu có) -- ca `roiSuaRoiVe` đợi promise trước
  khi `veGiuTieuDiem` chạy, nếu file test nối main tồn tại; nếu không có test nối `main.js` theo
  luật hiện hành (`AGENTS.md`: `adapters` không test tự động), bỏ qua và kiểm bằng
  `npm run thu-bo-cuc`/`npm run thu-tay`.
- **Không đổi:** `app/ports/note-store.js`, `app/adapters/`, `core/time.js`, `core/fold.js`,
  `core/errors.js`, `core/banner.js`, `core/limits.js`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/state.js` -- `roiCheDoSua()` kiểm `noiBo.editing.text` của mẩu đang rời; rỗng thì
      `return xoaGhiChu(dangSua)`, không thì giữ `datLai` cũ và trả `Promise.resolve()` -- điểm
      duy nhất quyết định "rỗng thì xóa", đúng nguyên tắc action quyết định trong core.
- [x] `app/core/state.js` -- cập nhật JSDoc chữ ký `roiCheDoSua` sang `Promise<void>`.
- [x] `app/main.js` -- `roiSuaRoiVe` chain `.then()` trên `store.roiCheDoSua()` trước khi
      `setTimeout(veGiuTieuDiem)` -- nếu không, lưới có thể vẽ lại trước khi lệnh xóa (bất đồng bộ)
      xong, hiện mẩu rỗng đã bị xóa trong state trong một khắc rồi mới biến mất, hoặc vẽ lại bằng
      dữ liệu cũ nếu port trả lời chậm.
- [x] `test/core-state.test.js` -- ca cho bốn hàng trong I/O Matrix: rời mẩu rỗng thì xóa, rời mẩu
      còn chữ thì không xóa, xóa thất bại thì giữ nguyên state và mẩu, hẹn cũ bị bỏ sau khi xóa.
- [x] `README.md` -- nối thêm một mục checklist thủ công (tiếp số sau mục cuối của Story 5.1) cho
      kịch bản "xóa sạch chữ rồi click ra ngoài — mẩu biến mất không hỏi gì".
- [x] `app/core/limits.js` -- bump `APP_VERSION` -- luật deploy.

**Acceptance Criteria:**
- Given một mẩu đang ở chế độ sửa với chữ đã bị xóa sạch (`editing.text === ''`), when focus rời
  mẩu (click ra ngoài hoặc `Tab`), then mẩu biến khỏi lưới ngay, không hộp thoại, không dải băng
  thành công, và bản ghi biến mất khỏi kho.
- Given lệnh xóa đó thất bại ở tầng lưu trữ, when phép ghi bị từ chối, then mẩu (vẫn rỗng) còn
  nguyên trên lưới, `editing.id` về `null` như luồng rời sửa bình thường, và dải băng lỗi hiện ra.
- Given một mẩu đang ở chế độ sửa với chữ khác rỗng, when focus rời mẩu, then hành vi giữ nguyên
  như Story 5.1 — không xóa gì.

## Implementation Notes

`roiCheDoSua()` luôn chạy `datLai` (điều id/thu gọn) trước, rồi mới gọi thêm `xoaGhiChu(dangSua)`
khi rỗng — khác chữ dùng "thay cho" ở Code Map ban đầu ("in addition to", không phải "instead
of"), vì AC đòi `editing.id` về `null` "như bình thường" ngay cả khi lệnh xóa thất bại, và
`xoaGhiChu` một mình không đụng `editing.id`.

**Đo thật:** `npm test` 736/736 xanh (5 ca cho `roiCheDoSua` phối hợp `xoaGhiChu` + 1 ca "gõ tới
rỗng nhưng chưa rời mẩu" thêm ở vòng review để phủ đủ sáu hàng I/O Matrix).

## Spec Change Log

## Review Triage Log

**Vòng 1** — ba lớp: `blind-hunter` (6 phát hiện), `edge-case-hunter` (0), `verification-gap` (0).

| # | Phát hiện | Phán quyết | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | README mục 30 (checklist thủ công mới) không có bước cho ca lệnh xóa thất bại (`QUOTA`/`DB`), dù mục 5 đã có tiền lệ ép hết dung lượng qua DevTools cho đúng lớp lỗi này | `low` | Đọc `README.md` mục 5 (đã có bước ép `QUOTA` qua DevTools Storage) và mục 30 mới (chỉ có ca rỗng/khoảng trắng/còn chữ) — thiếu ca thất bại dù có tiền lệ và có test tự động phủ đúng ca đó | **patch** |
| 2 | `editing.id` về `null` ĐỒNG BỘ trước khi `xoaGhiChu` xong; nếu xóa thất bại và autosave chưa kịp `put` chữ rỗng, mẩu hiện lại CHỮ CŨ (chưa xóa) thay vì "vẫn rỗng" như matrix mô tả | `low` | Đọc `notes` chỉ đổi khi `henGhiDiSau`'s `put` chốt (state.js:1154-1158); nếu người dùng rời mẩu ngay sau khi xóa sạch (trước `AUTOSAVE_MS`), `notes[id].text` còn nguyên chữ cũ. Vô hại: không mất chữ, mẩu chỉ hiện lại đúng bản đã lưu gần nhất — an toàn hơn hiện rỗng giả. Sửa đòi đổi câu chữ matrix, không đổi mã | bác bỏ |
| 3 | Click sang mẩu B trong lúc lệnh xóa mẩu A (do rời mẩu rỗng) còn đang treo có thể làm state xung đột | `false` | `roiCheDoSua()` đặt `editing.id = null` ĐỒNG BỘ trước khi `await`; `vaoCheDoSua('b')` chạy sau đó đặt `editing.id = 'b'` ngay. Khi `xoaGhiChu` của A chốt muộn, closure của nó đọc `noiBo.editing` TẠI THỜI ĐIỂM CHỐT (tham chiếu trực tiếp `noiBo`, không phải bản chụp cũ), nên nó giữ đúng `editing.id = 'b'` hiện hành, không đè lại | bác bỏ |
| 4 | Chuỗi chỉ toàn ký tự vô hình (zero-width space, soft hyphen) không bị `trim()` coi là rỗng, nên không tự xóa dù mắt thường thấy trống | `low` | Đúng theo ngữ nghĩa `String.prototype.trim()`, nhưng không gõ được bằng bàn phím thường — chỉ tới qua dán nội dung lạ, hiếm gặp trong thực tế; sửa đòi thêm logic chuẩn hóa Unicode, không phải sửa nhỏ | bác bỏ (low + không gặp trong dùng thường + sửa không nhỏ) |
| 5 | Không có ca test riêng cho việc `expandedIds`/`chuDangCho` được dọn khi mẩu bị tự xóa qua đường rời-sửa-rỗng (mới), dù `xoaGhiChu` gốc đã có test | `low` | `xoaGhiChu` được dùng lại NGUYÊN VẸN, không sửa; các ca dọn bookkeeping của nó đã được kiểm ở bộ test riêng của `xoaGhiChu`. Thêm ca trùng lặp qua đường `roiCheDoSua` không chứng minh gì mới | bác bỏ |
| 6 | `main.js` không có `.catch` phòng trường hợp `roiCheDoSua()`/`xoaGhiChu` sau này đổi hợp đồng và từ chối | `false` | JSDoc của `xoaGhiChu` và `roiCheDoSua` cam kết rõ "KHÔNG bao giờ bị từ chối" — code chạy đúng một tình huống chưa từng xảy ra không phải lỗi | bác bỏ |

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh, cộng các ca mới cho `roiCheDoSua`/`xoaGhiChu` phối hợp.
- `npm run thu-bo-cuc` -- expected: không vỡ phép đo lưới/focus hiện có; nếu thêm phép đo mới cho
  kịch bản "xóa sạch chữ rồi rời mẩu", mẩu phải biến mất khỏi DOM đúng lúc.
- `npm run thu-tay` -- expected: mục checklist mới (xóa sạch chữ rồi rời mẩu) chạy được bằng tay.

**Manual checks (if no CLI):**
- Phục vụ qua HTTP localhost. Mở một mẩu, xóa sạch chữ, click ra ngoài — mẩu phải biến mất ngay,
  không nhấp nháy, không dải băng.
