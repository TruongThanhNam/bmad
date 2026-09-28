---
title: 'Story 2.4 — Lưới ghi chú của hôm nay'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
baseline_commit: '1b0f29c3f43647058913ffe39e9416ba6c5281bd'
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ghi chú đã chốt xuống được kho bền và đã nằm trong `state.notes`, nhưng **không có mắt nào nhìn thấy chúng**: `app/view/` chỉ có ô soạn thảo, `.luoi` trong `index.html` rỗng nguyên, và không một dòng mã nào đọc `state.dieuKien` để ra một danh sách. `core/query.js` — bộ truy vấn mà AD-15 nói tới — chưa tồn tại. Nam chốt xong thì mẩu giấy biến mất vào hư không; UJ-1 đứt đúng ở nhịp nhìn thấy.

**Approach:** Dựng hai thứ: một **bộ truy vấn thuần** `app/core/query.js` biến `(notes, dieuKien, mốc hiện tại)` thành danh sách hiển thị — khối điều kiện rỗng `{ keyword: null, date: null }` lọc theo `localDate` của hôm nay, đúng tinh thần "khung nhìn mặc định là *vắng mặt của điều kiện*"; và một **view lưới** `app/view/luoi.js` vẽ danh sách đó vào `.luoi`. Lưới vẽ lại sau mỗi lần chốt và sau khi nạp kho xong. Hình dạng mẩu giấy đầy đủ (giờ tạo, cắt, mở rộng, nút xóa) vẫn là việc của Story 2.5.

## Boundaries & Constraints

**Always:**
- `locGhiChu` là **hàm thuần**: không đọc đồng hồ, không chạm DOM, không async. Mốc thời gian hiện tại đi vào **qua tham số** (`nowIso()` của `core/time.js` do chỗ gọi truyền xuống) — `app/core/**` không được chạm global trình duyệt và `new Date` chỉ sống trong `core/time.js`.
- Lọc và tìm là **quét mảng đồng bộ** trên `state.notes` đã sắp sẵn trong RAM (AD-6). Không truy vấn bất đồng bộ, không phương thức cổng mới, không chạm `app/ports/`.
- Thứ tự là bất biến: danh sách trả về giữ nguyên thứ tự giảm dần theo `localStamp` mà `sapGiamDan` đã đặt. Bộ truy vấn **lọc, không sắp lại**.
- Hướng đọc trái-sang-phải, hết hàng xuống hàng. Mẩu mới nhất ở ô trên-cùng-trái, mẩu thứ hai **bên phải** nó. Không masonry, không điền dọc.
- View chỉ đọc state, không giữ state riêng, không import `app/adapters/`, không số literal — đúng ba luật trong header `o-soan.js`.
- `.luoi` trong `index.html` **vẫn rỗng nguyên** ở dạng tĩnh; mọi mẩu do lượt render sinh ra lúc chạy.
- `dieuKien.date` (khi có) là chuỗi `yyyy-MM-dd` và được so **thẳng** với `localDate(note)`; `dieuKien.keyword` so trên `textFolded`.
- Chiều dài lưới chỉ phụ thuộc số ghi chú **của hôm nay** — không quét, không dựng DOM cho ghi chú ngày khác.

