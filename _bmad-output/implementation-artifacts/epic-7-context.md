# Epic 7 Context: Đa tab và lệch phiên bản

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Hai tab mở song song không ghi đè nhau, không ăn bản nháp của nhau, và tab nào còn chạy mã cũ sau một lần deploy thì hỏng ồn ào (vào chế độ chỉ đọc) chứ không hỏng im lặng. Nam để app mở cả ngày nên hai tab là chuyện thường. Nửa chống mất dữ liệu đã xong ở Epic 1 (RAM không bao giờ là nguồn sự thật cho phép ghi; bản nháp khóa theo `tabId` + khóa sống `navigator.locks`), nên epic này mua **sự tươi mới của màn hình**, không mua an toàn dữ liệu — thiếu nó, tab thứ hai chỉ hiển thị cũ tới khi F5. Story 7.0 (dọn action item retro Epic 4–6, gồm gộp trả tiêu điểm và gộp đường xóa điều kiện) **đã xong**; việc còn lại là 7.1 và 7.2.

## Stories

- Story 7.0: Dọn action item retro Epic 4–6 *(đã xong)*
- Story 7.1: Đồng bộ ghi chú giữa các tab
- Story 7.2: Phát hiện lệch phiên bản và chế độ chỉ đọc

## Requirements & Constraints

- Ghi chú tạo/sửa/xóa/nạp ở tab này hiện ở tab kia không cần F5. Bản nháp của một tab không bao giờ phát tin, không bao giờ bị tab khác đọc/ghi/xóa khi tab chủ còn sống.
- Hai tab dùng song song là **im lặng**: cấm khóa tab, cấm dải băng "đóng tab này". Yêu cầu nhiều-tab được thỏa bằng cơ chế, không bằng cảnh báo.
- Đang sửa một mẩu ở tab A mà tab B xóa đúng mẩu đó: chữ đang gõ **không được mất im lặng** — tab A nói ra bằng dải băng. Cách xử lý và microcopy do spec 7.1 chọn (hôm nay lưới gác "đang sửa thì không vẽ lại", nên đây là đường mất chữ thật khi có đa tab).
- Tab nhận `appVersion` khác của mình → chỉ đọc ngay: mọi action có ghi bị từ chối với `VERSION_SKEW`, mọi hẹn tự lưu bị hủy. Chỉ-đọc, **không** phải chỉ-cảnh-báo — mã cũ còn ghi được thì RAM lỗi thời của nó đè lên bản ghi do mã mới viết.
- Giới hạn chấp nhận (n = 1): tab cũ chỉ biết mình cũ khi có tab mới phát tin; deploy mà không mở tab mới thì tab cũ không biết. README ghi rõ cạnh checklist deploy.
- Mỗi story một commit tiếng Việt, bump `APP_VERSION` trong `core/limits.js`.

## Technical Decisions

