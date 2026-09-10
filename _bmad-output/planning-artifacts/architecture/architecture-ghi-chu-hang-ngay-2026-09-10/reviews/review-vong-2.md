# Review vòng 2 — ARCHITECTURE-SPINE.md sau vòng sửa lớn

- **Đối tượng:** `../ARCHITECTURE-SPINE.md` (status: final, 2026-09-10, AD-1…AD-21)
- **Đối chiếu:** `review-rubric.md`, `review-doi-khang.md`, `review-doi-chieu.md`, `review-xac-minh.md`
- **Ngày:** 2026-09-10
- **Quy ước mức:** **CHÍ MẠNG** (mất/hỏng dữ liệu, không phát hiện được) · **NẶNG** (hai module không
  ghép, hoặc một Rule không code được) · **TRUNG BÌNH** (lệch hành vi, sửa cục bộ) · **NHẸ**

---

## 0. Verdict

Vòng sửa này là một bước tiến thật: 9 findings từng được xếp CHÍ MẠNG/NẶNG ở vòng trước nay đã bị bịt
kín và bịt đúng cách (AD-4 `localStamp`, AD-13 hình dạng bản ghi, AD-11 hai pha + một transaction,
AD-14 trần ở ba cửa, AD-15 mô hình điều kiện, AD-16 im lặng, AD-9 nói thật về origin, AD-10 ngưỡng
kép, Vitest 5). Nhưng **cơ chế mới được thêm để bịt lỗ cũ lại mở ra một lỗ cùng loại**: "nhận nuôi bản
nháp mồ côi" của AD-3/AD-7 không có cách nào biết một tab còn sống hay đã đóng, và không có phép toán
nguyên tử nào trên `localStorage` — nên nó **tái tạo đúng kiểu hỏng FR-20 cấm** mà AD-7 tuyên bố nó
ngăn, chỉ khác đường đi. Cộng thêm AD-21 chứa một Rule **không thể code được như viết** (ES modules
tĩnh + không build + `?v=` bơm từ một hằng trong `index.html`), và cụm dải băng (AD-16/AD-17/AD-18/
AD-21) tự mâu thuẫn ba tầng.

Kết luận thao tác được: **chưa mở sprint planning được**, nhưng khối lượng còn lại nhỏ hơn hẳn vòng
trước — 2 lỗ CHÍ MẠNG và 3 lỗ NẶNG, tất cả đều nằm trong 4 AD (AD-3/AD-7, AD-8, AD-21, cụm dải băng),
và đều sửa được bằng vài đoạn văn chứ không phải viết lại.

---

## Phần 1 — Các lỗ vòng trước: đã bịt / còn hở / bị bỏ qua

### 1.1 ĐÃ BỊT — và bịt đúng cách

| Vòng trước | Mức cũ | Bịt bằng | Đánh giá |
|---|---|---|---|
| rubric G-1 · nhịp/chủ thể tự lưu bỏ trống | CRITICAL | AD-8 luồng 2 + `AUTOSAVE_MS = 400` trong AD-14 | **Kín.** Một hằng số, một chỗ, dùng chung cho draft và sửa |
| rubric F-2 / doi-khang G-3 (nửa "hai chủ sở hữu") · AD-8 ↔ AD-1 trong luồng gõ | CRITICAL | AD-8 tách minh nhiên hai luồng: đổi-sự-tồn-tại (ghi trước) vs tự-lưu (state trước) | **Kín.** Đây là bản sửa tốt nhất của vòng này |
| rubric G-2 / doi-chieu R-10 · mô hình điều kiện FR-14 | HIGH | AD-15 nguyên vẹn: hình dạng `{keyword, date}`, "hôm nay = vắng mặt điều kiện", đúng hai action, `chotGhiChu` gọi `xoaHetDieuKien()` | **Kín, xuất sắc** |
| rubric D-1 · cache / mã lệch phiên bản / rollback | HIGH | AD-21 + dòng rollback ở §Structural Seed | **Hở lại theo cách khác** — xem V-3 |
| doi-khang G-1 · schema bản tin | Chí mạng | AD-7 chốt `{v, type, from}` | **Gần kín** — xem V-5 (AD-21 tự phá schema này) |
| doi-khang G-2 · sắp xếp `createdAt` có offset | Chí mạng | AD-4 `localStamp`/`localDate`, cấm `new Date()`, cấm so sánh trên `createdAt` | **Kín, mẫu mực.** Còn thiếu tie-break — xem V-9 |
| doi-khang G-7 / doi-chieu · hình dạng bản ghi trong kho | Nặng | AD-13 năm trường, đánh dấu dẫn xuất, luật chỉ-nới-ra | **Kín** |
| doi-khang G-8 · gộp theo RAM hay đĩa, gộp có nguyên tử không | Nặng | AD-11 hai pha + "MỘT transaction duy nhất"; AD-6 thêm câu "RAM không bao giờ là nguồn sự thật cho thao tác ghi" | **Kín về ngữ nghĩa** (còn một mâu thuẫn câu chữ trong AD-6 — V-10) |
| doi-khang G-4 / rubric F-4 · AD-3 "ba key" ↔ AD-10 | Nặng | AD-3 nay bốn hình dạng key, có `ghichu.persistDenied` | **Kín** |
| doi-khang G-5 / rubric · hai chủ sở hữu dải băng + cạnh `adapters→view` | Nặng | AD-17 (một chủ, thang ưu tiên); sơ đồ nói thẳng "không có cạnh adapters→view"; Capability Map sửa thành `adapters/quota.js + action` | **Kín ở phần quyền sở hữu**, hở ở phần phân loại — xem V-4 |
| doi-khang G-11 / doi-chieu R-2, R-3 · trần áp ở đâu | TB | AD-14: ba cửa vào, `{items, total}`, cấm view đếm `items.length` | **Kín, rất tốt** |
| doi-chieu R-1 · không có AD nào cấm phản hồi khi thành công | NẶNG | AD-16, kèm chữ ký `{added, skipped}` trong AD-11 | **Kín** |
| doi-chieu R-4 · state phù du không có nhà (A-3, A-6) | NẶNG | AD-3 tầng C + câu "không một mẩu state tầng C nào được ghi xuống kho bền" | **Kín** |
| doi-chieu R-5 · sàn accessibility rơi trọn | Vừa-Nặng | AD-20 (cấm `outline:none`, focus trap, focus mặc định `hủy`, trả focus, nhãn cho điều khiển ký hiệu) + dòng trong Capability Map | **Kín ở 3/6 mục** — xem V-13 |
| doi-chieu R-6 · tab title `[OVERRIDE-2]` | Vừa | AD-19: số của **hôm nay**, không phụ thuộc điều kiện | **Kín, và bắt đúng cái bẫy** |
| doi-chieu R-7 · cơ chế theme | Vừa | AD-19 script đồng bộ nội tuyến trong `<head>` | **Kín cho lần tải đầu**, hở cho đồng bộ runtime — xem V-6 |
| doi-chieu R-9 / rubric G-4 · FR-5 ghi chú rỗng | Vừa | Có một dòng trong Capability Map | **Nửa** — xem V-7 |
| xac-minh F-1 · Vitest 3.x | Nặng | Stack ghi `Vitest 5.0.0` | **Kín** |
| xac-minh F-2 · ngưỡng 0.80 là mã chết | Nặng | AD-10 ngưỡng **kép** (`≥0.80` **hoặc** còn `<50 MB`), kèm giải thích vì sao cần cả hai | **Kín, và giải thích đúng** |
| xac-minh F-5 · AD-9 tuyên bố bảo mật sai | Nặng | AD-9 viết lại trung thực: tiền tố chỉ ngăn **va chạm tên**; thêm mục Deferred | **Kín. Đây là bản sửa trung thực nhất tài liệu** |
| xac-minh F-3 · `estimate()` là ước lượng | TB | AD-10 nói thẳng "ước lượng có đệm chống fingerprinting… không bao giờ dùng để quyết định có ghi hay không" | **Kín** |
| xac-minh F-4 · `persist()` gọi một lần | TB | AD-10: gọi **mỗi lần khởi động cho tới khi trả `true`**, kèm lý do engagement | **Kín** |
| xac-minh F-6 · secure context | TB | AD-12: cấm `file://`, dev qua `localhost`, nêu rõ `crypto.randomUUID` | **Kín** |
| xac-minh F-8 · `QuotaExceededError` từ localStorage | Nhỏ | AD-18: `QUOTA` nguồn "adapter IndexedDB / **localStorage**" | **Kín** |
| rubric D-3 · chiến lược kiểm `adapters/` | TB | Conventions §Test: danh sách thử tay trong README, kèm lý do | **Kín** |

