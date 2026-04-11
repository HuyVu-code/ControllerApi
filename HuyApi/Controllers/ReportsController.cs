using LibraryManagementAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public ReportsController(LibraryDbContext context)
        {
            _context = context;
        }

        // 1. Thống kê tổng số sách còn trong kho (GET: api/reports/inventory)
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventorySummary()
        {
            var totalBooksInStock = await _context.Books.SumAsync(b => b.Quantity);
            var totalDifferentBooks = await _context.Books.CountAsync();

            return Ok(new
            {
                TotalDifferentBooks = totalDifferentBooks, // Có bao nhiêu đầu sách
                TotalBooksInStock = totalBooksInStock      // Tổng số cuốn thực tế còn trong kho
            });
        }

        // 2. Danh sách độc giả đang nợ sách quá hạn (GET: api/reports/overdue-members)
        [HttpGet("overdue-members")]
        public async Task<IActionResult> GetOverdueMembers()
        {
            var today = DateTime.Now.Date;

            // Tìm các phiếu mượn chưa trả và đã quá hạn
            var overdueRecords = await _context.BorrowCards
                .Include(bc => bc.BorrowDetails)
                .ThenInclude(bd => bd.Book)
                .Where(bc => !bc.IsReturned && bc.DueDate.Date < today)
                .Select(bc => new
                {
                    BorrowCardId = bc.Id,
                    MemberId = bc.MemberId,
                    BorrowDate = bc.BorrowDate,
                    DueDate = bc.DueDate,
                    OverdueDays = (today - bc.DueDate.Date).Days
                })
                .ToListAsync();

            return Ok(overdueRecords);
        }

        // 3. Thống kê Top sách được mượn nhiều nhất (GET: api/reports/top-borrowed)
        [HttpGet("top-borrowed")]
        public async Task<IActionResult> GetTopBorrowedBooks([FromQuery] int top = 5)
        {
            var topBooks = await _context.BorrowDetails
                .GroupBy(bd => bd.BookId)
                .Select(group => new
                {
                    BookId = group.Key,
                    BorrowCount = group.Count()
                })
                .OrderByDescending(x => x.BorrowCount)
                .Take(top)
                .Join(_context.Books,
                      topBook => topBook.BookId,
                      book => book.Id,
                      (topBook, book) => new
                      {
                          book.Title,
                          book.Author,
                          topBook.BorrowCount
                      })
                .ToListAsync();

            return Ok(topBooks);
        }
    }
}