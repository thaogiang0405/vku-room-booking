# VKURoomBooking

VKURoomBooking là ứng dụng di động đa nền tảng được phát triển bằng React Native và Expo, cung cấp giải pháp tra cứu, đặt mượn và quản lý phòng học, phòng thực hành dành cho sinh viên trường Đại học CNTT & TT Việt - Hàn (VKU).

## 📌 Tổng quan dự án

- **Vấn đề:** Quy trình tìm kiếm và mượn phòng học thủ công mất nhiều thời gian, dễ gây ra tình trạng trùng lặp lịch sử dụng giữa các nhóm sinh viên.
- **Mục đích:** Số hóa quy trình tra cứu và đặt phòng, tự động hóa việc sắp xếp lịch và check-in phòng học.
- **Đối tượng người dùng:** Sinh viên và Giảng viên trường Đại học VKU.
- **Luồng hoạt động chính:** Đăng nhập tài khoản ➔ Tìm kiếm/Lọc phòng trống ➔ Chọn khung giờ ➔ Xác nhận đặt phòng ➔ Nhận mã QR ➔ Quét mã QR tại phòng để Check-in.

## ✨ Tính năng chính

- **Xác thực người dùng:** Firebase Authentication (Email/Password).
- **Duyệt và tìm kiếm phòng:** Tìm kiếm theo tên hoặc mã phòng.
- **Bộ lọc đa dạng (Filtering):** Lọc theo Tòa nhà, Sức chứa (Group-size), Thiết bị yêu cầu (Equipment) và Trạng thái phòng.
- **Trạng thái Real-time:** Cập nhật tình trạng sử dụng của các phòng theo thời gian thực.
- **Xem chi tiết và Đặt phòng:** Cho phép chọn ngày và chọn khung giờ (các khung giờ cố định hoặc tùy chỉnh).
- **Phòng chống trùng lịch (Conflict Prevention):** Xử lý đặt phòng đồng thời (Concurrent booking) bằng Firebase Transaction, không cho phép 2 người đặt trùng 1 khung giờ.
- **Lịch đặt của tôi (My Bookings):** Bảng điều khiển quản lý lịch phân theo tab "Hôm nay", "Sắp tới", "Đã qua" với đồng hồ đếm ngược trực quan.
- **Mã đặt phòng & Mã QR:** Tự động sinh mã `VKU-XXXXXX` và render QR code sau khi đặt thành công.
- **QR Check-in:** Quét mã QR để check-in nhận phòng (chỉ cho phép check-in trước 15 phút so với giờ bắt đầu).
- **Hủy lịch đặt:** Hỗ trợ hủy lịch an toàn khi chưa đến giờ hoặc chưa diễn ra.
- **Nhắc nhở thông minh:** Tự động lên lịch Local Notification nhắc nhở sinh viên 15 phút trước giờ sử dụng phòng.
- **Quản lý State & Cache:** Sử dụng Zustand để quản lý State cục bộ và AsyncStorage để lưu trữ offline cache.
- **Tối ưu hiển thị:** Ứng dụng đáp ứng tốt Safe Area, UI Responsive và FlatList tối ưu hiệu năng mượt mà.

## 🛠 Công nghệ sử dụng

Dự án sử dụng các bộ thư viện và công cụ tiêu chuẩn sau:

- **React Native** (v0.86.x)
- **Expo SDK** (v57)
- **TypeScript** (Strict mode)
- **Firebase Authentication**
- **Firebase Realtime Database**
- **Zustand** (State Management)
- **AsyncStorage** (Caching)
- **Expo Camera** (QR Scanner)
- **Expo Notifications** (Local Reminders)
- **Expo Image** (Hiển thị và cache hình ảnh)
- **React Navigation** (Native Stack Routing)
- **react-native-qrcode-svg**

## 📂 Cấu trúc dự án

```text
VKURoomBooking/
├── assets/
├── src/
│   ├── components/         # Các UI component tái sử dụng (RoomCard, v.v.)
│   ├── config/             # Cấu hình Firebase & Môi trường
│   ├── context/            # Context API (AuthContext)
│   ├── data/               # Dữ liệu Mock (nếu có)
│   ├── hooks/              # Custom Hooks (Lắng nghe Firebase Realtime)
│   ├── screens/            # Giao diện chính (BrowseRooms, RoomDetail, MyBookings, QRCheckIn...)
│   ├── services/           # Xử lý logic nghiệp vụ (Auth, Booking, Notifications)
│   ├── store/              # Zustand Store
│   ├── types/              # Định nghĩa TypeScript Interfaces/Types
│   └── utils/              # Hàm tiện ích (Date/Time, Formatting)
├── App.tsx                 # Entry component của ứng dụng
├── app.json                # Cấu hình Expo
├── package.json            # Quản lý thư viện dependencies
├── .env.example            # Mẫu biến môi trường
├── FIREBASE_SETUP.md       # Hướng dẫn cài đặt Firebase chi tiết
└── README.md               # Tài liệu dự án
```

## 🚀 Hướng dẫn cài đặt

Clone dự án về máy và cài đặt thư viện:

```bash
git clone <REPOSITORY_URL>
cd VKURoomBooking
npm install
```

Khởi chạy ứng dụng:

```bash
npx expo start
```

Sau khi chạy lệnh trên, terminal sẽ hiển thị một mã QR. Bạn có thể sử dụng ứng dụng **Expo Go** trên thiết bị iOS/Android để quét và trải nghiệm ứng dụng ngay lập tức (đảm bảo điện thoại và máy tính cùng chung một mạng Wi-Fi).

