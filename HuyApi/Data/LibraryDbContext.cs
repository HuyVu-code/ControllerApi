using LibraryManagementAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementAPI.Data
{
    // Kế thừa DbContext của Entity Framework
    public class LibraryDbContext : DbContext
    {
        public LibraryDbContext(DbContextOptions<LibraryDbContext> options) : base(options) { }

        // Khai báo các bảng sẽ có trong SQL Server
        public DbSet<Book> Books { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<BorrowCard> BorrowCards { get; set; }
        public DbSet<BorrowDetail> BorrowDetails { get; set; }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Publisher> Publishers { get; set; }

        // Hàm này dùng để cấu hình thêm các ràng buộc phức tạp
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Bảng BorrowDetail dùng 2 cột làm Khóa chính (Composite Key)
            modelBuilder.Entity<BorrowDetail>()
                .HasKey(bd => new { bd.BorrowCardId, bd.BookId });
        }
    }
}