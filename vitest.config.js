export default {
  test: {
    include: ['test/**/*.test.js'],
    // Múi giờ của suite bị GHIM, và ghim vào một múi lệch NỬA GIỜ có chủ ý.
    //
    // `nowIso()` tự dựng hậu tố offset từ `getTimezoneOffset()`: đảo dấu, hay hoán hai vế của
    // phép chia/chia dư cho số phút một giờ, đều cho ra một chuỗi vẫn đúng hình dạng. Trên một
    // máy chạy ở UTC thì mọi cách viết sai đó đều ra `+00:00` và test xanh hết. `Asia/Kolkata`
    // là `+05:30`: giờ khác phút, và dấu dương phân biệt được với dấu âm.
    //
    // Không test nào khác phụ thuộc múi giờ máy — `daysBetween` neo ở UTC giữa trưa, và
    // `localStamp`/`localDate` chỉ cắt chuỗi.
    env: { TZ: 'Asia/Kolkata' },
  },
};
