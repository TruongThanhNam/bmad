---
title: 'Story 1.5 — Khối state duy nhất và bộ khung action'
type: 'feature'
created: '2026-09-10'
status: 'done'
route: 'dispatch'
baseline_commit: '6ea62bf8671ee2dd14bda094c3d2f2d5a706d40f'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chưa có nơi nào giữ dữ liệu ứng dụng. Story 1.6–1.8 và mọi epic sau đều cần một khối state và một đường đổi state duy nhất; nếu để mỗi story tự dựng phần state của nó thì sẽ có hai vùng cùng sửa một dữ liệu theo hai cách rồi lệch nhau (AD-1). Lõi cũng chưa có chữ ký port nào, nên chưa có cách viết action mà không lôi IndexedDB vào `core/` (AD-2).

**Approach:** Tạo `app/core/state.js` — một khối state khai báo đầy đủ hình dạng, chỉ đổi được bên trong action của chính module đó — cộng `app/ports/` khai báo chữ ký năm port (`noteStore`, `sessionStore`, `channel`, `fileIO`, `quota`) bằng từ vựng trừu tượng. Story này chỉ dựng **khung** cộng các action không cần port (khối điều kiện theo AD-15); luồng ghi bền thuộc Story 1.6. Hai bộ test tập trung ghim AD-1 và AD-16 để story sau không phá được.

## Boundaries & Constraints

**Always:**
- `core/` và `ports/` thuần: không import từ `adapters/`/`view/`, không chạm `window`/`document`/`indexedDB`/`localStorage`/`sessionStorage`/`BroadcastChannel`/`navigator` (AD-2, ghim bởi `test/harness.test.js` bất biến 5).
- Chữ ký port dùng từ vựng trừu tượng, **kể cả trong chú thích**: nói "kho ghi chú bền", "kênh liên tab", không nói tên công nghệ.
- Khối điều kiện là **một** giá trị `{ keyword: string | null, date: 'yyyy-MM-dd' | null }`, khởi tạo `{ null, null }`; đúng một action đổi nó (`datDieuKien(partial)`) và đúng một action đưa về `{null,null}` (`xoaHetDieuKien()`) (AD-15).
- State **không có** trường mang nghĩa "đang lưu" / "đã lưu" / "chưa chốt" / "số ký tự còn lại" (AD-16).
- Mọi ngưỡng số import từ `app/core/limits.js`; mọi mã lỗi từ `app/core/errors.js`. Không số literal ngoài `0`/`1`.
- Theo đúng quy ước mã của `app/core/time.js`: header `//` nêu trách nhiệm + mã AD, JSDoc tiếng Việt, export tên tiếng Anh, nội bộ tiếng Việt không dấu, `moTa(giaTri)` chép tại chỗ cho `TypeError`.
- `app/main.js` là file duy nhất được import từ `app/adapters/` và là nơi duy nhất nối adapter thật vào port.

**Never:**
- Không viết adapter, không viết view, không chạm IndexedDB — Story 1.6+.
- Không dựng action ghi bền (`chotGhiChu`, `suaGhiChu`, `xoaGhiChu`, `datBanNhap`, `napFileSaoLuu`) và không dựng `query.js`/`backup.js`.
- Không thêm trường state nào ngoài hình dạng đã chốt; không thêm mã lỗi thứ bảy.
- Không sửa `test/harness.test.js`; không refactor ba bộ `*-tap-trung.test.js` sẵn có sang helper dùng chung.
- Không thêm dependency runtime; không bước build.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Khởi tạo | `taoStore(ports)` | state mới: `notes: []`, `dieuKien: { keyword: null, date: null }`, các trường tầng C ở giá trị rỗng | `ports` thiếu port hoặc thiếu phương thức → `TypeError` nêu tên còn thiếu |
| Đặt một nửa điều kiện | `datDieuKien({ keyword: 'phở' })` | `dieuKien = { keyword: 'phở', date: null }` — nửa kia giữ nguyên | N/A |
| Đặt ngày hợp lệ | `datDieuKien({ date: '2026-09-10' })` | `dieuKien.date = '2026-09-10'` | N/A |
| Ngày sai định dạng / gõ dở | `datDieuKien({ date: '2026-9' })` | `dieuKien.date` **giữ giá trị cũ**, không ném — lỗi định dạng là chuyện của view (AD-15) | N/A |
| Chuỗi rỗng | `datDieuKien({ keyword: '' })` | `keyword = null` — vắng mặt điều kiện, không phải điều kiện rỗng | N/A |
| Khóa lạ | `datDieuKien({ mau: 'vàng' })` | `TypeError` — `partial` chỉ nhận `keyword`/`date` | N/A |
| Xóa hết | điều kiện đang có cả hai nửa; `xoaHetDieuKien()` | `dieuKien = { keyword: null, date: null }` | N/A |
| Ghi thẳng vào state | mã ngoài `state.js` gán `store.state.notes = [...]` | bị chặn: state đọc ra là đóng băng (hoặc bản sao chỉ đọc) | gán ném ở strict mode |
| Hai store | gọi `taoStore` hai lần trong `main.js` | test tập trung đỏ — `main.js` chỉ được gọi đúng một lần | N/A |
| Port thiếu phương thức | `taoStore({ noteStore: {}, … })` | `TypeError` nêu **tên port và tên phương thức** còn thiếu | ném ngay lúc khởi động, không đợi tới lúc dùng |

