# Epic 4 Context: Sao lưu và khôi phục — UJ-3

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic này cho Nam lối thoát duy nhất khỏi kịch bản mất dữ liệu (`Clear browsing data`, IT cài lại
máy): xuất **toàn bộ** ghi chú ra một file nằm ngoài trình duyệt, và nạp file đó về theo lối gộp
nguyên tử, không bao giờ phá mất thứ đang có. Vì sao lưu là thủ công, epic còn dựng hai đường vào
thường trực ở chân trang và một dòng nhắc thụ động — đây là toàn bộ phanh an toàn của sản phẩm, nên
mọi chi tiết của nó đều là điểm chịu lực, không phải tiện ích.

## Stories

- Story 4.1: Chân trang với hai link thường trực
- Story 4.2: Xuất toàn bộ ra một file sao lưu
- Story 4.3: Nạp lại — hai pha, gộp theo định danh, nguyên tử
- Story 4.4: Dòng nhắc thụ động về lần sao lưu gần nhất

## Requirements & Constraints

- **Xuất là toàn bộ, luôn luôn.** File chứa mọi ghi chú, không phụ thuộc điều kiện lọc đang bật.
  Bản nháp chưa chốt **không** có trong file (nó chưa có thời điểm tạo).
- **Nạp là gộp, không bao giờ mất.** Đối chiếu theo `id`: đã có thì bỏ qua, chưa có thì thêm. Không
  xóa, không ghi đè. Thời điểm tạo gốc được giữ nguyên tuyệt đối — đó là cái neo của sản phẩm.
- **Hoặc tất cả, hoặc không gì.** Một file sai ở bất kỳ ghi chú nào bị từ chối toàn bộ, không ghi
  một byte nào, dữ liệu đang có không bị đụng tới.
- **Dữ liệu chỉ rời máy khi Nam chủ động bấm.** Không tự động xuất, không gửi đi đâu.
- **Hệ quả đã biết và được chấp nhận:** một ghi chú đã xóa sẽ sống lại nếu nó có trong file được
  nạp. Đây là cái giá của "gộp, không bao giờ ghi đè" — không được sửa bằng danh sách tombstone.
- **Hai link chân trang không bao giờ ẩn**, ở mọi trạng thái kể cả rỗng tuyệt đối trên máy mới, và
  **không phụ thuộc** dòng nhắc sao lưu — đúng lúc rủi ro cao nhất thì dòng nhắc chưa có gì để nói.
- **Dòng nhắc chỉ hiện khi đã quá ngưỡng**; hiện thường trực thì nó thành rác trên màn hình.

## Technical Decisions

- **File sao lưu là hợp đồng có phiên bản.** Hình dạng:
  `{ schemaVersion: 1, exportedAt: <ISO-8601 có offset>, notes: [{ id, createdAt, text }] }`.
  Hai trường dẫn xuất (ngày địa phương và dạng bỏ dấu) **không** nằm trong file — tính lại lúc nạp
  theo đúng quy tắc thời gian và quy tắc bỏ dấu của core. Tên file `ghi-chu-hang-ngay-YYYY-MM-DD.json`.
- **Nạp đi qua hai pha tách bạch:** (1) kiểm tra **toàn bộ** file trước khi ghi; (2) ghi trong
  **một transaction IndexedDB duy nhất**. Transaction hỏng giữa chừng (kể cả hết dung lượng) thì
  IndexedDB tự cuộn ngược — không để lại nửa file.
- **Điều kiện từ chối ở pha 1:** `schemaVersion` khác 1, JSON hỏng, thiếu trường bắt buộc,
  `createdAt` sai dạng ISO có offset, `id` trùng nhau trong file, `text` vượt trần ký tự.
- **Trần độ dài là ràng buộc của core, chặn ở mọi cửa vào** — file nạp là cửa thứ ba, ngang hàng
  với chốt bản nháp và sửa ghi chú. Vượt trần là lỗi, không cắt im lặng.
- **Mã lỗi thuộc tập đóng** và core ánh xạ mã sang microcopy; view không tự soạn câu chữ từ lỗi
  thô. Epic này dùng `BAD_FILE` (JSON hỏng, thiếu trường, `id` trùng, `createdAt` sai dạng),
  `BAD_VERSION` (sai `schemaVersion`), `TOO_LONG` (nội dung trong file vượt trần — ưu tiên dải băng
  ngang với lỗi nạp file, cao hơn khi cùng mã đến từ bàn phím).
