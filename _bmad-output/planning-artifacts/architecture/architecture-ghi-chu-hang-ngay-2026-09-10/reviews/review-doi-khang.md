# Review đối kháng — ARCHITECTURE-SPINE "Ghi chú hàng ngày"

- Ngày: 2026-09-10
- Đối tượng: `../ARCHITECTURE-SPINE.md`
- Vai: reviewer đối kháng (giả định hai lập trình viên độc lập, mỗi người đọc spine đúng từng chữ,
  không nói chuyện với nhau)

## Verdict

Spine chặt về **hướng phụ thuộc** và **thứ tự ghi**, nhưng hở về **hình dạng bản ghi**, **quyền sở
hữu bản nháp / dải băng / lastBackupAt**, và **mọi thứ liên quan tới thời gian đồng thời** — hai
người tuân thủ đúng từng chữ vẫn dựng ra hai bản không ghép được.

Quy ước mức: **Chí mạng** (dữ liệu sai/mất, không phát hiện được) · **Nặng** (hai module không ghép,
phải viết lại) · **Trung bình** (lệch hành vi, sửa cục bộ được).

---

## G-1 · Hình dạng bản tin BroadcastChannel không được định nghĩa — **Chí mạng**

AD-7 bắt "phát một tin lên `BroadcastChannel('ghichu')`" và cấm "đoán nội dung thay đổi từ chính bản
tin". Spine không nói bản tin *là gì*.

Kịch bản: Story A (FR-20, `adapters/broadcast.js`) gửi `postMessage('changed')` — đúng tinh thần
AD-7, vì bản tin không mang nội dung. Story B (FR-17, đổi `ghichu.theme` và `ghichu.lastBackupAt`)
cần biết *loại* thay đổi để không nạp lại IndexedDB một cách vô nghĩa, nên gửi
`postMessage({ kind: 'session', key: 'ghichu.theme' })` và ở đầu nhận viết
`if (msg.kind === 'note') reloadNotes()`. Cả hai đều hợp lệ theo AD-7.

Hậu quả: tab nhận được `'changed'` từ A rơi vào nhánh `msg.kind === undefined` → **im lặng không nạp
lại**. Ghi chú vừa chốt ở tab 1 không bao giờ xuất hiện ở tab 2, và không có lỗi nào để bắt. Đúng
kiểu hỏng mà AD-7 tuyên bố nó ngăn.

Bịt: **AD mới** định nghĩa nguyên văn schema bản tin (ví dụ
`{ v: 1, scope: 'notes' | 'session', at: <ISO có offset>, tabId: <uuid> }`), quy định đầu nhận phải
bỏ qua bản tin có `v` lạ, và nói rõ `scope` được phép dùng để chọn *nguồn nào cần nạp lại* nhưng
không được dùng để suy ra *nội dung*.

## G-2 · `createdAt` có offset + so sánh chuỗi = thứ tự sai — **Chí mạng**

AD-4 bắt `createdAt` là ISO-8601 **có offset**. AD-6 bắt "sắp xếp giảm dần theo `createdAt`". Quy ước
"So sánh ngày: chuỗi `yyyy-MM-dd`".

Kịch bản: Dev A viết `core/query.js`: `notes.sort((x, y) => y.createdAt.localeCompare(x.createdAt))`
— đúng từng chữ AD-4 (không quy đổi múi giờ) và đúng quy ước "so sánh chuỗi". Dev B viết
`core/backup.js` gộp file nạp rồi sắp lại bằng `new Date(y.createdAt) - new Date(x.createdAt)` —
cũng không sai chữ nào, vì AD-4 chỉ cấm quy đổi khi **hiển thị và lọc ngày**, không nói gì về sắp
xếp.

Hậu quả cụ thể: nạp một file xuất từ máy đặt UTC. Ghi chú `2026-09-03T17:00:00+00:00` (tức 00:00
ngày 04 giờ VN) so chuỗi thì **đứng trước** `2026-09-03T16:40:12+07:00`, nhưng so theo thời điểm
thật thì **đứng sau**. Lưới ở tab đang mở (sắp bằng A) và lưới sau khi F5 (nếu ai đó dùng đường của
B) cho hai thứ tự khác nhau trên cùng một dữ liệu. Không test nào ở `core/` bắt được nếu fixture chỉ
có `+07:00`.