## Quyết định đã chốt

- **`app/ports/` = JSDoc + kiểm hình dạng lúc chạy.** Ngoài `@typedef`/`@callback`, có `kiemTraPorts(ports)` ném `TypeError` nêu đúng port/phương thức còn thiếu, và `taoStore` gọi nó trước khi làm gì khác. Lý do: `adapters/` **không có test tự động** (bằng chứng duy nhất là danh sách thử tay trong README), nên đây là chốt chặn duy nhất bắt được adapter nối sai — và nó nổ lúc khởi động với thông báo đúng chỗ, thay vì `undefined is not a function` giữa một transaction.
- **`app/main.js` viết bộ xương bootstrap thật.** `main.js` import `taoStore` và gọi nó **đúng một lần**; test tập trung ghim "chỉ `main.js` gọi `taoStore`". Lý do: AC "đọc `main.js` thấy đây là nơi duy nhất nối adapter" phải được thoả bằng test, không bằng văn bản. Chấp nhận đánh đổi: object port tạm sẽ được Story 1.6 thay bằng adapter thật.
- **Giữ spec đầy đủ dù ~5.000 token.** Độ dài đến từ Boundaries và Code Map dày (10 AD có thẩm quyền, 5 bộ test tập trung phải thoả), không từ nhiều mục tiêu. Tách `app/ports/` ra story riêng sẽ tạo phụ thuộc ngược vì `taoStore(ports)` cần chữ ký port.

</frozen-after-approval>

## Code Map

