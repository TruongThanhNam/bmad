---
title: "Review đối kháng — PRD Ghi chú hàng ngày"
status: draft
created: 2026-09-09
reviewer: adversarial
target: prd.md, addendum.md
---

# Review đối kháng — PRD "Ghi chú hàng ngày"

Tài liệu này cố tình chỉ nói chỗ hỏng. Nó không cân bằng, không khen cho đủ lễ. Mục §7 liệt kê
những chỗ đã kiểm tra và thấy vững — đó là toàn bộ phần "khen" mà bạn sẽ nhận được.

**Phán quyết.** PRD viết tốt ở tầng *tuyên ngôn* — nguyên tắc sắc, non-goals dứt khoát, addendum ghi
lại phương án bị loại là thứ hiếm thấy. Nhưng nó **chưa phải là tài liệu mô tả một hệ thống đang
chạy**: nó mô tả sản phẩm ở trạng thái tĩnh, mỗi lúc một màn hình, một người dùng, một thao tác. Gần
như mọi lỗ hổng nghiêm trọng dưới đây đều nằm ở chỗ *hai thứ xảy ra cùng lúc* — đang gõ **và** bộ
lọc đang bật, đang mở **và** ngày đổi, đang lưu **và** hết dung lượng, đã xóa **và** nạp lại file cũ.
Vòng đời của **ô soạn thảo** — thứ trung tâm nhất của sản phẩm — chưa được định nghĩa ở bất kỳ đâu.
Nếu đưa nguyên bản này cho `bmad-architecture`, người thiết kế sẽ phải tự bịa ra ít nhất sáu quyết
định sản phẩm mà PRD lẽ ra phải chốt.

**Tổng kết:** 6 critical · 9 high · 10 medium · 5 low.

---

## 1. Mâu thuẫn nội tại

### C-1 · Gõ trong khung nhìn có điều kiện: chữ vừa gõ biến mất trước mắt
**Mức: CRITICAL** · **Vị trí: FR-1, FR-6, FR-14 + bảng mô hình trạng thái §5.4**

**Điều gì hỏng.** FR-1 hứa "gõ được ngay", §5.2 nói ô soạn thảo "luôn sẵn sàng" ở phía trên dòng ghi
chú. FR-14 nói khi có điều kiện thì khung nhìn mặc định *bị thay thế*. Ghép hai điều đó lại: ô soạn
thảo vẫn nằm đó trong khung nhìn có điều kiện, nhưng ghi chú nó tạo ra mang mốc **hôm nay**, mà điều
kiện đang bật lại là **ngày khác**. PRD không nói ô soạn thảo có tồn tại trong khung nhìn có điều
kiện hay không, và cũng không nói ghi chú vừa tạo đi đâu.

**Kịch bản thất bại cụ thể.** Nam đang ở UJ-2: bộ lọc ngày `03/09/2026` đang bật, một kết quả trên
màn hình. Sếp nói thêm một câu cần ghi. Nam gõ thẳng vào ô soạn thảo *"sếp muốn đổi lại luồng
duyệt"*. Ghi chú được tạo với mốc `09/09/2026`, **không khớp bộ lọc** → theo đúng chữ của FR-13 nó
phải biến khỏi dòng ghi chú. Nam nhìn thấy chữ mình gõ trôi đi. Theo FR-3 nó đã được lưu, nhưng Nam
không có cách nào biết điều đó, và phản ứng tự nhiên là gõ lại → hai ghi chú trùng.

Biến thể tệ hơn với từ khóa: bộ lọc từ khóa `phan quyen` đang bật, Nam gõ ghi chú mới. Với A-4 (lọc
dần từng ký tự) ghi chú vừa tạo sẽ **nhấp nháy vào/ra** dòng ghi chú theo từng ký tự tùy nó có khớp
từ khóa hay không.

**Đề xuất sửa.** Chốt hẳn một trong hai, thành FR mới:
(a) Trong khung nhìn có điều kiện, ô soạn thảo **không** hiển thị; muốn ghi phải về khung nhìn mặc
định (một thao tác, đã có sẵn ở FR-14) — nhất quán với NT-3 "mỗi lần rời khỏi hôm nay đều là có mục
đích", nhưng đâm vào NT-1; hoặc
(b) Ô soạn thảo luôn có mặt, và ghi chú vừa tạo **luôn hiển thị bất kể điều kiện**, được đánh dấu là
"nằm ngoài điều kiện đang lọc", cho tới khi người dùng chốt hoặc rời đi.
Khuyến nghị (b) — NT-1 là nguyên tắc gốc, và (a) chèn một quyết định vào giữa ý nghĩ và con chữ,
đúng thứ NT-1 cấm.

---

### C-2 · Vòng đời ô soạn thảo không tồn tại trong tài liệu
**Mức: CRITICAL** · **Vị trí: Glossary "Ô soạn thảo", FR-1, FR-3, FR-4, FR-5, FR-10**

**Điều gì hỏng.** Tài liệu dùng "ô soạn thảo" như một vật thể có sẵn nhưng không bao giờ nói nó *là
gì* so với "ghi chú":

- Glossary: ô soạn thảo là "nơi con trỏ nằm sẵn khi mở app; gõ vào đó là tạo ghi chú mới".
- FR-4: `Ctrl+Enter` **"đóng"** ghi chú đang gõ → hàm ý ghi chú sống *trong* ô soạn thảo cho tới khi
  được đóng.
- FR-3: ghi chú đang gõ dở xuất hiện lại "ở đúng vị trí theo thời điểm tạo" → hàm ý nó đã là một
  phần tử của dòng ghi chú, không nằm trong ô soạn thảo.
- FR-10: sửa được ghi chú bất kỳ tại chỗ → vậy ô soạn thảo và ô sửa là **cùng một thứ** hay hai thứ?

Bốn câu này không thể cùng đúng. Và không có quy tắc nào cho việc **ghi chú chưa được `Ctrl+Enter`
thì bao giờ mới rời ô soạn thảo** — addendum §2.5 đã cố ý loại "click ra ngoài" làm cử chỉ chốt, nên
không còn cử chỉ nào khác.

**Kịch bản thất bại cụ thể.** 16:50 thứ Ba, Nam gõ *"kiểm tra phân quyền trước thứ 5"*, không bấm
`Ctrl+Enter` (không có gì bắt anh phải bấm), tắt màn hình về nhà. Tab vẫn mở. 8:30 sáng thứ Tư anh
quay lại, con trỏ vẫn ở đúng chỗ cũ như FR-1 hứa, và gõ *"họp 9h với team QA"*. Kết quả: một ghi chú
duy nhất, nội dung `kiểm tra phân quyền trước thứ 5họp 9h với team QA`, mang mốc **thứ Ba 16:50** —
tức là **không xuất hiện trong khung nhìn hôm nay**. Nam vừa mất cả ghi chú cũ lẫn ghi chú mới, và
màn hình vẫn trống rỗng như FR-9 mô tả là "bình thường". Không FR nào bắt được lỗi này.

**Đề xuất sửa.** Thêm một FR định nghĩa vòng đời:
1. Ô soạn thảo chứa **đúng một** ghi chú đang soạn tại một thời điểm.
2. Ghi chú rời ô soạn thảo khi: `Ctrl+Enter`, **hoặc** khi con trỏ rời đi, **hoặc** khi "hôm nay"
   đổi (xem H-5), **hoặc** khi trang được nạp lại.
3. Sau khi nạp lại trang, ô soạn thảo **luôn rỗng**; ghi chú đang gõ dở nằm trong dòng ghi chú và
   sửa được qua FR-10.
Nếu chọn "ô soạn thảo và ô sửa là cùng một widget" thì phải nói thẳng, vì nó thay đổi hoàn toàn cách
hiện thực.

---

### C-5 · JTBD hứa "danh sách việc", FR-6 + FR-9 + §8 làm việc đó bất khả thi
**Mức: CRITICAL** · **Vị trí: §2.1 JTBD (gạch 3), FR-6, FR-9, UJ-1, §8 Non-Goals**

**Điều gì hỏng.** §2.1 nói: *"tôi muốn nhìn thấy những gì mình đã ghi hôm nay như một danh sách
việc"*. FR-9 khẳng định *"mỗi sáng đều rỗng. Đó là trạng thái bình thường"*. Hai câu này chỉ cùng
đúng nếu **mọi việc ghi hôm nay đều xong trong hôm nay**. Sản phẩm không có trạng thái xong/chưa
(§8), không nhắc nhở (§8), không có "hôm qua" trong một thao tác (FR-13 bắt gõ ngày cụ thể; FR-6
cấm mốc nhanh), không có chế độ duyệt (NT-3). Nghĩa là: **mọi lối thoát đều đã bị chặn bằng non-goal
trước khi vấn đề được đặt ra.**

**Kịch bản thất bại cụ thể — chính là UJ-1.** Thứ Ba 10:14 Nam ghi *"kiểm tra phân quyền trước thứ
5"*. Đây là một việc có hạn thứ Năm. **Thứ Tư 8:30**, khung nhìn mặc định rỗng. Việc đó không còn ở
đâu trên màn hình, không có thông báo, không có gì gợi ý nó tồn tại. Muốn thấy lại, Nam phải *nhớ ra
rằng mình đã quên* rồi mở FR-13 gõ `08/09/2026`. Thứ Năm trôi qua. Hành trình chủ lực của sản phẩm
thất bại đúng **một ngày** sau khi nó thành công, và SM-1 ("còn dùng sau một tháng") là thước đo sẽ
bắt lỗi này — quá muộn.

