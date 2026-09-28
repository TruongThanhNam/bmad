---
title: 'Story 5.3: Xóa qua hộp thoại xác nhận'
type: 'feature'
created: '2026-09-22'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '9071865fcb8a7240cb3e5aae0f87c6d24105c917'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nút `xóa` trên mỗi mẩu tới nay chỉ là HÌNH DẠNG (`mau-giay.js:283-296`: một
`<button tabindex="-1">` chặn nổi bọt, không phát action nào). Không có đường xóa một ghi chú đã
chốt, trừ mẹo xóa sạch chữ rồi rời mẩu (Story 5.2). Sản phẩm không có hoàn tác và không có thùng
rác, nên đường xóa thật phải đi qua đúng một bước xác nhận.

**Approach:** Nút `xóa` phát action mở hộp thoại xác nhận — modal duy nhất của sản phẩm, sâu một
tầng, vẽ bởi view thứ SÁU (`app/view/hop-thoai.js`) từ đúng một trường state mới
(`xacNhanXoa: string|null`, tầng C, mất sau tải lại). Chọn `xóa` gọi `xoaGhiChu` đã có nguyên vẹn;
`hủy`, `Esc`, click overlay đều là hủy.

## Boundaries & Constraints

**Always:**
- Trạng thái hộp thoại là state: `xacNhanXoa` trong `stateRong()`, hai action `moXacNhanXoa(id)` /
  `dongXacNhanXoa()`. View chỉ đọc state và phát action (`test/state-tap-trung.test.js` cưỡng chế).
- `xoaGhiChu(id)` dùng lại **nguyên vẹn**: nó đã đi `ghiTruocDatSau` và đã dọn `chuDangCho`,
  `editing.seq[id]`, `expandedIds` trong một `datLai` — đó chính là vế "hủy hẹn tự lưu đang treo
  trước khi làm gì khác" của AC.
- Chọn `xóa`: đóng hộp thoại rồi xóa; lượt vẽ chain trên promise của `xoaGhiChu` (khuôn `mocSua.go`,
  `main.js:160`). Ghi hỏng → `notes` giữ nguyên, mẩu còn trên lưới, dải băng lên theo mã lỗi sẵn có.
- *(Ghi bổ sung ở Story 7.0 — retro Epic 5 A6, hành vi đã có từ review 5.3, không đổi.)* Nút `xóa`
  **chờ lượt rời chế độ sửa đang treo** trước khi mở hộp: `noiLuongXoa(store, goc, veTatCa,
  choRoiSua)` nhận `choRoiSua` là một HÀM trả lời hứa của lượt `roiCheDoSua()` mới nhất (hỏi lại ở
  mỗi lần bấm), và `moHoi(id)` gọi `moXacNhanXoa` trong `.then` của nó. Lý do: `blur` của ô sửa chạy
  trước `click` của nút, nhưng `roiCheDoSua()` bất đồng bộ — với ô sửa rỗng (Story 5.2) mẩu đang trên
  đường bị xóa mà `notes` còn nó, nên mở hộp ngay là hộp NHÁY MỞ rồi tự đóng. Không có lượt treo thì
  lời hứa đã chốt và độ trễ là một microtask.
- Giam focus trong hộp: `Tab`/`Shift+Tab` vòng giữa đúng hai nút; mở thì focus vào `hủy`; đóng bằng
  bất kỳ đường nào thì `main.js` trả focus về `.mau-xoa` của mẩu vừa bấm, đường lui `#o-soan`
  (khuôn `dongRoiVe`). View không biết lưới.
- `Esc` chỉ có tác dụng khi hộp đang mở, và chỉ nghĩa là hủy.
- Gỡ `tabindex="-1"` khỏi `.mau-xoa`: thứ tự Tab mỗi mẩu là thân rồi nút xóa, đúng thứ tự DOM.
- Token mới ở **cả hai** khối của `app/style.css`, và ghi vào `DESIGN.md` trước khi ghim vào test:
  `--overlay` `rgba(0,0,0,.32)` / dark `rgba(0,0,0,.55)`; `--shadow-dialog`
  `0 12px 32px rgba(60,48,28,.24)` / dark `0 12px 32px rgba(0,0,0,.55)` **(Nam chốt:** nền dark đã
  tối nên overlay .32 gần như không thấy, và bóng đen đậm theo đúng lệ `--shadow-paper` bản dark**)**.
