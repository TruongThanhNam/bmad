---
title: 'Solution Design — Ghi chú hàng ngày'
type: solution-design
status: draft
created: '2026-09-10'
audience: 'chính tác giả, đọc lại sau vài tháng'
companion: ./ARCHITECTURE-SPINE.md
sources:
  - ./ARCHITECTURE-SPINE.md
  - ./.memlog.md
  - ./reviews/review-rubric.md
  - ./reviews/review-doi-khang.md
  - ./reviews/review-doi-chieu.md
  - ./reviews/review-xac-minh.md
  - ./reviews/review-vong-2.md
  - ../../prds/prd-ghi-chu-hang-ngay-2026-09-08/prd.md
---

# Solution Design — Ghi chú hàng ngày

Tài liệu này **không** phải nguồn sự thật. Nguồn sự thật là `ARCHITECTURE-SPINE.md`; ở đâu hai bên
lệch nhau thì spine đúng. Spine nói *cái gì phải đúng*; tài liệu này nói *vì sao đã chọn như vậy, và
cái gì đã bị loại*. Nó tồn tại vì spine cố ý không chứa lý do — và lý do là thứ duy nhất giúp người
đọc sau vài tháng biết khi nào được phép đổi một quyết định.

---

## 1. Tóm tắt một trang

**Về mặt kỹ thuật, sản phẩm là:** một trang HTML tĩnh, một màn hình, không backend, phục vụ từ
GitHub Pages tại `https://truongthanhnam.github.io/bmad/`. Sau khi tải xong, nó không gọi ra ngoài
lần nào nữa. Toàn bộ dữ liệu nằm trong IndexedDB của trình duyệt trên đúng một máy. Mã là ES modules
thuần, nạp thẳng, không bundler, không thư viện runtime. `package.json` tồn tại chỉ để chạy Vitest
trên phần logic thuần.

**Ba quyết định định hình mọi thứ còn lại:**

1. **Local-first tuyệt đối, một máy, không đồng bộ (đến từ PRD NFR-4/NFR-5, không phải từ kiến
   trúc).** Vì không có server, mọi vấn đề khó của sản phẩm này bị đẩy hết vào trình duyệt: hạn mức
   dung lượng (AD-10), nhiều tab tranh nhau một kho (AD-3, AD-7), nạp lại file sao lưu như là cơ chế
   khôi phục duy nhất (AD-11), và múi giờ của máy nạp file (AD-4). Không có quyết định kiến trúc nào
   trong tài liệu này mà không truy ngược về đây.

2. **Store một chiều bọc trong ports-and-adapters (AD-1, AD-2).** Một khối state, mọi thay đổi đi qua
   một action, view là hàm thuần của state, và lõi không biết gì về trình duyệt. Đây là thứ làm cho
   bốn chỗ dễ sai nhất — bỏ dấu tiếng Việt, sắp xếp/lọc theo giờ tại chỗ, gộp file sao lưu, mô hình
   điều kiện — test được ở Node mà không cần trình duyệt. Không có nó thì các lỗi đó chỉ lộ ra khi
   dùng thật, tức là lộ ra bằng mất dữ liệu.

3. **Không có bước build (AD-12).** Deploy = `git push`. Đây là quyết định tối ưu cho *khả năng quay
   lại sau sáu tháng*, không tối ưu cho trải nghiệm phát triển. Nó mua được sự bền vững và trả giá
   bằng ba thứ cụ thể: không bust được cache (AD-21 phải đổi sang phát hiện lệch phiên bản), không có
   TypeScript, và không có service worker (offline nằm ở Deferred).

Mọi thứ khác trong spine là hệ quả của ba điều trên cộng với các lỗ mà bốn vòng review đã đục ra.

---

## 2. Bối cảnh và ràng buộc

Đọc ra từ PRD và UX; không chép lại chúng.

**n = 1.** Một người dùng, chính là tác giả, trên một máy công ty, một trình duyệt. Điều này không
chỉ là bối cảnh — nó là *ngân sách*. Nó cho phép: không CI, không staging, không migration, không
telemetry, bump `APP_VERSION` bằng tay, và chấp nhận rủi ro origin dùng chung (AD-9). Nếu n trở thành
2, phần lớn những dòng "chấp nhận có ý thức" trong §5 phải mở lại.

**Cái không được phép hỏng là dữ liệu, không phải trải nghiệm.** PRD nói thẳng ở FR-19 rằng kiểu hỏng
tệ nhất là giao diện tỏ ra đã lưu trong khi chữ chưa xuống đĩa — đó là lý do brief bỏ Microsoft Sticky
Notes. Vì vậy AD-8 (ghi thất bại thì không giả vờ đã lưu) đắt hơn nó trông có vẻ: nó cấm cả những chỉ
báo "đang lưu"/"đã lưu" mà một lập trình viên sẽ thêm vào theo phản xạ, và AD-16 biến lệnh cấm đó
thành ràng buộc *hình dạng state* chứ không phải một lời dặn.

**Hai con số hiệu năng của PRD quyết định kiến trúc dữ liệu.** NFR-2 (tra cứu ≤ 200 ms với 2.000 ghi
chú) và NFR-1 (mở tab tới gõ được ≤ 2 giây). Con số thứ nhất đẩy tới AD-6 (nạp hết vào RAM, lọc đồng
bộ); con số thứ hai là thứ duy nhất phản đối AD-6. Xem §3.5.

**Bỏ dấu tiếng Việt là ràng buộc lưu trữ, không phải ràng buộc giao diện (NFR-6).** PRD nói điều này
từ đầu, và đó là lý do `textFolded` là một trường trong bản ghi (AD-13) chứ không phải một phép tính
lúc tìm.

**UX đóng thêm ba cửa.** EXPERIENCE.md/DESIGN.md chốt: vanilla, không UI library, single-surface,
desktop-only Windows; im lặng khi thành công; và một sàn accessibility sáu mục. Hai điều đầu làm hẹp
stack; điều thứ ba là lý do AD-20 tồn tại — sàn a11y viết trong tài liệu UX sẽ trôi mất giữa các story
nếu không có một AD gán mỗi mục vào một chỗ dựng cụ thể.

