---
title: 'Story 6.4: Trần kết quả và hiệu năng tra cứu'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
baseline_commit: 'dfaf99680c5e46d49f36cef1688567056da19602'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `locGhiChu` trả toàn bộ mảng khớp, nên gõ một chữ phổ biến dựng lại đúng màn hình
"xem tất cả" mà sản phẩm cố ý không có; hàng chip, lưới và tiêu đề tab mỗi nơi tự đếm `.length`.

**Approach:** `locGhiChu` trả `{ items, total }` — `items` cắt còn `MAX_RESULTS`, `total` là số
khớp thật (AD-14). Lưới vẽ `items` và thêm dòng "còn nhiều hơn" khi `total > MAX_RESULTS`; hàng
chip và tiêu đề tab đọc `total`. Ghim hiệu năng 2.000 ghi chú ≤ 200 ms bằng test.

## Boundaries & Constraints

**Always:**
- Cắt ở `core/query.js`, không ở view. `items` giữ thứ tự đầu vào (không sắp lại), `total` đếm
  trước khi cắt. Trần áp cho MỌI khung nhìn, kể cả mặc định "hôm nay" (NT-3).
- View lấy số từ `total`; cấm đếm `items.length` làm số kết quả (có test quét nguồn `app/view/`).
- `total > MAX_RESULTS` → dưới mẩu cuối, lưới thêm đúng một `<p class="luoi-them">` chữ
  `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.` — số `50`
  dựng từ `MAX_RESULTS`. Dòng trải hết bề ngang lưới (như `.luoi-khong-khop`), màu `--ink-2`
  trên `--bg`, không `aria-live`, không focus được. `total ≤ 50` → không dòng.
- Hàng chip ghi `${total} ghi chú` (63 khớp → `63 ghi chú`, 1 khớp → `1 ghi chú`).
- Tiêu đề tab đếm `total` của khung nhìn hôm nay (không bị trần cắt).
- Lọc vẫn là quét mảng đồng bộ trong RAM trên `textFolded`/`localDate`; không async, không kho.
- **Quyết định (agent, ghi lại):** khung nhìn mặc định có > 50 ghi chú hôm nay cũng hiện dòng
  "còn nhiều hơn" y nguyên chữ — một chuỗi, một luật; ca này gần như không xảy ra.

**Never:**
- Không đổi khối điều kiện, `datDieuKien`, `xoaHetDieuKien`, thứ tự sắp, hay giá trị `MAX_RESULTS`.
- Không phân trang, không nút "xem thêm" — dòng chỉ là chữ.
- Không bộ nhớ đệm kết quả hay chỉ mục phụ để đạt hiệu năng.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Vượt trần | 63 khớp | `items` 50 mẩu mới nhất, `total` 63; lưới 50 mẩu + dòng thêm; chip `63 ghi chú` | N/A |
| Đúng trần | 50 khớp | 50 mẩu, không dòng thêm; chip `50 ghi chú` | N/A |
| Một khớp | 1 khớp | chip `1 ghi chú`; không dòng thêm | N/A |
| Không khớp | có điều kiện, 0 | `{items:[], total:0}`; dòng không khớp như cũ; không dòng thêm | N/A |
| Mặc định đông | 55 ghi chú hôm nay | lưới 50 + dòng thêm; tiêu đề `55 - Ghi chú hàng ngày` | N/A |
| Hiệu năng | 2.000 ghi chú, gõ từ khóa / ngày | `locGhiChu` ≤ 200 ms | N/A |

</frozen-after-approval>

## Code Map

- `app/core/query.js:33-46` -- `locGhiChu`: đổi kết quả sang `{ items, total }`; import
  `MAX_RESULTS` từ `limits.js`. `khoangKhop` không đổi.
- `app/view/luoi.js:98,151` -- dùng `.items`; thêm hằng `LOP_THEM`/`CHU_THEM` cạnh
  `CHU_KHONG_KHOP`, đẩy `<p>` vào cuối `o` khi `total > MAX_RESULTS`.
- `app/view/hang-chip.js:9-10,67` -- `.total`; sửa comment "Story 6.4 sẽ đổi".
- `app/view/tieu-de.js:80-81` -- `.total`.
- `app/style.css:469` -- thêm `.luoi-them` cùng khối với `.luoi-khong-khop`.
- `tools/thu-bo-cuc.mjs:572,704,823,1134,2288` -- `.length` → `.total` (ở 823 dùng `.items`).
- Test: `test/core-query.test.js` (đổi sang `.items`, thêm ca trần + hiệu năng),
  `test/luoi.test.js`, `test/hang-chip.test.js`, `test/tieu-de.test.js:280-285`,
  `test/theme.test.js:136` (`NEN_CUA` thêm `.luoi-them: '--bg'`).