**Đề xuất sửa.** Không phải thêm tính năng — mà phải **chọn và viết ra**:
(a) Nói thẳng trong §1 và §2 rằng đây là **nhật ký theo ngày**, không phải danh sách việc; sửa JTBD
gạch 3 cho khớp; chấp nhận rằng việc chưa xong phải được ghi lại thủ công. Rẻ, trung thực, giữ
nguyên mọi nguyên tắc; hoặc
(b) Định nghĩa lại "khung nhìn mặc định" thành *"hôm nay + phiên làm việc gần nhất có ghi chú"* —
vẫn không phải chế độ duyệt xem, vẫn không cần phân loại, vẫn tự rỗng dần. Đây là thay đổi mô hình
trạng thái, phải sửa cả bảng §5.4.
Dù chọn gì, **không được để nguyên như hiện tại**: hiện tại tài liệu hứa một thứ và cấm mọi cách
thực hiện nó.

---

### C-6 · FR-8 cắt 3 dòng áp lên cả ghi chú đang gõ → không gõ nổi biên bản họp
**Mức: CRITICAL** · **Vị trí: FR-8, A-2, §2.1 JTBD Bối cảnh, UJ-2**

**Điều gì hỏng.** FR-8 nói *"ghi chú dài quá 3 dòng hiển thị cắt bớt"* và *"khi chưa mở rộng, **mọi**
ghi chú có cùng chiều cao trần"*. Không có ngoại lệ nào cho ghi chú đang được soạn hoặc đang được
sửa. Trong khi đó §2.1 tuyên bố *"ghi chú họp tôi gõ ngay tại chỗ trong lúc họp"* và UJ-2 mô tả một
"biên bản cuộc họp" nhiều dòng.

**Kịch bản thất bại cụ thể.** Nam gõ biên bản một cuộc họp 45 phút, khoảng 40 dòng. Từ dòng thứ tư
trở đi, anh chỉ nhìn thấy 3 dòng cuối (hoặc 3 dòng đầu — PRD cũng không nói cắt đầu hay cắt cuối).
Anh không xem lại được đoạn vừa gõ, không tự soát chính tả, không biết mình đã ghi tên ai. Công cụ
không dùng được cho đúng use-case mà §2.1 nêu ra là bối cảnh chính.

**Đề xuất sửa.** Bổ sung vào FR-8: *"Ghi chú đang được soạn hoặc đang được sửa (có con trỏ bên
trong) luôn hiển thị đầy đủ, tự giãn theo nội dung; quy tắc cắt 3 dòng chỉ áp cho ghi chú không có
con trỏ."* Đồng thời nói rõ cắt phần **cuối** và giữ phần đầu (vì phần đầu mới là thứ nhận diện ghi
chú). Ghi thêm giới hạn trần chiều cao khi soạn (ví dụ 60% chiều cao màn hình rồi cuộn trong) để
không đẩy dòng ghi chú ra khỏi tầm nhìn.

---

### H-1 · "Xóa vĩnh viễn" là lời hứa sai — FR-16 hồi sinh ghi chú đã xóa
**Mức: HIGH** · **Vị trí: FR-11, FR-16, addendum §2.9, §3 (lý do thêm hành động Xóa)**

**Điều gì hỏng.** FR-11: *"Sau khi xóa, ghi chú biến mất **vĩnh viễn** — không thùng rác, không hoàn
tác."* FR-16: *"Nạp file **không bao giờ** xóa... ghi chú nào chưa có thì thêm vào."* File sao lưu
chứa **toàn bộ** ghi chú tại thời điểm xuất (FR-15). Ghép lại: mọi ghi chú đã xóa **sau** lần xuất
gần nhất sẽ **quay trở lại** khi nạp file. Hai FR nói ngược nhau, và không FR nào thừa nhận cái kia.

**Điều này quan trọng hơn nó có vẻ.** Addendum §3 ghi rõ hành động Xóa được thêm vào danh sách trắng
một phần vì *"nội dung nhạy cảm trên máy công ty"*. Tức là Xóa mang chức năng **kiểm soát nội dung
nhạy cảm** — và FR-16 vô hiệu hóa đúng chức năng đó.

**Kịch bản thất bại cụ thể.** 20/09 Nam xuất file sao lưu. 25/09 Nam vô tình dán một đoạn có mật khẩu
staging vào một ghi chú, nhận ra, và **xóa** — FR-11 bảo anh nó đã biến mất vĩnh viễn. 10/10 IT cài
lại máy. Nam nạp file `sao-luu-20-09.json`... file này được xuất **trước** ngày 25/09 nên không chứa
ghi chú đó. Đảo ngày lại cho đúng: Nam xuất file ngày 26/09 (sau khi ghi, trước khi xóa — hoặc đơn
giản là anh xuất hàng tuần và ghi chú nhạy cảm sống 3 ngày, đủ để lọt vào một bản xuất). Sau khi cài
lại máy và nạp file, ghi chú chứa mật khẩu **trở lại trong app**, không cảnh báo, lẫn giữa 500 ghi
chú khác, và Nam tin rằng mình đã xóa nó từ hai tuần trước.

**Đề xuất sửa.** Chọn một:
(a) Sửa câu chữ FR-11 thành *"biến mất vĩnh viễn khỏi máy này; **ghi chú đã xóa vẫn có thể nằm trong
các file sao lưu đã xuất trước đó và sẽ quay lại nếu nạp file đó**"* — và ghi rủi ro này vào §5.5;
(b) Ghi danh sách **định danh đã xóa** (tombstone) vào dữ liệu và vào file sao lưu; khi nạp, ghi chú
có định danh nằm trong danh sách đã xóa thì bỏ qua. Chi phí thấp, đóng luôn cả lỗ hổng nhạy cảm.
Khuyến nghị (b), và nếu chọn (a) thì phải sửa cả addendum §2.9 (câu *"hành động duy nhất còn có thể
phá dữ liệu là xóa, và nó đã có phanh"* hiện đang sai theo hướng ngược lại: xóa **không** phá dữ liệu
triệt để như tài liệu tưởng).

---

### H-7 · FR-12 tạo ra "chế độ duyệt xem" mà NT-3 cấm
**Mức: HIGH** · **Vị trí: FR-12, A-4, NT-3, NFR-2**

**Điều gì hỏng.** NT-3 tuyên bố *"Sản phẩm không có chế độ duyệt xem — không có màn hình 'xem tất
cả'"*. FR-12 + A-4 (lọc dần theo từng ký tự) trên **toàn bộ** dữ liệu, **không giới hạn số kết quả**,
sắp xếp mới nhất trên cùng. Gõ một ký tự phổ biến — `a`, hoặc dấu cách, hoặc `n` — là ra gần như
toàn bộ ghi chú, xếp theo thời gian giảm dần. Đó **chính xác** là màn hình "xem tất cả", chỉ khác là
nó có một ký tự trong ô tìm kiếm. Nguyên tắc bị vô hiệu bằng một phím.

**Kịch bản thất bại kép.** (1) Người dùng khám phá ra mẹo này trong tuần đầu và bắt đầu dùng nó để
"liếc lại cho biết" — đúng thói quen mà addendum §2.4 nói không tồn tại và cả kiến trúc mặc định đặt
cược vào việc nó không tồn tại. (2) Với 2.000 ghi chú, ký tự **đầu tiên** người dùng gõ là trường hợp
xấu nhất của NFR-2: gần như mọi ghi chú đều khớp, phải chuẩn hóa/so khớp toàn bộ **và dựng ra màn
hình toàn bộ**, trong ≤ 200 ms. PRD không nói giới hạn số kết quả hiển thị, không nói có cuộn vô hạn
hay không. Addendum ràng buộc 3 gửi cho Architecture yêu cầu ≤ 200 ms nhưng không nói gì về khối
lượng dựng hình.

**Đề xuất sửa.** Thêm vào FR-12:
- Từ khóa chỉ có hiệu lực từ **≥ 2 ký tự** (dưới ngưỡng thì coi như chưa đặt điều kiện) — chặn luôn
  cả trường hợp "một dấu cách";
- Giới hạn số kết quả hiển thị (ví dụ 50 mới nhất) kèm dòng *"còn N kết quả cũ hơn — thu hẹp bằng bộ
  lọc ngày"*. Điều này **củng cố** NT-3 chứ không phá: nó buộc người dùng hỏi cụ thể hơn.
- Chuyển yêu cầu này vào bảng ràng buộc Architecture (hiện thiếu).

---

### M-6 · FR-9 và FR-17 mô tả cùng một màn hình theo hai cách trái nhau
**Mức: MEDIUM** · **Vị trí: FR-9, FR-17, A-9**

**Điều gì hỏng.** FR-9: khi hôm nay chưa có ghi chú, *"màn hình **chỉ có** ô soạn thảo với con trỏ
sẵn trong đó"*, và **không** hiện thông báo nào. FR-17: hiện một dòng nhỏ nhắc sao lưu khi đã quá 7
ngày. Sáng thứ Hai, chưa ghi gì, đã 8 ngày chưa sao lưu → hai FR yêu cầu hai màn hình khác nhau.

**Đề xuất sửa.** FR-9 thêm một câu: *"Ngoại lệ duy nhất là dòng nhắc sao lưu của FR-17."* (§8 đã có
sẵn cách nói này cho non-goal "không thông báo" — chỉ cần lặp lại đúng chỗ.)

---

### M-1 · FR-3 tự mâu thuẫn về cửa sổ mất dữ liệu
**Mức: MEDIUM** · **Vị trí: FR-3 (gạch 1 vs gạch 4), addendum ràng buộc 2**

**Điều gì hỏng.** Gạch 1: *"**Chữ vừa gõ** vẫn còn sau khi đóng tab đột ngột, trình duyệt crash, hoặc
máy khởi động lại."* Gạch 4: *"Khoảng cách giữa lúc gõ và lúc chữ đã an toàn: ≤ 1 giây."* Gạch 4 cho
phép mất tối đa 1 giây gõ cuối; gạch 1 nói không mất gì. Không thể cùng đúng. Người viết test sẽ
không biết ca kiểm thử "gõ rồi kill tab ngay lập tức" là pass hay fail.

