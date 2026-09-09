---
title: "Review: Bốn nguyên tắc §3 có đứng vững không"
status: review
created: 2026-09-09
parent: prd.md
scope: "Chỉ kiểm tra một điều — tài liệu có tuân thủ chính nó không"
---

# Review — Bốn nguyên tắc §3 có thật sự là tiêu chí loại trừ không

Bài này không đánh giá sản phẩm hay, dở, khả thi hay không. Nó kiểm chứng **đúng một lời tuyên bố**
mà PRD tự đưa ra ở §3:

> "Bốn nguyên tắc dưới đây là **tiêu chí loại trừ**, không phải khẩu hiệu. Mọi đề xuất tính năng —
> bây giờ hoặc ba tháng nữa — phải đi qua chúng."

Và ở §0:

> "**§3 Nguyên tắc thiết kế** là dao mổ — mọi tranh cãi về sau đều xử bằng bốn nguyên tắc ở đó."

Một tiêu chí loại trừ phải làm được hai việc: (a) không tự loại chính sản phẩm mình đang mô tả, và
(b) cho ra một câu trả lời xác định trước một đề xuất mới. Bốn nguyên tắc NT-1..NT-4 làm tốt việc
(a) và **hụt rõ ở việc (b)**.

**Kết luận sớm:** bốn nguyên tắc đứng vững về *tinh thần* — không FR nào phản bội chúng. Nhưng về
*câu chữ* thì NT-2 tự mâu thuẫn trong chính hai câu của nó, và bộ bốn nguyên tắc để lọt một nửa số
đề xuất giả định trong bài kiểm tra ngược. Dao mổ này sắc ở đúng một mặt phẳng — thứ **gắn thêm vào
một ghi chú** — và cùn ở mọi thứ nằm quanh ghi chú.

---

## 1. Điểm hỏng gốc: NT-2 tự mâu thuẫn giữa câu 1 và câu 2

Trước khi chạy bất cứ FR nào, phải xử lý chỗ này, vì mọi kết quả phía sau đều phụ thuộc vào nó.

NT-2 được viết bằng hai câu, và **hai câu đó có phạm vi khác nhau**:

| | Câu | Phạm vi nó tuyên bố |
|---|---|---|
| Câu 1 | "Cửa sau: đúng ba hành động **chạm được vào ghi chú**" | Hẹp — chỉ hành động tác động lên *một ghi chú* |
| Câu 2 | "**Đề xuất nào** không nằm trong ba cái đó thì bị loại mà không cần tranh luận" | Rộng — *mọi* đề xuất tính năng |

Đây không phải chuyện chẻ chữ. Đọc theo **câu 2**, NT-2 loại thẳng bốn tính năng đang nằm trong MVP
của chính tài liệu:

- FR-12 (tìm bằng chữ) — "tìm" không phải tạo/sửa/xóa
- FR-13 (lọc theo ngày) — "lọc" không phải tạo/sửa/xóa
- FR-15 (xuất file sao lưu) — "xuất" không phải tạo/sửa/xóa
- FR-16 (nạp file sao lưu) — "nạp" không phải tạo/sửa/xóa

Một nguyên tắc mà đọc đúng câu chữ thì loại mất F4 và F5 — tức là loại mất §9 MVP Scope — thì
không phải dao mổ, mà là dao cùn cầm ngược.

Đọc theo **câu 1** thì bốn FR trên an toàn, nhưng lúc đó NT-2 mất gần hết sức mạnh: nó chỉ còn canh
được những gì *dính vào một ghi chú*, và bất cứ đề xuất nào khéo léo đặt mình ở tầng "dòng ghi chú"
hay "toàn kho dữ liệu" đều đi qua tự do.

**Tài liệu không nói rõ ranh giới đó ở bất cứ đâu.** Không có câu nào trong §3, §4 Glossary hay §5
phân biệt "hành động lên một ghi chú" với "hành động lên dòng ghi chú" và "hành động lên toàn kho".
Người đọc phải tự đoán — và đoán khác nhau sẽ ra kết luận ngược nhau về cùng một đề xuất. Đó đúng
là kiểu hỏng mà chính addendum §3 cảnh báo: *"tài liệu nói hai, code làm ba, và từ lúc đó không ai
tin tài liệu nữa."*

Đáng nói hơn: §5.3 đã **lặng lẽ thêm một mệnh đề mới vào NT-2** mà §3 không có:

> "**Ngoài phạm vi của F3:** xóa hàng loạt, chọn nhiều ghi chú, xóa theo ngày. *(NT-2 — chỉ có ba
> hành động, và chúng tác động lên **một ghi chú tại một thời điểm**.)*"

Câu "một ghi chú tại một thời điểm" không tồn tại trong §3. Nó được phát minh tại chỗ để biện minh
cho một quyết định — và nó **bị FR-16 vi phạm ngay trong cùng tài liệu**: nạp file sao lưu tạo ra
hàng trăm ghi chú trong một thao tác. Nếu NT-2 thật sự chứa mệnh đề đó, FR-16 phải bị loại.

### Đề xuất vá — V1 (ưu tiên cao nhất)

Viết lại NT-2 thành phạm vi tường minh, ba tầng:

> ### NT-2 · Cửa sau: đúng ba hành động **biến đổi** một ghi chú
> **Tạo mới · Sửa nội dung · Xóa.** Hết.
>
> **Phạm vi:** NT-2 canh mọi hành động *thay đổi nội dung, thuộc tính hoặc sự tồn tại của một ghi
> chú*. Nó **không** canh:
> - hành động lên *dòng ghi chú* — lọc, tìm, mở rộng hiển thị. Tầng này do **NT-3** canh.
> - hành động lên *toàn kho dữ liệu* — xuất, nạp. Tầng này do **NT-5** canh (xem V2 bên dưới).
>
> **Hệ quả:** một ghi chú không được mang thêm bất kỳ thuộc tính nào ngoài *nội dung*, *thời điểm
> tạo* và *định danh* (§4 Glossary). Ghim, màu, sao, nhãn, trạng thái, độ ưu tiên — đều là thuộc
> tính thứ tư, đều bị loại mà không cần tranh luận.

Cách diễn đạt "thuộc tính thứ tư" mạnh hơn "hành động thứ tư", vì nó đếm được trên Glossary chứ
không phải diễn giải được — đúng tinh thần "danh sách trắng mạnh hơn nguyên tắc" mà addendum §3 đã
rút ra.

