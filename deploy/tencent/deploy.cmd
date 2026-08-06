@echo off
setlocal
set ENV_ID=wedding-invitation-d8cw19676945d

cd /d "%~dp0..\.."

echo.
echo 1/4 推送代码到 Gitee...
git push gitee main
if errorlevel 1 exit /b 1

echo.
echo 2/4 部署 CloudBase HTTP 云函数...
tcb fn deploy weddingApi -e %ENV_ID% --force --httpFn --path /api
if errorlevel 1 exit /b 1

echo.
echo 3/4 部署前端静态页面...
tcb hosting deploy public/invitation -e %ENV_ID% --concurrency 5 --retry-count 3
if errorlevel 1 exit /b 1

echo.
echo 4/4 获取静态网站访问地址...
tcb hosting detail -e %ENV_ID%
if errorlevel 1 exit /b 1

echo.
echo 部署命令执行完成。请复制上方的静态网站访问地址进行测试。
