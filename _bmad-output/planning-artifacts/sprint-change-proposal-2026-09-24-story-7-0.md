---
date: 2026-09-24
trigger: epic-6-retro-2026-09-24.md — action item 5 (epic-6-retro-item-23), lặp lại epic-5-retro-item-18
mode: batch (phiên không tương tác)
scope: moderate — thêm một story vào backlog Epic 7, không đổi PRD/UX
status: đã áp dụng vào epics.md và sprint-status.yaml; bốn quyết định ở §4.3 theo khuyến nghị, namtt duyệt cùng spec 7.0 ngày 2026-09-24
---

# Sprint Change Proposal — Story 7.0: dọn action item retro Epic 4–6

## 1. Tóm tắt vấn đề

Ba retro liên tiếp kết luận cùng một điều: action item retro không có chỗ trong vòng làm story.
Sau Epic 5 còn 8/9 item Epic 4 chưa làm; sau Epic 6, chỉ 1/8 item Epic 5 xong. Tính đến hôm nay
`sprint-status.yaml` còn **17 item `open`** (Epic 4: 2–9; Epic 5: 11, 12, 14–18; Epic 6: 21–23).

Hai item đụng thẳng vào Story 7.1 (đồng bộ tab):
- **Epic 5 #11 (B2, major):** ba hàm trả tiêu điểm (`traTieuDiem`, `veGiuTieuDiem`, `dongRoiVe`)
  lui về thân mẩu thay vì phần tử đang focus. 7.1 thêm một nguồn vẽ lại mới (bản tin từ tab khác),
  nên lỗi này sẽ bị kích hoạt thường xuyên hơn.
- **Epic 6 #21 (A1):** hai đường xóa điều kiện (`veHomNay`, `veSauChot`) phải nhớ gọi
  `khayTim.xoaNhap()`. Nếu 7.1 thêm đường thứ ba mà quên, sẽ không test nào đỏ.

Ngoài ra, **Epic 5 #17 (B4)** yêu cầu đưa ca "đang sửa một mẩu mà tab khác xóa nó" vào phạm vi
Epic 7, nhưng `epics.md` chưa có dòng nào nói về ca này.

## 2. Phân tích tác động

| Artefact | Tác động |
|---|---|
| PRD | Không đổi. |
| Epics (`epics.md`) | Thêm Story 7.0 ở đầu Epic 7; thêm một AC B4 vào Story 7.1. |
| Architecture spine | Chỉ đổi nếu namtt duyệt Q3 (hợp thức hóa `luoi → mau-giay`); việc sửa nằm trong 7.0. |
| UX (`EXPERIENCE.md`) | Chỉ đổi nếu namtt duyệt Q1 (sửa `tám ngày` → chữ số); việc sửa nằm trong 7.0. |
| `sprint-status.yaml` | Thêm khóa `7-0-…: backlog`; đóng `epic-4-retro-item-8` (namtt đã xác nhận chạy tay trong retro Epic 5). |
| Mã | `app/main.js`, `app/core/backup.js`, có thể `app/core/state.js` (Q2), test, `tools/thu-bo-cuc.mjs`, README. Bump `APP_VERSION` 0.7.1 → 0.7.2. |

## 3. Hướng xử lý đề xuất