**Kịch bản thất bại cụ thể.** Nam gõ xong dòng cuối biên bản và ngay lập tức `Ctrl+W` (thói quen).
Dòng cuối biến mất. Theo gạch 4 đây là hành vi đúng; theo gạch 1 đây là bug; theo NFR-3 ("ghi chú
không tự mất đi") đây là vi phạm nguyên tắc nền.

**Đề xuất sửa.** Viết lại gạch 1 cho khớp: *"Chữ đã gõ trước đó ≥ 1 giây luôn còn sau khi đóng tab
đột ngột, crash, hoặc khởi động lại máy. Cửa sổ mất tối đa là 1 giây gõ cuối cùng — đây là đánh đổi
có ý thức."* Đồng thời bổ sung: `Ctrl+Enter` và mất focus phải **cưỡng bức lưu ngay**, không chờ hết
cửa sổ — như vậy cửa sổ 1 giây chỉ áp cho việc gõ liên tục.

---

### M-2 · FR-5 và FR-2 xung đột khi ghi chú bị làm rỗng rồi gõ lại
**Mức: MEDIUM** · **Vị trí: FR-2, FR-3, FR-5**

**Điều gì hỏng.** FR-2: thời điểm tạo = lúc **ký tự đầu tiên** được gõ. FR-5: ghi chú rỗng biến mất
**khi người dùng rời khỏi nó** — tức là trong lúc con trỏ còn ở đó, ghi chú rỗng **vẫn tồn tại**.
Vậy: ghi chú tạo lúc 10:14, người dùng bôi đen xóa hết chữ (10:30), rồi gõ lại nội dung khác
(10:31), không hề rời con trỏ. Mốc thời gian là 10:14 hay 10:31? Cả hai FR đều có lý và đều không
trả lời. NT-4 ("thời điểm tạo là bất biến") nghiêng về 10:14, nhưng lúc đó "thời điểm tạo" không còn
là thời điểm nội dung hiện tại được tạo — dấu thời gian nói dối, đúng thứ NT-4 cấm.

**Kịch bản phụ, nặng hơn.** FR-3 nói ghi chú đang gõ dở khi phiên bị ngắt *"xuất hiện lại nguyên
trạng"*. Nếu ghi chú đang rỗng lúc tab bị đóng, "nguyên trạng" là một ghi chú rỗng đã được lưu — mâu
thuẫn trực tiếp với FR-5 ("ghi chú rỗng không tồn tại"). Sau vài lần lỡ tay, dữ liệu tích tụ các bản
ghi rỗng mà giao diện có thể hiển thị hoặc không, tùy người hiện thực đoán.

**Đề xuất sửa.** Chốt: *"Ghi chú rỗng không bao giờ được ghi xuống bộ nhớ lưu trữ. Nếu nội dung một
ghi chú trở về rỗng, ghi chú bị xóa khỏi lưu trữ ngay lập tức; ký tự tiếp theo gõ vào tạo một ghi chú
**mới** với định danh mới và thời điểm tạo mới."* Quy tắc này khép kín cả FR-2, FR-3 và FR-5, và làm
dấu thời gian luôn nói đúng.

---

### M-5 · "Danh sách trắng ba hành động" đã bị thủng ba lần, nên không còn là dao mổ
**Mức: MEDIUM** · **Vị trí: NT-2, FR-8, FR-11, FR-16, addendum §3**

**Điều gì hỏng.** Addendum §3 lập luận rằng danh sách trắng mạnh hơn nguyên tắc vì *"nguyên tắc phải
diễn giải và cãi được, danh sách trắng thì đếm được"*. Nhưng ngay trong PRD, ít nhất ba thứ đã nằm
ngoài ba hành động mà không ai đếm:
1. **Mở rộng / thu gọn** một ghi chú (FR-8, A-3) — một tương tác trên ghi chú, có trạng thái riêng.
2. **Bước xác nhận xóa** (FR-11) — chèn thêm một quyết định vào một trong ba hành động.
3. **Nạp file** (FR-16) — tạo ghi chú **hàng loạt**, trong khi §5.3 vừa dùng NT-2 để cấm mọi thao tác
   hàng loạt (*"chúng tác động lên một ghi chú tại một thời điểm"*).

Không cái nào trong ba là sai về sản phẩm. Vấn đề là **NT-2 hiện không phân biệt được chúng với nút
ghim**, mà §3 tuyên bố NT-2 sẽ là căn cứ xử mọi tranh cãi trong ba tháng tới. Một dao mổ đã cùn ngay
trong tài liệu định nghĩa nó.

**Đề xuất sửa.** Viết lại NT-2 cho chính xác điều nó thật sự muốn nói: *"Đúng ba hành động **thay đổi
nội dung hoặc sự tồn tại** của một ghi chú: Tạo mới · Sửa nội dung · Xóa. Không có thuộc tính nào
khác gắn được vào ghi chú (ghim, màu, sao, trạng thái, nhãn, thứ tự thủ công, độ ưu tiên). Các tương
tác **chỉ ảnh hưởng cách hiển thị tạm thời** (mở rộng/thu gọn) không tính vào danh sách này, với điều
kiện không được ghi bền vào ghi chú."* Câu cuối vừa hợp thức hóa FR-8 vừa giải thích A-3 (vì sao
trạng thái mở rộng không được nhớ).

---

### M-9 · FR-7 không định nghĩa cách phá hòa khi trùng thời điểm tạo
**Mức: MEDIUM** · **Vị trí: FR-7, FR-4, NT-4**

**Điều gì hỏng.** FR-7 nói khóa sắp xếp là thời điểm tạo, "không có bất kỳ cách nào để đổi thứ tự".
FR-4 khuyến khích tạo ghi chú liên tiếp bằng `Ctrl+Enter` trong lúc họp. Nếu độ phân giải dấu thời
gian là giây (mà FR-2 chỉ nói "ngày + giờ"), hai ghi chú gõ cách nhau 400 ms có **cùng khóa sắp
xếp**. Thứ tự giữa chúng trở thành ngẫu nhiên và **có thể đổi giữa hai lần tải trang**. NT-4 nói
*"vị trí và dấu thời gian phải luôn nói cùng một điều"* — với dấu thời gian trùng nhau thì vị trí
đang nói điều mà dấu thời gian không nói.

**Kịch bản thất bại cụ thể.** Trong họp, Nam gõ ba dòng liên tiếp: *"1. sếp duyệt phương án B"*,
`Ctrl+Enter`, *"2. deadline thứ 6"*, `Ctrl+Enter`, *"3. QA tự test"*. Ba ghi chú cùng mốc `10:22`.
Hôm sau mở lại, thứ tự hiển thị là 2-1-3. Nội dung được đánh số nên Nam phát hiện, nhưng với ghi chú
không đánh số thì trình tự lập luận trong cuộc họp bị đảo mà không ai biết.

**Đề xuất sửa.** FR-2: yêu cầu thời điểm tạo lưu ở độ phân giải **mili-giây** (hiển thị vẫn chỉ ngày
+ giờ + phút). FR-7: bổ sung khóa phá hòa xác định (thứ tự chèn hoặc định danh tăng dần), để thứ tự
ổn định tuyệt đối qua mọi lần tải.

---

## 2. Kịch bản làm sản phẩm hỏng

### C-3 · Hai tab: mất dữ liệu im lặng, đang bị xếp nhầm loại thành "câu hỏi mở"
**Mức: CRITICAL** · **Vị trí: §11 Open Question 5, NFR-3, FR-3, UJ-1**

**Điều gì hỏng.** §11 mục 5 viết: *"Điều gì xảy ra khi mở app ở hai tab cùng lúc? Chưa xét. Nhiều
khả năng có thật."* Đây không phải câu hỏi mở — đây là **một kịch bản mất dữ liệu**, và NFR-3 ("ghi
chú không tự mất đi") được tuyên bố là ràng buộc, không phải mong muốn. Một tài liệu nói "mất dữ liệu
là rủi ro số một" (§5.3) không được để kịch bản mất dữ liệu dễ xảy ra nhất nằm ở mục Câu hỏi mở.

Xác suất xảy ra rất cao, và chính PRD chứng minh điều đó: UJ-1 nói *"tab app đã mở sẵn từ sáng"* —
một tab để mở cả ngày trên trình duyệt công ty gần như chắc chắn sẽ có bản sao thứ hai (khôi phục
phiên, mở từ bookmark, `Ctrl+Shift+T`, một cửa sổ khác).

**Kịch bản thất bại cụ thể.** Tab A mở từ 8:00, có 6 ghi chú của hôm nay trong bộ nhớ. 14:00 Nam mở
Tab B từ bookmark (quên tab cũ), gõ thêm 4 ghi chú. 16:00 anh quay lại Tab A — Tab A vẫn đang giữ
trạng thái cũ trong bộ nhớ, hiển thị 6 ghi chú. Anh gõ tiếp một ghi chú → FR-3 buộc lưu trong ≤ 1
giây. Nếu tầng lưu trữ ghi cả khối trạng thái (cách hiện thực đơn giản nhất và là mặc định mà một
người sẽ chọn khi PRD không cấm), **4 ghi chú của Tab B bị ghi đè mất trắng**, không cảnh báo, không
dấu vết. Nam không có cách nào phát hiện — khung nhìn mặc định chỉ hiện hôm nay, và nó *trông vẫn
bình thường*.

Biến thể thứ hai: FR-17 lưu "thời điểm xuất gần nhất". Tab A xuất file lúc 9:00; Tab B (mở từ 8:00)
ghi đè trạng thái cũ → app quên mất là đã sao lưu, hoặc ngược lại, tưởng đã sao lưu khi chưa.

**Đề xuất sửa.** Nâng thành FR bắt buộc, không phải câu hỏi mở. Yêu cầu tối thiểu:
- Ghi xuống lưu trữ phải ở mức **từng ghi chú**, không ghi đè cả khối trạng thái;
- Mỗi tab phải lắng nghe thay đổi lưu trữ từ tab khác và cập nhật dòng ghi chú của mình (trừ ghi chú
  đang có con trỏ);
