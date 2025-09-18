# 🐲 Thalric Cœur d'Argent - Dashboard

<div align="center">

![D&D Logo](https://img.shields.io/badge/D&D-5e-red?style=for-the-badge&logo=dungeonsanddragons)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-green?style=for-the-badge&logo=flask)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

*Une application web interactive pour gérer votre paladin Aasimar niveau 11*

[🚀 Installation](#-installation) •
[📖 Guide](#-guide-dutilisation) •
[🐋 Docker](#-docker) •
[🔧 Développement](#-développement)

</div>

---

## ✨ Fonctionnalités

### 📊 **Page Statistiques**
- **Caractéristiques** interactives avec modificateurs
- **Jets de sauvegarde** et **compétences** cliquables
- **Gestion des HP** en temps réel avec barre de progression
- **Système de repos** (court/long) avec récupération automatique

### ⚔️ **Page Combat**
- **Attaques modulaires** : Sacred Weapon + Divine Smite + Improved Divine Smite
- **Système critique custom** : Dégâts max + dégâts normaux sur 20 naturel
- **Gestion des capacités** : Channel Divinity, Lay on Hands, Divine Sense
- **Radiant Soul** : Activation automatique avec bonus de dégâts
- **Auras passives** : Protection, Courage, Dévotion

### ✨ **Page Sorts**
- **Emplacements visuels** : Cercles colorés par niveau
- **Lancement intelligent** : Consommation au niveau minimum du sort
- **Tous les sorts** du paladin Dévotion niveau 11
- **Cantrips illimités** et **sorts de serment** toujours préparés

### 🎒 **Page Inventaire**
- **Gestion de l'argent** : 5 monnaies avec calcul de richesse totale
- **Bloc-notes** avec sauvegarde automatique
- **Popups structurés** pour ajouter équipement/consommables/trésors
- **Objets magiques** équipés avec statut d'harmonisation
- **Outils utiles** : Convertisseur, calculateur de partage, générateur de butin

---

## 🎯 Technologies

- **Backend** : Python 3.12 + Flask 3.0
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Données** : JSON pour la persistance
- **Containerisation** : Docker + Docker Compose
- **Design** : Interface sombre/dorée responsive

---

## 🚀 Installation

### Option 1 : Docker (Recommandé)

#### Windows (Docker Desktop)
```powershell
# Cloner le repository
git clone https://github.com/votre-username/thalric-dashboard.git
cd thalric-dashboard

# Lancer avec PowerShell
.\scripts\docker-run.ps1
```

#### Linux/Mac
```bash
# Cloner le repository
git clone https://github.com/votre-username/thalric-dashboard.git
cd thalric-dashboard

# Lancer avec bash
chmod +x scripts/docker-run.sh
./scripts/docker-run.sh
```

### Option 2 : Installation Locale

```bash
# Prérequis : Python 3.12+
git clone https://github.com/votre-username/thalric-dashboard.git
cd thalric-dashboard

# Environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Dépendances
pip install flask

# Lancer l'application
python app.py
```

---

## 📖 Guide d'Utilisation

### 🎲 **Jets de Dés**
- **Clique** sur n'importe quelle compétence ou sauvegarde
- **Résultats** affichés dans une popup avec animations
- **Critiques** et **échecs critiques** détectés automatiquement

### ⚔️ **Combat**
1. **Sacred Weapon** : Cocher la case pour +3 attaque
2. **Divine Smite** : Sélectionner le niveau de slot à utiliser  
3. **Radiant Soul** : Activer pour +4 dégâts radiants (1 min)
4. **Capacités** : Utilisations trackées en temps réel

### ✨ **Sorts**
1. **Choisir le niveau** de lancement avec le sélecteur
2. **Cliquer sur un sort** pour le lancer
3. **Emplacements** se vident automatiquement
4. **Règle intelligente** : Les sorts consomment leur niveau minimum

### 🎒 **Inventaire**
1. **Argent** : Saisir des montants (+/-) dans les inputs
2. **Objets** : Utiliser les popups structurés pour ajouter
3. **Notes** : Bloc-notes avec sauvegarde automatique
4. **Outils** : Convertisseur et calculatrices intégrés

---

## 🐋 Docker

### 📋 Prérequis
- Docker Desktop installé et démarré
- Port 5000 disponible

### 🚀 Lancement Rapide
```bash
# Une seule commande pour tout lancer
docker-compose up --build -d

# Accéder à l'application
# http://localhost:5000
```

### 💾 Persistance
- **Données** : `thalric_data.json` synchronisé avec l'hôte
- **Backups** : Automatiques toutes les 6h dans `./backups/`
- **Logs** : Disponibles avec `docker logs thalric-dashboard`

### 🔧 Commandes Utiles
```bash
# Voir les logs en temps réel
docker logs -f thalric-dashboard

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Reconstruire
docker-compose up --build -d
```

---

## 🎨 Captures d'Écran

<details>
<summary>📊 Page Statistiques</summary>

- Caractéristiques avec modificateurs calculés
- Jets interactifs avec résultats animés
- Gestion HP avec barre de progression colorée
- Boutons de repos avec récupération automatique

</details>

<details>
<summary>⚔️ Page Combat</summary>

- Attaques modulaires avec options Sacred Weapon/Divine Smite
- Capacités trackées avec utilisations restantes
- Auras passives clairement affichées
- Système critique custom implémenté

</details>

<details>
<summary>✨ Page Sorts</summary>

- Emplacements visuels avec cercles colorés
- Sorts organisés par niveau avec descriptions
- Consommation intelligente des slots
- Cantrips utilisables à volonté

</details>

<details>
<summary>🎒 Page Inventaire</summary>

- Gestion argent avec 5 monnaies + richesse totale
- Popups structurés pour ajouter objets
- Bloc-notes avec sauvegarde automatique
- Outils utiles intégrés

</details>

---

## 🔧 Développement

### 📁 Structure du Projet
```
thalric-dashboard/
├── app.py                 # Backend Flask
├── thalric_data.json     # Données du personnage
├── static/
│   ├── css/style.css     # Styles
│   └── js/main.js        # JavaScript
├── templates/            # Templates Jinja2
│   ├── base.html
│   ├── state.html
│   ├── combat.html
│   ├── spells.html
│   └── inventory.html
├── scripts/              # Scripts de lancement
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### 🛠️ APIs Backend
- `GET /state` : Page statistiques
- `POST /api/saving_throw` : Jets de sauvegarde
- `POST /api/weapon_attack` : Attaques d'armes  
- `POST /api/cast_spell` : Lancement de sorts
- `POST /api/modify_hp` : Gestion des HP
- `POST /api/use_feature` : Utilisation de capacités
- Et plus...

### 🎨 Fonctionnalités Techniques
- **Temps réel** : Toutes les données mises à jour sans rechargement
- **Animations** : Effets visuels pour les changements d'état
- **Responsive** : Interface adaptée mobile/tablette/desktop
- **Sauvegarde** : JSON automatiquement sauvegardé
- **Validation** : Gestion des erreurs et cas limites

---

## 📋 Configuration du Personnage

Le fichier `thalric_data.json` contient :

### 🧙‍♂️ **Thalric Cœur d'Argent**
- **Race** : Aasimar (Radiant Soul)
- **Classe** : Paladin niveau 11
- **Serment** : Dévotion
- **Background** : Noble

### 📊 **Statistiques**
- **Force** : 16 (+3)
- **Charisme** : 19 (+4) 
- **CA** : 20 (Armure de plaques +1 + Bouclier)
- **HP** : 85 points de vie

### ⚔️ **Équipement Magique**
- **Crystal Longsword** : +1d8 dégâts radiants, 3 charges
- **Sentinel Shield** : Avantage initiative + perception
- **Anneau de résistance au froid**
- **Armure de plaques +1**

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

### 🐛 Signaler un Bug
1. Vérifier les [Issues existantes](https://github.com/votre-username/thalric-dashboard/issues)
2. Créer une nouvelle issue avec :
   - Description du problème
   - Étapes pour reproduire
   - Capture d'écran si applicable

### 💡 Proposer une Fonctionnalité
1. Ouvrir une issue avec le tag `enhancement`
2. Décrire la fonctionnalité souhaitée
3. Expliquer le cas d'usage

### 🔧 Développer
1. Fork le repository
2. Créer une branche : `git checkout -b feature/nouvelle-fonctionnalite`
3. Commiter : `git commit -m "Ajout de la fonctionnalité X"`
4. Pusher : `git push origin feature/nouvelle-fonctionnalite`
5. Ouvrir une Pull Request

<div align="center">

**⚔️ Bon jeu avec Thalric Cœur d'Argent ! ⚔️**

*Fait avec ❤️ pour la communauté D&D*

</div>