---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: final
epicCount: 8
storyCount: 33
inputDocuments:
  - prds/prd-ghi-chu-hang-ngay-2026-09-08/prd.md
  - architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md
  - architecture/architecture-ghi-chu-hang-ngay-2026-09-10/phan-chia-cong-viec.md
  - ux-designs/ux-Sticky Notes-2026-09-09/DESIGN.md
  - ux-designs/ux-Sticky Notes-2026-09-09/EXPERIENCE.md
---

# Ghi chú hàng ngày - Epic Breakdown

## Overview

Tài liệu này là bản chia epic và story đầy đủ cho **Ghi chú hàng ngày**, phân rã yêu cầu từ PRD,
cặp UX spine (DESIGN.md + EXPERIENCE.md) và ARCHITECTURE-SPINE.md thành story dựng được.

**Mã định danh là cố định vĩnh viễn.** `FR-N`, `NFR-N`, `NT-N`, `UJ-N`, `A-N` giữ nguyên số của PRD;
`AD-N` giữ nguyên số của spine kiến trúc; `UX-DR-N` được cấp mới trong tài liệu này.

**Nguồn sự thật khi xung đột:** ARCHITECTURE-SPINE.md quyết *ranh giới mã*, PRD quyết *cái gì phải
đúng*, EXPERIENCE.md quyết *hành vi nhìn thấy được*, DESIGN.md quyết *hình dạng và token*.

## Requirements Inventory

### Functional Requirements

**F1 · Ghi nhanh**

- **FR-1** · Gõ được ngay khi mở — con trỏ nằm sẵn trong ô soạn thảo khi trang tải xong; không nút "Tạo mới", không bước chọn loại/nơi lưu/định dạng.
- **FR-2** · Thời điểm tạo gán lúc **chốt** (không phải lúc gõ ký tự đầu), gồm ngày + giờ, theo giờ địa phương của máy tạo, không sửa được, không đổi khi nội dung đổi.
- **FR-3** · Tự lưu cả bản nháp lẫn ghi chú đang sửa trong lúc gõ, khoảng cách ≤ 1 giây; không có nút "Lưu"; bản nháp chưa chốt xuất hiện lại nguyên trạng khi mở app lần sau.
- **FR-4** · `Ctrl+Enter` chốt bản nháp thành ghi chú và làm trống ô soạn thảo, con trỏ vẫn ở trong đó. `Enter` đơn thuần xuống dòng. `Ctrl+Enter` khi bản nháp rỗng thì không làm gì.
- **FR-5** · Ghi chú rỗng không tồn tại — xóa hết ký tự rồi rời khỏi ghi chú thì nó biến mất, **không hỏi xác nhận**. Đây là ngoại lệ duy nhất của FR-11.
- **FR-18** · Ghi chú là văn bản thuần, nhiều dòng, độ dài tự do; xuống dòng giữ nguyên; không rich text, không ảnh, không đính kèm. Trần **20.000 ký tự** (A-12), vượt trần thì báo chứ không cắt im lặng.
- **FR-19** · Không được thất bại im lặng khi hết dung lượng — báo rõ việc cần làm, không bao giờ tỏ ra đã lưu xong khi chưa lưu, và có cảnh báo **trước** khi chạm giới hạn.
- **FR-20** · Nhiều tab không được âm thầm ghi đè nhau — ghi chú và bản nháp ở tab này không bị tab kia làm mất; nếu không bảo đảm được bằng cơ chế thì phải cảnh báo.

**F2 · Dòng ghi chú**

- **FR-6** · Khung nhìn mặc định chỉ chứa ghi chú của **hôm nay**; chiều dài của nó không phụ thuộc tổng số ghi chú trong máy. Đường ra khỏi hôm nay là F4, và chỉ F4.
- **FR-7** · Mới nhất trên cùng, xếp theo thời điểm tạo giảm dần trong **mọi** khung nhìn; không có cách nào đổi thứ tự; sửa nội dung không làm ghi chú đổi vị trí.
- **FR-8** · Ghi chú dài quá **3 dòng** (A-2) hiển thị cắt bớt kèm dấu hiệu còn nội dung; mở rộng được **tại chỗ**; khi chưa mở rộng mọi ghi chú có cùng chiều cao trần. Trạng thái mở rộng không nhớ giữa các phiên (A-3).
- **FR-9** · Trạng thái rỗng không cần giải thích — hôm nay chưa có ghi chú thì màn hình chỉ có ô soạn thảo; **không** thông báo, **không** hình minh họa chào mừng.

**F3 · Sửa & Xóa**

- **FR-10** · Sửa nội dung tự do ở mọi khung nhìn, lưu tự động theo ràng buộc ≤ 1 giây của FR-3; không đổi thời điểm tạo, không đổi vị trí; **không lưu lịch sử sửa đổi**.
- **FR-11** · Xóa phải qua một bước xác nhận có hai lựa chọn `hủy`/`xóa`; `Esc` hoặc click ra ngoài = **hủy**; sau khi xóa không có cách nào lấy lại từ trong app (không thùng rác, không hoàn tác). Xóa **không** xóa khỏi các file sao lưu đã tạo trước đó.

**F4 · Tra cứu**

- **FR-12** · Tìm bằng chữ trên **toàn bộ** ghi chú (không giới hạn theo khung nhìn đang hiện); ô tìm kiếm luôn có mặt; **bỏ dấu tiếng Việt và không phân biệt hoa/thường**; lọc dần theo từng ký tự (A-4); trần **50 kết quả** kèm chỉ báo còn nhiều hơn (A-11); kết quả xếp mới nhất trên cùng và mang thời điểm tạo; không khớp gì thì nói rõ.
- **FR-13** · Lọc theo **đúng một** ngày lịch `dd/MM/yyyy` (A-5); không có mốc nhanh kiểu "hôm nay / 7 ngày qua / tháng này".
- **FR-14** · Kết hợp điều kiện — bộ lọc ngày và từ khóa giao nhau; khung nhìn mặc định là **trạng thái** chứ không phải điều kiện; **bắt đầu gõ vào ô soạn thảo xóa hết mọi điều kiện**, gõ vào ô tìm kiếm thì không; điều kiện đang bật phải nhìn thấy được; luôn có đường về mặc định trong **một** thao tác; tải lại trang thì mọi điều kiện bị xóa (A-6).

**F5 · Sao lưu & Khôi phục**

- **FR-15** · Xuất **một** file chứa **toàn bộ** ghi chú, không phụ thuộc điều kiện đang áp dụng; giữ nội dung + thời điểm tạo + định danh cho mỗi ghi chú; file ghi lại **thời điểm nó được xuất ra**; không chứa bản nháp; định dạng máy đọc được có số phiên bản (A-7); tên file chứa ngày xuất (A-8); dữ liệu chỉ rời máy khi người dùng chủ động bấm.
- **FR-16** · Nạp lại từ file sao lưu, **giữ nguyên thời điểm tạo gốc**; nạp là **gộp theo định danh**, không phải thay thế — đã có thì bỏ qua, chưa có thì thêm; **không bao giờ** xóa hay ghi đè ghi chú đang có; file hỏng/sai định dạng/sai phiên bản thì báo lỗi rõ và **không đụng một chữ** vào dữ liệu đang có.
- **FR-17** · Nhắc thụ động về lần sao lưu gần nhất — app ghi nhớ mốc xuất gần nhất và **lấy lại được mốc đó từ file sao lưu** khi nạp trên máy mới; hiện dạng một dòng nhỏ, không chặn đường, không hộp thoại, không phải bấm để tắt; chỉ hiện khi đã quá **7 ngày** chưa sao lưu (A-9).

### NonFunctional Requirements

- **NFR-1** · Mở là dùng được ngay — từ lúc mở tab tới lúc gõ được ký tự đầu tiên **≤ 2 giây** (A-13), kể cả khi đã có 2.000 ghi chú. Không màn hình chờ, không splash screen.
- **NFR-2** · Tra cứu phải nhanh hơn trí nhớ — với 2.000 ghi chú, tìm bằng chữ và lọc theo ngày trả kết quả trong **≤ 200 ms** (A-14).
- **NFR-3** · Ghi chú không tự mất đi — tồn tại qua đóng tab, khởi động lại máy, và cập nhật phiên bản app; sản phẩm không tự xóa theo tuổi và không áp giới hạn số lượng của riêng nó. Hai chỗ lời hứa có thể gãy là FR-19 và FR-20.
- **NFR-4** · Mở app cần mạng; dùng app thì không — trang tĩnh trên GitHub Pages, sau khi tải xong mọi thao tác diễn ra hoàn toàn trong máy, không gọi dịch vụ ngoài.
- **NFR-5** · Dữ liệu không rời máy — không tài khoản, không đăng nhập, không đồng bộ, không analytics, không telemetry.
- **NFR-6** · Chuẩn hóa tiếng Việt là ràng buộc **lưu trữ**, không chỉ là so chuỗi — ảnh hưởng cách dữ liệu được lưu và đánh chỉ mục, không xử lý ở lớp giao diện.
- **NFR-7** · Không cài đặt, không quyền admin — chạy trong **Chromium bản hiện hành** (Edge/Chrome) trên Windows (A-10, chốt bởi AD-12).
- **NFR-8** · Địa chỉ app phải cố định — dữ liệu gắn với origin; đổi tên miền hoặc đường dẫn là mất toàn bộ ghi chú.

**Nguyên tắc thiết kế (tiêu chí loại trừ, áp cho mọi story):**

- **NT-1** · Cửa vào: không có quyết định nào giữa ý nghĩ và con chữ.
- **NT-2** · Cửa sau: đúng ba hành động chạm được vào một ghi chú — **tạo mới · sửa nội dung · xóa**. Chỉ canh tầng *một ghi chú*; tầng *dòng ghi chú* và tầng *kho dữ liệu* không thuộc phạm vi NT-2.
- **NT-3** · Không bao giờ bắt người dùng nhìn cả đống — không có chế độ duyệt xem, không khung nhìn nào trả về danh sách dài vô hạn.
- **NT-4** · Thời điểm tạo là bất biến — thứ tự luôn theo thời điểm tạo, không sắp xếp lại thủ công.

### Additional Requirements

*(từ ARCHITECTURE-SPINE.md — ràng buộc kỹ thuật ảnh hưởng trực tiếp tới story và acceptance criteria)*

**Starter template:** **KHÔNG có starter template, KHÔNG có bước build** (AD-12). Story đầu tiên của
epic nền dựng cây thư mục bằng tay theo Structural Seed, không scaffold từ generator nào.

- **AD-1** · Một đường duy nhất đổi state — state chỉ đổi bên trong một action ở `core/`; view không ghi vào state, không giữ state riêng; adapter không đổi state.
- **AD-2** · Hướng phụ thuộc một chiều — `core/` và `ports/` không import từ `adapters/`/`view/`, không chạm `window`/`document`/`indexedDB`; chỉ `main.js` nối adapter thật vào port; mọi module `core/` có test Vitest chạy ở Node.
- **AD-3** · Ba tầng phạm vi state (A bền dùng chung · B bền riêng tab · B′ bền dùng chung không phải ghi chú · C phù du); không ghi chú nào ở `localStorage`; không state tầng C nào xuống kho bền; quy tắc khởi động bản nháp 4 bước trong **một** transaction `readwrite`.
- **AD-4** · `createdAt` là ISO-8601 **có offset**; hai khóa dẫn xuất `localStamp` (sắp xếp) và `localDate` (lọc ngày) sinh bởi `core/time.js`; cấm so chuỗi trên `createdAt`, cấm `new Date(createdAt)`; ngoại lệ duy nhất là `daysBetween()`.
- **AD-5** · `fold(text)` ở `core/fold.js` là nơi **duy nhất** bỏ dấu, dùng cho cả đầu ghi lẫn đầu tìm; thứ tự bắt buộc `đ→d` **trước** NFD; bất biến `fold(t).length === t.length` và khớp vị trí từng ký tự.
- **AD-6** · Toàn bộ ghi chú trong RAM; lọc và tìm là quét mảng **đồng bộ**; đọc IndexedDB chỉ ở khởi động và khi nhận BroadcastChannel; mọi phép ghi đọc/ghi trên IndexedDB trước rồi mới nạp lại RAM.
- **AD-7** · Đúng một kênh `BroadcastChannel('ghichu')`, đúng một hình dạng bản tin bốn trường, đúng hai `type`; bản tin **không bao giờ mang nội dung**; bản nháp không bao giờ phát tin và không bị tab khác đụng.
- **AD-8** · Hai luồng ghi phải phân biệt được — đổi sự tồn tại: **ghi trước, đổi state sau**; tự lưu nội dung: state trước, ghi sau với debounce `AUTOSAVE_MS`. Kỷ luật `seq` cho hẹn debounce; `chotGhiChu` ghi `notes` + làm rỗng `drafts` trong **một** transaction. Adapter không bao giờ gọi thẳng vào view.
- **AD-9** · Origin cố định `https://truongthanhnam.github.io/bmad/`; DB `ghichu`, channel `ghichu`, mọi key storage mang tiền tố `ghichu.`.
- **AD-10** · Gọi `navigator.storage.persist()` ở **mỗi** lần khởi động cho tới khi trả `true`; bị từ chối thì ghi `ghichu.persistDenied` và hạ ngưỡng nhắc 7 → 3 ngày; cảnh báo trước ngưỡng khi `usage/quota ≥ 0.80` **hoặc** `quota - usage < 50 MB`; `estimate()` không bao giờ dùng để quyết định có ghi hay không.
- **AD-11** · File sao lưu là hợp đồng có phiên bản `{ schemaVersion: 1, exportedAt, notes: [{id, createdAt, text}] }`, tên `ghi-chu-hang-ngay-YYYY-MM-DD.json`; nạp đi qua **hai pha** (kiểm tra toàn bộ trước, rồi ghi trong **một** transaction); `backup.js` trả `{added, skipped}`; `ghichu.lastBackupAt` cập nhật ở **cả hai** đường.
- **AD-12** · Không bước build, không bundler, không transpile, **không thư viện runtime**; `package.json` chỉ để chạy Vitest; app chỉ chạy trong secure context, cấm `file://`; **sau khi tải xong không phát một request mạng nào**.
- **AD-13** · Bản ghi `notes` có **đúng năm trường** `id · createdAt · localDate · text · textFolded`; hai trường dẫn xuất tính lại ở mọi lần ghi; trong vòng đời `schemaVersion: 1` cấm xóa hoặc đổi tên trường.
- **AD-14** · Mọi hằng số ngưỡng ở `core/limits.js` và **chỉ ở đó**; trần độ dài kiểm ở `core/` tại **cả ba** cửa vào (chốt · sửa · file nạp); `query.js` trả `{items, total}` với `total` là số khớp **thật**, cấm view đếm `items.length`.
- **AD-15** · Điều kiện là **một** giá trị `{ keyword, date }`; khung nhìn mặc định là `{null, null}` — **vắng mặt của điều kiện**; đúng một action `datDieuKien` và một action `xoaHetDieuKien`; `chotGhiChu` gọi `xoaHetDieuKien()` như bước đầu tiên.
- **AD-16** · Im lặng khi thành công là **ràng buộc kiến trúc** — state không có trường nào nghĩa "đang lưu"/"đã lưu"/"chưa chốt"/"số ký tự còn lại"; ngoại lệ duy nhất là kết quả một lần nạp file.
- **AD-17** · Dải băng có đúng một chủ (`view/banner.js`) và một bảng **bảy nguồn** xếp theo ưu tiên; thông báo ưu tiên thấp không được thay thông báo ưu tiên cao đang hiện; dòng nhắc sao lưu và lỗi định dạng ô ngày **không** đi qua dải băng.
- **AD-18** · Tập mã lỗi **đóng**: `VERSION_SKEW · QUOTA · DB · BAD_FILE · BAD_VERSION · TOO_LONG`; `core/` ánh xạ `code` sang microcopy; view không bao giờ tự soạn câu chữ từ lỗi thô.
- **AD-19** · Tab title và theme là **hàm của state**; tab title luôn là số ghi chú có `localDate` = hôm nay, không phụ thuộc điều kiện; theme đọc bằng script **đồng bộ nội tuyến trong `<head>` của `index.html`** trước lần vẽ đầu tiên.
- **AD-20** · Sàn accessibility là ràng buộc dựng được — sáu mục, mỗi mục có một chỗ dựng cụ thể.
- **AD-21** · Phát hiện lệch phiên bản, không phá cache — `APP_VERSION` bump tay mỗi lần deploy, đi trong mọi bản tin; tab nhận `appVersion` khác thì vào **chế độ chỉ đọc**, mọi action ghi trả `VERSION_SKEW`, hẹn tự lưu bị hủy, dải băng ưu tiên 1 không đóng được.

