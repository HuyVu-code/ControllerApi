using LibraryManagementAPI.Models; // Phải có dòng này để nó gọi được Model
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FinesController : ControllerBase
    {
        // Khai báo rõ ràng ActionResult<IEnumerable<Fine>> để Swagger nó thấy
        [HttpGet]
        public ActionResult<IEnumerable<Fine>> GetAllFines()
        {
            var fines = new List<Fine>
            {
                new Fine { Id = 1, UserId = 101, Amount = 50000, Reason = "Trả sách trễ hạn", Status = "Chưa đóng" },
                new Fine { Id = 2, UserId = 105, Amount = 120000, Reason = "Làm rách bìa", Status = "Đã đóng" }
            };
            return Ok(fines);
        }

        [HttpPost("pay/{fineId}")]
        public ActionResult<Fine> PayFine(int fineId)
        {
            return Ok(new Fine { Id = fineId, UserId = 0, Amount = 0, Reason = "Đã thanh toán", Status = "Đã đóng" });
        }
    }
}