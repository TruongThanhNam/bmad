# Review xác minh kỹ thuật — ARCHITECTURE-SPINE.md

- **Tài liệu**: `_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md`
- **Ngày review**: 2026-09-10
- **Phạm vi**: xác minh bằng tra cứu thực tế (WebSearch/WebFetch) mọi quyết định có tên công nghệ, tên API, số phiên bản và con số ngưỡng.

## Verdict

Kiến trúc vững về nguyên tắc và gần như mọi API trình duyệt được nêu đều có thật, còn hiện hành, và
được Chromium hỗ trợ; nhưng có **một phiên bản đã lỗi thời (Vitest 3.x)**, **một ngưỡng cảnh báo
dung lượng gần như không bao giờ kích hoạt trên Chromium**, và **một tuyên bố bảo mật sai về tiền tố
origin** — cần sửa trước khi coi tài liệu là substrate để build.

---

## 1. Phiên bản thư viện / framework

### F-1 · Vitest 3.x đã lỗi thời — **NẶNG (Major)**

Bảng Stack ghi `Vitest 3.x`. Tra cứu ngày 2026-09-10:

- Bản hiện hành trên npm là **Vitest 5.0.0**, phát hành **2026-09-03** (một tuần trước).
- Vitest 4.1 đã ra trước đó; nhánh 3.x thuộc thế hệ cách hai major.
- v5 có breaking changes đáng kể: `vitest list` phân tích tĩnh theo mặc định, coverage chuyển sang
  `@vitest/istanbuljs`, siết chặt defaults.

Vì AD-12 nói `package.json` tồn tại **chỉ** để chạy Vitest, việc chốt sai major là chốt sai đúng thứ
duy nhất trong file đó.

**Đề nghị**: đổi thành `Vitest 5.x` và ghi rõ đã kiểm ngày 2026-09-10; hoặc bỏ số major, ghi
"Vitest — phiên bản hiện hành lúc khởi tạo repo", để tránh tài liệu tự lỗi thời.

**Ghi chú thêm**: Vitest 5 chạy trên Vite 7+/Node hiện hành. Với dự án không có bước build, cấu hình
Vitest cần `environment: 'node'` — điều này khớp AD-2 (core test được ở Node, không giả lập trình
duyệt). Không có xung đột.

---

## 2. API trình duyệt — có thật, còn tồn tại, Chromium hỗ trợ?

| API nêu trong tài liệu | Có thật | Trạng thái 2026-09 | Kết luận |
| --- | --- | --- | --- |
| `IndexedDB` | Có | Baseline widely available, tiêu chuẩn W3C/WHATWG hiện hành | **Đạt** |
| `BroadcastChannel` | Có | Baseline **Widely available** từ 03/2022 (Chrome 54+, Edge 79+, Firefox 38+, Safari 15.4+) | **Đạt** |
| `navigator.storage.persist()` | Có | Storage API, Chromium hỗ trợ; **Chrome không hiện prompt**, tự cấp/từ chối theo tín hiệu engagement | **Đạt, có cảnh báo** (xem F-4) |
| `navigator.storage.estimate()` | Có | Storage API, trả `{usage, quota}` **ước lượng** | **Đạt, có cảnh báo** (xem F-2) |
| `crypto.randomUUID()` | Có | Web Crypto, sinh UUID v4 | **Đạt, có ràng buộc secure context** (xem F-5) |
| `String.prototype.normalize('NFD')` | Có | ES2015, phổ cập từ lâu, ICU-backed trong V8 | **Đạt** |
| Regex `\p{M}` với cờ `u` | Có | Unicode property escapes — ES2018; `\p{…}` **bắt buộc** cờ `u` (hoặc `v`) mới được hiểu là property escape, nếu không sẽ bị coi là identity escape | **Đạt** |
| `localStorage` (Web Storage) | Có | Tiêu chuẩn, ~5 MiB/origin | **Đạt** |

Không có API nào trong tài liệu là bịa, đã bị bỏ (deprecated), hay chưa tồn tại. Đây là điểm mạnh
thật sự của tài liệu.

**Lưu ý nhỏ về `\p{M}`**: `M` là alias hợp lệ của General_Category (Mark). Cú pháp `\p{M}` chỉ hoạt
động dưới dạng "loose matching" của General_Category — đúng và an toàn. Nếu muốn tường minh hơn có
thể viết `\p{Mn}` (Nonspacing_Mark) vì dấu tiếng Việt tổ hợp đều là Mn; `\p{M}` rộng hơn nhưng không
gây hại cho tiếng Việt. Nên viết rõ regex đích trong AD-5 để tránh mỗi người tự chế một biến thể:
`/\p{M}/gu`.

