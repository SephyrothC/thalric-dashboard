# Script PowerShell pour obtenir l'URL d'acces tablette

Write-Host "`nThalric Dashboard - URL pour Tablette`n" -ForegroundColor Cyan

# Obtenir l'adresse IP
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" }).IPAddress

if (-not $ipAddress) {
    # Essayer avec Ethernet si Wi-Fi n'est pas trouve
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" }).IPAddress
}

if ($ipAddress) {
    Write-Host "Adresse IP detectee: " -NoNewline -ForegroundColor Green
    Write-Host $ipAddress -ForegroundColor Yellow
    Write-Host ""

    $mainUrl = "http://${ipAddress}:3000"
    $viewerUrl = "http://${ipAddress}:3000/viewer"

    Write-Host "URLs a utiliser sur votre tablette:" -ForegroundColor Cyan
    Write-Host "   Main Dashboard: $mainUrl" -ForegroundColor Green
    Write-Host "   Tablet Viewer:  $viewerUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL copiee dans le presse-papier!" -ForegroundColor Magenta

    # Copier l'URL dans le presse-papier
    $viewerUrl | Set-Clipboard

    Write-Host "`nAssurez-vous que:" -ForegroundColor Yellow
    Write-Host "   1. Le serveur est lance (wsl + bash scripts/start.sh)"
    Write-Host "   2. Votre tablette est sur le meme reseau Wi-Fi"
    Write-Host "   3. Le pare-feu Windows autorise le port 3000"
} else {
    Write-Host "Impossible de detecter l'adresse IP" -ForegroundColor Red
    Write-Host "   Utilisez la commande 'ipconfig' pour trouver votre IP manuellement"
}

Write-Host ""
