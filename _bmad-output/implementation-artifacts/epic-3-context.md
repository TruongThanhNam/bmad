# Epic 3 Context: Dải băng thông báo, sàn accessibility, và nút theme

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic này dựng **hạ tầng để sản phẩm nói khi có chuyện xấu**, và dựng **sàn accessibility** mà không epic nào khác nhận. Sau Epic 2, Nam đã ghi được và xem được ghi chú hôm nay — nhưng app vẫn **không có chỗ nào để nói** khi hết dung lượng, khi kho dữ liệu hỏng, khi nạp file thất bại, khi vượt trần ký tự. Epic 3 tạo ra **đúng một ô** đó, với **đúng một** thứ tự ưu tiên cho cả bảy nguồn, và tạo ra **trước khi** những nguồn ấy xuất hiện — vì bốn epic sau (nạp file, xóa, đa tab, dung lượng) nếu thiếu nó sẽ mỗi epic tự chế một chỗ nói riêng, đúng kiểu hỏng mà kiến trúc viết ra để chặn. Epic này gần như **không thêm tính năng nào Nam nhìn thấy trực tiếp** — trừ nút theme, nằm ở đây vì đây là chỗ duy nhất bảng dark thật sự được nghiệm thu tương phản thay vì chỉ được khai báo.

**Nhân vật.** Vẫn đúng một người dùng — **Nam** — cũng là người xây.

## Stories

- Story 3.1: Dải băng — một chủ, bảy nguồn, một thứ tự ưu tiên
- Story 3.2: Focus ring và thứ tự tab
- Story 3.3: Nút theme và tương phản ở cả hai bảng màu
- Story 3.4: Phóng to, chuyển động, và màu không phải tín hiệu duy nhất

## Requirements & Constraints

- **Một dải băng duy nhất, một hình dạng duy nhất.** Ở đỉnh trang, **đẩy nội dung xuống chứ không phủ lên**; không bóng; **không biến thể màu theo loại lỗi** — lỗi dung lượng và kết quả nạp file dùng chung đúng một hình dạng.
- **Bảy nguồn, thứ tự ưu tiên bất biến:** lệch phiên bản → hết dung lượng → kho dữ liệu hỏng → nạp file thất bại → vượt trần khi gõ/sửa → nạp file thành công → cảnh báo trước ngưỡng dung lượng. Thông báo ưu tiên thấp **không bao giờ** thay được thông báo ưu tiên cao đang hiện. Hai ưu tiên đầu **không đóng được**; phần còn lại đóng được.
- **Bảng phải đủ bảy nguồn ngay từ epic này**, dù bốn nguồn chưa có người phát. Thêm nguồn thứ tám là **sửa bảng trước, không phải sau**.
- **Không thất bại im lặng, nhưng cũng không nói khi thành công.** Ngoại lệ duy nhất được phép báo thành công là kết quả một lần nạp file; xuất sao lưu, chốt, sửa, xóa vẫn im lặng tuyệt đối.
- **Không bao giờ hiển thị chuỗi lỗi thô của trình duyệt.** Mọi lỗi hiện ra bằng microcopy tiếng Việt đã ánh xạ sẵn từ mã lỗi; view không tự soạn câu chữ. Voice: khô, trực tiếp, không dấu chấm than, không emoji, không "bạn", không xin lỗi. Lỗi phải nói rõ **việc cần làm**.
- **Hai ngoại lệ không đi qua dải băng:** dòng nhắc sao lưu (ở chân trang) và lỗi định dạng ô ngày (tại chỗ dưới ô ngày).
- **Focus ring nhìn thấy được trên mọi phần tử tương tác**, ≥ 3:1 so với nền. `outline: none` **bị cấm tuyệt đối**.
- **Sản phẩm có đúng bốn phím:** `Ctrl+Enter`, `Enter`, `Esc`, `Tab`/`Shift+Tab`. `/`, `Ctrl+K`, và mọi phím tắt cho xóa/sao lưu/theme đều **không có tác dụng** — đây là cố ý, và chính vì thế focus ring là bản đồ di chuyển duy nhất.
- **Tương phản ≥ 4.5:1 ở cả light và dark.** Chữ nhỏ nhất dùng token `ink-2`; `ink-decor` **không bao giờ là chữ**. Cặp `danger` trên `chip-bg` ở dark chỉ **4.55:1** — gần như không còn biên; phải ghi cảnh báo tại chỗ rằng ai đổi `chip-bg-dark` phải tính lại cặp này trước khi commit.
- **Phóng 200% vẫn dùng được:** lưới rớt về 1 cột, không chữ bị cắt, không điều khiển bị đẩy ra ngoài khung. (Đây là mục sàn a11y **yếu bằng chứng nhất**; nếu epic phình ra thì đây là mục đầu tiên được hạ — **không phải** focus ring.)
- **Mặc định là không có chuyển động.** Chuyển màu hover/focus ≤ 120ms khi được phép; khi người dùng tắt hiệu ứng thì **bỏ luôn cả chuyển màu**. Không hoạt ảnh vào/ra lưới — mẩu bị xóa biến mất đột ngột, đánh đổi đã chấp nhận.
- **Màu không bao giờ là tín hiệu duy nhất.** Ô ngày sai định dạng: viền `danger` **cộng** thông báo chữ. Chip điều kiện: có **chữ**, không chỉ đổi viền. Mọi điều khiển chỉ có ký hiệu (`✕`, icon lịch) phải mang nhãn chữ.
- **Tương tác bị cấm tuyệt đối:** kéo-thả sắp xếp, chọn nhiều mẩu, menu ngữ cảnh, long-press, cuộn vô hạn, hover-only affordance.

## Technical Decisions

