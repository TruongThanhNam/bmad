---
name: Ghi chú hàng ngày
status: final
updated: 2026-09-10
project: Ghi chú hàng ngày
sources:
  - ../../prds/prd-ghi-chu-hang-ngay-2026-09-08/prd.md
  - ../../prds/prd-ghi-chu-hang-ngay-2026-09-08/addendum.md
  - ../../architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md
---

# Ghi chú hàng ngày — Experience Spine

> `DESIGN.md` và `EXPERIENCE.md` **thắng khi xung đột** với bất kỳ mock, wireframe hay bản import nào — kể cả mock trong `mockups/` và file hướng trong `.working/`.

Token màu, spacing, hình dạng tham chiếu bằng `{path.to.token}` tới `DESIGN.md`. Tài liệu này không nhắc lại giá trị.

## Foundation

**Trang web tĩnh một màn hình.** Một `index.html` host trên GitHub Pages, không backend, không tài khoản, không đăng nhập (NFR-5). Toàn bộ đọc/ghi diễn ra trong máy sau khi trang tải xong.

- **Bề mặt:** single-surface. Không có điều hướng, không có màn hình thứ hai, không có route. Mọi trạng thái đều là biến thể của cùng một màn hình. Không có modal nào ngoài hộp thoại xác nhận xóa, và nó chỉ sâu một tầng.
- **Nền tảng:** trình duyệt hiện đại trên máy tính công ty chạy Windows, desktop-only. Không mobile, không cộng tác, không chia sẻ (§8). **Trình duyệt đã chốt 2026-09-10:** Chromium bản hiện hành (Edge / Chrome, tự cập nhật) — `AD-12`. PRD A-10 và Open Question 2 nay đã đóng.
- **UI system:** **không có.** Không shadcn, không MUI, không Tailwind, không component library. Vanilla HTML/CSS/JS. Mọi component trong tài liệu này được định nghĩa từ đầu ở `DESIGN.md.Components`; không có default nào để kế thừa.
- **Không chạy được khi mất mạng.** NFR-4: phải có mạng mới tải được app. Mất mạng = không mở được app; ghi chú vẫn nằm nguyên trong máy nhưng không đọc được cho tới khi mạng trở lại. **Rủi ro đã chấp nhận có ý thức** (addendum §2.11), không phải sơ suất. Hệ quả cho EXPERIENCE: sản phẩm **không có** trạng thái offline nào để thiết kế — nếu app hiển thị được thì mạng đã có.
- **Origin phải cố định vĩnh viễn.** NFR-8: dữ liệu trong trình duyệt gắn với origin. Đổi tên miền hoặc đổi đường dẫn là **mất toàn bộ ghi chú, im lặng**. Đây là ràng buộc vận hành, không phải ràng buộc UX — nhưng nó nằm ở đây vì không có màn hình nào cảnh báo được cho Nam khi điều đó xảy ra.

## Information Architecture

Bốn tầng cố định từ trên xuống. Ba tầng đầu không cuộn; chỉ tầng lưới cuộn. Mock của bốn tầng: [`mockups/key-hom-nay.html`](./mockups/key-hom-nay.html).

| # | Vùng | Nội dung | Ghi chú |
|---|---|---|---|
| 1 | **Ô soạn thảo** | Một ô nhập nhiều dòng, cố định, con trỏ nằm sẵn khi trang tải xong (FR-1). Dưới ô: dòng `Ctrl+Enter để chốt` | Nơi **duy nhất** tạo ghi chú mới |
| 2 | **Khay tìm kiếm + bộ lọc ngày** | Nhãn `tìm` + ô từ khóa · nhãn `ngày` + ô `dd/MM/yyyy` + icon lịch. Luôn có mặt, không phải mở ra mới dùng (FR-12) | Nền `{colors.chip-bg}` sẫm hơn nền bàn — xem "Tách vùng" bên dưới |
| 2b | *Hàng chip điều kiện* | Chỉ hiện khi có điều kiện đang bật: một chip mỗi điều kiện + số kết quả + link `về hôm nay` | FR-14: điều kiện phải nhìn thấy được |
| 3 | **Lưới ghi chú** | Tường note 2–3 cột (CSS grid auto-fill, trần 3 cột do `{spacing.container-max}`). Vùng cuộn duy nhất của trang | Xem "Hướng đọc trong lưới" |
| 4 | **Chân trang** | `xuất sao lưu` · `nạp lại` · *(dòng nhắc sao lưu khi có)* · nút bật-tắt theme (đẩy sang phải) | Hai link **thường trực**, không phụ thuộc dòng nhắc |

Cộng thêm hai phần tử không thuộc bốn tầng:

- **Dải băng thông báo dùng chung** — một dải duy nhất ở đỉnh trang, trên tầng 1. Dùng chung cho **mọi** loại thông báo (xem Voice and Tone); thứ tự ưu tiên giữa chúng do `AD-17` quy định. Không chặn đường, có nút đóng. Lỗi luôn xuất hiện đúng một chỗ — dễ đoán nhất, ít phần tử nhất.
- **Dòng nhắc sao lưu** — một dòng nhỏ ở chân trang, chỉ hiện khi đã quá 7 ngày chưa sao lưu (FR-17, A-9). Không chặn đường, không hộp thoại, không phải bấm để tắt.

