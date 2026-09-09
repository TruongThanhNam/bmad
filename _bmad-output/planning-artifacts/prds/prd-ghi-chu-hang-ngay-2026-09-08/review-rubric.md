---
title: "Thẩm định chất lượng PRD: Ghi chú hàng ngày"
status: review
created: 2026-09-09
parent: prd.md
---

# PRD Quality Review — Ghi chú hàng ngày

*Rubric: `.claude/skills/bmad-prd/assets/prd-validation-checklist.md`. Phạm vi thẩm định: `prd.md` + `addendum.md`.
Hiệu chỉnh mức nghiêm khắc: dự án cá nhân một người, stakes hobby/solo → **rigor nhẹ, nhưng tiêu chuẩn substance giữ nguyên**.
PRD là **chain-top** (nuôi `bmad-ux` → `bmad-architecture` → `bmad-create-epics-and-stories`) → chiều 6 được cân nặng hơn bình thường.*

## Overall verdict

Đây là một PRD **tốt hơn hẳn mức mà stakes yêu cầu**: nó có một luận đề thật (sản phẩm đặt cược vào việc *từ chối*),
bốn nguyên tắc §3 được dùng như tiêu chí loại trừ chứ không phải khẩu hiệu, và `addendum.md` §2 ghi lại chín lựa chọn
bị loại kèm cái giá phải trả — thứ mà phần lớn PRD ở quy mô này không bao giờ có. Phần lớn FR mang hệ quả kiểm chứng
được thật sự, kể cả hệ quả *phủ định* ("không có nút Lưu", "không hiện thông báo trạng thái rỗng"), và §10 có phản
thước đo (SM-C1, SM-C2) — dấu hiệu tác giả đã nghĩ tới cách chính mình có thể gian lận với chính mình.

Cái đang rủi ro nằm gọn ở hai chỗ. Thứ nhất, **§11 Open Question 5 (hai tab cùng lúc) đang bị để "chưa xét" trong khi
NFR-3 hứa "ghi chú không tự mất đi" và UJ-1 mô tả đúng thói quen sinh ra vấn đề đó** — một lời hứa cứng đang tựa lên
một câu hỏi mở. Thứ hai, **mô hình nội dung của "ghi chú" (văn bản thuần, nhiều dòng, không giới hạn độ dài) không tồn
tại dưới dạng FR nào** — nó chỉ nằm trong Glossary §4, trong khi §0 lại tuyên bố câu hỏi "độ dài một ghi chú" đã được
trả lời ở §5.1. Với một PRD chain-top mà downstream sẽ *bóc FR ra thành story*, hai chỗ này là chỗ dễ rơi nhất.

Không có finding nào ở mức critical. PRD này đủ điều kiện đi tiếp sang `bmad-ux`; ba finding mức high nên xử lý ngay
trong PRD (không đẩy sang UX hay architecture) vì cả ba đều là câu hỏi *cái gì phải đúng*, không phải *làm thế nào*.

---

## 1. Decision-readiness — **strong**

PRD này qua được phép thử khó nhất của chiều này: **người phản đối sẽ tìm thấy phản đối của mình đã được ghi sẵn, kèm
lý do bác**. Không phải một lần mà chín lần, ở `addendum.md` §2.1–2.9, và mỗi lần đều nói *cái gì bị bỏ đi*, không chỉ
*cái gì được chọn*. §2.1 loại append-only nhưng ghi thẳng "**Hệ quả phải chấp nhận:** sản phẩm không chứng minh được
nội dung một ghi chú có bị sửa sau ngày tạo hay không". §2.9 loại "thay thế toàn bộ" và nói rõ "**Cái mất:** không có
cách khôi phục về đúng trạng thái trong file". §2.4 còn ghi cả **điều kiện làm cho lựa chọn đã chốt trở thành sai**:
"Nếu thói quen đó tồn tại, phương án đã chọn sẽ tính phí người dùng mỗi ngày và có lẽ sai." Đó là mức trung thực hiếm
gặp — nó cho người đọc sáu tháng sau một cách để *phát hiện* mình đã chọn nhầm.

