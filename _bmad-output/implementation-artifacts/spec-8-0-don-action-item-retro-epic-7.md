---
title: 'Story 8.0 — Dọn action item retro Epic 7'
type: 'chore'
created: '2026-09-25'
status: 'done'
baseline_commit: 'fbf5c3cc76e31127891e6a9ccf775b62b88a5425'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-25.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Gác chế độ chỉ đọc hiện dựa vào trí nhớ: một action ghi mới của Epic 8 quên `if (chiDoc)` thì mọi test vẫn xanh (retro E7 #27). Chỗ nối `kenh` ở `main.js` không test nào bắt nếu kênh bị dựng hai lần (#29). Và `luoi.js` `khiClick` trên mẩu bị cắt vẽ lại lưới mà không qua `veGiuTieuDiem`, nghi làm tiêu điểm rơi về `<body>` (#28).

**Approach:** Thêm hằng `ACTION_GHI` vào `core/state.js`, cùng hai test: gọi từng action khi chỉ đọc, và quét mã nguồn `taoStore` để khẳng định tập action chạm cổng ghi đúng bằng `ACTION_GHI`. Thêm một test quét `main.js` cho kênh. Thêm một ca `thu-bo-cuc`; nếu nó đỏ thì đưa nhánh mở rộng của `khiClick` qua `veGiuTieuDiem` bằng callback từ `main.js`.

## Boundaries & Constraints

**Always:** Cổng ghi = đúng danh sách `CONG_GHI` sẵn có ở `test/core-state-chi-doc.test.js`. So sánh tập bằng nhau (không chỉ tập con), để một mục thừa trong `ACTION_GHI` cũng làm đỏ. Neo tiêu điểm là `{ id, vaiTro: VAI_THAN }`. Commit tiếng Việt, một commit cho story. Bump `APP_VERSION` (0.7.4 → 0.7.5) CHỈ khi `luoi.js`/`main.js` bị sửa.

**Never:** Không tách `state.js` (#30 đã đóng). Không mở ngoại lệ test adapter, không dựng BroadcastChannel/DOM giả cho `main.js`. Không thêm trường state. Không sửa `khiGap` (dòng gấp) hay AGENTS.md trong story này (#26 là commit docs riêng). `view` không import `main.js`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mọi action ghi khi chỉ đọc | store đã `khoiDong`+`khoiDongBanNhap`, rồi tin lệch bản; gọi từng tên trong `ACTION_GHI` với đối số hợp lệ | `t.ghi()` rỗng; lời hứa (nếu có) resolve | một action ném hay reject → đỏ |
| Action ghi mới quên đăng ký | thêm một action gọi `ports.noteStore.put(` mà không vào `ACTION_GHI` | test quét đỏ, nêu tên action | N/A |
| Mục thừa / thiếu ca gọi | tên trong `ACTION_GHI` không chạm cổng ghi, hay không có ca gọi trong bảng test | đỏ | N/A |
| Kênh dựng hai lần | `main.js` có hai `taoBroadcast(`, hoặc `channel:` và `.subscribe(` dùng hai định danh | test quét đỏ | N/A |
| Enter trên mẩu bị cắt | tiêu điểm trên thân mẩu > `COLLAPSED_LINES` dòng, chưa mở | mẩu mở rộng; `activeElement` là thân chính mẩu đó, không `<body>`, không ô sửa | N/A |

</frozen-after-approval>

## Code Map

- `app/core/state.js` -- `taoStore` (dòng 356–1675); action export ở `Object.freeze` cuối tệp. Hàm nội bộ khai báo ở thụt 2 dấu cách (`  function x(`). Cổng gọi có thể xuống dòng: `ports.noteStore\n      .putDraft(` (1524, 1576) — quét phải chịu khoảng trắng: `/ports\.(\w+)\s*\.(\w+)\s*\(/`. Không có bí danh `ports.x`.
- Đồ thị gọi hiện tại (đã chạy thử) cho đúng 10 action ghi: `datTheme, xuatSaoLuu, napSaoLuu, chotGhiChu, xoaGhiChu, tuLuuNoiDung, roiCheDoSua, khoiDongBanNhap, datBanNhap, nhipTimBanNhap`. Phải đi bắc cầu qua hàm nội bộ (`phatTin`, `ghiBanNhap`, `henGhiDiSau`, `henGhiBanNhapDiSau`, `ghiMocSaoLuuMoiHon`, `themGhiChu`, `ghiTruocDatSau`...).
- `test/core-state-chi-doc.test.js` -- tái dùng `dungTab`, `CONG_GHI`, `vaoChiDoc`, `khoiDongDu`; ca dòng 211 đã gọi phần lớn action — ca mới là bảng tổng quát có khóa theo `ACTION_GHI`.
- `app/main.js` -- `const kenh = taoBroadcast();` (265), `channel: kenh,` (81, trong `congThat`), `kenh.subscribe(` (454). `veGiuTieuDiem` (165), `VAI_THAN`, `mocSua` object (~326: `vao`, `roi`, `go`, `xoa`), `noiLuoi(store, document, undefined, mocSua)` (353).
- `app/view/luoi.js` -- `khiClick` (113–120): nhánh bị cắt gọi `store.batTatMoRong(note.id); ve();`. Giữ nhánh cũ làm đường lui khi `mocSua` vắng (test bố cục).
- `test/luoi.test.js` -- đã quét `main.js` bằng regex (khuôn ~630–710); chỗ đặt test #29.
- `tools/thu-bo-cuc.mjs` -- khối Story 7.0 (2495–2703): `CHU`, `goVao`, `datTieuDiem(thanMau(id))`, `nhanPhim(ENTER)`, `dung()`, `ghi(...)`, dọn trong `finally` theo `id`.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- mục dòng 65–67, 179–181, 207–209 được giải bởi story này.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- `epic-7-retro-item-27/28/29` → `done`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/state.js` -- export `ACTION_GHI` (mảng đóng băng 10 tên trên), đặt gần các hằng cấp module, kèm comment tiếng Việt nói luật: action mới chạm cổng ghi phải vào đây và gác `chiDoc` -- nguồn sự thật cho test.
- [x] `test/core-state-chi-doc.test.js` -- (a) bảng `goi[ten](t)` cho từng tên trong `ACTION_GHI`, khẳng định mỗi tên có ca, gọi khi chỉ đọc (fake timers, vượt `AUTOSAVE_MS`), `t.ghi()` rỗng, không reject; (b) quét `app/core/state.js`: dựng đồ thị gọi trong `taoStore`, tập action export chạm `CONG_GHI` bắc cầu phải bằng `new Set(ACTION_GHI)` -- ép gác thay trí nhớ (#27).
- [x] `test/luoi.test.js` -- quét `main.js`: `taoBroadcast(` đúng 1 lần, bắt định danh `X` ở `const X = taoBroadcast(`, khẳng định `channel:\s*X\b` và `\bX\.subscribe\(` có mặt, không `channel:` nào khác (#29).
- [x] `tools/thu-bo-cuc.mjs` -- thêm `cat` (5 dòng, tiền tố `thu-8-0`) vào `CHU`; ca: focus thân, `Enter`, đợi `expandedIds` chứa id, đọc `dung()`; `ghi('Story 8.0: Enter trên mẩu bị cắt — mẩu mở, tiêu điểm ở lại thân mẩu đó', ...)` (#28).
- [x] Chạy `npm run thu-bo-cuc`. Nếu ca mới đỏ: `app/main.js` thêm `mocSua.moRong = (id) => { store.batTatMoRong(id); veGiuTieuDiem(document, veTatCa, { id, vaiTro: VAI_THAN }); }`; `app/view/luoi.js` nhánh bị cắt gọi `mocSua.moRong` khi có, không thì đường cũ; bump `APP_VERSION`; thêm ca vào `test/luoi.test.js` ghim nhánh gọi `mocSua.moRong`. Xanh thì không đụng mã sản phẩm.
- [x] `deferred-work.md` + `sprint-status.yaml` -- gạch ba mục (~~…~~ + `resolved: 2026-09-25 — Story 8.0`), đặt #27–29 `done`.

**Acceptance Criteria:**
- Given `npm test`, when chạy, then xanh cả ca mới, và bỏ `if (chiDoc)` khỏi một action trong `ACTION_GHI` (thử tạm) làm ca (a) đỏ.
- Given `npm run thu-bo-cuc`, when chạy, then ca Story 8.0 xanh; chỉ ca chập chờn "tải lại: mọi mẩu về thu gọn" được phép đỏ.

## Implementation Notes

- Ca `thu-bo-cuc` #28 đỏ ở lần chạy đầu (tiêu điểm về `<body>`) → sửa qua `mocSua.moRong` + `veGiuTieuDiem`, bump `APP_VERSION` 0.7.5. Lần chạy lại: xanh cả bộ.
- Thử AC: bỏ gác `chiDoc` ở `datTheme` → ca (a) đỏ. Bỏ ở `datBanNhap` → vẫn xanh vì hàm con `henGhiBanNhapDiSau` tự gác; gác lớp ngoài có chỗ dư.
- `npm test`: 939/939 xanh.
- Sau review: 6 bản vá (xem Triage Log). Kiểm song ánh với `PORT_METHODS` lộ `sessionStore.remove` thiếu trong `CONG_GHI` → đã thêm (`state.js` không gọi nó). `npm test` 941/941; `thu-bo-cuc` ca 8.0 xanh, bốn lần chạy thì một lần có một ca đỏ không lặp lại được.

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|-------|-----------|---------|-----------|-------|
| 1 | blind | Ca (a) dựng trước sau `vaoChiDoc` nên rỗng | low (chỉ `roiCheDoSua`) | `datBanNhap`/`tuLuuNoiDung` vẫn ghi chữ vào RAM khi chỉ đọc (ca 7.2 dòng 163–180), nên `chotGhiChu`/`tuLuuNoiDung` có thật; riêng `roiCheDoSua` gõ chữ khác rỗng thì không bao giờ tới `remove` | patch |
| 2 | blind+edge | Bộ cắt khúc chỉ nhận `  function x(` | low | helper `const x = () =>` tương lai mất cạnh, âm thầm | patch |
| 3 | blind+edge | Regex export đòi dấu phẩy cuối | low | mục cuối không phẩy bị bỏ, âm thầm | patch |
| 4 | blind | `CONG_GHI` không buộc vào `PORT_METHODS` | low | phương thức cổng ghi mới (Epic 8) lọt khỏi quét | patch |
| 5 | blind+edge | `nghi(100)` cố định trong ca `thu-bo-cuc` | low | có thể chập chờn trên máy chậm | patch |
| 6 | verif-gap | Sửa tiêu điểm chỉ được ghim bằng regex | medium | không ca `npm test` nào chạy móc `moRong` với `veGiuTieuDiem` thật | patch |
| 7 | blind | `ACTION_GHI` không được store dùng | false | ý đồ đã duyệt: hằng là nguồn cho test (đề xuất §2 #27) | reject |
| 8 | blind | Nhánh lui của `luoi.js` vẫn thả tiêu điểm | false | chỉ chạy khi `mocSua` vắng — test bố cục; `main.js` luôn truyền móc (ghim ở `luoi.test.js`) | reject |
| 9 | blind | Thiếu mục checklist README | low | ca đã tự động trong `thu-bo-cuc`; không đổi hành vi cần kiểm tay mới | reject |
| 10 | blind | Quét `channel:` có thể bị lừa / `.subscribe(` đúng một | low | `main.js` không có `channel:` hay `subscribe` nào khác; đỏ ồn ào chứ không im | reject |
| 11 | edge | Bỏ `//` sau khoảng trắng cắt chuỗi URL | low | `taoStore` không có chuỗi chứa `//` | reject |
| 12 | edge | Bí danh/destructure `ports` lọt quét | low | hiện không có (đã grep); ít khả năng | reject |
| 13 | edge | `datBanNhap` bỏ gác ngoài vẫn xanh | false | hành vi vẫn được gác bởi hàm con; ca (a) kiểm hành vi, không kiểm dòng mã | reject |

## Design Notes

Test (b) là quét văn bản chứ không chạy: một action ghi mới mà chưa ai viết ca (a) cho nó thì chỉ quét mới thấy. Hai ca bù nhau — (b) bắt "quên đăng ký", (a) bắt "đăng ký mà quên gác".

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh.
- `npm run thu-bo-cuc` -- expected: ca Story 8.0 xanh; chỉ ca chập chờn đã biết đỏ.