---

## 3. Chi tiết tiếng Việt: `đ` / `Đ` và NFD

### **ĐÚNG** — AD-5 chính xác, và đây là chi tiết dễ sai nhất trong toàn bộ tài liệu.

Xác minh với dữ liệu Unicode:

- `đ` = **U+0111 LATIN SMALL LETTER D WITH STROKE**, khối Latin Extended-A.
- Ký tự này **không có canonical decomposition** — nó là chữ cái độc lập với nét gạch ngang là bộ
  phận của glyph, không phải combining mark chồng lên `d`.
- Hệ quả: `'đ'.normalize('NFD')` trả về **đúng `đ`**, không đổi. `\p{M}` không có gì để xóa.
- Tương tự với `Đ` = U+0110.

Vì vậy thứ tự bắt buộc mà AD-5 nêu — **map `đ→d`/`Đ→D` TRƯỚC, rồi `normalize('NFD')`, rồi bỏ
`\p{M}`, rồi `toLowerCase()`** — là **đúng**. Đảo thứ tự thật sự sẽ hỏng: `đ` sẽ sống sót qua NFD và
lọt vào chuỗi folded, khiến "đường" gõ "duong" không ra kết quả.

Mọi nguyên âm tiếng Việt khác (ă â ê ô ơ ư + 5 thanh) đều có canonical decomposition và bị NFD tách
đúng, nên `đ`/`Đ` là ngoại lệ duy nhất cần map tay. Tài liệu nhận diện chính xác.

**Đề nghị nhỏ**: AD-5 nên nói thêm rằng `fold()` phải chạy `normalize('NFC')` hoặc chấp nhận input ở
cả hai dạng — văn bản dán từ macOS có thể đã ở NFD sẵn. Chuỗi hiện tại vẫn xử lý đúng cả hai dạng
(NFD trên NFD là no-op), nên đây chỉ là ghi chú, không phải lỗi.

---

## 4. Các con số

### F-2 · Ngưỡng `usage / quota ≥ 0.80` gần như không bao giờ kích hoạt trên Chromium — **NẶNG (Major)**

AD-10 nói: đọc `navigator.storage.estimate()`, `usage / quota ≥ 0.80` → dải băng cảnh báo trước
ngưỡng. Tra cứu MDN (Storage quotas and eviction criteria):

- Trên Chrome/Chromium (và Edge), **quota cho một origin là tới 60% tổng dung lượng đĩa** — không
  phải một con số cố định nhỏ.
- Quota tính theo **tổng dung lượng đĩa**, không theo chỗ trống, để chống fingerprinting.

Hệ quả số học: trên ổ 512 GB, `quota` ≈ 307 GB. `usage / quota ≥ 0.80` nghĩa là app ghi chú text
phải chiếm ~245 GB mới cảnh báo. Với ghi chú thuần text trần 20.000 ký tự, ngưỡng này **không bao
giờ đạt tới**. Cảnh báo "trước ngưỡng" của FR-19 trên thực tế là mã chết.

Ngược lại, thứ thật sự làm ghi thất bại là **áp lực lưu trữ toàn máy**: khi tổng dữ liệu của tất cả
origin vượt mức tối đa của trình duyệt (Chrome dùng khoảng **80% tổng dung lượng đĩa** — một con số
80% khác, dễ nhầm với 0.80 trong AD-10), hoặc khi máy sắp hết đĩa. Lúc đó `QuotaExceededError` xảy
ra mà `usage/quota` vẫn đang rất thấp.

**Đề nghị**: giữ `QuotaExceededError` làm cơ chế chính (AD-8 đã đúng), và sửa AD-10 thành một trong
hai hướng: (a) cảnh báo khi `quota - usage` nhỏ hơn một ngưỡng tuyệt đối (ví dụ < 50 MB còn lại),
thay vì theo tỉ lệ; hoặc (b) hạ AD-10 xuống Deferred và thừa nhận PRD Open Question 3 vẫn chưa được
trả lời bằng số đo thật. Tài liệu hiện đang trình bày 0.80 như một sự thật đã kiểm chứng — nó không
phải.

### F-3 · `estimate()` là ước lượng có đệm, không phải số đo chính xác — **TRUNG BÌNH (Moderate)**