**Vì sao hai link sao lưu nằm ở chân trang, thường trực:** UJ-3 mở app lần đầu trên máy mới — app trống, chưa có ghi chú nào, và vì chưa từng sao lưu trên máy này nên **dòng nhắc FR-17 có thể không hiện**. Nếu đường vào "nạp lại" phụ thuộc dòng nhắc thì đúng lúc rủi ro cao nhất Nam sẽ không tìm được nó.

### Tách vùng: ô soạn thảo vs ô tìm kiếm

Hai ô này có **hành vi trái ngược nhau**, nên gõ nhầm là kiểu hỏng đắt nhất của sản phẩm:

| Gõ vào | Hậu quả |
|---|---|
| **Ô soạn thảo** | **XÓA HẾT** mọi điều kiện đang bật, dòng ghi chú về khung nhìn mặc định (FR-14) |
| **Ô tìm kiếm** | **ĐẶT** điều kiện từ khóa; bộ lọc ngày đang bật vẫn giữ nguyên (FR-14) |

Bốn cơ chế tách, cộng dồn:

1. **Vật liệu khác nhau.** Ô soạn thảo là `{colors.surface}` sáng nhất, bóng lõm, min-height 92px — một khối lớn. Khay tìm kiếm là `{colors.chip-bg}` sẫm hơn cả nền bàn, ô nhập bên trong chỉ cao một dòng.
2. **Nhãn.** Khay tìm kiếm có nhãn chữ `tìm` và `ngày` đứng trước ô. Ô soạn thảo **không có nhãn nào** và placeholder trống hoàn toàn.
3. **Vị trí và thứ tự tab.** Ô soạn thảo là phần tử đầu tiên, nhận focus khi trang tải. Ô tìm kiếm nằm dưới nó, cách một khe.
4. **Cảnh báo tại chỗ khi đang tra cứu.** Khi có điều kiện đang bật, ô soạn thảo hiện placeholder `gõ vào đây sẽ bỏ mọi điều kiện lọc` — đây là **ngoại lệ duy nhất** của quy tắc placeholder trống, và nó chỉ tồn tại trong trạng thái đang tra cứu.

### Hướng đọc trong lưới

**FR-7 "mới nhất trên cùng" trong lưới nhiều cột = hướng đọc TRÁI sang PHẢI, hết hàng xuống hàng.** Phát biểu tường minh vì lưới hai chiều có hai cách đọc và cách còn lại (điền dọc từng cột, kiểu masonry) sẽ làm ghi chú mới nhất không nằm ở góc trên-trái.

- Ghi chú mới nhất ở **ô trên-cùng-trái**.
- Ghi chú thứ hai ở **bên phải nó**, không phải bên dưới nó.
- Hết hàng thì xuống hàng tiếp theo, lại bắt đầu từ trái.
- Ghi chú vừa chốt luôn xuất hiện ở ô trên-cùng-trái, đẩy mọi mẩu khác dịch một ô về sau.
- Mọi mẩu thu gọn có cùng chiều cao trần 3 dòng, nên hàng luôn đều và lưới quét được bằng một cái liếc (FR-8).

## Voice and Tone

Khô, trực tiếp, không an ủi. Không dấu chấm than, không emoji, không "bạn", không xin lỗi, không chúc mừng. Trạng thái rỗng **không một chữ nào**. Lỗi phải nói rõ **việc cần làm**, không chỉ nói việc gì đã xảy ra.

### Dải băng thông báo — nhiều loại, một hình dạng

Mock: [`mockups/key-canh-bao.html`](./mockups/key-canh-bao.html).

| # | Kịch bản | Microcopy |
|---|---|---|
| 1 | FR-19 · **hết dung lượng**, lưu thất bại | `Không lưu được — trình duyệt hết dung lượng. Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.` |
| 1b | FR-19 · **cảnh báo trước ngưỡng** | `Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.` |
| 2 | AD-21 · **mã lệch phiên bản** | `Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.` |
| 3 | FR-16 · **file nạp lỗi** | `Không nạp được file này — sai định dạng hoặc file hỏng. Dữ liệu đang có KHÔNG bị đụng tới. Thử file sao lưu khác.` |
| 4 | FR-18 · **vượt trần 20.000 ký tự** | `Ghi chú này đã đạt 20.000 ký tự — không nhận thêm. Chốt bằng Ctrl+Enter rồi gõ tiếp vào ghi chú mới.` |

**Cập nhật 2026-09-10 sau `bmad-architecture`.** Hai dòng trên đã đổi, và đây là lý do:

