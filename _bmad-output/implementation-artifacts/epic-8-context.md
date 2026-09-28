# Epic 8 Context: Dung lượng — lưu trữ bền và cảnh báo trước ngưỡng

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Trình duyệt không lặng lẽ dọn dữ liệu, và Nam biết **trước** khi hết chỗ chứ không phải lúc phép ghi đã hỏng. Đây là phanh cuối của yêu cầu bền dữ liệu, và vì ngưỡng gần như không bao giờ nổ trên máy phát triển, nó dễ bị bỏ "để sau" nhất. Nửa cứng (không bao giờ tỏ ra đã lưu khi ghi thất bại, `QUOTA` lên dải băng) đã đúng từ Epic 1. Epic này thêm `persist()` và cảnh báo sớm (8.0–8.2, đã xong). Sau retro, epic được mở lại để trả ba món nợ ở tầng nối `main.js` mà trước đó chỉ được ghim bằng regex: 8.3 lái các chỗ nối 8.1/8.2 bằng trình duyệt thật trong `thu-bo-cuc`, còn 8.4 sửa những lượt vẽ bất đồng bộ làm rơi tiêu điểm hoặc vẽ trước khi kho nạp xong. Không có FR mới và không có Epic 9.

## Stories

- Story 8.0: Dọn action item retro Epic 7
- Story 8.1: Xin lưu trữ bền, và nói to hơn khi bị từ chối
- Story 8.2: Cảnh báo trước ngưỡng dung lượng
- Story 8.3: Khối kiểm dung lượng chạy thật trong thu-bo-cuc
- Story 8.4: Lượt vẽ bất đồng bộ không thả tiêu điểm, không vẽ trước kho

## Requirements & Constraints

- `persist()` được gọi ở **mọi** lần khởi động, kể cả khi đã được cấp. Không nhớ "đã thử", không dùng `persisted()` để bỏ qua. Bị từ chối thì đặt cờ `ghichu.persistDenied = '1'` và ngưỡng dòng nhắc sao lưu hạ từ 7 xuống 3 ngày. Được cấp lại thì xóa cờ và về 7 ngày. Lời xin không bao giờ đặt dải băng, không reject. Thành công thì im lặng.
- `estimate()` được đọc sau mỗi lần chốt, sửa, nạp lại, và cả sau **xóa** (xóa giải phóng chỗ, nên là đường tắt cảnh báo). Nó không chạy lúc khởi động. Cảnh báo khi `usage/quota ≥ QUOTA_WARN_RATIO` **hoặc** `quota - usage < QUOTA_WARN_FREE_BYTES`, và cả hai vế đều bắt buộc. `estimate()` chỉ dùng để cảnh báo, không bao giờ để quyết định có ghi hay không. Đường phát hiện thật vẫn là bắt `QuotaExceededError` → `QUOTA`.
- Cảnh báo (hàng 7) được miễn khỏi luật "ghi thành công tắt dải băng". Nó chỉ tắt khi lần kiểm đo dưới ngưỡng, khi Nam bấm `✕`, hoặc khi một hàng cao hơn thay nó. Đã bấm `✕` thì im tới hết phiên. `QUOTA` thật vẫn luôn hiện.
- Ghi thất bại trong luồng tự lưu không hoàn tác chữ đã gõ.
- Mỗi chỗ nối mới trong `main.js` phải có một ca `thu-bo-cuc` chạy thật, không chỉ một regex. Regex ghim hành vi phải được **thay** bằng ca chạy thật, không được nới cho vừa mã mới.
- Tiêu chí đóng epic: `npm test` xanh, `thu-bo-cuc` chỉ đỏ ở ca chập chờn đã biết, không còn action item retro Epic 8 nào mở, `core/state.js` không tăng dòng nào (đang sát ngưỡng tách file).

## Technical Decisions

