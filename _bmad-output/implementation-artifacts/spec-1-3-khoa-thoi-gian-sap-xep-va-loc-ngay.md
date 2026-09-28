---
title: 'Story 1.3 — Khóa thời gian: sắp xếp và lọc ngày'
type: 'feature'
created: '2026-09-10'
status: 'done'
route: 'dispatch'
baseline_commit: '96662ceac872d3b815c15824d33d81f4f3a9554f'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `createdAt` là ISO-8601 **có offset**, nên so chuỗi trực tiếp trên nó cho thứ tự sai khi hai ghi chú sinh ở hai múi giờ khác nhau, và `new Date(createdAt)` làm ghi chú trượt sang ngày khác lúc nạp sao lưu trên máy đặt múi giờ khác. Nếu `query.js` (Epic 6) và `backup.js` (Epic 4) mỗi nơi tự cắt chuỗi một kiểu thì AD-4 vỡ trong im lặng.

**Approach:** Tạo `app/core/time.js` — nơi **duy nhất** sinh hai khóa dẫn xuất `localStamp` (19 ký tự, khóa sắp xếp) và `localDate` (10 ký tự, khóa lọc ngày) — cộng `daysBetween(a, b)` là chỗ **duy nhất trong toàn bộ mã** được dựng `Date`, và dựng ở UTC giữa trưa. Kèm test Vitest ở Node chứng minh cả ba bất biến, và một test quét cây cưỡng chế "không nơi nào khác dựng `Date`".

## Boundaries & Constraints

**Always:**
- `app/core/time.js` là `core/` thuần: chỉ được import `./limits.js`, không chạm global trình duyệt, không bare specifier. `test/harness.test.js` đã cưỡng chế.
- Mọi số literal cần dùng (độ dài lát cắt, giờ UTC giữa trưa, số mili giây một ngày) phải khai báo ở `app/core/limits.js` rồi import — `test/nguong-tap-trung.test.js` chỉ miễn trừ `0` và `1`. Thêm tên vào `limits.js` thì phải cập nhật `MONG_DOI` trong `test/core-limits.test.js`, nếu không test "đúng tập tên" đỏ.
- `daysBetween` nhận **hai chuỗi `yyyy-MM-dd`** và dựng `Date` ở UTC giữa trưa (AD-4).
- Đầu vào sai dạng thì **ném ngay tại chỗ** bằng `TypeError`, không trả `null`/`''`/`NaN` — cùng lối với `errors.js` Story 1.2. Tập sáu mã lỗi của `errors.js` vẫn **đóng**: story này không thêm mã nào.
- File `kebab-case.js`, hàm/biến camelCase tiếng Việt không dấu, hằng export SCREAMING_SNAKE tiếng Anh. Cấm chữ `card`.

**Never:**
- Không tạo/chạm `fold.js`, `query.js`, `backup.js`, `state.js`, `notes.js` (Story 1.4–1.6).
- Không chạm `index.html`, `style.css`, `main.js`, `adapters/`, `view/`.
- Không phân tích/định dạng `dd/MM/yyyy` (Epic 6) và không viết logic sắp xếp mảng ghi chú (Story 1.6) — story này chỉ sinh khóa.
- Không viết hàm "hôm nay" và không viết hàm định dạng hiển thị (xem hai quyết định dưới).
- Không sửa test nào đang có, ngoại trừ đúng một dòng danh sách tên trong `test/core-limits.test.js`.

## Quyết định đã chốt

