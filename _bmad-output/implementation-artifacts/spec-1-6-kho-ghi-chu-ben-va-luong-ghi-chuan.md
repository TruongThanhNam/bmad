---
title: 'Story 1.6 — Kho ghi chú bền và luồng ghi chuẩn'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
baseline_commit: '03e57f9481ff2053ff3c522055a9e329a2006fb3'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Sau Story 1.5 có khối state nhưng chưa có đĩa: đóng tab là mất hết. Năm cổng vẫn nối vào tập stub ném khi bị gọi, nên chưa có đường nào đưa một ghi chú xuống IndexedDB và đưa nó trở lại lúc khởi động. Quan trọng hơn, **luồng ghi chuẩn** — "ghi xuống đĩa trước, đổi state sau" cho thao tác đổi sự tồn tại, và "state đổi ngay, ghi đi sau với debounce + `seq`" cho tự lưu (AD-8) — phải tồn tại **đúng một lần** cho mọi epic sau; nếu Epic 2 và Epic 5 mỗi bên tự dựng luồng của mình thì nửa cứng của FR-19 ("không bao giờ giả vờ đã lưu") chỉ đúng ở một nửa.

**Approach:** Dựng hai adapter thật (`indexeddb.js` cho `noteStore`, `localstorage.js` cho `sessionStore`), nối chúng vào `main.js` thay tập stub tương ứng, và thêm vào `app/core/state.js` các action tiêu thụ chúng: `khoiDong()` nạp toàn bộ ghi chú vào RAM đã sắp xếp, cộng luồng ghi chuẩn ở dạng action cụ thể để Epic 2/5 chỉ việc nối giao diện vào chứ không dựng lại. `time.js` nhận thêm `nowIso()` — chỗ duy nhất trong repo được phép hỏi "bây giờ là mấy giờ".

## Boundaries & Constraints

**Always:**
- `core/` và `ports/` vẫn thuần: không import từ `adapters/`, không chạm 7 global bị cấm (`test/harness.test.js` bất biến 5). `app/adapters/` **được** dùng `indexedDB`/`localStorage`/`sessionStorage` — nó nằm ngoài phạm vi quét đó.
- `app/main.js` vẫn là file duy nhất import từ `app/adapters/`, và vẫn gọi `taoStore` **đúng một lần**.
- Mọi số literal ngoài `0`/`1` phải nằm ở `app/core/limits.js` — kể cả trong `time.js` và trong adapter. Thêm hằng thì phải cập nhật `MONG_DOI` ở `test/core-limits.test.js`.
- Không `new Date(` / `Date.now(` ở bất kỳ đâu dưới `app/` ngoài `app/core/time.js`; không tự bỏ dấu ở đâu ngoài `app/core/fold.js`.
- Adapter ném lỗi mang mã của tập đóng AD-18 qua `loiUngDung(...)`: `QuotaExceededError` → `QUOTA`, mọi hỏng hóc khác của kho → `DB`. Cổng bất đồng bộ (`noteStore`) **từ chối lời hứa**; cổng đồng bộ (`sessionStore`) **ném** — không bao giờ vừa ném vừa từ chối (quy tắc đã ghi ở `app/ports/session-store.js`).
- Adapter **không** gọi vào view, **không** `console.*`, **không** nuốt lỗi.
- `localStorage` mang **đúng ba** khóa: `ghichu.theme`, `ghichu.lastBackupAt`, `ghichu.persistDenied`. Không ghi chú nào ở đó.
- Bản ghi `notes` có **đúng năm** trường `id · createdAt · localDate · text · textFolded`; hai trường dẫn xuất tính lại ở **mọi** lần ghi qua `localDate()` và `fold()`, không bao giờ nhận từ bên ngoài.
- Theo đúng quy ước mã của `core/time.js` và `core/state.js`: header `//` nêu *vì sao* + mã AD, JSDoc tiếng Việt, export tên tiếng Anh, nội bộ tiếng Việt không dấu, `moTa(giaTri)` chép tại chỗ.

