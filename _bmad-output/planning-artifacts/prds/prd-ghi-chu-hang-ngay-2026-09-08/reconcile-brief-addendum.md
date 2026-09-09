---
title: "Đối chiếu: Addendum của brief → PRD"
status: draft
created: 2026-09-09
inputs:
  - ../../briefs/brief-sticky-notes-2026-09-08/addendum.md
targets:
  - ./prd.md
  - ./addendum.md
---

# Đối chiếu — Addendum của brief → PRD Ghi chú hàng ngày

**Đầu vào gốc:** [`briefs/brief-sticky-notes-2026-09-08/addendum.md`](../../briefs/brief-sticky-notes-2026-09-08/addendum.md) (status: `final`) — khảo sát thị trường và bằng chứng người dùng, tự khai là bằng chứng đứng sau ba quyết định: **loại always-on-top**, **chọn local-first**, **đưa export vào MVP**.

**Sản phẩm cuối:** [`prd.md`](./prd.md) (status: `draft`) và [`addendum.md`](./addendum.md) (status: `draft`).

Tài liệu này chỉ tìm **những gì bị rơi trên đường đi** và **những gì bị nói quá so với bằng chứng**. Nó không đánh giá chất lượng PRD ở những mặt khác.

Ký hiệu mức độ hạ cánh:

| Ký hiệu | Nghĩa |
|---|---|
| ✅ **ĐẦY ĐỦ** | Nội dung có mặt trong PRD, đúng ý, và có chỗ trú rõ ràng (§ / FR / NFR) |
| 🟡 **MỘT PHẦN** | Có mặt nhưng thiếu vế, thiếu lý do, hoặc chỉ nằm trong văn xuôi mà không thành yêu cầu kiểm chứng được |
| 🔴 **RƠI** | Không tìm thấy chỗ trú nào trong cả `prd.md` lẫn `addendum.md` của PRD |
| ⚠️ **ĐẢO CHIỀU** | PRD làm **ngược lại** điều bằng chứng gợi ý — có thể đúng, nhưng không được ghi nhận là một lựa chọn có ý thức |

---

## 1. Năm điểm "Khoảng trống trên thị trường" — hạ cánh ở đâu?

Đây là mục mà chính đầu vào tuyên bố **"đây là mục PRD sẽ dùng; các mục còn lại là bằng chứng cho nó"**. Vì vậy nó là bài kiểm tra nặng nhất của bản đối chiếu này.

