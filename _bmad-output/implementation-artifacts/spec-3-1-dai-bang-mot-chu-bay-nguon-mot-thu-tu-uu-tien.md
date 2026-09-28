---
title: 'Story 3.1 — Dải băng: một chủ, bảy nguồn, một thứ tự ưu tiên'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '1d86a4fa91f9d7401ea6d8336823fe248bd9225f'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `state.banner` đã tồn tại từ Epic 1 và đã mang mã lỗi ở 14 chỗ trong `app/core/state.js`, nhưng **không module nào vẽ nó** — mọi lỗi kho dữ liệu, hết dung lượng và vượt trần hiện đang chết im lặng. Bốn epic sau (nạp file, xóa, đa tab, dung lượng) đều cần chỗ nói này; thiếu nó thì mỗi epic tự chế một chỗ riêng, đúng kiểu hỏng AD-17 viết ra để chặn.

**Approach:** Dựng `app/view/banner.js` làm nơi **duy nhất** vẽ dải băng, đọc **một** giá trị state tầng C; khai báo **cả bảy** nguồn của AD-17 dưới dạng **một mảng có thứ tự** (ưu tiên = vị trí trong mảng, nên không có số literal nào — `nguong-tap-trung` cấm); và cưỡng chế "ưu tiên thấp không thay được ưu tiên cao đang hiện" ở **đường ghi** chứ không ở đường vẽ, vì view không giữ state riêng nên không có gì để so.

## Boundaries & Constraints

**Always:**
- `app/view/banner.js` là nơi duy nhất chạm DOM của dải băng. Nó **chỉ đọc** state, không giữ state riêng, mỗi lượt `ve()` tính lại từ đầu, nhận gốc DOM qua **tham số** (khuôn `noiTieuDe`/`noiLuoi`: thiếu gốc → trả về `{ ve() {} }`, không ném).
- Bảng bảy nguồn phải **đủ bảy** ngay trong story này, kể cả bốn nguồn chưa có người phát. Ưu tiên biểu diễn bằng **thứ tự mảng**, không bằng số.
- Hai nguồn đầu (`VERSION_SKEW`, `QUOTA`) và nguồn 3 (`DB`) **không đóng được**; nguồn 4–7 đóng được.
- Chữ hiện ra **luôn** đến từ ánh xạ microcopy đã có sẵn; view không bao giờ tự soạn câu chữ, không bao giờ hiện chuỗi lỗi thô của trình duyệt.
- Hình dạng **duy nhất**, không biến thể theo loại: nền `var(--chip-bg)`, viền dưới `var(--rule)`, không bóng. Nút đóng là `✕` màu `var(--ink-2)` mang nhãn chữ `đóng thông báo`.
- Dải băng **đẩy** ba tầng dưới xuống, không phủ lên: nó là con đầu của `body` (đang là flex column, `overflow: hidden`), `flex: none`; tầng lưới `flex: 1` tự co.
- Màu chỉ qua `var(--…)`; không `outline: none`; không `@media` mới ngoài khối `prefers-reduced-motion` đã có; không số literal ngoài `core/limits.js`.

**Never:**
- Không thêm mã lỗi thứ bảy vào tập đóng của `core/errors.js`, không thêm nguồn thứ tám.
- Không viết code **phát** cho bốn nguồn chưa tới (`BAD_FILE`/`BAD_VERSION` → Epic 4, `VERSION_SKEW` → Epic 7, cảnh báo dung lượng → Epic 8). Chúng chỉ tồn tại trong bảng.
- Không đưa dòng nhắc sao lưu hay lỗi định dạng ô ngày qua dải băng.
- Không dựng cơ chế `subscribe`/observer: lượt vẽ do `app/main.js` gọi tay, như ba view hiện có.
- Không thêm phím tắt để đóng dải băng — sản phẩm có đúng bốn phím.
- Không làm việc của Story 3.2 (thứ tự tab toàn trang), 3.3 (nút theme), 3.4 (phóng 200%).

