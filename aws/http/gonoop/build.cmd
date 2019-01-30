set GOOS=linux
set GOARCH=amd64
go build -o main main.go
%USERPROFILE%\Go\bin\build-lambda-zip.exe -o main.zip main