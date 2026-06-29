@echo off
chcp 65001 >nul
echo ========================================
echo  Markdown 转 Word 转换工具
echo ========================================
echo.
echo 正在转换系统操作说明书...
echo.

cd /d "%~dp0"
python md_to_docx.py

echo.
echo ========================================
echo  转换完成！
echo ========================================
echo.
echo 生成的Word文档位于：
echo docs\系统操作说明书.docx
echo.
echo 按任意键退出...
pause >nul
