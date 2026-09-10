---
name: Ghi chú hàng ngày
description: Trang tĩnh một màn hình. Mỗi ghi chú là một mẩu giấy dán trên nền bàn ấm — vật thể đếm được, không phải dòng chảy văn bản. Một màu giấy duy nhất, không phân loại.
status: final
updated: 2026-09-10
project: Ghi chú hàng ngày
sources:
  - ../../prds/prd-ghi-chu-hang-ngay-2026-09-08/prd.md
  - ../../prds/prd-ghi-chu-hang-ngay-2026-09-08/addendum.md
colors:
  # ---- LIGHT ----
  bg: '#EFEAE0'
  paper: '#FBF3DE'
  paper-tape: '#F3E8C9'
  surface: '#FFFDF7'
  ink: '#2E2820'
  ink-2: '#6E6350'
  ink-decor: '#A79A83'
  rule: '#DCD3C2'
  focus: '#8A6A22'
  danger: '#97392C'
  chip-bg: '#E4DAC2'
  hl: '#F2DD8F'
  # ---- DARK ----
  bg-dark: '#171613'
  paper-dark: '#26241E'
  paper-tape-dark: '#2E2B23'
  surface-dark: '#1E1C18'
  ink-dark: '#E9E2D2'
  ink-2-dark: '#A79A83'
  ink-decor-dark: '#746A59'
  rule-dark: '#302D26'
  focus-dark: '#D3B269'
  danger-dark: '#D4816F'
  chip-bg-dark: '#332F26'
  hl-dark: '#4E4322'
typography:
  note:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif'
    fontSize: 14.5px
    fontWeight: '400'
    lineHeight: '1.55'
  composer:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif'
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  time:
    fontFamily: 'Consolas, "Cascadia Mono", monospace'
    fontSize: 11.5px
    fontWeight: '600'
    letterSpacing: 0.04em
  ui:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif'
    fontSize: 13px
    fontWeight: '400'
  foot:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif'
    fontSize: 11.5px
    fontWeight: '400'
rounded:
  paper: 3px
  input: 6px
  tray: 8px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 28px
  '7': 40px
  note-padding-y: 8px
  note-padding-x: 12px
  grid-gap: 8px
  page-gutter: 16px
  note-min-col: 260px
  container-max: 1040px