- Hằng số nằm trong `core/limits.js`. Chỉ `adapters/quota.js` chạm `navigator.storage`, adapter chỉ được import từ `main.js` và không gọi vào view. State `persistDenied` đi theo kết quả `persist()`, không theo kho: ghi/xóa cờ hỏng thì nuốt lỗi, state vẫn đổi, không phát `session-changed`. Đây là ngoại lệ có chủ ý.
- Dải băng là một giá trị trong state với bảng ưu tiên đóng: 1 `VERSION_SKEW`, 2 `QUOTA` (không đóng được cho tới khi một phép ghi sau đó thành công), …, 7 cảnh báo trước ngưỡng (đóng được). Không có nguồn thứ tám. `view/banner.js` bỏ qua lượt vẽ khi dải băng không đổi.
- **8.3** chỉ chạm `tools/` và tài liệu. Khối "Story 8.1/8.2" chạy trong một tab riêng, đóng khi xong. Stub `navigator.storage.estimate` (và `persist` khi cần ép `false` hoặc resolve muộn) được cài bằng `Page.addScriptToEvaluateOnNewDocument`. Đây là ngoại lệ có tên đã được duyệt, không phải giấy phép dựng trình duyệt giả: không IndexedDB giả, không chạm `app/adapters/` hay hai file test adapter. Khối phải dọn `notes`, bản nháp và `localStorage` về như cũ (`DON_SACH`). Nguồn ca là script retro `kiem-e8.mjs`, đang nằm trong thư mục tạm, nên chép vào repo sớm. Không bump `APP_VERSION`, vì bump vô cớ đẩy mọi tab đang mở vào chỉ đọc. Một commit `test:`.
- **8.4** đổi hành vi chung của neo `undefined` trong `veGiuTieuDiem` (đã duyệt). Phép thử "tiêu điểm trong dải băng" chuyển vào nhánh neo `undefined`, dùng chung cho mọi chỗ gọi. Nếu `✕` bị gỡ thì tiêu điểm về `#o-soan`, nếu `✕` còn sống thì ở yên. `kiemRoiVe` gọi neo `undefined` trần. `CHON_DAI_BANG` vẫn khai một lần, dùng một lần. Lượt vẽ sau `xinLuuTruBen` chỉ chạy **sau** `khoiDong` (ví dụ `Promise.all`), để không lượt vẽ nào dựng lưới từ `notes = []` trước lượt đầu của kho. Bump `APP_VERSION`, một commit `fix:`.
- Các regex phải thay: `test/core-state-dung-luong.test.js:701` được thay bằng ca chạy thật `veGiuTieuDiem` trên gốc giả (`test/giu-tieu-diem.test.js`). `test/core-state-luu-tru-ben.test.js:306` được thay cho khớp đường mới, vẫn ghim "đúng một lời gọi, sau `khoiDong`, giữ tiêu điểm".
- Cập nhật AGENTS.md qua `bmad-project-context`. 8.3 ghi ngoại lệ stub cùng luật "chỗ nối mới → ca `thu-bo-cuc`". 8.4 sửa bẫy `veGiuTieuDiem` theo nghĩa mới của neo `undefined`.

## UX & Interaction Patterns

- Hàng 7: `Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.` Câu này không có con số phần trăm và có `✕`. Hết dung lượng thật: `Không lưu được — trình duyệt hết dung lượng. Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.`
- Dòng nhắc sao lưu nằm ở chân trang, không đi qua dải băng.
- Bàn phím là đường duy nhất: tiêu điểm không bao giờ được rơi về `<body>` khi dải băng đổi dưới tay người dùng. `Enter` trên `✕` thì đóng dải băng và tiêu điểm về `#o-soan`.
- Khung hình đầu không được nháy lưới rỗng. `document.title` không được mang số ghi chú khác N sau lượt vẽ đầu.

## Cross-Story Dependencies

- 8.3 phải xong trước 8.4. 8.4 dùng khối CDP có stub của 8.3 để ghi lại chuỗi `document.title` trước khi sửa, kết luận lỗi vẽ-trước-kho là thật hay giả và ghi kết luận vào spec, rồi chứng minh bản sửa tiêu điểm trên trình duyệt thật.
- 8.3 gạch `deferred-work.md:216` (persist resolve muộn vẫn hiện dòng nhắc, không cần tải lại) và `:230` (lần kiểm gỡ hàng 7 lúc `✕` đang giữ tiêu điểm) bằng `resolved:` trỏ về ca `thu-bo-cuc`.
- Epic dựa vào dòng nhắc sao lưu của Epic 4, đường lỗi `QUOTA` và bảng dải băng của Epic 1/3, và chế độ chỉ đọc cùng `ACTION_GHI` của Epic 7/8.0.
- Sau khi 8.4 xong, `epic-8` trở lại `done`. Không chạy retro lần hai.
