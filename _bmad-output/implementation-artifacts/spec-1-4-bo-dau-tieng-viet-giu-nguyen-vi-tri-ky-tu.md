---
title: 'Story 1.4 — Bỏ dấu tiếng Việt, giữ nguyên vị trí ký tự'
type: 'feature'
created: '2026-09-10'
status: 'done'
baseline_commit: 'd075d90a1a3ee99a32991f8fc12b9ac259d59579'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chưa có nơi nào bỏ dấu tiếng Việt. Nếu đầu ghi (`textFolded` ở Story 1.6) và đầu tìm (Epic 6) mỗi nơi tự chế một cách, gõ `phan quyen` sẽ không ra `Phân quyền` mà không có triệu chứng nào ngoài việc dùng thật. Ngoài ra Epic 6 phải tô nền đúng chỗ khớp *bên trong* chữ có dấu, nên vị trí tìm được trên chuỗi đã bỏ dấu phải dùng thẳng được trên chuỗi gốc.

**Approach:** Tạo `app/core/fold.js` — một hàm thuần `fold(text)` là nơi **duy nhất** bỏ dấu, theo đúng thứ tự AD-5, và giữ **bất biến vị trí**: `fold(text).length === text.length`, ký tự thứ `i` của kết quả ứng đúng ký tự thứ `i` của đầu vào. Cưỡng chế tính duy nhất bằng một test quét cây `app/`, đúng khuôn `nguong-tap-trung` / `date-tap-trung` của Story 1.2–1.3.

## Boundaries & Constraints

**Always:**
- Thứ tự bắt buộc: map `đ→d` / `Đ→D` **trước**, rồi `normalize('NFD')`, rồi bỏ `\p{M}`, rồi `toLowerCase()`. Test phải chứng minh đảo thứ tự cho kết quả **sai**.
- Bất biến vị trí là ràng buộc cứng, có test riêng: độ dài không đổi và ánh xạ chỉ số 1-1.
- `core/` thuần: không chạm global trình duyệt, không import `adapters/`, chạy được ở Node không giả lập trình duyệt.
- Không con số viết thẳng ngoài `0`/`1` (bộ quét Story 1.2).

**Never:**
- Không đụng `time.js`, `limits.js`, `errors.js`, `harness.test.js`, và không sửa test cũ.
- Không dựng chỉ mục tìm kiếm, không hàm tìm/tô nền, không `query.js` — đó là Epic 6.
- Không nối `fold` vào bất kỳ luồng ghi nào (Story 1.6 làm việc đó).
- Không thư viện ngoài; không dùng bảng tra ký tự viết tay thay cho `NFD`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Bỏ dấu cơ bản | `'Phân quyền'` | `'phan quyen'` | N/A |
| `đ` hoa và thường | `'Đường ĐI'` | `'duong di'` | N/A |
| Nhiều dấu chồng | `'Kiểm thử — ế, ợ, ữ'` | `'kiem thu — e, o, u'`, độ dài giữ nguyên | N/A |
| Không phải chữ Việt | `'ABC 123 \n\t!@#'` | hạ chữ thường, phần còn lại nguyên vẹn, xuống dòng giữ nguyên | N/A |
| Chuỗi rỗng | `''` | `''` | N/A |
| Ngoài BMP | `'Ghi 📌 chú'` | emoji nguyên vẹn, độ dài (UTF-16) giữ nguyên | N/A |
| Đầu vào không phải chuỗi | `null`, `42`, `undefined` | ném `TypeError` nêu giá trị nhận được | Lỗi lập trình, không phải câu hiện cho người dùng — không đụng `errors.js` |
| Đầu vào đã ở dạng NFD | `'e' + U+0301 + ' đ'` | dấu kết hợp **giữ nguyên** (không bỏ), `đ`→`d`; độ dài giữ nguyên | N/A — xem quyết định dưới |
| Hạ thường làm đổi độ dài | `'İ'` (U+0130) | giữ nguyên `'İ'` | N/A — xem quyết định dưới |

**Quyết định (người dùng chốt):** ca nào mà bỏ dấu / hạ chữ thường làm **đổi độ dài** thì **giữ nguyên ký tự gốc**. Bất biến vị trí là ràng buộc mạnh hơn; đánh đổi là vài ca hiếm (đầu vào NFD, `İ`) không được bỏ dấu nên tìm kiếm bỏ sót chúng. Hệ quả: `fold` xử lý **từng code point một**, không chạy `normalize`/`toLowerCase` một lượt trên cả chuỗi.

</frozen-after-approval>

## Code Map

