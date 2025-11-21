# Script PowerShell pour configurer le port forwarding WSL2
# DOIT ETRE EXECUTE EN TANT QU'ADMINISTRATEUR

Write-Host "`nConfiguration du Port Forwarding WSL2 pour Thalric Dashboard`n" -ForegroundColor Cyan

# Verifier si on est administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script doit etre execute en tant qu'Administrateur" -ForegroundColor Red
    Write-Host ""
    Write-Host "Faites un clic-droit sur PowerShell et selectionnez 'Executer en tant qu'administrateur'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Obtenir l'adresse IP de WSL2
Write-Host "Detection de l'adresse IP WSL2..." -ForegroundColor Yellow
$wslIP = (wsl hostname -I).Trim()

if (-not $wslIP) {
    Write-Host "ERREUR: Impossible de detecter l'adresse IP WSL2" -ForegroundColor Red
    Write-Host "Assurez-vous que WSL est en cours d'execution" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Adresse IP WSL2: $wslIP" -ForegroundColor Green

# Obtenir l'adresse IP Windows
$windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" }).IPAddress

if (-not $windowsIP) {
    $windowsIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" }).IPAddress
}

Write-Host "Adresse IP Windows: $windowsIP" -ForegroundColor Green
Write-Host ""

# Supprimer les anciennes regles si elles existent
Write-Host "Suppression des anciennes regles de port forwarding..." -ForegroundColor Yellow
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=$windowsIP 2>$null

# Creer la nouvelle regle de port forwarding
Write-Host "Creation de la regle de port forwarding..." -ForegroundColor Green
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP

if ($LASTEXITCODE -eq 0) {
    Write-Host "Port forwarding configure avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Details:" -ForegroundColor Cyan
    Write-Host "  Port: 3000"
    Write-Host "  WSL2 IP: $wslIP"
    Write-Host "  Windows IP: $windowsIP"
    Write-Host ""
    Write-Host "Verification des regles actuelles:" -ForegroundColor Cyan
    netsh interface portproxy show v4tov4
    Write-Host ""
    Write-Host "Vous pouvez maintenant acceder au serveur depuis votre tablette!" -ForegroundColor Magenta
    Write-Host "URL: http://${windowsIP}:3000/viewer" -ForegroundColor Green
} else {
    Write-Host "ERREUR lors de la creation de la regle de port forwarding" -ForegroundColor Red
}

Write-Host ""
pause
