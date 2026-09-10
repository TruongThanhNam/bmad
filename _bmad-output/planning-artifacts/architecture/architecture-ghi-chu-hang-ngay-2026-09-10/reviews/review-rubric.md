# Review theo good-spine checklist — ARCHITECTURE-SPINE.md "Ghi chú hàng ngày"

- **Đối tượng:** `../ARCHITECTURE-SPINE.md` (draft, 2026-09-10)
- **Đối chiếu:** `../../../prds/prd-ghi-chu-hang-ngay-2026-09-08/prd.md`
- **Người review:** reviewer độc lập
- **Ngày:** 2026-09-10

---

## 0. Verdict

**Spine này khá tốt ở phần khung — paradigm rõ, hướng phụ thuộc cưỡng chế được, và phần lớn AD có Rule
đọc xong là chấm được code sai/đúng — nhưng nó CHƯA dùng được như substrate để chia story, vì hai AD
lõi (AD-7 và AD-8) mâu thuẫn trực tiếp với hai FR mà chính chúng tuyên bố bảo vệ (FR-20, FR-3/FR-10),
và toàn bộ chiều "tự lưu trong lúc gõ" — nhịp lưu, chủ thể lưu, hành vi khi lưu hỏng giữa chừng — bị
bỏ trống, đúng chỗ mà F1 và F3 chắc chắn sẽ xây lệch nhau.**

Kết luận thao tác được: cần một vòng sửa (không phải viết lại) tập trung vào AD-7, AD-8, và thêm
khoảng 3 AD mới trước khi mở sprint planning.

---

## 1. Nó có cố định đúng những chỗ mà các story/epic có thể xây lệch nhau không?

### 1.1 Những chỗ nó cố định ĐÚNG (ghi nhận)

Đây là phần mạnh của tài liệu, và cần nói rõ để vòng sửa không đụng vào:

| Chỗ dễ lệch | AD chốt | Đánh giá |
|---|---|---|
| Ai được sửa state | AD-1 | Chốt sạch. F1/F3/F4 không thể mỗi bên giữ một bản state |
| Test được lõi | AD-2 | Chốt sạch, và cưỡng chế được bằng cách đọc import |
| Ghi chú nằm ở đâu | AD-3 | Chốt sạch, kể cả liệt kê đủ 3 key |
| Múi giờ | AD-4 | Rất tốt — cấm cả một API cụ thể (`new Date(...).getHours()`), đây là mức chi tiết đúng |
| Bỏ dấu | AD-5 | Xuất sắc. Chốt cả **thứ tự** phép biến đổi và lý do (`đ` không phân rã) — đúng kiểu bug chỉ lộ khi dùng thật |
| Lọc/tìm chạy ở đâu | AD-6 | Chốt sạch, và ràng luôn vào NFR-2 |
| Hợp đồng file sao lưu | AD-11 | Chốt sạch: hình dạng, tên file, luật từ chối cả file, luật gộp |
| Không build | AD-12 | Chốt sạch |

AD-4 và AD-5 là hai AD tốt nhất tài liệu: chúng chốt tới mức *một dòng code cụ thể là sai*, và mỗi
cái đều gắn với một kiểu hỏng im lặng có thật.

### 1.2 Những chỗ HAI STORY VẪN LỆCH ĐƯỢC (bỏ sót)

#### G-1 · Nhịp và chủ thể của "tự lưu trong lúc gõ" — **CRITICAL**

FR-3 và FR-10 đều yêu cầu lưu tự động **trong lúc gõ**, trần ≤ 1 giây. Spine không có một chữ nào về:

- Lưu theo debounce hay theo từng phím? Bao nhiêu ms?
- Ai giữ timer — `view/composer.js`, `core/state.js`, hay adapter?
- Hằng số nhịp lưu này **không có** trong danh sách của `core/limits.js` (§Consistency Conventions liệt
  kê 20.000 / 50 / 3 dòng / 7 ngày / 0.80 — thiếu đúng cái này).