- Ghi chú đang được soạn ở hai tab cùng lúc là bất khả (định danh khác nhau) nên không cần giải quyết
  xung đột nội dung — chỉ cần không ghi đè lẫn nhau.
Thêm vào bảng ràng buộc Architecture của addendum (hiện đang thiếu hoàn toàn).

---

### C-4 · Hết dung lượng lưu trữ: FR-3 thất bại im lặng và không FR nào bắt phải báo
**Mức: CRITICAL** · **Vị trí: §11 Open Question 3, FR-3, NFR-3, addendum ràng buộc 7**

**Điều gì hỏng.** PRD đẩy toàn bộ vấn đề dung lượng sang `bmad-architecture` (Open Question 3,
addendum ràng buộc 7). Nhưng **hành vi khi ghi thất bại là một quyết định sản phẩm**, không phải
quyết định kỹ thuật: nó quyết định người dùng có biết mình đang mất dữ liệu hay không. FR-3 hứa "chữ
đã an toàn trong ≤ 1 giây" một cách **vô điều kiện**, không có nhánh thất bại. Nếu lệnh ghi bị từ
chối, lời hứa đó thành sai mà giao diện vẫn trông y hệt lúc thành công — vì FR-3 cũng cấm mọi chỉ báo
lưu ("không có nút Lưu", không có trạng thái đã lưu).

**Kịch bản thất bại cụ thể.** Tháng thứ năm, ~1.800 ghi chú, trong đó vài ghi chú là biên bản họp
dán từ chat (chục nghìn ký tự). Trình duyệt chạm hạn ngạch origin. Nam gõ biên bản cuộc họp quan
trọng nhất quý — 40 dòng, 20 phút. Mọi lần ghi đều bị từ chối. Màn hình hoàn toàn bình thường: chữ
vẫn hiện, không có nút Lưu để mà báo lỗi, không có gạch đỏ. Nam đóng tab. **Mất sạch.** Anh phát
hiện ba ngày sau, khi cần tra lại. Đây đúng là kiểu thất bại mà addendum §2.8 gọi tên: *"cảm giác
được bảo vệ mà thực ra không có"* — nhưng addendum chỉ soi nó ở F5, không soi ở F1.

Kịch bản phụ tệ không kém: hạn ngạch bị chạm **giữa lúc nạp file sao lưu** (FR-16). Nạp được 300/500
ghi chú rồi hỏng. FR-16 chỉ nói *"file hỏng, sai định dạng, sai phiên bản: báo lỗi và không đụng vào
dữ liệu đang có"* — không nói gì về **thất bại giữa chừng**. Người dùng còn lại một trạng thái nạp
một nửa và tin rằng đã khôi phục xong.

**Đề xuất sửa.** Thêm **FR-18 · Lưu thất bại phải nhìn thấy được**:
- Khi một thao tác ghi thất bại vì bất kỳ lý do gì, app phải hiện cảnh báo **chặn đường** (đây là
  ngoại lệ chính đáng duy nhất cho §8 "không thông báo") và **không được để người dùng tiếp tục gõ
  với ảo tưởng đã lưu**;
- Cảnh báo phải đề nghị hành động duy nhất còn cứu được: **xuất file sao lưu ngay**;
- Nội dung chưa lưu được phải giữ nguyên trong ô soạn thảo để copy tay ra ngoài.
Thêm yêu cầu cho FR-16: nạp file là **tất-cả-hoặc-không-gì**, hoặc phải báo cáo chính xác số ghi chú
đã nạp thành công khi dừng giữa chừng.
Bổ sung một câu vào NFR-3: *"Sản phẩm không bao giờ được mất ghi chú **một cách im lặng**; mất dữ
liệu bắt buộc phải nhìn thấy được."*

---

### H-5 · Biên nửa đêm bị bác bỏ bằng một lập luận sai
**Mức: HIGH** · **Vị trí: §11 Open Question 1, FR-6, A-1, UJ-1**

**Điều gì hỏng.** §11 mục 1 viết: *"Người dùng xác nhận không bao giờ làm việc qua nửa đêm, nên không
giải quyết."* Lập luận này chỉ đúng nếu app **được đóng và mở lại** mỗi ngày. Nhưng UJ-1 nói rõ tab
được mở cả ngày, và cả sản phẩm được thiết kế để tab luôn sẵn sàng. **Tab để mở qua đêm không đòi hỏi
người dùng thức qua nửa đêm.** Câu trả lời của người dùng không phủ được câu hỏi thật sự là *"khung
nhìn mặc định có tự cập nhật khi ngày đổi trong lúc tab đang mở không?"* — và câu đó chưa ai hỏi.

**Kịch bản thất bại cụ thể.** Thứ Ba 17:30 Nam khóa máy, tab mở, 7 ghi chú hôm nay trên màn hình.
Thứ Tư 8:30 mở khóa. Không FR nào bắt app tính lại "hôm nay", nên màn hình vẫn là 7 ghi chú của thứ
Ba, và Nam **tin đó là hôm nay** (FR-2 có hiện ngày giờ, nhưng người ta không đọc dấu thời gian trên
chính danh sách mình vừa tạo hôm qua). Anh gõ thêm 5 ghi chú. Giờ dòng ghi chú trộn hai ngày —
vi phạm trực tiếp FR-6 (*"Không ghi chú nào của ngày khác xuất hiện"*). Nếu app **có** tự cập nhật
lúc 00:00, kịch bản ngược lại xảy ra: nếu ghi chú đang gõ dở nằm trong ô soạn thảo lúc đó (xem C-2),
nó biến khỏi màn hình giữa chừng.

Máy công ty ngủ/thức, đổi giờ hệ thống, và VPN đồng bộ lại đồng hồ đều làm kịch bản này thường xuyên
hơn nữa.

**Đề xuất sửa.** Thay Open Question 1 bằng một FR:
*"Khung nhìn mặc định phải tính lại 'hôm nay' khi (a) qua mốc 00:00 giờ máy trong lúc tab đang mở,
và (b) mỗi lần tab được đưa trở lại tiêu điểm sau khi ẩn. Ghi chú của ngày trước rời khỏi khung nhìn
mặc định tại thời điểm đó. Ghi chú đang có con trỏ bên trong không bị gỡ khỏi màn hình cho tới khi
con trỏ rời đi."* Gạch (b) đóng cả trường hợp máy ngủ qua đêm — trường hợp thật sự hay xảy ra nhất.

---

### H-4 · Đồng hồ hệ thống lùi lại: NT-4 và FR-7 gãy cùng lúc
**Mức: HIGH** · **Vị trí: NT-4, FR-2, FR-7, FR-6**

**Điều gì hỏng.** Toàn bộ mô hình dữ liệu treo vào đồng hồ máy: nó vừa là khóa sắp xếp (FR-7), vừa là
căn cứ lọc (FR-13), vừa là căn cứ của khung nhìn mặc định (FR-6). NT-4 tuyên bố *"vị trí và dấu thời
gian phải luôn nói cùng một điều"* nhưng không có yêu cầu nào bảo đảm dấu thời gian **tăng đơn điệu**.
Máy công ty đồng bộ giờ qua domain controller; lệch giờ bị kéo lùi là chuyện thường.

**Kịch bản thất bại cụ thể.** 10:05 Nam ghi ghi chú A. 10:07 máy đồng bộ giờ, đồng hồ lùi về 09:52.
10:08 (giờ máy: 09:53) Nam ghi ghi chú B. Ghi chú B xuất hiện **bên dưới** A, không phải trên cùng —
Nam nhìn lên đầu danh sách để kiểm tra chữ mình vừa gõ và không thấy nó. FR-7 hứa "mới nhất trên
cùng"; B mới hơn nhưng nằm dưới. Phản ứng tự nhiên: gõ lại.

Biến thể nặng hơn: đồng hồ lùi qua mốc 00:00 (máy vừa cài lại, chưa đồng bộ, đang ở ngày hôm trước).
Mọi ghi chú Nam gõ sáng nay mang mốc **hôm qua** → theo FR-6 chúng **không xuất hiện trong khung nhìn
mặc định**. Nam gõ, chữ biến mất ngay, app trông như hỏng nặng. Đây cũng là một cách nữa để dữ liệu
"biến mất" mà không hề mất.

**Đề xuất sửa.** Thêm vào FR-2: *"Thời điểm tạo phải tăng đơn điệu: nếu đồng hồ máy trả về một mốc
nhỏ hơn hoặc bằng mốc của ghi chú mới nhất đang có, hệ thống dùng mốc lớn nhất đang có cộng 1 ms."*
Rẻ, đóng cả H-4 lẫn M-9. Thêm vào FR-6/FR-13 một ghi chú rằng ngày được lấy từ đồng hồ máy và app
không tự sửa đồng hồ — nhưng thứ tự thì luôn đúng.

---

### H-9 · Hộp thoại xác nhận xóa không được yêu cầu cho biết đang xóa cái gì
**Mức: HIGH** · **Vị trí: FR-11, FR-8, FR-12, FR-13, §8**

**Điều gì hỏng.** FR-11 chỉ yêu cầu *"một bước xác nhận có hai lựa chọn rõ ràng: hủy hoặc xóa"*.
Không yêu cầu nào bắt hộp thoại hiển thị **ghi chú nào** sắp bị xóa. Ghép với FR-8 (mọi ghi chú bị
cắt còn 3 dòng, cùng chiều cao trần, nên trông rất giống nhau) và với việc xóa là **không hoàn tác
được** (§8), đây là một cái bẫy xóa nhầm.

