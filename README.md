# EduTest Pro

EduTest Pro là hệ thống thi và quản lý học tập trực tuyến dành cho môi trường trường học, trung tâm và lớp học nhỏ. Dự án được xây dựng theo mô hình full-stack, gồm frontend React/Vite cho giao diện người dùng và backend Express/MongoDB cho xác thực, quản lý dữ liệu, tổ chức thi và giao tiếp thời gian thực.

## Tổng quan

Ứng dụng tập trung vào 3 nhóm người dùng chính:

- `student`: tham gia lớp học, làm bài thi, xem kết quả, theo dõi thông báo và trao đổi trong lớp
- `teacher`: tạo ngân hàng câu hỏi, biên soạn đề thi, quản lý lớp, xem thống kê kết quả học sinh
- `admin`: quản lý người dùng, phân quyền, theo dõi số liệu hệ thống, cấu hình và duyệt tài khoản giáo viên

Ngoài ra hệ thống còn có vai trò `mod` để hỗ trợ rà soát nội dung cần duyệt.

## Chức năng chính

### Xác thực và phân quyền

- Đăng ký và đăng nhập bằng email/mật khẩu
- Đăng nhập Google OAuth
- Quản lý phiên đăng nhập bằng `JWT` lưu trong cookie
- Kiểm soát truy cập theo vai trò với middleware `protect` và `authorize`
- Giáo viên tự đăng ký sẽ ở trạng thái `pending` để chờ quản trị viên phê duyệt

### Quản lý người dùng

- Hồ sơ người dùng cho học sinh, giáo viên và quản trị viên
- Khóa hoặc mở khóa tài khoản
- Cập nhật thông tin cá nhân và đổi mật khẩu
- Phân loại theo trường, khối, lớp, bộ môn hoặc khoa/phòng ban

### Quản lý lớp học

- Tạo lớp học với mã lớp riêng
- Học sinh tham gia lớp bằng mã
- Luồng chờ duyệt học sinh vào lớp
- Gán giáo viên chủ nhiệm, giáo viên phụ trách và danh sách học sinh
- Import danh sách học sinh từ tệp

### Ngân hàng câu hỏi

- Tạo, sửa, xóa câu hỏi đơn lẻ hoặc hàng loạt
- Hỗ trợ nhiều loại câu hỏi:
  - `Trắc nghiệm`
  - `Tự luận`
  - `Đúng/Sai`
  - `Điền từ`
  - `Tương tác`
- Phân loại theo môn học, khối lớp, độ khó, danh mục và tag
- Hỗ trợ nội dung công thức toán với `LaTeX` và hiển thị bằng `KaTeX`
- Cho phép đánh dấu câu hỏi cần rà soát và xử lý review
- Có khả năng import/export dữ liệu câu hỏi phục vụ biên soạn nhanh

### Quản lý đề thi

- Tạo đề thi thủ công từ ngân hàng câu hỏi
- Tạo đề có tệp đính kèm
- Gắn đề thi cho lớp hoặc học sinh cụ thể
- Quản lý trạng thái đề: `Draft`, `Published`, `Archived`
- Hỗ trợ nhiều kiểu đề:
  - `Standard`
  - `Interactive`
  - `Competency`
  - `Matrix`
- Hỗ trợ cấu hình sinh câu hỏi ngẫu nhiên từ ngân hàng theo môn, khối, độ khó, tag và danh mục
- Hỗ trợ cấu hình chấm điểm, gồm cả trừ điểm câu sai và điểm đạt
- Lưu lịch sử làm bài, số lần làm, điểm số, số câu đúng và thời gian làm bài

### Làm bài và xem kết quả

- Học sinh xem danh sách đề được giao
- Làm bài trực tiếp trên giao diện web
- Chấm điểm và lưu lượt làm
- Xem chi tiết kết quả theo từng lần nộp
- Dashboard riêng cho học sinh để theo dõi tiến độ và kết quả

### Thông báo và trao đổi

