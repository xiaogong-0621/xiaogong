@echo off
chcp 65001 >nul
set "CLI_PATH=C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
set "PROJ_PATH=e:\syyktv\KTV-main (1)\KTV-main\小程序"
call "%CLI_PATH%" open --project "%PROJ_PATH%" > "%TEMP%\wechat-cli-output.txt" 2>&1
exit /b %ERRORLEVEL%
