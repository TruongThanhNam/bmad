- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-khung-du-an-chay-duoc-tren-https.md`
  summary: ~~`index.html` không có `<noscript>` hay affordance nào, nên JS tắt hoặc module nạp lỗi (kể cả trường hợp `file://` đã ghi trong README) đều ra một trang trắng im lặng.~~
  resolved: 2026-09-29 — thêm `<noscript><p class="noscript">` đầu `<body>` với câu chủ repo duyệt ("Ghi chú hàng ngày cần JavaScript để chạy. Hãy bật JavaScript cho trang này rồi tải lại."); luật `.noscript` chỉ dùng token sẵn có (`--chip-bg` + `--ink`, cùng cặp dải băng, đo đạt ở cả light và dark), khai `'.noscript': '--chip-bg'` trong `NEN_CUA` của `test/theme.test.js`. CHỦ ĐÍCH KHÔNG LÀM phần lỗi nạp module và `file://`: README đã dặn đừng mở bằng `file://`, và `<noscript>` không bắt được hai trường hợp đó. Bump `APP_VERSION` 0.7.16.
  evidence: Xác minh thật — `<main></main>` rỗng và mã chỉ vào qua `<script type="module">`. Không sửa ở Story 1.1 vì frozen Boundaries của spec nói thẳng "không UI, không thành phần giao diện, không chữ placeholder trong trang", và epic-1-context chốt Epic 1 kết thúc là chưa có gì để người dùng bấm. Affordance báo lỗi cần đi cùng UI thật và hệ token màu — mở lại ở Epic 2 (Story 2.1 dựng nền bàn) hoặc Epic 3 (Story 3.1 dải băng), nơi đã có chỗ để hiển thị một câu cho tử tế.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-hang-so-nguong-va-tap-ma-loi-dong.md`
  summary: ~~Bộ quét ngưỡng `test/nguong-tap-trung.test.js` chỉ đi `app/**/*.js`, nên `COLLAPSED_LINES = 3` có thể bị chép lại thành `-webkit-line-clamp: 3` trong `app/style.css` mà không test nào đỏ.~~
  resolved: 2026-09-29 — đã có từ Story 2.5: `test/mau-giay.test.js` ("--note-collapsed-lines bằng đúng COLLAPSED_LINES") đọc token trong `app/style.css` và so với `COLLAPSED_LINES`; `test/token-style.test.js` cũng ghim giá trị token. Không thêm test mới. Kiểm đột biến: tạm đổi token thành 4 → ca đỏ (expected 4 to be 3), rồi hoàn nguyên.
  evidence: Xác minh thật — `danhSachFileJs(appDir)` chỉ nhận `.js`, và `index.html` còn nằm ngoài `app/`. Nhưng yêu cầu chung "quét cả CSS" bị bác bỏ có chủ ý: epic-1-context giao cho `style.css` thang spacing 4/8/12/16/20/28/40px và 4 cấp bo góc dưới dạng token, đó là giá trị bố cục chứ không phải ngưỡng của AD-14 — bắt chúng vào `limits.js` là làm hỏng hệ token. Rủi ro thật thu hẹp còn đúng một điểm trùng lặp. Mở lại ở Story 2.5 (mẩu giấy cắt và mở rộng), nơi CSS thu gọn thật sự được viết: hoặc dựng chiều cao trần từ một CSS custom property sinh ra từ `COLLAPSED_LINES`, hoặc thêm một test hẹp chỉ so con số đó giữa `limits.js` và `style.css`.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-khoa-thoi-gian-sap-xep-va-loc-ngay.md`
  summary: ~~Bộ quét `test/date-tap-trung.test.js` chỉ đọc `app/**/*.js`, nên script theme nội tuyến trong `<head>` của `index.html` có thể dựng `Date` mà không test nào đỏ.~~
  resolved: 2026-09-29 — thêm `thanScriptNoiTuyen` vào `test/helpers/quet-nguon.js`; `test/date-tap-trung.test.js` nay quét thân script nội tuyến của `index.html` với cùng mẫu cấm `Date` như `app/`. Kiểm bằng cách tạm chèn vào script nội tuyến: test đỏ đúng dòng, rồi hoàn nguyên. Làm luôn cho `test/nguong-tap-trung.test.js` (rẻ).
  evidence: Xác minh thật — `danhSachFileJs(appDir)` chỉ nhận `.js` dưới `app/`, còn `index.html` nằm ở gốc repo. Phần yêu cầu chung "quét cả `.mjs`/`.cjs` và mã ngoài `app/`" bị loại: repo là `type: module`, mã sản phẩm là `.js`, không tồn tại file nào như vậy. Điểm hẹp còn lại là thật vì epic-1-context cho phép **đúng một** ngoại lệ chạm global trình duyệt — script theme đồng bộ nội tuyến — và nó nằm ngoài tầm quét. Mở lại ở Story 1.8 (hai bảng màu và theme không nháy lúc tải), nơi script đó thật sự được viết: `test/helpers/quet-nguon.js` đã có sẵn `boChuThichHtml`, nên mở rộng bộ quét sang `index.html` lúc đó là rẻ.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-bo-dau-tieng-viet-giu-nguyen-vi-tri-ky-tu.md`
  summary: ~~Bộ quét `test/fold-tap-trung.test.js` chỉ đi `app/**/*.js`, nên một bản bỏ dấu thứ hai nằm ngoài `app/` (script nội tuyến trong `index.html`, hoặc file `.mjs`/`.cjs`/`.ts` nếu sau này có) sẽ không bị bắt, dù AC nói "grep toàn repo".~~
  resolved: 2026-09-29 — thêm `thanScriptNoiTuyen` vào `test/helpers/quet-nguon.js`; `test/fold-tap-trung.test.js` nay quét thân script nội tuyến của `index.html` với cùng mẫu cấm bỏ dấu như `app/`. Kiểm bằng cách tạm chèn vào script nội tuyến: test đỏ đúng dòng, rồi hoàn nguyên. Làm luôn cho `test/nguong-tap-trung.test.js` (rẻ).
  evidence: Xác minh thật — `danhSachFileJs(appDir)` chỉ nhận `.js` dưới `app/`. Phần yêu cầu chung "quét toàn repo" bị thu hẹp có chủ ý: mã sản phẩm là `.js` dưới `app/`, repo là `type: module`, và `test/` không phải mã sản phẩm (chính các test phải được viết mã bỏ dấu để tự kiểm bộ quét). Điểm hẹp còn lại là thật và trùng đúng mục defer của Story 1.3: script theme nội tuyến trong `<head>` của `index.html`. Mở lại ở Story 1.8 cùng lúc với bộ quét `Date` — `boChuThichHtml` đã có sẵn ở `test/helpers/quet-nguon.js`, nên mở rộng cả hai bộ quét sang `index.html` một lần là rẻ nhất.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-kho-ghi-chu-ben-va-luong-ghi-chuan.md`
  summary: ~~`tuLuuNoiDung` và `xoaGhiChu` chưa thoả thuận với nhau về một hẹn tự lưu đang treo — đổi mẩu đang sửa làm mất chữ của mẩu trước trong im lặng, và xóa trong lúc `put` đang bay có thể hồi sinh bản ghi trên đĩa.~~
  resolved: 2026-09-29 — đã được xử lý từ trước (`seq` theo từng `id`, `vaoCheDoSua`/`roiCheDoSua` không tăng `seq`; `xoaGhiChu` dọn `seq`/`chuDangCho`; `henGhiDiSau` bỏ hẹn khi `banGhi === null`). Nay có test ghim: `test/core-state-hen-tu-luu.test.js` (ca A: đổi sang mẩu B, chữ A vẫn xuống kho; ca B: xóa lúc put đang bay; ca B2: xóa khi hẹn còn treo).
  evidence: `editing` chỉ có MỘT ô và `seq` là một số đếm chung, nên hẹn của mẩu trước luôn bị bỏ khi bắt đầu sửa mẩu khác. Thật, nhưng fix nhỏ nhất là một phép flush hẹn treo, không tầm thường, và AD-8 giao đúng loại việc đó cho story tiêu thụ (Story 2.3 phải "hủy hẹn đang treo trước khi làm gì khác"). Story 5.1 (sửa nội dung tại chỗ) và 5.3 (xóa) là nơi hành vi "rời một lần sửa" được định nghĩa.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-kho-ghi-chu-ben-va-luong-ghi-chuan.md`
  summary: ~~`maCuaLoi` của `app/adapters/indexeddb.js` không có test — đột biến nó thành `MA_LOI.DB` vẫn xanh toàn suite, nên đường `QuotaExceededError` → `QUOTA` của luồng ghi ghi chú chỉ có bằng chứng là bước 5 danh sách thử tay.~~
  resolved: 2026-09-29 — tách ánh xạ tên lỗi → mã thành hàm thuần `maLoiTuTen(ten)` trong `app/core/errors.js`; `maCuaLoi` của adapter chỉ còn gọi nó (hành vi giữ nguyên, không nới ngoại lệ adapter). Test lõi ở `test/core-errors.test.js` (QuotaExceededError → QUOTA, tên khác và đầu vào lạ → DB). `APP_VERSION` 0.7.11 → 0.7.12.
  evidence: `test/adapter-session-store.test.js` phủ đúng ánh xạ này cho `localstorage.js` như một ngoại lệ hẹp đã duyệt. Làm tương tự cho `indexeddb.js` cần export `maCuaLoi` (thêm bề mặt công khai) hoặc dựng một IndexedDB giả — đúng thứ luật "adapters không có test tự động" sinh ra để tránh. Mở rộng ngoại lệ là quyết định của người dùng.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-6-kho-ghi-chu-ben-va-luong-ghi-chuan.md`
  summary: ~~`sessionStore.write` ép kiểu giá trị không phải chuỗi, nên `write('persistDenied', false)` lưu chuỗi `"false"` và đọc lại thành truthy.~~
  resolved: 2026-09-29 — `write` ném `TypeError` khi `typeof value !== 'string'` (sau phép kiểm khóa, trước khi chạm kho), cùng khuôn với khóa lạ; JSDoc `app/ports/session-store.js` cập nhật; thêm ca kiểu giá trị vào `test/adapter-session-store.test.js`; bump `APP_VERSION` 0.7.13. Đã xác nhận mọi chỗ gọi truyền chuỗi: `state.js` 1148 (`giaTri` đã qua `THEME_HOP_LE`), 1214 (`nowIso()`), 1263 (`'1'`), 1313 (`exportedAt` đã gác `typeof === 'string'`).
  evidence: Chữ ký cổng đòi `value: string` nhưng adapter không kiểm. Chưa ai gọi `write` (Story 1.8 là người tiêu thụ đầu tiên), nên đây là một cái bẫy đặt sẵn cho Story 1.8 và Epic 8 chứ chưa phải một lỗi tới được.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-bon-tang-co-dinh-tren-nen-ban.md`
  summary: ~~Mọi bất biến layout tính toán (số cột, ranh giới 828px, trần 1040px, một vùng cuộn, chân trang chạm đáy) chỉ được bảo vệ khi có người nhớ chạy `npm run thu-bo-cuc` bằng tay.~~
  resolved: 2026-09-29 — AGENTS.md ghi luật chạy `npm run thu-bo-cuc` trước mỗi lần push chạm `app/style.css`/`app/view/`/`app/main.js`. Vẫn không nối vào runner (không CI); đây là luật quy ước.
  evidence: `npm test` chỉ gom `test/**/*.test.js`, và phần trong suite chỉ quét văn bản nguồn — đổi `--note-min-col` hay bỏ `min-block-size: 0` vẫn xanh. Đây là cùng quy ước đã chốt cho `npm run thu-tay` (cần trình duyệt thật trên máy, không thêm dependency), nên nối nó vào một runner là quyết định cấp dự án chứ không phải của Story 2.1.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-o-soan-thao-san-con-tro-chu-tu-luu.md`
  summary: ~~Khi `tabIdentity()` ném hoặc `claimDraft` bị từ chối, `tabCuaMinh` ở lại `null` và mọi phím gõ chỉ nằm trong RAM — không một dấu hiệu nào trên màn hình.~~
  resolved: 2026-09-29 — Story 3.1 đã nói ra: `khoiDongBanNhap` đặt banner `DB` ở cả hai nhánh (`state.js` ~1777 và ~1809) và `view/banner.js` vẽ nó (`test/banner.test.js` "DB" → `tongChu()` = `microcopyLoi(DB)`). Test lõi đã có: `core-state.test.js` "lấy danh tính tab hỏng → dải băng…" và "kho hỏng → … banner DB…". Nay thêm ghim hệ quả: `core-state.test.js` "tabIdentity ném → gõ tiếp: chữ vào state, banner DB ở lại, không putDraft" và bản "claimDraft bị từ chối" (cổng giả; không đụng `tools/thu-bo-cuc.mjs`).
  evidence: Hành vi lõi có từ Story 1.7 (`app/core/state.js:527` và `:620` chặn mọi phép ghi khi chưa có danh tính), không do Story 2.2 gây ra. Lõi đã đặt `banner`; chỗ nói ra nó là dải băng của Story 3.1. Vá ở tầng view sẽ cần một trường state mới, thứ khối đóng băng của 2.2 cấm.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-chot-ban-nhap-thanh-ghi-chu.md`
  summary: ~~Một lần chốt HỎNG vẫn xóa mất bộ lọc đang bật, vì `xoaHetDieuKien()` chạy trước phép ghi.~~
  resolved: 2026-09-29 — bộ lọc nay bị xóa trong nhánh ghi thành công của `themGhiChu` (`app/core/state.js`), cùng một `datLai` với mẩu mới; `chotGhiChu` trả `true` chỉ khi kho đã nhận mẩu nên `main.js` không đổi lối nối. Hai ca mới trong test/core-state.test.js (ghi hỏng giữ bộ lọc, ghi thành công xóa cùng lúc mẩu vào); APP_VERSION 0.7.15.
  evidence: Thật, nhưng Epic 2 không có cách nào đặt điều kiện nên chưa chạm tới được. Epic 6 (tra cứu) phải quyết: hoặc hoàn nguyên `dieuKien` khi ghi hỏng, hoặc dời `xoaHetDieuKien()` vào nhánh thành công — cả hai đều đụng thứ tự năm bước đang nằm trong khối đóng băng của spec 2.3.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-chot-ban-nhap-thanh-ghi-chu.md`
  summary: Chốt trong lúc `claimDraft` chưa trả lời thì bản ghi `drafts` giành được sau đó vẫn giữ chữ vừa chốt — một bản nháp ma hẹp.
  evidence: Dòng "Chưa giành được bản nháp" của I/O Matrix đã đóng băng cách xử lý (`draft: null`, chỉ ghi `notes`), nên sửa là renegotiate ý định. Cửa sổ chạm tới chỉ kéo dài tới lúc `claimDraft` trả lời. Sẽ ngã ngũ nếu đo được: chốt ngay trong vài trăm ms đầu rồi tải lại có thấy chữ cũ quay lại không.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-chot-ban-nhap-thanh-ghi-chu.md`
  summary: ~~`Ctrl+Enter` trong lúc `khoiDong()` còn đang đọc kho thì `datLai({ notes })` của nó đè mất mẩu vừa chốt.~~
  resolved: 2026-09-29 — đã được Story 7.1 vá từ trước: mọi phép ghi thành công của chính tab (`put`, `remove`, `commitDraft`, `replaceAll`) gọi `baoGhiChuDoi()` (`app/core/state.js`), nó bật `docThem` khi một lượt đọc đang bay nên ảnh chụp cũ bị bỏ và đọc lại (bộ đếm mới là thừa). Chỉ thêm hai ca ghim kịch bản chốt/tự lưu chen giữa `readAll` treo trong test/core-state-dong-bo.test.js (đỏ khi gỡ `docThem` trong `baoGhiChuDoi`); không đổi mã app.
  evidence: Hành vi sẵn có của `khoiDong` từ Story 1.6 (`state.js:394-409`), không do Story 2.3 gây ra — `themGhiChu` cũ cũng vậy. Bản sửa đúng chỗ là cho `khoiDong` gộp thay vì đè.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-3-chot-ban-nhap-thanh-ghi-chu.md`
  summary: ~~`replaceAll` bị viết lại theo chữ ký mới của `trongGiaoDich` mà không phép kiểm nào chạm tới.~~
  resolved: 2026-09-29 — Story 4.3 đã mang phép kiểm ở tầng lõi (`test/core-state-nap.test.js`, cổng giả ghi thật vào kho RAM và từ chối là cuộn ngược): "`replaceAll` từ chối `QUOTA` → dải băng `QUOTA`, `notes` giữ nguyên tham chiếu" (kho vẫn đúng `id-1`,`id-2`), "`replaceAll` từ chối `DB` đi cùng một đường", "không bao giờ ghi mốc khi phép ghi kho đã hỏng"; thêm `test/core-state-dung-luong.test.js` ("nạp: replaceAll reject QUOTA → banner QUOTA, không kiểm"). Việc cuộn ngược thật của transaction IndexedDB là của adapter, không có test tự động theo luật — chỉ kiểm tay.
  evidence: Cùng gốc với lỗ hổng đã vá cho `put`/`remove`, nhưng `replaceAll` chưa có chỗ gọi nào trong repo — nó là việc của Epic 4 (nạp file sao lưu), và story đó phải tự mang phép kiểm cho nó.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-luoi-ghi-chu-cua-hom-nay.md`
  summary: ~~Chốt trong lúc `khoiDong()` còn đang đọc thì mẩu vừa chốt bị đè mất — và từ Story 2.4 nó NHÌN THẤY ĐƯỢC: mẩu nhô lên rồi biến mất khỏi lưới.~~
  resolved: 2026-09-29 — đã được Story 7.1 vá từ trước: mọi phép ghi thành công của chính tab (`put`, `remove`, `commitDraft`, `replaceAll`) gọi `baoGhiChuDoi()` (`app/core/state.js`), nó bật `docThem` khi một lượt đọc đang bay nên ảnh chụp cũ bị bỏ và đọc lại (bộ đếm mới là thừa). Chỉ thêm hai ca ghim kịch bản chốt/tự lưu chen giữa `readAll` treo trong test/core-state-dong-bo.test.js (đỏ khi gỡ `docThem` trong `baoGhiChuDoi`); không đổi mã app.
  evidence: Đã xác nhận lại ở `app/core/state.js:403-418` — `datLai({ notes: sapGiamDan(danhSach) })` thay nguyên mảng chứ không gộp. Cùng khiếm khuyết mà vòng review 2.3 đã hoãn, nhưng cái giá đã đổi: trước 2.4 không ai thấy, giờ nó phá đúng lời hứa "mẩu giấy nhô lên là bằng chứng duy nhất" trong giây đầu của trang. Bản sửa đúng chỗ vẫn là cho `khoiDong` gộp theo `id` thay vì đè, và nó đụng `state.js` — thứ khối đóng băng của 2.4 cấm chạm.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-luoi-ghi-chu-cua-hom-nay.md`
  summary: ~~Lưới không có `role="list"`/`listitem` và không vùng `aria-live`, nên mẩu vừa chốt hiện ra hoàn toàn vô hình với trình đọc màn hình.~~
  resolved: 2026-09-29 — `.luoi` có `role="list"`, mỗi mẩu `role="listitem"` (`app/view/mau-giay.js`), vùng live RIÊNG `.luoi-thong-bao` (role=status, polite) khai tĩnh ở index.html và chỉ `view/luoi.js` ghi, `main.js` gọi `luoi.thongBao` ở nhánh chốt thành công; APP_VERSION 0.7.17. Ca thu-bo-cuc đo cây trợ năng thật; README mục 39 là bước nghe bằng trình đọc.
  evidence: Thật, và nặng hơn bình thường vì sản phẩm cố ý IM LẶNG khi thành công — mẩu giấy là phản hồi duy nhất, nên không có gì khác để nghe. Hoãn vì ý định của epic đặt accessibility ở Epic 3 (`3-2-focus-ring-và-thứ-tự-tab`, `3-4-màu-không-phải-tín-hiệu-duy-nhất`); story nào trong epic đó nhận việc này phải nhận cả vùng thông báo.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-luoi-ghi-chu-cua-hom-nay.md`
  summary: ~~Khối bootstrap của `app/main.js` không một ca test nào CHẠY — nó chỉ được ghim bằng regex trên chính văn bản của mình.~~
  resolved: 2026-09-29 — luật AGENTS.md "mỗi chỗ nối mới trong `main.js` phải có một ca `thu-bo-cuc` chạy thật" đã bao; lưới chạy thật ở khối Story 2.4 của tools/thu-bo-cuc.mjs (chốt qua Ctrl+Enter, đợi đủ ô, đo hình học).
  evidence: `test/luoi.test.js` và `test/o-soan.test.js` đều đọc `main.js` bằng `readFileSync` rồi khớp mẫu; `core-state.test.js` import `main.js` dưới Node, nơi `typeof document === 'undefined'`, nên khối trong cửa `document` không bao giờ chạy. Một bootstrap để lưới trống sau mỗi lần tải trang vẫn ship với `npm test` xanh. Đóng đúng lỗ này cần một harness DOM cho bootstrap — lớn hơn một story, và là khuôn sẵn có từ `o-soan.test.js:617` chứ không do 2.4 dựng ra.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-mau-giay-hinh-dang-gio-tao-cat-va-mo-rong.md`
  summary: ~~Sau mỗi lượt bật/tắt mở rộng, `ve()` thay toàn bộ con nên phần tử đang focus bị hủy và focus rơi về `<body>`.~~
  resolved: 2026-09-25 — Story 8.0 (nhịp mở rộng của `khiClick` đi qua `mocSua.moRong` → `veGiuTieuDiem` neo thân mẩu; dòng gấp `khiGap` ngoài phạm vi).
  evidence: Thật, quan sát thẳng ở `app/view/luoi.js` — handler gọi `store.batTatMoRong` rồi `ve()`, và `ve()` dựng phần tử mới cho mọi mẩu. Phép sửa đòi nhớ phần tử nào đang focus, tức một ô nhớ ở tầng view (luật cấm) hoặc một trường state mới; hành vi focus thuộc Story 3.2.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-mau-giay-hinh-dang-gio-tao-cat-va-mo-rong.md`
  summary: ~~Mẩu giấy click được nhưng không có `cursor: pointer`, và mẩu bị cắt vào thứ tự Tab được nhưng không có `:focus-visible`.~~
  resolved: 2026-09-29 — `:focus-visible` của `.o-luoi` có từ Story 3.2 (`app/style.css`, khối chung đầu tệp); `cursor: pointer` thêm cho `.o-luoi` và nút `.mau-xoa` (APP_VERSION 0.7.11), `test/mau-giay.test.js` ghim.
  evidence: Thật — `app/style.css` không có luật nào cho hai thứ đó, và `test/bo-cuc-bon-tang.test.js` ghim ring focus ở đúng `.o-soan`. Ranh giới accessibility là của Epic 3 (`3-2-focus-ring-và-thứ-tự-tab`), không do spec 2.5 vẽ ra.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-6-trang-thai-rong-va-tab-title.md`
  summary: ~~Khối bootstrap của `app/main.js` chỉ được ghim bằng regex trên văn bản nguồn, nên việc nối view vào store có thể chết mà `npm test` vẫn xanh.~~
  resolved: 2026-09-29 — luật AGENTS.md "mỗi chỗ nối mới trong `main.js` phải có một ca `thu-bo-cuc` chạy thật" đã bao; `document.title` thật sau nạp và sau một lần chốt được đo ở khối Story 2.6 của tools/thu-bo-cuc.mjs, thêm ca Story 8.4.
  evidence: Lớp verification-gap đã chứng minh: đổi `noiTieuDe(store, document)` thành `noiTieuDe(store, null)` giữ nguyên mọi thứ mà `test/luoi.test.js` khớp (cùng một callback ở hai điểm nối, thân callback vẫn gọi `luoi.ve()` và `tieuDe.ve()`), nhưng `noiTieuDe` trả `{ ve(){} }` và tiêu đề tab không bao giờ đổi. `test/trang-tinh.test.js` nạp `main.js` ở Node, nơi cả khối `typeof document !== 'undefined'` không chạy. Phép đo thật chỉ có ở `npm run thu-bo-cuc` (cần Chrome, ngoài `npm test`). Đóng khe này đòi một harness DOM hoặc tách một `noiTatCa(store, doc)` kiểm được ra khỏi `main.js` — một quyết định kiến trúc lớn hơn một story.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-dai-bang-mot-chu-bay-nguon-mot-thu-tu-uu-tien.md`
  summary: Một phép ghi cũ hoàn thành SAU một phép ghi mới hỏng có thể xóa mất dải băng `QUOTA`/`DB` vừa bật, vì đường "ghi thành công thì tắt dải băng" không xét ưu tiên.
  evidence: Hành vi này có TRƯỚC Story 3.1 (`app/core/state.js:625`), không do nó gây ra. Chưa xác định được đường tới. Thứ sẽ kết luận: truy hết các nhánh bất đồng bộ của `henGhiDiSau` và `ghiTruocDatSau` xem hai phép ghi có chồng nhau được không khi `dangChot` đang gác, và nếu có thì dựng một ca test ghim thứ tự resolve.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-1-dai-bang-mot-chu-bay-nguon-mot-thu-tu-uu-tien.md`
  summary: ~~Ca "tải lại trang: MỌI mẩu về thu gọn" của `npm run thu-bo-cuc` đỏ không đều — một phép đo không bền, có trước Story 3.1.~~
  resolved: 2026-09-29 — nguyên nhân KHÔNG phải thời điểm đo. Bốn mẩu chốt cùng giây có `createdAt` trùng nên sau tải lại thứ tự đổi: mẩu một-đoạn-dài từ hàng 1 (lưới kéo giãn lên 128) sang một mình ở hàng 2 (cao tự nhiên 106), đứng yên ở 106 — vòng đợi ổn định không thể bắt. Đo trước: đỏ 2/5, mọi lần đỏ đều dãy [D, một đoạn, B, A]→[.., một đoạn ở cuối]. Sửa trong tools/thu-bo-cuc.mjs: giãn 1,1 giây giữa các lần chốt và thêm vế so thứ tự mẩu (8 ký tự đầu) vào phép so; không nới ngưỡng. Đo sau: ca xanh 12/12 lần chạy (lần đỏ duy nhất là ca Story 7.1, khác). Không đụng `app/`, không bump `APP_VERSION`. Còn để ngỏ: thứ tự mẩu trùng giây không ổn định qua tải lại là hành vi sản phẩm (`sapGiamDan` không có khóa phụ), không sửa ở đây.
  evidence: Đo trực tiếp: baseline `1d86a4f` đỏ 4/5 lần chạy; bản có Story 3.1 đỏ 2/4 lần. Triệu chứng luôn giống nhau (`cao [128,128,128,128]→[128,128,128,106]`), gợi ý phép đo chiều cao chạy trước khi bố cục ổn định sau khi tải lại.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-focus-ring-va-thu-tu-tab.md`
  summary: ~~Không có CI — nửa nghiệm thu chạy bằng trình duyệt thật (`npm run thu-bo-cuc`) chỉ chạy khi ai đó nhớ gọi, trong khi thứ tự Tab, vòng sáng và "click chuột không ring" chỉ sống ở đó.~~
  resolved: 2026-09-29 — AGENTS.md mục "Chạy và kiểm chứng" ghi luật chạy `npm run thu-bo-cuc` trước mỗi lần push chạm `app/main.js`, `app/view/` hoặc `app/style.css`, ca đỏ ngoài ca chập chờn là hồi quy chặn push. Vẫn không có CI; đây là luật quy ước, không phải cổng máy.
  evidence: `.github/` không tồn tại; `npm test` và `npm run thu-bo-cuc` là hai script rời. Đây là quy ước có sẵn từ các story trước chứ không do Story 3.2 gây ra, nên lớp verification-gap cố ý không đệ trình nó như một gap. Sẽ cắn đúng vào lúc bốn epic sau đổ thêm điều khiển vào trang.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-3-nut-theme-va-tuong-phan-o-ca-hai-bang-mau.md`
  summary: CHỜ ĐIỀU KIỆN — bộ phân tích CSS của `test/theme.test.js` không nhìn được vào `@media`/`@supports`; chỉ có ý nghĩa khi có story nâng bộ quét `test/token-style.test.js` để cho phép at-rule (ví dụ `prefers-reduced-motion`).
  evidence: `cacKhoi`/`cacLuatCoMauChu` dùng regex một tầng (`/([^{}]*)\{([^{}]*)\}/g`), không khớp được khối lồng. Xác nhận lại 2026-09-29: `app/style.css` vẫn chưa có `@media`/`@supports` thật (chỉ một chú thích nhắc `@import`), và `token-style.test.js` đỏ nếu ai thêm at-rule — nên hôm nay vô hại và không sửa bộ phân tích.
  điều kiện: khi có story nâng bộ quét của `token-style.test.js` để cho phép at-rule, story đó phải nâng `cacKhoi`/`cacLuatCoMauChu` (hỗ trợ khối lồng) trong CÙNG thay đổi, kèm một test chứng minh luật `color` đặt trong `@media` vẫn bị đo (và bị cửa "mọi luật có color đều khai chỗ đứng" bắt). Không nâng một bên mà bỏ bên kia: nếu không, luật `color: var(--…)` trong `@media` vừa không được đo tương phản vừa lọt cửa khai chỗ đứng.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-3-nut-theme-va-tuong-phan-o-ca-hai-bang-mau.md`
  summary: ~~`subscribe` của `app/adapters/broadcast.js` không có đường gỡ bộ nghe và không có cách đóng kênh.~~
  resolved: 2026-09-29 — `subscribe` trả hàm gỡ bộ nghe (`app/adapters/broadcast.js:72-81`, cả nhánh không có kênh cũng trả `() => {}`); `app/main.js:520` là người nghe duy nhất (Story 7.1). Không có phương thức đóng kênh — chưa ai cần.
  evidence: Mỗi lời gọi bọc listener trong một arrow mới rồi `addEventListener`, không trả về gì. Chưa ai đăng ký nghe nên hôm nay vô hại, nhưng Epic 7 (nạp lại theo tin, phát hiện lệch phiên bản) sẽ cần cả hai — và một test đăng ký nhiều lần sẽ tích listener trên cùng một kênh.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-3-nut-theme-va-tuong-phan-o-ca-hai-bang-mau.md`
  summary: ~~`tools/thu-bo-cuc.mjs` có hai hàm đi ngược cây tìm nền gần như trùng nhau (`nenSau` trong `HAM_TEN`, `nenThat` trong `DO_CHU`).~~
  resolved: 2026-09-29 — gộp thành `nenSau(el, tinhCaNo = false)` trong `HAM_TEN`; `DO_CHU` gọi `nenSau(el, true)`, `nenThat` bỏ. Refactor thuần, chỉ đụng tools/: `npm run thu-bo-cuc` trước 130/130 và sau 130/130, từng ca cùng tên và cùng kết quả (tương phản thấp nhất 4.92 light / 5.61 dark trên 15 phần tử ở cả hai lần); không đụng `app/`, không bump `APP_VERSION`.
  evidence: Thân hai hàm giống nhau, chỉ khác điểm bắt đầu (`el.parentElement` so với `el`). Gộp thành một hàm nhận cờ là phép sửa đúng, nhưng nó là refactor trên mã harness đang xanh chứ không phải một phép sửa thẳng, nên để riêng.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-3-nut-theme-va-tuong-phan-o-ca-hai-bang-mau.md`
  summary: ~~Ca harness NFR-1 ("2000 ghi chú trong kho") đỏ-không-đều với `kho 0 bản ghi` — phép bơm dữ liệu báo về 0 rồi lần chạy sau lại đúng.~~
  resolved: 2026-09-29 — đã vá từ 798a279 (retro Epic 6): khối NFR-1 của tools/thu-bo-cuc.mjs đợi `store.state.notes.length` đạt đủ 2000 trước khi khẳng định. Đo lại: 17/17 lần xanh (kho 2000 bản ghi, 51–87ms), không tái hiện `kho 0`. Không sửa thêm.
  evidence: Đo được ở CẢ commit nền `ed71adf` (đỏ 2 trong 7 lần chạy, trên một worktree sạch) lẫn ở HEAD — nên nó có trước Story 3.3, không do story này gây ra. Chỗ cần vá là khuôn đợi kho của harness, không phải mã sản phẩm. (Ca Story 2.5 "tải lại trang: mọi mẩu về thu gọn" cùng dáng nhưng ĐÃ được vá trong chính story này — xem Implementation Notes.)

- source_spec: `_bmad-output/implementation-artifacts/spec-3-4-phong-to-chuyen-dong-va-mau-khong-phai-tin-hieu-duy-nhat.md`
  summary: ~~Phép đo "không chữ bị cắt" ở khung nhìn 550×400 có thể bỏ sót chữ bị cắt nằm trong thẻ CON của một wrapper, vì bộ lọc `coChuRieng` chỉ giữ phần tử có text node riêng.~~
  resolved: 2026-09-29 — dựng fixture (wrapper `overflow-x: hidden` rộng 100px bọc `span` nowrap mang chữ dài, chỉ là DOM tiêm vào trang rồi gỡ, không thêm stub) trong khối phóng 200% của `tools/thu-bo-cuc.mjs`: trước khi sửa ca ĐỎ (`catChu` rỗng) → bỏ sót thật. Sửa `DO_PHONG` xét thêm tổ tiên có `overflow-x` hidden/clip (dừng ở `<body>`) mà cạnh phải phần tử vượt vùng cắt; fixture giữ làm ca hồi quy, phép đo trên trang thật vẫn xanh. Không đụng `app/`, không bump `APP_VERSION`.
  evidence: Nếu wrapper cắt ngang mà thẻ con mang chữ không tự tràn (`scrollWidth <= clientWidth + 1`), không phần tử nào bị bắt. Chưa dựng được ca chạm tới: chỗ cắt duy nhất hôm nay — `.o-luoi` của Story 2.5 — cắt theo chiều DỌC, không phải chiều ngang. Thứ chốt được: dựng một wrapper `overflow-x` ẩn bọc một thẻ con mang chữ, xem ca có còn xanh không. Sẽ là medium nếu thật.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-chan-trang-voi-hai-link-thuong-truc.md`
  summary: ~~`npm run thu-bo-cuc` chưa đo khoảng `gap` ma của chỗ đứng dòng nhắc trên trình duyệt thật — cam kết "rỗng thì không chiếm chỗ" mới chỉ được chứng minh bằng quét nguồn.~~
  resolved: 2026-09-29 — thêm ca "Story 4.1 — chỗ đứng dòng nhắc rỗng không chiếm chỗ" vào khối 8.1/8.2 của `tools/thu-bo-cuc.mjs`: đo mép trái `.nut-theme` với `.chan` co `max-content` (lề `auto` không còn chỗ nuốt `gap` ma; đo ở bề rộng thường thì đột biến vẫn xanh) ở ba cảnh — rỗng, gỡ tạm phần tử, có chữ (mốc sao lưu 4 ngày). Rỗng = không phần tử (402.67), có chữ khác (503.16). Kiểm đột biến: đổi `.chan-nhac:empty` thành `display: block` → ca ĐỎ (406.67 so với 402.67, lệch đúng một `gap`), đã hoàn nguyên. Không đụng `app/`, không bump `APP_VERSION`.
  evidence: `tools/thu-bo-cuc.mjs` đã khóa hai `button.chan-link` trong thứ tự tab thật (dòng 1322) và kiểm chúng sống sót ở các bề rộng (dòng 1516), nhưng không đọc `.chan-nhac` hay `columnGap` của `.chan`. Phép đo thật chỉ dựng được khi Story 4.4 có chữ để so hai cảnh: mép trái nút theme không đổi giữa lúc chỗ đứng rỗng và lúc nó có chữ.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-1-chan-trang-voi-hai-link-thuong-truc.md`
  summary: ~~Hai phép khẳng định trùng byte giữa `test/chan-trang-hai-link.test.js` và `test/bo-cuc-bon-tang.test.js` — regex `<button…chan-link…>` và cửa `margin-inline-start: auto`.~~
  resolved: 2026-09-29 — đưa cả hai mẫu vào `test/helpers/chan-trang.js` (`mauNutChanLink(nhan)`, `MAU_LE_NUT_THEME`), hai test import chung; ý nghĩa phép kiểm không đổi. Kiểm đột biến: đổi nhãn `nạp lại` trong `index.html` → cả hai tệp test đỏ (3 ca), đã hoàn nguyên. Chỉ sửa `test/`, không bump `APP_VERSION`.
  evidence: Trùng thật (`chan-trang-hai-link.test.js` ~dòng 70/113 so với `bo-cuc-bon-tang.test.js` dòng 164/168). Nó không sai hôm nay, nhưng lần RENEGOTIATE ở Story 4.2/4.3 sẽ phải tìm ra cả hai chỗ. Cách vá gọn: đưa regex nhãn chung vào `test/helpers/`.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-xuat-toan-bo-ra-mot-file-sao-luu.md`
  summary: ~~`phatPhienDoi()` không bọc `ports.channel.publish`, nên một cổng kênh ném sẽ từ chối lời hứa của action gọi nó — trái lời hứa "không bao giờ bị từ chối" của cả `datTheme` lẫn `xuatSaoLuu`.~~
  resolved: 2026-09-29 — `phatTin` (`app/core/state.js:1092-1111`, kế thừa `phatPhienDoi`) bọc cả `tabIdentity()` lẫn `ports.channel.publish` trong `try`, và adapter `broadcast.js` cũng bọc `postMessage`; `test/core-state-nap.test.js` có ca `publish` ném.
  evidence: Thật, nhưng có từ Story 3.3 chứ không phải story này gây ra: `phatPhienDoi` (`app/core/state.js` ~dòng 556) chỉ bọc `tabIdentity()` trong `try`, còn `publish(...)` để trần; `datTheme` phơi y hệt. Vá đúng cách là bọc một lần ở `phatPhienDoi` cho mọi chỗ gọi, kèm một ca test cho cổng kênh ném.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-2-xuat-toan-bo-ra-mot-file-sao-luu.md`
  summary: ~~`#chan-nap` là một nút focus được, không `disabled`, và không làm gì cho tới khi Story 4.3 xong — người dùng bàn phím hoặc trình đọc màn hình bấm vào không nhận được phản hồi nào.~~
  resolved: 2026-09-29 — Story 4.3 nối hành vi: `app/view/chan-trang.js:112` gọi `store.napSaoLuu().then(sauKhiNap)` trên `#chan-nap`.
  evidence: Nút đã đứng đó từ Story 2.1 và được 4.1 khóa bằng test "hai link không bao giờ ẩn"; Story 4.2 chỉ thêm `id`. Ràng buộc sẽ tự biến mất khi 4.3 nối hành vi — chỉ cần xử lý riêng nếu 4.3 bị hoãn.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-3-nap-lai-hai-pha-gop-theo-dinh-danh-nguyen-tu.md`
  summary: Phép nạp đọc kho ở `readAll` rồi ghi đè ở `replaceAll` bằng hai lời gọi cổng tách rời, nên bất kỳ phép ghi nào chen vào giữa hai lời gọi đó vẫn bị xóa.
  evidence: Thật, và làm JSDoc "nguồn để gộp là KHO nên không bao giờ mất" đúng hẹp hơn nó nghe. Cửa sổ chỉ là khoảng cách giữa hai thao tác IndexedDB kề nhau và hộp chọn file là modal nên chính Nam không chen vào được — chỉ một tab khác mới lọt. Đóng hẳn đòi một phương thức cổng đọc-và-ghi trong CÙNG một giao dịch, tức một mặt công khai mới; Epic 7 mới là chỗ đồng bộ liên tab.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-dong-nhac-thu-dong-ve-lan-sao-luu-gan-nhat.md`
  summary: ~~Mốc `lastBackupAt` trong state lệch khỏi kho khi một tab KHÁC vừa sao lưu — dòng nhắc của tab này vẫn đếm từ mốc cũ cho tới lần tải trang sau.~~
  resolved: 2026-09-29 — chiều nhận đã dựng ở Epic 7: `kenh.subscribe` (`app/main.js:520`) → `nhanBanTin` → `napLaiPhien` (`app/core/state.js:997`) đọc lại `KHOA_LAST_BACKUP` khi nhận `session-changed`; `test/core-state-dong-bo.test.js:410-421` ghim. Đề xuất "nhánh trả sớm của `ghiMocSaoLuuMoiHon` đặt luôn `dangCo` vào state" không làm — tab nhận tự đọc lại nên không cần.
  evidence: Xác minh thật, và gốc chung của ba phát hiện riêng (chú thích "dùng chung cho mọi tab" mạnh hơn hiện thực; không có chiều NHẬN `session-changed`; nhánh trả sớm của `ghiMocSaoLuuMoiHon` để state giữ mốc cũ trong khi kho đã mới hơn). `app/core/state.js` phát `session-changed` ở cả hai đường ghi nhưng `app/` chưa có một bộ nghe nào — `app/main.js` tự ghi "Không có cơ chế subscribe trong dự án này (và không được dựng một cái)". Không do Story 4.4 sinh ra: khoảng trống có từ 4.2, story này chỉ thêm một người đọc cho cái mốc đó. Mở lại ở Epic 7 (đồng bộ ghi chú giữa các tab), nơi chiều nhận được dựng một lần cho mọi khóa cấu hình: bộ nghe đọc lại `KHOA_LAST_BACKUP` rồi `datLai`, và nhánh trả sớm của `ghiMocSaoLuuMoiHon` đặt luôn `dangCo` vào state.

