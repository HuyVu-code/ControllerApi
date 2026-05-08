# BÁO CÁO ĐỒ ÁN MÔN HỌC
**TÊN ĐỀ TÀI: XÂY DỰNG WEBSITE BÁN SÁCH ONLINE HUYSTORE.VN**

**Sinh viên thực hiện:** Vũ Hoàng Huy
**Ngôn ngữ/Công nghệ:** ASP.NET Core Web API, HTML/CSS/JS (Vanilla), SePay API, Gemini AI.

---

## LỜI MỞ ĐẦU
Trong thời đại công nghệ số 4.0, việc mua sắm trực tuyến đang trở thành xu hướng tất yếu. Nắm bắt được nhu cầu đó, đồ án "Xây dựng Website Bán Sách Online HuyStore.vn" được phát triển nhằm mục đích mang lại trải nghiệm mua sắm trực tuyến mượt mà, tiện lợi và thông minh cho người dùng. Điểm nhấn của đồ án là việc tích hợp hệ thống thanh toán tự động (Webhook) và Trợ lý ảo AI thông minh ngay trên Website.

## CHƯƠNG 1: TỔNG QUAN HỆ THỐNG VÀ CÔNG NGHỆ

### 1.1. Kiến trúc Hệ thống
Hệ thống được thiết kế theo mô hình Client-Server, tách biệt hoàn toàn giữa Frontend và Backend:
- **Backend (Server-side):** Sử dụng **ASP.NET Core Web API** xây dựng các RESTful API xử lý logic nghiệp vụ, quản lý cơ sở dữ liệu (sách, danh mục, đơn hàng) và giao tiếp với các dịch vụ bên thứ ba (SePay API, Google Gemini).
- **Frontend (Client-side):** Xây dựng dưới dạng Single Page Application (SPA) hoặc Multi-Page linh hoạt bằng **HTML5, CSS3, Bootstrap 5 và Vanilla JavaScript**. Giao tiếp với Backend thông qua `fetch` API.

### 1.2. Các công nghệ nổi bật
- **SePay Webhook:** Tự động hóa quá trình xác nhận thanh toán chuyển khoản qua ngân hàng (TPBank) và ví điện tử (MoMo).
- **Google Gemini 1.5 Flash & NLP Local:** Tích hợp Trợ lý ảo (Chatbot) với hệ thống 2 não bộ (Cloud AI + Local AI Fallback) giúp đọc hiểu ngôn ngữ tự nhiên và tư vấn sản phẩm thời gian thực.

---

## CHƯƠNG 2: CÁC CHỨC NĂNG CHÍNH CỦA HỆ THỐNG

### 2.1. Phân hệ Khách hàng (Storefront)
- **Giao diện trang chủ (UI/UX):** Được thiết kế theo phong cách hiện đại (Modern E-commerce), tích hợp hiệu ứng Glassmorphism.
- **Danh mục và Lọc sản phẩm:** Cho phép hiển thị, tìm kiếm sách theo từ khóa (Autocomplete) và lọc theo danh mục thời gian thực.
- **Giỏ hàng (Shopping Cart):** Quản lý trạng thái giỏ hàng ngay trên LocalStorage, tính toán tổng tiền, hiển thị pop-up Mini Cart trực quan.
- **Thanh toán (Checkout v2):** Hỗ trợ thanh toán COD hoặc Chuyển khoản QR Code. Hệ thống sử dụng cơ chế **Polling API** (gọi API mỗi 3 giây) để lắng nghe biến động số dư và tự động chuyển hướng người dùng khi thanh toán thành công, không cần con người can thiệp.

### 2.2. Phân hệ Quản trị (Admin Dashboard)
- Quản lý tập trung trên một giao diện thống nhất (Admin Panel).
- **Thống kê tổng quan:** Hiển thị số lượng sách, danh mục, tổng người dùng và doanh thu.
- **Quản lý Sản phẩm & Danh mục (CRUD):** Thêm, sửa, xóa sản phẩm trực tiếp bằng Modal Bootstrap 5, giao tiếp qua ASP.NET API.
- **Quản lý Đơn hàng:** Xem chi tiết đơn hàng, địa chỉ giao hàng và trạng thái đơn hàng một cách trực quan.

### 2.3. Trợ lý Ảo Thông minh (HuyStore AI Chatbot)
Được đặt ở góc màn hình nhằm tăng tương tác với khách hàng, sở hữu **Hệ thống 2 Không Gian (Dual-Brain AI)**:
1. **Não API (Google Gemini):** Giao tiếp với API của Google để trả lời thông minh mọi câu hỏi của người dùng.
2. **Não Dự phòng (Local Fallback NLP):** Tự động kích hoạt khi API lỗi hoặc mất mạng. Bộ não này sử dụng thuật toán phân tích từ khóa nội bộ (lịch sử, tâm lý, giá rẻ, mua hàng...) để truy xuất trực tiếp vào Database sản phẩm.
3. **Dynamic Rendering:** Có khả năng trích xuất sản phẩm và render thành các "Card Sản phẩm" ngay trong khung chat (Kèm hình ảnh, giá tiền và nút Mua hàng).

---

## CHƯƠNG 3: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 3.1. Kết quả đạt được
Đồ án đã hoàn thành tốt các mục tiêu đề ra, xây dựng thành công một quy trình mua bán sách khép kín từ khâu chọn hàng, thêm vào giỏ, thanh toán tự động đến quản lý đơn hàng. Đặc biệt, việc tích hợp Trợ lý ảo AI và thanh toán Webhook đã nâng tầm chuyên nghiệp của Website, xứng đáng đạt điểm xuất sắc.

### 3.2. Hướng phát triển tương lai
- Áp dụng JWT (JSON Web Token) để nâng cao bảo mật phân quyền đăng nhập thay vì lưu LocalStorage thuần túy.
- Xây dựng hệ thống Đánh giá/Bình luận cho từng cuốn sách.
- Mở rộng thuật toán AI để gợi ý sách dựa trên lịch sử mua hàng của khách (Recommendation System).

---
*(Hết)*
