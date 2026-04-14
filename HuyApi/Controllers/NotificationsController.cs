using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        [HttpGet("user/{userId}")]
        public ActionResult<IEnumerable<Notification>> GetUserNotifications(int userId)
        {
            var notifs = new List<Notification>
            {
                new Notification { NotifId = 1, Title = "Sắp đến hạn", Content = "Sách sẽ hết hạn vào ngày mai.", IsRead = false },
                new Notification { NotifId = 2, Title = "Sách mới", Content = "Thư viện vừa nhập lô sách IT mới.", IsRead = true }
            };
            return Ok(notifs);
        }
    }
}