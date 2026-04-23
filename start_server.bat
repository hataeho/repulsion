@echo off
title DISPATCH Server
cd /d C:\REPULSION\DISPATCH
rundll32 printui.dll,PrintUIEntry /y /n "Samsung SL-T1670W Series"
python server.py
pause
