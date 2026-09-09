---
title: "Addendum PRD: Ghi chú hàng ngày"
status: final
created: 2026-09-08
updated: 2026-09-09
parent: prd.md
---

# Addendum — PRD Ghi chú hàng ngày

Những gì [`prd.md`](./prd.md) cố ý không chứa, theo đúng thứ tự bên dưới: danh sách ràng buộc gửi
thẳng cho `bmad-architecture` (§1), **các phương án đã bị loại và lý do loại** (§2), đường đi dẫn
tới bốn nguyên tắc thiết kế (§3), và giới hạn của nền bằng chứng (§4).

PRD nói *cái gì phải đúng*. Tài liệu này nói *vì sao không phải cái khác* — thứ mà sáu tháng nữa sẽ
không ai còn nhớ, và thiếu nó thì mọi quyết định trong PRD sẽ bị đem ra cãi lại từ đầu.

> Khảo sát thị trường, đối thủ và bằng chứng người dùng nằm ở
> [`addendum.md` của brief](../../briefs/brief-sticky-notes-2026-09-08/addendum.md), không lặp lại ở
> đây. Giới hạn của nền bằng chứng đó được ghi ở §4 bên dưới.

---

## 1. Ràng buộc gửi cho Architecture

Mười điều dưới đây phải được biết **trước** khi chọn cách lưu trữ, không phải xử lý ở lớp giao diện.
Đọc ràng buộc 6 trước — tài liệu này xếp nó là ràng buộc nghiêm trọng nhất.

| # | Ràng buộc | Đến từ |
|---|---|---|
| 1 | **Chuẩn hóa tiếng Việt là việc của tầng dữ liệu.** Tìm kiếm phải khớp `phan quyen` với `Phân quyền`. Chuẩn hóa lúc so chuỗi trên toàn bộ dữ liệu sẽ không đạt NFR-2 khi số ghi chú lớn — nhiều khả năng cần lưu sẵn dạng đã chuẩn hóa. | FR-12, NFR-6 |
| 2 | **Tự lưu ≤ 1 giây** kể từ lúc gõ, chịu được đóng tab đột ngột và trình duyệt crash. Ràng buộc cứng, không phải mục tiêu. *(Không bao gồm mất điện đột ngột — không API trình duyệt nào bảo đảm được điều đó, và cũng không kiểm chứng được.)* | FR-3 |
| 3 | **Tra cứu ≤ 200 ms với 2.000 ghi chú**, cho cả lọc ngày lẫn tìm chữ, kể cả khi kết hợp. | NFR-2 |
| 4 | **Định danh ổn định cho mỗi ghi chú**, sống sót qua xuất/nạp file. Cơ chế gộp khi nạp lại phụ thuộc hoàn toàn vào nó. | FR-16 |
| 5 | **Định dạng file sao lưu phải có phiên bản** và tương thích ngược. Bản app tháng sau vẫn phải nạp được file hôm nay. Định dạng cụ thể chưa chốt — đây là quyết định của Architecture. | FR-15 |
| 6 | **Địa chỉ (origin) của app phải cố định vĩnh viễn.** Dữ liệu trong trình duyệt gắn với origin; đổi tên miền hoặc đổi đường dẫn là **mất toàn bộ ghi chú**, im lặng. Đây là ràng buộc vận hành nghiêm trọng nhất của mô hình host tĩnh. | NFR-8 |
| 7 | **Giới hạn dung lượng của trình duyệt phải được đo và cảnh báo, không được thất bại im lặng.** Tính ngân sách từ trần 20.000 ký tự mỗi ghi chú × mốc 2.000 ghi chú. | FR-19, NFR-3 |
| 8 | **Nhiều tab không được ghi đè nhau.** PRD chỉ yêu cầu kết quả (không mất dữ liệu, không im lặng); cơ chế — khóa, đồng bộ giữa tab, hay phát hiện và cảnh báo — là quyết định của Architecture. | FR-20 |
| 9 | **Thời điểm tạo gán lúc chốt**, ghi theo giờ địa phương, và giữ nguyên khi nạp lại trên máy khác. Không được chuẩn hóa về UTC rồi hiển thị lại theo múi giờ máy đang chạy — làm vậy sẽ khiến bộ lọc ngày trả sai ngày sau khi khôi phục, tức phá đúng cái neo của sản phẩm. | FR-2, FR-13, FR-16 |
| 10 | **Bản nháp là một thực thể riêng, không phải ghi chú.** Nó được lưu, nhưng không có thời điểm tạo, không vào dòng ghi chú, không tìm được, không vào file sao lưu. | Glossary, FR-3, FR-15 |

