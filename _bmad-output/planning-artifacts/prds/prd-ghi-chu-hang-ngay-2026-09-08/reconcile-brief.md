---
title: "Đối chiếu Brief → PRD: Ghi chú hàng ngày"
status: draft
created: 2026-09-09
inputs:
  - ../../briefs/brief-sticky-notes-2026-09-08/brief.md
outputs:
  - ./prd.md
  - ./addendum.md
---

# Đối chiếu Brief → PRD

**Đầu vào gốc:** `brief.md` (status: `final`, 2026-09-08)
**Sản phẩm cuối:** `prd.md` (draft) + `addendum.md` (draft)

Mục đích tài liệu này: đi qua brief **từng mục một**, và với mỗi ý xác định nó hạ cánh ở đâu.

Ký hiệu cột "Trạng thái":

- ✅ **CÓ** — có mặt trong PRD hoặc addendum, giữ được cả nội dung lẫn lý do
- 🟡 **NHẠT** — ý còn nhưng mất sắc thái / mất lý do / mất hình ảnh gốc
- 🔁 **ĐỔI (công khai)** — PRD nói khác brief và **nói rõ là mình đang đổi**
- ⚠️ **ĐỔI (lặng lẽ)** — PRD nói khác brief mà không quy chiếu về brief
- ❌ **RƠI** — không tìm thấy ở cả hai tài liệu cuối

---