AD-10 dùng chữ "số đo thật". MDN nói rõ `estimate()`:

- Trả về giá trị **ước lượng**, không phải thực tế.
- **Có thể gộp dữ liệu của origin khác** vào phép tính.
- Trình duyệt **cố ý đệm (padding)** kích thước dữ liệu cross-origin khi báo cáo, để chống
  fingerprinting.

So sánh một con số bị đệm với ngưỡng cứng 0.80 là kém tin cậy. Cần đổi cách diễn đạt trong AD-10:
đây là tín hiệu định hướng, không phải phép đo.

### `localStorage` ~5 MB/origin, đếm theo UTF-16 — **ĐÚNG**

- Chuẩn khuyến nghị **5 MiB cho localStorage mỗi origin** (Chromium: 5 MiB localStorage + 5 MiB
  sessionStorage, tổng Web Storage 10 MiB).
- Giới hạn đếm theo **UTF-16 code unit — xấp xỉ 2 byte mỗi ký tự**, nên dung lượng dùng được trên
  thực tế chỉ bằng một nửa con số byte thô.
- Vượt quá → `QuotaExceededError`.

Con số trong tài liệu đúng. **Nhưng có một hệ quả tài liệu chưa tính**: AD-3 để `ghichu.draft` trong
`localStorage`, còn FR/PRD cho phép ghi chú tới 20.000 ký tự. 20.000 ký tự tiếng Việt ≈ 40 KB
UTF-16 — vẫn an toàn trong 5 MiB, nên **không phải lỗi**, chỉ cần ghi chú rằng bản nháp là key duy
nhất có kích thước không chặn trước và phải xử lý `QuotaExceededError` ở đó nữa (hiện AD-8 chỉ mô tả
đường ghi IndexedDB).

### Eviction: mô tả của AD-10 đúng về bản chất, thiếu một hệ quả — **NHỎ (Minor)**

Xác minh:

- Mặc định là **best-effort**: dữ liệu bị dọn khi có áp lực lưu trữ, theo chính sách **LRU** — origin
  ít dùng gần đây nhất bị xóa trước.
- `persist()` chuyển sang **persistent**: chỉ bị xóa khi người dùng chủ động xóa trong cài đặt trình
  duyệt; origin persistent được **bỏ qua** khi LRU quét.
- Khi một origin bị evict, **toàn bộ dữ liệu của origin bị xóa một lượt** để tránh trạng thái không
  nhất quán.

Hệ quả tài liệu chưa nói: vì eviction xóa **cả origin**, `ghichu.draft` / `ghichu.theme` /
`ghichu.lastBackupAt` trong `localStorage` cũng biến mất cùng lúc với IndexedDB. AD-3 tách hai kho
theo vai trò là hợp lý, nhưng không nên ngầm hiểu localStorage là "kho an toàn hơn" — nó không phải.

### F-4 · `persist()` trên Chrome không hỏi người dùng — ảnh hưởng tới AD-10 và mục Deferred — **TRUNG BÌNH (Moderate)**

- Chrome/Chromium **không hiện popup**; nó tự cấp hoặc từ chối dựa trên lịch sử tương tác của người
  dùng với site (bookmark, engagement, quyền notification…). Firefox mới là bên hiện UI.
- Nghĩa là ở lần khởi động **đầu tiên** — đúng thời điểm AD-10 chỉ định gọi — xác suất bị từ chối là
  cao nhất, vì chưa có tín hiệu engagement nào.

AD-10 gọi `persist()` **chỉ ở lần khởi động đầu tiên** và nếu bị từ chối thì hạ ngưỡng nhắc sao lưu
từ 7 xuống 3 ngày — nhưng không bao giờ thử lại. Đó là chốt vĩnh viễn một câu trả lời lấy ở thời
điểm tệ nhất.

**Đề nghị**: gọi lại `persist()` định kỳ (ví dụ mỗi phiên, hoặc sau N lần chốt ghi chú), và dùng
`navigator.storage.persisted()` để đọc trạng thái hiện tại thay vì nhớ kết quả lần đầu.

### GitHub Pages: HTTPS, đường dẫn project site, origin không tính path