- source_spec: `_bmad-output/implementation-artifacts/spec-4-4-dong-nhac-thu-dong-ve-lan-sao-luu-gan-nhat.md`
  summary: Không gì tính lại dòng nhắc khi thời gian trôi — một tab mở qua nửa đêm (hay qua cả ngày thứ tám) giữ nguyên con số của lượt vẽ cuối.
  evidence: Xác minh thật — ngưỡng đo bằng NGÀY còn `chanTrang.ve()` chỉ chạy theo `veTatCa()`, tức theo đổi `notes`/`theme`/dải băng, và sau một lần xuất. Không vá ở story này vì bản sửa nhỏ nhất vẫn là một cơ chế MỚI (một cái hẹn ở ranh giới ngày, cùng đường dọn dẹp của nó), trong khi dự án chỉ có đúng một hẹn lặp đã cân nhắc kỹ — `setInterval` nhịp tim bản nháp ở `app/main.js`, cố ý đặt ngoài `taoStore`. Cùng họ với khoảng trống liên tab ngay trên: cả hai đều là "state bền đổi mà lượt vẽ không biết". Mở lại cùng Epic 7, hoặc sớm hơn nếu có người dùng thật báo đã gặp.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-sua-noi-dung-tai-cho.md`
  summary: ~~Mẩu giấy vào được thứ tự Tab nhưng không có `role` lẫn nhãn cho trình đọc màn hình, và `<textarea class="mau-sua">` không có `aria-label`.~~
  resolved: 2026-09-29 — ô sửa đã có `aria-label` "nội dung ghi chú" từ trước (`mau-giay.js`, xác minh, không làm lại); phần còn thiếu đã thêm: mẩu có `role="listitem"`, nhãn "ghi chú lúc HH:mm" (mốc đầy đủ khi có điều kiện) và `aria-describedby` trỏ vào thân để vẫn nghe được chữ. Cùng commit với mục 2-4 phía trên.
  evidence: "`grep 'aria-\|role='` trong `app/view/mau-giay.js` không có một kết quả nào, trong khi `index.html:91` cho ô soạn thảo một `aria-label`. Lỗ này có TRƯỚC Story 5.1 (mẩu bị cắt đã mang `tabindex=\"0\"` từ Story 2.5 mà cũng không có nhãn); 5.1 chỉ nới nó ra mọi mẩu. Câu chữ của nhãn là microcopy tiếng Việt nên phải do người chốt — thuộc về một story a11y, không phải 5.1."

- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-sua-noi-dung-tai-cho.md`
  summary: ~~Chỗ nối chế độ sửa trong `app/main.js` chỉ được ghim bằng quét chuỗi mã nguồn — không lệnh nào chạy nó, nên bốn lỗi của vòng review 1 có thể quay lại mà `npm test` vẫn xanh.~~
  resolved: 2026-09-29 — luật AGENTS.md "mỗi chỗ nối mới trong `main.js` phải có một ca `thu-bo-cuc` chạy thật" đã bao; khối Story 5.1 của tools/thu-bo-cuc.mjs (chế độ sửa tại chỗ, bốn phép đo) chạy trên Chrome thật.
  evidence: Khối nối nằm sau `if (typeof document !== 'undefined')` ở `app/main.js:84`, luôn sai dưới Vitest, và dự án cố ý không có jsdom. Hành vi thật được `tools/thu-bo-cuc.mjs` đo (bốn phép đo mới của Story 5.1 đều xanh trên Chrome thật), nhưng nó KHÔNG nằm trong `npm test` và phải chạy tay. Đây là lựa chọn có ý thức của dự án về dụng cụ kiểm, không phải một lỗ hổng của story — mở lại nếu có lúc dựng một bộ khung DOM cho `npm test`.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-sua-noi-dung-tai-cho.md`
  summary: Đóng tab trong `AUTOSAVE_MS` sau phím cuối thì những ký tự cuối chưa kịp xuống kho.
  evidence: Tính chất có sẵn của luồng tự lưu "đổi state ngay, ghi đi sau" (AD-8) — bản nháp của ô soạn thảo cũng vậy từ Story 1.7. Story 5.1 chỉ thừa hưởng, không gây ra. Bản sửa nhỏ nhất là một phép flush lúc `beforeunload`, tức một cơ chế MỚI cho cả hai cửa ghi — thuộc về một quyết định chung, không phải story này.

