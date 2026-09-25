---
date: 2026-09-25
trigger: epic-7-retro-2026-09-25.md — 7 action item (epic-7-retro-item-24 … 30)
mode: batch (phiên không tương tác)
scope: moderate — thêm Story 8.0 vào đầu Epic 8, sửa chữ ở epics.md + spine; không đổi PRD/UX
status: namtt duyệt 2026-09-25 (Q1–Q3 theo khuyến nghị); đã áp §4.1, §4.2, §4.3 (#24, #30); còn #25, #26 (commit docs) và #27–29 (Story 8.0)
---

# Sprint Change Proposal — dọn action item retro Epic 7 (Story 8.0)

## 1. Tóm tắt vấn đề

Retro Epic 7 kết luận `accepted-with-open-items` với 7 item `open` (id 24–30). Không item nào chặn,
nhưng ba item đụng thẳng Epic 8: Story 8.1 (xin lưu trữ bền) và 8.2 (cảnh báo dung lượng) sẽ thêm
action ghi mới vào `app/core/state.js` (1675 dòng), nơi cờ `chiDoc` đang là 17 điểm gác rải tay —
không có gì ép action mới phải gác. Luật đã chốt ở retro Epic 5 (#18) và lặp ở Epic 6 (#23): mỗi epic
mở đầu bằng story dọn action item còn `open`.

**Phát hiện thêm khi phân tích:** lệch F2 không chỉ ở `epics.md`. Câu "mọi action có ghi bị từ chối
với `code = VERSION_SKEW`" còn nằm ở `ARCHITECTURE-SPINE.md:436` (spine thắng khi lệch — theo
AGENTS.md), `solution-design.md:386`, `phan-chia-cong-viec.md:165` và AD-21 trong `epics.md:111`.
Chỉ sửa AC 7.2 thì spine vẫn nói ngược mã.

## 2. Phân tích từng item

| # | Item | Đánh giá | Phương án đề xuất | Ở đâu |
|---|------|----------|-------------------|-------|
| 24 | Sửa AC 7.2 (F2) | Đúng, nhưng phạm vi hẹp hơn thực tế | **Chấp nhận "no-op + dải băng"** là nghĩa đúng, sửa cả 5 chỗ (xem §4.1). Không làm lại 7.2. | sửa ngay |
| 25 | Gạch mục hàng chip ở `deferred-work.md` (F3) | Thuần sổ sách | Gạch, ghi "đã giải ở Story 7.1 (`CHON_VE_HOM_NAY`)". | sửa ngay |
| 26 | AGENTS.md: ngoại lệ `vaoSuaRoiVe` + luật gác `chiDoc` (F6, F1) | Đúng; bẫy hiện tại tự mâu thuẫn với `main.js:280` | Chạy `bmad-project-context`: thêm `vaoSuaRoiVe` là ngoại lệ có tên (đặt tiêu điểm vào phần tử **mới**), thêm luật "action ghi mới phải có trong danh sách của test #27". | sửa ngay |
| 27 | Test liệt kê action ghi, no-op khi chỉ đọc (F1) | **Item có giá trị nhất** — là cái ép thay cho trí nhớ | Trong 8.0: một hằng `ACTION_GHI` (tên action) trong `state.js`; test (a) gọi từng action khi `chiDoc` và khẳng định không đụng cổng `notes`/`channel`, (b) quét `taoStore` — action nào gọi cổng ghi mà không nằm trong `ACTION_GHI` thì đỏ. Không đụng adapter, không cần ngoại lệ. | Story 8.0 |
| 28 | Kiểm `luoi.js` `khiClick` (F4) | Chưa biết thật/giả; 7.1 làm khe này thành đường thường | Trong 8.0: thêm ca vào `thu-bo-cuc` (Tab tới mẩu bị cắt, Enter, đọc `document.activeElement`). Đỏ → đưa qua `veGiuTieuDiem` (neo `{ id, vaiTro: 'thân' }`) truyền callback từ `main.js`. Xanh → đóng item, gạch `deferred-work.md:180`. | Story 8.0 |
| 29 | Ngoại lệ test cho `kenh.subscribe` ở `main.js` (F5) | `main.js` không phải adapter — luật cấm là cho `app/adapters/` và khối trình duyệt giả | **Không mở ngoại lệ.** Thêm test quét mã nguồn (khuôn đã có trong repo): `main.js` gọi `taoBroadcast(` đúng một lần, và `channel:` + `kenh.subscribe(` dùng cùng một định danh. Bắt đúng lỗi đã nêu trong `deferred-work.md:208`. | Story 8.0 |
| 30 | Cân nhắc tách `state.js` (F1) | Tách 1675 dòng trước 8.1 là rủi ro cao, lợi ích chủ yếu đã do #27 lấy | **Quyết: không tách trước Epic 8.** Đóng có chủ đích kèm `note`. Mở lại nếu `state.js` vượt ~1900 dòng hoặc retro Epic 8 thấy gác sót. | quyết định |

## 3. Hướng xử lý

**Điều chỉnh trực tiếp**, hai phần:

- **Sửa ngay (#24, #25, #26)** — chỉ tài liệu, một commit `docs:`. Không đổi mã app nên **không bump
  `APP_VERSION`**: bump vô cớ làm mọi tab đang mở vào chế độ chỉ đọc.
- **Story 8.0 (#27, #28, #29)** — trước 8.1, commit `test:`/`fix:`, bump `APP_VERSION` chỉ khi #28
  đỏ và phải sửa `luoi.js`.
- **#30** đóng bằng quyết định.

Công sức: 8.0 cỡ nhỏ (hai test + một ca `thu-bo-cuc`, có thể một sửa nhỏ). Rủi ro thấp. Epic 8 lùi một story nhỏ.

## 4. Chi tiết thay đổi

### 4.1 Lệch F2 — năm chỗ

```
epics.md:1592 (Story 7.2)
OLD: **And** **mọi** action có ghi bị từ chối với `code = VERSION_SKEW` *(AD-18)*
NEW: **And** **mọi** action có ghi thành no-op — không xuống kho, không phát tin, không lời hứa nào
     bị từ chối; dải băng `VERSION_SKEW` (ưu tiên 1, không đóng được) nói thay *(AD-18, AD-21)*
```

```
epics.md:111 (AD-21), ARCHITECTURE-SPINE.md:436, solution-design.md:386, phan-chia-cong-viec.md:165
OLD: mọi action ghi trả / bị từ chối với `VERSION_SKEW`
NEW: mọi action ghi thành no-op, dải băng `VERSION_SKEW` nói thay
```

Lý do: khớp luật lõi "action không bao giờ bị từ chối" và spec 7.2 dòng 85; view không có chỗ nào bắt
lời hứa bị từ chối. Bảng `VERSION_SKEW` ở spine dòng 366/389 giữ nguyên.

### 4.2 `epics.md` — thêm Story 8.0 (chèn trước `### Story 8.1`)

```
### Story 8.0: Dọn action item retro Epic 7

As Nam, I want mọi action ghi mới bị ép gác chế độ chỉ đọc, so that Epic 8 không thể quên gác.

**Given** store ở chế độ chỉ đọc
**When** gọi lần lượt từng action trong `ACTION_GHI`
**Then** không cái nào đụng cổng `notes`/`channel`, không lời hứa nào bị từ chối
**And** một action gọi cổng ghi mà không có tên trong `ACTION_GHI` làm test đỏ *(retro E7 #27)*

**Given** `app/main.js`
**Then** `taoBroadcast(` xuất hiện đúng một lần, và cùng một định danh đi vào `channel:` lẫn
`.subscribe(` — kiểm bằng quét mã nguồn, không dựng kênh giả *(retro E7 #29)*

**Given** một mẩu bị cắt đang có tiêu điểm trên thân
**When** nhấn Enter (thu-bo-cuc, Chrome thật)
**Then** `document.activeElement` vẫn là thân mẩu đó, không phải `<body>` *(retro E7 #28)*
```

### 4.3 `sprint-status.yaml`

- Thêm `8-0-dọn-action-item-retro-epic-7: backlog` trước `8-1-…`.
- #24, #25, #26 → `done` sau commit docs; #30 → `done` với
  `note: "Dong co chu dich: khong tach state.js truoc Epic 8; #27 thay the. Mo lai neu >1900 dong hoac retro E8 thay gac sot."`
- #27, #28, #29 → `done` khi 8.0 xong.

### 4.4 PRD / UX

Không đổi.

## 5. Bàn giao

- **Phạm vi:** Moderate — sắp lại backlog (PO/Dev), không cần PM/Architect.
- **Dev:** (1) commit docs cho #24–26 (#26 qua `bmad-project-context`); (2) tạo spec 8.0 từ `epics.md`,
  làm trước 8.1.
- **Tiêu chí thành công:** không còn `epic-7-retro-*` nào `open`; `npm test` xanh; `thu-bo-cuc` chỉ đỏ
  ở ca chập chờn đã biết; spine, `epics.md` và mã nói cùng một nghĩa cho chế độ chỉ đọc.
- **Câu hỏi cho namtt:** (Q1) đồng ý "no-op + dải băng" là nghĩa đúng (#24)? (Q2) không mở ngoại lệ
  test, thay bằng quét mã nguồn (#29)? (Q3) không tách `state.js` trước Epic 8 (#30)?