**Never:**
- Không tồn tại một điều kiện mang tên `"hôm nay"`, không cờ `today`, không giá trị mặc định `date = <hôm nay>` trong state. Hôm nay là thứ suy ra lúc truy vấn từ `date === null`.
- Không hình dạng mẩu giấy đầy đủ: không dải keo, không `HH:mm`, không cắt `còn N dòng ▾`, không nút `xóa`, không `expandedId` (Story 2.5). Không trạng thái rỗng có chữ, không tab title (Story 2.6).
- Không trần kết quả — `MAX_RESULTS` là việc của Epic 6; hôm nay hiển thị hết.
- Không cơ chế subscribe/observer, không store thứ hai, không trường state mới.
- Không sửa `app/core/state.js`, `time.js`, `limits.js`, `fold.js`, `app/ports/**`, `app/adapters/**`. Trong `app/style.css` chỉ được thêm **đúng một** luật cho ô lưới, và luật đó chỉ mang ngữ nghĩa chữ (`white-space`, `overflow-wrap`) — **không** màu, không nền, không bo góc, không bóng, không khoảng đệm; `.luoi` L323-328 giữ nguyên.
- Không sửa một dòng nào trong `harness`, `trang-tinh`, `token-style`, `bo-cuc-bon-tang`, `state-tap-trung`, `nguong-tap-trung`, `date-tap-trung`, `fold-tap-trung`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Khung nhìn mặc định | 1.200 ghi chú, 4 cái có `localDate` bằng hôm nay; `dieuKien = {keyword:null,date:null}` | Trả đúng 4 bản ghi, giữ thứ tự giảm dần; `.luoi` có đúng 4 phần tử con | N/A |
| Vừa chốt xong | Chốt một ghi chú mới | Lưới vẽ lại, mẩu mới ở ô **đầu tiên**, mọi mẩu khác dịch một ô về sau | N/A |
| Hôm nay chưa có gì | `notes` toàn ngày khác | Trả mảng rỗng; `.luoi` không còn phần tử con nào, **không một chữ nào** | N/A |
| Kho rỗng | `notes = []` | Mảng rỗng, lưới trống | N/A |
| Có `date` cụ thể | `dieuKien.date = '2026-09-01'` | Lọc theo đúng ngày đó, **không** theo hôm nay | N/A |
| Có `keyword` | `keyword = 'pho'`, một mẩu hôm nay có `textFolded` chứa `pho` | Chỉ mẩu khớp; điều kiện chồng lên phép lọc ngày | N/A |
| Chữ nhiều dòng | `text` có `\n` | Xuống dòng giữ nguyên khi hiển thị; không diễn giải markdown, không HTML | N/A |
| Chữ mang ký tự HTML | `text = '<script>x</script>'` | Hiện ra **nguyên văn** như chữ; không phần tử nào được tạo từ nội dung | N/A |
| Không có `.luoi` trong DOM | Gốc DOM thiếu phần tử | View trả về đối tượng no-op, không ném — cùng khuôn `noiOSoan` | N/A |
| Qua nửa đêm, tab vẫn mở | Chốt một ghi chú lúc `00:05` | Lượt vẽ đó lọc theo ngày **mới**: mẩu mới hiện ra, mọi mẩu hôm qua biến mất cùng lúc | N/A |

### Quyết định của người dùng

- **Mỗi ô lưới là một khối chữ trần — không luật CSS *trang trí* nào.** (Nguyên văn lúc chốt là "không luật CSS mới nào"; vòng review 1 nới lại đúng một luật ngữ nghĩa chữ — xem gạch đầu dòng thứ ba.) Epic context nói thẳng "2.4 dựng lưới mà 2.5 vẽ từng ô", nên 2.4 dừng ở vị trí và thứ tự. Một `<div>` mang `textContent`, thừa hưởng `--font-note`/`--ink` từ trên xuống; **không** thêm class `.giay`, không nền `--paper`, không `--radius-paper`, không `box-shadow`. Đổi lại: sau story này màn hình còn thô, và đó là trạng thái đúng — Story 2.5 sẽ thêm CSS mới chứ không phải gỡ CSS của 2.4 ra.
- **"Hôm nay" tính lại ở mỗi lượt vẽ, không có hẹn giờ nửa đêm.** `ve()` gọi `nowIso()` mỗi lần chạy, nên lưới luôn phản ánh ngày thật tại thời điểm vẽ. Hệ quả đã chấp nhận: tab mở qua 00:00 thì lượt chốt đầu tiên của ngày mới quét sạch mẩu hôm qua khỏi lưới — dữ liệu vẫn nguyên trong kho, chỉ là ra khỏi khung nhìn. Phương án chốt mốc lúc tải trang bị bác vì nó làm ghi chú vừa chốt **không hiện ra**, tức phá lời hứa "mẩu giấy nhô lên là bằng chứng duy nhất". Phương án hẹn giờ tự vẽ lại bị bác vì thêm bề mặt và một hằng số mới cho một ca Nam gần như không gặp.
- **Xuống dòng thắng, bằng đúng một luật CSS** (chốt ở vòng review 1, do khối đóng băng tự đá nhau). Dòng Matrix "chữ nhiều dòng giữ nguyên xuống dòng" là lời hứa thật với người dùng, còn dòng Never "không thêm luật CSS nào" sinh ra để chặn **hình dạng mẩu giấy** lấn sang 2.4, không phải để chặn ngữ nghĩa chữ. Nên ô lưới được đúng một luật `white-space: pre-wrap` + `overflow-wrap: anywhere`. Phương án `<pre>` bị bác vì nó kéo theo monospace — thứ epic dành riêng cho dấu thời gian — và không xuống dòng khi câu dài. Phương án hoãn sang 2.5 bị bác vì nó giao một lưới hiển thị sai nội dung.
- **Giữ spec đầy đủ** dù vượt ngưỡng token: story 2.4 là một deliverable duy nhất, và độ dày Code Map này là thứ đã giữ cho 2.1–2.3 không phải dò lại các cửa chặn test.