- source_spec: `_bmad-output/implementation-artifacts/spec-5-3-xoa-qua-hop-thoai-xac-nhan.md`
  summary: ~~Phạm vi checklist thủ công ghi trong `AGENTS.md` ("checklist thủ công 1–29") đã cũ — README nay có tới mục 31.~~
  resolved: 2026-09-24 — refresh bmad-project-context đổi thành "1–32".
  evidence: Đã cũ từ trước Story 5.3 (mục 30 là của Story 5.2). `app/adapters/` chỉ được kiểm bằng checklist đó, nên một phạm vi sai là một lỗ hổng phủ thật. Sửa file ngữ cảnh cho agent nên không đi cùng story này.

## Deferred from: code review of spec-5-3-xoa-qua-hop-thoai-xac-nhan.md (2026-09-24)

- Bấm `xóa` trên một mẩu ĐANG sửa có thể mất cú bấm đầu. `blur` chạy `roiCheDoSua().then(setTimeout(veGiuTieuDiem))`, lượt này dựng lại lưới sau vài ms, trong khi một cú bấm người thật cách `mousedown`→`mouseup` cỡ 50–100ms, nên nút bị thay trước khi `click` tới. Chưa kiểm chứng (maybe-false); nếu đúng thì `medium`. Cùng cơ chế với cú bấm mẩu A → mẩu B của Story 5.1. Cách kiểm: trình duyệt thật với độ trễ `mousedown`→`mouseup` ~100ms; CDP của `thu-bo-cuc` phát hai sự kiện sát nhau nên không bắt được.

