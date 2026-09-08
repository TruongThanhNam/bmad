---
title: "Addendum PRD: Ghi chú hàng ngày"
status: draft
created: 2026-09-08
updated: 2026-09-08
parent: prd.md
---

# Addendum — PRD Ghi chú hàng ngày

Những gì [`prd.md`](./prd.md) cố ý không chứa: **các phương án đã bị loại và lý do loại**, cùng danh
sách ràng buộc gửi thẳng cho `bmad-architecture`.

PRD nói *cái gì phải đúng*. Tài liệu này nói *vì sao không phải cái khác* — thứ mà sáu tháng nữa sẽ
không ai còn nhớ, và thiếu nó thì mọi quyết định trong PRD sẽ bị đem ra cãi lại từ đầu.

> Khảo sát thị trường, đối thủ và bằng chứng người dùng nằm ở
> [`addendum.md` của brief](../../briefs/brief-sticky-notes-2026-09-08/addendum.md), không lặp lại ở
> đây.

---

## 1. Ràng buộc gửi cho Architecture

Bảy điều dưới đây phải được biết **trước** khi chọn cách lưu trữ, không phải xử lý ở lớp giao diện.

| # | Ràng buộc | Đến từ |
|---|---|---|
| 1 | **Chuẩn hóa tiếng Việt là việc của tầng dữ liệu.** Tìm kiếm phải khớp `phan quyen` với `Phân quyền`. Chuẩn hóa lúc so chuỗi trên toàn bộ dữ liệu sẽ không đạt NFR-2 khi số ghi chú lớn — nhiều khả năng cần lưu sẵn dạng đã chuẩn hóa. | FR-12, NFR-6 |
| 2 | **Tự lưu ≤ 1 giây**, chịu được đóng tab đột ngột và mất điện. Đây là ràng buộc cứng, không phải mục tiêu. | FR-3 |
| 3 | **Tra cứu ≤ 200 ms với 2.000 ghi chú**, cho cả lọc ngày lẫn tìm chữ, kể cả khi kết hợp. | NFR-2 |
| 4 | **Định danh ổn định cho mỗi ghi chú**, sống sót qua xuất/nạp file. Cơ chế gộp khi nạp lại phụ thuộc hoàn toàn vào nó. | FR-16 |
| 5 | **Định dạng file sao lưu phải có phiên bản** và tương thích ngược. Bản app tháng sau vẫn phải nạp được file hôm nay. | FR-15 |
| 6 | **Chạy đủ chức năng khi mất mạng**, không gọi dịch vụ ngoài trong luồng bình thường. | NFR-4 |
| 7 | **Giới hạn dung lượng của trình duyệt** cần được xử lý có chủ đích. NFR-3 nói sản phẩm không tự áp giới hạn số ghi chú, nhưng trình duyệt thì có — cần biết ngưỡng và hành vi khi chạm. | Open Question 3 |

**Một gợi ý về đường mở rộng, không phải yêu cầu:** brief nói nếu sau này tác giả muốn dùng nhiều
máy thì không phải đập đi làm lại. Ràng buộc 4 (định danh ổn định) và 5 (định dạng có phiên bản) đã
làm sẵn phần lớn việc đó. Không cần thiết kế thêm gì cho đồng bộ ở giai đoạn này.

---

## 2. Các phương án đã bị loại

### 2.1 Sửa ghi chú — loại "chỉ nối thêm vào cuối"

**Đã chọn:** sửa tự do *(FR-10)*.

**Đã loại:** append-only — ghi chú là cuộn giấy, chữ đã viết không sửa được.

Append-only vốn hấp dẫn: nó làm ghi chú trở thành *bản ghi*, hợp với việc dấu thời gian là cái neo.
Nó bị loại **sau** khi đã cân nhắc nghiêm túc trong tình huống xác minh với sếp, vì cái giá hàng
ngày quá lớn — gõ sai một chữ cũng không sửa được.

**Hệ quả phải chấp nhận:** sản phẩm không chứng minh được nội dung một ghi chú có bị sửa sau ngày
tạo hay không. Đây là lý do PRD gọi sản phẩm là *trợ nhớ có mốc thời gian*, không phải *bằng chứng*.

### 2.2 Bằng chứng và tính toàn vẹn — loại ba trong bốn đường

Khi công việc xác minh lộ ra, có bốn đường đi:

| | Đường | Vì sao loại |
|---|---|---|
| 1 | Append-only cho tất cả | Xem 2.1 |
| 2 | Sửa tự do + hiện "đã sửa lần cuối lúc..." | Chỉ nói *có sửa*, không nói *sửa gì*. Với người đang nghi ngờ thì gần như vô dụng — trả tiền UI mà không mua được lòng tin |
| 3 | **Sửa tự do, chấp nhận đây là trợ nhớ** | **Đã chọn** |
| 4 | Hai loại ghi chú: thường và "khóa" | Đúng nhu cầu nhất, nhưng **nó là phân loại** — đâm thẳng vào NT-1, nguyên tắc gốc của sản phẩm |

