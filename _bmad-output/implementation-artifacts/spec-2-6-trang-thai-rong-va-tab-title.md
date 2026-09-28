---
title: 'Story 2.6 — Trạng thái rỗng và tab title'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
baseline_commit: '76834150c98617744be3ce42aa3417745a0382f3'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab title đang là chuỗi tĩnh `Ghi chú hàng ngày` trong `index.html` — giữa một rừng tab Nam không nhận ra tab nào là của mình, và bước 2 của UJ-1 (`[OVERRIDE-2]`, AD-19) chưa tồn tại. Trạng thái rỗng thì *hiện tại đã đúng* nhờ `replaceChildren()` của Story 2.4, nhưng không một ca test nào ghim nó: thêm một dòng "Bạn chưa có ghi chú nào" ở bất kỳ đâu vẫn xanh cả suite.

**Approach:** Thêm một view nhỏ tính tiêu đề tab từ state ở **mỗi lượt vẽ** — số ghi chú có `localDate` bằng hôm nay, đếm bằng chính `locGhiChu` với khối điều kiện rỗng nên nó không phụ thuộc điều kiện đang bật — và nối nó cạnh `luoi.ve` trong `main.js`. Cùng với đó, ghim trạng thái rỗng thành cửa chặn: lưới rỗng là rỗng thật, không một ký tự nào, ở cả tầng Vitest lẫn phép đo Chromium; và ghim NFR-1 (mở tab tới gõ được ≤ 2 giây với 2.000 ghi chú) bằng một phép đo thật thay vì một lời hứa.

## Boundaries & Constraints

**Always:**
- Tab title do **lượt render tính ra từ state** (AD-19), không phải hiệu ứng lề trong action, không phải một `document.title =` rải rác ở `state.js` hay `o-soan.js`.
- Con số luôn là **số ghi chú có `localDate` bằng hôm nay**, không phải số mẩu đang hiển thị, và **không phụ thuộc `state.dieuKien`** — dù Epic 6 bật điều kiện nào.
- "Hôm nay" được hỏi lại ở **mỗi lượt vẽ** qua `mocHienTai()`, cùng khuôn `luoi.js`; không chốt mốc một lần lúc nối.
- View mới giữ đúng ba luật tầng view: chỉ đọc `store.state`, không giữ state riêng, không import `app/adapters/`, và nhận gốc DOM qua **tham số** (không chạm `document` toàn cục).
- Không số literal ngoài `0`/`1` trong `app/view/**`; không `new Date`/`Date.now` ngoài `app/core/time.js`.
- Trạng thái rỗng: vùng lưới **hoàn toàn trống — không một ký tự nào**, kể cả khoảng trắng có nghĩa; không thông báo, không hình minh họa, không skeleton, không splash.

**Never:**
- Không dựng cơ chế subscribe. Lượt vẽ lại vẫn nối **tay** ở `main.js`, đúng hai chỗ đang có (kho nạp xong, sau mỗi lần chốt).
- Không đổi hành vi lọc của `app/core/query.js`, không thêm trường bền vào bản ghi ghi chú, không thêm trường mới vào state.
- Không để `luoi.js` biết tới tiêu đề tab, và không để view tiêu đề biết tới lưới — hai view không import nhau, chỉ `main.js` biết cả hai.
- Không thêm `@media`/`@container`, không đổi `app/style.css` cho story này.
- Không nối hành vi cho nút `xóa`, ô tìm, ô ngày, nút theme — vẫn thuộc epic sau.
- Không dải băng, không `aria-live`, không `role="status"` — thuộc Epic 3.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hôm nay có 4 ghi chú | `notes` 4 bản của hôm nay | `document.title` = `4 - Ghi chú hàng ngày` | N/A |
| Vừa chốt cái thứ 5 | lượt vẽ sau `chotGhiChu` | title đổi thành `5 - Ghi chú hàng ngày` | N/A |
| Hôm nay rỗng | không ghi chú nào của hôm nay | Lưới không một ký tự; title đúng `Ghi chú hàng ngày`, không tiền tố số | N/A |
| Có ghi chú hôm qua | 3 của hôm qua, 2 của hôm nay | Title đếm `2` — hôm qua không tính | N/A |
| Đang bật điều kiện | `dieuKien.keyword` khớp 1 trong 4 mẩu | Lưới hiện 1 mẩu, title vẫn `4 - …` | N/A |
| Điều kiện ngày khác | `dieuKien.date` = hôm qua | Lưới hiện mẩu hôm qua, title vẫn đếm **hôm nay** | N/A |
| Qua nửa đêm | tab mở qua 00:00, lượt vẽ mới | Số đếm theo ngày mới (thường về `0`) | N/A |
| Chưa nạp xong kho | trước khi `khoiDong()` trả lời | Title tĩnh của `index.html`, không nháy một con số sai | N/A |
| `createdAt` hỏng | bản ghi lỗi trong kho | `time.js` ném `TypeError` — sập ồn ào, không đếm sai im lặng | ném |
| Không có `document` | môi trường Node (`trang-tinh.test.js`) | Nối no-op, không ném | N/A |