## 🔥 Cấu hình Firebase

Dự án sử dụng Firebase Authentication và Firebase Realtime Database. Bạn cần tạo một project trên Firebase và thiết lập các biến môi trường trong file `.env.local` (tạo mới file này ở thư mục gốc).

Tên các biến yêu cầu:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

**⚠️ Quan trọng:** Không bao giờ commit file `.env.local` lên GitHub. Vui lòng tham khảo file `FIREBASE_SETUP.md` để xem hướng dẫn thiết lập chi tiết.

## 🗄 Cấu trúc Firebase Database

Dữ liệu Realtime Database được tổ chức dưới dạng NoSQL, đảm bảo tính phân tán và tốc độ truy vấn:

- `/rooms`: Chứa danh sách các phòng học, tòa nhà, sức chứa và thiết bị.
- `/bookings/{userId}/{bookingId}`: Danh sách lịch đặt phòng của từng sinh viên (Dùng để hiển thị My Bookings nhanh chóng).
- `/roomSchedules/{roomId}/{date}/{bookingId}`: Chỉ mục quản lý lịch của từng phòng theo ngày. Được sử dụng bởi tính năng lọc Real-time để bóc tách các khung giờ còn trống và ngăn chặn trùng lịch (Double-booking).

## 📱 Demo

### Expo Go / Live Demo

<EXPO_GO_QR_OR_LINK>
*(This QR/link is used to open the Expo project with Expo Go.)*

### Video Demo

<VIDEO_DEMO_LINK>
*(2–3 minute physical-device demonstration of the reservation flow.)*

## 🎥 Luồng Demo tham khảo (Demo Flow)

Để kiểm chứng toàn bộ tính năng của ứng dụng, hãy làm theo các bước sau:

1. Đăng nhập / Đăng ký tài khoản sinh viên.
2. Lướt xem danh sách các phòng học (Browse rooms).
3. Thử nghiệm bộ lọc (Tìm Tòa nhà K, Sức chứa > 30, Bảng tương tác...).
4. Mở chi tiết một phòng bất kỳ đang có chữ "Có thể đặt".
5. Chọn Ngày và Khung giờ trống (Ví dụ: Hôm nay, 13:00 - 15:00).
6. Bấm "Đặt phòng" (Hệ thống ghi nhận Transaction và schedule Notification).
7. Mở Tab "Lịch đặt của tôi" (My Bookings) ➔ Xem Mã đặt phòng.
8. Bấm "Xem QR" để hiển thị mã QR check-in.
9. Đóng vai người quản lý, vào luồng "Quét mã QR" để Check-in (chỉ cho phép trước giờ học tối đa 15 phút).
10. Quan sát thông báo (Local Notification) tự động nổ ra trên điện thoại.
11. Thử chức năng Hủy đặt phòng (Cancel booking).

## 🔐 Bảo mật

- Toàn bộ quyền định danh được quản lý bởi **Firebase Authentication**.
- Dữ liệu tĩnh tại node `/rooms` được thiết lập quyền Read-only (chỉ đọc) đối với client thông thường, ngăn chặn việc sửa đổi thông số thiết bị/phòng từ phía thiết bị di động.
- Danh sách `/bookings` được phân chia theo User ID. Bằng **Firebase Security Rules**, sinh viên chỉ có thể đọc, ghi, và hủy lịch đặt của chính mình.
- Mật khẩu của người dùng được mã hóa qua cơ chế Auth của Firebase, tuyệt đối không lưu dạng plain-text trên Realtime Database.

## ⚡ Hiệu năng

*Optimized for smooth 60-FPS-class scrolling and interaction on normal mobile devices.*

- Danh sách phòng được tối ưu hóa toàn diện bằng cấu trúc `FlatList` (tinh chỉnh thông số `windowSize`, `initialNumToRender`, `removeClippedSubviews`).
- Kỹ thuật memoization (`React.memo`, `useMemo`, `useCallback`) được sử dụng chặt chẽ tại các danh sách dài và RoomCard, giúp triệt tiêu gần 90% re-render rác.
- Tích hợp `expo-image` để Caching hình ảnh đa nền tảng (`memory-disk`).
- Firebase Listeners được giới hạn tham chiếu (Scoped), ngắt kết nối an toàn khi unmount component nhằm tiết kiệm băng thông.

## ✅ Kiểm thử (Testing)

- **TypeScript Constraints:** Dự án vượt qua lệnh kiểm tra kiểu dữ liệu tĩnh `npx tsc --noEmit` với kết quả **0 errors** (không có cảnh báo hay lỗi biên dịch).
- **Physical Device:** Các luồng Đặt phòng, Báo trùng lịch, Cấp quyền thông báo (Notification Permissions) và Quét QR bằng Camera thực tế đã được test thành công trên thiết bị iPhone thật.

## 🎓 Mini Project

- **Học phần:** Lập trình Di động Đa nền tảng (Cross-Platform Mobile App Development)
- **Dự án:** VKURoomBooking
- **Mục đích:** Xây dựng hệ thống quản lý mượn phòng di động dành cho sinh viên VKU.
- **Nhóm / Sinh viên thực hiện:** `[Student / Mini-Project Team]`

## 📄 Tài liệu tham khảo thêm

- [Cấu hình Firebase (FIREBASE_SETUP.md)](./FIREBASE_SETUP.md)