- **Dòng 1b bỏ con số "còn khoảng 10%".** Open Question 3 của PRD nay đã đóng: ngưỡng thật là *đã dùng ≥ 80% quota **hoặc** còn dưới 50 MB trống, cái nào đến trước* (`AD-10`). Vì ngưỡng có hai vế và vế thứ hai là con số tuyệt đối, không có một tỉ lệ phần trăm nào nói đúng được cả hai — nên microcopy bỏ luôn con số thay vì nói một con số sai.
- **Dòng 2 không còn là "tab thứ hai".** Kiến trúc chọn **đồng bộ đa tab thật** qua `BroadcastChannel` thay vì khóa tab (`AD-7`), nên tình huống "đang mở app ở một tab khác" **không còn tồn tại** — hai tab dùng song song được và không tab nào mất ghi chú. Ô này được dùng lại cho một tình huống mới mà kiến trúc sinh ra: tab để mở nhiều ngày đang chạy mã cũ sau một lần deploy, và nó vào chế độ chỉ đọc (`AD-21`).

### Các microcopy còn lại

| Chỗ | Microcopy |
|---|---|
| Ô soạn thảo, placeholder mặc định | *(trống hoàn toàn — không một chữ nào)* |
| Ô soạn thảo, khi đang có điều kiện bật | `gõ vào đây sẽ bỏ mọi điều kiện lọc` |
| Gợi ý dưới ô soạn thảo | `Ctrl+Enter để chốt` |
| Ô tìm kiếm, placeholder | `từ khóa` |
| Ô ngày, placeholder | `dd/MM/yyyy` |
| Ô ngày, sai định dạng | `Ngày phải viết dd/MM/yyyy, ví dụ 03/09/2026.` |
| **Không có kết quả** (FR-12) | `Không có ghi chú nào khớp.` |
| **Vượt trần 50 kết quả** (A-11) | `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.` |
| Số kết quả trên hàng chip | `1 ghi chú` — con số viết theo số kết quả thật (UJ-2 bước 5: còn đúng một mẩu → `1 ghi chú`) |
| Đường về mặc định | `về hôm nay` |
| **Dòng nhắc sao lưu** (FR-17) | `Lần sao lưu gần nhất cách đây tám ngày.` — chữ số viết theo số ngày thật |
| Ghi chú bị cắt | `còn 2 dòng ▾` / mở rộng rồi: `thu lại ▴` |
| Nút xóa trên mẩu giấy | `xóa` |
| Nút đóng dải băng | dấu `✕` — **không phải chữ**, nên phải có nhãn cho trợ giúp tiếp cận: `đóng thông báo` |
| **Hộp thoại xác nhận xóa** (FR-11) | Tiêu đề: `Xóa ghi chú này?` · Thân: `Không có thùng rác và không hoàn tác được.` · Hai lựa chọn: `hủy` · `xóa` |
| **Nạp lại thành công** (FR-16) | `Đã nạp 128 ghi chú, bỏ qua 340 ghi chú đã có.` — dải băng, hai con số thật |
| Link chân trang | `xuất sao lưu` · `nạp lại` |
| Nút theme | `nền tối` (khi đang sáng) / `nền sáng` (khi đang tối) |
| Tab title | `4 - Ghi chú hàng ngày` — số ghi chú **của hôm nay**. Xem `[OVERRIDE-2]` |

**Nạp lại là ngoại lệ có chủ đích của quy tắc "im lặng khi thành công".** Nó là hành động một-lần-một-năm, tác động lên toàn bộ kho dữ liệu, và Nam vừa đi qua kịch bản mất máy — im lặng ở đây không phải bình tĩnh mà là mơ hồ. Xuất sao lưu thì im lặng: file tải xuống là bằng chứng.

## Component Patterns

Hành vi. Visual spec ở `DESIGN.md.Components`.

