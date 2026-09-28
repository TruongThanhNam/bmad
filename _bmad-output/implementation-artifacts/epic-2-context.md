# Epic 2 Context: Ghi nhanh và dòng ghi chú hôm nay — UJ-1 trọn vẹn

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic này biến cái nền đã dựng ở Epic 1 thành **một sản phẩm dùng được thật hàng ngày**: Nam mở tab, con trỏ đã nằm sẵn trong ô soạn thảo, gõ, bấm `Ctrl+Enter`, và mẩu giấy nhô lên ở ô trên-cùng-trái của lưới hôm nay. Toàn bộ hành trình UJ-1 — từ "có một ý nghĩ" tới "ý nghĩ đó đã nằm an toàn" — phải trọn vẹn sau epic này, thuần bàn phím, không một nút "Lưu" nào. Epic này cũng chốt hình dạng vĩnh viễn của màn hình: bốn tầng cố định, một vùng cuộn duy nhất, một lưới không breakpoint, và một ngôn ngữ vật liệu phân biệt "chỗ đang viết" với "thứ đã ghi". Đây là epic đầu tiên có giao diện thật, nên nó cũng là nơi lời hứa **im lặng khi thành công** lần đầu được kiểm chứng bằng mắt.

## Stories

- Story 2.1: Bốn tầng cố định trên nền bàn
- Story 2.2: Ô soạn thảo sẵn con trỏ, chữ tự lưu
- Story 2.3: Chốt bản nháp thành ghi chú
- Story 2.4: Lưới ghi chú của hôm nay
- Story 2.5: Mẩu giấy — hình dạng, giờ tạo, cắt và mở rộng
- Story 2.6: Trạng thái rỗng và tab title

**Nhân vật.** Sản phẩm có đúng một người dùng — **Nam** — và anh cũng là người xây. Mọi story trong epic này có người thụ hưởng là Nam-người-dùng.

## Requirements & Constraints

- **Khoảng cách tới chỗ gõ bằng không.** Trang tải xong là con trỏ đã ở trong ô soạn thảo; không nút "Tạo mới", không chọn loại/nơi lưu/định dạng, không màn hình chờ, không splash, không skeleton.
- **Không có nút "Lưu" ở bất kỳ đâu.** Bản nháp tự ghi xuống kho bền trong vòng ngưỡng tự lưu, tổng khoảng cách ≤ 1 giây. Bản nháp sống qua đóng tab đột ngột và khởi động lại máy, bất kể bao nhiêu ngày, và trở lại **nguyên trạng** trong ô soạn thảo.
- **`Ctrl+Enter` chốt, `Enter` xuống dòng.** Chốt xong ô trống lại và con trỏ **vẫn ở trong đó**. Bản nháp rỗng thì `Ctrl+Enter` **không làm gì cả** — không tạo, không báo lỗi, không nhấp nháy.
- **Dấu thời gian là thời điểm chốt**, không phải lúc bắt đầu gõ: gõ dở đêm hôm trước, chốt sáng hôm sau thì ghi chú thuộc ngày hôm sau.
- **Khung nhìn mặc định chỉ có hôm nay.** Có 1.200 ghi chú trong máy mà hôm nay 4 cái thì lưới có đúng 4 mẩu; chiều dài lưới không phụ thuộc tổng số ghi chú trong máy.
- **Thứ tự là bất biến.** Luôn giảm dần theo khóa sắp xếp; không có cách nào đổi thứ tự. Mẩu mới nhất ở ô trên-cùng-trái, mẩu thứ hai ở **bên phải** nó.
- **Ghi chú dài bị cắt** ở ngưỡng số dòng thu gọn kèm dòng `còn N dòng ▾`; click một lần mở rộng tại chỗ, dòng đổi thành `thu lại ▴`. Nhiều mẩu mở rộng cùng lúc được; tải lại trang thì **mọi mẩu về thu gọn**.
- **Chạm trần ký tự thì không nhận thêm**, lõi ném lỗi mã `TOO_LONG`, và **không cắt im lặng**.
- **Văn bản thuần, nhiều dòng.** Giữ nguyên xuống dòng; không đậm/nghiêng, không danh sách, không bảng, không ảnh.
- **Im lặng tuyệt đối khi thành công.** Không "đã lưu", không chỉ báo, không đếm ký tự, không dấu hiệu "chưa chốt". Mẩu giấy nhô lên là bằng chứng duy nhất.
- **Trạng thái rỗng không nói gì.** Lưới trống hoàn toàn — không một chữ nào, không "Bạn chưa có ghi chú nào", không hình minh họa chào mừng. Mỗi sáng đều là trạng thái này; nó bình thường, không cần an ủi.
- **Tab title** có dạng `{số} - Ghi chú hàng ngày`, cập nhật ngay khi lưới vẽ lại.
- **Hiệu năng:** từ mở tab tới gõ được ký tự đầu tiên ≤ 2 giây với 2.000 ghi chú trong máy.

