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

### Review Findings

_Code review lượt 2 (2026-09-29): 0 decision-needed, 6 patch, 2 defer, 11 rejected._

- [x] [Review][Patch] Ca "neo `null` hay `{ id, vaiTro }` không đổi nghĩa khi tiêu điểm ở `✕`" chỉ thử `null`; thêm lời gọi `{ id, vaiTro: 'than' }` khẳng định về đúng mẩu [test/giu-tieu-diem.test.js:548]
- [x] [Review][Patch] Ca F4 thứ hai tên "không lượt nào dựng từ notes = []" nhưng chỉ kiểm `ganF4[0]`; đổi thành `ganF4.every((v) => v === tieuN)` [tools/thu-bo-cuc.mjs:3221]
- [x] [Review][Patch] Stub đếm số mẩu `n` (`querySelectorAll` mỗi lần DOM đổi) nhưng không ca nào đọc `n` — vượt "chỉ quan sát `document.title`" của Never; bỏ `n` [tools/thu-bo-cuc.mjs:2988]
- [x] [Review][Patch] Chú thích/README còn gọi chỗ nối là `xinLuuTruBen().then(...)` sau khi đã thành `Promise.all([daNapKho, …])` [README.md:364, tools/thu-bo-cuc.mjs:2956, tools/thu-bo-cuc.mjs:3227]
- [x] [Review][Patch] Đoạn README "Từ Story 8.4 … trên cùng tab riêng" đứng trước đoạn giới thiệu tab riêng (8.3) và ngay sau đoạn NFR-1 chạy ở tab khác; dời xuống sau đoạn 8.3 [README.md:362]
- [x] [Review][Patch] Chú thích `veGiuTieuDiem` nói `✕` "thay bằng loại khác" mới về `#o-soan`, nhưng cùng loại đổi `bannerSo` (`NAP_FILE_XONG`) cũng dựng lại `✕` → về `#o-soan`; sửa chữ thành "bị gỡ hay dựng lại" [app/main.js:151, app/main.js:184]
- [x] [Review][Defer] Ngoại lệ stub trong AGENTS.md vẫn ghi "không stub gì khác" trong khi stub nay đè setter `Document.prototype.title` (chỉ ghi, chuyển tiếp) [AGENTS.md:50] — deferred: sửa tệp ngữ cảnh agent
- [x] [Review][Defer] JSDoc `@param neo` của `veGiuTieuDiem` thiếu dạng `{ id: null, vaiTro: 've-hom-nay' }` [app/main.js:170] — deferred: có từ trước (Story 7.1), 8.4 không chạm

**Rejected:**
- `Promise.all` bỏ lượt vẽ persist khi `veTatCa` ném ở lượt đầu — false: trước bản sửa lượt vẽ persist gọi đúng `veTatCa` đó nên cũng ném; lượt đầu ném là app đã hỏng (triage lượt 1 #1).
- Ca "thay `✕`" không thêm phủ so với "gỡ" — false: nó ghim rằng `✕` mới không nhận tiêu điểm, đúng hành vi Q2.
- Ghi chú `CHON_DAI_BANG` trong AGENTS.md lỗi thời — false: lần dùng vẫn nằm trong `main.js`, qua `.closest(...)`, một lần.
- Ba đường gọi (`nhanBanTin`, `mocSua.go`, persist) thiếu ca trình duyệt với `✕` giữ tiêu điểm — false: cùng hàm dùng chung, có ca chạy thật + Q5 (triage lượt 1 #6).
- `MutationObserver`/setter không gỡ, có thể làm chậm ca sau — maybe-false, nếu thật chỉ low; P3 đã thu hẹp observer.
- Ca F4 không ép `persist()` thắng `readAll` — không ép được nếu không dựng IndexedDB giả (cấm); thử đột biến đã đỏ.
- Ca F4 thứ nhất không phân biệt trước/sau bản sửa — low: chú thích ca đã nói rõ, ca đếm lần gán là cổng thật.
- "Thay hai regex bằng ca chạy thật" nhưng vẫn quét nguồn — false: epic-context cho phép regex `luu-tru-ben` được thay cho khớp đường mới; ca chạy thật ở `giu-tieu-diem` + `thu-bo-cuc`.
- Spec tự mâu thuẫn (AC3 thiếu when/then, "ba ca" vs bốn, `review_loop_iteration`) — reject: sửa là sửa spec đang review.
- Epic 8 đóng mà retro có trước 8.4 — false: epic-context ghi "không chạy retro lần hai".
- `✕` cùng loại dựng lại nên focus `✕` mới — reject: Q2 đã duyệt "gỡ/thay → `#o-soan`"; chỉ phần chú thích là P6.

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
