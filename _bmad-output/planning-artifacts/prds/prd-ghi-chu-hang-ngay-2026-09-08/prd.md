---
title: "PRD: Ghi chú hàng ngày"
status: final
created: 2026-09-08
updated: 2026-09-10
---

# PRD: Ghi chú hàng ngày

## 0. Mục đích tài liệu

Tài liệu này dành cho người sẽ thiết kế và xây sản phẩm — và cho chính tác giả khi quay lại sau vài
tháng. Nó nói **cái gì phải đúng**, không nói trông thế nào hay làm bằng gì; hai câu đó thuộc về
`bmad-ux` và `bmad-architecture`.

Cách đọc: **§3 Nguyên tắc thiết kế** là dao mổ — mọi tranh cãi về sau đều xử bằng bốn nguyên tắc ở
đó. **§4 Glossary** khóa từ vựng cho cả tài liệu. **§5 Features** gom yêu cầu thành năm nhóm. Chỗ
nào tài liệu đang phỏng đoán thì gắn nhãn `[ASSUMPTION]` ngay tại chỗ và gom lại ở **§12**.

> **Mã định danh là cố định vĩnh viễn.** `FR-N`, `NFR-N`, `NT-N`, `UJ-N`, `SM-N`, `A-N` — tài liệu
> downstream tham chiếu tới chúng. FR mới được cấp số tiếp theo và đặt vào nhóm phù hợp, không đánh
> lại số. Vì vậy số thứ tự trong một nhóm có thể không liên tục; đó là bình thường.

PRD này dựng trên [`brief.md`](../../briefs/brief-sticky-notes-2026-09-08/brief.md) và
[`addendum.md`](../../briefs/brief-sticky-notes-2026-09-08/addendum.md) (khảo sát thị trường, bằng
chứng người dùng), không chép lại chúng. Ba câu hỏi mở mà brief cố ý để lại đều đã được xử lý:
**định dạng xuất dữ liệu** (§5.5, phần còn ngỏ ở §11 mục 4), **hình dạng bộ lọc thời gian** (FR-13),
**độ dài một ghi chú** (FR-18).

Lý do đằng sau từng quyết định, và các phương án đã bị loại, nằm ở [`addendum.md`](./addendum.md).

---

## 1. Vision

**"Ghi chú hàng ngày" là một trang web mở ra là gõ được ngay.** Mỗi thứ bạn gõ trở thành một ghi chú
mang dấu thời gian tạo — việc cần làm, một câu ai đó dặn, một con số, một ý nghĩ vu vơ — tất cả đi
vào cùng một luồng. Không thư mục, không nhãn, không trạng thái xong/chưa xong, không có gì để cấu
hình.

Nó tồn tại để **khoảng cách giữa "có một ý nghĩ" và "ý nghĩ đó đã nằm an toàn ở đâu đó" bằng không.**
Công cụ tác giả đang dùng chèn một quyết định vào giữa khoảng đó: Notepad++ bắt chọn ghi vào tab nào
trong đống `new 1..new 7`. Và khi cần tìm lại thì không tab nào cho biết nó thuộc ngày nào. Ở đây
không có quyết định nào để đưa ra, và mọi ghi chú đều tự mang ngày của nó.

Đổi lại, sản phẩm tự nhận về một vấn đề: ghi chú không tự mất đi, nên sau vài tháng sẽ có hàng trăm
ghi chú. Câu trả lời **không phải** bắt người dùng dọn dẹp, mà là không bao giờ bắt họ nhìn cả đống —
**tìm bằng chữ, lọc theo ngày**. Dấu thời gian là cái neo: bạn không nhớ mình đã viết gì, nhưng bạn
nhớ "hôm thứ Ba tuần trước".

---

## 2. Người dùng

### 2.1 Jobs To Be Done

**Chức năng**

- Khi một mẩu thông tin bật ra giữa lúc tôi đang làm việc, tôi muốn nó **nằm an toàn ở đâu đó trong
  vài giây** để tôi quay lại việc đang làm mà không mất mạch.
- Khi đang cần xác minh một thông tin cụ thể, tôi muốn **hỏi thẳng ra ghi chú đó** — theo ngày, hoặc
  theo một chữ tôi còn nhớ — thay vì cuộn tìm.
- Trong ngày làm việc, tôi muốn **nhìn thấy những gì mình đã ghi trong chính ngày hôm đó** mà không
  phải tự dọn màn hình mỗi sáng.

**Bối cảnh**

- Tôi làm việc trên **một máy tính công ty, một trình duyệt**. Công cụ phải mở được ở đó — không cài
  đặt, không tài khoản, không đăng nhập, không cần quyền admin.
- Ghi chú họp tôi gõ **ngay tại chỗ** trong lúc họp, không viết lại sau. Vì vậy thời điểm tạo ghi
  chú *chính là* ngày diễn ra cuộc họp, và sản phẩm không cần một trường "ngày sự kiện" riêng.

**Cảm xúc**

- Tôi không muốn **mở công cụ lên là thấy rối mắt**. Bảy cái tab `new 7` của Notepad++ làm tôi mất
  tập trung ngay ở giây đầu tiên — đó là thứ đã giết công cụ cũ, không phải thiếu tính năng.

**Người xây**

- Tôi muốn **đi trọn một vòng BMAD** trên một sản phẩm đủ nhỏ để hoàn thành và đủ thật để dùng hàng
  ngày.

> **Hai điều tài liệu này cố ý không hứa.**
>
> **Một —** công việc xác minh ở trên nghe gần giống "thu thập bằng chứng", nhưng không phải. Ghi
> chú ở đây **sửa được tự do và không lưu lịch sử sửa đổi**, nên nó không chứng minh được điều gì
> trước một người cố tình nghi ngờ. Nó là **trợ nhớ có mốc thời gian**: đủ để bạn nói "hôm 03/09 tôi
> có ghi lại, đây", không đủ để làm hồ sơ đối chứng.
>
> **Hai —** job thứ ba chỉ phục vụ **trong phạm vi một ngày**. Việc bạn ghi hôm nay mà phải làm ngày
> mai sẽ **không** tự nổi lên vào ngày mai. Xem §8 Non-Goals.

### 2.2 Không phải người dùng (v1)

Đội nhóm · người cần dùng trên nhiều máy · người dùng điện thoại · người cần chia sẻ ghi chú cho
người khác.

Không phải vì họ không đáng phục vụ, mà vì mỗi nhóm trong số đó kéo theo tài khoản và backend — và
đó là thứ làm sản phẩm này không bao giờ xong.

---

## 3. Nguyên tắc thiết kế

Bốn nguyên tắc dưới đây là **tiêu chí loại trừ**, không phải khẩu hiệu. Mọi đề xuất tính năng — bây
giờ hoặc ba tháng nữa — phải đi qua chúng. Chúng được viết ra vì sản phẩm này đặt cược vào việc *từ
chối*, và một lời từ chối không viết thành văn thì không sống nổi qua tuần thứ ba.

