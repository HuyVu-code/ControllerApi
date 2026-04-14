using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        [HttpGet("book/{bookId}")]
        public ActionResult<IEnumerable<Review>> GetReviewsForBook(int bookId)
        {
            var reviews = new List<Review>
            {
                new Review { ReviewId = 1, UserName = "Nguyễn Văn A", Rating = 5, Comment = "Sách rất hay!" },
                new Review { ReviewId = 2, UserName = "Trần Thị B", Rating = 4, Comment = "Cũng tạm ổn." }
            };
            return Ok(reviews);
        }

        // Chỗ này ép nó nhận đầu vào là Khuôn Review
        [HttpPost]
        public ActionResult<Review> AddReview([FromBody] Review review)
        {
            return Ok(review);
        }
    }
}