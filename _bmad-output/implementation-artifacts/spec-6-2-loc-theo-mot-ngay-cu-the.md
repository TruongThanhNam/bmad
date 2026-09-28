---
title: 'Story 6.2: Lọc theo một ngày cụ thể'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
baseline_commit: '380bf8813d7334afdc431c1cb01fb51e4043e6e6'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ô ngày `#o-ngay` và icon lịch (`index.html:109-122`) đã có hình nhưng không ai nghe;
lõi đã sẵn `datDieuKien({ date })` giữ giá trị cũ khi chuỗi sai (`app/core/state.js:325`) và
`locGhiChu` đã lọc đúng ngày khi `date !== null` (Story 6.1). Nam chưa có cách hỏi "ghi chú hôm
thứ Ba tuần trước".

**Approach:** Thêm vào `app/view/khay-tim.js` phần nghe `#o-ngay`: gõ tay `dd/MM/yyyy` hợp lệ →
chuyển sang `yyyy-MM-dd` qua `core/time.js` rồi phát `datDieuKien({ date })`; chưa hợp lệ →
không phát gì, hiện lỗi tại chỗ (viền `--danger` + chữ dưới ô). Icon lịch thành một nút mở
picker chọn đúng một ngày, chọn xong điền vào ô và phát như gõ tay.

## Boundaries & Constraints

**Always:**
- Đổi `dd/MM/yyyy` ↔ `yyyy-MM-dd` bằng hai hàm mới trong `core/time.js`; hàm đọc trả `null` cho
  chuỗi sai dạng HOẶC ngày không có thật (`31/02/2026`), dùng lại `ngayCoThat`.
- Lọc là so chuỗi `localDate` (đã có ở `locGhiChu`); không dựng `Date` ngoài `time.js`.
- Ô rỗng → `datDieuKien({ date: null })`, lỗi tắt. Chuỗi hợp lệ → phát, lỗi tắt. Chuỗi chưa hợp
  lệ → KHÔNG phát, lưới giữ nguyên, lỗi bật. Gõ ô ngày không đụng `keyword` và ngược lại.
- Lỗi là của view: không mã lỗi, không dải băng. Viền `--danger` luôn đi kèm chữ
  `Ngày phải viết dd/MM/yyyy, ví dụ 03/09/2026.`; ô mang `aria-invalid` + `aria-describedby` tới chữ đó.
- `ve()` kéo ô về theo state khi `date` trong state đổi từ nơi khác (vd `chotGhiChu` xóa điều
  kiện) — lúc đó lỗi cũng tắt; không ghi đè chữ người đang gõ dở khi state không đổi.
- Icon vẫn là SVG nội tuyến 16px, `currentColor`; bọc trong `<button>` có tên truy cập
  `chọn ngày`, đứng ngay sau `#o-ngay` trong thứ tự Tab.
- Mọi màu từ token; không `transition`/`:hover`.
- **Quyết định (người):** picker là picker gốc của trình duyệt — một `<input type="date">`
  ẩn khỏi mắt và khỏi Tab, mở bằng `showPicker()` từ nút lịch; giá trị nó trả đã là `yyyy-MM-dd`.
- **Quyết định (người):** lỗi KHÔNG bật mỗi phím. Chỉ bật khi (1) ô `blur` với chuỗi không rỗng
  mà chưa hợp lệ, hoặc (2) chuỗi đã đủ 10 ký tự mà vẫn chưa hợp lệ. Gõ tiếp tới hợp lệ hoặc xóa
  rỗng thì tắt ngay. `date` giữ cũ như nhau trong mọi trường hợp chưa hợp lệ.

**Never:**
- Không khoảng ngày, không mốc nhanh (hôm nay / 7 ngày qua).
- Không chip, không link `về hôm nay`, không đổi placeholder ô soạn (6.3); không trần kết quả (6.4).
- Không thư viện, không tài nguyên mạng, không hằng số mới ngoài bump `APP_VERSION`.
- Không đụng `ports/`, `adapters/`, `core/state.js`, `core/query.js`, `core/errors.js`, `core/banner.js`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Gõ đủ ngày | gõ `03/09/2026` | `date = '2026-09-03'`; lưới chỉ ngày đó, mốc đầy đủ | N/A |
| Gõ dở | đang có `2026-09-03`, ô thành `03/09/20` | `date` giữ `2026-09-03`, lưới không đổi | lỗi chưa bật; bật khi `blur` |
| Ngày không có thật | `31/02/2026` | không phát | lỗi bật |
| Sai định dạng | `2026-09-03` (10 ký tự) / `3/9/2026` | không phát | lỗi bật ngay / bật khi `blur` |
| Xóa hết | ô về `''` | `date = null`, về khung nhìn trước (hôm nay nếu không từ khóa) | lỗi tắt |
| Giao với từ khóa | có `keyword`, gõ ngày hợp lệ | lưới = khớp chữ ∩ ngày; `keyword` không đổi | N/A |
| Picker | chọn 03/09/2026 | ô hiện `03/09/2026`, `date = '2026-09-03'`, picker đóng | lỗi tắt |
| Chốt ghi chú | đang lọc ngày, `chotGhiChu` | ô ngày về rỗng ở lượt vẽ kế, lỗi tắt | N/A |

