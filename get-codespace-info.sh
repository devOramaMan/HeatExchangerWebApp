#!/bin/bash

echo "=== GitHub Codespace Information ==="
echo ""

if [ -n "$CODESPACES" ]; then
    echo "Running in GitHub Codespaces: YES"
    echo "Codespace Name: $CODESPACE_NAME"
    echo "Repository: devOramaMan/HeatExchangerWebApp"
    echo ""
    echo "External PostgreSQL Connection Details:"
    echo "Host: ${CODESPACE_NAME}-5432.app.github.dev"
    echo "Port: 443"
    echo "Database: heat_exchange_dev"
    echo "Username: HExM"
    echo "Password: secret"
    echo "SSL Mode: Require"
    echo "Trust Server Certificate: true"
    echo ""
    echo "Full connection string for external access:"
    echo "Host=${CODESPACE_NAME}-5432.app.github.dev;Port=443;Database=heat_exchange_dev;Username=HExM;Password=secret;SSL Mode=Require;Trust Server Certificate=true;"
    echo ""
    echo "To update remote-config.json with your codespace name:"
    echo "sed -i 's/your-codespace-name/$CODESPACE_NAME/g' remote-config.json"
else
    echo "Running in GitHub Codespaces: NO"
    echo "This script should be run inside a GitHub Codespace to get the correct connection details."
    echo ""
    echo "If you are in a Codespace, the CODESPACES environment variable might not be set."
    echo "You can manually find your codespace name from the URL or GitHub Codespaces dashboard."
fi