namespace LibraryManagementAPI.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Tên thể loại (VD: Lập trình, Văn học)
        public string Description { get; set; } = string.Empty; // Mô tả thêm

        // Một thể loại có thể chứa nhiều cuốn sách (Mối quan hệ 1-Nhiều)
        public ICollection<Book> Books { get; set; } = new List<Book>();
    }
}