Hệ quả cụ thể: story F1 (bản nháp → `localStorage`) và story F3 (sửa ghi chú → IndexedDB) là hai
story khác nhau, hai lần code, và sẽ ra hai nhịp khác nhau — một cái debounce 300 ms trong view, một
cái ghi mỗi phím trong action. Cả hai đều "đúng FR", và kết quả là hai hành vi lưu khác nhau trong
cùng một sản phẩm, cộng thêm một cái ghi IndexedDB mỗi keystroke đủ để phá NFR-2.

Đây là lỗ hổng nặng nhất của spine: nó là chiều mà **mọi** FR về an toàn dữ liệu (FR-3, FR-10, FR-19,
NFR-3) đi qua, và nó trống hoàn toàn.

#### G-2 · Mô hình điều kiện của FR-14 không có AD nào canh — **HIGH**

Bảng "Mô hình trạng thái" ở FR-14 là bảng PRD tuyên bố là **chuẩn nghiệm thu**. Spine chỉ trỏ nó vào
`core/query.js` trong Capability Map, không có AD nào chốt:

- `condition` sống ở đâu trong state, hình dạng gì (`{date: 'yyyy-MM-dd'|null, keyword: string}`)?
- "Khung nhìn mặc định là **trạng thái**, không phải điều kiện" — biểu diễn thế nào để không ai
  code nó thành `condition.date = today`? (Nếu code như vậy, FR-14 dòng "hôm nay bị thay thế chứ
  không giao" gãy ngay.)
- Ai xóa điều kiện khi người dùng bắt đầu gõ vào ô soạn thảo — `composer.js` tự gọi, hay là một
  action `datDieuKienNgay`/`xoaDieuKien` ở core?

F4 (search) và F1 (composer) là hai story tách rời, đụng cùng một mảnh state, theo hai hướng ngược
nhau. Đây đúng là định nghĩa của chỗ cần AD. AD-1 nói "chỉ action mới đổi state" nên chặn được kiểu
hỏng thô nhất, nhưng không chặn được việc hai bên hiểu "hôm nay" khác nhau.

Đáng chú ý: AD-1 tự nhận là bảo vệ FR-14 ("bảng trạng thái FR-14 sẽ không bao giờ khớp lại được") —
tức là tác giả đã nhìn thấy rủi ro, nhưng Rule của AD-1 không đủ để đóng nó.

#### G-3 · Trần 20.000 ký tự: ai chặn, chặn lúc nào — **MEDIUM**

PRD FR-18/A-12: vượt trần thì **báo cho người dùng thay vì cắt im lặng**. Spine để hằng số trong
`limits.js` rồi dừng. Không nói kiểm ở đâu (chặn gõ trong view? chặn lúc chốt trong action? adapter
ném lỗi?), không có `code` lỗi tương ứng trong bảng "Hình dạng lỗi" (`QUOTA`, `BAD_FILE`,
`BAD_VERSION`, `DB` — không có `TOO_LONG`). F1 và F3 sẽ xử lý khác nhau: một bên chặn `maxlength`
trong textarea (= cắt im lặng, vi phạm PRD), một bên báo dải băng.

#### G-4 · FR-5 "ghi chú rỗng biến mất khi rời khỏi nó" — **MEDIUM**

Không AD nào, không dòng nào trong Capability Map. "Rời khỏi nó" là sự kiện gì — `blur`? đóng dialog?
click ra ngoài? Và nó là ngoại lệ **duy nhất** của FR-11 nên nó phải đi qua đúng một đường; nếu F3
code nó trong `view/dialog.js` bằng cách gọi thẳng adapter thì AD-1 gãy mà không ai thấy. Cần ít nhất
một dòng: đây là action `xoaGhiChuRong`, kích hoạt bởi sự kiện X, không hỏi xác nhận.

#### G-5 · Cắt 3 dòng / mở rộng tại chỗ (FR-8, A-2, A-3) — **LOW**

Thuộc DESIGN.md nhiều hơn, nhưng A-3 ("trạng thái mở rộng không nhớ giữa các phiên") là một mẩu
state, và AD-1 cấm view giữ state riêng. Vậy trạng thái mở rộng nằm ở đâu? Nếu nó nằm trong state
lõi thì nó phải xuất hiện đâu đó; nếu nó là ngoại lệ được phép của AD-1 thì phải nói ra. Nhỏ, nhưng
đúng kiểu chỗ dev sẽ tự quyết mỗi người một kiểu.

---

## 2. Mỗi AD có Rule THI HÀNH ĐƯỢC không, và Rule có chặn được "Prevents" của nó không?

Chấm từng AD theo hai câu hỏi: **(a)** đọc xong có chấm được code sai/đúng không; **(b)** Rule có
thật sự đóng được kiểu hỏng nó nêu không.

| AD | (a) Thi hành được | (b) Chặn được Prevents | Ghi chú |
|---|---|---|---|
| AD-1 | Có | **Một phần** | Chặn kiểu hỏng thô. Không chặn được G-2. Xem thêm F-2 bên dưới: nó xung đột với AD-8 |
| AD-2 | Có, rất rõ | Có | Cưỡng chế được bằng grep. AD tốt |
| AD-3 | Có (đếm được đúng 3 key) | Có | Nhưng xem F-4: AD-10 cần key thứ tư |
| AD-4 | Có, xuất sắc | Có | Cấm cả API cụ thể — mẫu mực |
| AD-5 | Có, xuất sắc | Có | Chốt cả thứ tự phép biến đổi |
| AD-6 | Có | Có | Rõ: đọc đĩa đúng hai chỗ |
| AD-7 | Có | **KHÔNG — phản tác dụng** | Xem F-1. Rule như viết sẽ *gây ra* chính kiểu mất dữ liệu FR-20 cấm |
| AD-8 | Có | **KHÔNG cho luồng gõ** | Xem F-2. Đúng cho "chốt/xóa", sai cho "tự lưu trong lúc gõ" |
| AD-9 | Có | Có | Rõ ràng, đóng đúng cái bẫy origin-không-tính-path |
| AD-10 | Có | Một phần | Ngưỡng 0.80 và nhịp đo rõ. Nhưng xem F-4 (chỗ lưu kết quả `persist()`) |
| AD-11 | Có, rất rõ | Có | Hợp đồng đầy đủ nhất tài liệu |
| AD-12 | Có | Có | Rõ, và ràng được `package.json` |

### F-1 · AD-7 phá chính FR-20 mà nó bind — **CRITICAL**

AD-7 Rule: *"mọi thao tác ghi thành công — chốt, sửa, xóa, nạp lại, **đổi bản nháp**/theme — phải
phát một tin lên BroadcastChannel… Tab nhận tin **nạp lại từ nguồn sự thật rồi render lại**."*

Đặt cạnh PRD FR-20, dòng kiểm chứng thứ hai: *"Bản nháp (FR-3) ở tab này **không bị tab kia xóa
mất**."*

Kịch bản gãy, không cần cố tình:

1. Tab A và tab B cùng mở (PRD nói đây là chuyện bình thường, không phải hiếm).
2. Nam đang gõ dở một bản nháp ở tab A.
3. Ở tab B, Nam gõ một chữ vào ô soạn thảo → `ghichu.draft` bị ghi đè → AD-7 bắt phát tin.
4. Tab A nhận tin, "nạp lại từ nguồn sự thật rồi render lại" → bản nháp đang gõ dở ở tab A **bị thay
   bằng bản nháp của tab B**.

Đây chính xác là điều FR-20 cấm, do một AD tuyên bố mình bind FR-20 gây ra. Vấn đề gốc: AD-7 gộp
chung hai thứ có ngữ nghĩa đối lập — `notes` (dùng chung, phải hội tụ) và `draft` (là **ngữ cảnh soạn
thảo của một tab**, không được hội tụ). AD-3 đã tách hai kho theo *vai trò*, nhưng AD-7 lại xử lý
chúng như nhau.

Phụ theo: broadcast mỗi lần "đổi bản nháp" nghĩa là mỗi nhịp gõ bắn một bản tin, và mỗi tab kia đọc
lại toàn bộ nguồn sự thật — với 2.000 ghi chú (AD-6 nạp cả mảng) thì đây là bão I/O đủ để phá NFR-2.

**Hướng sửa gợi ý (để tác giả quyết):** phạm vi broadcast thu về `notes` + `lastBackupAt` + `theme`;
`draft` là per-tab và không bao giờ phát tin — kèm quyết định rõ ràng về việc `ghichu.draft` khi đó
có còn dùng được `localStorage` (dùng chung giữa tab) hay phải là `sessionStorage`. Đây là một quyết
định thật, có đánh đổi với FR-3 ("bản nháp xuất hiện lại khi mở app lần sau"), nên nó **phải** nằm
trong spine chứ không để story tự nghĩ.

### F-2 · AD-8 "ghi trước, đổi state sau" mâu thuẫn với AD-1 trong luồng gõ — **CRITICAL**

AD-8: *"thứ tự bắt buộc trong **mọi** action có ghi là ghi trước, đổi state sau."*
AD-1: *"View không được ghi vào state, **không được giữ state riêng của nó**."*

Ghép hai điều này vào FR-10 (sửa ghi chú, tự lưu trong lúc gõ):

- Nam gõ một ký tự vào một ghi chú.
- AD-8: chưa được đổi state cho tới khi IndexedDB xác nhận ghi xong.
- AD-1: view không được giữ ký tự đó ở đâu khác.
- ⇒ Ký tự vừa gõ **không có chỗ tồn tại** cho tới khi đĩa xác nhận. Nếu render theo state, con trỏ và
  chữ nhảy giật theo mỗi lần ghi bất đồng bộ; nếu để DOM tự giữ (textarea không điều khiển), thì
  DOM đã trở thành state thứ hai — đúng thứ AD-1 cấm.

Không có cách nào code cả hai AD cùng đúng theo nghĩa đen. Story F1 và story F3 sẽ mỗi bên chọn một
lối thoát khác nhau, và đó là kiểu lệch tệ nhất — lệch ở tầng mô hình, không phải tầng chi tiết.

Cần một quyết định minh nhiên phân biệt **hai loại ghi**: ghi *giao dịch* (chốt, xóa, nạp lại — AD-8
áp dụng nguyên vẹn, và nó rất đúng ở đó) và ghi *liên tục* (bản nháp, sửa nội dung — state đổi trước,
ghi sau, và AD-8 chuyển thành "nếu ghi hỏng thì dải băng lỗi + không được tỏ ra đã lưu"). Chừng nào
chưa phân biệt, AD-8 vừa quá chặt ở một nửa, vừa không được kiểm chứng ở nửa kia.

### F-3 · AD-10 nói "sau mỗi lần chốt, sửa hoặc nạp lại" gọi `estimate()` — **MEDIUM**

"Sửa" ở đây, nếu tự lưu là liên tục (FR-10), nghĩa là gọi `navigator.storage.estimate()` theo nhịp
gõ. `estimate()` là async và không rẻ. Rule thi hành được, nhưng chặn Prevents bằng một cái giá phá
NFR-2. Cần một nhịp riêng (ví dụ: mỗi lần **chốt** và mỗi lần **nạp lại**, cộng một lần lúc khởi
động), tách khỏi nhịp tự lưu.

### F-4 · AD-3 "đúng ba key" xung đột với AD-10 — **MEDIUM**

AD-10 quy định: nếu `persist()` bị từ chối thì ngưỡng FR-17 hạ 7 → 3 ngày. Muốn thi hành được, app
phải biết kết quả `persist()`. Hai lối: lưu nó (⇒ key thứ tư, vi phạm AD-3 "đúng ba key, không nhiều
hơn"), hoặc gọi `navigator.storage.persisted()` mỗi lần khởi động (được, nhưng spine không nói).
Cũng chưa nói `ghichu.theme` từ đâu ra — nó được gắn nhãn `[OVERRIDE-1]` trong AD-3 nhưng PRD §8 nói
rõ **"Không cấu hình. Không trang cài đặt, không tùy chọn người dùng"** (NT-1). Một key theme là một
tùy chọn người dùng; nếu nó thật sự được duyệt thì override đó cần một dòng lý do ngay tại chỗ, vì
hiện tại nó đọc như một vi phạm Non-Goal.

### F-5 · Bảng "Hình dạng lỗi" chưa phủ hết — **MEDIUM**

`code` hiện có: `QUOTA`, `BAD_FILE`, `BAD_VERSION`, `DB`. Thiếu ít nhất: vượt trần 20.000 ký tự
(G-3), và trường hợp IndexedDB **không mở được** hoặc **không tồn tại** (chế độ riêng tư / policy
doanh nghiệp) — khác `DB` lúc ghi, vì lúc đó app chưa khởi động được và AD-8 ("dải băng dùng chung")
chưa có gì để hiển thị lên. Đây là chỗ hai story sẽ tự chế `code` mới, rồi microcopy lệch EXPERIENCE.md.

---

## 3. Deferred — có mục nào để ngỏ mà vẫn khiến hai đơn vị lệch nhau không?

| Mục Deferred | Có an toàn để ngỏ? | Nhận xét |
|---|---|---|
| Migration IndexedDB v2 | **Có** | Defer đúng chuẩn: nêu rõ *tín hiệu quay lại* (thêm trường ⇒ đổi `schemaVersion` + `onupgradeneeded` cùng lúc). Không story nào cần biết bây giờ |
| Ngân sách RAM | **Có** | Có đường lui cụ thể, có điều kiện kích hoạt (NFR-1 gãy). Đúng kiểu deferred tốt |
| Service worker / offline | **Có** | PRD đã loại có ý thức, và spine chỉ ra vì sao thêm sau là cục bộ |
| Chiến lược khi `persist()` bị từ chối | **Không hẳn** — MEDIUM | Phần *chiến lược dài hạn* defer được. Nhưng phần *cơ chế biết được persist có được cấp không* thì không (xem F-4): nó là input của FR-17, và FR-17 là một story. Hai story sẽ đọc trạng thái persist theo hai cách |
| CI | **Có** | n = 1, lý do rõ, tín hiệu quay lại rõ ("người thứ hai đụng vào mã") |

**Nhưng có một mục KHÔNG có trong Deferred mà lẽ ra phải có, hoặc phải được chốt:** xem D-1 ở §5.

---

## 4. Spine có phủ hết capability của PRD không?

Rà toàn bộ FR-1…20 và NFR-1…8:

| FR/NFR | Có chỗ trong spine? | Ghi chú |
|---|---|---|
| FR-1 gõ được ngay | Ngầm (view/composer) | Không AD, nhưng NFR-1 ràng qua AD-6/AD-12. Chấp nhận được |
| FR-2 thời điểm tạo | AD-4 | Phủ tốt |
| FR-3 tự lưu ≤1s | AD-3, AD-8 | **Phủ một nửa** — chỗ lưu có, *nhịp* lưu không (G-1) |
| FR-4 chốt & gõ tiếp | AD-1, action `chotGhiChu` | Phủ |
| FR-5 ghi chú rỗng | **KHÔNG** | G-4. Không AD, không dòng Capability Map |
| FR-6, 7 | AD-4, AD-6 | Phủ |
| FR-8 cắt 3 dòng | limits.js | Mỏng, G-5 |
| FR-9 trạng thái rỗng | Không (thuộc UX) | Chấp nhận được |
| FR-10 sửa tự do | AD-1, AD-5, AD-8 | **Phủ một nửa** — xem F-2 |
| FR-11 xóa xác nhận | AD-1, view/dialog | Phủ |
| FR-12, 13 | AD-5, AD-6 | Phủ tốt |
| FR-14 kết hợp điều kiện | Chỉ Capability Map | **Không AD** — G-2 |
| FR-15, 16, 17 | AD-11, AD-10 | Phủ tốt |
| FR-18 trần 20.000 | limits.js | **Phủ một nửa** — G-3 |
| FR-19 hết dung lượng | AD-8, AD-10 | Phủ tốt |
| FR-20 nhiều tab | AD-7 | **Phủ sai** — F-1 |
| NFR-1 ≤2s | AD-6, AD-12 | Phủ ngầm; không AD nào *đo* nó. Chấp nhận được ở tầm này |
| NFR-2 ≤200ms | AD-6 | Phủ tốt |
| NFR-3 | AD-3, AD-8, AD-10 | Phủ |
| NFR-4 | §Structural Seed | Phủ |
| NFR-5 | AD-8, Conventions | Phủ |
| NFR-6 | AD-5 | Phủ tốt |
| NFR-7 không cài đặt | Stack | **Còn treo** — xem D-2 |
| NFR-8 origin cố định | AD-9 | Phủ rất tốt |

Ngoài ra spine đã **trả lời được** hai Open Question mà PRD giao cho `bmad-architecture`:
OQ-4 (định dạng file sao lưu) → AD-11, dứt điểm. OQ-3 (ngưỡng cảnh báo dung lượng) → AD-10, nhưng chỉ
một nửa: PRD hỏi *"giới hạn là bao nhiêu, bao giờ chạm?"* và yêu cầu tính từ 20.000 ký tự × 2.000 ghi
chú. AD-10 thay câu hỏi bằng một ngưỡng tỷ lệ đo runtime (0.80) — hợp lý hơn về kỹ thuật, nhưng **phép
tính trên bàn giấy vẫn nên có một dòng** (≈ 40 MB worst case, so với quota Chromium thường tính theo
% đĩa) để biết ngưỡng này có bao giờ chạm không, và để FR-19 "cảnh báo trước" có nghĩa.

---

## 5. Có chiều nào bị BỎ TRỐNG hoàn toàn không?

Đây là câu hỏi spine trả lời **tốt hơn dự kiến** ở phần lớn các chiều: có sơ đồ triển khai, có
nói rõ "chỉ một môi trường: production, chính là nhánh `main`", có đóng khung origin, có nói không
staging/không backend. Chiều vận hành **không** trống. Nhưng có hai lỗ thật:

### D-1 · Cập nhật app đang chạy: cache và mã lệch phiên bản — **HIGH, chiều gần như trống**

AD-12 nói "deploy = `git push`", `index.html` nạp thẳng ES modules, không bundler. Không có một dòng
nào về:

- **Cache của GitHub Pages / trình duyệt.** ES modules được cache riêng từng file. Sau một lần push
  sửa 3 file trong `core/`, một tab đang mở (PRD nói tab này mở **cả ngày** — UJ-1) hoặc một lần
  reload có thể lấy về `state.js` mới + `fold.js` cũ. Với AD-5 (thứ tự bỏ dấu) và AD-11 (schema file
  sao lưu), mã lệch phiên bản là kiểu hỏng **im lặng và làm hỏng dữ liệu**, không phải phiền toái.
- **Rollback.** Không có. `git revert` + push là câu trả lời khả dĩ, nhưng nó phải được viết ra, vì
  nó là quy trình vận hành duy nhất của sản phẩm.
- **NFR-3 dòng "ghi chú tồn tại qua cập nhật phiên bản app"** — đây là một lời hứa PRD, và không AD
  nào nhận nó.

Đây là chiều duy nhất bị bỏ trống theo nghĩa "sẽ hỏng thật, và không ai được cảnh báo". Cần một AD:
quy tắc cache-busting (query string phiên bản trên import, hoặc một `version.js` duy nhất), quy tắc
"đổi schema ⇒ bắt buộc reload cứng", và một dòng về rollback.

### D-2 · Trình duyệt đáy vs. Open Question 2 của PRD — **MEDIUM**

Stack chốt "Chromium hiện hành (Edge/Chrome) trên Windows". PRD OQ-2 và A-10 nói **chưa xác định
trình duyệt trên máy công ty**. Spine đang *đóng* một câu hỏi mở của PRD mà không ghi nhận là mình
đang đóng nó, không nêu bằng chứng, và không nói chuyện gì xảy ra nếu IT khóa Firefox/một Chromium cũ.
Cụ thể có rủi ro: `crypto.randomUUID()` (Conventions §Định danh) chỉ có trên **secure context** và
Chromium ≥ 92 — trên HTTPS của GitHub Pages thì ổn, nhưng nó là một phụ thuộc runtime không nói ra.
Cần một dòng: hoặc "đã xác minh máy công ty chạy Edge x", hoặc "giả định, và đây là cách phát hiện
sớm nếu sai".

### D-3 · Chiến lược test cho `adapters/` và `view/` — **MEDIUM**

AD-2 bắt `core/` có test Vitest chạy ở Node — rất tốt, và cưỡng chế được. Nhưng hệ quả là **toàn bộ**
`adapters/` (IndexedDB, quota, file, broadcast) và `view/` không có chiến lược kiểm chứng nào cả:
không unit, không thủ công có checklist, không gì. Với một sản phẩm mà rủi ro số một là mất dữ liệu
và nơi dữ liệu thật sự xuống đĩa nằm **đúng trong `adapters/`**, đây là một khoảng trống có thật. Không
cần Playwright — chỉ cần spine nói rõ: "adapters kiểm bằng tay theo checklist X, và đây là lý do
chấp nhận được", để hai story không mỗi bên tự đặt một mức.

### Các chiều KHÔNG trống (ghi nhận)

Bảo mật/quyền riêng tư (NFR-5, AD-8 cấm telemetry) · dữ liệu và schema (AD-3, AD-11) · hiệu năng
(AD-6) · đồng thời (AD-7, dù sai hướng) · quan sát được (chốt rõ là "không có", có lý do) ·
cấu hình (chốt rõ là "không có") · từ vựng và naming (Conventions, rất chặt, kể cả cấm chữ `card`).

---

## 6. Tổng hợp finding, xếp theo mức

| # | Mức | Finding |
|---|---|---|
| F-1 | **CRITICAL** | AD-7 bắt broadcast cả thay đổi bản nháp và bắt tab nhận nạp lại từ nguồn sự thật → tab kia xóa mất bản nháp đang gõ, đúng điều FR-20 cấm; đồng thời tạo bão I/O phá NFR-2 |
| F-2 | **CRITICAL** | AD-8 ("ghi trước, đổi state sau" cho **mọi** action có ghi) mâu thuẫn với AD-1 ("view không giữ state riêng") trong luồng tự lưu khi gõ (FR-3, FR-10) — không code đúng cả hai được |
| G-1 | **CRITICAL** | Nhịp/chủ thể của tự lưu ≤1s bị bỏ trống hoàn toàn; hằng số này còn thiếu trong `limits.js` — F1 và F3 chắc chắn xây lệch |
| D-1 | **HIGH** | Chiều cập nhật/cache/rollback gần như trống: ES modules không bundle + tab mở cả ngày ⇒ mã lệch phiên bản im lặng; NFR-3 "tồn tại qua cập nhật app" không AD nào nhận |
| G-2 | **HIGH** | Mô hình điều kiện FR-14 (bảng chuẩn nghiệm thu của PRD) không có AD nào canh: hình dạng `condition`, "hôm nay là trạng thái không phải điều kiện", ai xóa điều kiện khi gõ vào ô soạn thảo |
| F-4 | MEDIUM | AD-3 "đúng ba key" vs AD-10 cần biết kết quả `persist()`; và `ghichu.theme` đọc như vi phạm Non-Goal "không cấu hình" mà không có lý do tại chỗ |
| F-3 | MEDIUM | AD-10 gọi `estimate()` "sau mỗi lần sửa" — với tự lưu liên tục thì đó là mỗi nhịp gõ |
| G-3 | MEDIUM | Trần 20.000 ký tự: không nói ai chặn, chặn lúc nào, và thiếu `code` lỗi tương ứng ⇒ nguy cơ "cắt im lặng" mà PRD cấm |
| F-5 | MEDIUM | Bảng "Hình dạng lỗi" thiếu ít nhất TOO_LONG và trường hợp IndexedDB không mở được lúc khởi động |
| D-2 | MEDIUM | Spine đóng OQ-2 của PRD (trình duyệt) mà không ghi nhận; `crypto.randomUUID()` là phụ thuộc runtime không nói ra |
| D-3 | MEDIUM | Không có chiến lược kiểm chứng nào cho `adapters/` — nơi dữ liệu thật sự xuống đĩa |
| G-4 | MEDIUM | FR-5 (ghi chú rỗng tự biến mất) không xuất hiện ở bất kỳ đâu trong spine |
| §4 | LOW | OQ-3 mới trả lời một nửa: thiếu phép tính dung lượng trên bàn giấy (20.000 × 2.000) |
| G-5 | LOW | Trạng thái mở rộng (A-3) là state nhưng AD-1 cấm view giữ state — chưa nói nó ở đâu |

---

## 7. Việc cần làm trước khi mở sprint planning

1. **Sửa AD-7**: tách phạm vi broadcast — `notes`/`lastBackupAt` hội tụ, `draft` là per-tab và không
   phát tin. Quyết luôn `localStorage` hay `sessionStorage` cho draft, và ghi rõ đánh đổi với FR-3.
2. **Sửa AD-8**: phân biệt ghi *giao dịch* (chốt/xóa/nạp lại — giữ nguyên "ghi trước, đổi state sau")
   và ghi *liên tục* (bản nháp/sửa nội dung — state trước, ghi sau, lỗi ra dải băng, không bao giờ
   tỏ ra đã lưu). Nói rõ AD-1 áp dụng thế nào lên textarea đang gõ.
3. **Thêm AD "Nhịp tự lưu"**: một hằng số duy nhất trong `limits.js`, một chỗ duy nhất giữ timer,
   dùng chung cho cả bản nháp lẫn ghi chú đang sửa.
4. **Thêm AD "Mô hình điều kiện"**: hình dạng `condition` trong state, "hôm nay" biểu diễn bằng
   `condition == null`, và danh sách action được phép đổi nó.
5. **Thêm AD "Cập nhật app"**: cache-busting cho ES modules, quy tắc khi đổi schema, đường rollback.
6. **Vá nhỏ**: `code` lỗi TOO_LONG + DB không mở được; nơi chặn trần 20.000 ký tự; FR-5 vào Capability
   Map; một dòng cho `persist()` state và cho `ghichu.theme`; một dòng cho chiến lược kiểm `adapters/`;
   một dòng ghi nhận OQ-2 đang bị đóng bằng giả định.

Sáu việc trên đều là *thêm hoặc sửa vài đoạn*, không phải viết lại — cấu trúc, paradigm, và tám trên
mười hai AD hiện tại đều giữ nguyên được.