### 1.2 CÒN HỞ — đã báo, sửa chưa tới

| # | Vòng trước | Trạng thái sau sửa |
|---|---|---|
| V-2 | doi-khang **G-3(b)** · debounce đua với lúc chốt | **Còn hở, và nặng hơn trước.** AD-8 chốt được nhịp 400 ms nhưng **không có một chữ nào** về việc hủy hẹn đang treo khi `chotGhiChu` chạy, và không có `seq`. Xem V-2 |
| V-4 | doi-chieu **M-4** · lỗi inline ô ngày | Đã có (AD-17 nói rõ lỗi ngày không đi qua dải băng) — **kín**. Nhưng phân loại dải băng lại hỏng chỗ khác. Xem V-4 |
| V-8 | doi-khang **G-6** · sửa/xóa chéo tab hồi sinh ghi chú đã xóa | **Còn hở nguyên.** AD-18 vẫn không có `GONE`; AD-6 nói "đọc rồi ghi trên IndexedDB" nhưng không nói ghi phải **có điều kiện `id` còn tồn tại**; `put()` upsert vẫn hồi sinh được |
| V-9 | doi-khang **G-9** (nửa sau) · tính khoảng cách 7 ngày, và so sánh `lastBackupAt` | **Còn hở.** AD-11 vẫn viết "nếu nó mới hơn giá trị đang có" mà không nói so bằng gì; AD-4 cấm `new Date()` nên phép trừ ngày cho FR-17 không còn API hợp lệ nào được cho phép |
| V-11 | doi-chieu **R-12** · ai ghi `lastBackupAt` lúc **xuất** | **Bị bỏ qua.** AD-11 vẫn chỉ nói đường **nạp**. UJ-3 bước 1 chết sau lần sao lưu đầu |
| V-12 | doi-chieu **R-8** · `fold()` phải bảo toàn chỉ số (tô từ khóa) | **Bị bỏ qua.** AD-5 không có bất biến `fold(t).length === t.length` |
| V-12 | doi-khang **G-10** · `fold` chưa đóng (khoảng trắng/dấu câu), không có `foldVersion` | **Còn hở.** AD-5 liệt kê 4 bước nhưng không nói "và không gì khác"; không có bộ ca vàng, không có luật rebuild |
| V-13 | doi-chieu **R-5** (3/6 mục còn lại) | AD-20 nhận 3 mục; **tương phản 4.5:1, zoom 200%, `prefers-reduced-motion`, không-dùng-màu-làm-tín-hiệu-duy-nhất** vẫn không ai nhận |
| V-14 | doi-chieu **R-13** · cấm mọi request mạng sau khi tải | **Bị bỏ qua.** AD-12 vẫn chỉ cấm "thư viện chạy lúc runtime"; một webfont Google Fonts không bị chặn bởi bất kỳ chữ nào trong spine |
| V-15 | doi-chieu **R-14** · `COLLAPSED_LINES = 3` trong JS nhưng thực thi bằng CSS | **Bị bỏ qua.** Vẫn nằm trong `limits.js`, không có luật cầu nối JS↔CSS |
| V-16 | doi-chieu **R-15** · cấm `column-count`/masonry | **Bị bỏ qua** |
| V-17 | rubric **D-2** / doi-chieu A-10 · spine đóng OQ-2 (trình duyệt) mà không ghi nhận | **Bị bỏ qua.** Stack vẫn chốt Chromium không kèm một dòng "đây là giả định, phát hiện sai bằng cách X" |
| V-18 | rubric §4 / doi-chieu M-3 · phép tính ngân sách 2.000 × 20.000 (OQ-3 nửa sau) | **Bị bỏ qua** |
| V-19 | doi-chieu **M-3** · microcopy "còn khoảng 10%" ↔ ngưỡng 0.80 | **Bị bỏ qua**, và **tệ hơn**: AD-10 nay có ngưỡng thứ hai (`< 50 MB`) mà EXPERIENCE.md không có microcopy nào tương ứng |
| V-20 | doi-chieu **M-2** · xóa dải băng loại 2 ở 5 chỗ trong EXPERIENCE/DESIGN | **Bị bỏ qua** (là việc tài liệu downstream, nhưng chưa ai làm và spine không ghi nhận nợ này) |
| V-21 | doi-khang **G-12** · xóa cứng vs hồi sinh khi nạp file cũ | **Bị bỏ qua.** AD-11 vẫn "không bao giờ xóa" mà không nói hệ quả người dùng nhìn thấy |
| V-22 | doi-khang **G-7** (nửa sau) · chính sách **trường thừa** khi nạp file | **Nửa.** AD-13 bắt "module đọc bản ghi phải chịu được trường lạ" — nhưng đó là bản ghi trong **kho**; AD-11 pha 1 vẫn không nói file có trường thừa thì từ chối hay bỏ qua |
| V-23 | doi-chieu · FR-1 (con trỏ sẵn sàng), FR-4 (hợp đồng bàn phím), NFR-1 ≤2s | **Bị bỏ qua.** Không AD nào; AD-6 nạp toàn bộ RAM lúc khởi động vẫn là rủi ro trực tiếp cho NFR-1 mà không có AD nào bảo vệ đường tới ký tự đầu tiên |
| V-24 | xac-minh **F-9** · viết rõ regex `/\p{M}/gu` | **Bị bỏ qua** (AD-5 vẫn viết `\p{M}` không kèm cờ) |
| V-25 | xac-minh **F-7** · eviction xóa **cả origin** một lượt | **Bị bỏ qua.** AD-3 vẫn có thể bị đọc như "localStorage bền hơn"; không dòng nào nói tầng B/B′ chết cùng tầng A |