**Ba câu hỏi mở PRD ném sang kiến trúc:** ngưỡng cảnh báo dung lượng (OQ-3 → AD-10), định dạng file
sao lưu (OQ-4 → AD-11), trình duyệt đáy (OQ-2 → Stack, chốt Chromium). Câu thứ nhất là câu duy nhất
đã phải sửa hai lần.

---

## 3. Từng quyết định lớn

### 3.1 IndexedDB cho ghi chú, `localStorage` chỉ ba key (AD-3, AD-13)

**Phương án đã cân nhắc**

- (a) Tất cả trong `localStorage` — một key JSON chứa cả mảng ghi chú.
- (b) Tất cả trong IndexedDB, kể cả theme và mốc sao lưu.
- (c) Tách theo vai trò: IndexedDB là nguồn sự thật cho ghi chú; `localStorage` giữ vài mẩu trạng
  thái phiên nhỏ. ← **đã chọn**

**Phép tính ngân sách dung lượng** (đây là câu trả lời cho PRD Open Question 3, phần thứ nhất):

| Đại lượng | Con số |
| --- | --- |
| Mốc quy mô PRD | 2.000 ghi chú (≈ 1,5 năm dùng thật) |
| Trần một ghi chú (A-12 / FR-18) | 20.000 ký tự |
| **Trần lý thuyết tuyệt đối** | 2.000 × 20.000 = 4 × 10⁷ ký tự ≈ **80 MB** tính theo UTF-16 |
| Kích thước thật kỳ vọng | ~5 ghi chú/ngày, phần lớn 1–3 dòng, thỉnh thoảng một biên bản họp. Trung bình lạc quan 500 ký tự → 2.000 × 500 = 10⁶ ký tự ≈ **2 MB**; trung bình bi quan 2.000 ký tự → ≈ **8 MB** |
| Nhân đôi vì `textFolded` | `textFolded` dài đúng bằng `text` (AD-5) → **nhân đôi mọi con số trên** |
| Trần `localStorage` | ~5 MiB/origin, **đếm theo UTF-16** → khoảng **2,5 triệu ký tự**, dùng chung cho mọi key của origin |
| Quota IndexedDB (Chromium) | tới ~60% tổng dung lượng đĩa — trên ổ 512 GB là hàng trăm GB |

Đọc bảng này thì phương án (a) chết ngay: kể cả với trung bình lạc quan, 2 MB × 2 (vì `textFolded`)
= 4 MB đã ăn gần hết 5 MiB, và trần lý thuyết vượt xa gấp ba mươi lần. Nhưng ngay cả nếu vừa, (a) vẫn
sai vì hai lý do độc lập:

- **`localStorage` không có API hỏi quota.** FR-19 đòi cảnh báo *trước* khi chạm giới hạn.
  `navigator.storage.estimate()` chỉ nói về kho của Storage API; với `localStorage` thì không có gì
  để đo, nên ngưỡng cảnh báo sẽ phải là số đoán mò.
- **`localStorage` không có transaction.** Ghi một mảng JSON nghĩa là mỗi lần chốt một ghi chú phải
  viết lại toàn bộ kho — một thao tác O(n) trên đường nóng nhất của sản phẩm, và một cửa sổ mà hai
  tab ghi đè lẫn nhau. AD-3 chốt ngược lại: **mỗi ghi chú là một bản ghi, không bao giờ ghi lại cả
  kho trong một thao tác.**

Phương án (b) bị loại vì nhỏ nhặt hơn nhưng thật: theme phải đọc được **đồng bộ, trước lần vẽ đầu
tiên** để tránh nháy màu (AD-19), và IndexedDB là API bất đồng bộ. Một cờ theme trong IndexedDB nghĩa
là hoặc chấp nhận nháy màu, hoặc chặn render chờ DB mở — cả hai đều đánh vào NFR-1.

**Cái bị loại và vì sao:** `localStorage` với vai trò kho ghi chú (dung lượng + không transaction +
không đo được); IndexedDB với vai trò kho theme (bất đồng bộ, nháy màu). Kết quả là **ba key và đúng
ba key** — `ghichu.theme`, `ghichu.lastBackupAt`, `ghichu.persistDenied` — và spine viết thành lệnh
cấm ("không một ghi chú nào được lưu ở `localStorage`") chứ không phải một gợi ý, vì lệnh cấm là thứ
sống sót qua sáu tháng.

**Một hiểu nhầm đã bị chặn:** `localStorage` **không** bền hơn IndexedDB. Eviction của trình duyệt
xóa **cả origin một lượt** — mất IndexedDB thì mất luôn ba key kia. Việc tách hai kho là tách theo
*vai trò truy cập*, không phải theo *độ an toàn*.

### 3.2 Đồng bộ đa tab thật, không khóa tab (AD-7)

FR-20 để ngỏ cách hiện thực và chỉ đòi hai điều: không mất dữ liệu, và không im lặng. Ba phương án:

- (a) **Khóa tab** — tab thứ hai phát hiện tab thứ nhất và tự đưa mình vào chế độ chỉ đọc, kèm dải
  băng "Đang mở app ở một tab khác". EXPERIENCE.md đã viết sẵn microcopy cho phương án này.
- (b) **Không làm gì, chỉ cảnh báo** — đúng chữ FR-20 nhánh thứ ba, nhưng bỏ mặc dữ liệu.
- (c) **Đồng bộ thật qua `BroadcastChannel`** — tab nào ghi thì phát tin, tab kia đọc lại từ kho bền
  rồi render lại. ← **đã chọn**

**Vì sao (c):** UJ-1 nói Nam **để tab mở cả ngày**. Một cơ chế khóa tab biến hành vi trung tâm của sản
phẩm thành một lỗi cần xử lý — Nam bấm nhầm sang cửa sổ khác, mở lại app, và tab mới nói "không dùng
được". Với n = 1 và hai tab trên cùng một máy, `BroadcastChannel` là một API đúng một dòng, đồng bộ
trong cùng origin, không cần server. Chi phí của (c) gần bằng chi phí của (a), mà (a) thì hỏng đúng
hành trình quan trọng nhất.