**Một gợi ý về đường mở rộng, không phải yêu cầu:** brief nói nếu sau này tác giả muốn dùng nhiều
máy thì không phải đập đi làm lại. Ràng buộc 4 (định danh ổn định) và 5 (định dạng có phiên bản) đã
làm sẵn phần lớn việc đó. Không cần thiết kế thêm gì cho đồng bộ ở giai đoạn này.

---

## 2. Các phương án đã bị loại

Mười một mục dưới đây theo cùng một khuôn: **đã chọn** (thường kèm mã FR/NFR tương ứng) → **đã
loại** → **vì sao loại** → **cái mất** phải chấp nhận. Mỗi mục đọc được độc lập, và PRD tham chiếu
thẳng tới số mục.

### 2.1 Sửa ghi chú — loại "chỉ nối thêm vào cuối"

**Đã chọn:** sửa tự do *(FR-10)*.

**Đã loại:** append-only — ghi chú là cuộn giấy, chữ đã viết không sửa được.

Append-only vốn hấp dẫn: nó làm ghi chú trở thành *bản ghi*, hợp với việc dấu thời gian là cái neo.
Nó bị loại **sau** khi đã cân nhắc nghiêm túc trong tình huống xác minh với sếp, vì cái giá hàng
ngày quá lớn — gõ sai một chữ cũng không sửa được.

**Cái mất, đã chấp nhận:** sản phẩm không chứng minh được nội dung một ghi chú có bị sửa sau ngày
tạo hay không. Đây là lý do PRD gọi sản phẩm là *trợ nhớ có mốc thời gian*, không phải *bằng chứng*.

### 2.2 Bằng chứng và tính toàn vẹn — loại ba trong bốn đường

Khi công việc xác minh lộ ra, có bốn đường đi:

| | Đường | Vì sao loại |
|---|---|---|
| 1 | Append-only cho tất cả | Xem 2.1 |
| 2 | Sửa tự do + hiện "đã sửa lần cuối lúc..." | Chỉ nói *có sửa*, không nói *sửa gì*. Với người đang nghi ngờ thì gần như vô dụng — trả tiền UI mà không mua được lòng tin |
| 3 | **Sửa tự do, chấp nhận đây là trợ nhớ** | **Đã chọn** |
| 4 | Hai loại ghi chú: thường và "khóa" | Đúng nhu cầu nhất, nhưng **nó là phân loại** — bị NT-2 loại ở tầng một ghi chú |

**Điểm đáng giữ lại:** hành vi hiện tại của người dùng *đã* phân loại — tab `new N` cho ghi chú vứt
đi, tab `dd-MM-yyyy` cho biên bản họp. Chọn đường 3 làm hai loại đó **hết khác nhau về yêu cầu**,
nên NT-1 và NT-2 đứng vững. Nếu về sau ghi chú họp lại cần độ toàn vẹn cao hơn, tình huống này sẽ
quay lại, và đường 4 là câu trả lời phải cân nhắc lần nữa — kèm cái giá của nó với NT-2.

### 2.3 Phanh cho hành động xóa — loại hoàn tác

**Đã chọn (A):** hộp thoại xác nhận *(FR-11)*.

| | Phương án | Vì sao loại |
|---|---|---|
| B | Xóa ngay + hoàn tác trong 5 giây | Không loại vì sai, mà vì đắt hơn. **Đây là kế hoạch B đã định sẵn** — xem NOTE FOR PM ở FR-11 |
| C | Không phanh | Rẻ nhất, nhưng đặt cạnh "mất dữ liệu là rủi ro số một" thì không đứng được |

**Cái mất, đã chấp nhận:** nhược điểm này được ghi nhận ngay lúc chọn — sau vài tuần, hộp thoại xác
nhận sẽ bị bấm theo phản xạ và không còn bảo vệ được gì.

**Lưu ý về cách viện dẫn nguyên tắc:** "không có hoàn tác" là đánh đổi **chi phí**, không phải điều
NT-2 loại. NT-2 nói về ba hành động chạm vào ghi chú; hoàn tác là cách hủy một hành động, không phải
hành động thứ tư. §8 của PRD xếp nó vào đúng nhóm "bị chi phí loại" vì lý do này.

