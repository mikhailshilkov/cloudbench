$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -o main main.go
~\Go\bin\build-lambda-zip.exe -o main.zip main