**Never:**
- Không dựng store `drafts` **logic** ở story này (Story 1.7 sở hữu quy tắc khởi động bản nháp) — nhưng schema v1 có tạo sẵn object store để 1.7 không phải bump version.
- Không `chotGhiChu` (Story 2.3 — cần transaction chung với `drafts`), không hộp thoại xác nhận xóa (Story 5.3), không giao diện nào.
- Không test tự động cho `app/adapters/` — bằng chứng duy nhất là danh sách thử tay trong README (thiết kế đã chốt). Không thêm `jsdom`, `fake-indexeddb`, hay bất kỳ devDependency nào. **Ngoại lệ hẹp đã duyệt:** hai dòng cuối của I/O Matrix (khóa cấu hình lạ, và ánh xạ `QuotaExceededError` → `QUOTA`) được phủ bằng test, vì cả hai chạy được mà **không** cần giả lập kho nào — khóa lạ ném trước khi chạm kho, còn ánh xạ mã chỉ cần một stub `localStorage` vài dòng. Lý do gốc của luật "adapter không có test" là tránh dựng một trình duyệt giả, và nó không áp ở hai ca này.
- Không thêm cổng thứ sáu và không thêm trường mới vào khối state — tập khóa bảy trường đã bị `test/core-state.test.js` ghim.
- Không bump `APP_VERSION` (đó là bước deploy, không phải bước code).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Nạp lúc khởi động | kho có 3 ghi chú thứ tự lộn xộn | `state.notes` là mảng 3 phần tử, giảm dần theo `localStamp` | N/A |
| Nạp khi kho rỗng | `readAll()` trả `[]` | `state.notes` là `[]`, `banner` vẫn `null` | N/A |
| Nạp thất bại | `readAll()` từ chối với `code=DB` | `state.notes` giữ `[]`, `state.banner = 'DB'` | không ném ra ngoài |
| Thêm ghi chú | `text` hợp lệ | `noteStore.put` được gọi **trước**, xong mới có phần tử mới ở đầu `state.notes`; đủ năm trường | N/A |
| Thêm ghi chú, ghi hỏng | `put` từ chối `code=QUOTA` | `state.notes` **không đổi**; `state.banner = 'QUOTA'` | action không ném |
| Thêm ghi chú quá dài | `text.length > MAX_NOTE_CHARS` | `put` **không** được gọi; `state.notes` không đổi; `banner = 'TOO_LONG'` | action không ném |
| Thêm ghi chú rỗng | `text` rỗng hoặc chỉ khoảng trắng | không làm gì: không gọi cổng, không đổi state, không banner | N/A |
| Xóa ghi chú | `id` có trong `notes` | `remove` gọi trước, xong mới rút khỏi `state.notes` | N/A |
| Xóa ghi chú, ghi hỏng | `remove` từ chối `code=DB` | phần tử **vẫn còn** trong `state.notes`; `banner='DB'` | action không ném |
| Xóa `id` không tồn tại | `id` lạ | không gọi cổng, không đổi state | N/A |
| Tự lưu | gõ 3 phím liên tiếp trong `AUTOSAVE_MS` | `state.editing.text` đổi ngay ở **mỗi** phím; `put` gọi **đúng một lần** sau khi hẹn cuối nổ | N/A |
| Hẹn tự lưu quá hạn | hẹn nổ nhưng `editing.seq` đã tăng | hẹn đó **bị bỏ**, `put` không chạy | N/A |
| Tự lưu ghi hỏng | `put` từ chối `code=QUOTA` | chữ trong `state.editing.text` **không bị hoàn tác**; `banner='QUOTA'` | action không ném |
| Sai kiểu đối số | `themGhiChu(7)`, `xoaGhiChu(null)` | `TypeError` nêu tên tham số — lỗi lập trình, không phải banner | ném |
| Đọc khóa cấu hình lạ | `sessionStore.read('mau')` | `TypeError` nêu ba khóa hợp lệ | ném |
| Ghi cấu hình khi kho đầy | `localStorage.setItem` ném `QuotaExceededError` | adapter ném `Error` có `code='QUOTA'` | ném (cổng đồng bộ) |

## Quyết định đã chốt

- **Bốn action, tên đã chốt:** `khoiDong()` · `themGhiChu(text)` · `xoaGhiChu(id)` · `tuLuuNoiDung(id, text)`, tất cả export từ store của `taoStore`. Lý do: `chotGhiChu` (Story 2.3) cần transaction chung với `drafts` nên không dựng được ở đây, nhưng nửa cứng của FR-19 — "ghi hỏng thì không bao giờ giả vờ đã lưu" — chỉ phân biệt được bằng một action **chạy thật** khi cổng từ chối. Helper nội bộ không export sẽ biến AC đó thành lời hứa. Story 2.3 gọi `themGhiChu` rồi bọc thêm phần làm rỗng `drafts`; Story 5.1 gọi `tuLuuNoiDung`; Story 5.3 gọi `xoaGhiChu`. Chấp nhận đánh đổi: ba action sống một thời gian chưa có giao diện nào gọi.
- **Giữ spec đầy đủ dù ~6.500 token.** Độ dài đến từ Code Map dày (6 AD có thẩm quyền, 8 bộ test phải thoả, 2 adapter không có test tự động) và I/O Matrix 17 dòng, không từ nhiều mục tiêu. Tách `localstorage.js` ra story riêng sẽ lệch khỏi AC của `epics.md`, vốn nêu đích danh file đó.

