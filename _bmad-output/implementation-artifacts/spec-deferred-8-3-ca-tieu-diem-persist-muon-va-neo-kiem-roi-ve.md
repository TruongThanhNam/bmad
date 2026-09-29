---
title: 'Ca tiêu điểm cho persist muộn và neo kiemRoiVe trong thu-bo-cuc'
type: 'chore'
created: '2026-09-29'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hai chỗ nối trong `app/main.js` dùng `veGiuTieuDiem` mà khối "Story 8.1/8.2" của `tools/thu-bo-cuc.mjs` không đo tiêu điểm: `.then(() => veGiuTieuDiem(document, veTatCa))` sau `xinLuuTruBen` (dòng 513) và nhánh `undefined` của `kiemRoiVe` (dòng 428). Đổi chúng thành `.then(veTatCa)` trần hay neo `null` vẫn xanh. Đây là hai mục deferred của review Story 8.3 (lượt 1 và lượt 2).

**Approach:** Thêm ca chạy thật trong tab riêng đã có, focus phần tử của một mẩu (nút `xóa`, id + vai trò) trước khi nhả `persist(false)` / nhả `estimate` đổi dải băng, rồi khẳng định `activeElement` vẫn là đúng nút đó. Kèm một nhánh phụ giữ chữ gõ dở ở `#o-soan`. Mỗi ca phải đỏ khi chạy thử đột biến tương ứng, rồi hoàn nguyên. Không sửa mã sản phẩm.

</frozen-after-approval>

## Implementation Notes

- Focus `#o-soan` KHÔNG bắt được đột biến `.then(veTatCa)`: `veGiuTieuDiem` có `neo === undefined && dich === null` thì trả sớm, và lượt vẽ chung không gỡ `#o-soan`. Phần tử phải là thứ `replaceChildren` của lưới gỡ (nút `xóa` của mẩu), nên ca chính neo vào `.luoi > [data-mau=id] .mau-xoa`.
- Chỉ dùng stub đã duyệt (`persist`/`estimate`, `__nhaPersist`, `__nhaUoc`); không stub thêm gì.
- Không chạm `app/`, nên không bump `APP_VERSION`.
- Đã sửa: `tools/thu-bo-cuc.mjs` (ba ca "Deferred 8.3" trong khối 8.1/8.2), `deferred-work.md` (gạch hai mục).
- Đột biến (đã hoàn nguyên): `.then(veTatCa)` ở chỗ nối persist → ca persist-muộn đỏ; neo `null` ở `kiemRoiVe` → ca kiemRoiVe đỏ. `npm test` 1044 xanh; `thu-bo-cuc` 123/123 (hai lần chạy khác đỏ ca chập chờn đã biết, một lần thêm ca Story 7.1 theme, đều xanh lại).
- Bỏ qua lớp review Blind Hunter: thay đổi chỉ nằm ở harness và được đột biến kiểm trực tiếp.
