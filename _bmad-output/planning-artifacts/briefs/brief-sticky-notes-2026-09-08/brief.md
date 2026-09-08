---
title: "Product Brief: Ghi chú hàng ngày"
status: final
created: 2026-09-08
updated: 2026-09-08
---

# Product Brief: Ghi chú hàng ngày

## Executive Summary

Một web app ghi chú nhanh cho **một người dùng, trên một máy tính công ty**. Bạn gõ bất cứ thứ gì
bật ra trong ngày làm việc — việc cần làm, một ý nghĩ, một con số — mà không phải quyết định nó
thuộc loại nào. Mỗi ghi chú tự mang dấu thời gian tạo, và **tìm lại được bằng chữ hoặc lọc theo
thời gian tạo**.

Đây là dự án cá nhân, mục tiêu kép: có một công cụ dùng được hàng ngày, và đi trọn một vòng quy
trình BMAD để học nghề.

## The Problem

Trong lúc làm việc, liên tục có những mẩu thông tin bật ra cần ghi lại ngay — một việc phải làm,
một câu ai đó dặn, một ý tưởng. Chúng nhỏ, gấp và không đáng để mở một công cụ nặng.

Nếu phải dừng lại nghĩ "ghi cái này vào đâu", thì hoặc là mất mạch làm việc, hoặc là không ghi
nữa. Vài ngày sau cần tìm lại thì không nhớ nổi nó ở đâu.

Các công cụ đang dùng đều hỏng ở một chỗ cụ thể:

| Công cụ | Hỏng ở đâu |
|---|---|
| **Notepad++** | Tab `new 1`, `new 2`, `new 7` chất đống. Mở lên là **rối mắt và mất tập trung** — chính đống tab đó giết chết công cụ. Không có dấu thời gian, không tìm kiếm được xuyên các tab. |
| **Microsoft Sticky Notes** | Không hiện thời điểm tạo ghi chú, nên nhìn lại không biết cái nào thuộc ngày nào. Từ 08/2024 đã bị gộp vào OneNote, không còn là app nhỏ và nhanh nữa. |

Điểm chung: cả hai đều **bắt bạn tự đối diện với cả đống ghi chú** mỗi lần mở ra, và không cho bạn
cách nào để hỏi thẳng thứ mình cần.

## The Solution

Một trang web duy nhất, mở ra là gõ được ngay. Mỗi ghi chú là một **card mang dấu thời gian tạo**.

**Hai nguyên tắc định hình toàn bộ sản phẩm:**

**1. Không phân loại lúc gõ.**
Việc phải làm và ý nghĩ vu vơ đi vào cùng một luồng. Không thư mục, không tag, không trạng thái
xong/chưa xong. Phân loại là công việc trí óc, và bắt người ta làm việc đó ngay lúc đang bận chính
là lý do ghi chú không được ghi.

**2. Không bao giờ phải nhìn cả đống — hỏi đúng cái mình cần.**
Card mới nằm trên, card cũ lùi xuống dưới. Nhưng thứ tự sắp xếp không phải là câu trả lời cho vấn
đề lộn xộn: ghi chú tồn tại vĩnh viễn, nên sau vài tháng sẽ có hàng trăm card. Câu trả lời thật là
**tìm kiếm bằng chữ và lọc theo thời gian tạo** — bạn không lục, bạn hỏi; dấu thời gian là cái neo
để định vị lại ghi chú thuộc ngày làm việc nào.

## Who This Serves

Một người: chính tác giả. Trên một máy tính công ty, một trình duyệt.

Đây không phải là sự khiêm tốn giả tạo — nó là một **quyết định kỹ thuật có hệ quả lớn**: không cần
tài khoản, không cần đăng nhập, không cần server hay database. Dữ liệu nằm trong trình duyệt. Sản
phẩm nhỏ đi đáng kể, và nhờ đó hoàn thành được.

## What Makes This Different

**Không có gì đặc biệt về mặt tính năng, và brief này không giả vờ là có.**

Tìm kiếm, lọc theo thời gian, sắp xếp mới trước — Google Keep và Sticky Notes đều làm được ở mức nào
đó. Đây không phải là sản phẩm thắng bằng tính năng độc quyền.