**Hạ tầng, deploy và test:**

- Stack: HTML/CSS/JS (ES modules) chuẩn hiện hành · IndexedDB (`ghichu` v1, store `notes` + `drafts`) · `localStorage`/`sessionStorage` tiền tố `ghichu.` · `BroadcastChannel` · `navigator.storage` · Vitest 5.0.0 · GitHub Pages (repo `TruongThanhNam/bmad`, nhánh `main`, thư mục gốc, HTTPS).
- Cây thư mục phải khớp **Structural Seed** của spine.
- `adapters/` **không có test tự động** — bằng chứng duy nhất là một danh sách thử tay ghi trong README.
- **Bump `APP_VERSION` mỗi lần deploy** → checklist deploy trong README.
- Không CI, không staging, không rollback tự động — đường lui là `git revert` + bump `APP_VERSION`.

### UX Design Requirements

*(từ DESIGN.md + EXPERIENCE.md — mỗi mục đủ cụ thể để sinh story có acceptance criteria kiểm chứng được)*

**Nền tảng và bố cục**

- **UX-DR-1** · **Bốn tầng cố định từ trên xuống**: (1) ô soạn thảo → (2) khay tìm kiếm + bộ lọc ngày → (3) lưới ghi chú → (4) chân trang. Ba tầng đầu **không cuộn**; chỉ tầng lưới cuộn. Single-surface: không điều hướng, không route, không màn hình thứ hai.
- **UX-DR-2** · **Lưới nhiều cột auto-fill, không breakpoint cố định**: `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, `gap: 8px`, `max-width` vùng chứa **1040px** căn giữa → trần thực tế **3 cột**, tự rớt về 2 rồi 1 cột.
- **UX-DR-3** · **Hướng đọc trong lưới là TRÁI→PHẢI, hết hàng xuống hàng** (không masonry, không điền dọc từng cột). Ghi chú mới nhất ở **ô trên-cùng-trái**; mẩu vừa chốt đẩy mọi mẩu khác dịch một ô về sau.
- **UX-DR-4** · **Siết mật độ có ý thức** — padding mẩu giấy `8px/12px`, khe lưới `8px`, lề trang `16px`. Đây là câu trả lời cho SM-4; cấm nới ra cho "thoáng hơn".

**Hệ thống token**

- **UX-DR-5** · **Triển khai đủ hai bảng màu (light + dark)** — 12 token màu mỗi bảng, đúng hex ở `DESIGN.md.Colors`. `{colors.ink-decor}` **không bao giờ là chữ**. `style.css` **chỉ dùng token**, không một giá trị màu viết thẳng ở bất kỳ đâu (đây cũng là cách AD-20 mục 4 bảo đảm tương phản ≥ 4.5:1).
- **UX-DR-6** · **Token typography 5 vai**: `note` (14.5px) · `composer` (15px) · `time` (monospace 11.5px/600) · `ui` (13px) · `foot` (11.5px). **System font stack, không webfont, không icon font, không tài nguyên mạng nào.** `font-weight` chỉ có 400 và 600. `white-space: pre-wrap` cho nội dung ghi chú.
- **UX-DR-7** · **Thang spacing 4/8/12/16/20/28/40px** cộng 6 token bố cục (`note-padding-y/x`, `grid-gap`, `page-gutter`, `note-min-col`, `container-max`).
- **UX-DR-8** · **Bốn cấp bo góc**: `paper` 3px · `input` 6px · `tray` 8px · `full` 9999px (chỉ chip điều kiện và nút theme). Không hình tròn, không pill cho bất cứ gì khác.
- **UX-DR-9** · **Ngôn ngữ vật liệu: giấy nhô lên, chỗ gõ lún xuống.** Mẩu giấy có bóng nhị + dải keo `inset 0 3px 0`; ô soạn thảo có bóng **lõm** `inset 0 1px 2px`. Dark đổi bóng sang `rgba(0,0,0,.45)` và thay lớp sát mép bằng hairline sáng. Bóng sâu `0 12px 32px` **chỉ** ở hộp thoại xác nhận xóa. Dải băng, chip, khay tìm kiếm **không có bóng**.

**Component (13 component, không kế thừa từ library nào — vanilla, định nghĩa từ đầu)**

- **UX-DR-10** · **Ô soạn thảo** — `{colors.surface}`, min-height 92px, tự cao thêm; **placeholder trống hoàn toàn** ở trạng thái mặc định; dòng gợi ý `Ctrl+Enter để chốt` bên dưới; focus ring 3px + viền `{colors.focus}`.
- **UX-DR-11** · **Khay tìm kiếm** — nền `{colors.chip-bg}` **sẫm hơn nền bàn** (cơ chế tách vùng #1), chứa nhãn chữ `tìm` + ô từ khóa (giãn nở) và nhãn `ngày` + ô ngày (cố định 118px).
- **UX-DR-12** · **Ô ngày** — chữ monospace, placeholder `dd/MM/yyyy`; **icon lịch inline SVG 16px là icon DUY NHẤT của toàn sản phẩm**; gõ tay là đường chính, picker là đường phụ chọn đúng một ngày; sai định dạng → viền `{colors.danger}` + thông báo dưới ô, **lưới không đổi**.
- **UX-DR-13** · **Chip điều kiện** — một chip mỗi điều kiện đang bật, `{rounded.full}`; chip **không bấm được để xóa**, chỉ để nhìn; hàng chip kèm số kết quả và link `về hôm nay`.
- **UX-DR-14** · **Mẩu giấy** — đầu mẩu: giờ tạo trái, `xóa` phải; thân thu gọn ở 3 dòng với dòng `còn N dòng ▾` / `thu lại ▴`; **click 1 = mở rộng tại chỗ, click 2 = vào chế độ sửa** — hai nhịp không bao giờ nhập một (mẩu ≤ 3 dòng thì click 1 đã là vào chế độ sửa); chế độ sửa đổi nền sang `{colors.surface}` + viền `{colors.focus}`.
- **UX-DR-15** · **Nút xóa** — chữ `xóa`, `{colors.ink-2}`, gạch chân đứt; **luôn hiện trên mọi mẩu, không hover-only**; hover/focus đổi sang `{colors.danger}`.
- **UX-DR-16** · **Hộp thoại xác nhận xóa** — overlay `rgba(0,0,0,.32)` căn giữa, sâu một tầng; tiêu đề `Xóa ghi chú này?`, thân `Không có thùng rác và không hoàn tác được.`, hai lựa chọn dạng chữ ngang hàng `hủy`/`xóa` (không nút màu đầy); **focus mặc định đặt vào `hủy`**.
- **UX-DR-17** · **Dải băng thông báo** — một dải duy nhất ở đỉnh trang, **đẩy nội dung xuống chứ không phủ lên**; một hình dạng cho mọi loại, **không biến thể màu theo loại lỗi**; nút đóng là dấu `✕` kèm nhãn `đóng thông báo`; loại 1 (hết dung lượng) và loại 2 (lệch phiên bản) **không đóng được**.
- **UX-DR-18** · **Tô từ khóa khớp** — nền `{colors.hl}`, chữ giữ `{colors.ink}`; phải tô **đúng vị trí bên trong chữ có dấu** (`phan quyen` tô đúng `Phân quyền`); chỉ xuất hiện trong kết quả tìm.
- **UX-DR-19** · **Chân trang** — hai link `xuất sao lưu` · `nạp lại` **thường trực, không bao giờ ẩn, không phụ thuộc dòng nhắc**; dòng nhắc sao lưu cùng dòng; nút theme đẩy sang phải.
- **UX-DR-20** · **Nút theme** — nhãn **chữ** `nền tối` / `nền sáng` (không icon mặt trời/mặt trăng), viền mảnh `{rounded.full}`, lựa chọn được nhớ lại. `[OVERRIDE-1]`.
- **UX-DR-21** · **Tab title** dạng `4 - Ghi chú hàng ngày`, số là ghi chú **của hôm nay**. `[OVERRIDE-2]`.

**Hành vi và trạng thái**

- **UX-DR-22** · **Bốn cơ chế tách ô soạn thảo khỏi ô tìm kiếm, cộng dồn**: (1) vật liệu khác nhau; (2) khay tìm kiếm có nhãn chữ, ô soạn thảo không nhãn; (3) vị trí và thứ tự tab; (4) khi có điều kiện bật, ô soạn thảo hiện placeholder `gõ vào đây sẽ bỏ mọi điều kiện lọc` — **ngoại lệ duy nhất** của quy tắc placeholder trống.
- **UX-DR-23** · **Định dạng thời gian phụ thuộc khung nhìn**: khung nhìn mặc định hiện **chỉ `HH:mm`**; khi đang tra cứu hiện **đầy đủ `dd/MM/yyyy HH:mm`**.
- **UX-DR-24** · **11 trạng thái của bề mặt duy nhất** phải dựng đủ: rỗng · hôm nay có ghi chú · đang tra cứu · vượt trần kết quả · không có kết quả · đang mở rộng · đang sửa · bản nháp chưa chốt · lỗi · tải lại trang. **Không có** trạng thái offline, cold-load/skeleton, hay permission-denied.
- **UX-DR-25** · **"Không có kết quả" phải phân biệt được với "rỗng bình thường"** bằng **ba dấu hiệu cùng lúc**: hàng chip vẫn hiện ghi `0 ghi chú` · dòng `Không có ghi chú nào khớp.` trong vùng lưới · link `về hôm nay` vẫn ở đó. Đây là chỗ **duy nhất** một vùng lưới trống được phép nói chữ.
- **UX-DR-26** · **Bàn phím: đúng bốn phím**, không hơn — `Ctrl+Enter` chốt · `Enter` xuống dòng · `Esc` hủy hộp thoại · `Tab`/`Shift+Tab` di chuyển focus. **KHÔNG** `/`, **KHÔNG** `Ctrl+K`, không phím tắt cho xóa/sao lưu/theme.
- **UX-DR-27** · **Bị cấm tuyệt đối**: kéo-thả sắp xếp, chọn nhiều mẩu, menu ngữ cảnh, long-press, double-click cho việc khác, cuộn vô hạn, hover-only affordance, **hoạt ảnh vào/ra danh sách** (mẩu bị xóa biến mất đột ngột).
- **UX-DR-28** · **Bảng microcopy đầy đủ** — 5 dòng dải băng + 17 dòng còn lại, dùng **nguyên văn** tiếng Việt như EXPERIENCE.md. Voice: khô, trực tiếp, không dấu chấm than, không emoji, không "bạn", không xin lỗi, không chúc mừng. Lỗi phải nói rõ **việc cần làm**.
- **UX-DR-29** · **Chuyển màu hover/focus ≤ 120ms**, và **mọi** chuyển động nằm trong một khối `@media (prefers-reduced-motion: no-preference)` duy nhất — mặc định là **không có chuyển động**.

**Sàn accessibility (6 mục, ràng buộc cứng — AD-20 giao cho một epic có chủ)**

- **UX-DR-30** · Tương phản chữ **≥ 4.5:1 ở cả light và dark**; chữ nhỏ nhất dùng `{colors.ink-2}`. Cặp `{colors.danger}` trên `{colors.chip-bg}` ở dark chỉ **4.55:1** — ai đổi `chip-bg-dark` phải tính lại trước khi commit.
- **UX-DR-31** · **Focus ring `{colors.focus}` nhìn thấy được trên MỌI phần tử tương tác**; `outline: none` **bị cấm tuyệt đối** — grep `style.css` không được ra chuỗi này.
- **UX-DR-32** · **Tab order đúng thứ tự đọc**: `✕` dải băng (nếu có) → ô soạn thảo → ô tìm kiếm → ô ngày → icon lịch → `về hôm nay` (nếu có) → từng mẩu giấy theo hướng trái-sang-phải (thân rồi nút xóa) → `xuất sao lưu` → `nạp lại` → nút theme. **Không `tabindex` dương ở bất kỳ đâu.** Hộp thoại xác nhận **giam focus** trong nó và **trả focus về đúng nút xóa vừa bấm** khi đóng.
- **UX-DR-33** · **Phóng trình duyệt tới 200% vẫn dùng được** — rớt về 1 cột là chấp nhận được; không chữ bị cắt, không điều khiển bị đẩy ra ngoài khung. Dùng đơn vị tương đối và grid `auto-fill`, không `px` cứng cho chiều rộng vùng chứa.
- **UX-DR-34** · **Tôn trọng `prefers-reduced-motion`** — bỏ luôn cả chuyển màu hover/focus.
- **UX-DR-35** · **Không dùng màu làm tín hiệu duy nhất** — ô ngày sai định dạng: viền `{colors.danger}` **cộng** thông báo chữ; điều kiện đang bật: chip có **chữ**, không chỉ đổi viền. Mọi điều khiển chỉ có ký hiệu (`✕`, icon lịch) **phải mang nhãn chữ**.

> **KHÔNG làm, có ý thức** (n = 1, người dùng duy nhất không dùng screen reader): không ARIA đầy đủ,
> không `aria-live` cho kết quả tìm, không kiểm tra bằng screen reader, không WCAG 2.2 AA đầy đủ.
> Đây là quyết định có ý thức, không phải sơ suất.

### FR Coverage Map

Mỗi FR được gánh bởi **một epic chủ** (in đậm) — nơi nó được nghiệm thu. Một số FR có epic phụ đóng
góp một phần; cột ghi chú nói rõ phần nào.

| FR | Epic chủ | Epic phụ | Ghi chú |
|---|---|---|---|
| FR-1 · Gõ được ngay khi mở | **Epic 2** | — | Con trỏ sẵn trong ô soạn thảo lúc tải xong |
| FR-2 · Thời điểm tạo bất biến | **Epic 2** | Epic 1 | Epic 1 dựng `core/time.js` (`localStamp`/`localDate`, AD-4); Epic 2 gán lúc chốt |
| FR-3 · Tự lưu, không thao tác lưu | **Epic 2** | Epic 1, Epic 7 | Epic 1 dựng store `drafts` + luồng ghi AD-8; Epic 7 bảo đảm tab kia không xóa mất bản nháp |
| FR-4 · Chốt và gõ tiếp | **Epic 2** | — | `Ctrl+Enter` chốt, `Enter` xuống dòng |
| FR-5 · Ghi chú rỗng không tồn tại | **Epic 5** | — | Ngoại lệ duy nhất của FR-11 |
| FR-6 · Khung nhìn mặc định chỉ hôm nay | **Epic 2** | Epic 6 | Epic 6 dựng AD-15 đầy đủ (mặc định là *vắng mặt của điều kiện*) |
| FR-7 · Mới nhất trên cùng | **Epic 2** | Epic 1 | Epic 1 khóa sắp xếp `localStamp`; Epic 2 hướng đọc trái→phải trong lưới |
| FR-8 · Cắt 3 dòng, mở rộng tại chỗ | **Epic 2** | — | Trạng thái mở rộng ở tầng C, mất sau tải lại (A-3) |
| FR-9 · Trạng thái rỗng không giải thích | **Epic 2** | — | Không một chữ nào |
| FR-10 · Sửa nội dung tự do | **Epic 5** | — | `createdAt` và vị trí không đổi |
| FR-11 · Xóa phải xác nhận | **Epic 5** | Epic 3 | Epic 3 dựng giam focus + trả focus (AD-20 mục 2) |
| FR-12 · Tìm bằng chữ, bỏ dấu | **Epic 6** | Epic 1 | Epic 1 dựng `core/fold.js` + bất biến độ dài/vị trí (AD-5) |
| FR-13 · Lọc theo một ngày | **Epic 6** | Epic 1 | Epic 1 dựng khóa `localDate` + index |
| FR-14 · Kết hợp điều kiện, đường về | **Epic 6** | Epic 2 | Epic 2 gọi `xoaHetDieuKien()` khi gõ vào ô soạn thảo |
| FR-15 · Xuất file sao lưu | **Epic 4** | — | Toàn bộ ghi chú, không phụ thuộc điều kiện |
| FR-16 · Nạp lại từ file sao lưu | **Epic 4** | Epic 3 | Epic 3 dựng dải băng — nơi hai con số `{added, skipped}` hiện ra |
| FR-17 · Nhắc thụ động về sao lưu | **Epic 4** | Epic 8 | Epic 8 hạ ngưỡng 7 → 3 ngày khi `persistDenied` |
| FR-18 · Nội dung một ghi chú | **Epic 1** | Epic 2, Epic 5, Epic 4 | `core/limits.js` là chủ; ba epic kia là **ba cửa vào** phải kiểm (AD-14) |
| FR-19 · Không thất bại im lặng khi hết dung lượng | **Epic 1** *(nửa cứng)* + **Epic 8** *(nửa cảnh báo)* | Epic 3 | **FR bị chẻ đôi — xem ghi chú bên dưới.** Epic 1 dựng AD-8 (ghi trước, đổi state sau) nên giao diện **không bao giờ** giả vờ đã lưu; Epic 8 thêm `persist()` và cảnh báo **trước** ngưỡng; Epic 3 dựng dải băng ưu tiên 2 không đóng được |
| FR-20 · Nhiều tab không ghi đè nhau | **Epic 1** *(nửa cứng)* + **Epic 7** *(nửa tươi mới)* | — | **FR bị chẻ đôi — xem ghi chú bên dưới.** Epic 1 dựng AD-3 tầng B (bản nháp khóa theo `tabId`, 4 bước một transaction) và AD-6 (RAM không bao giờ là nguồn sự thật cho phép ghi); Epic 7 thêm đồng bộ `BroadcastChannel` và phát hiện lệch phiên bản |

> ### ⚠️ Hai FR bị chẻ đôi, và vì sao thứ tự epic không nói dối
>
> **FR-19 và FR-20 là hai FR duy nhất được thêm vào PRD *sau vòng reviewer*, và cả hai được kiến
> trúc bịt bằng cơ chế ở tầng nền chứ không bằng tính năng ở tầng trên.** Hệ quả: mỗi FR có một
> **nửa chống mất dữ liệu** hoàn thành ngay ở Epic 1, và một **nửa dễ chịu** rơi vào epic cuối.
> Tên của Epic 7 và Epic 8 vì thế trông như hai rủi ro đang bị hoãn — chúng không phải.
>
> **FR-20 · thiếu Epic 7 thì Nam mất gì?** Tab A chốt một ghi chú, tab B không nhận được tin nên
> RAM của tab B cũ. Nhưng AD-6 quy định *"mảng trong RAM không bao giờ là nguồn sự thật cho một
> thao tác ghi"* — mọi phép ghi đọc và ghi trên IndexedDB rồi mới nạp lại RAM. Nên tab B chốt tiếp
> thì nó **thêm** một bản ghi, không đè lên bản ghi của tab A. Bản nháp thì đã được AD-3 tầng B khóa
> theo `tabId` từ Epic 1. **Kết luận: thiếu Epic 7, tab thứ hai chỉ *hiển thị cũ cho tới khi F5* —
> không mất dữ liệu.** Đó là lý do Epic 7 nằm áp chót được mà vẫn an toàn. Ai viết acceptance
> criteria cho Epic 7 mà không biết điều này sẽ hoảng và kéo nó lên sớm, phá mất thứ tự.
>
> **FR-19 · thiếu Epic 8 thì Nam mất gì?** AD-8 đã có từ Epic 1: `QuotaExceededError` ném lên, action
> dừng, state giữ nguyên, mẩu giấy **không** xuất hiện. Nên lời hứa cứng của FR-19 — *"app không bao
> giờ để một thao tác lưu thất bại mà giao diện vẫn tỏ ra như đã lưu xong"* — **đã đúng từ Epic 1**.
> Epic 8 mua thêm hai thứ: `navigator.storage.persist()` để trình duyệt không lặng lẽ dọn dữ liệu,
> và cảnh báo **trước** khi chạm ngưỡng thay vì chỉ báo lúc đã hỏng.

**NFR:** NFR-1 → Epic 1 (đường cơ sở) + Epic 2 (nghiệm thu) · NFR-2 → Epic 6 · NFR-3 → Epic 1 +
Epic 7 + Epic 8 · NFR-4, NFR-5, NFR-7 → Epic 1 · NFR-6 → Epic 1 (`fold.js`) + Epic 6 (đầu tìm) ·
NFR-8 → Epic 1.

**Nguyên tắc:** NT-1 → Epic 2 · NT-2 → Epic 5 · NT-3 → Epic 2 + Epic 6 · NT-4 → Epic 1 + Epic 2.

**UX-DR:** UX-DR-1…9 (bố cục + token, **cả hai bảng màu**) → Epic 1 và Epic 2 · UX-DR-10, 14, 21,
22, 23, 24 → Epic 2 · UX-DR-17, **UX-DR-20**, 26…35 (dải băng, nút theme, tương tác, sàn a11y) →
Epic 3 · UX-DR-19 → Epic 4 · UX-DR-15, 16 → Epic 5 · UX-DR-11, 12, 13, 18, 25 → Epic 6 ·
UX-DR-28 (microcopy) → rải theo epic sở hữu từng dòng chữ.

> ### Theme bị tách làm đôi, có chủ ý
>
> **`[OVERRIDE-1]` không thuộc UJ-1.** UJ-1 có bảy bước — bấm sang tab, con trỏ đã sẵn, gõ,
> `Ctrl+Enter`, mẩu giấy nhô lên, bấm về IDE — và không bước nào tên là "đổi sang nền tối". Nút
> theme tồn tại vì nền ấm chói mắt khi đặt cạnh IDE tối; đó là lời than về **sự dễ chịu**, không
> phải về việc ghi chú. Nó không được làm loãng epic quan trọng nhất dự án.
>
> Nhưng nó không tách rời hẳn được, vì AD-19 buộc theme phải đọc bằng **script đồng bộ nội tuyến
> trong `<head>`, trước lần vẽ đầu tiên** — nếu không sẽ nháy màu sai lúc tải trang. Nên:
>
> | Phần | Epic | Lý do |
> |---|---|---|
> | Hai bảng token màu đầy đủ trong `style.css` + script nội tuyến đọc `ghichu.theme` | **Epic 1** | AD-19 buộc script nằm trong `index.html`; token chỉ là giá trị CSS, rẻ, và Epic 3 cần bảng dark để nghiệm thu tương phản |
> | **Nút toggle** ở chân trang + nghiệm thu tương phản ≥ 4.5:1 ở **cả hai** theme | **Epic 3** | Nó là một điều khiển có focus ring, và UX-DR-30 (tương phản hai theme) vốn đã thuộc sàn a11y của Epic 3 |
>
> Hệ quả chấp nhận được: từ Epic 1 tới hết Epic 2, bản dark **tồn tại nhưng không với tới được** —
> chưa có nút nào bật nó. Không có phụ thuộc ngược.

## Epic List

**8 epic.** Hình dạng vẫn là **T ngược** như bản đồ chia việc §1.1, nhưng gộp hai chỗ: ba epic nền
(E0+E1+E2) thành Epic 1 vì không epic nào trong đó demo được gì và không có vòng phản hồi nào giữa
chúng; và E3+E4 thành Epic 2 vì E3 một mình không cho Nam thấy gì trên màn hình. Mọi ranh giới AD
của spine được **giữ nguyên** — chúng trở thành ranh giới **story** thay vì ranh giới epic.

Thứ tự dưới đây đã kiểm lại theo sơ đồ phụ thuộc §3: mỗi epic chỉ dựa vào epic đứng trước nó.

### Epic 1: Nền — khung dự án, lõi thuần, và kho dữ liệu bền

Dựng đúng cây thư mục của Structural Seed, một trang tải được trên HTTPS không phát request nào sau
khi tải xong, năm module `core/` thuần có test Vitest chạy ở Node, và một kho IndexedDB đọc/ghi được
với luồng ghi AD-8 tồn tại **một lần** cho mọi epic sau. Sau epic này chưa có gì để Nam bấm — đó là
đánh đổi có ý thức: những thứ "chỉ có một nơi duy nhất" (`time.js`, `fold.js`, `limits.js`,
`errors.js`) phải được xây trước, không được là sản phẩm phụ của một feature.

Epic này cũng gánh **nửa cứng của FR-19 và FR-20** — nửa chống mất dữ liệu, không phải nửa cảnh
báo: AD-8 (ghi trước, đổi state sau), AD-3 tầng B (bản nháp khóa theo `tabId`) và AD-6 (RAM không
bao giờ là nguồn sự thật cho phép ghi). Và nó dựng **cả hai bảng token màu** cộng script theme nội
tuyến, dù nút bật/tắt phải đợi tới Epic 3.

**FRs covered:** FR-18 (chủ) · **FR-19, FR-20 (nửa cứng)** · FR-2, FR-3, FR-7 (phần nền)
**NFRs:** NFR-3, NFR-4, NFR-5, NFR-6, NFR-7, NFR-8, NFR-1 (đường cơ sở)
**UX-DR:** UX-DR-5 (hai bảng màu), UX-DR-6, UX-DR-7, UX-DR-8
**AD chi phối:** AD-1, AD-2, AD-3, AD-4, AD-5, AD-6, AD-8, AD-9, AD-12, AD-13, AD-14, AD-18, AD-19
**Phụ thuộc:** *(gốc)*

### Epic 2: Ghi nhanh và dòng ghi chú hôm nay — UJ-1 trọn vẹn

Nam mở tab, con trỏ đã nằm sẵn trong ô soạn thảo, gõ, `Ctrl+Enter`, và mẩu giấy nhô lên ở ô
trên-cùng-trái của lưới hôm nay. Đây là epic đầu tiên có giá trị thật: sau nó, **UJ-1 chạy trọn vẹn
và Nam bắt đầu dùng được hàng ngày**. Bao gồm tab title, vì bước 2 của UJ-1 — *"Nam nhìn thanh tab,
thấy `3 - Ghi chú hàng ngày` giữa một rừng tab"* — hỏng nếu thiếu nó. **Không** bao gồm nút theme:
`[OVERRIDE-1]` không nằm trong bảy bước của UJ-1 và đã chuyển sang Epic 3.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-6, FR-7, FR-8, FR-9 (chủ) · FR-18 (cửa vào ô soạn thảo)
**NFRs:** NFR-1 (nghiệm thu) · NT-1, NT-3, NT-4 · `[OVERRIDE-2]`
**UX-DR:** UX-DR-1, 2, 3, 4, 9, 10, 14, 21, 22, 23, 24
**AD chi phối:** AD-1, AD-3 (tầng C), AD-4, AD-6, AD-8, AD-14, AD-15, AD-16, AD-19
**Phụ thuộc:** Epic 1

### Epic 3: Dải băng thông báo, sàn accessibility, và nút theme

Mọi thứ xấu đi ra **đúng một ô** theo **đúng một** thứ tự ưu tiên, và sáu mục sàn a11y có chủ. Epic
này không thêm tính năng nào Nam nhìn thấy trực tiếp, và nó vẫn phải đứng ở vị trí thứ ba: Epic 4
(kết quả nạp file), Epic 5 (hộp thoại xóa), Epic 7 (`VERSION_SKEW`) và Epic 8 (cảnh báo dung lượng)
**đều không có chỗ nói** nếu thiếu nó — và mỗi epic sẽ tự chế một chỗ nói riêng, đúng kiểu hỏng AD-17
viết ra để chặn. Spine nói thẳng: *"sàn a11y trôi mất giữa các story vì không story nào nhận nó."*

Epic này cũng nhận **nút bật/tắt theme** — không phải vì nó là a11y, mà vì UX-DR-30 (tương phản
≥ 4.5:1 ở **cả** light và dark) vốn đã thuộc đây, nên đây là chỗ duy nhất bảng dark thật sự được
nghiệm thu thay vì chỉ được khai báo.

**Sàn a11y không đồng đều, và tài liệu ghi nhận điều đó.** Hai mục có lý do cụ thể cho chính Nam:
**focus ring** (UX-DR-31) vì EXPERIENCE.md đã chốt **đúng bốn phím tắt** — không `/`, không
`Ctrl+K` — nên focus ring là **bản đồ duy nhất** của Nam khi đi tới ô tìm kiếm; và **tương phản**
(UX-DR-30) vì Nam ngồi cạnh IDE tối cả ngày. Ngược lại, **UX-DR-33 (phóng 200%) không có bằng
chứng nào** là Nam dùng tới. Giữ nó, nhưng nếu Epic 3 phình ra thì đây là mục **đầu tiên** được hạ
xuống — không phải focus ring.

**FRs covered:** FR-11 (phần focus), FR-16, FR-19, FR-20 (phần hạ tầng thông báo)
**UX-DR:** UX-DR-17, **UX-DR-20 (nút theme)**, UX-DR-26…UX-DR-35 (Accessibility Floor 6 mục)
**Nguyên tắc:** `[OVERRIDE-1]`
**AD chi phối:** AD-8, AD-16, AD-17, AD-18, AD-19 (nửa nút), AD-20
**Phụ thuộc:** Epic 1 (cần `errors.js` và hai bảng token)

### Epic 4: Sao lưu và khôi phục — UJ-3

Nam xuất được một file chứa **toàn bộ** ghi chú, và nạp lại được nó theo lối gộp nguyên tử. Bản đồ
chia việc §4 gọi đây là **"vòng 1b — bắt buộc kèm theo"**, không được tách khỏi vòng đầu: từ giây
phút Nam bắt đầu ghi thật, dữ liệu chỉ nằm trong một trình duyệt của một máy công ty, và đây là lối
thoát **duy nhất** khỏi kịch bản `Clear browsing data`.

**FRs covered:** FR-15, FR-16, FR-17 (chủ) · FR-18 (cửa vào file nạp)
**AD chi phối:** AD-4, AD-8, AD-11, AD-13, AD-14, AD-16 (ngoại lệ duy nhất), AD-17, AD-18
**Phụ thuộc:** Epic 1, Epic 3

### Epic 5: Sửa và xóa

Ghi chú đã có sửa được tại chỗ và xóa được qua một bước xác nhận. Hai nhịp click — **click 1 mở
rộng, click 2 vào chế độ sửa** — là thứ mua được sự an toàn cho UJ-2: đọc to biên bản cho sếp nghe
mà không có ký tự nào bị gõ nhầm vào, trong một sản phẩm không có hoàn tác.

**FRs covered:** FR-5, FR-10, FR-11 (chủ) · FR-18 (cửa vào chế độ sửa)
**Nguyên tắc:** NT-2, NT-4
**AD chi phối:** AD-1, AD-4, AD-5, AD-8, AD-16, AD-20 (mục 2)
**Phụ thuộc:** Epic 2, Epic 3

### Epic 6: Tra cứu — UJ-2

Con đường **duy nhất** tới mọi thứ cũ hơn hôm nay: tìm bằng chữ bỏ dấu tiếng Việt trên toàn bộ dữ
liệu, lọc theo một ngày, và hai điều kiện chồng lên nhau được. PRD §5.4 nói rõ epic này không được
xếp sau và không được cắt bớt — thiếu nó thì sản phẩm **mất truy cập** vào gần như toàn bộ dữ liệu
của chính nó, không phải "kém tiện".

**FRs covered:** FR-12, FR-13, FR-14 (chủ) · FR-6 (hoàn thiện AD-15)
**NFRs:** NFR-2, NFR-6 (đầu tìm) · NT-3
**AD chi phối:** AD-5, AD-6, AD-14, AD-15, AD-16
**Phụ thuộc:** Epic 2

### Epic 7: Đa tab và lệch phiên bản

Hai tab không ghi đè nhau, không ăn bản nháp của nhau, và mã cũ trong một tab để mở nhiều ngày
**hỏng ồn ào chứ không hỏng im lặng** — nó vào chế độ chỉ đọc, không phải chỉ cảnh báo. Nam để app
mở cả ngày (UJ-1), nên mở hai tab là chuyện bình thường chứ không phải trường hợp hiếm.

> **Epic này đứng áp chót được vì Epic 1 đã gánh phần chống mất dữ liệu.** AD-6 cấm RAM làm nguồn
> sự thật cho phép ghi, AD-3 tầng B khóa bản nháp theo `tabId` — nên thiếu epic này, tab thứ hai
> chỉ **hiển thị cũ cho tới khi F5**, không mất một ghi chú nào. Epic 7 mua **sự tươi mới của màn
> hình**, không mua sự an toàn của dữ liệu. Xem ghi chú "Hai FR bị chẻ đôi" ở FR Coverage Map —
> đừng kéo epic này lên sớm vì tưởng nó đang gánh một rủi ro sống.

**FRs covered:** FR-20 (nửa tươi mới — nửa cứng đã xong ở Epic 1) · FR-3 (bản nháp không bị tab khác đụng)
**NFRs:** NFR-3
**AD chi phối:** AD-3, AD-7, AD-13, AD-17 (ưu tiên 1), AD-18, AD-21
**Phụ thuộc:** Epic 3, Epic 5, Epic 6

### Epic 8: Dung lượng — lưu trữ bền và cảnh báo trước ngưỡng

Trình duyệt không lặng lẽ dọn dữ liệu, và Nam biết **trước** khi hết chỗ chứ không phải lúc đã hỏng.
Đây là **phanh cuối** của NFR-3: ngưỡng gần như không bao giờ nổ trên máy phát triển, nên nó là thứ
dễ bị coi là "chắc để sau" nhất trong toàn bộ danh sách.

> **Tên epic dễ gây hiểu nhầm là dung lượng chưa được xử lý gì cho tới đây — không phải vậy.** Lời
> hứa cứng của FR-19 — *"app không bao giờ để một thao tác lưu thất bại mà giao diện vẫn tỏ ra như
> đã lưu xong"* — **đã đúng từ Epic 1** nhờ AD-8. Epic này mua thêm đúng hai thứ: `persist()` để
> trình duyệt không lặng lẽ dọn dữ liệu, và cảnh báo **trước** ngưỡng thay vì chỉ báo lúc đã hỏng.

**FRs covered:** FR-19 (nửa cảnh báo — nửa cứng đã xong ở Epic 1) · FR-17 (ngưỡng nhắc hạ xuống 3 ngày)
**NFRs:** NFR-3
**AD chi phối:** AD-8, AD-10, AD-14, AD-17, AD-18
**Phụ thuộc:** Epic 1, Epic 3, Epic 4

---

## Epic 1: Nền — khung dự án, lõi thuần, và kho dữ liệu bền

Dựng đúng cây thư mục của Structural Seed, một trang tải được trên HTTPS không phát request nào sau
khi tải xong, năm module `core/` thuần có test Vitest chạy ở Node, và một kho IndexedDB đọc/ghi được
với luồng ghi AD-8 tồn tại **một lần** cho mọi epic sau.

**Nhân vật.** Sản phẩm có đúng một người dùng — **Nam** — và anh cũng là người xây. Story nào có
người thụ hưởng là Nam-người-dùng thì viết "Nam"; story nào chỉ Nam-người-xây hưởng (kỷ luật mã,
test, deploy) thì viết "người xây" — nói "Nam" ở đó là tự lừa mình rằng epic này có giá trị người
dùng trực tiếp, mà nó không có.

### Story 1.1: Khung dự án chạy được trên HTTPS

As a người xây,
I want một cây thư mục khớp Structural Seed, một trang tải được trên GitHub Pages, và `npm test` chạy được Vitest,
So that mọi story sau có chỗ để đặt mã và có cách chứng minh mã đúng.

**Acceptance Criteria:**

**Given** repo trống
**When** dựng xong cây thư mục
**Then** nó khớp Structural Seed của spine: `index.html`, `app/main.js`, `app/core/`, `app/ports/`, `app/adapters/`, `app/view/`, `app/style.css`, `test/`
**And** `app/main.js` là file **duy nhất** trong repo import từ `app/adapters/`

**Given** `package.json` đã có
**When** chạy `npm test`
**Then** Vitest khởi động và chạy trên `app/core/`
**And** không một dependency nào trong `package.json` đi vào mã sản phẩm — `index.html` không import gì từ `node_modules` *(AD-12)*

**Given** app đã deploy
**When** mở `https://truongthanhnam.github.io/bmad/`
**Then** trang tải xong không lỗi console
**And** sau khi tải xong, tab Network **không ghi nhận thêm một request nào** — không webfont, không CDN, không `fetch` *(AD-12, NFR-5)*
**And** app tải được **chỉ khi có mạng**, nhưng sau khi tải xong mọi thao tác diễn ra hoàn toàn trong máy *(NFR-4)*
**And** mở được trên **Chromium bản hiện hành** (Edge/Chrome) trên Windows, **không cài đặt gì, không cần quyền admin** *(NFR-7)*

