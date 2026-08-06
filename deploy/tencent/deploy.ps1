$ErrorActionPreference = "Stop"

$envId = "wedding-invitation-d8cw19676945d"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

Set-Location $repoRoot

Write-Host ""
Write-Host "1/4 推送代码到 Gitee..."
git push gitee main

Write-Host ""
Write-Host "2/4 部署 CloudBase 普通云函数..."
tcb fn deploy weddingApiEvent --dir deploy/tencent/functions/weddingApi -e $envId --force

Write-Host ""
Write-Host "3/4 部署前端静态页面..."
tcb hosting deploy public/invitation -e $envId --concurrency 5 --retry-count 3

Write-Host ""
Write-Host "4/4 获取静态网站访问地址..."
tcb hosting detail -e $envId

Write-Host ""
Write-Host "部署命令执行完成。请复制上方的静态网站访问地址进行测试。"
