using LibraryManagementAPI.Data;
using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BorrowingsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public BorrowingsController(LibraryDbContext context)
        {
            _context = context;
        }

        // Lớp DTO (Data Transfer Object) dùng để nhận dữ liệu JSON từ phía người dùng
        public class BorrowRequestDto
        {
            public int MemberId { get; set; }
            public int StaffId { get; set; }
            public List<int> BookIds { get; set; } = new List<int>(); // Danh sách ID các cuốn sách muốn mượn
        }

        // ==========================================
        // 1. TẠO PHIẾU MƯỢN SÁCH (POST: api/borrowings)
        // ==========================================
        [HttpPost]
        public async Task<IActionResult> CreateBorrowCard([FromBody] BorrowRequestDto request)
        {
            // Bước 1: Kiểm tra thẻ độc giả có hợp lệ và bị khóa không?
            var member = await _context.Users.FindAsync(request.MemberId);
            if (member == null)
                return BadRequest(new { message = "Không tìm thấy độc giả." });

            if (member.IsLocked)
                return BadRequest(new { message = "Thẻ độc giả đang bị khóa, không thể mượn sách!" });

            if (request.BookIds == null || !request.BookIds.Any())
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 cuốn sách để mượn." });

            // Bước 2: Lấy danh sách sách từ DB và kiểm tra tồn kho
            var booksToBorrow = await _context.Books
                .Where(b => request.BookIds.Contains(b.Id))
                .ToListAsync();

            if (booksToBorrow.Count != request.BookIds.Count)
                return BadRequest(new { message = "Một số sách bạn chọn không tồn tại trong hệ thống." });

            foreach (var book in booksToBorrow)
            {
                if (book.Quantity <= 0)
                    return BadRequest(new { message = $"Sách '{book.Title}' đã hết trong kho." });
            }

            // Bước 3: Tạo Phiếu Mượn (BorrowCard)
            var borrowCard = new BorrowCard
            {
                MemberId = request.MemberId,
                StaffId = request.StaffId,
                BorrowDate = DateTime.Now,
                DueDate = DateTime.Now.AddDays(14), // Cài đặt mặc định hạn trả là 14 ngày
                IsReturned = false
            };

            _context.BorrowCards.Add(borrowCard);
            await _context.SaveChangesAsync(); // Lưu để lấy ID của phiếu mượn vừa tạo

            // Bước 4: Tạo Chi tiết mượn (BorrowDetail) và Trừ số lượng sách
            foreach (var book in booksToBorrow)
            {
                // Trừ số lượng kho
                book.Quantity -= 1;

                // Thêm vào bảng chi tiết
                _context.BorrowDetails.Add(new BorrowDetail
                {
                    BorrowCardId = borrowCard.Id,
                    BookId = book.Id
                });
            }

            await _context.SaveChangesAsync(); // Lưu toàn bộ thay đổi (Cập nhật sách + Lưu chi tiết)

            return Ok(new { message = "Tạo phiếu mượn thành công!", borrowCardId = borrowCard.Id });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBorrowCards()
        {
            return await _context.BorrowCards
                .Include(bc => bc.Member) // Lấy tên người mượn
                .Include(bc => bc.BorrowDetails)
                    .ThenInclude(bd => bd.Book) // Lấy tên các cuốn sách trong phiếu
                .Select(bc => new {
                    bc.Id,
                    MemberName = bc.Member.Username ,
                    bc.BorrowDate,
                    bc.DueDate,
                    bc.IsReturned,
                    Books = bc.BorrowDetails.Select(bd => bd.Book.Title).ToList()
                })
                .OrderByDescending(bc => bc.Id)
                .ToListAsync();
        }
        // ==========================================
        // 2. TRẢ SÁCH (POST: api/borrowings/5/return)
        // ==========================================
        [HttpPost("{borrowCardId}/return")]
        public async Task<IActionResult> ReturnBooks(int borrowCardId)
        {
            // Lấy phiếu mượn kèm theo chi tiết và thông tin sách (Dùng Include để JOIN bảng trong EF Core)
            var borrowCard = await _context.BorrowCards
                .Include(bc => bc.BorrowDetails)
                .ThenInclude(bd => bd.Book)
                .FirstOrDefaultAsync(bc => bc.Id == borrowCardId);

            if (borrowCard == null)
                return NotFound(new { message = "Không tìm thấy phiếu mượn." });

            if (borrowCard.IsReturned)
                return BadRequest(new { message = "Phiếu mượn này đã được trả trước đó rồi." });

            // Bước 1: Cộng lại số lượng sách vào kho
            foreach (var detail in borrowCard.BorrowDetails)
            {
                if (detail.Book != null)
                {
                    detail.Book.Quantity += 1;
                }
            }

            // Bước 2: Cập nhật trạng thái phiếu mượn
            borrowCard.IsReturned = true;

            // Bước 3: Logic kiểm tra quá hạn (TC03 trong tài liệu Tester của bạn)
            string responseMessage = "Trả sách thành công.";

            if (DateTime.Now.Date > borrowCard.DueDate.Date)
            {
                int overdueDays = (DateTime.Now.Date - borrowCard.DueDate.Date).Days;
                responseMessage = $"Trả sách thành công. LƯU Ý: Độc giả đã trả quá hạn {overdueDays} ngày!";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = responseMessage });
        }
    }
}