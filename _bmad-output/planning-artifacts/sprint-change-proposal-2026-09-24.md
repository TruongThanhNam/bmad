# Sprint Change Proposal — 2026-09-24

**Phạm vi:** Nhỏ (Developer tự làm) · **Story:** 6.2 Lọc theo một ngày cụ thể · **Trạng thái:** đã duyệt, đã làm

## 1. Vấn đề

Chưa lọc ngày (`dieuKien.date === null`). Người dùng gõ dở một chuỗi chưa hợp lệ vào ô ngày (vd `12/1`) rồi blur, viền lỗi bật lên. Sau đó người dùng chốt một ghi chú. `chotGhiChu` xóa điều kiện, nhưng `ve()` của ô ngày thoát sớm ở `app/view/khay-tim.js:145` vì `date` vẫn là `null` như trước. Ô vì thế giữ nguyên chữ sai và viền lỗi, trái với chú thích đầu file ("khi `chotGhiChu` xóa điều kiện, ô cũng về rỗng").

Lỗi này đã được ghi ở review triage #1 của Story 6.2, lúc đó bị reject với lý do "cần tín hiệu mới từ lõi/`main.js`". Nay lật lại quyết định đó.

## 2. Tác động

- **Epic/story:** chỉ Story 6.2. Không đụng PRD, kiến trúc (AD-15 giữ nguyên, không đổi hình dạng state) hay UX (hành vi mong muốn đã được mô tả sẵn).
- **Code:** `core/state.js` (`chotGhiChu` resolve `boolean`), `view/o-soan.js` (chuyển cờ), `view/khay-tim.js` (`xoaNhap`), `main.js` (`veSauChot`).
- **Deploy:** bump `APP_VERSION` 0.6.0 → 0.6.1.

## 3. Hướng chọn: điều chỉnh trực tiếp

Đã loại hai phương án:
- Gọi `xoaNhap()` sau mọi lần chốt: sai khi chốt thoát sớm (ô soạn rỗng, chữ vượt trần), vì khi đó điều kiện vẫn còn và ngày gõ dở phải được giữ.
- Thêm bộ đếm vào state: đổi hình dạng state, phải ghi thêm vào spine.

Phương án chọn: `chotGhiChu` trả cờ `true` khi đã đi tới `xoaHetDieuKien()` (kể cả khi ghi kho hỏng sau đó) và `false` khi thoát sớm.

## 4. Thay đổi chi tiết

| File | Trước | Sau |
|---|---|---|
| `app/core/state.js` | `chotGhiChu(): Promise<void>` | `Promise<boolean>`: `false` ở ba nhánh thoát sớm, `true` sau `xoaHetDieuKien()` |
| `app/view/o-soan.js` | `sauKhiChot()` | `sauKhiChot(daXoaDieuKien === true)` |
| `app/view/khay-tim.js` | trả `{ ve }` | trả `{ ve, xoaNhap }`; `xoaNhap` đặt ô ngày về `''`, tắt lỗi, đồng bộ `dateDaThay` |
| `app/main.js` | `noiOSoan(store, document, veTatCa)` | `veSauChot = (daXoaDieuKien) => { if (daXoaDieuKien) khayTim.xoaNhap(); veTatCa(); }` |
| `test/luoi.test.js` | ghim `noiOSoan` nhận đúng `veTatCa` | cho phép một bọc, miễn bọc đó gọi `veTatCa()` |

Test mới: `khay-tim.test.js` (chốt khi chưa lọc ngày; `xoaNhap` khi không có ô), `o-soan.test.js` (cờ `false` khi ô trống, `true` khi chốt thật). Hai ca `core-state.test.js` đổi từ `toBeUndefined` sang `toBe(true)`.

## 5. Bàn giao

Developer làm trực tiếp, một commit `fix:` lên `main`. Tiêu chí xong: `npm test` xanh (838/838). Checklist tay: gõ `12/1` vào ô ngày, Tab ra, gõ một ghi chú rồi `Ctrl+Enter` → ô ngày rỗng, viền lỗi tắt. Bấm `Ctrl+Enter` trên ô soạn trống → ô ngày giữ nguyên.
