# Epic 1 Context: Nền — khung dự án, lõi thuần, và kho dữ liệu bền

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic này dựng toàn bộ phần nền của sản phẩm ghi chú hàng ngày: một cây thư mục đúng chuẩn, một trang tĩnh tải được trên HTTPS mà sau khi tải xong không phát thêm một request mạng nào, năm module lõi thuần có test chạy ở Node, và một kho dữ liệu bền trên IndexedDB với luồng ghi chuẩn tồn tại **đúng một lần** cho mọi epic sau. Sau epic này chưa có gì để người dùng bấm — đó là đánh đổi có ý thức: những thứ "chỉ được có một nơi duy nhất" (khóa thời gian, bỏ dấu tiếng Việt, hằng số ngưỡng, tập mã lỗi) phải được xây trước, không được là sản phẩm phụ của một feature. Epic này cũng gánh **nửa chống mất dữ liệu** của hai lời hứa quan trọng nhất: giao diện không bao giờ tỏ ra đã lưu xong khi phép ghi thất bại, và bản nháp của một tab không bị tab khác lấy mất.

## Stories

- Story 1.1: Khung dự án chạy được trên HTTPS
- Story 1.2: Hằng số ngưỡng và tập mã lỗi đóng
- Story 1.3: Khóa thời gian — sắp xếp và lọc ngày
- Story 1.4: Bỏ dấu tiếng Việt, giữ nguyên vị trí ký tự
- Story 1.5: Khối state duy nhất và bộ khung action
- Story 1.6: Kho ghi chú bền và luồng ghi chuẩn
- Story 1.7: Bản nháp riêng từng tab, nhận lại được bản bỏ rơi
- Story 1.8: Hai bảng màu và theme không nháy lúc tải

**Nhân vật.** Sản phẩm có đúng một người dùng — **Nam** — và anh cũng là người xây. Story có người thụ hưởng là Nam-người-dùng thì viết "Nam"; story chỉ Nam-người-xây hưởng (kỷ luật mã, test, deploy) thì viết "người xây".

## Requirements & Constraints

- **Không cài đặt, không quyền admin, không mạng khi dùng.** App là trang tĩnh, mở cần mạng nhưng dùng thì không; chạy trong Chromium bản hiện hành trên Windows. Sau khi tải xong **không một request nào** — không webfont, không CDN, không `fetch`.
- **Dữ liệu không rời máy.** Không tài khoản, không đồng bộ, không analytics, không telemetry.
- **Ghi chú không tự mất đi.** Tồn tại qua đóng tab, khởi động lại máy, cập nhật phiên bản app. Sản phẩm không tự xóa theo tuổi và không áp giới hạn số lượng của riêng nó.
- **Địa chỉ app cố định.** Dữ liệu gắn với origin; đổi tên miền hoặc đường dẫn là mất toàn bộ ghi chú. README phải ghi rõ điều này.
- **Không thất bại im lặng.** Hết dung lượng thì báo rõ việc cần làm; không bao giờ tỏ ra đã lưu xong khi chưa lưu. Nửa cứng của lời hứa này hoàn thành tại epic này.
- **Nhiều tab không âm thầm ghi đè nhau.** Bản nháp khóa theo tab; kho bền là nguồn sự thật, không phải bộ nhớ.
- **Nội dung ghi chú là văn bản thuần**, nhiều dòng, trần 20.000 ký tự; vượt trần thì báo chứ không cắt im lặng. Epic này là chủ của trần độ dài (khai báo + kiểm ở lõi); ba cửa vào thực tế thuộc các epic sau.
- **Chuẩn hóa tiếng Việt là ràng buộc lưu trữ**, không phải xử lý ở lớp giao diện — dữ liệu được lưu và đánh chỉ mục ở dạng đã bỏ dấu.
- **Đường cơ sở hiệu năng:** từ mở tab tới gõ được ký tự đầu ≤ 2 giây với 2.000 ghi chú; không màn hình chờ, không splash.

## Technical Decisions