</frozen-after-approval>

## Code Map

- `app/core/state.js` — nơi thêm action. `taoStore(ports)` giữ `ports` trong closure; `datLai(nhanhMoi)` là đường **duy nhất** đổi state và phải gọi ở **cuối** action; không được gán vào trường lồng bên trong `noiBo` (phá phép ghi nhớ theo tham chiếu của `banSaoDongBang`). `banSaoDongBang` **ném** với `Date`/`Map`/instance — nên bản ghi ghi chú phải là object thuần.
- `app/core/time.js` — thêm `nowIso()` ở đây và **chỉ** ở đây; `test/date-tap-trung.test.js` loại trừ đúng file này. Đã có `localStamp(note)` / `localDate(note)` — cả hai nhận **object bản ghi**, không nhận chuỗi. `MAU_CREATED_AT` (~dòng 32) là hình dạng mà `nowIso()` phải khớp.
- `app/core/limits.js` — nguồn duy nhất của số. Đã có `MAX_NOTE_CHARS`, `AUTOSAVE_MS`. Cần thêm hằng cho `nowIso()` (phút/giờ, độ rộng ô đệm) và cho version DB nếu khác `1`.
- `app/core/errors.js` — `loiUngDung(code)` dựng `Error` có `.code`; `MA_LOI` 6 mã. Adapter import từ đây (adapter được phép import `core/`).
- `app/core/fold.js` — `fold(text)`; nguồn duy nhất của `textFolded`.
- `app/ports/note-store.js` / `session-store.js` — chữ ký đã chốt: `noteStore = {readAll, put, remove, replaceAll}` (bất đồng bộ), `sessionStore = {read, write, remove, tabIdentity}` (**đồng bộ**). Quy tắc đồng bộ/bất đồng bộ và đường ra của lỗi nằm ở header `session-store.js` — đọc trước khi viết adapter.
- `app/main.js` — `congTam()` dựng stub từ `PORT_METHODS`; giữ nó cho ba cổng chưa có adapter (`channel`, `fileIO`, `quota`) và thay hai cổng còn lại bằng adapter thật.
- `test/core-state.test.js` — ghim **đúng** tập bảy khóa state; thêm trường là đỏ. Khuôn mẫu cổng giả cho test action mới.
- `test/harness.test.js` — **không sửa**. Bất biến 2: chỉ `main.js` được import `adapters/`. Bất biến 3: cấm bare specifier → adapter không được import thư viện. Bất biến 4: mọi specifier tương đối dưới `app/` phải kết `.js` và trỏ file có thật.
- `test/trang-tinh.test.js` — `await import('../app/main.js')` chạy ở **Node**: mọi thứ `main.js` làm ở top-level phải an toàn khi không có `document`/`indexedDB`. Cũng cấm `fetch(`/`https?://` trong chuỗi ở mọi file dưới `app/`.
- `test/state-tap-trung.test.js` — cửa (b) quét **mọi** file dưới `app/` tìm 20 từ cấm AD-16 theo **chuỗi con, không phân biệt hoa thường**: `saved`/`saving`/`saveState`/`isDirty`/`inFlight`/`dangGui`… nên đừng đặt tên `daLuu`, `savedAt`. Cửa (c) chỉ quét `app/ports/` nên adapter được nêu tên công nghệ. Cửa (d): `taoStore(` đúng một lần và chỉ ở `main.js`.
- `test/nguong-tap-trung.test.js` — loại trừ **chỉ** `limits.js`; bỏ nội dung chuỗi/regex nhưng bắt số trong `${…}`.
- `README.md` — mục "Danh sách thử tay cho `app/adapters/`" đang trống có chú thích; story này điền vào. `test/trang-tinh.test.js` đòi README chứa `file://` và `localhost` (đã có).
- Spine: `AD-3` (~78-94) ba tầng + ba khóa localStorage · `AD-6` (~150-159) hai chỗ đọc · `AD-8` (~182-206) hai luồng ghi + `seq` · `AD-9` (~208-215) tên `ghichu`, tiền tố · `AD-13` (~279-297) năm trường · `AD-18` (~364-383) tập mã. Bảng tech stack (~451): DB `ghichu` version 1, store `notes` + `drafts`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/limits.js` -- thêm: hằng cho `nowIso()` (số phút một giờ, độ rộng ô đệm hai chữ số) và `DB_VERSION` nếu khác `1` -- `nguong-tap-trung` loại trừ duy nhất file này, nên `time.js` không tự chế được số
- [x] `test/core-limits.test.js` -- sửa: thêm hằng mới vào `MONG_DOI` -- test ghim đúng tập hằng, thiếu là đỏ
- [x] `app/core/time.js` -- thêm: `nowIso()` trả ISO-8601 **có offset tại chỗ**, khớp `MAU_CREATED_AT` -- chỗ duy nhất được dựng mốc thời gian; giây lẻ cắt bỏ để `localStamp` luôn đúng 19 ký tự
- [x] `test/core-time.test.js` -- thêm: `nowIso()` khớp `MAU_CREATED_AT`, và `localStamp`/`localDate` nhận được nó không ném -- hình dạng sai chảy vào index IndexedDB sẽ hỏng im lặng tới Epic 6
- [x] `app/adapters/indexeddb.js` -- tạo: factory `taoNoteStore()` hiện thực `noteStore`; mở DB `ghichu` v1, `onupgradeneeded` tạo store `notes` (keyPath `id`) + index `localDate`, và store `drafts` (keyPath `tabId`) cho Story 1.7; mở DB **lười** ở lần gọi đầu, không ở lúc import; `QuotaExceededError`→`QUOTA`, còn lại →`DB`, trả về lời hứa **bị từ chối** -- tạo sẵn `drafts` giữ schema ở v1, khỏi bump version ở story sau
- [x] `app/adapters/localstorage.js` -- tạo: factory `taoSessionStore()` hiện thực `sessionStore` **đồng bộ**; bảng đóng băng ba khóa cấu hình → `ghichu.theme`/`ghichu.lastBackupAt`/`ghichu.persistDenied`, khóa lạ ném `TypeError`; `tabIdentity()` đọc/sinh `ghichu.tabId` ở `sessionStorage` bằng `crypto.randomUUID()`; `QuotaExceededError`→ ném `Error` có `code='QUOTA'` -- danh tính tab là phạm vi phiên, không phải cấu hình bền, nên nó không phải khóa thứ tư của `localStorage`
- [x] `app/core/state.js` -- thêm: bốn action `khoiDong()` (nạp `readAll`, sắp giảm dần theo `localStamp`, hỏng thì `banner`) · `themGhiChu(text)` · `xoaGhiChu(id)` — cả hai ghi trước rồi mới `datLai` — · `tuLuuNoiDung(id, text)` đổi `editing` ngay rồi hẹn `AUTOSAVE_MS` có `seq` gác; hai luồng đi qua đúng hai helper nội bộ dùng chung -- một đường ghi duy nhất cho mọi epic sau (AD-8)
- [x] `test/core-state.test.js` -- thêm: phủ toàn bộ I/O Matrix bằng cổng giả (ghi lại thứ tự gọi, cho phép ép từ chối); dùng `vi.useFakeTimers()` cho debounce; **cộng** test khẳng định `put` được gọi **trước** khi `state.notes` đổi, và **cộng** test khẳng định hẹn quá hạn không ghi -- thứ tự "ghi trước, state sau" là nửa cứng của FR-19, phải là test chứ không phải chú thích
- [x] `app/main.js` -- sửa: nối `taoNoteStore()` và `taoSessionStore()` thật, giữ `congTam()` cho ba cổng còn lại; chạy `khoiDong()` **chỉ khi** đang ở trình duyệt (`typeof document !== 'undefined'`) -- `trang-tinh.test.js` import file này ở Node và top-level không được chạm IndexedDB
- [x] `test/adapter-session-store.test.js` -- tạo: phủ đúng hai dòng cuối I/O Matrix (khóa lạ ném `TypeError` nêu cả ba khóa; `QuotaExceededError`→`QUOTA`, hỏng khác→`DB`) bằng một stub `localStorage` vài dòng, không giả lập kho nào -- ngoại lệ hẹp đã duyệt của luật "adapter không có test tự động"; hai dòng Matrix đó không có bằng chứng nào khác ngoài trình duyệt
- [x] `README.md` -- sửa: điền danh sách thử tay cho hai adapter (mở DevTools → Application: thấy DB `ghichu` v1, store `notes` có index `localDate` và store `drafts`; thêm rồi tải lại thấy ghi chú còn; xóa store rồi tải lại không vỡ; `localStorage` chỉ có khóa `ghichu.*`; mô phỏng hết dung lượng thấy dải băng chứ không im lặng) -- `adapters/` không có test tự động, đây là bằng chứng duy nhất

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then toàn bộ test cũ **và** mới pass, exit 0, không cần môi trường trình duyệt và không devDependency mới
- Given `test/harness.test.js` không bị sửa, when chạy nó, then hai adapter mới qua cả 5 bất biến — riêng bất biến 2 xác nhận **chỉ** `app/main.js` import chúng
- Given `npm test`, when chạy `state-tap-trung` · `nguong-tap-trung` · `date-tap-trung` · `fold-tap-trung` · `trang-tinh`, then cả năm xanh với mã mới
- Given tạm sửa `app/adapters/indexeddb.js` để đặt `store.state.notes = []`, when `npm test`, then `state-tap-trung.test.js` đỏ nêu đúng file/dòng; hoàn tác thì xanh
- Given `app/main.js` đã sửa, when `test/trang-tinh.test.js` import động nó ở Node, then import thành công, không ném, không có lời hứa bị từ chối treo lại
- Given grep `window|document|indexedDB|localStorage|sessionStorage|BroadcastChannel|navigator` trên `app/core/` và `app/ports/`, when chạy, then không ra kết quả nào
- Given phục vụ app ở `localhost` và chạy hết danh sách thử tay README, when kiểm DevTools, then DB `ghichu` v1 có `notes` (index `localDate`) và `drafts`; ghi chú sống qua lần tải lại; `localStorage` không mang ghi chú nào

## Implementation Notes

- **Ngoại lệ hẹp cho luật "adapter không có test".** Lúc lập kế hoạch, I/O Matrix nhận hai dòng
  về `localstorage.js` trong khi Boundaries lại cấm test adapter — mâu thuẫn do spec tự gây ra.
  Người dùng chọn nới ranh giới đúng hai ca đó. `test/adapter-session-store.test.js` có header
  nói rõ **đừng nới thêm**: mọi hành vi cần một kho thật vẫn thuộc danh sách thử tay.
- **Giao dịch chốt ở `oncomplete`, không ở `onsuccess` của từng yêu cầu.** Một yêu cầu thành
  công trong một giao dịch sau đó bị cuộn ngược thì chữ KHÔNG nằm trên đĩa; báo thành công lúc
  đó chính là "giả vờ đã lưu" mà FR-19 cấm.
- **Lời hứa mở kho hỏng thì bị quên.** Nhớ mãi một lần hỏng biến một trục trặc nhất thời (một
  tab khác đang giữ phiên bản cũ → `onblocked`) thành hỏng vĩnh viễn tới khi tải lại trang.
- **Hẹn tự lưu KHÔNG bị hủy lúc đặt hẹn mới.** `seq` là cơ chế chính thức của AD-8; để
  `clearTimeout` gánh phần đó thì phép gác `seq` không còn đường nào chạy qua, tức nó thành mã
  không ai kiểm đúng lúc nó là thứ duy nhất chặn một hẹn sống dai. Hẹn cũ vẫn nổ, nó chỉ không
  chạm cổng. Story 2.3 vẫn phải hủy hẹn treo trước khi chốt — đó là yêu cầu riêng của nó.
- **`crypto.randomUUID()` được gọi từ `core/state.js`.** Không nằm trong 7 global bị cấm, có ở
  cả Node nên `core/` vẫn test được, và AD-13 chốt nó là nguồn duy nhất của `id`. Không cổng nào
  cấp `id`, nên phương án còn lại là thêm cổng thứ sáu — Boundaries cấm.
- **`khoiDong()` ánh xạ một `createdAt` rác trong kho sang `banner = 'DB'`** thay vì ném. Ca này
  không có trong Matrix; với người dùng thì "kho đọc được nhưng dữ liệu không dùng được" và "kho
  hỏng" là cùng một chuyện, nên cùng một đường ra.
- **`tuLuuNoiDung` cập nhật cả `state.notes`** khi phép ghi thành công, không chỉ `editing` — nếu
  không, RAM sẽ giữ chữ cũ trong khi đĩa đã có chữ mới. Không nêu trong Matrix nhưng nhất quán
  với "ghi trước, state sau".
- **Ba hằng mới ở `limits.js`** (`MINUTES_PER_HOUR`, `TIME_FIELD_CHARS`, `YEAR_CHARS`) chỉ tồn
  tại vì `nguong-tap-trung` không chừa ngoại lệ nào cho `time.js`. Đã thêm vào `MONG_DOI`.
- **Chưa chạy danh sách thử tay.** Chín bước README chưa được thực thi trên trình duyệt, nên
  đường `QUOTA`/`DB` của `indexeddb.js` và schema thật của kho vẫn chưa có bằng chứng nào.
- Kiểm ngược đã chạy và đã hoàn tác: `store.state.notes = []` trong adapter → `state-tap-trung`
  đỏ đúng file/dòng; `const x = 42` trong `time.js` → `nguong-tap-trung` đỏ; `maCuaLoi` trả
  thẳng `MA_LOI.DB` → test QUOTA mới đỏ. `npm test`: 12 file, **200 pass**, exit 0.

## Spec Change Log

## Review Triage Log

### Vòng 1 — blind-hunter · edge-case-hunter · verification-gap

| # | Finding | Verdict | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Không action nào xóa `banner`; sau một lần `QUOTA` nó ở lại vĩnh viễn, kể cả qua các lần ghi thành công sau đó | `medium` | AD-8 (SPINE ~194) nói nguyên văn dải băng "ở lại cho tới khi **một phép ghi sau đó thành công**". Đọc `ghiTruocDatSau` và `henGhiDiSau`: nhánh thành công chỉ đặt `notes`, không đụng `banner`. Chưa có view nên chưa ai thấy, nhưng Epic 3 sẽ vẽ một dải băng không bao giờ tắt. |
| 2 | `tuLuuNoiDung` không kiểm `MAX_NOTE_CHARS`, trong khi `themGhiChu` chặn ở cửa vào | `medium` | Epic context: "ba cửa vào (chốt · sửa · file nạp) đều phải kiểm bằng nó". `tuLuuNoiDung` LÀ cửa *sửa*, và nó `put` thẳng văn bản dài bao nhiêu cũng được. Không test nào phủ ca sửa vượt trần. |
| 3 | `maBanner` dùng `hasOwnProperty(MA_LOI, ma)` — kiểm `code` có phải KHÓA của bảng, trong khi `loi.code` là GIÁ TRỊ | `low` | Tự đọc `errors.js`: `MA_LOI` hiện có khóa === giá trị, nên hôm nay đúng. Nhưng một mã lệch khóa/giá trị sẽ làm MỌI lỗi thật rơi về `DB` trong im lặng. Fix là sửa thẳng sang `Object.values`, không thêm nhánh. |
| 4 | `themGhiChu` chèn vào đầu `notes` mà không sắp lại; bản ghi có sẵn mới hơn thì mảng thôi giảm dần | `medium` | `notes: [banGhi, ...noiBo.notes]`. `khoiDong` thiết lập bất biến "giảm dần theo `localStamp`" (AD-6) và lưới của Epic 2 dựa vào đó. Đường tới: đổi giờ mùa hè, chỉnh đồng hồ máy, và file nạp của Epic 4. |
| 5 | `giaoDich.onerror` đọc `giaoDich.error`, nhưng lúc sự kiện lỗi bubble lên thì transaction chưa abort nên `.error` có thể còn `null` → `QUOTA` rơi về `DB` | `medium` | Đọc `trongGiaoDich`: chỉ gắn `yeuCau.onsuccess`, không gắn `yeuCau.onerror`. Theo IndexedDB spec, `transaction.error` chỉ được đặt khi abort, và abort xảy ra SAU khi sự kiện lỗi lan xong. Đây đúng là đường của bước 5 danh sách thử tay — nửa cứng của FR-19. |
| 6 | Không có `onversionchange`; và sau khi `onblocked` đã từ chối, `onsuccess` vẫn có thể nổ để lại một kết nối mồ côi không ai đóng | `low` | Gộp với #5? Không — gốc khác: #5 là ánh xạ mã lỗi, đây là vòng đời kết nối. Đọc `moKho`: không handler nào đóng kho. Chưa với tới được (chưa có lần bump phiên bản nào), nhưng bước 6 danh sách thử tay chạy đúng ca này, và fix là một dòng. |
| 7 | `nowIso` — dấu offset và phép chia giờ/phút không bao giờ được chạy ở múi giờ khác UTC | `medium` — pre-verified | verification-gap chứng minh bằng đột biến: đảo dấu, hoặc hoán `Math.floor(…)` với `%`, đều XANH trên runner UTC vì `getTimezoneOffset()` là `0`. Hậu quả: `createdAt` mang offset sai, ghi chú xếp sai ngày gần nửa đêm — đúng thứ AD-4 sinh ra để chặn. |
| 8 | Không gì khẳng định `main.js` nối adapter THẬT; đảo thứ tự spread trong `congThat()` vẫn xanh toàn suite | `medium` — pre-verified | verification-gap grep cả `test/`: `storeCuaApp` chỉ dùng ở `core-state.test.js:640-642`, và ba dòng đó chỉ đọc `dieuKien`. Chính chú thích của `congThat()` gọi tên hậu quả: "xanh ở mọi test, hỏng ở mọi lần dùng thật". |
| 9 | Hai ca cuối gọi `tuLuuNoiDung` ngoài chế độ fake timer, để lại một hẹn thật 400 ms nổ sau khi ca kết thúc | `low` | Đọc `core-state.test.js`: ca "trả về đồng bộ và sai kiểu đối số" và ca "sau một vòng nạp–thêm–xóa–tự lưu" đều không `vi.useFakeTimers()`. Hẹn nổ vào một store đã hết vòng đời — mầm flake, fix là bọc lại. |
| 10 | Hình dạng bản ghi năm trường được dựng ở ba nơi (`banGhiChuan`, `banGhiMoi`, `banGhiSua`) | `low` — loại | AD-13 khóa tập trường trong vòng đời `schemaVersion: 1`, nên "thêm/đổi tên trường" là ca bị cấm chứ không phải ca sẽ tới. Và fix là một factory dùng chung bắc qua `core/`→`adapters/` — thêm bề mặt công khai, đúng thứ nhà này đã chốt tránh (`moTa` chép ba lần có chủ ý). |
| 11 | README đánh số lại từ 7 sau một `###` mới nên renderer sẽ hiện 1, 2, 3 | `false` | CommonMark lấy số bắt đầu của danh sách từ **mục đầu tiên**, nên `7.` `8.` `9.` hiện đúng là 7, 8, 9. Tham chiếu chéo "đúng schema ở bước 1" vẫn khớp. |
| 12 | `MS_PER_DAY` còn để `24 * 60 * 60 * 1000` ngay cạnh `MINUTES_PER_HOUR` mới | `false` | `app/core/limits.js` là file DUY NHẤT được `nguong-tap-trung` loại trừ — nó chính là chỗ số literal được phép sống. Không có luật nào bị vi phạm, và đó là mã có từ Story 1.3. |
| 13 | `khoiDong` coi `readAll` trả về không phải mảng là "bản ghi hỏng" | `low` — loại | Chữ ký cổng nói `readAll` trả mảng, và adapter đã chuẩn hóa `?? []`. Không đường nào được nêu để một cổng phá hợp đồng. Fix là thêm một nhánh gác cho trạng thái chưa ai chứng minh là tới được. |
| 14 | Đổi ghi chú đang sửa trước khi hẹn nổ → chữ của mẩu trước bị bỏ im lặng; và `xoaGhiChu` chạy trong lúc `put` đang bay có thể hồi sinh bản ghi trên đĩa | `medium` — hoãn | Thật, và tự kiểm xác nhận `seq` là MỘT số đếm chung nên hẹn của mẩu trước luôn bị bỏ. Nhưng `editing` chỉ có một ô (tập khóa state đã bị ghim), nên "rời một lần sửa" là hành vi Story 5.1 sở hữu — đúng như AD-8 giao việc hủy hẹn treo cho Story 2.3 chứ không cho story này. Fix nhỏ nhất là một phép flush, không tầm thường. |
| 15 | `maCuaLoi` của `indexeddb.js` không có test — đột biến nó thành `MA_LOI.DB` vẫn xanh | `medium` — hoãn | verification-gap tự chấm `defer` và tôi đồng ý: đóng nó tử tế là export `maCuaLoi` (thêm bề mặt) hoặc dựng một IndexedDB giả — đúng thứ luật "adapter không có test" sinh ra để tránh. Ngoại lệ hẹp cho `localstorage.js` đã duyệt riêng; mở rộng là quyết định của người dùng, không phải của review. |
| 16 | `sessionStore.write` nhận giá trị không phải chuỗi rồi ép kiểu (`false` → `"false"`, truthy) | `low` — loại | Thật và khó chịu, nhưng chưa ai gọi `write` (Story 1.8+), và fix là thêm một nhánh gác cho trạng thái chưa được chứng minh là tới được. Ghi lại ở đây để Story 1.8 thấy. |
| 17 | `crypto.randomUUID` vắng mặt ở non-secure context sẽ hiện dải băng `DB` gây hiểu nhầm | `false` | `file://` chặn cả ES module nên trang không chạy tới đó, và README đã ghi rõ đây là hành vi dự kiến. Không có đường nào tới. |
| 18 | `khoiDong` gọi hai lần, hoặc thêm ghi chú trong lúc `readAll` đang chờ, sẽ xóa mất ghi chú mới | `low` — loại | `main.js` gọi đúng một lần sau một cửa `typeof document`. Không có giao diện nào để thêm ghi chú trong lúc nạp. Fix là memo hóa hoặc gộp — thêm phức tạp cho một ca chưa tới được. |