**Kịch bản thất bại cụ thể.** Bộ lọc ngày `03/09/2026` + từ khóa `phan quyen` đang bật, ba kết quả,
cả ba đều là biên bản họp bắt đầu bằng cùng một dòng tiêu đề nên **ba dòng đầu giống hệt nhau** trên
màn hình. Nam định xóa bản nháp trùng lặp, click nhầm nút xóa của kết quả thứ hai, hộp thoại hiện
*"Xóa ghi chú này?"* — không nội dung, không dấu thời gian. Anh xác nhận. Biên bản gốc mất vĩnh viễn,
và nếu lần sao lưu gần nhất cách đây 6 ngày thì FR-17 còn chưa kịp nhắc.

**Đề xuất sửa.** FR-11 bổ sung: *"Bước xác nhận phải hiển thị thời điểm tạo và ít nhất hai dòng đầu
nội dung của ghi chú sắp xóa. Nút mặc định (nhận `Enter`) là **Hủy**."* Câu thứ hai cũng làm giảm
đúng cái rủi ro mà NOTE FOR PM ở FR-11 đã dự báo (bấm theo phản xạ).

---

### H-2 · Định danh không được yêu cầu duy nhất toàn cục → nạp lại im lặng bỏ rơi ghi chú
**Mức: HIGH** · **Vị trí: Glossary "Định danh", FR-16, addendum ràng buộc 4**

**Điều gì hỏng.** Glossary chỉ nói định danh *"duy nhất và ổn định"* — duy nhất **trong phạm vi
nào**? Addendum ràng buộc 4 chỉ yêu cầu "sống sót qua xuất/nạp". Nếu định danh là số đếm tăng dần
(cách hiện thực rẻ nhất, và PRD không cấm), thì trên một trình duyệt **mới** bộ đếm bắt đầu lại từ
đầu. FR-16 dedupe **theo định danh**, và quy tắc là *"đã có thì bỏ qua"* — bỏ qua **im lặng**.

**Kịch bản thất bại cụ thể.** IT cài lại máy. Nam mở app trên trình duyệt mới, và trước khi kịp nhớ
ra việc nạp file, anh ghi 3 ghi chú (nhận định danh 1, 2, 3). Chiều đó anh nạp file sao lưu chứa 500
ghi chú, định danh 1..500. Ba ghi chú đầu của file — theo FR-16 — bị coi là "đã có" và **bỏ qua**.
Kết quả: 3 ghi chú cũ mất vĩnh viễn (chúng chỉ còn trong file, và file thì Nam tin là đã nạp xong),
trong khi app báo nạp thành công. Đây là mất dữ liệu **do chính cơ chế chống mất dữ liệu gây ra**.

**Đề xuất sửa.**
- Glossary: *"Định danh phải duy nhất **toàn cục** (ví dụ UUID v4 hoặc mốc-thời-gian + phần ngẫu
  nhiên), sao cho hai ghi chú tạo ra trên hai máy/hai trình duyệt khác nhau không bao giờ trùng
  định danh."* Đưa thẳng vào bảng ràng buộc Architecture (sửa ràng buộc 4).
- FR-16: khi phát hiện định danh trùng nhưng **nội dung hoặc thời điểm tạo khác nhau**, không được
  bỏ qua im lặng — phải nạp vào như một ghi chú mới với định danh mới và báo cho người dùng.

---

### H-3 · FR-16 không báo cáo kết quả, và không khôi phục được ghi chú bị hỏng nội dung
**Mức: HIGH** · **Vị trí: FR-16, addendum §2.8, §2.9**

**Điều gì hỏng.** Hai lỗ trong cùng một FR:

1. **Không có yêu cầu báo cáo.** FR-16 không bắt app nói *"đã thêm N, bỏ qua M"*. Một lần nạp thành
   công và một lần nạp nhầm file rỗng trông **giống hệt nhau**.
2. **Gộp-theo-định-danh không cứu được ghi chú bị hỏng nội dung.** FR-16 chỉ thêm ghi chú *thiếu*.
   Ghi chú vẫn còn định danh nhưng nội dung đã bị phá thì bị bỏ qua — nghĩa là kịch bản mất dữ liệu
   **phổ biến nhất trong thực tế** (sửa nhầm, dán đè, bôi đen gõ đè) hoàn toàn **không có đường
   khôi phục**, dù người dùng có file sao lưu chứa bản đúng nằm ngay đó.

**Kịch bản thất bại cụ thể.** Nam mở ghi chú biên bản 03/09 để đọc lại, quên rằng FR-10 cho sửa tự
do ở mọi khung nhìn, bôi đen toàn bộ rồi gõ *"ok"* (tưởng đang ở ô soạn thảo — xem C-2, hai thứ này
chưa được phân biệt). FR-3 lưu ngay trong 1 giây, không hoàn tác, không lịch sử (FR-10). Anh nhận ra
sau 5 phút, mở file sao lưu tuần trước ra nạp. FR-16 thấy định danh đã tồn tại → **bỏ qua** → app
báo (hoặc không báo gì) và biên bản vẫn là chữ `ok`. File sao lưu chứa bản đúng, nằm trong Downloads,
và sản phẩm **từ chối dùng nó**. Addendum §2.8 nói kiểu thất bại tệ nhất là *"cảm giác được bảo vệ mà
thực ra không có"* — đây chính là nó, và nó lọt qua vì §2.9 chỉ soi rủi ro "nạp làm mất dữ liệu",
không soi rủi ro "nạp không cứu được gì".

**Đề xuất sửa.**
- FR-16 bổ sung: *"Sau khi nạp, app hiển thị kết quả: số ghi chú đã thêm, số bỏ qua vì trùng định
  danh, số bị từ chối."*
- Thêm nhánh xử lý xung đột: khi định danh trùng nhưng **nội dung khác**, hiện đối chiếu và cho người
  dùng chọn *giữ bản hiện tại* / *nhận bản trong file* / *giữ cả hai (bản trong file thành ghi chú
  mới)*. Mặc định là "giữ cả hai" — vẫn tuân thủ nguyên tắc "không bao giờ mất gì" của §2.9 nhưng
  không còn vô dụng khi ghi chú bị hỏng.
- Cập nhật §9.2 và addendum §2.9 cho khớp.

---

### M-10 · Không có chính sách độ dài ghi chú: dán 50.000 ký tự phá cả bốn yêu cầu cùng lúc
**Mức: MEDIUM** · **Vị trí: §5.1 (toàn bộ F1), FR-3, FR-8, NFR-2, §11 mục 3**

**Điều gì hỏng.** Không chỗ nào trong PRD nói một ghi chú dài tối đa bao nhiêu, hay điều gì xảy ra
khi dán một khối lớn. Sản phẩm là văn bản tự do, dán là thao tác hiển nhiên (JTBD: chép lại một câu
ai đó dặn, thường là từ chat).

**Kịch bản thất bại cụ thể.** Nam copy toàn bộ log lỗi 50.000 ký tự từ terminal, dán vào ô soạn thảo
để "ghi tạm rồi tính sau". Bốn thứ hỏng cùng lúc:
- **FR-3**: mỗi lần gõ thêm phải ghi lại khối 50 KB; cửa sổ ≤ 1 giây bị đe dọa (và với vài ghi chú
  như vậy thì gõ bình thường cũng giật);
- **FR-8**: cắt còn 3 dòng thì OK để hiển thị, nhưng **mở rộng tại chỗ** một khối 50.000 ký tự sẽ đẩy
  dòng ghi chú xuống hàng chục màn hình — FR-8 cấm mở màn hình khác nên không có lối thoát;
- **NFR-2**: tìm bằng chữ bỏ dấu trên toàn bộ dữ liệu, với vài ghi chú cỡ này thì ngân sách 200 ms
  bốc hơi;
- **Dung lượng** (C-4): vài chục lần dán như vậy là chạm hạn ngạch.

**Đề xuất sửa.** PRD phải chốt chính sách, không được đẩy sang UX/Architecture:
- Giới hạn mềm cho một ghi chú (đề xuất ~10.000 ký tự), vượt ngưỡng thì app **báo và vẫn nhận** —
  không được im lặng cắt bớt (cắt bớt im lặng = mất dữ liệu);
- FR-8: giới hạn trần chiều cao khi mở rộng (ví dụ 50% màn hình rồi cuộn bên trong), thay vì "mở
  rộng hết";
- Đưa "kích thước ghi chú tối đa" vào bảng ràng buộc Architecture.
Đây cũng là điều mà §0 tuyên bố là **đã trả lời** — xem M-3.

---

### L-5 · Xóa ghi chú cuối cùng đang khớp bộ lọc: màn hình nói gì?
**Mức: LOW** · **Vị trí: FR-11, FR-12, FR-13, FR-9**

**Điều gì hỏng.** Xóa kết quả cuối cùng trong khung nhìn có điều kiện để lại một màn hình rỗng. FR-12
yêu cầu phân biệt "không có kết quả" với trạng thái rỗng bình thường (FR-9), nhưng không nói trường
hợp rỗng-do-vừa-xóa. Nhẹ, nhưng gây bối rối một giây — và một giây bối rối trong sản phẩm đặt cược
vào tốc độ thì cũng đáng sửa.

**Đề xuất sửa.** Một câu trong FR-11: *"Sau khi xóa, điều kiện đang áp dụng được giữ nguyên; nếu
không còn kết quả nào, hiển thị thông báo 'không có kết quả' của FR-12."*

---

## 3. Lời hứa không có FR đỡ

### H-8 · Open Question 2 không phải câu hỏi mở — nó là điều kiện tiên quyết cho cả PRD
**Mức: HIGH** · **Vị trí: §11 Open Question 2, NFR-7, toàn bộ §5.5, A-10**

