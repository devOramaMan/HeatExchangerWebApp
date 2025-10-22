
cat > /workspaces/HeatExchangerWebApp/.devcontainer/.env <<EOF
PG_DB_HOST=$PG_DB_HOST
PG_DB_PORT=$PG_DB_PORT
PG_DB_NAME=$PG_DB_NAME
PG_DB_USER=$PG_DB_USER
PG_DB_PASSWORD=$PG_DB_PASSWORD
EOF

echo 'Development environment variables set!'
