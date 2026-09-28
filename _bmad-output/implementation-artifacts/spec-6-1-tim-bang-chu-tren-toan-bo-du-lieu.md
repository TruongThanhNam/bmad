---
title: 'Story 6.1: Tìm bằng chữ trên toàn bộ dữ liệu'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
baseline_commit: 'f3a3bb6a4bd5ee82ce65b0681bd3d345001df74a'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Khay tìm (`#o-tim`, `index.html:104-111`) đã có hình nhưng chưa ai nghe nó, và
`locGhiChu` (`app/core/query.js:33-44`) luôn lọc thêm theo "hôm nay" khi `date === null` — nên
từ khóa chỉ tìm được trong hôm nay, trái AD-15 ("hôm nay" chỉ khi CẢ HAI trường `null`). Không có
đường nào tới ghi chú cũ hơn hôm nay.

**Approach:** Sửa `locGhiChu` cho đúng AD-15, thêm một view mới nghe `input` trên `#o-tim` và phát
`datDieuKien({ keyword })` mỗi phím; lưới tô phần khớp bằng `--hl`, hiện mốc đầy đủ
`dd/MM/yyyy HH:mm` khi đang có điều kiện, và nói `Không có ghi chú nào khớp.` khi không khớp gì.

## Boundaries & Constraints

**Always:**
- `query.js`: cả hai trường `null` → lọc hôm nay (như cũ); ngược lại "hôm nay" KHÔNG tham gia;
  `date` khác `null` thì lọc đúng ngày đó, `keyword` khác `null` thì lọc thêm theo chữ (phép giao).
  Vẫn lọc, không sắp lại; vẫn trả MẢNG.
- Gấp chữ bằng đúng `fold()` ở đầu tìm, so với `textFolded` đã lưu (AD-5). Không trim từ khóa:
  chuỗi gõ sao so vậy (chỉ `''` → `null`, đã có ở `keywordHopLe`).
- Vị trí tô tính bằng hàm thuần ở `core` trên `textFolded` (tô MỌI lần xuất hiện, không chồng
  nhau), dùng thẳng trên `text` vì `fold` giữ độ dài. View dựng text node + `<mark>`, không
  `innerHTML`; `mark` nền `var(--hl)`, chữ `var(--ink)`.
- Mốc đầy đủ qua một hàm mới trong `core/time.js`; khung nhìn mặc định vẫn `HH:mm`.
- View chỉ phát `datDieuKien`; không view nào tự giữ bản sao từ khóa.
- Dòng `Không có ghi chú nào khớp.` chỉ khi có điều kiện VÀ 0 kết quả; trạng thái rỗng mặc định
  vẫn không một chữ (Story 2.6, AD-16).
- Sửa tại chỗ (Epic 5) chạy y hệt trên mẩu trong kết quả tìm.

**Never:**
- Không trần `MAX_RESULTS`, không `{items, total}`, không dòng "còn nhiều hơn" (Story 6.4).
- Không chip, không link `về hôm nay`, không đổi placeholder ô soạn (Story 6.3). Không nối `#o-ngay`
  hay icon lịch (Story 6.2).
- Không phím tắt vào ô tìm, không `aria-live`, không debounce, không chạm IndexedDB/cổng khi gõ.
- Không mã lỗi mới, không dải băng mới, không hằng số mới ngoài bump `APP_VERSION`.
- Không đụng `ports/`, `adapters/`, `core/fold.js`, `core/errors.js`, `core/banner.js`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Gõ không dấu | có `Phân quyền` hôm qua, gõ `phan quyen` | mẩu hôm qua hiện; `Phân quyền` được tô đúng vị trí | N/A |
| Hoa/thường | gõ `PHAN` | khớp `phân`, tô 4 ký tự gốc | N/A |
| Nhiều lần xuất hiện | `ab ab`, gõ `ab` | tô cả hai | N/A |
| Mỗi phím | gõ từng ký tự | lưới lọc lại ngay, không cần `Enter` | N/A |
| Không khớp | gõ `zzz` | lưới chỉ có `Không có ghi chú nào khớp.` | N/A |
| Xóa hết chữ | ô về `''` | `keyword = null`; về khung nhìn hôm nay, mốc `HH:mm`, không tô | N/A |
| Mặc định rỗng | không điều kiện, 0 ghi chú hôm nay | lưới trống, không chữ | N/A |
| Chốt ghi chú khi đang tìm | `chotGhiChu` | điều kiện bị xóa (đã có); ô `#o-tim` cũng về rỗng ở lượt vẽ kế | N/A |

</frozen-after-approval>

## Code Map