> ### NT-1 · Cửa vào: không có quyết định nào giữa ý nghĩ và con chữ
> Mở ra là gõ được. Không chọn loại, không chọn nơi lưu, không chọn định dạng. Bất kỳ tính năng nào
> bắt người dùng quyết định điều gì *trước khi* chữ kịp xuống đều bị loại.
>
> ### NT-2 · Cửa sau: đúng ba hành động chạm được vào một ghi chú
> **Tạo mới · Sửa nội dung · Xóa.** Hết.
>
> **Phạm vi của NT-2 là ba tầng, và nó chỉ canh tầng thứ nhất:**
>
> | Tầng | NT-2 nói gì |
> |---|---|
> | **Một ghi chú** — thao tác làm đổi nội dung hoặc sự tồn tại của một ghi chú cụ thể | **Đúng ba hành động.** Đề xuất nào thêm hành động thứ tư ở tầng này thì bị loại mà không cần tranh luận — ghim, màu, đánh sao, kéo thả sắp xếp, trạng thái xong/chưa, nhãn, thư mục, độ ưu tiên |
> | **Dòng ghi chú** — thao tác đổi *cái đang được nhìn thấy*, không đụng tới nội dung | NT-2 **không** áp dụng. Đây là địa hạt của NT-3 và NT-4. Lọc theo ngày *(FR-13)* và tìm bằng chữ *(FR-12)* sống ở tầng này |
> | **Kho dữ liệu** — thao tác lên toàn bộ dữ liệu như một khối | NT-2 **không** áp dụng. Sao lưu *(FR-15)* và nạp lại *(FR-16)* sống ở tầng này |
>
> *Vì sao cần cả NT-1 lẫn NT-2:* NT-1 một mình không đủ. Nút ghim không chen vào lúc gõ, nên **NT-1
> cho nó đi qua** — và đó chính là cách tính năng lọt vào những sản phẩm có nguyên tắc nghe rất hay.
> NT-2 là cửa duy nhất chặn được nó.
>
> ### NT-3 · Không bao giờ bắt người dùng nhìn cả đống
> Với hàng trăm ghi chú, câu trả lời không phải là bắt người dùng dọn dẹp, mà là cho họ hỏi đúng thứ
> mình cần: tìm bằng chữ, lọc theo ngày. **Sản phẩm không có chế độ duyệt xem** — không có màn hình
> "xem tất cả", và không khung nhìn nào được phép trả về một danh sách dài vô hạn *(FR-12)*. Mỗi lần
> rời khỏi hôm nay đều là có mục đích.
>
> ### NT-4 · Thời điểm tạo là bất biến
> Thứ tự hiển thị luôn theo thời điểm tạo, mới nhất trên cùng. Sửa nội dung không làm ghi chú đổi
> chỗ, và không có cách nào sắp xếp lại thủ công. Vị trí và dấu thời gian phải luôn nói cùng một
> điều.

---

## 4. Glossary

Các mục còn lại của tài liệu dùng đúng những từ này, không dùng từ đồng nghĩa. Tài liệu downstream
cũng vậy.

- **Ghi chú** — đơn vị nội dung duy nhất của sản phẩm. Một khối văn bản thuần, nhiều dòng, mang một
  *thời điểm tạo* bất biến và một *định danh*. Không có loại, không có trạng thái, không có nhãn.
  Một ghi chú không chứa ghi chú khác.
- **Ô soạn thảo** — một chỗ **cố định** trên màn hình, tách khỏi *dòng ghi chú*, luôn sẵn con trỏ
  khi mở app. Đây là nơi duy nhất tạo ra ghi chú mới.
- **Bản nháp** — nội dung đang có trong *ô soạn thảo*, chưa được chốt. Bản nháp **chưa phải** ghi
  chú: nó không có thời điểm tạo, không nằm trong dòng ghi chú, không tìm được, và không có trong
  *file sao lưu*. Tại một thời điểm chỉ tồn tại tối đa một bản nháp.
- **Chốt** — hành động biến bản nháp thành ghi chú, bằng `Ctrl+Enter` *(FR-4)*.
- **Thời điểm tạo** — mốc ngày + giờ do hệ thống gán cho một ghi chú tại lúc *chốt*. Không sửa được,
  không đổi khi nội dung đổi. Là khóa sắp xếp và là căn cứ của *bộ lọc ngày*. Ghi theo giờ địa
  phương của máy tạo ra nó.
- **Định danh** — mã nội bộ, duy nhất và ổn định, gắn với một ghi chú suốt đời nó. Người dùng không
  nhìn thấy. Là căn cứ để *nạp lại* biết ghi chú nào đã có.
- **Dòng ghi chú** — danh sách ghi chú đang hiển thị, luôn xếp theo thời điểm tạo giảm dần.
- **Khung nhìn mặc định** — trạng thái của dòng ghi chú khi người dùng chưa đặt *điều kiện* nào: chỉ
  chứa ghi chú của **hôm nay**. Đây là *trạng thái*, không phải một điều kiện.
- **Điều kiện** — thứ người dùng chủ động đặt để thu hẹp dòng ghi chú. Có đúng hai loại: *bộ lọc
  ngày* và *từ khóa tìm kiếm*. Hai loại này chồng lên nhau được.
- **Bộ lọc ngày** — một điều kiện chọn đúng một ngày lịch; dòng ghi chú chỉ còn ghi chú có thời điểm
  tạo thuộc ngày đó.
- **Từ khóa tìm kiếm** — một điều kiện lọc theo nội dung, áp dụng lên **toàn bộ** ghi chú. Người
  dùng nhập nó vào *ô tìm kiếm*, một chỗ cố định tách khỏi *ô soạn thảo*.
- **File sao lưu** — một file duy nhất chứa toàn bộ ghi chú kèm thời điểm tạo và định danh, do người
  dùng chủ động xuất ra *(FR-15)* và **nạp lại** được *(FR-16)*. "Nạp lại" là từ duy nhất tài liệu
  này dùng cho hành động đó.

> *Từ "card" cố ý không có trong Glossary.* Nó mô tả **hình dạng hiển thị** của một ghi chú, và hình
> dạng thuộc về tài liệu UX. Ở đây chỉ có "ghi chú".

---

## 5. Features

Năm nhóm, đọc theo thứ tự này là đi đúng vòng đời của một ghi chú:

| | Nhóm | Trả lời câu gì | FR |
|---|---|---|---|
| **F1** | Ghi nhanh | Chữ vào hệ thống bằng cách nào, và có an toàn không? | FR-1…5, 18, 19, 20 |
| **F2** | Dòng ghi chú | Mở app ra thì thấy gì? | FR-6…9 |
| **F3** | Sửa & Xóa | Ghi chú đã có thì đụng vào được thế nào? | FR-10, 11 |
| **F4** | Tra cứu | Làm sao thấy được thứ không nằm trên màn hình? | FR-12…14 |
| **F5** | Sao lưu & Khôi phục | Máy hỏng thì sao? | FR-15…17 |

### 5.1 · F1 — Ghi nhanh

**Mô tả.** Mở trang ra là gõ được: con trỏ nằm sẵn trong ô soạn thảo, một chỗ cố định tách khỏi dòng
ghi chú. Những gì gõ vào đó là **bản nháp** — được lưu tự động ngay, nhưng chưa phải ghi chú.
`Ctrl+Enter` **chốt** bản nháp thành ghi chú: nó nhận thời điểm tạo, xuất hiện ở đầu dòng ghi chú, và
ô soạn thảo trống lại để gõ tiếp. Không có nút Lưu ở bất kỳ đâu. *Hiện thực UJ-1.*