**Hệ quả kéo theo, và đây là chỗ tốn công nhất của toàn bộ thiết kế:** ngay khi chọn "tab kia nạp lại
state", **bản nháp trở thành vấn đề**. Nếu "nạp lại state" bao gồm bản nháp thì tab kia xóa mất chữ
Nam đang gõ dở — đúng câu FR-20 cấm bằng chữ. Đó là lý do AD-3 phải chia state thành **ba tầng** và
tuyên bố tầng B (bản nháp) là **không bao giờ đồng bộ**, và AD-7 phải nói bản tin **không bao giờ mang
nội dung** — tab nhận luôn đọc lại từ kho bền. Hình dạng bản tin bị đóng lại còn đúng bốn trường và
hai `type` vì một schema mở là schema sẽ bị mỗi người thêm một trường.

**Đã bị loại một cách rõ ràng:** khóa tab và dải băng "đóng tab này". Spine cấm cả hai bằng câu chữ.
Hệ quả tài liệu: EXPERIENCE.md/DESIGN.md còn 5 chỗ nói về thông báo đó, và đó là **nợ tài liệu chưa
trả** — xem §7.

### 3.3 Store một chiều + ports-and-adapters (AD-1, AD-2)

**Phương án đã cân nhắc:** (a) DOM-first — mỗi mảnh UI tự đọc/ghi IndexedDB của nó, kiểu jQuery cổ
điển; (b) một framework nhỏ (Preact/Alpine/lit) qua CDN; (c) store một chiều tự viết + ports.

(b) chết vì AD-12 và vì EXPERIENCE.md đã chốt "không UI library". Đằng sau đó là một lý do thật: một
thư viện qua CDN là một request mạng sau khi tải, và NFR-5 ("dữ liệu không rời máy") chỉ kiểm chứng
được bằng tab Network khi con số request là **không**.

(a) chết vì đúng một kiểu hỏng cụ thể, không phải vì gu: hai vùng UI cùng sửa một dữ liệu theo hai
đường rồi lệch nhau. Bảng trạng thái §5.4 của PRD (khung nhìn mặc định / lọc ngày / từ khóa / giao
của hai) là một máy trạng thái nhỏ nhưng có sáu ô, và nếu ô tìm kiếm giữ một nửa điều kiện còn ô ngày
giữ nửa kia thì bảng đó **không bao giờ khớp lại được** khi nghiệm thu. AD-15 (điều kiện là *một* giá
trị, "hôm nay" là *vắng mặt* của điều kiện) là bản dịch trực tiếp của bảng đó sang một hình dạng
state.

Phần **ports-and-adapters** trả một giá riêng — thêm một tầng gián tiếp trong một app 1.500 dòng —
và mua đúng một thứ: **Vitest chạy ở Node, không giả lập trình duyệt**, cho `fold.js`, `time.js`,
`query.js`, `backup.js`. Bốn module đó là nơi mọi lỗi im lặng của sản phẩm sinh ra. Nếu chúng bị khóa
vào IndexedDB thì cách duy nhất để phát hiện lỗi là dùng thật, và với sản phẩm này "dùng thật" nghĩa
là mất dữ liệu ba tháng sau. Đó là toàn bộ lập luận; nếu sau này thấy tầng port thừa, hãy nhớ rằng
nó không tồn tại vì sự thanh lịch.

### 3.4 Giờ tại chỗ + offset, không UTC (AD-4)

**Phương án:** (a) lưu UTC (`Date.toISOString()`), hiển thị quy đổi về múi giờ máy đang xem; (b) lưu
ISO-8601 **có offset**, và **không bao giờ quy đổi**; (c) lưu chuỗi giờ tại chỗ trần, không offset.

**Đã chọn (b).** Kịch bản quyết định là UJ-3 kết hợp FR-16: Nam xuất file sao lưu, IT cài lại máy,
Nam nạp lại. Nếu máy mới đặt múi giờ khác (hoặc chỉ đơn giản là một máy được IT dựng với timezone mặc
định UTC), thì với (a) **một ghi chú lúc 16:40 ngày 03/09 trượt sang ngày 02/09 hoặc 04/09**. Bộ lọc
ngày của FR-13 trỏ vào ngày sai, và cái neo của UJ-2 ("hôm thứ Ba tuần trước") gãy — **gãy trong im
lặng**, không có triệu chứng nào ngoài "sao không tìm thấy".

PRD viết thẳng ở Glossary: thời điểm tạo *"ghi theo giờ địa phương của máy tạo ra nó"* và FR-2 nói nó
*"giữ nguyên khi nạp lại trên máy khác"*. (a) mâu thuẫn với câu đó; (b) là bản dịch trực tiếp.

(c) bị loại vì mất thông tin không phục hồi được: không có offset thì file sao lưu không tự mô tả
được, và một bản app sau này không có cách nào biết ghi chú được tạo ở đâu.

**Cái giá của (b), trả bằng hai luật cứng:** chuỗi có offset **không so sánh chuỗi được** (offset khác
nhau làm thứ tự sai), và `new Date(createdAt)` sẽ lôi múi giờ máy đang xem quay lại đúng chỗ vừa đuổi
đi. Vì vậy AD-4 sinh ra hai khóa dẫn xuất `localStamp` (19 ký tự đầu) và `localDate` (10 ký tự đầu),
tuyên bố chúng là **khóa sắp xếp duy nhất** và **khóa lọc duy nhất**, rồi cấm hai thứ kia bằng chữ.
Đây là một quyết định "cấm một API tiêu chuẩn của ngôn ngữ" — nó chỉ trụ được vì được viết ra và có
lý do kèm theo.

### 3.5 Nạp hết ghi chú vào RAM (AD-6)

**Phương án:** (a) truy vấn IndexedDB theo từng phím gõ, dùng index `localDate` và cursor; (b) nạp
toàn bộ vào một mảng lúc khởi động, lọc/tìm là quét mảng đồng bộ.

