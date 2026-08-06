@echo off
setlocal
set ENV_ID=wedding-invitation-d8cw19676945d

cd /d "%~dp0..\.."

echo.
echo 1/4 Push code to Gitee...
git push gitee main
if errorlevel 1 exit /b 1

echo.
echo 2/4 Deploy CloudBase HTTP function...
tcb fn deploy weddingApiHttp --dir deploy/tencent/functions/weddingApi -e %ENV_ID% --force --httpFn
if errorlevel 1 exit /b 1

echo.
echo 3/4 Deploy static website files...
tcb hosting deploy public/invitation -e %ENV_ID% --concurrency 5 --retry-count 3
if errorlevel 1 exit /b 1

echo.
echo 4/4 Show static website detail...
tcb hosting detail -e %ENV_ID%
if errorlevel 1 exit /b 1

echo.
echo Deploy commands finished. Copy the website URL above and test it in browser.