- source_spec: `_bmad-output/implementation-artifacts/spec-6-1-tim-bang-chu-tren-toan-bo-du-lieu.md`
  summary: ~~`AGENTS.md` vẫn ghi "checklist thủ công 1–29" trong khi README đã tới mục 32.~~
  resolved: 2026-09-24 — refresh bmad-project-context đổi thành "1–32".
  evidence: Hai dòng trong AGENTS.md (mục tài liệu gốc và `app/adapters/`) nói 1–29; README hiện có mục 30–32. Sửa chạm file ngữ cảnh agent nên hoãn, làm qua bmad-project-context.

## Deferred from: code review of spec-6-3-khoi-dieu-kien-hang-chip-va-duong-ve (2026-09-24)

- ~~Nối `veHomNay`/`veTatCa`/placeholder trong `app/main.js` chỉ được ghim bằng regex mã nguồn; hành vi thật (xóa ô ngày gõ dở, trả focus về `#o-soan`, gỡ placeholder sau chốt) chỉ kiểm ở `tools/thu-bo-cuc.mjs` ngoài `npm test`. Chạy `npm run thu-bo-cuc` trước khi deploy 0.7.0.~~
  resolved: 2026-09-29 — khối Story 6.3 của tools/thu-bo-cuc.mjs đã đo `về hôm nay`; thêm ca đường CHỐT (`veSauChot` → `xoaHetDieuKienVaNhap`): điều kiện + ngày gõ dở, chốt bằng Ctrl+Enter, hàng chip ẩn, ô tìm và ô ngày về rỗng, placeholder gỡ. Đột biến `xoaHetDieuKienVaNhap()` → `store.xoaHetDieuKien()` trong `veSauChot` làm ca đỏ (`ngay` còn `03/09/20`). Câu "chạy trước deploy 0.7.0" đã cũ, luật push nằm trong AGENTS.md.