---

## Phần 2 — Tấn công phần MỚI THÊM

### V-1 · AD-3 + AD-7 · "Nhận nuôi bản nháp mồ côi" không có cách nào biết mồ côi, và không nguyên tử — **CHÍ MẠNG**

Rule nguyên văn (AD-7): *"mỗi tab có `tabId` sinh lúc tải trang và giữ trong `sessionStorage`. Lúc khởi
động, nếu không có bản nháp của chính `tabId` này, tab **nhận nuôi** bản nháp mồ côi mới nhất (của một
tab đã đóng) rồi xóa key cũ đi."*

Bốn kiểu hỏng, không cái nào cần người dùng cố tình:

**(a) Không có định nghĩa vận hành của "mồ côi" — nên nó ăn cả bản nháp của tab đang sống.**
`tabId` nằm trong `sessionStorage`, mà `sessionStorage` **riêng từng tab**. Tab B **không có cách nào**
đọc được tập `tabId` đang sống. Vậy `ghichu.draft.<X>` là của một tab đã đóng hay của tab A đang gõ dở
ngay lúc này — không phân biệt được. Kịch bản:

1. Tab A mở từ sáng, Nam đang gõ dở "biên bản họp 3h" → `ghichu.draft.A` tồn tại.
2. Nam mở tab B (một tab mới, chuyện PRD nói là bình thường).
3. Tab B không có `ghichu.draft.B` → theo AD-7 nó **nhận nuôi** `ghichu.draft.A` **rồi xóa key**.
4. Tab A gõ tiếp → autosave 400 ms sau ghi lại `ghichu.draft.A`. Nhưng nội dung đang gõ dở giờ **cũng
   nằm ở tab B**, trong ô soạn thảo của B.
5. Nam chốt ở A, rồi chốt ở B → **hai ghi chú trùng nội dung, khác `id`**. AD-11 gộp theo `id` nên
   không bao giờ dọn được. Và nếu Nam đóng A trước khi gõ tiếp, chữ giữa bước 3 và bước 4 là chữ **đã
   bị tab B nhặt mất**.

Đây chính xác là dòng FR-20 mà AD-7 tự tuyên bố mình bảo vệ: *"Bản nháp ở tab này không bị tab kia xóa
mất."* Vòng trước lỗ này đi qua đường broadcast; vòng này nó đi qua đường nhận nuôi. **Cùng một lỗ,
cửa khác.**

**(b) Hai tab khởi động cùng lúc → nhận nuôi kép.** Đây là câu hỏi được đặt ra, và câu trả lời là: có
race, và `localStorage` không có công cụ nào để tránh. Khôi phục phiên của trình duyệt (Ctrl+Shift+T,
"mở lại các tab lần trước", hoặc một cửa sổ có hai tab được pin) mở **nhiều tab cùng lúc**. Cả hai:
`getItem` danh sách key → thấy cùng một `ghichu.draft.X` → cả hai đổ vào ô soạn của mình → cả hai
`removeItem`. `localStorage` **không có compare-and-swap, không có transaction, không có lock**;
`removeItem` của tab thứ hai chỉ là no-op, không báo gì. Kết quả: **bản nháp bị nhân đôi**, và
kết cục vẫn là hai ghi chú trùng khi Nam chốt ở cả hai tab. Không AD nào bị vi phạm.