#### FR-1 · Gõ được ngay khi mở

Người dùng có thể bắt đầu gõ ngay khi trang tải xong, không qua bước trung gian nào.

**Kiểm chứng được:**
- Sau khi trang tải xong, con trỏ đã nằm sẵn trong ô soạn thảo.
- Không có nút "Tạo mới" nào phải bấm trước khi gõ được.
- Không có bước chọn loại, chọn nơi lưu, hay chọn định dạng. *(NT-1)*

#### FR-2 · Thời điểm tạo, gán lúc chốt, không sửa được

Ghi chú nhận thời điểm tạo tại lúc được **chốt**, không phải lúc ký tự đầu tiên rơi vào ô soạn thảo.

**Kiểm chứng được:**
- Thời điểm tạo = lúc bấm `Ctrl+Enter`. Bản nháp gõ dở lúc `23:00` rồi chốt lúc `09:00` sáng hôm sau
  mang mốc `09:00`, và **xuất hiện trong khung nhìn mặc định của ngày hôm đó**.
- Thời điểm tạo gồm cả ngày và giờ — để hai cuộc họp trong cùng một ngày vẫn phân biệt được.
- Ghi theo giờ địa phương của máy tạo ra ghi chú, và giữ nguyên khi nạp lại trên máy khác *(FR-16)*.
- Người dùng không có bất kỳ cách nào sửa thời điểm tạo.
- Sửa nội dung không làm thay đổi thời điểm tạo, và không làm ghi chú đổi vị trí. *(NT-4)*

#### FR-3 · Tự lưu, không có thao tác lưu

Cả bản nháp trong ô soạn thảo lẫn nội dung ghi chú đang sửa đều được lưu tự động trong lúc gõ.

**Kiểm chứng được:**
- Chữ vừa gõ vẫn còn sau khi đóng tab đột ngột, trình duyệt crash, hoặc khởi động lại máy.
- Bản nháp chưa chốt xuất hiện lại nguyên trạng **trong ô soạn thảo** khi mở app lần sau, bất kể đã
  qua bao nhiêu ngày.
- Không có nút "Lưu" nào trong giao diện.
- Khoảng cách giữa lúc gõ và lúc chữ đã an toàn: **≤ 1 giây**.

#### FR-4 · Chốt và gõ tiếp

`Ctrl+Enter` chốt bản nháp thành ghi chú và làm trống ô soạn thảo.

**Kiểm chứng được:**
- Ghi chú vừa chốt xuất hiện ở đầu dòng ghi chú; ô soạn thảo trống lại và con trỏ vẫn ở trong đó.
- Tay không cần rời bàn phím để gõ ghi chú tiếp theo.
- `Enter` đơn thuần chèn xuống dòng trong bản nháp, **không** chốt.
- `Ctrl+Enter` khi bản nháp rỗng thì không tạo ghi chú nào và không làm gì cả.

#### FR-5 · Ghi chú rỗng không tồn tại

**Kiểm chứng được:**
- Khi người dùng xóa hết ký tự của một ghi chú và rời khỏi nó, ghi chú đó biến mất và **không** hỏi
  xác nhận.
- Đây là ngoại lệ có chủ đích của FR-11 ("xóa phải xác nhận"), và là ngoại lệ duy nhất.
- Lý do: vì có tự lưu, không có quy tắc này thì mỗi lần lỡ tay sẽ để lại một ghi chú rỗng nằm đó
  vĩnh viễn.

#### FR-18 · Nội dung một ghi chú

Ghi chú là **văn bản thuần, nhiều dòng, độ dài tự do**.

**Kiểm chứng được:**
- Ghi chú chứa được từ một dòng ("gọi lại cho anh Tuấn") tới một biên bản họp nhiều đoạn — cùng một
  luồng, không phân biệt.
- Xuống dòng được giữ nguyên. Không có định dạng nào khác: không đậm/nghiêng, không danh sách, không
  bảng, không ảnh, không đính kèm.
- `[ASSUMPTION: trần 20.000 ký tự cho một ghi chú, đủ cho biên bản dài nhất; vượt trần thì báo cho
  người dùng thay vì cắt im lặng]` — cần một con số để tính được ngân sách dung lượng lưu trữ.

#### FR-19 · Không được thất bại im lặng khi hết dung lượng

Trình duyệt có giới hạn dung lượng lưu trữ. Khi chạm giới hạn, người dùng phải biết.

**Kiểm chứng được:**
- Khi một thao tác lưu thất bại vì hết dung lượng, app **báo rõ ràng** và chỉ ra việc cần làm: xuất
  file sao lưu, hoặc xóa bớt ghi chú cũ.
- App **không bao giờ** để một thao tác lưu thất bại mà giao diện vẫn tỏ ra như đã lưu xong.
- Có cảnh báo **trước** khi chạm giới hạn, không phải chỉ khi đã hỏng.
- Lý do: FR-3 hứa chữ luôn an toàn. Nếu lời hứa đó gãy mà không ai báo, người dùng mất dữ liệu và
  chỉ phát hiện ra vài tuần sau — đúng kiểu thất bại tệ nhất mà brief đã ghi nhận ở Microsoft
  Sticky Notes.

#### FR-20 · Nhiều tab không được âm thầm ghi đè nhau

Người dùng để app mở cả ngày *(UJ-1)*, nên mở hai tab cùng lúc là chuyện bình thường, không phải
trường hợp hiếm.

**Kiểm chứng được:**
- Ghi chú tạo hoặc sửa ở tab này **không bị mất** vì tab kia ghi đè lên.
- Bản nháp *(FR-3)* ở tab này không bị tab kia xóa mất.
- Nếu sản phẩm không thể bảo đảm điều trên bằng cơ chế kỹ thuật, nó **phải cảnh báo** người dùng khi
  phát hiện có tab thứ hai — im lặng không phải một lựa chọn.
- Cách hiện thực để `bmad-architecture` quyết; PRD chỉ yêu cầu **không mất dữ liệu và không im
  lặng**.

---

### 5.2 · F2 — Dòng ghi chú

**Mô tả.** Khung nhìn mặc định chỉ chứa ghi chú của **hôm nay**, mới nhất trên cùng, nằm dưới ô soạn
thảo cố định — nên nó vừa là nơi ghi, vừa là những gì đã ghi trong ngày, và nó tự rỗng lại mỗi sáng
mà không cần ai dọn. Ghi chú dài bị cắt bớt để dòng ghi chú giữ được nhịp đều. Mọi thứ cũ hơn hôm
nay đi qua F4. Số ghi chú tăng theo năm tháng **không** làm khung nhìn mặc định dài thêm.
*Hiện thực UJ-1.*

#### FR-6 · Khung nhìn mặc định chỉ có hôm nay

**Kiểm chứng được:**
- Khi mở app, dòng ghi chú chỉ chứa ghi chú có thời điểm tạo thuộc ngày hôm nay.
- Không ghi chú nào của ngày khác xuất hiện, kể cả khi hôm nay chưa có ghi chú nào.
- Với 1.200 ghi chú trong máy, chiều dài khung nhìn mặc định vẫn chỉ phụ thuộc số ghi chú **của hôm
  nay**. *(NT-3)*