components:
  composer:
    background: '{colors.surface}'
    border: '1px solid {colors.rule}'
    borderRadius: '{rounded.input}'
    padding: '{spacing.3} {spacing.4}'
    minHeight: 92px
    font: '{typography.composer}'
    shadowInset: 'inset 0 1px 2px rgba(60,48,28,.07)'
    focusRing: '0 0 0 3px {colors.focus} @ 28% + border-color {colors.focus}'
  finder-tray:
    background: '{colors.chip-bg}'
    borderRadius: '{rounded.tray}'
    padding: '{spacing.3}'
    font: '{typography.ui}'
  search-input:
    background: '{colors.surface}'
    border: '1px solid {colors.rule}'
    borderRadius: '{rounded.input}'
    padding: '5px 9px'
    borderColorActive: '{colors.focus}'
  date-input:
    background: '{colors.surface}'
    border: '1px solid {colors.rule}'
    borderRadius: '{rounded.input}'
    width: 118px
    font: '{typography.time}'
    trailingIcon: 'icon lịch — inline SVG 16px, stroke {colors.ink-2}, không font icon, không tài sản ngoài. Icon DUY NHẤT của sản phẩm'
  condition-chip:
    background: '{colors.chip-bg}'
    border: '1px solid {colors.rule}'
    borderRadius: '{rounded.full}'
    padding: '3px 10px'
    color: '{colors.ink}'
  note-paper:
    background: '{colors.paper}'
    borderRadius: '{rounded.paper}'
    padding: '{spacing.note-padding-y} {spacing.note-padding-x}'
    tape: 'inset 0 3px 0 {colors.paper-tape}'
    shadow: '0 1px 0 rgba(60,48,28,.10), 0 3px 8px rgba(60,48,28,.10)'
    shadowHover: '0 1px 0 rgba(60,48,28,.12), 0 8px 18px rgba(60,48,28,.16)'
    collapsedMaxLines: 3
  note-time:
    font: '{typography.time}'
    color: '{colors.ink-2}'
  note-delete:
    font: '{typography.foot}'
    color: '{colors.ink-2}'
    borderBottom: '1px dotted {colors.ink-decor}'
    opacity: 'luôn hiện, không hover-only'
  search-mark:
    background: '{colors.hl}'
    color: '{colors.ink}'
  banner:
    background: '{colors.chip-bg}'
    borderBottom: '1px solid {colors.rule}'
    padding: '{spacing.2} {spacing.4}'
    font: '{typography.ui}'
    colorText: '{colors.ink}'
    colorAccent: '{colors.danger}'
    closeAffordance: 'dấu ✕, {colors.ink-2}'
    shadow: 'không có bóng — phân biệt bằng tông màu'
  confirm-dialog:
    background: '{colors.surface}'
    borderRadius: '{rounded.tray}'
    padding: '{spacing.5}'
    shadow: '0 12px 32px rgba(60,48,28,.24) — bóng sâu DUY NHẤT trong sản phẩm'
    placement: 'overlay rgba(0,0,0,.32), căn giữa theo chiều dọc và chiều ngang, sâu một tầng'
    destructiveColor: '{colors.danger}'
  footer-link:
    font: '{typography.foot}'
    color: '{colors.ink-2}'
    textDecoration: 'underline, offset 2px'
  theme-toggle:
    background: transparent
    border: '1px solid {colors.rule}'
    borderRadius: '{rounded.full}'
    padding: '3px 10px'
    font: '{typography.foot}'
    color: '{colors.ink-2}'
  backup-hint:
    font: '{typography.foot}'
    color: '{colors.ink-2}'
    placement: 'chân trang, cùng dòng với hai link sao lưu'
---

# Ghi chú hàng ngày — Design Spine

> `DESIGN.md` và `EXPERIENCE.md` **thắng khi xung đột** với bất kỳ mock, wireframe hay bản import nào — kể cả mock trong `mockups/` và file hướng trong `.working/`.

## Brand & Style

Sản phẩm là một cái bàn có giấy dán. Mỗi ghi chú là **một mẩu giấy**: nền riêng ấm hơn mặt bàn, bóng nhị (một lớp sát mép + một lớp tán), một dải keo sẫm ở mép trên, góc bo rất ít (`{rounded.paper}` = 3px — giấy cắt thẳng, không phải nút bấm). Ngày làm việc vì thế trở thành **một chồng vật thể đếm được**: Nam liếc một cái là biết "hôm nay tôi dán 4 mẩu", không phải đọc.

Nền bàn (`{colors.bg}`) sẫm hơn giấy để mẩu nổi lên. Ô soạn thảo và các ô nhập dùng `{colors.surface}` — sáng hơn cả giấy, phẳng, có bóng lõm nhẹ: đó là **chỗ để gõ**, không phải một mẩu giấy đã dán. Sự khác biệt vật liệu này là toàn bộ cách phân biệt "đang viết" với "đã ghi".

Không trang trí, không icon minh họa, không màu thương hiệu. Chữ và hình dạng mẩu giấy làm hết việc.

→ Hướng visual đã chốt: [`mockups/direction-sticky-note.html`](./mockups/direction-sticky-note.html) — nó minh họa nền bàn/giấy/dải keo, trạng thái rỗng, trạng thái tra cứu UJ-2 và ghi chú dài mở rộng. Ba file `direction-*` còn lại (`giay-trang`, `terminal`, `bao-chi`) là hướng **đã bị loại**, nằm ở `.working/`, giữ lại chỉ để truy vết — không link tới, không phải nguồn token.

## Colors

Hai bảng đầy đủ vì đã chốt có nút bật/tắt theme (xem `[OVERRIDE-1]` ở Do's and Don'ts).

