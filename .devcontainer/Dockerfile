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

# Install Entity Framework Core tools globally
# RUN dotnet tool install --global dotnet-ef

# Add dotnet tools to PATH
#ENV PATH="$PATH:/root/.dotnet/tools"

# Create a non-root user
# ARG USERNAME=vscode
# ARG USER_UID=1000
# ARG USER_GID=$USER_UID

# RUN groupadd --gid $USER_GID $USERNAME \
#     && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
#     && apt-get update \
#     && apt-get install -y sudo \
#     && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
#     && chmod 0440 /etc/sudoers.d/$USERNAME

# # Switch to non-root user
# USER $USERNAME

# Install EF Core tools for the user
#RUN dotnet tool install --global dotnet-ef

# Add user dotnet tools to PATH
#ENV PATH="$PATH:/home/$USERNAME/.dotnet/tools"

# Set the working directory
WORKDIR /workspaces