</frozen-after-approval>

## Code Map

- `app/core/state.js` -- **chỉ đọc, không sửa**. `stateRong()` L153-169 (`notes` L156, `dieuKien` L160); `KHOA_DIEU_KIEN` L71; `sapGiamDan` L107-110 (đã sắp sẵn — query không sắp lại); `banGhiMoi` L119-128 (năm trường: `id`, `createdAt`, `localDate`, `text`, `textFolded`); `xoaHetDieuKien` L335-337; `chotGhiChu` gọi `xoaHetDieuKien()` ở L507; danh sách action đóng băng L706-719.
- `app/core/time.js` -- `nowIso()` L107, `localDate(note)` L138 (`createdAt.slice(0,10)`), `localStamp(note)` L133. **Chỗ duy nhất được chạm `Date`** — query nhận mốc qua tham số, `main.js` truyền `nowIso()` xuống.
- `app/core/fold.js` -- `fold()`; `textFolded` của bản ghi đã gấp sẵn, nên khớp keyword là so hai chuỗi đã gấp. **Không gọi lại `fold` ở query trên `textFolded`** — `fold-tap-trung.test.js:93` cấm logic bỏ dấu ngoài `fold.js`, gọi hàm thì được, viết lại thì không.
- `app/core/query.js` -- **FILE MỚI**. Thuần, không import adapter/DOM. Xuất `locGhiChu(notes, dieuKien, mocHienTai)`.
- `app/view/o-soan.js` -- khuôn mẫu bắt buộc: header ba luật L1-13, định vị bằng `id` L16, nhánh no-op khi thiếu phần tử L35, `dongBoTuState` so-trước-khi-gán L106-114, chữ ký `noiOSoan(store, goc = document)` L31. Chỗ chốt L79 là nơi cần một móc "vẽ lại lưới".
- `app/view/luoi.js` -- **FILE MỚI**. `noiLuoi(store, goc = document, mocHienTai = nowIso)` → `{ ve }`.
- `app/main.js` -- khối `if (typeof document !== 'undefined')` L69-88: `store.khoiDong()` L72 (**hiện không được `await`** — phải treo `.then(luoi.ve)` vào nó, vì `notes` nạp bất đồng bộ), `noiOSoan(store)` L76, `khoiDongBanNhap().then(oSoan.dongBoTuState)` L83. Chú thích L90-92 nói rõ view Epic 2+ nối vào đúng cửa này.
- `index.html` -- `<div class="luoi"></div>` L113 trong `.container` L110; chú thích L111-112 đang hoãn nội dung sang 2.5/2.6 (cập nhật cho đúng). `.luoi` **chưa có `id`** — thêm `id="luoi"` để theo lệ định vị của view. Đúng hai `<script>` L18-40 + L131, không thêm cái thứ ba.
- `app/style.css` -- `.luoi` **đã có** L323-328 (`display:grid`, `repeat(auto-fill, minmax(var(--note-min-col),1fr))`, `gap: var(--grid-gap)`, `align-content:start`) — **không sửa**, không thêm breakpoint. **Story này không chạm file này một dòng nào** — ô lưới thừa hưởng `--font-note`/`--ink` từ tổ tiên; `--paper`, `--radius-paper`, `--shadow-inset` để dành cho Story 2.5.
- `test/bo-cuc-bon-tang.test.js` -- L69-74 ghim `.luoi` **rỗng trong `index.html`** (quét văn bản tĩnh, không phải DOM lúc chạy) → render lúc chạy **không** làm nó đỏ, đừng sửa. L155 đúng một `<svg>`, L163 không `<a>`, L181 đúng hai `<script>`, L182 không `on*=` inline, L190-196 mọi `box-shadow` mở đầu `var(--shadow-inset)`. **Không sửa một dòng nào.**
- `test/o-soan.test.js` -- L605-635 khuôn cửa chặn tầng view; L631-633 ghim tập thành viên store `['chotGhiChu','datBanNhap','state']` (nếu thêm tham số callback thì tập này **không đổi**); L617-629 ghim thứ tự nối trong `main.js`; helper `portsDay()` L153, `storeGia(...)` L174, `gocGia(o, chon)` L136.
- `test/core-state.test.js` -- helper cho test lõi: `portsDay()` L19, `banGhiMau()` L307, `storeVoiKho(...)` L430.
- `test/harness.test.js` L135 -- `app/core/**` không được nhắc `window|document|indexedDB|...`. `test/nguong-tap-trung.test.js` L162 -- không số literal ngoài `limits.js`. `test/date-tap-trung.test.js` L71 -- không `new Date`/`Date.now` ngoài `time.js`. `test/state-tap-trung.test.js` L206 -- chỉ `state.js` được gán vào state. **Tất cả: không sửa.**
- `_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md` -- AD-6 (quét đồng bộ trong RAM), AD-15 (khung nhìn mặc định là vắng mặt của điều kiện).