- Đường ra khỏi hôm nay là F4, và chỉ F4.
- `[ASSUMPTION: "hôm nay" tính theo mốc 00:00 giờ của máy]` — xem §11 mục 1.

> **Đây là chỗ PRD đi khác brief, và tài liệu ghi nhận điều đó.** Brief viết *"card mới nằm trên,
> card cũ lùi xuống dưới"* — tức mọi ghi chú vẫn nằm trên màn hình, chỉ khác thứ tự. FR-6 thu hẹp
> hẳn xuống còn hôm nay. Lý do và phương án bị loại: `addendum.md` §2.4.

#### FR-7 · Mới nhất trên cùng, không đổi được

**Kiểm chứng được:**
- Trong **mọi** khung nhìn — mặc định, kết quả lọc, kết quả tìm — ghi chú xếp theo thời điểm tạo
  giảm dần.
- Không có bất kỳ cách nào để đổi thứ tự. *(NT-4)*
- Sửa nội dung một ghi chú cũ không làm nó đổi vị trí. *(NT-4)*

#### FR-8 · Ghi chú dài bị cắt, mở rộng tại chỗ

**Kiểm chứng được:**
- Ghi chú dài quá `[ASSUMPTION: 3 dòng]` hiển thị cắt bớt, kèm dấu hiệu cho biết còn nội dung phía
  dưới.
- Mở rộng được ngay tại chỗ: không chuyển màn hình, không mở hộp thoại.
- Khi chưa mở rộng, mọi ghi chú có cùng chiều cao trần — để liếc một cái là quét được cả dòng ghi
  chú.
- `[ASSUMPTION: trạng thái mở rộng không được nhớ giữa các phiên]`

#### FR-9 · Trạng thái rỗng không cần giải thích

**Kiểm chứng được:**
- Khi hôm nay chưa có ghi chú nào, màn hình chỉ có ô soạn thảo với con trỏ sẵn trong đó.
- **Không** hiện thông báo kiểu "Bạn chưa có ghi chú nào", không hình minh họa chào mừng.
- Lý do: với khung nhìn mặc định là "hôm nay", **mỗi sáng đều rỗng**. Đó là trạng thái bình thường
  của sản phẩm, không phải trạng thái cần an ủi người dùng.

---

### 5.3 · F3 — Sửa & Xóa

**Mô tả.** Ghi chú sửa được tự do như một ô văn bản thường, lưu tự động y như lúc tạo. Xóa được,
nhưng phải qua một bước xác nhận — vì mất dữ liệu là rủi ro số một của sản phẩm này, và xóa là hành
động duy nhất trong luồng dùng hàng ngày có thể gây ra nó. *Hiện thực UJ-1, UJ-2 — cả hai hành trình
đều có thể cần sửa lại một ghi chú vừa xem.*

#### FR-10 · Sửa nội dung tự do

**Kiểm chứng được:**
- Người dùng đặt được con trỏ vào bất kỳ vị trí nào trong ghi chú và thêm/xóa/sửa chữ như một ô văn
  bản thông thường.
- Thay đổi được lưu tự động, theo đúng ràng buộc ≤ 1 giây của FR-3. Không có nút Lưu.
- Sửa nội dung không đổi thời điểm tạo và không đổi vị trí. *(NT-4)*
- Sửa được ghi chú ở mọi khung nhìn — mặc định, kết quả lọc, kết quả tìm.
- Không lưu lịch sử sửa đổi. *(Xem §8 Non-Goals — đây là lựa chọn có ý thức.)*

#### FR-11 · Xóa phải xác nhận

**Kiểm chứng được:**
- Xóa một ghi chú luôn đi qua một bước xác nhận có hai lựa chọn rõ ràng: hủy hoặc xóa.
- Đóng bước xác nhận bằng `Esc` hoặc click ra ngoài được hiểu là **hủy**, không phải xóa.
- Sau khi xóa, ghi chú biến mất khỏi app và **không có cách nào lấy lại từ trong app** — không thùng
  rác, không hoàn tác.
- **Xóa không xóa khỏi các file sao lưu đã tạo trước đó.** Nạp lại một file sao lưu cũ sẽ làm ghi
  chú đó sống lại *(FR-16)*. Hệ quả thực tế: **đừng dán nội dung nhạy cảm vào app** — xóa không đảm
  bảo nó biến mất.
- Ngoại lệ duy nhất: ghi chú rỗng bị loại bỏ không cần xác nhận *(FR-5)*.

`[NOTE FOR PM: nhược điểm đã biết — sau vài tuần người dùng sẽ bấm "Xóa" theo phản xạ, và lúc đó
bước xác nhận không còn bảo vệ được gì. Nếu điều đó xảy ra, đường thoát là chuyển sang "xóa ngay +
hoàn tác trong 5 giây", KHÔNG phải bỏ phanh.]`

**Ngoài phạm vi của F3:** xóa hàng loạt, chọn nhiều ghi chú, xóa theo ngày. *(NT-2 — ba hành động ở
tầng một ghi chú tác động lên một ghi chú tại một thời điểm.)*

---

### 5.4 · F4 — Tra cứu

**Mô tả.** Vì khung nhìn mặc định chỉ có hôm nay, F4 là **con đường duy nhất** để nhìn thấy bất cứ
thứ gì cũ hơn. Hai điều kiện — lọc theo ngày và tìm bằng chữ — dùng riêng hoặc chồng lên nhau, phục
vụ đúng cách con người thật sự nhớ: mang máng một ngày, mang máng một chữ. *Hiện thực UJ-2.*

> **F4 không được xếp sau và không được cắt bớt khi hết thời gian.** Nếu F4 chậm hoặc khó dùng, sản
> phẩm không phải là "kém tiện" — nó **mất truy cập** vào gần như toàn bộ dữ liệu của chính nó.

#### FR-12 · Tìm bằng chữ, trên toàn bộ dữ liệu

**Kiểm chứng được:**
- Ô tìm kiếm luôn có mặt, không phải mở ra mới dùng được.
- Tìm trong nội dung **tất cả** ghi chú từ trước tới nay, không bị giới hạn bởi khung nhìn đang
  hiện. Lý do: người ta tìm chính vì thứ mình cần **không** ở trước mặt.
- **Bỏ qua dấu tiếng Việt và không phân biệt hoa/thường**: gõ `phan quyen` khớp với ghi chú chứa
  `Phân quyền`, và ngược lại. *Ràng buộc bắt buộc — xem NFR-6.*
- **Số kết quả hiển thị có trần.** `[ASSUMPTION: tối đa 50 kết quả, kèm chỉ báo còn nhiều hơn và lời
  nhắc thu hẹp điều kiện]`. Không có trần thì gõ một ký tự phổ biến sẽ trả về gần như toàn bộ kho và
  dựng lại đúng màn hình "xem tất cả" mà NT-3 loại bỏ.