- `app/core/time.js` — khuôn mẫu module `core/`: header giải thích *vì sao*, `MAU_*` là regex hằng cấp module, `moTa(giaTri)` dựng thông điệp `TypeError`, import `./limits.js` có đuôi `.js`. Chép lối này; `moTa` chép lại, **đừng** import từ nó.
- `app/core/errors.js` — `MA_LOI` (6 mã, `Object.freeze`), `loiUngDung(code) -> Error` có `.code`, `microcopyLoi(code)`. `VERSION_SKEW` sẽ do `state.js` ném ở Story 1.7 (AD-18) — story này chỉ để chỗ, không dựng.
- `app/core/limits.js` — nguồn duy nhất của mọi ngưỡng, kèm `APP_VERSION = '0.1.0'`. Story này **không cần hằng mới**; nếu phát sinh thì phải cập nhật `MONG_DOI` ở `test/core-limits.test.js`.
- `test/harness.test.js` — 5 bất biến, **không sửa**. Bất biến 4 đòi mọi specifier tương đối dưới `app/` kết `.js`/`.css` và trỏ file có thật → `app/ports/` phải có file thật, không chỉ `.gitkeep`. Bất biến 5 quét `app/core/**` + `app/ports/**` cấm 7 từ global (chú thích đã bị bỏ trước khi khớp, **nội dung chuỗi thì không**).
- `test/date-tap-trung.test.js` — **khuôn mẫu trực tiếp** cho bộ quét mới: `danhSachFileJs` cục bộ, `boChuThichJs` trước khi quét, thông báo nêu đúng `file:dòng`, self-test dương tính lẫn âm tính, một mục "lỗ đã biết" ghim hành vi.
- `test/nguong-tap-trung.test.js` — bỏ nội dung chuỗi/regex nhưng **bắt số trong `${…}`**; `state.js` và `ports/` phải xanh với nó.
- `test/fold-tap-trung.test.js` — cửa (d) bắt cấu trúc ánh xạ `'<ký tự có dấu>': 'ascii'`; JSDoc ví dụ trong `state.js` đừng viết dạng đó.
- `test/helpers/quet-nguon.js` — `boChuThichJs(ma)` giữ nguyên số dòng; bắt buộc dùng trong bộ quét mới.
- `ARCHITECTURE-SPINE.md` (planning-artifacts/architecture/…) — văn bản có thẩm quyền: AD-1 (~60-67), AD-2 (~69-76), AD-3 ba tầng state (~78-110), AD-7 hình dạng bản tin kênh (~164-180), AD-8 hai luồng ghi + `seq` (~183-205), AD-15 khối điều kiện (~314-327), AD-16 (~329-339), AD-17 dải băng (~340-365), AD-21 chế độ chỉ đọc (~419-425). Structural Seed ~462-476 ghi `state.js # khối state duy nhất + toàn bộ action` và `ports/ # noteStore · sessionStore · channel · fileIO · quota`.

## Tasks & Acceptance

**Execution:**
- [x] `app/ports/*.js` -- tạo: chữ ký năm port bằng JSDoc `@typedef`/`@callback` với từ vựng trừu tượng (`noteStore`: đọc hết · ghi ghi chú · xóa · thay toàn bộ trong một giao dịch; `sessionStore`: đọc/ghi/xóa ba khóa cấu hình + danh tính tab; `channel`: phát · nghe; `fileIO`: xuất một file · đọc một file người dùng chọn; `quota`: ước lượng đã dùng/hạn mức) -- lõi cần thế giới cung cấp gì phải nói được mà không nêu tên công nghệ (AD-2)
- [x] `app/ports/index.js` -- tạo: `kiemTraPorts(ports)` — bảng tên port → danh sách phương thức bắt buộc, ném `TypeError` nêu đúng port và phương thức còn thiếu; không chạm global nào -- `adapters/` không có test tự động nên đây là chốt chặn duy nhất bắt adapter nối sai
- [x] `app/core/state.js` -- tạo: `taoStore(ports)` gọi `kiemTraPorts` trước tiên, trả về một store có state đọc-chỉ-đọc, `dieuKien` khởi tạo `{null,null}`, và các action `datDieuKien(partial)` · `xoaHetDieuKien()`; khai báo đủ hình dạng state ba tầng (mảng ghi chú, mẩu đang mở rộng/đang sửa, dải băng, `seq` tự lưu, cờ chỉ đọc) ở giá trị rỗng -- một khối, một đường đổi (AD-1, AD-15, AD-16)
- [x] `app/main.js` -- sửa: import `taoStore` và gọi nó **đúng một lần** với object port tạm (Story 1.6 thay bằng adapter thật); giữ chú thích nói rõ đây là file duy nhất được import từ `adapters/` -- điểm nối duy nhất phải là mã chạy được, không phải lời hứa (AD-2)
- [x] `test/core-state.test.js` -- tạo: phủ toàn bộ I/O Matrix; **cộng** test khẳng định state đọc ra không gán được từ ngoài; **cộng** test liệt kê **đúng** tập khóa của state (thêm/xóa trường là đỏ) -- hình dạng state là hợp đồng của Story 1.6+
- [x] `test/state-tap-trung.test.js` -- tạo: quét mọi `.js` dưới `app/` trừ `app/core/state.js`, bỏ chú thích bằng `boChuThichJs`, làm đỏ (a) mọi phép gán vào `.state`/`state.` ngoài `state.js`, (b) mọi định danh mang nghĩa "đang lưu"/"đã lưu"/"chưa chốt"/"số ký tự còn lại" ở bất kỳ đâu dưới `app/`, (c) từ khóa công nghệ (`IndexedDB`, `localStorage`, `BroadcastChannel`) trong `app/ports/` kể cả trong chuỗi, (d) mọi lần gọi `taoStore(` ngoài `app/main.js`, và trong `main.js` thì đúng một lần; self-test dương tính lẫn âm tính -- AD-1 và AD-16 phải là test, không phải lời hứa

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then 121 test cũ **và** test mới đều pass, exit 0, không cần môi trường trình duyệt
- Given `test/harness.test.js` không bị sửa, when chạy nó, then `app/core/state.js` và mọi file dưới `app/ports/` qua cả 5 bất biến kiến trúc
- Given tạm thả `app/view/probe.js` chứa `store.state.notes = []` và một biến `dangLuu`, when `npm test`, then `state-tap-trung.test.js` đỏ và nêu đúng file cùng dòng cho **cả hai** cửa; xóa probe thì xanh lại
- Given `app/core/state.js` và `app/ports/`, when đọc mã, then không con số nào viết thẳng ngoài `0`/`1`, và `nguong-tap-trung.test.js` · `date-tap-trung.test.js` · `fold-tap-trung.test.js` đều xanh
- Given grep `window|document|indexedDB|localStorage|sessionStorage|BroadcastChannel|navigator` trên `app/core/` và `app/ports/`, when chạy, then không ra kết quả nào
- Given `app/main.js` đã sửa, when `test/trang-tinh.test.js` import động nó ở Node, then import thành công, không ném — object port tạm phải **đủ** mọi phương thức để qua `kiemTraPorts`
- Given tạm thêm `taoStore({...})` lần thứ hai vào `app/main.js`, when `npm test`, then `state-tap-trung.test.js` đỏ; hoàn tác thì xanh lại