## Tasks & Acceptance

**Execution:**
- [x] `app/core/query.js` -- file mới: `locGhiChu(notes, dieuKien, mocHienTai)` thuần — `date === null` → lọc `localDate(note) === localDate({ createdAt: mocHienTai })`, `date` có giá trị → so thẳng chuỗi; `keyword` khác `null` → lọc thêm trên `textFolded`; giữ nguyên thứ tự đầu vào -- bộ truy vấn AD-15 phải là thứ kiểm được không cần DOM lẫn đồng hồ
- [x] `app/view/luoi.js` -- file mới theo khuôn `o-soan.js`: header ba luật, định vị `#luoi`, no-op khi thiếu phần tử, `ve()` dựng lại danh sách con từ `locGhiChu(store.state.notes, store.state.dieuKien, mocHienTai())`; nội dung đặt bằng `textContent` -- chữ của Nam không bao giờ được thành markup
- [x] `app/view/o-soan.js` -- thêm tham số móc `sauKhiChot` (mặc định no-op) và gọi nó sau khi lời hứa chốt chốt xong, cạnh `dongBoTuState()`/`caoTheoNoiDung()` -- không có subscribe thì lượt vẽ lại phải được nối tay ở `main.js`, và đây là điểm nối duy nhất không sinh state thứ hai
- [x] `app/main.js` -- nối `noiLuoi(store)` trong cùng khối `document`, treo `ve` vào `store.khoiDong()` và truyền `luoi.ve` làm `sauKhiChot` của `noiOSoan` -- `notes` nạp bất đồng bộ nên lượt vẽ đầu tiên phải chờ kho trả lời
- [x] `index.html` -- ~~thêm `id="luoi"` vào `<div class="luoi">`~~ (xem Spec Change Log) và cập nhật chú thích L111-112 -- phần tử vẫn rỗng ở dạng tĩnh, chỉ đổi cách view tìm ra nó
- [x] `test/core-query.test.js` -- file mới phủ toàn bộ I/O Matrix ở tầng lõi: mặc định lọc hôm nay giữa 1.200 bản ghi, `date` cụ thể, `keyword`, hai điều kiện chồng nhau, `notes` rỗng, hôm nay rỗng, thứ tự đầu vào được giữ nguyên, và ca ghim rằng `locGhiChu` không đọc đồng hồ (đưa hai mốc khác nhau cho cùng `notes` → hai kết quả khác nhau) -- "vắng mặt của điều kiện" chỉ là lời hứa nếu không có ca ghim
- [x] `test/luoi.test.js` -- file mới theo khuôn `o-soan.test.js`: vẽ đúng số mẩu của hôm nay, mẩu mới nhất đứng **đầu**, vẽ lại sau khi chốt, lưới rỗng thì không phần tử con và không chữ, chữ nhiều dòng giữ nguyên, chữ mang thẻ HTML hiện nguyên văn, thiếu `#luoi` thì không ném; cộng cửa chặn tầng view của riêng file này (tập thành viên store chạm tới, không `subscribe|onChange|theoDoi`, không `adapters/`, không `new Date`, không số literal) -- mỗi view mới phải mang cửa chặn của chính nó
- [x] `tools/thu-bo-cuc.mjs` + `README.md` -- thêm phép đo Chromium thật: chốt ba ghi chú rồi khẳng định ba mẩu nằm trên **một hàng ngang** (cùng `offsetTop`, `offsetLeft` tăng dần) ở cửa sổ đủ rộng, và mẩu mới nhất có `offsetLeft` nhỏ nhất -- "trái sang phải, không masonry" là phép đo hình học, Vitest không với tới

