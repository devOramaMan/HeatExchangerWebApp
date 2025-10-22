# Use the official Microsoft .NET SDK image as base
FROM ubuntu:latest

ENV LC_ALL=C.UTF-8

RUN bash ./setup.sh

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
