---
title: 'Story 7.2: Phát hiện lệch phiên bản và chế độ chỉ đọc'
type: 'feature'
created: '2026-09-25'
status: 'done'
baseline_commit: 'd35e68d66633ffdca8f31359a8edf0d7f26f9371'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `nhanBanTin` bỏ qua `appVersion`. Một tab mở từ trước lần deploy vẫn ghi bằng mã cũ và RAM lỗi thời, đè lên bản ghi do mã mới viết, không ai hay.

**Approach:** Tin hợp lệ từ tab khác mang `appVersion` khác `APP_VERSION` thì tab vào chế độ chỉ đọc, và ở đó đến lúc tải lại: dải băng `VERSION_SKEW`, mọi action ghi bị từ chối, mọi hẹn tự lưu bị hủy.

## Boundaries & Constraints

**Always:**

- Cờ chỉ đọc sống trong closure của `taoStore` (cùng khuôn `dangNap`), không phải trường state. Một chiều: không đường nào tắt nó.
- Vào chỉ đọc: `datLai({ banner: MA_LOI.VERSION_SKEW })`. Từ đó `datLai` bỏ mọi khóa `banner`/`bannerSo` khác, kể cả `banner: null` của một phép ghi đang bay rồi thành công. `dongDaiBang` vốn không đóng được hàng 1.
- Từ chối nghĩa là không chạm cổng ghi nào (`commitDraft`, `put`, `remove`, `replaceAll`, `putDraft`, `claimDraft`, `sessionStore.write`, `fileIO`), không phát tin, lời hứa vẫn resolve. Áp cho: `chotGhiChu`, `xoaGhiChu`, `tuLuuNoiDung`, `roiCheDoSua` (nhánh xóa), `datTheme`, `xuatSaoLuu`, `napSaoLuu`, `datBanNhap`, `nhipTimBanNhap`, `khoiDongBanNhap`.
- Chữ không mất trong im lặng: `datBanNhap` và `tuLuuNoiDung` vẫn đưa chữ vào `draft`/`editing` (RAM) và `chuDangCho`, chỉ không đặt hẹn. `chotGhiChu` giữ nguyên chữ trong ô. Dải băng là lời nói.
- Hẹn tự lưu (sửa và bản nháp) đang treo: lúc nổ thấy cờ thì bỏ, không chạm cổng.
- Tin `notes-changed` và `session-changed` vẫn được đọc lại như 7.1, kể cả tin mang lệch phiên bản: chỉ đọc vẫn là đọc. Action không ghi (`datDieuKien`, `batTatMoRong`, `vaoCheDoSua`, hộp thoại) vẫn chạy.
- Kiểm lệch nằm trong `nhanBanTin`, sau kiểm hình dạng và lọc `from`. So bằng `!==`, không so thứ tự.
- **Quyết định OQ1 (namtt, 2026-09-25): đối xứng.** Tab mới nhận tin của tab cũ cũng vào chỉ đọc; Nam tải lại cả hai.
- README: giới hạn n = 1 ghi cạnh checklist deploy; mục thử tay mới cho chế độ chỉ đọc.
- Bump `APP_VERSION` lên `0.7.4`.

**Never:**

- Không thêm mã lỗi, nguồn dải băng, loại tin hay trường bản tin. Không đổi `errors.js`, `BANG_UU_TIEN`, microcopy.
- Không vô hiệu hóa control ở view, không thêm state mới cho view. Không tự tải lại trang.
- Không phát tin mới lúc khởi động để tab cũ biết sớm hơn (giới hạn n = 1 được chấp nhận).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|---|---|---|
| Tin lệch | `appVersion: '0.0.0'`, `from` khác | dải băng `VERSION_SKEW`, `dongDaiBang` không tắt nó |
| Tin cùng bản | `appVersion === APP_VERSION` | như 7.1, không chỉ đọc |
| Tin lệch sai hình dạng / của chính mình | thiếu trường, `from` = tab mình | bỏ qua, không chỉ đọc |
| Chốt khi chỉ đọc | ô soạn có chữ | cổng không gọi, chữ còn nguyên, không phát |
| Gõ ô soạn / ô sửa | chỉ đọc | chữ vào RAM, sau `AUTOSAVE_MS` không `putDraft`/`put` |
| Hẹn treo lúc vào chỉ đọc | gõ rồi nhận tin lệch trước `AUTOSAVE_MS` | hẹn nổ không chạm cổng |
| Ghi đang bay thành công sau khi vào chỉ đọc | `put` resolve sau tin lệch | dải băng vẫn `VERSION_SKEW` |
| Xóa / theme / xuất / nạp / nhịp tim | chỉ đọc | cổng không gọi, không phát |
| Tin `notes-changed` lệch | tab khác vừa chốt | vào chỉ đọc VÀ lưới hiện mẩu mới |
| Lỗi kho sau đó | `readAll` từ chối | dải băng vẫn `VERSION_SKEW` |

