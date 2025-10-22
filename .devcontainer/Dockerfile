# Use the official Microsoft .NET SDK image as base
FROM ubuntu:latest


# Install additional tools and dependencies
RUN apt-get update && apt-get install -y \
curl \
git \
wget \
unzip \
postgresql-client \
&& rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /workspaces

ENV LC_ALL=C.UTF-8