---

## 2. KIỂM TRA 1 — Từng FR và NFR qua bốn nguyên tắc

### 2.1 Bảng tổng hợp

Ký hiệu: **OK** = tuân thủ; **↑** = hiện thực trực tiếp nguyên tắc đó; **?** = NT-2 không phân định
được vì lỗi phạm vi ở mục 1; **⚠** = có lỗ thủng thật.

| FR | NT-1 | NT-2 | NT-3 | NT-4 | Ghi chú |
|---|---|---|---|---|---|
| FR-1 Gõ được ngay | ↑ | OK | OK | OK | Hiện thân của NT-1 |
| FR-2 Thời điểm tạo bất biến | OK | OK | OK | ↑ | Hiện thân của NT-4 |
| FR-3 Tự lưu | ↑ | OK | OK | OK | "Không nút Lưu" = không quyết định |
| FR-4 `Ctrl+Enter` chốt & gõ tiếp | ↑ | **?** | OK | OK | "Đóng ghi chú" là hành động thứ tư? Xem 2.2 |
| FR-5 Ghi chú rỗng không tồn tại | OK | **?** | OK | OK | Xóa do *hệ thống* khởi xướng — NT-2 không nói ai là chủ thể |
| FR-6 Khung nhìn mặc định = hôm nay | OK | OK | ↑ | OK | Hiện thân của NT-3 |
| FR-7 Mới nhất trên cùng | OK | ↑ | OK | ↑ | Trích dẫn cả NT-2 lẫn NT-4 — xem KIỂM TRA 4 |
| FR-8 Cắt bớt, mở rộng tại chỗ | OK | **?** | ↑ | OK | "Mở rộng" là hành động thứ tư? Xem 2.2 |
| FR-9 Trạng thái rỗng | OK | OK | OK | OK | |
| FR-10 Sửa tự do | OK | ↑ | OK | ↑ | |
| FR-11 Xóa có xác nhận | OK | ↑ | OK | OK | Bước xác nhận **không** phá NT-1: NT-1 chỉ canh cửa vào |
| FR-12 Tìm bằng chữ | OK | **?** | ↑ / **⚠** | OK | Lỗ thủng NT-3 ở ca biên — xem 2.3 |
| FR-13 Lọc theo ngày | OK | **?** | ↑ | OK | Đã tự dùng NT-3 để loại "mốc nhanh 7 ngày qua" |
| FR-14 Kết hợp điều kiện | OK | OK | ↑ | OK | Bảng mô hình trạng thái là chỗ chặt nhất tài liệu |
| FR-15 Xuất file sao lưu | OK | **?** | OK | OK | Xuất *toàn bộ*, không phụ thuộc điều kiện — không phải duyệt xem |
| FR-16 Nạp file sao lưu | OK | **?** ⚠ | OK | ↑ | Vi phạm mệnh đề "một ghi chú tại một thời điểm" của §5.3; xem 2.4 |
| FR-17 Nhắc thụ động sao lưu | OK | OK | **?** | OK | Tài liệu đã tự thấy rủi ro NT-3 và tự vá bằng A-9 |

**NFR:** không NFR nào vi phạm bất kỳ nguyên tắc nào. Quan hệ của chúng với §3:

| NFR | Quan hệ với §3 |
|---|---|
| NFR-1 Mở là dùng ngay ≤2s | Là NT-1 phát biểu bằng con số |
| NFR-2 Tra cứu ≤200ms | Là điều kiện sống của NT-3 — nếu tra cứu chậm, NT-3 sụp vì người dùng sẽ quay lại duyệt xem |
| NFR-3 Ghi chú không tự mất | Trung lập. Là *tiền đề* buộc phải có NT-3 (không dọn dẹp thì phải có cách hỏi) |
| NFR-4 Chạy offline | Trung lập |
| NFR-5 Dữ liệu không rời máy | Trung lập; ràng buộc FR-15 |
| NFR-6 Chuẩn hóa tiếng Việt | Điều kiện kỹ thuật của NT-3 qua FR-12 |
| NFR-7 Không cài đặt, không admin | Trung lập |

### 2.2 Trả lời trực tiếp câu hỏi về FR-15/FR-16 và FR-13

**Chúng có phá NT-2 không?** Theo *ý định* của tài liệu: **không**. Theo *câu chữ* hiện tại của
NT-2: **có, cả ba đều bị loại**.

Bằng chứng cho thấy ý định là "NT-2 chỉ nói về hành động chạm vào ghi chú":

1. Câu 1 của NT-2 tự giới hạn: "ba hành động **chạm được vào ghi chú**".
2. Danh sách ví dụ bị loại trong NT-2 — "ghim, màu, đánh sao, kéo thả sắp xếp, trạng thái xong/chưa,
   nhãn, thư mục, độ ưu tiên" — **toàn bộ là thuộc tính gắn vào một ghi chú**. Không có mục nào là
   hành động ở tầng dòng ghi chú hay tầng kho.
3. FR-13 tự đi qua NT-3 chứ không qua NT-2 khi loại "mốc nhanh". Tức là tác giả *đã* ngầm coi hành
   động lọc thuộc thẩm quyền NT-3.

