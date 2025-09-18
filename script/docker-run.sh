#!/bin/bash

# Script pour lancer Thalric Dashboard avec Docker

echo "🐋 Démarrage de Thalric Dashboard..."

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
sleep 5

# Vérifier le statut
if curl -f http://localhost:5000/ &> /dev/null; then
    echo "✅ Thalric Dashboard est démarré avec succès!"
    echo "🌐 Accédez à l'application : http://localhost:5000"
    echo ""
    echo "📋 Commandes utiles :"
    echo "  - Voir les logs : docker logs thalric-dashboard"
    echo "  - Arrêter l'app : docker-compose down"
    echo "  - Redémarrer : docker-compose restart"
    echo ""
    echo "💾 Les données sont sauvegardées dans thalric_data.json"
    echo "📁 Les backups automatiques sont dans le dossier ./backups/"
else
    echo "❌ Erreur lors du démarrage. Vérifiez les logs :"
    docker logs thalric-dashboard
    exit 1
fi