**Điều chỉnh trực tiếp:** thêm Story 7.0 trước 7.1. Không cần rollback hay xem lại MVP.
Công sức ước lượng: khoảng một story cỡ vừa (phần lớn là test và đổi tên, chỉ #11 là thay đổi hành vi).
Rủi ro thấp; phần dễ vỡ nhất là việc hợp nhất trả tiêu điểm (#11), và phần này phải có test chạy
thật thay cho test regex. Lịch Epic 7 bị lùi đúng một story.

## 4. Chi tiết thay đổi

### 4.1 `epics.md` — thêm Story 7.0 (chèn ngay trước `### Story 7.1`)

Nguyên văn nằm trong `epics.md`. Nó phân loại action item như sau:

| Nhóm | Item | Trong 7.0 |
|---|---|---|
| Chặn 7.1 | E5#11, E6#21 | bắt buộc |
| Test/đổi tên nhỏ | E4#3, #4, #5, #6, #7 | bắt buộc |
| Kiểm trình duyệt | E5#12, E6#22 | bắt buộc (`thu-bo-cuc`) |
| Tài liệu | E5#16 | bắt buộc |
| Quyết định | E4#2, E4#9, E5#14, E5#15 | ghi quyết định, rồi làm theo nó |
| Đóng bằng chính thay đổi này | E5#17 (qua AC 7.1), E5#18 + E6#23 (qua Story 7.0) | — |
| Đã xong, chỉ đổi status | E4#8 | `done` ngay |

### 4.2 `epics.md` — Story 7.1, thêm AC (B4, Epic 5 #17)

```
OLD: (không có)
NEW:
**Given** Nam đang sửa một mẩu ở tab A và tab B xóa đúng mẩu đó
**When** tab A nhận `notes-changed`
**Then** chữ đang gõ **không mất im lặng** — tab A nói ra bằng dải băng, không phải lưới lặng lẽ bỏ mẩu *(retro Epic 5 B4)*
```
Lý do: đây là đánh đổi đã biết ở Epic 5 ("đang sửa thì lưới không vẽ lại"). Khi có đa tab, nó thành
đường mất chữ thật. Chọn cách xử lý và microcopy trong spec 7.1; AC chỉ chốt rằng việc mất chữ
không được xảy ra âm thầm.

### 4.3 Quyết định namtt cần chốt (khuyến nghị in đậm)

- **Q1 — E4#2:** **giữ chữ số `8 ngày`**, sửa bốn nguồn spec. Cách này khớp với hàng 6 của dải băng.
- **Q2 — E5#14:** **chặn lưu chữ rỗng ở `tuLuuNoiDung`**, để đường xóa của 5.2 là nơi duy nhất
  xử lý ghi chú rỗng. Cách còn lại là dọn ghi chú rỗng lúc tải trang.
- **Q3 — E5#15:** **hợp thức hóa `luoi → mau-giay`** trong ARCHITECTURE-SPINE như một ngoại lệ
  cha–con có tên, và ghi vào AGENTS.md.
- **Q4 — E4#9:** **đóng có chủ đích** retro Epic 1–3 (ghi lý do vào sprint-status, không chạy bù).

Nếu namtt chọn khác, chỉ cần sửa dòng tương ứng trong AC của Story 7.0.

### 4.4 Ngoài phạm vi, ghi lại để khỏi rơi

Retro Epic 4 F1 (có phép ghi chen giữa `readAll`/`replaceAll` khi nạp) và F2 (cửa thứ ba của
`readChosenFile` cướp lượt) đã bị hoãn "về Epic 7". Chúng không phải action item nên không nằm
trong 7.0. Spec 7.1 nên quyết có đóng F1 hay không, vì phép ghi chen từ tab khác làm cửa sổ này rộng ra.

## 5. Bàn giao

- **Phạm vi:** Moderate. Backlog được sắp lại (PO/Dev), không cần PM/Architect.
- **Dev:** tạo spec cho `7-0` từ `epics.md`, làm xong trước 7.1, commit một lần kiểu
  `chore: dọn action item retro Epic 4–6 (Story 7.0)`, bump `APP_VERSION`, rồi đặt từng action item
  sang `done` trong `sprint-status.yaml`.
- **Tiêu chí thành công:** không còn action item `epic-4/5/6-retro-*` nào `open` (trừ item
  namtt chủ động hoãn và có ghi lý do); `npm test` xanh; `thu-bo-cuc` chỉ đỏ ở ca đỏ đã biết trong AGENTS.md.
- **Quy trình:** retro Epic 7 kiểm lại xem Epic 8 có mở đầu bằng story 8.0 cùng khuôn không.