- **Khóa "hôm nay" KHÔNG thuộc story này.** AD-4 giữ nguyên văn "`daysBetween` là nơi duy nhất dựng `Date`". Story 2.4 (lưới ghi chú của hôm nay) sẽ thêm hàm đó khi có người tiêu thụ thật — và phải thêm **vào `time.js`**, không tự chế `new Date()` tại chỗ. `test/date-tap-trung.test.js` của story này chính là thứ cưỡng chế điều đó.
- **Định dạng hiển thị (`HH:mm`, `dd/MM/yyyy HH:mm`) KHÔNG thuộc story này.** Để lại cho Story 2.5 (mẩu giấy đầu tiên), nơi có người vẽ thật.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Khóa sắp xếp | `localStamp({ createdAt: '2026-09-03T16:40:12+07:00' })` | `'2026-09-03T16:40:12'` — đúng 19 ký tự | N/A |
| Khóa lọc ngày | `localDate({ createdAt: '2026-09-03T16:40:12+07:00' })` | `'2026-09-03'` | N/A |
| Offset khác nhau | hai ghi chú cùng giờ tại chỗ, offset `+07:00` và `+02:00` | so chuỗi trên `localStamp` cho thứ tự đúng theo giờ tại chỗ | N/A |
| Trừ ngày | `daysBetween('2026-09-03', '2026-09-11')` | `8` | N/A |
| Trừ ngày qua mốc đổi giờ mùa hè | `daysBetween('2026-03-28', '2026-04-02')` | `5`, không lệch một ngày | N/A |
| Trừ ngược | `daysBetween('2026-09-11', '2026-09-03')` | `-8` (giữ dấu, không lấy trị tuyệt đối) | N/A |
| `createdAt` sai dạng | `localStamp({ createdAt: '2026-09-03' })` hoặc thiếu offset, hoặc không phải chuỗi | ném ngay | `TypeError`, nêu giá trị nhận được |
| Ngày sai dạng | `daysBetween('03/09/2026', '2026-09-11')` | ném ngay | `TypeError` |
| Ngày không có thật | `daysBetween('2026-02-30', '2026-03-01')` | ném ngay | `TypeError` — `Date` cuộn ngày sang tháng sau trong im lặng |

</frozen-after-approval>

## Code Map