| Khẳng định | Xác minh | Kết luận |
| --- | --- | --- |
| Project site phục vụ tại `<username>.github.io/<repo>/` | Đúng — đây là dạng URL mặc định của GitHub Pages cho repo không phải `<user>.github.io` | **Đúng**: repo `TruongThanhNam/bmad` → `https://truongthanhnam.github.io/bmad/` |
| Phục vụ qua HTTPS | Đúng — GitHub Pages hỗ trợ HTTPS; với domain `*.github.io` HTTPS luôn khả dụng và "Enforce HTTPS" bật được (với custom domain có thể mất tới 24h để tùy chọn xuất hiện) | **Đúng** |
| Origin **không tính đường dẫn** | Đúng — origin = scheme + host + port. Toàn bộ storage (IndexedDB, localStorage, quota, eviction) tính **theo origin**, nên mọi project site của cùng tài khoản dùng chung một kho | **Đúng** |
| Hostname viết thường | Đúng — host trong URL không phân biệt hoa thường và được chuẩn hóa về chữ thường; `truongthanhnam.github.io` là đúng dù username là `TruongThanhNam` | **Đúng** |

### F-5 · AD-9 tuyên bố sai rằng tiền tố ngăn được "đọc trộm" — **NẶNG (Major, lỗi lập luận bảo mật)**

AD-9 viết: prevents "một project site khác của cùng tài khoản GitHub **ghi đè hoặc đọc trộm** kho dữ
liệu này — vì origin của trình duyệt không tính đường dẫn".

Tiền đề đúng, kết luận sai. Vì origin không tính path, mọi project site trên
`truongthanhnam.github.io` **nằm trong cùng một origin và có toàn quyền đọc/ghi cùng một IndexedDB
và cùng một localStorage**. Đặt tiền tố `ghichu.` và tên DB `ghichu`:

- **Ngăn được**: va chạm tên do vô ý giữa các app của chính mình.
- **KHÔNG ngăn được**: một script trên project site khác (hoặc bất kỳ mã nào chạy trên origin đó)
  đọc hoặc xóa dữ liệu ghi chú. Không có ranh giới bảo mật nào ở đây.

Đây là loại nhầm lẫn nguy hiểm vì nó tạo cảm giác an toàn sai trong một tài liệu nền. Cùng lý do,
`BroadcastChannel('ghichu')` cũng phát trong phạm vi origin — mọi trang cùng origin đều nghe được và
đều gửi được tin giả vào kênh đó.

**Đề nghị**: viết lại AD-9 theo đúng sự thật — prevents *va chạm tên*, không phải truy cập trái
phép; và ghi thẳng vào Deferred hoặc phần rủi ro rằng **origin dùng chung là biên bảo mật thật sự
của sản phẩm này**, và cách duy nhất để tách là một custom domain hoặc một tài khoản/organization
riêng.

### F-6 · `crypto.randomUUID()` **có** yêu cầu secure context — **TRUNG BÌNH (Moderate, do AD-12 không có bước build)**

Xác minh MDN: `Crypto.randomUUID()` được đánh dấu **Secure context only** — chỉ khả dụng qua HTTPS
(và các origin được coi là đáng tin như `localhost`). Trên HTTP thường, `crypto.randomUUID` là
`undefined` và gọi vào sẽ ném `TypeError: crypto.randomUUID is not a function` — đây là lỗi phổ
biến, có nhiều issue thực tế trong các dự án lớn.

Với production thì **không sao**: GitHub Pages phục vụ qua HTTPS, secure context được thỏa mãn.
Nhưng tài liệu chưa ghi ràng buộc này, trong khi AD-12 tuyên bố "không có bước build,
`index.html` nạp thẳng ES modules". Điều đó dễ dẫn tới việc mở file trực tiếp hoặc chạy sau một
server HTTP nội bộ:

- Mở qua `file://`: ES modules bị chặn bởi CORS, và IndexedDB chạy trên origin mờ (opaque) — app
  không chạy được. `file://` **không** phải cách phát triển hợp lệ cho kiến trúc này.
- Chạy qua `http://localhost`: **được** — localhost là secure context, `randomUUID` hoạt động.
- Chạy qua `http://<ip-máy-khác>` (ví dụ test trên máy công ty qua LAN): **hỏng** — không phải secure
  context.

**Đề nghị**: bổ sung vào AD-12 hoặc Consistency Conventions một dòng: "phát triển cục bộ phải qua
`http://localhost` (secure context), không mở bằng `file://`" — và ghi rõ `crypto.randomUUID()` phụ
thuộc secure context, secure context được bảo đảm bởi HTTPS của GitHub Pages (AD-9).

---

## 5. Bảng tổng hợp findings

