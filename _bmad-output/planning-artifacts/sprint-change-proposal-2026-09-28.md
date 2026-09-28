---
date: 2026-09-28
trigger: epic-8-retro-2026-09-28.md — 3 action item còn `open` (#2, #5, #6 = epic-8-retro-item-32, 35, 36)
mode: batch
scope: moderate — thêm Story 8.3 và 8.4 vào cuối Epic 8, mở lại `epic-8`; không đổi PRD/UX/spine
status: namtt duyệt 2026-09-28 (Q1–Q3 theo khuyến nghị); đã áp §4.1, §4.2; §4.3, §4.4 làm trong Story 8.3/8.4
---

# Sprint Change Proposal — dọn ba action item còn mở của retro Epic 8 (Story 8.3, 8.4)

## 1. Tóm tắt vấn đề

Retro Epic 8 kết luận `accepted-with-open-items`. Sáu trong chín action item đã `done` trong ngày
(#1, #3, #4, #7, #8, #9 — xem `sprint-status.yaml:295-362`). Còn đúng ba item `open`, và namtt yêu
cầu gộp chúng thành hai story:

| Retro # | id trong `sprint-status.yaml` | Phát hiện | Việc |
|---|---|---|---|
| 2 | `epic-8-retro-item-32-…` | F2 | Đưa khối kiểm 8.1/8.2 (stub `estimate`) vào `tools/thu-bo-cuc.mjs`, gạch `deferred-work.md:216`, `:230` |
| 5 | `epic-8-retro-item-35-…` | F3 | Tiêu điểm trên `✕` rơi về `<body>` khi một lượt vẽ neo `undefined` gỡ dải băng |
| 6 | `epic-8-retro-item-36-…` | F4 | Lượt vẽ sau `xinLuuTruBen` có thể chạy trước khi `khoiDong` nạp xong `notes` |

Cả ba đều nằm ở tầng nối `app/main.js`, là phần mà F2 chỉ ra chỉ được ghim bằng regex. Không item
nào chặn nghiệm thu Epic 8.

**Phát hiện thêm khi phân tích (đã đối chiếu mã):**

- `view/banner.js:97-141` bỏ qua lượt vẽ khi dải băng không đổi (`daVeSo`). Nếu cứ "tiêu điểm trong
  dải băng thì về `#o-soan`" như `kiemRoiVe` đang làm (`main.js:414-419`), tiêu điểm sẽ bị giật khỏi
  một nút `✕` **vẫn còn sống**. Bản sửa F3 phải phân biệt hai ca: `✕` còn trong DOM thì ở yên, bị gỡ
  thì về `#o-soan`.
- F3 và F4 đều bị ghim bằng regex mà bản sửa sẽ làm đỏ: `test/core-state-dung-luong.test.js:701`
  (khuôn `tieuDiemTrongDaiBang() ? null : undefined`) và `test/core-state-luu-tru-ben.test.js:306`
  (khuôn `store.xinLuuTruBen().then(() => veGiuTieuDiem(document, veTatCa))`). Hai regex này phải
  được thay, không được nới cho vừa mã mới.
- Script CDP của retro vẫn còn ở
  `%TEMP%\claude\c--Users-namtt-Desktop-bmad\c8f42966-…\scratchpad\kiem-e8.mjs` (145 dòng, 17 ca).
  Đó là thư mục tạm, nên Story 8.3 nên chép nó vào repo sớm trước khi bị dọn.
- `app/core/state.js` hiện 1885 dòng, cách ngưỡng mở lại #30 (>1900) 15 dòng. Cả hai story chỉ chạm
  `main.js` và `tools/`, **không chạm `state.js`**, nên #30 không cần mở lại (retro F1, câu hỏi mở
  thứ ba).

## 2. Phân tích tác động

- **Epic:** Epic 8 là epic cuối và đã `done`. Tiền lệ "story X.0 dọn retro ở đầu epic sau" không áp
  được vì không có epic sau. Đề xuất **thêm Story 8.3 và 8.4 vào cuối Epic 8** và đặt `epic-8` về
  `in-progress`. Lý do không mở Epic 9: cả ba item là nợ của mã Epic 8, không mang FR nào, và Epic
  List của `epics.md` ghi "8 epic".
- **Story:** 8.0–8.2 giữ nguyên, không làm lại.
- **PRD / UX / spine:** không đổi. `veGiuTieuDiem` chỉ được nhắc trong `AGENTS.md` và `epics.md`.
- **AGENTS.md:** hai chỗ phải cập nhật qua `bmad-project-context` (xem §4.4).
- **Mã và deploy:** 8.3 chỉ chạm `tools/` và tài liệu, nên **không bump `APP_VERSION`**. Bump vô cớ
  làm mọi tab đang mở vào chế độ chỉ đọc. 8.4 đổi hành vi app, nên bump `APP_VERSION`.

## 3. Hướng xử lý

**Điều chỉnh trực tiếp.** Làm theo thứ tự 8.3 rồi 8.4: 8.3 dựng khối CDP có stub, 8.4 dùng lại khối
đó để kiểm F4 trước khi sửa và để chứng minh bản sửa F3 bằng trình duyệt thật.

| Story | Gộp | Loại commit | `APP_VERSION` | Công sức | Rủi ro |
|---|---|---|---|---|---|
| 8.3 | #2 | `test:` | không bump | nhỏ (port 17 ca có sẵn) | thấp; chỉ còn câu hỏi luật (Q1) |
| 8.4 | #5 + #6 | `fix:` | bump | nhỏ (~20 dòng `main.js` + test) | thấp–vừa: đổi hàm "DUY NHẤT" `veGiuTieuDiem` |

**Vì sao #5 và #6 đi chung:** cả hai sửa đúng một lớp lỗi, "lượt vẽ bất đồng bộ ở `main.js` chạy
sai lúc hoặc trả tiêu điểm sai chỗ". Cả hai chạm cùng vùng `main.js:121-186` và `:499-509`, và cả hai
thay một regex ghim bằng một ca chạy thật.

## 4. Chi tiết thay đổi

### 4.1 `epics.md` — thêm hai story (chèn sau khối "Diễn giải đã chốt khi làm" của Story 8.2, dòng 1699)

```
### Story 8.3: Khối kiểm dung lượng chạy thật trong thu-bo-cuc

As a Nam,
I want các chỗ nối 8.1/8.2 trong `main.js` được lái bằng trình duyệt thật mỗi lần chạy `thu-bo-cuc`,
So that một `.then` treo nhầm lời hứa làm đỏ một ca, không chỉ lọt qua một regex.

*Nguồn: `sprint-change-proposal-2026-09-28.md`; retro Epic 8 F2 (#2). Không đổi mã app.*

**Acceptance Criteria:**

**Given** `tools/thu-bo-cuc.mjs`
**When** chạy `npm run thu-bo-cuc`
**Then** có một khối "Story 8.1/8.2" chạy trong một **tab riêng** (đóng khi xong, không để stub rò
sang khối khác), cài stub `navigator.storage.estimate` bằng `Page.addScriptToEvaluateOnNewDocument`
**And** stub chỉ thay `estimate` (và `persist` khi cần ép `false` hoặc resolve muộn); không dựng
IndexedDB giả, không chạm `app/adapters/` hay hai file test adapter *(AGENTS.md, luật adapter)*

**Given** khối đó
**Then** nó lái thật qua `main.js` ít nhất các ca của script retro `kiem-e8.mjs`:
- 8.1: `persist()` trả `false` → `ghichu.persistDenied = '1'`, `localStorage` chỉ có khóa trong bộ ba,
  mốc sao lưu 4 ngày → dòng nhắc hiện (ngưỡng 3); `persist()` resolve **muộn** vẫn làm dòng nhắc hiện
  mà không cần tải lại *(`deferred-work.md:216`)*
- 8.2: khởi động không gọi `estimate`; chốt khi vượt vế byte → hàng 7 đúng microcopy, có `✕`, không
  con số; chốt tiếp vẫn giữ hàng 7 (Q3); xóa qua hộp thoại khi dưới ngưỡng → hàng 7 tắt (Q6); `Enter`
  trên `✕` → đóng, tiêu điểm về `#o-soan`, chốt tiếp không gọi `estimate` (Q1); tải lại → hiện lại
- Q5: lần kiểm gỡ hàng 7 **trong lúc `✕` đang giữ tiêu điểm** → tiêu điểm về `#o-soan`, không phải
  `<body>` *(`deferred-work.md:230`)*
- không lỗi console, không request ra ngoài origin

**Given** khối chạy xong
**Then** kho `notes`, bản nháp và `localStorage` được dọn về như trước khối (`DON_SACH`); các khối sau
không đổi kết quả
**And** chỉ ca đỏ đã biết trong AGENTS.md được phép đỏ

**Given** story xong
**Then** `deferred-work.md:216` và `:230` được gạch kèm `resolved:` trỏ về ca `thu-bo-cuc`
**And** AGENTS.md (qua `bmad-project-context`) ghi stub `estimate`/`persist` trong `thu-bo-cuc` là
ngoại lệ có tên, cùng luật "mỗi chỗ nối mới trong `main.js` phải có một ca `thu-bo-cuc`, không chỉ regex"
**And** không bump `APP_VERSION`; một commit `test:`

### Story 8.4: Lượt vẽ bất đồng bộ không thả tiêu điểm, không vẽ trước kho

As a Nam,
I want tiêu điểm không bao giờ rơi về `<body>` khi dải băng đổi dưới tay tôi, và khung hình đầu
không nháy một lưới rỗng,
So that bàn phím, đường duy nhất của app, không bị đứt ở những lượt vẽ tôi không gây ra.

*Nguồn: `sprint-change-proposal-2026-09-28.md`; retro Epic 8 F3 (#5), F4 (#6).*

**Acceptance Criteria:**

**Given** tiêu điểm đang ở nút `✕` của dải băng
**When** một lượt vẽ neo `undefined` chạy (`nhanBanTin`, `mocSua.go`, `xinLuuTruBen`, lần kiểm dung
lượng) và lượt đó **gỡ** dải băng hoặc thay nó bằng một loại khác
**Then** tiêu điểm về `#o-soan`, không phải `<body>` *(F3)*
**And** khi lượt vẽ **không** gỡ `✕` (dải băng không đổi, `banner.js` bỏ qua lượt vẽ) thì tiêu điểm
ở yên trên `✕`

**Given** `veGiuTieuDiem` / `neoTuTieuDiem` trong `app/main.js`
**Then** phép thử "tiêu điểm trong dải băng" nằm **trong** nhánh neo `undefined`, dùng chung cho mọi
chỗ gọi; `kiemRoiVe` gọi neo `undefined` trần, không còn nhánh riêng
**And** `CHON_DAI_BANG` vẫn một lần khai, một lần dùng qua `.closest(...)` (`test/banner.test.js` xanh
không cần nới)
**And** regex `test/core-state-dung-luong.test.js:701` được thay bằng ca **chạy thật**
`veGiuTieuDiem` trên gốc giả (`test/giu-tieu-diem.test.js`), phủ cả hai ca `✕` bị gỡ / còn sống

**Given** Chromium resolve `persist()` trước khi `readAll` xong
**When** trang tải với ít nhất một ghi chú hôm nay trong kho
**Then** trước khi sửa, khối `thu-bo-cuc` của 8.3 **ghi lại** chuỗi giá trị `document.title` (theo dõi
từ lúc tài liệu mới được tạo) để xác định F4 thật hay giả, và kết quả được ghi vào spec *(F4 — kiểm)*
**And** dù kết quả ra sao, lượt vẽ của `xinLuuTruBen` chỉ chạy **sau** `khoiDong` (ví dụ
`Promise.all([khoiDong, xinLuuTruBen])`); không lượt vẽ nào trước lượt đầu của kho dựng lưới từ
`notes = []` *(bất biến `main.js:490-493`)*
**And** regex `test/core-state-luu-tru-ben.test.js:306` được thay cho khớp đường mới, vẫn ghim "đúng
một lời gọi, sau `khoiDong`, giữ tiêu điểm"
**And** `thu-bo-cuc` có ca: kho có N ghi chú hôm nay, `persist` stub resolve ngay → `document.title`
không bao giờ mang số khác N sau lượt vẽ đầu

**Given** story xong
**Then** AGENTS.md (qua `bmad-project-context`) sửa bẫy `veGiuTieuDiem`: neo `undefined` + tiêu điểm
trong dải băng → về `#o-soan` khi `✕` bị gỡ
**And** `npm test` xanh, `thu-bo-cuc` chỉ đỏ ở ca chập chờn đã biết
**And** `APP_VERSION` được bump; một commit `fix:` cho cả story
```

### 4.2 `sprint-status.yaml`

```
OLD:
  epic-8: done
  …
  8-2-cảnh-báo-trước-ngưỡng-dung-lượng: done
  epic-8-retrospective: done

NEW:
  epic-8: in-progress
  …
  8-2-cảnh-báo-trước-ngưỡng-dung-lượng: done
  8-3-khối-kiểm-dung-lượng-chạy-thật-trong-thu-bo-cuc: backlog
  8-4-lượt-vẽ-bất-đồng-bộ-không-thả-tiêu-điểm-không-vẽ-trước-kho: backlog
  epic-8-retrospective: done
```

- `epic-8-retro-item-32` → `in-progress`, thêm `note: "Gop vao Story 8.3 (sprint-change-proposal-2026-09-28)."`; `done` khi 8.3 xong.
- `epic-8-retro-item-35`, `-36` → `in-progress`, thêm `note: "Gop vao Story 8.4 (sprint-change-proposal-2026-09-28)."`; `done` khi 8.4 xong.
- `epic-8` → `done` lại khi 8.4 xong. Không chạy retro lần hai; kết quả ghi trong spec 8.3/8.4.

Sửa qua `bmad-sprint-planning` (`sprint_plan.py`), không sửa tay.

### 4.3 `deferred-work.md`

Story 8.3 gạch `:216` và `:230`, cùng khuôn `~~…~~` + `resolved:` đang dùng ở `:176`, `:181`.

### 4.4 `AGENTS.md` (qua `bmad-project-context`, trong từng story)

- **8.3**, mục "Chạy và kiểm chứng": `thu-bo-cuc` có khối stub `navigator.storage.estimate`/`persist`
  trong trang. Đây là ngoại lệ có tên, không phải giấy phép dựng trình duyệt giả. Kèm luật "chỗ nối
  mới trong `main.js` → một ca `thu-bo-cuc`".
- **8.4**, bẫy `veGiuTieuDiem`: thêm nghĩa mới của neo `undefined` khi tiêu điểm ở dải băng.

### 4.5 PRD / UX / spine

Không đổi.

## 5. Bàn giao

- **Phạm vi:** Moderate. Sắp lại backlog (thêm hai story vào epic đã đóng, mở lại `epic-8`); không cần
  PM/Architect.
- **Dev:** (1) áp §4.1 và §4.2; (2) chép `kiem-e8.mjs` vào chỗ an toàn trước khi thư mục tạm bị dọn;
  (3) tạo spec 8.3 từ `epics.md` rồi build; (4) spec 8.4, build sau 8.3.
- **Tiêu chí thành công:** không còn `epic-8-retro-*` nào `open`; `npm test` xanh; `thu-bo-cuc` chỉ
  đỏ ở ca chập chờn đã biết; `test/core-state-dung-luong.test.js:701` và
  `test/core-state-luu-tru-ben.test.js:306` không còn là regex đứng một mình cho hành vi; F4 có kết
  luận thật/giả ghi trong spec 8.4; `state.js` không tăng dòng nào.
- **Câu hỏi cho namtt:**
  - **Q1** (retro, câu hỏi mở F2): chấp nhận stub `estimate`/`persist` trong trang ở `thu-bo-cuc` là
    ngoại lệ có tên, không tính là "dựng trình duyệt giả"? *Khuyến nghị: có.* Không có stub thì không
    lái được hàng 7 trên headless (quota giả lập của CDP không có hiệu lực).
  - **Q2** (retro, câu hỏi mở F3): đổi hành vi chung của neo `undefined` trong `veGiuTieuDiem`, hàm
    AGENTS.md gọi là "DUY NHẤT"? *Khuyến nghị: có.* Sửa ở một chỗ đúng tinh thần hàm duy nhất hơn là
    thêm nhánh riêng ở từng chỗ gọi.
  - **Q3**: thêm 8.3/8.4 vào Epic 8 và mở lại `epic-8`, thay vì mở Epic 9? *Khuyến nghị: Epic 8.*
