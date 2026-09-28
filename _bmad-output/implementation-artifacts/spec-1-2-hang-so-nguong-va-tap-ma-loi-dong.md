---
title: 'Story 1.2 — Hằng số ngưỡng và tập mã lỗi đóng'
type: 'feature'
created: '2026-09-10'
status: 'done'
route: 'dispatch'
baseline_commit: '072933a9afd2e1e3f98d8bf847b7d3a0e1323b61'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `app/core/` còn rỗng sau Story 1.1. Sáu story còn lại của Epic 1 và cả bảy epic sau đều cần cùng bộ ngưỡng số và cùng từ vựng lỗi; nếu mỗi story tự chế một `400` hay một câu báo lỗi riêng thì AD-14 và AD-18 vỡ trong im lặng.

**Approach:** Tạo `app/core/limits.js` (mọi ngưỡng + `APP_VERSION`) và `app/core/errors.js` (tập mã đóng sáu giá trị, ánh xạ sang nguyên văn microcopy EXPERIENCE.md, hàm dựng `Error` có `code`), kèm test Vitest ở Node và một test quét cây thư mục cưỡng chế "không ngưỡng nào sống ngoài `limits.js`".

## Boundaries & Constraints

**Always:**
- Hai module là `core/` thuần: không chạm global trình duyệt, không import `adapters/`, không bare specifier. `test/harness.test.js` đã cưỡng chế.
- Tập mã **đóng** đúng sáu: `VERSION_SKEW`, `QUOTA`, `DB`, `BAD_FILE`, `BAD_VERSION`, `TOO_LONG`.
- Microcopy chép **nguyên văn** từng ký tự (dấu `—`, chữ HOA `CHƯA`/`KHÔNG`, dấu chấm cuối). Test so chuỗi tuyệt đối.
- File `kebab-case.js`, hàm/biến `camelCase`. Cấm chữ `card`.

**Never:**
- Không tạo/chạm `time.js`, `fold.js`, `query.js`, `backup.js`, `state.js` (Story 1.3–1.6).
- Không viết logic **áp dụng** ngưỡng (kiểm trần, cắt kết quả, debounce, nhịp tim) — chỉ khai báo.
- Không chạm `index.html`, `style.css`, `main.js`, `adapters/`, `view/`.

## Quyết định đã chốt

- **Microcopy `DB`** (EXPERIENCE.md không có dòng nào) — dùng nguyên văn: `Không mở được kho dữ liệu của trình duyệt. Tải lại trang. Nếu vẫn hỏng, xuất sao lưu ở một tab khác trước khi thử tiếp.`
- **Microcopy `BAD_VERSION`** — dùng chung nguyên văn với `BAD_FILE` (dòng 3 bảng dải băng). Hai mã vẫn phân biệt ở tầng mã; người dùng thấy một câu.
- AD-14 ghi `BACKUP_NUDGE_DAYS = 7` (3 khi `persistDenied`) → xuất **hai** hằng: `BACKUP_NUDGE_DAYS = 7` và `BACKUP_NUDGE_DAYS_PERSIST_DENIED = 3`.
- `APP_VERSION` khởi điểm `'0.1.0'`. AD-21 chỉ so bằng nhau nên giá trị nào cũng chạy.
- Tên hàm tiếng Việt (`loiUngDung`, `microcopyLoi`) theo lối đặt tên đang dùng trong `test/`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Đọc ngưỡng | `import { MAX_NOTE_CHARS }` | `20000` | N/A |
| Dựng lỗi | `loiUngDung('QUOTA')` | `Error` có `.code === 'QUOTA'`, `.message` = nguyên văn microcopy | N/A |
| Tra microcopy | `microcopyLoi('TOO_LONG')` | nguyên văn dòng 4 bảng dải băng | N/A |
| Mã ngoài tập | `loiUngDung('WHATEVER')` / `microcopyLoi('X')` | ném ngay tại chỗ | `TypeError` — **không** trả chuỗi rỗng hay câu mặc định |
| Quét ngưỡng | mọi `.js` dưới `app/` trừ `limits.js` | không số trần trụi ngoài `0`, `1`, `-1` | test đỏ, nêu file và con số |

</frozen-after-approval>

## Code Map