</frozen-after-approval>

## Code Map

- `app/core/time.js:41,70` -- `MAU_NGAY`, `ngayCoThat`; thêm `ngayTuChuoiNhap(s)` → `'yyyy-MM-dd'|null` và `chuoiNhapTuNgay(d)` → `'dd/MM/yyyy'`.
- `app/core/state.js:325` -- `ngayHopLe` giữ cũ khi sai; KHÔNG sửa.
- `app/view/khay-tim.js` -- mở rộng `noiKhayTim`: nghe `#o-ngay` `input`, nút lịch `click`, picker `change`; `ve()` đồng bộ cả hai ô + lỗi. Nhớ `date` state lần vẽ trước để biết "đổi từ nơi khác".
- `index.html:109-122` -- bọc SVG trong `<button class="nut-lich" type="button" aria-label="chọn ngày">`; thêm chữ lỗi `<p id="o-ngay-loi" class="o-ngay-loi-chu" hidden>` ngay dưới khay; thêm picker `<input type="date" class="o-ngay-chon" tabindex="-1" aria-hidden="true">` trong `.o-ngay-boc` (ẩn bằng CSS thị giác, không `hidden`/`display:none` để `showPicker` chạy).
- `app/style.css:474-509` -- `.o-ngay-loi` (viền `--danger` trên `.o-ngay-boc`), `.o-ngay-loi-chu`, `.nut-lich` (không viền/nền, `color: inherit`).
- `test/chuyen-dong-va-tin-hieu.test.js:183` -- mở dòng `DUNG_DANGER` đã hẹn sẵn cho `.o-ngay-loi`.
- `test/theme.test.js:124` (`NEN_CUA`), `test/bo-cuc-bon-tang.test.js:135-145`, `test/focus-va-tab.test.js` -- nâng cho nút lịch + chữ lỗi.
- `tools/thu-bo-cuc.mjs:1565` (`THU_TU`: thêm `button.nut-lich` sau `o-ngay`), `:1848` (stroke icon).
- `README.md` -- checklist mục **33**. `app/core/limits.js:82` -- `APP_VERSION` `0.5.0` → `0.6.0`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/time.js` + `test/core-time.test.js` -- hai hàm đổi định dạng, ca ngày không có thật / sai dạng.
- [x] `index.html` + `app/style.css` -- nút lịch, chữ lỗi, class lỗi bằng token.
- [x] `app/view/khay-tim.js` + `test/khay-tim.test.js` -- một ca mỗi hàng I/O Matrix.
- [x] Các test/tool ở Code Map -- nâng bộ quét và thứ tự Tab.
- [x] `README.md` -- mục 33: gõ ngày, gõ sai thấy viền + chữ và lưới đứng yên, picker, xóa ô về hôm nay, sửa tại chỗ trong kết quả lọc ngày.
- [x] `app/core/limits.js` -- bump `APP_VERSION`.

**Acceptance Criteria:**
- Given khay tìm, when nhìn bên phải, then nhãn `ngày` + ô 118px monospace placeholder `dd/MM/yyyy` + icon lịch 16px stroke `--ink-2`.
- Given lỗi đang hiện ở cả hai theme, when đo, then chữ lỗi đạt ≥ 4.5:1 và viền là `--danger`.
- Given Tab từ `#o-ngay`, when nhấn Tab, then tiêu điểm tới nút lịch rồi mới tới mẩu giấy.

### Review Findings

Code review 2026-09-24 trên `05037cf`: 0 decision-needed, 0 patch, 0 defer, 16 bị bác.

