---
title: "Thẩm định khả dụng downstream: PRD Ghi chú hàng ngày"
status: review
created: 2026-09-09
target: prd.md + addendum.md
---

# Thẩm định: PRD này có đủ để làm việc tiếp không?

Tài liệu này **không** đánh giá văn phong, lập luận hay chất lượng sản phẩm. Nó chỉ trả lời một câu:
ba bước tiếp theo — `bmad-ux`, `bmad-architecture`, `bmad-create-epics-and-stories` — có cầm PRD này
mà làm việc được không, và nếu phải đoán thì đoán ở đâu.

Cách đọc mức nghiêm trọng:

| Mức | Nghĩa |
|---|---|
| **critical** | Không làm tiếp được. Phải có câu trả lời trước khi bắt đầu. |
| **high** | Làm tiếp được nhưng phải đoán, và đoán sai thì phải làm lại — không phải sửa vặt. |
| **medium** | Làm được, nhưng sẽ phải quay lại hỏi ít nhất một lần. |
| **low** | Nhỏ nhặt, ghi ra để không quên. |

---

## 0. Phán quyết tổng

| Vai | Phán quyết | Vì sao |
|---|---|---|
| **bmad-ux** | **Phải hỏi lại** (2 câu chặn màn hình chính) | Dựng được phần lớn DESIGN.md/EXPERIENCE.md, nhưng hai câu hỏi về *mô hình soạn thảo* và *cử chỉ mở rộng vs sửa* nằm ngay giữa màn hình duy nhất của sản phẩm. Vẽ trước rồi hỏi sau là vẽ lại. |
| **bmad-architecture** | **Bế tắc** (có đường đi tạm) | Không chốt được cách lưu trữ vì hai ẩn số nằm ngoài PRD: mô hình phân phối ứng dụng (chưa ai hỏi) và trình duyệt + chính sách IT (PRD tự ghi nhận là chưa biết, và tự nói phải biết trước). Làm được thiết kế có điều kiện hai nhánh, không ra được quyết định cuối. |
| **bmad-create-epics-and-stories** | **Phải hỏi lại** | 15/17 FR băm được ngay. 2 FR không băm được vì thiếu định nghĩa (FR-5) hoặc phụ thuộc UX chưa có (FR-8). Nghiêm trọng hơn: cần cả một epic nền tảng mà **không FR nào trong PRD phủ**. |

**Tổng finding: 46** — critical 6 · high 16 · medium 17 · low 7.

**Năm lỗ hổng nặng nhất**, xếp theo mức thiệt hại nếu bỏ qua:

1. **K-1 — Mô hình phân phối ứng dụng chưa từng được nêu.** File HTML mở bằng `file://`, hay trang
   web nội bộ, hay PWA có service worker? Ba lựa chọn này cho ba câu trả lời khác nhau về việc có
   dùng được `localStorage`/`IndexedDB` hay không, và NFR-4 (offline) + NFR-7 (không cài đặt) không
   đủ để suy ra. Đây là ẩn số chặn *mọi* quyết định lưu trữ, và nó không nằm trong §11 Open Questions.
2. **U-1 — "Ô soạn thảo" và "dòng ghi chú" quan hệ thế nào.** PRD nói được cả hai kiểu: §5.2 gợi ý
   một composer riêng nằm phía trên, FR-3 gợi ý ghi chú đang gõ đã nằm sẵn trong dòng theo thời điểm
   tạo. Hai mô hình cho hai bản DESIGN.md không giao nhau.
3. **S-1 / K-3 — Thiếu hẳn nhóm yêu cầu nền tảng.** Hết dung lượng trình duyệt, lỗi ghi, hai tab, di
   trú lược đồ khi cập nhật app: không FR nào phủ. Đây đúng là chỗ rủi ro số một của sản phẩm (mất
   dữ liệu) và nó đang không có tiêu chí nghiệm thu nào.
4. **K-4 — "Sống sót qua mất điện, trong ≤ 1 giây" không đảm bảo được trong trình duyệt.** FR-3 và
   ràng buộc 2 của addendum đặt ra một mức bền vững mà không API lưu trữ nào của trình duyệt hứa
   được, và cũng không kiểm chứng được bằng test. Cần hạ xuống dạng đo được.
5. **K-6 — Múi giờ / cách biểu diễn thời điểm tạo không quy định.** UJ-3 là kịch bản khôi phục sang
   máy mới; nếu máy mới khác múi giờ và thời điểm tạo lưu dạng local, "ngày" của ghi chú đổi và
   FR-13 trả kết quả sai — hỏng đúng cái neo mà cả sản phẩm dựa vào.

---

## 1. VAI 1 — `bmad-ux`

### 1.1 Làm được gì ngay

PRD cho tôi đủ nguyên liệu cho phần lớn EXPERIENCE.md: bốn nguyên tắc §3 dùng làm tiêu chí loại trừ
khi thiết kế; Glossary §4 khóa từ vựng; bảng mô hình trạng thái ở FR-14 là thứ hiếm — nó cho tôi
viết ngay phần "màn hình hiển thị gì trong từng trạng thái" mà không phải đoán; §8 Non-Goals chặn
sẵn cả một họ ý tưởng giao diện (nhãn, màu, ghim, kéo thả) nên tôi không tốn thời gian vẽ rồi bị
loại. FR-9 và FR-12 nói rõ hai trạng thái rỗng phải phân biệt được — đó là loại chi tiết thường bị
bỏ sót.

### 1.2 Thiếu hoặc mơ hồ

#### U-1 · Quan hệ giữa "ô soạn thảo" và "dòng ghi chú" — **critical**
**Ở đâu:** §4 Glossary ("Ô soạn thảo"), §5.1 FR-1, §5.2 mô tả F2, §5.1 FR-3.

PRD đọc được theo hai kiểu loại trừ nhau:
- **Kiểu A (composer riêng):** §5.2 nói "phía trên là ô soạn thảo luôn sẵn sàng" — một khối cố định
  nằm trên đầu danh sách; gõ xong `Ctrl+Enter` thì ghi chú "rơi xuống" thành item đầu tiên của dòng.
- **Kiểu B (soạn tại chỗ):** FR-3 nói ghi chú đang gõ dở khi phiên bị ngắt "xuất hiện lại nguyên
  trạng, **ở đúng vị trí theo thời điểm tạo**" — nghĩa là ghi chú đang gõ vốn đã là một item trong
  dòng ngay từ ký tự đầu tiên, không có khối composer nào tách biệt.

**Câu hỏi cần trả lời:** ghi chú đang được gõ có phải là một phần tử của dòng ghi chú ngay từ ký tự
đầu tiên không, hay nó sống trong một khối soạn thảo riêng cho tới khi được chốt? Và sau `Ctrl+Enter`
thì trên màn hình có chuyển động gì xảy ra?

#### U-2 · Không phân biệt "mở rộng để đọc" với "đặt con trỏ để sửa" — **critical**
**Ở đâu:** FR-8 ("mở rộng được ngay tại chỗ") vs FR-10 ("đặt được con trỏ vào bất kỳ vị trí nào").