- `app/core/` — chỉ có `.gitkeep`. Đây là hai file `core/` đầu tiên của dự án.
- `test/harness.test.js` — đã cưỡng chế 5 bất biến kiến trúc bằng quét cây `app/`. **Tái sử dụng** khuôn `danhSachFileJs` + `duongDanTuongDoi`; **không sửa** test nào đang có.
- `test/helpers/quet-nguon.js` — `boChuThichJs(ma)` bỏ chú thích JS mà không đụng nội dung chuỗi. **Bắt buộc dùng** trước khi quét số, nếu không mọi chú thích có chữ số làm test đỏ oan.
- `ARCHITECTURE-SPINE.md` (planning-artifacts/architecture/…) — AD-14 ~dòng 299 là danh sách ngưỡng có thẩm quyền; AD-18 ~dòng 364 là bảng mã lỗi; AD-21 nói `APP_VERSION` bump tay và **chỉ so bằng nhau**.
- `EXPERIENCE.md` (planning-artifacts/ux-designs/…) — bảng "Dải băng thông báo" ~dòng 81: nguồn nguyên văn cho `QUOTA` (dòng 1), `VERSION_SKEW` (dòng 2), `BAD_FILE` (dòng 3), `TOO_LONG` (dòng 4).
- `README.md` — checklist deploy có blockquote "hằng số do Story 1.2 tạo"; story này gỡ nó và trỏ vào file thật.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/limits.js` -- tạo: 10 tên của AD-14 cộng `BACKUP_NUDGE_DAYS_PERSIST_DENIED`; `QUOTA_WARN_FREE_BYTES` viết `50 * 1024 * 1024` chứ không nhân sẵn; mỗi hằng một chú thích nói ai sẽ dùng -- sáu story sau đọc file này thay vì đoán
- [x] `app/core/errors.js` -- tạo: `MA_LOI` đóng băng bằng `Object.freeze`, `MICROCOPY` ánh xạ mã → chuỗi, `microcopyLoi(code)` và `loiUngDung(code)`; cả hai ném `TypeError` với mã ngoài tập -- một hình dạng lỗi duy nhất cho adapter lẫn core
- [x] `test/core-limits.test.js` -- tạo: khẳng định từng giá trị bằng số literal viết trong test, và tập tên xuất ra **đúng bằng** danh sách mong đợi (thừa một tên cũng đỏ) -- ngưỡng trôi giá trị là hỏng im lặng
- [x] `test/core-errors.test.js` -- tạo: đúng sáu mã · mỗi mã có microcopy khác rỗng · bốn microcopy có nguồn so **nguyên văn** với chuỗi chép tay · `loiUngDung` trả `Error` đúng `.code`/`.message` · mã lạ ném `TypeError` ở cả hai hàm · `MA_LOI` gán thêm không ăn
- [x] `test/nguong-tap-trung.test.js` -- tạo: quét mọi `.js` dưới `app/` trừ `app/core/limits.js`, bỏ chú thích bằng `boChuThichJs`, bắt số literal; miễn trừ `0`, `1`, `-1` có chú thích lý do -- AC "grep toàn repo" phải là test, không phải lời hứa
- [x] `README.md` -- sửa mục deploy: gỡ blockquote tạm, trỏ `app/core/limits.js` -- ghi chú đó nay đã sai

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then 13 test cũ **và** test mới đều pass, exit code 0, không cần môi trường trình duyệt
- Given tạm thả `app/view/probe.js` chứa `const cho = 400`, when `npm test`, then `nguong-tap-trung.test.js` đỏ và nêu đúng file cùng con số; xóa probe thì xanh lại
- Given `app/core/errors.js`, when đối chiếu với bảng dải băng EXPERIENCE.md, then bốn mã có nguồn trùng từng ký tự, `DB` và `BAD_VERSION` đúng hai câu đã chốt ở trên
- Given `test/harness.test.js` không bị sửa, when chạy nó, then hai file `core/` mới qua cả 5 bất biến kiến trúc

## Implementation Notes

- `app/core/limits.js`: 11 export, mỗi hằng một chú thích nêu story/epic sẽ tiêu thụ nó.
  `QUOTA_WARN_FREE_BYTES` giữ dạng tích `50 * 1024 * 1024`; `QUOTA_WARN_RATIO` viết `0.80` theo
  nguyên văn AD-14 (test khẳng định `0.8` — cùng một giá trị).
- `app/core/errors.js`: `MA_LOI` và `MICROCOPY` đều `Object.freeze`. `kiemTraMa` dùng
  `hasOwnProperty` chứ không `in`, nên `microcopyLoi('toString')` cũng ném — có test riêng.
- **Bộ quét ngưỡng phải bỏ nội dung chuỗi**, nếu không microcopy `20.000 ký tự` trong `errors.js`
  tự làm suite đỏ. Hệ quả đã biết và chấp nhận: một ngưỡng giấu trong chuỗi (`setTimeout(fn, "400")`)
  không bị bắt. Mọi số literal trong mã đều bị bắt.
- **Hai lỗ tự phát hiện sau khi subagent trả về, đã bịt trong cùng story** (subagent không nêu):
  - regex literal `/^\d{4}$/` làm bộ quét đỏ oan ở lượng từ `{4}` — Story 1.3 phân tích
    `dd/MM/yyyy` sẽ đâm ngay vào. Nay bộ quét bỏ cả thân regex và cờ, có phân biệt `/` mở regex
    với `/` phép chia bằng ký tự không-trắng đứng trước, và xử đúng lớp `[/…]` chứa dấu `/`.
  - `${400}` trong template literal **lọt hoàn toàn** vì cả template bị coi là chuỗi. Nay bộ quét
    thoát trạng thái chuỗi ở `${` và vào lại ở `}` khớp cặp, có ngăn xếp cho `{}` lồng nhau.
  - Thêm một test tự-kiểm cho bộ quét phủ cả 5 tình huống trên (regex · lớp ký tự có `/` ·
    nội suy · nội suy lồng · phép chia thật).
- `README.md`: gỡ blockquote tạm ở bước deploy 1, thay bằng link tới `app/core/limits.js`.

**Verification đã chạy (tự làm, không tin báo cáo subagent):**
- `npm test` → 5 file, **61 test, toàn bộ pass**, exit 0, không cần môi trường trình duyệt (từ 13).
- Kiểm ngược dương tính: `app/view/probe.js` với `const cho = 400;` → đỏ đúng
  `app/view/probe.js:1 — số 400`; xóa → xanh.
- Kiểm ngược âm tính: `app/core/probe.js` chỉ có `// AD-14, 2026` và `/* 50 * 1024 */` → 60/60
  pass, không đỏ oan; xóa.
