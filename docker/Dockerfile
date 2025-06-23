# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["KubernetesControlPanel.sln", "./"]
COPY ["src/Backend/KubernetesControlPanel.API/KubernetesControlPanel.API.csproj", "src/Backend/KubernetesControlPanel.API/"]
COPY ["src/Backend/KubernetesControlPanel.Core/KubernetesControlPanel.Core.csproj", "src/Backend/KubernetesControlPanel.Core/"]
COPY ["src/Backend/KubernetesControlPanel.Services/KubernetesControlPanel.Services.csproj", "src/Backend/KubernetesControlPanel.Services/"]

# Restore dependencies
RUN dotnet restore "src/Backend/KubernetesControlPanel.API/KubernetesControlPanel.API.csproj"

# Copy source code
COPY . .

# Build the application
WORKDIR "/src/src/Backend/KubernetesControlPanel.API"
RUN dotnet build "KubernetesControlPanel.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "KubernetesControlPanel.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy published application
COPY --from=publish /app/publish .

# Expose ports
EXPOSE 80
EXPOSE 443

# Set entry point
ENTRYPOINT ["dotnet", "KubernetesControlPanel.API.dll"] 