Bịt: **siết AD-4**: thêm trường `createdAtLocalDate` (`yyyy-MM-dd`, cắt từ chính chuỗi) dùng cho lọc
và nhóm; và quy định **thứ tự duy nhất** là so sánh theo thời điểm tuyệt đối (`Date.parse`), tie-break
bằng `id` để ổn định. Ghi luôn: hai phép so sánh này là hai việc khác nhau, không được thay thế nhau.

## G-3 · Hai chủ sở hữu của `ghichu.draft`; debounce đua với lúc chốt — **Chí mạng**

AD-1 cấm view giữ state riêng. AD-3 đặt bản nháp ở `localStorage`. AD-7 bắt đổi bản nháp cũng phải
phát tin. AD-8 bắt "ghi trước, đổi state sau". Spine **không** nói ai sở hữu chuỗi đang gõ, cũng
không nói gì về debounce ngoài trần 1 giây của FR-3.

Kịch bản đua (một tab, đủ để mất chữ):
1. Người dùng gõ, `composer.js` đặt hẹn debounce 400 ms để ghi `ghichu.draft = "họp lúc 3h"`.
2. Ở ms thứ 200, người dùng bấm chốt. Action `chotGhiChu` ghi IndexedDB → đổi state → xóa
   `ghichu.draft` → phát tin. Đúng AD-8 từng bước.
3. Ở ms thứ 400, hẹn debounce cũ nổ, ghi lại `ghichu.draft = "họp lúc 3h"`.
4. Tab kia nhận tin ở bước 2, nạp lại theo AD-7, thấy `ghichu.draft` (đã bị bước 3 hồi sinh) và đổ
   vào ô soạn. Người dùng có một ghi chú đã chốt **và** một bản nháp ma giống hệt → chốt lần nữa →
   trùng lặp. Không AD nào bị vi phạm.

Kịch bản hai chủ sở hữu: Dev A đọc AD-1 chặt, đưa `draft` vào state, mỗi phím gõ là một action → theo
AD-8 phải **ghi localStorage xong mới đổi state** → ô soạn trễ theo I/O, và theo AD-7 mỗi phím phát
một bản tin lên BroadcastChannel. Dev B đọc "adapter không được đổi state" và để `<textarea>` là
nguồn sự thật của chuỗi đang gõ, chỉ đồng bộ vào state lúc debounce — lập luận: chuỗi chưa chốt không
phải "state", nó là DOM. Hai người dựng hai vòng đời khác nhau cho cùng một ô nhập.

Kịch bản đa tab tệ hơn: AD-7 nói tab nhận tin phải "nạp lại từ nguồn sự thật rồi render lại". Nếu
`draft` nằm trong phạm vi đó thì tab 2 đang gõ dở sẽ bị **ghi đè bằng bản nháp của tab 1**. Nếu
không nằm trong phạm vi thì AD-7 bị vi phạm nguyên văn ("đổi bản nháp ... phải phát tin" để làm gì
nếu không ai nạp lại?).

Bịt: **AD mới về vòng đời bản nháp** — (a) chuỗi đang gõ nằm trong state, ghi `localStorage` là hiệu
ứng phụ debounce một chiều, **không** đi qua đường AD-8; (b) `chotGhiChu` phải **hủy hẹn debounce
đang treo trước khi ghi**, và việc xóa draft là bước cuối không thể bị hẹn cũ đảo ngược (dùng số thứ
tự tăng dần: chỉ ghi draft nếu `seq` còn là mới nhất); (c) nói rõ **draft là dữ liệu của riêng từng
tab hay dùng chung** — khuyến nghị: riêng từng tab (`sessionStorage` hoặc key có `tabId`), và khi đó
sửa AD-3 vì nó chốt cứng đúng ba key.