**Acceptance Criteria:**
- Given `npm test`, when chạy, then toàn bộ suite xanh và tám file ghim bất biến (`harness`, `trang-tinh`, `token-style`, `bo-cuc-bon-tang`, `state-tap-trung`, `nguong-tap-trung`, `date-tap-trung`, `fold-tap-trung`) không bị sửa một dòng nào
- Given `app/core/query.js`, when đọc, then nó không import gì ngoài `app/core/`, không nhắc `document`/`window`, không `new Date`, và không số literal nào
- Given `app/core/state.js`, `app/style.css` và `app/ports/**`, when so với `HEAD`, then không có thay đổi nào — story này không thêm action, không thêm trường state, không thêm phương thức cổng
- Given giao diện sau một lần chốt, when nhìn, then mẩu mới nhô lên ở ô trên-cùng-trái và **không một chữ hay chỉ báo nào khác** xuất hiện

## Implementation Notes

**Một lệch có ý thức so với Tasks: `.luoi` KHÔNG nhận `id="luoi"`, và view định vị bằng `.luoi`.**

Hai dòng của spec đá nhau ở đúng chỗ này:

- Tasks nói thêm `id="luoi"` "để theo lệ định vị của view".
- `test/bo-cuc-bon-tang.test.js:70` ghim lưới rỗng bằng regex `/<div class="luoi"\s*>([\s\S]*?)<\/div>/i`, và Boundaries cùng AC#1 cấm sửa file đó **một dòng nào**.

Regex đó đòi `>` ngay sau `class="luoi"`, nên **bất kỳ** thuộc tính thêm vào thẻ — kể cả `id`, kể cả đặt trước `class` — làm `exec` trả `null` và ca đó đỏ. Code Map đã đoán rằng ca này chỉ quét văn bản tĩnh nên render lúc chạy không đụng tới nó; điều đó đúng, nhưng nó bỏ sót rằng chính phép quét văn bản đó khóa luôn hình dạng của thẻ.