**(c) "Mới nhất" không có dữ liệu để tính.** AD-7 nói nhận nuôi bản nháp mồ côi **mới nhất**. AD-3
không định nghĩa **hình dạng giá trị** của key `ghichu.draft.<tabId>` — AD-13 định nghĩa bản ghi ghi
chú, không định nghĩa bản nháp. Nếu giá trị là chuỗi thuần thì **không có mốc thời gian nào để so
"mới nhất"**, và thứ tự key trong `localStorage` không được bảo đảm. Dev A sẽ thêm `{text, at}`,
dev B lưu chuỗi trần rồi lấy key đầu tiên. Hai hành vi khác nhau, cả hai đúng chữ.

**(d) Key mồ côi tích tụ vô hạn.** Nhận nuôi chỉ xảy ra khi tab **không có** bản nháp của chính nó, và
chỉ nuốt **một** key. Mọi trường hợp khác (đóng tab khi có bản nháp, trong lúc tab kia cũng đang có
bản nháp) để lại key vĩnh viễn. Không có dọn dẹp, không có TTL. Với trần 20.000 ký tự ≈ 40 KB UTF-16
và `localStorage` ~5 MiB, khoảng **125 tab đã đóng** là đủ để mọi phép ghi bản nháp ném
`QuotaExceededError` — tức dải băng ưu tiên 1 của AD-17 (**không đóng được**) bật vĩnh viễn trên một
app hoàn toàn khỏe mạnh.

**Bịt:** (1) mỗi tab đang sống ghi một heartbeat `ghichu.alive.<tabId>` (mốc thời gian, làm mới theo
nhịp `AUTOSAVE_MS`), và chỉ key nào không có heartbeat trong > N giây mới được coi là mồ côi — hoặc
đơn giản hơn và an toàn hơn: **hỏi qua BroadcastChannel** (`type: 'claim-draft'`, tab nào còn sống thì
trả lời "của tôi") trước khi nhận nuôi; (2) nhận nuôi phải là **đọc-rồi-xóa-rồi-mới-hiển thị**, và
nếu `removeItem` chạy trên một key đã biến mất giữa chừng thì **hủy nhận nuôi** (đọc lại để xác nhận
mình là người xóa); (3) chốt hình dạng giá trị bản nháp trong AD-3 (`{ v:1, text, at }`); (4) một luật
dọn: xóa mọi `ghichu.draft.*` không có heartbeat và cũ hơn K ngày, chạy lúc khởi động. Cả bốn đều
thuộc spine, không thuộc story.

### V-2 · AD-8 · Hẹn debounce treo qua lúc chốt — bản nháp ma, nay được nhận nuôi — **CHÍ MẠNG**

Đã báo ở `review-doi-khang.md` G-3(b) và **không được sửa**. AD-8 nay chốt được `AUTOSAVE_MS = 400` —
tức là **chính thức hóa** một cửa sổ 400 ms trong đó một phép ghi cũ đang treo:

1. ms 0: Nam gõ → hẹn ghi `ghichu.draft.A = "họp 3h"`.
2. ms 200: Nam bấm `Ctrl+Enter`. `chotGhiChu` theo AD-8 luồng 1: ghi IndexedDB → đổi state → (dọn
   draft) → phát `notes-changed`.
3. ms 400: hẹn cũ nổ, ghi lại `ghichu.draft.A = "họp 3h"`. **Bản nháp ma.**
4. Lần tải trang sau, tab mới không có draft của `tabId` mình → **nhận nuôi bản nháp ma** (V-1) → ô
   soạn thảo hiện lại y hệt ghi chú vừa chốt → Nam chốt lần nữa → **trùng lặp, khác `id`**.

Vòng trước lỗi này dừng ở "bản nháp ma". Vòng này AD-7 thêm cơ chế nhận nuôi, biến nó thành **đường
sinh ghi chú trùng lặp có hệ thống**. AD-8 cũng không nói gì về việc `chotGhiChu` phải dọn draft —
"dọn draft" thậm chí không xuất hiện trong Rule của AD-8, chỉ suy ra được từ AD-3.

**Bịt:** AD-8 phải nói nguyên văn: (a) mọi action luồng 1 **hủy mọi hẹn tự lưu đang treo trước khi
chạm kho**; (b) mỗi phép ghi tự lưu mang một `seq` tăng dần, adapter chỉ ghi nếu `seq` còn là mới
nhất; (c) thứ tự bắt buộc của `chotGhiChu` là **ghi IndexedDB → đổi state → xóa draft (best-effort,
thất bại không rollback) → phát tin**, và nói rõ đây là thao tác **hai kho, không nguyên tử**, kèm
luật khởi động: draft trùng khít `text` của ghi chú mới nhất trong N giây thì bỏ.

### V-3 · AD-21 · `?v=<APP_VERSION>` không code được như viết, và bảo vệ ít hơn nó hứa — **NẶNG**

Rule: *"`index.html` mang một hằng `APP_VERSION` và nạp mọi module với hậu tố `?v=<APP_VERSION>` —
không có bước build nên số này **bump bằng tay ở đúng một chỗ**."*