**Given** origin sản xuất
**When** app được phục vụ
**Then** nó ở đúng `https://truongthanhnam.github.io/bmad/`, và README ghi rõ địa chỉ này **không được đổi** — đổi tên miền hoặc đường dẫn là **mất toàn bộ ghi chú** *(NFR-8, AD-9)*

**Given** người xây mở `index.html` bằng `file://`
**When** trang cố tải ES module
**Then** nó hỏng — và README đã ghi rõ đây là **cấm**, kèm cách chạy đúng bằng HTTP server ở `localhost` *(AD-12)*

**Given** README đã có
**When** đọc nó
**Then** nó chứa **checklist deploy** với bước **bump `APP_VERSION`** đứng tường minh *(AD-21)*
**And** nó chứa một mục trống có tiêu đề cho **danh sách thử tay của `adapters/`** — mục này được các story sau điền vào *(Consistency Conventions)*

### Story 1.2: Hằng số ngưỡng và tập mã lỗi đóng

As a người xây,
I want mọi ngưỡng số nằm ở đúng một file và mọi mã lỗi thuộc một tập đóng có sẵn microcopy,
So that không epic nào sau này tự chế một ngưỡng hay một câu báo lỗi của riêng nó.

**Acceptance Criteria:**

**Given** `app/core/limits.js`
**When** đọc nó
**Then** nó xuất đủ: `MAX_NOTE_CHARS = 20000`, `MAX_RESULTS = 50`, `COLLAPSED_LINES = 3`, `BACKUP_NUDGE_DAYS = 7`, `AUTOSAVE_MS = 400`, `DRAFT_BEAT_MS = 10000`, `DRAFT_STALE_MS = 30000`, `QUOTA_WARN_RATIO = 0.80`, `QUOTA_WARN_FREE_BYTES = 50 * 1024 * 1024`, `APP_VERSION` *(AD-14)*

