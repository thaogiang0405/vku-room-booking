# Hướng dẫn thiết lập Firebase cho VKURoomBooking

## 1. Tạo Firebase project
Truy cập [Firebase Console](https://console.firebase.google.com/) và tạo một dự án mới.

## 2. Đăng ký Web App
- Trong Dashboard, chọn thêm ứng dụng Web (biểu tượng `</>`).
- Đặt tên cho ứng dụng và hoàn tất đăng ký.

## 3. Tạo Realtime Database
- Truy cập mục **Realtime Database** trên menu bên trái.
- Nhấn **Create Database**. Chọn server location tùy ý (khuyên dùng Asia/Singapore nếu có).

## 4. Copy Firebase configuration
- Vào Project Settings > tab General > cuộn xuống mục "Your apps".
- Copy các cấu hình (apiKey, authDomain, databaseURL, ...).

## 5. Tạo `.env.local`
- Copy file `.env.example` thành file `.env.local`.
- Điền các giá trị bạn vừa copy từ Firebase vào file `.env.local`. 
- **Lưu ý:** Không commit file `.env.local` lên Git.

## 6. Configure Realtime Database Rules

### DEVELOPMENT RULES
Trong quá trình phát triển (Development/Demo), bạn có thể dùng Rules mở (open rules) để dễ dàng kiểm thử. Vào tab **Rules** của Realtime Database và đổi thành:

```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```

> **⚠️ CẢNH BÁO: CHỈ DÙNG CHO DEVELOPMENT**
> Open rules KHÔNG an toàn và không bao giờ được dùng cho Production.

### AUTHENTICATED RULES (PRODUCTION)
Khi ứng dụng có Firebase Authentication (như từ Phase 8 trở đi), bạn bắt buộc phải đổi rules để bảo mật dữ liệu. Dưới đây là bộ rules thiết lập bảo mật cấp cao nhất ở Phase 9, sử dụng cấu trúc `bookings/{userId}/{bookingId}` và `roomSchedules/{roomId}/{date}/{bookingId}` để tối ưu hóa đọc/ghi và quyền riêng tư:

```json
{
  "rules": {
    "rooms": {
      ".read": "auth != null",
      ".write": false
    },
    "bookings": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "$bookingId": {
          ".validate": "newData.child('userId').val() === auth.uid"
        }
      }
    },
    "roomSchedules": {
      "$roomId": {
        "$date": {
          ".read": "auth != null",
          "$bookingId": {
            ".write": "auth != null && (!data.exists() ? newData.child('userId').val() === auth.uid : data.child('userId').val() === auth.uid)"
          }
        }
      }
    }
  }
}
```

> **Ghi chú Migration:** Nếu bạn có dữ liệu cũ trong `bookings/{bookingId}`, sau khi áp dụng rule mới, dữ liệu này sẽ không còn hợp lệ về mặt kiến trúc. Hãy xóa dữ liệu rác để test lại User A vs User B, hoặc viết script để migrate dữ liệu đó sang nhánh `bookings/{userId}/{bookingId}`.

## 7. Start Expo
Khởi động lại project Expo để nó nạp các biến môi trường từ `.env.local`:
```bash
npx expo start --clear
```
