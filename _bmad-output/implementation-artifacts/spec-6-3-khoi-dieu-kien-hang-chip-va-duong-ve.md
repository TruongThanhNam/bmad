---
title: 'Story 6.3: Khối điều kiện, hàng chip, và đường về'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
baseline_commit: 'ae7fb8dfe669f9427acbad5b4533d4290d1d1568'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Lõi đã có khối điều kiện `{ keyword, date }`, phép giao và "hôm nay là vắng mặt điều
kiện" (`core/query.js`), nhưng khi đang lọc, Nam không thấy mình lọc theo gì, và không có đường về
hôm nay trong một thao tác. Ô soạn cũng không báo trước rằng gõ vào sẽ bỏ bộ lọc.

**Approach:** Thêm tầng 2b: một view mới `hang-chip.js` vẽ một chip cho mỗi điều kiện, số kết quả
và nút `về hôm nay` (gọi `xoaHetDieuKien()`). `o-soan.js` được thêm `ve()` để đổi placeholder khi
có điều kiện. Cả hai nối vào `veTatCa` trong `main.js`.

## Boundaries & Constraints

**Always:**
- Hàng chip chỉ có mặt khi `keyword !== null || date !== null`. Thứ tự trong hàng: chip từ khóa
  (chữ đúng như đã gõ), chip ngày (`dd/MM/yyyy` monospace, qua `chuoiNhapTuNgay`), rồi `N ghi chú`,
  rồi `về hôm nay` bị đẩy sang phải. Chip là `<span>`: không bấm được, không nằm trong thứ tự Tab.
- Số kết quả là độ dài đầy đủ mà `locGhiChu` trả về, chưa cắt trần. Story 6.4 sẽ đổi chỗ này sang
  `total`. Hàng chip tự gọi `locGhiChu`, không nhận số đếm từ lưới.
- `về hôm nay` là `<button>` mang dáng link, giống tiền lệ `.chan-link`. Click nó thì gọi
  `xoaHetDieuKien()`, `khayTim.xoaNhap()`, vẽ lại toàn bộ, và trả tiêu điểm về `#o-soan` vì nút
  vừa biến mất. Trong thứ tự Tab, nó đứng sau nút lịch và trước mẩu giấy đầu tiên.
- Khi có điều kiện, placeholder của `#o-soan` là `gõ vào đây sẽ bỏ mọi điều kiện lọc`; khi không
  có điều kiện thì gỡ hẳn thuộc tính. `index.html` giữ nguyên, không có `placeholder`.
- Có điều kiện mà 0 khớp: chip ghi `0 ghi chú`, lưới hiện `Không có ghi chú nào khớp.` (đã có),
  và nút `về hôm nay` vẫn còn.
- Màu và khoảng cách chỉ lấy từ token (`condition-chip` của DESIGN.md). Không `aria-live`, không
  `transition`/`:hover`. Mọi cặp chữ/nền mới phải đạt ≥ 4.5:1 ở cả hai theme.
- **Quyết định (người):** gõ vào ô soạn KHÔNG xóa điều kiện. Điều kiện chỉ bị xóa khi `chotGhiChu`
  chốt thật (Story 2.3, spine AD-15); lõi giữ nguyên. Dòng "gõ vào ô soạn thảo" trong bảng sáu dòng
  được hiểu là "chốt từ ô soạn thảo". README mục 34 ghi rõ cách hiểu này.

**Never:**
- Không đổi hình dạng state, `datDieuKien`, `xoaHetDieuKien` hay `query.js`; không `{items,total}`,
  không dòng "còn nhiều hơn" (6.4).
- Không ghi điều kiện xuống kho bền. Tải lại trang thì về `{null, null}`, đúng như hiện nay.
- Không để view giữ bản sao điều kiện. Không phím tắt tới hàng chip hay ô tìm.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Mặc định | `{null,null}` | không hàng chip; ô soạn không placeholder; lưới = hôm nay | N/A |
| Chỉ từ khóa | `keyword='phan quyen'`, 4 khớp | chip `phan quyen` · `4 ghi chú` · `về hôm nay` | N/A |
| Cả hai | thêm `date='2026-09-03'`, 1 khớp | chip `phan quyen` · chip `03/09/2026` · `1 ghi chú`; lưới = giao | N/A |
| Không khớp | có điều kiện, 0 khớp | `0 ghi chú` + dòng không khớp + nút còn | N/A |
| Về hôm nay | click / Enter trên nút | `{null,null}`; ô tìm và ô ngày rỗng, lỗi ngày tắt; hàng chip biến mất; tiêu điểm ở `#o-soan` | N/A |
| Gõ ô tìm | đang lọc ngày | `date` giữ nguyên | N/A |
| Tải lại | có điều kiện | về `{null,null}` | N/A |