## G-4 · AD-3 (đúng ba key) mâu thuẫn AD-10 (lần khởi động đầu tiên) — **Nặng**

AD-10: "gọi `navigator.storage.persist()` ở **lần khởi động đầu tiên**" và "nếu `persist()` bị từ
chối, ngưỡng FR-17 hạ từ 7 xuống 3 ngày". AD-3: `localStorage` giữ **đúng ba key, không nhiều hơn**,
và ba thứ đó không bao giờ vào IndexedDB.

Không có chỗ nào hợp lệ để lưu "đã hỏi persist chưa" và "kết quả persist là gì".

Dev A thêm `ghichu.persistAsked` → vi phạm AD-3 nguyên văn (và một reviewer sẽ bắt bỏ). Dev B suy ra
"lần khởi động đầu tiên" từ "mảng notes rỗng" → người dùng xóa hết ghi chú là app hỏi lại persist; và
để biết ngưỡng 7 hay 3 ngày, B gọi `navigator.storage.persisted()` mỗi lần khởi động — một API AD-10
không nhắc tới, kết quả có thể khác kết quả `persist()`. Hai bản cho hai ngưỡng nhắc sao lưu khác
nhau trên cùng một máy.

Bịt: **siết AD-3** thành "đúng bốn key" với `ghichu.persist` (`granted|denied|unknown`), **hoặc**
siết AD-10 thành "gọi `persist()` ở **mọi** lần khởi động (idempotent), ngưỡng đọc trực tiếp từ
`navigator.storage.persisted()` tại thời điểm dựng dòng nhắc, không lưu trữ".

## G-5 · Hai chủ sở hữu dải băng, và sơ đồ phụ thuộc bị Capability Map phá — **Nặng**

AD-8: lỗi đi ra "dải băng dùng chung — **nơi duy nhất** lỗi được phép xuất hiện". AD-10 lại đẩy vào
đúng dải băng đó một **cảnh báo trước ngưỡng** (không phải lỗi). FR-17 đẩy vào **dòng nhắc sao lưu**.
Không có AD nào nói ai sở hữu ô đó, luật ưu tiên, hay việc xếp hàng.

Kịch bản: người dùng chốt ghi chú lúc `usage/quota = 0.83` và đã 8 ngày không sao lưu. Action phát ba
thứ gần như cùng lúc: (1) xác nhận đã lưu, (2) cảnh báo 0.80, (3) nhắc sao lưu. Dev A (`view/banner.js`)
làm last-wins → người dùng chỉ thấy dòng nhắc sao lưu, cảnh báo sắp hết đĩa **biến mất**. Dev B làm
hàng đợi 3 giây/thông điệp → cảnh báo hiện sau khi người dùng đã rời đi. Cả hai đều "chỉ hiển thị".

Nặng thêm: Capability Map ghi "F1 · Hết dung lượng (FR-19) → `adapters/quota.js` + `view/banner.js`",
tức là một cạnh **adapters → view** không tồn tại trong sơ đồ mermaid ở đầu tài liệu và bị AD-1 cấm
("adapter không được đổi state — nó trả dữ liệu về cho action"). Dev A đọc bảng và cho quota adapter
gọi thẳng banner; dev B đọc sơ đồ và bắt kết quả `estimate()` đi qua một action. Hai đường đổi state
mâu thuẫn cho cùng một sự kiện.

Bịt: **AD mới về dải băng** — dải băng là một trường trong state (`banner: {level, code, text}`),
chỉ action ghi vào, thang ưu tiên cố định `QUOTA_FAIL > QUOTA_WARN > BACKUP_NUDGE > SUCCESS`, và sửa
Capability Map thành `adapters/quota.js → action → view/banner.js`.

## G-6 · Sửa/xóa đa tab: hồi sinh ghi chú đã xóa — **Nặng**

AD-7 không khóa tab và cấm đoán nội dung; AD-6 giữ toàn bộ notes trong RAM; AD-1 cấm view giữ state
riêng; bản ghi không có trường phiên bản.