| Token | Light | Dark | Dùng ở đâu |
|---|---|---|---|
| `{colors.bg}` | `#EFEAE0` | `#171613` | Nền bàn, sau mọi thứ |
| `{colors.paper}` | `#FBF3DE` | `#26241E` | **Màu giấy duy nhất** của mọi mẩu ghi chú |
| `{colors.paper-tape}` | `#F3E8C9` | `#2E2B23` | Dải keo 3px mép trên mẩu giấy |
| `{colors.surface}` | `#FFFDF7` | `#1E1C18` | Ô soạn thảo, ô tìm kiếm, ô ngày, hộp thoại |
| `{colors.ink}` | `#2E2820` | `#E9E2D2` | Nội dung ghi chú, bản nháp |
| `{colors.ink-2}` | `#6E6350` | `#A79A83` | **Ngưỡng chữ tối thiểu**: giờ tạo, nhãn, link chân trang, "xóa", dòng nhắc sao lưu |
| `{colors.ink-decor}` | `#A79A83` | `#746A59` | **Không bao giờ là chữ.** Chỉ gạch chân đứt, viền phụ, dấu hiệu trang trí |
| `{colors.rule}` | `#DCD3C2` | `#302D26` | Viền ô nhập, đường phân cách |
| `{colors.focus}` | `#8A6A22` | `#D3B269` | Focus ring — token **bắt buộc**, không được tắt |
| `{colors.danger}` | `#97392C` | `#D4816F` | Nhãn hành động phá dữ liệu trong hộp thoại xác nhận, chữ nhấn trên dải băng lỗi |
| `{colors.chip-bg}` | `#E4DAC2` | `#332F26` | Khay tìm kiếm, chip điều kiện, nền dải băng |
| `{colors.hl}` | `#F2DD8F` | `#4E4322` | Nền tô từ khóa khớp trong kết quả tìm |

**Tương phản đã kiểm, tính trên nền thực tế của từng token:**

| Cặp | Light | Dark |
|---|---|---|
| `{colors.ink}` trên `{colors.paper}` | 12.8:1 | 12.0:1 |
| `{colors.ink-2}` trên `{colors.paper}` | 5.3:1 | 5.6:1 |
| `{colors.ink-2}` trên `{colors.bg}` | 4.9:1 | 6.5:1 |
| `{colors.ink}` trên `{colors.hl}` | 10.5:1 | 7.6:1 |
| `{colors.danger}` trên `{colors.surface}` | 6.0:1 | 5.3:1 |
| `{colors.focus}` trên `{colors.bg}` (ngưỡng phi-chữ 3:1) | 4.2:1 | 8.9:1 |
| `{colors.danger}` trên `{colors.chip-bg}` (chữ nhấn trên dải băng) | 5.14:1 | 4.55:1 |

**Chú ý:** cặp `{colors.danger}` trên `{colors.chip-bg}` ở dark chỉ **4.55:1** — vừa đủ ngưỡng 4.5:1, gần như không còn biên. Ai đổi `{colors.chip-bg}` của dark thì **phải tính lại** cặp này trước khi commit.

Ba giá trị lệch khỏi file HTML hướng, và lệch **có lý do chứ không phải tùy ý**: `{colors.ink-2}` light (`#7A6E58` → `#6E6350`), `{colors.focus}` light (`#B08D3C` → `#8A6A22`) và `{colors.danger}` dark (`#C9705F` → `#D4816F`). Giá trị gốc không đạt ngưỡng 4.5:1 / 3:1 mà sàn accessibility đã chốt. Ngoài ra, `--ink-3` trong file HTML bị **đổi vai**: nó không đạt 4.5:1 ở cả hai theme, nên nó trở thành `{colors.ink-decor}` — trang trí, không bao giờ chữ. Mọi chữ nhỏ tụt xuống ngưỡng `{colors.ink-2}`.

**Màu không mang nghĩa.** Không có màu giấy thứ hai, không có màu theo ngày, theo độ dài, theo tuổi ghi chú. Xem Do's and Don'ts.

## Typography

System font stack, **không font ngoài**. Sản phẩm là trang tĩnh trên GitHub Pages và phải render đúng ngay cả khi không tải được tài nguyên nào ngoài HTML (NFR-4 đã chấp nhận rủi ro mất mạng; font không được là rủi ro thứ hai).