</frozen-after-approval>

## Code Map

- `app/core/state.js`:
  - Closure `:370-425` -- thêm `let chiDoc = false` cạnh `dangNap`, kèm docstring vì sao không phải state.
  - `datLai` `:460-487` -- khi `chiDoc`, xóa `banner`/`bannerSo` khỏi `nhanh` (trừ đúng lời gọi vào chỉ đọc; đặt banner trước khi bật cờ, hoặc dùng tham số nội bộ).
  - `henGhiDiSau` `:656` và `henGhiBanNhapDiSau` `:1501` -- gác `chiDoc` lúc nổ.
  - `nhanBanTin` `:871` -- sau lọc `from`: `if (tin.appVersion !== APP_VERSION) vaoChiDoc()`, rồi rẽ nhánh đọc lại như cũ. Sửa docstring "`appVersion` chưa được xét".
  - Gác đầu hàm cho các action ghi ở Boundaries: `chotGhiChu` `:1262` (trả `Promise.resolve(false)` ngay, không đụng state — điều kiện lọc giữ nguyên), `xoaGhiChu` `:1299`, `datTheme` `:959` (sau kiểm giá trị), `xuatSaoLuu` `:1018`, `napSaoLuu` `:1117`, `nhipTimBanNhap` `:1597`, `khoiDongBanNhap` `:1522`. `tuLuuNoiDung` `:1346` và `datBanNhap` `:1573`: vẫn `datLai` chữ + `chuDangCho`, bỏ qua hẹn (hẹn tự gác cũng đủ, nhưng không đặt thì rõ hơn). `roiCheDoSua` đi qua `xoaGhiChu` nên tự được gác.
- `app/core/banner.js`, `app/core/errors.js` -- đã có hàng 1 `VERSION_SKEW` không đóng được và microcopy nguyên văn; không sửa.
- `app/main.js` -- không đổi (tin đến đã đi `nhanBanTin(...).then(veGiuTieuDiem)`).
- Test: file mới `test/core-state-chi-doc.test.js` theo khuôn cổng giả của `test/core-state-dong-bo.test.js` (hàm dựng tin `:112`). Không test adapter.
- `tools/thu-bo-cuc.mjs` -- khối "Story 7.2": trong tab thật, `Runtime.evaluate` `new BroadcastChannel('ghichu').postMessage({ v: 1, type: 'notes-changed', from: 'tab-gia', appVersion: '0.0.0' })`; kiểm dải băng hiện microcopy, không có `✕`, gõ + chốt không thêm mẩu sau khi tải lại.
- `README.md` -- `:54-69` thêm dòng giới hạn n = 1; mục thử tay 38 sau mục 37.
- `app/core/limits.js:82` -- `0.7.4`.

## Tasks & Acceptance

**Execution:**

- [x] `app/core/state.js` -- cờ `chiDoc`, `vaoChiDoc`, khóa dải băng trong `datLai`, gác mọi action ghi và hai loại hẹn, kiểm lệch trong `nhanBanTin`.
- [x] `test/core-state-chi-doc.test.js` -- một ca cho mỗi hàng Matrix; đếm lời gọi cổng ghi và `channel.publish` bằng 0.
- [x] `tools/thu-bo-cuc.mjs` -- khối Story 7.2.
- [x] `README.md`, `app/core/limits.js` -- giới hạn n = 1, mục 38, bump.

**Acceptance Criteria:**

- Given chế độ chỉ đọc, when gọi lần lượt mọi action ghi, then không cổng ghi nào và không `publish` nào được gọi, và không lời hứa nào bị từ chối.
- Given `npm test`, when chạy, then xanh toàn bộ.
- Given `npm run thu-bo-cuc`, when chạy, then khối 7.2 xanh; đỏ nếu có chỉ ở ca chập chờn đã biết.

### Review Findings

- [x] [Review][Decision→Patch, đã sửa: gác `chiDoc` sau `readChosenFile` + test] Nạp sao lưu đang bay khi vào chỉ đọc vẫn ghi xuống kho — `napSaoLuu` chỉ gác ở cửa vào (`state.js:1153`). Nếu tin lệch đến lúc hộp chọn file còn mở, sau khi `readChosenFile` trả về vẫn chạy `noteStore.replaceAll` và `sessionStore.write` (mốc sao lưu), trái README mục 38 ("nạp: không có tác dụng xuống kho"). Chưa có test nào ghim hành vi này. Lựa chọn: (a) gác thêm `chiDoc` sau `readChosenFile` và trước `replaceAll`, kèm test; (b) chấp nhận như một "ghi đang bay" (giống `put`), ghi rõ vào README/spec và ghim bằng test.
- [x] [Review][Patch] Test theme so với hằng số thay vì giá trị trước lúc gọi (`not.toBe('dark')`) [test/core-state-chi-doc.test.js]