**Đã chọn (b), và lý do là NFR-2 chứ không phải sự tiện tay.** Với (a), mỗi ký tự gõ vào ô tìm kiếm
bắn một truy vấn bất đồng bộ; các truy vấn về **không đúng thứ tự gõ**, nên phải tự viết logic hủy
kết quả cũ, và trần 200 ms gãy đúng lúc có người đang đứng chờ (F4 thường được dùng khi sếp đang hỏi
— PRD nói rõ điều đó). Ngoài ra IndexedDB **không có full-text index**; tìm theo chuỗi con trên
`textFolded` là quét toàn bộ dù đọc từ đâu, nên (a) trả giá bất đồng bộ mà không mua được gì.

Số học ủng hộ (b): 2.000 ghi chú × (text + textFolded) — xem bảng §3.1 — là vài MB tới vài chục MB
trong trường hợp bi quan nhất, và một phép quét `String.includes` trên 2.000 phần tử là dưới một
mili-giây.

**Rủi ro đã biết và đã ghi:** AD-6 là thứ duy nhất đe dọa NFR-1 (≤ 2 giây tới ký tự đầu tiên) — nạp
hết trước khi gõ được. Nếu con số dùng thật làm gãy NFR-1, spine đã ghi sẵn đường lui ở Deferred: RAM
chỉ giữ `{id, createdAt, localDate, textFolded}`, nội dung đầy đủ lấy từ IndexedDB cho ≤ 50 mẩu đang
vẽ. Đó không phải một viết lại — đó là đổi một hàm nạp.

**Một luật đi kèm, quan trọng hơn nó trông có vẻ:** *mảng trong RAM không bao giờ là nguồn sự thật
cho một thao tác ghi*. Không có câu này thì phép gộp file nạp (AD-11) sẽ được viết là "so với mảng
trong RAM rồi ghi những cái thiếu" — và mảng đó có thể đã lỗi thời vì tab kia vừa ghi.

### 3.6 Không có bước build (AD-12)

**Phương án:** (a) Vite + bundler + TypeScript, deploy qua GitHub Actions; (b) ES modules thuần, nạp
thẳng, deploy = push.

**Đã chọn (b), và tiêu chí lựa chọn là "sáu tháng sau".** Đây là một sản phẩm cá nhân, n = 1, sẽ có
những quãng nhiều tuần không ai đụng tới. Một toolchain không được chạy trong sáu tháng là một
toolchain không dựng lại được: Node đã lên major mới, một plugin đã bị bỏ, `npm ci` gãy vì một
transitive dependency. Lúc đó chi phí không phải là "sửa build" mà là "không sửa nữa" — và sản phẩm
chết vì lý do không liên quan gì tới sản phẩm.

(b) trả giá bằng: không TypeScript, không minify, không code splitting, không CSS preprocessor, và —
điều đắt nhất — **không bust được cache**. Ba cái đầu không quan trọng ở quy mô này. Cái thứ tư sinh
ra AD-21 và một mục Deferred; xem §4.3.

`package.json` vẫn tồn tại, nhưng bị giới hạn bằng chữ: **chỉ để chạy Vitest trên `core/`, không có
dependency nào đi vào mã sản phẩm.** Nếu ngày nào đó `npm ci` gãy, sản phẩm vẫn deploy được — chỉ mất
test. Đó là ranh giới cố ý.

Phần "không request mạng sau khi tải" ban đầu không có trong AD-12; nó được thêm vào sau khi review
chỉ ra rằng một webfont Google Fonts không bị bất kỳ chữ nào trong spine chặn lại. Lệnh cấm đó không
phải để tiết kiệm băng thông — nó là thứ biến NFR-5 từ một lời hứa thành một điều **kiểm chứng được
bằng tab Network**.

---

## 4. Ba lần sửa sai đáng nhớ

Đây là phần quan trọng nhất của tài liệu. Ba lỗi dưới đây đều đã **được viết vào spine như thể chúng
đúng**, và đều bị vòng review bắt. Chúng đáng nhớ vì chúng cùng một họ: một cơ chế nghe hợp lý, viết
ra đọc trôi chảy, mà không code được — hoặc code được nhưng tái tạo đúng lỗi nó định chặn.

### 4.1 Ngưỡng `usage / quota ≥ 0.80` là mã chết (AD-10)

**Đã viết:** đọc `navigator.storage.estimate()` sau mỗi lần ghi; `usage / quota ≥ 0.80` thì hiện dải
băng cảnh báo trước ngưỡng. Memlog ghi nó với chữ *"thay số đoán mò của UX bằng số đo thật"* — nghe
như một bản nâng cấp về độ nghiêm túc.

**Sai ở đâu:** trên Chromium, quota của một origin là **tới ~60% tổng dung lượng ổ đĩa**, tính theo
tổng dung lượng chứ không theo chỗ trống (cố tình như vậy, để chống fingerprinting). Trên một ổ 512
GB, `quota` ≈ 307 GB, và `usage / quota ≥ 0.80` nghĩa là app ghi chú **text thuần** phải chiếm ~245
GB mới cảnh báo. Đối chiếu với bảng ngân sách ở §3.1: trần lý thuyết tuyệt đối của sản phẩm là ~80 MB
— nhỏ hơn ngưỡng ba nghìn lần. Nhánh `if` đó **không bao giờ chạy**. FR-19 đòi "cảnh báo trước khi
chạm giới hạn", và cái được giao là mã chết.

Tệ hơn: thứ *thật sự* làm phép ghi thất bại là **áp lực đĩa toàn máy** — khi tổng dữ liệu mọi origin
chạm mức tối đa của trình duyệt, hoặc khi máy sắp hết đĩa. Lúc đó `QuotaExceededError` xảy ra trong
khi `usage/quota` vẫn rất thấp. Nghĩa là chỉ số được chọn không chỉ hiếm khi nổ — nó **không tương
quan** với sự kiện cần cảnh báo.

