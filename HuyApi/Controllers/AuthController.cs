using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Mail;
using LibraryManagementAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        // Giả lập lưu trữ mã OTP trong bộ nhớ tạm (Trong thực tế nên lưu vào Database hoặc Redis)
        private static ConcurrentDictionary<string, string> _otpStorage = new ConcurrentDictionary<string, string>();

        public class ForgotPasswordRequest
        {
            public string Email { get; set; }
        }

        public class VerifyOtpRequest
        {
            public string Email { get; set; }
            public string Code { get; set; }
        }

        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest(new { message = "Email không được để trống" });

            // 1. Tạo mã OTP ngẫu nhiên 6 số
            Random rnd = new Random();
            string otp = rnd.Next(100000, 999999).ToString();

            // Lưu OTP vào bộ nhớ tạm
            _otpStorage[request.Email] = otp;

            // 2. Cấu hình gửi Email (Sử dụng Gmail SMTP)
            try
            {
                var fromAddress = new MailAddress("pkneverlose19122005@gmail.com", "HuyStore.vn Support");
                var toAddress = new MailAddress(request.Email);
                
                // MẬT KHẨU ỨNG DỤNG GMAIL (KHÔNG PHẢI MẬT KHẨU ĐĂNG NHẬP)
                const string fromPassword = "tmco ubqx kzmk badu"; 
                const string subject = "Mã xác minh khôi phục mật khẩu HuyStore";
                string body = $"Chào bạn,\n\nMã xác minh (OTP) để khôi phục mật khẩu của bạn là: {otp}\n\nVui lòng không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nHuyStore Team";

                var smtp = new SmtpClient
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(fromAddress.Address, fromPassword)
                };
                
                using (var message = new MailMessage(fromAddress, toAddress)
                {
                    Subject = subject,
                    Body = body
                })
                {
                    smtp.Send(message);
                }

                return Ok(new { message = "Mã OTP đã được gửi đến email của bạn!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi gửi email: " + ex.Message });
            }
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (_otpStorage.TryGetValue(request.Email, out string savedOtp))
            {
                if (savedOtp == request.Code)
                {
                    // Xác minh thành công, xóa OTP đi để tránh dùng lại
                    _otpStorage.TryRemove(request.Email, out _);
                    return Ok(new { message = "Xác minh thành công" });
                }
            }
            return BadRequest(new { message = "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        public class ResetPasswordRequest
        {
            public string Email { get; set; }
            public string NewPassword { get; set; }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, [FromServices] LibraryDbContext context)
        {
            // Tìm user dựa vào Email
            var user = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Không tìm thấy tài khoản nào với Email này!" });
            }

            // Cập nhật mật khẩu mới
            user.Password = request.NewPassword;
            await context.SaveChangesAsync();

            return Ok(new { message = "Đổi mật khẩu thành công" });
        }
    }
}
