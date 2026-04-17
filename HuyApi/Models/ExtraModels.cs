using System;
using System.ComponentModel.DataAnnotations;

namespace LibraryManagementAPI.Models
{
    // 1. Danh phận cho Quản lý Tiền phạt (Fines)
    public class Fine
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal Amount { get; set; } // Số tiền phạt
        public string Reason { get; set; } = string.Empty; // Lý do phạt
        public string Status { get; set; } = string.Empty; // "Đã đóng" hoặc "Chưa đóng"
    }

    // 2. Danh phận cho Đánh giá sách (Reviews)
    public class Review
    {
        public int ReviewId { get; set; }
        public int BookId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; } // Từ 1 đến 5 sao
        public string Comment { get; set; } = string.Empty;
    }

    // 3. Danh phận cho Đặt trước sách (Reservations)
    public class Reservation
    {
        public int ReservationId { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public int QueuePosition { get; set; } // Thứ tự trong hàng chờ
        public DateTime ReservedDate { get; set; } = DateTime.Now;
    }

    // 4. Danh phận cho Hệ thống Thông báo (Notifications)
    public class Notification

    {
        [Key]
        public int NotifId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } // Đã đọc hay chưa
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // 5. Danh phận cho Quản lý Nhân sự (Staffs)
    public class Staff
    {
        public string StaffId { get; set; } = string.Empty; // Ví dụ: NV001
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // Admin, Thủ thư, Bảo vệ...
        public string Shift { get; set; } = string.Empty; // Ca sáng, Ca chiều
        public string PhoneNumber { get; set; } = string.Empty;
    }
}