- Thông báo khi có yêu cầu vào lớp, duyệt lớp, đề mới hoặc kết quả
- Đánh dấu đã đọc, đánh dấu tất cả đã đọc, xóa thông báo
- Chat theo lớp học với `Socket.IO`
- Hỗ trợ các luồng chat:
  - cộng đồng lớp
  - giáo viên với học sinh
  - học sinh với học sinh
- Có cơ chế ghim tin nhắn và đồng bộ thời gian thực

### Quản trị và báo cáo

- Quản lý người dùng và trạng thái tài khoản
- Thống kê tổng số người dùng, giáo viên, học sinh, đề thi, câu hỏi
- Tổng hợp dữ liệu lượt làm bài theo ngày, tuần, môn học, khối, trường và lớp
- Khu vực cài đặt hệ thống cho quản trị viên

## Kiến trúc dự án

Ứng dụng được chia thành 2 phần chính:

### Frontend

- Xây dựng bằng `React 19` và `Vite`
- Điều hướng bằng `react-router-dom`
- Gọi API bằng `axios`
- Có `AuthContext`, `ThemeContext`, `ToastContext`
- Tách giao diện theo từng nhóm người dùng:
  - `src/pages/public`
  - `src/pages/student`
  - `src/pages/teacher`
  - `src/pages/admin`

### Backend

- Xây dựng bằng `Express 5`
- Dùng `MongoDB` với `Mongoose`
- Tổ chức theo mô hình `routes -> controllers -> models`
- Có middleware xác thực, phân quyền, chống CSRF và sanitize dữ liệu đầu vào
- Tích hợp `Socket.IO` cho tính năng chat và cập nhật thời gian thực

## Mô hình dữ liệu chính

Các entity quan trọng trong hệ thống:

- `User`: thông tin tài khoản, vai trò, trạng thái, trường/lớp/bộ môn
- `Classroom`: lớp học, giáo viên, học sinh, danh sách chờ duyệt, mã tham gia
- `Question`: nội dung câu hỏi, đáp án, mức độ khó, danh mục, tag, trạng thái review
- `Exam`: thông tin đề thi, danh sách câu hỏi, cấu hình ngẫu nhiên, cấu hình chấm điểm, lịch sử làm bài
- `Notification`: thông báo gửi tới người dùng
- `Message`: dữ liệu chat trong lớp học
- `Category`: phân loại câu hỏi
- `ExamFolder`: nhóm đề thi theo thư mục
- `Setting`: cấu hình hệ thống

## Công nghệ sử dụng

### Frontend

- `React`
- `Vite`
- `Axios`
- `React Router`
- `Socket.IO Client`
- `Recharts`
- `KaTeX`
- `react-pdf`
- `react-qr-code`

### Backend

- `Express`
- `Mongoose`
- `JWT`
- `bcryptjs`
- `cookie-parser`
- `cors`
- `helmet`
- `express-rate-limit`
- `multer`
- `Socket.IO`
- `google-auth-library`

### Xử lý tệp và nội dung

- `xlsx` để đọc/ghi bảng dữ liệu
- `mammoth` để trích xuất nội dung từ `DOCX`
- `pdf-parse` để đọc dữ liệu từ `PDF`

## Cấu trúc thư mục

```text
edutest-pro/
├─ src/                    # Frontend React
│  ├─ components/          # Component dùng chung và layout
│  ├─ context/             # Context xác thực, theme, toast
│  ├─ pages/               # Màn hình public, student, teacher, admin
│  └─ services/            # API client và socket client
├─ server/                 # Backend Express
│  ├─ controllers/         # Xử lý nghiệp vụ
│  ├─ middleware/          # Xác thực, phân quyền
│  ├─ models/              # Schema Mongoose
│  ├─ routes/              # Định nghĩa API
│  ├─ scripts/             # Script tiện ích như tạo admin
│  └─ uploads/             # Tệp tải lên
├─ public/                 # Tài nguyên tĩnh frontend
└─ README.md
```

## Cấu hình môi trường

### Frontend

Frontend đọc biến môi trường từ file `.env` ở thư mục gốc. Hiện dự án đang dùng:

```env
VITE_API_URL=http://localhost:5000/api
```

