# Epic 5 Context: Sửa và xóa

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic này làm ghi chú đã có **sửa được tại chỗ** và **xóa được qua đúng một bước xác nhận**. Hai nhịp
click — click 1 mở rộng, click 2 vào chế độ sửa — không phải là chi tiết tương tác cho vui: nó là
thứ mua được sự an toàn cho hành trình đọc lại (đọc to biên bản cho sếp nghe) trong một sản phẩm
**không có hoàn tác, không có thùng rác, không lưu lịch sử sửa đổi**. Vì mọi thao tác ở đây đều phá
hủy và không lấy lại được, mỗi chi tiết của epic là điểm chịu lực chứ không phải tiện ích.

## Stories

- Story 5.1: Sửa nội dung tại chỗ
- Story 5.2: Ghi chú rỗng tự biến mất
- Story 5.3: Xóa qua hộp thoại xác nhận

## Requirements & Constraints

- **Sửa là tự do và tại chỗ**, ở mọi khung nhìn (mặc định, kết quả tìm, kết quả lọc ngày) — không có
  màn hình sửa riêng, không route thứ hai.
- **Thời điểm tạo bất biến, vị trí trong lưới bất biến.** Sửa nội dung không bao giờ đẩy mẩu giấy
  lên đầu — đó là cái neo của sản phẩm.
- **Không lưu lịch sử sửa đổi.** Lựa chọn có ý thức, không phải thiếu sót.
- **Xóa phải qua xác nhận**, và sau khi xác nhận thì **không có đường nào lấy lại từ trong app**.
- **Ngoại lệ duy nhất của quy tắc xác nhận:** ghi chú bị xóa sạch chữ rồi rời khỏi mẩu thì biến mất
  **không hỏi gì**. Không có ngoại lệ này thì mỗi lần lỡ tay để lại một mẩu giấy trắng vĩnh viễn.
- **Trần độ dài ký tự áp dụng nguyên vẹn ở chế độ sửa** — chế độ sửa là một trong ba cửa vào phải
  kiểm, ngang hàng với chốt bản nháp và nạp file. Vượt trần là lỗi, không cắt im lặng.
- **Không xóa hàng loạt, không chọn nhiều mẩu, không xóa theo ngày.** Ngoài phạm vi có chủ ý.
- **Hệ quả đã chấp nhận:** ghi chú đã xóa sẽ sống lại nếu nạp một file sao lưu cũ có chứa nó. Xóa
  không đụng tới các file đã xuất trước đó. Đừng "sửa" điều này bằng danh sách tombstone.

## Technical Decisions

- **Hai nhịp click là ràng buộc, không phải gợi ý.** Mẩu bị cắt: click 1 chỉ mở rộng, click 2 mới
  vào chế độ sửa. Mẩu không bị cắt (trong trần dòng thu gọn): click 1 đã là vào chế độ sửa. Hai nhịp
  không bao giờ nhập một. Con trỏ đặt đúng vị trí click.
- **Sửa nội dung đi theo luồng tự lưu:** state trong RAM đổi ngay theo từng phím, phép ghi đi sau
  với debounce của module hằng số. **Không nút Lưu, không chỉ báo "đã lưu"** — state không có trường
  nào mang nghĩa đó, nên view không có gì để vẽ.
- **Kỷ luật `seq` bắt buộc:** mỗi mục tiêu tự lưu (mỗi ghi chú đang sửa) mang một số đếm tăng dần;
  hẹn debounce nổ ra mà `seq` không còn hiện hành thì bị bỏ, không ghi. Cả action sửa-thành-rỗng lẫn
  action xóa **phải hủy hẹn đang treo của mẩu đó trước khi làm gì khác** — nếu không, một hẹn cũ hồi
  sinh nội dung đã xóa.
- **Thao tác đổi sự tồn tại (xóa) đi theo luồng ghi-trước-đổi-state-sau.** Adapter ném lỗi thì action
  dừng, state giữ nguyên, mẩu giấy vẫn còn trên màn hình. Giao diện không bao giờ giả vờ đã xong.