**Điều gì hỏng.** *"Chính sách IT có chặn lưu trữ cục bộ hoặc tải file về không?"* Nếu câu trả lời là
"có" cho **một trong hai**, thì: lưu trữ cục bộ bị chặn → **không có sản phẩm nào cả**; tải file bị
chặn → **F5 không tồn tại**, và F5 là "lối thoát duy nhất" khỏi rủi ro số một (§5.5). Một PRD gắn
nhãn `status: draft` sẵn sàng đi tiếp sang Architecture **không được** để một điều kiện sinh-tử ở mục
Câu hỏi mở cạnh những câu như "ngưỡng 7 ngày có đúng không".

Chi phí kiểm chứng: mở trình duyệt trên máy đó, thử ghi vào lưu trữ cục bộ và tải một file về — **10
phút**. Chi phí không kiểm chứng: có thể là toàn bộ dự án.

**Đề xuất sửa.** Chuyển mục này ra khỏi §11 thành **"Điều kiện tiên quyết — phải xác nhận trước khi
`bmad-architecture` bắt đầu"**, kèm ba phép thử cụ thể: (1) ghi/đọc lưu trữ cục bộ, (2) tải file về
đĩa, (3) chọn file từ đĩa để nạp. Ghi kết quả (kể cả tên và phiên bản trình duyệt, để đóng luôn
A-10) vào PRD trước khi tiếp tục.

---

### M-3 · §0 tuyên bố đã trả lời ba câu hỏi mở của brief; ít nhất một câu chưa được trả lời, và con trỏ tham chiếu sai
**Mức: MEDIUM** · **Vị trí: §0 đoạn cuối, brief §Open Questions, §5.1, §5.2, §5.5**

**Điều gì hỏng.** §0 khẳng định: *"Ba câu hỏi mở mà brief cố ý để lại đều đã được trả lời ở đây: định
dạng xuất dữ liệu (§5.5), hình dạng bộ lọc thời gian (§5.4), độ dài một ghi chú (§5.1)."* Đối chiếu:

- **Bộ lọc thời gian → §5.4**: đúng, trả lời đầy đủ (FR-13 + A-5). ✅
- **Định dạng xuất → §5.5**: trả lời **một phần**. Brief hỏi *"JSON, Markdown, hay text thuần?"*.
  §5.5 chỉ nói "máy đọc được, có phiên bản". Đây thực chất là *yêu cầu*, không phải câu trả lời — có
  thể chấp nhận được vì việc chọn định dạng cụ thể thuộc Architecture, nhưng lúc đó §0 phải nói vậy
  chứ không nói "đã trả lời". ⚠️
- **Độ dài một ghi chú → §5.1**: **chưa trả lời, và trỏ nhầm mục**. §5.1 (FR-1..FR-5) không có một
  chữ nào về độ dài. Thứ gần nhất là FR-8 ở **§5.2**, và FR-8 nói về *cắt bớt khi hiển thị*, không
  phải về độ dài cho phép. Brief còn nói rõ câu hỏi này *"định hình cả giao diện"*. Xem M-10 để thấy
  hậu quả. ❌

Đây là lỗi nhỏ về câu chữ nhưng ảnh hưởng thật: người đọc sau (kể cả tác giả sau vài tháng) sẽ tin
vấn đề đã được xử lý và không mở lại nó.

**Đề xuất sửa.** Sửa §0 thành: *"Hai câu hỏi... đã được trả lời (§5.4, §5.5 ở mức yêu cầu). Câu hỏi
về độ dài ghi chú mới được trả lời ở mức hiển thị (FR-8); chính sách độ dài lưu trữ vẫn còn mở — xem
§11."* Rồi bổ sung chính sách theo M-10.

---

### M-8 · NFR-5 tuyên bố bảo mật nghiêm ngặt, F5 lại rải bản sao không mã hóa khắp Downloads
**Mức: MEDIUM** · **Vị trí: NFR-5, FR-15, A-8, FR-11**