## 1. Executive Summary

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| Web app ghi chú nhanh cho **một người, một máy công ty** | PRD §2 Bối cảnh · §2.2 Không phải người dùng · NFR-5 · NFR-7 | ✅ |
| "Gõ bất cứ thứ gì bật ra... mà không phải quyết định nó thuộc loại nào" | PRD §1 Vision · NT-1 · FR-1 | ✅ giữ nguyên tinh thần |
| Mỗi ghi chú tự mang dấu thời gian tạo | FR-2 (mở rộng: **ngày + giờ**, brief chỉ nói "dấu thời gian") | ✅ |
| Tìm lại được **bằng chữ hoặc lọc theo thời gian tạo** | FR-12 (tìm chữ) · FR-13 (lọc ngày) · FR-14 (kết hợp) | ✅ mở rộng: brief nói "hoặc", PRD cho phép **giao** hai điều kiện |
| "Lọc theo **thời gian** tạo" | FR-13 thu hẹp thành **đúng một ngày lịch**; khoảng ngày và mốc nhanh bị loại. Có `[A-5]`, và §9.2 để khoảng ngày ngoài MVP | 🔁 đổi công khai (trả lời Open Question #2) |
| Dự án cá nhân, **mục tiêu kép**: công cụ dùng hàng ngày + đi trọn vòng BMAD **để học nghề** | PRD §2.1 "Người xây" · SM-5 | 🟡 chữ "học nghề" biến mất; PRD diễn đạt thành "đủ nhỏ để hoàn thành và đủ thật để dùng hàng ngày" — mất động cơ *học*, giữ động cơ *hoàn thành* |

---

## 2. The Problem

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| "Liên tục có những mẩu thông tin bật ra cần ghi lại ngay" | PRD §2.1 JTBD chức năng #1 | ✅ |
| "Chúng nhỏ, gấp và **không đáng để mở một công cụ nặng**" | Không có câu tương ứng. NFR-1 (≤ 2 giây) chỉ nói về tốc độ của *sản phẩm này*, không nói về việc *công cụ nặng không xứng đáng* | 🟡 lý do bị thay bằng một chỉ số |
| "Nếu phải dừng lại nghĩ *ghi cái này vào đâu* → mất mạch hoặc không ghi nữa" | PRD §1 Vision, gần như nguyên văn: "chính quyết định nhỏ đó là lý do ghi chú không được ghi" | ✅ ý mạnh nhất của brief, sống nguyên vẹn |
| "Vài ngày sau cần tìm lại thì không nhớ nổi nó ở đâu" | UJ-2 · FR-12 | ✅ |
| **Notepad++**: tab `new 1/2/7` chất đống, **rối mắt và mất tập trung**, "chính đống tab đó giết chết công cụ" | PRD §2.1 "Cảm xúc" — giữ cả hình ảnh `new 7` lẫn kết luận "đó là thứ đã giết công cụ cũ, không phải thiếu tính năng". Addendum §2.4 phương án A dùng lại đúng luận điểm này | ✅ mục được bảo tồn tốt nhất trong toàn brief |
| Notepad++: không có dấu thời gian, không tìm kiếm xuyên tab | FR-2 · FR-12 (giải quyết), nhưng không còn nhắc Notepad++ là nguồn của yêu cầu | 🟡 |
| **Microsoft Sticky Notes**: không hiện thời điểm tạo → nhìn lại không biết cái nào thuộc ngày nào | FR-2 giải quyết vấn đề, nhưng **tên Sticky Notes không xuất hiện một lần nào** trong prd.md hay addendum.md | 🟡 |
| Sticky Notes: **từ 08/2024 bị gộp vào OneNote, không còn là app nhỏ và nhanh** | ❌ Không có ở đâu. Đây là *bằng chứng lịch sử* cho luận điểm trung tâm "mọi công cụ ghi chú đều lớn dần lên" — luận điểm còn, bằng chứng mất | ❌ **RƠI** |
| "Cả hai đều bắt bạn tự đối diện với cả đống ghi chú, và **không cho bạn cách nào để hỏi thẳng thứ mình cần**" | NT-3 gần như dịch lại: "không bao giờ bắt người dùng nhìn cả đống... cho họ hỏi đúng thứ mình cần" | ✅ |

---

## 3. The Solution

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| "Một trang web duy nhất, mở ra là gõ được ngay" | PRD §1 Vision · FR-1 · NFR-1 | ✅ |
| "Mỗi ghi chú là một **card**" | PRD §4 Glossary **cố ý loại bỏ từ "card"**, kèm blockquote giải thích: card là hình dạng hiển thị, thuộc về tài liệu UX | 🔁 **đổi công khai**, có lý do viết ra |
| **Nguyên tắc 1 — Không phân loại lúc gõ**: việc phải làm và ý nghĩ vu vơ đi vào cùng một luồng | PRD §1 Vision · NT-1 · NT-2 · §8 Non-Goals | ✅ |
| Lý do đằng sau NT1: "**Phân loại là công việc trí óc**, và bắt người ta làm việc đó ngay lúc đang bận chính là lý do ghi chú không được ghi" | PRD §1 Vision giữ vế sau ("chính quyết định nhỏ đó là lý do ghi chú không được ghi") nhưng **bỏ vế "phân loại là công việc trí óc"** | 🟡 mất chẩn đoán, giữ triệu chứng |
| Không thư mục, không tag, không trạng thái xong/chưa xong | §8 Non-Goals · NT-2 (mở rộng thêm: màu, ghim, đánh sao, kéo thả, độ ưu tiên) | ✅ mở rộng |
| **Nguyên tắc 2 — "Card mới nằm trên, card cũ lùi xuống dưới"** | FR-7 giữ thứ tự, **nhưng** FR-6 thu khung nhìn mặc định lại **chỉ còn hôm nay**. Trong brief, "card cũ lùi xuống dưới" hàm ý card cũ **vẫn ở trên màn hình**; trong PRD chúng biến mất khỏi màn hình cho tới khi người dùng đặt điều kiện | ⚠️ **ĐỔI Ý LỚN.** Addendum §2.4 có ghi lại quyết định và loại phương án A ("toàn bộ ghi chú, cuộn xuống là ra hết") — nhưng **không nói phương án A chính là điều brief mô tả**. §9.1 chỉ đánh dấu FR-16 là "mở rộng có ý thức so với brief", không đánh dấu FR-6 |
| "Thứ tự sắp xếp **không phải là câu trả lời** cho vấn đề lộn xộn" | NT-3 · §1 Vision | ✅ |
| "Ghi chú tồn tại vĩnh viễn, nên sau vài tháng sẽ có hàng trăm card" | §1 Vision · NFR-3 · SM-4 | ✅ |
| "**Bạn không lục, bạn hỏi**" | NT-3 diễn đạt lại: "cho họ hỏi đúng thứ mình cần". Cấu trúc đối lập lục/hỏi bị làm phẳng | 🟡 hình ảnh mờ đi |
| "**Dấu thời gian là cái neo** để định vị lại ghi chú thuộc ngày làm việc nào" | §1 Vision giữ nguyên hình ảnh và mở rộng đẹp hơn: "bạn không nhớ mình đã viết gì, nhưng bạn nhớ *hôm thứ Ba tuần trước*". Nhắc lại ở FR-12 và FR-16 | ✅ **phép ẩn dụ duy nhất của brief được PRD nhận nuôi tử tế** |

---

## 4. Who This Serves

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| Một người: chính tác giả. Một máy công ty, một trình duyệt | PRD §2 · §2.1 Bối cảnh · UJ-1/2/3 (nhân vật tên Nam) | ✅ |
| "**Đây không phải là sự khiêm tốn giả tạo** — nó là một quyết định kỹ thuật có hệ quả lớn" | Không có câu tương ứng. PRD trình bày phạm vi hẹp như một sự thật hiển nhiên, không như một lựa chọn phải tự bênh vực | 🟡 mất giọng *phòng thủ có ý thức* |
| Hệ quả: không tài khoản, đăng nhập, server, database; dữ liệu nằm trong trình duyệt | NFR-5 · NFR-7 · §8 gạch đầu dòng 1 · §2.1 Bối cảnh | ✅ |
| "Sản phẩm nhỏ đi đáng kể, và **nhờ đó hoàn thành được**" | §2.2: "mỗi nhóm trong số đó kéo theo tài khoản và backend — và đó là thứ làm sản phẩm này không bao giờ xong". §8: "nó là lý do sản phẩm đủ nhỏ để hoàn thành" | ✅ lý do sống sót nguyên vẹn, thậm chí sắc hơn |

---

## 5. What Makes This Different  ← **mục bị hao hụt nặng nhất**

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| "**Không có gì đặc biệt về mặt tính năng, và brief này không giả vờ là có.**" | ❌ Không có câu nào tương đương. PRD không ở chỗ nào thừa nhận sản phẩm không có lợi thế tính năng | ❌ **RƠI** |
| "Tìm kiếm, lọc theo thời gian, sắp xếp mới trước — **Google Keep và Sticky Notes đều làm được** ở mức nào đó. Đây không phải là sản phẩm thắng bằng tính năng độc quyền." | ❌ Chuỗi "Google Keep" **không xuất hiện** trong prd.md lẫn addendum.md. Toàn bộ phần định vị cạnh tranh biến mất | ❌ **RƠI** |
| "Thứ sản phẩm này đánh cược là **sự kỷ luật trong việc từ chối**" | ✅ Sống khỏe và ở nhiều chỗ: PRD §3 mở đầu ("sản phẩm này đặt cược vào việc *từ chối*") · SM-C1 (phản thước đo: số tính năng thêm = 0) · Addendum §2.9 phương án C ("đúng tinh thần *kỷ luật từ chối* nhất") | ✅ **ý triết lý trung tâm được giữ và còn được cấp cơ chế thi hành** |
| Blockquote: "Mọi công cụ ghi chú đều lớn dần lên: thêm thư mục, thêm tag, thêm rich text, thêm cộng tác — **cho đến khi việc ghi một dòng chữ cần ba lần bấm**" | Kết luận còn (§8, NT-2, SM-C1), nhưng **câu chuyện đường trượt và hình ảnh "ba lần bấm" biến mất**. PRD thay bằng hình ảnh của riêng nó: "một lời từ chối không viết thành văn thì không sống nổi qua tuần thứ ba" (§3) và "đó chính là cách tính năng lọt vào những sản phẩm có nguyên tắc nghe rất hay" (NT-2) | 🟡 thay ẩn dụ, không mất lập luận |
| "Sản phẩm này cố tình không có gì để cấu hình, không có gì để phân loại, **không có gì để dọn dẹp**" | "không có gì để cấu hình" → §1 Vision (nguyên văn). "không có gì để phân loại" → §8. "không có gì để dọn dẹp" → NT-3 + SM-C2 (phản thước đo số ghi chú bị xóa) | ✅ cả ba vế đều hạ cánh |
| "Khảo sát cho thấy không có app sticky-note thuần web nào vừa nhiều sao vừa còn được bảo trì" | PRD §0 chỉ **trỏ sang** addendum của brief; kết luận khảo sát không được nêu lại ở đâu | 🟡 trỏ mà không mang theo |
| "**Chỗ trống đó có thể vì chưa ai làm tử tế — cũng có thể vì không ai cần. Chưa có bằng chứng để kết luận, và với một dự án cá nhân thì cũng không cần.**" | ❌ Không có ở đâu. §11 Open Questions của PRD có 5 câu, **tất cả đều là kỹ thuật/vận hành** (biên nửa đêm, trình duyệt, dung lượng, ngưỡng số, hai tab) — không câu nào giữ lại sự không chắc chắn về *nhu cầu*. Ngược lại §1 Vision viết bằng giọng khẳng định tuyệt đối: "**Mọi** công cụ hiện có đều chèn một quyết định vào giữa khoảng đó" | ❌ **RƠI — và là chỗ rơi nghiêm trọng nhất về mặt định tính.** Brief thành thật về chỗ nó không biết; PRD thừa hưởng kết luận mà không thừa hưởng sự dè dặt |

---

## 6. Success Criteria — đối chiếu từng tiêu chí

Cả **5/5 tiêu chí đều có mặt** trong PRD §10. Không tiêu chí nào bị bỏ quên. Nhưng thứ hạng bị sắp xếp lại.

| # | Tiêu chí trong brief | Trong PRD | Trạng thái |
|---|---|---|---|
| 1 | Sau một tháng tác giả **vẫn đang dùng**, và đã bỏ Notepad++ cho việc ghi chú nhanh | **SM-1** (nhóm *Chính*) — gần như nguyên văn, còn được nâng lên: "thước đo duy nhất thật sự quan trọng — nó nghiệm thu toàn bộ FR-1 tới FR-17 cùng một lúc" | ✅ giữ, và được nâng cấp |
| 2 | **Mở ra là gõ được ngay**, không có bước trung gian nào chen vào giữa ý nghĩ và con chữ | **SM-2** (*Chính*): ≤ 2 giây, "đo bằng đồng hồ, không phải bằng cảm giác". Vế định tính "không có bước trung gian" đi vào NT-1 và FR-1 (kiểm chứng: không nút "Tạo mới", không bước chọn loại) | ✅ định lượng hoá, vế định tính vẫn có chỗ trú |
| 3 | **Mở lên không thấy rối mắt** — thất bại của Notepad++ không lặp lại, kể cả khi đã có hàng trăm card | **SM-4** (nhóm ***Phụ***): "với ít nhất 300 ghi chú, khung nhìn mặc định vẫn không dài quá một màn hình" — PRD nói rõ đây là "cách biến tiêu chí cảm tính thành thứ đếm được" | ⚠️ **hạ cấp lặng lẽ.** Brief coi đây là *nguyên nhân cái chết* của công cụ cũ; PRD xếp nó vào nhóm *Phụ* mà không giải thích vì sao. Đồng thời "rối mắt" bị quy giản thành **chiều dài màn hình** — mất chiều "nhiễu thị giác" (số lượng phần tử, nhãn, nút) |
| 4 | **Tìm lại được một ghi chú cũ** mà không phải cuộn tìm | **SM-3** (*Chính*): ≤ 30 giây kể từ lúc nảy ra ý định, "không phải cuộn tìm lần nào" | ✅ giữ nguyên vế "không cuộn", thêm mốc thời gian |
| 5 | **Đi trọn vòng BMAD**, từ brief đến retrospective | **SM-5** (*Phụ*) — nguyên văn | ✅ (hạ xuống Phụ hợp lý: đây là mục tiêu của tác giả, không phải của sản phẩm) |

**Bổ sung của PRD, không có trong brief:** SM-C1 và SM-C2 — hai *phản thước đo*. Đây là phần PRD **giàu hơn** brief: chúng biến "kỷ luật từ chối" từ một tuyên bố thành một con số bị theo dõi.

---

## 7. Scope

### 7.1 Trong phạm vi (MVP)

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| Tạo card ghi chú nhanh, không phân loại | FR-1 | ✅ |
| Dấu thời gian tạo trên mỗi card | FR-2 (thêm: gồm cả **giờ**) | ✅ |
| Card mới xếp trước, card cũ xếp sau | FR-7 — nhưng xem lại ghi chú ở §3 về FR-6 | ⚠️ bị FR-6 thu hẹp |
| Tìm kiếm bằng chữ | FR-12 — thêm ràng buộc **bỏ dấu tiếng Việt + không phân biệt hoa/thường**, kéo theo NFR-6 và Ràng buộc Architecture #1 | ✅ mở rộng (không có trong brief, phát sinh trong phiên PRD) |
| Lọc theo thời gian tạo | FR-13 — thu hẹp thành một ngày `dd/MM/yyyy` | 🔁 đổi công khai |
| Lưu trong trình duyệt của máy đang dùng | NFR-3 · NFR-5 | ✅ |
| **Xuất dữ liệu ra file** | FR-15 | ✅ |
| *(không có trong brief)* | **FR-16 nạp lại từ file** — §9.1 ghi rõ "mở rộng có ý thức so với brief: brief chỉ có xuất"; addendum §2.8 giải thích đầy đủ | 🔁 **mở rộng công khai, làm đúng bài** |
| *(không có trong brief)* | **FR-17 nhắc thụ động về lần sao lưu gần nhất** — không được đánh dấu là mở rộng so với brief ở bất kỳ đâu, dù §8 phải tự cấp cho nó một ngoại lệ khỏi "không nhắc nhở, không thông báo" | ⚠️ **mở rộng phạm vi lặng lẽ** (nhẹ) |
| *(không có trong brief)* | FR-4 `Ctrl+Enter` · FR-5 ghi chú rỗng tự biến mất · FR-8 cắt 3 dòng · FR-11 xác nhận xóa · NT-2 "đúng ba hành động" | ✅ đều có nguồn gốc ghi trong addendum §2.5, §2.3, §3 — bổ sung có xuất xứ, không phải phát minh tuỳ tiện |

### 7.2 Ngoài phạm vi — **5/5 mục đều được giữ nguyên**

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| ❌ Always-on-top — trình duyệt không làm được, tác giả xác nhận không cần | §8 gạch 2, giữ **cả hai lý do** | ✅ |
| ❌ Đồng bộ nhiều máy, tài khoản, backend | §8 gạch 1 · §9.2 (nhấn mạnh: *non-goal* chứ không phải "để sau") | ✅ được siết chặt hơn brief |
| ❌ Trạng thái xong/chưa xong, độ ưu tiên | §8 gạch 3 và 4 ("Ghi chú không phải task") | ✅ |
| ❌ Thư mục, tag, phân cấp | §8 gạch 3 | ✅ |
| ❌ Mobile app, cộng tác, chia sẻ, rich text | §8 gạch 7 và 9 | ✅ |
| *(brief không nêu)* | §8 bổ sung: không chế độ duyệt xem · không xóa hàng loạt/thùng rác/hoàn tác · không đính kèm/ảnh · không nhắc nhở/lịch · **không phải hồ sơ đối chứng** | ✅ mở rộng đáng kể |

---

## 8. Rủi ro đã biết: Mất dữ liệu

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| Ghi chú vĩnh viễn nhưng chỉ nằm trong trình duyệt một máy công ty | PRD §5.5 mô tả F5, gần như nguyên văn brief | ✅ |
| Một lần `Clear browsing data`, một lần IT cài lại máy, **một lần đổi máy** — là mất toàn bộ | F5 mô tả giữ hai kịch bản đầu; **"đổi máy" bị bỏ**. UJ-3 chỉ dựng kịch bản IT cài lại | 🟡 |
| "**Lời than phiền số một** về Microsoft Sticky Notes chính là ghi chú tự biến mất *(bằng chứng trong addendum)*" | ❌ Không có ở đâu trong prd.md/addendum.md. PRD chỉ khẳng định "mất dữ liệu là rủi ro số một **của sản phẩm này**" (mô tả F3) — một suy luận nội bộ, không còn dẫn bằng chứng thị trường | ❌ **RƠI.** Rủi ro sống sót, *bằng chứng* của rủi ro thì không. Hệ quả: sáu tháng nữa ai đó có thể cãi lại FR-15/16/17 là "lo xa quá" mà không gặp phản chứng nào trong tài liệu |
| "**Xuất dữ liệu ra file nằm trong MVP** — tác giả chấp nhận đánh đổi thêm chút công sức để không mất trắng" | §9.1 (FR-15, FR-16, FR-17 đều trong MVP) · Addendum §2.8 "Cái giá đã chấp nhận" | ✅ |

---

## 9. Open Questions — đối chiếu từng câu

PRD §0 tuyên bố: *"Ba câu hỏi mở mà brief cố ý để lại đều đã được trả lời ở đây."* Kiểm chứng:

| # | Câu hỏi brief | PRD trả lời thế nào | Đánh giá |
|---|---|---|---|
| **1** | **Xuất ra định dạng gì?** JSON (nhập lại được), Markdown (người đọc được), hay text thuần? **Có cần nhập lại (import) không**, hay chỉ cần xuất? | *Vế "có import không":* trả lời **dứt khoát CÓ** — FR-16, addendum §2.8 giải thích ("xuất mà không nạp lại được thì không phải sao lưu — đó là một cái két sắt không có chìa"). *Vế "định dạng gì":* addendum §2.8 **loại** Markdown/text-thuần-để-đọc; FR-15 chỉ yêu cầu "định dạng **máy đọc được**, có mang số phiên bản" — **không chốt JSON**, không chốt bất kỳ định dạng cụ thể nào | ⚠️ **Trả lời một nửa, nhưng PRD tuyên bố đã trả lời trọn.** Phần chưa chốt bị đẩy ngầm sang `bmad-architecture` mà **không được liệt kê lại** ở §11 Open Questions, cũng không nằm trong §12 Assumptions (A-7 chỉ nói "file có số phiên bản"). Đây là câu hỏi *bị đóng trên giấy nhưng chưa được đóng thật* |
| **2** | **Lọc theo thời gian trông như thế nào?** Chọn khoảng ngày, hay các mốc nhanh kiểu "hôm nay / 7 ngày qua / tháng này"? | Trả lời dứt khoát ở **FR-13**: chọn **đúng một ngày** `dd/MM/yyyy`. **Loại cả hai phương án brief nêu**, kèm lý do cho từng cái — khoảng ngày: dựa trên hành vi thật ("người dùng nhớ *một* ngày họp, không nhớ một quãng"), trường hợp nhớ mơ hồ do FR-12 gánh; mốc nhanh: "chúng phục vụ việc duyệt xem, mà sản phẩm không có chế độ duyệt xem *(NT-3)*". Đánh dấu `[A-5]` ở §12, và §9.2 để khoảng ngày ngoài MVP với điều kiện "thêm khi có bằng chứng là cần" | ✅ **Xử lý mẫu mực** — trả lời, có lý do, có nhãn giả định, có đường mở |
| **3** | **Một card dài bao nhiêu?** Một dòng, một đoạn, hay tự do? "Điều này định hình cả giao diện." | §4 Glossary: ghi chú là "một khối **văn bản tự do, nhiều dòng**". FR-8: dài quá `[A-2: 3 dòng]` thì cắt bớt, mở rộng tại chỗ, mọi ghi chú cùng chiều cao trần khi chưa mở rộng. FR-4 củng cố: `Enter` là xuống dòng, không phải chốt. §11 mục 4 ghi nhận ngưỡng 3 dòng là "con số đặt ra trên bàn giấy" | ✅ trả lời đủ, kèm thừa nhận chỗ còn đoán |

**Kết luận mục 9:** không câu nào bị bỏ quên hoàn toàn; **câu 1 bị đóng sớm** — PRD tự nhận đã trả lời trong khi phần "định dạng gì" vẫn chưa có đáp án và cũng không được ghi nợ ở §11 hay §12.

---

## 10. Vision (mục cuối brief)

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| "**Không có tham vọng mở rộng**: phục vụ tốt một người trong công việc hàng ngày là đã thành công" | Không có câu trực tiếp. Nhưng ý được hiện thực hoá mạnh hơn ở **SM-C1** ("số tính năng thêm vào sau MVP. Mục tiêu là 0") và §2.2 | ✅ ý sống ở dạng cơ chế thay vì dạng tuyên ngôn |
| "Nếu về sau tác giả muốn dùng trên nhiều máy, **Architecture sẽ được thiết kế sao cho ngày đó không phải đập đi làm lại**" | **Addendum §1, đoạn cuối** — dẫn thẳng brief: "brief nói nếu sau này tác giả muốn dùng nhiều máy thì không phải đập đi làm lại. Ràng buộc 4 (định danh ổn định) và 5 (định dạng có phiên bản) đã làm sẵn phần lớn việc đó" | ✅ **hạ cánh xuất sắc** — không chỉ giữ lời hứa mà còn chỉ ra nó đã được thực thi bằng gì |

---

## 11. Phần chân trang brief

| Ý trong brief | Hạ cánh ở đâu | Trạng thái |
|---|---|---|
| "Trước đây dự án mang tên **Sticky Notes**. Đổi tên vì sản phẩm không còn là sticky notes — không always-on-top, không dán lên màn hình." | ❌ PRD không giải thích tên sản phẩm ở đâu. Thư mục brief vẫn mang tên `brief-sticky-notes-...` còn thư mục PRD là `prd-ghi-chu-hang-ngay-...`, nhưng không tài liệu nào nối hai cái đó lại | ❌ **RƠI** (mức nhẹ, nhưng đúng loại "lý do đằng sau một quyết định" — người đọc tương lai sẽ thấy hai cái tên và không biết vì sao) |
| Trỏ tới `addendum.md` của brief (khảo sát thị trường) | PRD §0 và Addendum PRD §17-19 đều trỏ đúng, và nói rõ "không lặp lại ở đây" | ✅ |
| Trỏ tới `.memlog.md` | PRD chân trang trỏ tới `.memlog.md` của phiên PRD | ✅ |

---

## 12. Đánh giá xuyên suốt về **giọng điệu và không khí**

Đây là lớp hao hụt không nằm trong bất kỳ mục nào ở trên, nên ghi riêng.

| Chiều | Brief | PRD | Nhận xét |
|---|---|---|---|
| **Ngôi kể** | Ngôi thứ hai, thân mật: "*Bạn* gõ bất cứ thứ gì bật ra" | §1 Vision giữ được "bạn" ("bạn không nhớ mình đã viết gì, nhưng bạn nhớ hôm thứ Ba tuần trước"); từ §3 trở đi chuyển sang giọng quy phạm, không ngôi | 🟡 chuyển giọng là bình thường với PRD, nhưng §1 là chỗ duy nhất còn hơi người |
| **Độ chắc chắn** | Có tự nghi ngờ: *"cũng có thể vì không ai cần"*, *"chưa có bằng chứng để kết luận"*, *"brief này không giả vờ là có"* | Gần như tuyệt đối: *"**Mọi** công cụ hiện có đều chèn một quyết định"*, *"F4 là **con đường duy nhất**"*, *"Đây là ràng buộc **cứng**"* | ⚠️ **Chỗ hao hụt định tính nghiêm trọng nhất.** Brief là một tài liệu biết mình đang đặt cược; PRD đọc như một tài liệu đã thắng cược |
| **Tự thừa nhận điểm yếu** | Có một chỗ: chỗ trống thị trường có thể vì không ai cần | PRD **có** cơ chế này, nhưng hướng khác: `[NOTE FOR PM]` ở FR-11 và FR-17, "đây là chỗ mỏng nhất của sản phẩm", UJ-3 "tài liệu này không giả vờ là không có", §2.1 blockquote "một điều tài liệu này cố ý không hứa" | ✅ **Thói quen thành thật được kế thừa** — nhưng chỉ áp vào *rủi ro thực thi*, không áp vào *giả thiết nền* (liệu sản phẩm này có đáng tồn tại không) |
| **Ẩn dụ** | "bạn không lục, bạn hỏi" · "dấu thời gian là cái neo" · "cho đến khi ghi một dòng chữ cần ba lần bấm" | Giữ "cái neo" (nhiều lần, mở rộng đẹp). Làm phẳng "lục/hỏi". Bỏ "ba lần bấm". Thêm ẩn dụ mới: "két sắt không có chìa" · "§3 là dao mổ" · "phanh" · "hai cửa" | ✅ trao đổi ngang giá — mất 1, giữ 1, thêm 4 |
| **Sự khiêm tốn về quy mô** | "Đây không phải là sự khiêm tốn giả tạo" — brief *phòng thủ* cho việc mình bé | PRD trình bày quy mô hẹp như hiển nhiên, không cần bênh vực | 🟡 |

---

## 13. Tổng kết: những gì bị rơi và bị đổi lặng lẽ

### Bị rơi hoàn toàn

| # | Nội dung | Mục brief | Mức lo ngại |
|---|---|---|---|
| R-1 | *"Chỗ trống đó có thể vì chưa ai làm tử tế — cũng có thể vì không ai cần. Chưa có bằng chứng để kết luận."* — toàn bộ sự thành thật của brief về giả thiết nền | What Makes This Different | 🔴 Cao |
| R-2 | *"Không có gì đặc biệt về mặt tính năng, và brief này không giả vờ là có"* + so sánh Google Keep / Sticky Notes | What Makes This Different | 🔴 Cao |
| R-3 | Bằng chứng thị trường cho rủi ro mất dữ liệu: *"lời than phiền số một về MS Sticky Notes chính là ghi chú tự biến mất"* | Rủi ro đã biết | 🟠 Trung bình |
| R-4 | MS Sticky Notes bị gộp vào OneNote 08/2024 — bằng chứng lịch sử cho luận điểm "công cụ nào cũng lớn dần lên" | The Problem | 🟠 Trung bình |
| R-5 | Lý do đổi tên dự án từ "Sticky Notes" sang "Ghi chú hàng ngày" | Chân trang | 🟡 Thấp |
| R-6 | Kịch bản mất dữ liệu do **đổi máy** (còn `Clear browsing data` và IT cài lại) | Rủi ro đã biết | 🟡 Thấp |

### Bị đổi ý lặng lẽ (PRD nói khác brief mà không quy chiếu về brief)

| # | Brief nói | PRD nói | PRD có tuyên bố đang đổi không? |
|---|---|---|---|
| Đ-1 | "Card mới nằm trên, **card cũ lùi xuống dưới**" — mọi ghi chú ở trên cùng một mặt phẳng, thứ tự là cách tổ chức | **FR-6**: khung nhìn mặc định **chỉ chứa hôm nay**; mọi thứ cũ hơn chỉ đến được qua F4 | **Không quy chiếu brief.** Addendum §2.4 có ghi quyết định và loại "phương án A: toàn bộ ghi chú, cuộn xuống là ra hết" — nhưng không nói phương án A **chính là brief**. §9.1 đánh dấu FR-16 là "mở rộng so với brief" nhưng bỏ qua FR-6, khiến người đọc tưởng FR-6 vốn có trong brief |
| Đ-2 | Success Criteria #3 "**mở lên không thấy rối mắt**" — mô tả trực tiếp thứ đã giết Notepad++ | **SM-4**, xếp nhóm ***Phụ***, quy giản thành "không dài quá một màn hình với ≥ 300 ghi chú" | Có nói rõ việc *định lượng hoá*, **không** nói rõ việc *hạ cấp*. Chiều "nhiễu thị giác" ngoài chiều dài bị mất im lặng |
| Đ-3 | Open Question #1: "**Xuất ra định dạng gì?** JSON, Markdown, hay text thuần?" | FR-15 chỉ chốt "định dạng máy đọc được, có số phiên bản"; định dạng cụ thể chưa chốt | PRD §0 **tuyên bố đã trả lời cả ba câu hỏi mở**. Câu này thực chất mới trả lời một nửa, và phần còn nợ không được ghi vào §11 Open Questions hay §12 Assumptions |
| Đ-4 | Scope MVP chỉ có "**xuất** dữ liệu ra file" | Thêm **FR-17** (nhắc thụ động về lần sao lưu gần nhất) — một phần tử UI thường trực, đến mức §8 phải tự cấp ngoại lệ khỏi "không nhắc nhở, không thông báo" | Không đánh dấu là mở rộng so với brief (khác với FR-16, được đánh dấu rất rõ) |

### Đổi ý **công khai** — làm đúng bài, ghi nhận

- **FR-16 nạp lại từ file** — §9.1 nói thẳng "mở rộng có ý thức so với brief: brief chỉ có xuất", addendum §2.8 giải thích cả lý do lẫn cái giá.
- **Bỏ từ "card"** — §4 Glossary có blockquote giải thích vì sao.
- **FR-13 một ngày thay vì khoảng ngày/mốc nhanh** — trả lời trực diện Open Question #2, có lý do và nhãn `[A-5]`.

### Điều PRD làm **tốt hơn** brief

- Biến "kỷ luật từ chối" từ tuyên ngôn thành cơ chế thi hành: **NT-1/NT-2 hai cửa** (addendum §3 giải thích vì sao một cửa không đủ) và **SM-C1/SM-C2 phản thước đo**.
- Kế thừa và nhân rộng thói quen thành thật của brief dưới dạng `[NOTE FOR PM]`, `[ASSUMPTION]`, §12 Assumptions Index, và các mục "cái giá đã chấp nhận" trong addendum.
- Giữ và mở rộng ẩn dụ trung tâm "**dấu thời gian là cái neo**".
- Ghi lại **mọi phương án bị loại kèm lý do** (addendum §2) — đúng thứ brief không có chỗ để nói.
