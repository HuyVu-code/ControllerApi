using Microsoft.AspNetCore.Mvc;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace LibraryManagementAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SePayController : ControllerBase
    {
        private const string SePayApiToken = "AWJPNBE17JSVDQF7SZTTU3RYJ8GEOY5DNCNHLMCUPPXIMLY4WUG3H5JHQAREHZBG";

        [HttpGet("check-payment/{orderId}")]
        public async Task<IActionResult> CheckPayment(string orderId)
        {
            try
            {
                using var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Get, "https://my.sepay.vn/userapi/transactions/list");
                request.Headers.Add("Authorization", $"Bearer {SePayApiToken}");
                
                var response = await client.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { success = false, message = "Lỗi kết nối SePay" });
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                
                using var document = JsonDocument.Parse(jsonString);
                var root = document.RootElement;

                if (root.TryGetProperty("transactions", out var transactions))
                {
                    foreach (var tx in transactions.EnumerateArray())
                    {
                        var content = tx.GetProperty("transaction_content").GetString() ?? "";
                        // Kiểm tra xem nội dung ck có chứa mã Đơn hàng (orderId) không
                        if (content.Contains(orderId, StringComparison.OrdinalIgnoreCase))
                        {
                            return Ok(new { success = true, amount = tx.GetProperty("amount_in").GetString() });
                        }
                    }
                }

                return Ok(new { success = false, message = "Chưa nhận được thanh toán" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