| # | Mức | Nội dung | Vị trí |
| --- | --- | --- | --- |
| F-1 | **Nặng** | Vitest 3.x lỗi thời; hiện hành là **5.0.0** (2026-09-03) | Stack |
| F-2 | **Nặng** | `usage/quota ≥ 0.80` gần như không bao giờ kích hoạt vì quota Chromium = 60% đĩa; cảnh báo FR-19 thành mã chết | AD-10 |
| F-5 | **Nặng** | Tiền tố `ghichu.` ngăn va chạm tên, **không** ngăn đọc/ghi trái phép — cùng origin là cùng quyền | AD-9 |
| F-3 | Trung bình | `estimate()` là ước lượng có đệm, gọi nó là "số đo thật" là sai | AD-10 |
| F-4 | Trung bình | Chrome tự quyết `persist()` không hỏi; gọi một lần ở khởi động đầu là thời điểm tệ nhất, và không bao giờ thử lại | AD-10 |
| F-6 | Trung bình | `crypto.randomUUID()` yêu cầu secure context — chưa ghi ràng buộc; xung đột tiềm tàng với AD-12 "không build" | AD-12 / Conventions |
| F-7 | Nhỏ | Eviction xóa **cả origin** một lượt → localStorage mất cùng IndexedDB; AD-3 không nên ngụ ý localStorage bền hơn | AD-3, AD-10 |
| F-8 | Nhỏ | Đường ghi `localStorage` (bản nháp 20.000 ký tự) cũng có thể ném `QuotaExceededError`; AD-8 chỉ mô tả đường IndexedDB | AD-8 |
| F-9 | Nhỏ | AD-5 nên viết rõ regex đích `/\p{M}/gu` để tránh biến thể tự chế | AD-5 |

## 6. Những khẳng định đã được xác minh là ĐÚNG

- `đ`/`Đ` (U+0111 / U+0110) **không** có canonical decomposition → không phân rã qua `normalize('NFD')`
  → **bắt buộc map tay trước**. AD-5 đúng hoàn toàn, kể cả thứ tự bốn bước.
- `localStorage` ~5 MiB/origin, đếm theo UTF-16 (~2 byte/ký tự).
- IndexedDB, BroadcastChannel, `navigator.storage.persist()`/`estimate()`, `crypto.randomUUID`,
  `String.prototype.normalize`, `\p{M}` với cờ `u` — tất cả đều tồn tại, còn hiện hành, và được
  Chromium hiện hành hỗ trợ.
- GitHub Pages: project site tại `<user>.github.io/<repo>/`, phục vụ HTTPS, origin không tính path.
- Eviction: best-effort mặc định, LRU, persistent được miễn trừ.

## 7. Chưa xác minh được / cần dữ liệu thật

- Chính sách trình duyệt của máy công ty (Edge managed policy) có cho phép IndexedDB persistent hay
  chặn `persist()` hay không — chỉ đo được khi dùng thật. Mục Deferred đã ghi nhận đúng.
- Ngưỡng áp lực lưu trữ cụ thể của Chromium không được tài liệu hóa công khai dưới dạng con số ổn
  định; mọi ngưỡng cảnh báo tự đặt đều là phỏng đoán cho tới khi có số đo trên máy thật.
- Ngân sách RAM ở AD-6 (Deferred) — chưa có số, đúng là chưa nên chốt.

## Sources

- [vitest - npm](https://www.npmjs.com/package/vitest)
- [Vitest 4.1 is out! | Vitest](https://vitest.dev/blog/vitest-4-1.html)
- [Vitest Release Notes — releases.sh](https://releases.sh/vitest)
- [Crypto: randomUUID() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [Consider dropping the secure context requirement for randomUUID() · w3c/webcrypto#408](https://github.com/w3c/webcrypto/issues/408)
- [U+0111 LATIN SMALL LETTER D WITH STROKE — Compart](https://www.compart.com/en/unicode/U+0111)
- [U+0111 — codepoints.net](https://codepoints.net/U+0111)
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Test of localStorage limits/quota — Artemy Tregubenko](https://arty.name/localstorage.html)
- [Broadcast Channel API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
- [Baseline (compatibility) - MDN Glossary](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility)
- [Unicode character class escape \p{...} - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)
- [Unicode property escapes in JavaScript regular expressions — Mathias Bynens](https://mathiasbynens.be/notes/es-unicode-property-escapes)
- [GitHub Pages](https://pages.github.com/)
- [About custom domains and GitHub Pages - GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