## Technical Decisions

- **Single-surface.** Không điều hướng, không route, không màn hình thứ hai. Bốn tầng theo thứ tự: ô soạn thảo → khay tìm kiếm + lọc ngày → lưới ghi chú → chân trang; **ba tầng đầu không cuộn**, tầng lưới là vùng cuộn duy nhất của trang.
- **Ba tầng state, không lẫn.** Ghi chú là state bền dùng chung (IndexedDB); **mẩu đang mở rộng là state phù du, chỉ RAM** — không được ghi xuống bất kỳ kho bền nào. Đó là cách "tải lại trang thì mọi mẩu về thu gọn" đúng theo thiết kế chứ không phải tình cờ.
- **View chỉ đọc.** View không bao giờ ghi vào state, không giữ state riêng, không sửa DOM ngoài lượt render. State chỉ đổi bên trong một action ở lõi.
- **Khung nhìn mặc định là *vắng mặt của điều kiện*.** Khối điều kiện `{ keyword: null, date: null }` khiến bộ truy vấn lọc theo khóa ngày của hôm nay — không tồn tại một điều kiện tên "hôm nay". Action chốt ghi chú gọi `xoaHetDieuKien()` như **bước đầu tiên** của nó; hành vi này phải đúng ngay từ epic này dù chưa có cách nào đặt điều kiện cho tới epic tra cứu — epic đó **không phải** sửa lại chỗ này.
- **Lọc và tìm là quét mảng đồng bộ** trên mảng ghi chú trong RAM đã sắp xếp; không truy vấn bất đồng bộ nào trong đường vẽ lưới.
- **Chốt ghi chú là một transaction duy nhất:** ghi bản ghi note mới và làm rỗng bản ghi nháp của tab này đi cùng nhau. Trước khi làm bất cứ gì khác, action phải **hủy hẹn tự lưu đang treo** — nếu không, một hẹn cũ nổ sau lúc chốt sẽ hồi sinh bản nháp đã chốt.
- **Ghi trước, đổi state sau.** Adapter ném lỗi thì state **không đổi**, mẩu giấy **không xuất hiện**, chữ vẫn nằm nguyên trong ô soạn thảo.
- **`id` sinh bằng `crypto.randomUUID()`; `createdAt` là ISO-8601 có offset.** Mọi phép sắp xếp/lọc/hiển thị đi qua hai khóa dẫn xuất của lõi thời gian, không bao giờ so chuỗi trực tiếp trên `createdAt`.
- **Tab title do lượt render tính ra từ state**, luôn là **số ghi chú có khóa ngày bằng hôm nay** — không phải số mẩu đang hiển thị, và không phụ thuộc điều kiện đang bật. Không phải một hiệu ứng lề ở chỗ khác.
- **Vẫn không có bước build, không bundler, không thư viện runtime, không request mạng sau khi tải.** Mã view nằm ở `app/view/` (composer, grid, render); `main.js` vẫn là file duy nhất nối adapter vào port.

## UX & Interaction Patterns