Thứ sản phẩm này đánh cược là **sự kỷ luật trong việc từ chối**:

> Mọi công cụ ghi chú đều lớn dần lên: thêm thư mục, thêm tag, thêm rich text, thêm cộng tác — cho
> đến khi việc ghi một dòng chữ cần ba lần bấm. Sản phẩm này cố tình không có gì để cấu hình, không
> có gì để phân loại, không có gì để dọn dẹp.

Khảo sát cho thấy không có app sticky-note thuần web nào vừa nhiều sao vừa còn được bảo trì
*(chi tiết trong `addendum.md`)*. Chỗ trống đó có thể vì chưa ai làm tử tế — cũng có thể vì không ai
cần. Chưa có bằng chứng để kết luận, và với một dự án cá nhân thì cũng không cần.

## Success Criteria

Những thước đo đáng tin được, vì chỉ có một người dùng:

1. **Sau một tháng, tác giả vẫn đang dùng nó** — và đã bỏ Notepad++ cho việc ghi chú nhanh.
2. **Mở ra là gõ được ngay**, không có bước trung gian nào chen vào giữa ý nghĩ và con chữ.
3. **Mở lên không thấy rối mắt** — thất bại của Notepad++ không lặp lại, kể cả khi đã có hàng trăm card.
4. **Tìm lại được một ghi chú cũ** mà không phải cuộn tìm.
5. **Đi trọn vòng BMAD**, từ brief này đến retrospective.

## Scope

**Trong phạm vi (MVP)**

- Tạo card ghi chú nhanh, không phân loại
- Dấu thời gian tạo trên mỗi card
- Card mới xếp trước, card cũ xếp sau
- Tìm kiếm bằng chữ
- Lọc theo thời gian tạo
- Lưu trong trình duyệt của máy đang dùng
- **Xuất dữ liệu ra file** — xem mục rủi ro bên dưới

**Ngoài phạm vi (nói rõ để phạm vi không trôi)**

- ❌ **Always-on-top** — trình duyệt không làm được. Tác giả xác nhận không cần.
- ❌ **Đồng bộ nhiều máy, tài khoản, backend** — chỉ dùng một máy.
- ❌ **Trạng thái xong/chưa xong, độ ưu tiên** — đi ngược nguyên tắc "không phân loại"
- ❌ **Thư mục, tag, phân cấp** — cùng lý do
- ❌ **Mobile app, cộng tác, chia sẻ, rich text**

## Rủi ro đã biết: Mất dữ liệu

Ghi chú tồn tại vĩnh viễn nhưng chỉ nằm trong trình duyệt của **một máy tính công ty**. Một lần
`Clear browsing data`, một lần IT cài lại máy, một lần đổi máy — là mất toàn bộ.

Đây không phải là rủi ro giả định: lời than phiền **số một** về Microsoft Sticky Notes chính là ghi
chú tự biến mất *(bằng chứng trong `addendum.md`)*. Vì vậy **xuất dữ liệu ra file nằm trong MVP** —
tác giả chấp nhận đánh đổi thêm chút công sức để không mất trắng.

## Open Questions

Để lại cho PRD, không đoán bừa ở đây:

1. **Xuất ra định dạng gì?** JSON (nhập lại được), Markdown (người đọc được), hay text thuần? Có
   cần nhập lại (import) không, hay chỉ cần xuất?
2. **Lọc theo thời gian trông như thế nào?** Chọn khoảng ngày, hay các mốc nhanh kiểu "hôm nay / 7
   ngày qua / tháng này"?
3. **Một card dài bao nhiêu?** Một dòng, một đoạn, hay tự do? Điều này định hình cả giao diện.

## Vision

Không có tham vọng mở rộng: phục vụ tốt một người trong công việc hàng ngày là đã thành công. Nếu
về sau tác giả muốn dùng trên nhiều máy, Architecture sẽ được thiết kế sao cho ngày đó không phải
đập đi làm lại.

---

*Trước đây dự án mang tên "Sticky Notes". Đổi tên vì sản phẩm không còn là sticky notes — không
always-on-top, không dán lên màn hình.*

*Chi tiết khảo sát thị trường và đối thủ: [`addendum.md`](./addendum.md)*

*Nhật ký quyết định của phiên làm việc: `.memlog.md`*