| Vai | Token | Ở đâu |
|---|---|---|
| Nội dung ghi chú | `{typography.note}` | Thân mẩu giấy |
| Bản nháp | `{typography.composer}` | Ô soạn thảo — lớn hơn 0.5px so với ghi chú, vì đây là chỗ mắt đang ở |
| Dấu thời gian | `{typography.time}` | Giờ tạo trên mẩu, ô ngày `dd/MM/yyyy`. **Monospace là dành riêng cho thời gian** — đó là cách dấu thời gian tự nhận mình là dữ liệu máy gán, không phải chữ Nam viết |
| Nhãn & điều khiển | `{typography.ui}` | Khay tìm kiếm, chip, dải băng |
| Chân trang | `{typography.foot}` | Link sao lưu/nạp lại, nút theme, "xóa", dòng nhắc sao lưu |

Không cấp display, không all-caps, không chữ nghiêng. `font-weight` chỉ có hai giá trị: 400 cho nội dung, 600 cho dấu thời gian. Xuống dòng trong ghi chú giữ nguyên (`white-space: pre-wrap`) — FR-18.

## Layout & Spacing

Thang: 4 / 8 / 12 / 16 / 20 / 28 / 40px (`{spacing.1}`…`{spacing.7}`), base 4px.

**Lưới nhiều cột.** Dòng ghi chú là một tường note 2–3 cột theo bề rộng cửa sổ, không phải một cột dọc. Mỗi mẩu ở trạng thái thu gọn có **cùng chiều cao trần 3 dòng** (`{components.note-paper.collapsedMaxLines}`), nên lưới vẫn quét được bằng một cái liếc (FR-8).

**Không breakpoint cố định.** Lưới tự chia cột bằng CSS grid auto-fill, kèm một token chặn trần chiều rộng vùng chứa:

| Thuộc tính | Giá trị |
|---|---|
| `grid-template-columns` | `repeat(auto-fill, minmax({spacing.note-min-col}, 1fr))` — tức `minmax(260px, 1fr)` |
| `gap` | `{spacing.grid-gap}` = 8px |
| `max-width` vùng chứa | `{spacing.container-max}` = **1040px**, căn giữa trang |

`{spacing.container-max}` **tồn tại để chặn 4-5 cột trên màn hình siêu rộng.** FR-8 đòi "liếc một cái quét được cả danh sách"; 5 cột thì mắt phải quét ngang quá xa và tính chất đó mất. Số học: trừ hai lề `{spacing.page-gutter}` còn 1008px nội dung — vừa đủ 3 cột (`3×260 + 2×8 = 796px`), thiếu so với 4 cột (`4×260 + 3×8 = 1064px`). Nên **trần thực tế là 3 cột**, và cửa sổ hẹp tự rớt về 2 rồi 1 cột mà không cần khai báo mốc nào.

**Siết mật độ — quyết định có ý thức.** Hướng sticky-note có mật độ thấp nhất trong bốn hướng đã render: mẩu giấy tự có padding nên tốn chiều dọc. Ba giá trị dưới đây **siết lại so với file HTML hướng**, cố ý, để một ngày họp nhiều không phải cuộn quá sớm (SM-4: với ≥300 ghi chú, khung nhìn mặc định vẫn không dài quá một màn hình):

| | File HTML hướng | Token đã chốt |
|---|---|---|
| Padding trong mẩu giấy | `{spacing.3} {spacing.4}` = 12/16px | `{spacing.note-padding-y} {spacing.note-padding-x}` = **8/12px** |
| Khe giữa hai mẩu | `{spacing.3}` = 12px | `{spacing.grid-gap}` = **8px** |
| Lề trái/phải của trang | `{spacing.6}` = 28px | `{spacing.page-gutter}` = **16px** |

Kết hợp với lưới nhiều cột, đây là hai đòn bù cho mật độ thấp của hướng. Đừng nới chúng ra lại vì "trông thoáng hơn" — chúng là câu trả lời cho SM-4.