### Quyết định của người dùng

- **Tab title khi hôm nay chưa có ghi chú nào: BỎ tiền tố số** — tiêu đề đúng `Ghi chú hàng ngày`, không `0 - `. Trạng thái rỗng không nói gì, kể cả trên thanh tab; và vì nó trùng đúng chuỗi tĩnh của `index.html`, sáng mở tab ra không có khung hình nào nháy một con số rồi mất. Cái giá đã nhận: một nhánh đặc biệt trong `tieu-de.js`, và nó phải được ghim bằng test chứ không bằng chú thích.

</frozen-after-approval>

## Code Map

- `app/view/luoi.js` -- khuôn để bắt chước **nguyên vẹn**: header ba luật (L1-24), `noiLuoi(store, goc = document, mocHienTai = nowIso)` L43, nhánh no-op khi không tìm thấy phần tử L47, `ve()` hỏi lại `mocHienTai()` ở mỗi lượt L61. Chú thích L69-70 nói thẳng "trạng thái rỗng có lời nhắn là Story 2.6" — **phải cập nhật** cho khớp kết quả thật (không có lời nhắn nào). **Không** thêm phép tính tiêu đề vào file này.
- `app/view/tieu-de.js` -- **FILE MỚI**. `noiTieuDe(store, doc = document, mocHienTai = nowIso)` → `{ ve() }`. Đếm bằng `locGhiChu(store.state.notes, DIEU_KIEN_RONG, mocHienTai())`.length rồi gán `doc.title`. Không import `luoi.js`, không import adapter, không literal số.
- `app/core/query.js` -- `locGhiChu(notes, dieuKien, mocHienTai)` L32: `date === null` → hôm nay. **Dùng lại nguyên hàm này** với `{ keyword: null, date: null }`; không viết phép đếm thứ hai và không sửa file này.
- `app/core/state.js` -- `stateRong()` L153-169 và khối điều kiện; đọc để lấy đúng hình dạng `dieuKien`. **Không** thêm trường nào, **không** thêm action nào cho story này.
- `app/main.js` -- khối `typeof document !== 'undefined'` L70-96: `noiLuoi(store)` L73 phải vẫn đứng **trước** `store.khoiDong()` (ghim ở `test/luoi.test.js:267-276`), `store.khoiDong().then(luoi.ve)` L77, `noiOSoan(store, document, luoi.ve)` L84. Đây là chỗ duy nhất biết cả hai view: gộp thành một callback vẽ chung và truyền callback đó vào cả `.then` lẫn `noiOSoan`. Chú thích L98-100 nói cách nối view mới — làm đúng như nó nói.
- `index.html` -- `<title>Ghi chú hàng ngày</title>` L6. Chuỗi nền của tiêu đề; xem Design Notes về việc nó bị viết lần thứ hai trong `tieu-de.js`. Chú thích L111-113 của `.luoi` cũng nhắc "Story 2.6" — cập nhật. Ràng buộc của `bo-cuc-bon-tang.test.js`: `<div class="luoi">` **không thuộc tính nào khác** (L69-73), đúng hai `<script>` (L181), không `on*=` inline (L182) — không được vi phạm.
- `test/luoi.test.js` -- L244 ghim tập thành viên store mà `luoi.js` chạm tới; L267-276 ghim thứ tự nối trong `main.js` — **cả hai sẽ đỏ** khi `main.js` đổi hình dạng lời gọi, và phải cập nhật đúng vế đã đổi, không nới rộng hơn. Ca lưới rỗng hiện có ở đây là chỗ để ghim "rỗng là rỗng thật".
- `test/trang-tinh.test.js` -- import động `app/main.js` ở Node để nghiệm thu nó nạp được khi **không có** `document`; view mới phải sống được sau cửa đó.
- `test/harness.test.js` L114-131 -- `app/core/**` không nhắc `window|document|indexedDB`; `test/nguong-tap-trung.test.js` L15/L20 -- ngoài `limits.js` chỉ literal `0`/`1`; `test/state-tap-trung.test.js` L206 -- chỉ `state.js` gán vào state. **Không sửa ba file này**; chúng quét thư mục nên file view mới tự động bị soi.
- `tools/thu-bo-cuc.mjs` -- đã bơm ghi chú thật qua IndexedDB (`BOM_O`) và dọn theo `id` ở cuối. Nơi duy nhất đo được `document.title` thật và thời gian tới lúc gõ được; khuôn bơm/dọn sẵn có là thứ để mở rộng cho phép đo 2.000 bản ghi.
- `_bmad-output/implementation-artifacts/spec-2-5-mau-giay-hinh-dang-gio-tao-cat-va-mo-rong.md` -- Implementation Notes: tiền lệ "nới cửa chặn phải ghi chép, không lách", và cách bộ đo phải dọn sạch kho thật của Nam.