Nếu backend chạy ở domain khác, cập nhật `VITE_API_URL` tương ứng.

### Backend

Tạo file `server/.env` từ `server/.env.example`:

```bash
copy server\.env.example server\.env
```

Các biến quan trọng:

- `PORT`: cổng backend, mặc định `5000`
- `NODE_ENV`: môi trường chạy
- `MONGODB_URI`: chuỗi kết nối MongoDB
- `JWT_SECRET`: khóa ký JWT
- `CORS_ORIGIN`: danh sách origin được phép truy cập, ngăn cách bằng dấu phẩy
- `FRONTEND_URL`: URL frontend để redirect sau đăng nhập Google
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

## Yêu cầu hệ thống

- `Node.js` bản LTS
- `npm`
- `MongoDB` local hoặc `MongoDB Atlas`

## Cài đặt và chạy local

### 1. Cài backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`.

### 2. Cài frontend

Mở terminal khác tại thư mục gốc dự án:

```bash
npm install
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

### 3. Chạy backend từ thư mục gốc

Nếu muốn gọi nhanh backend từ thư mục gốc, có thể dùng:

```bash
npm run server
```

## Tạo tài khoản quản trị đầu tiên

Sau khi cấu hình `server/.env`, có thể tạo hoặc cập nhật tài khoản admin mặc định bằng script:

```bash
cd server
npm run seed:admin
```

Script sẽ dùng các biến:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

Nếu tài khoản đã tồn tại, script sẽ cập nhật lại quyền `admin`, trạng thái `active` và mật khẩu.

## Luồng sử dụng chính

### Học sinh

1. Đăng ký hoặc đăng nhập
2. Tham gia lớp bằng mã
3. Chờ giáo viên duyệt
4. Nhận đề được giao
5. Làm bài và xem kết quả
6. Theo dõi thông báo và trao đổi trong lớp

### Giáo viên

1. Đăng ký tài khoản giáo viên
2. Chờ quản trị viên phê duyệt
3. Tạo câu hỏi và xây ngân hàng đề
4. Tạo lớp học, duyệt học sinh vào lớp
5. Giao đề thi và theo dõi thống kê kết quả

### Quản trị viên

1. Quản lý tài khoản
2. Duyệt giáo viên
3. Theo dõi số liệu vận hành
4. Quản lý cấu hình và các danh mục hệ thống

## API chính

Các nhóm API hiện có trên backend:

- `/api/auth`: đăng ký, đăng nhập, hồ sơ, đổi mật khẩu, Google OAuth
- `/api/users`: quản lý người dùng
- `/api/questions`: quản lý ngân hàng câu hỏi
- `/api/exams`: quản lý đề thi, nộp bài, thống kê
- `/api/classrooms` và `/api/classes`: quản lý lớp học
- `/api/categories`: quản lý danh mục
- `/api/notifications`: thông báo người dùng
- `/api/chat`: nhắn tin trong lớp
- `/api/admin`: thống kê và cài đặt quản trị
- `/api/teachers`: dashboard và nghiệp vụ giáo viên
- `/api/exam-folders`: phân nhóm đề thi

## Bảo mật và kiểm soát truy cập

Hệ thống đã có một số lớp bảo vệ cơ bản:

- Cookie `httpOnly` cho access token
- Cookie CSRF riêng và header `X-CSRF-Token` cho request thay đổi dữ liệu
- `helmet` để tăng cường header bảo mật
- `express-rate-limit` để giới hạn tần suất request
- Middleware sanitize đầu vào để giảm rủi ro chèn toán tử Mongo
- Phân quyền theo vai trò ở tầng route

## Trạng thái dự án

Đây là một codebase đang ở mức triển khai thực tế cho bài toán thi trực tuyến và quản lý lớp học. Hệ thống đã có đủ các phân hệ cốt lõi cho đăng nhập, phân quyền, quản lý lớp, quản lý câu hỏi, tổ chức thi, chấm điểm, báo cáo và chat thời gian thực, đồng thời vẫn còn dư địa để tiếp tục hoàn thiện kiểm thử, tài liệu API và quy trình triển khai production.