- `[ASSUMPTION: lọc dần theo từng ký tự gõ, không cần bấm Enter]`
- Kết quả vẫn xếp mới nhất trên cùng *(FR-7)*, và mỗi kết quả vẫn hiện thời điểm tạo — đó là thứ neo
  lại "chuyện này thuộc ngày nào".
- Khi không khớp gì: nói rõ là không có kết quả, không để lại một màn hình trống khó phân biệt với
  trạng thái rỗng bình thường *(FR-9)*.

#### FR-13 · Lọc theo một ngày cụ thể

**Kiểm chứng được:**
- Người dùng chọn được một ngày (`dd/MM/yyyy`) và chỉ thấy ghi chú có thời điểm tạo thuộc ngày đó.
- `[ASSUMPTION: một ngày duy nhất, không phải khoảng ngày]` — dựa trên hành vi thật: người dùng nhớ
  *một* ngày họp, không nhớ một quãng. Trường hợp không nhớ chính xác ngày do FR-12 gánh.
- Không có mốc nhanh kiểu "hôm nay / 7 ngày qua / tháng này". Chúng phục vụ việc duyệt xem, mà sản
  phẩm không có chế độ duyệt xem *(NT-3)*.

#### FR-14 · Kết hợp điều kiện, và đường về

**Kiểm chứng được:**
- Bộ lọc ngày và từ khóa tìm kiếm dùng được đồng thời; kết quả là **giao** của hai điều kiện.
- Khung nhìn mặc định ("hôm nay") là **trạng thái**, không phải điều kiện — nó bị thay thế ngay khi
  người dùng đặt điều kiện đầu tiên, chứ không giao với điều kiện đó.
- **Bắt đầu gõ vào ô soạn thảo sẽ xóa hết mọi điều kiện đang bật** và đưa dòng ghi chú về khung nhìn
  mặc định. Lý do: ghi chú mới luôn mang mốc hôm nay, nên nếu điều kiện còn bật thì chữ vừa gõ sẽ
  không khớp và trôi khỏi màn hình ngay lúc đang gõ.
- Gõ vào **ô tìm kiếm** thì không xóa bộ lọc ngày — đó là đặt điều kiện, không phải ghi chú.
- Xóa hết điều kiện thì quay về khung nhìn mặc định.
- Luôn có đường về khung nhìn mặc định trong **một** thao tác.
- Điều kiện đang áp dụng phải nhìn thấy được — người dùng không bao giờ phải đoán tại sao màn hình
  đang thiếu thứ gì đó.
- `[ASSUMPTION: tải lại trang thì mọi điều kiện bị xóa, quay về khung nhìn mặc định]`

**Mô hình trạng thái** *(bảng này là chuẩn để đối chiếu khi nghiệm thu)*:

| Người dùng làm gì | Dòng ghi chú chứa gì |
|---|---|
| Mở app, chưa đặt điều kiện | Ghi chú của **hôm nay** |
| Gõ vào ô tìm kiếm | Toàn bộ ghi chú khớp từ khóa — "hôm nay" nhường chỗ |
| Chọn một ngày | Ghi chú của ngày đó — "hôm nay" bị thay thế |
| Chọn ngày **và** gõ từ khóa | **Giao** của hai điều kiện |
| **Bắt đầu gõ vào ô soạn thảo** | Mọi điều kiện bị xóa → về **hôm nay** |
| Xóa hết điều kiện | Quay về **hôm nay** |

---

### 5.5 · F5 — Sao lưu & Khôi phục

**Mô tả.** Ghi chú chỉ nằm trong trình duyệt của một máy tính công ty. Một lần `Clear browsing
data`, một lần IT cài lại máy — là mất toàn bộ. F5 là lối thoát duy nhất khỏi kịch bản đó, nên nó
phải là **sao lưu thật**: xuất ra file máy đọc được, và **nạp lại được**. Xuất mà không nạp lại được
thì không phải sao lưu — đó là một cái két sắt không có chìa. *Hiện thực UJ-3.*

#### FR-15 · Xuất toàn bộ ra một file sao lưu

**Kiểm chứng được:**
- Xuất ra **một** file chứa **toàn bộ** ghi chú — không phụ thuộc điều kiện đang áp dụng. Sao lưu
  một phần không phải sao lưu.
- File giữ đủ ba thứ cho mỗi ghi chú: nội dung, thời điểm tạo, định danh.
- File **cũng ghi lại thời điểm nó được xuất ra**, để FR-17 hoạt động lại được sau khi khôi phục
  sang máy mới.
- Bản nháp chưa chốt **không** có trong file sao lưu — nó chưa phải ghi chú *(Glossary)*.
- Định dạng máy đọc được, có mang số phiên bản định dạng — để bản app sau này vẫn nạp được file của
  hôm nay. `[ASSUMPTION]`
- Tên file chứa ngày xuất, để nhiều bản sao lưu không đè lên nhau. `[ASSUMPTION]`
- Dữ liệu chỉ rời máy khi người dùng chủ động bấm. Không tự động xuất, không tự động gửi đi đâu.

#### FR-16 · Nạp lại từ file sao lưu

**Kiểm chứng được:**
- Nạp file đã xuất và khôi phục ghi chú **giữ nguyên thời điểm tạo gốc**. Mất dấu thời gian là mất
  cái neo — khôi phục kiểu đó vô nghĩa với công việc xác minh.
- **Nạp lại là gộp vào, không phải thay thế:** ghi chú nào đã có (đối chiếu theo định danh) thì bỏ
  qua, ghi chú nào chưa có thì thêm vào.
- Nạp lại **không bao giờ** xóa hoặc ghi đè ghi chú đang có. Sau quyết định này, hành động duy nhất
  trong luồng dùng hàng ngày còn có thể phá dữ liệu là FR-11, và nó đã có phanh.
- **Ghi chú đã xóa sẽ sống lại** nếu nó có trong file được nạp. Đây là hệ quả đã biết và được chấp
  nhận của cơ chế gộp — xem cảnh báo ở FR-11.
- File hỏng, sai định dạng, hoặc sai phiên bản: báo lỗi rõ ràng và **không đụng một chữ nào** vào dữ
  liệu đang có.

**Ngoài phạm vi của FR-16:** khôi phục về đúng trạng thái trong file (tức là xóa những gì file không
có). Đánh đổi có ý thức — chọn "không bao giờ mất gì" thay vì "khôi phục sạch".

#### FR-17 · Nhắc thụ động về lần sao lưu gần nhất

**Kiểm chứng được:**
- App ghi nhớ thời điểm xuất gần nhất, và lấy lại được mốc đó từ file sao lưu khi nạp lại trên máy
  mới *(FR-15)* — nếu không, sau khi khôi phục app sẽ im lặng vĩnh viễn, đúng lúc rủi ro cao nhất.
- Hiện thông tin "lần sao lưu gần nhất cách đây bao lâu" ở dạng một dòng nhỏ: **không** chặn đường,
  **không** hộp thoại, **không** phải bấm để tắt.
- `[ASSUMPTION: chỉ hiện khi đã quá 7 ngày chưa sao lưu]` — nếu hiện thường trực thì nó thành rác
  trên màn hình, đi ngược NT-3.