- ~~AGENTS.md còn ghi checklist thủ công "1–32"; README đã có mục 33 (Story 6.2) và 34 (Story 6.3).~~
  resolved: 2026-09-29 — AGENTS.md hiện không còn ghi dải số checklist (chỉ "checklist thủ công" trong `README.md`); refresh bmad-project-context.


- source_spec: `_bmad-output/implementation-artifacts/spec-6-4-tran-ket-qua-va-hieu-nang-tra-cuu.md`
  summary: ~~AGENTS.md vẫn ghi checklist thủ công "1–32" trong khi README đã tới mục 35.~~
  resolved: 2026-09-29 — AGENTS.md hiện không còn ghi dải số checklist; refresh bmad-project-context.
  evidence: README thêm mục 33–35 qua Story 6.2–6.4; sửa file agent-context nên làm qua `bmad-project-context`.

- source_spec: `_bmad-output/implementation-artifacts/spec-7-0-don-action-item-retro-epic-4-6.md`
  summary: ~~AGENTS.md vẫn ghi "`app/adapters/` không có test tự động theo luật" dù đã có `test/adapter-file-io.test.js` và `test/adapter-session-store.test.js`.~~
  resolved: 2026-09-24 — refresh bmad-project-context ghi rõ hai ngoại lệ adapter.
  evidence: Story 7.0 sửa hai chú thích lạc hậu cùng nội dung (E4#7) ở mã, nhưng dòng tương ứng trong AGENTS.md chưa đổi; sửa file agent-context nên làm qua `bmad-project-context`.

- source_spec: `_bmad-output/implementation-artifacts/spec-7-0-don-action-item-retro-epic-4-6.md`
  summary: ~~`app/view/luoi.js` `khiClick` (Enter/click trên mẩu bị cắt) gọi `batTatMoRong` rồi `ve()` cục bộ — `replaceChildren` có thể gỡ thân mẩu đang focus mà không đi qua `veGiuTieuDiem`.~~
  resolved: 2026-09-25 — Story 8.0 (thu-bo-cuc đo đỏ thật: tiêu điểm về `<body>`; sửa qua `mocSua.moRong`, ca thu-bo-cuc xanh).
  evidence: CHƯA KIỂM (maybe-false, nếu thật thì medium): có từ Story 2.5, không do 7.0. Để chốt: ở trình duyệt thật, Tab tới một mẩu bị cắt, nhấn Enter, đọc `document.activeElement` — `<body>` là lỗi thật. Liên quan luật mới trong AGENTS.md "lượt vẽ nào gỡ phần tử đang focus phải đi qua veGiuTieuDiem".

## Deferred from: code review of spec-7-0-don-action-item-retro-epic-4-6.md (2026-09-24)

- source_spec: `_bmad-output/implementation-artifacts/spec-7-0-don-action-item-retro-epic-4-6.md`
  summary: ~~`app/view/hang-chip.js` `replaceChildren` ở mọi `ve()` khi có điều kiện — tiêu điểm đang ở `về hôm nay` gặp một lượt vẽ bất đồng bộ thì rơi về `<body>`; `veGiuTieuDiem` neo `undefined` bỏ qua vì phần tử nằm ngoài mọi mẩu.~~
  resolved: 2026-09-25 — Story 7.1 (`hang-chip.js` export `CHON_VE_HOM_NAY`, `veGiuTieuDiem` neo được nút `về hôm nay`); gạch theo retro Epic 7 F3.
  evidence: medium, có từ Story 6.3. Hôm nay khe hẹp (lượt `roi` hoãn, `go`/`put`); Story 7.1 thêm lượt vẽ từ bản tin tab khác thì thành đường thường. Spec 7.1 nên quyết: hàng chip gác nút khi tiêu điểm đang trên nó, hoặc `veGiuTieuDiem` nhận thêm vai trò ngoài lưới.

- source_spec: `_bmad-output/implementation-artifacts/spec-7-0-don-action-item-retro-epic-4-6.md`
  summary: ~~Bẫy mới trong AGENTS.md ("phải đi qua `veGiuTieuDiem`, không tự `focus()`") trái với `vaoSuaRoiVe` (`app/main.js:256`, vẽ rồi tự focus ô sửa mới), và danh sách nguồn gỡ tiêu điểm thiếu hàng chip.~~
  resolved: 2026-09-25 — bmad-project-context ghi `vaoSuaRoiVe` là ngoại lệ có tên và thêm nút `về hôm nay` vào danh sách (retro Epic 7 F6, #26).
  evidence: low. Sửa file agent-context nên làm qua `bmad-project-context`: ghi `vaoSuaRoiVe` là ngoại lệ có tên (đặt tiêu điểm vào phần tử MỚI, không trả về chỗ cũ).

- source_spec: `_bmad-output/implementation-artifacts/spec-7-0-don-action-item-retro-epic-4-6.md`
  summary: ~~Retro Epic 4 F1 (phép ghi chen giữa `readAll`/`replaceAll` khi nạp) chỉ nằm ở §4.4 bản đề xuất Story 7.0, chưa vào Story 7.1 của `epics.md`.~~
  resolved: 2026-09-29 — trùng mục "Hoãn F1" của spec-7-1 ngay bên dưới (cùng phép ghi chen giữa `readAll`/`replaceAll` khi nạp), vốn đã ghi đủ ở deferred-work.md.
  evidence: low. Phép ghi từ tab khác làm cửa sổ này rộng ra; người viết spec 7.1 phải đọc §4.4 hoặc chép nó vào AC/ghi chú của 7.1.

## Deferred from: spec-7-1-dong-bo-ghi-chu-giua-cac-tab.md (2026-09-25)

- source_spec: `_bmad-output/implementation-artifacts/spec-7-1-dong-bo-ghi-chu-giua-cac-tab.md`
  summary: Hoãn F1 — phép nạp file đọc `readAll` rồi `replaceAll` bằng hai giao dịch tách rời; một phép ghi từ tab khác chen đúng khe giữa hai giao dịch sẽ bị `replaceAll` xóa mất.
  evidence: low (n = 1, khe chỉ là giữa hai giao dịch IndexedDB kề nhau, phải ghi ở tab khác đúng lúc đang nạp). Đóng hẳn cần phương thức cổng mới (`mergeAll` đọc-và-ghi trong một giao dịch) trên adapter `indexeddb.js`, mà adapter không có test tự động — quyết định trong Design Notes của spec 7.1.

- source_spec: `_bmad-output/implementation-artifacts/spec-7-1-dong-bo-ghi-chu-giua-cac-tab.md`
  summary: Giới hạn đã biết, không sửa — (1) hai tab cùng sửa một mẩu thì lần ghi sau thắng; (2) khe hồi sinh: hẹn tự lưu của A nổ sau `remove` của B nhưng trước khi A nhận tin (vài ms) thì `put` dựng lại mẩu trong kho.
  evidence: ghi trong Design Notes của spec 7.1; không mất dữ liệu.

- source_spec: `_bmad-output/implementation-artifacts/spec-7-1-dong-bo-ghi-chu-giua-cac-tab.md`
  summary: ~~Chỗ nối `kenh.subscribe(...)` trong `app/main.js` (cùng một `kenh` cho chiều phát và nghe, lượt vẽ giữ tiêu điểm) không có test nào trong `npm test`.~~
  resolved: 2026-09-25 — Story 8.0 (test quét mã nguồn trong `test/luoi.test.js`: một `taoBroadcast(`, cùng định danh ở `channel:` và `.subscribe(`).
  evidence: medium. Đổi `channel: kenh` thành `taoBroadcast()` thứ hai thì mọi unit test vẫn xanh; chỉ khối hai tab của `tools/thu-bo-cuc.mjs` và README mục 37 bắt. Luật AGENTS.md cấm test adapter/khối trình duyệt nếu chủ repo chưa duyệt ngoại lệ.

- source_spec: `_bmad-output/implementation-artifacts/spec-8-1-xin-luu-tru-ben-va-noi-to-hon-khi-bi-tu-choi.md`
  summary: ~~Lượt vẽ lại sau khi `xinLuuTruBen` resolve trong `app/main.js` chỉ được ghim bằng quét chuỗi nguồn, không có ca chạy thật chứng minh dòng nhắc 3 ngày hiện ngay khi `persist()` trả `false` muộn.~~
  resolved: 2026-09-28 — Story 8.3 (khối "Story 8.1/8.2" của tools/thu-bo-cuc.mjs, ca "Story 8.1 — persist() resolve muộn (false): dòng nhắc hiện và cờ = "1" mà không tải lại"; đỏ khi gỡ `.then(() => veGiuTieuDiem(...))`).
  evidence: Bootstrap `main.js` nằm ngoài test tự động theo luật; nếu `.then` treo nhầm lời hứa, quét regex vẫn xanh. Nơi hợp lý là một ca trong `npm run thu-tay`.

## Deferred from: code review of spec-8-1-xin-luu-tru-ben-va-noi-to-hon-khi-bi-tu-choi.md (2026-09-25)

- ~~Thân AD-10 trong `ARCHITECTURE-SPINE.md` chưa ghi các chốt của Story 8.1: giá trị cờ `'1'` (khác là tắt), ngưỡng 3 ngày, không bao giờ dải băng, Q3A (state theo `persist()` dù ghi kho hỏng), xin lại mỗi lần khởi động. Spine là nguồn thắng nên các chốt này nên nằm ở AD-10, không chỉ trong comment mã.~~
  resolved: 2026-09-29 — đã có từ f348b99 (mục "Chốt khi làm (Story 8.1)" của AD-10, dòng 255–264); đối chiếu lại với `xinLuuTruBen`/`KHOA_PERSIST_DENIED` trong `core/state.js` và `BACKUP_NUDGE_DAYS_PERSIST_DENIED = 3` trong `core/limits.js`, khớp cả năm chốt, không cần sửa spine.

- source_spec: `_bmad-output/implementation-artifacts/spec-8-2-canh-bao-truoc-nguong-dung-luong.md`
  summary: ~~AGENTS.md chưa ghi ngoại lệ hẹp mới `CHON_DAI_BANG` (`main.js` khai lại `'.dai-bang'` để hỏi tiêu điểm có nằm trong dải băng không), trong khi nó là ngoại lệ thứ hai của một luật có test quét chặn.~~
  resolved: 2026-09-29 — AGENTS.md mục "Quy ước khác mặc định" đã ghi `CHON_DAI_BANG` là ngoại lệ có tên DUY NHẤT, kèm ràng buộc của `test/banner.test.js`.
  evidence: Xác minh thật — `test/banner.test.js` gỡ đúng dòng khai trước khi quét "chỉ `view/banner.js` chạm dải băng", và AGENTS.md liệt kê các ngoại lệ có tên kiểu này ở mục "Quy ước"/"Bẫy". Hoãn vì sửa file ngữ cảnh agent; làm ở lượt refresh AGENTS.md hoặc retro Epic 8.

## Deferred from: code review of spec-8-2-canh-bao-truoc-nguong-dung-luong.md (2026-09-28)

- ~~Hành vi Q5 của `kiemRoiVe` (`app/main.js:414-419`: tiêu điểm trong `.dai-bang` → neo `null` về `#o-soan`, ngoài → `undefined`) chỉ ghim bằng regex quét mã nguồn; không ca nào chạy thật việc lần kiểm gỡ hàng 7 khi `✕` đang giữ tiêu điểm, và README (d) chỉ thử bấm `✕`. Đóng bằng một wrapper export kiểu `noiLuongXoa` (vd `noiKiemDungLuong(store, goc, veTatCa)`) thử trên gốc giả sẵn có của `core-state-dung-luong.test.js`, hoặc một ca trong `npm run thu-bo-cuc`.~~
  resolved: 2026-09-28 — Story 8.3 (khối "Story 8.1/8.2" của tools/thu-bo-cuc.mjs, ca "Story 8.2 — Q5: lần kiểm gỡ hàng 7 lúc ✕ giữ tiêu điểm → tiêu điểm về #o-soan, không <body>"; đỏ khi neo `kiemRoiVe` đổi thành `undefined` trần).
- ~~Bổ sung cho mục `CHON_DAI_BANG` ở trên: AGENTS.md cũng chưa ghi ngoại lệ hàng 7 (`DUNG_LUONG_SAP_HET`) miễn khỏi luật "ghi thành công tắt dải băng" (Q3, `tatSauKhiGhi` trong `core/state.js`) — agent sau dễ "sửa" nó về `banner: null`. Làm cùng lượt refresh AGENTS.md / retro Epic 8.~~
  resolved: 2026-09-29 — AGENTS.md mục "Bẫy đã gặp" đã ghi `tatSauKhiGhi()` và ngoại lệ hàng 7 (Story 8.2 Q3); `core/state.js:655` khớp.

## Deferred from: code review of spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md (2026-09-28)

- source_spec: `_bmad-output/implementation-artifacts/spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md`
  summary: ~~Hai chỗ nối `kiemRoiVe` còn lại của 8.2 — `napRoiVe` (nạp sao lưu, `app/main.js:435-439`) và chuỗi tự lưu `mocSua.go` (`:356-358`) — chưa có ca chạy thật trong khối "Story 8.1/8.2" của `tools/thu-bo-cuc.mjs`, trái luật AGENTS.md mới thêm.~~
  resolved: 2026-09-29 — hai ca "Deferred 8.3 — napRoiVe" và "Deferred 8.3 — chuỗi tự lưu mocSua.go" trong khối 8.1/8.2 của tools/thu-bo-cuc.mjs; đột biến latRoiVe / veTatCa trần làm ca đỏ. Ca napRoiVe lộ lỗi thật: `veTatCa()` trần làm tiêu điểm ở `xóa` rơi về <body>, đã sửa thành `veGiuTieuDiem(document, veTatCa)` (APP_VERSION 0.7.10).
  evidence: Chỉ regex ghim (`test/core-state-dung-luong.test.js:705-720`, `test/chan-trang-hai-link.test.js:282-291`); đổi `noiChanTrang(store, document, napRoiVe)` thành `latRoiVe` vẫn xanh toàn bộ. Cần ca nạp file (qua `DOM.setFileInputFiles`) và ca sửa tại chỗ với stub `VUOT`/`DUOI`.
- source_spec: `_bmad-output/implementation-artifacts/spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md`
  summary: ~~Nhánh `undefined` của neo `kiemRoiVe` (`app/main.js:419`: tiêu điểm ngoài dải băng thì giữ chỗ đang đứng) không có ca chạy thật; đổi neo thành luôn `null` (giật tiêu điểm về `#o-soan`) vẫn xanh.~~
  resolved: 2026-09-29 — ca "Deferred 8.3 — kiemRoiVe (neo undefined)" trong khối 8.1/8.2 của tools/thu-bo-cuc.mjs (tiêu điểm ở `xóa` của mẩu, nhả vượt → hàng 7 hiện, tiêu điểm còn đúng mẩu + vai trò; đột biến neo `null` làm ca đỏ).
  evidence: Khối 8.3 chỉ đo nhánh `null` (Q5, tiêu điểm trên `✕`). Cần một ca: tiêu điểm trên thân/`xóa` của một mẩu, lần kiểm treo rồi nhả đổi dải băng, khẳng định tiêu điểm còn đúng mẩu + vai trò.
- source_spec: `_bmad-output/implementation-artifacts/spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md`
  summary: ~~AGENTS.md ghi ngoại lệ stub `estimate`/`persist` ở mục "Chạy và kiểm chứng", không cạnh hai ngoại lệ adapter ở "Nơi để tìm", và không trỏ nơi lưu lần duyệt (Q1 proposal 2026-09-28).~~
  resolved: 2026-09-29 — bmad-project-context thêm một câu ở dòng `app/adapters/` trỏ sang mục "Chạy và kiểm chứng"; không chép lịch sử duyệt.
  evidence: Người đọc tìm danh sách ngoại lệ "trình duyệt giả" ở "Nơi để tìm" sẽ không thấy ngoại lệ thứ ba. Hoãn vì sửa tệp ngữ cảnh agent.
- source_spec: `_bmad-output/implementation-artifacts/spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md`
  summary: ~~Luật AGENTS.md "mỗi chỗ nối mới trong main.js phải có một ca thu-bo-cuc" không nói ai chạy `npm run thu-bo-cuc` và lúc nào, trong khi nó nằm ngoài `npm test` — cổng duy nhất.~~
  resolved: 2026-09-29 — bmad-project-context thêm câu: chạy `npm run thu-bo-cuc` trước mỗi lần push chạm `app/main.js`, `app/view/` hoặc `app/style.css`; ca đỏ ngoài ca chập chờn đã biết là hồi quy, chặn push.
  evidence: Không có CI; không nói rõ thì luật không kiểm được. Gợi ý: chạy trước mỗi lần push chạm `app/main.js`. Hoãn vì sửa tệp ngữ cảnh agent.

## Deferred from: code review of spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md — lượt 2 (2026-09-28)

- source_spec: `_bmad-output/implementation-artifacts/spec-8-3-khoi-kiem-dung-luong-chay-that-trong-thu-bo-cuc.md`
  summary: ~~Ca "Story 8.1 — persist() resolve muộn" không đặt tiêu điểm/chữ vào `#o-soan` trước khi nhả, nên đổi `xinLuuTruBen().then(() => veGiuTieuDiem(...))` thành `.then(veTatCa)` trần vẫn xanh — đúng lý do chỗ nối dùng `veGiuTieuDiem` (Firefox resolve lúc Nam đang gõ) không được đo.~~
  resolved: 2026-09-29 — ca "Deferred 8.3 — persist() resolve muộn" (tiêu điểm ở `xóa` của mẩu trước khi nhả; đột biến `.then(veTatCa)` làm ca đỏ). Đề xuất gốc là focus `#o-soan` không bắt được đột biến đó (`veGiuTieuDiem` trả sớm khi tiêu điểm ngoài mọi mẩu), nên chỉ giữ làm ca phụ "chữ gõ dở còn nguyên".
  evidence: `tools/thu-bo-cuc.mjs:3180-3192` chỉ khẳng định chân trang + cờ. Cùng họ với mục nhánh `undefined` của `kiemRoiVe` ở trên. Cần: focus `#o-soan`, gõ chữ, rồi nhả `false`; khẳng định `activeElement` vẫn là `#o-soan` và giá trị còn nguyên.

## Deferred from: code review of spec-8-4-luot-ve-bat-dong-bo-khong-tha-tieu-diem-khong-ve-truoc-kho.md (2026-09-29)

- source_spec: `_bmad-output/implementation-artifacts/spec-8-4-luot-ve-bat-dong-bo-khong-tha-tieu-diem-khong-ve-truoc-kho.md`
  summary: ~~Ngoại lệ stub `estimate`/`persist` trong AGENTS.md vẫn ghi "không stub gì khác", trong khi Story 8.4 thêm đè setter `Document.prototype.title` (chỉ ghi rồi chuyển tiếp) và một `MutationObserver` trong cùng tab riêng.~~
  resolved: 2026-09-29 — bmad-project-context viết lại dòng AGENTS.md thành ba thứ đã duyệt (stub storage, `MutationObserver` tiêu đề, đè setter `title`), vẫn cấm mọi stub/đè khác.
  evidence: `tools/thu-bo-cuc.mjs:2983-3001`; README mục 8.3/8.4 có nhắc, AGENTS.md:50 thì không. Agent sau đọc AGENTS.md sẽ coi đó là vi phạm. Hoãn vì sửa tệp ngữ cảnh agent.
- source_spec: `_bmad-output/implementation-artifacts/spec-8-4-luot-ve-bat-dong-bo-khong-tha-tieu-diem-khong-ve-truoc-kho.md`
  summary: ~~JSDoc `@param neo` của `veGiuTieuDiem` (`app/main.js:170`) chỉ liệt `{ id, vaiTro: 'than'|'xoa'|'sua' } | null`, thiếu dạng `{ id: null, vaiTro: 've-hom-nay' }` mà thân chú thích đã mô tả.~~
  resolved: 2026-09-29 — JSDoc `@param neo` thành union hai nhánh, thêm `{ id: null, vaiTro: 've-hom-nay' }`.
  evidence: Có từ Story 7.1; 8.4 không chạm dòng đó.
- source_spec: `_bmad-output/implementation-artifacts/spec-7-1-dong-bo-ghi-chu-giua-cac-tab.md`
  summary: ~~Khe hồi sinh: hẹn tự lưu của tab A nổ sau lúc tab B `remove` nhưng trước lúc A nhận tin, `put` dựng lại mẩu B vừa xóa.~~
  resolved: 2026-09-29 — `noteStore.put` (`app/adapters/indexeddb.js`) nay `getKey` rồi `put` trong CÙNG một giao dịch `readwrite` và không ghi khi `id` đã mất; hợp đồng cổng ghi ở `app/ports/note-store.js`. Ca `23c` của tools/thu-tay-ban-nhap.mjs chạy kho thật (đỏ khi trả adapter về bản cũ). Mẩu vẫn nằm trong RAM của A tới khi tin của B tới, rồi bị dọn như mọi lần xóa.
  evidence: Spec 7.1 và retro Epic 7 ghi đây là giới hạn chấp nhận (dòng 153 bị `reject` vì "đổi thiết kế đã duyệt"); chủ repo duyệt mở lại 2026-09-29. Gốc ở phép ghi xuống kho chứ không ở ảnh chụp `readAll`, nên bộ đếm ghi của deferred spec-2-3/2-4 không thu hẹp được nó.
