namespace LibraryManagementAPI.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int Quantity { get; set; }

        // BỎ đi dòng public string Category cũ, thay bằng Khóa Ngoại (Foreign Key)
        public int? CategoryId { get; set; }
        public Category? Category { get; set; }

        // Thêm Khóa Ngoại liên kết với bảng NXB
        public int? PublisherId { get; set; }
        public Publisher? Publisher { get; set; }
    }
}