`[NOTE FOR PM: đây là chỗ mỏng nhất của sản phẩm. Cái phanh duy nhất chống lại rủi ro số một vẫn phụ
thuộc vào việc người dùng nhớ bấm. Kịch bản hỏng thật sự: sao lưu một lần vào tháng đầu, bốn tháng
sau IT cài lại máy, mất trắng ba tháng gần nhất. Nếu sau vài tháng dùng thật mà nhắc thụ động không
đủ, đường nâng cấp là nhắc chủ động — không phải bỏ nhắc.]`

---

## 6. User Journeys

Ba hành trình dưới đây là toàn bộ những gì sản phẩm phục vụ. Nhân vật là chính tác giả; gọi là Nam.

- **UJ-1. Nam ghi một việc giữa lúc đang code, không mất mạch.**
  Nam đang sửa một hàm thì Slack nhảy lên: sếp nhờ gọi lại cho anh Tuấn trong chiều nay. Tab app đã
  mở sẵn từ sáng. Nam bấm sang tab, con trỏ đã nằm sẵn trong ô soạn thảo — gõ *"gọi lại cho anh
  Tuấn"*, `Ctrl+Enter`, bấm quay lại IDE. Tổng cộng chưa tới năm giây, và không lúc nào Nam phải
  nghĩ "ghi cái này vào đâu". Ghi chú nằm trên cùng dòng ghi chú hôm nay, mang mốc
  `08/09/2026 10:14`. Đến cuối ngày, những gì hiện trên màn hình chính là những gì Nam đã nhặt được
  trong ngày — không ai phải tạo danh sách đó, và sáng mai nó tự trống.
  **Giới hạn đã biết:** nếu việc đó phải làm *thứ Năm*, sáng mai Nam không còn thấy nó nữa — xem §8.

- **UJ-2. Nam xác minh một yêu cầu đã được duyệt, khi sếp hỏi lại.**
  Ba tháng sau. Sếp hỏi tại sao chỗ này lại làm như vậy. Nam nhớ mang máng: một cuộc họp đầu tháng
  9, và trong đó có nhắc tới phân quyền. Nam mở app — màn hình chỉ có ghi chú hôm nay, không có gì
  gây nhiễu. Nam gõ `phan quyen` vào ô tìm kiếm, **không bỏ dấu, vì đang vội**; kết quả trả về mọi
  ghi chú có chứa "phân quyền", mới nhất trên cùng, mỗi cái mang ngày giờ. Có bốn kết quả. Nam thêm
  bộ lọc ngày `03/09/2026` và còn đúng một ghi chú: biên bản cuộc họp hôm đó, kèm dòng yêu cầu sếp
  đã duyệt. Nam mở rộng nó ra, đọc to lên. Xong việc, Nam xóa điều kiện và về lại hôm nay bằng một
  thao tác.
  **Trường hợp hỏng:** nếu Nam nhớ sai ngày, bộ lọc trả về rỗng và app nói rõ là không có kết quả —
  Nam bỏ bộ lọc ngày, giữ từ khóa, rồi dò bằng mốc thời gian trên bốn kết quả kia.

- **UJ-3. Máy của Nam được IT cài lại.**
  Nam đã xuất file sao lưu hôm thứ Sáu tuần trước — vì tuần trước đó app hiện một dòng nhỏ nói lần
  sao lưu gần nhất đã cách đây tám ngày. Máy mới, trình duyệt mới, app trống. Nam nạp lại file; toàn
  bộ ghi chú trở lại, **giữ nguyên ngày giờ gốc**, nên bộ lọc ngày vẫn trỏ đúng vào những cuộc họp
  cũ, và dòng nhắc sao lưu cũng biết lần gần nhất là thứ Sáu tuần trước. Những gì Nam ghi từ thứ Sáu
  tới lúc máy hỏng thì mất — đó là cái giá đã biết trước của sao lưu thủ công, và tài liệu này không
  giả vờ là không có.

---

## 7. NFR xuyên suốt

**Mốc quy mô dùng chung cho cả mục này:** khoảng 5 ghi chú mỗi ngày làm việc ≈ 100 ghi chú một
tháng ≈ **1.200 ghi chú sau một năm**. Ngưỡng hiệu năng đặt ở **2.000 ghi chú** (khoảng một năm
rưỡi sử dụng) để có biên an toàn.

- **NFR-1 · Mở là dùng được ngay.** Từ lúc mở tab tới lúc gõ được ký tự đầu tiên: `[ASSUMPTION: ≤ 2
  giây]`, kể cả khi trong máy đã có 2.000 ghi chú. Không màn hình chờ, không splash screen.
- **NFR-2 · Tra cứu phải nhanh hơn trí nhớ.** Với 2.000 ghi chú, tìm bằng chữ và lọc theo ngày trả
  kết quả trong `[ASSUMPTION: ≤ 200 ms]`. Lý do: F4 là đường duy nhất tới dữ liệu cũ *(FR-6)*, và nó
  thường được dùng khi có người đang đứng chờ.
- **NFR-3 · Ghi chú không tự mất đi.** Ghi chú tồn tại qua đóng tab, khởi động lại máy, và cập nhật
  phiên bản app. Sản phẩm không tự xóa ghi chú theo tuổi, và không áp giới hạn số lượng của riêng
  nó. Hai chỗ lời hứa này có thể gãy — hết dung lượng và nhiều tab — được xử lý ở FR-19 và FR-20;
  ngoài hai chỗ đó, đây là ràng buộc cứng.
- **NFR-4 · Mở app cần mạng; dùng app thì không.** Sản phẩm là một trang tĩnh host trên GitHub
  Pages, nên **phải có mạng mới tải được app**. Sau khi tải xong, mọi thao tác đọc và ghi ghi chú
  diễn ra hoàn toàn trong máy, không gọi ra dịch vụ ngoài.
  **Rủi ro đã chấp nhận:** mất mạng là không mở được app — ghi chú vẫn nằm nguyên trong máy nhưng
  không đọc được cho tới khi mạng trở lại. Phương án chạy offline sau lần mở đầu tiên đã được cân
  nhắc và loại vì chi phí; xem `addendum.md` §2.11.
  *(Rủi ro "IT chặn tên miền" đã được loại trừ: xác nhận ngày 2026-09-09 là không bị chặn.)*
- **NFR-5 · Dữ liệu không rời máy.** Không tài khoản, không đăng nhập, không đồng bộ, không
  analytics, không telemetry. Dữ liệu chỉ rời máy khi người dùng chủ động xuất file *(FR-15)*. Đây
  là yêu cầu nghiêm túc chứ không phải sở thích: nội dung ghi chú là công việc nội bộ, trên máy công
  ty.
- **NFR-6 · Chuẩn hóa tiếng Việt là ràng buộc lưu trữ, không chỉ là so chuỗi.** FR-12 yêu cầu tìm
  kiếm bỏ dấu; điều này ảnh hưởng tới cách dữ liệu được lưu và đánh chỉ mục, nên `bmad-architecture`
  phải biết từ đầu chứ không xử lý ở lớp giao diện.
- **NFR-7 · Không cài đặt, không quyền admin.** Chạy trong một trình duyệt hiện đại trên máy tính
  công ty chạy Windows. `[ASSUMPTION: trình duyệt cụ thể chưa xác định — xem §11 mục 2]`
