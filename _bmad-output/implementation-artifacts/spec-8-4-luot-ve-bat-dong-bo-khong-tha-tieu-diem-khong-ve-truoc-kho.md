---
title: 'Story 8.4 — Lượt vẽ bất đồng bộ không thả tiêu điểm, không vẽ trước kho'
type: 'bugfix'
created: '2026-09-29'
status: 'done'
baseline_commit: '7324c9e75ab625b61f3c57768c848d235967d368'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Lượt vẽ neo `undefined` (`nhanBanTin`, `mocSua.go`, `xinLuuTruBen`, `kiemRoiVe`) làm tiêu điểm rơi về `<body>` khi nó gỡ nút `✕` đang giữ tiêu điểm; riêng `kiemRoiVe` có nhánh xử lý, ba chỗ kia thì không. Và lượt vẽ sau `xinLuuTruBen` có thể chạy trước lượt đầu của kho, dựng lưới từ `notes = []`.

**Approach:** Chuyển phép thử "tiêu điểm trong dải băng" vào nhánh neo `undefined` của `veGiuTieuDiem` (`✕` còn → ở yên; bị gỡ/thay → `#o-soan`); `kiemRoiVe` gọi neo trần. Lượt vẽ của `xinLuuTruBen` chờ `khoiDong` qua `Promise.all`. Đã duyệt đổi hành vi chung của neo `undefined` (Q2).

## Boundaries & Constraints

**Always:** `CHON_DAI_BANG` một lần khai, một lần dùng qua `.closest(...)`. Đường lui `#o-soan` chỉ một chỗ (`getElementById(ID_O_SOAN)` một lần). `xinLuuTruBen(` đúng một lời gọi, sau `store.khoiDong(`. Bump `APP_VERSION`; một commit `fix:`.

**Never:** Không nới `test/banner.test.js`. Không thêm stub nào ngoài quan sát `document.title` trong stub đã duyệt của `thu-bo-cuc`. Không sửa `core/state.js`.

</frozen-after-approval>

## Code Map

- `app/main.js` -- `veGiuTieuDiem` (phép thử dải băng trong nhánh `undefined`), `kiemRoiVe` (neo trần), khởi động (`daNapKho` + `Promise.all`).
- `test/giu-tieu-diem.test.js` -- ba ca chạy thật trên gốc giả: `✕` bị gỡ / còn sống / neo `null`.
- `test/core-state-dung-luong.test.js`, `test/core-state-luu-tru-ben.test.js` -- hai regex được thay theo đường mới.
- `tools/thu-bo-cuc.mjs` -- stub ghi `window.__chuoiTieuDe` (chỉ quan sát) + ca "Story 8.4 — persist() resolve ngay".
- `app/core/limits.js` -- `APP_VERSION` 0.7.7 → 0.7.8. `AGENTS.md` -- bẫy `veGiuTieuDiem`.

## Tasks & Acceptance

**Execution:**
- [x] `app/main.js` -- dời phép thử vào `veGiuTieuDiem`; `kiemRoiVe` trần; `Promise.all([daNapKho, xinLuuTruBen()])`.
- [x] `test/*` -- thay hai regex bằng ca chạy thật / ghim đường mới.
- [x] `tools/thu-bo-cuc.mjs` -- ghi chuỗi tiêu đề trước khi sửa, giữ ca sau khi sửa.
- [x] `AGENTS.md`, `README.md`, `limits.js`.

**Acceptance Criteria:**
- Given `✕` giữ tiêu điểm, when lượt vẽ neo `undefined` gỡ `✕`, then tiêu điểm về `#o-soan`; khi `✕` còn, ở yên.
- Given `persist()` resolve ngay, when tải trang có N mẩu hôm nay, then `document.title` không bao giờ mang số khác N.
- Given `npm test` xanh và `thu-bo-cuc` chỉ đỏ ở ca chập chờn đã biết.

## Implementation Notes

