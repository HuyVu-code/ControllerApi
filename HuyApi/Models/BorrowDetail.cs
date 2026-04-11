namespace LibraryManagementAPI.Models
{
    public class BorrowDetail
    {
        public int BorrowCardId { get; set; }
        public int BookId { get; set; }

        // Navigation property để Entity Framework tự hiểu mối quan hệ (Foreign Key)
        public Book? Book { get; set; }
    }
}