Hai `[NOTE FOR PM]` đều đặt đúng chỗ căng, không phải chỗ an toàn. Ở FR-11: "sau vài tuần người dùng sẽ bấm 'Xóa' theo
phản xạ, và lúc đó bước xác nhận không còn bảo vệ được gì" — tự công kích quyết định vừa chốt xong ở đúng dòng dưới
nó. Ở FR-17: "**đây là chỗ mỏng nhất của sản phẩm**", kèm kịch bản hỏng cụ thể có thời gian và hậu quả ("bốn tháng sau
IT cài lại máy, mất trắng ba tháng gần nhất"). Cả hai note đều kèm **đường thoát đã định trước** và một chỉ dẫn phủ
định ("KHÔNG phải bỏ phanh", "không phải bỏ nhắc") — tức là chúng ràng buộc được quyết định tương lai, không chỉ ghi
nhận lo lắng.

Red flag của rubric ("mọi lựa chọn đều 'cân bằng' mọi thứ") không xuất hiện. Ngược lại: §5.4 nói thẳng F4 "**không được
xếp sau và không được cắt bớt khi hết thời gian**" — một thứ tự ưu tiên có thể làm người khác khó chịu, tức là một
quyết định thật.

### Findings

- **low** OQ-1 không phải câu hỏi mở (§11 mục 1) — "Biên nửa đêm" được nêu rồi trả lời ngay trong cùng đoạn: "Người
  dùng xác nhận không bao giờ làm việc qua nửa đêm, nên **không giải quyết**". Đây đúng là dạng mà rubric gọi là
  *rhetorical question with an answer in the next sentence*. Nội dung thì hoàn toàn ổn — vấn đề là nó làm loãng danh
  sách Open Questions, khiến bốn mục còn lại (trong đó có mục 5 thực sự nguy hiểm) trông nhẹ đi cùng một mức.
  *Fix:* chuyển thành `[ASSUMPTION]` gắn ở FR-6 cạnh A-1 (hai thứ này là cùng một giả định về mốc ngày), hoặc mở một
  mục "Quyết định đã chốt kèm điều kiện xem lại"; giữ §11 chỉ cho những gì thật sự chưa có câu trả lời.

---

## 2. Substance over theater — **strong**

Không có persona theater: chỉ một nhân vật, **Nam**, và người đó là chính tác giả — §6 nói thẳng "Nhân vật là chính tác
giả; gọi là Nam". Đúng hình dạng cho sản phẩm một người dùng; không có ba persona phụ được dựng lên để tài liệu trông
dày.

Vision §1 **không thể hoán đổi sang PRD khác cùng loại** — phép thử của rubric. Nó không dừng ở "ghi chú nhanh, đơn
giản" mà nêu một cơ chế nhân quả cụ thể: "Mọi công cụ hiện có đều chèn một quyết định vào giữa khoảng đó — ghi vào tab
nào, vào thư mục nào, đây là việc hay là ghi chú — và chính quyết định nhỏ đó là lý do ghi chú không được ghi." Rồi ở
đoạn ngay sau, nó **tự nhận về nhược điểm do chính lựa chọn đó sinh ra** ("sau vài tháng sẽ có hàng trăm ghi chú") và
trả lời bằng NT-3. Một Vision statement tự công kích mình là Vision đã được nghĩ, không phải Vision được viết.

NFR §7 không có boilerplate. Mọi mục đều mang ngưỡng gắn với sản phẩm này: NFR-1 "≤ 2 giây, kể cả khi trong máy đã có
2.000 ghi chú"; NFR-2 "≤ 200 ms" kèm **lý do vì sao ngưỡng đó**: "nó thường được dùng khi có người đang đứng chờ".
NFR-5 liệt kê phủ định cụ thể ("không analytics, không telemetry") thay vì "hệ thống phải bảo mật". Không có mục nào
kiểu "phải mở rộng được / phải tin cậy".

Đáng ghi nhận riêng: đoạn cảnh báo ở §2.1 ("**Một điều tài liệu này cố ý không hứa**") và Non-Goal cuối §8 ("tài liệu
này không được mô tả nó bằng chữ 'bằng chứng'") — PRD tự cấm chính mình dùng một từ dễ bán hàng. Đó là chống-theater
được viết thành quy tắc.

### Findings

- **low** NFR-6 là chỉ thị cho architecture, không phải một NFR có biên (§7 NFR-6) — nội dung của nó là "`bmad-architecture`
  phải biết từ đầu chứ không xử lý ở lớp giao diện", tức là một câu về *quy trình*, không phải một thuộc tính hệ thống
  đo được. Ràng buộc thật đã nằm ở FR-12 (khớp `phan quyen` ↔ `Phân quyền`) và NFR-2 (≤ 200 ms) rồi; và nó cũng đã có
  bản đầy đủ ở `addendum.md` §1 ràng buộc 1. Không sai, chỉ là mục duy nhất trong §7 không mang hình dạng của các mục
  còn lại. *Fix:* để nguyên nội dung nhưng phát biểu lại thành ngưỡng ("chuẩn hóa bỏ dấu phải đạt NFR-2 trên 2.000 ghi
  chú"), và dời câu chỉ thị quy trình xuống addendum §1 nơi nó đã có sẵn.

---

## 3. Strategic coherence — **strong**

PRD có luận đề, và luận đề được phát biểu ra thành chữ: §3 "sản phẩm này đặt cược vào việc *từ chối*, và một lời từ
chối không viết thành văn thì không sống nổi qua tuần thứ ba". Bốn NT không phải giá trị mà là **cổng loại**, và tài
liệu chứng minh chúng có răng bằng cách cho một tính năng đi qua rồi bị chặn: NT-2 giải thích "Nút ghim không chen vào
lúc gõ, nên NT-1 cho nó đi qua — và đó chính là cách tính năng lọt vào những sản phẩm có nguyên tắc nghe rất hay."
`addendum.md` §3 kể lại đúng đường suy luận đã dẫn tới việc phải có **hai** cửa. Đây là thứ phân biệt một bộ nguyên tắc
đã được kiểm nghiệm với một danh sách khẩu hiệu.

Ưu tiên tính năng đi theo luận đề chứ không theo độ dễ. §5.4 khóa F4 khỏi việc bị cắt, với lý do đúng bản chất: "nếu F4
chậm hoặc khó dùng, sản phẩm không phải là 'kém tiện' — nó **mất truy cập** vào gần như toàn bộ dữ liệu của chính nó."
F5 được mở rộng phạm vi *thêm* so với brief (FR-16 nạp lại), và §9.1 ghi rõ đó là mở rộng có ý thức — de-scoping và
up-scoping đều được tuyên bố, không làm lén.

Loại phạm vi MVP nhất quán: đây là MVP kiểu **problem-solving** (một vấn đề, một luồng, năm nhóm tính năng đều phục vụ
nó), và §9.2 đẩy ra ngoài đúng những thứ không phục vụ vấn đề đó. Success Metrics phần lớn nghiệm thu được luận đề chứ
không đo hoạt động: SM-1 (còn dùng sau một tháng, đã bỏ Notepad++) là thước đo giữ-chân thật; SM-3 (≤ 30 giây, không
cuộn tìm lần nào) đo đúng lời hứa của NT-3. Và phản thước đo **tồn tại và có răng**: SM-C1 "Số tính năng thêm vào sau
MVP. Mục tiêu là 0" đối trọng trực tiếp với SM-1, SM-C2 "Số ghi chú bị xóa" đối trọng với SM-4 và bắt được đúng kiểu
gian lận nguy hiểm nhất ("có thể đạt 'màn hình sạch' bằng cách xóa cho gọn").

Chỗ luận đề chưa được bảo vệ đủ: NT-3 hứa "không bao giờ bắt người dùng nhìn cả đống", nhưng toàn bộ cơ chế bảo vệ đều
nhắm vào **chiều dọc lịch sử** (ghi chú cũ), không có gì nhắm vào **một ngày dày**. Xem finding dưới.

### Findings

- **high** NT-3 không được bảo vệ trong ngày dày; khung nhìn mặc định không có biên (§3 NT-3, §5.2, FR-6) — FR-6 chỉ
  hứa "chiều dài khung nhìn mặc định vẫn chỉ phụ thuộc số ghi chú **của hôm nay**", và §5.2 chỉ hứa "Số ghi chú tăng
  theo năm tháng **không** làm khung nhìn mặc định dài thêm". Cả hai đều đúng và cả hai đều nói về trục thời gian dài.
  Nhưng UJ-1 mô tả đúng ngày sinh ra vấn đề ngược lại: `Ctrl+Enter` gõ liên tục trong họp, và cuối ngày "những gì hiện
  trên màn hình chính là danh sách việc Nam đã nhặt được trong ngày". Một ngày ba cuộc họp có thể sinh 30–50 ghi chú;
  với FR-8 cắt ở 3 dòng thì đó vẫn là nhiều màn hình cuộn. Lúc đó chính là lúc "mở công cụ lên là thấy rối mắt" (§2.1,
  Cảm xúc) quay lại — và F4 không cứu được, vì F4 được định nghĩa là "con đường duy nhất để nhìn thấy bất cứ thứ gì
  **cũ hơn**". Đây là lỗ hổng trong luận đề, không phải trong UI.
  *Fix:* thêm một hệ quả kiểm chứng được vào FR-6 đặt biên cho ngày dày — hoặc một ngưỡng ("với N ghi chú trong ngày,
  khung nhìn mặc định vẫn quét được trong một lần liếc"), hoặc một quyết định có ý thức rằng ngày dày *được phép* dài
  và lý do vì sao điều đó không vi phạm NT-3 (ví dụ: vì ghi chú trong ngày là thứ người dùng vừa tự tạo ra nên không
  gây tải nhận thức như đống lịch sử). Quyết định nào cũng được, nhưng phải là một quyết định.

- **medium** SM-4 đếm nhầm đại lượng, nên không nghiệm thu được thứ nó tuyên bố (§10 SM-4) — nguyên văn: "Với ít nhất
  300 ghi chú trong máy, khung nhìn mặc định vẫn không dài quá một màn hình. Đây là cách biến tiêu chí cảm tính 'mở lên
  không thấy rối mắt' thành thứ đếm được. Nghiệm thu FR-6, NT-3." Nhưng theo chính FR-6, chiều dài khung nhìn mặc định
  **không phụ thuộc tổng số ghi chú trong máy** — nó chỉ phụ thuộc số ghi chú của hôm nay. Nghĩa là SM-4 đạt một cách
  tầm thường: hôm nào có 1 ghi chú là đạt, kể cả khi trong máy có 300 hay 30.000. Thước đo đang guard con số duy nhất
  không liên quan. Ngoài ra 300 lệch với hai mốc còn lại trong tài liệu (FR-6 dùng 1.200, NFR-1/NFR-2 dùng 2.000) mà
  không có lý do nào được nêu.
  *Fix:* phát biểu lại theo số ghi chú **trong ngày**, ví dụ "trong ngày dày nhất của tháng, khung nhìn mặc định vẫn
  không quá X màn hình", và ghi lại số ghi chú của ngày đó — đó mới là dữ liệu nghiệm thu NT-3. Đồng thời thống nhất
  các mốc quy mô (300 / 1.200 / 2.000) hoặc nói rõ vì sao mỗi mốc khác nhau.

---

## 4. Done-ness clarity — **adequate**

*(Chiều được soi kỹ nhất theo yêu cầu, và theo rubric "be unforgiving here".)*

Quét toàn bộ 17 FR: **14/17 mang ít nhất một hệ quả kiểm chứng được thật sự**, và chất lượng hệ quả cao hơn mặt bằng
chung rõ rệt. Ba dấu hiệu tốt:

1. **Hệ quả phủ định được viết thành hệ quả kiểm chứng.** FR-1 "Không có nút 'Tạo mới' nào phải bấm trước khi gõ được";
   FR-3 "Không có nút 'Lưu' nào trong giao diện"; FR-9 "**Không** hiện thông báo kiểu 'Bạn chưa có ghi chú nào', không
   hình minh họa chào mừng"; FR-13 "Không có mốc nhanh kiểu 'hôm nay / 7 ngày qua / tháng này'". Đây là loại tiêu chí
   mà story writer test được ngay, và là loại dễ bị bỏ sót nhất.
2. **Ngưỡng số thay vì tính từ ở đúng những chỗ quan trọng.** FR-3 "Khoảng cách giữa lúc gõ và lúc chữ đã an toàn:
   **≤ 1 giây**" — không phải "lưu nhanh". FR-6 "Với 1.200 ghi chú trong máy…". NFR-1/NFR-2 tương tự.
3. **Ca kiểm thử cụ thể được nhúng vào FR.** FR-12 cho hẳn cặp dữ liệu: "gõ `phan quyen` khớp với ghi chú chứa `Phân
   quyền`, và ngược lại". FR-4 cho ba ca gồm cả ca biên ("`Ctrl+Enter` khi ghi chú hiện tại đang rỗng thì không tạo
   thêm ghi chú nào"). FR-11 cho ca thoát hiểm ("Đóng bước xác nhận bằng `Esc` hoặc click ra ngoài được hiểu là
   **hủy**"). FR-16 cho ca hỏng ("File hỏng, sai định dạng, hoặc sai phiên bản: … **không đụng một chữ nào** vào dữ
   liệu đang có"). Bảng "Mô hình trạng thái" ở FR-14 được đánh dấu "*bảng này là chuẩn để đối chiếu khi nghiệm thu*" —
   đó là acceptance criteria dưới dạng bảng chân trị, và nó xóa đúng chỗ mơ hồ nguy hiểm nhất (trạng thái vs điều kiện).

Vậy tại sao chỉ **adequate**, không phải strong? Vì ba thứ mà một engineer sẽ *phải dừng lại hỏi*, và cả ba đều không
phải chi tiết vặt:

- Một lời hứa cứng (NFR-3) đang tựa lên một câu hỏi mở chưa xét (OQ-5, hai tab).
- Một khái niệm trung tâm — nội dung của ghi chú — **không có FR nào định nghĩa**, chỉ có Glossary.
- Việc tạo ghi chú khi đang có điều kiện áp dụng không được nói tới ở bất kỳ đâu, dù đó là giao của FR-4 và FR-14.

Quét tính từ mơ hồ theo yêu cầu của rubric — kết quả khá sạch, chỉ lọt bốn chỗ, liệt kê đầy đủ ở findings: "định dạng
máy đọc được" (FR-15), "báo lỗi rõ ràng" (FR-16), "hai lựa chọn rõ ràng" (FR-11, chấp nhận được vì đã có cặp giá trị
"hủy hoặc xóa" ngay sau), "một dòng nhỏ" (FR-17, chấp nhận được vì ba hệ quả phủ định đi kèm đã ràng buộc đủ: không
chặn đường, không hộp thoại, không phải bấm để tắt). Những cụm mà rubric gọi tên đích danh — "xử lý X một cách duyên
dáng", "hiệu năng hợp lý", "thân thiện người dùng" — **không xuất hiện lần nào**. Các cụm cảm tính còn lại ("giữ được
nhịp đều", "liếc một cái là quét được cả dòng ghi chú") đều nằm trong phần *Mô tả* hoặc phần *Lý do*, không nằm trong
danh sách "Kiểm chứng được", nên chúng là văn giải thích chứ không phải tiêu chí — đúng chỗ.

### Findings

- **high** NFR-3 hứa dữ liệu không mất, nhưng ca làm nó mất đang nằm ở "Chưa xét" (§7 NFR-3, §11 mục 5, FR-3, UJ-1) —
  NFR-3 phát biểu tuyệt đối: "Ghi chú tồn tại qua đóng tab, khởi động lại máy, và cập nhật phiên bản app." OQ-5 hỏi
  "Điều gì xảy ra khi mở app ở hai tab cùng lúc?" và tự trả lời "**Chưa xét. Nhiều khả năng có thật**". Nó không chỉ có
  thật — nó là *thói quen được mô tả trong UJ-1*: "Tab app đã mở sẵn từ sáng". Ghép với FR-3 (tự lưu ≤ 1 giây, không có
  bước chốt), hai tab cùng ghi vào một kho local là kịch bản ghi đè kinh điển, và nó tấn công đúng **rủi ro số một mà
  §5.3 tự nhận là rủi ro số một**. Đây là loại quyết định *cái gì phải đúng*, nên không đẩy được sang architecture: kiến
  trúc sư cần biết luật sản phẩm là gì (tab thứ hai bị khóa chỉ-đọc? tự đồng bộ giữa các tab? tab mới thắng? cảnh báo?)
  trước khi chọn cách lưu.
  *Fix:* nâng OQ-5 thành một FR mới (FR-18) hoặc một hệ quả kiểm chứng được thêm vào NFR-3, phát biểu tối thiểu ở dạng
  bất biến: "Mở app ở hai tab không bao giờ làm mất hoặc ghi đè ghi chú đã có; luật khi hai tab cùng sửa một ghi chú
  là …". Nếu chưa muốn chốt luật, ít nhất phải gắn `[NOTE FOR PM]` ngay tại NFR-3 để lời hứa không đứng trần.

- **high** Không có FR nào định nghĩa nội dung của một ghi chú (§4 Glossary, §5.1, §9.1) — mô hình nội dung (văn bản
  thuần, **nhiều dòng**, không giới hạn độ dài, không rich text, một ghi chú không chứa ghi chú khác) hiện chỉ tồn tại
  ở Glossary §4 và ở một gạch đầu dòng của §9.1 ("Ghi chú văn bản tự do, nhiều dòng; ghi chú rỗng tự biến mất
  *(FR-5)*") — mà mã FR gắn ở đó là **FR-5**, vốn chỉ nói về ghi chú rỗng. Hệ quả cụ thể: `bmad-create-epics-and-stories`
  bóc FR ra thành story sẽ không tìm thấy FR nào để treo "không giới hạn độ dài" và "không giới hạn số dòng" — trong khi
  đây chính là câu hỏi mà §0 tuyên bố đã trả lời ("độ dài một ghi chú (§5.1)"), và §5.1 lại không nói gì về độ dài.
  Không có FR thì cũng không có ca kiểm thử cho ghi chú 5.000 ký tự — mà biên bản họp gõ tại chỗ (§2.1) đúng là loại
  nội dung dài.
  *Fix:* thêm FR mới trong §5.1 (ví dụ FR-0 hoặc FR-18 để giữ tính liên tục của mã) tên "Nội dung ghi chú là văn bản
  thuần, nhiều dòng, không giới hạn độ dài", với hệ quả kiểm chứng được: ghi chú N ký tự lưu và hiển thị đúng; xuống
  dòng được giữ nguyên qua lưu/nạp lại; dán văn bản có định dạng vào thì chỉ giữ phần văn bản thuần. Sau đó sửa §0 để
  trỏ đúng FR mới.

- **medium** Tạo ghi chú khi đang áp dụng điều kiện: không định nghĩa (FR-4, FR-14, §5.2) — FR-14 nói khung nhìn mặc
  định "bị thay thế ngay khi người dùng đặt điều kiện đầu tiên", và bảng mô hình trạng thái liệt kê dòng ghi chú chứa
  gì trong từng trạng thái. Nhưng **ô soạn thảo** thì sao? §5.2 chỉ đặt nó "phía trên" trong khung nhìn mặc định; không
  mục nào nói nó có mặt hay không khi đang lọc theo `03/09/2026`. Và nếu có mặt và người dùng gõ, ghi chú mới mang thời
  điểm tạo *hôm nay* sẽ không khớp điều kiện — nó biến mất khỏi màn hình ngay khi vừa được tạo, đúng kiểu hỏng mà FR-14
  đang cố phòng ("người dùng không bao giờ phải đoán tại sao màn hình đang thiếu thứ gì đó"). UJ-2 kết thúc bằng việc
  Nam xóa điều kiện, nên hành trình cũng không chạm tới ca này.
  *Fix:* thêm một dòng vào bảng mô hình trạng thái FR-14 hoặc một hệ quả vào FR-4: hoặc "gõ vào ô soạn thảo khi đang có
  điều kiện sẽ tự xóa hết điều kiện và quay về hôm nay", hoặc "ô soạn thảo không có mặt khi đang áp dụng điều kiện".
  Cả hai đều nhất quán với NT-1, nhưng chúng cho ra hai UI khác hẳn nhau — `bmad-ux` cần biết cái nào.

- **medium** Không có yêu cầu ở mức sản phẩm cho việc chạm giới hạn dung lượng trình duyệt (§7 NFR-3, §11 mục 3) — OQ-3
  thừa nhận đúng vấn đề ("NFR-3 nói sản phẩm không tự áp giới hạn, nhưng trình duyệt thì có") rồi giao trọn cho
  `bmad-architecture`. Nhưng "app phản ứng ra sao khi hết chỗ" là câu hỏi *sản phẩm*, không phải câu hỏi *kỹ thuật*: nếu
  không có luật, kiến trúc sẽ mặc định là ghi thất bại im lặng — tức là mất dữ liệu không báo, đúng thứ NFR-3 cấm và
  tệ hơn mọi kịch bản trong §5.5 vì người dùng không biết để mà sao lưu.
  *Fix:* thêm vào NFR-3 một hệ quả kiểm chứng được ở mức sản phẩm, độc lập cơ chế: "Khi không lưu được vì bất kỳ lý do
  gì, app phải báo cho người dùng ngay tại thao tác đó và không được im lặng bỏ qua chữ vừa gõ." Việc phát hiện ngưỡng
  thế nào thì để lại cho architecture.

- **medium** FR-15: "định dạng máy đọc được" là tính từ, và hai `[ASSUMPTION]` trần (§5.5 FR-15, §0) — hệ quả thứ ba của
  FR-15 viết "Định dạng máy đọc được, có mang số phiên bản định dạng … `[ASSUMPTION]`" và hệ quả thứ tư "Tên file chứa
  ngày xuất, để nhiều bản sao lưu không đè lên nhau. `[ASSUMPTION]`". Hai nhãn này **không mang nội dung tại chỗ** —
  người đọc phải nhảy xuống §12 mới biết cái gì đang được giả định (tám nhãn còn lại trong tài liệu đều tự mang nội
  dung, ví dụ `[ASSUMPTION: 3 dòng]`). Riêng "máy đọc được": nó loại được Markdown-chỉ-để-đọc (đúng ý §2.8 của addendum)
  nhưng không cho ra tiêu chí nghiệm thu nào — một file CSV thiếu trường cũng "máy đọc được". Điều này va vào tuyên bố ở
  §0 rằng câu hỏi mở "định dạng xuất dữ liệu" **đã được trả lời** ở §5.5; thực tế nó mới được thu hẹp, chưa được trả
  lời.
  *Fix:* phát biểu tiêu chí thay vì tính từ — "một file văn bản có cấu trúc, tự mô tả, nạp lại được bởi chính app mà
  không cần công cụ ngoài; mỗi ghi chú giữ đủ ba trường nội dung / thời điểm tạo / định danh; file mang trường phiên
  bản định dạng" (việc chọn JSON hay gì khác vẫn để cho architecture). Đồng thời viết nội dung vào trong hai nhãn
  `[ASSUMPTION: …]`, và hạ tông §0 từ "đã được trả lời" xuống "đã được thu hẹp tới mức đủ cho architecture chốt".

- **medium** FR-16: "báo lỗi rõ ràng" không có biên (§5.5 FR-16) — hệ quả cuối: "File hỏng, sai định dạng, hoặc sai
  phiên bản: báo lỗi rõ ràng và **không đụng một chữ nào** vào dữ liệu đang có." Nửa sau là hệ quả kiểm chứng được xuất
  sắc; nửa đầu là tính từ. "Rõ ràng" ở đây gánh việc thật: đây là lúc người dùng vừa mất máy, đang nạp lại, và đang sợ.
  Một thông báo "Import failed" qua được chữ "rõ ràng" nhưng không cho họ biết có phải mất dữ liệu không.
  *Fix:* buộc thông báo mang hai thông tin: (a) file không được nạp vì lý do gì, (b) **khẳng định rõ dữ liệu hiện có
  không bị đụng tới**. Vế (b) mới là thứ người dùng cần trong đúng khoảnh khắc đó.

- **low** FR-5: "rời khỏi một ghi chú rỗng" chưa được định nghĩa (§5.1 FR-5) — hệ quả đầu tiên dùng động từ "rời khỏi"
  mà không nói rời khỏi là gì: bấm ra chỗ khác, `Ctrl+Enter`, `Esc`, đóng tab, hay chuyển sang tab trình duyệt khác?
  FR-4 đã xử một ca ("`Ctrl+Enter` khi ghi chú hiện tại đang rỗng thì không tạo thêm ghi chú nào"), các ca còn lại thì
  không. Ca đáng lo nhất: đóng tab khi đang có ghi chú rỗng — FR-3 hứa "ghi chú đang gõ dở … xuất hiện lại nguyên
  trạng", FR-5 hứa ghi chú rỗng biến mất; hai câu này không mâu thuẫn nhưng cần một câu nói rõ ai thắng.
  *Fix:* liệt kê các cử chỉ được tính là "rời khỏi", hoặc phát biểu bất biến thay cho sự kiện: "không bao giờ tồn tại
  một ghi chú rỗng trong dòng ghi chú sau khi con trỏ không còn ở trong nó."

- **low** FR-8: không nói trạng thái mở rộng có loại trừ lẫn nhau không (§5.2 FR-8) — có A-3 ("trạng thái mở rộng không
  được nhớ giữa các phiên") nhưng không có câu nào cho ca trong cùng một phiên: mở rộng ghi chú thứ hai thì ghi chú thứ
  nhất có tự thu lại không? Nếu không, hệ quả "mọi ghi chú có cùng chiều cao trần — để liếc một cái là quét được cả
  dòng ghi chú" bị vô hiệu dần trong lúc dùng.
  *Fix:* thêm một hệ quả: "tối đa một ghi chú ở trạng thái mở rộng tại một thời điểm" (hoặc quyết định ngược lại, kèm
  lý do). Ảnh hưởng nhỏ nhưng `bmad-ux` sẽ phải tự đoán nếu thiếu.

---

## 5. Scope honesty — **strong**

Đây là chiều mạnh nhất của tài liệu. §8 Non-Goals làm việc thật: mười một gạch đầu dòng, mỗi cái là một *cửa đã bị đóng
kèm lý do*, không phải danh sách "chưa làm". Ba mục làm việc nặng nhất: "**Không phân loại dưới bất kỳ hình thức nào:**
nhãn, thư mục, phân cấp, màu, ghim, đánh sao, độ ưu tiên" (liệt kê đủ để không cãi được ở mức ticket); "**Không chế độ
duyệt xem.** Không có màn hình 'xem tất cả ghi chú'" (một non-goal *dương tính giả dễ vi phạm* — bất kỳ ai làm UI cũng
sẽ muốn thêm nó); và "**Không phải hồ sơ đối chứng**" kèm lệnh cấm dùng chữ. §8 còn tự quản ngoại lệ của chính mình:
"Ngoại lệ duy nhất là dòng nhắc sao lưu ở FR-17, và nó không chặn đường."

Việc thu hẹp phạm vi được **tuyên bố ngay tại chỗ nó xảy ra**, không dồn hết xuống §9.2: F3 có "**Ngoài phạm vi của
F3:** xóa hàng loạt, chọn nhiều ghi chú, xóa theo ngày"; FR-16 có "**Ngoài phạm vi của FR-16:** khôi phục về đúng trạng
thái trong file. Đánh đổi có ý thức — chọn 'không bao giờ mất gì' thay vì 'khôi phục sạch'". §9.2 thì phân biệt được hai
loại khác hẳn nhau: thứ *hoãn* ("thêm khi có bằng chứng là cần") và thứ *từ chối vĩnh viễn* ("Đồng bộ nhiều máy, tài
khoản, backend — xem §8, đây là *non-goal* chứ không phải 'để sau'"). Rất ít PRD phân biệt được hai loại này.

Mật độ open-items: 5 Open Questions + 10 `[ASSUMPTION]` + 3 `[NOTE FOR PM]` = 18 mục mở. Theo rubric, con số này chỉ là
blocker với PRD đang xin green-light-to-build ở mức stakes cao; với hobby/solo thì **hoàn toàn phù hợp** — và ở đây nó
còn là dấu hiệu tốt, vì phần lớn là giả định *có thể sai và đã được đánh dấu để kiểm lại* (OQ-4 nói thẳng: "đều là con
số đặt ra trên bàn giấy. Chỉ dùng thật vài tuần mới biết đúng hay sai. Xem lại ở retrospective").

### Findings

- **medium** Sao chép nội dung ghi chú: không cho, không cấm, không nhắc (§3 NT-2, §5.3, §8) — NT-2 phát biểu whitelist
  đóng: "**Tạo mới · Sửa nội dung · Xóa.** Hết. Đề xuất nào không nằm trong ba cái đó thì bị loại mà không cần tranh
  luận." Nhưng UJ-2 kết thúc bằng "Nam mở rộng nó ra, **đọc to lên**" — trong đời thật, bước tiếp theo gần như chắc chắn
  là copy đoạn đó dán vào Slack hoặc email trả lời sếp. Việc này không nằm trong ba hành động, không nằm trong §8, và
  không nằm trong §9.2. Cùng loại mơ hồ: **mở rộng** (FR-8) cũng không phải một trong ba hành động, nhưng nó là một FR
  hẳn hoi — chứng tỏ whitelist NT-2 thực chất đang nói về *hành động làm thay đổi ghi chú*, chứ không phải mọi tương tác.
  Hệ quả downstream cụ thể: story writer hoặc dev đọc NT-2 theo nghĩa đen sẽ **loại bỏ nút copy** và có thể chặn cả bôi
  đen văn bản, vì "không nằm trong ba cái đó".
  *Fix:* sửa NT-2 thành "đúng ba hành động **làm thay đổi** ghi chú" và thêm một câu nói rõ các tương tác chỉ-đọc (đọc,
  mở rộng, bôi đen, sao chép) không bị whitelist này chi phối. Nếu sao chép cố ý bị loại thì phải nói ra ở §8 — nhưng
  với UJ-2 thì lựa chọn đó khó biện minh.

---

## 6. Downstream usability — **adequate**

Chiều này được cân nặng hơn vì PRD là chain-top, và phần lớn hạ tầng cho downstream đã có sẵn và làm tốt:

- **Glossary §4 khóa từ vựng có kỷ luật**, kèm cả một mục *phủ định* giải thích vì sao "card" bị loại ("Nó mô tả **hình
  dạng hiển thị** … hình dạng thuộc về tài liệu UX"). Ranh giới trạng thái/điều kiện — chỗ dễ hiểu sai nhất — được định
  nghĩa hai lần, ở Glossary và ở bảng FR-14, và hai chỗ khớp nhau.
- **Mã ID sạch**: FR-1→FR-17 liên tục, không trùng, không khuyết; NT-1→NT-4, NFR-1→NFR-7, UJ-1→UJ-3, SM-1→SM-5 +
  SM-C1/SM-C2, A-1→A-10 đều liên tục. §0 còn tuyên bố hợp đồng ổn định cho mã FR ("mỗi yêu cầu chức năng mang một mã
  `FR-N` cố định để các tài liệu sau tham chiếu được kể cả khi nhóm bị sắp xếp lại") — đúng thứ downstream cần.
- **Tham chiếu chéo giải được**: FR-6 → "§11 Open Questions, mục 1" đúng mục; NFR-7 → "§11 mục 2" đúng mục; các tham
  chiếu `(NT-x)`, `(FR-x)` rải trong FR đều trỏ tới mục có thật.
- **UJ có nhân vật đứng tên** (Nam), mang bối cảnh ngay trong câu chuyện chứ không trỏ ngược lên trên; UJ-2 còn có
  **nhánh hỏng** ("nếu Nam nhớ sai ngày…"), thứ mà story writer dùng được trực tiếp.
- `addendum.md` §1 là bảng bảy ràng buộc gửi thẳng `bmad-architecture` kèm cột "Đến từ" trỏ về FR/NFR — traceability
  hai chiều ở đúng chỗ cần.

Hạ xuống **adequate** vì ba thứ downstream sẽ vấp: (a) mô hình nội dung ghi chú không có FR để bóc (đã tính ở chiều 4,
nhưng thiệt hại thật sự rơi vào đây — `bmad-create-epics-and-stories` bóc theo mã FR); (b) một tham chiếu ở §0 không
giải được (§5.1 không chứa câu trả lời về độ dài — xem Mechanical notes); (c) quy ước `*Hiện thực UJ-x*` được áp dụng
không nhất quán nên không dùng được để tra ngược.

Về tiêu chí "mỗi mục đứng một mình vẫn hiểu được": §5.3, §5.4, §5.5 qua được — mỗi mục có đoạn *Mô tả* tự mang bối cảnh
và tham chiếu bằng thuật ngữ Glossary chứ không bằng "xem ở trên". §5.2 phụ thuộc nhẹ vào §5.1 nhưng không gãy.

### Findings

- **low** Quy ước `*Hiện thực UJ-x*` không nhất quán, nên không tra ngược được (§5.1–§5.5) — có ở F1 ("Hiện thực UJ-1,
  UJ-2"), FR-1, FR-4, F2, F4, FR-12, FR-13, F5, FR-15, FR-16; **không có** ở FR-2, FR-3, FR-5, FR-6, FR-7, FR-8, FR-9,
  FR-10, FR-11, FR-14, FR-17. Vì nhãn xuất hiện *một số* chỗ, người đọc downstream sẽ hiểu sự vắng mặt là "FR này không
  phục vụ UJ nào" — sai với FR-3 (tự lưu là điều kiện của UJ-1) và FR-14 (đường về là bước cuối của UJ-2). Thêm nữa F1
  gắn "UJ-1, UJ-2" nhưng không FR con nào của F1 nhắc UJ-2.
  *Fix:* chọn một mức duy nhất — gắn UJ ở mức nhóm F (F1–F5) và bỏ hết ở mức FR, hoặc gắn đủ ở mọi FR. Cách rẻ hơn:
  thêm một bảng ánh xạ UJ ↔ FR ở cuối §6; nó cũng lộ ra ngay những FR không phục vụ hành trình nào.

---

## 7. Shape fit — **strong**

PRD không bị ép vào khuôn sai, và có bằng chứng cho thấy hình dạng được chọn có ý thức.

Với hobby/solo, rubric cho phép rigor nhẹ — và tài liệu tận dụng đúng chỗ được phép: không có phân tích cạnh tranh
(đẩy sang addendum của brief), không có mô hình doanh thu, không có ma trận rủi ro, không có RACI. §10 mở đầu bằng một
câu chỉ đúng với dự án solo: "Những thước đo này đáng tin được, vì chỉ có một người dùng và người đó chính là người
đo." Đó là hiệu chỉnh stakes được viết thành chữ.

Nhưng **substance bar vẫn được giữ** — đúng yêu cầu của rubric cho shape này: ngưỡng số thật (≤ 1 giây, ≤ 200 ms,
2.000 ghi chú), phản thước đo, chín phương án bị loại kèm cái giá, và một Non-Goals list dùng được ở mức dòng code.
Rigor nhẹ ở đây có nghĩa là *ít nghi thức*, không phải *ít nội dung* — phân biệt này bị hỏng ở phần lớn PRD hobby, và
ở đây thì không.

Về User Journeys: với công cụ một người vận hành, rubric cảnh báo UJ có thể là gánh nặng thừa. Ba UJ ở đây **không**
thừa vì mỗi cái là lý do tồn tại của một nhóm tính năng khác nhau (UJ-1 → F1/F2, UJ-2 → F4, UJ-3 → F5) và mỗi cái mang
chi tiết định lượng được ("Tổng cộng chưa tới năm giây"; "gõ `phan quyen`, **không bỏ dấu, vì đang vội**"; "Những gì
Nam ghi từ thứ Sáu tới lúc máy hỏng thì mất"). Ba là con số đúng — không có UJ trôi nổi, không có UJ thứ tư dựng lên
cho đủ bộ.

Về chain-top: đã xử lý chủ động chứ không tình cờ. §0 tuyên bố ranh giới ("Nó nói **cái gì phải đúng**, không nói trông
thế nào hay làm bằng gì; hai câu đó thuộc về `bmad-ux` và `bmad-architecture`"), Glossary khóa từ vựng cho downstream,
mã FR được hứa là ổn định, addendum §1 đóng gói ràng buộc cho architecture, và NFR-6 chủ động cảnh báo một quyết định
kỹ thuật không được để rơi xuống lớp giao diện.

### Findings

- **low** Hình dạng UI rò rỉ vào PRD dù §0 và Glossary cấm (§0, §4, FR-12, FR-17, FR-8) — Glossary loại "card" vì nó là
  hình dạng hiển thị, nhưng thân bài vẫn dùng "**Ô tìm kiếm** luôn có mặt" (FR-12), "ở dạng **một dòng nhỏ**" (FR-17),
  "kèm **dấu hiệu** cho biết còn nội dung phía dưới" (FR-8), và addendum §2.3 gọi FR-11 là "**hộp thoại** xác nhận"
  trong khi bản thân FR-11 cẩn thận dùng từ trung tính "một **bước** xác nhận". Không nghiêm trọng — "ô soạn thảo" cũng
  là UI và nó đã nằm trong Glossary một cách có ý thức — nhưng nó làm luật của §0 trông tùy tiện, và `bmad-ux` có thể
  đọc "dòng nhỏ"/"hộp thoại" thành ràng buộc thiết kế đã chốt.
  *Fix:* hoặc chuyển sang từ trung tính ("từ khóa tìm kiếm nhập được ở nơi luôn hiển thị", "thông tin sao lưu hiển thị
  không chặn đường"), hoặc thêm một câu vào §0 thừa nhận PRD có dùng vài từ hình dạng ở mức tối thiểu và chúng **không**
  ràng buộc UX. Sửa "hộp thoại" ở addendum §2.3 thành "bước xác nhận" cho khớp FR-11.

---

## Mechanical notes

**Assumptions Index roundtrip (§12) — khớp hai chiều, đầy đủ.** Đã đối chiếu từng cái: 10 nhãn `[ASSUMPTION]` trong
thân bài ↔ 10 dòng A-1…A-10, không thừa, không thiếu, cột "Ở đâu" trỏ đúng FR/NFR trong mọi dòng (A-1→FR-6, A-2/A-3→
FR-8, A-4→FR-12, A-5→FR-13, A-6→FR-14, A-7/A-8→FR-15, A-9→FR-17, A-10→NFR-7). Đây là mục hay bị lệch nhất ở các PRD
khác; ở đây sạch. Khiếm khuyết duy nhất: **hai nhãn trần không mang nội dung tại chỗ** ở FR-15 (đã nêu ở chiều 4) —
tám nhãn còn lại đều tự mang nội dung, nên hai cái này phá vỡ quy ước của chính tài liệu.

**Tính liên tục của mã ID — sạch.** FR-1→17, NT-1→4, NFR-1→7, UJ-1→3, SM-1→5 + SM-C1/SM-C2, A-1→10: liên tục, duy
nhất, không khuyết. §9.1 liệt kê đủ cả 17 FR — không FR nào rơi ngoài MVP scope mà không được nói tới.

**Tham chiếu chéo — hai chỗ hỏng.**
1. **§0, đoạn cuối:** "Ba câu hỏi mở mà brief cố ý để lại đều đã được trả lời ở đây: … **độ dài một ghi chú (§5.1)**."
   §5.1 (F1 — Ghi nhanh, FR-1…FR-5) **không có câu nào về độ dài ghi chú**. Câu trả lời thật nằm ở Glossary §4 ("Một
   khối văn bản tự do, nhiều dòng") và một gạch đầu dòng §9.1. Đây là tham chiếu không giải được, và nó chính là triệu
   chứng bề mặt của finding **high** ở chiều 4 (thiếu FR mô hình nội dung).
2. **§9.1:** "Ghi chú dài bị cắt, mở rộng tại chỗ *(FR-8, FR-9)*" — FR-9 là "Trạng thái rỗng không cần giải thích",
   không liên quan gì tới cắt/mở rộng. FR-9 vì thế không được đại diện đúng ở §9.1. *Fix:* tách thành hai gạch đầu
   dòng.

**Trôi dạt thuật ngữ so với Glossary §4 — nhẹ, ba cụm.**
- **nạp lại / nhập lại / khôi phục**: Glossary chỉ định nghĩa "*nạp lại*" (trong mục *File sao lưu*). Thân bài dùng
  "nạp" nhất quán ở FR-16, nhưng tiêu đề §5.5 là "Sao lưu & **Khôi phục**", §9.2 dùng "**Khôi phục** thay thế toàn bộ",
  và addendum §2.8 dùng "**nhập lại** là một FR thật". Ba từ cho một khái niệm. *Fix:* thêm "*Nạp lại*" thành một mục
  Glossary riêng và dùng duy nhất từ đó (kể cả trong tiêu đề §5.5).
- **hộp thoại xác nhận** (addendum §2.3) vs **bước xác nhận** (FR-11) — PRD trung tính, addendum đã chốt hình dạng.
- **ô tìm kiếm** (FR-12, UJ-2) không có trong Glossary, trong khi *ô soạn thảo* thì có. Nếu một UI element được khóa từ
  vựng thì cái kia cũng nên.

**UJ protagonist naming — đạt.** Cả ba UJ đều có nhân vật đứng tên (Nam) và mang bối cảnh ngay trong câu chuyện, không
có UJ trôi nổi. UJ-2 có thêm nhánh hỏng — dùng được trực tiếp làm story ngoại lệ.

**Các mục bắt buộc theo stakes và loại sản phẩm — đủ.** Vision, Users/JTBD, Design principles, Glossary, Features/FR,
UJ, NFR, Non-Goals, MVP Scope, Success Metrics (kèm counter-metrics), Open Questions, Assumptions Index. Với hobby/solo
thì đây là thừa chứ không thiếu — và phần thừa là thừa có ích, vì nó phục vụ mục tiêu học nghề (SM-5).

**Ba mốc quy mô không thống nhất** (300 ở SM-4, 1.200 ở FR-6, 2.000 ở NFR-1/NFR-2 và addendum §1 ràng buộc 3). Không
mâu thuẫn về logic, nhưng khi nghiệm thu sẽ phải dựng ba bộ dữ liệu mẫu khác nhau mà không có lý do nào được nêu.
*Fix:* thống nhất về 2.000 (mốc cao nhất, đã dùng cho ràng buộc gửi architecture), trừ khi có lý do cụ thể thì ghi lý
do đó ra.

---

## Tổng hợp finding

| Mức | Số lượng | Ở đâu |
|---|---|---|
| critical | 0 | — |
| high | 3 | NT-3 không có biên cho ngày dày (§3/§5.2/FR-6); NFR-3 tựa lên OQ-5 chưa xét (§7/§11.5); thiếu FR mô hình nội dung ghi chú (§4/§5.1/§9.1) |
| medium | 6 | SM-4 đếm nhầm đại lượng; tạo ghi chú khi đang lọc; hành vi khi hết dung lượng; FR-15 "máy đọc được" + 2 nhãn trần; FR-16 "báo lỗi rõ ràng"; sao chép nội dung / phạm vi whitelist NT-2 |
| low | 6 | OQ-1 không phải câu hỏi mở; NFR-6 không phải NFR; FR-5 "rời khỏi"; FR-8 mở rộng loại trừ; quy ước `Hiện thực UJ-x`; rò rỉ hình dạng UI |

**Khuyến nghị thứ tự xử lý trước khi chạy `bmad-ux`:** ba finding high (cả ba đều là quyết định *cái gì phải đúng*,
không đẩy sang UX/architecture được), rồi hai medium có ảnh hưởng trực tiếp tới UX (tạo ghi chú khi đang lọc; phạm vi
whitelist NT-2 với thao tác sao chép). Ba medium còn lại có thể xử cùng lúc với `bmad-architecture`. Nhóm low xử lý
một lượt khi biên tập lại tài liệu.