- **Dải băng có đúng một chủ.** Nó là **một** giá trị trong state phù du (tầng C), do action đặt, do `app/view/banner.js` vẽ. `banner.js` là nơi **duy nhất** vẽ dải băng; không module nào khác ghi thẳng vào DOM của nó.
- **Bảng ưu tiên là dữ liệu khai báo trong `banner.js`**, nên nó **nghiệm thu được bằng test trên chính bảng đó** — không cần đợi nguồn thật (nạp file, lệch phiên bản, cảnh báo dung lượng) xuất hiện ở các epic sau.
- **Mã lỗi là từ vựng chung của core và view.** Tập mã đóng đã có từ epic nền; ánh xạ mã → microcopy nằm ở `core/errors.js`. View chỉ tra bảng và hiển thị. Không thêm mã mới trong epic này.
- **State không có trường nào mang nghĩa "đang lưu"/"đã lưu"/"chưa chốt"** — nên view không có gì để vẽ ra. Dải băng không phá luật này: nó chỉ mang chuyện xấu (cộng một ngoại lệ nạp file).
- **Theme là hàm của state, không phải hiệu ứng lề.** Lựa chọn lưu ở `ghichu.theme`; đọc lại bằng một script **đồng bộ, nội tuyến trong `<head>` của `index.html`**, đặt thuộc tính lên `<html>` **trước lần vẽ đầu tiên** — đây là ngoại lệ kiến trúc duy nhất được phép nằm ngoài `app/`. Đổi theme cũng phát tín hiệu phiên đổi cho các tab khác.
- **Token là chỗ duy nhất tỉ lệ tương phản đã được tính.** `style.css` **không có một giá trị màu viết thẳng nào** ngoài phần khai báo token. Đây là cách ràng buộc ≥ 4.5:1 được *dựng* thay vì được *nhớ*.
- **Thứ tự tab bám đúng thứ tự DOM; không `tabindex` dương ở bất kỳ đâu.** Đó là thứ bảo đảm các điều khiển của epic sau (nút xóa, hai link sao lưu, `về hôm nay`) **tự vào đúng chỗ** khi xuất hiện — nên quy tắc đứng ở đây, không rải ra từng epic sau.
- **Mọi `transition`/`animation` nằm trong đúng một khối `@media (prefers-reduced-motion: no-preference)`.** Chuyển động là thứ được **thêm vào**, không phải thứ bị gỡ ra — grep được, nên nghiệm thu được.
- **Bố cục dùng đơn vị tương đối và grid `auto-fill`**, không `px` cứng cho chiều rộng vùng chứa.
- **Vẫn không bước build, không bundler, không thư viện runtime, không webfont/icon font, không request mạng sau khi tải.**

## UX & Interaction Patterns

- **Dải băng:** nền token `chip-bg`, viền dưới token `rule`, không bóng. Nút đóng là dấu `✕` màu `ink-2`, mang nhãn chữ `đóng thông báo`. Khi có dải băng, `✕` là phần tử **đầu tiên** trong thứ tự tab.
- **Thứ tự tab đầy đủ (mục tiêu cuối):** `✕` dải băng → ô soạn thảo → ô tìm kiếm → ô ngày → icon lịch → `về hôm nay` → từng mẩu giấy trái-sang-phải (thân rồi nút xóa) → `xuất sao lưu` → `nạp lại` → nút theme. Nghiệm thu ở epic này chỉ trên các phần tử **đã tồn tại**.
- **Nút theme ở góc phải chân trang:** nhãn **chữ** — `nền tối` khi đang sáng, `nền sáng` khi đang tối — viền mảnh bo tròn hoàn toàn. **Không icon mặt trời/mặt trăng.**
- **Không hover-only affordance** ở bất kỳ đâu: mọi điều khiển hiện sẵn (mờ nhạt nếu cần), không chờ chuột.

## Cross-Story Dependencies

- **Phụ thuộc Epic 1:** tập mã lỗi đóng + ánh xạ microcopy ở `core/errors.js`, khối state (tầng phù du cho giá trị dải băng), và hai bảng token light/dark. Epic 3 **không được** định nghĩa lại bất kỳ thứ nào trong số đó — bảng dark đã tồn tại từ epic nền; epic này chỉ là chỗ đầu tiên nó **với tới được** và được nghiệm thu.
- **Phụ thuộc Epic 2:** bốn tầng cố định và lưới đã có mặt, nên Story 3.2 (thứ tự tab) và 3.4 (phóng 200%) có phần tử thật để nghiệm thu; Story 3.1 cần dải băng chèn được ở đỉnh mà **đẩy** ba tầng dưới xuống.
- **Trong epic:** Story 3.1 dựng dải băng mà 3.2 tính là phần tử tab đầu tiên. Story 3.3 (theme) phải có trước phần nghiệm thu tương phản ở cả hai bảng; 3.4 nghiệm thu trên toàn bộ `style.css` nên đi sau 3.3 để không phải đo lại.
- **Epic sau phụ thuộc epic này — không được tự chế chỗ nói:** Epic 4 (kết quả và lỗi nạp file), Epic 5 (giam focus + trả focus cho hộp thoại xóa — hạ tầng ở đây, hộp thoại ở đó), Epic 7 (lệch phiên bản), Epic 8 (cảnh báo dung lượng) đều **phải** dùng dải băng của epic này.
- **Ranh giới cố ý — không kéo về:** bốn nguồn chưa có người phát chỉ tồn tại trong bảng ưu tiên, không có code phát; hộp thoại xác nhận xóa là của Epic 5 (epic này chỉ dựng quy tắc giam/trả focus); ô tìm kiếm, ô ngày, `về hôm nay` và hai link sao lưu chỉ được tính vào thứ tự tab **khi chúng đã tồn tại**.