**(a) "Đúng một chỗ" là sai về mặt cơ học.** `index.html` chỉ nạp **một** module (`app/main.js`). Mọi
module còn lại được nạp bởi `import` **tĩnh** bên trong các file `.js` — và một câu `import` tĩnh
**không đọc được** một hằng số khai báo trong `index.html`. Để mọi module mang `?v=`, hoặc (i) phải
sửa **mọi câu import trong mọi file** ở mỗi lần deploy (trái ngược hẳn "đúng một chỗ", và đúng loại
việc tay chắc chắn sẽ bị làm sót), hoặc (ii) phải dùng `<script type="importmap">` — một cơ chế spine
không nhắc tới một chữ, hoặc (iii) phải chuyển sang `import()` động toàn bộ, phá luôn tính tĩnh mà
AD-2 dựa vào để grep hướng phụ thuộc. Đây là một Rule **không thi hành được như viết**: hai dev sẽ
chọn hai lối khác nhau và chỉ một lối thực sự chống được cache lệch phiên bản — đúng kiểu hỏng im lặng
mà AD-21 tồn tại để ngăn.

**(b) Chính `index.html` và `style.css` không được version.** `?v=` bảo vệ các module, nhưng
`index.html` là thứ **mang** `APP_VERSION` và nó không tự bust cache được. GitHub Pages phục vụ qua
CDN có cache riêng. Nếu trình duyệt còn `index.html` cũ, `APP_VERSION` cũ, và toàn bộ `?v=` trỏ về mã
cũ — **cơ chế tự vô hiệu hóa đúng lúc cần nhất**. `style.css` cũng không có `?v=` trong Structural
Seed, nên một thay đổi token màu có thể ghép mã mới với CSS cũ.