**Đã sửa thành:** ngưỡng **kép** — cảnh báo khi `usage/quota ≥ 0.80` **hoặc** `quota - usage < 50 MB`.
Vế thứ hai là vế thật sự làm việc; vế thứ nhất giữ lại cho trường hợp trình duyệt/chính sách doanh
nghiệp áp một quota nhỏ. Đồng thời AD-10 phải nói thật về công cụ: `estimate()` là **ước lượng có đệm
chống fingerprinting**, không phải số đo, nên nó chỉ được dùng để cảnh báo sớm và **không bao giờ**
để quyết định có ghi hay không. Đường phát hiện thật vẫn là bắt `QuotaExceededError` theo AD-8.

**Bài học để nhớ:** một ngưỡng theo tỉ lệ đọc rất hợp lý trên giấy. Trước khi viết một ngưỡng, phải
hỏi *đại lượng ở mẫu số thực tế bằng bao nhiêu trên máy thật* — và nếu con số đó là "một phần lớn ổ
đĩa" thì tỉ lệ là đơn vị sai. Cùng loại lỗi này còn xuất hiện một lần nữa trong cùng tài liệu: con số
"80% tổng dung lượng đĩa" của Chromium (ngưỡng áp lực toàn máy) trùng số với `0.80` của AD-10 nhưng
là hai đại lượng hoàn toàn khác nhau — dễ nhầm tới mức spine phải viết cả hai ra để phân biệt.

### 4.2 "Nhận nuôi bản nháp mồ côi" trên `localStorage` — có race, và tái tạo đúng lỗi FR-20 nó định chặn (AD-3, AD-7, AD-8)

Đây là lần sửa sai đắt nhất, vì nó là **lỗi sinh ra từ một bản sửa lỗi**.