## Quyết định đã chốt

1. **Từ vựng phẳng cho `banner`.** Giá trị vẫn là **một chuỗi**. Tập giá trị hợp lệ là bảy hằng "loại dải băng" khai trong `app/core/banner.js`: sáu mã của `MA_LOI` cộng hai sentinel không-phải-lỗi (nạp file thành công, cảnh báo trước ngưỡng). `TOO_LONG` chiếm **một** ô duy nhất trong bảng — phân biệt ưu tiên 4 vs 5 của AD-17 bị **bỏ có chủ đích**, vì hai ca đó không bao giờ cùng tồn tại. Hệ quả: 14 chỗ đặt `banner` trong `state.js` và mọi assertion `banner` trong `test/core-state.test.js` **không đổi một dòng**.
   - **Hệ quả đã biết, chấp nhận:** microcopy của nguồn 6 là `Đã nạp N ghi chú, bỏ qua M ghi chú đã có.` — nó **mang hai con số thật**, nên một chuỗi loại trần không chở được dữ liệu đó. Story này chỉ khai **hàng** trong bảng; Epic 4 sẽ phải gắn phần tham số khi nó dựng người phát. Đây là cái giá đã cân và chọn của phương án từ vựng phẳng.
   - Microcopy của nguồn 7 **đã có nguyên văn** trong planning (`Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.`) nên hàng đó chở được chữ ngay.
2. **Bảng ở core, vẽ ở view.** Bảng thứ tự và hàm so sánh thuần nằm ở `app/core/banner.js` (**file mới**, không nhồi vào `errors.js` để tập mã lỗi giữ đúng một việc). `app/view/banner.js` import bảng để biết hàng nào đóng được và vẫn là nơi **duy nhất** vẽ. `app/core/state.js` gác mọi phép đặt `banner` bằng hàm so sánh đó. Diễn giải này lệch chữ "banner.js khai báo chúng" của AC nhưng giữ đúng hướng tầng — **không** có cạnh `core → view`, và luật ưu tiên là bất biến của đường ghi chứ không phải lời hứa.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Không có thông báo | `banner` rỗng | Vùng dải băng **không một ký tự nào** và không chiếm chiều cao | N/A |
| Lỗi kho dữ liệu | `banner` = `DB` | Hiện microcopy `DB`, **không** có nút `✕` | N/A |
| Hết dung lượng | `banner` = `QUOTA` | Hiện microcopy `QUOTA`, không có `✕` | N/A |
| Vượt trần khi gõ | `banner` = `TOO_LONG` | Hiện microcopy `TOO_LONG`, **có** `✕` | N/A |
| Bấm `✕` | Dải băng đóng được đang hiện | `banner` về rỗng, vùng dải băng rỗng lại | N/A |
| Bấm `✕` (không đóng được) | `banner` = `VERSION_SKEW`/`QUOTA`/`DB` | Không có `✕` để bấm | N/A |
| Ưu tiên thấp đến sau | Đang hiện ưu tiên 2, phát sinh ưu tiên 7 | Ưu tiên 2 **vẫn ở nguyên** | N/A |
| Ưu tiên cao đến sau | Đang hiện ưu tiên 5, phát sinh ưu tiên 2 | Ưu tiên 2 **thay** ưu tiên 5 | N/A |
| Cùng mức ưu tiên | Đang hiện ưu tiên 4, phát sinh ưu tiên 4 | Cái mới thay cái cũ | N/A |
| Xóa có chủ đích | Action gọi đặt `banner` rỗng | Dải băng tắt bất kể ưu tiên đang hiện | N/A |
| Ghi lại thành công sau `QUOTA` | `banner` = `QUOTA`, phép ghi sau thành công | `banner` về rỗng (AD-8) | N/A |
| Thiếu gốc DOM | `noiBanner(store, null)` | Trả `{ ve() {} }`, gọi được, không ném | N/A |

</frozen-after-approval>

## Code Map

