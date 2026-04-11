using System.ComponentModel.DataAnnotations;

namespace LibraryManagementAPI.Models
{
    public class BorrowCard
    {
        public int Id { get; set; }

        // ID của người mượn
        public int MemberId { get; set; }

        // KHAI BÁO THUỘC TÍNH NAVIGATION (Cái này là cái bị thiếu nè)
        public User? Member { get; set; }

        public int StaffId { get; set; }
        public DateTime BorrowDate { get; set; } = DateTime.Now;
        public DateTime DueDate { get; set; } = DateTime.Now.AddDays(14);
        public bool IsReturned { get; set; } = false;

        // Một phiếu mượn có nhiều dòng chi tiết sách
        public ICollection<BorrowDetail> BorrowDetails { get; set; } = new List<BorrowDetail>();
    }
}