Chọn giữ cửa chặn, bỏ `id`: giá trị của `id` ở đây thuần túy là lệ đặt tên (`CHON_LUOI = '.luoi'` định vị cũng chính xác bằng — `.luoi` là duy nhất trong trang), còn giá trị của ca ghim là "không nội dung mẫu nào lọt vào lưới tĩnh". `index.html` vì thế chỉ đổi **chú thích** L111-112. Nếu story sau thật sự cần `id`, nó phải đi cùng một lần renegotiate ca `bo-cuc-bon-tang` — không lén thêm thuộc tính.

**Ghi chú nhỏ:** `locGhiChu` gấp `dieuKien.keyword` bằng `fold()` trước khi so với `textFolded` — keyword trong state là chữ Nam gõ, chưa gấp (`keywordHopLe` ở `state.js` chỉ chuẩn hóa chuỗi rỗng thành `null`). Gấp bằng cách **gọi** `fold.js`, không viết lại, nên `fold-tap-trung` vẫn xanh.

**`sauKhiChot` chạy cả khi chốt hỏng** (`chotGhiChu` không bao giờ bị từ chối). Lượt vẽ đó dựng lại đúng danh sách đang có — vô hại, và nó rẻ hơn một nhánh điều kiện đọc `banner` trong view.

**Luật CSS duy nhất** (vòng review 1): ô lưới mang class `.o-luoi` với đúng `white-space: pre-wrap` + `overflow-wrap: anywhere`. Tên class cố ý không mang từ giấy/thẻ, để Story 2.5 tự đặt tên vật liệu của nó. `.luoi` L323-328 không đổi một ký tự. Vitest ghim rằng khối `.o-luoi` không chứa `color|background|border|radius|shadow|padding`; `npm run thu-bo-cuc` ghim rằng mẩu hai đoạn **cao hơn** mẩu một dòng — phép so đó phải lấy ô ở **hàng khác**, vì grid kéo mọi ô cùng hàng về cùng chiều cao.

## Spec Change Log

- 2026-09-14 (review 1) — `app/style.css` nhận đúng một luật mới `.o-luoi`, theo Boundaries đã renegotiate và bullet "Xuống dòng thắng, bằng đúng một luật CSS".
- 2026-09-14 — Tasks mục `index.html`: bỏ phần "thêm `id="luoi"`", giữ phần cập nhật chú thích. Lý do và phương án thay thế ở Implementation Notes; `app/view/luoi.js` định vị bằng `.luoi`.

## Review Triage Log

Vòng 1 — ba lớp: `blind-hunter`, `edge-case-hunter`, `verification-gap`.

