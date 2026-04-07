@echo off
setlocal enabledelayedexpansion
set "args=%*"

if "%args%"=="" goto list
if /i "%args%"=="list" goto list
if /i "%args%"=="all" goto list

goto search

:list
curl -s http://localhost:8080/api/recipes/list
goto end

:search
curl -s "http://localhost:8080/api/recipes/lookup?q=%args%"
goto end

:end
endlocal