Bố cục dọc cố định bốn tầng, không cuộn ba tầng đầu: ô soạn thảo → khay tìm kiếm + lọc ngày → lưới ghi chú (vùng cuộn duy nhất) → chân trang. Dải băng thông báo chèn vào **trên** tầng một khi có, đẩy nội dung xuống chứ không phủ lên.

→ Bốn tầng và lưới auto-fill xem ở mock [`mockups/key-hom-nay.html`](./mockups/key-hom-nay.html).

Không breakpoint mobile. Sản phẩm là desktop-only (NFR-7, §8 "không mobile"). Phóng to trình duyệt tới 200% phải còn dùng được — lưới rớt về 1 cột là chấp nhận được ở mức phóng đó.

## Elevation & Depth

Độ sâu chỉ tồn tại để nói **"đây là một mẩu giấy rời"**, không để xếp thứ bậc.

- **Mẩu giấy** — bóng nhị: `0 1px 0 rgba(60,48,28,.10)` (lớp sát mép, làm giấy có bề dày) + `0 3px 8px rgba(60,48,28,.10)` (lớp tán, làm giấy rời khỏi bàn). Hover: lớp tán sâu lên `0 8px 18px rgba(60,48,28,.16)` — mẩu giấy nhấc lên.
- **Dark** — bóng đổi sang `rgba(0,0,0,.45)` / `0 4px 12px rgba(0,0,0,.35)`; lớp sát mép thay bằng một hairline sáng phía trên (highlight) vì bóng đen trên nền đen không đọc được.
- **Ô soạn thảo** — bóng **lõm** `inset 0 1px 2px`, ngược chiều với mẩu giấy. Chỗ gõ lún xuống, chỗ đã ghi nhô lên.
- **Hộp thoại xác nhận xóa** — bóng sâu duy nhất trong app (`0 12px 32px`). Đây là phần tử duy nhất được phép nổi lên trên mọi thứ khác.

Không dùng bóng cho dải băng thông báo, chip, hay khay tìm kiếm — chúng phân biệt bằng tông màu (`{colors.chip-bg}`), không bằng độ cao.

## Shapes

| Token | Giá trị | Ở đâu | Vì sao |
|---|---|---|---|
| `{rounded.paper}` | 3px | Mẩu giấy | Giấy cắt thẳng. Bo nhiều hơn thì thành card, thành nút — mất ẩn dụ vật liệu |
| `{rounded.input}` | 6px | Ô soạn thảo, ô tìm kiếm, ô ngày | Ô nhập là phần tử UI, được phép mềm hơn giấy |
| `{rounded.tray}` | 8px | Khay tìm kiếm, hộp thoại | Vật chứa, mềm nhất trong ba cấp |
| `{rounded.full}` | 9999px | Chip điều kiện, nút theme | Chỉ hai chỗ này. Chip tròn hoàn toàn để không thể lẫn với mẩu giấy |

Không hình tròn, không pill cho bất cứ gì khác.

## Components