- `app/core/state.js` — `banner: null` khai báo ở dòng 169 (tầng C, cùng `dieuKien`/`expandedIds`/`editing`/`readOnly`); `maBanner(loi)` ở dòng 101 (mã ngoài tập đóng → `DB`); `datLai(nhanhMoi)` ở dòng ~297 là **đường duy nhất** đổi state; 14 chỗ đặt `banner` ở dòng 388, 391, 417, 421, 444, 448, 537, 598, 625, 628, 665, 690, 697, 717. Phép gác ưu tiên phải nằm ở đây. **Không** đổi `banSaoDongBang`, không thêm trường nghĩa "đang lưu".
- `app/core/errors.js` — tập đóng 6 mã ở dòng 12 (`VERSION_SKEW`, `QUOTA`, `DB`, `BAD_FILE`, `BAD_VERSION`, `TOO_LONG`); `MICROCOPY` đông lạnh dòng 34; `microcopyLoi(code)` dòng 56 (mã lạ → `TypeError`); `loiUngDung(code)` dòng 62. **Không thêm mã mới.**
- `app/view/tieu-de.js` — khuôn mẫu chuẩn nhất để sao: `noiTieuDe(store, doc = document, mocHienTai)` → `{ ve }`; thiếu `doc` → `{ ve() {} }`; ba luật tầng view viết ở đầu file. Bắt chước cả kiểu chú thích.
- `app/view/o-soan.js:35` — khuôn cho view **có xử lý sự kiện** (`noiOSoan(store, goc, sauKhiChot)`): cách tra phần tử theo hằng selector, cách gọi action rồi gọi lại lượt vẽ. Nút `✕` đi theo khuôn này.
- `app/view/luoi.js:43,73` — khuôn vẽ lại toàn phần (`replaceChildren`); dòng 12 ghi rõ **không có cơ chế subscribe và không được dựng một cái**.
- `app/main.js:71-108` — thứ tự nối: `noiLuoi` → `noiTieuDe` → `veTatCa` → `khoiDong().then(veTatCa)` → `noiOSoan(store, document, veTatCa)`. `noiBanner` phải nối vào đây và `ve` của nó phải vào `veTatCa`. Đây là file **duy nhất** được import `app/adapters/`.
- `index.html:43,54` — `<body>` mở ở 43, `<main class="khung">` ở 54. Phần tử chủ của dải băng đặt **giữa hai dòng đó**. `index.html:18-40` là script theme đồng bộ — không chạm.
- `app/style.css:129` — `body` là flex column, `overflow: hidden`, `block-size: 100%` (dòng 168); `.tang { flex: none }` dòng 180, `.tang-luoi { flex: 1; min-block-size: 0 }` dòng ~193. Token cần: `--chip-bg` (47 light / 115 dark), `--rule` (44/112), `--ink-2` (42/110). Cảnh báo 4.55:1 ở dòng 21.
- `test/tieu-de.test.js`, `test/luoi.test.js:44` — **không có jsdom**; test view dựng DOM giả bằng tay (`phanTuGia()`), khai thác đúng quy ước "gốc DOM đi vào qua tham số". Mốc thời gian cố định `MOC = '2026-09-14T09:30:00+07:00'`.
- `test/core-state.test.js:46` — danh sách khóa state ghim cứng (có `'banner'`); ~30 assertion `store.state.banner` rải từ dòng 449 đến 1246. Đổi hình dạng `banner` là đổi chỗ này.
- `test/nguong-tap-trung.test.js` — chỉ `0` và `1` được miễn trừ; mọi số khác dưới `app/` là đỏ. Vì thế ưu tiên **phải** là thứ tự mảng.
- `test/harness.test.js:61` — chỉ `app/main.js` được import `app/adapters/`. Không có test nào cấm `core → view`, nhưng cạnh đó vẫn ngược tầng.
- `test/token-style.test.js:405,422,430` — màu chỉ qua `var(--…)`, chỉ `style.css` khai `:root`, không at-rule/lồng khối mới.
- `test/bo-cuc-bon-tang.test.js:27-45` — ghim thứ tự DOM của bốn class `tang-*`; một phần tử **không** mang class `tang` đặt phía trên là tương thích.
- `_bmad-output/planning-artifacts/epics.md:912-952` — AC nguyên văn của Story 3.1.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/banner.js` — **file mới**: `LOAI_BANG` (bảy hằng: sáu mã của `MA_LOI` + hai sentinel không-phải-lỗi) đông lạnh; `BANG_UU_TIEN` là **mảng có thứ tự** (ưu tiên = vị trí, không số literal) với cờ đóng-được từng hàng; `dongDuoc(loai)`; `thayDuoc(dangHien, moi)` thuần; và microcopy cho hàng nguồn 7 (nguyên văn planning). Hàng nguồn 6 khai trong bảng nhưng **chưa** có chữ — Epic 4 gắn phần tham số.
- [x] `app/core/state.js` — cho mọi phép đặt `banner` đi qua `thayDuoc`, giữ nguyên `datLai` là đường duy nhất; thêm action đóng dải băng cho nút `✕` (chỉ có tác dụng với hàng đóng được); giữ nguyên đường xóa chủ đích `banner: null` sau khi ghi thành công (`state.js:625`) — đường đó **không** đi qua phép gác. Không đổi `maBanner`, không đổi 14 chỗ đặt hiện có.
- [x] `index.html` — thêm phần tử chủ của dải băng làm con **đầu tiên** của `<body>`, trước `<main class="khung">`, không mang class `tang`; rỗng ở dạng tĩnh (như `.luoi`), kèm chú thích kiểu nhà nói rõ vì sao nó ở ngoài `<main>`.
- [x] `app/view/banner.js` — **file mới**: `noiBanner(store, goc = document)` → `{ ve }`, theo đúng khuôn `tieu-de.js`; vẽ lại toàn phần từ một phép đọc state; tra microcopy qua `core/errors.js`, không tự soạn chữ; dựng nút `✕` (nhãn chữ `đóng thông báo`) **chỉ** cho hàng đóng được; thiếu gốc → `{ ve() {} }`.
- [x] `app/main.js` — nối `noiBanner` và đưa `ve` của nó vào `veTatCa`; `✕` gọi action đóng rồi gọi lại `veTatCa`, cùng khuôn `sauKhiChot` của `o-soan.js`.
- [x] `app/style.css` — hình dạng dải băng: `flex: none`, nền `var(--chip-bg)`, `border-block-end: 1px solid var(--rule)`, không bóng, không biến thể theo loại; `✕` dùng `var(--ink-2)`; rỗng thì không chiếm chiều cao. Không token mới, không `@media` mới.
- [x] `test/banner.test.js` — **file mới**: nghiệm thu bảng ưu tiên bằng test **trên chính bảng đó** (đủ bảy hàng, đúng thứ tự, đúng cờ đóng-được, không hàng thứ tám), phép gác cho **mọi** cặp ưu tiên, và mọi hàng của I/O Matrix trên một DOM giả theo khuôn `luoi.test.js`.
- [x] `test/core-state.test.js` — bổ sung ca cho phép gác ưu tiên ở tầng ghi và cho action đóng dải băng. Assertion `banner` hiện có **phải còn xanh y nguyên** — đó là bằng chứng từ vựng phẳng không làm trôi lãnh địa Epic 1.
- [x] `README.md` — thêm mục thử tay cho dải băng nếu danh sách hiện có cần nó.

**Acceptance Criteria:**
- Given toàn bộ `app/`, when grep tìm nơi ghi vào DOM của dải băng, then chỉ `app/view/banner.js` xuất hiện, và nó đọc **đúng một** giá trị state tầng C.
- Given dải băng đang hiện, when nhìn trang, then ba tầng dưới **bị đẩy xuống** và trang vẫn **không có** thanh cuộn ngoài (`npm run thu-bo-cuc` vẫn xanh).
- Given bảng ưu tiên, when đọc nó, then **cả bảy** nguồn có mặt đúng thứ tự AD-17, và không một số literal nào xuất hiện dưới `app/` ngoài `core/limits.js`.
- Given một `Error` không mang mã thuộc tập đóng, when nó đi từ cổng qua action tới view, then dải băng hiện microcopy của `DB` chứ không bao giờ hiện chuỗi tiếng Anh của trình duyệt.
- Given bốn nguồn chưa có người phát, when grep toàn `app/`, then không có code nào **phát** chúng — chúng chỉ tồn tại trong bảng.
- Given `npm test`, when chạy, then toàn bộ test cũ vẫn xanh — đặc biệt `nguong-tap-trung`, `state-tap-trung`, `token-style`, `bo-cuc-bon-tang`, `trang-tinh`, `harness`.

## Implementation Notes

**File mới:** `app/core/banner.js` (bảng + `dongDuoc` + `thayDuoc` + `microcopyBanner`), `app/view/banner.js` (`noiBanner(store, goc, sauKhiDong)`), `test/banner.test.js`.
**Sửa:** `app/core/state.js` (gác trong `datLai`, action `dongDaiBang`), `app/main.js`, `index.html`, `app/style.css`, `test/core-state.test.js`, `test/luoi.test.js`, `README.md`.

**Bảy hàng nhưng tám giá trị loại.** Hàng 4 của AD-17 chở hai mã (`BAD_FILE` · `BAD_VERSION`, `errors.js` đã cho chúng chung một câu), nên `hang.loai` là một **mảng** mã chứ không một mã. Spec viết "bảy hằng" trong khi tự liệt kê 6+2 = 8 — mâu thuẫn của spec, và cách giải là đúng: `LOAI_BANG` có 8 giá trị, `BANG_UU_TIEN` có 7 hàng. Ghi chép ngay trong `core/banner.js`.

**Phép gác đặt trong `datLai`, bỏ đúng khóa `banner`.** Không bỏ cả lời gọi: `banner` thường đi cùng một nhánh khác trong một `datLai` duy nhất (`{ draft, banner }`), và bỏ cả lời gọi là mất luôn chữ vừa gõ. Nhờ đặt ở đây mà 14 chỗ đặt `banner` không phải đọc lại một dòng nào — và mọi chỗ Epic 7/8 viết thêm cũng tự được gác.

**`test/luoi.test.js` phải sửa — lệch so với AC "mọi test cũ xanh y nguyên".** Ca ghim thân `veTatCa` đòi **đúng** `['luoi','tieuDe']`; đã nới thành `['luoi','tieuDe','banner']`. Không có cách nào vừa đưa `banner.ve` vào lượt vẽ chung vừa giữ nguyên ca đó. Vẫn ghim **đúng tập** (không nới thành "có chứa"), và lý do viết ngay tại chỗ.

**Gõ quá trần chưa bật dải băng ngay — ranh giới đã nhận có ý thức.** `datBanNhap` đặt `TOO_LONG` nhưng `o-soan.js` không gọi lượt vẽ chung ở sự kiện `input`, nên dải băng chỉ hiện sau `Ctrl+Enter`. Sửa nó là chạm `o-soan.js` (ngoài danh sách task) và vẽ lại cả lưới mỗi phím — trần 200 ms của NFR-2. Để nguyên và ghi vào README mục 24. **Đáng renegotiate nếu đây không phải ý định.**

**`npm run thu-bo-cuc` có một ca FLAKY, và nó có TRƯỚC story này.** Ca "tải lại trang: MỌI mẩu về thu gọn" đỏ không đều. Đã đo: baseline `1d86a4f` đỏ **4/5** lần, bản có thay đổi đỏ **2/4** lần. Vậy nó **không** do Story 3.1 — nó là một ca đo lường không bền có sẵn, và đáng mở một mục riêng để sửa.

## Spec Change Log

## Review Triage Log

**Vòng 1** — ba layer: `blind-hunter` (10 finding), `edge-case-hunter` (9), `verification-gap` (2 + 2 phụ). Không entry nào là `intent_gap` hay `bad_spec` → không loopback.

| # | Finding | Verdict | Bằng chứng | Route |
|---|---|---|---|---|
| 1 | Hai ca "ưu tiên cao thay ưu tiên thấp" đều assert trên một store MỚI (banner khởi đầu `null`), không phải store đang hiện thông báo — nhánh chấp nhận của `thayDuoc` không được nghiệm thu ở tầng ghi | medium | `verification-gap` đã **chứng minh bằng đột biến**: thay điều kiện gác thành "đã có banner thì không gì thay được", 475/475 test **vẫn xanh**. Xác nhận lại trên diff: `core-state.test.js:1080-1088` và `banner.test.js:802-814` đều dựng `sau`/`store2` mới. | patch |
| 2 | Ca "cùng mức ưu tiên: cái mới thay cái cũ" thực ra test nhánh TỪ CHỐI — nó đặt `QUOTA` (hàng 2) rồi phát `TOO_LONG` (hàng 5) | medium | `core-state.test.js:1090-1096`: assert `banner` vẫn là `QUOTA`. Đó là đúng ca ngay phía trên nó. Quyết định `<=` thay vì `<` (ghi ở `banner.js:154`) không có ca nào ở tầng ghi. | patch |
| 3 | Vùng `aria-live` bị `display: none` khi rỗng → thông báo ĐẦU TIÊN không được đọc lên | medium | `.dai-bang:empty { display: none }` (`style.css:350`) giữ phần tử ngoài cây trợ năng cho tới đúng lúc nội dung được chèn. Chính lý lẽ viết trong `index.html:524-526` bị cơ chế giấu vô hiệu hóa. | patch |
| 4 | Mọi lượt vẽ chung đọc lại một thông báo KHÔNG đổi — `ve()` gọi `replaceChildren` vô điều kiện, `veTatCa` chạy sau mỗi lần chốt/xóa/mở rộng | medium | `view/banner.js:461`. Một dải băng bền (`DB`/`QUOTA`) bị đọc lại mỗi thao tác. Cùng gốc với #3: `aria-live` được thêm mà không kèm cơ chế nó đòi. | patch (gộp #3) |
| 5 | Bấm `✕` làm rơi focus bàn phím vào hư không — nút đang focus bị gỡ khỏi DOM, không trả focus | medium | `view/banner.js:491-496`. Sản phẩm có đúng bốn phím và focus ring là "bản đồ di chuyển duy nhất"; mất chỗ đứng là mất bản đồ. Ô soạn thảo là nhà mặc định (`autofocus` ở `index.html:70`) nên đích trả về không mơ hồ **ở sản phẩm hôm nay**. | patch |
| 6 | Không có phép đo THẬT nào cho "đẩy xuống chứ không phủ lên" | medium | `verification-gap` chứng minh: thêm `.dai-bang { position: fixed }` ở CUỐI `style.css` thì mọi phép kiểm vẫn xanh — regex `.exec` chỉ khớp khối ĐẦU, `bo-cuc-bon-tang` không nhắc `.dai-bang`, và `thu-bo-cuc` luôn đo lúc nó rỗng. | patch |
| 7 | `.dai-bang-dong` thiếu `cursor: pointer` và vùng bấm gần như bằng đúng một ký tự (`padding: 0`) | low | `style.css:367-374`. Người dùng gặp nó ở **mọi** lần đóng, nên không rơi vào diện "hiếm khi gặp". | patch |
| 8 | `microcopyBanner` kiểm hợp lệ bằng một lời gọi bị vứt (`viTri(loai);`) không chú thích | low | `core/banner.js:186`. Một lint `no-unused-expressions` hay một lần dọn dẹp sẽ xóa nó, gỡ mất bảo đảm mà `banner.test.js:737` dựa vào. | patch |
| 9 | `dongDaiBang` gác `null` mà không gác `undefined` | low | `state.js:264`. Chính `verification-gap` xác nhận **không tới được hôm nay**: `banner` khởi tạo `null` và mọi chỗ ghi đều đi qua `maBanner` (`state.js:101`). Thêm một nhánh cho một trạng thái chưa chứng minh là tới được → **từ chối**. | reject |
| 10 | `MICROCOPY_BANG` không được ghim đông lạnh, và một sentinel thứ ba thêm vào sẽ lọt qua cả suite | false | Bác bỏ hai lần: nó **đã** `Object.freeze` ở `core/banner.js:126`; và `banner.test.js:701-703` ghim `LOAI_BANG.length === MA_LOI.length + MICROCOPY_BANG.length`, nên một sentinel thứ ba không có hàng trong bảng làm ca đó ĐỎ. | reject |
| 11 | Claim: spec nói đường xóa chủ đích "không đi qua phép gác", thực tế nó đi qua `datLai` và chỉ được `thayDuoc` cho qua — một lần sửa `thayDuoc` sau này có thể giam vĩnh viễn dải băng không đóng được | false | Hệ quả bị bác bỏ: `banner.test.js:771-773` ghim `thayDuoc(loai, null) === true` cho **mọi** hàng của bảng. Sửa `thayDuoc` để chặn `null` làm ca đó đỏ ngay. Khác biệt còn lại thuần là chữ nghĩa. | reject |
| 12 | `bang.ownerDocument` vắng mặt → `TypeError` giữa lượt vẽ | low | Không chứng minh được đường tới: trong DOM thật `ownerDocument` luôn có, và `index.html` là nguồn duy nhất của phần tử chủ. Gác một trạng thái chưa chứng minh là tới được → **từ chối**. | reject |
| 13 | `state.banner` mang giá trị ngoài bảng → `viTri` ném giữa lượt vẽ chung | low | Mọi chỗ ghi đi qua `maBanner`, hàm này kẹp về một giá trị của `MA_LOI` (`state.js:101-104`), và cả sáu đều có hàng trong bảng. Không có đường tới. | reject |
| 14 | Trùng lặp giàn giáo test (`portsDay`, `storeVoiBanner` ở hai file) và regex ghim `main.js` ở cả `luoi.test.js` lẫn `banner.test.js` | low | Có thật, nhưng chỉ cắn khi thêm view thứ tư, và phép sửa (nâng lên `test/helpers/`) là một module mới cộng sửa hai file — quá "một phép sửa thẳng". | reject |
| 15 | Ghi cũ hoàn thành SAU một ghi mới hỏng sẽ xóa mất dải băng `QUOTA`/`DB` vừa bật | maybe-false | Không xác định được đường tới nếu không truy hết các nhánh bất đồng bộ của `henGhiDiSau`/`ghiTruocDatSau`. Và hành vi "ghi thành công thì tắt dải băng" **có trước story này** (`state.js:625`) — không do thay đổi này gây ra. | defer |
| 16 | `npm run thu-bo-cuc` ca "tải lại trang" đỏ không đều | low, có trước | Tôi tự đo: baseline `1d86a4f` đỏ **4/5** lần; bản có thay đổi đỏ **2/4** lần. Không do story này. | defer |

**Kết quả 7 patch — đã kiểm chứng độc lập, không tin báo cáo:**

- Phép đột biến cho #1/#2 (thay điều kiện gác trong `datLai` thành "đã có banner thì không gì thay được"): **trước patch 0 test đỏ, sau patch 3 test đỏ** — `banner.test.js` "ưu tiên cao đến sau… trên CÙNG một store", `core-state.test.js` cùng ca, và ca "cùng mức ưu tiên". Lỗ hổng đã bịt.
- Phép đột biến cho #6 (thêm `.dai-bang { position: fixed }` ở cuối `style.css`): **harness đỏ** — `đỉnh .khung đẩy 0px`. Ca đo thật đã có tác dụng.
- #3: `.dai-bang:empty` đổi từ `display: none` sang `block-size: 0; padding-block: 0; border-block-end: 0; overflow: hidden` — vùng sống ở lại trong cây trợ năng, và harness vẫn đo `cao 0` lúc rỗng.
- #4: `view/banner.js` giữ `daVe` và trả về sớm khi loại không đổi — không chạm DOM thì `aria-live` không đọc lại.
- #5: `main.js` có `dongRoiVe` (vẽ lại rồi trả focus về `#o-soan`); `view/banner.js` **không** biết tới ô soạn thảo, có ca ghim điều đó.
- #7: `.dai-bang-dong` được `cursor: pointer` và vùng bấm bằng token (`--space-1`/`--space-2`); `outline` không bị đụng.
- #8: `viTri(loai);` bị vứt → hàm gác có tên `phaiTrongBang(loai)`.

