using Microsoft.AspNetCore.Mvc;
using HeatExchangerWebApp.Services;
using System.Data;
using Npgsql;

namespace HeatExchangerWebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseTestController : ControllerBase
{
    private readonly DatabaseConnectionService _connectionService;
    private readonly ILogger<DatabaseTestController> _logger;

    public DatabaseTestController(DatabaseConnectionService connectionService, ILogger<DatabaseTestController> logger)
    {
        _connectionService = connectionService;
        _logger = logger;
    }

    [HttpGet("info")]
    public IActionResult GetConnectionInfo()
    {
        try
        {
            _connectionService.LogConnectionInfo();
            
            var info = new
            {
                Host = Environment.GetEnvironmentVariable("PG_DB_HOST"),
                Port = Environment.GetEnvironmentVariable("PG_DB_PORT"),
                Database = Environment.GetEnvironmentVariable("PG_DB_NAME"),
                User = Environment.GetEnvironmentVariable("PG_DB_USER"),
                IsCodespaces = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("CODESPACES")),
                CodespaceName = Environment.GetEnvironmentVariable("CODESPACE_NAME"),
                InternalConnectionString = _connectionService.GetInternalConnectionString(),
                ExternalConnectionString = GetSafeExternalConnectionString()
            };

            return Ok(info);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting connection info");
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            var connectionString = _connectionService.GetConnectionString();
            _logger.LogInformation("Testing connection with: {ConnectionString}", MaskPassword(connectionString));

            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            
            var command = new NpgsqlCommand("SELECT version(), current_database(), current_user, now()", connection);
            using var reader = await command.ExecuteReaderAsync();
            
            var result = new List<object>();
            while (await reader.ReadAsync())
            {
                result.Add(new
                {
                    Version = reader.GetString(0),
                    Database = reader.GetString(1),
                    User = reader.GetString(2),
                    Timestamp = reader.GetDateTime(3)
                });
            }

            await connection.CloseAsync();
            
            return Ok(new { 
                Status = "Success", 
                Message = "Database connection successful",
                DatabaseInfo = result.FirstOrDefault(),
                ConnectionString = MaskPassword(connectionString)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection failed");
            return BadRequest(new { 
                Status = "Error", 
                Message = ex.Message,
                ConnectionString = MaskPassword(_connectionService.GetConnectionString())
            });
        }
    }

    [HttpPost("insert-test")]
    public async Task<IActionResult> InsertTestData([FromBody] TestReading reading)
    {
        try
        {
            var connectionString = _connectionService.GetConnectionString();
            
            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                INSERT INTO monitoring.heat_exchanger_readings 
                (temperature_inlet, temperature_outlet, pressure_inlet, pressure_outlet, flow_rate, efficiency) 
                VALUES (@temp_in, @temp_out, @press_in, @press_out, @flow, @eff)
                RETURNING id, timestamp;";
            
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@temp_in", reading.TemperatureInlet);
            command.Parameters.AddWithValue("@temp_out", reading.TemperatureOutlet);
            command.Parameters.AddWithValue("@press_in", reading.PressureInlet);
            command.Parameters.AddWithValue("@press_out", reading.PressureOutlet);
            command.Parameters.AddWithValue("@flow", reading.FlowRate);
            command.Parameters.AddWithValue("@eff", reading.Efficiency);
            
            using var reader = await command.ExecuteReaderAsync();
            await reader.ReadAsync();
            
            var result = new
            {
                Id = reader.GetGuid(0),
                Timestamp = reader.GetDateTime(1),
                InsertedData = reading
            };
            
            await connection.CloseAsync();
            
            return Ok(new { 
                Status = "Success", 
                Message = "Data inserted successfully",
                Result = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to insert test data");
            return BadRequest(new { Status = "Error", Message = ex.Message });
        }
    }

    [HttpGet("readings")]
    public async Task<IActionResult> GetReadings()
    {
        try
        {
            var connectionString = _connectionService.GetConnectionString();
            
            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            
            var sql = @"
                SELECT id, timestamp, temperature_inlet, temperature_outlet, 
                       pressure_inlet, pressure_outlet, flow_rate, efficiency
                FROM monitoring.heat_exchanger_readings 
                ORDER BY timestamp DESC 
                LIMIT 10;";
            
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();
            
            var readings = new List<object>();
            while (await reader.ReadAsync())
            {
                readings.Add(new
                {
                    Id = reader.GetGuid(0),
                    Timestamp = reader.GetDateTime(1),
                    TemperatureInlet = reader.GetDecimal(2),
                    TemperatureOutlet = reader.GetDecimal(3),
                    PressureInlet = reader.GetDecimal(4),
                    PressureOutlet = reader.GetDecimal(5),
                    FlowRate = reader.GetDecimal(6),
                    Efficiency = reader.GetDecimal(7)
                });
            }
            
            await connection.CloseAsync();
            
            return Ok(new { 
                Status = "Success", 
                Count = readings.Count,
                Readings = readings
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get readings");
            return BadRequest(new { Status = "Error", Message = ex.Message });
        }
    }

    private string MaskPassword(string connectionString)
    {
        return connectionString.Replace(Environment.GetEnvironmentVariable("PG_DB_PASSWORD") ?? "", "****");
    }

    private string GetSafeExternalConnectionString()
    {
        try
        {
            return MaskPassword(_connectionService.GetExternalConnectionString());
        }
        catch
        {
            return "Not available (not in Codespaces)";
        }
    }
}

public class TestReading
{
    public decimal TemperatureInlet { get; set; }
    public decimal TemperatureOutlet { get; set; }
    public decimal PressureInlet { get; set; }
    public decimal PressureOutlet { get; set; }
    public decimal FlowRate { get; set; }
    public decimal Efficiency { get; set; }
}