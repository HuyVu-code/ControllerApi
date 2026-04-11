namespace LibraryManagementAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Chứa giá trị: "Admin", "Librarian", hoặc "Member"
        public string Role { get; set; } = "Member";

        // Dùng để khóa thẻ nếu độc giả nợ sách quá hạn
        public bool IsLocked { get; set; } = false;
    }
}