**Verification cuối (tự chạy):** `npm test` **477/477** xanh, 21 file; `npm run thu-bo-cuc` **42/42**.

## Design Notes

**Ưu tiên là thứ tự mảng, không phải con số.** `test/nguong-tap-trung.test.js` chỉ miễn trừ `0` và `1`, nên một bảng mang `uuTien: 2` là đỏ ngay. Mảng có thứ tự đạt cùng mục đích và còn mạnh hơn: không có cách nào khai hai hàng cùng ưu tiên, và "thêm nguồn thứ tám" trở thành một thay đổi nhìn thấy được trong một literal duy nhất.

```js
// Ưu tiên = vị trí. Không một con số nào viết ra.
const BANG_UU_TIEN = Object.freeze([
  Object.freeze({ loai: LOAI_BANG.VERSION_SKEW, dongDuoc: false }),
  Object.freeze({ loai: LOAI_BANG.QUOTA,        dongDuoc: false }),
  Object.freeze({ loai: LOAI_BANG.DB,           dongDuoc: false }),
  // … bốn hàng còn lại của AD-17, hàng cuối là cảnh báo trước ngưỡng
]);
```

**Phép gác phải ở tầng ghi, không ở tầng vẽ.** `view/luoi.js:12` ghi rõ view không giữ state riêng và không có cơ chế subscribe. Một view không nhớ lượt trước thì không có gì để so — nên "ưu tiên thấp không thay được ưu tiên cao" chỉ nghiệm thu được nếu nó là bất biến của `datLai`.

