---
title: 'Story 5.1: Sửa nội dung tại chỗ'
type: 'feature'
created: '2026-09-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'cd61d0e90d3a196a67af985d5b8592928e1838f4'
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ghi chú đã chốt là chữ chết — muốn chữa một chỗ gõ sai phải xóa cả mẩu rồi ghi lại,
và làm thế thì `createdAt` đổi, mẩu nhảy vị trí trong lưới, mất đúng cái neo thời gian mà sản
phẩm dựng lên để bán.

**Approach:** Cho mẩu giấy một **chế độ sửa** tại chỗ: click đưa mẩu thành một `<textarea>` mượn
nguyên ngôn ngữ vật liệu của ô soạn thảo, gõ thì tự lưu qua action `tuLuuNoiDung` đã có sẵn trong
core, focus rời mẩu thì thoát. Hai nhịp click không bao giờ nhập một: mẩu bị cắt thì click 1 chỉ
mở rộng, click 2 mới vào sửa; mẩu ngắn thì click 1 vào sửa luôn.

## Boundaries & Constraints

**Always:**
- `id` và `createdAt` bất biến; `textFolded` + `localDate` tính lại ở mỗi lần ghi, và **chỉ** qua
  `banGhiSua` trong `core/state.js`. Mẩu không đổi vị trí trong lưới sau khi sửa.
- Tự lưu đi theo luồng **đổi state ngay, ghi đi sau** (`henGhiDiSau`) — ngược với luồng đổi sự tồn
  tại. Ghi hỏng thì chữ vừa gõ **không bị trả lại**, chỉ dải băng lên.
- Kỷ luật `seq` giữ nguyên **cơ chế** (hẹn nổ ra mà `seq` lệch thì bỏ; **không** `clearTimeout` —
  nó biến chốt chặn `seq` thành mã chết) nhưng đổi **hình dạng** của bộ đếm bên sửa: `editing.seq`
  phải là một bộ đếm **theo từng `id`**, không phải một số dùng chung cho mọi mẩu. `draft.seq` giữ
  nguyên là một số — bản nháp chỉ có một. *(Nam chốt ở vòng review 1: một bộ đếm dùng chung làm
  hẹn ghi của mẩu A bị hẹn của mẩu B bỏ, tức mất chữ của A trong im lặng — đo được `nhatKy =
  ["put:b"]` trong khi kho của A còn chữ cũ.)*
- **Một phép đổi state không đồng bộ phải kéo theo một lượt vẽ.** Không có cơ chế subscribe trong
  app, nên mọi nhánh đổi state SAU một lời hứa (`put` xong, `put` hỏng, hay một nhánh trả về sớm
  có bật dải băng) chỉ hiện ra được nếu chỗ nối gọi một lượt vẽ. "Không vẽ lại khi gõ" chỉ áp cho
  đúng phím gõ, không áp cho kết quả của phép ghi. *(Nam chốt ở vòng review 1: ba lỗi cùng họ —
  chữ vừa sửa biến khỏi lưới, dải băng trần không bao giờ hiện, tiêu điểm rơi về `<body>`.)*
- Tư cách "đang ở chế độ sửa" sống trong `state.editing.id`, không phải biến cục bộ của view.
- Sửa chạy y hệt ở mọi khung nhìn; code không được có nhánh riêng cho khung nhìn nào.
- Tĩnh tuyệt đối: chế độ sửa không `transition`, không `:hover`, không hoạt ảnh. Màu lấy từ token.

**Quyết định đã chốt:**
- **Trần ký tự khi đang sửa có câu riêng.** Thêm một loại dải băng `TOO_LONG_KHI_SUA` vào
  `core/banner.js` theo đúng tiền lệ `TOO_LONG_TU_FILE`: vẫn dùng chung mã `MA_LOI.TOO_LONG` nên
  tập mã lỗi giữ nguyên sáu giá trị, nhưng câu chữ dừng ở *"Ghi chú này đã đạt 20.000 ký tự —
  không nhận thêm."*, bỏ mệnh đề `Ctrl+Enter` vốn chỉ đúng cho ô soạn thảo. Bảng ưu tiên dải băng
  phải nhận loại mới cùng lúc.
- **Thoát chế độ sửa thì mẩu thu gọn lại.** `roiCheDoSua()` gỡ luôn `id` đó khỏi `expandedIds`,
  trong cùng một lần `datLai`. Lưới không tích tụ mẩu mở rộng; cái giá là muốn soát lại toàn văn
  thì phải click lại hai nhịp — chấp nhận.

**Never:**
- Không nút Lưu, không chỉ báo "đã lưu", không đếm ký tự còn lại — state không có trường mang
  nghĩa đó và test quét mã sẽ chặn tên biến như vậy.
- Không lưu lịch sử sửa đổi, không hoàn tác.
- Không đụng tới xóa (Story 5.3) và không đụng tới hành vi ghi chú rỗng (Story 5.2): trong story
  này, sửa hết chữ rồi rời mẩu để lại một ghi chú rỗng — đó là hành vi đúng của 5.1.
- Không thêm mã lỗi thứ bảy vào tập đóng của `core/errors.js`.
- Không thêm phương thức mới vào cổng `noteStore`: `put` đã là đường ghi.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Mẩu ngắn, click 1 | `soDong(text) <= COLLAPSED_LINES`, `editing.id = null` | Vào chế độ sửa; con trỏ ở vị trí click | N/A |
| Mẩu bị cắt, click 1 | `soDong(text) > COLLAPSED_LINES`, chưa mở rộng | **Chỉ** mở rộng; `editing.id` vẫn `null` | N/A |
| Mẩu bị cắt, click 2 | đã mở rộng, `editing.id = null` | Vào chế độ sửa; con trỏ ở vị trí click | N/A |
| Gõ trong chế độ sửa | `editing.id = X` | `editing.text` đổi ngay; ghi đi sau `AUTOSAVE_MS`; `notes[X].text` đổi **khi `put` xong**, và lưới phải hiện chữ mới ngay lúc đó (không đợi tương tác sau) | N/A |
| Ghi hỏng | cổng `put` ném `Error.code` | Dải băng theo mã **và dải băng phải hiện ra trên màn hình**; chữ trong state giữ nguyên, không trả lại bản cũ | qua `maBanner` |
| Vượt trần ký tự | `text.length > MAX_NOTE_CHARS` | Không gọi cổng; `editing.text` **vẫn nhận** chữ vừa gõ (không bỏ rơi nó); dải băng `TOO_LONG_KHI_SUA` (câu không có `Ctrl+Enter`) **hiện ra ngay**, không đợi rời mẩu | `MA_LOI.TOO_LONG` |
| Rời focus | click ra ngoài, hoặc `Tab` | Thoát chế độ sửa **và** mẩu thu gọn lại; hẹn đang treo vẫn nổ đúng và vẫn ghi; **tiêu điểm ở lại đúng điểm dừng mà người dùng vừa tới**, không rơi về `<body>` | N/A |
| Hai mẩu liên tiếp | đang sửa A, click sang B, **rồi gõ vào B** | A thoát, B vào; cả hai mẩu giữ đúng chữ của mình — hẹn của A vẫn ghi dù B đã gõ trong `AUTOSAVE_MS` | N/A |
| Mở lại mẩu vừa sửa | rời A rồi vào A lại trong `AUTOSAVE_MS` | Ô sửa mở ra với chữ **vừa gõ**, không phải chữ cũ trong `notes` | N/A |
| Bấm `thu lại ▴` khi đang sửa | `editing.id = X`, mẩu X đang mở rộng | Mẩu **thu gọn** và thoát chế độ sửa — một lần, không bật lại | N/A |