- Kiểm ngược hai lỗ mới: probe chứa `/^\d{4}$/` **và** `` `${400}` `` → đỏ **đúng một** dòng
  (`:2 — số 400`), regex không bị nêu; xóa → 61/61.
- `git status --porcelain` → chỉ 6 file của story này.

**Vòng patch sau review (step-04) — 15 finding, không loopback:**

- `test/helpers/quet-nguon.js`: xuất thêm `laViTriRegex(truoc)` (biết từ khóa: `return`, `typeof`,
  `case`, `in`, `of`, `new`, `delete`, `void`, `do`, `else`, `yield`, `await`, `throw`) và
  `cuoiRegexLiteral`. `boChuThichJs` nay đi qua regex literal như một đơn vị, nên `/['"]/` không
  còn lật nó sang trạng thái chuỗi giả. Nhánh block comment phát lại đúng số newline đã xóa.
- `test/nguong-tap-trung.test.js`: dùng `laViTriRegex` dùng chung và truyền cả phần đầu ra đã tích
  lũy thay vì một ký tự. `bieuThucSo` bỏ `-?`, nên `tong - 400` báo `số 400` đúng mặt chữ;
  `SO_MIEN_TRU` thu về `{'0','1'}` vì `-1` nay khớp qua `1`. Xóa biến `truocDo` chết (gán 5 chỗ,
  không đọc chỗ nào).
- `test/core-limits.test.js`: `APP_VERSION` chuyển sang `TEN_KHONG_GHIM_GIA_TRI` — giữ test tập
  tên và test định dạng `x.y.z`, bỏ ghim giá trị, nên bump lúc deploy không làm suite đỏ.
- `app/core/errors.js`: `BAD_FILE`/`BAD_VERSION` cùng trỏ vào một hằng `CAU_NAP_FILE_HONG`.
- `test/core-errors.test.js`: thêm test tập export chính xác, test `MICROCOPY` đóng băng, và test
  buộc câu `TOO_LONG` mang đúng con số của `MAX_NOTE_CHARS`.
- `README.md`: nói rõ trường `version` của `package.json` không được app dùng và không được bump
  thay cho `APP_VERSION`.
