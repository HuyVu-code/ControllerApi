using LibraryManagementAPI.Data;
using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public BooksController(LibraryDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách toàn bộ sách (GET: api/books)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Book>>> GetBooks()
        {
            return await _context.Books
                .Include(b => b.Category)
                .Include(b => b.Publisher)
                .ToListAsync();

        }

        // 2. Lấy thông tin 1 cuốn sách theo ID (GET: api/books/5)
        [HttpGet("{id}")]
        public async Task<ActionResult<Book>> GetBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null) return NotFound();

            return book;
        }

        // 3. Thêm sách mới (POST: api/books)
        [HttpPost]
        public async Task<ActionResult<Book>> PostBook(Book book)
        {
            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            // Trả về mã 201 Created và thông tin sách vừa tạo
            return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
        }

        // 4. Sửa thông tin sách (PUT: api/books/5)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBook(int id, Book book)
        {
            if (id != book.Id) return BadRequest("ID trên URL không khớp với ID của sách.");

            _context.Entry(book).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookExists(id)) return NotFound();
                else throw;
            }

            return NoContent(); // Cập nhật thành công, không cần trả về data
        }

        // 5. Xóa sách (DELETE: api/books/5)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null) return NotFound();

            // Logic cơ bản: Xóa sách
            // (Phần nâng cao kiểm tra xem sách có người mượn không mình sẽ thêm sau)
            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookExists(int id)
        {
            return _context.Books.Any(e => e.Id == id);
        }
    }
}