- `app/core/query.js:33-44` -- sửa nhánh "hôm nay"; thêm hàm thuần tính khoảng khớp.
- `app/core/state.js:79,222,307,473-501,527` -- khối `dieuKien`, `datDieuKien`, `xoaHetDieuKien` đã có; KHÔNG sửa.
- `app/core/time.js:~154` (`localTime`) -- thêm formatter `dd/MM/yyyy HH:mm` cạnh nó (comment :41 đã hẹn Epic 6).
- `app/view/khay-tim.js` -- **mới**: `noiKhayTim(store, goc, sauKhiDoi)` → `{ ve }`; `ve()` đồng bộ `value` của `#o-tim` từ state (chỉ khi lệch, để không nhảy con trỏ).
- `app/main.js:28-39, 101, 338-348` -- nối view thứ BẢY vào `veTatCa`; `sauKhiDoi` = `veTatCa`.
- `app/view/luoi.js:91,137-141` -- truyền từ khóa + cờ "có điều kiện" xuống `veMau`; nhánh "không khớp".
- `app/view/mau-giay.js:207,298` -- thân dựng bằng text node + `<mark>`; mốc chọn formatter theo cờ.
- `app/view/tieu-de.js:80` -- dùng `DIEU_KIEN_RONG` riêng; không đổi.
- `app/style.css:58,138,420-452` -- `--hl` đã có ở cả hai khối, chưa dùng; thêm class cho `mark` và dòng không khớp, chỉ token.
- Test cần nâng: `test/core-query.test.js` (ca keyword + date null nay tìm mọi ngày), `test/luoi.test.js:333` + ca trạng thái rỗng, `test/bo-cuc-bon-tang.test.js:135-141`, `test/focus-va-tab.test.js:328,759`, `test/state-tap-trung.test.js:284`, `test/theme.test.js` (`NEN_CUA` cho `mark`).
- `README.md:565` -- mục checklist **32**. `app/core/limits.js:82` -- `APP_VERSION` `'0.4.1'` → `'0.5.0'`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/query.js` -- đúng AD-15 + hàm khoảng khớp -- mọi logic tìm ở lõi, test được không cần DOM.
- [x] `app/core/time.js` -- formatter mốc đầy đủ -- chỉ `time.js` chạm ngày giờ.
- [x] `app/view/khay-tim.js` + `app/main.js` -- view mới, nối vào `veTatCa` -- `main.js` là chỗ duy nhất biết mọi view.
- [x] `app/view/luoi.js` + `app/view/mau-giay.js` -- tô, mốc đầy đủ, dòng không khớp.
- [x] `app/style.css` -- class `mark`/không khớp bằng token.
- [x] `test/core-query.test.js`, `test/core-time.test.js`, `test/khay-tim.test.js` (mới), `test/luoi.test.js`, `test/mau-giay.test.js` -- một ca cho mỗi hàng I/O Matrix; nâng các bộ quét ở Code Map.
- [x] `README.md` -- mục 32: gõ không dấu tìm ghi chú hôm qua, tô, xóa chữ về hôm nay, sửa tại chỗ trong kết quả.
- [x] `app/core/limits.js` -- bump `APP_VERSION` -- luật deploy.

**Acceptance Criteria:**
- Given màn hình vừa mở, when Nhìn tầng 2, then ô tìm luôn hiện, nhãn `tìm`, placeholder `từ khóa`, khay nền `--chip-bg`.
- Given có kết quả tìm, when lưới vẽ, then xếp mới nhất trên cùng, mỗi mẩu mốc `dd/MM/yyyy HH:mm`.
- Given `mark` ở cả hai theme, when đo tương phản `--ink` trên `--hl`, then đạt ≥ 4.5:1.

### Review Findings

Code review 2026-09-24, commit `0c36b93`: 4 lớp (Blind, Edge Case, Verification Gap, Acceptance), 0 decision, 0 patch, 1 defer, 18 reject.

- [x] [Review][Defer] `AGENTS.md` vẫn ghi "checklist 1–29" trong khi README đã tới mục 32 [AGENTS.md] — deferred: sửa file ngữ cảnh agent; đã có sẵn trong `deferred-work.md`.

**Rejected:**
- false — `viTriConTroTuDiem` tính sai khi `offsetNode` là phần tử/`<mark>`: dòng 180 trả `null` cho mọi node không phải chữ.
- false — bỏ qua giá trị trả của `duyet`: dòng 183 đã chắc `than.contains(node)`, nên duyệt luôn tới node.
- false — `textFolded` lệch độ dài `text`: `fold` giữ độ dài theo AD-5, và `textFolded` luôn dựng bằng `fold(text)`.
- false — `datDieuKien` ném lỗi trong handler `input`: `o.value` luôn là chuỗi, `keywordHopLe` không ném.
- false — `ve()` ghi `value` giữa lúc IME đang soạn: chỉ ghi khi lệch state, mà state vừa lấy từ chính `o.value`.
- low — IME phát `input` từng bước soạn: spec cấm debounce; lọc trên chữ đang soạn là hành vi chấp nhận.
- false — lưới không lọc lại khi đang sửa: bấm vào ô tìm gây `blur` → rời chế độ sửa trước khi `input` tới.
- false — `focus-va-tab`/`state-tap-trung` không nâng: các bộ quét đọc động toàn bộ view, và `npm test` xanh.
- false — tương phản `.mau-khop`/`.luoi-khong-khop` chưa đo: `theme.test.js` duyệt mọi mục `NEN_CUA` ở cả hai bảng màu.
- false — `index.html` thiếu `#o-tim`: markup đã có từ trước commit; test chỉ ghim nó.
- low — regex thứ tự thuộc tính giòn: chỉ vỡ khi có người đổi markup, và test sẽ báo ngay.
- low — `coDieuKien` trong `luoi.js` lặp luật `macDinh`: hai trường đều có mặt; sửa là thêm bề mặt API.
- low — `fold(keyword)` lặp cho mỗi mẩu: chi phí không đáng kể ở cỡ dữ liệu cục bộ.
- low — "mới nhất trên cùng" chưa có test nhiều ngày: thứ tự do `notes` đã sắp giữ; `locGhiChu` chỉ lọc.
- low — chưa có test cho `chotGhiChu` thật xóa ô tìm: README mục 32 có kiểm tay; view chỉ kéo từ state.
- low — test "nhiều lần xuất hiện" dựa vào quirk của mock: hành vi thật đã phủ ở `mau-giay.test.js`.
- false — microcopy mới là hằng số trái luật: luật `limits.js` chỉ áp cho số.
- low — nối `main.js` chỉ kiểm bằng regex: `main.js` được miễn test tự động theo luật, có checklist tay.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|---|---|---|---|---|
| 1 | edge | `viTriConTroTuDiem` trả offset theo MỘT text node; thân đã tô bị tách nhiều node → con trỏ sửa sai chỗ | medium | `mau-giay.js:152-185` trả `diem.offset` thẳng, không cộng độ dài node đứng trước | patch |
| 2 | verification-gap | Không test ghim callback `() => veTatCa()` của `noiKhayTim` trong `main.js` | medium | Gap đã kiểm sẵn; khuôn `noiChanTrang` có regex, `noiKhayTim` không | patch |
| 3 | edge | Gõ ô tìm khi đang sửa → phép gác không-vẽ-lại chặn lọc | false | Tiêu điểm rời textarea sang `#o-tim` (click hay Tab) đều blur → rời chế độ sửa (Epic 5) trước phím đầu | reject |
| 4 | edge | `fold(keyword)` rỗng → `indexOf('')` lặp vô tận | false | `fold` giữ độ dài (AD-5), keyword rỗng đã thành `null` và bị chặn ở đầu `khoangKhop` | reject |
| 5 | edge | IME (Telex) phát `input` cho chữ chưa ghép xong | low | Thật nhưng chỉ nháy tạm; spec cấm debounce, sửa cần thêm nhánh composition | reject |
| 6 | blind | `index.html` không trong diff nên assertion placeholder vô nghĩa/đỏ | false | Placeholder `từ khóa` có sẵn từ Story 2.1; test xanh | reject |
| 7 | blind | `--hl` chưa định nghĩa | false | `style.css:58,138` có ở cả hai khối; `thu-bo-cuc` đo ≥4.5:1 | reject |
| 8 | blind | NFD/`İ` làm lệch vị trí tô | false | Hợp đồng AD-5: `fold` giữ độ dài theo từng code unit, có test riêng ở `core-fold` | reject |
| 9 | blind | AGENTS.md còn ghi checklist 1–29 | low | Thật; sửa chạm file ngữ cảnh agent | defer |
| 10 | blind | Chưa test thứ tự mới-nhất-trên-cùng qua nhiều ngày | low | `state.notes` đã sắp ở lõi (Epic 1) có test riêng; `locGhiChu` giữ thứ tự | reject |
| 11 | blind | Xóa điều kiện khi chốt chỉ test trên store giả | low | `chotGhiChu` xóa `dieuKien` đã có test ở `state` từ trước | reject |
| 12 | blind | `veMau` 8 tham số vị trí dễ nhầm | low | Khuôn có sẵn; đổi sang object là thêm bề mặt | reject |
| 13 | blind | Bản ghi thiếu `textFolded` làm vỡ lưới | false | Cổng/nhập kiểm `textFolded` bắt buộc; lỗi đã có trước story | reject |
| 14 | blind | Dòng không khớp thiếu `role="status"` | false | Intent cấm `aria-live` ở story này | reject |

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh, gồm bộ quét đã nâng.
- `npm run thu-bo-cuc` -- expected: thứ tự Tab và phép đo hiện có không vỡ.

**Manual checks (if no CLI):**
- Phục vụ qua HTTP localhost; checklist mục 32 ở cả hai theme.