</frozen-after-approval>

## Code Map

- `app/core/query.js:33` -- `locGhiChu(notes, dieuKien, moc)`: dùng lại cho số đếm, KHÔNG sửa.
- `app/core/state.js:527` -- `xoaHetDieuKien()`: action của nút; `:1091` `chotGhiChu`, không sửa.
- `app/core/time.js` -- `chuoiNhapTuNgay`, `nowIso`: dùng cho chip ngày và mốc hiện tại.
- `app/view/luoi.js:38-42,151` -- dòng không khớp đã có; theo khuôn `noiLuoi(store, goc, mocHienTai)`.
- `app/view/khay-tim.js:155` -- `xoaNhap()`: gọi sau `xoaHetDieuKien()` ở nút về hôm nay.
- `app/view/o-soan.js:36,130` -- thêm `ve()` vào object trả về; bản rỗng (`:40`) cũng phải có `ve`.
- `app/main.js:341-353,378-382` -- nối `noiHangChip(store, document, undefined, veHomNay)`; thêm
  `hangChip.ve`, `oSoan.ve` vào `veTatCa` (oSoan khai sau, nên gọi qua `oSoan?.ve()` hoặc dời khai
  báo); `veHomNay` = xóa → `xoaNhap` → `veTatCa` → focus `ID_O_SOAN`.
- `index.html:132-133` -- thêm `<div class="hang-chip" hidden></div>` ngay sau `#o-ngay-loi`, trong
  `.tang-khay .container`.
- `app/style.css` (sau khối `.o-ngay-loi-chu`) -- `.hang-chip` flex/wrap/gap, `.chip`, `.chip-ngay`
  (mono), `.hang-chip-dem` (`--ink-2` trên `--bg`), `.ve-hom-nay` (`margin-inline-start:auto`, gạch chân).
- Test/tool phải nâng: `test/theme.test.js:118-137` (`NEN_CUA` cho `.chip`, `.hang-chip-dem`,
  `.ve-hom-nay`), `test/focus-va-tab.test.js`, `test/bo-cuc-bon-tang.test.js:135-145`,
  `test/o-soan.test.js:595` (placeholder tĩnh vẫn trống: giữ), `tools/thu-bo-cuc.mjs:1565` (`THU_TU`).
- `README.md` -- checklist mục **34**. `app/core/limits.js:82` -- `APP_VERSION` `0.6.1` → `0.7.0`.

## Tasks & Acceptance

**Execution:**
- [x] `index.html` + `app/style.css` -- chỗ gắn 2b + class bằng token.
- [x] `app/view/hang-chip.js` + `test/hang-chip.test.js` -- view mới; mỗi hàng I/O Matrix một ca,
  kể cả chip không có handler/tabindex.
- [x] `app/view/o-soan.js` + `test/o-soan.test.js` -- `ve()` đặt/gỡ placeholder.
- [x] `app/main.js` + `test/luoi.test.js` (nơi đang ghim cách nối) -- nối view, `veHomNay`.
- [x] Test/tool ở Code Map -- tương phản, thứ tự Tab, bố cục.
- [x] `README.md` mục 34; `app/core/limits.js` bump.

**Acceptance Criteria:**
- Given Tab từ nút lịch khi có điều kiện, when nhấn Tab, then tiêu điểm tới `về hôm nay` rồi mới tới mẩu đầu.
- Given hàng chip ở cả hai theme, when đo, then mọi chữ đạt ≥ 4.5:1.
- Given `test/state-tap-trung.test.js` và bộ quét token, when chạy, then xanh (view không tự đổi state).

### Review Findings

- [x] [Review][Patch] `test/bo-cuc-bon-tang.test.js` chưa ghim `.hang-chip` trong `.tang-khay .container` như Code Map yêu cầu [test/bo-cuc-bon-tang.test.js:134]
- [x] [Review][Defer] Nối `veHomNay`/`veTatCa`/placeholder trong `main.js` chỉ được ghim bằng regex mã nguồn; lượt chạy thật chỉ có ở `tools/thu-bo-cuc.mjs` (ngoài `npm test`) [app/main.js:346] — deferred: đúng luật repo (main.js kiểm bằng CDP + checklist); chạy `npm run thu-bo-cuc` trước khi deploy 0.7.0
- [x] [Review][Defer] AGENTS.md còn ghi checklist "1–32" trong khi README đã có mục 33–34 [AGENTS.md] — deferred: sửa file agent-context, làm qua `bmad-project-context`