**Given** toàn bộ repo
**When** grep tìm ngưỡng số nằm ngoài `limits.js`
**Then** không ra kết quả nào *(AD-14)*

**Given** `app/core/errors.js`
**When** đọc nó
**Then** tập mã lỗi **đóng** gồm đúng sáu giá trị: `VERSION_SKEW`, `QUOTA`, `DB`, `BAD_FILE`, `BAD_VERSION`, `TOO_LONG` *(AD-18)*
**And** mỗi `code` ánh xạ sang **đúng nguyên văn** microcopy tiếng Việt của EXPERIENCE.md *(UX-DR-28)*
**And** có hàm dựng `Error` mang `code`, để adapter và core ném cùng một hình dạng

**Given** test Vitest cho hai module này
**When** chạy `npm test`
**Then** chúng xanh, chạy ở Node, **không** giả lập trình duyệt *(AD-2)*

### Story 1.3: Khóa thời gian — sắp xếp và lọc ngày

As a người xây,
I want hai khóa dẫn xuất từ `createdAt` sinh bởi đúng một module thuần,
So that `query.js` và `backup.js` không bao giờ sắp xếp theo hai kiểu khác nhau, và ghi chú không trượt sang ngày khác khi nạp trên máy đặt múi giờ khác.

**Acceptance Criteria:**

**Given** `app/core/time.js`
**When** gọi `localStamp(note)` với `createdAt = '2026-09-03T16:40:12+07:00'`
**Then** trả về `'2026-09-03T16:40:12'` — chuỗi 19 ký tự, **khóa sắp xếp duy nhất** *(AD-4)*

**Given** cùng module
**When** gọi `localDate(note)`
**Then** trả về `'2026-09-03'` — **khóa lọc ngày duy nhất** *(AD-4)*

**Given** hai ghi chú có offset **khác nhau** — một `+07:00`, một `+02:00` — nhưng cùng giờ tại chỗ
**When** sắp xếp bằng so chuỗi trên `localStamp`
**Then** thứ tự đúng theo giờ tại chỗ
**And** test chứng minh so chuỗi trực tiếp trên `createdAt` cho thứ tự **sai** — đó là lý do AD-4 cấm nó

**Given** `daysBetween('2026-09-03', '2026-09-11')`
**When** gọi nó
**Then** trả về `8`
**And** nó dựng `Date` ở **UTC giữa trưa**, và test chứng minh phép trừ không lệch một ngày khi hai mốc nằm hai bên một lần đổi giờ mùa hè *(AD-4)*

**Given** toàn bộ repo ngoài `daysBetween`
**When** grep `new Date(`
**Then** không có chỗ nào dựng `Date` từ `createdAt` cho mục đích hiển thị, sắp xếp hay lọc *(AD-4)*

### Story 1.4: Bỏ dấu tiếng Việt, giữ nguyên vị trí ký tự

As a Nam,
I want gõ `phan quyen` mà tìm ra được ghi chú chứa `Phân quyền`,
So that tôi tra cứu được khi đang vội mà không phải bỏ công gõ dấu.

**Acceptance Criteria:**

**Given** `app/core/fold.js`
**When** gọi `fold('Phân quyền')`
**Then** trả về `'phan quyen'` *(FR-12, NFR-6)*

**Given** chuỗi chứa `đ` hoặc `Đ`
**When** `fold()` chạy
**Then** thứ tự phép biến đổi là: map `đ→d` / `Đ→D` **trước**, rồi `normalize('NFD')`, rồi bỏ `\p{M}`, rồi `toLowerCase()`
**And** test chứng minh đảo thứ tự cho kết quả **sai** — `đ` (U+0111) không có phân rã chuẩn nên NFD không đụng tới nó *(AD-5)*

**Given** bất kỳ chuỗi tiếng Việt nào
**When** gọi `fold(text)`
**Then** `fold(text).length === text.length`
**And** ký tự thứ `i` của kết quả tương ứng **đúng** ký tự thứ `i` của đầu vào — có test riêng cho bất biến này *(AD-5)*

**Given** bất biến trên
**When** một vị trí khớp tìm được trên chuỗi đã bỏ dấu
**Then** vị trí đó dùng thẳng được trên chuỗi gốc để tô nền — đây là điều làm UX-DR-18 (tô đúng bên trong `Phân quyền`) khả thi *(AD-5)*

**Given** `fold()` là hàm thuần
**When** grep toàn repo tìm mã bỏ dấu khác
**Then** không có bản thứ hai — cả đầu ghi lẫn đầu tìm đều gọi module này *(AD-5)*

### Story 1.5: Khối state duy nhất và bộ khung action

As a người xây,
I want một khối state duy nhất mà mọi thay đổi phải đi qua một action, cùng chữ ký các port mà lõi cần,
So that không có vùng UI thứ hai nào tự sửa dữ liệu theo cách riêng rồi lệch khỏi vùng kia.

**Acceptance Criteria:**

**Given** `app/core/state.js`
**When** đọc nó
**Then** có **một** khối state trong bộ nhớ, và state chỉ đổi bên trong một action của module này *(AD-1)*
**And** state chứa khối điều kiện là **một** giá trị hình dạng `{ keyword: string | null, date: 'yyyy-MM-dd' | null }`, khởi tạo `{ null, null }` *(AD-15)*
**And** state **không có** trường nào mang nghĩa "đang lưu", "đã lưu", "chưa chốt", hay "số ký tự còn lại" — nên view không có gì để vẽ ra *(AD-16)*

**Given** `app/ports/`
**When** đọc nó
**Then** có chữ ký cho năm port: `noteStore`, `sessionStore`, `channel`, `fileIO`, `quota`
**And** chúng là chữ ký hàm thuần, không nhắc tới IndexedDB, `localStorage` hay `BroadcastChannel` *(AD-2)*

**Given** `app/core/` và `app/ports/`
**When** grep tìm `window`, `document`, `indexedDB`, `localStorage`, `BroadcastChannel`
**Then** không ra một kết quả nào *(AD-2)*

**Given** `app/main.js`
**When** đọc nó
**Then** đây là nơi **duy nhất** nối adapter thật vào port *(AD-2)*

**Given** test Vitest cho `state.js`
**When** chạy ở Node không giả lập trình duyệt
**Then** xanh *(AD-2)*

### Story 1.6: Kho ghi chú bền và luồng ghi chuẩn

As a Nam,
I want ghi chú của tôi nằm an toàn trên đĩa và trở lại nguyên vẹn khi tôi mở lại app,
So that đóng tab hay khởi động lại máy không làm mất thứ tôi đã ghi.

**Acceptance Criteria:**

**Given** app khởi động lần đầu
**When** mở IndexedDB
**Then** DB tên `ghichu` version 1 tồn tại, có object store `notes` với index trên `localDate` *(AD-9, AD-13)*

**Given** một bản ghi trong store `notes`
**When** đọc nó
**Then** nó có **đúng năm trường**: `id`, `createdAt`, `localDate`, `text`, `textFolded` — không hơn *(AD-13)*
**And** `localDate` và `textFolded` là **dẫn xuất**, được tính lại ở **mọi** lần ghi, không bao giờ sửa riêng lẻ *(AD-13)*