Kịch bản: tab 1 và tab 2 cùng mở. Ở tab 2 người dùng mở hộp thoại sửa ghi chú `X`. Ở tab 1 người dùng
xóa `X` → IndexedDB xóa → phát tin. Tab 2 nạp lại, `X` biến mất khỏi state (hộp thoại đang mở thì
sao? AD-1 nói view không giữ state riêng, nên nội dung đang sửa cũng là state — nhưng chẳng AD nào
nói phải làm gì với hộp thoại trỏ vào một `id` không còn tồn tại). Người dùng bấm Lưu. `suaGhiChu`
gọi adapter — dev A dùng `put()` (upsert, mặc định tự nhiên của IndexedDB) → **ghi chú đã xóa sống
lại**; dev B kiểm tra tồn tại trước rồi ném `code=DB` → người dùng mất đoạn vừa gõ, kèm microcopy
không có trong EXPERIENCE.md. Cả hai đều không vi phạm AD nào.

Bịt: **AD mới về ghi có điều kiện**: mọi ghi sửa/xóa phải kiểm `id` còn tồn tại trong cùng một
transaction IndexedDB; `id` không còn → lỗi `code=GONE` với microcopy riêng, hộp thoại đang mở phải
đóng và giữ lại chữ người dùng trong ô soạn. Và: quy định bản ghi có `updatedAt` để phát hiện ghi đè
chéo tab (xem G-7).

## G-7 · Hình dạng bản ghi trong IndexedDB không được định nghĩa — **Nặng**

Spine định nghĩa hình dạng **file** (AD-11: `{id, createdAt, text}`) và nhắc `textFolded` (AD-5),
nhưng chưa bao giờ định nghĩa **bản ghi trong kho**.

Kịch bản: Dev A (F1/F3) lưu `{id, createdAt, text, textFolded}`. Dev B (F3 sửa, FR-10) thấy cần biết
"đã sửa lúc nào" cho hộp thoại và cho phát hiện xung đột, lưu thêm `updatedAt`. AD-4 chỉ cấm đổi
`createdAt`, nên B không sai. Kết quả: `core/backup.js` của A xuất `notes.map(n => n)` → file lọt
`textFolded` và `updatedAt`, vi phạm AD-11 mà không ai để ý cho tới khi bản sau siết validate và
**từ chối cả file** (AD-11: thiếu/khác là từ chối toàn bộ) → người dùng mất đường khôi phục.
Ngược lại nếu A viết validate theo kiểu "phải đúng đúng ba trường", file của B bị từ chối ngay.

Chú ý thêm: AD-11 nói từ chối khi "thiếu trường bắt buộc", **không** nói gì về trường **thừa**. Hai
cách hiểu đều hợp lệ: "bỏ qua trường lạ" và "từ chối vì không đúng hợp đồng". Đây là điểm tương thích
tiến/lùi của toàn bộ F5.

Bịt: **AD mới**: khai báo nguyên văn record trong kho, đánh dấu trường nào là dẫn xuất (không xuất),
và quy định rõ chính sách trường lạ khi nạp (khuyến nghị: bỏ qua trường lạ, từ chối khi thiếu trường
bắt buộc hoặc sai kiểu) — cùng một hàm `toBackupNote(record)` duy nhất ở `core/backup.js` là nơi duy
nhất dựng phần tử `notes` của file.

## G-8 · Nạp lại file: gộp theo RAM hay theo đĩa? Và có phải một transaction không? — **Nặng**

AD-6: "Đọc IndexedDB **chỉ** xảy ra ở đúng hai chỗ: lúc khởi động, và khi BroadcastChannel báo có
thay đổi." AD-11: "Nạp thành công là phép gộp theo `id`: đã có thì bỏ qua, chưa có thì thêm."