| # | Điểm trong đầu vào | Hạ cánh ở đâu trong PRD | Mức độ | Ghi chú |
|---|---|---|---|---|
| 1 | **Persistence đáng tin** — ghi chú lặng lẽ biến mất sau update / đổi tài khoản | `prd.md` §7 **NFR-3** ("Ghi chú không tự mất đi", tồn tại qua cập nhật phiên bản app) · **FR-3** (tự lưu ≤ 1 giây, sống sót crash/khởi động lại) · §5.5 **F5** toàn mục (**FR-15**, **FR-16**, **FR-17**) · **FR-11** (xóa phải xác nhận) · **FR-16** ("nạp file không bao giờ xóa hoặc ghi đè") · `addendum.md` §1 ràng buộc 2, 4, 5 · §2.3, §2.6, §2.8, §2.9 | ✅ **ĐẦY ĐỦ** | Điểm được phục vụ tốt nhất trong cả năm. PRD thậm chí mở rộng phạm vi (nhập lại, FR-16) so với brief. **Nhưng** không một chỗ nào trong PRD dẫn lại bằng chứng gốc — xem §5 mục E-1 |
| 2 | **Tốc độ** — "bản dựng lại phản bội tiền đề nhỏ và nhanh" | §7 **NFR-1** (≤ 2 giây tới ký tự đầu tiên) · **NFR-2** (≤ 200 ms tra cứu với 2.000 ghi chú) · §5.4 callout "F4 không được xếp sau và không được cắt bớt" · §10 **SM-2** · `addendum.md` §1 ràng buộc 3 | ✅ **ĐẦY ĐỦ** | Ngưỡng số là do PRD tự đặt, đầu vào chỉ cung cấp bằng chứng định tính — xem §5 mục N-5 |
| 3 | **Local-first, không cần tài khoản** | §7 **NFR-5** ("Dữ liệu không rời máy": không tài khoản, không đăng nhập, không đồng bộ, không analytics, không telemetry) · **NFR-4** (chạy được khi mất mạng) · **NFR-7** (không cài đặt, không quyền admin) · §8 Non-Goals dòng 1 · §2.1 Bối cảnh JTBD · §2.2 Không phải người dùng · `addendum.md` §1 ràng buộc 6 | ✅ **ĐẦY ĐỦ** | Vế "cả một hệ sinh thái extension tồn tại chính vì người ta muốn dữ liệu ở lại máy mình" (bằng chứng thị trường cho local-first) không được dẫn — xem §5 mục E-2 |
| 4 | **Cấu trúc nhẹ — giữa "phẳng lì" và "quá nặng"** | Không có chỗ trú nào bảo vệ vế "cấu trúc". Chỗ gần nhất: §5.4 **F4** (FR-12/13/14 — tìm + lọc thay cho phân cấp) và `addendum.md` §2.2 đường 4 ("hai loại ghi chú: thường và khóa") bị loại vì NT-1 | ⚠️ **ĐẢO CHIỀU** | **Chỗ rơi nghiêm trọng nhất của bản đối chiếu này.** Đầu vào định vị khoảng trống ở **giữa** hai cực, với bằng chứng hai chiều: Google Keep bị chê **thiếu** thư mục/lồng cấp/rich text/bảng (Capterra, Cloudwards); Sticky Notes bị chê **thiếu** tag/notebook (SaaSHub); Notion/Obsidian giải cấu trúc nhưng mất tốc độ. PRD đi hẳn về **cực "phẳng lì"**: **NT-2** loại phân loại bằng danh sách trắng, §8 Non-Goals "Không phân loại dưới bất kỳ hình thức nào" + "Không rich text". Đây có thể là quyết định đúng cho n=1, **nhưng PRD không ở đâu ghi nhận rằng nó đang đi ngược bằng chứng thị trường đã thu thập, cũng không nêu lý do vì sao bằng chứng đó không áp dụng.** `addendum.md` của PRD có §2 "Các phương án đã bị loại" gồm 9 mục — **không mục nào là "cấu trúc nhẹ"**. Xem đề xuất ở §6 |
| 5 | **Always-on-top trên web** | §8 Non-Goals: *"Không always-on-top. Trình duyệt không làm được, và người dùng đã xác nhận không cần."* (một dòng duy nhất) | 🟡 **MỘT PHẦN** | Kết luận đúng, nhưng mất toàn bộ cấu trúc lập luận của callout. Phân tích riêng ở §4 |

**Tổng kết mục 1:** 3/5 đầy đủ · 1/5 một phần · 1/5 đảo chiều không ghi nhận. Điểm 4 là chỗ đáng lo nhất.

---

## 2. Phàn nàn về Microsoft Sticky Notes — PRD có phòng không?

Bảng "Phàn nàn được ghi nhận nhiều nhất" trong đầu vào có 5 dòng. Dòng 4 gộp bốn phàn nàn khác nhau nên được tách ra ở đây.