| Component | Ở đâu | Quy tắc hành vi |
|---|---|---|
| **Ô soạn thảo** | Tầng 1 | Nhận focus khi trang tải (FR-1). Tự lưu bản nháp ≤ 1 giây (FR-3). `Enter` xuống dòng, `Ctrl+Enter` chốt. Ký tự đầu tiên gõ vào **xóa hết điều kiện đang bật** (FR-14). Chốt xong: ô trống lại, con trỏ **vẫn ở trong đó** (FR-4). Chạm trần 20.000 ký tự: không nhận thêm ký tự, hiện dải băng loại 4 |
| **Ô tìm kiếm** | Tầng 2 | Lọc dần theo từng ký tự, không cần `Enter` (A-4). Bỏ dấu tiếng Việt, không phân biệt hoa/thường (FR-12, NFR-6). Tìm trên **toàn bộ** ghi chú, không giới hạn theo khung nhìn. Không xóa bộ lọc ngày. Xóa hết chữ = bỏ điều kiện từ khóa |
| **Ô ngày** | Tầng 2 | Gõ tay `dd/MM/yyyy` là đường chính. Áp dụng khi chuỗi đủ hợp lệ; sai định dạng thì viền `{colors.danger}` + thông báo dưới ô, **dòng ghi chú không đổi**. Icon lịch mở picker chọn đúng một ngày (không khoảng ngày — A-5); chọn xong picker đóng và điền vào ô. Xóa hết chữ = bỏ điều kiện ngày |
| **Chip điều kiện** | Tầng 2b | Một chip mỗi điều kiện đang bật. Chip **không** bấm được để xóa — đường bỏ điều kiện là xóa chữ trong ô, hoặc link `về hôm nay`. Chip chỉ để nhìn |
| **Link `về hôm nay`** | Tầng 2b | Một cú click xóa **hết** điều kiện và về khung nhìn mặc định. Đây là "đường về trong MỘT thao tác" của FR-14 |
| **Mẩu giấy** | Tầng 3 | **Click 1 = mở rộng tại chỗ. Click 2 = vào chế độ sửa.** Hai nhịp rõ ràng, không bao giờ nhập một. Ghi chú không bị cắt (≤ 3 dòng) thì click 1 đã là vào chế độ sửa. Trạng thái mở rộng **không được nhớ giữa các phiên** (A-3). Tải lại trang: mọi mẩu về thu gọn |
| **Mẩu giấy — chế độ sửa** | Tầng 3 | Ô văn bản tại chỗ, con trỏ đặt đúng vị trí click. Tự lưu ≤ 1 giây (FR-10). Thời điểm tạo và vị trí trong lưới **không đổi** (NT-4). Rời khỏi mẩu (click ra ngoài hoặc `Tab`) = thoát chế độ sửa. Xóa hết ký tự rồi rời khỏi: mẩu biến mất **không hỏi xác nhận** (FR-5) |
| **Nút xóa** | Mọi mẩu giấy | **Luôn hiện, mờ nhạt, trên mọi mẩu.** Không hover-only — vì đã chốt không thêm phím tắt, đây là đường xóa duy nhất nên nó phải nhìn thấy được. Click mở hộp thoại xác nhận |
| **Hộp thoại xác nhận xóa** | Overlay, căn giữa theo chiều dọc, sâu một tầng ([`mockups/key-canh-bao.html`](./mockups/key-canh-bao.html)) | Hai lựa chọn rõ ràng: `hủy` · `xóa`. `Esc` hoặc click ra ngoài = **hủy** (FR-11). **Focus mặc định khi mở đặt vào `hủy`, không phải `xóa`** — PRD FR-11 không có hoàn tác và không có thùng rác, nên một phát `Enter` theo phản xạ không được phép là một phát xóa. Sau khi xóa: mẩu biến mất **đột ngột, không animation** — đánh đổi đã chấp nhận |
| **Dải băng thông báo** | Đỉnh trang ([`mockups/key-canh-bao.html`](./mockups/key-canh-bao.html)) | Một dải dùng chung cho mọi loại. Đẩy nội dung xuống, không phủ lên. Nút đóng là **dấu `✕`** (`{components.banner.closeAffordance}`); vì là ký hiệu chứ không phải chữ, nó **phải mang nhãn cho trợ giúp tiếp cận** — nhãn `đóng thông báo` — và nằm trong tab order với focus ring `{colors.focus}` nhìn thấy được (Accessibility Floor mục 2 và 3). Nhiều lỗi cùng lúc: **không phải "cái mới nhất thắng"** — thứ tự ưu tiên do `AD-17` quy định, và một thông báo ưu tiên thấp không được thay cái đang hiện có ưu tiên cao hơn. Loại 1 (hết dung lượng) và loại 2 (lệch phiên bản) không đóng được; các loại còn lại đóng được và biến mất khi Nam gõ tiếp |
| **Link `xuất sao lưu`** | Chân trang | Một click = tải về một file chứa **toàn bộ** ghi chú, không phụ thuộc điều kiện đang áp dụng (FR-15). Im lặng khi thành công |
| **Link `nạp lại`** | Chân trang | Một click = mở hộp chọn file của hệ điều hành. Gộp vào, đối chiếu theo định danh, **không bao giờ ghi đè hay xóa** (FR-16). Thành công: dải băng với hai con số. Thất bại: dải băng loại 3, dữ liệu không bị đụng |
| **Nút theme** | Chân trang, góc phải | Toggle light/dark, lưu lại lựa chọn. Xem `[OVERRIDE-1]` |
| **Dòng nhắc sao lưu** | Chân trang | Chỉ hiện khi > 7 ngày chưa sao lưu (A-9). Không nút tắt, không chặn đường. Mốc "lần gần nhất" khôi phục được từ file sao lưu khi nạp trên máy mới (FR-17) |
| **Tab title** | Thanh tab trình duyệt | Cập nhật khi số ghi chú **của hôm nay** đổi. Xem `[OVERRIDE-2]` |

## State Patterns

Chỉ có một bề mặt, nên bảng dưới đây là toàn bộ không gian trạng thái của sản phẩm.