- **Hai trường dẫn xuất (dạng bỏ dấu và ngày địa phương) được tính lại ở mọi lần ghi**, bằng đúng
  hàm bỏ dấu và đúng module thời gian của core — không có nhánh tính riêng cho chế độ sửa.
- **Sửa và xóa im lặng tuyệt đối khi thành công.** Ngoại lệ duy nhất được chạm dải băng trong toàn
  sản phẩm là kết quả nạp file — không thuộc epic này.
- **Hộp thoại xác nhận là modal duy nhất của sản phẩm** và chỉ sâu một tầng. Nó phải giam focus
  trong nó, đặt focus mặc định vào lựa chọn **hủy**, và trả focus về đúng nút xóa vừa bấm khi đóng.
- **`Esc` hoặc click ra ngoài hộp thoại = hủy**, không bao giờ là xóa. `Esc` không có tác dụng nào
  khác trong sản phẩm.
- **Thứ tự tab bám đúng thứ tự DOM**, không `tabindex` dương; mỗi mẩu giấy là thân rồi tới nút xóa.
- **Mọi ngưỡng ở module hằng số và chỉ ở đó**; mọi màu lấy từ token, không giá trị màu viết thẳng.

## UX & Interaction Patterns

- **Chế độ sửa mượn ngôn ngữ vật liệu của ô soạn thảo:** nền mẩu đổi sang màu bề mặt, viền đổi sang
  token focus — mẩu giấy tạm "lún xuống" thành chỗ gõ.
- **Thoát chế độ sửa** khi focus rời mẩu: click ra ngoài hoặc `Tab`.
- **Nút xóa luôn hiện trên mọi mẩu, mờ nhạt**, chữ thường, gạch chân đứt, màu chữ tối thiểu. **Cấm
  hover-only** — vì không có phím tắt nào cho xóa, đây là đường xóa duy nhất nên nó phải nhìn thấy
  được. Hover/focus đổi sang màu cảnh báo.
- **Hộp thoại:** overlay tối nhẹ, hộp căn giữa cả hai chiều, bóng sâu — **bóng sâu duy nhất trong
  sản phẩm**, nên độ sâu đó chỉ có một nghĩa. Hai lựa chọn dạng chữ ngang hàng `hủy` · `xóa`, không
  nút màu đầy.
- **Microcopy đã chốt:** nút `xóa`; tiêu đề `Xóa ghi chú này?`; thân `Không có thùng rác và không
  hoàn tác được.`; hai lựa chọn `hủy` · `xóa`.
- **Xóa xong mẩu biến mất đột ngột, không hoạt ảnh vào/ra** — đánh đổi đã chấp nhận.
- **Bị cấm:** kéo-thả, chọn nhiều mẩu, menu ngữ cảnh, long-press, double-click cho bất cứ gì khác,
  hover-only affordance.

## Cross-Story Dependencies

- **Với Epic 2:** lưới mẩu giấy, trạng thái thu gọn/mở rộng (tầng C, mất sau tải lại) và click 1 đã
  có từ đó; epic này gắn nhịp thứ hai lên trên, không dựng lại lưới.
- **Với Epic 3:** sàn accessibility và cơ chế giam/trả focus của hộp thoại thuộc Epic 3 — Story 5.3
  **dùng** nó, không tự chế cơ chế riêng. Dải băng cũng đã có một chủ và một thứ tự ưu tiên.
- **Với Epic 1:** luồng ghi, kỷ luật `seq`, mô hình bản ghi, module thời gian, module bỏ dấu, module
  hằng số và tập mã lỗi đều đã có; epic này không được thêm hằng số hay nhánh tính toán mới.
- **Với Epic 4:** phép gộp theo định danh của nạp file làm ghi chú đã xóa sống lại — ràng buộc sử
  dụng đã được chấp nhận, không sửa.
- **Với Epic 6:** sửa phải chạy y hệt ở khung nhìn kết quả tìm và kết quả lọc ngày; khi Epic 6 xong,
  kịch bản đó phải được kiểm lại.
- **Trong epic:** 5.2 đứng trên hành vi tự lưu của 5.1; 5.3 độc lập với hai story kia nhưng chia
  chung kỷ luật hủy hẹn tự lưu.