- Microcopy chép đúng từng chữ: nút `xóa`; tiêu đề `Xóa ghi chú này?`; thân `Không có thùng rác và
  không hoàn tác được.`; hai lựa chọn `hủy` · `xóa`.
- Hộp thoại ngoài `<main>`, sau `<footer>`, chỉ có trong DOM khi đang mở — thứ tự bốn tầng không đổi.

**Never:**
- Không `<dialog>`/`showModal` native: `::backdrop` không nhận token theo cùng đường và hành vi
  focus/Esc của nó nằm ngoài tầm test DOM tối giản hiện có. Dựng bằng `<div>` như năm view kia.
- Không animation/`transition`/`:hover`/`pointerdown` — bộ quét chặn. Mẩu biến mất đột ngột.
- Không xóa hàng loạt, không chọn nhiều mẩu, không phím tắt xóa, không menu ngữ cảnh.
- Không mã lỗi mới, không loại dải băng mới, không dải băng khi xóa thành công.
- Không hằng số mới trong `core/limits.js` ngoài bump `APP_VERSION`.
- Không đụng `xoaGhiChu`, `roiCheDoSua`, `ports/`, `adapters/`, `core/time.js`, `core/fold.js`,
  `core/errors.js`, `core/banner.js`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Click `xóa` trên một mẩu | `xacNhanXoa = null` | `xacNhanXoa = id`; hộp hiện, overlay phủ, focus ở `hủy`; mẩu không mở/thu | N/A |
| Chọn `xóa` | `xacNhanXoa = X` | Hộp đóng, `X` biến khỏi `notes` và khỏi lưới ngay, không animation, không dải băng | N/A |
| Chọn `xóa` nhưng ghi bị từ chối | `remove` ném `QUOTA`/`DB` | Hộp vẫn đóng, mẩu **còn nguyên**, dải băng lỗi theo bảng ưu tiên | qua `maBanner` |
| `hủy` / `Esc` / click overlay | `xacNhanXoa = X` | `xacNhanXoa = null`, không ghi gì, focus về đúng nút `xóa` của X | N/A |
| `Tab`/`Shift+Tab` khi hộp mở | focus ở `hủy` hay `xóa` | Vòng giữa đúng hai nút, không thoát ra nền | N/A |
| `Esc` khi không có hộp nào mở | `xacNhanXoa = null` | Không tác dụng gì | N/A |
| Click `xóa` trên mẩu ĐANG sửa | `editing.id = X` | `blur` chạy trước: chữ còn → hộp mở cho X; chữ rỗng → X đã tự biến mất, hộp **không** mở | N/A |
| Mẩu chờ xác nhận biến mất khỏi `notes` | `notes[X]` không còn | Hộp đóng ở lượt vẽ kế; chọn `xóa` thì `xoaGhiChu` trả `Promise.resolve()`, không chạm cổng | N/A |
| `moXacNhanXoa` với `id` không phải chuỗi | — | Ném `TypeError`, khuôn `xoaGhiChu` | ném |

</frozen-after-approval>

## Code Map

- `app/core/state.js:189-247` (`stateRong`) -- thêm `xacNhanXoa: null`; không bền, không vào sao lưu.
- `app/core/state.js:1080-1104` (`xoaGhiChu`) -- dùng lại nguyên vẹn, KHÔNG sửa.
- `app/core/state.js:1341-1360` (bảng export `Object.freeze`) -- thêm hai action mới; mỗi cái chỉ
  `datLai` một trường, đồng bộ, không chạm cổng — khuôn `batTatMoRong`.