| # | Phát hiện | Verdict | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Ghi chú nhiều dòng hiện ra thành **một dòng liền**: không đâu có `white-space`, mà khối đóng băng vừa đòi "xuống dòng giữ nguyên" vừa cấm thêm luật CSS | high | `app/style.css` là file CSS **duy nhất** và không chứa một khai báo `white-space` nào; mặc định của `div` là `normal`, nên `\n` co thành khoảng trắng. Ca Vitest xanh vì nó chỉ đọc `textContent`, không đo layout. Dòng I/O Matrix "Chữ nhiều dòng → xuống dòng giữ nguyên" và dòng Never "không thêm một luật nào vào `app/style.css`" **cùng nằm trong khối đóng băng** và đá nhau | intent_gap → **người dùng đã giải quyết**, xem "Quyết định của người dùng"; xuống dòng thắng, nới Never cho đúng một luật ngữ nghĩa chữ → hạ xuống `patch`, không revert |
| 2 | `sauKhiChot` không được một ca test nào chạy qua: xóa `sauKhiChot()` khỏi `o-soan.js` thì cả suite vẫn xanh | medium | Lớp verification-gap đã chứng minh: mọi lời gọi `noiOSoan` trong `o-soan.test.js` truyền đúng **hai** đối số, nên móc luôn rơi về no-op; `luoi.test.js` gọi thẳng `v.ve()`; hai regex chỉ soi **văn bản** `main.js`. Đúng nửa vỡ trong im lặng mà chú thích trong mã cảnh báo | patch |
| 3 | Không ca nào chứng minh lưới đọc `store.state.dieuKien`: viết cứng `{keyword:null,date:null}` trong `ve()` vẫn xanh cả suite | medium | Mọi ca `luoi.test.js` chạy với khối điều kiện rỗng; cửa chặn chỉ ghim `store.state`. Story 6 sẽ dựng đường đặt điều kiện lên đúng chỗ này. Kèm theo: `luoi.test.js` dựng `textFolded: text` còn `core-query.test.js` dựng `textFolded: fold(text)` — bản ghi ở tầng view không hợp lệ cho bất kỳ đường keyword nào | patch |
| 4 | Bộ đo xóa `state.notes.slice(0, 3)` — ba mẩu **mới nhất bất kể là gì** — nên nó xóa được ghi chú thật của Nam trong IndexedDB của origin cục bộ; và khối không nằm trong `try/finally` nên một lần ném để lại ba mẩu rác | medium | Đọc thẳng diff: vòng xóa không đối chiếu `id` với ba mẩu vừa tạo, và `nghi(200)` cố định là thứ duy nhất đồng bộ ba lần chốt. README lại quảng cáo "bộ đo không để lại ghi chú nào" | patch |
| 5 | Phép kiểm dọn dẹp so hai quần thể khác nhau: `d.tong` đếm con của `.luoi` (chỉ **hôm nay**, sau lọc) còn `conLai` là `store.state.notes.length` (**toàn kho**) | medium | Cùng gốc với #4. Lần chạy này đạt chỉ vì kho cục bộ tình cờ rỗng ngoài ba mẩu đó; một bản ghi ngày khác là phép kiểm đỏ dù dọn dẹp đúng | patch |
| 6 | Phép đo hình học không chạm được masonry: 1280px cho **đúng 3 cột** (đo được `trai: [136,475,813]`) và bài đo chốt **đúng 3 mẩu**, nên không mẩu nào từng xuống hàng — "hết hàng xuống hàng" chưa bị kiểm | low | Số đo của chính lần chạy xác nhận 3 cột. Bản sửa là nới bài đo lên 5 mẩu và đòi một `dinh` thứ hai với `trai` quay về cột đầu — một phép nới thẳng, không thêm bề mặt | patch |
| 7 | Ca `vẽ LẠI sau khi chốt` lệ thuộc đồng hồ: `nowIso()` gọi hai lần, qua nửa đêm giữa hai lần là mẩu cũ rớt khỏi bộ lọc và ca đỏ vì lý do không liên quan | low | Đọc thẳng diff `luoi.test.js`: `ban(bayGio.slice(0,10), …)` rồi truyền `nowIso` (hàm) vào `noiLuoi`. Sửa là chốt một chuỗi mốc duy nhất cho cả hai — một phép sửa trực tiếp | patch |
| 8 | Chốt trong lúc `khoiDong()` còn đang đọc: `datLai({ notes })` của nó đè mất mẩu vừa chốt | medium | Thật, và **đã được xác nhận lại** ở `state.js:403-418` (thay nguyên mảng, không gộp). Nhưng đây là hành vi sẵn có của `khoiDong` từ Story 1.6, không do thay đổi này gây ra — vòng review 2.3 đã ghi đúng mục này (số 10) và đã hoãn. Story 2.4 chỉ làm nó **nhìn thấy được** | defer |
| 9 | Lưới không có `role="list"`/`listitem` và không vùng `aria-live`, nên "mẩu giấy nhô lên là bằng chứng duy nhất" vô hình với trình đọc màn hình | low | Thật. Nhưng ý định của epic đặt accessibility ở Epic 3 (`3-2-focus-ring-và-thứ-tự-tab`, `3-4-màu-không-phải-tín-hiệu-duy-nhất`); ranh giới này là của epic, không phải do spec vẽ ra | defer |
| 10 | `main.js` chỉ được kiểm bằng regex trên chính văn bản của nó; khối bootstrap không một ca nào chạy | medium | Lớp verification-gap tự xếp `defer`: đóng đúng lỗ này cần một harness DOM cho bootstrap, lớn hơn story; và đây là khuôn sẵn có từ `o-soan.test.js:617`. Mục #2 đã đóng nửa hành vi ở biên view | defer |
| 11 | `note.textFolded` không phải chuỗi → `TypeError` ném vào một `.then` không ai bắt | false | Chỉ tới được từ một bản ghi hỏng trong kho — trạng thái chưa ai chỉ ra đường đi tới. Sập ồn ào ở đó là hành vi đúng theo tiền lệ đã chốt ở vòng review 2.2 (mục 11) | bác bỏ |
| 12 | Giữ phím auto-repeat: lần chốt thứ hai bị chốt chặn `dangChot` chặn nhưng `sauKhiChot` vẫn chạy → một lượt vẽ thừa | low | Thật nhưng vô hại: lượt đó dựng lại đúng danh sách đang có. Bản sửa phải thêm một nhánh đọc `notes.length` vào view — thêm phức tạp cho một khiếm khuyết không ai gặp | bác bỏ |
| 13 | `if (luoi === null \|\| luoi === undefined)` thừa — `querySelector` chỉ trả `Element \| null` | false | Đây là phép chép **có chủ ý** khuôn `noiOSoan` (`o-soan.js:35`), và sự đồng dạng giữa hai view là thứ cửa chặn tầng view dựa vào. Không nêu được tác hại nào | bác bỏ |
| 14 | `document.querySelector('.luoi').replaceChildren()` trong bộ đo ném nếu phần tử thiếu | false | Tới dòng đó thì hơn hai chục phép đo trước đã chạy trên chính trang này; `.luoi` thiếu thì cả file đã đỏ từ lâu | bác bỏ |

