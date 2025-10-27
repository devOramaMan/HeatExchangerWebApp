using HeatExchangerWebApp.Services;

var builder = WebApplication.CreateBuilder(args);

//Add Configuration
builder.Configuration.AddJsonFile("secrets.json", optional: true, reloadOnChange: true).AddEnvironmentVariables();

// Add services to the container.
builder.Services.AddRazorPages();

// Add API controllers
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register database connection service
builder.Services.AddSingleton<DatabaseConnectionService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();

// Serve default static files from wwwroot
app.UseStaticFiles();

// Serve node_modules as static files
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "node_modules")),
    RequestPath = "/node_modules"
});

app.UseRouting();

// Enable CORS
app.UseCors();

app.UseAuthorization();

// Map API controllers
app.MapControllers();

app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();

app.Run();