- **NFR-8 · Địa chỉ app phải cố định.** Dữ liệu trong trình duyệt gắn với địa chỉ (origin) mà app
  được phục vụ. **Đổi tên miền hoặc đổi đường dẫn là mất toàn bộ ghi chú.** Địa chỉ phải được chọn
  một lần và không đổi; nếu buộc phải đổi thì quy trình chuyển dữ liệu là bắt buộc, không phải tùy
  chọn.

---

## 8. Non-Goals

Những điều sản phẩm này **không** là, và **không** trở thành ở v1. Mục này gánh phần lớn công việc
cho mọi tài liệu phía sau: nó chặn kiểu hỏng "tiện tay thêm cái gần gần đó" ở cả mức epic, ticket
lẫn dòng code.

**Bị nguyên tắc loại**

- **Không phân loại dưới bất kỳ hình thức nào:** nhãn, thư mục, phân cấp, màu, ghim, đánh sao, độ ưu
  tiên. *(NT-2, không phải NT-1 — xem bảng ba tầng ở §3.)*
- **Không trạng thái xong/chưa xong.** Ghi chú không phải task. *(NT-2)*
- **Không sắp xếp thủ công, không ghim lên đầu.** *(NT-2, NT-4)*
- **Không chế độ duyệt xem.** Không có màn hình "xem tất cả ghi chú", và không khung nhìn nào trả về
  danh sách dài vô hạn. *(NT-3)*
- **Không cấu hình.** Không trang cài đặt, không tùy chọn người dùng. *(NT-1)*

**Bị chi phí hoặc phạm vi loại** *(khác loại trên — đây là đánh đổi, không phải nguyên tắc)*

- **Không đồng bộ nhiều máy, không tài khoản, không backend.** Quyết định gốc — nó là lý do sản phẩm
  đủ nhỏ để hoàn thành.
- **Không always-on-top.** Trình duyệt không làm được, và người dùng đã xác nhận không cần. Cơ chế
  thay thế trong thực tế là để tab app mở thường trực *(UJ-1)*.
- **Không thùng rác, không hoàn tác.** Đánh đổi chi phí, không phải nguyên tắc — xem kế hoạch B ở
  NOTE FOR PM của FR-11.
- **Không xóa hàng loạt.** *(NT-2)*
- **Không rich text, không đính kèm, không ảnh.** *(FR-18)*
- **Không nhắc nhở, không thông báo, không lịch.** Ngoại lệ duy nhất là dòng nhắc sao lưu ở FR-17,
  và nó không chặn đường.
- **Không mobile, không cộng tác, không chia sẻ.**
- **Không chạy được khi mất mạng.** *(NFR-4 — rủi ro đã chấp nhận có ý thức.)*

**Giới hạn đã biết, được chấp nhận thay vì che giấu**

- **Không mang việc sang ngày hôm sau.** Ghi chú ghi hôm nay mà phải làm ngày mai sẽ không tự nổi
  lên vào ngày mai; sáng mai màn hình mặc định trống trơn. Người dùng đã cân nhắc và chọn **không xử
  lý** trường hợp này ở v1. Nếu nó trở thành vấn đề thật khi dùng, đây là chỗ phải xem lại đầu tiên
  — và bất kỳ giải pháp nào cũng sẽ phải qua NT-2, vì "mang sang ngày mai" rất dễ biến thành trạng
  thái xong/chưa.
- **Không phải hồ sơ đối chứng.** Không lịch sử sửa đổi, không dấu vết kiểm toán, không khóa ghi
  chú. Sản phẩm là trợ nhớ có mốc thời gian, và tài liệu này không được mô tả nó bằng chữ "bằng
  chứng".
- **Xóa không đảm bảo dữ liệu biến mất.** Ghi chú đã xóa vẫn nằm trong các file sao lưu tạo trước đó
  và sẽ sống lại nếu nạp lại file đó *(FR-11, FR-16)*.

---

## 9. MVP Scope

### 9.1 Trong phạm vi

- Ghi nhanh: ô soạn thảo cố định sẵn con trỏ, `Ctrl+Enter` để chốt và gõ tiếp *(FR-1, FR-4)*
- Thời điểm tạo ngày + giờ, gán lúc chốt, không sửa được *(FR-2)*
- Tự lưu cả bản nháp lẫn ghi chú, không có nút Lưu *(FR-3)*
- Ghi chú văn bản thuần, nhiều dòng, độ dài tự do; ghi chú rỗng tự biến mất *(FR-5, FR-18)*
- **Báo rõ khi hết dung lượng lưu trữ** *(FR-19)* — thêm sau vòng reviewer
- **Nhiều tab không âm thầm ghi đè nhau** *(FR-20)* — thêm sau vòng reviewer
- Khung nhìn mặc định chỉ có hôm nay, mới nhất trên cùng *(FR-6, FR-7)* — **thu hẹp có ý thức so với
  brief**, xem callout ở FR-6
- Ghi chú dài bị cắt, mở rộng tại chỗ *(FR-8, FR-9)*
- Sửa nội dung tự do *(FR-10)*
- Xóa có bước xác nhận *(FR-11)*
- Tìm bằng chữ trên toàn bộ dữ liệu, bỏ dấu tiếng Việt, có trần số kết quả *(FR-12)*
- Lọc theo một ngày cụ thể *(FR-13)*
- Kết hợp hai điều kiện; gõ vào ô soạn thảo thì xóa hết điều kiện *(FR-14)*
- **Xuất file sao lưu** *(FR-15)*
- **Nạp lại từ file sao lưu** *(FR-16)* — **mở rộng có ý thức so với brief**: brief chỉ có xuất
- Nhắc thụ động về lần sao lưu gần nhất, khôi phục được mốc nhắc *(FR-17)*

### 9.2 Ngoài phạm vi MVP

- **Khoảng ngày** trong bộ lọc — nằm ngoài phạm vi vì **chi phí**, không phải vì nguyên tắc. NT-3
  chỉ loại các mốc nhanh kiểu "7 ngày qua" *(FR-13)* vì chúng phục vụ duyệt xem; một khoảng ngày do
  người dùng chủ động nhập để xác minh thì không rơi vào lý do đó.
- **Hoàn tác sau khi xóa** — `[NOTE FOR PM: đường nâng cấp đã định sẵn nếu bước xác nhận tỏ ra vô
  dụng vì phản xạ. Không phải "có thì hay", mà là kế hoạch B đã viết trước.]`
- **Nhắc sao lưu chủ động** — kế hoạch B của FR-17, cùng lý do
- **Khôi phục thay thế toàn bộ** (hiện chỉ gộp) *(FR-16)*
- **Chạy được offline sau lần mở đầu** — cân nhắc và loại ở NFR-4; xem `addendum.md` §2.11
- Đồng bộ nhiều máy, tài khoản, backend — xem §8, đây là *non-goal* chứ không phải "để sau"
- Mọi thứ khác trong §8 Non-Goals

---

## 10. Success Metrics

Những thước đo này đáng tin được, vì chỉ có một người dùng và người đó chính là người đo.

**Chính**