**Điểm đáng giữ lại:** hành vi hiện tại của người dùng *đã* phân loại — tab `new N` cho ghi chú vứt
đi, tab `dd-MM-yyyy` cho biên bản họp. Chọn đường 3 làm hai loại đó **hết khác nhau về yêu cầu**,
nên NT-1 đứng vững. Nếu về sau ghi chú họp lại cần độ toàn vẹn cao hơn, tình huống này sẽ quay lại,
và đường 4 là câu trả lời phải cân nhắc lần nữa — kèm cái giá của nó với NT-1.

### 2.3 Phanh cho hành động xóa — loại hoàn tác

**Đã chọn:** hộp thoại xác nhận *(FR-11)*.

| | Phương án | Vì sao loại |
|---|---|---|
| B | Xóa ngay + hoàn tác trong 5 giây | Không loại vì sai, mà vì đắt hơn. **Đây là kế hoạch B đã định sẵn** — xem NOTE FOR PM ở FR-11 |
| C | Không phanh | Rẻ nhất, nhưng đặt cạnh "mất dữ liệu là rủi ro số một" thì không đứng được |

Nhược điểm của phương án đã chọn được ghi nhận ngay lúc chọn: sau vài tuần, hộp thoại xác nhận sẽ bị
bấm theo phản xạ và không còn bảo vệ được gì.

### 2.4 Khung nhìn mặc định — loại "hiện toàn bộ" và "trống trơn"

**Đã chọn:** chỉ hôm nay *(FR-6)*.

| | Phương án | Vì sao loại |
|---|---|---|
| A | Toàn bộ ghi chú, cuộn xuống là ra hết | Về bản chất vẫn là "đối diện cả đống", chỉ đổi từ chiều ngang (tab) sang chiều dọc. Đúng thứ đã giết Notepad++ |
| C | Trống trơn, chỉ có ô gõ | Mất khả năng nhìn thấy việc hôm nay — mà đó lại là công dụng thứ hai của khung nhìn mặc định |

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

Loại phương án nhất quán-với-màn-hình, vì nó gần như luôn sai ý định: **người ta tìm chính vì thứ
mình cần không ở trước mặt.**

Đây cũng là chỗ hai câu trả lời của người dùng thoạt nhìn mâu thuẫn — "bộ lọc chồng lên nhau" và
"tìm toàn bộ". Lối thoát là phân biệt **trạng thái mặc định** với **điều kiện do người dùng đặt**,
và nó được viết hẳn thành bảng trong FR-14 vì đây đúng là loại chi tiết mà mỗi người đọc sẽ hiểu một
kiểu.

### 2.8 Sao lưu — loại "xuất ra để đọc"

**Đã chọn:** file sao lưu máy đọc được, có nạp lại *(FR-15, FR-16)*.

Loại Markdown/text thuần chỉ để đọc. Lý do: brief đưa xuất dữ liệu vào MVP **để chống mất dữ liệu**,
mà xuất không nạp lại được thì không phải sao lưu — nó là một cái két sắt không có chìa. Kiểu thất
bại tệ nhất là *cảm giác được bảo vệ mà thực ra không có*.

**Cái giá đã chấp nhận:** nhập lại là một FR thật, tốn công thật, và là phần mở rộng phạm vi có ý
thức so với brief.

### 2.9 Nạp lại — loại "thay thế toàn bộ" và "chỉ nạp khi app trống"

**Đã chọn:** gộp vào, đối chiếu theo định danh *(FR-16)*.

| | Phương án | Vì sao loại |
|---|---|---|
| B | Thay thế toàn bộ, có cảnh báo | Tạo ra nút phá dữ liệu lớn nhất trong app — và ta vừa kết luận ở 2.3 rằng hộp thoại cảnh báo sẽ bị bấm theo phản xạ |
| C | Chỉ cho nạp khi app đang trống | Đúng tinh thần "kỷ luật từ chối" nhất và không thể phá nhầm gì, nhưng cứng: muốn gộp thì phải xóa tay từng ghi chú |

**Hệ quả đáng giữ:** sau lựa chọn này, hành động duy nhất trong toàn sản phẩm còn có thể phá dữ liệu
là xóa *(FR-11)*, và nó đã có phanh. **Cái mất:** không có cách khôi phục về đúng trạng thái trong
file.

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
mạnh hơn: nguyên tắc phải diễn giải và cãi được, danh sách trắng thì đếm được. Ban đầu là hai hành
động (tạo mới, thêm text); xóa được thêm vào ngay sau đó khi xét tới ghi chú rỗng và nội dung nhạy
cảm trên máy công ty.

**Bài học đáng giữ cho các phiên sau:** danh sách trắng bị sửa là chuyện bình thường và lành mạnh.
Cái nguy hiểm là sửa mà không viết lại — khi đó tài liệu nói hai, code làm ba, và từ lúc đó không ai
tin tài liệu nữa.