**Given** Nam đóng tab, khởi động lại máy, hoặc app được cập nhật phiên bản
**When** anh mở lại app
**Then** mọi ghi chú vẫn còn nguyên *(NFR-3)*
**And** sản phẩm **không tự xóa ghi chú theo tuổi** và **không áp giới hạn số lượng** của riêng nó *(NFR-3)*

**Given** app khởi động với 2.000 ghi chú trong kho
**When** nạp xong
**Then** toàn bộ `notes` nằm trong một mảng trong state, đã sắp xếp **giảm dần** theo `localStamp` *(AD-6)*
**And** đây là **một** trong đúng hai chỗ đọc IndexedDB — chỗ còn lại là khi nhận tin BroadcastChannel *(AD-6)*

**Given** một thao tác **đổi sự tồn tại** của ghi chú
**When** nó chạy
**Then** thứ tự là **ghi xuống đĩa trước, đổi state sau**; adapter ném lỗi thì action dừng và state giữ nguyên *(AD-8)*
**And** giao diện **không bao giờ** tỏ ra như đã lưu xong khi phép ghi thất bại — đây là **nửa cứng của FR-19**, hoàn thành ở đây chứ không phải ở Epic 8

**Given** một thao tác **tự lưu nội dung đang gõ**
**When** nó chạy
**Then** state trong RAM đổi **ngay** theo từng phím, phép ghi đi sau với debounce `AUTOSAVE_MS` *(AD-8)*
**And** mỗi mục tiêu tự lưu mang một số đếm `seq` tăng dần; hẹn nào nổ ra mà `seq` không còn là hiện tại thì **bị bỏ, không ghi** *(AD-8)*

**Given** một phép ghi thất bại vì hết dung lượng
**When** adapter bắt `QuotaExceededError`
**Then** nó ném `Error` có `code = QUOTA` ngược lên action *(AD-18)*
**And** adapter **không** gọi thẳng vào view, **không** `console.error` thay cho báo người dùng, **không** nuốt lỗi *(AD-8, NFR-5)*

**Given** `app/adapters/localstorage.js`
**When** đọc nó
**Then** nó chỉ mang đúng ba key: `ghichu.theme`, `ghichu.lastBackupAt`, `ghichu.persistDenied` *(AD-3 tầng B′, AD-9)*
**And** **không một ghi chú nào** được lưu ở `localStorage` *(AD-3)*

**Given** README
**When** đọc mục danh sách thử tay
**Then** nó đã được điền các bước kiểm `adapters/indexeddb.js` và `adapters/localstorage.js` bằng tay *(Consistency Conventions)*

### Story 1.7: Bản nháp riêng từng tab, nhận lại được bản bỏ rơi

As a Nam,
I want bản nháp gõ dở của tôi còn nguyên khi mở lại app, và không bị một tab khác xóa mất,
So that chữ tôi gõ luôn an toàn kể cả khi tôi chưa kịp bấm `Ctrl+Enter`.

**Acceptance Criteria:**

**Given** DB `ghichu`
**When** mở nó
**Then** có object store `drafts`, bản ghi hình dạng `{ tabId, text, heartbeat }` *(AD-3 tầng B)*
**And** bản nháp nằm ở **IndexedDB chứ không phải `localStorage`** — vì chỉ IndexedDB có transaction *(AD-3)*

**Given** app khởi động
**When** quy tắc bốn bước chạy
**Then** cả bốn bước nằm trong **một** transaction `readwrite` **duy nhất**: (1) đọc/sinh `tabId`, (2) dùng bản của chính mình nếu có, (3) **nhận nhiều nhất một** bản bỏ lại đã quá `DRAFT_STALE_MS`, (4) xóa mọi bản ghi có `text` rỗng *(AD-3)*

**Given** Nam nhân đôi tab — `sessionStorage` được sao chép nên hai tab mang cùng `tabId`
**When** tab mới khởi động và thấy một bản ghi cùng `tabId` có `heartbeat` mới hơn `DRAFT_STALE_MS`
**Then** nó sinh `tabId` mới bằng `crypto.randomUUID()` và ghi vào `sessionStorage` *(AD-3)*

**Given** hai tab khởi động **cùng lúc** và cùng thấy một bản nháp bỏ lại
**When** cả hai chạy quy tắc nhận
**Then** chỉ **một** tab nhận được; tab thứ hai thấy nó đã biến mất — vì cả bốn bước nằm trong một transaction *(AD-3)*

**Given** một tab đang gõ dở và còn cập nhật `heartbeat` mỗi `DRAFT_BEAT_MS`
**When** một tab khác khởi động
**Then** nó **không bao giờ** lấy mất bản nháp đó — đây là **nửa cứng của FR-20**, hoàn thành ở đây chứ không phải ở Epic 7

**Given** bản nháp
**When** bất kỳ thao tác nào chạy
**Then** nó **không bao giờ** được đồng bộ sang tab khác và **không bao giờ** phát tin *(AD-7)*

### Story 1.8: Hai bảng màu và theme không nháy lúc tải

As a Nam,
I want app nhớ tôi đang dùng nền sáng hay tối và vẽ đúng ngay từ khung hình đầu tiên,
So that mở tab giữa lúc đang làm việc không bị một nháy màu chói vào mắt.

**Acceptance Criteria:**

**Given** `app/style.css`
**When** đọc nó
**Then** nó khai báo **đủ hai bảng** 12 token màu — light và dark — đúng hex của `DESIGN.md.Colors` *(UX-DR-5)*
**And** nó khai báo token typography 5 vai *(UX-DR-6)*, thang spacing 4/8/12/16/20/28/40px cộng 6 token bố cục *(UX-DR-7)*, và 4 cấp bo góc `paper`/`input`/`tray`/`full` *(UX-DR-8)*
**And** grep không ra **một giá trị màu viết thẳng nào** ngoài phần khai báo token *(AD-20 mục 4)*

**Given** phông chữ
**When** trang tải
**Then** mọi phông là **system font stack**; không Google Fonts, không webfont, không icon font *(UX-DR-6, AD-12)*

**Given** `index.html`
**When** đọc `<head>`
**Then** có một script **đồng bộ, nội tuyến** đọc `ghichu.theme` và đặt thuộc tính lên `<html>` **trước lần vẽ đầu tiên** *(AD-19)*
**And** script này nằm trong `index.html`, **không** trong `app/` — đây là ngoại lệ duy nhất của AD-2 được phép *(AD-19)*

**Given** `ghichu.theme` đã đặt là dark
**When** Nam mở lại tab
**Then** không có nháy màu sáng nào trước khi nền tối hiện ra *(AD-19)*

**Given** epic này chưa có nút bật/tắt
**When** Nam dùng app
**Then** bản dark **tồn tại nhưng chưa với tới được** — nút toggle thuộc Epic 3. Không có phụ thuộc ngược.

---

## Epic 2: Ghi nhanh và dòng ghi chú hôm nay — UJ-1 trọn vẹn

Nam mở tab, con trỏ đã nằm sẵn trong ô soạn thảo, gõ, `Ctrl+Enter`, và mẩu giấy nhô lên ở ô
trên-cùng-trái của lưới hôm nay. Sau epic này Nam **bắt đầu dùng thật hàng ngày**.

### Story 2.1: Bốn tầng cố định trên nền bàn

As a Nam,
I want một màn hình có hình dạng ổn định, không cuộn ngoài vùng ghi chú,
So that mắt tôi luôn biết chỗ nào để gõ và chỗ nào để đọc, không phải tìm lại mỗi lần mở.

**Acceptance Criteria:**

**Given** trang đã tải
**When** nhìn từ trên xuống
**Then** có đúng bốn tầng theo thứ tự: ô soạn thảo → khay tìm kiếm + bộ lọc ngày → lưới ghi chú → chân trang *(UX-DR-1)*
**And** ba tầng đầu **không cuộn**; chỉ tầng lưới là vùng cuộn duy nhất của trang

**Given** cửa sổ rộng bất kỳ
**When** lưới vẽ ra
**Then** nó dùng `repeat(auto-fill, minmax(260px, 1fr))`, `gap: 8px`, vùng chứa `max-width: 1040px` căn giữa *(UX-DR-2)*
**And** không có **một breakpoint cố định nào** trong `style.css` cho lưới
**And** trên màn hình siêu rộng, trần thực tế là **3 cột** — không bao giờ 4 hay 5

**Given** cửa sổ hẹp dần
**When** không đủ chỗ cho 3 cột
**Then** lưới tự rớt về 2 rồi 1 cột, không cần khai báo mốc nào

**Given** mật độ đã siết ở DESIGN.md
**When** đo trong DevTools
**Then** padding mẩu giấy là `8px/12px`, khe lưới `8px`, lề trang `16px` — **không** phải giá trị rộng hơn của file HTML hướng *(UX-DR-4)*

**Given** sản phẩm là single-surface
**When** dùng app
**Then** không có điều hướng, không route, không màn hình thứ hai *(UX-DR-1)*

### Story 2.2: Ô soạn thảo sẵn con trỏ, chữ tự lưu

As a Nam,
I want mở tab ra là gõ được ngay và chữ tự an toàn mà không phải bấm gì,
So that khoảng cách giữa "có một ý nghĩ" và "ý nghĩ đó đã nằm an toàn" bằng không.

**Acceptance Criteria:**

**Given** trang vừa tải xong
**When** Nam nhìn màn hình
**Then** con trỏ **đã nằm sẵn** trong ô soạn thảo — không phải click vào *(FR-1)*
**And** không có nút "Tạo mới" nào phải bấm trước khi gõ được
**And** không có bước chọn loại, chọn nơi lưu, hay chọn định dạng *(NT-1)*

**Given** ô soạn thảo ở trạng thái mặc định
**When** nhìn vào nó
**Then** placeholder **trống hoàn toàn** — không một chữ nào *(UX-DR-10)*
**And** dưới ô có một dòng nhỏ ghi đúng `Ctrl+Enter để chốt`
**And** ô là `{colors.surface}`, có **bóng lõm**, min-height 92px, tự cao thêm theo nội dung *(UX-DR-9, 10)*

**Given** Nam đang gõ
**When** dừng tay
**Then** bản nháp được ghi xuống store `drafts` trong vòng `AUTOSAVE_MS`, tổng khoảng cách ≤ 1 giây *(FR-3)*
**And** **không có nút "Lưu"** ở bất kỳ đâu trong giao diện

**Given** Nam gõ dở rồi đóng tab đột ngột hoặc khởi động lại máy
**When** mở app lần sau, bất kể đã qua bao nhiêu ngày
**Then** bản nháp xuất hiện lại **nguyên trạng trong ô soạn thảo** *(FR-3)*

**Given** bản nháp chưa chốt
**When** nhìn màn hình
**Then** **không có dấu hiệu nào** — không viền khác, không dấu chấm, không chữ "chưa chốt", không đếm ký tự *(UX-DR-24, AD-16)*

**Given** nội dung ô soạn thảo chạm `MAX_NOTE_CHARS`
**When** Nam gõ thêm
**Then** không nhận thêm ký tự, và `core/` ném `code = TOO_LONG` *(FR-18, AD-14, AD-18)*
**And** **không cắt im lặng**
**And** *(ranh giới epic)* dải băng hiển thị microcopy loại 4 là việc của Story 3.1 — ở epic này lỗi dừng đúng ở tầng action, không có chỗ nói. Đây là **suy giảm có ý thức**, không phải mất dữ liệu

### Story 2.3: Chốt bản nháp thành ghi chú

As a Nam,
I want `Ctrl+Enter` biến chữ đang gõ thành một ghi chú mang dấu thời gian và ô trống lại ngay,
So that tôi ghi liên tiếp nhiều thứ mà tay không rời bàn phím.

**Acceptance Criteria:**

**Given** bản nháp có nội dung
**When** Nam bấm `Ctrl+Enter`
**Then** ghi chú được tạo với `id` từ `crypto.randomUUID()` và `createdAt` là **thời điểm chốt**, ISO-8601 có offset *(FR-2, FR-4)*
**And** ô soạn thảo trống lại và con trỏ **vẫn ở trong đó** *(FR-4)*

**Given** Nam gõ dở lúc `23:00` rồi chốt lúc `09:00` sáng hôm sau
**When** ghi chú được tạo
**Then** nó mang mốc `09:00` — không phải `23:00` — và xuất hiện trong khung nhìn mặc định của **ngày hôm sau** *(FR-2)*

**Given** bản nháp rỗng
**When** Nam bấm `Ctrl+Enter`
**Then** **không làm gì cả** — không tạo ghi chú, không báo lỗi, không nhấp nháy *(FR-4, UX-DR-26)*

**Given** Nam đang gõ nhiều dòng
**When** bấm `Enter` đơn thuần
**Then** nó chèn xuống dòng, **không** chốt *(FR-4)*

**Given** action `chotGhiChu` chạy
**When** nó ghi xuống đĩa
**Then** việc ghi bản ghi `notes` mới và việc làm rỗng bản ghi `drafts` của tab này nằm trong **một transaction duy nhất** *(AD-8)*
**And** nó **hủy hẹn tự lưu đang treo** của bản nháp trước khi làm gì khác — nếu không, một hẹn cũ nổ sau lúc chốt sẽ hồi sinh bản nháp đã chốt *(AD-8)*

**Given** `chotGhiChu` chạy
**When** bước đầu tiên của nó thực thi
**Then** nó gọi `xoaHetDieuKien()` *(AD-15, FR-14)*
**And** hành vi này đúng ngay từ epic này, dù chưa có cách nào đặt điều kiện cho tới Epic 6 — Epic 6 **không phải** sửa lại chỗ này

**Given** phép ghi thất bại
**When** adapter ném lỗi
**Then** state **không đổi**, mẩu giấy **không xuất hiện**, chữ vẫn nằm trong ô soạn thảo *(AD-8, FR-19)*

**Given** thao tác chốt **thành công**
**When** nó xong
**Then** giao diện **im lặng tuyệt đối** — không "đã lưu", không chỉ báo nào. Mẩu giấy nhô lên là bằng chứng duy nhất *(AD-16)*

### Story 2.4: Lưới ghi chú của hôm nay

As a Nam,
I want mở app ra chỉ thấy những gì mình đã ghi trong chính ngày hôm nay,
So that màn hình không bao giờ rối mắt dù trong máy đã có hàng trăm ghi chú.

**Acceptance Criteria:**

**Given** trong máy có 1.200 ghi chú, trong đó 4 ghi chú của hôm nay
**When** Nam mở app
**Then** lưới chứa **đúng 4 mẩu** — không ghi chú nào của ngày khác *(FR-6)*
**And** chiều dài lưới chỉ phụ thuộc số ghi chú **của hôm nay**, không phụ thuộc tổng số trong máy *(NT-3)*

**Given** `core/query.js`
**When** khối điều kiện là `{ keyword: null, date: null }`
**Then** nó lọc theo `localDate` của hôm nay — khung nhìn mặc định là **vắng mặt của điều kiện**, không phải một điều kiện "hôm nay" *(AD-15)*

**Given** lưới nhiều cột
**When** ghi chú được xếp vào
**Then** hướng đọc là **trái sang phải, hết hàng xuống hàng** — không masonry, không điền dọc từng cột *(UX-DR-3)*
**And** ghi chú mới nhất ở **ô trên-cùng-trái**; ghi chú thứ hai ở **bên phải nó**, không phải bên dưới

**Given** Nam vừa chốt một ghi chú
**When** lưới vẽ lại
**Then** mẩu mới xuất hiện ở ô trên-cùng-trái, đẩy mọi mẩu khác dịch một ô về sau *(UX-DR-3)*

**Given** bất kỳ khung nhìn nào
**When** ghi chú được sắp xếp
**Then** luôn theo `localStamp` **giảm dần**, và **không có cách nào** đổi thứ tự *(FR-7, NT-4)*

