using Microsoft.AspNetCore.Mvc;
using Azure.Messaging.WebPubSub;
using System.Text.Json;

namespace HeatExchangerWebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebPubSubController : ControllerBase
{
    private readonly ILogger<WebPubSubController> _logger;
    private readonly IConfiguration _configuration;

    public WebPubSubController(ILogger<WebPubSubController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("negotiate")]
    public IActionResult Negotiate([FromQuery] string userId = "anonymous")
    {
        try
        {
            var connectionString = Environment.GetEnvironmentVariable("AZURE_WEBPUBSUB_CONNECTION_STRING")
                                ?? _configuration["AZURE_WEBPUBSUB_CONNECTION_STRING"];

            if (string.IsNullOrEmpty(connectionString) )
            {
                _logger.LogWarning("Azure Web PubSub connection string not configured");
                return BadRequest(new
                {
                    Status = "Error",
                    Message = "Azure Web PubSub connection string not configured. Set AZURE_WEBPUBSUB_CONNECTION_STRING environment variable."
                });
            }

            var hubName = Environment.GetEnvironmentVariable("AZURE_WEBPUBSUB_HUB_NAME")
                          ?? _configuration["AZURE_WEBPUBSUB_HUB_NAME"];

            if (string.IsNullOrEmpty(hubName))
            {
                _logger.LogWarning("Azure Web PubSub hub name not configured");
                return BadRequest(new
                {
                    Status = "Error",
                    Message = "Azure Web PubSub hub name not configured. Set AZURE_WEBPUBSUB_HUB_NAME environment variable."
                });
            }

            var serviceClient = new WebPubSubServiceClient(connectionString, hubName);

            var clientAccessUri = serviceClient.GetClientAccessUri(
                userId: userId,
                roles: new[] { "webpubsub.sendToGroup", "webpubsub.joinLeaveGroup" }
            );

            return Ok(new
            {
                Status = "Success",
                Url = clientAccessUri.AbsoluteUri
            });

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Web PubSub client access URL");
            return BadRequest(new
            {
                Status = "Error",
                Message = ex.Message
            });
        }
    }
    

    [HttpPost("publish")]
    public async Task<IActionResult> PublishTemperatureData([FromBody] TemperatureData data)
    {
        try
        {
            var connectionString = Environment.GetEnvironmentVariable("AZURE_WEBPUBSUB_CONNECTION_STRING")
                                ?? _configuration["AZURE_WEBPUBSUB_CONNECTION_STRING"];
                                
            var hubName = Environment.GetEnvironmentVariable("AZURE_WEBPUBSUB_HUB_NAME")
                          ?? _configuration["AZURE_WEBPUBSUB_HUB_NAME"];

            if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(hubName))
            {
                return BadRequest(new { 
                    Status = "Error", 
                    Message = "Azure Web PubSub connection string not configured" 
                });
            }

            var serviceClient = new WebPubSubServiceClient(connectionString, hubName);

            // Broadcast to all connected clients
            var message = JsonSerializer.Serialize(new
            {
                type = "temperature_message",
                data = new
                {
                    temp1 = data.Temp1, 
                    temp2 = data.Temp2,
                    temp3 = data.Temp3,
                    temp4 = data.Temp4,
                    timestamp = DateTime.UtcNow
                }
            });

            await serviceClient.SendToAllAsync(message, Azure.Core.ContentType.ApplicationJson);

            return Ok(new { 
                Status = "Success", 
                Message = "Temperature data published to all subscribers" 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish temperature data");
            return BadRequest(new { 
                Status = "Error", 
                Message = ex.Message 
            });
        }
    }
}

public class TemperatureData
{
    public decimal Temp1 { get; set; }
    public decimal Temp2 { get; set; }
    public decimal Temp3 { get; set; }
    public decimal Temp4 { get; set; }
}