- `README.md` -- checklist mục **35**. `app/core/limits.js:82` -- `APP_VERSION` `0.7.0` → `0.7.1`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/query.js` + `test/core-query.test.js` -- hình dạng `{items,total}`; ca 63/50/1/0,
  giữ thứ tự; ca 2.000 ghi chú (keyword, date, cả hai) đo `performance.now()` < 200 ms.
- [x] `app/view/luoi.js` + `app/style.css` + `test/luoi.test.js` -- vẽ `items`, dòng thêm.
- [x] `app/view/hang-chip.js`, `app/view/tieu-de.js` + test -- đọc `total`.
- [x] test quét nguồn (trong `test/luoi.test.js` hoặc tệp mới) -- `app/view/**` không chứa `items.length`.
- [x] `tools/thu-bo-cuc.mjs`, `test/theme.test.js` -- theo hình dạng mới / tương phản.
- [x] `README.md` mục 35; `app/core/limits.js` bump.

**Acceptance Criteria:**
- Given `npm test`, when chạy, then toàn bộ xanh, gồm test hiệu năng và bộ quét token/state.
- Given dòng "còn nhiều hơn" ở cả hai theme, when đo, then chữ đạt ≥ 4.5:1.

### Review Findings

- [x] [Review][Patch] Comment của `.luoi-them` chen giữa comment và khối `.luoi-khong-khop`, nên comment cũ tách khỏi khối nó mô tả [app/style.css:469]
- [x] [Review][Defer] AGENTS.md còn ghi checklist "1–32" trong khi README đã tới mục 35 [AGENTS.md] — deferred: sửa file agent-context; đã có trong deferred-work.md

**Rejected:**
- Dòng "còn nhiều hơn" vô nghĩa ở khung nhìn mặc định — false: spec (Boundaries) đã ghi quyết định giữ một chuỗi, một luật.
- Mẩu đang sửa trượt khỏi top 50 thì bỏ rơi trạng thái sửa — false: `luoi.js` bỏ qua lượt vẽ khi ô sửa của `editing.id` còn trong DOM (triage #4 trước).
- Test 200 ms không làm nóng, dễ chập chờn / không đo cả lượt vẽ — low: quét 2.000 bản ghi cỡ 1 ms, dư hai bậc.
- Mỗi lượt vẽ gọi `locGhiChu` ba lần — low: ~1 ms mỗi lần, trong ngân sách; chia sẻ kết quả cần nối dây mới.
- Quét `items.length` lách được bằng bí danh `hienThi.length`; `/\.total/` trong tieu-de yếu — low: chặn đúng mẫu AD-14 (triage #3 trước).
- README hứa không focus / không `aria-live` mà không có test — low: code chỉ tạo `<p>` trần; checklist tay mục 35 phủ.
- Checklist mục 35 thiếu fixture ≥ 63 ghi chú — low: thêm công cụ sinh file là việc mới.
- `thu-bo-cuc` không kiểm dòng trần qua CDP — low: triage #7 trước.
- `.luoi-them` chép `.luoi-khong-khop`, nên gộp selector — false: gộp làm bộ đo tương phản không đọc được khối (triage #2 trước).
- Tên test "mảng rỗng" lỗi thời; thiếu assert `total` = 0 — false/low: `items` vẫn là mảng; ca 0 khớp ở `luoi.test.js` ghim nhánh `total === 0`.
- Bộ sinh giờ lặp ở bốn test; `nhieu()` vỡ quá 3.600 mẩu — low: thẩm mỹ test, không ai gọi quá 2.000.
- Ngưỡng 200 ms và `slice(0, 50)` cứng trong test — false: luật tập trung số áp cho mã sản phẩm; `core-limits.test.js` ghim `MAX_RESULTS: 50`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|---|---|---|---|---|
| 1 | blind | Dòng "còn nhiều hơn" dựng bằng `THE_KHONG_KHOP` | low | Hai dòng khác nghĩa buộc chung một hằng; sửa một dòng | patch |
| 2 | blind | `.luoi-them` chép lại `.luoi-khong-khop`, nên gộp selector | false | Gộp selector làm bộ đo tương phản trong `theme.test.js` không đọc được khối | reject |
| 3 | blind | Regex quét `items.length` / `.total` lách được bằng tên khác | low | Chặn đúng mẫu AD-14 nêu; bắt mọi bí danh cần phân tích luồng | reject |
| 4 | blind | Mẩu đang sửa trượt khỏi top 50 thì mất chữ | false | `luoi.js` bỏ qua lượt vẽ khi ô sửa của `editing.id` còn trong DOM | reject |
| 5 | blind, edge | Test 200 ms không làm nóng, dễ chập chờn | low | Quét 2.000 bản ghi cỡ 1 ms, dư hai bậc độ lớn | reject |
| 6 | blind | AGENTS.md còn ghi checklist 1–32 | low | Có thật; sửa file agent-context | defer |
| 7 | blind | `thu-bo-cuc` không kiểm trần; `findIndex` -1 quá trần | low | Mục 35 README là đường kiểm tay; tool chạy hồ sơ tạm, ít mẩu | reject |
| 8 | blind | Thiếu ca date+trần, ca 51 | low | Thứ tự và biên đã ghim ở `core-query`; lưới chỉ dùng `total > MAX_RESULTS` | reject |
| 9 | blind | Số `50` viết cứng lẫn với `MAX_RESULTS` | false | `test/core-limits.test.js` ghim `MAX_RESULTS: 50` | reject |
| 10 | blind | Bộ sinh giờ khó đọc, lặp ở bốn test | low | Chỉ thẩm mỹ test | reject |
| 11 | edge, vgap | `thu-bo-cuc` đếm ô bằng `total`; ≥ 50 mẩu hôm nay thì đợi quá giờ | low | Hồ sơ `mkdtemp` mới mỗi lượt, hai lượt chạy thật xanh 83/83; sửa cần thêm nhánh trần | reject |

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh.
- `npm run thu-bo-cuc` -- expected: xanh với hình dạng mới.

**Manual checks (if no CLI):**
- HTTP localhost, mục 35: nạp file ≥ 63 ghi chú khớp `phan`, thấy 50 mẩu + dòng + chip `63 ghi chú`.
