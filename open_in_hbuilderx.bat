@echo off
chcp 65001 >nul
title 正在打开血压健康管家 Uni-app 项目...

echo ====================================================
echo 正在启动 HBuilderX 并载入【血压健康管家】项目...
echo 项目目录: %~dp0
echo ====================================================

start "" "D:\HBuilderX\HBuilderX.exe" "%~dp0"

echo 启动指令已发送！请在弹出的 HBuilderX 窗口中：
echo 1. 点击顶部菜单【运行】->【运行到内置浏览器】(即时查看界面)
echo 2. 或点击顶部菜单【发行】->【原生App-云打包】(一键生成安卓APK)
echo.
timeout /t 3 >nul