- **Không starter template, không bước build, không bundler, không transpile, không thư viện runtime.** Cây thư mục dựng tay theo Structural Seed: `index.html`, `app/main.js`, `app/core/`, `app/ports/`, `app/adapters/`, `app/view/`, `app/style.css`, `test/`. `package.json` chỉ để chạy Vitest; không dependency nào đi vào mã sản phẩm. App chỉ chạy trong secure context — `file://` bị cấm (ES module hỏng), README ghi cách chạy đúng qua HTTP server ở localhost.
- **Hướng phụ thuộc một chiều.** `core/` và `ports/` không import từ `adapters/`/`view/` và không chạm `window`/`document`/`indexedDB`/`localStorage`/`BroadcastChannel`. `main.js` là **file duy nhất** nối adapter thật vào port. Mọi module `core/` có test Vitest chạy ở Node, không giả lập trình duyệt. Ngoại lệ duy nhất được phép: script theme đồng bộ nội tuyến trong `<head>`.
- **Một đường duy nhất đổi state.** Một khối state trong bộ nhớ, chỉ đổi bên trong một action; view không ghi vào state và không giữ state riêng; adapter không đổi state. Năm port: `noteStore`, `sessionStore`, `channel`, `fileIO`, `quota`.
- **Im lặng khi thành công là ràng buộc kiến trúc.** State không có trường nào nghĩa "đang lưu", "đã lưu", "chưa chốt" hay "số ký tự còn lại" — nên view không có gì để vẽ ra.
- **Khối điều kiện là một giá trị** `{ keyword, date }`, khởi tạo `{ null, null }`; khung nhìn mặc định là *vắng mặt của điều kiện*, không phải một điều kiện.
- **Thời gian.** `createdAt` là ISO-8601 **có offset**. Hai khóa dẫn xuất sinh bởi đúng một module thuần: một khóa chuỗi 19 ký tự dùng làm **khóa sắp xếp duy nhất**, một khóa `yyyy-MM-dd` dùng làm **khóa lọc ngày duy nhất**. Cấm so chuỗi trực tiếp trên `createdAt` và cấm dựng `Date` từ nó cho mục đích hiển thị/sắp xếp/lọc; ngoại lệ duy nhất là hàm đếm số ngày, và hàm đó dựng `Date` ở UTC giữa trưa để không lệch một ngày qua mốc đổi giờ mùa hè.
- **Bỏ dấu.** Đúng một nơi bỏ dấu trong toàn repo, dùng cho cả đầu ghi lẫn đầu tìm. Thứ tự bắt buộc: map `đ→d`/`Đ→D` **trước**, rồi NFD, rồi bỏ dấu kết hợp, rồi hạ chữ thường. Bất biến cứng: độ dài không đổi và ký tự thứ `i` tương ứng đúng ký tự thứ `i` của đầu vào — đây là điều làm việc tô nền đúng vị trí bên trong chữ có dấu khả thi ở epic tra cứu.
- **Hằng số và lỗi.** Mọi ngưỡng số nằm ở đúng một file lõi và **chỉ ở đó** (trần ký tự, trần kết quả, số dòng thu gọn, ngưỡng nhắc sao lưu, debounce tự lưu, nhịp và ngưỡng cũ của bản nháp, hai ngưỡng cảnh báo dung lượng, phiên bản app). Tập mã lỗi là **tập đóng** sáu giá trị: `VERSION_SKEW`, `QUOTA`, `DB`, `BAD_FILE`, `BAD_VERSION`, `TOO_LONG`; lõi ánh xạ mỗi mã sang **đúng nguyên văn** microcopy tiếng Việt đã chốt; view không bao giờ tự soạn câu chữ từ lỗi thô. Có hàm dựng `Error` mang `code` để adapter và lõi ném cùng một hình dạng.
- **Kho dữ liệu.** DB `ghichu` version 1; store `notes` có index trên khóa ngày; store `drafts`. Bản ghi note có **đúng năm trường**: `id`, `createdAt`, `localDate`, `text`, `textFolded`; hai trường cuối là dẫn xuất, tính lại ở **mọi** lần ghi, không bao giờ sửa riêng lẻ; trong vòng đời schema version 1 cấm xóa hoặc đổi tên trường. `localStorage` mang **đúng ba key** (`ghichu.theme`, `ghichu.lastBackupAt`, `ghichu.persistDenied`) và **không một ghi chú nào**. Mọi key storage, tên DB và tên channel mang tiền tố/tên `ghichu`.
- **Toàn bộ ghi chú nằm trong RAM** dưới một mảng đã sắp xếp giảm dần theo khóa sắp xếp; lọc và tìm là quét mảng đồng bộ. Đọc IndexedDB chỉ ở **hai chỗ**: khởi động và khi nhận tin liên tab. RAM **không bao giờ** là nguồn sự thật cho một phép ghi.
- **Hai luồng ghi phải phân biệt được.** Thao tác **đổi sự tồn tại** của ghi chú: ghi xuống đĩa **trước**, đổi state **sau**; adapter ném lỗi thì action dừng và state giữ nguyên. Thao tác **tự lưu nội dung đang gõ**: state đổi ngay theo từng phím, phép ghi đi sau với debounce; mỗi mục tiêu tự lưu mang số đếm `seq` tăng dần và hẹn nào nổ ra với `seq` cũ thì bị bỏ, không ghi. Adapter không bao giờ gọi thẳng vào view, không `console.error` thay cho báo người dùng, không nuốt lỗi — `QuotaExceededError` được dịch thành lỗi mang `code = QUOTA` và ném ngược lên action.
- **Bản nháp riêng từng tab.** Bản nháp nằm ở IndexedDB (chứ không `localStorage`) vì chỉ IndexedDB có transaction, hình dạng `{ tabId, text, heartbeat }`. Quy tắc khởi động **bốn bước trong một transaction `readwrite` duy nhất**: đọc/sinh `tabId` → dùng bản của chính mình nếu có → nhận **nhiều nhất một** bản bỏ lại đã quá ngưỡng cũ → xóa mọi bản ghi có text rỗng. Vì `sessionStorage` bị sao chép khi nhân đôi tab, thấy bản ghi cùng `tabId` còn heartbeat tươi thì phải sinh `tabId` mới. Bản nháp **không bao giờ** đồng bộ sang tab khác và **không bao giờ** phát tin.
- **Test và deploy.** `adapters/` **không có test tự động** — bằng chứng duy nhất là một danh sách thử tay ghi trong README (story 1.1 tạo mục trống, các story sau điền vào). README có checklist deploy với bước **bump phiên bản app** đứng tường minh. Không CI, không staging, không rollback tự động; đường lui là `git revert` cộng bump phiên bản.