## Tasks & Acceptance

**Execution:**
- [x] `app/view/tieu-de.js` -- file mới theo khuôn `luoi.js` (header ba luật, nhận `doc` + `mocHienTai` qua tham số, no-op khi thiếu `doc`): `ve()` đếm bằng `locGhiChu` với khối điều kiện rỗng rồi gán tiêu đề -- tiêu đề là hàm của state (AD-19), và tách khỏi `luoi.js` giữ mỗi view đúng một việc
- [x] `app/main.js` -- nối `noiTieuDe(store, document)` cạnh `noiLuoi`, gộp thành một callback vẽ chung và truyền nó vào `store.khoiDong().then(...)` và `noiOSoan(...)` -- không có subscribe trong dự án này, nên hai lượt vẽ lại phải nối tay đúng như Story 2.4 đã làm
- [x] `app/view/luoi.js` + `index.html` -- cập nhật hai chú thích còn hẹn "Story 2.6" (L69-70 và L111-113) cho khớp kết quả thật: trạng thái rỗng **không có** lời nhắn nào -- một chú thích hứa sai là thứ người sau sẽ đi thực hiện
- [x] `test/tieu-de.test.js` -- file mới phủ toàn bộ I/O Matrix ở tầng view: đếm đúng hôm nay, bỏ qua hôm qua, **không** đổi theo `dieuKien` (cả `keyword` lẫn `date`), qua nửa đêm, ca rỗng theo quyết định đã chốt, thiếu `doc` thì no-op; cộng cửa chặn của riêng file (không `innerHTML`, không import adapter, không literal số) -- mỗi view mới mang cửa chặn của chính nó
- [x] `test/luoi.test.js` -- cập nhật đúng hai chỗ đỏ do `main.js` đổi hình dạng (tập thành viên store L244 nếu đổi, thứ tự nối L267-276), và thêm ca ghim **lưới rỗng là rỗng thật**: không con nào, tổng `textContent` là chuỗi rỗng -- cửa chặn phải mô tả luật hiện hành, và trạng thái rỗng chưa có ai canh
- [x] `tools/thu-bo-cuc.mjs` + `README.md` -- thêm phép đo Chromium: (1) `document.title` khớp dạng đã chốt sau khi nạp và sau một lần chốt, (2) hôm nay rỗng → vùng lưới không một ký tự nào, (3) NFR-1: bơm 2.000 bản ghi rồi đo từ lúc mở tab tới lúc gõ được ký tự đầu tiên ≤ 2 giây; dọn sạch theo `id` đã tạo -- tiêu đề tab và thời gian tải là phép đo trình duyệt, Vitest không với tới

**Acceptance Criteria:**
- Given `npm test`, when chạy, then toàn bộ suite xanh và trong `test/` chỉ `luoi.test.js` bị sửa, cộng file mới `tieu-de.test.js`
- Given `app/view/**`, when đọc, then không file nào nhắc `new Date`, `innerHTML`, `adapters/`, hay số literal ngoài `0`/`1`
- Given `npm run thu-bo-cuc`, when chạy, then mọi phép đo của 2.1–2.5 vẫn đạt và ba phép đo mới đạt; kho của Nam không còn bản ghi nào do bộ đo tạo ra
- Given hôm nay chưa có ghi chú nào, when tải trang, then vùng lưới không một ký tự nào và không một thông báo/hình minh họa/skeleton nào xuất hiện ở bất kỳ tầng nào
- Given `app/core/**` và `app/style.css`, when so với `main`, then không một dòng nào đổi