| # | Phàn nàn (nguyên văn đầu vào) | Yêu cầu PRD chống lại nó | Mức độ |
|---|---|---|---|
| 1 | **Mất dữ liệu / sync hỏng** — "chủ đề ồn ào nhất". Trích user: *"the app will not load the data locally, it is always loading the incorrect data from the cloud"*; một người *"mất một nửa số notes"* | **NFR-3** (không tự mất đi) · **FR-3** (tự lưu ≤ 1s) · **FR-15/16/17** (sao lưu, nạp lại, nhắc) · **FR-11** (phanh cho xóa) · **FR-16** ("nạp không bao giờ xóa hoặc ghi đè") · **NFR-5** (không sync ⇒ triệt tiêu hẳn nguyên nhân gốc trong trích dẫn user) | ✅ **PHÒNG KỸ** |
| 2 | **Chậm và lag hơn bản cũ** (Neowin, Windows Latest) | **NFR-1** · **NFR-2** · **SM-2** · callout §5.4 | ✅ **PHÒNG KỸ** |
| 3 | **Bị bundle, không gỡ riêng được** — muốn bỏ thì phải gỡ cả OneNote/Office | Không có yêu cầu nào nhắm thẳng vào điều này. Chỗ gần nhất: **NFR-7** ("không cài đặt, không quyền admin") và **NFR-4** (không gọi dịch vụ ngoài) | 🟡 **PHÒNG NGẦM ĐỊNH** | Một web app đơn lẻ miễn nhiễm với phàn nàn này gần như theo định nghĩa, nhưng PRD **không viết ra** tính chất "sản phẩm là một trang độc lập, không nhúng vào và không phụ thuộc sản phẩm nào khác". Rủi ro thấp; ghi lại cho đủ |
| 4a | **Buộc tài khoản Microsoft** | **NFR-5** · §8 Non-Goals dòng 1 · §2.1 Bối cảnh | ✅ **PHÒNG KỸ** |
| 4b | **Không có tag, notebook hay phân cấp** | Không có yêu cầu nào chống lại. **NT-2** và §8 Non-Goals **cố ý tái tạo đúng thiếu sót này** | ⚠️ **KHÔNG PHÒNG — CỐ Ý LÀM GIỐNG** | Đây là hệ quả trực tiếp của Khoảng trống #4 bị đảo chiều. PRD tự làm mình mang đúng phàn nàn số một về đối thủ ở mặt cấu trúc, và không thừa nhận điều đó bằng văn bản ở bất kỳ đâu |
| 4c | **Format tối thiểu** (không rich text) | Không có. §8 Non-Goals: *"Không rich text, không đính kèm, không ảnh. Chỉ văn bản thuần, nhiều dòng."* | ⚠️ **KHÔNG PHÒNG — CỐ Ý LÀM GIỐNG** | Cùng bản chất với 4b. Ở đây ít rủi ro hơn vì nhất quán với NT-1/NT-2, nhưng vẫn không được đối chiếu với bằng chứng |
| 4d | **Windows-centric** | **NFR-7** khẳng định *"máy tính công ty chạy Windows"* — PRD **chấp nhận** ràng buộc Windows thay vì phòng nó | ⚠️ **KHÔNG PHÒNG — ĐI CÙNG CHIỀU** | Hợp lý với n=1 và §2.2 (không phải người dùng: người cần nhiều máy). Rủi ro thấp, nhưng cần ghi rằng đây là điểm mà PRD **kế thừa** yếu điểm của đối thủ chứ không sửa nó |
| 5 | **Dấu hiệu bị bỏ bê** — Store listing "What's New" vẫn ghi 2020 | Không có yêu cầu nào. Chỗ liên quan gần nhất là **NFR-3** (tồn tại qua cập nhật app) và **FR-15** (file sao lưu có số phiên bản định dạng) | 🔴 **KHÔNG PHÒNG** | Đáng chú ý ở chỗ **SM-C1** ("Số tính năng thêm vào sau MVP. Mục tiêu là 0") tạo ra một sản phẩm mà **về mặt tín hiệu bên ngoài trông y hệt một sản phẩm bị bỏ bê**. PRD không có chỗ nào phân biệt "kỷ luật từ chối" với "bị bỏ rơi", và cũng không có yêu cầu nào về khả năng sống sót dài hạn (ví dụ: file sao lưu vẫn đọc được kể cả khi app biến mất). Với dự án n=1 tự dùng thì tác hại nhỏ, nhưng đây là một phàn nàn đã ghi nhận mà PRD hoàn toàn không đụng tới |

**Tổng kết mục 2:** 3/8 phòng kỹ · 1/8 phòng ngầm định · 3/8 cố ý không phòng (và không thừa nhận) · 1/8 không phòng.

---

## 3. Nhận định "không có sản phẩm nào đặt cược vào việc TỪ CHỐI tính năng"

Nguyên văn đầu vào: *"**Đáng chú ý:** không có sản phẩm nào trong bảng này đặt cược vào việc **từ chối** tính năng. Tất cả đều lớn dần lên theo thời gian."*

**Kết luận: ĐƯỢC TIẾP THU RẤT MẠNH — mạnh nhất trong toàn bộ đầu vào — nhưng bị cắt mất phần dè dặt về độ tin cậy.**

