# 🐋 Thalric Dashboard - Docker

Guide pour lancer Thalric Dashboard avec Docker.

## 📋 Prérequis

- **Docker** installé sur votre système
- **Docker Compose** installé
- Port **5000** disponible

## 🚀 Démarrage Rapide

### Option 1 : Script automatique (recommandé)

```bash
# Rendre le script exécutable
chmod +x scripts/docker-run.sh

# Lancer l'application
./scripts/docker-run.sh
```

### Option 2 : Commandes manuelles

```bash
# Créer les dossiers nécessaires
mkdir -p logs backups

# Construire et démarrer
docker-compose up --build -d

# Vérifier le statut
docker-compose ps
```

## 🌐 Accès à l'Application

Une fois démarré, accédez à : **http://localhost:5000**

## 📁 Structure des Fichiers

```
thalric-dashboard/
├── Dockerfile              # Configuration du conteneur
├── docker-compose.yml      # Orchestration des services
├── requirements.txt        # Dépendances Python
├── .dockerignore           # Fichiers ignorés par Docker
├── thalric_data.json       # Données du personnage (persistantes)
├── logs/                   # Logs de l'application
├── backups/               # Backups automatiques
└── scripts/
    └── docker-run.sh      # Script de démarrage
```

## 🔧 Commandes Utiles

### Gestion des Conteneurs

```bash
# Voir les conteneurs en cours
docker-compose ps

# Voir les logs en temps réel
docker logs -f thalric-dashboard

# Redémarrer l'application
docker-compose restart

# Arrêter l'application
docker-compose down

# Reconstruire après modifications
docker-compose up --build -d
```

### Sauvegarde et Restauration

```bash
# Sauvegarder manuellement
cp thalric_data.json backups/thalric_data_$(date +%Y%m%d_%H%M%S).json

# Restaurer une sauvegarde
cp backups/thalric_data_YYYYMMDD_HHMMSS.json thalric_data.json
docker-compose restart
```

### Maintenance

```bash
# Voir l'utilisation des ressources
docker stats thalric-dashboard

# Accéder au shell du conteneur (debug)
docker exec -it thalric-dashboard /bin/bash

# Nettoyer les images Docker inutilisées
docker system prune
```

## 💾 Persistance des Données

- **thalric_data.json** : Données du personnage (stats, HP, capacités, inventaire)
- **Backups automatiques** : Toutes les 6 heures dans `./backups/`
- **Rétention** : 7 jours de backups conservés

## 🔒 Sécurité

- Application lancée avec un utilisateur non-root
- Port 5000 exposé uniquement localement
- Données sensibles dans des volumes Docker

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker logs thalric-dashboard

# Vérifier le port
netstat -ln | grep 5000

# Reconstruire complètement
docker-compose down
docker-compose up --build -d
```

### Erreur de permissions

```bash
# Corriger les permissions
sudo chown -R $USER:$USER thalric_data.json
chmod 664 thalric_data.json
```

### Port déjà utilisé

Modifier le port dans `docker-compose.yml` :

```yaml
ports:
  - "5001:5000"  # Utiliser le port 5001 au lieu de 5000
```

## 🔄 Mise à Jour

```bash
# Sauvegarder les données
cp thalric_data.json thalric_data_backup.json

# Télécharger les nouvelles modifications
git pull

# Reconstruire et redémarrer
docker-compose down
docker-compose up --build -d
```

## 📊 Monitoring

Le service inclut un health check automatique :
- Vérification toutes les 30 secondes
- Redémarrage automatique en cas d'échec
- Logs disponibles avec `docker logs`

---

🎲 **Bon jeu avec Thalric Cœur d'Argent !**