## Design Notes

Không có cơ chế subscribe trong dự án này (Story 2.3 cấm rõ), nên lượt vẽ lại phải được nối **tay** ở `main.js` — cùng cách `oSoan.dongBoTuState` đang được treo vào `khoiDongBanNhap()`. Ba điểm cần vẽ lại, đúng ba:

```js
const luoi = noiLuoi(store);
store.khoiDong().then(luoi.ve);          // kho trả lời xong
const oSoan = noiOSoan(store, document, luoi.ve);  // sau mỗi lần chốt
store.khoiDongBanNhap().then(oSoan.dongBoTuState);
```

Đưa `luoi.ve` vào `noiOSoan` như **tham số** chứ không để `o-soan.js` import `luoi.js`: hai view không được biết nhau, chỉ `main.js` biết cả hai — cùng lý do view không được biết adapter.

`locGhiChu` nhận `mocHienTai` là **chuỗi ISO**, không phải hàm và không phải `Date`, để `core/query.js` sạch cả `Date` lẫn hiệu ứng lề; `localDate` vốn chỉ cắt mười ký tự đầu nên `localDate({ createdAt: mocHienTai })` là phép đúng, không phải mẹo.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ suite xanh; diff trong `test/` chỉ thêm `core-query.test.js` và `luoi.test.js`, cộng `o-soan.test.js` nếu chữ ký `noiOSoan` đổi
- `npm run thu-bo-cuc` -- expected: mọi phép đo layout của 2.1/2.2/2.3 vẫn đạt, cộng phép đo hàng ngang mới
- `npm run thu-tay` -- expected: các phép đo bản nháp và tính nguyên tử của `commitDraft` vẫn đạt, không lệch

**Manual checks (if no CLI):**
- Mở trang qua HTTP server, gõ `phở` rồi `Ctrl+Enter`: mẩu hiện ra ở ô trên-cùng-trái, ô soạn thảo trống lại, không một chữ nào khác
- Chốt thêm hai mẩu: mẩu mới nhất luôn ở đầu, hai mẩu cũ dịch sang phải cùng hàng (cửa sổ đủ rộng)
- DevTools → IndexedDB: sửa `createdAt` của một bản ghi sang ngày hôm qua, tải lại: mẩu đó **không** còn trên lưới
- Thu hẹp cửa sổ: lưới rớt 3 → 2 → 1 cột mượt, không breakpoint giật