**`microcopyLoi` NÉM với hai sentinel mới.** `errors.js:47` chốt rằng mã ngoài `MICROCOPY` là `TypeError` — và đó là luật đúng, không được nới. Nên `view/banner.js` phải **phân nhánh theo bảng**: hàng nào là mã lỗi thì tra `microcopyLoi`, hai hàng không-phải-lỗi thì tra bảng riêng ở `core/banner.js`. Gọi thẳng `microcopyLoi(loai)` cho mọi hàng là cái bẫy rõ nhất của story này.

**Một lối ra cho phép xóa chủ đích.** Phép gác không được chặn `banner` về rỗng: AD-8 đòi `QUOTA` (không đóng được) phải tự tắt khi một phép ghi sau đó thành công, và `state.js:625` đã có nhánh `tatDaiBang` làm đúng việc đó. Đóng bằng `✕` và tắt sau khi ghi thành công là **hai** đường khác nhau — đường `✕` xét cờ đóng-được, đường ghi-thành-công thì không.

## Verification

**Commands:**
- `npm test` — expected: toàn bộ xanh, kể cả các test bất biến kiến trúc đã kể ở AC.
- `npm run thu-bo-cuc` — expected: không thanh cuộn ngoài, bốn tầng đúng thứ tự khi dải băng đang hiện.

**Manual checks:**
- Mở `index.html` qua HTTP localhost, ép `banner` sang từng hàng của bảng: đúng một hình dạng ở mọi hàng, `✕` chỉ xuất hiện ở hàng đóng được, nội dung bị đẩy xuống chứ không bị phủ.
- Đổi sang theme tối và xem lại: chữ trên `--chip-bg` vẫn đọc được ở cả hai bảng màu.
</content>