### 2.4 Khung nhìn mặc định — loại "hiện toàn bộ" và "trống trơn"

**Đã chọn (B):** chỉ hôm nay *(FR-6)*.

| | Phương án | Vì sao loại |
|---|---|---|
| A | Toàn bộ ghi chú, cuộn xuống là ra hết | Về bản chất vẫn là "đối diện cả đống", chỉ đổi từ chiều ngang (tab) sang chiều dọc. Đúng thứ đã giết Notepad++ |
| C | Trống trơn, chỉ có ô gõ | Mất khả năng nhìn thấy việc đã ghi trong ngày — mà đó lại là công dụng thứ hai của khung nhìn mặc định |

**Phương án A chính là điều brief mô tả** (*"card mới nằm trên, card cũ lùi xuống dưới"*). Việc PRD
đi khác brief ở đây được ghi thành callout ngay tại FR-6, không để lặng lẽ.

**Phép thử đã chạy trước khi chốt:** người dùng xác nhận chỉ xem lại ghi chú cũ khi *đang cần xác
minh một thông tin cụ thể*, không có thói quen "liếc lại cho biết". Nếu thói quen đó tồn tại, phương
án đã chọn sẽ tính phí người dùng mỗi ngày và có lẽ sai.

### 2.5 Cử chỉ kết thúc ghi chú — loại chuột

**Đã chọn:** `Ctrl+Enter` *(FR-4)*.

Loại "click ra ngoài" và "cả hai". Lý do: ghi chú họp được gõ ngay tại chỗ, liên tục — mỗi lần tay
rời bàn phím là một lần mất nhịp. `Enter` buộc phải là xuống dòng vì ghi chú nhiều dòng, nên không
dùng được cho việc chốt.

### 2.6 Thời điểm lưu — loại "chỉ lưu khi chốt"

**Đã chọn:** tự lưu liên tục *(FR-3)*.

Loại "chỉ lưu khi `Ctrl+Enter`". Nó đơn giản hơn nhiều và có ranh giới rõ ràng, nhưng **mâu thuẫn
trực tiếp với câu Vision trụ cột**: khoảng cách sẽ không bằng không mà bằng "cho tới khi người dùng
nhớ bấm". Kịch bản hỏng: gõ nửa biên bản họp, đóng nhầm tab, mất sạch.

### 2.7 Phạm vi tìm kiếm — loại "tìm trong những gì đang hiện"

**Đã chọn:** tìm toàn bộ *(FR-12)*.

Loại phương án chỉ tìm trong khung nhìn đang hiện, vì nó gần như luôn sai ý định: **người ta tìm
chính vì thứ mình cần không ở trước mặt.**

Đây cũng là chỗ hai câu trả lời của người dùng thoạt nhìn mâu thuẫn — "bộ lọc chồng lên nhau" và
"tìm toàn bộ". Lối thoát là phân biệt **trạng thái mặc định** với **điều kiện do người dùng đặt**,
và nó được viết hẳn thành bảng trong FR-14 vì đây đúng là loại chi tiết mà mỗi người đọc sẽ hiểu một
kiểu.

### 2.8 Sao lưu — loại "xuất ra để đọc"

**Đã chọn:** file sao lưu máy đọc được, có nạp lại *(FR-15, FR-16)*.

Loại Markdown/text thuần chỉ để đọc. Lý do: brief đưa xuất dữ liệu vào MVP **để chống mất dữ liệu**,
mà xuất không nạp lại được thì không phải sao lưu — nó là một cái két sắt không có chìa. Kiểu thất
bại tệ nhất là *tưởng mình được bảo vệ, trong khi thực ra không*.

**Cái mất, đã chấp nhận:** nạp lại là một FR thật, tốn công thật, và là phần mở rộng phạm vi có ý
thức so với brief.

### 2.9 Nạp lại — loại "thay thế toàn bộ" và "chỉ nạp khi app trống"

**Đã chọn (A):** gộp vào, đối chiếu theo định danh *(FR-16)*.