- `app/view/mau-giay.js:67-99, 283-296` -- gỡ `setAttribute(THUOC_TINH_TAB, TAB_KHONG)` trên nút xóa;
  giữ `stopPropagation`, thêm `khiXoa?.(note.id)` trong cùng listener; export mệnh đề chọn nút xóa
  (tiền lệ `CHON_SUA`). Móc mới đứng sau `khiGap` trong chữ ký `veMau`.
- `app/view/luoi.js:52-116` -- chuyển móc xóa xuống `veMau`, khuôn `mocSua.vao`; vắng móc thì lưới
  vẫn vẽ được (đường của test bố cục).
- `app/view/hop-thoai.js` -- **mới**: `noiHopThoai(store, goc, sauKhiDong, sauKhiXoa)` → `{ ve }`.
  Vẽ/gỡ từ `xacNhanXoa`; `keydown` (Esc + giam Tab) trên hộp, click trên overlay. Không import view
  khác, không chạm cổng, không `new Date`, không tự soạn câu lỗi (`luoi.test.js:542`).
- `app/main.js:~153-215` -- view thứ sáu vào `veTatCa`; `xoaRoiVe(id)` = `dongXacNhanXoa()` rồi
  `xoaGhiChu(id).then(veTatCa)`; `dongHopThoaiRoiVe(id)` vẽ lại rồi trả focus; móc `xoa` vào `noiLuoi`.
- `index.html:141-183` -- chỗ gắn hộp thoại sau `<footer>`.
- `app/style.css:47-58, 115-128` (token), `:195-201` (danh sách selector focus ring) -- class mới
  `.hop-thoai-nen`, `.hop-thoai`, `.hop-thoai-tieu-de`, `.hop-thoai-than`, `.hop-thoai-chon`,
  `.hop-thoai-xoa` (`var(--danger)`), dùng `--surface`, `--radius-tray`.
- `DESIGN.md` (`planning-artifacts/ux-designs/…`) -- frontmatter `confirm-dialog` + mục *Elevation &
  Depth*: bổ sung giá trị dark; bộ quét lấy DESIGN.md làm nguồn sự thật.