## UX & Interaction Patterns

Epic này dựng **hệ thống token, chưa dựng màn hình**. `style.css` khai báo **đủ hai bảng** 12 token màu (light + dark) đúng hex đã chốt, token typography 5 vai, thang spacing 4/8/12/16/20/28/40px cộng 6 token bố cục, và 4 cấp bo góc. Quy tắc cứng: **không một giá trị màu viết thẳng nào** ngoài phần khai báo token — đây cũng là cách bảo đảm tương phản ≥ 4.5:1 về sau. Mọi phông là **system font stack**: không Google Fonts, không webfont, không icon font.

Theme phải đọc bằng **script đồng bộ nội tuyến trong `<head>` của `index.html`**, đặt thuộc tính lên `<html>` **trước lần vẽ đầu tiên**, để mở tab giữa lúc làm việc không bị nháy màu. Đây là ngoại lệ duy nhất của quy tắc "không mã trình duyệt ngoài `app/`".

Hệ quả chấp nhận được: hết epic này bản dark **tồn tại nhưng chưa với tới được** — nút bật/tắt thuộc epic sau. Không có phụ thuộc ngược.

## Cross-Story Dependencies

- Epic 1 là **gốc** — không phụ thuộc epic nào. Mọi epic sau đều phụ thuộc nó.
- Trong epic: story 1.2 (hằng số + mã lỗi) và story 1.3 (khóa thời gian) phải có trước story 1.6 (kho ghi chú dùng cả hai). Story 1.5 (state + port) đi trước story 1.6 và 1.7 vì hai story kia nối adapter vào port. Story 1.4 (bỏ dấu) độc lập nhưng phải xong trước story 1.6 vì trường dẫn xuất đã bỏ dấu được tính ở mọi lần ghi. Story 1.1 dựng khung và mục danh sách thử tay mà story 1.6 điền vào.
- Story 1.8 độc lập với phần còn lại của epic (chỉ CSS + một script trong `<head>`), nhưng bảng dark là **tiền đề nghiệm thu tương phản** của epic accessibility.
- Ranh giới quan trọng cần giữ: luồng ghi chuẩn và khóa bản nháp theo tab xong **ở đây**, không hoãn sang epic đa tab; epic đa tab chỉ mua **sự tươi mới của màn hình**, không mua an toàn dữ liệu. Tương tự, cảnh báo trước ngưỡng dung lượng thuộc epic cuối, nhưng lời hứa "không tỏ ra đã lưu khi chưa lưu" phải **đúng từ epic này**.