- **Kiểm ngược tự làm, không tin báo cáo subagent.** Bốn probe: `return /^\d{4}$/.test(x)` →
  **không** còn báo · vi phạm ở dòng 6 sau JSDoc 5 dòng → báo đúng `:6` (trước là `:2`) ·
  `/['"]/` rồi `// nam 2026 va nguong 400` → **không** còn báo oan · `` `${500}` `` và
  `tong - 700` → báo đúng `500` và `700` (không còn `-700`). Đổi `MAX_NOTE_CHARS` sang 30000 →
  `core-errors.test.js` đỏ đúng ở test mới. Khôi phục, xóa probe.
- **Tổng cuối: 64 test, 5 file test + 1 helper, toàn bộ pass.**

## Spec Change Log

## Review Triage Log

### Vòng 1 — blind-hunter · edge-case-hunter · verification-gap

| # | Finding | Verdict | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Regex sau từ khóa (`return /^\d{4}$/`) bị hiểu là phép chia → đỏ oan `số 4` | `medium` | Probe `app/view/pa.js` → `:2 — số 4`. `laViTriRegex` từ chối mọi ký tự `\w` đứng trước, mà `return`/`typeof`/`case` đều kết thúc bằng `\w`. Story 1.3 phân tích `dd/MM/yyyy` đâm vào ngay. Mâu thuẫn với chính ghi chú step-03 của tôi. |
| 2 | Regex chứa dấu nháy (`/['"]/`) làm `boChuThichJs` vào trạng thái chuỗi giả → chú thích sau đó không được bỏ | `medium` | Probe: `const q = /['"]/;` + `// nam 2026 va nguong 400` → báo cả `2026` lẫn `400`. Cùng gốc với #1: pipeline bỏ chú thích không biết regex literal. Hậu quả là đỏ oan, dạng lỗi dẫn tới người ta nới lỏng chính check này. |
| 3 | Số dòng báo sai sau block comment | `low` | Probe `app/view/pb.js`: vi phạm ở dòng 6 sau JSDoc 5 dòng, báo `:2`. `boChuThichJs` xóa cả newline của `/* */` còn `boNoiDungChuoi` thì giữ. Sửa trực tiếp: giữ nguyên số newline. |
| 4 | Bộ quét chỉ đi `app/**/*.js`, bỏ `app/style.css` và `index.html` | `low` — defer | Đúng về sự việc. Nhưng yêu cầu chung "quét cả CSS" là **sai kiến trúc**: epic-1-context giao cho `style.css` cả thang spacing 4/8/12/16/20/28/40px và 4 cấp bo góc dưới dạng token — đó là giá trị bố cục, không phải ngưỡng của AD-14. Rủi ro thật chỉ còn một điểm hẹp: `COLLAPSED_LINES = 3` trùng lặp thành `-webkit-line-clamp: 3` ở Story 2.5. → defer cho story viết CSS đó. |
| 5 | `package.json` giữ `version: 0.0.0` trong khi README nói không nơi nào khác giữ số phiên bản | `low` | Xác minh: `package.json:3` là `"version": "0.0.0"`, `APP_VERSION` là `'0.1.0'` — đã lệch ngay lúc landing. Câu README sai theo nghĩa chữ; sửa là sửa một mệnh đề. |
| 6 | Test ghim `APP_VERSION` đúng `'0.1.0'` xung đột với README bắt buộc bump mỗi lần deploy | `medium` | Đọc `core-limits.test.js`: `MONG_DOI.APP_VERSION: '0.1.0'`. Mỗi lần deploy → suite đỏ → áp lực xóa/nới chính check đó. Harm có tên cụ thể. Sửa là **xóa** một dòng ghim, giữ test tập tên và test định dạng. |
| 7 | `MICROCOPY` đóng băng nhưng không có test; `errors.js` không có test tập export | `low` | Đọc `core-errors.test.js`: có `Object.isFrozen(MA_LOI)` nhưng không có bản đối xứng cho `MICROCOPY`, và không có bản đối xứng của test "đúng tập tên" mà `limits.js` đã có. Một `microcopyOrDefault` lén thêm vào chính là thứ tập đóng sinh ra để chặn. |
| 8 | `TOO_LONG` ghi cứng "20.000 ký tự", không gì buộc nó theo `MAX_NOTE_CHARS` | `medium` | Xác minh: đổi `MAX_NOTE_CHARS` sang 30000 chỉ làm `core-limits.test.js` đỏ; sửa `MONG_DOI` là xanh lại, còn câu báo vẫn nói 20.000 trong khi app chặn ở 30.000. Đây đúng kịch bản "một số, một chỗ" mà AD-14 tồn tại để chặn — và nó nói dối với người dùng. |
| 9 | `BAD_FILE`/`BAD_VERSION` dùng hai literal chép tay độc lập, trôi ra khỏi nhau được | `low` | Đọc `errors.js`: hai chuỗi giống hệt viết hai lần. Cùng lớp với #8 (literal trùng lặp không gì buộc lại). Sửa trực tiếp. |
| 10 | Số âm báo sai mặt chữ: `const x = tong - 400` → `số -400` | `low` | `bieuThucSo` có `-?` ở đầu. Thông báo nêu một literal không có trong file. Gặp thường xuyên (phép trừ), sửa là sửa trực tiếp. |
| 11 | Thêm mã thứ bảy vào `MA_LOI` mà thiếu `MICROCOPY` → `TypeError` lúc chạy | `false` | Test "đúng sáu mã" đã khẳng định `Object.keys(MA_LOI)` **và** `Object.keys(MICROCOPY)` bằng cùng một danh sách, nên lệch hai bảng là đỏ ngay. `MA_LOI` lại còn đóng băng. |
| 12 | `loiUngDung` không nhận `cause`, mất lỗi gốc của trình duyệt | `low` — loại | Sửa là thêm tham số vào API công khai cho một nhu cầu chưa story nào chứng minh. Adapter thật thuộc Story 1.6; lúc đó có bằng chứng thì thêm. |
| 13 | Symlink dưới `app/`; file `.mjs`/`.cjs`/`.jsx`; chuỗi chưa đóng | `low` — loại | Không chứng minh được là tới được: repo không có symlink nào, `type: module` nghĩa là mã sản phẩm là `.js`, và chuỗi chưa đóng là lỗi cú pháp mà chính `import` trong test khác sẽ nổ. Mọi cách sửa đều là thêm nhánh cho tình huống giả định. |
| 14 | `0`/`1`/`-1` miễn trừ khắp nơi có thể giấu một ngưỡng thật bằng 0 hoặc 1 | `low` — loại | Đúng theo nghĩa chữ, nhưng cách sửa là chú thích từng lần xuất hiện — thêm phức tạp thật cho một tình huống chưa thấy. Spec đã chọn có ý thức. |
| 15 | `errors.js` chưa có người tiêu thụ trong `app/` | `false` | Đây là story nền; `main.js` còn là stub theo đúng Story 1.1. Không phải khiếm khuyết. |