**Rejected:**
- `false` — khoảng trắng-only keyword làm chip "vô hình": chip giữ `pre-wrap` + padding, hiện đúng chữ đã gõ theo thiết kế.
- `false` — `#o-soan` bị disabled khi `readOnly`: `o-soan.js` không đặt `disabled`, focus vẫn vào được.
- `low` — mất tiêu điểm khi hàng chip vẽ lại lúc đang đứng trên `về hôm nay`: chỉ xảy ra khi có lượt vẽ bất đồng bộ đúng lúc đó; sửa cần giữ lại node nút.
- `low` — TDZ của `oSoan` trong `veTatCa`: không có đường gọi đồng bộ nào, comment đã ghi rõ.
- `low` — hàng chip lọc trùng với lưới: đã ghi chú, Story 6.4 đổi sang `total`.
- `low` — test placeholder nằm ở `hang-chip.test.js` thay vì `o-soan.test.js`: đã chấp nhận ở triage #12.
- `low` — thiếu role/aria-label cho hàng chip, padding tính bằng calc trên token, dark theme chỉ kiểm bằng mắt: ngoài phạm vi spec / nằm trong checklist tay.
- reject (sửa spec) — placeholder mâu thuẫn EXPERIENCE.md.

**Review lần 2 (2026-09-24, kèm bản vá bố cục):** không có phát hiện mới cần sửa. Các lượt trùng lần 1 giữ nguyên phán quyết. Mới và bị loại: `false` — stub của `noiKhayTim` thiếu `xoaNhap` (cả hai nhánh sớm đều trả `xoaNhap() {}`); `low` — `blur` tổng hợp trong `tools/thu-bo-cuc.mjs`, regex chỗ gắn trùng ở hai file test, test "chip không focus được" chỉ soi `setAttribute`, `APP_VERSION` thiếu ghi chú đối chiếu story.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|---|---|---|---|---|
| 1 | blind, edge | `oSoan.ve()` trong `veTatCa` trước khai báo → TDZ | false | Mọi lời gọi `veTatCa` chạy trong `.then` hoặc bộ nghe sự kiện, sau khi khối chạy xong | reject |
| 2 | blind, edge | Nút `về hôm nay` dựng lại mỗi lượt vẽ, mất tiêu điểm nếu vẽ khi đang đứng trên nút | low | Chỉ khi một lượt vẽ bất đồng bộ trùng đúng lúc tiêu điểm ở nút; hiếm, sửa cần thêm nhánh | reject |
| 3 | blind, verification-gap | Đường `về hôm nay` thật chưa kiểm ô ngày gõ dở / lỗi ngày | medium | `thu-bo-cuc` chỉ đặt điều kiện qua `#o-tim`; không test nào chạy `veHomNay` với ô ngày | patch |
| 4 | blind | Regex ghim `veHomNay` gãy khi thân có `{}` | low | Chỉ làm test gãy ồn ào, không sai sản phẩm | reject |
| 5 | blind | Placeholder hứa "gõ sẽ bỏ" trái hành vi | low | Quyết định của người trong khối frozen, README mục 34 ghi rõ | reject |
| 6 | blind | Số chip lệch với lưới khi vượt trần | false | Lưới chưa cắt trần ở 6.3; cả hai cùng dùng toàn bộ `locGhiChu` | reject |
| 7 | blind | Hàng chip không đọc cho trình đọc màn hình | false | Cấm `aria-live` là ràng buộc của epic | reject |
| 8 | blind | Khối `thu-bo-cuc` không dọn điều kiện khi hỏng | low | Tool đã báo đỏ; khối sau chạy lệch chỉ khi đã đỏ | reject |
| 9 | blind | Thiếu ca chỉ-có-ngày | low | Sửa trực tiếp, một ca test | patch |
| 10 | blind | `.chip-ngay` không có mục `NEN_CUA` riêng | maybe-false | Phần tử mang cả `chip`; cần xem bộ đo khớp theo class — chỉ là low nếu thật | reject |
| 11 | edge | Từ khóa toàn khoảng trắng hiện chip trông rỗng | low | Cố ý: chuỗi gõ sao so vậy (6.1); `pre-wrap` giữ khoảng trắng | reject |
| 12 | edge | Test `o-soan.ve` nằm ở `hang-chip.test.js`, không ở `o-soan.test.js` | low | Độ phủ có và chạy; chỉ khác chỗ đặt | reject |

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh.
- `npm run thu-bo-cuc` -- expected: thứ tự Tab mới + đo màu xanh.

**Manual checks (if no CLI):**
- HTTP localhost, mục 34 ở cả hai theme: UJ-2 bước 4–8, và đường hỏng `0 ghi chú`.