| Vế của nhận định | Hạ cánh ở đâu | Mức độ |
|---|---|---|
| "đặt cược vào việc **từ chối** tính năng" | `prd.md` §3 câu mở đầu: *"Chúng được viết ra vì sản phẩm này **đặt cược vào việc từ chối**, và một lời từ chối không viết thành văn thì không sống nổi qua tuần thứ ba."* — gần như trích lại nguyên văn từ vựng của đầu vào | ✅ **ĐẦY ĐỦ** |
| Cơ chế thực thi việc từ chối | **NT-1** (cửa vào) · **NT-2** (cửa sau, danh sách trắng đúng ba hành động) · toàn bộ §8 Non-Goals · `addendum.md` §3 (giải thích vì sao cần **hai** cửa, với ví dụ "nút ghim" đi lọt qua cửa một) | ✅ **ĐẦY ĐỦ** — vượt yêu cầu |
| "Tất cả đều **lớn dần lên** theo thời gian" | §10 **SM-C1** — phản thước đo: *"Số tính năng thêm vào sau MVP. Mục tiêu là 0. Đối trọng với SM-1: nếu sản phẩm được dùng lâu **nhờ** lớn dần lên, thì nó đã thua chính điều nó đặt cược."* Vế "lớn dần lên" được biến thành một chỉ số đếm được | ✅ **ĐẦY ĐỦ** — vượt yêu cầu |
| Rằng đây là **kết luận từ khảo sát cạnh tranh**, không phải tiên đề thiết kế | 🔴 Không có ở đâu. §3 trình bày "đặt cược vào từ chối" như một tiền đề tự có. Không có tham chiếu tới bảng "Đối thủ trên web", tới `usememos/memos`, hay tới đầu vào nói chung | 🔴 **RƠI** |
| Cảnh báo về **độ tin cậy** của nhận định | 🔴 Rơi hai lớp — xem §5 mục N-2. Đầu vào tự giới hạn: bảng đối thủ *"ở mức định hướng, không phải kết quả tra cứu có dẫn nguồn từng dòng"*, và nhận định chỉ nói *"không sản phẩm nào **trong bảng này**"*. `brief.md` giữ được sự dè dặt đó (*"Chỗ trống đó có thể vì chưa ai làm tử tế — cũng có thể vì không ai cần. Chưa có bằng chứng để kết luận"*). **PRD bỏ hẳn cả hai lớp cảnh báo** | 🔴 **RƠI** |

**Nhận xét:** đây là ví dụ hiếm gặp về việc **nội dung được tiếp thu đầy đủ nhưng độ chắc chắn bị nâng lên** dọc chuỗi tài liệu. Bảng định hướng (addendum) → giả thuyết có ghi rủi ro (brief) → tiền đề thiết kế không cần chứng minh (PRD §3) → chỉ số nghiệm thu (SM-C1). Không có bước nào sai riêng lẻ; hiệu ứng tích lũy là một cam kết cứng đứng trên một nền bằng chứng mềm hơn nó tưởng.

---

## 4. Ràng buộc always-on-top (callout đầu tài liệu)

Nguyên văn callout, được đầu vào đánh dấu là **"ràng buộc quan trọng nhất trong tài liệu này"**:

> *always-on-top chỉ app native làm được — trình duyệt không cho. Đây là ràng buộc trực tiếp lên lựa chọn form-factor web, cần biết trước mọi quyết định về tính năng.*

**Kết luận: KẾT LUẬN ĐÚNG, LẬP LUẬN BỊ CẮT, VÀ CƠ CHẾ THAY THẾ KHÔNG ĐƯỢC BẢO VỆ BẰNG YÊU CẦU NÀO.**