| Component | Anatomy & spec |
|---|---|
| **Ô soạn thảo** | `{components.composer}`. `{colors.surface}` + bóng lõm, viền `{colors.rule}`, min-height 92px, tự cao thêm theo nội dung. Placeholder **trống hoàn toàn** — con trỏ nhảy là tín hiệu duy nhất. Dưới ô: một dòng `{typography.foot}` màu `{colors.ink-2}` ghi `Ctrl+Enter để chốt`. Focus: viền `{colors.focus}` + ring 3px |
| **Khay tìm kiếm** | `{components.finder-tray}`. Nền `{colors.chip-bg}` — **sẫm hơn nền bàn**, đây là cách duy nhất tách nó khỏi ô soạn thảo sáng phía trên. Chứa nhãn `tìm` + ô từ khóa (giãn nở) và nhãn `ngày` + ô ngày (cố định 118px) |
| **Ô ngày** | `{components.date-input}`. Chữ monospace, placeholder `dd/MM/yyyy`. Ở mép phải: **icon lịch — inline SVG 16px, stroke `{colors.ink-2}`**, không font icon và không tải tài sản ngoài (sản phẩm là trang tĩnh, phải chạy được không phụ thuộc mạng sau khi tải — cùng lý do với system font stack). Đây là **icon duy nhất trong toàn sản phẩm**; nó mở picker. Sai định dạng: viền `{colors.danger}` + thông báo dưới ô |
| **Chip điều kiện** | `{components.condition-chip}`. Một chip cho mỗi điều kiện đang bật. Hàng chip có thêm số kết quả (`{typography.ui}`, `{colors.ink-2}`) và link "về hôm nay" gạch chân, đẩy sang phải |
| **Mẩu giấy** | `{components.note-paper}`. Đầu mẩu: giờ tạo bên trái, "xóa" bên phải. Thân: `{typography.note}`, thu gọn ở 3 dòng, có dòng `còn N dòng ▾` màu `{colors.ink-2}` khi bị cắt. Mở rộng: `▴ thu lại`. Chế độ sửa: nền đổi sang `{colors.surface}` và viền `{colors.focus}` — mẩu giấy tạm "lún xuống" thành chỗ gõ, mượn đúng ngôn ngữ vật liệu của ô soạn thảo |
| **Nút xóa** | `{components.note-delete}`. Chữ thường, `{colors.ink-2}`, gạch chân đứt `{colors.ink-decor}`. **Luôn hiện trên mọi mẩu**, không hover-only. Hover/focus: đổi sang `{colors.danger}` |
| **Tô từ khóa** | `{components.search-mark}`. Nền `{colors.hl}`, chữ giữ `{colors.ink}`. Chỉ xuất hiện trong kết quả tìm |
| **Dải băng thông báo** | `{components.banner}`. Một dải duy nhất, đỉnh trang, full-width, nền `{colors.chip-bg}`, viền dưới `{colors.rule}`. Chữ nhấn `{colors.danger}` (tương phản đã kiểm ở Colors). Nút đóng là **dấu `✕`** màu `{colors.ink-2}` — vì là ký hiệu chứ không phải chữ, nó **phải có nhãn cho trợ giúp tiếp cận** (xem `EXPERIENCE.md.Accessibility Floor`). **Không** bóng, **không** icon nào khác, **không** biến thể màu theo loại lỗi — mọi loại thông báo dùng chung đúng một hình dạng. Xem [`mockups/key-canh-bao.html`](./mockups/key-canh-bao.html) |
| **Hộp thoại xác nhận xóa** | `{components.confirm-dialog}`. Nền `{colors.surface}`, overlay `rgba(0,0,0,.32)`, **căn giữa theo chiều dọc** (và chiều ngang) trong khung nhìn. Bóng `0 12px 32px` là **bóng sâu duy nhất trong sản phẩm** — dải băng không có bóng, nên độ sâu này chỉ có đúng một nghĩa. Hai lựa chọn ngang hàng dạng chữ: "hủy" (`{colors.ink}`) và "xóa" (`{colors.danger}`). Không nút màu đầy. Xem [`mockups/key-canh-bao.html`](./mockups/key-canh-bao.html) |
| **Link chân trang** | `{components.footer-link}`. Hai link `xuất sao lưu` · `nạp lại`, `{colors.ink-2}`, gạch chân offset 2px. Thường trực, không bao giờ ẩn |
| **Nút theme** | `{components.theme-toggle}`. Viền mảnh `{rounded.full}`, nhãn chữ (`nền tối` / `nền sáng`). Góc phải chân trang. Không icon mặt trời/mặt trăng |
| **Dòng nhắc sao lưu** | `{components.backup-hint}`. Một dòng `{typography.foot}` màu `{colors.ink-2}` ở chân trang, cùng dòng hai link. Không nền, không viền, không nút tắt |

## Do's and Don'ts