**Nhưng tài liệu không nói ranh giới đó ra ở bất kỳ đâu.** Nó chỉ suy ra được bằng cách đọc danh
sách ví dụ và đối chiếu chéo. Đây là mập mờ thật, không phải mập mờ giả định — và nó là loại mập mờ
sống được sáu tháng rồi mới nổ, khi có người dùng đúng câu 2 của NT-2 để chặn một tính năng cần
thiết (hoặc, tệ hơn, để *cho qua* một tính năng có hại bằng cách lập luận "cái này đâu chạm vào ghi
chú").

Hai ca mập mờ nhỏ hơn cùng họ:

- **FR-4 "đóng ghi chú hiện tại"** — từ *đóng* không có trong §4 Glossary, dù §0 tuyên bố "các mục
  còn lại chỉ dùng đúng những từ trong đó, không dùng từ đồng nghĩa". Chốt/đóng là hành động thứ tư
  hay chỉ là "kết thúc phiên tạo mới"? Không tài liệu nào nói. Vá: thêm mục Glossary **Chốt** — "kết
  thúc phiên soạn một ghi chú và mở ngay ô soạn thảo mới; không thay đổi ghi chú vừa chốt".
- **FR-8 "mở rộng tại chỗ"** — mở rộng là hành động người dùng làm *lên một ghi chú*. Theo câu 1 của
  NT-2 (chạm vào ghi chú) thì nó là hành động thứ tư và **bị loại**. Nó chỉ sống được nếu ta phân
  biệt "biến đổi ghi chú" với "thay đổi cách hiển thị ghi chú". Tài liệu đã *ngầm* chọn cách phân
  biệt đó ở A-3 (không nhớ trạng thái mở rộng giữa các phiên — tức là trạng thái mở rộng cố ý không
  phải thuộc tính của ghi chú), nhưng chưa bao giờ viết nó ra. Đây là một quyết định đúng mà tài
  liệu quên ghi lý do.

- **FR-5** — ghi chú rỗng bị hệ thống tự loại bỏ. NT-2 nói "ba hành động chạm được vào ghi chú"
  nhưng không nói *ai* thực hiện. Nếu chủ thể là người dùng thì FR-5 là hành động thứ tư (hệ thống
  tự dọn); nếu chủ thể là bất kỳ ai thì FR-5 nằm gọn trong "Xóa". Vá bằng một câu trong NT-2: "chủ
  thể là hệ thống hay người dùng đều tính".

### 2.3 Lỗ thủng thật của NT-3: FR-12 + A-4 mở lại cửa "xem tất cả"

Đây là chỗ nặng nhất của KIỂM TRA 1, và nó không phải mập mờ ngữ nghĩa mà là hành vi có thật.

- NT-3: "**Sản phẩm không có chế độ duyệt xem** — không có màn hình 'xem tất cả'."
- §8: "**Không chế độ duyệt xem.** Không có màn hình 'xem tất cả ghi chú'."
- FR-12: "Tìm trong nội dung **tất cả** ghi chú từ trước tới nay."
- A-4: "`[ASSUMPTION: lọc dần theo từng ký tự gõ, không cần bấm Enter]`".

Ghép ba thứ lại: người dùng gõ một ký tự phổ biến — `a`, hoặc một dấu cách — và màn hình trả về
**gần như toàn bộ kho ghi chú, xếp mới nhất trên cùng, cuộn vô tận**. Đó chính xác là màn hình "xem
tất cả" mà NT-3 và §8 tuyên bố không tồn tại, chỉ khác là nó đến qua cửa sau và tốn một phím bấm.

Tệ hơn, addendum §2.4 loại phương án A ("Toàn bộ ghi chú, cuộn xuống là ra hết") với lý do *"về bản
chất vẫn là đối diện cả đống... Đúng thứ đã giết Notepad++"*. Vậy phương án đã bị loại trên bàn giấy
lại quay về qua FR-12, và không FR nào chặn nó.

Không có FR nào đặt giới hạn số kết quả trả về. NFR-2 chỉ nói *nhanh* (≤200ms), không nói *ít*.
SM-4 chỉ đo khung nhìn mặc định, không đo màn hình kết quả tìm kiếm.

**Đề xuất vá — V6.** Thêm vào FR-12 một tiêu chí kiểm chứng được:

> - Kết quả tìm kiếm giới hạn ở `[ASSUMPTION: 50]` ghi chú mới nhất khớp từ khóa. Khi còn nhiều hơn,
>   hiển thị một dòng "còn N ghi chú nữa — gõ thêm chữ hoặc thêm bộ lọc ngày", **không** có nút "xem
>   thêm" và **không** cuộn vô tận. Lý do: nếu không, tìm kiếm trở thành cửa sau của màn hình "xem
>   tất cả" mà NT-3 loại bỏ.
> - `[ASSUMPTION: từ khóa dưới 2 ký tự không kích hoạt tìm kiếm]`

Đồng thời thêm một thước đo đối chứng ở §10:

> **SM-C3 · Số lần một lượt tìm kiếm trả về hơn 50 kết quả.** Mục tiêu là gần 0. Nếu con số này cao,
> người dùng đang dùng ô tìm kiếm để duyệt xem, và NT-3 đã hỏng ở cửa sau.

### 2.4 FR-16 và Glossary: định nghĩa "Thời điểm tạo" không bao phủ ghi chú được nạp lại

§4 Glossary:

> **Thời điểm tạo** — mốc ngày + giờ do hệ thống gán cho một ghi chú **tại lúc ký tự đầu tiên được
> gõ vào**.

Ghi chú đến qua FR-16 (nạp file sao lưu trên một máy mới, trình duyệt mới) **chưa từng có ký tự nào
được gõ vào trong hệ thống đó**. Theo định nghĩa Glossary, chúng không có thời điểm tạo hợp lệ —
trong khi FR-16 lại yêu cầu "khôi phục ghi chú **giữ nguyên thời điểm tạo gốc**" và UJ-3 dựa hoàn
toàn vào việc bộ lọc ngày vẫn chỉ đúng vào các cuộc họp cũ.

Đây không phải vi phạm NT-4 — ngược lại, FR-16 là thứ *bảo vệ* NT-4 xuyên qua ranh giới máy tính.
Nhưng Glossary, thứ mà §0 tuyên bố là khóa từ vựng cho mọi tài liệu downstream, đang định nghĩa
thiếu một nửa đường sinh ra dữ liệu.

**Đề xuất vá — V7.** Sửa Glossary:

> **Thời điểm tạo** — mốc ngày + giờ gắn với một ghi chú, xác định theo đúng một trong hai đường:
> (a) hệ thống gán tại lúc ký tự đầu tiên được gõ vào, hoặc (b) đọc nguyên vẹn từ *file sao lưu* khi
> nạp lại *(FR-16)*. Không sửa được bằng bất kỳ cách nào, không đổi khi nội dung đổi.

Một ca biên nhỏ chưa ai xét, nên ghi vào §11 Open Questions: **nạp file sao lưu chứa ghi chú có thời
điểm tạo thuộc hôm nay** sẽ đổ chúng vào khung nhìn mặc định. Đúng theo mọi quy tắc hiện có, nhưng
đi ngược trải nghiệm "mở lên không rối mắt" mà SM-4 bảo vệ.

### 2.5 Tổng kết KIỂM TRA 1

- **FR vi phạm dứt khoát bốn nguyên tắc: 0.** Không FR nào lén đưa vào một thuộc tính thứ tư, một
  cách đổi thứ tự, một cách sửa thời điểm tạo, hay một màn hình duyệt xem trực tiếp. Về mặt này bộ
  bốn nguyên tắc đã làm đúng việc của nó trong suốt 17 FR — điều hiếm thấy.
- **FR có lỗ thủng thật: 1** — FR-12 kết hợp A-4 mở lại màn hình "xem tất cả" mà NT-3 và §8 loại bỏ.
- **FR mà NT-2 (như đang viết) không phân định được: 6** — FR-4, FR-5, FR-8, FR-13, FR-15, FR-16.
- **FR có mâu thuẫn nội bộ với mệnh đề NT-2 bổ sung ở §5.3: 1** — FR-16 ("một ghi chú tại một thời
  điểm").
- **NFR vi phạm: 0.**

---

## 3. KIỂM TRA 2 — Chiều ngược lại: bốn nguyên tắc có đủ sắc để loại đề xuất mới không?

Mười đề xuất dưới đây là loại đề xuất một người thật sẽ đưa ra trong ba tháng tới — mỗi cái đều nghe
hợp lý, rẻ, và "chỉ một chút thôi". Với từng cái, tôi chỉ dùng **NT-1..NT-4 như đang được viết ở
§3**, không mượn §8 Non-Goals hay §1 Vision (nếu phải mượn thì đó chính là bằng chứng §3 chưa đủ).

| # | Đề xuất | Kết quả | Nguyên tắc nào xử | Ghi chú |
|---|---|---|---|---|
| 1 | Nút sao chép nội dung một ghi chú ra clipboard | **MẬP MỜ** | NT-2 (không kết luận được) | Câu 2 của NT-2 loại thẳng ("không nằm trong ba cái đó"); câu 1 cho qua (copy là *đọc*, không biến đổi ghi chú). Hai câu của cùng một nguyên tắc cho hai đáp án ngược nhau |
| 2 | Chế độ tối (dark mode) | **MẬP MỜ** | Không nguyên tắc nào chạm tới | Cả bốn NT im lặng. Thứ duy nhất loại được nó là câu §1 Vision *"không có gì để cấu hình"* — nhưng đó là Vision, không phải tiêu chí loại trừ. §3 thiếu hẳn một cửa về cấu hình |
| 3 | Kéo thả file vào ghi chú (đính kèm) | **LOẠI** | NT-2 (+ §4 Glossary) | Đính kèm là *thuộc tính thứ tư* của ghi chú; Glossary định nghĩa ghi chú là "một khối văn bản tự do", không chứa gì khác. NT-2 xử sạch |
| 4 | Phím tắt toàn cục mở nhanh app | **CHO QUA** | NT-1 thậm chí *ủng hộ* | Nó rút ngắn khoảng cách giữa ý nghĩ và con chữ — đúng thứ NT-1 muốn. Bị chặn bởi NFR-7 (không cài đặt, không quyền admin) và giới hạn trình duyệt, **không** bởi §3. Đây là ca duy nhất mà "cho qua" là câu trả lời đúng |
| 5 | Gợi ý ghi chú liên quan ("có thể bạn muốn xem lại...") | **LOẠI** | NT-3 | Câu cứu mạng là *"Mỗi lần rời khỏi hôm nay đều là có mục đích"*. Riêng câu "không bắt nhìn cả đống" thì không đủ — gợi ý 3 ghi chú đâu phải "cả đống". Loại được, nhưng chỉ vừa đủ |
| 6 | Đếm số ghi chú hôm nay ("Hôm nay: 7 ghi chú") | **CHO QUA** (rủi ro) | Cả bốn NT cho qua | Không chạm ghi chú, không phải duyệt xem, không đổi thứ tự, không chen vào lúc gõ. Nhưng nó biến ghi chú thành chỉ số năng suất và đẩy người dùng về phía "dọn cho gọn" — đúng thứ SM-C2 sợ. §3 không có công cụ nào để nói không |
| 7 | Tự động nhận diện URL thành link bấm được | **MẬP MỜ** | NT-2 (không kết luận được) | Không sửa nội dung đã lưu, chỉ đổi cách hiển thị — cùng loại với FR-8 "mở rộng tại chỗ" mà tài liệu *đã cho qua*. Thứ loại được nó là §8 "Không rich text", không phải §3. Nếu §3 là dao mổ thì đây là ca nó không cắt được |
| 8 | Đánh dấu một ghi chú là quan trọng | **LOẠI** | NT-2 | "đánh sao" nằm nguyên văn trong danh sách của NT-2. Xử trong một giây, không tranh luận. Đây là NT-2 ở trạng thái tốt nhất |
| 9 | Nhớ điều kiện lọc/từ khóa sau khi tải lại trang | **MẬP MỜ** | Không nguyên tắc nào chạm tới | A-6 giả định ngược lại, nhưng assumption không phải tiêu chí loại trừ. Lập luận cho: tiện. Lập luận chống: mở app lên thấy màn hình đã bị lọc sẵn thì khung nhìn mặc định không còn là mặc định — nhưng phải suy ba bước mới ra, §3 không nói thẳng |
| 10 | Tự động xuất file sao lưu mỗi ngày xuống thư mục Downloads | **MẬP MỜ** | Không nguyên tắc nào chạm tới | Nghe *đúng tinh thần sản phẩm* (vá chỗ mỏng nhất mà NOTE FOR PM ở FR-17 đã tự nhận). Bị chặn bởi NFR-5 + FR-15 ("dữ liệu chỉ rời máy khi người dùng chủ động bấm"), nhưng §3 không có ý kiến gì |

### 3.1 Kết quả đếm

- **LOẠI: 3/10** (#3, #5, #8)
- **CHO QUA: 2/10** (#4 đúng, #6 rủi ro)
- **MẬP MỜ: 5/10** (#1, #2, #7, #9, #10)

**Một nửa số đề xuất giả định rơi vào vùng bốn nguyên tắc không kết luận được.** Với một tài liệu
tuyên bố "mọi tranh cãi về sau đều xử bằng bốn nguyên tắc ở đó", đây là con số không chấp nhận được.

Và các ca MẬP MỜ không rải rác ngẫu nhiên — chúng gom thành **ba lỗ hổng có hình dạng rõ ràng**.

### 3.2 Ba lỗ hổng của §3, và cách vá

**Lỗ hổng A — phạm vi của NT-2 (bắt ca #1, #7; và cả 6 FR mập mờ ở KIỂM TRA 1).**
Đã phân tích ở mục 1. Vá bằng **V1**.

**Lỗ hổng B — không có nguyên tắc nào canh *màn hình* (bắt ca #6, #9; suýt để lọt #5).**
NT-3 chỉ canh một thứ: không bắt người dùng *duyệt* qua nhiều ghi chú. Nó không canh việc màn hình
mọc thêm thông tin mà người dùng không hỏi: bộ đếm, huy hiệu, gợi ý, dòng trạng thái, biểu đồ nhỏ.
Mỗi thứ đó riêng lẻ đều tí hon và đều "không phải duyệt xem" — cộng lại đúng bằng cảm giác rối mắt
mà §2.1 nói là *"đã giết công cụ cũ, không phải thiếu tính năng"*.

**Đề xuất vá — V2. Thêm NT-5:**

> ### NT-5 · Màn hình chỉ hiện thứ người dùng đã hỏi
> Trên màn hình chỉ có: ô soạn thảo, dòng ghi chú, và điều kiện đang áp dụng. Không bộ đếm, không
> thống kê, không gợi ý, không huy hiệu, không thứ gì tự nói với người dùng khi họ chưa hỏi. Ngoại
> lệ duy nhất là dòng nhắc sao lưu *(FR-17)*, và nó chỉ xuất hiện khi rủi ro mất dữ liệu đã thành
> thật.
>
> *Vì sao cần cửa thứ ba:* NT-3 canh việc bắt người dùng *duyệt*. Nó không canh việc màn hình *mọc
> thêm*. Một bộ đếm "hôm nay: 7 ghi chú" đi qua cả bốn nguyên tắc cũ — và bảy cái bộ đếm như thế
> chính là bảy cái tab `new N`.

**Lỗ hổng C — không có nguyên tắc nào canh *cấu hình* (bắt ca #2, #10).**
Câu "không có gì để cấu hình" nằm ở §1 Vision, nơi không ai đem ra làm căn cứ loại trừ trong một
cuộc tranh luận về ticket. Dark mode, tùy chọn cỡ chữ, tùy chọn ngưỡng cắt dòng, tùy chọn tự động
sao lưu — mỗi cái đều lọt qua §3 hiện tại.

**Đề xuất vá — V3. Thêm NT-6:**

> ### NT-6 · Không có gì để cấu hình
> Sản phẩm không có màn hình cài đặt, không có tùy chọn, không có thứ gì người dùng phải quyết định
> một lần rồi sống với nó. Mọi ngưỡng — 3 dòng của FR-8, 7 ngày của FR-17 — là quyết định của tài
> liệu này, không phải câu hỏi dành cho người dùng. Nếu một ngưỡng sai, sửa tài liệu và sửa app,
> đừng biến nó thành tùy chọn.

Ba nguyên tắc vá thêm này chạy lại bảng KIỂM TRA 2 sẽ cho: **LOẠI 8/10, CHO QUA 1/10 (#4, đúng),
MẬP MỜ 1/10** (#1 nút sao chép — vẫn nên tranh luận, và đó là loại tranh luận lành mạnh).

---

## 4. KIỂM TRA 3 — §8 Non-Goals đối chiếu §5 Features và §9 MVP Scope

Tìm được **bốn mâu thuẫn thật** và một lỗi nhãn.

### 4.1 §8 dẫn sai nguyên tắc cho chính ví dụ trung tâm của tài liệu — NẶNG

§8 viết:

> "**Không phân loại dưới bất kỳ hình thức nào:** nhãn, thư mục, phân cấp, màu, **ghim**, đánh sao,
> độ ưu tiên. *(NT-1, NT-2)*"

Addendum §3 dành nguyên một mục để chứng minh điều ngược lại:

> "Đem thử với đề xuất 'thêm nút ghim': Nút ghim có chen vào giữa ý nghĩ và con chữ không? **Không.**
> ... Câu Vision **cho nút ghim đi qua** — và cùng với nó là màu, đánh sao, sắp xếp thủ công."

Và NT-2 tự nói y hệt:

> "*Vì sao cần hai cửa:* NT-1 một mình không đủ. Nút ghim không chen vào lúc gõ, nên **NT-1 cho nó đi
> qua**."

Vậy §8 gắn nhãn **NT-1** cho đúng cái ví dụ mà tài liệu đã ba lần khẳng định **NT-1 không loại
được**. Đây là mâu thuẫn nội bộ thẳng thừng, và nó nguy hiểm hơn vẻ ngoài: nó dạy người đọc downstream
rằng NT-1 loại được phân loại — và người đó sẽ dùng NT-1 sai chỗ, rồi phát hiện nó không đứng vững,
rồi mất niềm tin vào cả bộ nguyên tắc.

Lỗi y hệt lặp lại trong **addendum §2.2, hàng 4**:

> "4 | Hai loại ghi chú: thường và 'khóa' | ... **nó là phân loại** — đâm thẳng vào **NT-1**, nguyên
> tắc gốc của sản phẩm"

Phân loại đâm vào **NT-2**, không phải NT-1 — trừ khi việc chọn "thường hay khóa" xảy ra *trước khi
gõ*, mà tài liệu không nói vậy. Thêm nữa, cụm "NT-1, nguyên tắc gốc" mâu thuẫn với addendum §3, nơi
NT-2 mới là cửa quyết định.

**Vá — V4:**
- §8: đổi `*(NT-1, NT-2)*` thành `*(NT-2)*`.
- Addendum §2.2 hàng 4: đổi "đâm thẳng vào NT-1" thành "đâm thẳng vào NT-2 — thêm một thuộc tính thứ
  tư cho ghi chú; và nếu việc chọn loại xảy ra trước khi gõ thì còn đâm cả NT-1".

### 4.2 "Hoàn tác" vừa là Non-Goal vừa là kế hoạch B — NẶNG

Ba chỗ nói ba điều khác nhau về cùng một tính năng:

| Ở đâu | Nói gì |
|---|---|
| §8 Non-Goals | "**Không** xóa hàng loạt, **không thùng rác, không hoàn tác**. *(NT-2)*" — tức bị **nguyên tắc** loại |
| §9.2 Ngoài phạm vi MVP | "**Hoàn tác sau khi xóa** — đường nâng cấp đã định sẵn... **kế hoạch B đã viết trước**" — tức chỉ là **để sau** |
| FR-11 NOTE FOR PM | "đường thoát là chuyển sang 'xóa ngay + hoàn tác trong 5 giây'" — tức là **con đường đã được duyệt** |

§9.2 tự khẳng định sự phân biệt này là có ý nghĩa, ở dòng cuối của chính nó:

> "Đồng bộ nhiều máy, tài khoản, backend — xem §8, đây là *non-goal* chứ không phải 'để sau'"

Câu đó chỉ có nghĩa nếu **các mục khác trong §9.2 đúng là "để sau"**. Vậy hoàn tác đang đứng hai
chân: §8 nói nguyên tắc cấm nó vĩnh viễn, §9.2 và FR-11 nói nó là bước tiếp theo đã lên kế hoạch.

Thêm một tầng: **NT-2 có thật sự loại hoàn tác không?** Hoàn tác không phải một thuộc tính gắn vào
ghi chú; nó là việc đảo ngược hành động Xóa. Theo cách đọc hẹp (V1) thì NT-2 *không* loại được nó —
lý do thật để trì hoãn hoàn tác là chi phí, đúng như addendum §2.3 nói ("Không loại vì sai, mà vì
đắt hơn"). Tức là §8 đang mượn uy tín của NT-2 cho một quyết định vốn chỉ là đánh đổi chi phí.

**Vá — V5:** tách §8 làm hai loại mục có nhãn rõ:
- **Loại A — bị nguyên tắc loại (không bao giờ, không cần tranh luận lại):** phân loại, trạng thái
  xong/chưa, chế độ duyệt xem, rich text, đồng bộ/tài khoản/backend, hồ sơ đối chứng.
- **Loại B — bị chi phí loại ở v1, có điều kiện kích hoạt viết sẵn:** hoàn tác sau khi xóa *(kích
  hoạt khi hộp thoại xác nhận bị bấm theo phản xạ)*, nhắc sao lưu chủ động *(kích hoạt khi nhắc thụ
  động chứng minh không đủ)*, khôi phục thay thế toàn bộ.

Và bỏ ba mục loại B ra khỏi danh sách "Không..." của §8, hoặc ít nhất bỏ nhãn *(NT-2)* khỏi mục hoàn
tác.

### 4.3 §9.2 hứa "khoảng ngày", nhưng NT-3 đã loại nó ở FR-13 — NẶNG

FR-13 loại mốc nhanh bằng nguyên tắc:

> "Không có mốc nhanh kiểu 'hôm nay / 7 ngày qua / tháng này'. Chúng phục vụ việc **duyệt xem**, mà
> sản phẩm không có chế độ duyệt xem *(NT-3)*."

§9.2 lại để cửa mở:

> "**Khoảng ngày** trong bộ lọc (hiện chỉ một ngày) — thêm khi có bằng chứng là cần"

Nhưng "7 ngày qua" **chính là** một khoảng ngày. Nếu NT-3 loại được mốc nhanh vì nó phục vụ duyệt
xem, thì lập luận đó loại luôn khoảng ngày tổng quát — thứ mạnh hơn và phục vụ duyệt xem tốt hơn.
Tài liệu đang dùng NT-3 để chặn phiên bản yếu, rồi hứa phiên bản mạnh cho v2.

Đây cũng mâu thuẫn với chính lý do FR-13 chọn một ngày: *"người dùng nhớ **một** ngày họp, không nhớ
một quãng"*. Nếu tiền đề đó đúng, khoảng ngày không phải "chưa cần" mà là "không cần" — thuộc §8.

**Vá:** chọn một trong hai, và viết lý do:
- (a) Chuyển "khoảng ngày" xuống §8 Non-Goals, gắn *(NT-3)*, viện đúng lập luận của FR-13; hoặc
- (b) Giữ ở §9.2 nhưng sửa lý do loại ở FR-13: mốc nhanh bị loại **không phải vì NT-3** mà vì tiền
  đề hành vi ("người dùng nhớ một ngày cụ thể"), và ghi rõ điều kiện kích hoạt lại — "nếu retrospective
  cho thấy người dùng thường xuyên nhớ sai ngày ±2 ngày".

Tôi nghiêng về (b): lập luận NT-3 ở FR-13 vốn hơi gượng. Một bộ lọc khoảng ngày vẫn buộc người dùng
*hỏi có mục đích*, nó không phải chế độ duyệt xem. Dùng NT-3 ở đó là dùng nguyên tắc để trang trí
cho một quyết định đã có sẵn — thói quen nguy hiểm nhất với một tài liệu đặt cược vào nguyên tắc.

### 4.4 "Khôi phục thay thế toàn bộ" bị xếp sai chỗ — trung bình

- FR-16 "Ngoài phạm vi": "Đánh đổi **có ý thức** — chọn 'không bao giờ mất gì' thay vì 'khôi phục
  sạch'."
- Addendum §2.9: loại vì nó "tạo ra **nút phá dữ liệu lớn nhất trong app**".
- §9.2: liệt kê nó dưới "Ngoài phạm vi **MVP**" — cùng chỗ với những thứ chỉ là "để sau".

Một tính năng bị loại vì nó nguy hiểm về nguyên tắc không thuộc danh sách "để sau". Cùng họ với 4.2,
vá bằng cùng cách (V5, loại A hoặc B — ở đây tôi cho là loại A).

### 4.5 Lỗi nhãn nhỏ — §9.1

> "- Ghi chú dài bị cắt, mở rộng tại chỗ *(FR-8, FR-9)*"

FR-9 là **trạng thái rỗng không cần giải thích**, không liên quan gì tới cắt/mở rộng. Nên tách thành
một dòng riêng: "- Trạng thái rỗng không có thông báo chào mừng *(FR-9)*". Nhỏ, nhưng §0 tuyên bố mã
FR tồn tại để "các tài liệu sau tham chiếu được" — một tham chiếu sai ở §9.1 sẽ đi thẳng vào epic.

### 4.6 Những chỗ **không** mâu thuẫn (đã kiểm tra và loại trừ)

- §8 "Không nhắc nhở, không thông báo" vs FR-17: **không** mâu thuẫn — §8 tự khai ngoại lệ ngay tại
  chỗ, có dẫn FR. Đây là cách xử lý ngoại lệ đúng chuẩn, nên dùng làm mẫu cho V5.
- §8 "Không phải hồ sơ đối chứng" vs §2.1 và UJ-2: **không** mâu thuẫn — §2.1 có nguyên một khối
  trích dẫn tự phủ nhận trước, và UJ-2 dùng chữ "xác minh" chứ không dùng chữ "bằng chứng". Nhất
  quán ở mức hiếm gặp.
- §8 "Không xóa hàng loạt" vs FR-16 (nạp file tạo hàng loạt ghi chú): **không** mâu thuẫn với §8,
  nhưng mâu thuẫn với mệnh đề bổ sung của §5.3 — đã nêu ở mục 2.1.

---

## 5. KIỂM TRA 4 — Nguyên tắc thừa và nguyên tắc chồng lấn

### 5.1 Không nguyên tắc nào thừa hoàn toàn — nhưng NT-1 gần như không bao giờ là nguyên tắc quyết định

Thử bỏ từng nguyên tắc và xem có mất khả năng loại trừ nào không:

| Bỏ | Mất gì |
|---|---|
| Bỏ NT-1 | Mất khả năng loại: bước chọn thư mục/loại/template *trước khi gõ*, màn hình chào, nút "Tạo ghi chú mới" phải bấm trước. NT-2 cho tất cả những cái đó đi qua vì chúng đều nằm trong "Tạo mới". **Cần thiết.** |
| Bỏ NT-2 | Mất tất cả: ghim, màu, sao, nhãn, trạng thái. Addendum §3 đã chứng minh. **Cần thiết, và là nguyên tắc mạnh nhất.** |
| Bỏ NT-3 | Mất khả năng loại: màn hình "xem tất cả", mốc nhanh, gợi ý. Cả FR-6 lẫn F4 mất căn cứ. **Cần thiết.** |
| Bỏ NT-4 | Mất khả năng loại: sắp xếp theo lần sửa cuối, "ghi chú vừa sửa nhảy lên đầu". NT-2 chỉ loại được *thao tác* sắp xếp thủ công, không loại được một *quy tắc sắp xếp* khác do hệ thống áp. **Cần thiết.** |

Không cái nào thừa. Nhưng cần ghi nhận một quan sát: **NT-1 hầu như không bao giờ là nguyên tắc thực
sự quyết định**. Nó chỉ loại đúng một họ hẹp — bước trung gian giữa "mở app" và "ký tự đầu tiên".
Trong toàn bộ tài liệu, mọi chỗ NT-1 được viện dẫn để loại một tính năng cụ thể (§8 mục phân loại,
addendum §2.2 hàng 4) đều là **viện dẫn sai**; NT-2 mới là thứ đang làm việc. Và trong KIỂM TRA 2 ở
trên, NT-1 không loại được đề xuất nào trong mười cái.

Đó không phải lý do bỏ NT-1 — nó vẫn cần cho việc (a) chặn màn hình chào và bước chọn template, và
(b) làm nền cho FR-1/FR-3/NFR-1. Nhưng nên hạ kỳ vọng về nó trong văn bản, và đặc biệt là **ngừng
dán nhãn NT-1 lên những quyết định thuộc NT-2**.

### 5.2 Chồng lấn thật: NT-2 và NT-4 cùng loại "kéo thả sắp xếp"

NT-2 liệt kê trong danh sách của mình: *"ghim, màu, đánh sao, **kéo thả sắp xếp**, trạng thái
xong/chưa, nhãn, thư mục, độ ưu tiên."*

Nhưng "kéo thả sắp xếp" đã bị NT-4 loại rồi, và loại triệt để hơn: NT-4 nói *"Thứ tự hiển thị **luôn**
theo thời điểm tạo"* — không có chỗ cho bất kỳ thứ tự thủ công nào, dù người dùng có kéo thả hay
không.

Hệ quả nhìn thấy được ngay trong tài liệu: **FR-7 phải trích dẫn cả hai nguyên tắc cho hai dòng liền
nhau** —

> - Không có bất kỳ cách nào để đổi thứ tự. *(NT-2)*
> - Sửa nội dung một ghi chú cũ không làm nó đổi vị trí. *(NT-4)*

Dòng đầu lẽ ra cũng là NT-4. Người đọc sau sẽ phải đoán khi nào dùng nguyên tắc nào cho một đề xuất
liên quan tới thứ tự, và hai người sẽ trích hai nguồn khác nhau cho cùng một kết luận. Đó là nhập
nhằng thật, dù hậu quả nhẹ.

Chồng lấn này còn che một khoảng trống: nếu ai đó đề xuất "sắp xếp theo lần sửa gần nhất" (không có
kéo thả, không có thao tác thủ công), NT-2 hoàn toàn im lặng — chỉ NT-4 loại được. Việc NT-2 liệt kê
"kéo thả sắp xếp" tạo cảm giác sai rằng NT-2 canh cả chuyện thứ tự.

**Vá — V8:** bỏ "kéo thả sắp xếp" khỏi danh sách của NT-2 và thêm một dòng dẫn chéo:

> ... ghim, màu, đánh sao, trạng thái xong/chưa, nhãn, thư mục, độ ưu tiên. *(Mọi đề xuất liên quan
> tới **thứ tự** — kéo thả, sắp xếp theo lần sửa, tự động nhóm — thuộc thẩm quyền **NT-4**, không
> phải NT-2.)*

Đồng thời sửa FR-7 dòng đầu: `*(NT-2)*` → `*(NT-4)*`.

### 5.3 NT-4 đang gộp hai mệnh đề khác loại

NT-4 có tên là **"Thời điểm tạo là bất biến"** nhưng chứa ba câu thuộc hai loại khác nhau:

| Câu | Loại |
|---|---|
| "Sửa nội dung không làm ghi chú đổi chỗ" / "Vị trí và dấu thời gian phải luôn nói cùng một điều" | **Bất biến dữ liệu** — đúng với tên nguyên tắc |
| "Thứ tự hiển thị luôn theo thời điểm tạo, mới nhất trên cùng" | **Quy tắc sắp xếp** — một quyết định trình bày, không phải một bất biến |

Mệnh đề thứ hai mới là thứ làm việc nặng (nó loại "sắp xếp theo lần sửa", "nhóm theo tuần", "kéo
thả"), nhưng nó lại nấp dưới một cái tên không gợi ra điều đó. Ai đọc lướt tiêu đề "Thời điểm tạo là
bất biến" sẽ không nghĩ tới việc đem một đề xuất về *thứ tự* ra hỏi nó — và đó chính là điều đã xảy
ra ở FR-7, nơi tác giả trích NT-2 cho câu về thứ tự.

**Vá (tùy chọn):** đổi tên NT-4 thành **"Thời điểm tạo là bất biến, và là thứ tự duy nhất"**, hoặc
tách thành NT-4a (bất biến) và NT-4b (thứ tự). Tôi nghiêng về đổi tên — thêm nguyên tắc thứ năm về
sắp xếp sẽ làm loãng bộ nguyên tắc, mà V2/V3 đã thêm hai cái rồi.

### 5.4 Không có chồng lấn gây nhập nhằng giữa NT-1 và NT-3

Hai nguyên tắc này canh hai đầu đối lập — NT-1 canh **đầu vào** (ý nghĩ → chữ), NT-3 canh **đầu ra**
(kho dữ liệu → mắt). Chúng không bao giờ cùng được viện dẫn cho một đề xuất, và không có ca nào
trong KIỂM TRA 2 khiến chúng xung đột. Đây là phần kiến trúc lành mạnh nhất của §3 và nên giữ nguyên
làm khung khi thêm NT-5, NT-6.

---

## 6. Danh sách vá, xếp theo mức độ nặng

| # | Vá | Ở đâu | Mức |
|---|---|---|---|
| V1 | Viết lại NT-2 với phạm vi ba tầng tường minh (ghi chú / dòng ghi chú / kho dữ liệu); chuyển từ "hành động thứ tư" sang "thuộc tính thứ tư" | §3 NT-2 | **Nặng** |
| V4 | Sửa dẫn nguồn sai: §8 mục phân loại `(NT-1, NT-2)` → `(NT-2)`; addendum §2.2 hàng 4 "đâm vào NT-1" → "đâm vào NT-2" | §8, addendum §2.2 | **Nặng** |
| V5 | Tách §8 thành loại A (nguyên tắc loại, vĩnh viễn) và loại B (chi phí loại ở v1, có điều kiện kích hoạt); di chuyển "hoàn tác" và "khôi phục thay thế" cho đúng chỗ | §8, §9.2 | **Nặng** |
| V6 | FR-12: giới hạn số kết quả tìm kiếm + tối thiểu 2 ký tự; thêm SM-C3 | §5.4, §10 | **Nặng** |
| — | Quyết dứt điểm "khoảng ngày": xuống §8 với `(NT-3)`, hoặc sửa lý do loại mốc nhanh ở FR-13 sang tiền đề hành vi | FR-13, §9.2 | **Nặng** |
| V2 | Thêm **NT-5 · Màn hình chỉ hiện thứ người dùng đã hỏi** | §3 | Trung bình |
| V3 | Thêm **NT-6 · Không có gì để cấu hình** (nâng câu Vision thành tiêu chí loại trừ) | §3 | Trung bình |
| V7 | Sửa Glossary "Thời điểm tạo" để bao phủ đường nạp lại (FR-16) | §4 | Trung bình |
| V8 | Bỏ "kéo thả sắp xếp" khỏi NT-2, thêm dẫn chéo sang NT-4; sửa FR-7 dòng đầu `(NT-2)` → `(NT-4)` | §3, FR-7 | Trung bình |
| — | Xóa mệnh đề "một ghi chú tại một thời điểm" ở §5.3 hoặc nâng nó lên §3 kèm ngoại lệ FR-16 | §5.3 | Trung bình |
| — | Đổi tên NT-4 thành "Thời điểm tạo là bất biến, và là thứ tự duy nhất" | §3 | Nhẹ |
| — | Thêm mục Glossary **Chốt** (cho FR-4); phân biệt "biến đổi ghi chú" và "thay đổi hiển thị" (cho FR-8) | §4 | Nhẹ |
| — | Tách FR-9 khỏi dòng FR-8 ở §9.1 | §9.1 | Nhẹ |
| — | Thêm Open Question: nạp file sao lưu chứa ghi chú có thời điểm tạo thuộc hôm nay | §11 | Nhẹ |

---

## 7. Phán quyết

**Bốn nguyên tắc có đứng vững không?** Có, ở nghĩa quan trọng nhất: chúng đã thật sự lái 17 FR, và
không FR nào phản bội chúng. Một tài liệu tuyên bố có nguyên tắc rồi vi phạm nguyên tắc của chính
mình ở FR thứ ba là chuyện thường; ở đây không xảy ra. Đó là kết quả tốt và nên được ghi nhận trước
mọi phê bình.

Nhưng lời tuyên bố ở §0 — *"mọi tranh cãi về sau đều xử bằng bốn nguyên tắc ở đó"* — **chưa đúng**.
Bốn nguyên tắc xử được 5/10 đề xuất giả định, và cả năm ca thất bại đều rơi vào hai vùng mù có hình
dạng rõ: **thứ nằm quanh ghi chú thay vì gắn vào ghi chú**, và **thứ mọc trên màn hình thay vì trên
dữ liệu**. Cộng thêm việc §8 dẫn sai nguyên tắc cho đúng ví dụ trung tâm của tài liệu, và việc "hoàn
tác" đang vừa bị nguyên tắc cấm vừa được lên lịch làm — đây là những vết nứt sẽ mở rộng đúng vào lúc
sản phẩm cần nguyên tắc nhất, tức là tháng thứ ba, khi có người đề xuất một tính năng nghe rất hợp
lý.

Chỗ mỏng nhất, nếu chỉ được sửa một thứ: **phạm vi của NT-2 (V1)**. Nó vừa là nguồn của 6/17 FR mập
mờ, vừa là nguồn của 2/5 ca mập mờ ở kiểm tra ngược, vừa là thứ khiến §8 và addendum dán nhãn sai.
Một đoạn văn ba dòng xử được cả ba.

---

*Review chạy ngày 2026-09-09, đối chiếu `prd.md` và `addendum.md` bản `updated: 2026-09-08`.*