- **Logic dựng file xuất, kiểm tra và gộp file nạp nằm trong lõi thuần** (`core/backup.js`),
  test được ở Node; mọi thao tác chọn/tải file đi qua port fileIO và adapter của nó.
- **Hàm gộp trả về `{ added, skipped }`** — hai con số thật mà microcopy bắt buộc phải có. Cấm view
  tự đếm lại.
- **Mốc sao lưu gần nhất là khóa bền dùng chung** (`ghichu.lastBackupAt` trong localStorage), cập
  nhật ở **cả hai** đường: lúc xuất thành công (bằng chính `exportedAt` vừa dựng) và lúc nạp (bằng
  `exportedAt` trong file, **chỉ khi** nó mới hơn giá trị đang có). Cả hai đường đều phát
  `session-changed` để các tab khác biết.
- **Phép trừ ngày là ngoại lệ được cấp phép của module thời gian** — dòng nhắc dùng `daysBetween()`
  của `core/time.js`, không tự tính bằng mili-giây.
- **Mọi ngưỡng nằm ở `core/limits.js` và chỉ ở đó**: ngưỡng dòng nhắc là `BACKUP_NUDGE_DAYS = 7`,
  hạ xuống 3 khi quyền lưu trữ bền bị từ chối.
- **Trong vòng đời `schemaVersion: 1`, cấm xóa hoặc đổi tên trường**; chỉ được thêm trường mới có
  mặc định an toàn khi vắng mặt, và mọi module đọc bản ghi phải chịu được trường lạ.

## UX & Interaction Patterns

- **Chân trang là tầng thứ tư của bố cục dọc cố định**, không cuộn: hai link `xuất sao lưu` ·
  `nạp lại`, rồi chỗ cho dòng nhắc sao lưu **cùng dòng**, nút theme đẩy sang góc phải.
- **Kiểu chữ và màu:** hai link và dòng nhắc đều dùng `{typography.foot}`, màu `{colors.ink-2}`;
  link gạch chân offset 2px. Dòng nhắc không nền, không viền, không nút tắt, không hộp thoại.
- **Xuất thì im lặng tuyệt đối** — file tải xuống là bằng chứng. Không toast, không dấu tích.
- **Nạp thành công là ngoại lệ duy nhất** của quy tắc im-lặng-khi-thành-công trong toàn sản phẩm:
  dải băng hiện `Đã nạp N ghi chú, bỏ qua M ghi chú đã có.`
- **Nạp thất bại:** `Không nạp được file này — sai định dạng hoặc file hỏng. Dữ liệu đang có KHÔNG
  bị đụng tới. Thử file sao lưu khác.`
- **Dòng nhắc:** `Lần sao lưu gần nhất cách đây 8 ngày.` — chữ số viết theo số ngày thật.
- **Dòng nhắc không đi qua dải băng** — nó là một dòng riêng ở chân trang.
- **Tab order:** … từng mẩu giấy → `xuất sao lưu` → `nạp lại` → nút theme.
- **Không có phím tắt nào cho sao lưu, nạp lại hay đổi theme.**

## Cross-Story Dependencies

- **Với Epic 1:** toàn bộ epic đứng trên kho IndexedDB, mô hình bản ghi, module thời gian (gồm
  `daysBetween`), module bỏ dấu, `core/limits.js`, tập mã lỗi, và kho phiên bền + `session-changed`.
- **Với Epic 3:** dải băng đã có một chủ và một thứ tự ưu tiên; Story 4.3 chỉ **đặt** thông báo vào
  đó, không dựng cơ chế mới, và phải tôn trọng quy tắc "ưu tiên thấp không thay ưu tiên cao".
  Nút theme ở chân trang cũng đã có — Story 4.1 chỉ hoàn thiện bố cục chân trang quanh nó.
- **Trong epic:** 4.1 dựng chỗ đứng cho 4.2, 4.3, 4.4. 4.4 phụ thuộc mốc `lastBackupAt` mà **cả**
  4.2 và 4.3 ghi ra; kịch bản nghiệm thu quan trọng nhất của 4.4 (khôi phục mốc nhắc trên máy mới)
  chỉ chạy được sau khi 4.3 xong.
- **Với Epic 5 (xóa):** cơ chế gộp của 4.3 làm ghi chú đã xóa sống lại — ràng buộc sử dụng đã được
  chấp nhận, đừng "sửa" nó khi làm Epic 5.
- **Với Epic 8 (dung lượng):** ngưỡng dòng nhắc hạ xuống 3 ngày khi quyền lưu trữ bền bị từ chối;
  và microcopy cảnh báo dung lượng chỉ thẳng Nam sang link `xuất sao lưu`.