| Do | Don't |
|---|---|
| **Đúng một `{colors.paper}` cho mọi mẩu giấy** | Màu giấy thứ hai — theo ngày, theo tuổi, theo độ dài, theo bất cứ gì. `[OVERRIDE-0]` không tồn tại: PRD §8 cấm màu mang nghĩa phân loại (NT-2) và hướng sticky-note tuân thủ tuyệt đối |
| Phân biệt vật liệu: giấy nhô lên, chỗ gõ lún xuống | Dùng bóng để xếp thứ bậc giữa các mẩu giấy |
| Chỉ chuyển màu nhẹ khi hover/focus, ≤ 120ms | Animation khi ghi chú vào/ra danh sách. **Không có** — mẩu bị xóa biến mất đột ngột, đánh đổi đã chấp nhận |
| Tôn trọng `prefers-reduced-motion`: bỏ luôn cả chuyển màu | Coi reduced-motion là tùy chọn |
| Focus ring `{colors.focus}` nhìn thấy được trên mọi phần tử tương tác | `outline: none` ở bất cứ đâu. Đây là đường duy nhất của người dùng bàn phím, vì đã chốt không thêm phím tắt |
| Mọi chữ ≥ 4.5:1 ở **cả** light và dark; chữ nhỏ nhất dùng `{colors.ink-2}` | Dùng `{colors.ink-decor}` cho chữ |
| System font stack | Google Fonts, webfont, icon font, bất kỳ tài nguyên mạng nào |
| Nút xóa luôn hiện, mờ nhạt | Hover-only affordance |
| Dải băng thông báo: một chỗ, một hình dạng, nhiều loại nội dung | Toast, hộp thoại chặn đường, hoặc dải băng riêng cho từng loại lỗi |
| Placeholder ô soạn thảo trống hoàn toàn | "Hôm nay bạn nghĩ gì?", "Nhập ghi chú…", hình minh họa chào mừng |
| Giữ padding/khe đã siết ở Layout & Spacing | Nới ra cho "thoáng" — nó phá SM-4 |
| **Icon lịch trong ô ngày là icon DUY NHẤT được phép trong toàn sản phẩm** — inline SVG 16px, stroke `{colors.ink-2}`. Mọi affordance khác đều là **chữ** | Thêm bất kỳ icon nào khác — cho trạng thái, hành động, điều hướng, hay theme. Font icon hoặc icon tải từ mạng, kể cả cho icon lịch |
| Nút đóng dải băng là dấu `✕`, **kèm nhãn cho trợ giúp tiếp cận** vì nó là ký hiệu | Dấu `✕` trần không nhãn |
| Bóng sâu chỉ ở hộp thoại xác nhận xóa | Cho dải băng, chip, hay khay tìm kiếm một cái bóng |

### Ba `[OVERRIDE]` so với PRD, ghi tường minh

- **`[OVERRIDE-1]` Nút bật/tắt theme.** PRD §8 / NT-1: *"không trang cài đặt, không tùy chọn người dùng."* Nút theme ở chân trang **là** một tùy chọn người dùng, và DESIGN.md định nghĩa đủ hai bảng màu để phục vụ nó. Người dùng đã xác nhận coi đây là ngoại lệ chấp nhận được: nền ấm là hướng "chói mắt cạnh IDE tối" nhất trong bốn hướng, và bản dark là cách giải quyết duy nhất không đổi hướng visual.
- **`[OVERRIDE-2]` Tab title có số ghi chú.** Tiêu đề tab là `4 - Ghi chú hàng ngày`. Biên với PRD §8 *"không nhắc nhở, không thông báo"* — một con số đổi liên tục trên thanh tab hoạt động gần giống badge thông báo. Lý do giữ: UJ-1 phụ thuộc vào việc Nam bấm đúng tab giữa một rừng tab. Người dùng đã được nêu rõ và giữ lựa chọn. Chi tiết hành vi ở `EXPERIENCE.md`.
- **Không có override thứ ba.** Cụ thể: **icon picker lịch phụ trong bộ lọc ngày không phải override.** NT-3 loại các *mốc nhanh* kiểu "hôm nay / 7 ngày qua / tháng này" vì chúng phục vụ hành vi duyệt xem. Picker ở đây là đường phụ để nhập **đúng một ngày cụ thể** khi Nam không nhớ rõ định dạng — đường chính vẫn là gõ tay `dd/MM/yyyy`. Nó không mở ra chế độ duyệt xem nào.