| Vế của callout | PRD xử lý thế nào | Mức độ |
|---|---|---|
| Sự kiện: trình duyệt không làm được always-on-top | §8 Non-Goals: *"Không always-on-top. Trình duyệt không làm được..."* | ✅ **ĐÚNG** |
| Kết luận: sản phẩm không có always-on-top | §8 Non-Goals, cùng dòng. `brief.md` còn ghi cả việc đổi tên sản phẩm khỏi "Sticky Notes" vì lý do này | ✅ **ĐÚNG** |
| Chiều nhân quả: **web ⇒ mất always-on-top** (đây là *cái giá* của form-factor) | 🟡 PRD lật ngược thành *"người dùng đã xác nhận không cần"* ⇒ web ổn. **NFR-7** chốt "chạy trong một trình duyệt hiện đại" nhưng **không nối** với always-on-top ở bất kỳ đâu. `addendum.md` của PRD §2 liệt kê 9 phương án bị loại — **không có mục nào về form-factor**. Người đọc PRD sáu tháng sau sẽ không biết rằng "web" là một lựa chọn đã trả giá | 🟡 **MỘT PHẦN** |
| "cần biết **trước mọi quyết định về tính năng**" — tức đây phải là ràng buộc ở tầng cao nhất | 🔴 Trong PRD nó nằm ở **§8 Non-Goals, dòng thứ 2**, dưới dạng một gạch đầu dòng — cùng hạng với "không đánh sao", "không lịch". Từ chỗ là ràng buộc gốc quyết định hình dạng sản phẩm, nó tụt xuống thành một mục trong danh sách loại trừ. Không có mặt ở §1 Vision, §3 Nguyên tắc, §7 NFR, hay `addendum.md` §1 (Ràng buộc gửi Architecture — 7 mục, không mục nào là form-factor) | 🔴 **HẠ CẤP** |
| "Các app desktop lấy tính năng này làm điểm bán (Noticky, Pinny Notes) **tồn tại chính vì** trình duyệt không làm được" — tức cả một phân khúc đối thủ sinh ra từ khoảng trống này | 🔴 Không có gì trong PRD | 🔴 **RƠI** |
| **Cơ chế thay thế** cho always-on-top | 🔴 PRD **có** một cơ chế thay thế nhưng **không biến nó thành yêu cầu**. §6 **UJ-1** viết: *"Tab app đã mở sẵn từ sáng. Nam bấm sang tab..."* — tức mô hình sử dụng thật là **tab thường trực + chuyển tab**, đóng đúng vai trò always-on-top. Nhưng: không có FR/NFR nào bảo đảm app chịu được việc để tab mở cả ngày; và §11 **Open Question 5** thừa nhận *"Điều gì xảy ra khi mở app ở hai tab cùng lúc? **Chưa xét.**"* Nói cách khác, thứ PRD dùng để thay always-on-top vừa không được đặc tả vừa có một câu hỏi mở treo ngay trên nó | 🔴 **RƠI — đáng lo** |
| "người dùng đã xác nhận không cần" | ℹ️ Câu này **không có trong đầu vào**. Nó đến từ elicitation, qua `brief.md` ("Tác giả xác nhận không cần"). Không sai, nhưng PRD đặt nó cạnh một sự kiện kỹ thuật có nguồn, khiến cả câu trông như cùng một hạng bằng chứng | ℹ️ **KHÁC NGUỒN** |

---

## 5. Bằng chứng bị rơi · và chỗ PRD nói quá

### 5.1 Bằng chứng ĐÁNG LẼ nên có mặt mà hiện không có