## Implementation Notes

- Tập khóa state chốt đúng bảy trường: `notes` · `draft {text,seq}` · `dieuKien {keyword,date}` ·
  `expandedId` · `editing {id,text,seq}` · `banner` · `readOnly`. Không thêm trường cho tầng B′
  (theme, mốc sao lưu, cờ persist) và không thêm `tabId`: chúng chưa nằm trong hình dạng mà
  Tasks liệt kê, và `core-state.test.js` ghim ĐÚNG tập này nên Story 1.6+ thêm là phải sửa test.
- `state` đọc ra là **bản sao đóng băng sâu**, dựng lại sau mỗi action, không phải khối nội bộ
  đóng băng: đóng băng thẳng khối nội bộ sẽ làm chính các action không ghi được vào nó.
- Chuỗi rỗng cho `date` cũng thành `null` (không chỉ cho `keyword`): xóa hết chữ trong ô ngày là
  vắng mặt điều kiện, còn "gõ dở" là chuỗi sai định dạng khác rỗng — chỉ dạng sau mới giữ giá trị cũ.
- `datDieuKien` ném `TypeError` khi nửa nào sai KIỂU (số, object) hoặc khi nhận `undefined` tường
  minh; chỉ lỗi ĐỊNH DẠNG của `date` mới im lặng giữ giá trị cũ.
- Năm tệp chữ ký cổng mỗi tệp xuất một mảng tên phương thức đóng băng; `ports/index.js` gộp thành
  `PORT_METHODS` rồi `kiemTraPorts` đọc bảng đó. Nhờ vậy JSDoc và phép kiểm không trôi khỏi nhau,
  và `main.js` dựng được tập cổng tạm **từ chính bảng** nên không thể thiếu phương thức.
- `kiemTraPorts` gộp mọi chỗ thiếu vào một thông báo (`cong.phuongThuc`, phân cách bằng dấu phẩy)
  thay vì ném ở chỗ thiếu đầu tiên — người viết adapter mới thường thiếu vài phương thức cùng lúc.
- Cửa (a) của `state-tap-trung.test.js` dùng hai biểu thức: một neo vào `.state` (cho phép không
  bước trường nào, nên `store.state = {}` cũng đỏ), một neo vào định danh `state` nhưng đòi ít nhất
  một bước trường — nếu không thì `const state = taoStore(ports)` sẽ đỏ oan. Viết dãn ra
  (`store . state [ k ] = 1`) làm cả hai cửa cùng nổ; báo dư một lần là chấp nhận được.
