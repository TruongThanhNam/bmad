---
title: 'Story 1.7 — Bản nháp riêng từng tab, nhận lại được bản bỏ rơi'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
baseline_revision: '835bdddd8e4e7d0d67f396c55d7c60079d9cc875'
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: ['oversized']
deferred:
  - summary: >-
      Nhịp tim 10 giây so với ngưỡng bỏ rơi 30 giây không chịu nổi phép bóp timer của
      trình duyệt ở tab nền, nên một tab còn sống có thể bị coi là đã bỏ rơi.
    evidence: |-
      Chromium bóp `setInterval` của tab ẩn xuống >= 60 giây (và đóng băng hẳn theo Page
      Lifecycle / bfcache), trong khi `DRAFT_STALE_MS` là 30000. Một tab nền còn chữ chưa
      chốt sẽ hết nhịp và tab khác nhận mất bản nháp — đúng thứ FR-20 cấm. Hai hằng số này
      do AD-3 và Story 1.2 chốt, không phải story này sinh ra; bản vá nhỏ nhất (đập lại nhịp
      ở `visibilitychange`, hoặc nới ngưỡng) là một quyết định thiết kế của spine.
    location: >-
      app/main.js:77 (setInterval DRAFT_BEAT_MS) vs app/core/limits.js:33
    severity: medium
  - summary: >-
      Bước 4 xóa mọi bản nháp rỗng kể cả của một tab còn nhịp tim, làm phép phát hiện tab
      nhân đôi ở bước 1 mất chỗ dựa.
    evidence: |-
      `quyetDinhBanNhap` bước 4 chỉ kiểm `!coChu(ban)`, không kiểm `conNhipTim`. Tab A mở với
      bản nháp rỗng có bản ghi; tab B khởi động xóa nó; sau đó một tab nhân đôi của A không
      còn thấy bản ghi cùng danh tính nào "còn sống" nên KHÔNG sinh danh tính mới, và hai tab
      cùng ghi dưới một `tabId`. Cần ba tab và một trình tự chính xác, và hiện chưa có ô soạn
      thảo nào (Story 2.2) để tới được. Mã đang theo ĐÚNG nguyên văn AD-3 bước 4 ("xóa mọi
      bản ghi có `text` rỗng"), nên sửa là đổi một quy tắc spine, không phải vá một lỗi.
    location: >-
      app/core/draft.js (bước 4 trong quyetDinhBanNhap)
    severity: medium
  - summary: >-
      Phần nối bản nháp trong `app/main.js` không có test tự động — xóa dòng nhịp tim đi thì
      cả bộ test vẫn xanh.
    evidence: |-
      `test/trang-tinh.test.js` chỉ nghiệm thu `app/main.js` import được ở Node; không test nào
      vào được nhánh `typeof document !== 'undefined'`. Mọi ca của ba action bản nháp gọi thẳng
      trên một store tự dựng. Đây là quy ước đã chốt của nhà này (phần nối mỏng nghiệm thu bằng
      danh sách thử tay), và mục 10 với 13 của README có phủ; đóng nó lại đòi một khuôn stub
      `document`/timer mà repo chưa dùng ở đâu.
    location: >-
      app/main.js:73-77
    severity: medium
---

<intent-contract>

## Intent

**Problem:** Sau Story 1.6 kho `notes` đã bền, nhưng store `drafts` mới chỉ là một object store rỗng được tạo sẵn trong schema v1 — chưa có một dòng logic nào. Nghĩa là chữ Nam gõ dở mà chưa bấm `Ctrl+Enter` vẫn mất sạch khi đóng tab, và **nửa cứng của FR-20** ("tab khác không bao giờ lấy mất bản nháp đang gõ") chưa tồn tại. AD-3 nói rõ quy tắc khởi động bản nháp phải là **bốn bước trong MỘT transaction `readwrite`** — dựng nó thành bốn phép gọi rời rạc là tái tạo đúng cuộc đua mà §4.2 của solution-design đã bác bỏ một lần.

**Approach:** Mở rộng cổng `noteStore` bằng hai phương thức bản nháp (`claimDraft` chạy trọn bốn bước trong một giao dịch, `putDraft` ghi một bản nháp cùng nhịp tim), hiện thực chúng trong `app/adapters/indexeddb.js`; thêm `writeTabIdentity` vào `sessionStore` để ghi lại danh tính mới khi adapter phát hiện tab bị nhân đôi; thêm `msBetweenIso` vào `core/time.js` (nơi duy nhất được dựng `Date`) để so được độ cũ của nhịp tim; và thêm ba action vào `core/state.js`: `khoiDongBanNhap()` · `datBanNhap(text)` · `nhipTimBanNhap()`.

## Boundaries & Constraints

**Always:**
- Bốn bước của AD-3 nằm trong **đúng một** `kho.transaction(['drafts'], 'readwrite')`, không tách. Không `await` một lời hứa ngoài giao dịch ở giữa chừng — giao dịch IndexedDB tự đóng khi vòng lặp sự kiện nhả ra mà không còn yêu cầu treo.
- Bản nháp **không bao giờ** phát tin và **không bao giờ** bị tab khác đọc/ghi khi chủ của nó còn nhịp tim (AD-7, AD-3 tầng B). Story này không chạm cổng `channel`.
- `core/` và `ports/` vẫn thuần: không import từ `adapters/`, không chạm 7 global bị cấm (`test/harness.test.js` bất biến 5). `app/main.js` vẫn là file duy nhất import từ `adapters/` và gọi `taoStore` đúng một lần.
- Mọi số literal ngoài `0`/`1` ở `app/core/limits.js` — `DRAFT_BEAT_MS` và `DRAFT_STALE_MS` **đã có sẵn**, không thêm hằng mới trừ khi thật cần (thêm thì phải cập nhật `MONG_DOI` ở `test/core-limits.test.js`).
- Không `new Date(` / `Date.now(` ở đâu ngoài `app/core/time.js` (`test/date-tap-trung.test.js` loại trừ duy nhất file đó). So độ cũ nhịp tim đi qua một hàm thuần mới ở `time.js`, không so chuỗi trực tiếp trên mốc có offset (AD-4 cấm).
- Cổng bất đồng bộ (`noteStore`) **từ chối lời hứa**; cổng đồng bộ (`sessionStore`) **ném** — không bao giờ vừa ném vừa từ chối. Adapter ném mã của tập đóng AD-18 qua `loiUngDung(...)`: `QuotaExceededError`→`QUOTA`, hỏng khác→`DB`.
- `app/ports/note-store.js` phải giữ từ vựng **trừu tượng**: `test/state-tap-trung.test.js` cửa (c) quét `app/ports/` tìm `IndexedDB`/`localStorage`/`BroadcastChannel` **kể cả trong chú thích và chuỗi**.
- Tập bảy khóa state bị `test/core-state.test.js` ghim — `draft: { text, seq }` đã có sẵn và là **trường duy nhất** story này được dùng. `tabId` sống trong closure của `taoStore`, không phải một trường state.
- Tránh 20 từ cấm AD-16 (so khớp **chuỗi con, không phân biệt hoa thường**): `daLuu`, `dangGhi`, `daGhi`, `saved`, `saving`, `isDirty`, `inFlight`… Dùng từ vựng khác (`nhipTim`, `banNhap`, `ketQuaGiaoDich`).
- Theo quy ước mã của các file hiện có: header `//` nêu *vì sao* + mã AD, JSDoc tiếng Việt, export tên tiếng Anh ở `ports/`+`time.js`, tên action tiếng Việt không dấu ở `state.js`, `moTa(giaTri)` chép tại chỗ.

**Never:**
- Không `chotGhiChu` (Story 2.3 — nó ghi `notes` **cùng transaction** với việc làm rỗng `drafts`, và nó sở hữu phần hủy hẹn treo). Không giao diện, không ô soạn thảo (Story 2.2).
- Không thêm cổng thứ sáu cho `drafts`: AD-8 đòi Story 2.3 ghi `notes` và `drafts` trong **một** transaction, mà hai cổng là hai giao dịch. Bản nháp đi vào cổng `noteStore` cùng kho.
- Không bump `PHIEN_BAN_KHO` — store `drafts` đã có ở v1, đó chính là lý do Story 1.6 tạo sẵn nó.
- Không test tự động cho `app/adapters/`, không thêm devDependency (`fake-indexeddb`, `jsdom`). Ngoại lệ hẹp của `test/adapter-session-store.test.js` **không** được nới thêm ngoài `writeTabIdentity` (chạy được với một stub `sessionStorage` vài dòng, không cần giả lập kho nào).
- Không đồng bộ, không `BroadcastChannel`, không `readOnly`/lệch phiên bản (Epic 7).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Khởi động, chưa có bản nháp nào | `drafts` rỗng, `sessionStorage` chưa có `tabId` | `sessionStore.tabIdentity()` sinh id mới; `claimDraft` trả `{ tabId, text: '' }`; `state.draft` = `{ text: '', seq: 0 }` | N/A |
| Khởi động, có bản của chính mình | `drafts` có `{ tabId: 'A', text: 'pho', heartbeat: cũ }`, tab mang `tabId` `'A'` | trả `{ tabId: 'A', text: 'pho' }`; `state.draft.text` = `'pho'`; **không** nhận bản của ai khác | N/A |
| Tab bị nhân đôi | `drafts` có `{ tabId: 'A', heartbeat }` mới hơn `DRAFT_STALE_MS`, tab mới cũng mang `'A'` | adapter sinh `tabId` mới bằng `crypto.randomUUID()`, trả nó ra; action gọi `sessionStore.writeTabIdentity(idMoi)`; bản nháp của tab kia **giữ nguyên**, tab mới nhận `text: ''` | N/A |
| Nhận bản bỏ rơi | `drafts` có hai bản của tab khác, cả hai quá `DRAFT_STALE_MS` | nhận **đúng một** — bản có `heartbeat` **cũ nhất**; nó được ghi lại dưới `tabId` của mình và bản cũ bị xóa, cùng giao dịch | N/A |
| Bản bỏ lại còn nhịp tim | bản duy nhất của tab khác, `heartbeat` mới hơn `DRAFT_STALE_MS` | **không** nhận; trả `text: ''`; bản đó còn nguyên trong kho (nửa cứng FR-20) | N/A |
| Dọn bản rỗng | `drafts` có bản `{ tabId: 'Z', text: '' }` | bị xóa trong cùng giao dịch; bản có `text` khác rỗng không bị đụng | N/A |
| Hai tab khởi động cùng lúc | cùng một bản bỏ rơi | chỉ một tab nhận được; tab kia thấy nó đã biến mất → `text: ''` | N/A |
| Khởi động, kho hỏng | `claimDraft` từ chối với `code='DB'` | `state.draft` giữ `{ text: '', seq: 0 }`; `state.banner = 'DB'` | action không ném |
| Tự lưu bản nháp | gõ 3 phím trong `AUTOSAVE_MS` | `state.draft.text` đổi ngay ở **mỗi** phím và `seq` tăng mỗi lần; `putDraft` gọi **đúng một lần** sau hẹn cuối | N/A |
| Hẹn bản nháp quá hạn | hẹn nổ nhưng `draft.seq` đã tăng | hẹn **bị bỏ**, `putDraft` không chạy | N/A |
| Tự lưu bản nháp, ghi hỏng | `putDraft` từ chối `code='QUOTA'` | chữ trong `state.draft.text` **không bị hoàn tác**; `banner='QUOTA'` | action không ném |
| Bản nháp quá dài | `text.length > MAX_NOTE_CHARS` | `putDraft` **không** được gọi; `banner='TOO_LONG'`; `state.draft.text` **vẫn** nhận chữ (không cắt im lặng) | action không ném |
| Nhịp tim | `nhipTimBanNhap()` sau khi đã khởi động | `putDraft` được gọi với `tabId` hiện tại, `text` hiện tại và `heartbeat = nowIso()`; `state` **không đổi** | ghi hỏng → `banner`, không ném |
| Nhịp tim trước khi khởi động | chưa gọi `khoiDongBanNhap()` | không chạm cổng, không đổi state | N/A |
| Sai kiểu đối số | `datBanNhap(7)` | `TypeError` nêu tên tham số — lỗi lập trình, không phải banner | ném |
| `msBetweenIso` sai định dạng | `msBetweenIso('hôm qua', nowIso())` | `TypeError` nêu hình dạng mong đợi | ném |

</intent-contract>

## Code Map

- `app/core/limits.js` (dòng 30, 33) — `DRAFT_BEAT_MS = 10000` và `DRAFT_STALE_MS = 30000` **đã có sẵn**, chú thích đã ghi "(Story 1.7)". Không cần thêm hằng. File duy nhất `nguong-tap-trung` loại trừ.
- `app/core/time.js` — `nowIso()` (~dòng 107) là chỗ duy nhất dựng mốc; `daysBetween` (~158) là tiền lệ của "hàm được phép dựng `Date`" và `mocGiuaTrua`/`ngayCoThat` là khuôn mẫu kiểm đầu vào. Thêm `msBetweenIso(a, b)` ở đây và **chỉ** ở đây.
- `app/core/state.js` — `taoStore(ports)` giữ `ports` trong closure; `datLai(nhanhMoi)` là đường **duy nhất** đổi state, gọi ở **cuối** action, không gán vào trường lồng trong `noiBo`. `henGhiDiSau(seqCuaHen, dungBanGhi)` (~354) là khuôn mẫu debounce+`seq` — story này cần một bản cho `draft.seq` (mục tiêu tự lưu thứ hai của AD-8); `ghiTruocDatSau` (~333) **không** hợp cho bản nháp. `maBanner(loi)` (~101) đã đúng. `stateRong()` (~153) đã khai báo `draft: { text: '', seq: 0 }` — không thêm khóa.
- `app/ports/note-store.js` — `NOTE_STORE_METHODS` (dòng 68) là dữ liệu chạy được, `ports/index.js` gộp nó vào `kiemTraPorts`; thêm tên vào mảng này thì `congTam()` và `portsDay()` của test tự sinh stub. JSDoc phải trừu tượng (cửa (c)).
- `app/ports/session-store.js` — `SESSION_STORE_METHODS` (dòng 79); `SessionStoreTabIdentity` (~62) là khuôn mẫu JSDoc cho `writeTabIdentity`. Header (dòng 11-22) chốt quy tắc đồng bộ/ném — đọc trước khi sửa adapter.
- `app/adapters/indexeddb.js` — `trongGiaoDich(cheDo, thanTac)` (~141) đang **hardcode** `STORE_NOTES` ở hai chỗ (`kho.transaction([STORE_NOTES], ...)` dòng 147, `giaoDich.objectStore(STORE_NOTES)` dòng 164): phải tổng quát hóa để nhận tên store. `loiCuaSuKien` (~157) và cách chốt ở `oncomplete` giữ nguyên — đó là nửa cứng FR-19. `STORE_DRAFTS`/`KHOA_DRAFTS` (dòng 34, 36) đã khai báo. `maCuaLoi` (~48) dùng lại.
- `app/adapters/localstorage.js` — `KHOA_TAB = 'ghichu.tabId'` (dòng 29) và `tabIdentity()` (~86) là khuôn mẫu cho `writeTabIdentity`; mọi phương thức bọc `try/catch` → `loiUngDung(maCuaLoi(loi))`.
- `app/main.js` — `congTam()` (~34) sinh stub từ `PORT_METHODS` nên phương thức mới tự có; `congThat()` (~55) đặt adapter thật **sau** phép trải. Cửa `typeof document !== 'undefined'` (~67) là nơi thêm `khoiDongBanNhap()`; top-level không được chạm kho (`test/trang-tinh.test.js` import file này ở **Node**).
- `test/core-state.test.js` — `portsDay()` (~19) dựng cổng giả từ `PORT_METHODS`; `KHOA_STATE` (~40) ghim **đúng** bảy khóa; ca ở ~53 so `toEqual` cả khối state rỗng. Dùng `vi.useFakeTimers()` cho debounce — và **bọc mọi ca gọi `datBanNhap`**, nếu không một hẹn thật 400 ms nổ sau khi ca kết thúc.
- `test/core-time.test.js` — khuôn mẫu test cho `msBetweenIso`; runner chạy ở **UTC**, nên ca kiểm phải dùng hai mốc có **offset khác nhau** thì mới bắt được lỗi bỏ qua offset.
- `test/state-tap-trung.test.js` — cửa (b) `TU_CAM_AD16` (dòng 78-100) quét **mọi** file dưới `app/`; cửa (c) `TU_CAM_CONG_NGHE` (dòng 109) chỉ quét `app/ports/`; cửa (d) `taoStore(` đúng một lần.
- `test/harness.test.js` — **không sửa**: chỉ `main.js` import `adapters/`; cấm bare specifier; specifier tương đối phải kết `.js`; `core/`+`ports/` không chạm global.
- `test/adapter-session-store.test.js` — stub `localStorage`/`sessionStorage` vài dòng; header nói rõ **đừng nới** ngoại lệ. `writeTabIdentity` nằm trong cùng lớp "không cần kho thật".
- `README.md` — mục "Danh sách thử tay cho `app/adapters/`" (dòng 90), đánh số liên tục tới **9**; thêm mục mới bắt đầu từ **10** dưới một `###` cho bản nháp.
- Spine (`_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md`): **AD-3 dòng 96-112** là văn bản có thẩm quyền của bốn bước — đọc nguyên văn trước khi viết `claimDraft`; AD-7 (~161-180) cấm đồng bộ bản nháp; AD-8 (~196-203) `seq` và ràng buộc một transaction của Story 2.3.

## Tasks & Acceptance

**Execution:**
- `app/core/time.js` -- thêm `msBetweenIso(a, b)`: nhận hai chuỗi ISO-8601 **có offset**, trả số mili giây từ `a` tới `b` (giữ dấu), ném `TypeError` nêu hình dạng mong đợi khi đầu vào không phải mốc có thật -- nơi duy nhất được dựng `Date`; so chuỗi trực tiếp trên mốc có offset là thứ AD-4 cấm, mà độ cũ nhịp tim đúng là một phép trừ
- `test/core-time.test.js` -- thêm ca cho `msBetweenIso`: hai mốc **khác offset** ra đúng hiệu thật, thứ tự đảo ra số âm, đầu vào rác thì ném -- runner chạy ở UTC nên chỉ ca khác offset mới bắt được lỗi bỏ qua offset
- `app/ports/note-store.js` -- thêm typedef `DraftRecord` (`tabId · text · heartbeat`) và hai chữ ký `claimDraft({ tabId, now, staleMs })` → `Promise<{ tabId, text }>` · `putDraft(draft)` → `Promise<void>`; thêm cả hai tên vào `NOTE_STORE_METHODS` -- danh sách tên là dữ liệu `kiemTraPorts` tiêu thụ; giữ từ vựng trừu tượng vì cửa (c) quét cả chú thích
- `app/ports/session-store.js` -- thêm chữ ký `writeTabIdentity(id)` (đồng bộ, ném khi hỏng) và tên vào `SESSION_STORE_METHODS` -- adapter kho phát hiện tab nhân đôi và sinh danh tính mới, nhưng nó không được chạm kho phạm vi phiên; action là chỗ nối hai cổng
- `app/adapters/indexeddb.js` -- tổng quát hóa `trongGiaoDich(tenStore, cheDo, thanTac)` (giữ nguyên `oncomplete`/`loiCuaSuKien`), rồi hiện thực `claimDraft` chạy **trọn bốn bước AD-3 trong một giao dịch `readwrite` trên `drafts`** bằng `getAll()` rồi quyết định đồng bộ trong callback, và `putDraft` -- một `getAll` rồi ghi/xóa ngay trong cùng callback giữ giao dịch sống; tách thành nhiều phép gọi là tái tạo cuộc đua §4.2 đã bác
- `app/adapters/localstorage.js` -- thêm `writeTabIdentity(id)` ghi `KHOA_TAB` vào kho phạm vi phiên, cùng khuôn `try/catch` → `loiUngDung(maCuaLoi(loi))` -- danh tính tab không phải khóa thứ tư của kho cấu hình
- `app/core/state.js` -- thêm ba action: `khoiDongBanNhap()` (lấy `tabIdentity()`, gọi `claimDraft`, ghi lại danh tính qua `writeTabIdentity` **chỉ khi** adapter trả `tabId` khác, đặt `draft.text`; hỏng → `banner`), `datBanNhap(text)` (đổi `draft` ngay + tăng `draft.seq`, hẹn `AUTOSAVE_MS` có `seq` gác, trần `MAX_NOTE_CHARS` cho `TOO_LONG` nhưng **không** chặn chữ vào state), `nhipTimBanNhap()` (ghi `heartbeat = nowIso()` cho bản nháp hiện tại, **không** đổi state); `tabId` giữ trong closure, không phải trường state -- bản nháp là mục tiêu tự lưu thứ hai của AD-8 và phải có `seq` riêng của nó
- `test/core-state.test.js` -- thêm ca phủ **toàn bộ** I/O Matrix bằng cổng giả ghi lại thứ tự gọi và cho phép ép từ chối; `vi.useFakeTimers()` bọc mọi ca có `datBanNhap`; **cộng** ca khẳng định bản còn nhịp tim không bị nhận và ca khẳng định `KHOA_STATE` vẫn đúng bảy khóa sau khi chạy cả ba action -- "tab khác không lấy mất bản nháp" là nửa cứng FR-20, phải là test chứ không phải chú thích
- `test/adapter-session-store.test.js` -- thêm ca cho `writeTabIdentity` (ghi đúng khóa `ghichu.tabId` vào kho phạm vi phiên; kho ném `QuotaExceededError` → `Error` có `code='QUOTA'`) -- cùng lớp "không cần kho thật" với ngoại lệ đã duyệt; không nới thêm
- `app/main.js` -- gọi `store.khoiDongBanNhap()` trong cửa `typeof document !== 'undefined'` đã có, và đặt nhịp tim định kỳ `DRAFT_BEAT_MS` gọi `store.nhipTimBanNhap()` trong **cùng** cửa đó -- nhịp tim là một mốc thời gian thực của trình duyệt, không phải logic lõi; đặt ở đây thì Node import file này vẫn không tạo hẹn nào
- `README.md` -- thêm mục thử tay cho bản nháp, đánh số tiếp từ **10**: bản nháp sống qua lần tải lại; nhân đôi tab thì `ghichu.tabId` của tab mới **khác** và bản nháp tab cũ còn nguyên; để một tab gõ dở rồi đóng, đợi quá `DRAFT_STALE_MS`, mở tab mới thì nhận lại được đúng một lần -- `adapters/` không có test tự động, đây là bằng chứng duy nhất của bốn bước chạy trên kho thật

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then toàn bộ test cũ **và** mới pass, exit 0, không cần môi trường trình duyệt và không devDependency mới
- Given `test/harness.test.js` và `test/state-tap-trung.test.js` không bị sửa, when chạy chúng, then cả hai xanh — riêng cửa (c) xác nhận `app/ports/note-store.js` mới **không** chứa tên công nghệ nào
- Given `npm test`, when chạy `date-tap-trung` · `nguong-tap-trung` · `trang-tinh`, then cả ba xanh: không `new Date(` ngoài `time.js`, không số literal mới ngoài `limits.js`, và `app/main.js` vẫn import động được ở Node không ném
- Given tạm đổi `claimDraft` để nhận **cả** bản còn nhịp tim, when `npm test`, then ca FR-20 đỏ đúng tên; hoàn tác thì xanh
- Given tạm bỏ phép gác `seq` trong hẹn của `datBanNhap`, when `npm test`, then ca "hẹn quá hạn bị bỏ" đỏ; hoàn tác thì xanh
- Given grep `window|document|indexedDB|localStorage|sessionStorage|BroadcastChannel|navigator` trên `app/core/` và `app/ports/`, when chạy, then không ra kết quả nào
- Given phục vụ app ở `localhost` và chạy hết các mục thử tay mới của README, when kiểm DevTools, then store `drafts` mang bản ghi đúng ba trường `tabId · text · heartbeat`, và không bản nháp nào xuất hiện ở `localStorage`

## Spec Change Log

## Review Triage Log

### 2026-09-11 — Review pass

- verdicts: 30 findings — high 0, medium 5, low 13, false 12, maybe-false 0
- findings:
  - `[false]` `[reject]` blind-hunter: thiếu migration cho store `drafts`, `STORE_DRAFTS` không được định nghĩa — `app/adapters/indexeddb.js:34` khai báo `STORE_DRAFTS` và `:82-84` tạo store trong `onupgradeneeded`, cả hai có từ Story 1.6 nên không nằm trong diff. Không bản ghi nào reject.
  - `[false]` `[reject]` blind-hunter: thiếu `DRAFT_STALE_MS`/`DRAFT_BEAT_MS` ở `limits.js` — `app/core/limits.js:30` và `:33` đã có cả hai từ Story 1.2, chú thích ghi sẵn "(Story 1.7)". Diff không sửa file đó vì không cần.
  - `[medium]` `[defer]` blind-hunter: nhịp tim 10s so với ngưỡng 30s không chịu nổi phép bóp timer ở tab nền — thật, nhưng hai hằng số do AD-3/Story 1.2 chốt và bản vá là một quyết định thiết kế của spine. Ghi vào `deferred`.
  - `[medium]` `[patch]` blind-hunter: `khoiDongBanNhap` ghi đè chữ gõ trước khi claim trả về — đã vá: chụp `draft.seq` lúc phát lệnh claim, chỉ áp `ketQua.text` khi `seq` chưa đổi; thêm test gõ trong lúc claim chưa xong.
  - `[medium]` `[patch]` blind-hunter: nhịp tim ghi vượt `MAX_NOTE_CHARS` trong khi `datBanNhap` từ chối — đã vá: `nhipTimBanNhap` trả về sớm khi vượt trần, không chạm cổng; thêm test và siết lại ca "không tắt dải băng" cho nó thật sự chạy một lần ghi thành công.
  - `[low]` `[reject]` blind-hunter: `crypto.randomUUID` không có nhánh gác ở `core/draft.js` — AD-12 chốt app chỉ chạy HTTPS/localhost, và `localstorage.js:90-91` đã ghi rõ quyết định "không có nhánh dự phòng nào ở đây" cho cùng lời gọi. Vá là thêm nhánh cho một trạng thái chưa chứng minh được đường tới.
  - `[medium]` `[defer]` blind-hunter: bước 4 xóa bản rỗng của cả tab còn sống — thật và có chuỗi hậu quả qua phép phát hiện tab nhân đôi, nhưng mã đang theo đúng nguyên văn AD-3 bước 4, nên sửa là đổi một AC. Ghi vào `deferred`.
  - `[low]` `[reject]` blind-hunter: `putDraft` không kiểm đầu vào ở biên cổng — mọi đường ghi đều đi qua action đã kiểm kiểu; vá là thêm nhánh gác cho trạng thái chưa tới được.
  - `[low]` `[reject]` blind-hunter: fixture test dùng hình dạng mốc mà production không sinh ra (`+00:00`, `.500Z`) — các ca vẫn tập thể dục đúng logic ngưỡng; không nêu được tác hại cụ thể nào ngoài "lỏng hơn hợp đồng".
  - `[low]` `[reject]` blind-hunter: `claimDraft` có thể trả `{ tabId, text: '' }` mặc định nếu `onsuccess` không chạy — `getAll` thành công thì `onsuccess` luôn nổ trước `oncomplete`, hỏng thì giao dịch abort và lời hứa bị từ chối; trạng thái đó chưa chứng minh được đường tới, và vá là thêm cờ cộng nhánh.
  - `[low]` `[patch]` blind-hunter: README bước 12 bảo đóng tab ngay sau khi gõ, trong khi chữ gõ trong cửa sổ debounce chưa được ghi — đã vá: thêm câu dặn đợi quá `AUTOSAVE_MS` kèm lý do.
  - `[medium]` `[patch]` edge-case: gõ trước khi claim trả về bị ghi đè — trùng gốc với phát hiện của blind-hunter, cùng bản vá.
  - `[low]` `[reject]` edge-case: hẹn tự lưu cũ nổ sau khi claim trả về sẽ ghi đè chữ mới — bản vá `seq` ở trên đã đóng chính đường này; không còn tác hại riêng.
  - `[medium]` `[patch]` edge-case: nhịp tim ghi bản nháp vượt trần — trùng gốc với phát hiện của blind-hunter, cùng bản vá.
  - `[low]` `[reject]` edge-case: `khoiDongBanNhap` gọi hai lần thì claim chạy chồng — `app/main.js` gọi đúng một lần trong một cửa; không có đường nào gọi lại.
  - `[low]` `[reject]` edge-case: `crypto.randomUUID` vắng mặt ở non-secure context — cùng refutation với dòng của blind-hunter (AD-12 cộng tiền lệ đã chốt ở `localstorage.js`).
  - `[medium]` `[patch]` edge-case: nhịp tim ở tương lai cho tuổi âm, luôn dưới ngưỡng nên bản bỏ rơi sống mãi — thật và cùng lớp hỏng với nhịp tim rác mà `doCu` đã gác; đã vá: tuổi âm trả `Infinity`, thêm test.
  - `[medium]` `[defer]` edge-case: bước 4 xóa bản rỗng của tab còn sống — trùng gốc với dòng của blind-hunter, cùng mục `deferred`.
  - `[false]` `[reject]` edge-case: nhiều bản ghi cùng `tabId` — `drafts` có `keyPath: 'tabId'`, khóa là duy nhất nên trạng thái đó không tồn tại được.
  - `[false]` `[reject]` edge-case: bản ghi có `tabId` thiếu hoặc không phải chuỗi làm `store.delete(undefined)` ném — `keyPath` là `tabId` nên mọi bản ghi trong store đều mang nó.
  - `[medium]` `[defer]` edge-case: `setInterval` không bao giờ được hủy, tab bị đóng băng rồi tỉnh lại — cùng gốc với dòng bóp timer ở trên, cùng mục `deferred`.
  - `[low]` `[reject]` edge-case: hẹn tự lưu nổ lúc `tabCuaMinh` còn `null` thì chữ không được ghi — cửa sổ đó chỉ dài bằng một vòng claim lúc khởi động, và nhịp tim kế tiếp ghi lại; vá là thêm phép đặt lại hẹn.
  - `[false]` `[reject]` edge-case: `writeTabIdentity` ném thì bản nháp tích lại dưới một danh tính không ai nhận lại được — quá `DRAFT_STALE_MS` thì bước 3 nhận lại được chính nó, nên trạng thái tự lành.
  - `[false]` `[reject]` edge-case: `claimDraft` trả mặc định khi `onsuccess` không chạy — cùng refutation với dòng của blind-hunter.
  - `[medium]` `[defer]` edge-case (claim): tài liệu nói "bản nháp tab kia giữ nguyên" nhưng bước 4 xóa bản rỗng của tab còn sống — trùng gốc với dòng bước 4, cùng mục `deferred`.
  - `[medium]` `[patch]` edge-case (claim): tài liệu nói vượt trần thì `putDraft` không được gọi, nhưng nhịp tim vẫn ghi — trùng gốc, cùng bản vá.
  - `[medium]` `[patch]` verification-gap (pre-verified): không assertion nào quan sát thứ nhịp tim ghi xuống, nên phép gác trần một chiều đi lọt — nhận nguyên bằng chứng đã lọc; đã vá cùng bản vá nhịp tim, cộng test đúng hình dạng mà lớp này đề nghị.
  - `[medium]` `[defer]` verification-gap (pre-verified): phần nối bản nháp ở `main.js` không có test tự động, xóa dòng nhịp tim đi vẫn xanh — nhận cả disposition `defer` của lớp này; ghi vào `deferred`.
  - `[medium]` `[patch]` verification-gap (other): `ghiBanNhap` ghi bất kể độ dài trong khi `datBanNhap` từ chối — cùng gốc với hai dòng trên, cùng bản vá.
  - `[low]` `[reject]` intent-alignment: bốn AC xoay quanh chữ "transaction" có bằng chứng nằm ở danh sách thử tay chứ không ở test — đúng, và đó là đánh đổi đã chốt của nhà này ("`adapters/` không có test tự động"), đã ghi tường minh trong Boundaries của spec và trong header `app/core/draft.js`. Không phải một khiếm khuyết của thay đổi này.

### 2026-09-11 — Review pass 2 (follow-up, chạy danh sách thử tay trên trình duyệt thật)

- verdicts: 2 findings — high 1, medium 0, low 0, false 1, maybe-false 0
- findings:
  - `[high]` `[patch]` thử tay 10d: tải lại trang trong vòng `DRAFT_STALE_MS` làm mất bản nháp — tái hiện độc lập hai lần trên Edge thật: `tabId` đổi sau một lần tải lại thường và `draft.text` về rỗng. Gốc là AD-3 bước 1 dùng `heartbeat` để đoán "có tab khác đang sống", trong khi sau tải lại thì nhịp tim còn mới chính là của tab này ở kiếp trước; nhịp tim đập mỗi `DRAFT_BEAT_MS` còn ngưỡng là `DRAFT_STALE_MS` nên **mọi** lần tải lại đều rơi vào cửa sổ đó. Người dùng chọn phương án khóa sống. Đã vá: bước 1 xin `navigator.locks` giữ `ghichu.tab.<tabId>` suốt đời tab và chốt danh tính từ đó; bước 2 dùng bản của chính mình bất kể nhịp tim; bước 3 giữ nguyên nhịp tim. Cập nhật AD-3 trong spine và mục 10-11 của README.
  - `[false]` `[reject]` thử tay 13a: nhịp tim không nhích lên sau một `DRAFT_BEAT_MS` — đo lại riêng trên một tab không tải lại thì nhịp tim nhích đều (13:43:28 → 13:43:37 → 13:43:47). Lượt đo đầu bám vào bản ghi đã mồ côi sau lỗi 10d, nên đây là hệ quả đo chứ không phải một khiếm khuyết thứ hai.

## Auto Run Result

Status: done

**Tóm tắt thay đổi.** Bản nháp riêng từng tab đã sống: quy tắc bốn bước của AD-3 chạy trọn trong một giao dịch `readwrite` trên store `drafts`, với phần *quyết định* tách ra thành một module lõi thuần (`app/core/draft.js`) để nửa cứng của FR-20 là một test chứ không phải một chú thích, còn phần *giao dịch* — tức phần nguyên tử — ở lại adapter và áp bản kế hoạch đồng bộ ngay trong callback của `getAll()`. Ba action mới trên store: `khoiDongBanNhap()` · `datBanNhap(text)` · `nhipTimBanNhap()`.

**File đã đổi:**
- `app/core/draft.js` (mới) — bốn bước của AD-3 dưới dạng hàm thuần trả về bản kế hoạch ghi/xóa.
- `app/core/time.js` — thêm `msBetweenIso(a, b)`, nơi duy nhất được dựng `Date` để đo độ cũ nhịp tim.
- `app/core/state.js` — ba action bản nháp, `tabId` giữ trong closure, debounce riêng gác bằng `draft.seq`.
- `app/ports/note-store.js` · `app/ports/session-store.js` — chữ ký `claimDraft`/`putDraft`/`writeTabIdentity` và tên vào hai bảng phương thức.
- `app/adapters/indexeddb.js` — `trongGiaoDich` nhận tên store; `claimDraft` và `putDraft`.
- `app/adapters/localstorage.js` — `writeTabIdentity`.
- `app/main.js` — gọi `khoiDongBanNhap()` và đặt nhịp tim, trong cửa `typeof document` đã có.
- `test/core-draft.test.js` (mới) · `test/core-state.test.js` · `test/core-time.test.js` · `test/adapter-session-store.test.js` — phủ toàn bộ I/O Matrix.
- `README.md` — mục thử tay 10-13 cho bản nháp.

**Review.** 30 phát hiện từ bốn lớp: 4 nhóm được vá (3 `medium`, 1 `low`), 3 nhóm hoãn (đều `medium`, ghi ở frontmatter `deferred`), còn lại bác bỏ với lý do ghi từng dòng ở triage log trên — đáng chú ý là hai phát hiện "thiếu `STORE_DRAFTS`" và "thiếu `DRAFT_STALE_MS`" đều sai: cả hai đã có từ story trước nên không xuất hiện trong diff.

**Đề nghị review tiếp: `true`.** Ba nhóm `medium` được vá trong một lượt. Rủi ro chưa nghiệm thu được, nêu đích danh: **tính nguyên tử của bốn bước trên kho thật không có test nào phủ** — mọi bằng chứng tự động nằm ở lớp hàm thuần và lớp cổng giả, còn "hai tab cùng lúc chỉ một tab nhận" thì test dựng bằng hai lời gọi *tuần tự*. Một lần sửa `claimDraft` thành chuỗi `await` nối nhau sẽ giết giao dịch mà cả bộ test vẫn xanh. Bằng chứng duy nhất là mục 10-13 của README, và **chưa ai chạy chúng**.

**Kiểm chứng đã chạy.** `npm test`: 13 file, **253 pass**, exit 0, không devDependency mới. Kiểm ngược dương tính (chạy rồi hoàn tác): bỏ phép so ngưỡng trong `conNhipTim` → 6 ca đỏ, trong đó ca FR-20 đỏ đúng tên; `const x = 42` trong `time.js` → `nguong-tap-trung` đỏ; `IndexedDB` trong chú thích `note-store.js` → `state-tap-trung` cửa (c) đỏ; bỏ phép gác `draft.seq` → ca "hẹn quá hạn bị bỏ" đỏ. Grep bảy global bị cấm trên `app/core/` và `app/ports/`: không kết quả. `harness.test.js` và `state-tap-trung.test.js` không bị sửa và đều xanh.

**Rủi ro còn lại.** (1) ~~Danh sách thử tay 10-13 chưa được thực thi~~ — đã chạy ở vòng 2, xem dưới. (2) Ba mục ở `deferred` — phép bóp timer ở tab nền, bước 4 xóa bản rỗng của tab còn sống, và phần nối `main.js` không có test — đều còn nguyên.

### Vòng 2 — danh sách thử tay đã chạy trên Edge thật (2026-09-11)

Điều khiển Edge headless qua CDP bằng Node thuần: không cài gói nào, không đụng `package.json`, nên luật "không thêm devDependency" và "adapter không có test tự động" đều còn nguyên. Kịch bản nằm ở scratchpad của phiên, không vào repo.

**12/12 phép đo đạt** sau bản vá: schema `ghichu` v1 (`notes` + index `localDate`, `drafts` keyPath `tabId`) · bản ghi đúng ba trường · `localStorage` sạch · **tải lại giữ nguyên chữ và `tabId`** · tab nhân đôi sinh `tabId` mới, nhận bản rỗng, và **không đụng** bản nháp tab gốc · nhịp tim nhích đều mỗi ~10s · bản rỗng bị dọn · bản bỏ rơi được **đúng một** trong hai tab mở đồng thời nhận lại, bản cũ biến mất, tổng số bản ghi không tăng.

Hai rủi ro mà vòng 1 nêu đích danh giờ đã có bằng chứng: tính nguyên tử của phép nhận (mục 12) và schema thật của kho (mục "schema"). Cái chưa có bằng chứng: đường `QUOTA`/`DB` của `claimDraft`.

**Một sai sót của quy trình, ghi lại để không lặp.** Commit `f0c7af0` lọt một test đỏ. Lúc chạy kiểm ngược ở vòng 1, lệnh `git checkout -- app/core/draft.js` dùng để hoàn tác đột biến đã lấy lại bản **đã staged từ trước vòng vá**, xóa mất bản vá `doCu` (nhịp tim ở tương lai); và `npm test` không được chạy lại sau bước hoàn tác cuối. Bài học: hoàn tác đột biến bằng bản sao file, không bằng `git checkout --` khi chỉ mục có thể đã cũ, và luôn chạy lại toàn bộ test **sau** thao tác hoàn tác cuối cùng. Đã khôi phục trong `cac1186`.

## Design Notes

**Vì sao bản nháp đi vào cổng `noteStore` chứ không phải một cổng thứ sáu.** AD-8 đòi `chotGhiChu` (Story 2.3) ghi bản ghi `notes` **cùng với** việc làm rỗng `drafts` trong **một** transaction. Hai cổng là hai adapter, và hai adapter mở hai giao dịch — ràng buộc đó sẽ không dựng được nữa. Solution-design §7 đã ghi nhận chính chỗ thiếu này ("danh sách port ở Structural Seed không có port nào rõ ràng cho `drafts`"); đây là cách giải quyết rẻ nhất giữ được ràng buộc của Story 2.3.

**Vì sao `claimDraft` phải là `getAll()` rồi quyết định trong cùng callback.** Giao dịch IndexedDB tự đóng khi vòng lặp sự kiện nhả ra mà không còn yêu cầu nào treo. Đọc từng bản ghi bằng nhiều lời hứa `await` nối nhau sẽ làm giao dịch chết giữa chừng với `TransactionInactiveError`, và tính nguyên tử — thứ duy nhất chặn hai tab cùng nhận một bản nháp — biến mất trong im lặng. Nên: một `getAll()`, `onsuccess` chạy đồng bộ, mọi phép `put`/`delete` phát ra **ngay trong** handler đó, và kết quả chốt ở `oncomplete`.

**Vì sao bước 1 và bước 2 không mâu thuẫn.** "Có bản ghi mang `tabId` của mình với nhịp tim **còn mới**" nghĩa là một tab khác đang sống với cùng danh tính (Nam nhân đôi tab, `sessionStorage` được sao chép theo) → sinh danh tính mới. "Có bản ghi của chính mình" với nhịp tim **đã cũ** nghĩa là chính tab này vừa đóng rồi mở lại → dùng nó. Cùng một bản ghi, hai kết luận, phân biệt bằng đúng một phép so `DRAFT_STALE_MS`.

**Vì sao nhịp tim đặt ở `main.js` chứ không trong `taoStore`.** Một `setInterval` dựng bên trong store sẽ sống trong **mọi** ca test tạo store, và không có đường nào dừng nó — mầm flake y hệt thứ đã bị bắt ở vòng review Story 1.6 (finding #9). Action `nhipTimBanNhap()` thì thuần theo nghĩa "gọi mới chạy", nên test gọi thẳng nó.

**Cạm bẫy: `draft.seq` và `editing.seq` là hai số đếm độc lập.** AD-8 nói "mỗi mục tiêu tự lưu mang một `seq`". Dùng chung một số đếm cho cả hai thì gõ vào ô soạn thảo sẽ hủy hẹn của mẩu đang sửa, và ngược lại. `henGhiDiSau` hiện tại đọc `noiBo.editing.seq` — bản cho bản nháp phải đọc `noiBo.draft.seq`.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng
- Kiểm ngược dương tính: tạm bỏ phép so `DRAFT_STALE_MS` trong `claimDraft` → ca FR-20 đỏ; hoàn tác
- Kiểm ngược dương tính: tạm thêm `const x = 42;` vào `app/core/time.js` → `nguong-tap-trung.test.js` đỏ; hoàn tác
- Kiểm ngược dương tính: tạm viết `IndexedDB` vào chú thích của `app/ports/note-store.js` → `state-tap-trung.test.js` cửa (c) đỏ; hoàn tác
- `git status --porcelain` -- expected: chỉ các file story này tạo/sửa

**Manual checks (if no CLI):**
- Phục vụ `localhost`, chạy các mục thử tay mới trong README; DevTools → Application → IndexedDB → `ghichu` → `drafts` phải mang bản ghi đúng ba trường, và Session Storage mang `ghichu.tabId` khác nhau ở hai tab