- `app/core/time.js` — khuôn mẫu cho module `core/` mới: header giải thích *vì sao* module tồn tại, `MAU_*` là regex hằng cấp module, `moTa(giaTri)` dựng thông điệp `TypeError`. Dùng lại đúng lối này, **đừng** import từ nó.
- `app/core/limits.js` — story này **không cần hằng mới** (không có ngưỡng số). Chỉ thêm nếu thực sự phát sinh, và khi đó phải cập nhật `MONG_DOI` ở `test/core-limits.test.js`.
- `test/nguong-tap-trung.test.js` — quét mọi `.js` dưới `app/` trừ `limits.js`; chỉ tha `0`/`1`; có bắt số trong `${…}`; không bắt lượng từ trong thân regex. `fold.js` phải xanh với nó.
- `test/date-tap-trung.test.js` — **khuôn mẫu trực tiếp** cho bộ quét mới: `danhSachFileJs` cục bộ, `boChuThichJs` trước khi quét, thông báo nêu đúng file:dòng, self-test dương tính lẫn âm tính, và một mục "lỗ đã biết" ghim hành vi (không bỏ nội dung chuỗi).
- `test/helpers/quet-nguon.js` — dùng `boChuThichJs` (bắt buộc, nếu không chính chú thích của `fold.js` nói về `NFD` sẽ làm test đỏ oan).
- `test/harness.test.js` — 5 bất biến kiến trúc, tự động phủ `fold.js`. **Không sửa file này.**
- `ARCHITECTURE-SPINE.md` (planning-artifacts/architecture/…) — AD-5 ~dòng 135–148 là văn bản có thẩm quyền; Structural Seed ~dòng 468 ghi `fold.js # bỏ dấu tiếng Việt (AD-5)`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/fold.js` -- tạo: `fold(text)` thuần, đúng thứ tự AD-5, xử lý từng code point, ca nào lệch độ dài thì lùi về ký tự gốc; ném `TypeError` khi đầu vào không phải chuỗi -- một hàm duy nhất thì đầu ghi và đầu tìm không thể lệch nhau
- [x] `test/core-fold.test.js` -- tạo: phủ toàn bộ I/O Matrix; **cộng** một test chứng minh đảo thứ tự (NFD trước, map `đ` sau) cho kết quả **sai**; **cộng** một test riêng cho bất biến vị trí trên một tập chuỗi tiếng Việt -- AC đòi chứng minh cả lý do lẫn kết quả
- [x] `test/fold-tap-trung.test.js` -- tạo: quét mọi `.js` dưới `app/`, bỏ chú thích bằng `boChuThichJs`, làm đỏ mọi `normalize(` , `\p{M}` / `̀-ͯ`, và map `đ`→`d` ngoài `app/core/fold.js`; self-test dương tính lẫn âm tính -- AC "grep toàn repo" phải là test, không phải lời hứa

**Acceptance Criteria:**
- Given repo đã cài, when `npm test`, then 94 test cũ **và** test mới đều pass, exit 0, không cần môi trường trình duyệt
- Given tạm thả `app/view/probe.js` chứa `s.normalize('NFD')`, when `npm test`, then `fold-tap-trung.test.js` đỏ và nêu đúng file cùng dòng; xóa probe thì xanh lại
- Given `test/harness.test.js` không bị sửa, when chạy nó, then `app/core/fold.js` qua cả 5 bất biến kiến trúc
- Given `app/core/fold.js`, when đọc mã, then không con số nào viết thẳng ngoài `0`/`1`, và `nguong-tap-trung.test.js` xanh

## Implementation Notes

- `app/core/fold.js`: `fold` lặp `for…of` (theo code point, không xẻ cặp thay thế của emoji) và gọi
  `boDauMotKyTu` cho từng ký tự. Hai chốt chặn giữ bất biến: (1) `daMap.toLowerCase().length !==
  daMap.length` → giữ nguyên (ca `İ`); (2) kết quả sau NFD + bỏ `\p{M}` lệch độ dài → giữ nguyên
  (ca dấu kết hợp đứng rời). Không import gì, không số literal.
- `test/fold-tap-trung.test.js`: quét **ba cửa** — `normalize(`, dải dấu kết hợp (`\p{M}`, dải
  U+0300–U+036F viết thẳng hoặc bằng escape), và map `đ`/`Đ` viết tay (chuỗi literal chỉ chứa đúng
  ký tự đó, hoặc `Đ`/`đ`). **Không** chặn ký tự `đ` nói chung vì microcopy ở `errors.js`
  đầy `đ`. Ghi rõ lỗ đã biết (không bỏ nội dung chuỗi) kèm test ghim hành vi, theo đúng
  `date-tap-trung.test.js`.
- Điểm yếu đã biết của phần "chứng minh thứ tự": hàm `foldSaiThuTu` trong test (NFD trước, map `đ`
  sau) vẫn ra **đúng** ở ca thường; thứ nó thật sự chứng minh là (a) bỏ hẳn bước map thì `Đường` ra
  `đuong`, và (b) đảo thứ tự phá bất biến vị trí ở đầu vào đã NFD.

**Verification đã chạy (tự làm, không tin báo cáo subagent):**
- `npm test` → 9 file, **117 test, toàn bộ pass**, exit 0, không cần môi trường trình duyệt (từ 94).
- Kiểm ngược dương tính: `app/view/probe.js` với `s.normalize('NFD')` → đỏ đúng
  `app/view/probe.js:1 — normalize(`; xóa → xanh.
- Kiểm ngược âm tính: `app/core/probe.js` chỉ có chú thích nhắc `normalize(` và `\p{M}` → 117/117
  pass, không đỏ oan; xóa.
- `git status --porcelain` → đúng 3 file mới của story này.

**Vòng patch sau review (step-04) — 14 finding, không loopback:**

- `test/fold-tap-trung.test.js`: nới ba cửa và **thêm cửa thứ tư**. Cửa dấu kết hợp nay bắt cả dải
  escape `̀`–`ͯ` (trước chỉ hai đầu dải); cửa map `đ` bắt thêm dạng **regex literal** (`/đ/g`);
  cửa mới "bảng tra ký tự có dấu" bắt `{'á':'a'}` và `[["ữ","u"]]` bằng **ngữ cảnh ánh xạ**
  (ký tự có dấu trong nháy → `:`/`,` → chữ ASCII trong nháy), nên văn bản tiếng Việt có dấu không
  bị báo oan. Có test âm tính quét thẳng `app/core/errors.js` và khẳng định nó sạch.
- Self-test trên `fold.js` nay ghim **đúng tập cửa** phải nổ, thay vì `length > 0`.
- `test/core-fold.test.js`: `foldDaoThuTu` là bản đảo thứ tự **thật** (NFD → bỏ dấu → map `đ` →
  hạ chữ thường cuối) và cho `'Đường'` → `'đuong'`; mã chết cũ đã bỏ. Thêm test lũy đẳng
  `fold(fold(x)) === fold(x)` và test tính chất: tập ký tự đầu ra còn `\p{M}` hoặc còn chữ hoa
  **đúng bằng** `[dấu sắc rời, İ]` — xuất hiện ngoại lệ thứ ba là đỏ.
- **Kiểm ngược tự làm sau patch:** ba dạng từng lọt (`/[̣́]/g` viết escape, `/đ/g` regex literal,
  bảng `{'á':'a'}`) nay đều bị bắt, còn microcopy `'Không mở được kho dữ liệu…'` vẫn sạch —
  chạy trực tiếp từng regex. Probe dương tính vẫn đỏ đúng `app/view/probe.js:1 — normalize(`;
  probe âm tính không đỏ oan. **121/121 pass**, `git status` đúng 3 file.

## Spec Change Log

## Review Triage Log

### Vòng 1 — blind-hunter · edge-case-hunter · verification-gap

| # | Finding | Verdict | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Map `đ` viết dạng **regex literal** (`/đ/g`) lọt bộ quét | `medium` | Tự chạy gate 3 `/(['"`])[đĐ]\1\|\\u011[01]/` trên `x.replace(/đ/g,"d")` → không khớp. Chính `foldSaiThuTu` trong `core-fold.test.js` viết đúng dạng đó. |
| 2 | Escape `́`…`͟` lọt: gate chỉ bắt `̀` và `\u036x` | `medium` | Tự chạy gate 2 trên `t.replace(/[̣́̃̉]/g,"")` (bốn dấu thanh tiếng Việt, viết dạng escape) → `false`. |
| 3 | Bảng tra ký tự tiền tổ hợp (`{'á':'a',…}`) lọt hoàn toàn | `medium` | Tự chạy cả ba gate trên `const M={"á":"a"}` → không gate nào khớp. Đây là dạng bỏ dấu tự chế phổ biến nhất của người không biết NFD. |
| 4 | "Chứng minh thứ tự" yếu: `foldSaiThuTu` hạ chữ thường **trước** khi map `Đ`, nên dòng `.replace(/Đ/g,'D')` là mã chết và hàm vẫn ra đúng | `low` | Đọc `core-fold.test.js:145-152`; chính test `:159-161` khẳng định nó **bằng** `fold`. Thứ nó chứng minh thật là (a) bỏ hẳn bước map và (b) vỡ bất biến ở đầu vào NFD. |
| 5 | Self-test "fold.js là file duy nhất bị bắt" chỉ so `length > 0`, không ghim gate nào nổ | `low` | Đọc `:349-352`. Nới một gate vẫn xanh. Sửa = một assertion trực tiếp. |
| 6 | Thiếu test tính lũy đẳng `fold(fold(x)) === fold(x)` và thiếu assertion tính chất (không còn `\p{M}`, không còn chữ hoa ngoài ca `İ`) | `low` | Đúng: mọi assertion đều so chuỗi cứng. Epic 6 sẽ bỏ dấu chuỗi người dùng gõ rồi so với `textFolded` đã bỏ dấu — lũy đẳng là tính chất nó dựa vào. Sửa = thêm test, không thêm mã. |
| 7 | Bộ quét chỉ đi `app/**/*.js`, không phải "toàn repo", không `.mjs`/`.cjs`/`.ts`/HTML | `low` — defer | Đúng sự việc. Nhưng mã sản phẩm là `.js` dưới `app/`, repo `type: module`, và điểm hẹp thật (script nội tuyến trong `index.html`) đã được ghi nhận ở Story 1.3 và hẹn tại Story 1.8. Cùng lớp với hai mục defer đã có. |
| 8 | `String(Symbol())` làm thông báo lỗi ném lỗi thứ hai | `false` | `String(sym)` hợp lệ (`'Symbol(x)'`); chỉ nội suy `${sym}` mới ném, và `moTa` gọi `String()` trước. Kiểm trực tiếp. |
| 9 | Số dòng báo sai vì tính trên nguồn đã bỏ chú thích | `false` | Tự kiểm: `boChuThichJs('/* a\nb\nc */\nconst x=1;')` giữ đúng 4 dòng — helper thay chú thích bằng khoảng trắng cùng số dòng. |
| 10 | Test quét xanh rỗng nếu `app/` trống | `false` | Test `'có file để quét và fold.js nằm trong đó'` (`:296-298`) chặn đúng ca đó. |
| 11 | `İ` / lone surrogate / ký tự không phải tiếng Việt (`ü`, `ñ`) bị bỏ dấu; `ø`, `æ`, `ß` không được map | `false` | Bỏ dấu chữ Latin nói chung là **cố ý** (hàm dùng cho tìm kiếm). `for…of` sinh lone surrogate như một ký tự, `normalize` không đổi độ dài → bất biến giữ. Không có kết quả xấu nào ở vị trí được nêu. |
| 12 | Thông báo `TypeError` không phân biệt `{}` với `['x']` | `low` — loại | Lỗi lập trình, đọc stack ra ngay; sửa là thêm nhánh rẽ cho lợi ích gần bằng không. |
| 13 | Nên tách bộ máy quét cây dùng chung sang `test/helpers/` | `low` — loại | Ba bộ quét lặp khuôn là **có chủ ý** (Code Map của Story 1.3 và của story này đều nói đừng refactor sang helper dùng chung). Không có harm nào được nêu tên. |
| 14 | `s['normalize']('NFD')` lọt gate 1 | `low` — loại | Đúng nhưng không ai viết thế; sửa là nới regex cho một ca chưa chứng minh được là tới được. |

**Định tuyến:** không có `intent_gap`, không có `bad_spec` → không loopback. #1+#2+#3 gộp một entry (cùng gốc: gate quá hẹp) → `patch`. #4, #5, #6 → `patch`. #7 → `defer`. #8–#11 → loại theo bác bỏ. #12, #13, #14 → loại.

## Design Notes

**Vì sao map `đ` trước.** `đ` (U+0111) là một ký tự độc lập, không có phân rã chuẩn — `'đ'.normalize('NFD')` vẫn ra `'đ'`. Chạy NFD trước rồi bỏ `\p{M}` sẽ để nguyên `đ`, và `fold('Đường')` ra `'đuong'` chứ không phải `'duong'`: gõ `duong` không tìm ra gì.

**Vì sao bất biến vị trí quan trọng.** EXPERIENCE.md đòi tô nền chỗ khớp bên trong chữ có dấu. Nếu độ dài lệch dù chỉ một ký tự, phần tô sẽ trượt dần và triệu chứng duy nhất là "nhìn hơi sai" — không test nào ở Epic 6 bắt được nếu bất biến không được ghim ngay tại đây.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ pass, exit 0, số test tăng so với 94
- Kiểm ngược dương tính: tạm tạo `app/view/probe.js` với `const x = s.normalize('NFD');` → `fold-tap-trung.test.js` đỏ đúng file/dòng; xóa file
- Kiểm ngược âm tính: tạm tạo `app/core/probe.js` chỉ có chú thích nhắc `normalize(` và `\p{M}` → không test nào đỏ oan; xóa file
- `git status --porcelain` -- expected: chỉ các file story này tạo/sửa