**Bối cảnh.** Bản spine đầu tiên cho bản nháp đi qua `BroadcastChannel` như mọi thứ khác. Review vòng
1 bắt lỗi chí mạng: tab kia nhận tin rồi "nạp lại state" sẽ **xóa mất chữ Nam đang gõ dở** — đúng câu
FR-20 cấm. Bản sửa: chia state thành ba tầng, cho bản nháp thành **tầng riêng-tab** với key
`ghichu.draft.<tabId>`, `tabId` sinh lúc tải và giữ trong `sessionStorage`. Và vì tab đóng lại sẽ bỏ
lại một key không ai đọc nữa (Nam mất bản nháp — cũng vi phạm FR-3 "bản nháp xuất hiện lại nguyên
trạng"), bản sửa thêm cơ chế **nhận nuôi bản nháp mồ côi**: tab mới, nếu không có bản nháp của chính
nó, thì nhặt bản nháp mồ côi mới nhất và xóa key cũ.

**Sai ở đâu — bốn tầng:**

1. **Không có định nghĩa vận hành của "mồ côi".** `tabId` sống trong `sessionStorage`, mà
   `sessionStorage` là **riêng từng tab** — tab B **không có cách nào** biết tab A còn sống. Vậy
   `ghichu.draft.A` là của một tab đã đóng hay của tab A đang gõ dở ngay lúc này? Không phân biệt
   được. Kịch bản đầy đủ: tab A đang gõ dở biên bản họp → Nam mở tab B (PRD nói đây là chuyện bình
   thường, không phải trường hợp hiếm) → tab B nhận nuôi và **xóa** key của A → chữ đang gõ giờ nằm ở
   cả hai ô soạn thảo → Nam chốt ở cả hai → **hai ghi chú trùng nội dung, khác `id`**, mà phép gộp
   theo `id` của AD-11 không bao giờ dọn được. Cùng một lỗ FR-20 của vòng 1, đi qua một cửa khác.
2. **Race khi hai tab khởi động cùng lúc.** Khôi phục phiên của trình duyệt (Ctrl+Shift+T, "mở lại
   các tab lần trước", cửa sổ có tab được pin) mở **nhiều tab cùng lúc**. Cả hai đọc thấy cùng một
   key, cả hai nhận nuôi, cả hai gọi `removeItem` — và `removeItem` trên một key đã biến mất là một
   **no-op im lặng**. `localStorage` **không có compare-and-swap, không có transaction, không có
   lock**. Không có cách nào viết cơ chế này cho đúng trên `localStorage`; đây không phải một bug cần
   sửa mà là một API sai cho công việc.
3. **"Mới nhất" không có dữ liệu để tính.** Spine định nghĩa hình dạng *bản ghi ghi chú* (AD-13) mà
   không định nghĩa hình dạng *giá trị bản nháp*. Nếu nó là chuỗi thuần thì không có mốc thời gian
   nào để so, và thứ tự key trong `localStorage` không được bảo đảm.
4. **Key mồ côi tích tụ vô hạn.** Không TTL, không dọn dẹp. Với 40 KB UTF-16 mỗi bản nháp và ~5 MiB
   `localStorage`, khoảng **125 tab đã đóng** là đủ để mọi phép ghi bản nháp ném `QuotaExceededError`
   — tức dải băng ưu tiên cao **không đóng được** bật vĩnh viễn trên một app hoàn toàn khỏe mạnh.

Cùng lúc, một lỗi anh em bị bắt ở AD-8: **hẹn debounce sống lâu hơn thứ nó định ghi**. ms 0 Nam gõ →
đặt hẹn 400 ms; ms 200 Nam bấm `Ctrl+Enter`, ghi chú được chốt; ms 400 hẹn cũ nổ và **ghi lại bản
nháp đã chốt**. Bản nháp ma đó, cộng với cơ chế nhận nuôi, thành một **đường sinh ghi chú trùng lặp
có hệ thống**.

**Đã sửa thành:** bản nháp **chuyển sang IndexedDB**, store `drafts`, khóa `tabId`, bản ghi
`{ tabId, text, heartbeat }`. Lý do là một câu duy nhất: **chỉ IndexedDB có transaction**, nên việc
nhận một bản nháp bỏ lại mới làm được nguyên tử. Toàn bộ bốn bước khởi động nằm trong **một
transaction `readwrite` duy nhất**, nên hai tab khởi động cùng lúc không thể cùng nhận một bản nháp —
cái thứ hai thấy nó đã biến mất. `heartbeat` (cập nhật mỗi `DRAFT_BEAT_MS = 10s`, coi là chết sau
`DRAFT_STALE_MS = 30s`) là **định nghĩa vận hành của "mồ côi"** mà bản cũ thiếu: chỉ bản ghi đã hết
nhịp tim mới được nhận, nên một tab đang gõ dở không bao giờ bị lấy mất bản nháp. Bước 4 xóa mọi bản
ghi `text` rỗng, giải quyết việc tích tụ. Bước 1 xử lý luôn một ca oái oăm mà review chỉ ra: Duplicate
tab **sao chép `sessionStorage`**, nên hai tab sống có thể mang cùng `tabId` — phát hiện bằng
heartbeat còn sống của chính `tabId` đó, rồi sinh `tabId` mới.

Và AD-8 nhận ba luật mới: mỗi mục tiêu tự lưu mang một `seq` tăng dần (hẹn nổ với `seq` cũ thì bị
bỏ); `chotGhiChu`/`xoaGhiChu` **hủy hẹn treo trước khi làm gì khác**; `chotGhiChu` ghi bản ghi `notes`
và làm rỗng `drafts` **trong một transaction duy nhất**.

**Bài học để nhớ:** (1) một bản sửa lỗi là một tính năng mới, và nó phải đi qua đúng vòng phản biện
như bản gốc — lỗ FR-20 bị bịt hai lần vì lần đầu bản sửa tự mở lại nó. (2) "Tab kia còn sống không?"
là một câu hỏi *phân tán*; trả lời nó bằng một kho không có tính nguyên tử là không thể, bất kể viết
khéo tới đâu. Chọn kho theo **nguyên thủy đồng bộ mà bài toán cần**, không theo độ tiện.

### 4.3 `?v=APP_VERSION` không code được với import tĩnh khi không có bước build (AD-21)

**Đã viết:** `index.html` mang một hằng `APP_VERSION` và nạp mọi module với hậu tố `?v=<APP_VERSION>`
— không có bước build nên số này *"bump bằng tay ở đúng một chỗ"*.

**Sai ở đâu:** `index.html` chỉ nạp **một** module (`app/main.js`). Mọi module còn lại được nạp bằng
`import` **tĩnh** bên trong các file `.js`, và một câu `import` tĩnh **không đọc được** một hằng khai
báo trong `index.html`. "Đúng một chỗ" là sai về mặt cơ học. Ba lối thoát, cả ba đều tệ: sửa **mọi
câu import trong mọi file** ở mỗi lần deploy (đúng loại việc tay chắc chắn bị làm sót); dùng
`<script type="importmap">` (một cơ chế spine không nhắc tới, và vẫn là việc tay); hoặc chuyển toàn bộ
sang `import()` động, phá luôn tính tĩnh mà AD-2 dựa vào để kiểm hướng phụ thuộc bằng grep.

Thêm hai lỗ: chính `index.html` — file **mang** `APP_VERSION` — không tự bust cache được, nên nếu CDN
của GitHub Pages còn giữ bản cũ thì cơ chế **tự vô hiệu hóa đúng lúc cần nhất**; và `style.css` không
có `?v=` nên mã mới có thể ghép với token màu cũ.

Và một lỗ về mức độ bảo vệ: bản cũ chỉ **cảnh báo**, không cấm ghi. Với AD-8 luồng 2 (state đổi
trước, ghi sau), một tab cũ đang mở ghi chú ở chế độ sửa vẫn autosave đè nội dung dựng từ RAM lỗi
thời lên bản ghi mà tab mới vừa sửa. Câu kết của bản cũ — "điều tệ nhất một tab cũ gây ra là hiển thị
thiếu trường mới" — **không đúng**: nó ghi đè được nội dung. AD-13 chỉ bảo vệ *hình dạng* bản ghi,
không bảo vệ *nội dung*.

**Đã sửa thành: bỏ hẳn tham vọng bust cache, chuyển sang phát hiện lệch phiên bản.** `APP_VERSION` là
một hằng trong `core/limits.js`, bump tay mỗi lần deploy, và **đi trong mọi bản tin
BroadcastChannel**. Tab nhận `appVersion` khác của mình lập tức vào **chế độ chỉ đọc**: mọi action có
ghi bị từ chối với `code = VERSION_SKEW`, hẹn tự lưu bị hủy, dải băng ưu tiên cao nhất hiện lên đề
nghị tải lại trang và **không đóng được**. Chỉ-đọc chứ không chỉ-cảnh-báo, chính xác vì lý do ở đoạn
trên. Spine viết thẳng câu quan trọng nhất: *"không có bước build thì không có cách nào đáng tin để
bust cả một đồ thị `import` tĩnh — spine này không giả vờ là có."*

**Giới hạn còn lại, đã ghi nhận thay vì che:** một tab chỉ biết mình cũ khi có **tab khác** vừa tải
bản mới và phát tin. Nam deploy rồi không mở tab nào mới thì tab cũ chạy tiếp mà không biết. Với n = 1
và mỗi lần deploy do chính Nam bấm, đây là rủi ro chấp nhận được.

**Bài học để nhớ:** một quyết định nền (AD-12, không build) có bán kính ảnh hưởng xa hơn nơi nó được
viết. Khi một AD sau đó cần một năng lực mà AD nền đã cấm, cách sửa đúng **không phải** là lén mang
năng lực đó vào cửa sau — mà là hạ thấp mục tiêu xuống thứ *làm được thật* và ghi rõ phần không làm
được. "Phát hiện + chỉ đọc" yếu hơn "bust cache", và nó trung thực.

---

## 5. Rủi ro đã chấp nhận có ý thức

Mỗi mục kèm **dấu hiệu** — thứ cụ thể phải quan sát được để biết đã tới lúc mở lại quyết định.

| # | Rủi ro | Vì sao chấp nhận | Dấu hiệu phải xem lại |
| --- | --- | --- | --- |
| R-1 | **Origin dùng chung.** Mọi project site khác của tài khoản GitHub này đọc/ghi được cùng IndexedDB, cùng `localStorage`, cùng `BroadcastChannel`. Tiền tố `ghichu.` chỉ ngăn va chạm tên, **không** ngăn truy cập (AD-9) | Cái giá của việc đặt app trong repo BMAD thay vì mua tên miền. Với n = 1 và không host mã người lạ, biên bảo mật thật là "chỉ mình Nam đẩy mã lên tài khoản này" | Tài khoản này host một trang có mã của người khác, hoặc một script bên thứ ba. Lúc đó phải chuyển sang custom domain — kéo theo quy trình chuyển dữ liệu bắt buộc của NFR-8 |
| R-2 | **Tab cũ không tự biết mình cũ** (AD-21) | Cần một tab mới phát tin mới phát hiện được. n = 1, deploy do chính Nam bấm và thường kèm reload | Deploy trở nên thường xuyên, hoặc bắt gặp một lần dữ liệu bị tab cũ ghi đè. Lời giải tử tế cần bước build hoặc service worker — cả hai phá AD-12 |
| R-3 | **`persist()` có thể bị từ chối vĩnh viễn** (AD-10) | Chrome tự quyết theo tín hiệu engagement, không hỏi người dùng; lần mở đầu tiên là lúc dễ bị từ chối nhất. AD-10 mới chỉ thử lại mỗi lần khởi động và hạ ngưỡng nhắc sao lưu 7 → 3 ngày | `ghichu.persistDenied` vẫn còn sau vài tuần dùng thật. Hoặc chính sách Edge managed của máy công ty chặn `persist()` — chỉ đo được khi dùng thật |
| R-4 | **Sao lưu là thủ công; phanh duy nhất là một dòng nhắc thụ động** (FR-17). PRD tự gọi đây là chỗ mỏng nhất | Nhắc chủ động vi phạm tinh thần NT-3 và AD-16; đồng bộ tự động cần backend, tức là non-goal | Một lần thật sự mất dữ liệu, hoặc khoảng cách giữa hai lần sao lưu vượt một tháng. Đường nâng cấp PRD đã định: nhắc chủ động, **không phải** bỏ nhắc |
| R-5 | **Ngân sách RAM khi có nhiều biên bản 20.000 ký tự** (AD-6 vs NFR-1) | Số học nói là ổn ở mốc 2.000 ghi chú; nhưng đó là số trên giấy | Thời gian từ mở tab tới gõ được vượt 2 giây (SM-2, đo bằng đồng hồ). Đường lui đã viết sẵn ở Deferred: RAM giữ metadata, nội dung đầy đủ nạp theo trang |
| R-6 | **Không chạy offline** (NFR-4) | Service worker phá AD-12 và va vào AD-21 | Mất mạng thật sự cản việc dùng app nhiều lần |
| R-7 | **Bump `APP_VERSION` bằng tay** | Không có bước build thì không có chỗ nào tự sinh | Một lần quên bump khiến hai tab chạy lệch mà không ai biết |
| R-8 | **Eviction xóa cả origin một lượt** — mất IndexedDB thì mất luôn theme, mốc sao lưu, cờ persist | Không có cách nào tránh trong phạm vi trình duyệt; đó chính là lý do F5 tồn tại | Bất kỳ lần nào mở app thấy kho trống — đó là lúc R-3 và R-4 đã cùng thất bại |
| R-9 | **`Ctrl+Enter` hai lần trong cùng một giây** cho hai `localStamp` bằng nhau, và AD-4 không có tie-break | Xác suất thấp, hệ quả là hai mẩu tráo chỗ sau một F5 — khó chịu, không mất dữ liệu | Nếu thấy thứ tự nhảy sau khi tải lại. Xem §7 |
| R-10 | **Xóa không đảm bảo dữ liệu biến mất** — ghi chú đã xóa sống lại khi nạp file sao lưu cũ (FR-11 + FR-16) | Hệ quả trực tiếp của "gộp, không bao giờ ghi đè", và PRD chọn "không bao giờ mất gì" thay vì "khôi phục sạch" | Nếu app bắt đầu chứa nội dung nhạy cảm. Đây là ràng buộc *sử dụng*, không phải ràng buộc kỹ thuật |

---

## 6. Những gì cố ý để lại sau

Đối chiếu trực tiếp mục Deferred của spine; ở đây chỉ thêm phần *vì sao chưa làm bây giờ*.

- **Migration IndexedDB version 2.** Chưa cần, vì AD-13 cho phép **nới** bản ghi mà không cần
  migration. Chỉ khi thật sự phải xóa hoặc đổi tên một trường thì `onupgradeneeded` và
  `schemaVersion` của file sao lưu mới phải đổi **cùng lúc** — và đó là điểm khó thật sự, vì file sao
  lưu cũ trên đĩa không migrate được.
- **Ngân sách RAM (AD-6).** Xem R-5. Không tối ưu trước khi có số thật; đường lui đã viết sẵn nên chi
  phí của việc chờ là gần bằng không.
- **Chạy offline (service worker).** PRD NFR-4 đã loại có ý thức. Kiến trúc không cản đường, nhưng nó
  va vào AD-21: thêm service worker thì cơ chế phiên bản phải **làm lại**, không phải cộng thêm.
- **`persist()` bị từ chối vĩnh viễn.** Xem R-3. Cần dữ liệu thật từ máy công ty, không đoán được.
- **Cách ly khỏi các project site cùng origin.** Xem R-1. Đường ra duy nhất là tên miền riêng, và nó
  kéo theo NFR-8.
- **Phá cache thật sự, và tab cũ tự biết mình cũ.** Xem §4.3 và R-2. Cần bước build hoặc service
  worker; cả hai phá AD-12.
- **CI.** Vitest chạy tay đủ cho n = 1. Thêm GitHub Actions khi có người thứ hai đụng vào mã — đó là
  ngưỡng, không phải thời điểm.

**Ngoài Deferred của spine, hai món nợ tài liệu chưa trả** (phát hiện ở review, không thuộc phạm vi
kiến trúc nên spine không ghi):

- EXPERIENCE.md còn 4 chỗ và DESIGN.md còn 1 chỗ nói về dải băng *"Đang mở app ở một tab khác"* —
  thông báo này **đã chết** khi chọn đồng bộ thật (§3.2).
- Microcopy cảnh báo dung lượng *"còn khoảng 10%"* không khớp ngưỡng của AD-10, và vế `< 50 MB` chưa
  có microcopy nào. PRD Open Question 2 (trình duyệt) cũng đã được đóng bằng việc chốt Chromium mà
  PRD chưa cập nhật.

---

## 7. Nghi vấn còn lại

Những chỗ đọc spine thấy có thể chưa nhất quán hoặc chưa đủ để code. **Không tự sửa** — ghi lại để
đối chiếu ở lần cập nhật spine tiếp theo.

1. **Capability Map mâu thuẫn với AD-3 về nơi lưu bản nháp.** Dòng `F1 · Tự lưu bản nháp (FR-3)` ghi
   *"action `datBanNhap` + `adapters/localstorage.js`"*, trong khi AD-3 đã chuyển bản nháp sang
   IndexedDB store `drafts` (§4.2) — và chính chuyển đổi đó là bản sửa lỗi chí mạng của vòng 2. Có vẻ
   là sót khi cập nhật bảng. Tương tự, danh sách port ở Structural Seed (`noteStore · sessionStore ·
   channel · fileIO · quota`) không có port nào rõ ràng cho `drafts`.
2. **Deferred vẫn nhắc `?v=` bump tay** (*"nó sẽ va vào AD-21 (`?v=` bump tay)"*) trong khi AD-21 đã
   **bỏ hẳn** cơ chế `?v=`. Câu chữ còn sót lại từ bản trước.
3. **FR-17 cần một phép trừ ngày mà AD-4 không cấp API nào.** "Đã quá 7 ngày (hoặc 3) chưa sao lưu"
   là phép trừ ngày lịch; so sánh chuỗi `yyyy-MM-dd` chỉ cho biết trước/sau, không cho biết cách nhau
   bao nhiêu ngày, và AD-4 cấm `new Date()` cho hiển thị/sắp xếp/lọc. Có lẽ ý là lệnh cấm chỉ áp cho
   ba mục đích đó, còn phép trừ ngày là mục đích thứ tư được phép — nhưng spine không nói. Liên quan:
   AD-11 viết `lastBackupAt` được cập nhật *"chỉ khi nó mới hơn giá trị đang có"* mà không nói so
   bằng gì; `exportedAt` **có offset**, nên so chuỗi trực tiếp là sai.
4. **`localStamp` không có tie-break.** Hai ghi chú chốt trong cùng một giây có khóa sắp xếp bằng
   nhau; thứ tự khi đó phụ thuộc thứ tự mảng đầu vào từ IndexedDB cursor, nên có thể tráo chỗ sau một
   lần tải lại. Review đề nghị tie-break bằng `id`; spine chưa nhận. (R-9)
5. **Sửa/xóa chéo tab có thể hồi sinh ghi chú đã xóa.** Tab 1 xóa ghi chú `X`; tab 2 đang mở `X` ở
   chế độ sửa, autosave 400 ms sau gọi `put()` (upsert là mặc định tự nhiên của IndexedDB) → `X` sống
   lại. AD-6 nói mọi phép ghi phải đọc-rồi-ghi trên IndexedDB nhưng không nói phép ghi phải **có điều
   kiện `id` còn tồn tại**, và tập mã lỗi đóng của AD-18 không có mã nào cho tình huống này (review
   đề nghị `GONE`).
6. **AD-6 "đọc IndexedDB chỉ xảy ra ở đúng hai chỗ"** mâu thuẫn với chính câu sau đó (mọi phép ghi
   đọc rồi ghi) và với AD-11 pha 2 (đọc `id` trong transaction). Có lẽ ý là "đọc **cho đường hiển
   thị** chỉ ở hai chỗ", nhưng câu hiện tại có thể bị đọc theo nghĩa cấm phép đọc trong transaction —
   tức phá đúng bản sửa quan trọng nhất của vòng 2.
7. **AD-13 "đúng năm trường, không hơn" ↔ "chịu được trường lạ".** Hai câu này nói ngược nhau về việc
   validate lúc **ghi**. Cách đọc hợp lý nhất là: **ghi** đúng năm trường, **đọc** khoan dung — nhưng
   spine không viết ra. Liên quan: AD-11 pha 1 chưa nói file nạp có **trường thừa** thì từ chối hay
   bỏ qua.
8. **FR-5 (ghi chú rỗng biến mất) chưa thuộc luồng nào của AD-8.** Capability Map gán nó cho action
   `suaGhiChu` — luồng 2 (state trước, ghi sau) — nhưng gõ rỗng rồi rời đi **là một phép xóa**, tức
   luồng 1 (ghi trước, state sau). Nếu đi luồng 2 thì mẩu giấy biến mất khỏi màn hình trước khi đĩa
   xác nhận, đúng kiểu "giả vờ" AD-8 tồn tại để cấm. Ngoài ra "rời khỏi nó" là sự kiện gì (blur? Tab?
   click ngoài?) chưa được chốt — và trong một sản phẩm không có hoàn tác, đây là con đường mất dữ
   liệu duy nhất không có phanh.
9. **`fold()` chưa đóng.** AD-5 liệt kê bốn bước nhưng không nói "và không gì khác" (khoảng trắng?
   dấu câu?), không có bộ ca vàng, không ghi cờ regex `/\p{M}/gu` (thiếu cờ `u` thì `\p{M}` không
   được hiểu là property escape — im lặng sai), và không có luật rebuild `textFolded` nếu thuật toán
   fold đổi.
10. **Stack chốt Chromium mà không ghi nhận đó là một giả định** đang đóng PRD Open Question 2, cùng
    cách phát hiện nếu sai (máy công ty dùng trình duyệt khác).
11. **AD-19 nói theme là hàm của state và đồng bộ đa tab**, nhưng cơ chế đặt theme duy nhất được mô
    tả là script nội tuyến chạy **một lần trước lần vẽ đầu**. Khi tab A đổi theme và tab B nhận
    `session-changed`, đường hợp lệ nào đặt lại thuộc tính trên `<html>`? Có thể đã ngầm hiểu là một
    phần của lượt render, nhưng `<html>` nằm ngoài gốc render của app.