Click vào một ghi chú đang bị cắt thì chuyện gì xảy ra? Nó giãn ra để đọc, hay nó vào chế độ sửa,
hay cả hai cùng lúc? Ghi chú đang được sửa có luôn hiển thị đầy đủ không, hay vẫn bị trần chiều cao
3 dòng trong lúc gõ? Đây là cử chỉ trung tâm của màn hình duy nhất của sản phẩm — không chốt thì
không vẽ được.

**Câu hỏi:** một cử chỉ hay hai? Nếu hai, cử chỉ nào cho việc nào, và có được phép dùng chuột cho cả
hai không (FR-4 và addendum §2.5 đặt cược mạnh vào bàn phím)?

#### U-3 · FR-8: "3 dòng", "chiều cao trần", "dấu hiệu" đều chưa dùng được — **high**
**Ở đâu:** §5.2 FR-8, giả định A-2, A-3.

Ba chỗ mơ hồ chồng lên nhau:
- "3 dòng" là **dòng logic** (người dùng bấm Enter) hay **dòng hiển thị sau khi xuống hàng tự động**?
  Với một ghi chú một đoạn dài, hai cách đếm cho hai kết quả rất khác.
- "mọi ghi chú có cùng chiều cao trần" đọc được hai kiểu: cùng `max-height` (ghi chú 1 dòng vẫn thấp),
  hay cùng chiều cao cố định (ghi chú 1 dòng cũng chiếm 3 dòng chỗ). Kiểu thứ hai làm hỏng SM-4.
- "dấu hiệu cho biết còn nội dung phía dưới" — chưa đủ để làm việc, nhưng đây đúng là địa hạt UX;
  vấn đề là PRD đã chốt sẵn con số 3 mà không chốt cách đếm.

**Câu hỏi:** đếm dòng theo cách nào, và trần là max-height hay height cố định?

#### U-4 · FR-17: "một dòng nhỏ" thiếu bốn thông tin bắt buộc — **high**
**Ở đâu:** §5.5 FR-17, giả định A-9.

PRD chốt: không chặn đường, không hộp thoại, không phải bấm để tắt. Nhưng để dựng được nó tôi cần:
đặt ở đâu trên màn hình; nội dung chữ nói gì; **tồn tại bao lâu** — vì "không phải bấm để tắt" cộng
với "hiện khi quá 7 ngày" nghĩa là nó nằm đó vĩnh viễn cho tới lần sao lưu tiếp theo, và như vậy nó
là rác thường trực trên màn hình, đúng thứ NT-3 và FR-9 chống lại; và có bấm vào nó để xuất luôn
được không.

**Câu hỏi:** dòng nhắc này có phải là một lối tắt tới hành động xuất, hay chỉ là chữ? Và nếu người
dùng lười 40 ngày thì nó vẫn nằm đó suốt 33 ngày?

#### U-5 · FR-5: "rời khỏi một ghi chú rỗng" chưa phải một cử chỉ — **high**
**Ở đâu:** §5.1 FR-5.

"Rời khỏi" là gì: con trỏ mất tiêu điểm? Bấm `Ctrl+Enter`? Bấm `Esc`? Click sang ghi chú khác? Đặt
điều kiện lọc? Tải lại trang? FR-4 đã chốt một trường hợp (`Ctrl+Enter` trên ghi chú rỗng thì không
tạo thêm), còn lại bỏ ngỏ. Đây là **ngoại lệ duy nhất** của FR-11 nên nó phải chặt hơn mức này.

**Câu hỏi:** liệt kê đầy đủ các cử chỉ được tính là "rời khỏi".

#### U-6 · Hành động Xóa không có cách nào để với tới — **high**
**Ở đâu:** NT-2, §5.3 FR-11.

NT-2 nói xóa là một trong ba hành động chạm được vào ghi chú, FR-11 nói kỹ về bước xác nhận — nhưng
không chỗ nào nói người dùng *khởi động* hành động xóa bằng gì. Với một sản phẩm đặt cược toàn bộ
vào "mở lên không rối mắt", việc nút Xóa luôn hiện trên từng ghi chú hay chỉ hiện khi rê chuột là
một quyết định nặng — và nó ảnh hưởng thẳng tới NT-3 và SM-4.

**Câu hỏi:** đây có phải là chỗ PRD cố ý để trống cho UX quyết không? Nếu có, có ràng buộc nào không
(ví dụ: phải với tới được bằng bàn phím, vì sản phẩm là bàn-phím-trước)?

#### U-7 · UJ-2 đòi một năng lực mà FR-14 không đảm bảo — **high**
**Ở đâu:** §6 UJ-2 (trường hợp hỏng) vs §5.4 FR-14.

UJ-2 mô tả: "Nam **bỏ bộ lọc ngày, giữ từ khóa**". FR-14 chỉ đảm bảo hai điều: xóa **hết** điều kiện
thì về khung nhìn mặc định, và luôn có đường về mặc định trong **một** thao tác. Không tiêu chí nào
nói mỗi điều kiện gỡ được **độc lập**. Nếu tôi thiết kế một nút "về hôm nay" duy nhất thì tôi vẫn
đúng FR-14 nhưng làm hỏng UJ-2.

**Câu hỏi:** mỗi điều kiện có phải gỡ được riêng không? Nếu có, đó là một tiêu chí nghiệm thu còn
thiếu ở FR-14.

#### U-8 · Ngôn ngữ giao diện và cách hiển thị thời gian — **medium**
**Ở đâu:** FR-2, FR-13, UJ-1 (`08/09/2026 10:14`).