**Định tuyến:** không có `intent_gap`, không có `bad_spec` → không loopback. #1+#2 gộp một entry (cùng gốc: pipeline bỏ chú thích không biết regex literal). #8+#9 gộp một entry (literal trùng lặp không gì buộc lại). Còn lại #3, #5, #6, #7, #10 → `patch`. #4 → `defer`.

## Design Notes

**Mã lạ phải ném, không trả mặc định.** `microcopyLoi` trả `''` hay `'Đã có lỗi'` biến một lỗi lập trình thành câu vô nghĩa trước mặt Nam — đúng thứ AD-18 sinh ra để chặn.

**Test ngưỡng phải quét cây thư mục.** Test chỉ đọc `limits.js` nghiệm thu được "các hằng có mặt" nhưng không nghiệm thu được "không ngưỡng nào ở ngoài" — mà nửa sau mới là nửa vỡ ở Story 1.6 hay Epic 6, không vỡ hôm nay.

**Đóng tập tên ở cả hai đầu.** Chỉ kiểm từng tên có mặt thì một story sau thêm lén một ngưỡng vẫn xanh.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng so với 13
- Kiểm ngược dương tính: tạm tạo `app/view/probe.js` với `const x = 400;` → đúng `nguong-tap-trung.test.js` đỏ; xóa file
- Kiểm ngược âm tính: tạm tạo `app/core/probe.js` chỉ có chú thích chứa chữ số (`// AD-14, 2026`) → không test nào đỏ oan; xóa file
- `git status --porcelain` -- expected: chỉ các file story này tạo/sửa

**Manual checks (if no CLI):**
- Đối chiếu bằng mắt từng chuỗi microcopy với bảng "Dải băng thông báo", chú ý dấu `—`, chữ HOA, dấu chấm cuối.
