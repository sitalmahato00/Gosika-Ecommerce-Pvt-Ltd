#!/usr/bin/env pwsh
# GOSIKA Phase 1 Manual Builder
# Run from any directory. It handles paths automatically.

$root = "D:\Gosika Pvt. Ltd\Gosika Ecommerce"
$sourceDir = "$root\GOSIKA-Manuals\Seller\source"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  GOSIKA Seller Portal Manual – Phase 1 Builder" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Step 1: Capturing screenshots with Playwright..." -ForegroundColor Yellow
Write-Host "         (A browser window will open – log in manually)" -ForegroundColor Gray
Write-Host ""

Set-Location $sourceDir
node capture_seller_manual.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Screenshot capture failed. Check the output above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Generating PDF..." -ForegroundColor Yellow
Write-Host ""

python generate_pdf.py

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: PDF generation failed. Check the output above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Phase 1 Complete!" -ForegroundColor Green
Write-Host "  PDF: $root\GOSIKA-Manuals\Seller\GOSIKA-Seller-User-Manual-Phase-1.pdf" -ForegroundColor Green
Write-Host "  Also saved to: $root\manuals\vendor\GOSIKA-Seller-User-Manual-Phase-1.pdf" -ForegroundColor Green
Write-Host "  Also saved to: $root\public\manuals\GOSIKA-Seller-User-Manual-Phase-1.pdf" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# Open the PDF
Start-Process "$root\GOSIKA-Manuals\Seller\GOSIKA-Seller-User-Manual-Phase-1.pdf"