| Trạng thái | Điều kiện | Xử lý |
|---|---|---|
| **Rỗng** | Hôm nay chưa có ghi chú nào, không điều kiện nào bật | Chỉ ô soạn thảo với con trỏ trong đó, khay tìm kiếm rỗng, chân trang. Lưới **hoàn toàn trống — không một chữ nào**, không hình minh họa, không giải thích (FR-9). Mỗi sáng đều là trạng thái này; nó là bình thường, không cần an ủi. Mock: [`mockups/key-hom-nay.html`](./mockups/key-hom-nay.html) |
| **Hôm nay có ghi chú** | Khung nhìn mặc định, ≥ 1 ghi chú của hôm nay | Lưới 2–3 cột (auto-fill, không breakpoint cố định — xem `DESIGN.md.Layout & Spacing`), mới nhất ở ô trên-cùng-trái. Mỗi mẩu hiện **chỉ giờ `HH:mm`** — ngày là thông tin thừa khi mọi mẩu đều của hôm nay. Mock: [`mockups/key-hom-nay.html`](./mockups/key-hom-nay.html) |
| **Đang tra cứu** | ≥ 1 điều kiện bật | Mock: [`mockups/key-tra-cuu.html`](./mockups/key-tra-cuu.html). Hàng chip hiện: một chip mỗi điều kiện + số kết quả + link `về hôm nay`. Mỗi mẩu hiện **đầy đủ `dd/MM/yyyy HH:mm`** (FR-12). Từ khóa khớp được tô `{colors.hl}`. Ô soạn thảo đổi sang placeholder cảnh báo. Đường về mặc định luôn trong **một** thao tác |
| **Vượt trần kết quả** | Kết quả tìm > 50 (A-11) | Hiện 50 mẩu, cộng một dòng dưới lưới: `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.` |
| **Không có kết quả** | ≥ 1 điều kiện bật, 0 ghi chú khớp | **Phải phân biệt được với trạng thái rỗng bình thường.** Ba dấu hiệu cùng lúc: (1) hàng chip vẫn hiện, ghi `0 ghi chú`; (2) một dòng trong vùng lưới: `Không có ghi chú nào khớp.`; (3) link `về hôm nay` vẫn ở đó. Đây là chỗ duy nhất một vùng lưới trống được phép nói chữ (FR-12) |
| **Ghi chú đang mở rộng** | Sau click 1 trên mẩu bị cắt | Mẩu đó bỏ trần 3 dòng, cao lên tại chỗ, đẩy hàng bên dưới xuống. `còn N dòng ▾` đổi thành `thu lại ▴`. Không chuyển màn hình, không hộp thoại (FR-8). Nhiều mẩu mở rộng cùng lúc được |
| **Ghi chú đang sửa** | Sau click 2 | Nền mẩu đổi sang `{colors.surface}`, viền `{colors.focus}` — mẩu tạm mượn ngôn ngữ vật liệu của ô soạn thảo. Tự lưu ≤ 1 giây, không nút Lưu, không chỉ báo "đã lưu". Vị trí và thời điểm tạo không đổi |
| **Bản nháp chưa chốt** | Có nội dung trong ô soạn thảo, chưa `Ctrl+Enter` | **KHÔNG có dấu hiệu nào.** Im lặng triệt để: không viền khác, không dấu chấm, không chữ "chưa chốt", không đếm ký tự. Bản nháp xuất hiện lại nguyên trạng khi mở app lần sau, bất kể đã qua bao nhiêu ngày (FR-3).<br>**Rủi ro đã được nêu rõ và Nam chấp nhận tự chịu:** mở app sau nhiều ngày, Nam có thể tưởng bản nháp đang nằm đó **đã được chốt** thành ghi chú, trong khi nó chưa có thời điểm tạo, không tìm được và không có trong file sao lưu. Lựa chọn này nhất quán với FR-9 và với nguyên tắc im-lặng-khi-thành-công |
| **Lỗi** | Bất kỳ loại nào | Dải băng ở đỉnh trang, xem Component Patterns. Không toast, không hộp thoại chặn đường, không lỗi inline ngoài ô ngày sai định dạng |
| **Tải lại trang** | F5 / mở lại tab | Mọi điều kiện bị xóa, về khung nhìn mặc định (A-6). Mọi mẩu về thu gọn (A-3). Bản nháp và lựa chọn theme thì còn |

**Không có trạng thái offline**, vì app không tải được khi mất mạng (NFR-4). **Không có trạng thái cold-load / skeleton**, vì NFR-1 đòi ≤ 2 giây tới lúc gõ được và §8 cấm splash screen — trang render một lần, xong. **Không có trạng thái permission-denied**, vì không có tài khoản (NFR-5).

## Interaction Primitives

**Bàn phím là chủ đạo cho việc ghi; chuột là bắt buộc cho việc tra cứu và xóa.**

| Phím | Hành vi |
|---|---|
| `Ctrl+Enter` | Chốt bản nháp thành ghi chú (FR-4). **Bản nháp rỗng: không làm gì cả** — không tạo ghi chú, không báo lỗi, không nhấp nháy |
| `Enter` | Xuống dòng trong bản nháp và trong ghi chú đang sửa. **Không** chốt (FR-4) |
| `Esc` | Hủy hộp thoại xác nhận xóa (FR-11). Không có tác dụng nào khác |
| `Tab` / `Shift+Tab` | Di chuyển focus theo thứ tự đọc, focus ring `{colors.focus}` luôn nhìn thấy |