**Rejected**
- low — Chốt ghi chú khi `date` vẫn `null` mà ô còn chữ sai: chữ và lỗi không bị xóa (`khay-tim.js:145`). Đã có từ Triage #1. Sửa cần thêm một tín hiệu "đã xóa điều kiện", vì so sánh `o.value` trong `ve()` sẽ xóa luôn chữ đang gõ ở mỗi lần vẽ lại.
- false — Có nơi khác đặt lại `date` bằng đúng giá trị cũ. Không action nào làm việc này.
- false — `ve()` ném lỗi khi `date` trong state không hợp lệ. `date` chỉ được ghi qua `ngayTuChuoiNhap` (đã kiểm) và nhánh picker (có `try`), nên không có đường nào tới được.
- false — `phat` trả về sớm nhưng không đồng bộ `dateDaThay`. `veTatCa` gọi `ve()` sau mọi action, nên `dateDaThay` luôn được cập nhật lại.
- false — Chọn đúng ngày đang lọc trong picker thì lỗi còn hiện. Nhánh trả về sớm vẫn gọi `hienLoi(false)`.
- false — Chú thích CSS `.o-ngay-loi-chu` nói nó "nằm trên `--bg`" là sai. Thẻ `<p>` nằm ngoài khay nên chú thích đúng.
- low — Bấm nút lịch làm `blur` bật lỗi khi đang gõ dở. Đây là quyết định "bật khi blur"; chọn ngày xong thì lỗi tắt ngay.
- low — Lỗi không được đọc qua live region. Đã có `aria-invalid` và `aria-describedby`; test đang cấm `aria-live` trong khay.
- low — id và class cùng tên `o-ngay-loi`. Không gây lỗi hành vi.
- low — Cách ẩn picker (1px, clip) có thể làm lệch vị trí popup hoặc bị chặn `showPicker()`. Chưa kiểm chứng, và ô gõ tay vẫn dùng được.
- low — Ngoại lệ Tab trong test phụ thuộc vào thứ tự thuộc tính. Chỉ làm test gãy vô ích, không làm sai sản phẩm.
- low — `o-soan.test` bỏ qua cả đoạn lỗi khi quét. Microcopy của đoạn đó đã được ghim bằng test riêng.
- low — README mục 33 thiếu vài bước tay (Esc picker, phím trên nút, ngày không có ghi chú). Đây là các ca phụ.
- low — `chuoiNhapDuDai` là export ngoài Code Map. Nó dùng lại `LOCAL_DATE_CHARS`, không thêm số mới.
- low — Regex `MAU_NHAP` là hằng số mới. Đó là mẫu định dạng chứ không phải ngưỡng, và bộ quét tập trung hóa vẫn qua.
- low — Chữ lỗi nằm dưới cả khay chứ không ngay dưới ô. Vị trí này khớp Code Map.

## Implementation Notes

## Spec Change Log

- 2026-09-24 — sửa sau review (correct-course, lật verdict triage #1): chốt ghi chú khi chưa
  lọc ngày để lại chữ ngày gõ dở và viền lỗi. `chotGhiChu` giờ resolve `true` khi đã xóa điều
  kiện, `false` khi thoát sớm; `o-soan` chuyển cờ cho `sauKhiChot`; `main.js` (`veSauChot`) gọi
  `khayTim.xoaNhap()` khi cờ `true`. Xem `planning-artifacts/sprint-change-proposal-2026-09-24.md`.

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|---|---|---|---|---|
| 1 | blind, edge, verification-gap | `ve()` không xóa chữ sai khi chốt mà `date` vẫn `null` (chưa từng phát) | low | Thật: `date` `null`→`null` qua cửa `dateDaThay`. Hàng ma trận "đang lọc ngày" vẫn đúng; chữ sai không phải điều kiện và lỗi vẫn hiện đúng với chữ trong ô; sửa cần thêm tín hiệu mới từ lõi/`main.js` | reject |
| 2 | edge | Cùng lớp đó: đặt lại `date` bằng đúng giá trị cũ từ nơi khác | false | Không action nào đặt lại `date` bằng đúng giá trị cũ ngoài chính ô ngày | reject |
| 3 | edge | Xóa trong picker gốc (`value` `''`) để nguyên bộ lọc | medium | `khay-tim.js:304` `return` sớm, không phát `null` | patch |
| 4 | blind, edge | Năm >4 chữ số từ picker làm `chuoiNhapTuNgay` ném trong listener | low | `input type=date` cho phép năm 5 chữ số; sửa là một `try` | patch |
| 5 | edge | Bấm nút lịch làm `blur` bật lỗi khi đang gõ dở | low | Đúng quyết định "bật khi blur"; chọn ngày thì tắt ngay | reject |
| 6 | blind | Class và id cùng chuỗi `o-ngay-loi` | low | Không gây lỗi hành vi; `.`/`#` phân biệt | reject |
| 7 | blind | `hienLoi` ghi đè `aria-describedby` | false | Ô không có mô tả nào khác | reject |
| 8 | blind | Khoảng trắng thừa bị coi là sai | low | Cố ý: chuỗi gõ sao so vậy (6.1) | reject |
| 9 | blind | Ngoại lệ focus-ring quá rộng so với chú thích "duy nhất" | low | Sửa trực tiếp: thêm điều kiện class | patch |
| 10 | blind | `thu-bo-cuc` chỉ so màu viền, không đo tương phản | low | Viền không phải chữ; chữ lỗi đo qua `NEN_CUA` | reject |
| 11 | blind | `o-soan.test` bỏ cả đoạn lỗi trước khi quét | low | Đoạn đó là microcopy ghim bằng test riêng | reject |
| 12 | blind | Thiếu test nạp `date` vào picker khi bấm nút | low | Thêm cùng bản vá #3 | patch |

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh.
- `npm run thu-bo-cuc` -- expected: thứ tự Tab mới và phép đo màu xanh.

**Manual checks (if no CLI):**
- HTTP localhost, checklist mục 33 ở cả hai theme.