- `app/core/limits.js` — 11 export hiện có, mỗi hằng một chú thích nêu ai tiêu thụ. **Thêm** hằng cho story này ở đây, giữ đúng lối chú thích đó. Không đụng hằng cũ.
- `test/core-limits.test.js:6-22` — `MONG_DOI` ghim giá trị từng hằng, `TEN_KHONG_GHIM_GIA_TRI = ['APP_VERSION']`, và test `Object.keys(limits).sort()` **đúng bằng** hợp hai danh sách. Thêm hằng mới vào `MONG_DOI` — đây là file test duy nhất được sửa.
- `test/nguong-tap-trung.test.js` — quét mọi `.js` dưới `app/` trừ `limits.js`; miễn trừ chỉ `'0'` và `'1'`; **có** bắt số trong `${…}` của template literal; **không** bắt lượng từ trong thân regex (`/^\d{4}-\d{2}-\d{2}$/` an toàn) nhờ `laViTriRegex`/`cuoiRegexLiteral`. Chú ý: `padStart(2, '0')` sẽ đỏ.
- `test/harness.test.js` — 5 bất biến kiến trúc quét cây `app/`: chỉ `main.js` import `adapters/`; cấm bare specifier; specifier tương đối phải có đuôi và trỏ file thật; `core/`+`ports/` không nhắc `window|document|indexedDB|localStorage|sessionStorage|BroadcastChannel|navigator`. `Date` **không** bị cấm ở đây. `danhSachFileJs` + `duongDanTuongDoi` là hàm cục bộ, mỗi test tự lặp lại — theo đúng khuôn đó cho test quét mới, đừng refactor sang helper dùng chung.
- `test/helpers/quet-nguon.js` — export `boChuThichJs`, `laViTriRegex`, `cuoiRegexLiteral`, `boChuThichCss/Html`, `boChuThich`. **Bắt buộc** dùng `boChuThichJs` trước khi quét `new Date(`, nếu không chính chú thích của `time.js` nói về `Date` làm test đỏ oan.
- `app/core/errors.js` — `MA_LOI` đóng băng đúng sáu mã, `loiUngDung`/`microcopyLoi` ném `TypeError` với mã lạ. Story này **không** import nó: lỗi ở đây là lỗi lập trình, không phải câu hiện cho người dùng.
- `ARCHITECTURE-SPINE.md` (planning-artifacts/architecture/…) — AD-4 ~dòng 114–133 là văn bản có thẩm quyền; AD-13 ~dòng 289 nói `localDate` là trường dẫn xuất có index; Structural Seed ~dòng 467 ghi `time.js # localStamp, localDate (AD-4)`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/limits.js` -- thêm các hằng story này cần (độ dài khóa sắp xếp `19`, độ dài khóa ngày `10`, giờ UTC giữa trưa `12`, số mili giây một ngày viết dạng tích `24 * 60 * 60 * 1000`), mỗi hằng một chú thích nêu `core/time.js` tiêu thụ -- `nguong-tap-trung.test.js` làm đỏ mọi số sống ngoài file này
- [x] `test/core-limits.test.js` -- thêm các tên mới vào `MONG_DOI` kèm giá trị literal -- test "đúng tập tên" đỏ nếu không cập nhật
- [x] `app/core/time.js` -- tạo: `localStamp(note)`, `localDate(note)`, `daysBetween(a, b)`; xác thực đầu vào bằng regex rồi ném `TypeError`; `daysBetween` là chỗ duy nhất gọi `new Date`, dựng ở UTC giữa trưa -- một module duy nhất sinh khóa thì `query.js` và `backup.js` không thể lệch nhau
- [x] `test/core-time.test.js` -- tạo: phủ toàn bộ I/O Matrix, **cộng** một test chứng minh so chuỗi trực tiếp trên `createdAt` cho thứ tự **sai** trong khi `localStamp` cho đúng -- AC yêu cầu chứng minh lý do AD-4 cấm, không chỉ chứng minh cái đúng
- [x] `test/date-tap-trung.test.js` -- tạo: quét mọi `.js` dưới `app/`, bỏ chú thích bằng `boChuThichJs`, làm đỏ mọi `new Date(` ngoài `app/core/time.js` -- AC "grep toàn repo" phải là test, không phải lời hứa

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then 64 test cũ **và** test mới đều pass, exit code 0, không cần môi trường trình duyệt
- Given tạm thả `app/view/probe.js` chứa `const t = new Date();`, when `npm test`, then `date-tap-trung.test.js` đỏ và nêu đúng file cùng dòng; xóa probe thì xanh lại
- Given `test/harness.test.js` không bị sửa, when chạy nó, then `app/core/time.js` qua cả 5 bất biến kiến trúc
- Given `app/core/time.js`, when đọc mã, then không con số nào viết thẳng ngoài `0`/`1`, và `nguong-tap-trung.test.js` xanh

## Implementation Notes

- `app/core/limits.js`: thêm 4 hằng — `LOCAL_STAMP_CHARS = 19`, `LOCAL_DATE_CHARS = 10`,
  `UTC_NOON_HOUR = 12`, `MS_PER_DAY = 24 * 60 * 60 * 1000` (giữ dạng tích). Không đụng hằng cũ.
- `app/core/time.js`: chỉ import `./limits.js`. Xác thực bằng regex rồi ném `TypeError` có nêu
  giá trị nhận được. `ngayCoThat` là nơi duy nhất gọi `new Date`, neo 12:00 UTC; `mocGiuaTrua`
  chỉ là lớp ném bọc quanh nó, nên `daysBetween` và `createdAtHopLe` dùng **chung một** phép
  kiểm lịch.
- Tránh số literal trong `time.js` (bộ quét Story 1.2 chỉ tha `0`/`1`): lấy nhóm bằng
  destructuring `const [, nam, thang, ngayTrongThang] = khop` thay vì chỉ số mảng, và kiểm ngày
  có thật bằng cách so ba thành phần `getUTC*` thay vì `padStart(2, '0')`.
- Đã biết và chấp nhận: năm 0–99 (`'0099-01-01'`) bị `Date.UTC` ánh xạ sang 1900+n nên bị coi là
  ngày không có thật. **Hỏng đóng** (ném) chứ không trả số sai; triage vòng 1 loại có chủ ý.

**Verification đã chạy (tự làm, không tin báo cáo subagent):**
- `npm test` → 7 file, **94 test, toàn bộ pass**, exit 0, không cần môi trường trình duyệt (từ 64).
- Kiểm ngược dương tính: `app/view/probe.js` với `const t = new Date();` → đỏ đúng
  `app/view/probe.js:1 — new Date(`; xóa → xanh.
- Kiểm ngược âm tính: `app/core/probe.js` chỉ có chú thích nhắc `new Date(` và `Date.now(` →
  không đỏ oan; xóa.
- `git status --porcelain` → chỉ 5 file của story này.

**Vòng patch sau review (step-04) — 12 finding, không loopback:**

- Subagent triển khai bị ngắt giữa vòng patch (giới hạn phiên), làm xong 4/8 mục; 4 mục còn lại
  tôi tự làm và tự kiểm lại toàn bộ.
- `test/date-tap-trung.test.js`: bộ quét nay bắt **cả bốn cửa** — `new Date(`, `Date.now(`,
  `Date.parse(`, `Date.UTC(`; thông báo nêu đúng cửa nào bị dùng; self-test phủ cả bốn. Ghi rõ
  **lỗ đã biết** (không bỏ nội dung chuỗi → chuỗi chứa `new Date(` bị báo oan) kèm một test ghim
  hành vi đó, để ai nới phải nới tường minh.
- `app/core/time.js`: `MAU_CREATED_AT` ghim giờ/phút/giây và offset vào dải thật, và
  `createdAtHopLe` nay dùng chung phép kiểm lịch — `'2026-02-30T25:99:99Z'` không còn thành khóa.
- `test/core-time.test.js`: chú thích test DST viết lại cho đúng thứ nó thật sự chứng minh
  (`Date.UTC` không có DST, nên mốc 12:00 được ghim ở `core-limits.test.js` chứ không ở đây);
  test sắp xếp gắn `id` để quan sát được tính ổn định và tính khóa một lần; thêm case offset âm
  quanh nửa đêm, `Z`/`+00:00`/`-00:00`, quy tắc năm thế kỷ (2100 vs 2000), và case hình-dạng-đúng
  -nhưng-không-có-thật; assertion độ dài đổi sang literal `19`/`10`.
- `app/core/limits.js`: chú thích nói rõ "dưới `app/`" — test đọc hằng là hợp lệ.
- **Kiểm ngược tự làm sau patch:** probe `Date.now()` + `Date.parse("x")` trong `app/view/` → báo
  đúng hai dòng với đúng tên cửa; probe chú thích nhắc cả hai → không báo oan. **94/94 pass.**

## Spec Change Log

## Review Triage Log

### Vòng 1 — blind-hunter · edge-case-hunter · verification-gap

| # | Finding | Verdict | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Bộ quét chỉ bắt `new Date(`; `Date.now(`, `Date.parse(`, `Date.UTC(` lọt hoàn toàn | `medium` | Đọc `bieuThucNewDate = /new\s+Date\s*\(/g`. `Date.now()` trong `fold.js` hay `Date.parse(note.createdAt)` trong `query.js` không khớp, suite xanh — mà `Date.parse(createdAt)` chính là cái sai AD-4 sinh ra để chặn. Cả ba lớp review đều nêu độc lập. |
| 2 | `createdAtHopLe` chỉ kiểm hình dạng, không kiểm ngày/giờ có thật | `medium` | `MAU_CREATED_AT` khớp `'2026-02-30T25:99:99Z'` → `localDate` trả `'2026-02-30'` không ném. Mâu thuẫn với chính `mocGiuaTrua` (có kiểm) và với header của module. AD-11 nói file nạp bị từ chối khi `createdAt` sai — Epic 4 sẽ dựa vào đây. |
| 3 | Test "qua mốc đổi giờ mùa hè" không chứng minh gì: `Date.UTC` không có DST | `low` | Đúng. `daysBetween('2026-03-28','2026-04-02')` ra `5` kể cả khi `UTC_NOON_HOUR = 0`. Neo giữa trưa vẫn đúng theo AD-4, nhưng lời chú thích của test nói quá. Sửa = viết lại chú thích cho đúng thứ nó thật sự chứng minh. |
| 4 | Test sắp xếp rối và không quan sát được tính ổn định | `low` | Comparator gọi `localStamp` 4 lần/lượt so, ternary lồng; hai mẩu hòa nhau ánh xạ về **cùng một chuỗi** nên assertion không phân biệt được sort ổn định hay không. Sửa = đơn giản hóa, không thêm phức tạp. |
| 5 | Chú thích `limits.js` nói `core/time.js` là nơi duy nhất tiêu thụ, sai ngay trong chính diff | `low` | `test/core-time.test.js:3` import `LOCAL_DATE_CHARS`, `LOCAL_STAMP_CHARS`. Sửa = một mệnh đề. |
| 6 | Bộ quét không bỏ nội dung chuỗi: `"new Date("` trong một chuỗi báo oan | `low` | `boChuThichJs` chỉ bỏ chú thích. Cùng lớp với lỗ đã biết của Story 1.2 (`setTimeout(fn, "400")`). Chưa có chuỗi nào như vậy trong repo; sửa rẻ nhất là ghi rõ giới hạn đã biết vào header + một self-test ghim hành vi hiện tại. |
| 7 | Thiếu phủ: offset `Z`/`+00:00`/âm; năm thế kỷ (`2100-02-29` phải ném, `2000-02-29` không) | `low` | Đọc `core-time.test.js`: không case nào có offset âm, và không case nào chạm quy tắc năm thế kỷ. Sửa = thêm test, không thêm phức tạp mã. |
| 8 | `toHaveLength(LOCAL_STAMP_CHARS)` so với chính hằng mà mã dùng để cắt | `low` | Đúng — dòng đó một mình không phát hiện được đổi độ dài. Hai assertion literal kề bên vẫn ghim giá trị thật. Sửa = đổi sang literal, tức một phép sửa trực tiếp. Test không bị `nguong-tap-trung` quét nên literal ở đây hợp lệ. |
| 9 | Năm 0–99 (`'0099-01-01'`) bị `Date.UTC` ánh xạ sang 1900+n → ném "không có thật" | `low` — loại | Đúng sự việc, nhưng **hỏng đóng** (ném) chứ không trả số sai, và chỉ tới được từ một file sao lưu hỏng. Sửa là thay `Date.UTC` bằng `setUTCFullYear` — thêm nhánh cho tình huống chưa chứng minh được là tới được. |
| 10 | Thông báo lỗi không phân biệt `note` null với `note.createdAt` thiếu | `low` — loại | Đúng: cả hai báo `undefined`. Nhưng đây là lỗi lập trình, đọc stack là ra ngay; sửa là thêm một nhánh rẽ cho lợi ích gần bằng không. |
| 11 | Bộ quét bỏ qua `.mjs`/`.cjs` và mã ngoài `app/` | `low` — defer | Repo là `type: module`, mã sản phẩm là `.js`, không có file nào như vậy. Nhưng có một điểm hẹp **thật**: script theme nội tuyến trong `<head>` của `index.html` (Story 1.8) là ngoại lệ kiến trúc được phép, và không bộ quét nào đọc HTML. → defer cho story đó. |
| 12 | AC "grep toàn repo" chỉ được cưỡng chế một nửa | `medium` | Cùng gốc với #1 — gộp vào một entry. |

**Định tuyến:** không có `intent_gap`, không có `bad_spec` → không loopback. #1+#12 gộp một entry. #2, #3, #4, #5, #6, #7, #8 → `patch`. #9, #10 → loại. #11 → `defer`.

## Design Notes

**Vì sao UTC giữa trưa.** Dựng `new Date('2026-03-29')` cho nửa đêm UTC; ở múi giờ có đổi giờ mùa hè, phép trừ hai mốc nửa đêm ra `23` hoặc `25` giờ, chia cho một ngày rồi làm tròn có thể lệch một ngày. Neo ở 12:00 UTC để mọi lần đổi giờ (thường ±1 giờ, lúc rạng sáng) đều không đẩy mốc qua ranh giới ngày.

**Vì sao ném chứ không trả `null`.** Một `localDate` trả `undefined` chảy vào index IndexedDB ở Story 1.6 và hỏng im lặng ở tận Epic 6. Ném ngay biến hỏng dữ liệu thành hỏng test.

**Vì sao xác thực cả ngày không có thật.** `new Date(Date.UTC(2026, 1, 30, 12))` cuộn thành 2 tháng 3 mà không báo gì; `daysBetween` sẽ trả một con số trông hợp lý nhưng sai.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng so với 64
- Kiểm ngược dương tính: tạm tạo `app/view/probe.js` với `const t = new Date();` → `date-tap-trung.test.js` đỏ đúng file/dòng; xóa file
- Kiểm ngược âm tính: tạm tạo `app/core/probe.js` chỉ có chú thích `// không được dựng new Date( ở đây` → không test nào đỏ oan; xóa file
- `git status --porcelain` -- expected: chỉ các file story này tạo/sửa