**Định tuyến:** không có `intent_gap`, không có `bad_spec` → **không loopback**. `patch`: #1 · #2 · #3 · #4 (cùng file, gốc khác nhau) · #5 · #6 · #7 · #8 · #9. `defer`: #14, #15 (cộng #16 ghi kèm). Loại: #10, #11, #12, #13, #17, #18.

## Design Notes

**Vì sao adapter phải mở DB lười.** `test/trang-tinh.test.js` import động `app/main.js` ở Node, và `main.js` dựng tập cổng ở top-level. Nếu `taoNoteStore()` gọi `indexedDB.open` ngay lúc dựng thì import ở Node ném `indexedDB is not defined` và test đó đỏ. Nên factory chỉ đóng gói một lời hứa mở DB được tạo ở **lần gọi phương thức đầu tiên** và nhớ lại cho các lần sau. Cùng lý do đó, `khoiDong()` ở `main.js` phải nằm sau một cửa `typeof document !== 'undefined'`.

**Vì sao `nowIso()` phải cắt giây lẻ.** `localStamp` lấy đúng 19 ký tự đầu và so chuỗi để sắp xếp. `toISOString()` cho `…T09:00:00.123Z` — 19 ký tự đầu vẫn đúng, nhưng nó ở **UTC**, không phải giờ tại chỗ, nên `localDate` sẽ sai ngày ở gần nửa đêm với offset `+07:00`. `nowIso()` phải dựng giờ tại chỗ rồi ghép offset từ `getTimezoneOffset()` (dấu ngược với trực giác: `-420` nghĩa là `+07:00`).

