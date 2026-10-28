@echo off
set "CODEX_HELPER_DIR=%~dp0"
powershell.exe -NoProfile -STA -WindowStyle Hidden -Command "& ([scriptblock]::Create([System.IO.File]::ReadAllText((Join-Path $env:CODEX_HELPER_DIR 'Copy-Codex-Parameters.ps1'), [System.Text.Encoding]::UTF8)))"