- **Bộ quét phải nâng (chúng ghim chủ ý "hoãn sang Epic 5", nâng chứ không nới):**
  `test/token-style.test.js:113-151, 269-281` (`BONG`/`BONG_DARK` + `--overlay`, câu chữ "12 màu
  cộng HAI token bóng"); `test/bo-cuc-bon-tang.test.js:186-200` (`TOKEN_BONG` → `inset|paper|dialog`);
  `test/chuyen-dong-va-tin-hieu.test.js:279-292` (bảng `DUNG_DANGER` đang RỖNG, ca test đòi mục
  không rỗng); `test/focus-va-tab.test.js:21, 391, 420, 569-604` (ca "QĐ-1 `.mau-xoa` còn
  `tabindex=-1`" đổi chiều, thêm ca thứ tự Tab và giam focus); `test/mau-giay.test.js:307-326`.
- `test/hop-thoai.test.js` -- **mới**: các hàng I/O Matrix thuộc view. `test/core-state.test.js` --
  describe cho hai action mới (gồm ca `TypeError`) và ca phối hợp `xoaGhiChu` khi ghi bị từ chối.
- `README.md:545` -- mục checklist thủ công **31**. `app/core/limits.js:82` -- `APP_VERSION` `'0.3.0'`
  → `'0.4.0'`.
- **Không đổi:** `app/ports/`, `app/adapters/`, `core/time.js`, `core/fold.js`, `core/errors.js`,
  `core/banner.js`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/state.js` -- `xacNhanXoa` + `moXacNhanXoa`/`dongXacNhanXoa` -- mọi phép đổi state
      chỉ ở đây.
- [x] `app/view/mau-giay.js` + `app/view/luoi.js` -- gỡ `tabindex="-1"`, nối móc xóa xuống `veMau` --
      đây là đường xóa duy nhất nên nó phải tới được bằng bàn phím.
- [x] `app/view/hop-thoai.js` -- view mới: microcopy đã chốt, focus mặc định `hủy`, giam `Tab`,
      `Esc`/overlay = hủy.
- [x] `app/main.js` -- nối view thứ sáu, chain lượt vẽ trên promise của `xoaGhiChu`, trả focus về
      nút xóa vừa bấm -- chỉ file này biết cả sáu view và biết chỗ trả focus.
- [x] `index.html`, `app/style.css`, `DESIGN.md` -- chỗ gắn, hai token mới ở cả hai khối, class dùng
      token, `--danger` cho lựa chọn xóa.
- [x] `test/token-style`, `bo-cuc-bon-tang`, `chuyen-dong-va-tin-hieu`, `focus-va-tab`, `mau-giay` --
      nâng các bộ quét đang ghim con số/hằng cũ.
- [x] `test/hop-thoai.test.js` + `test/core-state.test.js` -- ca cho mọi hàng I/O Matrix.
- [x] `README.md` -- mục 31: luồng xóa qua hộp thoại, gồm `Esc`, click overlay, trả focus, và ca ép
      lỗi `QUOTA` qua DevTools (tiền lệ mục 5).
- [x] `app/core/limits.js` -- bump `APP_VERSION` sang `'0.4.0'` -- luật deploy.

**Acceptance Criteria:**
- Given một mẩu bất kỳ, when nhìn vào hay đi tới bằng `Tab`, then nút `xóa` luôn hiện (không
  hover-only), đứng sau thân mẩu trong thứ tự Tab, focus ring nhìn thấy được.
- Given hộp thoại đang mở, when không làm gì, then nền phủ overlay bằng token, hộp căn giữa cả hai
  chiều, và bóng của nó là `box-shadow` sâu duy nhất trong toàn bộ `style.css`.
- Given ghi chú vừa bị xóa, when nạp lại một file sao lưu cũ có chứa nó, then nó sống lại — ràng
  buộc đã chấp nhận, không sửa.

### Review Findings

Code review 2026-09-24 trên `9071865..f14fcf0` — bốn lớp: `blind-hunter`, `edge-case-hunter`,
`verification-gap`, `acceptance-auditor`.

- [x] [Review][Patch] Nối dây của hộp thoại trong `main.js` chỉ được kiểm bằng regex trên mã nguồn — tách `traTieuDiemVeNutXoa`, `dongHopThoaiRoiVe`, `xoaRoiVe` và móc `xoa` thành một factory thuần (nhận `store`, gốc DOM, `veTatCa`) và test nó bằng gốc DOM giả, khẳng định tiêu điểm rơi đúng phần tử ở từng nhánh (Nam chốt 2026-09-24) [app/main.js:198-269]
- [x] [Review][Patch] `xoaRoiVe` không vẽ lại ngay sau `dongXacNhanXoa()`: hộp thoại còn trong DOM tới khi `xoaGhiChu` chốt, nên bấm `xóa` hai lần gọi `remove` hai lần, và bấm `hủy`/`Esc` trong khe đó cho người dùng thấy "đã hủy" rồi mẩu vẫn biến mất [app/main.js:263]
- [x] [Review][Patch] Bộ nghe `mousedown` giữ tiêu điểm nằm trên `hop`, không trên `nen`: nhấn chuột trên vùng mờ đẩy tiêu điểm về `<body>`, và một cú kéo bắt đầu từ vùng mờ mà nhả ngoài nó thì không có `click` — hộp còn mở mà `Esc`/`Tab` đã chết [app/view/hop-thoai.js:219]
- [x] [Review][Patch] Tiêu đề describe vẫn ghi "(d) hai quyết định của story" dù nay ghim thêm phép giam tiêu điểm của hộp thoại [test/focus-va-tab.test.js:575]
- [x] [Review][Defer] Bấm `xóa` trên mẩu ĐANG sửa có thể mất cú bấm đầu: `blur` → `roiCheDoSua().then(setTimeout(veGiuTieuDiem))` dựng lại lưới sau vài ms, trong khi một cú bấm người thật cách `mousedown`→`mouseup` cỡ 50–100ms, nên nút bị thay trước khi `click` tới [app/main.js:198] — deferred: maybe-false, nếu đúng thì `medium`. Cùng cơ chế với cú bấm mẩu A → mẩu B của Story 5.1 (có trước story này). Kiểm bằng trình duyệt thật với độ trễ `mousedown`→`mouseup` ~100ms; CDP của `thu-bo-cuc` phát hai sự kiện sát nhau nên không bắt được.

**Đã vá** (2026-09-24): `noiLuongXoa` export từ `app/main.js` và có năm ca hành vi chạy thật trên
gốc DOM giả; lượt vẽ ngay trong `xoa`; bộ nghe `mousedown` chuyển sang `nen`; tiêu đề describe.
Kiểm đột biến: đảo thứ tự vẽ/trả tiêu điểm ở `huy`, bỏ lượt vẽ ngay ở `xoa`, bỏ phép đợi lượt rời
ở `moHoi`, và gắn `mousedown` lại lên `hop` — mỗi đột biến làm đỏ đúng một ca. `npm test` 789/789,
`thu-bo-cuc` 77/77, `thu-tay` 18/18.

**Rejected**

- `false` — `moXacNhanXoa` không gác `readOnly`: `readOnly` mới chỉ được khai, không action nào đọc nó hôm nay (AD-21 nối ở Epic 7).
- `false` — `luotRoiSua`/`xoaRoiVe` thiếu `.catch`: `roiCheDoSua` và `xoaGhiChu` cam kết không bao giờ bị từ chối (cùng phán quyết Story 5.2 #6).
- `false` — không có test bấm `Space`/`Enter` trên `.mau-xoa`: `test/mau-giay.test.js:350` phát cả hai phím trên nút.
- `false` — cặp `--danger` trên `--surface` không được đo: `test/theme.test.js` khai `.hop-thoai-xoa` → `--surface` trong `NEN_CUA`, nên bộ đo tương phản tính nó ở cả hai theme.
- `false` — xóa xong tiêu điểm về ô soạn thảo thay vì mẩu bên cạnh: đúng đường lui `#o-soan` mà spec chốt.
- `false` — `xoaRoiVe` trả tiêu điểm cả sau khi xóa thành công: khớp "đóng bằng bất kỳ đường nào" của spec, đã ghi ở Implementation Notes.
- `low` — `xacNhanXoa` còn giữ `id` sau khi hộp tự ẩn (gồm cả đường xóa mẩu rỗng lúc đang sửa), nên nạp lại một sao lưu chứa đúng mẩu đó thì hộp tự mở: đòi đúng chuỗi đó mới gặp, và sửa là thêm một nhánh dọn state (cùng kết luận #9 của vòng trước).
- `low` — phần còn lại của trang không `inert`/`aria-hidden` khi hộp mở: EXPERIENCE chỉ đòi giam `Tab`; `inert` cho `<main>` + `<footer>` là bề mặt mới (cùng #12).
- `low` — `.hop-thoai-nen` không có `z-index`: cả `style.css` chưa có `z-index` nào và hộp là phần tử cuối DOM (cùng #11).
- `low` — README không nhắc việc bump `APP_VERSION` đẩy tab cũ vào chế độ chỉ đọc: quy trình có sẵn từ trước, không riêng story này.
- `low` — thứ tự Tab ngược ở mẩu ĐANG sửa (nút xóa trước `<textarea>`): hiếm, và sửa đòi đảo bố cục đầu mẩu (cùng #8).

## Implementation Notes

**Đo thật:** `npm test` 783/783 xanh, `npm run thu-bo-cuc` 77/77, `npm run thu-tay` 18/18.

Ba bộ quét ngoài Code Map cũng phải nâng vì chúng ghim con số cũ: `test/theme.test.js` (12→13
token màu dark, bốn mục `NEN_CUA` mới), `test/luoi.test.js` (`veTatCa` nay sáu `ve()`), và
`tools/thu-bo-cuc.mjs` (`THU_TU` xen `button.mau-xoa` giữa các mẩu; `.mau-xoa` vào
`CHON_DIEU_KHIEN` để vòng sáng của nó được đo thật).

Ba việc mà spec không lường trước, phát hiện ở vòng review và đã sửa: bộ nghe `keydown` của thẻ
mẩu phải bỏ qua phím bắt nguồn từ nút `xóa` (nếu không, `Enter` làm hai việc và `Space` không mở
được hộp); hộp thoại phải giữ tiêu điểm khi cú bấm không trúng hai nút (`mousedown` +
`preventDefault`, không `pointerdown`); và móc `xoa` của lưới phải đợi lượt rời chế độ sửa đang
treo, nếu không hộp nháy mở cho một mẩu đang trên đường bị xóa.

- `.hop-thoai-chon` và `.hop-thoai-xoa` là hai class RIÊNG (không một class chung cộng một class
  phụ), và đó là một ràng buộc của bộ quét chứ không phải thẩm mỹ: `focusableDoViewDung` của
  `test/focus-va-tab.test.js` nối `const x = …createElement(T)` với `x.className = L` và chỉ giải
  được một HẰNG — một `className` nhận template literal hay tham số thì cửa "mọi điều khiển đều
  có vòng sáng" bỏ lọt trong im lặng. Cùng lý do, hai nút được dựng tường minh trong `ve()` và
  một hàm `nutXong(nut, …)` nhận phần tử ĐÃ dựng thay vì tự dựng lấy (tiền lệ `veThanSua`).
- Phép giam `Tab` đọc `suKien.target` chứ KHÔNG đọc `activeElement`: một phép đọc `activeElement`
  là một phép chạm `document`, thứ luật tầng view cấm — và `Tab` bao giờ cũng phát từ đúng phần
  tử đang giữ tiêu điểm, nên `target` đã trả lời câu hỏi đó rồi.
- `view/hop-thoai.js` KHÔNG gọi `dongXacNhanXoa`: nó chỉ phát hai móc. Phép đóng state đi kèm một
  lượt vẽ và một phép trả tiêu điểm, hai việc mà chỉ `main.js` được làm cả hai.
- Ba bộ quét PHẢI nâng thêm ngoài danh sách của Code Map, và cả ba vì cùng một lý do (chúng ghim
  con số cũ):
  - `test/theme.test.js` — "bản dark ghi đè đúng 12 token màu" → 13 (`--overlay` là token MÀU dù
    giá trị là `rgba()`), cộng bốn mục `NEN_CUA` cho ba dòng chữ và nút `xóa` của hộp (`--surface`).
  - `test/luoi.test.js` — `veTatCa` nay gọi SÁU `ve()`, không năm.
  - `tools/thu-bo-cuc.mjs` — `THU_TU` (dãy Tab nghiệm thu) nay xen `button.mau-xoa` sau mỗi
    `div.o-luoi`, và `.mau-xoa` vào `CHON_DIEU_KHIEN` nên vòng sáng của nó được ĐO thật ở cả hai
    theme (≥ 3:1) thay vì chỉ được khai trong CSS.
- Cặp `--danger` trên `--surface` (chữ `xóa` của hộp) đạt ngưỡng ở cả hai bảng màu, đo từ chính
  hai khối token: `npm run thu-bo-cuc` báo thấp nhất 4.92:1 (light) và 5.61:1 (dark) trên mọi
  phần tử mang chữ. Nó KHÔNG thừa hưởng khoản nợ 4.55 của cặp `--danger` trên `--chip-bg`.
- Sau khi chọn `xóa`, tiêu điểm cũng được trả về (`traTieuDiemVeNutXoa`) — mẩu đã biến mất nên nó
  rơi về đường lui `#o-soan`. Spec chỉ đòi vế này ở ba đường hủy; để tiêu điểm rơi về `<body>`
  sau một lần xóa là cùng một chỗ đứt của bàn phím, nên nó đi cùng một đường.

## Spec Change Log

## Review Triage Log

**Vòng 1** — ba lớp: `blind-hunter` (12 phát hiện), `edge-case-hunter` (10), `verification-gap` (1 + 2 phụ).

| # | Phát hiện | Phán quyết | Bằng chứng | Tuyến |
|---|---|---|---|---|
| 1 | `Enter`/`Space` trên `.mau-xoa` nổi bọt lên `keydown` của mẩu: mẩu vào chế độ sửa, và `preventDefault` của mẩu còn nuốt luôn phép kích hoạt mặc định nên `Space` KHÔNG mở được hộp thoại | `high` | `mau-giay.js:355-359` — bộ nghe `keydown` trên `mau` không kiểm `target`; nút xóa là con của mẩu. Story này vừa đưa nút vào thứ tự Tab, nên đường bàn phím mới mở ra đã hỏng ngay | **patch** |
| 2 | Bấm chuột vào vùng chữ trong hộp làm tiêu điểm rời hai nút về `<body>`; từ đó `Esc` chết và `Tab` không bị chặn (cả hai bộ nghe sống trên `hop`) | `medium` | `hop-thoai.js` chỉ `stopPropagation` trên `click` của hộp — nó giữ hộp mở nhưng không giữ tiêu điểm. Ca "click trong thân hộp" chỉ khẳng định không móc nào chạy, không khẳng định tiêu điểm còn | **patch** |
| 3 | Móc `xoa` của lưới không đợi lượt rời chế độ sửa: với mẩu đang sửa đã xóa sạch chữ, `moXacNhanXoa` chạy trước khi `xoaGhiChu` (bất đồng bộ) xong, nên hộp NHÁY MỞ rồi tự đóng — trái hàng I/O Matrix "hộp KHÔNG mở" | `medium` | `main.js:182-186` gọi `moXacNhanXoa` + `veTatCa` ngay; `roiSuaRoiVe` mới chỉ gọi `roiCheDoSua()` và chưa chốt. Hai ca test mới dùng `await` thủ công nên chúng không đi qua thứ tự thật | **patch** |
| 4 | `dongHopThoaiRoiVe` không bị ghim THỨ TỰ: đảo `traTieuDiemVeNutXoa` lên trước `veTatCa` thì tiêu điểm đặt lên nút của lưới CŨ rồi `replaceChildren` gỡ nó — ba regex vẫn khớp, suite vẫn xanh | `medium` | `test/hop-thoai.test.js` ca "main.js nối view THỨ SÁU" so thứ tự cho `xoaRoiVe` nhưng không cho nhánh đóng | **patch** |
| 5 | Hộp thoại không có `aria-describedby`: dòng hậu quả `Không có thùng rác và không hoàn tác được.` không vào phần được đọc lên | `low` | Chỉ `aria-labelledby` trỏ tiêu đề. Sửa là một `setAttribute` — đúng nghĩa sửa thẳng, không thêm nhánh | **patch** |
| 6 | Không gác `readOnly` ở `moXacNhanXoa`: tab chỉ đọc vẫn mở được hộp xóa | `false` | `readOnly` mới chỉ được KHAI (`state.js:251`) và không action nào hôm nay đọc nó — AD-21 nối ở Epic 7. Một phép gác cho một cờ chưa ai bật là một nhánh không ai đi qua | bác bỏ |
| 7 | `main.js` không có `.catch` cho `xoaGhiChu` | `false` | JSDoc của `xoaGhiChu` cam kết "KHÔNG bao giờ bị từ chối"; cùng phán quyết đã ghi ở Story 5.2 (#6) | bác bỏ |
| 8 | Mẩu ĐANG SỬA cho thứ tự Tab ngược (nút xóa trước `<textarea>`) vì mẩu mất `tabindex` còn `dau` đứng trước `than` | `low` | Đúng theo DOM, nhưng tới được chỗ đó đòi `Tab` vào một mẩu đang sửa từ trên xuống, trong khi `blur` thoát chế độ sửa ngay khi tiêu điểm rời ô. Sửa đòi đảo bố cục đầu mẩu (giờ tạo + nút) — không phải sửa nhỏ | bác bỏ (low + hiếm + fix không nhỏ) |
| 9 | Hộp tự đóng vì mẩu biến khỏi `notes` nhưng `xacNhanXoa` vẫn giữ `id`; nạp sao lưu có lại `id` đó thì hộp tự mở lại | `low` | Thật, nhưng đòi đúng chuỗi mở hộp → mẩu biến mất → nạp file cũ chứa đúng nó. Sửa là thêm một nhánh dọn state trong `main.js` cho một ca chưa ai gặp | bác bỏ |
| 10 | Kéo chọn chữ trong hộp rồi nhả chuột ngoài hộp thì hộp đóng | `low` | Đúng theo ngữ nghĩa `click`, và kết quả là HỦY — đường an toàn. Sửa đòi theo dõi `mousedown`/`click` thành cặp | bác bỏ |
| 11 | Không `z-index` trên `.hop-thoai-nen` | `low` | Hôm nay cả `style.css` không có một `z-index` nào và hộp là phần tử cuối DOM, nên nó đang nổi trên đúng như cần. Rủi ro là giả định về mã tương lai | bác bỏ |
| 12 | Nút `xóa` không có nhãn phân biệt giữa các mẩu (nhiều nút cùng tên `xóa`) và phần còn lại của trang không `inert`/`aria-hidden` khi hộp mở | `low` | Microcopy nút nằm trong khối đã chốt; trình đọc màn hình đọc nút trong ngữ cảnh mẩu của nó. `inert` cho cả `<main>` + `<footer>` là một bề mặt mới mà spec không nói và EXPERIENCE chỉ đòi giam `Tab` | bác bỏ (low + fix không nhỏ) |
| 13 | `veMau` nay bảy tham số vị trí | `false` | Một góp ý về hình dạng API, không có hậu quả nào được nêu. Đổi sang object đụng mọi chỗ gọi và mọi bộ quét đang đọc chữ ký | bác bỏ |
| 14 | `traTieuDiemVeNutXoa` có nhánh `nut !== undefined` không bao giờ đi qua | `low` | `querySelector` trả `null`, không `undefined`. Nhưng cùng khuôn phòng thủ đã có ở `veGiuTieuDiem` — gỡ nó là một thay đổi không có người hưởng | bác bỏ |
| 15 | `veGiuTieuDiem` đẩy tiêu điểm từ nút `xóa` về thẻ mẩu bọc ngoài sau khi `Tab` ra khỏi ô sửa | `low` | Thật (nút xóa nay focus được), nhưng kết quả là tiêu điểm nằm trên đúng mẩu đó rồi `Tab` tiếp lại vào nút của chính nó — một nhịp thừa, không đứt đường bàn phím | bác bỏ |
| 16 | Phạm vi checklist thủ công trong `AGENTS.md` ("1–29") đã cũ | `low` | Đúng, và nó đã cũ từ trước story này (mục 30 của Story 5.2). Sửa file ngữ cảnh cho agent | **defer** |

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh, gồm các bộ quét vừa nâng.
- `npm run thu-bo-cuc` -- expected: phép đo lưới/focus hiện có không vỡ.
- `npm run thu-tay` -- expected: mục checklist 31 chạy được bằng tay.

**Manual checks (if no CLI):**
- Phục vụ qua HTTP localhost. Bấm `xóa`: hộp mở, focus ở `hủy`; `Enter` ngay = hủy, không mất gì.
  `Tab` vài lần — focus không thoát ra nền. `Esc` và click overlay đều hủy và trả focus về đúng nút
  `xóa`. Chọn `xóa`: mẩu biến mất ngay, không nhấp nháy, không dải băng. Lặp ở cả hai theme.