**Given** lọc và tìm
**When** chúng chạy
**Then** là phép quét mảng **đồng bộ** trên mảng trong RAM — không truy vấn bất đồng bộ nào *(AD-6)*

**Given** view
**When** nó chạy
**Then** nó **không bao giờ ghi vào state**, không giữ state riêng, không sửa DOM ngoài lượt render *(AD-1)*

### Story 2.5: Mẩu giấy — hình dạng, giờ tạo, cắt và mở rộng

As a Nam,
I want mỗi ghi chú trông như một mẩu giấy dán có giờ tạo, và mẩu dài bị cắt gọn lại,
So that tôi liếc một cái là quét được cả ngày làm việc mà không phải đọc từng chữ.

**Acceptance Criteria:**

**Given** một mẩu giấy
**When** nhìn vào nó
**Then** nền là `{colors.paper}` — **một màu giấy duy nhất** cho mọi mẩu, không màu thứ hai theo ngày/tuổi/độ dài *(UX-DR-9)*
**And** có bóng nhị, dải keo `inset 0 3px 0` ở mép trên, bo góc 3px
**And** đầu mẩu có giờ tạo bên trái và nút `xóa` bên phải *(UX-DR-14)*

**Given** khung nhìn mặc định
**When** mẩu hiện giờ tạo
**Then** nó hiện **chỉ `HH:mm`** — ngày là thông tin thừa khi mọi mẩu đều của hôm nay *(UX-DR-23)*
**And** dấu thời gian dùng phông **monospace** `{typography.time}`

**Given** ghi chú dài quá `COLLAPSED_LINES`
**When** nó hiển thị thu gọn
**Then** bị cắt kèm dòng `còn N dòng ▾` *(FR-8, UX-DR-14)*
**And** mọi mẩu thu gọn có **cùng chiều cao trần**, nên hàng luôn đều

**Given** một mẩu bị cắt
**When** Nam click một lần vào nó
**Then** nó **mở rộng tại chỗ** — không chuyển màn hình, không hộp thoại — và dòng đổi thành `thu lại ▴` *(FR-8)*
**And** hàng bên dưới bị đẩy xuống; nhiều mẩu mở rộng cùng lúc được

**Given** một mẩu **không** bị cắt (≤ 3 dòng)
**When** Nam click một lần
**Then** nhịp "mở rộng" bị bỏ qua vì không có gì để mở rộng *(UX-DR-14)*
**And** *(ranh giới epic)* nhịp còn lại là **vào chế độ sửa**, và nó thuộc Story 5.1. Ở epic này click vào mẩu ngắn chỉ đặt focus — không có chế độ sửa để vào

**Given** vài mẩu đang mở rộng
**When** Nam tải lại trang
**Then** **mọi mẩu về thu gọn** — trạng thái mở rộng nằm ở tầng C, không ghi xuống kho bền nào *(A-3, AD-3)*

**Given** nội dung ghi chú có xuống dòng
**When** nó hiển thị
**Then** xuống dòng được giữ nguyên (`white-space: pre-wrap`); không đậm/nghiêng, không danh sách, không bảng, không ảnh *(FR-18)*

### Story 2.6: Trạng thái rỗng và tab title

As a Nam,
I want sáng mai mở app ra thấy màn hình sạch không lời giải thích, và nhận ra đúng tab của mình giữa một rừng tab,
So that mỗi ngày bắt đầu lại từ đầu mà không có gì phải dọn, và tôi bấm đúng chỗ ngay lần đầu.

**Acceptance Criteria:**

**Given** hôm nay chưa có ghi chú nào và không điều kiện nào bật
**When** Nam mở app
**Then** màn hình chỉ có ô soạn thảo với con trỏ, khay tìm kiếm rỗng, và chân trang
**And** vùng lưới **hoàn toàn trống — không một chữ nào** *(FR-9, UX-DR-24)*
**And** **không** thông báo kiểu "Bạn chưa có ghi chú nào", **không** hình minh họa chào mừng

**Given** hôm nay có 4 ghi chú
**When** nhìn thanh tab trình duyệt
**Then** tiêu đề là `4 - Ghi chú hàng ngày` *(UX-DR-21, `[OVERRIDE-2]`)*

**Given** Nam vừa chốt ghi chú thứ 5
**When** lưới vẽ lại
**Then** tab title đổi thành `5 - Ghi chú hàng ngày`

**Given** tab title
**When** nó được tính
**Then** nó là **số ghi chú có `localDate` bằng hôm nay** — không phải số mẩu đang hiển thị, và **không phụ thuộc điều kiện đang bật** *(AD-19)*
**And** nó do lượt render tính ra từ state, không phải một hiệu ứng lề ở chỗ khác

**Given** NFR-1
**When** đo từ lúc mở tab tới lúc gõ được ký tự đầu tiên, với 2.000 ghi chú trong máy
**Then** ≤ 2 giây *(NFR-1, SM-2)*
**And** không màn hình chờ, không splash screen, không skeleton *(UX-DR-24)*

---

## Epic 3: Dải băng thông báo, sàn accessibility, và nút theme

Mọi thứ xấu đi ra **đúng một ô** theo **đúng một** thứ tự ưu tiên, và sáu mục sàn a11y có chủ.

### Story 3.1: Dải băng — một chủ, bảy nguồn, một thứ tự ưu tiên

As a Nam,
I want mọi thông báo xuất hiện ở đúng một chỗ và cái quan trọng không bị cái vặt đè mất,
So that khi có chuyện, tôi biết ngay phải nhìn vào đâu.

**Acceptance Criteria:**

**Given** `app/view/banner.js`
**When** đọc nó
**Then** nó là nơi **duy nhất** vẽ dải băng, và nó đọc **một** giá trị trong state tầng C *(AD-17)*
**And** không module nào khác ghi thẳng vào DOM của dải băng

**Given** dải băng đang hiện
**When** nó vẽ ra
**Then** nó ở đỉnh trang, **đẩy nội dung xuống chứ không phủ lên** *(UX-DR-17)*
**And** nền `{colors.chip-bg}`, viền dưới `{colors.rule}`, **không bóng**, **không biến thể màu theo loại lỗi** — mọi loại dùng chung đúng một hình dạng

**Given** bảng bảy nguồn của AD-17
**When** `banner.js` khai báo chúng
**Then** **cả bảy** có mặt trong bảng ưu tiên với đúng thứ tự: `VERSION_SKEW` → `QUOTA` → `DB` → nạp file thất bại → vượt trần khi gõ → nạp file thành công → cảnh báo trước ngưỡng *(AD-17)*
**And** ưu tiên 1 và 2 **không đóng được**; các loại còn lại đóng được
**And** quy tắc ưu tiên được nghiệm thu bằng **test trên chính bảng đó** — không đợi nguồn thật xuất hiện
**And** *(ranh giới epic)* bốn nguồn chưa có người phát ở thời điểm này — `BAD_FILE`/`BAD_VERSION` đến ở Epic 4, `VERSION_SKEW` ở Epic 7, cảnh báo dung lượng ở Epic 8. Bảng phải đủ **trước**, vì AD-17 nói thêm một nguồn là **sửa bảng trước, không phải sau**

**Given** dải băng đang hiện một thông báo ưu tiên 2
**When** một thông báo ưu tiên 7 phát sinh
**Then** thông báo ưu tiên 2 **vẫn ở nguyên đó** — cái mới **không** thay được cái đang hiện *(AD-17)*

**Given** một `Error` mang `code` từ tập đóng
**When** nó đi từ adapter → action → view
**Then** view hiển thị **microcopy đã ánh xạ sẵn ở `core/errors.js`**, không bao giờ tự soạn câu chữ từ lỗi thô *(AD-18)*
**And** không bao giờ hiển thị chuỗi tiếng Anh của trình duyệt

**Given** nút đóng dải băng
**When** nhìn vào nó
**Then** nó là dấu `✕` màu `{colors.ink-2}`, mang nhãn chữ `đóng thông báo` cho trợ giúp tiếp cận *(UX-DR-17, 35)*

**Given** dòng nhắc sao lưu và lỗi định dạng ô ngày
**When** chúng xuất hiện
**Then** chúng **không đi qua dải băng** — một cái ở chân trang, một cái tại chỗ dưới ô ngày *(AD-17)*

### Story 3.2: Focus ring và thứ tự tab

As a Nam,
I want luôn nhìn thấy con trỏ bàn phím đang ở đâu và `Tab` đi đúng thứ tự đọc,
So that tôi di chuyển được trong app mà không cần phím tắt nào — vì sản phẩm cố ý không có phím tắt.

**Acceptance Criteria:**

**Given** `app/style.css`
**When** grep `outline: none`
**Then** **không ra một kết quả nào** — đây là cấm tuyệt đối *(UX-DR-31, AD-20 mục 1)*

**Given** bất kỳ phần tử tương tác nào
**When** nó nhận focus bằng bàn phím
**Then** focus ring `{colors.focus}` nhìn thấy được, ≥ 3:1 so với nền *(UX-DR-31)*

**Given** app có dải băng đang hiện
**When** Nam bấm `Tab` liên tiếp từ đầu
**Then** thứ tự là: `✕` dải băng → ô soạn thảo → ô tìm kiếm → ô ngày → icon lịch → `về hôm nay` (nếu có) → từng mẩu giấy theo hướng trái-sang-phải (thân rồi nút xóa) → `xuất sao lưu` → `nạp lại` → nút theme *(UX-DR-32)*
**And** thứ tự tab bám đúng thứ tự DOM
**And** *(ranh giới epic)* nghiệm thu ở epic này chỉ trên các phần tử **đã tồn tại**; nút `xóa` đến ở Epic 5, hai link sao lưu ở Epic 4, `về hôm nay` ở Epic 6. Quy tắc "bám thứ tự DOM, không `tabindex` dương" là thứ bảo đảm chúng **tự vào đúng chỗ** khi xuất hiện — đó là lý do quy tắc đứng ở đây chứ không phải ở từng epic sau

**Given** toàn bộ mã
**When** grep `tabindex`
**Then** **không có `tabindex` dương ở bất kỳ đâu** *(UX-DR-32, AD-20)*

**Given** đúng bốn phím tắt của sản phẩm
**When** Nam thử phím khác
**Then** `/`, `Ctrl+K`, và mọi phím tắt cho xóa/sao lưu/theme đều **không có tác dụng** — đây là cố ý *(UX-DR-26)*

**Given** mọi điều khiển chỉ có ký hiệu
**When** kiểm tra chúng
**Then** nút `✕` và icon lịch đều mang nhãn chữ *(UX-DR-35, AD-20 mục 3)*

### Story 3.3: Nút theme và tương phản ở cả hai bảng màu

As a Nam,
I want đổi sang nền tối bằng một nút ở chân trang,
So that app không chói mắt khi tôi đặt nó cạnh IDE nền tối cả ngày.

**Acceptance Criteria:**

**Given** chân trang
**When** nhìn góc phải
**Then** có một nút nhãn **chữ** — `nền tối` khi đang sáng, `nền sáng` khi đang tối — viền mảnh bo tròn, **không icon mặt trời/mặt trăng** *(UX-DR-20)*

**Given** Nam bấm nút
**When** theme đổi
**Then** `ghichu.theme` được ghi, và lựa chọn được nhớ lại ở lần mở sau *(UX-DR-20, `[OVERRIDE-1]`)*
**And** nó phát `session-changed` *(AD-7)*

**Given** cả hai theme
**When** đo tương phản mọi cặp chữ/nền
**Then** đạt **≥ 4.5:1 ở cả light và dark** *(UX-DR-30, AD-20 mục 4)*
**And** chữ nhỏ nhất dùng `{colors.ink-2}`; `{colors.ink-decor}` **không bao giờ là chữ**

**Given** cặp `{colors.danger}` trên `{colors.chip-bg}` ở dark
**When** đo
**Then** đúng **4.55:1** — vừa đủ ngưỡng, gần như không còn biên
**And** README hoặc bình luận trong `style.css` ghi rõ: ai đổi `chip-bg-dark` **phải tính lại cặp này trước khi commit**

**Given** `style.css`
**When** grep giá trị màu
**Then** **không một giá trị màu viết thẳng nào** ngoài phần khai báo token — token là chỗ duy nhất tỉ lệ đã được tính *(AD-20 mục 4)*

### Story 3.4: Phóng to, chuyển động, và màu không phải tín hiệu duy nhất

As a Nam,
I want app còn dùng được khi tôi phóng to và không nhấp nháy gì khi tôi tắt hiệu ứng,
So that sản phẩm chịu được cách tôi thật sự dùng máy chứ không chỉ cách nó được thiết kế.

**Acceptance Criteria:**

**Given** trình duyệt phóng tới **200%**
**When** nhìn app
**Then** lưới rớt về 1 cột, **không chữ bị cắt**, **không điều khiển bị đẩy ra ngoài khung** *(UX-DR-33, AD-20 mục 5)*
**And** bố cục dùng đơn vị tương đối và grid `auto-fill`, **không `px` cứng** cho chiều rộng vùng chứa

**Given** `style.css`
**When** tìm mọi khai báo `transition` và `animation`
**Then** **tất cả** nằm trong **một** khối `@media (prefers-reduced-motion: no-preference)` duy nhất *(UX-DR-29, 34, AD-20 mục 6)*
**And** mặc định là **không có chuyển động** — chuyển động là thứ được **thêm vào**, không phải thứ bị gỡ ra

**Given** `prefers-reduced-motion: reduce`
**When** Nam hover/focus
**Then** **bỏ luôn cả chuyển màu** — app gần như tĩnh hoàn toàn *(UX-DR-34)*

**Given** chuyển màu hover/focus khi được phép
**When** đo
**Then** ≤ 120ms *(UX-DR-29)*

**Given** ghi chú vào hoặc ra khỏi lưới
**When** nó xảy ra
**Then** **không có hoạt ảnh nào** — mẩu bị xóa biến mất đột ngột, đánh đổi đã chấp nhận *(UX-DR-27)*

**Given** mọi tín hiệu trạng thái
**When** kiểm tra
**Then** không chỗ nào dùng **màu làm tín hiệu duy nhất** — ô ngày sai định dạng có viền `{colors.danger}` **cộng** thông báo chữ; chip điều kiện có **chữ**, không chỉ đổi viền *(UX-DR-35, AD-20 mục 6)*

**Given** các tương tác bị cấm
**When** Nam thử
**Then** không kéo-thả sắp xếp, không chọn nhiều mẩu, không menu ngữ cảnh, không long-press, không cuộn vô hạn, không hover-only affordance *(UX-DR-27)*

---

## Epic 4: Sao lưu và khôi phục — UJ-3

Nam xuất được một file chứa **toàn bộ** ghi chú, và nạp lại được nó theo lối gộp nguyên tử. Từ giây
phút Nam ghi thật, đây là lối thoát **duy nhất** khỏi kịch bản `Clear browsing data`.

### Story 4.1: Chân trang với hai link thường trực

As a Nam,
I want hai link sao lưu luôn nằm ở chân trang kể cả khi app trống trơn,
So that trên máy mới — đúng lúc rủi ro cao nhất — tôi vẫn tìm được đường nạp lại.

**Acceptance Criteria:**

**Given** app ở trạng thái rỗng tuyệt đối trên một máy mới
**When** Nam nhìn chân trang
**Then** hai link `xuất sao lưu` · `nạp lại` **vẫn ở đó** *(UX-DR-19)*
**And** chúng **không phụ thuộc** dòng nhắc sao lưu — trên máy mới dòng nhắc chưa có gì để nói