- **Một kênh duy nhất** `BroadcastChannel('ghichu')` trong `adapters/broadcast.js`; tên kênh cố định vĩnh viễn.
- **Bản tin đúng bốn trường:** `{ v: 1, type, from: <tabId>, appVersion: <APP_VERSION> }`; `type` chỉ `notes-changed` | `session-changed`. Không bao giờ mang nội dung — tab nhận đọc lại từ kho bền.
- `notes-changed` phát sau **mọi** lần ghi thành công vào store `notes` (chốt, sửa, xóa, nạp file). `session-changed` khi theme hoặc mốc sao lưu đổi. Thứ tự bắt buộc: ghi IndexedDB → đổi state/render → phát tin. Tab bỏ qua tin có `from` bằng `tabId` của mình.
- Nhận `notes-changed` → đọc lại toàn bộ IndexedDB rồi render; đây là chỗ đọc IndexedDB **thứ hai và cuối cùng** (ngoài khởi động). Không đụng bản nháp của tab nhận. Mọi phép ghi vẫn đọc/ghi trên IndexedDB, không dựa vào mảng RAM.
- `VERSION_SKEW` do `core/state.js` ném; thuộc tập mã lỗi đóng; dải băng ưu tiên 1, không đóng được. Bảng dải băng đóng (7 nguồn): muốn thêm nguồn/`code` mới (ví dụ cho ca "mẩu đang sửa bị tab khác xóa") phải sửa bảng ưu tiên và tập mã lỗi **trước**, cùng lúc, không tái dùng `code` sẵn có cho nghĩa khác.
- Bản ghi `notes` chỉ được nới, không thu hẹp; mọi module đọc chịu được trường lạ — nên tab cũ đọc bản ghi mới tệ nhất là hiển thị thiếu trường.
- Tầng: adapter không đổi state, không gọi vào view; `main.js` là nơi duy nhất nối adapter (adapter thật đứng sau `...congTam()`). Dự án không có cơ chế subscribe cho view — vẽ lại theo tin đến phải nối tay trong `main.js`.
- Lượt vẽ do tin đến phải đi qua `veGiuTieuDiem(goc, veTatCa, neo)`; mọi đường xóa điều kiện mới (nếu có) gọi `xoaHetDieuKienVaNhap()`, không gọi riêng nửa nào.
- **Việc hoãn "về Epic 7" mà spec 7.1 phải quyết:**
  - `subscribe` của `broadcast.js` chưa có đường gỡ bộ nghe/đóng kênh.
  - Chưa có chiều **nhận** `session-changed`: mốc `lastBackupAt` (và theme) trong state lệch khỏi kho khi tab khác đổi; nhánh trả sớm của `ghiMocSaoLuuMoiHon` giữ mốc cũ.
  - `phatPhienDoi()` không bọc `publish` — cổng kênh ném làm action "không bao giờ bị từ chối" bị từ chối; nên bọc một lần cho mọi chỗ phát.
  - Phép nạp đọc `readAll` rồi `replaceAll` bằng hai lời gọi tách rời: phép ghi từ tab khác chen giữa sẽ bị xóa; đóng hẳn cần phương thức cổng đọc-và-ghi trong cùng transaction.
  - Hàng chip `replaceChildren` mỗi lượt vẽ: tiêu điểm đang ở `về hôm nay` rơi về `<body>` khi có lượt vẽ bất đồng bộ — tin tab khác biến nó thành đường thường. Chọn: hàng chip gác khi đang có tiêu điểm, hoặc `veGiuTieuDiem` nhận thêm vai trò ngoài lưới.

## UX & Interaction Patterns

- Hai tab song song: không có gì để nói. Lệch phiên bản: ồn ào, dải băng không đóng được, microcopy nguyên văn `Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.`
- Dải băng một hình dạng cho mọi loại, đẩy nội dung xuống; thông báo ưu tiên thấp không thay thông báo ưu tiên cao đang hiện. Thành công luôn im lặng — đồng bộ từ tab khác không được bật chỉ báo nào.
- Tab title luôn là số ghi chú của hôm nay (không theo điều kiện đang bật), nên phải đúng ngay sau khi đồng bộ.
- Vẽ lại do tab khác không làm tiêu điểm rơi sai chỗ (thân / nút `xóa` / ô sửa giữ nguyên; mẩu mất thì về `#o-soan`).

## Cross-Story Dependencies

- 7.2 dựa trên kênh, bản tin và chiều nhận của 7.1 (`appVersion` đi trong mọi bản tin; chỗ xử lý tin đến là nơi phát hiện lệch).
- 7.1 dựa vào kết quả 7.0: hàm trả tiêu điểm hợp nhất `veGiuTieuDiem` và hàm xóa điều kiện chung `xoaHetDieuKienVaNhap()`.
- Dựa vào Epic 1 (luồng ghi, khóa bản nháp theo `tabId`), Epic 3 (dải băng, bảng ưu tiên, `errors.js`), Epic 4 (nạp/xuất sao lưu, mốc sao lưu), Epic 5 (chế độ sửa, hộp thoại xóa), Epic 6 (khối điều kiện, khay tìm, hàng chip).