| | Phương án | Vì sao loại |
|---|---|---|
| B | Thay thế toàn bộ, có cảnh báo | Tạo ra nút phá dữ liệu lớn nhất trong app — và ta vừa kết luận ở §2.3 trên rằng hộp thoại cảnh báo sẽ bị bấm theo phản xạ |
| C | Chỉ cho nạp khi app đang trống | Đúng tinh thần "kỷ luật từ chối" nhất và không thể phá nhầm gì, nhưng cứng: muốn gộp thì phải xóa tay từng ghi chú |

**Hệ quả đáng giữ:** sau lựa chọn này, hành động duy nhất trong luồng dùng hàng ngày còn có thể phá
dữ liệu là xóa *(FR-11)*, và nó đã có phanh.

**Hai cái mất, cả hai đều được ghi vào PRD thay vì giấu:**
1. Không có cách khôi phục về đúng trạng thái trong file.
2. **Ghi chú đã xóa sẽ sống lại** nếu nạp một file sao lưu tạo trước lúc xóa. Điều này va thẳng vào
   chính lý do "xóa" được thêm vào danh sách trắng — *"dán tạm một mật khẩu trên máy công ty"*.
   Người dùng đã được nêu rõ hệ quả này và chọn chấp nhận; PRD ghi cảnh báo ở FR-11 và §8.

### 2.10 Việc ghi hôm nay, làm ngày mai — loại việc xử lý nó

**Đã chọn:** không xử lý. Ghi ra thành giới hạn được chấp nhận ở §8 của PRD.

Reviewer đối kháng chỉ ra rằng §2.1 của PRD hứa khung nhìn mặc định đóng vai "những gì đã ghi trong
ngày", nhưng FR-6 và FR-9 xóa sạch nó lúc 00:00 — nên ghi chú *"kiểm tra phân quyền trước thứ Năm"*
viết hôm thứ Hai sẽ biến mất vào sáng thứ Ba. §8 của PRD đã chặn mọi lối thoát: không trạng thái
xong/chưa, không nhắc nhở, không duyệt xem.

Người dùng cân nhắc và chọn **bỏ qua** trường hợp này ở v1.

**Vì sao ghi lại thay vì im lặng:** mọi giải pháp cho vấn đề này đều phải đi qua NT-2. "Mang việc
sang ngày mai" gần như chắc chắn sẽ biến thành một dạng trạng thái xong/chưa, hoặc một dạng ghim —
tức là chính những thứ sản phẩm đặt cược vào việc từ chối. Nếu vấn đề này quay lại, nó quay lại như
một sức ép lên nguyên tắc gốc, và người quyết lúc đó cần biết điều này trước khi mở cửa.

### 2.11 Chạy offline — loại vì chi phí

**Đã chọn (A):** app cần mạng để mở *(NFR-4)*, host tĩnh trên GitHub Pages.

| | Phương án | Vì sao loại |
|---|---|---|
| B | Giữ yêu cầu chạy offline sau lần mở đầu tiên | Giữ được lời hứa ban đầu, nhưng không phải bản vá đơn giản — nó thêm một tầng hạ tầng vào một sản phẩm mà cả luận đề là giữ cho nhỏ |
| C | Không host trên mạng, mở file trực tiếp trong máy | Offline tuyệt đối, nhưng trình duyệt hạn chế lưu trữ với file mở trực tiếp — đúng thế bế tắc mà reviewer downstream đã chỉ ra — và mỗi lần cập nhật app phải copy tay |

**Cái được:** origin `https` là môi trường lưu trữ đáng tin nhất của trình duyệt. Đây là điều gỡ thế
bế tắc cho Architecture.

**Cái mất, đã chấp nhận có ý thức:** mất mạng là **không mở được app**. Ghi chú vẫn nằm nguyên trong
máy nhưng không đọc được cho tới khi mạng trở lại. Với một công cụ mà tiền đề là "mở ra là gõ được
ngay", đây là chỗ mỏng thứ hai sau FR-17.

Rủi ro thứ hai của phương án này — IT công ty chặn tên miền GitHub Pages — **đã được kiểm tra và
loại trừ** ngày 2026-09-09. Nếu chính sách IT thay đổi về sau, phương án C quay lại bàn cân.

**Ràng buộc kéo theo:** origin phải cố định vĩnh viễn — xem ràng buộc 6 ở §1.

---

## 3. Cách bốn nguyên tắc thiết kế được rút ra

Ghi lại vì §3 của PRD chỉ trình bày kết quả, không trình bày đường đi — mà đường đi mới là thứ giải
thích **vì sao cần tới hai cửa thay vì một nguyên tắc**.