PRD dùng `dd/MM/yyyy` và giờ 24h trong ví dụ, nhưng không nói: giao diện bằng tiếng Việt hay tiếng
Anh; định dạng trong ví dụ là ràng buộc hay chỉ minh họa; có được dùng thời gian tương đối ("10 phút
trước", "hôm qua 14:30") không — điều này rất hợp với sản phẩm nhưng có thể va vào FR-2 ("hiển thị
gồm cả ngày và giờ").

#### U-9 · SM-4 không có màn hình tham chiếu — **medium**
**Ở đâu:** §10 SM-4.

"Khung nhìn mặc định vẫn không dài quá một màn hình" với ít nhất 300 ghi chú trong máy. Một màn hình
nào — độ phân giải nào, cửa sổ trình duyệt cỡ nào, phóng to bao nhiêu phần trăm? Không có con số này
thì tôi không biết thiết kế mật độ cho đích nào, và thước đo cũng không nghiệm thu được. (Lưu ý: đây
là ràng buộc về *ghi chú của hôm nay*, không phải 300 — nên câu hỏi thật là: một ngày điển hình có
bao nhiêu ghi chú?)

#### U-10 · Không có bản đồ bàn phím ngoài `Ctrl+Enter` — **medium**
**Ở đâu:** FR-4, FR-11, FR-12.

Sản phẩm này bàn-phím-trước, nhưng chỉ có đúng một phím tắt được đặc tả. Chưa nói: sau khi xóa thì
tiêu điểm đi đâu; `Esc` trong ô soạn thảo làm gì (FR-11 chỉ định nghĩa `Esc` trong hộp xác nhận);
thứ tự `Tab`; có phím tắt nào nhảy vào ô tìm kiếm không; đang ở ô tìm kiếm thì quay về ô soạn thảo
bằng gì.

#### U-11 · PRD lấn sang địa hạt hình thức ở 7 chỗ — **medium**
**Ở đâu:** rải rác.

§0 tuyên bố "không nói trông thế nào", nhưng những chỗ sau đã quyết hộ:

| Chỗ | Đã quyết hộ điều gì |
|---|---|
| FR-4 + addendum §2.5 | Chọn hẳn một tổ hợp phím cụ thể (`Ctrl+Enter`) |
| FR-8 / A-2 | Ngưỡng cắt 3 dòng |
| FR-11 | `Esc` và click-ra-ngoài = hủy ⇒ thực chất đã chốt bước xác nhận là một **modal** |
| FR-12 | "Ô tìm kiếm luôn có mặt" ⇒ đã chốt nó không phải là thứ mở ra mới dùng |
| FR-13 | Định dạng `dd/MM/yyyy` và ngụ ý một bộ chọn ngày |
| FR-17 | "một dòng nhỏ" |
| NFR-1, FR-9 | "không splash screen", "không hình minh họa chào mừng" |

Phần lớn trong số này biện minh được bằng nguyên tắc (NT-1/NT-2), nên tôi không phản đối. Nhưng tôi
cần biết cái nào là **ràng buộc cứng** và cái nào tôi được phép đề xuất phương án khác kèm lý do.

#### U-12 · Hai tab cùng lúc chưa xét — **medium**
**Ở đâu:** §11 Open Questions mục 5.

Nếu câu trả lời là "có xử lý", tôi phải thiết kế thêm ít nhất một trạng thái ("dữ liệu đã đổi ở tab
khác"), và có thể cả một cách báo. Nếu câu trả lời là "không xử lý", tôi cần biết để không thiết kế.
PRD nói "chưa xét" — đó là chưa đủ để tôi bắt đầu.

#### U-13 · Hai trạng thái rỗng phải phân biệt bằng gì — **low**
**Ở đâu:** FR-9 vs FR-12.

FR-9 cấm mọi thông báo khi hôm nay chưa có ghi chú. FR-12 bắt buộc "nói rõ là không có kết quả" khi
tìm không thấy. Yêu cầu đúng và không mâu thuẫn, nhưng PRD không nói việc phân biệt phải dựa vào cái
gì (chữ? sự hiện diện của điều kiện đang áp dụng?). Tôi tự quyết được, chỉ ghi ra để xác nhận.

#### U-14 · Từ "card" — **low**
**Ở đâu:** §4 Glossary, ghi chú cuối mục.

Glossary cố ý loại từ "card" khỏi PRD vì nó mô tả hình dạng. Không nói rõ DESIGN.md **được phép**
dùng từ đó hay cũng phải tránh. Giả định của tôi: được, vì đó chính là địa hạt của tôi.

**Tổng vai UX: 14 finding** — critical 2 · high 5 · medium 5 · low 2.

---

## 2. VAI 2 — `bmad-architecture`

### 2.1 Ràng buộc đủ rõ để tuân theo ngay

Addendum §1 là phần tốt nhất của bộ tài liệu này đối với tôi — bảy ràng buộc, mỗi cái có nguồn truy
vết về FR/NFR. Cụ thể, những thứ tôi cầm và làm được không cần hỏi:

- **Không backend, không tài khoản, không đồng bộ, không telemetry** (NFR-5, §8) — dứt khoát, không
  đọc lệch được.
- **Chạy đủ chức năng khi mất mạng** (NFR-4).
- **Định danh ổn định sống sót qua xuất/nạp** (ràng buộc 4, FR-16) — và lý do vì sao nó quan trọng
  được nói rõ (cơ chế gộp phụ thuộc hoàn toàn vào nó).
- **Quy tắc gộp khi nạp lại** (FR-16) — rõ đến mức hiếm: đã có thì bỏ qua, chưa có thì thêm, không
  bao giờ xóa hay ghi đè, file hỏng thì không đụng một chữ nào vào dữ liệu hiện có. Đây là đặc tả
  đủ để viết code và viết test.
- **Thời điểm tạo bất biến, là khóa sắp xếp duy nhất** (NT-4, FR-2, FR-7) — cho phép tôi chốt mô
  hình dữ liệu chỉ-thêm-vào-cuối theo thời gian.
- **File sao lưu có số phiên bản, tương thích ngược** (ràng buộc 5, FR-15).
- **Chuẩn hóa tiếng Việt là việc của tầng dữ liệu** (NFR-6, ràng buộc 1) — tôi đồng ý rằng đây phải
  là quyết định của tôi chứ không phải của lớp giao diện; xem K-9 về mức độ ràng buộc.

### 2.2 Thiếu, mơ hồ, hoặc mâu thuẫn

#### K-1 · Mô hình phân phối ứng dụng chưa từng được nêu — **critical**
**Ở đâu:** không ở đâu cả. Suy ra được từ NFR-4 + NFR-7, nhưng không được nói.

"Không cài đặt, không quyền admin" + "chạy đầy đủ khi mất mạng" để lại ba khả năng, và chúng cho ba
kiến trúc lưu trữ khác nhau:

| Phương án | Hệ quả kỹ thuật |
|---|---|
| Một file `.html` mở bằng `file://` | Offline thật, không cần gì cả — nhưng nhiều trình duyệt coi đây là origin đặc biệt, `localStorage`/`IndexedDB` có thể bị chặn hoặc không bền giữa các lần mở. Rủi ro trực tiếp với NFR-3. |
| Trang trên một URL nội bộ/công ty | Lưu trữ hoạt động bình thường, nhưng lần tải đầu cần mạng và mỗi lần mở tab cũng cần — va vào NFR-4 trừ khi có service worker. |
| PWA / service worker | Đạt được NFR-4 sau lần đầu, nhưng bắt buộc HTTPS, và service worker là đúng loại thứ chính sách IT hay chặn. |

**Câu hỏi:** app này được mở ra bằng cách nào trên máy công ty của Nam?

#### K-2 · Trình duyệt và chính sách IT chưa xác định — **critical**
**Ở đâu:** NFR-7, giả định A-10, §11 Open Questions mục 2.

PRD tự ghi nhận và tự nói: "Cần xác nhận **trước khi** `bmad-architecture` chốt cách lưu trữ." Tôi
xác nhận đánh giá đó. Không biết chính sách IT có chặn lưu trữ cục bộ hoặc tải file về hay không thì
F5 (toàn bộ chiến lược chống mất dữ liệu) có thể là bất khả thi trong môi trường thật, và tôi sẽ
thiết kế một cái két sắt cho một căn phòng không tồn tại. Điểm cộng: đây là lỗ hổng **đã biết**,
không phải lỗ hổng ẩn.

**Câu hỏi:** trình duyệt nào, phiên bản nào, và có group policy nào chặn site data / chặn download
không?

#### K-3 · Hành vi khi hết dung lượng hoặc ghi thất bại chưa thành yêu cầu — **high**
**Ở đâu:** §11 mục 3, addendum ràng buộc 7.

Ràng buộc 7 viết: "cần được xử lý có chủ đích... cần biết ngưỡng và hành vi khi chạm". Đó là chuyển
câu hỏi cho tôi, không phải ràng buộc cho tôi. Nhưng **hành vi khi chạm là quyết định sản phẩm, không
phải quyết định kỹ thuật** — và nó va thẳng vào lõi:

- NFR-3 nói ghi chú không tự mất đi và sản phẩm không tự áp giới hạn.
- FR-3 nói không có nút Lưu, chữ tự an toàn trong ≤ 1 giây.
- Ghép lại: khi ghi thất bại, người dùng đang gõ mà chữ **không** được lưu, và không có nút Lưu để
  thử lại, và PRD cấm hộp thoại chặn đường. Sản phẩm phải làm gì?

**Câu hỏi:** khi tầng lưu trữ báo lỗi (hết quota, quyền bị thu hồi giữa chừng), sản phẩm nói gì với
người dùng và tiếp tục ra sao? Đây cần một FR mới, không phải một dòng trong Open Questions.

#### K-4 · MÂU THUẪN: "sống sót qua mất điện" trong "≤ 1 giây" — **high**
**Ở đâu:** FR-3 (tiêu chí 1 và 4), addendum ràng buộc 2.

FR-3 đòi chữ còn nguyên sau "đóng tab đột ngột, trình duyệt crash, hoặc **máy khởi động lại**";
addendum nói thẳng "chịu được đóng tab đột ngột và **mất điện**", và gọi đó là "ràng buộc cứng".

Không API lưu trữ nào của trình duyệt cung cấp đảm bảo kiểu `fsync`. `localStorage` ghi đồng bộ vào
bộ nhớ trình duyệt nhưng việc dữ liệu xuống đĩa thật vẫn qua bộ đệm hệ điều hành; `IndexedDB` xác
nhận transaction xong không có nghĩa là đã bền qua một lần cúp điện. Nghĩa là: **ràng buộc này không
đảm bảo được và cũng không kiểm chứng được bằng test tự động.**

**Câu hỏi:** có thể hạ xuống dạng đo được không — ví dụ "còn nguyên sau khi đóng tab, kill tiến trình
trình duyệt, và khởi động lại máy theo cách bình thường", và ghi nhận mất điện đột ngột là best-effort?
Nếu "mất điện" là ràng buộc thật thì nó cần một cơ chế khác hẳn (và có thể vượt ngoài trình duyệt).

#### K-5 · "≤ 1 giây" tính từ đâu — **high**
**Ở đâu:** FR-3, FR-10, addendum ràng buộc 2.

"Khoảng cách giữa lúc gõ và lúc chữ đã an toàn: ≤ 1 giây" đọc được hai kiểu, và chúng cho hai kiến
trúc ghi khác nhau:

- **Từ ký tự cuối cùng** (debounce 1s): đơn giản, ít ghi. Nhưng khi Nam gõ liên tục 40 giây biên bản
  họp, ký tự đầu tiên nằm chờ 40 giây chưa lưu — đúng kịch bản hỏng mà addendum §2.6 dùng để loại
  phương án "chỉ lưu khi chốt".
- **Từ ký tự đầu tiên chưa lưu** (throttle/flush định kỳ): đúng tinh thần hơn, nhưng ghi nhiều hơn
  và va vào ngân sách dung lượng cùng độ trễ ghi.

**Câu hỏi:** không ký tự nào được ở trạng thái chưa lưu quá 1 giây, hay chỉ cần dừng gõ 1 giây là
lưu?

#### K-6 · Múi giờ và cách biểu diễn thời điểm tạo — **high**
**Ở đâu:** FR-2, giả định A-1, FR-13, FR-16, UJ-3.

A-1 chốt "hôm nay tính theo mốc 00:00 giờ của máy" nhưng không nói thời điểm tạo được **lưu** ở dạng
gì. Nếu lưu dạng giờ địa phương không kèm offset, thì kịch bản UJ-3 (máy được cài lại, có thể đặt
múi giờ khác, hoặc file sao lưu được nạp trên máy khác) sẽ làm một số ghi chú đổi ngày — và FR-13
("chỉ thấy ghi chú thuộc ngày đó") trả kết quả sai. Đó là hỏng đúng cái neo mà cả sản phẩm dựa vào.

**Câu hỏi:** lưu UTC + offset và quy đổi khi hiển thị, hay lưu giờ địa phương và chấp nhận rằng file
sao lưu chỉ đúng trên máy cùng múi giờ?

#### K-7 · Không có trần độ dài ghi chú, không có mô hình tăng trưởng — **high**
**Ở đâu:** §0 (tuyên bố đã trả lời "độ dài một ghi chú" ở §5.1), §4 Glossary, §9.1.

§0 nói câu hỏi mở của brief về độ dài ghi chú "đã được trả lời ở §5.1" — nhưng §5.1 không nói gì về
độ dài. Câu trả lời thực tế nằm rải ở §4 ("khối văn bản tự do, nhiều dòng") và §9.1 — tức là **không
có trần**. Cộng với việc không có mô hình tăng trưởng (bao nhiêu ghi chú mỗi ngày, cỡ trung bình bao
nhiêu), tôi không tính được ngân sách dung lượng, tức là không trả lời được K-3.

**Câu hỏi:** có trần độ dài một ghi chú không (kể cả một trần rất rộng, ví dụ 100 KB, chỉ để chặn
trường hợp dán nhầm cả một file)? Ước lượng số ghi chú mỗi ngày và cỡ trung bình?

#### K-8 · Hai tab: tự lưu liên tục + không khóa = mất dữ liệu âm thầm — **high**
**Ở đâu:** §11 mục 5.

PRD nói "chưa xét. Nhiều khả năng có thật, vì người dùng để tab mở cả ngày." Với FR-3 (ghi liên tục,
không có bước chốt) và không có cơ chế khóa, hai tab mở song song sẽ ghi đè lẫn nhau và người dùng
**không có cách nào biết** — mất dữ liệu, không cảnh báo, không thao tác nào của người dùng gây ra
nó. Đây là rủi ro số một của sản phẩm xảy ra ở một chỗ mà không phanh nào của PRD (FR-11) chạm tới.

**Câu hỏi:** chốt một trong ba: (a) đồng bộ giữa các tab qua `storage` event / `BroadcastChannel`;
(b) tab mở sau chỉ đọc, có báo; (c) chấp nhận rủi ro và ghi vào Non-Goals. Không được để "chưa xét".

#### K-9 · Addendum ràng buộc 1 kết luận kỹ thuật thay cho tôi, và kết luận đó có thể sai — **medium**
**Ở đâu:** addendum §1 ràng buộc 1.

Nguyên văn: "Chuẩn hóa lúc so chuỗi trên toàn bộ dữ liệu **sẽ không đạt NFR-2** khi số ghi chú lớn —
nhiều khả năng cần lưu sẵn dạng đã chuẩn hóa."

Ở quy mô mà chính PRD nêu (2.000 ghi chú, NFR-2), một lượt quét trong bộ nhớ trên chuỗi đã chuẩn hóa
sẵn lúc nạp gần như chắc chắn nằm rất xa dưới 200 ms. Kết luận này có thể đúng ở quy mô lớn hơn
nhiều, nhưng ở đây nó đang ràng buộc cả tầng lưu trữ, và cái giá thì thật: dung lượng lưu gần như
nhân đôi (va vào K-3), đường ghi ≤ 1 giây phải cập nhật thêm chỉ mục (va vào K-5), và đổi thuật toán
chuẩn hóa về sau sẽ cần di trú dữ liệu (va vào K-13).

**Câu hỏi:** ràng buộc 1 là **bắt buộc** (phải lưu sẵn dạng chuẩn hóa) hay là **kết quả cần đạt**
(chỉ cần đạt NFR-2, cách làm là của architecture)? Tôi đề nghị cách đọc thứ hai.

#### K-10 · Ba con số quy mô khác nhau, không rõ cái nào là đích thiết kế — **medium**
**Ở đâu:** §1 ("hàng trăm"), FR-6 (1.200), NFR-1/NFR-2 và addendum ràng buộc 3 (2.000), SM-4 (300).

**Câu hỏi:** con số nào là đích thiết kế, con số nào là ngưỡng nghiệm thu, và sản phẩm dự kiến sống
bao lâu ở quy mô đó (2.000 ghi chú là bao nhiêu tháng dùng thật)?

#### K-11 · "Định danh duy nhất" — duy nhất trong phạm vi nào — **medium**
**Ở đâu:** §4 Glossary ("Định danh"), addendum ràng buộc 4 + đoạn gợi ý cuối §1.

Addendum nói ràng buộc 4 và 5 "đã làm sẵn phần lớn việc" cho đường mở rộng nhiều máy. Điều đó chỉ
đúng nếu định danh duy nhất **toàn cục**, không phải duy nhất trong một máy — số tăng dần sẽ va nhau
ngay lần gộp file đầu tiên từ máy thứ hai.

**Câu hỏi:** định danh phải duy nhất toàn cục (UUID/ULID) hay chỉ trong phạm vi một máy?

#### K-12 · Tương thích ngược của file sao lưu: một chiều hay hai — **medium**
**Ở đâu:** FR-15, FR-16, addendum ràng buộc 5.

Ràng buộc 5 nói "bản app tháng sau vẫn phải nạp được file hôm nay" — rõ, một chiều. Nhưng FR-16 nói
"sai phiên bản: báo lỗi rõ ràng" — ngụ ý app cũ **từ chối** file mới. Cần xác nhận đó là hành vi
mong muốn (tôi nghĩ là đúng, nhưng nó là quyết định sản phẩm chứ không phải kỹ thuật).

#### K-13 · Lược đồ dữ liệu trong trình duyệt không có phiên bản — **medium**
**Ở đâu:** NFR-3 ("tồn tại qua ... cập nhật phiên bản app"), FR-15 (chỉ *file* có phiên bản).

PRD bắt file sao lưu mang số phiên bản, nhưng không nói gì về dữ liệu đang nằm trong trình duyệt.
NFR-3 đòi ghi chú sống qua cập nhật app ⇒ tôi cần một đường di trú lược đồ tại chỗ, và nó cần tiêu
chí nghiệm thu riêng (đặc biệt: nâng cấp thất bại giữa chừng thì sao — xem lại FR-16, "không đụng
một chữ nào").

#### K-14 · Thứ tự khởi động: có được nhận ký tự trước khi nạp xong dữ liệu cũ không — **high**
**Ở đâu:** FR-1 ("ngay khi trang tải xong"), NFR-1 (≤ 2 giây với 2.000 ghi chú), SM-2.

Đây là một ngã ba kiến trúc thật. Nếu ô soạn thảo phải sẵn sàng trước khi 2.000 ghi chú (và chỉ mục
chuẩn hóa của chúng) được nạp xong, tôi thiết kế khởi động nhiều pha: gõ được ngay, dòng ghi chú và
tìm kiếm đến sau. Nếu không, tôi phải nhét mọi thứ vào trong 2 giây và NFR-1 trở thành ràng buộc
chặt hơn nhiều. FR-3 làm chuyện này khó hơn nữa: ký tự gõ trong pha đầu phải được lưu, tức là tầng
ghi phải sẵn sàng trước tầng đọc.

**Câu hỏi:** người dùng gõ được trước khi dòng ghi chú hiện xong có chấp nhận được không?

#### K-15 · FR-2: vòng đời ghi chú khi gõ rồi xóa hết rồi gõ lại — **medium**
**Ở đâu:** FR-2 ("thời điểm tạo = lúc ký tự đầu tiên được gõ") + FR-5.

Người dùng gõ, xóa hết ký tự (theo FR-5 ghi chú bị loại bỏ), rồi gõ tiếp mà chưa rời khỏi đó. Ghi
chú cũ hồi sinh với thời điểm cũ và định danh cũ, hay đây là một ghi chú hoàn toàn mới? Ảnh hưởng
tới việc định danh được sinh ra lúc nào và ghi vào lưu trữ lúc nào.

#### K-16 · Tên file sao lưu — **low**
**Ở đâu:** FR-15, giả định A-8.

"Tên file chứa ngày xuất" — chưa nói định dạng ngày trong tên (và `dd/MM/yyyy` không dùng được vì
dấu `/`), chưa nói xuất hai lần trong cùng một ngày thì tránh trùng bằng cách nào.

**Tổng vai Architecture: 16 finding** — critical 2 · high 7 · medium 6 · low 1.

### 2.3 Có yêu cầu nào bất khả thi trong trình duyệt không?

Đã rà toàn bộ FR và NFR:

- **Bất khả thi theo nghĩa chặt: 1** — độ bền qua mất điện trong ≤ 1 giây (K-4). Không phải "khó",
  mà là "không API nào hứa được, và không test nào chứng minh được".
- **Có điều kiện: 2** — NFR-4 (offline) và F5 (xuất/nạp file) đều khả thi, nhưng cả hai phụ thuộc
  vào câu trả lời của K-1 và K-2. `file://` có thể làm hỏng lưu trữ; group policy có thể chặn
  download.
- **Còn lại: khả thi.** PRD đã tự loại bỏ đúng thứ trình duyệt không làm được (§8: "Không
  always-on-top. Trình duyệt không làm được"). Tìm kiếm bỏ dấu tiếng Việt hoàn toàn làm được ở
  client (chuẩn hóa Unicode NFD + bỏ dấu thanh, xử lý riêng `đ/Đ` — đây là chi tiết tôi cần nhớ,
  không phải lỗ hổng của PRD).

### 2.4 Mâu thuẫn giữa các ràng buộc

| # | Mâu thuẫn | Mức |
|---|---|---|
| 1 | FR-3 "≤ 1 giây" + "qua mất điện" (K-4) — mức bền vững vượt khả năng của nền tảng | high |
| 2 | NFR-3 "không tự áp giới hạn" + giới hạn thật của trình duyệt + FR-3 "không có nút Lưu" (K-3) — khi ghi thất bại thì không có đường thoát nào PRD cho phép | high |
| 3 | NFR-1 (≤ 2s khởi động, 2.000 ghi chú) + NFR-2 (≤ 200ms tra cứu) + ràng buộc 1 (lưu sẵn dạng chuẩn hóa) + K-3 (ngân sách dung lượng): bốn thứ này kéo nhau. Dựng chỉ mục lúc nạp thì hại NFR-1; lưu chỉ mục xuống đĩa thì hại dung lượng và đường ghi 1 giây. **Ở quy mô 2.000 thì cả bốn cùng đạt được** — nhưng chỉ vì quy mô nhỏ, nên K-10 (con số nào là thật) mới quan trọng đến vậy | medium |
| 4 | FR-17 (nhắc thụ động, không tắt được) + NT-3/FR-9 (không rác trên màn hình) — xem U-4 | medium |

---

## 3. VAI 3 — `bmad-create-epics-and-stories`

### 3.1 Làm được gì ngay

Định dạng FR của PRD này gần như là định dạng story sẵn: mỗi FR có một câu mô tả + một danh sách
"Kiểm chứng được" mà phần lớn chép thẳng sang được thành tiêu chí nghiệm thu. Bảng mô hình trạng
thái ở FR-14 tự nó là một bộ test. §8 Non-Goals và §9.2 cho tôi viết được phần "ngoài phạm vi" của
từng story mà không phải đoán.

**Băm được ngay, không cần hỏi (15/17):** FR-1, FR-2, FR-3, FR-4, FR-6, FR-7, FR-9, FR-10, FR-11,
FR-12, FR-13, FR-14, FR-15, FR-16, FR-17 — với lưu ý ở S-4 về FR-17.

### 3.2 Thiếu, mơ hồ, quá to

#### S-1 · Cần một epic nền tảng mà không FR nào phủ — **critical**
**Ở đâu:** không ở đâu cả (suy ra từ §11 mục 3, 5 và addendum ràng buộc 7).

Những story sau **bắt buộc phải có** để sản phẩm chạy được, nhưng không truy vết được về bất kỳ FR
nào — nghĩa là hoặc epic sẽ thiếu chúng, hoặc tôi phải tự bịa ra FR mới, và một FR do người băm story
tự bịa thì không ai duyệt:

1. Mô hình dữ liệu + tầng lưu trữ (nền của toàn bộ phần còn lại).
2. Vòng đời khởi động app (xem K-14).
3. Xử lý lỗi ghi / hết dung lượng (K-3).
4. Hành vi đa tab (K-8).
5. Di trú lược đồ dữ liệu khi cập nhật app (K-13).

**Câu hỏi:** những mục này được PRD hóa thành FR mới, hay được ủy quyền cho ARCHITECTURE.md và tôi
băm story từ đó?

#### S-2 · FR-5 không băm được — **critical**
**Ở đâu:** §5.1 FR-5.

Tiêu chí nghiệm thu số một là "khi người dùng **rời khỏi** một ghi chú rỗng" — mà "rời khỏi" chưa
được định nghĩa (U-5). Tôi không viết được một test nào từ câu này. Và vì đây là ngoại lệ duy nhất
của FR-11, đoán sai là tạo ra một đường mất dữ liệu không xác nhận.

#### S-3 · FR-8 phải chờ UX — **high**
**Ở đâu:** §5.2 FR-8, A-2, A-3.

Cả bốn tiêu chí đều phụ thuộc vào những thứ chỉ DESIGN.md mới chốt được: cách đếm dòng, "chiều cao
trần" nghĩa là gì, "dấu hiệu" là cái gì (U-3), và mở rộng có phải là sửa không (U-2). Story này viết
ra bây giờ sẽ phải viết lại.

#### S-4 · FR-17 có tiêu chí quá mỏng và thiếu một mảnh quan trọng — **high**
**Ở đâu:** §5.5 FR-17, A-9.

Ba tiêu chí hiện có: app ghi nhớ thời điểm xuất gần nhất; hiện ở dạng một dòng nhỏ; ngưỡng 7 ngày
(giả định). Thiếu: **thời điểm xuất gần nhất được lưu ở đâu, và nó có nằm trong file sao lưu không?**
Nếu nó chỉ nằm trong trình duyệt thì sau UJ-3 (cài lại máy, nạp file) app sẽ tin rằng "chưa từng sao
lưu" hoặc "vừa sao lưu" tùy cách cài đặt mặc định — cả hai đều sai. Đây không phải chi tiết vặt: nó
là cái phanh duy nhất chống lại rủi ro số một, và chính PRD gọi FR-17 là "chỗ mỏng nhất của sản phẩm".

#### S-5 · Sáu FR quá to, phải tách — **high**

| FR | Tách thành | Vì sao |
|---|---|---|
| FR-16 | 3 story | Chọn/đọc file · phân tích + kiểm tra phiên bản + xác thực (đường lỗi "không đụng một chữ nào" là một story riêng đúng nghĩa) · gộp theo định danh |
| FR-12 | 3 story | Ô tìm kiếm + lọc dần · khớp không dấu, không phân biệt hoa thường (đây là nơi NFR-6 và NFR-2 được nghiệm thu) · trạng thái không có kết quả |
| FR-3 | 2 story | Cơ chế tự lưu (đường ghi) · khôi phục ghi chú gõ dở sau khi phiên bị ngắt (đường đọc) — hai đường khác nhau, test khác nhau |
| FR-14 | 2 story | Mô hình trạng thái + kết hợp điều kiện · hiển thị điều kiện đang áp dụng + đường về |
| FR-8 | 2 story | Cắt/hiển thị · mở rộng tại chỗ |
| FR-15 | 2 story | Sinh và tải file · ghi nhận thời điểm xuất gần nhất (phụ thuộc S-4) |

#### S-6 · Thứ tự phụ thuộc không được viết ra — **high**
**Ở đâu:** §9.1 liệt kê phạm vi nhưng không xếp thứ tự; chỉ có một câu về thứ tự trong toàn PRD.

Những phụ thuộc bắt buộc mà PRD không nói:

- **Nền tảng (S-1) trước tất cả.** Không có nó thì không FR nào chạy được.
- **FR-2 (định danh + thời điểm tạo) trước** FR-6, FR-7, FR-13, FR-16 — cả bốn đều dựa vào nó.
- **NFR-6 là phụ thuộc ẩn của FR-3.** Nếu tầng dữ liệu phải lưu sẵn dạng chuẩn hóa (addendum ràng
  buộc 1), thì đường ghi của FR-3 phải ghi nó **ngay từ story tự lưu**. Làm FR-3 trước rồi mới nghĩ
  tới chuẩn hóa khi làm FR-12 nghĩa là sửa lại đường ghi **và** di trú dữ liệu đã có. PRD nói NFR-6
  phải được biết "từ đầu" nhưng không nói "từ đầu" nghĩa là từ story nào.
- **FR-15 trước FR-16** (FR-16 nạp đúng định dạng FR-15 sinh ra) và **FR-15 trước FR-17**.
- **FR-12 và FR-13 trước FR-14** (FR-14 là sự kết hợp của hai cái kia).
- **FR-6/FR-7 trước FR-13** (lọc ngày là biến thể của khung nhìn).
- **FR-4 trước FR-5** (FR-5 định nghĩa một phần hành vi qua `Ctrl+Enter`).

Điều duy nhất PRD nói về thứ tự — §5.4: "F4 không được xếp sau và không được cắt bớt khi hết thời
gian" — đọc theo nghĩa đen thì **xung đột** với các phụ thuộc trên (F4 cần dữ liệu, định danh và chỉ
mục có sẵn). Tôi đọc câu đó là "F4 không được cắt bớt phạm vi", không phải "F4 làm trước". Cần xác nhận.

#### S-7 · UJ-2 đòi năng lực không có FR — **medium**
Xem U-7. Với tôi, hệ quả cụ thể: tôi không có tiêu chí nghiệm thu nào cho hành vi "gỡ một điều kiện,
giữ điều kiện kia", nên story FR-14 sẽ được nghiệm thu là ĐẠT trong khi UJ-2 vẫn hỏng.

#### S-8 · Nhiều tiêu chí là phủ định thuần túy — **medium**
**Ở đâu:** FR-1 ("không có nút Tạo mới"), FR-3 ("không có nút Lưu"), FR-7 ("không có cách nào đổi
thứ tự"), FR-9 (ba câu "không"), FR-13 ("không có mốc nhanh").

Chúng nghiệm thu được, nhưng không sinh ra việc để làm. Nếu tôi biến mỗi cái thành một story thì
sprint đầy story rỗng. Đề nghị: gom thành một **checklist nguyên tắc** gắn vào từng epic, kiểm ở
review chứ không phải một story.

**Câu hỏi:** cách xử lý này có được chấp nhận không?

#### S-9 · NFR không được gán vào story nào — **medium**
**Ở đâu:** §7, §10.

NFR-1 (≤ 2s), NFR-2 (≤ 200ms), NFR-3, NFR-4 là ràng buộc xuyên suốt, nhưng nếu không gán làm tiêu
chí nghiệm thu của một story cụ thể thì chúng sẽ không bao giờ được đo. SM-2 và SM-3 gợi ý cách gán
(SM-2 → FR-1/NFR-1, SM-3 → FR-12/13/14) nhưng chỉ là gợi ý.

**Câu hỏi:** NFR được nghiệm thu như story riêng ("story hiệu năng"), hay là tiêu chí bổ sung gắn vào
story chức năng tương ứng?

**Tổng vai Stories: 9 finding** — critical 2 · high 4 · medium 3.

### 3.3 Ước lượng số story

Khoảng **26 story** (dải hợp lý **22–28**), chia làm **6 epic**:

| Epic | Nguồn | Story |
|---|---|---|
| **E0 · Nền tảng** | không có FR (S-1) | 5 — mô hình dữ liệu + lưu trữ · khởi động app · lỗi ghi/hết dung lượng · đa tab · di trú lược đồ |
| **E1 · Ghi nhanh** (F1) | FR-1..FR-5 | 6 — FR-1 (1) · FR-2 (1) · FR-3 (2) · FR-4 (1) · FR-5 (1) |
| **E2 · Dòng ghi chú** (F2) | FR-6..FR-9 | 5 — FR-6 (1) · FR-7 (1) · FR-8 (2) · FR-9 (1) |
| **E3 · Sửa & Xóa** (F3) | FR-10, FR-11 | 2 |
| **E4 · Tra cứu** (F4) | FR-12..FR-14 | 6 — FR-12 (3) · FR-13 (1) · FR-14 (2) |
| **E5 · Sao lưu & Khôi phục** (F5) | FR-15..FR-17 | 6 — FR-15 (2) · FR-16 (3) · FR-17 (1) |
| | | **30** |

Trừ đi phần gộp được (FR-9 gần như là tiêu chí của FR-6 hơn là story riêng; hai story nhỏ của E3 có
thể nhập một; một số story phủ định gom vào checklist theo S-8) → **26**.

Con số này **chưa tính** các story phát sinh nếu K-1/K-2 trả lời theo hướng bất lợi (ví dụ: phải làm
service worker, hoặc phải tìm đường lưu trữ thay thế vì IT chặn) — trường hợp đó cộng thêm 3–5 story
vào E0.

---

## 4. Kiểm tra cơ học

### 4.1 Tính liên tục và duy nhất của mã

| Hệ mã | Kết quả |
|---|---|
| **FR-1 … FR-17** | ✅ Liên tục, duy nhất, không trùng, không nhảy số. Phân bố: F1 = FR-1..5, F2 = FR-6..9, F3 = FR-10..11, F4 = FR-12..14, F5 = FR-15..17. |
| **NFR-1 … NFR-7** | ✅ Liên tục, duy nhất (§7). |
| **NT-1 … NT-4** | ✅ Liên tục, duy nhất (§3). |
| **UJ-1 … UJ-3** | ✅ Liên tục, duy nhất (§6). Nhưng truy vết không kín — xem M-2, M-3. |
| **SM-1 … SM-5** | ✅ Liên tục, duy nhất (§10). Hai phản thước đo dùng hệ mã riêng **SM-C1, SM-C2** — không xung đột với dãy SM-N, hợp lý. |
| **A-1 … A-10** | ✅ Liên tục, duy nhất (§12). |

### 4.2 Tham chiếu chéo

Đã rà từng tham chiếu trong cả hai tài liệu. **Tất cả đều giải được** — mọi mã FR/NFR/NT/UJ/SM và
mọi số mục §N được nhắc tới đều tồn tại. Hai liên kết ngoài đã được kiểm tra trên đĩa và tồn tại thật:
`../../briefs/brief-sticky-notes-2026-09-08/brief.md` và `.../addendum.md`.

Addendum §1 tham chiếu FR-12, NFR-6, FR-3, NFR-2, FR-16, FR-15, NFR-4, "Open Question 3" — tất cả
giải được. Addendum §2.1–2.9 tham chiếu FR-10, FR-11, FR-6, FR-4, FR-3, FR-12, FR-14, FR-15, FR-16
— tất cả giải được.

§9.1 MVP Scope liệt kê đủ **17/17** FR, không thiếu, không thừa.

Bốn sai lệch nhỏ, không có sai lệch nào làm gãy tham chiếu:

#### M-1 · §0 chỉ sai địa chỉ câu trả lời — **medium**
§0 viết: "Ba câu hỏi mở mà brief cố ý để lại đều đã được trả lời ở đây: ... **độ dài một ghi chú
(§5.1)**." Đã đối chiếu với brief (Open Question 3: *"Một card dài bao nhiêu? Một dòng, một đoạn, hay
tự do?"*). §5.1 **không** trả lời câu này ở bất cứ đâu. Câu trả lời thực tế ("tự do, nhiều dòng") nằm
ở §4 Glossary và §9.1. Hai câu hỏi kia (§5.5, §5.4) thì khớp đúng. Không chỉ là lỗi chỉ mục: nó che
mất việc **không có trần độ dài** — xem K-7.

#### M-2 · §5.1 khai một hành trình mà không FR nào gánh — **medium**
§5.1 mô tả F1 kết bằng "*Hiện thực UJ-1, UJ-2*", nhưng không FR nào trong F1 (FR-1..FR-5) nhắc tới
UJ-2; cả năm FR chỉ trỏ về UJ-1 hoặc không trỏ đâu. UJ-2 (tra cứu để xác minh) được gánh bởi F4.
Khi băm epic theo hành trình, chỗ này sinh ra truy vết giả.

#### M-3 · §5.3 (F3) không gắn với hành trình nào — **medium**
FR-10 và FR-11 không có dòng "*Hiện thực UJ-N*" nào, và mô tả F3 cũng không. §6 nói "Ba hành trình
dưới đây là **toàn bộ** những gì sản phẩm phục vụ" — nếu đúng vậy thì sửa và xóa phải thuộc về một
hành trình nào đó, hoặc §6 cần một câu thừa nhận rằng F3 phục vụ mọi hành trình.

#### M-4 · §9.1 gán nhãn sai một dòng — **low**
"Ghi chú dài bị cắt, mở rộng tại chỗ *(FR-8, FR-9)*" — FR-9 là trạng thái rỗng, không liên quan gì
tới việc cắt ghi chú dài. FR-9 vẫn được liệt kê (nhờ chính dòng này) nên §9.1 không thiếu FR nào,
nhưng nhãn thì sai.

### 4.3 §12 Assumptions Index có khớp hai chiều không

**Có. Khớp hai chiều đầy đủ, 10 ↔ 10.** Đã rà từng nhãn `[ASSUMPTION]` trong thân bài:

| Nhãn trong thân bài | Dòng | Mục §12 | Khớp |
|---|---|---|---|
| "hôm nay tính theo mốc 00:00 giờ của máy" | 230 | A-1 (FR-6) | ✅ |
| "3 dòng" | 243 | A-2 (FR-8) | ✅ |
| "trạng thái mở rộng không được nhớ giữa các phiên" | 248 | A-3 (FR-8) | ✅ |
| "lọc dần theo từng ký tự gõ" | 313 | A-4 (FR-12) | ✅ |
| "một ngày duy nhất, không phải khoảng ngày" | 325 | A-5 (FR-13) | ✅ |
| "tải lại trang thì mọi điều kiện bị xóa" | 340 | A-6 (FR-14) | ✅ |
| `[ASSUMPTION]` trần — số phiên bản định dạng | 370 | A-7 (FR-15) | ✅ |
| `[ASSUMPTION]` trần — tên file chứa ngày xuất | 371 | A-8 (FR-15) | ✅ |
| "chỉ hiện khi đã quá 7 ngày chưa sao lưu" | 397 | A-9 (FR-17) | ✅ |
| "trình duyệt cụ thể chưa xác định" | 459 | A-10 (NFR-7) | ✅ |

Không có nhãn nào trong thân bài thiếu trong §12; không có mục nào trong §12 không có nhãn tương ứng
trong thân bài. Cột "Ở đâu" của §12 chỉ đúng FR/NFR trong cả 10 trường hợp.

Hai ghi chú nhỏ:

#### M-5 · A-7 và A-8 là nhãn trần — **low**
Hai nhãn ở dòng 370–371 chỉ là `[ASSUMPTION]` không kèm nội dung trong ngoặc, khác với tám nhãn còn
lại. Đọc riêng dòng đó thì không biết cái gì đang được giả định — phải tra ngược §12. Nên thống nhất
một kiểu.

### 4.4 Hai hệ chú thích không có mã

#### M-6 · §11 Open Questions không có mã — **low**
Năm câu hỏi mở được đánh số 1–5 nhưng không có tiền tố mã (không phải `OQ-1..OQ-5`), trong khi mọi
thứ khác trong tài liệu đều có mã. Addendum tham chiếu bằng chữ "Open Question 3" — tham chiếu theo
thứ tự, sẽ gãy nếu ai đó chèn thêm hoặc sắp xếp lại. Đây là chính xác loại vấn đề mà §0 nói mã FR
sinh ra để tránh ("để các tài liệu sau tham chiếu được kể cả khi nhóm bị sắp xếp lại").

#### M-7 · `[NOTE FOR PM]` không có mã và không được gom — **low**
Có ba khối `[NOTE FOR PM]` (FR-11, FR-17, §9.2). Chúng chứa nội dung có giá trị thật (kế hoạch B đã
định sẵn cho hai rủi ro đã biết), nhưng không có mã, không có index, và không được nhắc trong §12 hay
§11. Sáu tháng nữa chúng sẽ bị đọc lướt qua.

**Tổng kiểm tra cơ học: 7 finding** — medium 3 · low 4. Không có finding critical hay high: **về mặt
cơ học, tài liệu này rất chặt.** Sáu hệ mã liên tục và duy nhất, mọi tham chiếu chéo giải được, index
giả định khớp hai chiều tuyệt đối. Các vấn đề thật đều nằm ở nội dung, không ở cấu trúc.

---

## 5. Bảng tổng hợp finding

| Vai | critical | high | medium | low | Tổng |
|---|---|---|---|---|---|
| UX | 2 | 5 | 5 | 2 | 14 |
| Architecture | 2 | 7 | 6 | 1 | 16 |
| Epics & Stories | 2 | 4 | 3 | 0 | 9 |
| Cơ học | 0 | 0 | 3 | 4 | 7 |
| **Tổng** | **6** | **16** | **17** | **7** | **46** |

### Sáu finding critical, gom lại

| Mã | Vai | Nội dung |
|---|---|---|
| K-1 | ARCH | Mô hình phân phối ứng dụng (`file://` / hosted / PWA) chưa từng được nêu |
| K-2 | ARCH | Trình duyệt + chính sách IT chưa xác định (đã ghi nhận ở §11 mục 2) |
| U-1 | UX | "Ô soạn thảo" là composer riêng hay ghi chú tại chỗ trong dòng |
| U-2 | UX | "Mở rộng để đọc" và "sửa" là một cử chỉ hay hai |
| S-1 | STORY | Epic nền tảng (lưu trữ, khởi động, lỗi ghi, đa tab, di trú) không có FR nào phủ |
| S-2 | STORY | FR-5 không băm được vì "rời khỏi" không được định nghĩa |

### Thứ tự đề nghị để gỡ

1. **Hỏi người dùng ngay (chặn architecture):** K-1, K-2. Hai câu này hỏi được trong một buổi, và
   không có chúng thì `bmad-architecture` chỉ ra được thiết kế có điều kiện.
2. **PM chốt trên giấy (chặn UX):** U-1, U-2, U-5/S-2, U-7 — bốn quyết định sản phẩm, không cần dữ
   liệu ngoài.
3. **Bổ sung vào PRD trước khi băm story:** S-1 (một nhóm FR mới cho nền tảng, hoặc ủy quyền tường
   minh cho ARCHITECTURE.md), S-4 (thời điểm sao lưu gần nhất lưu ở đâu), K-3 (hành vi khi ghi thất
   bại), K-8 (đa tab).
4. **Sửa vặt khi tiện tay:** M-1 tới M-7.

---

*Thẩm định thực hiện ngày 2026-09-09 trên `prd.md` (bản 2026-09-08, 587 dòng) và `addendum.md`
(bản 2026-09-08, 174 dòng).*