## Implementation Notes

**Một callback vẽ chung (`veTatCa`) ở `main.js`, không hai lời treo riêng.** Có hai view phải vẽ lại và đúng hai điểm nối (`khoiDong().then(...)` và tham số thứ ba của `noiOSoan`). Treo riêng từng `ve` vào từng điểm là cách một view bị quên ở một trong hai chỗ, và tiêu đề sẽ đứng yên sau lần chốt mà không làm gì đỏ cả. Hệ quả: cửa chặn `luoi.test.js` ghim thứ tự nối phải đổi hình dạng — nó không còn khớp `khoiDong().then(x.ve)` mà khớp **cùng một định danh ở cả hai điểm nối**, rồi mở thân callback ra và ghim đúng hai lượt vẽ trong đó (`luoi`, `tieuDe`). Nới thành "có chứa chữ `ve`" là bỏ mất chính thứ nó canh.

**Ca `.o-luoi` và tập thành viên store của `luoi.test.js` KHÔNG phải nới.** Dự liệu trong Code Map là hai chỗ có thể đỏ; thực tế `luoi.js` không đổi một dòng mã nào (chỉ một chú thích), nên cả hai đứng nguyên. Cửa chặn duy nhất phải viết lại là ca thứ tự nối ở trên, cộng một ca mới cho lưới rỗng.

**Ca "lưới rỗng là rỗng THẬT" khác ca rỗng đã có, và đó là lý do nó tồn tại.** Ca cũ đọc chữ qua `.mau-than`, tức nó chỉ nhìn thấy những gì `veMau` dựng — một lời nhắn "Bạn chưa có ghi chú nào" gắn thẳng vào `.luoi` đi qua nó mà xanh. Ca mới cộng dồn `textContent` của **cả cây** và đòi chuỗi rỗng, cộng `soLanThayCon === 1` để một `if (rỗng) return;` sớm trong `ve()` — thứ để lại danh sách con của lượt trước nằm nguyên khi tab mở qua nửa đêm — cũng chết ở đây.

**Phép đo trạng thái rỗng nối view vào một store rỗng dựng tại chỗ, không xóa kho.** Kho thật trên máy Nam có thể đã mang ghi chú của hôm nay, và bộ đo không được xóa chúng để dựng một màn hình rỗng. DOM vẫn thật, lượt vẽ vẫn thật, chỉ dữ liệu là rỗng; một lần `taiLai` ngay sau đó trả trang về đúng state của kho.

**NFR-1 đo bằng đồng hồ TRONG tab, không từ Node.** Kịch bản cài qua `Page.addScriptToEvaluateOnNewDocument` **trước** khi tài liệu tồn tại nên nó thấy được khung hình đầu tiên, và `performance.now()` tính từ lúc điều hướng — mọi vòng thăm dò của bộ đo nằm ngoài phép đo. "Gõ được" là cả hai nửa: con trỏ đã trong ô **và** bộ nghe `input` của `o-soan.js` đã gắn (dấu hiệu là `style.blockSize` mà chính bộ nghe đặt), và phép thăm dò phát một `input` rỗng nên nó không để lại chữ nào trong bản nháp. 2.000 bản ghi bơm thẳng vào IndexedDB bằng một giao dịch riêng (2.000 lần `chotGhiChu` là 2.000 giao dịch, mất hàng chục giây) và **trải ra quá khứ** chứ không dồn vào hôm nay — chính tính chất đang đo là "chiều dài lưới không phụ thuộc tổng số ghi chú". Đo được **55ms**, trần là 2.000ms.

**Phép kiểm dọn dẹp của khối tiêu đề ban đầu tự so với chính nó** (đọc `notes.length` rồi so với một lần đọc `notes.length` thứ hai) — luôn xanh, kể cả khi phép xóa không chạy. Đã sửa thành chụp `khoTruoc` trước khi chốt và so với nó, cùng khuôn hai khối dọn dẹp của Story 2.4/2.5.

**Kết quả:** `npm test` 431/431 xanh (20 file), `npm run thu-bo-cuc` 41/41 đạt, `npm run thu-tay` 18/18 đạt. `app/core/**` và `app/style.css` không đổi một dòng nào.

