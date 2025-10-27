using System.Collections.Generic;

namespace HeatExchangerWebApp.Services;

public class DatabaseConnectionService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseConnectionService> _logger;

    public DatabaseConnectionService(IConfiguration configuration, ILogger<DatabaseConnectionService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GetConnectionString()
    {
        // Get database parameters from configuration (secrets.json or environment variables)
        var host = _configuration["PG_DB_HOST"];
        var port = _configuration["PG_DB_PORT"];
        var database = _configuration["PG_DB_NAME"];
        var user = _configuration["PG_DB_USER"];
        var password = _configuration["PG_DB_PASSWORD"];

        // Validate required parameters
        var missingVars = new List<string>();

        if (string.IsNullOrEmpty(host)) missingVars.Add("PG_DB_HOST");
        if (string.IsNullOrEmpty(port)) missingVars.Add("PG_DB_PORT");
        if (string.IsNullOrEmpty(database)) missingVars.Add("PG_DB_NAME");
        if (string.IsNullOrEmpty(user)) missingVars.Add("PG_DB_USER");
        if (string.IsNullOrEmpty(password)) missingVars.Add("PG_DB_PASSWORD");

        if (missingVars.Count > 0)
        {
            _logger.LogError("Missing required database configuration: {MissingVars}", string.Join(", ", missingVars));
            _logger.LogInformation("Reminder: set the required PG_* values in secrets.json or environment variables.");
            throw new InvalidOperationException("Database configuration is incomplete. Check configuration.");
        }

        // Determine if we're in Codespaces and need external access
        var isCodespaces = !string.IsNullOrEmpty(_configuration["CODESPACES"]);
        var codespaceName = _configuration["CODESPACE_NAME"];

        if (isCodespaces && !string.IsNullOrEmpty(codespaceName))
        {
            // External connection for Codespaces public access
            var externalConnectionString = $"Server={codespaceName}-{port}.app.github.dev;Database={database};Port=443;User Id={user};Password={password};Ssl Mode=Require;Trust Server Certificate=true;Include Error Detail=true;";
            _logger.LogInformation("Using Codespaces external connection");
            return externalConnectionString;
        }
        else
        {
            // Internal connection (local development or within Codespace)
            var internalConnectionString = $"Server={host};Database={database};Port={port};User Id={user};Password={password};Include Error Detail=true;";
            _logger.LogInformation("Using internal connection to host: {Host}", host);
            return internalConnectionString;
        }
    }

    public string GetInternalConnectionString()
    {
        var host = _configuration["PG_DB_HOST"];
        var port = _configuration["PG_DB_PORT"];
        var database = _configuration["PG_DB_NAME"];
        var user = _configuration["PG_DB_USER"];
        var password = _configuration["PG_DB_PASSWORD"];

        return $"Server={host};Database={database};Port={port};User Id={user};Password={password};Include Error Detail=true;";
    }

    public string GetExternalConnectionString()
    {
        var port = _configuration["PG_DB_PORT"];
        var database = _configuration["PG_DB_NAME"];
        var user = _configuration["PG_DB_USER"];
        var password = _configuration["PG_DB_PASSWORD"];
        var codespaceName = _configuration["CODESPACE_NAME"];

        if (string.IsNullOrEmpty(codespaceName))
        {
            throw new InvalidOperationException("CODESPACE_NAME not available. External connection only works in GitHub Codespaces.");
        }

        return $"Server={codespaceName}-{port}.app.github.dev;Database={database};Port=443;User Id={user};Password={password};Ssl Mode=Require;Trust Server Certificate=true;Include Error Detail=true;";
    }

    public void LogConnectionInfo()
    {
        var host = _configuration["PG_DB_HOST"];
        var port = _configuration["PG_DB_PORT"];
        var database = _configuration["PG_DB_NAME"];
        var user = _configuration["PG_DB_USER"];
        var isCodespaces = !string.IsNullOrEmpty(_configuration["CODESPACES"]);
        var codespaceName = _configuration["CODESPACE_NAME"];

        _logger.LogInformation("=== Database Connection Info ===");
        _logger.LogInformation("Host: {Host}", host);
        _logger.LogInformation("Port: {Port}", port);
        _logger.LogInformation("Database: {Database}", database);
        _logger.LogInformation("User: {User}", user);
        _logger.LogInformation("Is Codespaces: {IsCodespaces}", isCodespaces);
        _logger.LogInformation("Codespace Name: {CodespaceName}", codespaceName ?? "N/A");
        _logger.LogInformation("================================");
    }
}