**(c) Tab cũ vẫn được phép ghi.** AD-21 nói tab nhận thấy `appVersion` lạ thì *"không nạp lại dữ liệu
mà hiện dải băng đề nghị tải lại trang"*. Nhưng **không cấm nó ghi**. Với AD-8 luồng 2 (state đổi
trước, ghi sau), tab cũ đang mở một ghi chú ở chế độ sửa vẫn autosave đè nội dung của nó — dựng từ RAM
đã lỗi thời — lên bản ghi mà tab mới vừa sửa. Câu kết của AD-21 (*"điều tệ nhất một tab cũ gây ra là
hiển thị thiếu trường mới"*) **không đúng**: nó còn có thể ghi đè nội dung. AD-13 chỉ bảo vệ *hình
dạng* bản ghi, không bảo vệ *nội dung*.

**(d) Phát hiện chỉ một chiều.** Tab cũ chỉ biết mình cũ khi **tab mới ghi một cái gì đó**. Nam mở tab
mới chỉ để đọc thì tab cũ không bao giờ nhận được tin, và chạy sai lặng lẽ cả ngày.

**Bịt:** chốt cơ chế cụ thể (khuyến nghị: `<script type="importmap">` sinh tay trong `index.html`, một
chỗ thật, cộng `?v=` cho `style.css`); ghi luật cache header/`Cache-Control` cho `index.html` hoặc
chấp nhận và ghi rõ giới hạn CDN; và bổ sung: tab phát hiện lệch phiên bản **chuyển sang chỉ-đọc**
(cấm mọi phép ghi) chứ không chỉ hiện dải băng.

### V-4 · Cụm dải băng tự mâu thuẫn ba tầng: AD-16 ↔ AD-17 ↔ AD-18 ↔ AD-21 — **NẶNG**

Bốn AD mới cùng nói về dải băng và **không khớp nhau**:

1. **AD-16:** *"Dải băng chỉ có **hai** nguồn hợp lệ: một lỗi, hoặc kết quả của một lần nạp file."*
2. **AD-17:** liệt kê **bốn** loại, trong đó **(4) cảnh báo trước ngưỡng dung lượng** không phải lỗi
   (AD-10 nói rõ `estimate()` không quyết định gì) và không phải kết quả nạp file. → **Loại 4 là một
   nguồn thứ ba mà AD-16 cấm.**
3. **AD-21:** thêm **dải băng đề nghị tải lại trang** — nguồn thứ tư, không nằm trong thang ưu tiên
   của AD-17 và không có mã lỗi trong AD-18. Nó đứng ở đâu so với "lỗi ghi vì hết dung lượng"? Không
   ai biết. Với AD-17 (*"thông báo ưu tiên thấp hơn không được thay thông báo đang hiện"*) thì một dải
   băng không có hạng là một dải băng **không code được**.
4. **AD-18 dùng hệ đánh số khác AD-17.** AD-18 ánh xạ `TOO_LONG → "dải băng loại 4"` và
   `BAD_FILE → "dải băng loại 3"` — đây là số hiệu **microcopy của EXPERIENCE.md**. AD-17 lại dùng
   `(1)…(4)` là **thứ tự ưu tiên của chính nó**, trong đó (4) = cảnh báo dung lượng và (3) = kết quả
   nạp **thành công**. Ghép hai bảng: một dev đọc AD-18 thấy `TOO_LONG → loại 4`, tra AD-17 thấy
   "(4) cảnh báo trước ngưỡng dung lượng" → **vượt trần ký tự hiện ra microcopy cảnh báo dung lượng**,
   còn `BAD_FILE → loại 3` → **lỗi nạp file hiện microcopy "đã nạp N ghi chú"**. Hai con số cùng tên,
   hai nghĩa, trong hai AD cạnh nhau. Đây không phải suy diễn — nó là cách đọc tự nhiên nhất.

Thêm: AD-18 tuyên bố tập mã lỗi là **đóng** (5 mã) nhưng còn thiếu ít nhất ba trường hợp thật:
IndexedDB **không mở được lúc khởi động** (đã báo ở vòng trước, chưa bịt — lúc đó chưa có state để đặt
dải băng), lệch phiên bản (V-3), và `GONE` (V-8).

**Bịt:** một hệ số hiệu duy nhất cho dải băng, dùng chung AD-16/AD-17/AD-18/EXPERIENCE.md; AD-16 sửa
thành "ba nguồn: lỗi, kết quả nạp, cảnh báo hệ thống"; AD-21 xếp hạng dải băng reload vào thang AD-17;
AD-18 thêm `DB_UNAVAILABLE`, `VERSION_SKEW`, `GONE`.

### V-5 · AD-7 khai báo hình dạng bản tin là ĐÓNG, rồi AD-21 và sơ đồ tự thêm trường — **TRUNG BÌNH**

AD-7 viết nguyên văn *"đúng một hình dạng bản tin"* rồi in ra `{ v: 1, type, from }` và chốt
*"Không có loại tin nào khác"*. AD-21 viết *"Bản tin BroadcastChannel mang thêm `appVersion`"*, và
sơ đồ sequence ở §Structural Seed vẽ `{v:1, type:'notes-changed', from:tabId, appVersion}`. Ba chỗ,
hai schema. Dev viết `adapters/broadcast.js` theo AD-7 (nguồn được đánh dấu là hợp đồng) sẽ **không
gửi `appVersion`**, và toàn bộ AD-21 im lặng không hoạt động — hỏng đúng kiểu AD-21 sinh ra để chống.

Kèm hai lỗ nhỏ cùng chỗ:
- **`v` không có luật xử lý.** Trường `v: 1` có mặt nhưng không AD nào nói tab nhận phải làm gì với
  `v` lạ (bỏ qua? báo lệch phiên bản?). Và `v` (schema bản tin) với `appVersion` (phiên bản mã) là hai
  khái niệm phiên bản chồng nhau, không ai nói cái nào thắng.
- **`from` không đủ tin cậy để chống dội.** `tabId` sống trong `sessionStorage`, mà `sessionStorage`
  **được sao chép nguyên vẹn khi nhân bản tab** (Duplicate tab / khôi phục phiên trên Chromium). Hai
  tab sống **cùng một `tabId`** là chuyện có thật. Hậu quả kép: (a) AD-7 bắt "bỏ qua tin có `from`
  bằng `tabId` của chính nó" → hai tab **im lặng không đồng bộ ghi chú cho nhau**, đúng kiểu hỏng AD-7
  liệt kê ở Prevents(a); (b) AD-3 tầng B: hai tab cùng ghi `ghichu.draft.<cùng tabId>` → **đè bản nháp
  của nhau**, đúng kiểu hỏng FR-20 cấm. `tabId` phải được sinh sao cho nhân bản tab không sao chép
  được (ví dụ: sinh mới nếu phát hiện `tabId` này đang được tab khác dùng, qua chính BroadcastChannel).

### V-6 · AD-19 (theme đọc một lần trong `<head>`) ↔ AD-3/AD-7 (theme đồng bộ đa tab) — **TRUNG BÌNH**

AD-3 xếp theme vào tầng B′ với cột "Đồng bộ đa tab: **Có** (AD-7)", và AD-7 nói `session-changed` phát
khi theme đổi. Nhưng AD-19 mô tả **cơ chế đọc theme duy nhất** là một script đồng bộ nội tuyến chạy
**một lần, trước lần vẽ đầu tiên**, và nói rõ đây là *"ngoại lệ duy nhất của AD-2 được phép"*, phải
nằm ngoài `app/`. Vậy khi tab A đổi theme, tab B nhận `session-changed` — **không có đường hợp lệ nào
để đặt lại thuộc tính trên `<html>`**: `view/` bị AD-1 giới hạn ở "lượt render", `<html>` nằm ngoài
gốc render của app, và ngoại lệ AD-19 đã hết hiệu lực sau lần vẽ đầu. Đây đúng là lỗ G-13 của vòng
trước, tái xuất ở dạng mới. Cần: một port `documentTheme` (hoặc một câu trong AD-19 nói thuộc tính
theme trên `<html>` là một phần của lượt render, và ai được ghi).

### V-7 · FR-5 vào Capability Map nhưng không có luồng — **TRUNG BÌNH**

`F1 · Ghi chú rỗng biến mất (FR-5) | action suaGhiChu | AD-8, AD-16`. Nhưng AD-8 chia đôi thế giới:
`suaGhiChu` là **luồng 2** (state trước, ghi sau), còn *xóa* là **luồng 1** (ghi trước, state sau). Một
ghi chú bị gõ rỗng rồi rời khỏi nó **là một phép xóa** — nó thuộc luồng nào? Nếu đi luồng 2 thì mẩu
giấy biến mất khỏi màn hình **trước khi** đĩa xác nhận, và nếu phép xóa hỏng, mẩu giấy đã mất trên
màn hình mà vẫn còn trên đĩa — chính xác là kiểu "giả vờ" AD-8 tồn tại để cấm. Thêm: "rời khỏi nó" là
sự kiện gì (blur? Tab? click ngoài?) vẫn không được chốt ở đâu, và trong một sản phẩm không có hoàn
tác, đây là **con đường mất dữ liệu duy nhất không có phanh**.

### V-8 · Sửa/xóa chéo tab vẫn hồi sinh được ghi chú đã xóa — **TRUNG BÌNH** *(đã báo, chưa bịt)*

AD-6 nay bắt mọi phép ghi "đọc và ghi trên IndexedDB rồi mới nạp lại RAM" — tiến bộ, nhưng **không
nói phép ghi phải có điều kiện**. Tab 1 xóa ghi chú `X`; tab 2 đang mở `X` ở chế độ sửa, autosave 400
ms sau gọi `put()` (upsert — mặc định tự nhiên của IndexedDB) → `X` **sống lại**. AD-18 không có mã
`GONE`, EXPERIENCE.md không có microcopy, và không AD nào nói hộp thoại/chế độ sửa trỏ vào một `id`
không còn tồn tại phải làm gì. Cần: mọi ghi sửa phải kiểm `id` tồn tại **trong cùng transaction**, và
mã `GONE`.

### V-9 · AD-4 cấm hết mọi API tính khoảng cách ngày mà FR-17 cần — **TRUNG BÌNH**

AD-4: *"**cấm** `new Date(createdAt)` cho bất kỳ mục đích hiển thị, sắp xếp hay lọc nào"* — và toàn bộ
so sánh là so sánh chuỗi. Nhưng FR-17 cần *"đã N ngày kể từ lần sao lưu"* với `BACKUP_NUDGE_DAYS = 7`
(hoặc 3): đó là một phép **trừ ngày lịch**, không phải so sánh. So chuỗi `yyyy-MM-dd` cho biết
trước/sau, không cho biết **cách nhau bao nhiêu ngày**. Không AD nào nói cách tính, và AD-11 vẫn viết
`lastBackupAt` được ghi *"nếu nó mới hơn giá trị đang có"* mà không nói so bằng gì — với `exportedAt`
**có offset** (AD-11) thì so chuỗi cho kết quả sai đúng như `review-doi-khang.md` G-9 đã chỉ.

Phụ: AD-4 chốt `localStamp` là **khóa sắp xếp duy nhất** nhưng không có tie-break. Hai ghi chú chốt
trong cùng một giây (rất dễ: Ctrl+Enter liên tiếp) có `localStamp` bằng nhau → thứ tự do
`Array.prototype.sort` quyết định, và nó ổn định theo **thứ tự mảng đầu vào**, mà thứ tự đó lại đến từ
IndexedDB cursor sau mỗi lần nạp lại. Lưới có thể tráo chỗ hai mẩu sau một F5. Cần tie-break bằng `id`.

### V-10 · AD-6 tự mâu thuẫn trong chính một đoạn — **NHẸ**

*"Đọc IndexedDB chỉ xảy ra ở đúng **hai** chỗ: lúc khởi động, và khi nhận tin BroadcastChannel"* — rồi
ngay câu sau: *"mọi phép ghi, kể cả gộp file nạp, **đọc** và ghi trên IndexedDB"*, và AD-11 pha 2 đọc
`id` trong transaction. Thực tế là bốn chỗ. Câu "đúng hai chỗ" là câu một reviewer sẽ dùng để bắt bỏ
phép đọc trong transaction của AD-11 — tức là phá đúng bản sửa quan trọng nhất của vòng này. Sửa câu
chữ thành "đọc **cho đường hiển thị** chỉ xảy ra ở hai chỗ; đọc bên trong transaction ghi là chỗ thứ
ba, bắt buộc".

### V-11 · AD-13 "đúng năm trường, không hơn" ↔ "chịu được trường lạ" — **NHẸ**

AD-13 mở đầu bằng *"có **đúng năm trường, không hơn**"* rồi kết bằng *"chỉ được thêm trường mới…"* và
*"mọi module đọc bản ghi phải chịu được trường lạ"*. Hai câu đầu và cuối cùng nói ngược nhau về việc
validate lúc **ghi**: dev A viết validator từ chối bản ghi có trường thứ sáu (đúng câu đầu), dev B ghi
kèm trường mới (đúng câu cuối). Cần một câu phân biệt: **ghi** đúng năm trường; **đọc** khoan dung.

---

## Phần 3 — Bảng tổng hợp vòng 2

| # | Mức | Finding | AD |
|---|---|---|---|
| V-1 | **CHÍ MẠNG** | Nhận nuôi bản nháp mồ côi: không có cách xác định "mồ côi" (ăn cả draft của tab đang sống → phá FR-20), race khi hai tab khởi động cùng lúc, "mới nhất" không có dữ liệu để tính, key tích tụ tới đầy `localStorage` | AD-3, AD-7 |
| V-2 | **CHÍ MẠNG** | Hẹn debounce treo qua lúc chốt sinh bản nháp ma; nay bị nhận nuôi → ghi chú trùng lặp có hệ thống. Không có luật hủy hẹn/`seq`, không có thứ tự dọn draft | AD-8, AD-7 |
| V-3 | **NẶNG** | `?v=<APP_VERSION>` không code được với import tĩnh + không build; `index.html`/`style.css` không được bust; tab cũ vẫn được phép **ghi**; phát hiện chỉ một chiều | AD-21 |
| V-4 | **NẶNG** | Dải băng mâu thuẫn bốn tầng: AD-16 "hai nguồn" ↔ AD-17 bốn loại ↔ AD-21 loại thứ năm không có hạng ↔ AD-18 dùng hệ đánh số khác AD-17 (`loại 3/4` va nhau). Tập mã lỗi "đóng" còn thiếu 3 trường hợp | AD-16/17/18/21 |
| V-5 | **TB** | AD-7 khai báo schema bản tin đóng, AD-21 + sơ đồ thêm `appVersion`; `v` lạ không có luật; `tabId` trong `sessionStorage` bị nhân bản khi Duplicate tab → hai tab cùng `tabId` (mất đồng bộ + đè bản nháp) | AD-7, AD-21, AD-3 |
| V-6 | **TB** | Theme khai báo "đồng bộ đa tab" nhưng AD-19 chỉ cho đọc/đặt theme một lần trước lần vẽ đầu → không có đường hợp lệ để đổi theme lúc chạy | AD-19 ↔ AD-3/AD-7 |
| V-7 | **TB** | FR-5 (ghi chú rỗng biến mất) có dòng trong map nhưng không thuộc luồng nào của AD-8; "rời khỏi nó" chưa định nghĩa | AD-8 |
| V-8 | **TB** | Ghi sửa không có điều kiện tồn tại → `put()` hồi sinh ghi chú đã xóa ở tab khác; thiếu mã `GONE` *(đã báo vòng 1)* | AD-6, AD-18 |
| V-9 | **TB** | AD-4 cấm mọi API tính khoảng cách ngày mà FR-17 cần; so sánh `lastBackupAt` có offset chưa chốt; `localStamp` không có tie-break | AD-4, AD-11 |
| V-10 | NHẸ | AD-6 "đọc đúng hai chỗ" mâu thuẫn với chính đoạn sau và với AD-11 | AD-6 |
| V-11 | NHẸ | AD-13 "đúng năm trường, không hơn" ↔ "chịu được trường lạ" | AD-13 |
| V-12 | **TB** | `fold()` chưa đóng (không "và không gì khác"), không có bất biến bảo toàn chỉ số (tô từ khóa lệch), không có `foldVersion`/luật rebuild, regex chưa ghi cờ `/gu` *(đã báo, bỏ qua)* | AD-5 |
| V-13 | **TB** | Sàn a11y còn 3/6 mục không ai nhận: tương phản 4.5:1 (kèm cặp `danger`/`chip-bg` dark 4.55:1), zoom 200%, `prefers-reduced-motion`, màu-là-tín-hiệu-duy-nhất | AD-20 |
| V-14 | **TB** | Không có lệnh cấm "mọi request mạng sau khi tải" — webfont không bị AD-12 chặn (biên NFR-5) *(đã báo, bỏ qua)* | AD-12 |
| V-15 | NHẸ | `COLLAPSED_LINES = 3` ở `limits.js` nhưng thực thi bằng CSS; `còn N dòng` là phép đo của view *(đã báo, bỏ qua)* | AD-14 |
| V-16 | NHẸ | Chưa cấm `column-count`/masonry → FR-7 có thể bị CSS vẽ sai hướng *(đã báo, bỏ qua)* | Conventions |
| V-17 | NHẸ | Spine vẫn đóng OQ-2 (Chromium) mà không ghi nhận là giả định *(đã báo, bỏ qua)* | Stack |
| V-18 | NHẸ | Phép tính ngân sách 2.000 × 20.000 ≈ 40 MB vẫn thiếu (OQ-3 nửa sau) *(đã báo, bỏ qua)* | AD-10 |
| V-19 | **TB** | Microcopy EXPERIENCE "còn khoảng 10%" ↔ AD-10 `0.80`; và ngưỡng mới `< 50 MB` **không có microcopy nào** *(đã báo, bỏ qua và nay rộng hơn)* | AD-10 |
| V-20 | NHẸ | Nợ tài liệu M-2 (xóa dải băng loại 2 ở 4 chỗ EXPERIENCE + 1 chỗ DESIGN) chưa ai trả, spine không ghi nhận | — |
| V-21 | NHẸ | Nạp file cũ hồi sinh ghi chú đã xóa — hành vi có chủ ý nhưng chưa nói với người dùng *(đã báo, bỏ qua)* | AD-11 |
| V-22 | NHẸ | Chính sách **trường thừa trong file nạp** vẫn chưa chốt (AD-13 chỉ nói về bản ghi trong kho) | AD-11 |
| V-23 | **TB** | FR-1 (con trỏ sẵn sàng), FR-4 (hợp đồng bàn phím `Ctrl+Enter`), NFR-1 ≤2s vẫn không AD nào nhận; AD-6 nạp toàn bộ RAM lúc khởi động là rủi ro trực tiếp cho NFR-1 *(đã báo, bỏ qua)* | — |
| V-24 | NHẸ | AD-11 không ghi `lastBackupAt` ở đường **xuất** → UJ-3 bước 1 chết sau lần sao lưu đầu *(đã báo, bỏ qua)* | AD-11 |
| V-25 | NHẸ | Eviction xóa **cả origin**: tầng B/B′ chết cùng tầng A — AD-3 vẫn có thể bị đọc như "localStorage bền hơn" *(đã báo, bỏ qua)* | AD-3, AD-10 |

---

## Phần 4 — Việc cần làm, xếp theo thứ tự

1. **V-1 + V-2 cùng lúc.** Cụm bản nháp là một hệ; sửa riêng lẻ sẽ phải làm lại. Cần: định nghĩa vận
   hành của "mồ côi" (heartbeat hoặc hỏi qua kênh), thủ tục nhận nuôi có xác nhận, hình dạng giá trị
   bản nháp, luật dọn key, luật hủy hẹn/`seq`, và thứ tự bắt buộc của `chotGhiChu` trên hai kho.
2. **V-5.** `tabId` phải chống được nhân bản tab, và schema bản tin phải là **một** (gộp `appVersion`
   vào AD-7, chốt luật cho `v` lạ). Đây là nền của cả V-1 lẫn V-3.
3. **V-3.** Chốt cơ chế version thật (importmap hoặc tương đương), version cả `style.css`, và cho tab
   lệch phiên bản chuyển **chỉ-đọc**.
4. **V-4.** Một hệ số hiệu dải băng duy nhất; AD-16 sửa thành ba nguồn; AD-21 có hạng; AD-18 thêm
   `DB_UNAVAILABLE`, `VERSION_SKEW`, `GONE`.
5. **V-6 → V-9.** Bốn vá cục bộ, mỗi cái một đoạn.
6. **V-12 → V-25.** Phần lớn là các finding vòng 1 bị bỏ qua; có thể xử lý theo lô trong một lượt sửa
   câu chữ, trừ V-12 (bất biến `fold`) và V-13 (a11y) nên có người nhận rõ ràng.

Toàn bộ 8 mục nội dung đều nằm trong 6 AD. Cấu trúc, paradigm, và 15/21 AD giữ nguyên được.