- Cửa (b) so khớp CHUỖI CON không phân biệt hoa thường, không theo ranh giới từ, nên `isSavingNow`
  và `saveStatus` cũng đỏ. Đã kiểm âm tính trên microcopy thật của `errors.js` ("Chữ vừa gõ CHƯA
  được lưu.") — không đỏ oan.
- `app/main.js` export `store`. Chú thích ghi rõ không module nào dưới `app/` được import lại từ
  đó; export chỉ để gỡ lỗi tay và để Story 1.6 nối tiếp, không phải để `view/` lấy store.

## Spec Change Log

## Review Triage Log

### Vòng 1 — blind-hunter · edge-case-hunter · verification-gap

| # | Finding | Verdict | Bằng chứng |
| --- | --- | --- | --- |
| 1 | `datDieuKien` gán `keyword` **trước** khi kiểm `date`, nên `{keyword:'pho', date:7}` ném sau khi nội bộ đã đổi, và `capNhatAnh()` không chạy | `high` | Tự chạy: sau lần ném, `state.dieuKien.keyword` vẫn `null` (ảnh cũ) nhưng khối nội bộ đã là `'pho'`; action **kế tiếp** (`{date:'2026-09-10'}`) cho ra `{keyword:'pho', date:'2026-09-10'}` — giá trị từ một action ĐÃ NÉM lọt vào state. Đúng thứ AD-1 cấm: state đổi ngoài một action thành công. |
| 2 | `app/main.js` chỉ được nghiệm thu bằng "import resolve được", nên mất `export store` hoặc biến stub thành im lặng vẫn xanh | `medium` | verification-gap (pre-verified) + tự kiểm: đổi stub thành `return undefined;` → **157/157 pass**. `trang-tinh.test.js:83` chỉ khẳng định namespace object là defined, và `kiemTraPorts` chỉ kiểm `typeof === 'function'`. Chính chú thích `main.js` nói stub im lặng là điều không được xảy ra. |
| 3 | Cửa (c) chạy `boChuThichJs` trước khi quét, nên tên công nghệ trong **chú thích** của `ports/` không bị bắt — trái Boundaries "trừu tượng **kể cả trong chú thích**" | `medium` | Tự kiểm: `app/ports/probe.js` chứa đúng một dòng `// dung BroadcastChannel o day` → 157/157 pass. Self-test `:1166` còn khẳng định tường minh rằng chú thích **không** bị bắt. Mã hiện tại vẫn sạch (grep thô không ra gì) — đây là lỗ ở bộ quét, không phải ở mã. |
| 4 | Cửa (a) chỉ bắt toán tử gán, bỏ lọt `Object.assign(store.state,…)`, `delete store.state.x`, `store.state.notes.push/sort/splice`, và `store['state'].notes = …` | `medium` | Đọc `CUA_GAN_STATE` (`:944-950`): cả hai regex đòi một `TOAN_TU_GAN` theo sau. Header của file lại tự nhận bắt "cả nhánh chưa ai chạy" — với các dạng trên thì lời nhận đó sai. |
| 5 | `capNhatAnh()` dựng lại bản sao sâu **toàn bộ** state kể cả `notes`, ở mọi action — kể cả `datDieuKien({})` không đổi gì | `medium` | `datDieuKien` là đường gõ từng phím của ô tìm kiếm (AD-15) và `notes` là toàn bộ ghi chú trong RAM (AD-6, tới 2.000 bản × `MAX_NOTE_CHARS`), nên chi phí mỗi phím tuyến tính theo cả kho. Trần 200 ms của NFR-2 là chỗ nó vỡ. Story 1.6 là story đưa `notes` vào state, nên cái bẫy được gài ở đây. |
| 6 | `banSaoDongBang` trả `Date`/`Map`/instance của class **theo tham chiếu, không đóng băng** — hẹp hơn lời hứa "đóng băng SÂU" ở header | `low` | `laObjectThuong` loại mọi thứ không phải object thuần/mảng, và nhánh cuối `return giaTri`. Chưa với tới được (tập khóa state bị ghim, toàn giá trị thuần), nhưng lời bảo đảm trong tài liệu rộng hơn mã. |
| 7 | `TU_CAM_AD16` thiếu từ vựng "một phép ghi đang bay": `isDirty`, `inFlight`, `dangGui` — `pendingWrite` qua cửa (b) | `low` | Đọc danh sách `:954-972`: chỉ phủ nhóm lưu/save và nhóm ký-tự-còn-lại. **Loại phần đề xuất `pending`/`busy`/`dongBo`**: cửa (b) quét mọi định danh dưới `app/`, nên ba từ đó sẽ báo oan tên biến hợp lệ của Story 1.6 (hẹn debounce) và Epic 7 (đồng bộ liên tab). |
| 8 | Thiếu ba test rẻ: thành viên port tồn tại nhưng không phải hàm; `kiemTraPorts` trả về chính `ports` như JSDoc hứa; `{date: undefined}` | `low` | Tự chạy `taoStore({…, quota:{estimate:42}})` → ném đúng `quota.estimate`, tức nhánh đúng nhưng không test nào phủ. Hợp đồng `kiemTraPorts(p) === p` là thứ adapter Story 1.6 được JSDoc mời dựa vào. |
| 9 | `kiemTraPorts` nhận thêm cổng thứ sáu không khai báo mà không ném | `low` — loại | Tự chạy: đúng là không ném. Nhưng chú thích `Object.freeze` nói về việc **bảng `PORT_METHODS`** không bị gán lén, và điều đó đúng. Một cổng không khai báo là trơ: lõi chỉ đọc theo `PORT_NAMES`. Không harm nào được nêu tên. |
| 10 | Vòng tham chiếu trong `banSaoDongBang` → tràn stack | `low` — loại | Tập khóa state bị ghim bằng test và không chứa vòng nào; không có đường nào được nêu để một vòng tới được state. Chốt chặn của #6 cũng không chặn vòng gồm toàn object thuần, nên "sửa" là thêm `WeakMap` cho một ca chưa chứng minh được là tới được. |
| 11 | Khóa `Symbol` trong `partial` lọt cửa khóa lạ vì `Object.keys` bỏ qua | `false` | Không có kết quả xấu: không có own property `keyword`/`date` thì action là phép không đổi gì — đúng bằng `{}`, thứ spec hỗ trợ tường minh. |
| 12 | Cửa (d) báo `0 to be 1` vô nghĩa khi `main.js` bị xóa/đổi tên | `false` | `state-tap-trung.test.js:1058-1063` đã có test riêng khẳng định `expect(ten).toContain(FILE_BOOTSTRAP)`; ca đó đỏ trước và nêu đúng nguyên nhân. |
| 13 | Bản `moTa` thứ ba nên gom về một helper dùng chung | `low` — loại | Boundaries của spec (đã duyệt) ghi tường minh `moTa(giaTri)` **chép tại chỗ**, và Code Map của Story 1.3/1.4 cũng nói đừng refactor sang helper dùng chung. Fix của finding này là sửa spec đã duyệt. |
| 14 | `ports/` trộn đồng bộ với bất đồng bộ, và `sessionStore.write` **ném** trong khi `noteStore.put` **reject**, không nêu quy tắc | `low` | Đọc `session-store.js:590-601` vs `note-store.js:483-488`. Thật: lõi Story 1.6 sẽ cần hai đường xử lý cho cùng một lớp lỗi AD-18. Fix là một đoạn chú thích nêu quy tắc, không đổi mã. |
| 15 | Không gì đỏ nếu Story 1.6 quên thay tập cổng tạm | `low` — loại | Đây là cổng chặn cho một story tương lai, thuộc spec của story đó. Patch #2 đã làm chính tính "ồn ào" của stub thành thứ có test, tức nửa thật sự thuộc story này. |
| 16 | Từ cấm chồng nhau (`unsaved` chứa `saved`) bị báo hai lần | `low` — loại | Thuần thẩm mỹ trong thông báo lỗi; không bỏ lọt gì. |
| 17 | `main.js` dựng store như hiệu ứng lề lúc import → có store thứ hai nếu import ở ngữ cảnh khác | `false` | Một registry module thứ hai nghĩa là một trang thứ hai; "đúng một khối state" là bất biến **trong một trang**, và nó vẫn đúng. |
| 18 | Ghi vào ảnh đóng băng im lặng không làm gì ở ngữ cảnh non-strict | `false` | ES module luôn strict, và `index.html` nạp `app/main.js` bằng `type="module"`. Không có đường non-strict nào trong dự án này. |
| 19 | `MAU_NGAY` trùng với bản riêng trong `time.js`, bỏ qua `LOCAL_DATE_CHARS` | `low` — loại | Chính reviewer thừa nhận là có chủ ý và `time.js` không export bộ kiểm hình dạng. Không harm nào được nêu tên. |
| 20 | Thành viên port có mặt nhưng sai kiểu vẫn qua phép kiểm | `false` | Tự chạy `{quota:{estimate:42}}` → ném `Cổng chưa đủ để khởi động — còn thiếu: quota.estimate`. `typeof !== 'function'` đã phủ đúng ca này. |
| 21 | `sprint-status.yaml` còn `in-progress`; diff không có mục danh sách thử tay ở README | `false` | Sprint status do step-05 cập nhật, đây là trạng thái workflow đúng lúc này. Và `app/adapters/` chưa có adapter nào, nên danh sách thử tay chưa có gì để nhận. |

**Định tuyến:** không có `intent_gap`, không có `bad_spec` → **không loopback**. Gộp theo gốc: #1 → `patch` (high). #2 → `patch`. #3+#4+#7 gộp (cùng gốc: bộ quét hẹp hơn ràng buộc nó canh) → `patch`. #5+#6 gộp (cùng gốc: bộ dựng ảnh state) → `patch`. #8 → `patch`. #14 → `patch`. #9, #10, #13, #15, #16, #19 → loại theo lý do trên. #11, #12, #17, #18, #20, #21 → loại theo bác bỏ.

## Design Notes

**Vì sao factory `taoStore(ports)` chứ không phải singleton cấp module.** "Đúng một khối state" là ràng buộc về *runtime của app*, không phải về cách module xuất giá trị. Một singleton `export const state = {...}` khiến mỗi ca test kế thừa state của ca trước, nên `core-state.test.js` sẽ phải tự dựng cơ chế reset — chính là một đường đổi state thứ hai, đúng thứ AD-1 cấm. Factory giữ được cả hai: test tạo store riêng cho mỗi ca, và `main.js` gọi đúng một lần cho app thật.

**Vì sao khai báo đủ hình dạng state ngay bây giờ dù chưa dùng.** `core-state.test.js` ghim **đúng** tập khóa; Story 1.6+ thêm một trường là phải sửa test và nhìn thấy AD-3/AD-16 cùng lúc. Nếu để state mọc dần theo từng story thì không có lúc nào ai đối chiếu toàn bộ với bảng ba tầng.

**Cạm bẫy: `kiemTraPorts` gặp `main.js` ở thời điểm import.** `test/trang-tinh.test.js` import động `app/main.js` ở Node, và `main.js` gọi `taoStore` ngay lúc nạp module. Nên object port tạm phải là **stub đủ mọi phương thức** — mỗi phương thức ném `Error('chưa nối adapter — Story 1.6')` khi *bị gọi*. Stub thiếu phương thức sẽ làm `trang-tinh.test.js` đỏ; stub trả `undefined` im lặng thì Story 1.6 sẽ debug một adapter không tồn tại.

**Cạm bẫy: bất biến 5 của `harness.test.js` không bỏ nội dung chuỗi.** Viết `'localStorage'` trong một chuỗi ở `ports/` hay `core/` là đỏ. Đây là lý do chữ ký port phải trừu tượng thật, không phải trừu tượng bề mặt.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng so với 121
- Kiểm ngược dương tính: tạm tạo `app/view/probe.js` với `store.state.notes = [];` và `const dangLuu = true;` → `state-tap-trung.test.js` đỏ đúng file/dòng ở cả hai cửa; xóa file
- Kiểm ngược âm tính: tạm tạo `app/core/probe.js` chỉ có chú thích nhắc `localStorage` và `dangLuu` → không test nào đỏ oan; xóa file
- `git status --porcelain` -- expected: chỉ các file story này tạo/sửa