- **Kết luận F4 (đo TRƯỚC khi sửa, Chromium/Edge headless):** chuỗi `document.title` từ lúc tài liệu được tạo là `""` → `"Ghi chú hàng ngày"` → `"1 - Ghi chú hàng ngày"` (N=1), không bao giờ mang số sai — F4 **về con số trên tab là giả**: `tieuDe(0)` trùng chuỗi tĩnh của `index.html`. Nhưng **lượt vẽ trước kho là thật**: dấu vết các lần gán `document.title` (mỗi lượt vẽ của `tieu-de.js` gán một lần) khi `persist()` resolve ngay và chưa có bản sửa là `["Ghi chú hàng ngày", "1 - Ghi chú hàng ngày"]` — lần gán đầu là lượt dựng từ `notes = []`. Sau bản sửa: `["1 - …", "1 - …"]`. Ca chỉ đo chuỗi giá trị xanh cả hai bên; ca đếm lần gán mới phân biệt được (thử đột biến: đưa `xinLuuTruBen().then(...)` về bản cũ → ca đỏ, hoàn tác → xanh).
- Hai ca hồi quy `Story 8.4 — persist() resolve ngay` (chuỗi giá trị chấp nhận `""` trước khi `<head>` parse; và lần gán đầu phải mang N). Stub thêm quan sát `window.__ganTieuDe` — chỉ ghi, không đổi hành vi.
- F3 chạy thật trên trình duyệt: ca `Story 8.2 — Q5` vẫn xanh với `kiemRoiVe` neo trần. `thu-bo-cuc` 120/120 (lượt cuối; ca chập chờn xanh), chỉ đỏ ca chập chờn "tải lại: mọi mẩu về thu gọn". `npm test` xanh.

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Route | Bằng chứng |
|---|-------|-----------|---------|-------|------------|
| 1 | blind + edge + VG | `khoiDong` bị từ chối thì `Promise.all` bỏ lượt vẽ persist | false | reject | `main.js` ghi rõ `khoiDong` không bao giờ bị từ chối (nạp hỏng đi ra bằng dải băng) |
| 2 | blind + edge + VG | Ca 8.4 xanh cả trước lẫn sau bản sửa (title tĩnh trùng `tieuDe(0)`) | medium | patch | Đúng: đã thêm ca đếm lần gán `document.title`; thử đột biến đỏ/xanh |
| 3 | edge | Tiêu điểm bị lượt vẽ chuyển sang phần tử khác (không phải `dangDung`, không phải body) bị cướp về `#o-soan` | false | reject | Không view nào `focus()` trong `veTatCa`; chỉ `✕` bị gỡ mới làm `activeElement` đổi |
| 4 | edge + VG | Thiếu ca `✕` bị thay bằng `✕` mới | low | patch | Thêm ca trong `test/giu-tieu-diem.test.js` |
| 5 | edge + VG | `activeElement === null` sau lượt vẽ | low | reject | Trình duyệt luôn có `<body>`; thêm nhánh chỉ để phủ gốc giả |
| 6 | blind + edge + VG | Ba đường gọi (`nhanBanTin`, `mocSua.go`, `xinLuuTruBen`) không có ca riêng với `✕` giữ tiêu điểm | low | reject | Cả ba chỉ gọi `veGiuTieuDiem(document, veTatCa)`; hành vi nằm trong hàm dùng chung có ca chạy thật, `kiemRoiVe` có Q5 trình duyệt thật |
| 7 | VG | Ca "✕ còn nguyên" cũng xanh nếu thiếu nhánh `trongDaiBang` | low | reject | Ca "gỡ ✕" và "thay ✕" đỏ nếu thiếu nhánh; ca này ghim đảo điều kiện |
| 8 | blind | Chụp `activeElement` hai lần | low | reject | Cùng một tick đồng bộ, không thể lệch |
| 9 | blind | `sprint-status` đổi `project` | medium | patch | Lỗi do đối số `--project` của lệnh; đã trả về `Sticky Notes` |
| 10 | blind | Regex quét nguồn giòn; README không có mục tay mới; `not.toMatch(tieuDiemTrongDaiBang)` cấm cả comment | low | reject | Đúng khuôn regex sẵn có của repo; hành vi mới đã có ca chạy thật |