Hai cách hiểu đều hợp lệ:
- Dev A: gộp đối chiếu với **mảng trong RAM** (đúng từng chữ AD-6).
- Dev B: gộp đối chiếu với **IndexedDB** trong một transaction (đúng tinh thần AD-3 "IndexedDB là
  nguồn sự thật duy nhất").

Kịch bản hỏng: tab 1 vừa chốt ghi chú `X` lúc 10:00:00. Tab 2 chưa xử lý xong bản tin (hoặc bản tin
rơi vào lúc tab 2 đang bận), người dùng ở tab 2 nạp một file cũng chứa `X` (cùng `id`, `text` cũ hơn
sau khi đã sửa). Bản A không thấy `X` trong RAM → `add`/`put` → **ghi đè bản đã sửa bằng bản cũ trong
file**, đúng thứ AD-11 tuyên bố "không bao giờ ghi đè". Bản B thấy `X` trên đĩa → bỏ qua. Hai kết quả
dữ liệu khác nhau từ cùng một thao tác người dùng.

Hỏng thứ hai: AD-11 nói "từ chối cả file, không ghi một byte nào" cho khâu **validate**, nhưng không
nói khâu **ghi** phải nguyên tử. Dev A ghi bằng vòng lặp `put` từng bản ghi; hết quota ở bản ghi thứ
300/500 → `QuotaExceededError` → theo AD-8 "state không đổi", nhưng **đĩa đã đổi**: 299 ghi chú đã
vào kho mà state (và người dùng) không biết. AD-8 bị phá trong im lặng, và sau lần F5 tiếp theo số
ghi chú tự nhiên nhảy lên.

Bịt: **siết AD-11**: gộp phải chạy trong **một** transaction `readwrite` duy nhất, đối chiếu `id` đọc
từ chính transaction đó (bổ sung ngoại lệ tương ứng vào AD-6: đọc trong transaction của thao tác nạp
là chỗ đọc thứ ba, hợp lệ), lỗi giữa chừng → `abort()` toàn bộ. Sau khi commit mới đổi state và phát
tin.

## G-9 · `ghichu.lastBackupAt`: hai chủ sở hữu, và phép so sánh sai — **Nặng**

AD-11: "`exportedAt` của file được ghi vào `ghichu.lastBackupAt` khi nạp, **nếu nó mới hơn** giá trị
đang có." FR-15 (xuất) hiển nhiên cũng ghi key này. Hai đường ghi, không AD nào nói ai là chủ.

Sai cụ thể: `exportedAt` là ISO **có offset** (AD-4/AD-11), và quy ước duy nhất về so sánh trong
spine là "so sánh chuỗi". Dev A viết `if (fileExportedAt > current)` — với
`2026-09-09T08:00:00+00:00` (15:00 giờ VN) so `2026-09-09T09:00:00+07:00` (02:00 giờ VN), so chuỗi
cho kết quả **ngược** với thời điểm thật. Dev B dùng `Date.parse`. Hai bản cho hai ngày sao lưu gần
nhất khác nhau → dòng nhắc FR-17 (7 ngày, hoặc 3 ngày theo AD-10) bật/tắt khác nhau trên cùng dữ
liệu.

Thêm: khoảng cách "7 ngày" tính thế nào? A lấy `lastBackupAt.slice(0,10)` rồi trừ chuỗi ngày (theo
AD-4 "so sánh chuỗi"); B lấy `Date.now() - Date.parse(...)` chia 86400000. Lệch một ngày ở ranh giới
nửa đêm và khi file đến từ máy khác múi giờ.

Bịt: **AD mới**: `ghichu.lastBackupAt` chỉ được ghi bởi một hàm duy nhất `core/backup.js#markBackedUp`;
mọi so sánh thời điểm dùng `Date.parse` (tuyệt đối), mọi so sánh **ngày lịch** dùng chuỗi
`yyyy-MM-dd` — và AD-4 phải nói rõ hai phép này khác nhau (xem G-2).

## G-10 · `fold()` đúng nhưng `textFolded` là ảnh chụp cũ — **Trung bình → Nặng nếu đổi fold**

AD-5 buộc một hàm duy nhất và tính lại `textFolded` "ở mọi lần ghi". Nhưng `textFolded` được **lưu**,
còn chuỗi tìm kiếm được fold **tại lúc gõ**. Khi `fold()` đổi (thêm xử lý khoảng trắng, dấu câu,
ký tự zero-width dán từ Word), mọi bản ghi cũ vẫn mang kết quả của hàm cũ. Không AD nào bắt rebuild.

Cặp cụ thể hơn, xảy ra ngay ở v1: AD-5 không nói gì về **khoảng trắng và dấu câu**. Dev A viết
`fold` gộp khoảng trắng liên tiếp và `trim` (rất hợp lý cho tìm kiếm). Dev B viết `fold` đúng bốn
bước AD-5 liệt kê, không hơn. Người dùng dán "họp   lúc 3h" rồi gõ "hop luc" — bản A ra kết quả, bản
B không. Cả hai đều "dùng đúng một hàm duy nhất cho cả hai đầu"; vấn đề là **hai người viết hai hàm
duy nhất khác nhau**, và test ở `core/` của mỗi người đều xanh.

Bịt: **siết AD-5** — liệt kê đầy đủ và đóng (không "vân vân") các bước của `fold`, kèm bộ ca kiểm
thử vàng bắt buộc (đ/Đ, tổ hợp NFD, khoảng trắng, ký tự vô hình); thêm `foldVersion` vào bản ghi và
quy định khởi động thấy `foldVersion` cũ → tính lại `textFolded` cho toàn kho trong một transaction.

## G-11 · Trần 20.000 ký tự và trần 50 kết quả: chặn ở đâu — **Trung bình**

`limits.js` giữ các hằng số, nhưng không AD nào nói **ai áp**.

- 20.000 ký tự: dev A chặn ở `composer.js` (`maxlength`), dev B chặn trong action. Đường **nạp file**
  không đi qua cả hai — AD-11 liệt kê ba lý do từ chối và độ dài không nằm trong đó. Kết quả: file
  nạp vào có ghi chú 60.000 ký tự, hợp lệ theo AD-11, phá NFR-1 và phá giả định RAM của AD-6.
- 50 kết quả: `query.js` cắt còn 50 rồi trả về, hay trả đủ và `grid.js` chỉ vẽ 50? FR-14 cần bảng
  trạng thái ("hiển thị 50 / 137"). Bản cắt trong core làm mất tổng số → hai bản hiển thị hai con số.

Bịt: **AD mới**: mọi ràng buộc miền được áp ở **một** hàm `core/state.js#validateNote`, gọi từ mọi
đường vào (chốt, sửa, nạp file); `query.js` trả `{ items: <đã cắt>, total: <số khớp> }`.

## G-12 · Xóa: xóa cứng hay tombstone — **Trung bình**

AD-11 "không bao giờ xóa, không bao giờ ghi đè" khi gộp. Hệ quả người dùng không lường: xóa một ghi
chú, rồi nạp lại bản sao lưu cũ → nó **quay về**. Dev A chấp nhận (đúng từng chữ). Dev B coi đó là
bug, thêm tombstone `{id, deletedAt}` vào kho — và vì AD-11 khóa hình dạng file ở ba trường, tombstone
không xuất được, nên hai máy của cùng một người cho hai kết quả khác nhau; tệ hơn, mọi bản ghi
tombstone lọt vào `notes` array của AD-6 nếu dev A đọc kho của dev B.

Bịt: chốt một phía trong **AD-11** ("v1 xóa cứng; hồi sinh khi nạp file cũ là hành vi có chủ ý, phải
nói trong microcopy hộp thoại nạp") và cấm tombstone ở v1.

## G-13 · Theme: state hay DOM — **Trung bình**

`ghichu.theme` là session store (AD-3), AD-7 bắt đổi theme phải phát tin, AD-1 cấm view giữ state
riêng và cấm view "sửa DOM ngoài lượt render".

Dev A: theme nằm trong state, action `datTheme` ghi localStorage rồi đổi state rồi phát tin; render
đặt `data-theme` trên `<html>` — nhưng `<html>` nằm ngoài gốc render của app, nên A phải phá quy tắc
"chỉ sửa DOM trong lượt render" hoặc thêm một cửa hậu. Dev B: `view` toggle class trực tiếp và ghi
localStorage, không đụng state — nhanh, không nháy, nhưng theme không còn là hàm của state, và tab
kia nhận tin (G-1) không biết phải nạp lại gì.

Bịt: nói rõ trong **AD-1** rằng thuộc tính trên `<html>`/`<body>` là một phần của lượt render và
adapter/view nào được phép ghi; hoặc thêm port `documentTheme` để giữ đúng ports-and-adapters.

## G-14 · Chốt = hai lần ghi vào hai kho, không nguyên tử — **Trung bình → Nặng**

AD-3 tách kho theo vai trò. `chotGhiChu` phải: ghi note vào IndexedDB **và** xóa `ghichu.draft` khỏi
localStorage. AD-8 chỉ nói "ghi trước, đổi state sau" — số ít, một lần ghi.

Kịch bản: ghi IndexedDB thành công, tab bị đóng/crash trước khi xóa draft → lần mở sau khôi phục bản
nháp giống hệt ghi chú vừa chốt → người dùng chốt lần nữa → hai ghi chú trùng, khác `id`, AD-11 không
gộp được vì gộp theo `id`.
Thứ tự ngược lại (xóa draft trước) thì crash làm **mất chữ** — đúng thứ AD-8 tồn tại để ngăn.

Bịt: **siết AD-8** cho thao tác đa kho: thứ tự bắt buộc là ghi nguồn sự thật (IndexedDB) → đổi state
→ dọn draft (best-effort, thất bại không rollback) → phát tin; và khi khởi động, nếu draft trùng khít
`text` của ghi chú mới nhất trong vòng N giây thì bỏ draft.

---

## Bảng tổng hợp

| # | Lỗ hổng | Mức | Bịt bằng |
| --- | --- | --- | --- |
| G-1 | Schema bản tin BroadcastChannel không định nghĩa | Chí mạng | AD mới |
| G-2 | Sắp xếp/so sánh `createdAt` có offset bằng chuỗi | Chí mạng | Siết AD-4 + AD-6 |
| G-3 | Hai chủ sở hữu draft; debounce đua với chốt; draft đa tab | Chí mạng | AD mới (vòng đời draft) |
| G-4 | AD-3 "đúng ba key" chặn AD-10 "lần khởi động đầu tiên" | Nặng | Siết AD-3 hoặc AD-10 |
| G-5 | Hai chủ sở hữu dải băng; Capability Map tạo cạnh adapters→view | Nặng | AD mới + sửa map |
| G-6 | Sửa/xóa chéo tab hồi sinh ghi chú đã xóa | Nặng | AD mới (ghi có điều kiện) |
| G-7 | Hình dạng bản ghi trong kho chưa định nghĩa; trường thừa khi nạp | Nặng | AD mới |
| G-8 | Gộp file theo RAM hay đĩa; gộp không nguyên tử | Nặng | Siết AD-11 (+ AD-6) |
| G-9 | `lastBackupAt` hai chủ sở hữu, so sánh chuỗi có offset | Nặng | AD mới |
| G-10 | `fold()` chưa đóng; `textFolded` không có version | TB→Nặng | Siết AD-5 |
| G-11 | Trần ký tự/kết quả áp ở đâu; đường nạp file bỏ qua | TB | AD mới |
| G-12 | Xóa cứng vs tombstone | TB | Chốt trong AD-11 |
| G-13 | Theme là state hay DOM | TB | Làm rõ AD-1 |
| G-14 | Chốt ghi hai kho, không nguyên tử | TB→Nặng | Siết AD-8 |

## Khuyến nghị thứ tự xử lý

1. G-7 rồi G-2 — mọi thứ khác đứng trên hình dạng bản ghi và ngữ nghĩa thời gian.
2. G-1 + G-3 + G-6 — cụm đa tab; giải riêng lẻ sẽ phải làm lại.
3. G-8 + G-9 — cụm sao lưu.
4. G-4, G-5, G-14 — biên vận hành và báo lỗi.
5. Phần còn lại có thể xử lý ở mức story.
