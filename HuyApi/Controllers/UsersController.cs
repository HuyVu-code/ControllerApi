using LibraryManagementAPI.Data;
using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        public UsersController(LibraryDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers() => await _context.Users.ToListAsync();

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user == null ? NotFound() : user;
        }

        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest();
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var hasActiveLoans = await _context.BorrowCards.AnyAsync(bc => bc.MemberId == id && !bc.IsReturned);
            if (hasActiveLoans) return BadRequest(new { message = "Không thể xóa độc giả đang mượn sách!" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // --- CHỖ SỬA LỖI ĐÂY HUY ƠI ---
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(int id, [FromBody] bool status)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Sửa thành IsLocked (viết hoa chữ I)
            user.IsLocked = status;

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}