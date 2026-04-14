using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {
        [HttpGet]
        public ActionResult<IEnumerable<Reservation>> GetActiveReservations()
        {
            var reservations = new List<Reservation>
            {
                new Reservation { ReservationId = 1, BookTitle = "Clean Code", UserName = "VuHoangHuy", QueuePosition = 1 },
                new Reservation { ReservationId = 2, BookTitle = "Nhập môn AI", UserName = "LeVanC", QueuePosition = 2 }
            };
            return Ok(reservations);
        }

        [HttpPost("reserve")]
        public ActionResult<Reservation> ReserveBook([FromBody] Reservation newReservation)
        {
            newReservation.QueuePosition = 3; // Giả lập xếp hàng thứ 3
            return Ok(newReservation);
        }
    }
}