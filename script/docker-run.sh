#!/bin/bash

# Script pour lancer Thalric Dashboard avec WebSocket

echo "🐋 Démarrage de Thalric Dashboard avec WebSocket..."

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p logs backups

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose."
    exit 1
fi

# Arrêter les conteneurs existants s'ils existent
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# Construire et démarrer les conteneurs
echo "🔨 Construction et démarrage des conteneurs..."
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

# Attendre que le service soit prêt
echo "⏳ Attente du démarrage du service..."
sleep 10

# Obtenir l'IP locale pour l'accès tablette
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null)
fi
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

# Vérifier le statut
if curl -f http://localhost:5000/ &> /dev/null; then
    echo "✅ Thalric Dashboard est démarré avec succès!"
    echo ""
    echo "🌐 ACCÈS AU DASHBOARD:"
    echo "  📊 Dashboard principal (PC) : http://localhost:5000"
    echo "  📱 Visionneur de dés (Tablette) : http://$LOCAL_IP:5000/dice-viewer"
    echo ""
    echo "📋 Pages disponibles :"
    echo "  - http://localhost:5000/state (Statistiques)"
    echo "  - http://localhost:5000/combat (Combat)"
    echo "  - http://localhost:5000/spells (Sorts)"
    echo "  - http://localhost:5000/dice (Lanceur de dés)"
    echo "  - http://localhost:5000/inventory (Inventaire)"
    echo "  - http://localhost:5000/dice-viewer (🎲 VISIONNEUR TEMPS RÉEL)"
    echo ""
    echo "🔧 Commandes utiles :"
    echo "  - Voir les logs : docker logs -f thalric-dashboard"
    echo "  - Arrêter l'app : docker-compose down"
    echo "  - Redémarrer : docker-compose restart"
    echo ""
    echo "💾 Les données sont sauvegardées dans thalric_data.json"
    echo "📁 Les backups automatiques sont dans le dossier ./backups/"
    echo ""
    echo "🎲 INSTRUCTIONS TABLETTE:"
    echo "  1. Connectez votre tablette au même réseau Wi-Fi"
    echo "  2. Ouvrez un navigateur sur la tablette"
    echo "  3. Allez sur : http://$LOCAL_IP:5000/dice-viewer"
    echo "  4. Les jets de dés du PC s'afficheront en temps réel!"
    echo ""
    echo "📍 IP détectée pour accès tablette : $LOCAL_IP"
    echo "   Si cette IP ne fonctionne pas, utilisez :"
    echo "   - Windows : ipconfig"
    echo "   - Linux/Mac : ip addr show"
else
    echo "❌ Erreur lors du démarrage. Vérifiez les logs :"
    docker logs thalric-dashboard
    exit 1
fi