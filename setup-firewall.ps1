# Script PowerShell pour configurer le pare-feu Windows
# DOIT ETRE EXECUTE EN TANT QU'ADMINISTRATEUR

Write-Host "`nConfiguration du Pare-feu Windows pour Thalric Dashboard`n" -ForegroundColor Cyan

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

# Supprimer l'ancienne regle si elle existe
$existingRule = Get-NetFirewallRule -DisplayName "Thalric Dashboard" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Suppression de l'ancienne regle..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Thalric Dashboard"
}

# Creer la nouvelle regle
Write-Host "Creation de la regle de pare-feu..." -ForegroundColor Green

try {
    New-NetFirewallRule `
        -DisplayName "Thalric Dashboard" `
        -Description "Allow access to Thalric Dashboard from local network" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Enabled True

    Write-Host "Regle de pare-feu creee avec succes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Details de la regle:" -ForegroundColor Cyan
    Write-Host "   Nom: Thalric Dashboard"
    Write-Host "   Port: 3000 (TCP)"
    Write-Host "   Direction: Entrant"
    Write-Host "   Profils: Domaine, Prive, Public"
    Write-Host ""
    Write-Host "Vous pouvez maintenant acceder au serveur depuis votre tablette!" -ForegroundColor Magenta
} catch {
    Write-Host "ERREUR lors de la creation de la regle:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host ""
pause