Câu Vision trụ cột do chính người dùng chọn là *"khoảng cách giữa có một ý nghĩ và ý nghĩ đó đã nằm
an toàn ở đâu đó bằng không"*. Đem thử với đề xuất "thêm nút ghim":

> Nút ghim có chen vào giữa ý nghĩ và con chữ không? **Không.** Nó nằm trên ghi chú đã tồn tại.

Câu Vision **cho nút ghim đi qua** — và cùng với nó là màu, đánh sao, sắp xếp thủ công. Tức là toàn
bộ những thứ brief nói sẽ giết sản phẩm. Nguyên tắc không sai; nó chỉ canh **một** cửa.

Cửa thứ hai được người dùng phát biểu ở dạng **danh sách trắng** thay vì nguyên tắc, và đó là dạng
mạnh hơn: một nguyên tắc thì phải diễn giải, mà diễn giải thì cãi được — danh sách trắng chỉ cần
đếm. Ban đầu là hai hành động (tạo mới, thêm text); xóa được thêm vào ngay sau đó, khi xét tới ghi
chú rỗng và nội dung nhạy cảm trên máy công ty.

**Vì sao NT-2 phải nói rõ ba tầng.** Bản đầu của NT-2 viết *"đề xuất nào không nằm trong ba cái đó
thì bị loại"* — không giới hạn phạm vi. Đọc theo nghĩa đen, câu đó loại luôn FR-12, FR-13, FR-15,
FR-16, tức nguyên tắc tự vứt bỏ F4 và F5 khỏi MVP của chính tài liệu. Bảng ba tầng trong NT-2 sinh
ra để vá đúng chỗ đó: NT-2 chỉ canh tầng **một ghi chú**; tầng **dòng ghi chú** thuộc NT-3/NT-4, và
tầng **kho dữ liệu** không nguyên tắc nào canh — vì ở đó không có gì để từ chối.

**Bài học đáng giữ cho các phiên sau:** danh sách trắng bị sửa là chuyện bình thường và lành mạnh.
Cái nguy hiểm là sửa mà không viết lại — khi đó tài liệu nói hai, code làm ba, và từ lúc đó không ai
tin tài liệu nữa.

---

## 4. Giới hạn của nền bằng chứng

PRD được viết với giọng khá chắc chắn. Nền bằng chứng đứng sau nó thì không chắc chắn bằng, và chỗ
này ghi lại khoảng cách đó để không ai nhầm.

- **n = 1.** Toàn bộ yêu cầu đến từ một người dùng, cũng là tác giả. Không có bằng chứng nào cho
  thấy các quyết định này đúng với người thứ hai, và sản phẩm cũng không đặt mục tiêu đó.
- **Bảng đối thủ trong addendum của brief tự khai là "ở mức định hướng, không có dẫn nguồn từng
  dòng".** Nhận định *"không sản phẩm nào đặt cược vào việc từ chối tính năng"* dựa trên bảng đó.
- **Brief giữ lại một câu mà PRD không giữ:** *"chỗ trống đó có thể vì chưa ai làm tử tế — cũng có
  thể vì không ai cần. Chưa có bằng chứng để kết luận."* Câu này là nền chống đỡ cho NT-1, NT-2, §8 của PRD
  và SM-C1 cùng lúc. Nó đã được đưa trở lại PRD dưới dạng Open Question 6.
- **Reddit chặn fetcher trong đợt tra cứu**, nên bằng chứng từ tiếng nói người dùng chỉ đến từ
  Microsoft Q&A, Neowin, Windows Latest, Capterra và SaaSHub. Apple Notes chưa kiểm chứng riêng.
- **Khoảng trống "cấu trúc nhẹ — giữa phẳng lì và quá nặng"** được nêu trong addendum của brief với
  bằng chứng hai chiều: Google Keep bị chê *thiếu* thư mục và rich text; Sticky Notes bị chê thiếu
  tag và notebook. **PRD đi hẳn về cực phẳng lì**, tức tự tái tạo đúng phàn nàn về Google Keep. Đây
  là lựa chọn có ý thức cho n = 1 — người dùng này chưa bao giờ than phiền về việc thiếu cấu trúc,
  mà than phiền về việc *phải quyết định* — nhưng nó không được nhầm là một khoảng trống đã được
  chứng minh.
