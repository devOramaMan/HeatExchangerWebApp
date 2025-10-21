# Heat Exchanger Web App

A .NET 9.0 web application for monitoring heat exchanger performance with PostgreSQL database integration, designed to work seamlessly with GitHub Codespaces.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Finding Your Codespace Name](#finding-your-codespace-name)
- [Environment Variables](#environment-variables)
- [Database Connection](#database-connection)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Features

- Real-time heat exchanger monitoring
- PostgreSQL database integration
- Automatic connection string configuration for GitHub Codespaces
- REST API for data management
- Support for both internal and external database connections

## Prerequisites

- .NET 9.0 SDK
- PostgreSQL database
- GitHub Codespaces (recommended) or local development environment

## Setup Instructions

### GitHub Codespaces (Recommended)

1. **Create a new Codespace** from this repository
2. **Set up environment variables** as Codespace secrets:
   - Go to your repository settings
   - Navigate to "Secrets and variables" → "Codespaces"
   - Add the following secrets:
     - `PG_DB_HOST`: Your PostgreSQL host
     - `PG_DB_PORT`: Your PostgreSQL port (e.g., `5432`)
     - `PG_DB_NAME`: Your database name
     - `PG_DB_USER`: Your database username
     - `PG_DB_PASSWORD`: Your database password

3. **The application will automatically detect** that it's running in Codespaces and configure the connection accordingly

### Local Development

1. Clone the repository
2. Set the required environment variables in your shell or IDE
3. Run `dotnet restore`
4. Run `dotnet build`
5. Run `dotnet run`

## Finding Your Codespace Name

The **CODESPACE_NAME** is an environment variable automatically provided by GitHub Codespaces. You don't need to set it manually.

### Where to Find It

There are several ways to find your Codespace name:

#### Method 1: From the Codespace URL
When you're in a Codespace, look at your browser's address bar. The URL format is:
```
https://[CODESPACE_NAME].github.dev
```
The part before `.github.dev` is your Codespace name.

Example:
```
https://friendly-space-giggle-abc123xyz.github.dev
```
Your Codespace name is: `friendly-space-giggle-abc123xyz`

#### Method 2: Using the Terminal
In your Codespace terminal, run:
```bash
echo $CODESPACE_NAME
```

#### Method 3: Using the Application
Once the application is running, you can view the Codespace name by visiting:
```
http://localhost:5000/api/DatabaseTest/info
```
This endpoint displays connection information including the Codespace name.

### What is CODESPACE_NAME Used For?

The application uses `CODESPACE_NAME` to automatically configure external database connections when running in GitHub Codespaces. It constructs a connection string in this format:
```
Server={CODESPACE_NAME}-{port}.app.github.dev;Database=...
```

This allows your Codespace to connect to external databases that are publicly accessible through GitHub's forwarding mechanism.

## Environment Variables

The application requires the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PG_DB_HOST` | PostgreSQL server hostname | Yes |
| `PG_DB_PORT` | PostgreSQL server port | Yes |
| `PG_DB_NAME` | Database name | Yes |
| `PG_DB_USER` | Database username | Yes |
| `PG_DB_PASSWORD` | Database password | Yes |
| `CODESPACE_NAME` | GitHub Codespace name (auto-set) | Auto |
| `CODESPACES` | Indicates if running in Codespaces (auto-set) | Auto |

## Database Connection

The application intelligently determines the appropriate connection strategy:

### In GitHub Codespaces
- **External Connection**: If `CODESPACE_NAME` is available, uses the external forwarding URL
- **Internal Connection**: Falls back to direct connection using `PG_DB_HOST`

### Local Development
- Uses direct connection to the database using `PG_DB_HOST` and `PG_DB_PORT`

## Running the Application

### In GitHub Codespaces
```bash
dotnet run
```
The application will automatically open on the forwarded port.

### Locally
```bash
dotnet run
```
Then navigate to `http://localhost:5000` (or the port shown in the console)

## API Endpoints

### GET /api/DatabaseTest/info
Returns connection information including:
- Database host and port
- Codespace status
- Codespace name (if available)
- Connection strings (with password masked)

### GET /api/DatabaseTest/test-connection
Tests the database connection and returns:
- Connection status
- Database version
- Current database and user
- Timestamp

### POST /api/DatabaseTest/insert-test
Inserts test data into the heat exchanger readings table.

Request body:
```json
{
  "temperatureInlet": 80.5,
  "temperatureOutlet": 65.2,
  "pressureInlet": 150.0,
  "pressureOutlet": 145.5,
  "flowRate": 100.0,
  "efficiency": 85.5
}
```

### GET /api/DatabaseTest/readings
Retrieves the latest 10 heat exchanger readings from the database.

## Troubleshooting

### "CODESPACE_NAME not available" Error
- This error occurs when trying to use external connection mode outside of GitHub Codespaces
- Solution: Run the application in GitHub Codespaces or use local development mode

### Database Connection Failures
- Verify all environment variables are set correctly
- Check that your database is accessible from your Codespace/local environment
- Review the logs for detailed error messages
- Use the `/api/DatabaseTest/info` endpoint to verify your configuration

### Port Forwarding Issues in Codespaces
- Ensure port 5432 (PostgreSQL) is set to "Public" visibility in the Ports panel
- Check that your database allows connections from external IPs

## License

[Add your license information here]
