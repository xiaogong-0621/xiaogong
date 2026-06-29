@echo off
chcp 65001 >nul
echo ========================================
echo  实训报告 Markdown 转 Word 转换工具
echo ========================================
echo.
echo 正在转换系统操作说明书实训报告...
echo.

cd /d "%~dp0"
python md_to_docx.py "e:\syyktv\KTV-main (1)\KTV-main\docs\系统操作说明书实训报告.md" "e:\syyktv\KTV-main (1)\KTV-main\docs\系统操作说明书实训报告.docx"

echo.
echo ========================================
echo  转换完成！
echo ========================================
echo.
echo 生成的Word文档位于：
echo docs\系统操作说明书实训报告.docx
echo.
echo 按任意键退出...
pause >nul
