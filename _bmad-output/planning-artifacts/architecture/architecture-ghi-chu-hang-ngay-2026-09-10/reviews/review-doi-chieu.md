---
title: 'Review đối chiếu — ARCHITECTURE-SPINE vs PRD & UX'
type: review
target: ../ARCHITECTURE-SPINE.md
against:
  - ../../../prds/prd-ghi-chu-hang-ngay-2026-09-08/prd.md
  - ../../../ux-designs/ux-Sticky Notes-2026-09-09/EXPERIENCE.md
  - ../../../ux-designs/ux-Sticky Notes-2026-09-09/DESIGN.md
reviewer: 'đối chiếu đầu vào'
date: '2026-09-10'
---

# Review đối chiếu — cái gì spine đã đánh rơi

## Verdict

Spine chắc ở tầng **dữ liệu và luồng ghi** — AD-1…AD-12 phủ gần trọn F5, NFR-3, NFR-6, NFR-8 và
đóng được hai câu hỏi mở của PRD. Nhưng nó **gần như không chạm tới tầng view**: mọi lời hứa hành vi
mà EXPERIENCE.md coi là ràng buộc cứng — im lặng khi thành công, hai trần số (50 kết quả / 20.000 ký
tự), trạng thái phù du, tab title, sàn accessibility — đều rơi xuống một khoảng trống giữa
"AD-1 cấm view giữ state" và "không AD nào nói ai giữ thay". Cộng thêm **ba mâu thuẫn thật** với UX,
trong đó một cái (đồng bộ bản nháp đa tab) phá thẳng FR-20.

Nói gọn: spine đủ để bắt đầu viết `core/`, **chưa đủ** để bắt đầu viết `view/`.

---

## 1. Ba mâu thuẫn với PRD/UX

### M-1 · [NẶNG] AD-7 đồng bộ bản nháp đa tab → phá đúng điều FR-20 đòi bảo vệ

AD-7: *"mọi thao tác ghi thành công — chốt, sửa, xóa, nạp lại, **đổi bản nháp**/theme — phải phát một
tin lên BroadcastChannel… Tab nhận tin **nạp lại từ nguồn sự thật rồi render lại**."*

Ghép với FR-3 (bản nháp tự lưu ≤ 1 giây trong lúc gõ), hệ quả là: Nam gõ ở tab A → mỗi giây một tin
phát đi → tab B nạp lại `ghichu.draft` và **render lại ô soạn thảo của chính nó**, đè lên chữ Nam
đang gõ dở ở tab B (và thổi bay vị trí con trỏ). Nếu Nam gõ ở cả hai tab thì hai bản nháp lần lượt
ghi đè nhau.

PRD FR-20 nói nguyên văn: *"Bản nháp (FR-3) ở tab này **không bị tab kia xóa mất**."* AD-7 là cơ chế
gây ra đúng kiểu hỏng đó, chứ không phải cơ chế ngăn nó.

Thêm nữa, Glossary PRD: *"Tại một thời điểm chỉ tồn tại **tối đa một bản nháp**."* — với hai tab,
hoặc bản nháp là **một** (và phải đồng bộ, tức là mất chữ), hoặc là **per-tab** (và Glossary sai).
Spine chưa chọn, mà lại phát biểu như thể đã chọn cái thứ nhất.

**Cần:** một AD tách riêng ba lớp state theo phạm vi — *bền & dùng chung* (ghi chú, theme,
lastBackupAt: đồng bộ qua BroadcastChannel), *bền & riêng tab* (bản nháp: KHÔNG đồng bộ, hoặc dùng
`sessionStorage`, hoặc key mang tab-id), *phù du & riêng tab* (điều kiện lọc, mở rộng, dải băng, chế
độ sửa: không lưu, không phát). Không có lớp giữa này thì AD-7 và FR-20 không thể cùng đúng.

### M-2 · [NẶNG] Dải băng loại 2 "Đang mở app ở một tab khác" đã chết — nhưng UX chưa biết

Xác nhận: đúng như đã nêu. AD-7 chốt đồng bộ thật và **cấm tường minh** dải băng "đóng tab này". Vậy
FR-20 được thỏa bằng nhánh *"bảo đảm bằng cơ chế kỹ thuật"*, và nhánh *"phải cảnh báo"* không còn áp
dụng.

Nhưng microcopy loại 2 không nằm ở một chỗ trong EXPERIENCE.md — nó nằm ở **bốn chỗ**, và cả bốn đều
phải sửa, cộng một chỗ trong DESIGN.md:

| Tài liệu | Chỗ | Phải đổi thành |
|---|---|---|
| EXPERIENCE.md · Voice and Tone | hàng 2 bảng "bốn loại" | xóa hàng; bảng còn **ba loại** (1, 1b, 3, 4 → đánh lại) |
| EXPERIENCE.md · Component Patterns · Dải băng | *"Một dải dùng chung cho cả **bốn** loại"* và *"loại 1 … và loại 2 (tab thứ hai) không tự đóng"* | ba loại; chỉ loại 1 không tự đóng |
| EXPERIENCE.md · State Patterns · Lỗi | *"Bất kỳ loại nào trong **bốn** loại"* | ba loại |
| EXPERIENCE.md · Interaction Primitives · bảng phản hồi | hàng *"Tab thứ hai — **Ồn ào**. Dải băng. Im lặng không phải một lựa chọn (FR-20)"* | xóa hàng, **hoặc** đổi thành *"Tab thứ hai — im lặng. Đồng bộ thật (AD-7): thao tác ở tab kia hiện ra ở tab này không cần báo"* |
| DESIGN.md · Components · Dải băng | *"**bốn** loại thông báo dùng chung đúng một hình dạng"* | ba loại |

**Cảnh báo phụ, chưa ai xử:** khi tab B tự động render lại vì tab A vừa xóa một ghi chú, **màn hình
Nam đang nhìn thay đổi mà không do Nam làm gì**. Bảng phản hồi của EXPERIENCE ("im lặng khi thành
công") viết cho tác nhân là chính Nam ở chính tab đó. Đồng bộ thật tạo ra một loại sự kiện mới —
*thay đổi do tab khác gây ra* — mà cả spine lẫn UX đều chưa có chỗ nói nó có được im lặng hay không.
Đề xuất: im lặng (nhất quán với Voice and Tone), nhưng phải **ghi tường minh** ở một trong hai tài
liệu, vì đây chính xác là loại quyết định "âm thầm" mà không ghi thì mỗi người code một kiểu.

### M-3 · [VỪA] Ngưỡng cảnh báo dung lượng: spine 20%, UX 10%

- AD-10: `usage / quota ≥ 0.80` → dải băng cảnh báo trước ngưỡng, tức **còn ~20%**.
- EXPERIENCE.md loại 1b: `Dung lượng còn khoảng 10%. Xuất sao lưu trước khi nó hết.`

Hai con số này mâu thuẫn trực tiếp; một trong hai phải đổi. Ghi chú: microcopy 1b đã tự gắn nhãn
`[ASSUMPTION]` và nhường con số cho `bmad-architecture`, nên **spine thắng** — nhưng chỉ khi ai đó
đi sửa microcopy. Nếu không, code sẽ bắn dải băng ở 80% với dòng chữ nói 10%, và Nam sẽ tin dòng chữ.

Kèm theo: PRD Open Question 3 đòi *"tính từ FR-18 (20.000 ký tự/ghi chú) và mốc 2.000 ghi chú"*.
AD-10 trả lời bằng một **tỉ lệ tương đối** đo lúc chạy — đó là cách tốt hơn — nhưng nó **không** trả
lời vế "bao giờ thì chạm": 2.000 × 20.000 ký tự ≈ 40 MB tối đa lý thuyết (thực tế thấp hơn nhiều
bậc). Phép tính đó nên nằm trong spine một dòng, vì nó là thứ quyết định trần 20.000 có phải một con
số an toàn không. **OQ3 mới đóng được một nửa.**

### M-4 · [VỪA] AD-8 nói dải băng là nơi lỗi DUY NHẤT — UX có một lỗi inline

AD-8: *"lỗi đi ra **dải băng dùng chung** — nơi duy nhất lỗi được phép xuất hiện."*

EXPERIENCE.md · State Patterns · Lỗi: *"không lỗi inline **ngoài ô ngày sai định dạng**"*, và
Component Patterns · Ô ngày: *"sai định dạng thì viền `{colors.danger}` + thông báo dưới ô, dòng ghi
chú không đổi"*. Accessibility Floor mục 6 lấy chính cặp này làm ví dụ ràng buộc cứng.

Cần AD-8 nêu ngoại lệ tường minh, kèm lý do phân biệt: *lỗi hệ thống* (adapter ném ra, người dùng
không gây trực tiếp) → dải băng; *lỗi nhập liệu tại chỗ* (chuỗi ngày chưa hợp lệ) → cạnh ô, và
**không** phải là `Error` có `code`, mà là trạng thái validation của một điều kiện chưa áp dụng
được. Không nói rõ, sẽ có người đẩy "ngày sai định dạng" thành `code: BAD_DATE` và bắn lên đỉnh
trang — phá luôn ràng buộc *"dòng ghi chú không đổi"*.

---

## 2. Những yêu cầu "âm thầm" đã rơi

### R-1 · [NẶNG] Không cấu trúc nào bảo đảm "im lặng khi thành công"

Đây là lời hứa xương sống của cả EXPERIENCE.md (Voice and Tone, bảng Phản hồi, State Patterns "Bản
nháp chưa chốt: **KHÔNG có dấu hiệu nào**") và của NT-1/NT-3. Spine chỉ có **nửa nghịch** của nó:
AD-8 nói lỗi phải ồn ào và đi ra một chỗ. **Không có AD nào cấm phản hồi khi thành công.**

Hệ quả cụ thể, đều là những thứ một dev thiện chí sẽ thêm vào:
- một toast "đã lưu" sau `chotGhiChu`;
- một chỉ báo "đang lưu…/đã lưu" cạnh ô soạn thảo (FR-3 nói ≤ 1 giây, rất dễ sinh ra spinner);
- một chấm nhỏ báo "bản nháp chưa chốt" — thứ mà State Patterns cấm bằng chữ in hoa;
- một đếm ký tự khi tới gần trần 20.000 — cũng bị cấm bằng chữ.

**Cần một AD ngược chiều AD-8:** *thành công không sinh phần tử giao diện nào; bằng chứng duy nhất
là kết quả tự nó (mẩu giấy xuất hiện, ô trống lại, file tải xuống). Ngoại lệ duy nhất và đã liệt kê
đủ: dải băng nạp lại thành công.* Không có phát biểu này, "im lặng" không phải ràng buộc kiến trúc
— nó chỉ là một câu văn trong tài liệu UX, và nó sẽ không sống qua tuần thứ ba.

Kèm theo, **ngoại lệ nạp lại chưa được ai gánh**: microcopy `Đã nạp 128 ghi chú, bỏ qua 340 ghi chú
đã có.` đòi **hai con số thật**. AD-11 mô tả phép gộp nhưng không nói `core/backup.js` phải **trả về**
`{ added, skipped }`. Đó là một chữ ký hàm, và nó là thứ duy nhất làm microcopy đó khả thi.

### R-2 · [NẶNG] Trần 50 kết quả: có hằng số, không có người giữ lời hứa

`limits.js` chứa số 50. Hết. Không AD nào, không convention nào nói ai cắt, ai đếm.

Lời hứa thật ra gồm **ba** mảnh, và mảnh thứ hai là mảnh dễ rơi nhất:
1. chỉ **hiển thị** 50 mẩu;
2. biết **có nhiều hơn 50** — tức phải có tổng số khớp thật, chứ không phải "mảng dài đúng 50";
3. hàng chip hiện `N ghi chú` với **N là số thật**, không phải 50 (EXPERIENCE: *"con số viết theo số
   kết quả thật"*; UJ-2 đường hỏng thứ hai: `phan` → **63 kết quả**, hiện 50).

Nếu `core/query.js` trả về một mảng đã cắt sẵn, mảnh 2 và 3 chết ngay, và chip sẽ nói `50 ghi chú`
trong khi có 63. Nếu query trả về **tất cả** rồi để `view/grid.js` tự cắt, thì AD-1 ("view không tự
quyết") bị vi phạm và NT-3 phụ thuộc vào kỷ luật của một vòng lặp render.

**Cần:** AD-6 nói rõ query trả về `{ items: <≤50>, total: <số thật> }` — và rằng trần này là ràng
buộc **của core**, không phải của view. Đây đúng là chỗ NT-3 sống hay chết: *"không khung nhìn nào
được phép trả về một danh sách dài vô hạn."*

### R-3 · [NẶNG] Trần 20.000 ký tự: không biết chặn ở đâu, và không có hình dạng lỗi cho nó

`limits.js` chứa số 20.000. Nhưng:

- **Chặn ở đâu?** EXPERIENCE.md · Ô soạn thảo: *"Chạm trần 20.000 ký tự: **không nhận thêm ký tự**,
  hiện dải băng loại 4"* — tức là chặn **tại lúc gõ**, ở view, trước khi có bất kỳ action nào. Điều
  đó va vào AD-1 (view không tự quyết) và không có chỗ đứng trong luồng "view phát action → core
  đổi state".
- **Chặn ở mấy chỗ?** FR-18 nói về "một ghi chú", nên trần áp cho **cả ô soạn thảo lẫn mẩu giấy đang
  ở chế độ sửa** (FR-10 sửa tự do). Spine không nhắc chế độ sửa lấy một chữ.
- **Lỗi hình dạng gì?** Bảng "Hình dạng lỗi" liệt kê đúng bốn code: `QUOTA`, `BAD_FILE`,
  `BAD_VERSION`, `DB` — **tất cả đều là lỗi adapter ném ra**. Vượt trần ký tự không đến từ adapter,
  nên nó **không có code**, và theo AD-8 nó cũng không có đường hợp lệ nào ra dải băng. Nhưng
  microcopy loại 4 tồn tại và bắt buộc.
- **Nạp file thì sao?** AD-11 liệt kê điều kiện từ chối file: sai `schemaVersion`, JSON hỏng, thiếu
  trường. **Không có** "ghi chú dài quá 20.000 ký tự". Vậy một file sao lưu tự tay sửa có thể nhét
  vào kho một ghi chú 1 triệu ký tự, đi vòng qua trần. Với AD-6 (nạp hết vào RAM) thì đó cũng là
  đường ngắn nhất làm gãy NFR-1.

**Cần:** AD-8 (hoặc một AD mới) mở rộng phân loại lỗi thành hai họ — *lỗi từ thế giới* (adapter, có
`code`) và *lỗi ràng buộc miền* (core tự phát hiện: vượt trần, ngày không hợp lệ), cùng nói ai kiểm
tra ở đâu và cả hai đi ra dải băng thế nào.

### R-4 · [NẶNG] Không có AD nào cho **state phù du** — nên A-3, A-6 và cả tầng view treo lơ lửng

AD-1 nói: *"View không được ghi vào state, không được **giữ state riêng của nó**."* AD-3 nói kho bền
chỉ có ghi chú (IndexedDB) + đúng ba key localStorage.

Vậy những thứ sau **không có nhà**:

| Thứ | Nguồn | Hiện đang ở đâu trong spine |
|---|---|---|
| Điều kiện đang bật (từ khóa, ngày) | FR-14, bảng mô hình trạng thái | không đâu |
| Mẩu nào đang mở rộng (A-3) | FR-8 | không đâu |
| Mẩu nào đang ở chế độ sửa | FR-10, EXPERIENCE Component Patterns | không đâu |
| Dải băng nào đang hiện | FR-19, AD-8 | không đâu |
| Chuỗi đang gõ trong ô ngày, và trạng thái "sai định dạng" | EXPERIENCE Ô ngày | không đâu |

Chúng phải nằm trong `core/state.js` (theo AD-1), nhưng AD-3 lại chỉ nói về **lưu trữ**, không nói
về **state trong RAM**, nên không ai bị cấm nhét chúng vào `localStorage` — và nếu ai nhét, **A-3
("trạng thái mở rộng không nhớ giữa các phiên") và A-6 ("tải lại trang xóa mọi điều kiện") gãy trong
im lặng**. Hiện A-3 và A-6 chỉ đúng **tình cờ**, nhờ AD-3 giới hạn ba key. Một lời hứa đúng nhờ tình
cờ thì không phải một lời hứa.

**Cần:** một AD phát biểu ba lớp phạm vi state (xem M-1), và nói thẳng: *state phù du sống trong
`core/state.js`, không bao giờ được ghi xuống bất kỳ kho nào; tải lại trang = state phù du về mặc
định — đó chính là cơ chế thực thi A-3 và A-6.*

### R-5 · [VỪA-NẶNG] Sàn accessibility rơi trọn vẹn

EXPERIENCE.md · Accessibility Floor gọi sáu điều là **"ràng buộc cứng"**. Spine không có một dòng
nào cho bất kỳ điều nào trong sáu:

1. tương phản ≥ 4.5:1 cả hai theme (DESIGN.md còn cảnh báo cặp `danger`/`chip-bg` dark chỉ 4.55:1 —
   *"ai đổi thì phải tính lại trước khi commit"*, một ràng buộc quy trình không được ghi ở đâu trong
   spine);
2. **`outline: none` bị cấm tuyệt đối** — đây đúng là loại quy tắc thuộc về Consistency Conventions,
   và `style.css` trong Structural Seed chỉ được mô tả là *"token màu/spacing từ DESIGN.md"*;
3. tab order tường minh, gồm cả vị trí lạ của nút `✕` (đứng **trước** ô soạn thảo) và nhãn `đóng
   thông báo`;
4. zoom 200% dùng được;
5. `prefers-reduced-motion`;
6. không dùng màu làm tín hiệu duy nhất.

Cộng thêm hai điều thuộc `view/dialog.js` mà spine không nhắc, và cả hai là **cơ chế chống mất dữ
liệu**, không phải trang trí:
- **focus mặc định của hộp thoại xóa đặt vào `hủy`** — EXPERIENCE nêu lý do: *"một phát `Enter` theo
  phản xạ không được phép là một phát xóa"*;
- **focus trap + trả focus về nút xóa vừa bấm khi đóng**.

Bảng Capability → Architecture Map cũng không có dòng nào cho accessibility, nên khi nghiệm thu sẽ
không có ai bị hỏi về nó.

### R-6 · [VỪA] Tab title `[OVERRIDE-2]` — vắng mặt hoàn toàn

Không xuất hiện một lần nào trong spine: không AD, không convention, không file trong Structural
Seed, không dòng trong Capability Map. Nhưng nó là một **override đã được ghi tường minh ở cả
DESIGN.md lẫn EXPERIENCE.md**, và UJ-1 bước 2 *phụ thuộc vào nó* (*"bước 2 của UJ-1 sẽ hỏng nếu
không có nó"*).

Nó cũng không tầm thường, vì có một bẫy: số phải là **số ghi chú của HÔM NAY**, không phải số đang
hiển thị trong lưới. Khi Nam đang tra cứu và lưới đang hiện 50/63 kết quả tháng trước, tab title vẫn
phải nói số của hôm nay. Với AD-1 (view là hàm thuần của state) thì title là một dẫn xuất của state
— nhưng dẫn xuất từ **mảng đầy đủ**, không phải từ kết quả query. Đúng loại chi tiết mà cấu trúc AD
làm rơi, vì `document.title` không thuộc về "DOM của khung nhìn" một cách trực giác.

**Cần:** một dòng trong Capability Map (`view/render.js` hoặc `view/title.js`, chịu AD-1), và một
câu trong Consistency Conventions chốt nguồn của con số.

### R-7 · [VỪA] Theme `[OVERRIDE-1]` — có key, không có cơ chế

Spine chạm theme đúng hai chỗ: AD-3 liệt kê key `ghichu.theme`, AD-7 bắt đổi theme phải phát
BroadcastChannel. Còn thiếu:

- **Không có module.** Structural Seed không có `view/theme.js`; `style.css` chỉ được mô tả là
  "token màu/spacing".
- **Không có cơ chế.** DESIGN.md định nghĩa **hai bảng màu đầy đủ** (12 token × 2). Cách chuyển giữa
  chúng — `data-theme` trên `<html>` + `:root` variables, hay `prefers-color-scheme`, hay cả hai —
  là một quyết định cấu trúc thật, và nó quyết định luôn cả trạng thái thứ ba: **lần đầu mở app,
  chưa có `ghichu.theme`, theo hệ điều hành hay mặc định light?** Không tài liệu nào trả lời.
- **DESIGN.md còn đòi hai thứ chỉ có ở dark:** bóng đổi sang `rgba(0,0,0,.45)` và **lớp sát mép thay
  bằng hairline sáng phía trên** — tức dark **không** chỉ là hoán đổi token màu; có một quy tắc
  elevation riêng. Nếu spine chỉ nói "hai bảng token" thì phần này rơi.
- **Không có dòng nào trong Capability Map.**

### R-8 · [VỪA] Không có invariant "fold bảo toàn ánh xạ chỉ số" — và tô từ khóa cần nó

EXPERIENCE.md · UJ-2 bước 4 và DESIGN.md · Tô từ khóa: từ khóa khớp phải được **tô nền `{colors.hl}`
bên trong chuỗi gốc** — Nam gõ `phan quyen`, chữ được tô là `Phân quyền`.

Nghĩa là: so khớp trên `textFolded`, nhưng **highlight trên `text`**. Việc đó chỉ hoạt động nếu
`fold()` **bảo toàn chỉ số ký tự 1:1**. Thứ tự AD-5 quy định (`đ→d` → NFD → bỏ `\p{M}` → lowercase)
tình cờ thỏa điều đó cho tiếng Việt — nhưng **AD-5 không phát biểu nó thành bất biến**. Ai thêm một
bước hợp lý (trim, gộp khoảng trắng, bỏ dấu câu, `toLowerCase` với locale đổi độ dài) sẽ làm vệt tô
lệch đi vài ký tự, và đó là kiểu lỗi *"không có cách nào phát hiện ngoài việc dùng thật"* mà chính
AD-5 nói nó tồn tại để ngăn.

**Cần:** thêm vào AD-5 một câu — *`fold()` là song ánh trên chỉ số: `fold(text).length === text.length`
và ký tự thứ i của kết quả sinh từ đúng ký tự thứ i của đầu vào. Mọi phép biến đổi làm đổi độ dài đều
bị cấm.* Kèm một test Vitest cho chính bất biến đó.

### R-9 · [VỪA] FR-5 — con đường phá dữ liệu thứ hai, không ai canh

FR-5: xóa hết ký tự một ghi chú rồi rời khỏi nó → ghi chú **biến mất, không hỏi xác nhận**. PRD gọi
đây là *"ngoại lệ có chủ đích của FR-11, và là ngoại lệ **duy nhất**"*.

Spine: không AD nào nhắc; bảng Naming chỉ liệt kê `chotGhiChu`, `xoaGhiChu`, `datDieuKienNgay`,
`suaGhiChu`. Không có action nào cho "ghi chú rỗng tự biến mất", và không có phát biểu nào nói nó
phải đi qua **cùng một** action `xoaGhiChu` (do đó cùng thứ tự AD-8: ghi trước, đổi state sau, phát
broadcast) hay là một đường riêng.

Trong một sản phẩm **không có thùng rác và không có hoàn tác** (FR-11, §8), đây là con đường mất dữ
liệu duy nhất *không có phanh* — và nó lại là con đường spine không nhìn thấy. Đáng có tên riêng và
một dòng trong Capability Map, chưa kể một câu chốt: rời khỏi mẩu bằng cách nào thì tính là "rời"
(EXPERIENCE nói *click ra ngoài hoặc `Tab`*).

### R-10 · [VỪA] FR-14 — "gõ vào ô soạn thảo xóa hết điều kiện" không có chủ

Bảng mô hình trạng thái của FR-14 được PRD gọi là *"chuẩn để đối chiếu khi nghiệm thu"*, và
EXPERIENCE.md dựng hẳn bốn cơ chế thiết kế (vật liệu, nhãn, vị trí, placeholder cảnh báo) quanh việc
tách hai ô. Spine chạm nó đúng một lần: AD-1 · Prevents nhắc *"bảng trạng thái FR-14 sẽ không bao
giờ khớp lại được"*. Nhưng:

- không AD nào nói **ký tự đầu tiên vào ô soạn thảo** là một action làm đổi state điều kiện;
- Capability Map xếp F1 (composer) và F4 (search) vào **hai hàng khác nhau**, hai bộ AD khác nhau —
  đúng kiểu chia cắt làm rơi mất chính sự tương tác giữa chúng;
- placeholder cảnh báo `gõ vào đây sẽ bỏ mọi điều kiện lọc` là một dẫn xuất của "có điều kiện đang
  bật hay không" — lại là state phù du (R-4) không có nhà.

### R-11 · [VỪA] AD-10 gọi `estimate()` sau **mỗi** lần sửa — mà "sửa" là autosave mỗi giây

AD-10: *"Sau **mỗi** lần chốt, sửa hoặc nạp lại, đọc `navigator.storage.estimate()`."*

FR-3/FR-10: nội dung ghi chú đang sửa được lưu tự động trong lúc gõ, ≤ 1 giây. Ghép lại: một lượt
gõ biên bản họp dài = hàng trăm lần gọi `estimate()`, một API không rẻ và trả Promise. Điều này va
vào NFR-1/NFR-2 và vào chính tinh thần AD-6 ("không chạm ổ đĩa trong đường nóng").

Nên tách: `estimate()` chạy sau **chốt / xóa / nạp lại** (sự kiện rời rạc), còn autosave thì không —
hoặc bị tiết chế (throttle) tường minh với một hằng số trong `limits.js`.

### R-12 · [NHẸ-VỪA] FR-17 — ai ghi `ghichu.lastBackupAt` lúc **xuất**?

AD-11 nói rõ đường **nạp**: *"`exportedAt` của file được ghi vào `ghichu.lastBackupAt` khi nạp, nếu
nó mới hơn giá trị đang có."* Đường **xuất** thì không nói gì. Nếu bấm `xuất sao lưu` mà không ghi
mốc, dòng nhắc FR-17 sẽ nói *"cách đây tám ngày"* mãi mãi dù Nam vừa sao lưu xong — và UJ-3 bước 1
(chính là thứ khiến Nam đi sao lưu) mất tác dụng sau lần đầu.

Kèm một câu hỏi con chưa ai trả lời: nếu trình duyệt cho tải file nhưng Nam bấm **Hủy** ở hộp thoại
lưu của hệ điều hành, app vẫn ghi mốc? (Trên web thường không phân biệt được — nên chỉ cần ghi nhận
là giới hạn đã biết, đừng để nó thành bất ngờ.)

### R-13 · [NHẸ-VỪA] Ràng buộc "không tài nguyên mạng" mạnh hơn AD-12

AD-12 cấm bundler, transpile, CSS preprocessor, thư viện runtime. DESIGN.md cấm một thứ **khác và
rộng hơn**: *"Google Fonts, webfont, icon font, **bất kỳ tài nguyên mạng nào**"*, với lý do gắn
thẳng vào NFR-4/NFR-5 (*"font không được là rủi ro thứ hai"*), và chốt **icon lịch inline SVG 16px là
icon DUY NHẤT của toàn sản phẩm**.

Một webfont không phải là "thư viện chạy lúc runtime", nên **AD-12 không chặn nó**. Đây là ràng buộc
vận hành + quyền riêng tư (một request ra `fonts.gstatic.com` là dữ liệu rời máy — biên của NFR-5),
nên nó thuộc về spine, không chỉ thuộc DESIGN.md. Nên gộp vào AD-12 hoặc AD-9: *sau khi trang tải
xong, không một request mạng nào được phát ra; mọi tài sản là inline hoặc cùng origin.*

### R-14 · [NHẸ] A-2 "3 dòng" nằm trong `limits.js` nhưng được thực thi bằng CSS

Convention "Cấu hình" xếp **3 dòng** vào `core/limits.js` cùng 20.000, 50, 7 ngày, 0.80. Nhưng
DESIGN.md thực thi nó bằng `{components.note-paper.collapsedMaxLines}` = 3, tức
`-webkit-line-clamp`/`max-height` trong CSS — `core/` không nhìn thấy và không kiểm chứng được.

Hệ quả thật: microcopy `còn 2 dòng ▾` cần biết **số dòng còn lại**, mà số dòng chỉ tồn tại sau khi
trình duyệt đã ngắt dòng theo bề rộng cột. Đó là một phép đo **của view**, không phải một hằng số
của core. Hoặc con số 3 rời `limits.js`, hoặc convention phải nói rõ nó là hằng số **dùng chung
JS↔CSS** và cách giữ hai chỗ khớp nhau (một CSS custom property sinh từ JS). Bỏ ngỏ thì hai con số 3
sẽ lệch nhau vào ngày ai đó đổi một chỗ.

### R-15 · [NHẸ] FR-7 trong lưới hai chiều

EXPERIENCE.md dành hẳn một mục ("Hướng đọc trong lưới") để phát biểu tường minh rằng FR-7 trong lưới
nhiều cột = **trái sang phải, hết hàng xuống hàng**, và nêu rõ cách đọc kia (masonry, điền dọc từng
cột) là sai. Spine chỉ nói "sắp xếp giảm dần theo `createdAt`" (AD-6) — đúng cho một mảng, nhưng
mảng đúng thứ tự vẫn có thể được CSS vẽ ra sai hướng nếu ai dùng `column-count` hoặc một thư viện
masonry (mà AD-12 đã cấm thư viện, nên rủi ro thật là `column-count`). Một dòng trong Consistency
Conventions là đủ: *lưới dùng CSS grid `auto-fill`, điền theo hàng; cấm `column-count` và mọi bố cục
masonry.*

### R-16 · [NHẸ] Đường lui trong Deferred sẽ phá ba lời hứa khác

Deferred đề xuất, nếu RAM căng: *"RAM chỉ giữ `{id, createdAt, textFolded}`, nội dung đầy đủ lấy từ
IndexedDB cho ≤ 50 mẩu đang vẽ."*

Đường lui đó phá:
- **tô từ khóa** (R-8) — cần `text` gốc của mọi kết quả, và cần nó **đồng bộ** để render một lượt;
- **AD-6** — biến render thành bất đồng bộ, tức mỗi ký tự gõ lại bắn truy vấn, đúng thứ AD-6 tồn tại
  để cấm;
- **xuất sao lưu** — FR-15 đòi toàn bộ nội dung, nên vẫn phải đọc hết từ đĩa (chuyện này ổn, chỉ cần
  biết trước).

Không phải lỗi của spine hôm nay, nhưng nên ghi ngay tại chỗ trong mục Deferred, kẻo khi cần đến
đường lui thì người đọc lại tưởng nó rẻ.

---

## 3. FR / NFR: độ phủ

**Được AD chạm tới rõ ràng:** FR-2, FR-3 (một phần), FR-6, FR-7 (một phần — xem R-15), FR-12 (một
phần — xem R-2, R-8), FR-13, FR-15, FR-16, FR-17 (một phần — xem R-12), FR-19, FR-20 (nhưng xem
M-1), NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7, NFR-8.

**Không AD nào chạm tới:**

| Yêu cầu | Nội dung rơi |
|---|---|
| **FR-1** | Con trỏ nằm sẵn trong ô soạn thảo khi trang tải xong. Một dòng, nhưng nó là bước 3 của UJ-1 và là nửa của SM-2 |
| **FR-4** | `Ctrl+Enter` chốt / `Enter` xuống dòng / `Ctrl+Enter` khi rỗng **không làm gì cả**. Bàn phím là hợp đồng, không phải chi tiết view |
| **FR-5** | Ghi chú rỗng tự biến mất — xem R-9 |
| **FR-8** | Cắt 3 dòng, mở rộng tại chỗ, A-3 — xem R-4, R-14 |
| **FR-9** | Trạng thái rỗng **không một chữ nào**. Là một lệnh cấm, và lệnh cấm không tự thực thi |
| **FR-10** | Chỉ có tên action `suaGhiChu`. Không nói gì về autosave khi sửa, hai nhịp click-1/click-2, hay ranh giới "rời khỏi mẩu" |
| **FR-11** | Hộp thoại xác nhận có `view/dialog.js`, nhưng không AD nào: `Esc`/click-ngoài = hủy, focus mặc định vào `hủy`, focus trap, trả focus |
| **FR-14** | Xem R-10 |
| **FR-18** | Trần 20.000 — xem R-3. `white-space: pre-wrap` (giữ xuống dòng) cũng không ở đâu |
| **NFR-1** | ≤ 2 giây tới lúc gõ được. AD-6 (nạp **toàn bộ** vào RAM lúc khởi động) là rủi ro trực tiếp cho chính NFR này, và Deferred thừa nhận. Không có AD nào bảo vệ nó — ví dụ *ô soạn thảo phải focus được trước khi IndexedDB mở xong* |

Nhận xét gộp: **F1 (trừ FR-19/20), F2, F3 gần như không có AD nào của riêng chúng.** Capability Map
xếp chúng vào các AD chung (AD-1/AD-4/AD-8) — đúng nhưng rỗng: AD-1 nói *state đổi ở đâu*, không nói
*cái gì phải đúng*. Đây chính là hình dạng của chỗ rơi: spine bảo vệ **dữ liệu**, UX mô tả **hành
vi**, và không có AD nào bắc cầu.

---

## 4. Assumptions A-1…A-14

| # | Giả định | Trạng thái | Ghi chú |
|---|---|---|---|
| **A-1** | "Hôm nay" theo 00:00 giờ máy | ✅ **Đã trả lời** | AD-4: chuỗi `yyyy-MM-dd` dựng từ giờ máy, so sánh chuỗi. Trả lời gọn và chặt |
| **A-2** | Cắt ở **3 dòng** | ⚠️ **Nửa** | Có trong `limits.js` nhưng thực thi bằng CSS; `còn N dòng` cần đo lúc chạy — R-14 |
| **A-3** | Mở rộng không nhớ giữa phiên | ❌ **Treo** | Đúng chỉ nhờ tình cờ (AD-3 ba key). Không AD nào phát biểu — R-4 |
| **A-4** | Lọc dần theo ký tự, không cần `Enter` | ✅ **Đã, ngầm** | AD-6 làm nó khả thi (quét đồng bộ). Chưa được nêu thành yêu cầu, nhưng cấu trúc đã bảo đảm |
| **A-5** | Bộ lọc **một** ngày, không phải khoảng | ✅ **Đã, ngầm** | AD-4 + `core/query.js`. Không có gì mở đường cho khoảng ngày |
| **A-6** | Tải lại trang xóa mọi điều kiện | ⚠️ **Nửa** | Cùng bệnh với A-3: đúng nhờ AD-3, không ai phát biểu — R-4 |
| **A-7** | File sao lưu có số phiên bản | ✅ **Đã** | AD-11: `schemaVersion: 1`, và **từ chối cả file** nếu khác |
| **A-8** | Tên file chứa ngày xuất | ✅ **Đã** | AD-11: `ghi-chu-hang-ngay-YYYY-MM-DD.json` |
| **A-9** | Nhắc khi quá **7 ngày** | ⚠️ **Đã, nhưng bị đổi** | AD-10 biến 7 thành **biến**: hạ xuống 3 ngày nếu `persist()` bị từ chối. Quyết định hợp lý, nhưng đây là **thay đổi hành vi người dùng nhìn thấy** so với PRD, chưa được ghi nhận là như vậy ở đâu — và microcopy FR-17 (*"cách đây tám ngày"*) vẫn viết theo giả định 7 ngày. Nên hoặc ghi thành `[OVERRIDE]`, hoặc PM xác nhận |
| **A-10** | Trình duyệt cụ thể chưa xác định | ✅ **Đã trả lời** | Stack chốt **Chromium hiện hành (Edge/Chrome) trên Windows**. Việc này **đóng luôn Open Question 2 của PRD** — nên nói rõ điều đó, vì OQ2 hiện vẫn ghi "còn để ngỏ", và EXPERIENCE.md · Foundation cũng còn ghi "trình duyệt cụ thể còn để ngỏ" |
| **A-11** | Trần **50 kết quả** + chỉ báo còn nhiều hơn | ❌ **Treo** | Chỉ là một hằng số. Không ai giữ lời hứa — R-2 |
| **A-12** | Trần **20.000 ký tự** | ❌ **Treo** | Hằng số không có nơi chặn, không có hình dạng lỗi, không chặn ở đường nạp file — R-3 |
| **A-13** | Mở tab → gõ được **≤ 2 giây** | ⚠️ **Treo có ý thức** | AD-6 nạp toàn bộ vào RAM là rủi ro cho chính nó; Deferred thừa nhận và có đường lui. Nhưng không có AD nào **bảo vệ** đường tới ký tự đầu tiên |
| **A-14** | Tra cứu 2.000 ghi chú **≤ 200 ms** | ✅ **Đã** | AD-6 là câu trả lời trực tiếp và thuyết phục |

**Tổng:** 7 đã trả lời · 4 nửa/có điều kiện · 3 treo hẳn (A-3, A-11, A-12) — và cả ba cái treo đều là
những lời hứa **người dùng nhìn thấy được**.

---

## 5. Việc cần làm, xếp theo thứ tự

**Phải sửa trước khi viết dòng code đầu tiên**

1. **M-1** — tách phạm vi state (bền-dùng chung / bền-riêng tab / phù du). Gỡ mâu thuẫn AD-7 ↔ FR-20,
   và đồng thời chốt A-3, A-6, R-4, R-10.
2. **R-3** — trần 20.000: chặn ở đâu (composer + chế độ sửa + đường nạp file), lỗi mang hình dạng gì.
3. **R-2** — trần 50: `query` trả `{ items, total }`; trần là ràng buộc của core.
4. **R-1** — AD "im lặng khi thành công", kèm chữ ký `{ added, skipped }` cho `backup.js`.

**Phải sửa tài liệu (không phải code)**

5. **M-2** — xóa microcopy loại 2 ở **năm** chỗ (bốn trong EXPERIENCE.md, một trong DESIGN.md); quyết
   định và ghi rõ: thay đổi do tab khác gây ra thì im lặng.
6. **M-3** — thống nhất 10% ↔ 20%; bổ sung phép tính ngân sách để đóng nốt OQ3.
7. **A-10 / OQ2** — ghi nhận spine đã chốt Chromium; cập nhật PRD OQ2 và EXPERIENCE.md · Foundation.
8. **A-9** — ngưỡng 3/7 ngày: ghi thành override hoặc xin PM xác nhận.

**Nên bổ sung vào spine**

9. **R-5** accessibility (ít nhất: cấm `outline: none`, focus mặc định hộp thoại vào `hủy`, focus
   trap) · **R-6** tab title · **R-7** cơ chế theme + elevation riêng của dark · **R-8** bất biến
   chỉ số của `fold()` · **R-9** FR-5 · **M-4** ngoại lệ lỗi inline · **R-11** tiết chế `estimate()`
   · **R-12** ghi `lastBackupAt` lúc xuất · **R-13** cấm mọi request mạng sau khi tải · **R-14**
   con số 3 dòng · **R-15** cấm `column-count` · **R-16** ghi chú thêm vào mục Deferred.