**KHÔNG có phím tắt nào khác.** Không `/` để vào ô tìm kiếm, không `Ctrl+K`, không phím tắt cho xóa, sao lưu, đổi theme. Hệ quả đã được nêu rõ với Nam và được chấp nhận:

- **UJ-2 (tra cứu) cần chuột** — phải click vào ô tìm kiếm hoặc `Tab` xuống. Không có đường một-phím.
- **Nút Xóa cần chuột** — đây là lý do nút Xóa phải luôn hiện chứ không hover-only, và là lý do focus ring là token bắt buộc.
- **UJ-1 vẫn thuần bàn phím** — bấm sang tab, gõ, `Ctrl+Enter`, bấm về IDE. Đây là hành trình được ưu tiên và nó không mất gì.

**Chuột:**

- **Click 1 trên mẩu giấy = mở rộng tại chỗ. Click 2 = vào chế độ sửa.** Hai nhịp rõ ràng, không bao giờ nhập một. Lý do: UJ-2 (đọc lại biên bản cho sếp nghe) **không bao giờ được vô tình vào chế độ sửa** — PRD không có hoàn tác (FR-11) và không lưu lịch sử sửa đổi (FR-10).
- **Nút Xóa luôn hiện, mờ nhạt, trên mọi mẩu giấy.** Không hover-only.
- **Bộ lọc ngày:** gõ tay `dd/MM/yyyy` là đường chính (giữ tinh thần bàn phím-first của UJ-2); icon picker lịch là **đường phụ** khi không nhớ rõ định dạng hoặc không nhớ rõ ngày.
- Click ra ngoài hộp thoại xác nhận = hủy. Click ra ngoài mẩu đang sửa = thoát chế độ sửa.

**Bị cấm:** kéo-thả sắp xếp, chọn nhiều mẩu, menu ngữ cảnh, long-press, double-click cho bất cứ gì khác, cuộn vô hạn (khung nhìn mặc định không dài vô hạn — NT-3), hover-only affordance, hoạt ảnh vào/ra.

**Phản hồi: im lặng khi thành công, nói rõ việc cần làm khi thất bại.**

| | |
|---|---|
| Chốt ghi chú | Im lặng. Mẩu giấy xuất hiện ở ô trên-cùng-trái là bằng chứng duy nhất. Không "đã lưu" |
| Sửa ghi chú | Im lặng. Không chỉ báo, không nút Lưu |
| Xuất sao lưu | Im lặng. File tải xuống là bằng chứng |
| Thất bại lưu (hết dung lượng) | **Ồn ào.** Dải băng, và giao diện **không bao giờ tỏ ra như đã lưu xong** (FR-19) |
| Tab thứ hai | **Im lặng, và không có gì để nói.** Kiến trúc đồng bộ hai tab thật qua `BroadcastChannel` (`AD-7`), nên ghi chú tạo ở tab này xuất hiện ở tab kia và không tab nào mất gì. FR-20 được thỏa bằng cơ chế, không bằng cảnh báo |
| Mã lệch phiên bản | **Ồn ào.** Dải băng không đóng được, và tab vào chế độ chỉ đọc (`AD-21`) |
| Nạp lại | **Nói rõ**, cả thành công lẫn thất bại — ngoại lệ có chủ đích, xem Voice and Tone |

## Accessibility Floor

**Sàn cơ bản hợp lý, không phải WCAG AA đầy đủ.** Sáu điều dưới đây là ràng buộc cứng:

1. **Tương phản chữ ≥ 4.5:1 ở cả light và dark.** Hex thật và tỉ lệ đã tính nằm ở `DESIGN.md.Colors`. Chữ nhỏ nhất dùng `{colors.ink-2}`; `{colors.ink-decor}` không bao giờ là chữ.
2. **Focus ring nhìn thấy được** — `{colors.focus}`, ≥ 3:1 so với nền, trên **mọi** phần tử tương tác. `outline: none` bị cấm tuyệt đối. Đây là ràng buộc **bắt buộc** chứ không phải nên-có, vì đã chốt không thêm phím tắt: focus ring là bản đồ duy nhất của người dùng bàn phím.
3. **Tab order đúng thứ tự đọc:** *(nút `✕` của dải băng khi dải băng đang hiện — nó đứng trước tầng 1 vì nằm trên tầng 1, và vì là ký hiệu nên **bắt buộc** có nhãn `đóng thông báo`)* → ô soạn thảo → ô tìm kiếm → ô ngày → icon lịch → *(link `về hôm nay` nếu có)* → từng mẩu giấy theo hướng đọc trái-sang-phải, mỗi mẩu là thân rồi nút xóa → link `xuất sao lưu` → `nạp lại` → nút theme. Hộp thoại xác nhận giam focus trong nó và trả focus về nút xóa vừa bấm khi đóng.
4. **Phóng to trình duyệt tới 200%** vẫn dùng được. Lưới rớt về 1 cột ở mức phóng đó là chấp nhận được; không được có chữ bị cắt hay điều khiển bị đẩy ra ngoài khung.
5. **Tôn trọng `prefers-reduced-motion`** — bỏ luôn cả chuyển màu hover/focus. Vì motion đã tối thiểu, ở chế độ này app gần như tĩnh hoàn toàn.
6. **Không dùng màu làm tín hiệu duy nhất.** Ô ngày sai định dạng: viền `{colors.danger}` **cộng** thông báo chữ. Điều kiện đang bật: chip có chữ, không chỉ đổi viền.