## Spec Change Log

## Review Triage Log

Vòng 1 — ba lớp: `blind-hunter`, `edge-case-hunter`, `verification-gap`.

| # | Phát hiện | Verdict | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Ca "lưới rỗng là rỗng THẬT" **rỗng nghĩa**: `luoi.con.map(tongChu)` chạy trên một mảng vừa được assert là `[]` — cả ba lớp cùng nêu | high | Thật, và `luoiGia()` (`luoi.test.js:79`) còn không có `textContent` lẫn `append`, nên một `luoi.textContent = 'Bạn chưa có ghi chú nào'` đi qua CẢ suite mà xanh. Đúng thứ ca này sinh ra để chặn | patch |
| 2 | Bộ đo NFR-1 phát một `input` giả mỗi khung hình → `datBanNhap(o.value)` với `o.value` còn rỗng, **ghi đè bản nháp thật** của Nam bằng chuỗi rỗng | high | Thật: `o-soan.js:59-62` đọc thẳng `o.value`, và bản nháp chỉ về ô sau khi `khoiDongBanNhap()` chốt. Phát sự kiện là hoàn toàn thừa: `noiOSoan` gọi `caoTheoNoiDung()` ở dòng cuối (`o-soan.js:127`), nên `style.blockSize` khác rỗng ĐÃ LÀ bằng chứng bộ nghe gắn xong | patch |
| 3 | `Page.removeScriptToEvaluateOnNewDocument` không nằm trong `finally` — một lần ném ở giữa để kịch bản thăm dò sống hết lượt chạy, chạy cả ở các khối đo sau | medium | Thật: `taiLai` và vòng thăm dò đều ném được, và khối theme nằm ngay dưới cũng tải lại trang | patch |
| 4 | Phép dọn NFR-1 so `khoTruoc` (RAM, `store.state.notes.length`) với `conLai` (IndexedDB `count()`) — hai đại lượng khác nguồn | medium | Thật, và khối tiêu đề ngay trên so đúng cùng một nguồn nên chỉ khối này lệch khuôn. Đã đổi cả hai đầu sang `count()` | patch |
| 5 | `idNfr` lấy từ giá trị trả về của phép bơm: bơm ném sau khi giao dịch đã ghi một phần → `finally` xóa **không** bản ghi nào, 2.000 mẩu rác ở lại | medium | Thật. `id` là một quy tắc (`thu-nfr-${i}`), nên dựng lại được mà không cần phép bơm trả lời | patch |
| 6 | Phép kiểm dọn của khối tiêu đề tự so với chính nó (đọc `notes.length` hai lần) — luôn xanh | medium | Thật; tìm ra lúc tự rà trước khi review chạy, đã sửa thành chụp `khoTruoc` trước khi chốt | patch |
| 7 | Khối bootstrap của `main.js` chỉ được ghim bằng **regex trên văn bản nguồn**: đổi `noiTieuDe(store, document)` thành `noiTieuDe(store, null)` giữ nguyên mọi thứ regex khớp, tiêu đề chết mà suite vẫn xanh | medium | Thật (lớp verification-gap đã chứng minh). Nhưng đóng khe này đòi một harness DOM hoặc tách `noiTatCa` ra khỏi `main.js` — một quyết định kiến trúc lớn hơn story, và repo cố ý dùng cửa chặn văn bản + bộ đo trình duyệt cho khối này từ Story 2.4 | defer |
| 8 | Regex thân callback dùng `[^}]*` nên gãy nếu `veTatCa` chứa một `{}`; và `toEqual(['luoi','tieuDe'])` ghim luôn **thứ tự** vẽ, thứ không luật nào đòi | low | Thật cả hai, nhưng chỉ người viết test gặp, và phép sửa (quét cân bằng ngoặc, hay nới thành tập hợp) thêm phức tạp cho một khiếm khuyết chưa ai đụng phải | bác bỏ |
| 9 | `noiTieuDe(store)` một tham số ở Node ném `ReferenceError` tại phép tính tham số mặc định, trước cả nhánh no-op | low | Thật, nhưng là khuôn chung của cả `luoi.js` lẫn `o-soan.js` từ Story 2.2, và `main.js` luôn truyền `document` tường minh. Sửa riêng một file là làm ba view lệch nhau | bác bỏ |
| 10 | `luoi.ve()` ném thì `tieuDe.ve()` không bao giờ chạy → tiêu đề đứng im vĩnh viễn | low | Chỉ tới được từ một bản ghi hỏng trong kho — và sập ồn ào ở đó là tiền lệ đã chốt ở vòng review 2.2 (mục 11), 2.4 (mục 11) và 2.5 (mục 11). Không có đường đi tới nào khác được chỉ ra | bác bỏ |
| 11 | `store.state.notes` có thể `null`/`undefined` trước khi `khoiDong` chốt | false | `stateRong()` đặt `notes: []` ngay từ lúc dựng store; không đường nào để nó là `null` | bác bỏ |
| 12 | Bản ghi bơm cho NFR-1 có `createdAt` (`+00:00`) lệch với `localDate` dựng từ giờ địa phương | false | `localDate` của lõi là `createdAt.slice(0, 10)`, đúng bằng `ngay` đã ghép vào chuỗi — hai trường khớp nhau theo đúng phép mà lõi dùng. Múi giờ không đi vào phép nào cả | bác bỏ |
| 13 | `kho.close()` không nằm trong `finally`; `indexedDB.open('ghichu')` không nêu phiên bản nên có thể thiếu store `notes` | low | Thật về hình thức, nhưng khối chỉ chạy sau khi trang đã tải và schema đã dựng (`doiSan` chờ `store` sẵn sàng), và cùng khuôn `DOC_NOTES`/`DON_SACH` đã dùng từ Story 1.6 | bác bỏ |
| 14 | `SO_HOM_NAY` đọc trước khi `khoiDong()` chốt → `homNay = 0`, phép so khớp tiêu đề tĩnh và xanh mà không có lượt vẽ nào | low | Thật về lý thuyết. Nhưng phép đo ngay sau đó (chốt một mẩu → `1 - …`) đi qua đúng đường vẽ thật và bắt được cùng một hỏng hóc; và `taiLai` đã chờ `store` sẵn sàng. Phép sửa đòi một cờ "đã nạp xong" mà state cố ý không có | bác bỏ |

