@echo off
go build -ldflags="-H=windowsgui" -o "图种生成器.exe" main.go
pause