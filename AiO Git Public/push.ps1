# AiO Studio - Script Ho Tro Push Code Len GitHub
param (
    [string]$CommitMessage = "update: cap nhat ma nguon AiO Studio"
)

$RootDir = "E:\2026\Production\AiO Studio"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " AiO Studio -- Git Push Automation Tool   " -ForegroundColor Cyan
Write-Host " Thumuoc: $RootDir                       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location -Path $RootDir

Write-Host "`n[1/3] Staging tat ca thay doi..." -ForegroundColor Yellow
git add .

Write-Host "`n[2/3] Tao Commit voi thong dep: '$CommitMessage'..." -ForegroundColor Yellow
git commit -m "$CommitMessage"

Write-Host "`n[3/3] Push code len GitHub (origin main)..." -ForegroundColor Yellow
git push origin main

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " COMPLETED: Da Push Code Len Git Thanh Cong!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