**KHÔNG làm, có ý thức:** không ARIA đầy đủ (không `aria-live` cho kết quả tìm, không role/state cho mọi phần tử), **không kiểm tra bằng screen reader**, không WCAG 2.2 AA đầy đủ, không kiểm thử với công nghệ trợ giúp. Lý do: n = 1, người dùng duy nhất là chính tác giả và không dùng screen reader. **Đây là quyết định có ý thức, không phải sơ suất** — nếu sản phẩm có người dùng thứ hai, đây là mục phải mở lại đầu tiên.

## Key Flows

Protagonist là **Nam** ở cả ba hành trình. Tài liệu này không bao giờ viết "người dùng".

### UJ-1 · Nam ghi một việc giữa lúc đang code, không mất mạch

1. Nam đang sửa một hàm thì Slack nhảy lên: sếp nhờ gọi lại cho anh Tuấn trong chiều nay.
2. Nam nhìn thanh tab, thấy `3 - Ghi chú hàng ngày` giữa một rừng tab, bấm sang.
3. Con trỏ **đã nằm sẵn** trong ô soạn thảo. Không có bước nào ở giữa: không nút "Tạo mới", không placeholder phải đọc, không màn hình chờ.
4. Nam gõ `gọi lại cho anh Tuấn`. Chữ được lưu ngay, im lặng — không chỉ báo nào.
5. `Ctrl+Enter`.
6. **Cao trào:** mẩu giấy mới xuất hiện ở ô trên-cùng-trái của lưới, mang mốc `08/09/2026 10:14` — nhưng khung nhìn mặc định chỉ hiện `10:14`, vì ngày là thông tin thừa khi mọi mẩu đều của hôm nay. Ô soạn thảo trống lại, con trỏ vẫn ở trong đó. Không một chữ "đã lưu" nào. **Bằng chứng duy nhất là mẩu giấy vừa nhô lên khỏi nền bàn** — và tab title đổi thành `4 - Ghi chú hàng ngày`.
7. Nam bấm về IDE. Tổng cộng chưa tới năm giây, và tay chưa rời bàn phím lần nào.

**Đường hỏng:** trình duyệt hết dung lượng → dải băng ở đỉnh: `Không lưu được — trình duyệt hết dung lượng. Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.` Chữ vẫn nằm trong ô soạn thảo, không mẩu giấy nào xuất hiện — giao diện không giả vờ đã lưu xong.

**Giới hạn đã biết:** nếu việc đó phải làm *thứ Năm*, sáng mai Nam không còn thấy nó nữa (§8).

### UJ-2 · Nam xác minh một yêu cầu đã được duyệt, khi sếp hỏi lại

1. Ba tháng sau. Sếp hỏi tại sao chỗ này lại làm như vậy. Nam nhớ mang máng: một cuộc họp đầu tháng 9, trong đó có nhắc tới phân quyền.
2. Nam mở app. Lưới chỉ có ghi chú hôm nay — không có gì gây nhiễu.
3. Nam **click vào ô tìm kiếm** (cần chuột: không có phím tắt) và gõ `phan quyen`, **không bỏ dấu, vì đang vội**. Kết quả lọc dần theo từng ký tự.
4. Lưới đổi ngay: bốn mẩu giấy, mới nhất ở ô trên-cùng-trái, mỗi mẩu giờ hiện **đầy đủ** `dd/MM/yyyy HH:mm`, từ `phan quyen` được tô nền `{colors.hl}` bên trong `Phân quyền`. Hàng chip hiện `phan quyen` và `4 ghi chú`. Ô soạn thảo đổi placeholder thành `gõ vào đây sẽ bỏ mọi điều kiện lọc` — Nam biết đừng gõ vào đó.
5. Nam gõ `03/09/2026` vào ô ngày. Còn đúng một mẩu — hàng chip đổi thành `phan quyen` · `03/09/2026` · `1 ghi chú`. Xem [`mockups/key-tra-cuu.html`](./mockups/key-tra-cuu.html).
6. Nam **click một lần** vào mẩu đó. Nó mở rộng tại chỗ — biên bản họp hôm ấy, kèm dòng yêu cầu sếp đã duyệt. Nó **không** vào chế độ sửa, vì mở rộng và sửa là hai nhịp riêng.
7. **Cao trào:** Nam đọc to lên cho sếp nghe, ngón tay không chạm bàn phím. Một mẩu giấy, `03/09/2026 16:40`, chữ nguyên vẹn — và vì click 1 chỉ mở rộng, không có một ký tự nào có thể bị Nam gõ nhầm vào trong lúc đọc. Trong một sản phẩm không có hoàn tác, đó chính là điều nhịp thứ hai mua được.
8. Xong việc, Nam click `về hôm nay` — **một thao tác**, mọi điều kiện bị xóa, lưới về khung nhìn mặc định, mốc thời gian rút lại còn `HH:mm`.