- **SM-1 · Vẫn còn dùng sau một tháng**, và đã bỏ Notepad++ cho việc ghi chú nhanh. Đây là thước đo
  duy nhất thật sự quan trọng — nó nghiệm thu toàn bộ FR-1 tới FR-20 cùng một lúc.
- **SM-2 · Từ lúc mở tab tới lúc chữ đầu tiên xuống được: ≤ 2 giây**, đo bằng đồng hồ, không phải
  bằng cảm giác. Nghiệm thu FR-1, NFR-1.
- **SM-3 · Tìm lại được một ghi chú cũ trong ≤ 30 giây** kể từ lúc nảy ra ý định, không phải cuộn
  tìm lần nào. Nghiệm thu FR-12, FR-13, FR-14.

**Phụ**

- **SM-4 · Với ít nhất 300 ghi chú trong máy (khoảng ba tháng dùng thật), khung nhìn mặc định vẫn
  không dài quá một màn hình.** Đây là cách biến tiêu chí cảm tính "mở lên không thấy rối mắt" thành
  thứ đếm được. Nó chỉ đo được **chiều dài**, không đo được nhiễu thị giác — phần còn lại của tiêu
  chí đó thuộc về `bmad-ux`. Nghiệm thu FR-6, NT-3.
- **SM-5 · Đi trọn vòng BMAD**, từ brief tới retrospective.

**Phản thước đo — không được tối ưu**

- **SM-C1 · Số tính năng thêm vào sau MVP. Mục tiêu là 0.** Đối trọng với SM-1: nếu sản phẩm được
  dùng lâu *nhờ* lớn dần lên, thì nó đã thua chính điều nó đặt cược. Mỗi tính năng thêm vào phải đi
  qua NT-1 và NT-2, và phải ghi lại lý do.
- **SM-C2 · Số ghi chú bị xóa.** Đối trọng với SM-4: có thể đạt "màn hình sạch" bằng cách xóa cho
  gọn — và nếu người dùng thấy mình đang làm vậy thì NT-3 đã hỏng, vì đó chính là dọn dẹp. Màn hình
  sạch phải đến từ khung nhìn mặc định, không đến từ việc xóa.

---

## 11. Open Questions

1. **Biên nửa đêm.** Ghi chú chốt lúc `23:55` rời khỏi khung nhìn mặc định lúc `00:00`. Người dùng
   xác nhận không bao giờ làm việc qua nửa đêm, nên **không giải quyết**. Xem lại nếu thói quen làm
   việc thay đổi.
2. ~~**Trình duyệt nào trên máy công ty?**~~ **ĐÃ ĐÓNG 2026-09-10 bởi `bmad-architecture` (AD-12):**
   đáy là **Chromium bản hiện hành** (Edge / Chrome, tự cập nhật) trên Windows. Không polyfill,
   không kiểm tra tính năng. App chỉ chạy trong secure context — HTTPS ở production, `localhost`
   khi phát triển; cấm mở bằng `file://`.
   *(Vế thứ hai — IT có chặn tên miền GitHub Pages không — đã trả lời: **không chặn**, xác nhận
   ngày 2026-09-09.)*
3. ~~**Giới hạn dung lượng lưu trữ của trình duyệt là bao nhiêu?**~~ **ĐÃ ĐÓNG 2026-09-10 bởi
   `bmad-architecture` (AD-3, AD-10).** Phép tính loại `localStorage`: trần ~5 MB đếm theo UTF-16
   ≈ 2,5 triệu ký tự, mà 2.000 ghi chú thực tế (kèm bản bỏ dấu bắt buộc theo NFR-6) đã ăn quá nửa,
   và khoảng 60 biên bản chạm trần 20.000 ký tự là hết sạch. Ghi chú vì vậy nằm ở **IndexedDB**.
   Ngưỡng cảnh báo là **đã dùng ≥ 80% quota hoặc còn dưới 50 MB trống, cái nào đến trước**, đọc từ
   `navigator.storage.estimate()`. Hai vế là bắt buộc: quota mỗi origin trên Chromium là một phần
   lớn dung lượng ổ, nên riêng vế 80% gần như không bao giờ nổ.
4. ~~**Định dạng file sao lưu cụ thể.**~~ **ĐÃ ĐÓNG 2026-09-10 bởi `bmad-architecture` (AD-11):**
   JSON, hình dạng `{ schemaVersion: 1, exportedAt, notes: [{ id, createdAt, text }] }`, tên file
   `ghi-chu-hang-ngay-YYYY-MM-DD.json`. Nạp đi qua hai pha: kiểm tra toàn bộ trước, rồi ghi trong
   **một** transaction — hỏng giữa chừng thì không để lại nửa file.
5. **Mọi ngưỡng số trong §12 đều đặt trên bàn giấy.** Chỉ dùng thật vài tuần mới biết đúng hay sai.
   Xem lại ở retrospective.
6. **Sản phẩm này có thật sự lấp một khoảng trống, hay khoảng trống đó tồn tại vì không ai cần?**
   Brief đặt câu hỏi này và cố ý không trả lời; PRD cũng không trả lời được. Với n = 1 người dùng,
   SM-1 là bằng chứng duy nhất sẽ có — và nó chỉ chứng minh cho một người. Ghi lại ở đây để tài liệu
   không tỏ ra chắc chắn hơn nền bằng chứng của nó.

---

## 12. Assumptions Index

Mọi `[ASSUMPTION]` còn lại trong tài liệu, gom về một chỗ để rà:

| # | Ở đâu | Giả định |
|---|---|---|
| A-1 | FR-6 | "Hôm nay" tính theo mốc 00:00 giờ của máy |
| A-2 | FR-8 | Ghi chú dài quá **3 dòng** thì bị cắt |
| A-3 | FR-8 | Trạng thái mở rộng không được nhớ giữa các phiên |
| A-4 | FR-12 | Kết quả lọc dần theo từng ký tự gõ, không cần bấm Enter |
| A-5 | FR-13 | Bộ lọc ngày chọn **một** ngày, không phải khoảng ngày |
| A-6 | FR-14 | Tải lại trang thì mọi điều kiện bị xóa, về khung nhìn mặc định |
| A-7 | FR-15 | File sao lưu mang số phiên bản định dạng → **xác nhận: `schemaVersion: 1`** (AD-11) |
| A-8 | FR-15 | Tên file sao lưu chứa ngày xuất → **xác nhận: `ghi-chu-hang-ngay-YYYY-MM-DD.json`** (AD-11) |
| A-9 | FR-17 | Dòng nhắc chỉ hiện khi đã quá **7 ngày** chưa sao lưu |
| A-10 | NFR-7 | ~~Trình duyệt cụ thể chưa xác định~~ → **đã chốt Chromium hiện hành** (AD-12) |
| A-11 | FR-12 | Trần **50 kết quả** hiển thị, kèm chỉ báo còn nhiều hơn |
| A-12 | FR-18 | Trần **20.000 ký tự** cho một ghi chú |
| A-13 | NFR-1 | Mở tab tới lúc gõ được: **≤ 2 giây** |
| A-14 | NFR-2 | Tra cứu với 2.000 ghi chú: **≤ 200 ms** |

---

*Nhật ký quyết định của phiên làm việc: `.memlog.md`*