| Mã | Bằng chứng trong đầu vào | Đáng lẽ nên ở đâu | Vì sao quan trọng |
|---|---|---|---|
| **E-1** | Trích dẫn user Microsoft Q&A 2025: *"the app will not load the data locally, it is always loading the incorrect data from the cloud"* và *"mất một nửa số notes"* và không khôi phục được; ba link Q&A cụ thể | `prd.md` §5.5 (Mô tả F5) hoặc §7 NFR-3, hoặc `addendum.md` §1 cột "Đến từ" | **Đây là chỗ rơi tốn kém nhất.** F5 và NFR-3 là phần dễ bị cắt nhất khi hết thời gian (nhập lại là "FR thật, tốn công thật" theo chính `addendum.md` §2.8). Một dòng trích dẫn user thật làm cho việc cắt F5 trở nên khó biện minh. Hiện tại F5 chỉ được biện minh bằng lập luận nội bộ ("két sắt không có chìa"), không bằng bằng chứng bên ngoài |
| **E-2** | *"cả một hệ sinh thái extension tồn tại chính vì người ta muốn dữ liệu ở lại máy mình"* + bảng đối thủ dòng "Extension stickies (Tab Sticky Notes, Simple Sticky Notes, AlwaysOnTopNotes) — HTML tĩnh + IndexedDB, dữ liệu không rời máy" | §7 NFR-5 (hiện chỉ biện minh bằng *"nội dung ghi chú là công việc nội bộ, trên máy công ty"*) | NFR-5 hiện được trình bày như một sở thích riêng của một người. Bằng chứng cho thấy nó là một nhu cầu thị trường có thật, và đó là một biện minh mạnh hơn hẳn |
| **E-3** | `usememos/memos` **62.836 sao**; và kết luận *"không tìm thấy app sticky-note thuần web, nhiều sao, đang được bảo trì"* | `addendum.md` của PRD, một mục mới cạnh §3 | Đây là **căn cứ duy nhất** cho toàn bộ luận điểm "khoảng trống thị trường" mà §3 PRD dựng trên. Xem N-2 |
| **E-4** | Tính năng hiện có của Sticky Notes: pin-to-desktop, nút screenshot ghi lại app/URL nguồn, contextual surfacing, OCR trích xuất text, tìm kiếm | `prd.md` §8 Non-Goals (một câu dẫn nhập) | §8 loại "đính kèm, ảnh" mà không đối chiếu với việc đối thủ trực tiếp **có** chúng. PRD không có chỗ nào trả lời "đối thủ có gì mà ta cố tình không có, và vì sao không sao" |
| **E-5** | Hướng đi Microsoft 2026: Copilot Notebooks GA ~01/2026, multimodal Capture 07/2026; Sticky Notes là tính năng bên trong OneNote, không phải dòng sản phẩm độc lập; *"Chưa xác nhận được có đợt phát hành tính năng nào riêng cho Sticky Notes trong 2026"* | `addendum.md` của PRD (bối cảnh cạnh tranh) | Mức độ liên quan thấp với dự án n=1, nhưng đây là bối cảnh của **SM-1** ("vẫn còn dùng sau một tháng"): nếu OneNote/Copilot nuốt trọn nhu cầu này thì SM-1 hỏng vì lý do bên ngoài sản phẩm. Ưu tiên thấp |
| **E-6** | **Toàn bộ mục "Giới hạn của đợt tra cứu này"**: Reddit chặn fetcher nên không có trích dẫn subreddit trực tiếp; bảng đối thủ *"ở mức định hướng, không phải kết quả tra cứu có dẫn nguồn từng dòng"*; Apple Notes *"chưa verify riêng"* | `prd.md` §11 Open Questions hoặc §12 Assumptions Index | 🔴 **Chỗ rơi về tính trung thực nhận thức.** PRD có một §12 Assumptions Index rất kỷ luật (10 mục) và một §11 Open Questions (5 mục) — **không mục nào ghi rằng nền bằng chứng thị trường có giới hạn đã biết.** Toàn bộ giả định trong §12 là giả định *thiết kế*; không có giả định *bằng chứng* nào. Kết quả: PRD trông như đứng trên nền khảo sát vững hơn thực tế |
| **E-7** | Chuỗi truy vết bằng chứng nói chung | `addendum.md` của PRD §1, cột **"Đến từ"** | Bảng 7 ràng buộc gửi Architecture có cột "Đến từ", nhưng **cả 7 giá trị đều trỏ về FR/NFR nội bộ PRD** (FR-3, FR-12, NFR-2...). Không ràng buộc nào trỏ ngược về addendum của brief. Tức là **chuỗi truy vết bằng chứng đứt hẳn ở ranh giới brief → PRD**: từ PRD trở đi không còn cách nào lần về bằng chứng gốc ngoài một dòng "xem addendum của brief, không lặp lại ở đây" |

### 5.2 Chỗ PRD NÓI QUÁ so với đầu vào này

