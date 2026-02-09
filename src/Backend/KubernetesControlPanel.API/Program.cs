using KubernetesControlPanel.API.Hubs;
using KubernetesControlPanel.Services;
using KubernetesControlPanel.Core.Configuration;
using Serilog;
using Microsoft.OpenApi.Models;
using KubernetesControlPanel.Services.Interfaces;
using KubernetesControlPanel.Services.Services;
using k8s;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/kubernetes-control-panel-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Kubernetes Control Panel API", 
        Version = "v1",
        Description = "API for monitoring and managing Kubernetes clusters"
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add HTTP Client
builder.Services.AddHttpClient();

// Configure Kubernetes Client
builder.Services.AddSingleton<IKubernetes>(provider =>
{
    var config = KubernetesClientConfiguration.BuildDefaultConfig();
    return new Kubernetes(config);
});

// Add Application Services
builder.Services.AddScoped<IKubernetesService, KubernetesService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPodService, PodService>();
builder.Services.AddScoped<INodeService, NodeService>();
builder.Services.AddScoped<INamespaceService, NamespaceService>();
builder.Services.AddScoped<IMetricsProvider, MetricsProvider>();

// Add Configuration
builder.Services.Configure<KubernetesConfig>(builder.Configuration.GetSection("Kubernetes"));

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kubernetes Control Panel API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Serve static files (React app)
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();
app.MapHub<ClusterHub>("/hubs/cluster");

// Fallback route for SPA
app.MapFallbackToFile("index.html");

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }));

try
{
    Log.Information("Starting Kubernetes Control Panel API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
} 