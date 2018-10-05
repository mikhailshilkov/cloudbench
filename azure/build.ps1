dotnet publish http/v1/dotnet
dotnet publish http/v2/dotnet
mvn package -f http/v2/java/pom.xml
dotnet publish monitor/timer
dotnet publish monitor/queue
dotnet publish queue/v2/dotnet