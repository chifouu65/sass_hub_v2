# Script d'arrêt pour Windows PowerShell
# Usage: .\scripts\stop-local-windows.ps1

Write-Host "🛑 Arrêt de l'environnement SaaS Hub..." -ForegroundColor Cyan

# Arrêter les processus sur le port 3000
Write-Host "`n🔄 Arrêt des processus sur les ports 3000 et 4200..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
$port4200 = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue | Select-Object -First 1

if ($port3000) {
    $pid3000 = $port3000.OwningProcess
    Write-Host "   Arrêt du processus sur le port 3000 (PID: $pid3000)..." -ForegroundColor Gray
    Stop-Process -Id $pid3000 -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Processus sur le port 3000 arrêté" -ForegroundColor Green
}

if ($port4200) {
    $pid4200 = $port4200.OwningProcess
    Write-Host "   Arrêt du processus sur le port 4200 (PID: $pid4200)..." -ForegroundColor Gray
    Stop-Process -Id $pid4200 -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Processus sur le port 4200 arrêté" -ForegroundColor Green
}

# Tuer tous les processus node.js liés à nx
Write-Host "`n🔄 Recherche et arrêt des processus Node.js liés à Nx..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.ProcessName -eq "node" -and 
    ($_.Path -like "*node*")
} | ForEach-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        if ($cmdLine -like "*nx*" -or $cmdLine -like "*hub-backend*" -or $cmdLine -like "*hub-frontend*") {
            Write-Host "   Arrêt du processus Node.js (PID: $($_.Id))..." -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Ignorer les erreurs
    }
}

# Arrêter via les PIDs sauvegardés
if (Test-Path .backend.pid) {
    $BACKEND_PID = Get-Content .backend.pid
    if ($BACKEND_PID) {
        Write-Host "   Arrêt du backend (PID: $BACKEND_PID)..." -ForegroundColor Gray
        Stop-Process -Id $BACKEND_PID -Force -ErrorAction SilentlyContinue
    }
    Remove-Item .backend.pid -ErrorAction SilentlyContinue
}

if (Test-Path .frontend.pid) {
    $FRONTEND_PID = Get-Content .frontend.pid
    if ($FRONTEND_PID) {
        Write-Host "   Arrêt du frontend (PID: $FRONTEND_PID)..." -ForegroundColor Gray
        Stop-Process -Id $FRONTEND_PID -Force -ErrorAction SilentlyContinue
    }
    Remove-Item .frontend.pid -ErrorAction SilentlyContinue
}

# Attendre un peu
Start-Sleep -Seconds 2

# Vérifier que les ports sont libres
Write-Host "`n🔍 Vérification des ports..." -ForegroundColor Yellow
$port3000Check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port4200Check = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue

if ($port3000Check -or $port4200Check) {
    Write-Host "⚠️  Certains ports sont encore occupés :" -ForegroundColor Yellow
    if ($port3000Check) {
        Write-Host "   Port 3000 : ❌ OCCUPÉ (PID: $($port3000Check.OwningProcess))" -ForegroundColor Red
        Write-Host "   Utilisez: Stop-Process -Id $($port3000Check.OwningProcess) -Force" -ForegroundColor Gray
    } else {
        Write-Host "   Port 3000 : ✅ LIBRE" -ForegroundColor Green
    }
    if ($port4200Check) {
        Write-Host "   Port 4200 : ❌ OCCUPÉ (PID: $($port4200Check.OwningProcess))" -ForegroundColor Red
        Write-Host "   Utilisez: Stop-Process -Id $($port4200Check.OwningProcess) -Force" -ForegroundColor Gray
    } else {
        Write-Host "   Port 4200 : ✅ LIBRE" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Tous les ports sont libres" -ForegroundColor Green
}

# Arrêter les services Docker
Write-Host "`n📦 Arrêt des services Docker..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml stop mysql-hub redis rabbitmq 2>$null

Write-Host "`n✅ Environnement arrêté !" -ForegroundColor Green