| Mã | Tuyên bố trong PRD | Đầu vào nói gì | Đánh giá |
|---|---|---|---|
| **N-1** | §1 Vision: *"**Mọi công cụ hiện có đều** chèn một quyết định vào giữa khoảng đó — ghi vào tab nào, vào thư mục nào, đây là việc hay là ghi chú — và **chính quyết định nhỏ đó là lý do ghi chú không được ghi**."* | Đầu vào mô tả **Google Keep** là *"Capture nhanh **không ma sát**; ... Vẫn là chuẩn so sánh"* — một phản ví dụ nằm ngay trong bảng đối thủ. Và không có bằng chứng nào trong đầu vào cho quan hệ nhân quả "quyết định nhỏ ⇒ ghi chú không được ghi" | 🔴 **NÓI QUÁ**. Hai lỗi: (a) lượng từ phổ quát "mọi công cụ hiện có" bị chính đầu vào bác; (b) một mệnh đề nhân quả về hành vi được phát biểu như sự thật, trong khi nó là **nội quan của một người dùng duy nhất**. Sửa: *"Các công cụ tác giả đã dùng đều chèn..."* và gắn nhân quả về nguồn elicitation |
| **N-2** | §3 câu mở đầu (*"sản phẩm này đặt cược vào việc từ chối"*) và §10 **SM-C1** (mục tiêu 0 tính năng thêm) — dùng như tiền đề thiết kế đã xác lập | Đầu vào nói *"không có sản phẩm nào **trong bảng này**"*, và tự khai bảng đó *"ở mức định hướng, không phải kết quả tra cứu có dẫn nguồn từng dòng"*. `brief.md` giữ dè dặt: *"Chỗ trống đó có thể vì chưa ai làm tử tế — cũng có thể vì **không ai cần**. Chưa có bằng chứng để kết luận"* | 🔴 **NÓI QUÁ VỀ ĐỘ CHẮC CHẮN.** Đáng chú ý: **PRD tự tin hơn cả brief mà nó dựa vào** — câu cảnh báo "cũng có thể vì không ai cần" có trong brief nhưng **bị rơi khỏi PRD**. Đây là nói quá nghiêm trọng nhất, vì nó chống đỡ NT-1, NT-2, §8 và SM-C1 cùng lúc |
| **N-3** | §8: *"Không always-on-top. Trình duyệt không làm được, **và người dùng đã xác nhận không cần**."* | Vế 1 được đầu vào hậu thuẫn đầy đủ (callout). Vế 2 **không có trong đầu vào** — nó đến từ elicitation qua `brief.md` | 🟡 **KHÔNG SAI, NHƯNG TRỘN NGUỒN.** Hai mệnh đề có sức nặng bằng chứng rất khác nhau được đặt cạnh nhau trong một câu, khiến vế 2 mượn được uy tín của vế 1. Ghi rõ nguồn từng vế |
| **N-4** | §5.5 mô tả F5: *"Ghi chú chỉ nằm trong trình duyệt của một máy tính công ty. Một lần `Clear browsing data`, một lần IT cài lại máy — là mất toàn bộ."* trình bày như rủi ro đã được chứng minh | Đầu vào **có** hậu thuẫn mạnh cho rủi ro mất dữ liệu nói chung (bảng Phàn nàn dòng 1), nhưng bằng chứng đó là về **sync cloud của Microsoft hỏng**, không phải về `Clear browsing data` hay IT cài lại máy | 🟡 **HỢP LÝ NHƯNG KHÁC CƠ CHẾ.** Kết luận (cần sao lưu) đúng và được hậu thuẫn; **cơ chế hỏng** thì được suy ra chứ không có bằng chứng. Nghịch lý đáng ghi: bằng chứng gốc cho thấy **cloud sync chính là thứ làm mất dữ liệu**, tức nó vừa hậu thuẫn NFR-5 (không sync) vừa **không** hậu thuẫn giả định rằng local-only an toàn hơn theo mặc định |
| **N-5** | Các ngưỡng số: **NFR-1** ≤ 2 giây · **NFR-2** ≤ 200 ms / 2.000 ghi chú · **FR-3** ≤ 1 giây · **FR-6** 1.200 ghi chú · **SM-4** 300 ghi chú | Đầu vào chỉ có bằng chứng **định tính** về tốc độ (*"users are not happy"*, *"phản bội tiền đề nhỏ và nhanh"*). Không có số nào | 🟡 **KHÔNG PHẢI NÓI QUÁ, NHƯNG THIẾU NHẤT QUÁN.** PRD được phép đặt ngưỡng. Vấn đề là **§12 Assumptions Index không liệt kê một ngưỡng hiệu năng nào**, trong khi ngưỡng "3 dòng" (A-2) và "7 ngày" (A-9) thì có. §11 mục 4 cũng chỉ nêu hai ngưỡng đó. Ba mốc quy mô khác nhau (300 / 1.200 / 2.000) cùng tồn tại mà không mốc nào có căn cứ. Đề xuất: thêm A-11 và A-12 cho ngưỡng hiệu năng và mốc quy mô |
| **N-6** | §7 **NFR-7**: *"Chạy trong một trình duyệt hiện đại trên máy tính công ty chạy Windows."* | Đầu vào không nói gì về môi trường máy của tác giả; nó chỉ ghi Sticky Notes bị chê "Windows-centric" | ℹ️ **KHÁC NGUỒN, KHÔNG NÓI QUÁ.** Đã có `[ASSUMPTION]` và Open Question 2 che phần rủi ro thật (trình duyệt nào, chính sách IT). Ghi lại cho đủ |

