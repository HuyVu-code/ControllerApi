using LibraryManagementAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<LibraryDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddControllers().AddJsonOptions(x =>
                x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || true) // Thêm || true để nó hiện cả khi deploy
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "LibraryManagementAPI v1");

        // DÒNG QUAN TRỌNG NHẤT ĐÂY:
        c.RoutePrefix = string.Empty; // Để trống cái này thì trang chủ sẽ là Swagger
    });
}

app.UseHttpsRedirection();

app.UseAuthorization();
app.UseDefaultFiles(); // Tìm file index.html làm trang chủ mặc định
app.UseStaticFiles();  // Cho phép đọc file HTML, CSS, JS

app.MapControllers();

app.Run();
