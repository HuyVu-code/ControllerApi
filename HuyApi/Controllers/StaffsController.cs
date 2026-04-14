using LibraryManagementAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffsController : ControllerBase
    {
        [HttpGet]
        public ActionResult<IEnumerable<Staff>> GetAllStaffs()
        {
            var staffs = new List<Staff>
            {
                new Staff { StaffId = "NV001", Name = "Quản Lý Thư Viện", Role = "Admin", Shift = "Sáng" },
                new Staff { StaffId = "NV002", Name = "Thủ Thư Số 1", Role = "Thủ thư", Shift = "Chiều" }
            };
            return Ok(staffs);
        }

        [HttpPost]
        public ActionResult<Staff> AddStaff([FromBody] Staff newStaff)
        {
            return Ok(newStaff);
        }
    }
}