</frozen-after-approval>

## Code Map

- `app/core/state.js` — `tuLuuNoiDung(id, text)` **đã có và đã có test**, chưa ai gọi: đây là
  hook của story. `banGhiSua(cu, text)` là chỗ duy nhất tính lại trường dẫn xuất. `henGhiDiSau`
  là hẹn tự lưu của chế độ sửa (khác `henGhiBanNhapDiSau` của bản nháp). Lát state
  `editing: { id, text, seq }` đã khai báo. `datLai` là cửa đổi state duy nhất. **Thiếu:** action
  vào/rời chế độ sửa.
  **Hai chỗ phải đổi có chủ ý (bài học vòng 1, đã đo):**
  - `editing.seq` hiện là MỘT số dùng chung. `henGhiDiSau(seqCuaHen, …)` so `noiBo.editing.seq !==
    seqCuaHen` rồi bỏ hẹn, nên gõ vào mẩu B huỷ hẹn của mẩu A. Đổi sang bộ đếm theo `id`, và
    `henGhiDiSau` phải so theo đúng `id` của hẹn đó. `test/core-state.test.js` có ca ghim
    `editing.seq` là số — sửa cùng lúc.
  - Nhánh `text.length > MAX_NOTE_CHARS` trong `tuLuuNoiDung` `return` **trước** khi đồng bộ
    `editing.text`. So với cửa em sinh đôi `datBanNhap`, nó làm ngược: `datBanNhap` lưu chữ vượt
    trần RỒI mới bật dải băng. Lấy `datBanNhap` làm khuôn.
- `app/main.js:195` — **"Không có cơ chế subscribe"**, ghi thẳng trong mã. Đây là gốc của ba lỗi
  vòng 1: `datLai` không kéo theo lượt vẽ nào, nên mọi nhánh đổi state sau một lời hứa phải được
  một chỗ nối gọi vẽ. `veTatCa()` là lượt vẽ cả năm view; `luoi.ve()` là lượt vẽ riêng của lưới.
- `app/view/mau-giay.js` — `veMau(note, ownerDocument, dangMoRong, khiClick)`; `soDong(text)` so
  với `COLLAPSED_LINES` là phép quyết định "có bị cắt không" (logic, không đo DOM). Bảng hằng lớp
  `LOP_*` và `TAB_CO`/`TAB_KHONG`. **Ràng buộc phải phá có chủ ý:** hôm nay mẩu ngắn không gắn
  listener và không có `tabindex` — `test/mau-giay.test.js` ghim đúng điều đó, phải sửa cùng lúc.
- `app/view/o-soan.js` — khuôn mẫu phải chép: `input` → đúng **một** lời gọi action, không timer
  không `seq` trong view; `dongBoTuState` so sánh trước khi gán để con trỏ không nhảy;
  `caoTheoNoiDung()` tự dãn chiều cao.
- `app/view/luoi.js` — `noiLuoi(...).ve()` đọc `notes`/`dieuKien`/`expandedIds`, gọi `veMau` rồi
  `replaceChildren`. Phải đọc thêm `editing.id`, và **không được vẽ lại khi đang gõ** (xem Design
  Notes).
- `app/main.js` — mẫu nối: `const latRoiVe = () => veTatCa()` rồi truyền vào view; `veTatCa()` gọi
  lần lượt các view. `dongRoiVe` là tiền lệ trả focus sau khi vẽ lại.
- `app/style.css` — mượn từ `.o-soan`: `--surface`, `--focus`, `--radius-input`, `--shadow-inset`.
  Khối focus ring dùng chung ở đầu file.