**Đường hỏng:** Nam nhớ sai ngày → bộ lọc trả về rỗng. Lưới hiện `Không có ghi chú nào khớp.`, hàng chip vẫn còn và ghi `0 ghi chú` — Nam phân biệt được ngay đây là "tìm không ra", không phải "hôm nay chưa ghi gì". Nam xóa chữ trong ô ngày, giữ từ khóa, rồi dò bằng mốc thời gian trên bốn kết quả kia.

**Đường hỏng thứ hai:** Nam gõ `phan` thay vì `phan quyen` → 63 kết quả. Lưới hiện 50 mẩu, dưới lưới: `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.`

### UJ-3 · Máy của Nam được IT cài lại

1. Tuần trước nữa, app hiện một dòng nhỏ ở chân trang: `Lần sao lưu gần nhất cách đây tám ngày.` Không hộp thoại, không chặn đường. Nam click `xuất sao lưu` hôm thứ Sáu. Im lặng — file tải xuống là bằng chứng.
2. Máy mới, trình duyệt mới. Nam mở app: **trạng thái rỗng tuyệt đối**. Chỉ ô soạn thảo với con trỏ, khay tìm kiếm rỗng, chân trang. Không một chữ chào mừng, không hướng dẫn.
3. Nhưng chân trang **vẫn có** hai link thường trực `xuất sao lưu` · `nạp lại` — chúng không phụ thuộc dòng nhắc FR-17, và trên máy mới này dòng nhắc chưa có gì để nói.
4. Nam click `nạp lại`, chọn file thứ Sáu tuần trước.
5. **Cao trào:** dải băng ở đỉnh: `Đã nạp 468 ghi chú, bỏ qua 0 ghi chú đã có.` Lưới bên dưới vẫn **rỗng** — vì khung nhìn mặc định chỉ có hôm nay, và hôm nay Nam chưa ghi gì. Nam gõ `03/09/2026` vào ô ngày: biên bản cuộc họp cũ hiện ra, **giữ nguyên `03/09/2026 16:40`**. Cái neo còn nguyên. Và ở chân trang, dòng nhắc đã biết lần sao lưu gần nhất là thứ Sáu tuần trước — mốc đó khôi phục được từ trong chính file.
6. Những gì Nam ghi từ thứ Sáu tới lúc máy hỏng thì mất. Đó là cái giá đã biết trước của sao lưu thủ công.

**Đường hỏng:** file hỏng hoặc sai phiên bản → dải băng: `Không nạp được file này — sai định dạng hoặc file hỏng. Dữ liệu đang có KHÔNG bị đụng tới. Thử file sao lưu khác.` Không một ghi chú nào bị thêm, đổi hay xóa (FR-16).

---

## Hai `[OVERRIDE]` so với PRD

- **`[OVERRIDE-1]` Nút bật/tắt theme ở chân trang.** Trái với PRD §8 / NT-1 *"không trang cài đặt, không tùy chọn người dùng."* Đây là tùy chọn người dùng duy nhất trong sản phẩm. Nam đã xác nhận coi là ngoại lệ chấp nhận được: hướng sticky-note có nền ấm và là hướng chói mắt nhất khi đặt cạnh IDE tối, bản dark là cách giải quyết duy nhất không phải đổi hướng visual. Nó không mở ra trang cài đặt — chỉ một nút chữ ở chân trang, và lựa chọn được nhớ lại.
- **`[OVERRIDE-2]` Tab title có số ghi chú của hôm nay.** Dạng `4 - Ghi chú hàng ngày`. Biên với PRD §8 *"không nhắc nhở, không thông báo"* — một con số đổi liên tục trên thanh tab hoạt động gần giống badge thông báo. Lý do giữ: UJ-1 phụ thuộc vào việc Nam bấm **đúng tab** giữa một rừng tab, và bước 2 của UJ-1 sẽ hỏng nếu không có nó. Nam đã được nêu rõ điều này và giữ lựa chọn.

**Không có override thứ ba.** Đặc biệt: **icon picker lịch trong bộ lọc ngày không phải override.** NT-3 loại các *mốc nhanh* kiểu "hôm nay / 7 ngày qua / tháng này" vì chúng phục vụ **hành vi duyệt xem**. Picker ở đây chỉ chọn **đúng một ngày cụ thể** (A-5), là **đường phụ** bên cạnh đường chính là gõ tay `dd/MM/yyyy`, và không mở ra chế độ duyệt xem nào. Nó không tạo thêm hành động nào ở tầng một-ghi-chú (NT-2) và không trả về danh sách dài vô hạn (NT-3).
