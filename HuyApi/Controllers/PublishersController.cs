using LibraryManagementAPI.Data;
using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublishersController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public PublishersController(LibraryDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả Nhà xuất bản (GET: api/publishers)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Publisher>>> GetPublishers()
        {
            return await _context.Publishers.ToListAsync();
        }

        // 2. Lấy thông tin 1 Nhà xuất bản theo ID (GET: api/publishers/5)
        [HttpGet("{id}")]
        public async Task<ActionResult<Publisher>> GetPublisher(int id)
        {
            var publisher = await _context.Publishers.FindAsync(id);

            if (publisher == null)
            {
                return NotFound(new { message = "Không tìm thấy Nhà xuất bản này." });
            }

            return publisher;
        }

        // 3. Thêm Nhà xuất bản mới (POST: api/publishers)
        [HttpPost]
        public async Task<ActionResult<Publisher>> PostPublisher(Publisher publisher)
        {
            _context.Publishers.Add(publisher);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPublisher), new { id = publisher.Id }, publisher);
        }

        // 4. Cập nhật thông tin Nhà xuất bản (PUT: api/publishers/5)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPublisher(int id, Publisher publisher)
        {
            if (id != publisher.Id)
            {
                return BadRequest();
            }

            _context.Entry(publisher).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Publishers.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else throw;
            }

            return NoContent();
        }

        // 5. Xóa Nhà xuất bản (DELETE: api/publishers/5)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePublisher(int id)
        {
            var publisher = await _context.Publishers.FindAsync(id);
            if (publisher == null) return NotFound();

            // Kiểm tra xem NXB này có đang liên kết với cuốn sách nào không
            var hasBooks = await _context.Books.AnyAsync(b => b.PublisherId == id);
            if (hasBooks)
            {
                return BadRequest(new { message = "Không thể xóa NXB này vì đang có sách thuộc NXB này trong kho." });
            }

            _context.Publishers.Remove(publisher);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}