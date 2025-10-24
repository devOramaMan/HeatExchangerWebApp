# HeatExchangerWebApp
Project for testing CI/DI, azure deploy through github actions, Self hosting actions, Docker image, Github Codespace. 
Postgres DB in docker image to run on local server with LocalXpose proxy for Web app exposure.
Azure Web PubSub Service.

# Depends
- docker
- postgresql-client
- Npgsql (.net package)
- Azure cli (az) 
- Github cli (gh)

# Azure Web PubSub Service
To create an Azure Web PubSub Service named `HeatExchangerService`, use the following Azure CLI commands:

```bash
# Log in to Azure
az login

#If not registered already
az provider register --namespace Microsoft.SignalRService

#wait for it....

# Create a resource group (if you don't have one)
az group create --name HeatExchangerRG --location westeurope

#wait for complete
az provider show --namespace Microsoft.SignalRService --query "registrationState"

# Create the Web PubSub service
az webpubsub create \
  --name HeatExchangerService \
  --resource-group HeatExchangerRG \
  --location westeurope \
  --sku Free_F1
```


For more options and details, see the [Azure Web PubSub documentation](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/).



# Secrets

Github cli (gh)

```bash
# log in to github
gh auth login

# list
gh secret list --repo <Github user>/HeatExchangerWebApp

# set 
# PG_DB_HOST
# PG_DB_NAME
# PG_DB_PASSWORD
# PG_DB_PORT
# PG_DB_USER
gh secret set PG_DB_PASSWORD --body "your_secret_value" --repo owner/repo-name

#For local testing export in terminal where the program is started
export PG_DB_HOST="host"
export PG_DB_NAME="name"
export PG_DB_PASSWORD="your_secret_value"
export PG_DB_PORT=5232
export PG_DB_USER="user"
```

# local run

```bash
#fill inn ---
export PG_DB_HOST=localhost && export PG_DB_PORT=5432 && export PG_DB_NAME=--- && export PG_DB_USER=--- && export PG_DB_PASSWORD=--- && dotnet build && dotnet run
```