**Vì sao thứ tự "ghi trước, state sau" cần test riêng chứ không suy ra được.** Một action `await put(x); datLai(...)` và một action `datLai(...); await put(x)` cho cùng kết quả ở mọi ca **thành công**. Chỉ ca `put` từ chối mới phân biệt được chúng, và đó chính là ca mà FR-19 nói tới. Cổng giả phải ghi lại **thứ tự** gọi, không chỉ ghi lại "đã gọi".

**Cạm bẫy: `banSaoDongBang` ném với object không thuần.** Bản ghi ghi chú dựng bằng `{}` thì an toàn; nhưng một bản ghi đọc ra từ IndexedDB cũng là object thuần nên cũng an toàn. Điều **không** an toàn là để một `Date` lọt vào `createdAt` — mọi mốc thời gian trong state là **chuỗi**.

**Cạm bẫy: từ cấm AD-16 so khớp chuỗi con.** Đặt tên biến `daLuuXong`, `savedNote`, `isSaving` trong adapter cũng đỏ, dù adapter không phải view. Dùng `daGhiXuongKho` thì cũng đỏ (`dangGhi`/`daGhi` nằm trong danh sách) — chọn từ vựng khác, ví dụ `ketQuaGiaoDich`.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng
- Kiểm ngược dương tính: tạm thêm `store.state.notes = []` vào `app/adapters/indexeddb.js` → `state-tap-trung.test.js` đỏ đúng file/dòng; xóa
- Kiểm ngược dương tính: tạm thêm `const x = 42;` vào `app/core/time.js` → `nguong-tap-trung.test.js` đỏ; xóa
- `git status --porcelain` -- expected: chỉ các file story này tạo/sửa

**Manual checks (if no CLI):**
- Phục vụ `localhost` rồi chạy hết danh sách thử tay mới trong README; DevTools → Application → IndexedDB `ghichu` phải là version 1, có store `notes` với index `localDate` và store `drafts`