- **Không đổi:** `app/ports/`, `app/adapters/`, `core/time.js`, `core/fold.js`, `core/errors.js`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/state.js` -- `editing.seq` thành bộ đếm **theo `id`**, và `henGhiDiSau` so theo
      `id` của chính hẹn đó -- một bộ đếm dùng chung làm hẹn của mẩu A bị mẩu B bỏ; đây là lỗi
      mất chữ đã đo ở vòng 1, không phải một ca giả định.
- [x] `app/core/state.js` -- thêm hai action `vaoCheDoSua(id)` và `roiCheDoSua()` đặt/xóa
      `editing.id`; `roiCheDoSua` gỡ luôn `id` đó khỏi `expandedIds` trong cùng một lần `datLai`;
      export qua store đã đóng băng -- view cần một chỗ hợp lệ để khai báo tư cách đang sửa mà
      không tự đổi state.
- [x] `app/core/state.js` -- `vaoCheDoSua` lấy chữ **đang gõ** khi mở lại đúng mẩu vừa sửa
      (`editing.text` nếu còn hẹn treo của `id` đó, `notes` nếu không) -- `notes` chưa đổi cho tới
      khi `put` xong, nên đọc thẳng `notes` là mở ô sửa bằng chữ cũ.
- [x] `app/core/state.js` -- nhánh vượt trần **đồng bộ `editing.text` rồi mới** bật dải băng, theo
      đúng khuôn `datBanNhap` -- trả về sớm làm chữ vừa dán mất ở lượt vẽ sau.
- [x] `app/core/banner.js` -- thêm loại `TOO_LONG_KHI_SUA` (dùng chung mã `MA_LOI.TOO_LONG`, câu
      không có mệnh đề `Ctrl+Enter`) và ghi nó vào bảng ưu tiên cùng lúc; `tuLuuNoiDung` phát loại
      này thay vì loại của ô soạn thảo -- tập mã lỗi phải giữ đúng sáu giá trị.
- [x] `app/core/limits.js` -- bump `APP_VERSION` -- luật deploy.
- [x] `app/view/mau-giay.js` -- vẽ nhánh chế độ sửa (`<textarea>` thay `.mau-than`), cho **mọi**
      mẩu `tabindex="0"` và listener click/phím, đặt con trỏ theo vị trí click qua
      `caretPositionFromPoint`/`caretRangeFromPoint` với đường lui là cuối chữ -- trái tim của
      story; mẩu ngắn phải vào sửa được bằng cả chuột lẫn bàn phím.
- [x] `app/view/mau-giay.js` -- chỉ nhận `offset` khi node dưới điểm bấm nằm trong `.mau-than`;
      node khác thì về cuối chữ -- bấm vào dòng giờ tạo cho một `offset` của `"09:05"` rồi áp vào
      toàn văn ghi chú, tức con trỏ nhảy sai chỗ.
- [x] `app/view/mau-giay.js` -- đo chiều cao ô sửa **sau khi nó đã vào DOM**, và nghe `resize` như
      `o-soan.js` -- `scrollHeight` của một phần tử còn rời khỏi DOM là 0, nên ô sửa có thể mở ra
      cao 0px; và đổi bề rộng cửa sổ lúc đang sửa thì chữ bị cắt.
- [x] `app/view/mau-giay.js` -- dòng gấp khi mẩu ĐANG sửa không được gọi `batTatMoRong` -- `blur`
      đã gỡ `id` khỏi `expandedIds` trước đó, nên một lần bật lại làm mẩu mở rộng thay vì thu.
- [x] `app/view/luoi.js` -- đọc `editing.id`, truyền xuống `veMau`, và chặn vẽ lại toàn lưới
      trong lúc gõ (so theo `id` đọc từ DOM, **không** `?.` trên `querySelector`) -- vẽ lại mỗi
      phím sẽ giết `<textarea>` và con trỏ, còn một phép gác viết rộng tay sẽ chặn luôn lượt vẽ
      mở ô sửa của mẩu thứ hai.
- [x] `app/main.js` -- nối callback click/blur của lưới vào `vaoCheDoSua`/`roiCheDoSua`/
      `tuLuuNoiDung`; móc rời mang theo `id`; lượt vẽ khi rời hoãn một nhịp -- `blur` nổ cả khi
      phần tử bị gỡ khỏi DOM, và nó đi trước `mouseup`.
- [x] `app/main.js` -- **giữ tiêu điểm qua lượt vẽ khi rời chế độ sửa**, theo tiền lệ `dongRoiVe`
      -- `Tab` ra khỏi ô sửa rồi `replaceChildren` sẽ gỡ đúng phần tử vừa nhận tiêu điểm và đẩy
      nó về `<body>`.
- [x] `app/main.js` -- một lượt vẽ phải chạy khi **phép ghi xong hoặc hỏng**: chữ vừa sửa hiện
      trên lưới, dải băng hiện trên màn hình -- không có cơ chế subscribe, nên không nối thì hai
      thứ đó không bao giờ thấy được. Không vẽ lại ở phím gõ.
- [x] `app/style.css` -- thêm quy tắc tĩnh cho thân mẩu ở chế độ sửa bằng token đã có, không token
      mới -- `test/token-style.test.js` chặn màu viết thẳng và `:root` lạ.
- [x] `test/mau-giay.test.js` -- sửa ca đang ghim "click mẩu ngắn không đổi gì"; thêm ca hai nhịp
      click, ca con trỏ (kèm ca node **ngoài** `.mau-than`), ca lớp chế độ sửa, ca dòng gấp khi
      đang sửa.
- [x] `test/core-state.test.js` -- ca cho hai action mới; ca `seq` theo `id`: **gõ vào B rồi chờ,
      và hẹn của A vẫn phải ghi**; ca mở lại mẩu vừa sửa trong `AUTOSAVE_MS`; ca vượt trần giữ
      `editing.text`.
- [x] `test/luoi.test.js` -- ca không vẽ lại khi đang gõ, ca đổi mẩu đang sửa vẫn vẽ được, ca
      `editing.id` xuống đúng mẩu. Kiểm bằng cách **chạy** chỗ nối, không quét chuỗi mã nguồn.
- [x] `test/banner.test.js` -- ca cho `TOO_LONG_KHI_SUA`: đúng câu chữ, đúng vị trí trong bảng ưu
      tiên, và không lẫn với `TOO_LONG_TU_FILE`.
- [x] `tools/thu-bo-cuc.mjs` -- phép đo cho chiều cao ô sửa lúc vừa mở, cho tiêu điểm sau khi
      `Tab` ra khỏi ô sửa, và cho dải băng trần lúc đang sửa; mọi phép đọc `.mau-sua` phải kiểm
      `null` và báo qua `ghi(...)` -- một hồi quy không được hiện ra như một lần nổ của công cụ.
- [x] `README.md` -- thêm mục checklist thủ công (nối tiếp số 27) cho con trỏ theo vị trí click và
      cho hai nhịp click -- `caretPositionFromPoint` không kiểm được bằng test tự động. Cập nhật
      `AGENTS.md` (mục "Nơi để tìm") sang đúng dải số mới.

**Acceptance Criteria:**
- Given một mẩu đang ở chế độ sửa, when người dùng gõ rồi đợi quá `AUTOSAVE_MS`, then bản ghi
  trong kho đổi đúng một lần, `createdAt` giữ nguyên giá trị cũ, và **lưới hiện chữ mới ngay lúc
  phép ghi xong** — không đợi một tương tác khác.
- Given đang sửa mẩu A, when người dùng click sang mẩu B **rồi gõ vào B** trước khi hẹn của A nổ,
  then cả hai mẩu giữ đúng chữ của mình trong kho.
- Given `editing.id` khác `null`, when lưới được yêu cầu vẽ lại vì một lý do khác, then
  `<textarea>` đang gõ và vị trí con trỏ không bị mất.
- Given một mẩu dài đang mở rộng và đang ở chế độ sửa, when focus rời khỏi mẩu, then `editing.id`
  về `null`, `id` đó biến khỏi `expandedIds`, và **tiêu điểm ở lại đúng điểm dừng người dùng vừa
  `Tab` tới**.
- Given một mẩu đang ở chế độ sửa, when người dùng dán quá `MAX_NOTE_CHARS` ký tự, then dải băng
  `TOO_LONG_KHI_SUA` **hiện ra trên màn hình ngay lúc đó** và chữ vừa dán vẫn còn cả trong ô lẫn
  trong `editing.text`.

## Implementation Notes

**Vòng vẽ lại — ĐƯỜNG 1 ("không vẽ lại khi gõ"), cộng một cửa gác ở `luoi.js`, cộng MỘT đường
mới cho kết quả của phép ghi.** Bộ nghe `input` của ô sửa gọi đúng `store.tuLuuNoiDung(...)` và
không gì khác. Nhưng đường 1 một mình là gốc của ba lỗi `high` ở vòng 1, nên nó được trả bằng một
thay đổi nhỏ và có chủ ý ở lõi: **`tuLuuNoiDung` nay trả về một lời hứa** chốt khi phép ghi đã
xong, đã hỏng, hay hẹn đã bị bỏ. `main.js` treo `veTatCa` vào đúng lời hứa đó. Đây là đường DUY
NHẤT để `notes` vừa đổi (chữ mới trên lưới) và `banner` vừa bật (dải băng trần) hiện được ra —
dự án không có subscribe, và story này không dựng một cái. Nhánh vượt trần trả `Promise.resolve()`
ngay, nên dải băng lên ở lượt vẽ kế tiếp chứ không đợi `AUTOSAVE_MS`.

Cửa gác vẫn ở `luoi.js` (chỗ duy nhất gọi `replaceChildren`) và vẫn so theo `id` đọc từ thuộc
tính `data-sua` của ô đang có trong DOM — nên lượt vẽ do phép ghi kéo theo không giết
`<textarea>` đang gõ, còn lượt vẽ mở ô sửa của mẩu thứ hai vẫn đi qua.

**`editing.seq` thành một BẢNG theo `id`.** `henGhiDiSau(id, seqCuaHen, …)` so `editing.seq[id]`.
Cơ chế không đổi một chữ (hẹn nổ ra mà `seq` lệch thì bỏ; không `clearTimeout` ở đâu cả), chỉ
hình dạng của bộ đếm đổi. `draft.seq` giữ nguyên là một số.

**Một `Map` trong closure của `taoStore` (`chuDangCho`) chở chữ vừa gõ của mỗi mẩu còn hẹn treo.**
Nó cần thiết và không thay được bằng `editing.text`: khi Nam rời A, gõ sang B, rồi quay lại A
trong `AUTOSAVE_MS`, `notes` còn chữ CŨ của A và `editing.text` đang mang chữ của B. Nó KHÔNG là
một trường state (view không vẽ gì từ nó, và AD-3 chốt đúng mười khóa) — cùng khuôn `tabCuaMinh`
/ `dangChot` / `dangNap`. Một mục vào khi gõ và ra khi hẹn của chính mẩu đó nổ, nên nó không
phình.

**`seq` KHÔNG tăng ở `vaoCheDoSua`/`roiCheDoSua`** — hai action này không phải lệnh huỷ.

**Móc rời mang theo `id`, và `main.js` chỉ rời khi `store.state.editing.id === id`:** `blur` nổ
cả khi phần tử bị GỠ khỏi DOM, nên lượt vẽ mở ô sửa của B phát `blur` của A ngay giữa đường.

**Lượt vẽ khi rời hoãn một nhịp (`setTimeout`, không `requestAnimationFrame` — bộ quét chặn), và
nó GIỮ TIÊU ĐIỂM** (`veGiuTieuDiem`, tiền lệ `dongRoiVe`). Nhận diện bằng VỊ TRÍ trong danh sách
con của `.luoi`, không bằng một `id` gắn thêm vào DOM: lưới dựng lại đúng cùng tập mẩu theo cùng
thứ tự. Tiêu điểm ở ngoài lưới thì không phải làm gì — `replaceChildren` không chạm tới nó.

**Hai nhịp click tách ở `luoi.js` bằng `soDong(note.text) > COLLAPSED_LINES && !moRong`**, và
`mau-giay.js` chỉ báo lên chỗ gọi kèm vị trí con trỏ. Con trỏ suy từ điểm bấm qua
`caretPositionFromPoint` / `caretRangeFromPoint`, và `offset` CHỈ được nhận khi node dưới điểm
bấm nằm trong `.mau-than` — bấm vào dòng giờ cho một `offset` của `"09:05"`. Đường lui là cuối
chữ, và bàn phím luôn đi đường lui đó.

**`caoTheoNoiDungSua` được EXPORT và gọi từ `luoi.js` SAU `replaceChildren`**: `scrollHeight` của
một phần tử còn rời khỏi DOM là `0`. Đo thật trên Chrome: ô sửa mở ra cao 459px, không cuộn.
Bộ nghe `resize` gắn trong `veThanSua`, cùng khuôn `o-soan.js`.

**`veThanSua` là một HÀM RIÊNG, không một nhánh `if` trong `veMau`** — và đó là một điều kiện:
`test/focus-va-tab.test.js` suy ra tập điều khiển focusable bằng cách nối `const x =
…createElement(T)` với `x.className = L`, nên một phần tử dựng qua `let` rồi gán sẽ không được
cửa "mọi điều khiển đều có vòng sáng" phủ, trong im lặng.

**Dòng gấp giữ nghĩa của chính nó**: `.mau-gap` chặn nổi bọt và gọi một móc RIÊNG (`khiGap`, mặc
định là `khiClick` để chỗ gọi cũ không phải đổi). Khi mẩu đang sửa, móc đó gọi `roi` chứ KHÔNG
`batTatMoRong` — `blur` đã gỡ `id` khỏi `expandedIds` trước đó.

**Câu của `TOO_LONG_KHI_SUA` CẮT câu của `MA_LOI.TOO_LONG` ở `'. '`** (dấu chấm CỘNG khoảng
trắng — `20.000` cũng có một dấu chấm), và `test/banner.test.js` ghim nguyên văn kết quả.

**Bốn lần renegotiate, mỗi lần có chú thích tại chỗ:** `test/focus-va-tab.test.js` (QĐ-2: mọi mẩu
mang `tabindex="0"`, cộng `.mau-sua` vào bảng điều khiển đã biết), `test/mau-giay.test.js` ("click
mẩu ngắn không đổi gì cả" đảo chiều), `test/bo-cuc-bon-tang.test.js` (`.mau-sua` vào tập selector
mang bóng — nó DÙNG LẠI `--shadow-inset`, không thêm cái bóng thứ ba), `test/theme.test.js`
(`.mau-sua` vào bảng `NEN_CUA` với nền `--surface`).

**Còn nợ, đã biết:** bộ nghe `resize` của mỗi ô sửa không được gỡ khi lượt vẽ thay ô đó ra — nó
sống tới hết vòng đời tab và đo một phần tử đã rời DOM (vô hại: `scrollHeight` bằng 0 trên một
phần tử không ai thấy). Một mục mỗi lần VÀO chế độ sửa, nên nó bị chặn trên bởi số lần sửa trong
một phiên. Gỡ nó cần một móc "phần tử này sắp bị thay ra" mà tầng view chưa có; hóa đơn đó nên
trả cùng lúc với ĐƯỜNG 2 ("vẽ lại có so sánh") ở Epic 7.

**Đo thật:** `npm test` 724 xanh; `npm run thu-bo-cuc` 77/77 trên Chrome thật (gồm bốn phép đo
mới: chiều cao ô sửa lúc vừa mở, tiêu điểm sau `Tab`, dải băng trần, và chữ mới trên lưới sau khi
hẹn ghi nổ); `npm run thu-tay` 18/18.

## Ghi chép vòng 1 (đã hoàn nguyên — đọc như tư liệu, không phải mã đang sống)

**Vòng vẽ lại — chọn ĐƯỜNG 1 ("không vẽ lại khi gõ"), cộng một cửa gác ở `luoi.js`.**
Bộ nghe `input` của ô sửa gọi đúng `store.tuLuuNoiDung(...)` và không gì khác (`main.js` →
`goSua`), đúng tinh thần `o-soan.js`. Nhưng đường 1 một mình không đủ: `veTatCa()` còn được gọi
từ bốn nguồn khác (đóng dải băng, lật theme, nạp file, chốt ghi chú), và mỗi lượt như vậy sẽ
`replaceChildren` cả lưới giữa lúc đang gõ. Nên `ve()` mở đầu bằng một phép gác: đang sửa mẩu
nào mà DOM ĐÃ có ô sửa của đúng mẩu đó thì thoát sớm, không chạm danh sách con.

Phép gác so theo `id` chứ không chỉ "có đang sửa gì không", và `id` đó đọc từ thuộc tính
`data-sua` trên chính ô đang có trong DOM — không từ một biến của view (view không giữ state
riêng). Vế "so theo `id`" là điều kiện: khi đổi mẩu đang sửa (A → B), ô sửa của A vẫn còn trong
DOM ở lúc lượt vẽ của B chạy, nên một phép gác viết rộng tay sẽ chặn đúng lượt vẽ mở ô sửa của B.

Cái giá đã nhận (đúng như spec nêu): một nguồn KHÁC đổi `notes` trong lúc đang sửa — nạp file,
và tab khác ở Epic 7 — để lại một lưới cũ cho tới lượt vẽ sau. Đường 2 ("vẽ lại có so sánh") là
chỗ trả hóa đơn đó, và nó nên được trả cùng lúc với Epic 7 chứ không sớm hơn.

**`seq` KHÔNG tăng ở `vaoCheDoSua`/`roiCheDoSua`.** Hai action này không phải lệnh huỷ. Tăng
`seq` ở đó sẽ BỎ hẹn tự lưu đang treo của mẩu vừa rời — tức mất những ký tự cuối vừa gõ vào A
khi Nam click sang B, và mất trong im lặng. Hẹn mang `id` và `text` của riêng nó trong closure,
nên nó ghi đúng bản ghi của A và không đụng tới B. `clearTimeout` vẫn không có mặt ở đâu cả.

**`blur` cũng nổ khi phần tử bị GỠ khỏi DOM — bẫy đã xảy ra thật.** Lượt vẽ đưa mẩu B vào chế độ
sửa xoá ô sửa của mẩu A, Chrome phát `blur` của A ngay giữa lượt vẽ đó, và phép rời tắt luôn chế
độ sửa vừa mở (`npm run thu-bo-cuc` bắt được: ô sửa của B biến mất sau 200 ms). Nên móc `roi`
mang theo `id`, và `main.js` chỉ rời khi `store.state.editing.id === id` — một `blur` của mẩu khác
là tiếng vọng của một lượt vẽ và bị bỏ.

**Lượt vẽ sau khi RỜI chế độ sửa được HOÃN một nhịp (`setTimeout(veTatCa)`).** `blur` chạy cùng
nhịp với `mousedown`, TRƯỚC `mouseup` và `click`. Vẽ lại ngay thì phần tử chuột vừa bấm xuống bị
thay ra trước khi nhả chuột, và trình duyệt phát `click` lên tổ tiên chung thay vì lên mẩu — cú
bấm từ mẩu A sang mẩu B bị mất, và Nam phải bấm hai lần (đúng hàng "Hai mẩu liên tiếp" của
Matrix). Hoãn một nhịp thì `click` của B tới đích trước. `requestAnimationFrame` bị cấm ở
`test/chuyen-dong-va-tin-hieu.test.js`, nên `setTimeout` không hạn là cửa duy nhất.

**Dòng gấp giữ nghĩa của chính nó.** Nhãn `thu lại ▴` phải thu mẩu lại, nên `.mau-gap` chặn nổi
bọt và gọi `khiClick` (đúng khuôn nút `xóa`). Không có nó thì chữ trên màn hình nói một việc và
cú bấm làm một việc khác — và với `roiCheDoSua` thu mẩu lại, đường thu tay sẽ không còn tồn tại.

**Trần ký tự.** `LOAI_BANG.TOO_LONG_KHI_SUA` CẮT câu của `MA_LOI.TOO_LONG` ở dấu kết câu đầu
tiên thay vì chép tay — cùng lý do `TOO_LONG_TU_FILE` tra lại câu của `BAD_FILE`. Phép cắt neo
vào `'. '` (dấu chấm CỘNG khoảng trắng): `20.000` cũng có một dấu chấm. `test/banner.test.js`
ghim nguyên văn kết quả, nên phép cắt không thể lặng lẽ trả về một câu khác.

**Ba bất biến đã ghim ở nơi khác phải RENEGOTIATE, mỗi cái có chú thích tại chỗ:**
`test/focus-va-tab.test.js` (QĐ-2: mọi mẩu mang `tabindex="0"`, không chỉ mẩu bị cắt),
`test/mau-giay.test.js` ("click mẩu ngắn không đổi gì cả" đảo chiều),
`test/bo-cuc-bon-tang.test.js` (`.mau-sua` gia nhập tập selector mang bóng — nó DÙNG LẠI
`--shadow-inset`, không thêm cái bóng thứ ba), và `tools/thu-bo-cuc.mjs` (hai ca đo lại theo
hành vi mới, cộng `editing` vào ba store giả).

## Spec Change Log

### Vòng 1 → 2 (2026-09-17) — sửa spec sau lượt review, code dựng lại

**Phát hiện kích hoạt:** `editing.seq` là một bộ đếm dùng chung cho mọi mẩu, nên gõ vào mẩu B
trong `AUTOSAVE_MS` làm hẹn ghi của mẩu A bị bỏ — đo được `nhatKy = ["put:b"]` trong khi kho của
A còn chữ cũ. Khối đóng băng vừa ghim "hai bộ đếm tách biệt" vừa đòi AC "cả hai mẩu giữ đúng chữ
của mình": hai vế không thể cùng đúng, nên đây là intent_gap, không phải một lỗi triển khai.

**Đã sửa trong spec:**
- Khối đóng băng: `editing.seq` thành bộ đếm theo `id` (**Nam chốt**); thêm ràng buộc "một phép
  đổi state không đồng bộ phải kéo theo một lượt vẽ"; ma trận sửa bốn hàng và thêm ba hàng mới
  (mở lại mẩu vừa sửa, bấm `thu lại ▴` khi đang sửa, gõ vào B rồi mới chờ).
- Ngoài khối đóng băng: Code Map nêu thẳng ba cái bẫy đã đo; Tasks tách thành 21 mục có địa chỉ;
  AC thêm hai vế hiện-ra-được (lưới và dải băng) và một vế tiêu điểm.

**Trạng thái xấu phải tránh dựng lại:** bốn lỗi của vòng 1 — (1) chữ của A mất khi gõ vào B;
(2) chữ vừa sửa biến khỏi lưới cho tới lần tương tác sau, vì `notes` chỉ đổi khi `put` xong mà
không ai vẽ lại; (3) dải băng `TOO_LONG_KHI_SUA` không bao giờ hiện được, nên cả câu microcopy
mới là chữ chết; (4) `Tab` ra khỏi ô sửa làm tiêu điểm rơi về `<body>`.

**KEEP — những gì vòng 1 làm ĐÚNG và phải sống lại y như vậy:**
- Phép gác không-vẽ-lại đặt ở `luoi.js` (chỗ duy nhất gọi `replaceChildren`) và so theo `id` đọc
  từ thuộc tính `data-sua` của ô đang có trong DOM — **không** so theo "có đang sửa gì không"
  (chặn luôn lượt vẽ mở ô sửa của mẩu thứ hai) và **không** giữ `id` trong một biến của view.
- Móc rời mang theo `id`, và `main.js` chỉ rời khi `store.state.editing.id === id`: `blur` cũng
  nổ khi phần tử bị GỠ khỏi DOM, nên lượt vẽ mở ô sửa của B phát `blur` của A ngay giữa đường.
- Lượt vẽ khi rời hoãn một nhịp (`setTimeout`, **không** `requestAnimationFrame` — bộ quét chặn):
  `blur` đi trước `mouseup`, nên vẽ ngay làm cú bấm từ A sang B rơi vào tổ tiên chung.
- Hai nhịp click tách bằng `duDaiDeCat && !dangMoRong`, và mẩu đang sửa không mang `tabindex`
  cũng không nghe `keydown` (nếu không thì `Enter` và phím cách bị ăn mất trong ô sửa).
- Câu chữ của `TOO_LONG_KHI_SUA` **cắt** từ `MICROCOPY[TOO_LONG]` chứ không chép tay, và nó vào
  đúng hàng 5 cạnh `TOO_LONG`.
- `<textarea>` nhận chữ qua `value`, không qua `textContent`.
- Ba lần renegotiate có ghi chép, giữ nguyên: mọi mẩu `tabindex="0"`
  (`test/focus-va-tab.test.js`, `tools/thu-bo-cuc.mjs`), "click mẩu ngắn không đổi gì" đảo chiều
  (`test/mau-giay.test.js`), `.mau-sua` vào tập selector mang bóng vì nó dùng lại
  `--shadow-inset` (`test/bo-cuc-bon-tang.test.js`, `test/theme.test.js`).

## Review Triage Log

**Vòng 1** — ba lớp: `blind-hunter` (11 phát hiện), `edge-case-hunter` (13), `verification-gap`
(2 + 2 phụ). Mỗi hàng dưới đây là một phát hiện, kèm phán quyết và bằng chứng của phép kiểm lại.
Bốn hàng đầu được chứng minh bằng mã CHẠY THẬT (một file test tạm, đã xoá sau khi đo), không
bằng suy luận.

| # | Phát hiện | Phán quyết | Bằng chứng | Nhóm / Tuyến |
|---|---|---|---|---|
| 1 | `editing.seq` là MỘT bộ đếm dùng chung cho mọi mẩu, nên gõ vào B trong `AUTOSAVE_MS` làm hẹn ghi của A bị bỏ — chữ của A mất trong im lặng | `high` | Đo thật: `vaoCheDoSua('a')` → gõ → `roiCheDoSua()` → `vaoCheDoSua('b')` → gõ → chờ `AUTOSAVE_MS*3` ⇒ `nhatKy = ["put:b"]`, kho `a` vẫn `"a"`. Vi phạm trực tiếp AC "cả hai mẩu giữ đúng chữ của mình" và README mục 29 | G1 · **intent_gap** |
| 2 | Ca test của AC đó chỉ kiểm nửa dễ: nó rời A rồi vào B mà KHÔNG gõ vào B | `medium` | `test/core-state.test.js` ca "KHÔNG tăng editing.seq…" không có lời gọi `tuLuuNoiDung('b', …)`; thêm một dòng đó là ca đỏ ngay | G1 · **intent_gap** |
| 3 | Ma trận (khối đóng băng) nói "Gõ trong chế độ sửa → `notes[X].text` đổi NGAY trong state"; thực tế `tuLuuNoiDung` chỉ đổi `editing`, `notes` đổi SAU khi `put` xong | `medium` | Đo thật: ngay sau khi gõ, `notes.a === "a"`; chỉ sau `AUTOSAVE_MS` mới thành chữ mới. Chú thích trong `luoi.js:388` và `main.js` lặp lại đúng lời sai này | G5 · **intent_gap** |
| 4 | Không có cơ chế subscribe, nên khi `put` xong và `notes` đổi thì KHÔNG lượt vẽ nào chạy: rời chế độ sửa xong, lưới vẽ lại bằng chữ CŨ và chữ vừa sửa biến khỏi màn hình cho tới lần tương tác sau | `high` | `main.js:195` ghi rõ "Không có cơ chế subscribe"; lượt vẽ hoãn ở `roiSuaRoiVe` chạy trước khi `put` xong (đo ở hàng 3) | G2 · **bad_spec** |
| 5 | Dải băng `TOO_LONG_KHI_SUA` không bao giờ hiện được: `goSua` cố ý không vẽ lại, và ô sửa không có phím chốt nào để kéo theo một lượt vẽ | `high` | `goSua` chỉ gọi action; `view/banner.js` chỉ vẽ trong `veTatCa()`; `grep` `tools/` không có `TOO_LONG`. README mục 28 (vừa thêm) khẳng định dải băng HIỆN ra ở đúng lúc đó | G2 · **bad_spec** |
| 6 | Vượt trần lúc sửa: `tuLuuNoiDung` `return` trước khi đồng bộ `editing.text`, nên state và ô lệch nhau và chữ vừa dán mất ở lượt vẽ sau | `medium` | Đo thật: sau `tuLuuNoiDung('a', 'x'.repeat(20001))` ⇒ `banner = TOO_LONG_KHI_SUA` nhưng `editing.text` vẫn `"a"`. Cửa em sinh đôi `datBanNhap` làm NGƯỢC LẠI — nó lưu chữ vượt trần | G3 · **bad_spec** |
| 7 | `Tab` ra khỏi ô sửa: lượt vẽ hoãn `replaceChildren` cả lưới một nhịp sau, gỡ đúng phần tử vừa nhận tiêu điểm ⇒ focus rơi về `<body>` | `high` | Sau `roiCheDoSua`, `editing.id = null` nên phép gác của `luoi.js:399` không còn chặn; mọi mẩu nay `tabindex="0"` nên điểm dừng kế tiếp nằm TRONG `.luoi`. README mục 29 hứa ngược lại. `main.js` đã có tiền lệ `dongRoiVe` cho đúng lớp lỗi này | G4 · **bad_spec** |
| 8 | Mở lại chế độ sửa cùng mẩu trong `AUTOSAVE_MS` thì `editing.text` lấy chữ CŨ từ `notes` | `medium` | Đo thật: `editing.text` khi mở lại = `"a"` (chữ cũ), dù vừa gõ chữ mới | G3 · **bad_spec** |
| 9 | Bấm `thu lại ▴` trên đúng mẩu ĐANG sửa thì mẩu MỞ RỘNG thay vì thu: `blur` đã gỡ `id` khỏi `expandedIds`, rồi `batTatMoRong` bật lại | `medium` | Thứ tự sự kiện: `mousedown` → `blur` (`roiCheDoSua` gỡ khỏi `expandedIds`) → `click` trên dòng gấp → `batTatMoRong` thêm lại | G6 · **patch** |
| 10 | Con trỏ suy từ điểm bấm dùng `offset` của node chữ BẤT KỲ dưới chuột; bấm vào dòng giờ tạo cho một `offset` của `"09:05"` rồi áp vào toàn văn ghi chú | `medium` | Bộ nghe `click` nằm trên cả phần tử `.mau`, không chỉ `.mau-than`; `viTriConTroTuDiem` không kiểm node trả về thuộc `.mau-than` | G7 · **patch** |
| 11 | Ô sửa không có bộ nghe `resize`, nên đổi bề rộng cửa sổ lúc đang sửa làm chữ bị cắt (`overflow: hidden` cộng chiều cao đã ghim) | `low` | `o-soan.js:101` có đúng bộ nghe đó; `veThanSua` không có | G8 · **patch** |
| 12 | `caoTheoNoiDung` chạy khi `<textarea>` còn RỜI khỏi DOM (`replaceChildren` xảy ra sau), nên `scrollHeight` là 0 và `block-size` bị ghim `0px` ⇒ ô sửa có thể vô hình tới phím đầu tiên | `maybe-false` | Đường mã đúng như mô tả, nhưng phép đo quyết định chưa lấy được: script CDP tạm chưa chốt được ghi chú trong tab. **Cần để kết luận:** đo `getBoundingClientRect().height` và `style.blockSize` của `.mau-sua` ngay sau khi nó mở ra, trên Chrome thật | G9 · **defer** (high nếu đúng) |
| 13 | Mọi mẩu nay `tabindex="0"` nhưng không có `role` lẫn nhãn, và `<textarea class="mau-sua">` không có `aria-label` | `medium` | `grep aria-\|role=` trong `app/view/mau-giay.js` ⇒ không một kết quả nào, trong khi `index.html:91` cho ô soạn thảo một `aria-label` | G10 · **bad_spec** |
| 14 | `'mau-sua'` viết ở ba chỗ (`mau-giay.js`, `main.js`, `style.css`) mà không test nào ghim chúng lại | `low` | Đổi tên class sẽ làm `vaoSuaRoiVe` không tìm được ô (mất focus, mất con trỏ) trong khi 711 test vẫn xanh | G11 · **patch** |
| 15 | `luoi.querySelector?.(CHON_SUA) ?? null` — `?.` tắt phép gác trong im lặng nếu gốc DOM thiếu `querySelector` | `low` | `luoi.js:50` gọi `querySelector` KHÔNG có `?.`; chỉ dòng 78 có. Hậu quả nếu tắt: đúng triệu chứng "gõ ngược" mà story tồn tại để chặn | G12 · **patch** |
| 16 | Hai vế test quét mã trong `luoi.test.js` giòn: `/\bve/` chặn mọi định danh mở đầu `ve` (kể cả `version`), và `/setSelectionRange\s*\(/` chỉ chứng minh chuỗi CÓ MẶT | `low` | Đọc trực tiếp hai `expect` đó; cả hai là phép quét chuỗi, không phải phép chạy | G13 · **patch** |
| 17 | `cauTranKhiSua`: `cat + HET_CAU.trimEnd().length` chỉ là `cat + 1` viết vòng; nhánh `cat < 0` trả về NGUYÊN câu có `Ctrl+Enter` — đúng câu sai mà hàm tồn tại để tránh | `low` | Đọc hàm; `test/banner.test.js` ghim nguyên văn nên nó không ship lặng lẽ, hại chỉ ở chỗ người đọc tưởng đây là đường lui an toàn | G14 · **patch** |
| 18 | `tools/thu-bo-cuc.mjs` gọi `document.querySelector('.mau-sua').blur()` không kiểm `null` ⇒ hồi quy hiện ra như một lần NỔ của công cụ, không như một dòng `ghi(...)` đỏ | `low` | Đọc hunk; mọi phép đo khác quanh đó đều báo qua `ghi(...)` | G15 · **patch** |
| 19 | `AGENTS.md` còn nói "checklist thủ công 1–27" trong khi README nay có mục 28–29 | `low` | `AGENTS.md:8` và `AGENTS.md:30` | G16 · **defer** (file ngữ cảnh agent) |
| 20 | JSDoc của `mocSua.roi` trong `luoi.js` khai `() => void` trong khi chỗ gọi truyền `note.id` | `low` | So chữ ký JSDoc với lời gọi `roi: () => mocSua.roi?.(note.id)` | G17 · **patch** |
| 21 | `blur` rồi bấm lại vào CHÍNH mẩu đó trong khe trước lượt vẽ hoãn: ô sửa cũ còn trong DOM và phần tử `.mau` lúc đó không có bộ nghe nào | `maybe-false` | Khe đúng bằng một macrotask (`setTimeout` không hạn), nên một người thật không bấm vào được. Nếu đúng thì cũng chỉ `low` ⇒ **bác bỏ** theo luật `low` + fix phức tạp | — · bác bỏ |
| 22 | `vaoSuaRoiVe` chọn ô sửa bằng `.mau-sua` toàn tài liệu thay vì theo `data-sua`, nên có thể focus vào một ô cũ | `false` | Chỉ một mẩu có `note.id === dangSua`, và lượt vẽ ngay trước đó đã `replaceChildren` nên ô của mẩu cũ không còn. Hai ô sửa không cùng tồn tại sau một lượt vẽ | — · bác bỏ |
| 23 | `vaoSuaRoiVe` không xử ca ô sửa không tồn tại sau lượt vẽ ⇒ `editing.id` treo mà không ô nào để `blur` | `maybe-false` | Không có đường nào tới được: một cú bấm chỉ tới từ mẩu ĐANG hiển thị, và phép gác cho lượt vẽ đầu tiên luôn đi qua. Nếu đúng thì `medium` ⇒ ghi nhận chưa kiểm được | G18 · **defer** |
| 24 | `cauTranKhiSua` thiếu guard nếu `MICROCOPY[TOO_LONG]` không còn là chuỗi | `false` | `MICROCOPY` là ánh xạ chuỗi thuần trong `core/errors.js`; `microcopyLoi` mới là hàm. Ca giả định không có đường xảy ra | — · bác bỏ |

**Vòng 2** — ba lớp chạy lại trên diff đã dựng lại (`blind-hunter` 12, `edge-case-hunter` 13,
`verification-gap` 3 + 2 phụ). Hai hàng đầu lại được chứng minh bằng mã chạy thật.

| # | Phát hiện | Phán quyết | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | Nhánh vượt trần **cũng** tăng `seq` của mẩu đó, nên nó huỷ luôn hẹn ghi của lần gõ HỢP LỆ ngay trước — chữ hợp lệ không bao giờ xuống kho | `high` | Đo thật: gõ `"chu HOP LE"` rồi dán 20001 ký tự, chờ `AUTOSAVE_MS*3` ⇒ `nhatKy = []`, kho còn chữ cũ | **patch** |
| 2 | `chuDangCho.delete(id)` chạy TRƯỚC `put`, nên một lần ghi hỏng làm mất chữ vừa gõ: mở lại mẩu ra chữ cũ | `high` | Đo thật với `put` từ chối `QUOTA`: sau hẹn, `roiCheDoSua()` rồi `vaoCheDoSua('a')` ⇒ `editing.text === "a"`. Vi phạm thẳng ràng buộc đóng băng *"Ghi hỏng thì chữ vừa gõ không bị trả lại"* | **patch** |
| 3 | Docstring của `chuDangCho` nói sai ("một mục vào khi gõ và ra khi hẹn nổ"): nhánh vượt trần không đặt hẹn nào, và `xoaGhiChu` không dọn `chuDangCho`/`editing.seq` | `low` | Đọc mã; hệ quả thấy được: nạp lại một bản sao lưu mang trùng `id` sẽ mở ô sửa bằng chữ ma của mẩu đã xoá | **patch** |
| 4 | `viTriConTroTuDiem` chỉ kiểm node nằm trong `.mau-than`; node ELEMENT cho một **chỉ số con**, không phải offset ký tự, mà vẫn được dùng làm vị trí con trỏ | `medium` | Đúng lớp lỗi mà hàm tồn tại để chặn, thấp hơn một tầng | **patch** |
| 5 | `veThanSua` gắn một bộ nghe `resize` cho **mỗi** ô sửa và không bao giờ gỡ; tiền lệ `o-soan.js` gắn một lần cho một phần tử sống lâu, không phải một xưởng chạy mỗi lượt vẽ | `low` | `grep removeEventListener app/` không có kết quả nào | **patch** |
| 6 | `veGiuTieuDiem` trả tiêu điểm theo **chỉ số con**, nhưng lượt vẽ nó bọc chạy lại `locGhiChu` với `mocHienTai()` mới — lưới ngắn đi thì tiêu điểm rơi sang mẩu khác | `medium` | Đọc mã; neo theo `id` vừa đơn giản hơn vừa đúng | **patch** |
| 7 | Tên thuộc tính `data-sua` khai ba lần ở ba file, `.luoi` khai hai lần | `low` | Dự án có test quét chống trôi cho số/`Date`/màu nhưng không có cho selector — đây là chỗ bắt đầu trôi | **patch** |
| 8 | Docstring "khi có hai con số" bị bỏ rơi: khối doc mới chèn giữa nó và `export const MICROCOPY_BANG`, nên nó đọc như doc của `const HET_CAU` | `low` | Đọc mã | **patch** |
| 9 | `tools/thu-bo-cuc.mjs` **đo** `conTro` (`selectionStart`) nhưng không đưa vào vị từ `ghi(...)`, nên con trỏ luôn nhảy về cuối vẫn PASS | `medium` | Phép đo đã có sẵn, chỉ thiếu phép khẳng định — đây là lời hứa đầu bảng của story mà không tầng nào canh | **patch** |
| 10 | Không gì khẳng định ô sửa **cao lên khi gõ**: xoá `caoTheoNoiDungSua(oSua)` khỏi bộ nghe `input` thì mọi test vẫn xanh, còn trên trình duyệt `overflow: hidden` cắt từng dòng mới | `medium` | Ca hiện có chỉ khẳng định nhật ký `go`; phần tử giả có `scrollHeight = 0` | **patch** |
| 11 | README mục 28–29 thiếu bước đổi bề rộng cửa sổ lúc đang sửa, và thiếu bước soát tương phản `.mau-sua` ở bảng màu tối | `low` | `theme.test.js` chỉ khẳng định token nào cấp nền, không khẳng định tỷ lệ tương phản | **patch** |
| 12 | Hai phép kiểm `null` thừa (`!== null && !== undefined`) ở `luoi.js` và `main.js` | `low` | `querySelector` không bao giờ trả `undefined`; chỉ nửa `children[i]` là thật | **patch** |
| 13 | Toàn bộ chỗ nối chế độ sửa trong `main.js` chỉ được ghim bằng **quét chuỗi mã nguồn**, không lệnh nào chạy nó | `medium` | Khối nằm sau `if (typeof document !== 'undefined')`, luôn sai dưới Vitest; dự án cố ý không có jsdom, và `thu-bo-cuc` không nằm trong `npm test` | **defer** |
| 14 | Đóng tab trong `AUTOSAVE_MS` sau phím cuối thì mất những ký tự cuối | `medium` | Đúng, nhưng là tính chất có sẵn của luồng tự lưu (bản nháp cũng vậy), không do story này gây ra | **defer** |
| 15 | Phép gác chặn lượt vẽ khi một nguồn KHÁC đổi `notes` lúc đang sửa (nạp file, tab khác) | `medium` | Đúng, và đã được ghi thành cái giá có ý thức trong spec — hoá đơn của Epic 7 | **defer** |
| 16 | Mẩu giấy vào thứ tự Tab mà không có `role`/nhãn cho trình đọc màn hình | `medium` | Đã ghi vào `deferred-work.md` ở vòng 1 — `carried`, không xử lại | **defer** |
| 17 | Không có `Escape` để thoát chế độ sửa | `false` | Sản phẩm cố ý chỉ có bốn phím (ghi trong mã và trong EXPERIENCE); "focus rời mẩu thì thoát" phủ cả chuột lẫn `Tab` theo đúng ý định | bác bỏ |
| 18 | `vaoSuaRoiVe` chọn ô sửa bằng `[data-sua]` toàn tài liệu, có thể focus nhầm ô cũ | `false` | `carried` từ vòng 1: chỉ một mẩu mang `note.id === dangSua`, và lượt vẽ ngay trước đã thay hết con | bác bỏ |
| 19 | Lưới không hiện chữ mới đúng lúc `put` xong khi vẫn đang sửa (phép gác chặn) | `false` | Lúc đó chữ mới đang nằm trong chính `<textarea>` trước mắt người dùng; sau khi rời, lời hứa của `go` kéo theo lượt vẽ. Không có hậu quả xấu nào xảy ra | bác bỏ |
| 20 | Con trỏ có thể lệch khi mở lại một mẩu có chữ đang chờ dài/ngắn hơn chữ tĩnh vừa hiển thị | `low` | Có thật nhưng đã bị kẹp về `value.length`; lệch tối đa trong một mẩu người dùng vừa gõ | **patch** |

**Đã vá (vòng 2).** 12 hàng `patch` đều đã sửa và kiểm lại: `npm test` 730/730, `npm run
thu-bo-cuc` 77/77, `npm run thu-tay` 18/18. Đáng ghi riêng — phép đo con trỏ trong
`thu-bo-cuc` trước đó **không chứng minh được gì**: nó phát `MouseEvent` ở toạ độ 0/0 nên con
trỏ luôn rơi về đường lui cuối chữ (`conTro = 740/740`). Sau khi phát đúng toạ độ tâm và đưa
`conTro` vào vị từ, phép đo đọc `conTro = 64/740` — lời hứa đầu bảng của story giờ mới thực sự
có người canh.

**Kết luận vòng 2.** Không có hàng `intent_gap` hay `bad_spec` — spec lần này đủ rõ, và hai lỗi
`high` đều là sai sót triển khai có bản vá nhỏ gọn. Nên không loopback: 12 hàng đi đường `patch`,
4 hàng `defer`, 3 hàng bị bác bỏ, 1 hàng `carried` từ vòng 1.

**Kết luận vòng 1.** Có hai hàng `intent_gap` (G1, G5) ⇒ theo thứ tự thác đổ, chúng kích hoạt
loopback và mọi hàng dưới trở thành moot vì code sẽ được dựng lại. `review_loop_iteration` tăng
lên `1`. Gốc của cả hai nằm TRONG `<frozen-after-approval>`, nên chúng phải được người quyết:

- **G1** — khối đóng băng ghim "`seq` giữ nguyên hình dạng đang có: hai bộ đếm tách biệt" **và**
  "Không đưa `clearTimeout` vào", nhưng AC lại đòi "đang sửa A, click sang B → cả hai mẩu giữ
  đúng chữ của mình". Với MỘT bộ đếm dùng chung và không có phép flush, hai vế đó không thể cùng
  đúng. Mở được bằng `seq` theo từng `id`, hoặc flush hẹn của A lúc rời — cả hai đều đổi hình
  dạng đã ghim.
- **G5** — ma trận mô tả sai hành vi lõi có sẵn (`notes` KHÔNG đổi mỗi phím).

## Design Notes

**Điểm chịu lực của story là vòng vẽ lại, không phải chế độ sửa.** `tuLuuNoiDung` đổi `state.notes`
ở mỗi phím. Nếu `main.js` nối phím gõ vào `veTatCa()` như mọi tương tác khác, `replaceChildren`
trong `luoi.js` sẽ dựng lại mẩu giấy sau từng ký tự, `<textarea>` bị thay bằng phần tử mới và con
trỏ về đầu — triệu chứng sẽ là "gõ ngược". Hai đường đi được, chọn đường nào cũng phải ghi lại lý
do trong Implementation Notes:

1. **Không vẽ lại khi gõ** — listener `input` chỉ gọi `store.tuLuuNoiDung(...)`, không gọi `ve()`.
   Đơn giản nhất, và đúng với tinh thần `o-soan.js`.
2. **Vẽ lại có so sánh** — `ve()` giữ nguyên phần tử đang sửa, chỉ gán lại `value` khi lệch, theo
   đúng `dongBoTuState` trong `o-soan.js`.

Đường 1 gọn hơn nhưng để lại một cái bẫy: khi một nguồn khác đổi `notes` (nạp file, tab khác ở
Epic 7) trong lúc đang sửa, lưới sẽ cũ. Đường 2 trả giá bằng phức tạp nhưng sống được tới Epic 7.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh, kể cả các test quét mã nguồn (`nguong-tap-trung`,
  `state-tap-trung`, `token-style`, `chuyen-dong-va-tin-hieu`, `focus-va-tab`).
- `npm run thu-tay` -- expected: kịch bản bản nháp cũ không vỡ vì mẩu giấy nay có `tabindex`.
- `npm run thu-bo-cuc` -- expected: bố cục bốn tầng không đổi, **cộng bốn phép đo mới đều xanh**:
  ô sửa lúc vừa mở có chiều cao > 0 và khít nội dung; `Tab` ra khỏi ô sửa để tiêu điểm ở một phần
  tử khác `<body>`; dán quá trần thì `.dai-bang-chu` đọc đúng câu không có `Ctrl+Enter`; và sau
  khi hẹn ghi nổ thì thân mẩu trên lưới đọc đúng chữ mới mà không cần tương tác thêm.

**Manual checks (if no CLI):**
- Phục vụ qua HTTP localhost, không `file://`. Mẩu dài: click 1 chỉ mở rộng, click 2 mới vào sửa.
  Mẩu ngắn: click 1 vào sửa luôn. Click vào giữa một từ — con trỏ phải nằm đúng chỗ click.
- Gõ liên tục vài chục ký tự: chữ không nhảy ngược, mẩu không đổi vị trí, giờ hiển thị không đổi.
- `Tab` một vòng toàn trang ở cả hai theme: mọi mẩu là một điểm dừng, thứ tự vẫn bám DOM.
