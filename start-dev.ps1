# Script para iniciar el servidor de desarrollo en PowerShell

# Comprobar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js no está instalado o no está en el PATH." -ForegroundColor Red
    Write-Host "Por favor, instala Node.js desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Cambiar al directorio backend
Write-Host "Cambiando al directorio backend..." -ForegroundColor Cyan
Set-Location -Path "backend"

# Verificar si los módulos de node están instalados
if (!(Test-Path -Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar el servidor en modo desarrollo
Write-Host "Iniciando el servidor de desarrollo..." -ForegroundColor Green
npm run dev 