## Design Notes

**Vì sao đếm bằng `locGhiChu` với điều kiện rỗng, không viết hàm đếm mới.** AD-15 nói "hôm nay" là *vắng mặt của điều kiện*, và `query.js` là chỗ duy nhất chữ đó tồn tại. Một `demHomNay()` thứ hai sẽ dựng đường thứ hai cho cùng một luật ngày — và hai đường sẽ lệch đúng vào lúc Epic 6 đụng tới phép lọc. Giá phải trả là một lượt quét mảng thừa mỗi lần vẽ; với trần dữ liệu của sản phẩm đó là phép quét đồng bộ trên mảng đã nằm sẵn trong RAM.

**Vì sao khối điều kiện rỗng phải dựng tại chỗ, không đọc từ `store.state.dieuKien`.** Cả điểm của AC là con số **không** đi theo điều kiện đang bật. Đọc state rồi "tạm bỏ qua" là một chỗ để người sau nối lại nhầm.

**Chuỗi `Ghi chú hàng ngày` nằm ở hai nơi, có chủ ý.** `index.html` mang nó ở dạng tĩnh để tab có tên đúng **trước** khi module nào chạy (cùng lý do `autofocus` là thuộc tính HTML chứ không phải lời gọi JS); `tieu-de.js` mang nó để dựng lại tiêu đề có số. Trùng lặp giống hệt tiền lệ `'ghichu.theme'` của AD-19, và một ca test đọc cả hai file để ghim rằng chúng không trôi khỏi nhau.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ suite xanh; diff trong `test/` đúng phạm vi AC#1
- `npm run thu-bo-cuc` -- expected: mọi phép đo của 2.1–2.5 vẫn đạt, cộng ba phép đo mới
- `npm run thu-tay` -- expected: các phép đo bản nháp và tính nguyên tử của `commitDraft` vẫn đạt

**Manual checks (if no CLI):**
- Chốt bốn ghi chú: thanh tab đọc `4 - Ghi chú hàng ngày`; chốt cái thứ năm: đổi ngay thành `5 - …`
- Xóa sạch dữ liệu (DevTools → IndexedDB) rồi tải lại: vùng lưới trắng trơn, không một chữ nào; tiêu đề theo quyết định đã chốt
- Gõ một từ vào ô tìm (chưa có hành vi ở epic này): tiêu đề **không đổi**