**Given** chân trang
**When** nhìn nó
**Then** hai link dùng `{typography.foot}`, màu `{colors.ink-2}`, gạch chân offset 2px
**And** nút theme đẩy sang **góc phải**; chỗ cho dòng nhắc sao lưu nằm cùng dòng với hai link *(UX-DR-19)*

**Given** hai link
**When** Nam dùng app ở bất kỳ trạng thái nào
**Then** chúng **không bao giờ ẩn** *(UX-DR-19)*

### Story 4.2: Xuất toàn bộ ra một file sao lưu

As a Nam,
I want một cú click tải về một file chứa tất cả ghi chú của tôi,
So that dữ liệu của tôi có một bản nằm ngoài trình duyệt.

**Acceptance Criteria:**

**Given** đang có điều kiện lọc bật
**When** Nam click `xuất sao lưu`
**Then** file chứa **toàn bộ** ghi chú, **không** phụ thuộc điều kiện đang áp dụng *(FR-15)*

**Given** file vừa xuất
**When** mở nó ra xem
**Then** hình dạng đúng `{ schemaVersion: 1, exportedAt: <ISO-8601 có offset>, notes: [{ id, createdAt, text }] }` *(AD-11)*
**And** `localDate` và `textFolded` **không** có trong file — chúng là dẫn xuất, tính lại lúc nạp
**And** bản nháp chưa chốt **không** có trong file *(FR-15)*

**Given** file vừa xuất
**When** nhìn tên file
**Then** đúng dạng `ghi-chu-hang-ngay-YYYY-MM-DD.json` *(AD-11, A-8)*

**Given** xuất thành công
**When** nó xong
**Then** `ghichu.lastBackupAt` được cập nhật bằng chính `exportedAt` vừa dựng, và phát `session-changed` *(AD-11)*
**And** giao diện **im lặng tuyệt đối** — file tải xuống là bằng chứng *(AD-16)*

**Given** NFR-5
**When** xuất chạy
**Then** dữ liệu chỉ rời máy vì Nam **chủ động bấm** — không tự động xuất, không tự động gửi đi đâu *(FR-15)*

### Story 4.3: Nạp lại — hai pha, gộp theo định danh, nguyên tử

As a Nam,
I want nạp file sao lưu về mà không sợ nó phá mất thứ đang có,
So that sau khi IT cài lại máy tôi lấy lại được dữ liệu, giữ nguyên ngày giờ gốc.

**Acceptance Criteria:**

**Given** Nam click `nạp lại`
**When** hộp chọn file mở ra và Nam chọn một file hợp lệ
**Then** ghi chú được khôi phục **giữ nguyên `createdAt` gốc** *(FR-16)*
**And** `localDate` và `textFolded` được **tính lại** theo AD-4 và AD-5 *(AD-11)*

**Given** phép nạp
**When** nó chạy
**Then** nó đi qua **hai pha tách bạch**: (1) kiểm tra **toàn bộ** file trước khi ghi, (2) ghi trong **một transaction IndexedDB duy nhất** *(AD-11)*

**Given** một file có `schemaVersion` khác 1, JSON hỏng, thiếu trường bắt buộc, `createdAt` sai dạng, `id` trùng nhau, hoặc `text` vượt `MAX_NOTE_CHARS` ở **bất kỳ** ghi chú nào
**When** pha kiểm tra chạy
**Then** **từ chối cả file, không ghi một byte nào** *(AD-11, AD-14)*
**And** dải băng hiện microcopy loại 3 nguyên văn, và dữ liệu đang có **không bị đụng tới một chữ** *(FR-16, UX-DR-28)*

**Given** gộp theo `id`
**When** nạp chạy
**Then** ghi chú đã có thì **bỏ qua**, chưa có thì **thêm vào**
**And** **không bao giờ xóa, không bao giờ ghi đè** *(FR-16)*

**Given** transaction hỏng giữa chừng, kể cả `QuotaExceededError`
**When** nó xảy ra
**Then** IndexedDB tự cuộn ngược — **không để lại nửa file** *(AD-11)*

**Given** nạp thành công
**When** nó xong
**Then** `backup.js` trả `{ added, skipped }`, và dải băng hiện **hai con số thật**: `Đã nạp N ghi chú, bỏ qua M ghi chú đã có.` *(AD-11, UX-DR-28)*
**And** đây là **ngoại lệ duy nhất** của quy tắc im-lặng-khi-thành-công *(AD-16)*

**Given** `exportedAt` trong file **mới hơn** `ghichu.lastBackupAt` đang có
**When** nạp xong
**Then** `ghichu.lastBackupAt` được cập nhật bằng giá trị trong file, và phát `session-changed` *(AD-11)*

**Given** một ghi chú đã bị xóa nhưng có trong file được nạp
**When** nạp chạy
**Then** nó **sống lại** — hệ quả đã biết và được chấp nhận của cơ chế gộp *(FR-16, FR-11)*

### Story 4.4: Dòng nhắc thụ động về lần sao lưu gần nhất

As a Nam,
I want một dòng nhỏ nhắc tôi đã lâu chưa sao lưu, không chặn đường,
So that tôi không phát hiện ra mình quên vào đúng lúc máy đã hỏng.

**Acceptance Criteria:**

**Given** đã quá `BACKUP_NUDGE_DAYS` ngày kể từ `ghichu.lastBackupAt`
**When** Nam mở app
**Then** chân trang hiện một dòng nhỏ: `Lần sao lưu gần nhất cách đây tám ngày.` — chữ số viết theo **số ngày thật** *(FR-17, UX-DR-28)*
**And** số ngày tính bằng `daysBetween()` của `core/time.js` *(AD-4)*

**Given** dòng nhắc đang hiện
**When** nhìn nó
**Then** nó là một dòng `{typography.foot}` màu `{colors.ink-2}` ở chân trang — **không** nền, **không** viền, **không** nút tắt, **không** hộp thoại, **không** chặn đường *(FR-17, UX-DR-19)*
**And** nó **không đi qua dải băng** *(AD-17)*

**Given** chưa quá ngưỡng
**When** Nam mở app
**Then** dòng nhắc **không hiện** — hiện thường trực thì nó thành rác trên màn hình, đi ngược NT-3 *(A-9)*

**Given** Nam vừa nạp một file có `exportedAt` là thứ Sáu tuần trước
**When** dòng nhắc tính lại
**Then** nó biết lần gần nhất là thứ Sáu tuần trước — mốc khôi phục được **từ trong chính file** *(FR-17)*
**And** nếu không có cơ chế này thì sau khi khôi phục app sẽ im lặng vĩnh viễn, đúng lúc rủi ro cao nhất

---

## Epic 5: Sửa và xóa

Ghi chú đã có sửa được tại chỗ và xóa được qua một bước xác nhận.

### Story 5.1: Sửa nội dung tại chỗ

As a Nam,
I want sửa một ghi chú cũ như sửa một ô văn bản thường,
So that tôi chữa lại chỗ gõ sai mà không phải xóa đi ghi lại.

**Acceptance Criteria:**

**Given** một mẩu giấy đang mở rộng (hoặc mẩu ngắn ≤ 3 dòng)
**When** Nam click lần thứ hai (hoặc lần đầu với mẩu ngắn)
**Then** mẩu vào **chế độ sửa**, con trỏ đặt đúng vị trí click *(UX-DR-14)*
**And** nền mẩu đổi sang `{colors.surface}` và viền `{colors.focus}` — mẩu tạm mượn ngôn ngữ vật liệu của ô soạn thảo

**Given** hai nhịp click
**When** Nam click một lần vào mẩu dài
**Then** nó **chỉ mở rộng**, **không** vào chế độ sửa — hai nhịp **không bao giờ nhập một** *(UX-DR-14)*
**And** đây là điều làm UJ-2 an toàn: đọc to biên bản cho sếp nghe mà không ký tự nào bị gõ nhầm vào

**Given** Nam đang sửa
**When** anh gõ
**Then** thay đổi tự lưu trong ≤ 1 giây theo debounce `AUTOSAVE_MS` với kỷ luật `seq` *(FR-10, AD-8)*
**And** **không có nút Lưu**, **không** chỉ báo "đã lưu" *(AD-16)*

**Given** mỗi lần ghi
**When** bản ghi được cập nhật
**Then** `textFolded` và `localDate` được **tính lại** *(AD-13)*
**And** `createdAt` **không đổi**, và mẩu **không đổi vị trí** trong lưới *(FR-10, NT-4)*

**Given** Nam đang ở khung nhìn kết quả lọc hoặc kết quả tìm
**When** anh click vào một mẩu
**Then** sửa được y như ở khung nhìn mặc định *(FR-10)*

**Given** Nam click ra ngoài mẩu hoặc bấm `Tab`
**When** focus rời khỏi mẩu
**Then** thoát chế độ sửa *(UX-DR-14)*

**Given** FR-10
**When** ghi chú được sửa nhiều lần
**Then** **không lưu lịch sử sửa đổi** — đây là lựa chọn có ý thức *(FR-10, §8)*

### Story 5.2: Ghi chú rỗng tự biến mất

As a Nam,
I want ghi chú bị xóa sạch chữ tự biến mất mà không hỏi gì,
So that một lần lỡ tay không để lại mẩu giấy trắng nằm đó vĩnh viễn.

**Acceptance Criteria:**

**Given** Nam đang sửa một ghi chú
**When** anh xóa hết ký tự rồi rời khỏi mẩu
**Then** ghi chú biến mất và **không hỏi xác nhận** *(FR-5)*

**Given** FR-11 quy định xóa phải xác nhận
**When** trường hợp này xảy ra
**Then** đây là **ngoại lệ duy nhất** của quy tắc đó *(FR-5, FR-11)*

**Given** có tự lưu
**When** không có quy tắc này
**Then** mỗi lần lỡ tay sẽ để lại một ghi chú rỗng vĩnh viễn — đó là lý do ngoại lệ này tồn tại

**Given** action `suaGhiChu` phát hiện nội dung rỗng
**When** nó xóa bản ghi
**Then** nó **hủy hẹn tự lưu đang treo** của mẩu đó trước khi làm gì khác *(AD-8)*
**And** thao tác đi theo luồng **ghi trước, đổi state sau** *(AD-8)*

### Story 5.3: Xóa qua hộp thoại xác nhận

As a Nam,
I want một bước xác nhận trước khi ghi chú biến mất vĩnh viễn,
So that một cú click nhầm không lấy mất thứ tôi không lấy lại được.

**Acceptance Criteria:**

**Given** mọi mẩu giấy
**When** nhìn vào nó
**Then** nút `xóa` **luôn hiện, mờ nhạt** — **không hover-only**, vì đã chốt không có phím tắt nên đây là đường xóa duy nhất *(UX-DR-15, 27)*
**And** hover/focus đổi sang `{colors.danger}`

**Given** Nam click `xóa`
**When** hộp thoại mở
**Then** overlay `rgba(0,0,0,.32)`, hộp căn giữa, bóng sâu `0 12px 32px` — **bóng sâu duy nhất trong sản phẩm** *(UX-DR-16, 9)*
**And** tiêu đề `Xóa ghi chú này?`, thân `Không có thùng rác và không hoàn tác được.`, hai lựa chọn dạng chữ ngang hàng `hủy` · `xóa` *(UX-DR-28)*

**Given** hộp thoại vừa mở
**When** focus được đặt
**Then** nó vào **`hủy`, không phải `xóa`** — không có hoàn tác, nên một phát `Enter` theo phản xạ không được phép là một phát xóa *(FR-11, UX-DR-16, AD-20 mục 2)*

**Given** hộp thoại đang mở
**When** Nam bấm `Tab` liên tiếp
**Then** focus **bị giam trong hộp thoại**, không thoát ra nền *(AD-20 mục 2)*

**Given** Nam bấm `Esc` hoặc click ra ngoài
**When** hộp thoại đóng
**Then** được hiểu là **hủy**, không phải xóa *(FR-11)*
**And** focus **trả về đúng nút xóa vừa bấm** *(AD-20 mục 2)*

**Given** Nam chọn `xóa`
**When** ghi chú bị xóa
**Then** nó biến mất **đột ngột, không animation** *(UX-DR-27)*
**And** **không có cách nào lấy lại từ trong app** — không thùng rác, không hoàn tác *(FR-11)*
**And** action `xoaGhiChu` hủy hẹn tự lưu đang treo của mẩu đó trước khi làm gì khác *(AD-8)*

**Given** ghi chú đã xóa
**When** Nam nạp lại một file sao lưu cũ có chứa nó
**Then** nó **sống lại** — xóa không xóa khỏi các file sao lưu đã tạo trước đó *(FR-11, FR-16)*

**Given** NT-2
**When** kiểm tra phạm vi
**Then** **không** xóa hàng loạt, **không** chọn nhiều ghi chú, **không** xóa theo ngày *(NT-2, §8)*

---

## Epic 6: Tra cứu — UJ-2

Con đường **duy nhất** tới mọi thứ cũ hơn hôm nay. Chạy đồng bộ trong RAM.

### Story 6.1: Tìm bằng chữ trên toàn bộ dữ liệu

As a Nam,
I want gõ một chữ tôi còn nhớ và thấy mọi ghi chú chứa nó, kể cả khi tôi không bỏ dấu,
So that tôi tìm lại được thứ mình cần khi có người đang đứng chờ.

**Acceptance Criteria:**

**Given** khay tìm kiếm
**When** Nam nhìn màn hình
**Then** ô tìm kiếm **luôn có mặt**, không phải mở ra mới dùng được *(FR-12)*
**And** khay nền `{colors.chip-bg}` **sẫm hơn nền bàn**, có nhãn chữ `tìm` đứng trước ô, placeholder `từ khóa` *(UX-DR-11, 22, 28)*

**Given** Nam gõ `phan quyen` không bỏ dấu
**When** kết quả trả về
**Then** mọi ghi chú chứa `Phân quyền` đều khớp — bỏ dấu và không phân biệt hoa/thường *(FR-12, NFR-6)*
**And** phép so khớp dùng `textFolded` đã lưu sẵn và `fold()` ở đầu tìm — **cùng một hàm** *(AD-5)*

**Given** một kết quả
**When** nó hiển thị
**Then** phần khớp được tô nền `{colors.hl}`, chữ giữ `{colors.ink}`, và tô **đúng vị trí bên trong `Phân quyền`** *(UX-DR-18)*

**Given** Nam đang gõ
**When** mỗi ký tự rơi xuống
**Then** kết quả lọc dần, **không cần bấm `Enter`** *(A-4)*

**Given** tìm kiếm
**When** nó chạy
**Then** nó tìm trên **toàn bộ** ghi chú từ trước tới nay, **không** giới hạn bởi khung nhìn đang hiện *(FR-12)*

**Given** mỗi kết quả
**When** nó hiển thị
**Then** xếp mới nhất trên cùng *(FR-7)*, và hiện **đầy đủ `dd/MM/yyyy HH:mm`** — không phải chỉ `HH:mm` *(UX-DR-23)*

**Given** không ghi chú nào khớp
**When** lưới vẽ
**Then** hiện `Không có ghi chú nào khớp.` — **không** để lại màn hình trống khó phân biệt với trạng thái rỗng *(FR-12, UX-DR-28)*

**Given** Nam xóa hết chữ trong ô tìm kiếm
**When** ô rỗng
**Then** điều kiện từ khóa bị bỏ *(UX-DR-11)*

### Story 6.2: Lọc theo một ngày cụ thể

As a Nam,
I want chọn đúng một ngày và chỉ thấy ghi chú của ngày đó,
So that "hôm thứ Ba tuần trước" trở thành một câu hỏi tôi hỏi được thẳng ra.

**Acceptance Criteria:**