**Rejected:**
- `false` — `roiCheDoSua` rò ghi: hàm chỉ ghi qua `xoaGhiChu`, mà `xoaGhiChu` đã gác `chiDoc` (`state.js:1339`).
- `false` — thu-bo-cuc so với chuỗi `'VERSION_SKEW'`: `MA_LOI.VERSION_SKEW === 'VERSION_SKEW'` (`errors.js:13`).
- `false` — lỗi ghi đang bay bị nuốt sau khi vào chỉ đọc / `phatTin` bị chặn sau `commitDraft` đang bay: đúng ý spec (khóa dải băng, không phát tin), đã được test ghim.
- `false` — README thiếu hệ quả đối xứng: mục 38 đã nêu (OQ1).
- `low` — tên test "ĐÚNG MỘT người phát" rộng hơn phép kiểm; hành động không phản hồi (theme/xuất/nạp/xóa); `datTheme`/`ghiMocSaoLuuMoiHon` có callback đang bay; `roiCheDoSua` với chữ rỗng lệch RAM–lưới; dọn `finally` của thu-bo-cuc; `KeyboardEvent` tổng hợp (đã bác ở triage #7); ca tin sai hình dạng chưa kiểm được "vẫn ghi được": hiếm gặp, hoặc muốn sửa thì phải thêm nhánh/độ phức tạp.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Vòng 1 (2026-09-25), diff `d35e68d..` (cây làm việc), 3 lớp: blind, edge, vgap (vgap: không có khe).

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|---|---|---|---|---|
| 1 | blind, edge | Ghi đang bay thành công sau `vaoChiDoc` vẫn `phatTin` với `appVersion` cũ → tab mới cũng vào chỉ đọc | low | `baoGhiChuDoi` → `phatTin` không gác `chiDoc`; sửa một dòng | patch |
| 2 | edge | `commitDraft` đang bay thành công sau chỉ đọc làm trống ô soạn | false | Ghi đã xuống kho thật; làm trống ô là đúng, chữ không mất | reject |
| 3 | edge | Nhánh ghi bay rồi bị từ chối sau chỉ đọc không có test | low | Cùng cơ chế `datLai` đã có test ở ca ghi bay thành công | reject |
| 4 | blind | `roiCheDoSua` không có gác riêng | false | Nhánh xóa đi qua `xoaGhiChu` đã gác; nhánh không rỗng không ghi | reject |
| 5 | blind | README mục 38 nói sai về đối xứng | false | A chưa biết mình cũ thì vẫn phát; B nhận và vào chỉ đọc — đúng OQ1 | reject |
| 6 | blind | Không phát tin lúc khởi động | false | Spec Never cấm; giới hạn n = 1 đã chấp nhận | reject |
| 7 | blind | `thu-bo-cuc` dùng `KeyboardEvent` giả thay phím CDP | low | Đường chốt đã chạy và xanh; đổi sang `Input.dispatchKeyEvent` là thêm mã | reject |
| 8 | blind | `bang !== 'VERSION_SKEW'` giả định giá trị mã; không kiểm `putDraft` | low | `MA_LOI.VERSION_SKEW === 'VERSION_SKEW'` (errors.js:13); phần bản nháp đã có ca đơn vị | reject |
| 9 | blind | Thiếu test no-op cho theme/xuất/nạp ở view, `datDieuKien`, `napLaiPhien` khi chỉ đọc | low | Ca `:208` đếm cổng cho theme/xuất/nạp; phần còn lại không ghi | reject |
| 10 | blind | Test "đúng một người phát" hở với bí danh | low | Giả định mã tương lai; thêm quét là thêm độ phức tạp | reject |

## Design Notes

- **Xuất sao lưu cũng bị từ chối.** Tab cũ xuất từ RAM có thể thiếu ghi chú do tab mới viết, và nó còn ghi `lastBackupAt` — một bản sao lưu thiếu mà dòng nhắc lại tin là đủ. Tải lại rồi xuất.
- **Vẫn đọc lại khi chỉ đọc.** Màn hình tươi hơn là vô hại; AD-13 bảo đảm tệ nhất là thiếu trường mới.

## Verification

**Commands:**

- `npm test` -- expected: xanh.
- `npm run thu-bo-cuc` -- expected: khối 7.2 xanh.