- **Lưới không breakpoint.** `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, `gap: 8px`, vùng chứa `max-width: 1040px` căn giữa. **Không một breakpoint cố định nào** trong CSS cho lưới. Trần thực tế là **3 cột** — không bao giờ 4 hay 5 — vì 1040px trừ hai lề 16px chỉ đủ 3 cột; cửa sổ hẹp tự rớt về 2 rồi 1 cột. Không breakpoint mobile: sản phẩm là desktop-only, nhưng phóng 200% phải còn dùng được.
- **Hướng đọc trái-sang-phải, hết hàng xuống hàng.** Không masonry, không điền dọc từng cột.
- **Mật độ đã siết có ý thức** so với file HTML hướng visual: padding mẩu giấy `8px/12px`, khe lưới `8px`, lề trang `16px`. Dùng đúng token đã chốt, không dùng giá trị rộng hơn của file hướng.
- **Ngôn ngữ vật liệu.** Ô soạn thảo dùng token `surface`, **bóng lõm**, min-height 92px, tự cao thêm theo nội dung — đó là *chỗ để gõ*. Mẩu giấy dùng token `paper` (**một màu giấy duy nhất** cho mọi mẩu, không màu thứ hai theo ngày/tuổi/độ dài), bóng nhị, dải keo `inset 0 3px 0` ở mép trên, bo góc 3px — đó là *thứ đã ghi*. Sự khác biệt này là toàn bộ cách phân biệt "đang viết" với "đã dán".
- **Placeholder ô soạn thảo trống hoàn toàn** — không một chữ nào. Dưới ô là một dòng nhỏ ghi đúng `Ctrl+Enter để chốt`. Ô soạn thảo không có nhãn; nó là phần tử đầu tiên trong thứ tự tab.
- **Đầu mỗi mẩu:** giờ tạo bên trái, nút `xóa` bên phải (nút luôn hiện, mờ nhạt, không hover-only). Ở khung nhìn mặc định mẩu hiện **chỉ `HH:mm`** — ngày là thông tin thừa khi mọi mẩu đều của hôm nay — bằng phông **monospace** của token thời gian; monospace dành riêng cho thời gian.
- **Mọi mẩu thu gọn có cùng chiều cao trần**, nên hàng luôn đều và liếc một cái quét được cả ngày.
- **Hai nhịp click trên mẩu giấy, không bao giờ nhập một:** click 1 = mở rộng tại chỗ, click 2 = vào chế độ sửa. Ở epic này chỉ nhịp mở rộng tồn tại; mẩu ngắn (không bị cắt) click một cái chỉ đặt focus, vì chưa có chế độ sửa để vào.
- **Không màu viết thẳng.** Mọi màu qua token của hai bảng light/dark đã khai báo ở epic nền; phông là system font stack, không webfont, không icon font.

## Cross-Story Dependencies

- **Phụ thuộc Epic 1 toàn phần:** hằng số ngưỡng và tập mã lỗi, hai khóa thời gian dẫn xuất, khối state + năm port, kho ghi chú bền và luồng ghi chuẩn, bản nháp riêng từng tab, và bộ token màu/typography/spacing. Epic 2 **không được** định nghĩa lại bất kỳ thứ nào trong số đó.
- **Trong epic:** Story 2.1 dựng khung bốn tầng mà 2.2, 2.4, 2.5, 2.6 đổ nội dung vào. Story 2.2 (bản nháp + tự lưu) phải có trước 2.3 (chốt), vì chốt phải hủy được hẹn tự lưu của 2.2. Story 2.3 sinh dữ liệu cho 2.4; 2.4 dựng lưới mà 2.5 vẽ từng ô; 2.6 phụ thuộc 2.4 vì tab title tính từ cùng phép lọc hôm nay.
- **Ranh giới cố ý sang epic sau — không được kéo về:**
  - Lỗi `TOO_LONG` ở epic này dừng đúng ở tầng action, **không có chỗ nói**; dải băng thông báo là việc của epic dải băng. Đây là **suy giảm có ý thức**, không phải mất dữ liệu.
  - Nhịp click thứ hai (vào chế độ sửa) và nút xóa có hộp thoại xác nhận thuộc epic sửa/xóa; ở đây nút xóa chỉ tồn tại về mặt hình dạng.
  - Ô tìm kiếm và ô lọc ngày ở tầng 2 chỉ cần **có mặt** đúng hình dạng; hành vi tra cứu thuộc epic tra cứu. Nhưng `xoaHetDieuKien()` trong action chốt phải đúng **từ bây giờ**.
  - Nút bật/tắt theme thuộc epic dải băng + accessibility; bảng dark đã tồn tại từ epic nền nhưng chưa với tới được.