**Given** khay tìm kiếm
**When** nhìn phần bên phải
**Then** có nhãn chữ `ngày` + ô rộng 118px, chữ monospace, placeholder `dd/MM/yyyy` *(UX-DR-12, 28)*

**Given** Nam gõ tay `03/09/2026`
**When** chuỗi đủ hợp lệ
**Then** lưới chỉ còn ghi chú có `localDate` bằng `2026-09-03` *(FR-13)*
**And** phép lọc là so **chuỗi** trên `localDate`, không dựng `Date` *(AD-4)*

**Given** Nam gõ dở hoặc gõ sai định dạng
**When** chuỗi chưa hợp lệ
**Then** `date` trong state **giữ nguyên giá trị cũ** và **lưới không đổi** *(AD-15)*
**And** ô hiện viền `{colors.danger}` **cộng** thông báo chữ `Ngày phải viết dd/MM/yyyy, ví dụ 03/09/2026.` ngay dưới ô *(UX-DR-12, 35)*
**And** lỗi này **không đi qua dải băng** — nó là lỗi tại chỗ của view *(AD-17)*

**Given** icon lịch ở mép phải ô ngày
**When** nhìn nó
**Then** nó là **inline SVG 16px**, stroke `{colors.ink-2}` — **icon duy nhất của toàn sản phẩm**, không font icon, không tải từ mạng *(UX-DR-12, AD-12)*

**Given** Nam click icon lịch
**When** picker mở
**Then** nó chọn **đúng một ngày**, không phải khoảng ngày; chọn xong picker đóng và điền vào ô *(A-5, UX-DR-12)*
**And** gõ tay vẫn là **đường chính**, picker là đường phụ

**Given** NT-3
**When** kiểm tra bộ lọc
**Then** **không có mốc nhanh** kiểu "hôm nay / 7 ngày qua / tháng này" *(FR-13, NT-3)*

**Given** Nam xóa hết chữ trong ô ngày
**When** ô rỗng
**Then** điều kiện ngày bị bỏ *(UX-DR-12)*

### Story 6.3: Khối điều kiện, hàng chip, và đường về

As a Nam,
I want thấy rõ mình đang lọc theo gì và về lại hôm nay bằng một thao tác,
So that tôi không bao giờ phải đoán tại sao màn hình đang thiếu thứ gì đó.

**Acceptance Criteria:**

**Given** state
**When** đọc khối điều kiện
**Then** nó là **một** giá trị `{ keyword, date }`, đổi bởi **đúng** `datDieuKien(partial)` và `xoaHetDieuKien()` *(AD-15)*
**And** không có chỗ thứ hai nào trong view giữ một nửa bộ điều kiện

**Given** cả `keyword` và `date` đều bật
**When** lưới vẽ
**Then** kết quả là **giao** của hai điều kiện *(FR-14)*

**Given** ít nhất một điều kiện bật
**When** `query.js` chạy
**Then** "hôm nay" **không** tham gia phép giao — khung nhìn mặc định là **trạng thái**, bị thay thế chứ không giao *(FR-14, AD-15)*

**Given** bảng mô hình trạng thái ở PRD §5.4
**When** kiểm từng dòng
**Then** cả sáu dòng khớp: mở app → hôm nay · gõ từ khóa → toàn bộ khớp · chọn ngày → ngày đó · cả hai → giao · **gõ vào ô soạn thảo → xóa hết điều kiện, về hôm nay** · xóa hết điều kiện → hôm nay *(FR-14)*

**Given** Nam bắt đầu gõ vào **ô soạn thảo**
**When** ký tự đầu tiên rơi xuống
**Then** **mọi điều kiện bị xóa** và lưới về khung nhìn mặc định *(FR-14)*
**And** hành vi này đã được `chotGhiChu` dựng từ Story 2.3 — story này chỉ làm nó **quan sát được** *(AD-15)*

**Given** Nam gõ vào **ô tìm kiếm**
**When** ký tự rơi xuống
**Then** bộ lọc ngày **vẫn giữ nguyên** — đó là đặt điều kiện, không phải ghi chú *(FR-14)*

**Given** có điều kiện bật
**When** nhìn tầng 2b
**Then** hiện một chip mỗi điều kiện + số kết quả + link `về hôm nay` *(UX-DR-13, FR-14)*
**And** chip **không bấm được để xóa** — chip chỉ để nhìn; đường bỏ điều kiện là xóa chữ trong ô hoặc link `về hôm nay`

**Given** có điều kiện bật
**When** nhìn ô soạn thảo
**Then** placeholder đổi thành `gõ vào đây sẽ bỏ mọi điều kiện lọc` — **ngoại lệ duy nhất** của quy tắc placeholder trống *(UX-DR-22, 28)*

**Given** Nam click `về hôm nay`
**When** một cú click
**Then** **mọi** điều kiện bị xóa và lưới về khung nhìn mặc định — đây là "đường về trong MỘT thao tác" *(FR-14, UX-DR-13)*

**Given** có điều kiện bật, 0 ghi chú khớp
**When** lưới vẽ
**Then** **ba dấu hiệu cùng lúc**: hàng chip vẫn hiện ghi `0 ghi chú` · dòng `Không có ghi chú nào khớp.` trong vùng lưới · link `về hôm nay` vẫn ở đó *(UX-DR-25)*
**And** đây là chỗ **duy nhất** một vùng lưới trống được phép nói chữ

**Given** Nam tải lại trang
**When** app khởi động
**Then** **mọi điều kiện bị xóa**, về khung nhìn mặc định — điều kiện nằm ở tầng C, không ghi xuống kho bền *(A-6, AD-3)*

### Story 6.4: Trần kết quả và hiệu năng tra cứu

As a Nam,
I want kết quả tìm không bao giờ đổ ra cả kho và trả về ngay lập tức,
So that gõ một chữ phổ biến không dựng lại đúng màn hình "xem tất cả" mà sản phẩm cố ý không có.

**Acceptance Criteria:**

**Given** `core/query.js`
**When** nó trả kết quả
**Then** hình dạng là `{ items, total }` — `items` đã cắt còn `MAX_RESULTS`, `total` là **số khớp thật, không cắt** *(AD-14)*

**Given** view vẽ hàng chip và dòng "còn nhiều hơn"
**When** nó lấy con số
**Then** nó dùng `total`, **không bao giờ** đếm `items.length` *(AD-14)*

**Given** 63 ghi chú khớp
**When** lưới vẽ
**Then** hiện 50 mẩu, cộng một dòng dưới lưới: `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc gõ thêm chữ để thu hẹp.` *(A-11, UX-DR-28)*
**And** hàng chip ghi số kết quả **thật** theo `total`

**Given** đúng một ghi chú khớp
**When** hàng chip vẽ
**Then** nó ghi `1 ghi chú` — con số viết theo kết quả thật *(UX-DR-28)*

**Given** 2.000 ghi chú trong máy
**When** Nam gõ vào ô tìm kiếm hoặc ô ngày
**Then** kết quả trả về trong **≤ 200 ms** *(NFR-2, A-14)*
**And** phép lọc là quét mảng **đồng bộ** trên `textFolded` và `localDate` trong RAM — không chạm ổ đĩa *(AD-6)*

**Given** NT-3
**When** kiểm tra mọi khung nhìn
**Then** **không khung nhìn nào** trả về một danh sách dài vô hạn *(NT-3, FR-12)*

---

## Epic 7: Đa tab và lệch phiên bản

Hai tab không ghi đè nhau, không ăn bản nháp của nhau, và mã cũ hỏng ồn ào chứ không hỏng im lặng.
**Nửa cứng đã xong ở Epic 1** — epic này mua sự tươi mới của màn hình.

### Story 7.1: Đồng bộ ghi chú giữa các tab

As a Nam,
I want ghi chú tạo ở tab này hiện ra ở tab kia mà không phải F5,
So that để app mở hai chỗ cả ngày không làm tôi nhìn phải dữ liệu cũ.

**Acceptance Criteria:**

**Given** `app/adapters/broadcast.js`
**When** đọc nó
**Then** đúng **một** kênh `BroadcastChannel('ghichu')`, không kênh thứ hai *(AD-7, AD-9)*

**Given** một bản tin
**When** nó được phát
**Then** hình dạng đúng bốn trường: `{ v: 1, type, from: <tabId>, appVersion: <APP_VERSION> }` *(AD-7)*
**And** `type` chỉ nhận **đúng hai** giá trị: `notes-changed` và `session-changed`
**And** bản tin **không bao giờ mang nội dung** — tab nhận luôn đọc lại từ kho bền

**Given** một phép ghi vào store `notes` thành công
**When** nó xong
**Then** `notes-changed` được phát — sau **mọi** lần ghi: chốt, sửa, xóa, nạp lại *(AD-7)*

**Given** theme hoặc mốc sao lưu đổi
**When** nó xong
**Then** `session-changed` được phát *(AD-7)*

**Given** một tab nhận bản tin có `from` bằng `tabId` của chính nó
**When** nó xử lý
**Then** nó **bỏ qua** *(AD-7)*

**Given** tab B nhận `notes-changed`
**When** nó xử lý
**Then** nó **đọc lại IndexedDB** rồi render — đây là **chỗ thứ hai và cuối cùng** đọc IndexedDB *(AD-6)*
**And** nó **không đụng tới bản nháp** của chính nó *(AD-7, AD-3 tầng B)*

**Given** bản nháp
**When** bất kỳ tab nào thao tác
**Then** nó **không bao giờ phát tin** và **không bao giờ bị tab khác đọc hay ghi** khi tab chủ còn nhịp tim *(AD-7)*

**Given** hai tab mở song song
**When** Nam dùng cả hai
**Then** **im lặng, không có gì để nói** — không khóa tab, không dải băng "đóng tab này". FR-20 được thỏa bằng **cơ chế**, không bằng cảnh báo *(AD-7)*

### Story 7.2: Phát hiện lệch phiên bản và chế độ chỉ đọc

As a Nam,
I want một tab để mở nhiều ngày tự biết mình đang chạy mã cũ và ngừng ghi,
So that bản cũ không đè lên dữ liệu do bản mới viết mà tôi không hay biết.

**Acceptance Criteria:**

**Given** `APP_VERSION` trong `core/limits.js`
**When** một bản tin được phát
**Then** `appVersion` đi kèm trong **mọi** bản tin *(AD-21, AD-7)*

**Given** một tab nhận bản tin có `appVersion` **khác** của mình
**When** nó xử lý
**Then** nó lập tức vào **chế độ chỉ đọc** *(AD-21)*
**And** **mọi** action có ghi bị từ chối với `code = VERSION_SKEW` *(AD-18)*
**And** **mọi hẹn tự lưu bị hủy** *(AD-21)*

**Given** tab đã vào chế độ chỉ đọc
**When** dải băng hiện
**Then** nó ở **ưu tiên 1** và **không đóng được**, microcopy `Đã có bản mới. Tải lại trang — tab này đang ở chế độ chỉ đọc.` *(AD-17, UX-DR-28)*

**Given** AD-21
**When** kiểm tra hành vi
**Then** là **chỉ-đọc chứ không phải chỉ-cảnh-báo** — mã cũ vẫn ghi được là đường hỏng thật: RAM lỗi thời của nó sẽ đè lên bản ghi do mã mới viết *(AD-21)*

**Given** AD-13 cấm thu hẹp bản ghi
**When** một tab cũ đọc bản ghi do mã mới viết
**Then** điều tệ nhất nó gây ra là **hiển thị thiếu trường mới** cho tới lúc Nam tải lại *(AD-13, AD-21)*

**Given** Nam deploy rồi không mở tab nào mới
**When** tab cũ chạy tiếp
**Then** nó **không biết mình cũ** — giới hạn đã biết, chấp nhận được với n = 1 *(AD-21)*
**And** README ghi rõ giới hạn này cạnh checklist deploy

---

## Epic 8: Dung lượng — lưu trữ bền và cảnh báo trước ngưỡng

Trình duyệt không lặng lẽ dọn dữ liệu, và Nam biết **trước** khi hết chỗ. **Nửa cứng đã xong ở
Epic 1** — epic này mua `persist()` và cảnh báo sớm.

### Story 8.1: Xin lưu trữ bền, và nói to hơn khi bị từ chối

As a Nam,
I want trình duyệt cam kết không tự dọn dữ liệu của tôi khi máy hết đĩa,
So that ghi chú không biến mất vì một quyết định tôi không hay biết.

**Acceptance Criteria:**

**Given** app khởi động
**When** bootstrap chạy
**Then** `navigator.storage.persist()` được gọi *(AD-10)*

**Given** lần gọi trước trả `false`
**When** app khởi động lần sau
**Then** nó **gọi lại** — cho tới khi trả `true`. Chromium tự quyết theo mức tương tác nên **thử một lần rồi bỏ là sai** *(AD-10)*

**Given** `persist()` bị từ chối
**When** nó trả `false`
**Then** `ghichu.persistDenied` được ghi vào `localStorage` *(AD-3 tầng B′, AD-10)*
**And** `BACKUP_NUDGE_DAYS` hạ từ **7 xuống 3** — dòng nhắc sao lưu của Story 4.4 dùng ngưỡng mới *(AD-10, FR-17)*

**Given** `persist()` trả `true`
**When** app chạy
**Then** không thông báo gì — thành công thì im lặng *(AD-16)*

### Story 8.2: Cảnh báo trước ngưỡng dung lượng

As a Nam,
I want biết dung lượng sắp hết **trước** khi một phép ghi thất bại,
So that tôi kịp xuất sao lưu thay vì phát hiện ra lúc chữ đã không lưu được.

**Acceptance Criteria:**

**Given** một lần chốt, sửa, hoặc nạp lại vừa xong
**When** nó kết thúc
**Then** `navigator.storage.estimate()` được đọc *(AD-10)*

**Given** kết quả `estimate()`
**When** kiểm ngưỡng
**Then** cảnh báo khi **một trong hai** điều kiện đúng: `usage / quota ≥ QUOTA_WARN_RATIO` **hoặc** `quota - usage < QUOTA_WARN_FREE_BYTES` *(AD-10, AD-14)*
**And** **cả hai vế đều bắt buộc** — quota mỗi origin trên Chromium là một phần lớn dung lượng ổ, nên riêng vế 80% gần như không bao giờ nổ

**Given** ngưỡng bị chạm
**When** dải băng hiện
**Then** microcopy `Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.` ở **ưu tiên 7**, đóng được *(AD-17, UX-DR-28)*
**And** nó **không** chứa con số phần trăm — ngưỡng có hai vế nên không tỉ lệ nào nói đúng được cả hai

**Given** `estimate()`
**When** nó được dùng
**Then** nó **không bao giờ** được dùng để quyết định có ghi hay không — nó là ước lượng có đệm chống fingerprinting, chỉ để cảnh báo sớm *(AD-10)*

**Given** một `QuotaExceededError` thật
**When** nó xảy ra
**Then** nó đi qua đường AD-8 với `code = QUOTA` — đường phát hiện thật vẫn là bắt lỗi, không phải `estimate()` *(AD-8, AD-10)*
**And** dải băng ưu tiên **2** hiện `Không lưu được — trình duyệt hết dung lượng. Xuất sao lưu, rồi xóa bớt ghi chú cũ. Chữ vừa gõ CHƯA được lưu.` *(UX-DR-28)*
**And** nó **không đóng được cho tới khi một phép ghi sau đó thành công** *(AD-8, AD-17)*

**Given** một phép ghi thất bại trong luồng tự lưu
**When** dải băng hiện
**Then** chữ đã gõ **không bị hoàn tác** — nó vẫn nằm trên màn hình, và dải băng là thứ nói rằng nó chưa an toàn *(AD-8)*