**Điều gì hỏng.** NFR-5 lập luận rất mạnh: *"Đây là yêu cầu nghiêm túc chứ không phải sở thích: nội
dung ghi chú là công việc nội bộ, trên máy công ty."* Nhưng cơ chế chống mất dữ liệu (F5) lại **cố ý
tạo ra nhiều bản sao văn bản thuần** (A-8: tên file chứa ngày xuất *"để nhiều bản sao lưu không đè
lên nhau"*), nằm trong thư mục Downloads, không mã hóa, không có yêu cầu dọn dẹp nào, tồn tại vô thời
hạn — trên chính cái máy công ty mà NFR-5 đang lo lắng. Nếu IT sao lưu ổ đĩa hoặc máy được chuyển
tay, toàn bộ ghi chú đi theo. Đây là chỗ hai yêu cầu của cùng tài liệu kéo ngược nhau mà không ai
ghi nhận đánh đổi.

Liên đới với H-1: chừng nào các file này còn tồn tại thì FR-11 "biến mất vĩnh viễn" luôn sai.

**Đề xuất sửa.** Không cần mã hóa (sẽ đẻ ra mật khẩu = một quyết định, đâm vào NT-1). Chỉ cần **ghi
nhận trung thực**: thêm một gạch vào §5.5 hoặc §8 — *"File sao lưu là văn bản thuần không mã hóa.
Người dùng chịu trách nhiệm cất giữ và xóa các bản cũ. Sản phẩm không quản lý vòng đời file đã
xuất."* Và cân nhắc để FR-17 nhắc luôn: *"lần sao lưu gần nhất: 8 ngày trước — nhớ xóa các bản cũ."*

---

### L-3 · JTBD đặt cược vào bàn phím, F4 không có yêu cầu bàn phím nào
**Mức: LOW** · **Vị trí: §2.1, FR-4, FR-12, FR-13, FR-14**

**Điều gì hỏng.** §2.1 và addendum §2.5 xây cả cử chỉ `Ctrl+Enter` quanh lập luận *"mỗi lần tay rời
bàn phím là một lần mất nhịp"*. Nhưng F4 (tra cứu) — hành trình UJ-2, dùng khi *"có người đang đứng
chờ"* (NFR-2) — không có một yêu cầu phím tắt nào: không phím nhảy vào ô tìm, không phím xóa hết
điều kiện, không phím thoát về hôm nay. Nguyên tắc bàn phím chỉ được áp dụng cho nửa sản phẩm.

**Đề xuất sửa.** Thêm vào FR-12/FR-14: *"Có phím tắt đưa con trỏ vào ô tìm kiếm, và `Esc` từ ô tìm
kiếm xóa hết điều kiện, đưa về khung nhìn mặc định (thỏa 'đường về trong một thao tác')."* Cái này
cũng đóng luôn L-1.

---

## 4. Tự lừa dối

### H-6 · FR-17 mất trí nhớ đúng lúc rủi ro cao nhất, và NOTE FOR PM đang đóng vai giấy miễn tội
**Mức: HIGH** · **Vị trí: FR-17, A-9, FR-15, FR-16, UJ-3**

**Điều gì hỏng — ba tầng, tầng sau nặng hơn tầng trước:**

**Tầng 1 — trạng thái nhắc không nằm trong file sao lưu.** FR-17 nói *"app ghi nhớ thời điểm xuất
gần nhất"*. FR-15 nói file chứa **ba** thứ: nội dung, thời điểm tạo, định danh. Không có thời điểm
xuất. Nên sau khi IT cài lại máy và Nam nạp file (UJ-3), app ở trạng thái **"chưa từng sao lưu bao
giờ"**. PRD không nói app làm gì trong trạng thái đó: đếm từ lúc nào? Nếu không có mốc thì
`bây giờ - null` không so được với 7 ngày, và cách hiện thực tự nhiên nhất là **không hiện gì**.
Kết quả: người dùng vừa trải qua một lần mất máy, vừa khôi phục xong 500 ghi chú, và cái nhắc sao
lưu **im lặng vĩnh viễn** kể từ đó. UJ-3 kết thúc bằng một cảm giác an toàn sai.

**Tầng 2 — đồng hồ.** A-9 đếm ngày kể từ lần xuất. Nếu đồng hồ máy bị lùi (H-4), khoảng cách thành
số âm và ngưỡng 7 ngày không bao giờ chạm. Lại im lặng.

**Tầng 3 — NOTE FOR PM.** Đoạn ghi chú ở cuối FR-17 rất trung thực và mô tả đúng kịch bản hỏng
(*"sao lưu một lần vào tháng đầu, bốn tháng sau IT cài lại máy, mất trắng ba tháng"*). Nhưng **thừa
nhận một rủi ro không phải là giảm thiểu nó**. Chuỗi lập luận hiện tại của tài liệu là: "mất dữ liệu
là rủi ro số một" → "F5 là lối thoát duy nhất" → "F5 chỉ hoạt động khi người dùng nhớ bấm" → "chúng
tôi biết điều đó là điểm yếu nhất" → **hết**. Đoạn NOTE đang làm nhiệm vụ của một biện pháp bảo vệ
mà thực ra nó chỉ là một lời thú nhận. Đây là chỗ tự lừa dối rõ nhất trong tài liệu.

Đáng chú ý hơn: PRD đã chi tiêu đáng kể cho những rủi ro **nhỏ hơn** — hộp thoại xác nhận xóa (một
ghi chú), gộp-không-thay-thế khi nạp (một lần thao tác) — trong khi rủi ro *mất toàn bộ dữ liệu* chỉ
được cấp một **dòng chữ nhỏ, không chặn đường, chỉ hiện sau 7 ngày**. Ngân sách phòng thủ đang phân
bổ ngược với mức thiệt hại.

**Đề xuất sửa — theo thứ tự chi phí tăng dần, nên làm cả ba:**
1. **Đưa `thời điểm xuất gần nhất` vào file sao lưu** (FR-15) và khôi phục nó khi nạp (FR-16). Chi
   phí gần bằng không, đóng tầng 1.
2. **Định nghĩa trạng thái "chưa từng sao lưu"**: nếu chưa có mốc nào và trong máy đã có ≥ N ghi chú
   (đề xuất N=20), luôn hiện dòng nhắc. Đóng cả tầng 1 lẫn trường hợp người dùng mới.
3. **Nâng cấp cường độ nhắc theo thời gian thay vì một ngưỡng cứng**: 7 ngày → dòng nhỏ; 21 ngày →
   dòng nhỏ nhưng nổi bật; 45 ngày → một lần hỏi chặn đường duy nhất trong phiên đó. Đây vẫn **không
   phải** "nhắc chủ động" theo nghĩa §9.2 (không có lịch, không thông báo hệ thống), nên không phá
   §8, và nó tương xứng với mức thiệt hại thay vì tương xứng với mong muốn giữ màn hình sạch.
Nếu từ chối cả ba, thì phải sửa §5.3 và §5.5: không được tuyên bố "mất dữ liệu là rủi ro số một" nữa,
vì tài liệu đang không hành xử như thể tin điều đó.

---

### M-4 · SM-4 là thước đo không thể fail vì lý do mà nó tuyên bố đang đo
**Mức: MEDIUM** · **Vị trí: SM-4, FR-6, FR-8, NT-3**

**Điều gì hỏng.** SM-4: *"Với ít nhất 300 ghi chú trong máy, khung nhìn mặc định vẫn không dài quá
một màn hình."* Theo FR-6, khung nhìn mặc định **chỉ chứa ghi chú hôm nay**, nên chiều dài của nó
**hoàn toàn độc lập** với con số 300. Thước đo này đúng theo định nghĩa — nó là một phép lặp lại của
FR-6 chứ không phải một phép thử. Nó **không thể** phát hiện thất bại, nên nó cho cảm giác đã kiểm
chứng NT-3 mà thực ra chưa kiểm chứng gì.

Cái nó **lẽ ra phải đo** thì lại có thể fail thật: một ngày bận. Với FR-8 (mỗi ghi chú trần 3 dòng +
dòng thời gian), một màn hình chứa khoảng 10–14 ghi chú. Một ngày họp nhiều, Nam ghi 25 ghi chú →
khung nhìn mặc định dài gấp đôi màn hình → "mở lên thấy rối mắt", đúng thứ đã giết Notepad++. Và
NT-3 **cấm mọi cách khắc phục**: không gom nhóm, không thu gọn theo buổi, không duyệt xem. SM-C2 lại
trừng phạt cách duy nhất còn lại (xóa bớt).

**Đề xuất sửa.** Viết lại SM-4 thành thước đo có thể fail: *"Trong ngày bận nhất của tháng đầu tiên,
khung nhìn mặc định dài không quá 2 màn hình, và tìm lại một ghi chú của chính hôm đó không cần cuộn
quá một lần."* Và ghi nhận trong §11 rằng nếu ngưỡng này vỡ thì đó là dấu hiệu cần xem lại FR-8
(chiều cao trần), **không phải** cần thêm chế độ duyệt xem.

---

### M-7 · NFR-3 hứa dữ liệu sống qua "cập nhật phiên bản app" nhưng không có yêu cầu phiên bản cho kho lưu trữ
**Mức: MEDIUM** · **Vị trí: NFR-3, FR-15, addendum ràng buộc 5**

**Điều gì hỏng.** Tài liệu rất cẩn thận với phiên bản **file sao lưu** (FR-15 + A-7 + ràng buộc 5 gửi
cho Architecture) nhưng **hoàn toàn im lặng** về phiên bản của dữ liệu nằm trong trình duyệt — mà
đó mới là nơi 100% dữ liệu sống, còn file sao lưu chỉ được đụng tới vài lần một năm. NFR-3 hứa dữ
liệu tồn tại qua *"cập nhật phiên bản app"*, và với một sản phẩm web thì cập nhật xảy ra âm thầm mỗi
lần deploy.

**Kịch bản thất bại cụ thể.** Tháng thứ ba, tác giả đổi cách lưu (thêm trường chuẩn hóa tiếng Việt
sẵn — chính là điều mà addendum ràng buộc 1 gợi ý sẽ cần). Deploy. Lần mở tiếp theo, dữ liệu cũ
không có trường đó. Nếu code đọc thiếu phòng vệ: app crash trắng màn hình, hoặc tệ hơn — khởi tạo
lại kho rỗng và **ghi đè** lên 400 ghi chú cũ ở lần tự lưu đầu tiên (FR-3, ≤ 1 giây). Mất toàn bộ,
im lặng, do chính tác giả gây ra bằng một lần deploy.

**Đề xuất sửa.** Thêm ràng buộc thứ 8 vào bảng của addendum: *"Kho lưu trữ cục bộ phải mang số phiên
bản schema và có đường di trú (migration) rõ ràng. App gặp phiên bản schema **cao hơn** phiên bản nó
biết thì phải từ chối ghi và báo lỗi, tuyệt đối không khởi tạo lại kho."* Câu cuối cũng bảo vệ luôn
kịch bản hai tab chạy hai phiên bản app khác nhau (một tab mở từ trước khi deploy).

---

### L-4 · SM-C2 trừng phạt cả việc xóa chính đáng
**Mức: LOW** · **Vị trí: SM-C2, addendum §3**

**Điều gì hỏng.** SM-C2 coi "số ghi chú bị xóa" là phản thước đo cần giữ thấp. Nhưng addendum §3 nói
Xóa được đưa vào danh sách trắng một phần vì **nội dung nhạy cảm trên máy công ty** — một lý do hoàn
toàn chính đáng và không liên quan gì tới "dọn cho gọn". Thước đo hiện tại không phân biệt hai loại,
nên nó sẽ báo động sai, và người dùng (chính là người đo) sẽ học cách phớt lờ nó.

**Đề xuất sửa.** Diễn đạt lại theo *ý định* chứ không theo số đếm: *"SM-C2 · Số lần xóa ghi chú **với
lý do 'cho màn hình gọn lại'**. Mục tiêu 0. Xóa vì nội dung nhạy cảm hoặc vì gõ nhầm không tính."*
Với một người dùng duy nhất tự đo, đây là thước đo khả thi.

---

### L-2 · Ngưỡng 7 ngày của FR-17 tính bằng đồng hồ máy, không có phòng vệ
**Mức: LOW** · **Vị trí: FR-17, A-9** — chi tiết đã nêu trong H-6 tầng 2. Sửa cùng H-4 (đơn điệu) và
H-6 (lưu mốc vào file).

---

## 5. Thứ sẽ làm đội phát triển bế tắc

Đây là danh sách những câu mà một người ngồi xuống viết code sẽ **phải dừng lại hỏi**, vì PRD không
trả lời. Mỗi câu tương ứng với một phát hiện ở trên; gom lại đây để dùng làm checklist khi sửa PRD.

| # | Câu hỏi sẽ chặn người viết code | Liên quan |
|---|---|---|
| 1 | Ô soạn thảo và ô sửa ghi chú là **cùng một widget** hay hai thứ khác nhau? Ghi chú chưa `Ctrl+Enter` sống ở đâu? | C-2 |
| 2 | Ô soạn thảo có hiển thị khi bộ lọc đang bật không? Ghi chú tạo lúc đó hiện ở đâu? | C-1 |
| 3 | Khi ngày đổi lúc tab đang mở, màn hình phải làm gì? Khi tab được đưa lại tiêu điểm sau một đêm? | H-5 |
| 4 | Ghi chú đang được sửa có bị cắt 3 dòng không? Cắt đầu hay cắt cuối? | C-6 |
| 5 | Ghi sang lưu trữ theo **từng ghi chú** hay ghi đè cả khối trạng thái? (Quyết định này quyết định hai tab sống hay chết) | C-3 |
| 6 | Lệnh ghi thất bại thì người dùng thấy gì? | C-4 |
| 7 | Định danh sinh ra thế nào — đếm tăng dần hay duy nhất toàn cục? | H-2 |
| 8 | Nạp file gặp định danh trùng nhưng nội dung khác thì làm gì? Nạp xong báo gì? | H-3 |
| 9 | Hai ghi chú cùng mốc thời gian thì cái nào lên trước? | M-9 |
| 10 | Xóa hết chữ trong ghi chú rồi gõ lại: cùng một ghi chú hay ghi chú mới? Mốc thời gian nào? | M-2 |
| 11 | "Chữ vừa gõ vẫn còn sau khi đóng tab đột ngột" — cửa sổ mất dữ liệu chấp nhận được là bao nhiêu? | M-1 |
| 12 | Một ghi chú dài tối đa bao nhiêu? Dán 50.000 ký tự thì sao? | M-10 |
| 13 | Khi chưa từng sao lưu lần nào, dòng nhắc FR-17 hiện hay không? | H-6 |
| 14 | Kho lưu trữ có phiên bản schema không? Gặp dữ liệu phiên bản lạ thì làm gì? | M-7 |
| 15 | Từ khóa 1 ký tự có được coi là điều kiện không? Kết quả có bị giới hạn số lượng không? | H-7 |
| 16 | "Đường về trong một thao tác" khi đang có **hai** điều kiện — có một điều khiển "xóa hết" riêng không? | L-1 |
| 17 | Hộp thoại xác nhận xóa hiển thị nội dung ghi chú không? Phím `Enter` trong hộp thoại là Hủy hay Xóa? | H-9 |

Mười bảy câu, và mười bốn trong số đó **không thể trả lời bằng UX hay Architecture** — chúng là
quyết định sản phẩm.

### L-1 · "Đường về trong một thao tác" chưa được cụ thể hóa thành một điều khiển
**Mức: LOW** · **Vị trí: FR-14, UJ-2**

FR-14 yêu cầu cả *"xóa hết điều kiện thì quay về khung nhìn mặc định"* lẫn *"luôn có đường về trong
**một** thao tác"*. Khi có hai điều kiện cùng bật (đúng tình huống UJ-2), hai câu này chỉ cùng đúng
nếu tồn tại **một điều khiển riêng** xóa cả hai cùng lúc. PRD không nói có. Người hiện thực rất dễ
làm hai nút "x" riêng cho hai điều kiện và tin rằng đã thỏa FR-14.

**Đề xuất sửa.** Nói thẳng: *"Có một điều khiển duy nhất xóa **mọi** điều kiện đang áp dụng và đưa
về khung nhìn mặc định; nó khả dụng bất cứ khi nào có ít nhất một điều kiện."* Gộp với phím `Esc` ở
L-3.

---

## 6. Bảng tổng hợp

| ID | Mức | Vị trí | Tóm tắt |
|---|---|---|---|
| C-1 | critical | FR-1, FR-6, FR-14 | Gõ ghi chú mới khi bộ lọc đang bật: chữ biến mất trước mắt |
| C-2 | critical | Glossary, FR-1/3/4/5/10 | Vòng đời ô soạn thảo không được định nghĩa; chữ hôm nay chui vào ghi chú hôm qua |
| C-3 | critical | §11 OQ-5, NFR-3 | Hai tab ghi đè nhau — mất dữ liệu, đang bị xếp nhầm là "câu hỏi mở" |
| C-4 | critical | §11 OQ-3, FR-3 | Hết dung lượng → lưu thất bại im lặng, không FR nào bắt báo lỗi |
| C-5 | critical | §2.1, FR-6, FR-9, §8 | Hứa "danh sách việc" nhưng việc chưa xong biến mất mỗi sáng, mọi lối thoát bị non-goal chặn |
| C-6 | critical | FR-8, §2.1 | Cắt 3 dòng áp lên cả ghi chú đang gõ → không gõ nổi biên bản họp |
| H-1 | high | FR-11 vs FR-16 | "Xóa vĩnh viễn" sai: nạp file cũ hồi sinh ghi chú đã xóa, kể cả nội dung nhạy cảm |
| H-2 | high | Glossary, FR-16 | Định danh không duy nhất toàn cục → nạp lại bỏ rơi ghi chú im lặng |
| H-3 | high | FR-16 | Nạp không báo cáo kết quả và không cứu được ghi chú bị hỏng nội dung |
| H-4 | high | NT-4, FR-2, FR-7 | Đồng hồ lùi → ghi chú mới không nằm trên cùng, hoặc rơi sang hôm qua |
| H-5 | high | §11 OQ-1, FR-6 | Biên nửa đêm bị bác bỏ bằng lập luận sai (tab mở qua đêm ≠ làm việc qua đêm) |
| H-6 | high | FR-17, FR-15/16 | Nhắc sao lưu mất trí nhớ sau khi khôi phục; NOTE FOR PM đóng vai giấy miễn tội |
| H-7 | high | FR-12, NT-3, NFR-2 | Từ khóa một ký tự = chế độ duyệt xem trá hình; không giới hạn kết quả |
| H-8 | high | §11 OQ-2, NFR-7 | Chính sách IT là điều kiện tiên quyết sinh-tử, không phải câu hỏi mở |
| H-9 | high | FR-11 | Hộp thoại xác nhận không cho biết đang xóa ghi chú nào |
| M-1 | medium | FR-3 | Hai gạch đầu dòng mâu thuẫn về cửa sổ mất dữ liệu |
| M-2 | medium | FR-2, FR-5 | Xóa hết chữ rồi gõ lại: mốc thời gian nào? ghi chú rỗng có được lưu không? |
| M-3 | medium | §0 | Tuyên bố đã trả lời 3 câu hỏi của brief; câu độ dài chưa trả lời, con trỏ trỏ sai mục |
| M-4 | medium | SM-4 | Thước đo không thể fail vì lý do nó nói đang đo; ngày bận mới là ca thật |
| M-5 | medium | NT-2 | "Danh sách trắng đếm được" đã thủng ba lần ngay trong PRD |
| M-6 | medium | FR-9 vs FR-17 | Hai FR mô tả cùng một màn hình rỗng theo hai cách trái nhau |
| M-7 | medium | NFR-3 | Không có phiên bản/di trú cho kho lưu trữ cục bộ (chỉ có cho file sao lưu) |
| M-8 | medium | NFR-5 vs FR-15 | Bảo mật nghiêm ngặt vs bản sao văn bản thuần chất đống trong Downloads |
| M-9 | medium | FR-7 | Không có quy tắc phá hòa khi trùng mốc thời gian |
| M-10 | medium | §5.1, FR-8 | Không có chính sách độ dài ghi chú; dán 50.000 ký tự phá 4 yêu cầu cùng lúc |
| L-1 | low | FR-14 | "Một thao tác" cần một điều khiển "xóa hết điều kiện" chưa được nói ra |
| L-2 | low | FR-17 | Ngưỡng 7 ngày không phòng vệ đồng hồ lùi |
| L-3 | low | §2.1, F4 | Nguyên tắc bàn phím chỉ áp cho F1, không áp cho F4 |
| L-4 | low | SM-C2 | Phản thước đo trừng phạt cả việc xóa chính đáng |
| L-5 | low | FR-11 | Xóa kết quả cuối cùng trong bộ lọc: màn hình nói gì? |

---

## 7. Những chỗ đã soi và thấy vững

Để bảng trên có ý nghĩa, đây là những chỗ **đã bị tấn công và đứng được** — không phải chỗ chưa
đọc:

- **Bảng mô hình trạng thái ở FR-14.** Đã thử tìm ca mơ hồ (đặt điều kiện theo thứ tự ngược, xóa
  từng phần điều kiện, giao rỗng) — bảng trả lời được hết. Việc phân biệt *trạng thái mặc định* với
  *điều kiện do người dùng đặt* là quyết định thiết kế sắc nhất trong tài liệu, và addendum §2.7 giải
  thích đúng vì sao nó cần thiết. Vấn đề duy nhất còn lại là C-1 (gõ mới trong khung nhìn có điều
  kiện) — một ô mà bảng không có, chứ không phải một ô bị điền sai.
- **Quyết định gộp-không-thay-thế ở FR-16.** Lập luận ở addendum §2.9 đúng và mạnh: nút "thay thế
  toàn bộ" sẽ là nút phá dữ liệu lớn nhất trong app, và §2.3 đã chứng minh cảnh báo không cứu được.
  H-1/H-2/H-3 là những lỗ **trong cách hiện thực quyết định đó**, không phải phản đối chính quyết
  định.
- **Nâng chuẩn hóa tiếng Việt lên thành NFR-6 + ràng buộc Architecture số 1.** Đây là chỗ tài liệu
  làm đúng việc mà PRD phải làm: nhận ra một yêu cầu chức năng trông như chuyện giao diện thực chất
  là ràng buộc tầng dữ liệu, rồi gửi thẳng cho Architecture kèm lý do. Không tìm được lỗi.
- **§8 Non-Goals.** Đủ cụ thể để thật sự chặn được phạm vi trôi (liệt kê đích danh: ghim, màu, sao,
  nhãn, thư mục, độ ưu tiên, trạng thái xong/chưa). Đây là mục làm việc nặng nhất trong tài liệu.
  Nghịch lý là chính sức mạnh của nó tạo ra C-5 — nó chặn cả những lối thoát mà sản phẩm sẽ cần.
- **Addendum §2 (các phương án đã bị loại).** Đã cố tìm quyết định nào được ghi là "đã cân nhắc" mà
  thực ra chỉ là hợp lý hóa sau khi chọn — không tìm ra. Mỗi mục đều nêu cái giá phải trả và điều
  kiện để quay lại xem xét. §2.1, §2.2 và §2.8 đặc biệt tốt.
- **Cấu trúc mã FR ổn định + Assumptions Index §12.** Làm đúng việc: mọi `[ASSUMPTION]` trong thân
  tài liệu đều có mặt trong bảng, không thừa không thiếu (đã đối chiếu từng dòng: A-1..A-10 khớp
  chính xác với 10 nhãn trong thân bài).
- **NOTE FOR PM ở FR-11 và FR-17.** Về mặt *chẩn đoán* là chính xác và trung thực hiếm thấy. Phê bình
  ở H-6 không phải về nội dung của chúng mà về việc tài liệu coi việc viết ra chúng là đã xử lý xong.

---

## 8. Thứ tự nên sửa

Không phải sửa cả 30. Thứ tự đề nghị, theo tỉ lệ *thiệt hại tránh được / công sức bỏ ra*:

1. **C-2** (vòng đời ô soạn thảo) — mở khóa cho C-1, C-6, M-2 và 4 câu hỏi trong §5. Sửa cái này
   trước, nhiều cái khác tự sáng ra.
2. **C-4 + C-3** (lưu thất bại, hai tab) — hai kịch bản mất dữ liệu duy nhất mà người dùng **không
   thể phát hiện**. Với sản phẩm tự tuyên bố mất dữ liệu là rủi ro số một thì đây là ưu tiên đạo đức,
   không chỉ kỹ thuật.
3. **H-8** (xác nhận chính sách IT) — 10 phút, và nó có thể hủy hoặc thay đổi lớn F5.
4. **C-5** (danh sách việc vs nhật ký) — quyết định định vị sản phẩm; càng để lâu càng đắt vì nó ăn
   vào §1, §2, F2 và §8 cùng lúc.
5. **H-1, H-2, H-3, H-6** (bộ tứ sao lưu/khôi phục) — sửa cùng nhau trong một lượt vì chúng đan vào
   nhau; tổng chi phí thấp, đóng gần hết bề mặt mất dữ liệu còn lại.
6. **C-6, H-4, H-5, H-7, H-9** — mỗi cái là một câu hoặc một đoạn thêm vào FR có sẵn.
7. Phần medium/low — gom lại thành một lượt rà câu chữ.

Sau đó chạy lại review này trên bản đã sửa, tập trung vào một câu hỏi duy nhất chưa được trả lời ở
đâu cả: **"cái gì xảy ra khi hai thứ diễn ra cùng lúc?"** Đó là trục mà bản PRD hiện tại chưa hề đi
qua.
