namespace LibraryManagementAPI.Models
{
    public class Publisher
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Tên NXB
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // Một NXB có thể phát hành nhiều cuốn sách
        public ICollection<Book> Books { get; set; } = new List<Book>();
    }
}