---

## 6. Tổng hợp — việc cần làm

Xếp theo mức độ đáng lo, cao xuống thấp.

| # | Việc | Chạm vào | Vì sao |
|---|---|---|---|
| 1 | **Thêm một mục vào `addendum.md` §2: "Cấu trúc nhẹ — loại phương án ở giữa"**, ghi rõ bằng chứng hai chiều từ đầu vào (Keep bị chê thiếu cấu trúc; Sticky Notes bị chê thiếu tag/notebook) và lý do vì sao PRD vẫn chọn cực "phẳng lì" — nhiều khả năng là: n=1, và F4 gánh vai trò cấu trúc | Khoảng trống #4 · Phàn nàn 4b, 4c | Đây là điểm duy nhất trong năm điểm bị **đảo chiều** mà không có mục "phương án đã bị loại" tương ứng. `addendum.md` có 9 mục cho những quyết định nhỏ hơn nhiều |
| 2 | **Trả lại lớp dè dặt về bằng chứng vào PRD.** Thêm vào §11 Open Questions hoặc §12 một mục: nền khảo sát thị trường ở mức định hướng, Reddit không tra được, và khoảng trống thị trường **có thể** là vì không ai cần — câu đã có sẵn trong `brief.md` | N-2 · E-6 | PRD hiện tự tin hơn brief và hơn addendum. §3, NT-1/NT-2, §8 và SM-C1 đều đứng trên nhận định này |
| 3 | **Nâng always-on-top từ một gạch đầu dòng §8 lên một ràng buộc form-factor có ghi lý do**, và **biến "tab thường trực" thành một yêu cầu thật** (app phải chịu được tab để mở cả ngày; giải quyết Open Question 5 về hai tab) | §4 toàn mục | Đầu vào gọi đây là "ràng buộc quan trọng nhất". Cơ chế PRD dùng để thay thế nó chỉ tồn tại trong văn xuôi của UJ-1 và có một câu hỏi mở treo ngay trên |
| 4 | **Dẫn bằng chứng gốc vào chỗ dễ bị cắt nhất**: một dòng trích dẫn user Microsoft Q&A ("mất một nửa số notes") vào §5.5 hoặc `addendum.md` §1 | E-1 | F5/FR-16 là phần tốn công nhất và dễ bị hy sinh nhất; hiện chỉ được bảo vệ bằng lập luận nội bộ |
| 5 | **Sửa lượng từ phổ quát ở §1 Vision** ("Mọi công cụ hiện có" → "Các công cụ tác giả đã dùng"), vì đầu vào chứa phản ví dụ (Google Keep) | N-1 | Rẻ, và loại bỏ tuyên bố duy nhất trong PRD bị chính đầu vào bác trực tiếp |
| 6 | **Thêm ngưỡng hiệu năng và mốc quy mô vào §12 Assumptions Index** (A-11: các ngưỡng 2s/200ms/1s; A-12: mốc 300/1.200/2.000 ghi chú) | N-5 | §12 hiện chỉ rà giả định thiết kế, bỏ sót giả định định lượng — không nhất quán với chính kỷ luật của nó |
| 7 | **Thêm cột truy vết về addendum của brief** vào `addendum.md` §1, hoặc một dòng mỗi ràng buộc chỉ về bằng chứng gốc | E-7 | Chuỗi truy vết hiện đứt ở ranh giới brief → PRD |
| 8 | Cân nhắc một dòng về **phân biệt "kỷ luật từ chối" với "bị bỏ bê"** (SM-C1 tạo ra tín hiệu bên ngoài giống hệt phàn nàn số 5) | Phàn nàn #5 | Ưu tiên thấp với dự án n=1; ghi lại để retrospective xét |

---

*Bản đối chiếu này chỉ dùng đầu vào `briefs/brief-sticky-notes-2026-09-08/addendum.md` làm chuẩn. `brief.md` được đọc để phân biệt nguồn, không dùng làm chuẩn đối chiếu.*
