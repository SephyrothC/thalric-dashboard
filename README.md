# 🎲 Installation du Visionneur de Dés en Temps Réel

## 📦 Étape 1 : Copier les Fichiers

### 1. Remplacer `requirements.txt`
```bash
# Supprimer l'ancien fichier
rm requirements.txt

# Copier le nouveau contenu (voir artefact requirements_txt_updated)
```

### 2. Remplacer `app.py`
```bash
# Faire une sauvegarde de l'ancien
cp app.py app.py.backup

# Copier le nouveau contenu (voir artefact app_py_websocket)
```

### 3. Créer `templates/dice_viewer.html`
```bash
# Créer le fichier (voir artefact dice_viewer_html)
# S'assurer que le dossier templates/ existe
```

### 4. Remplacer `docker-compose.yml`
```bash
# Faire une sauvegarde
cp docker-compose.yml docker-compose.yml.backup

# Copier le nouveau contenu (voir artefact docker_compose_updated)
```

### 5. Remplacer `Dockerfile`
```bash
# Faire une sauvegarde
cp Dockerfile Dockerfile.backup

# Copier le nouveau contenu (voir artefact dockerfile_updated)
```

### 6. Remplacer `scripts/docker-run.sh`
```bash
# Faire une sauvegarde
cp scripts/docker-run.sh scripts/docker-run.sh.backup

# Copier le nouveau contenu (voir artefact docker_run_script)
# Rendre exécutable
chmod +x scripts/docker-run.sh
```

### 7. Remplacer `static/js/main.js`
```bash
# Faire une sauvegarde
cp static/js/main.js static/js/main.js.backup

# Copier le nouveau contenu (voir artefact main_js_updated)
```

## 🚀 Étape 2 : Lancement

### Option 1 : Script automatique (recommandé)
```bash
./scripts/docker-run.sh
```

### Option 2 : Commandes manuelles
```bash
# Arrêter l'application existante
docker-compose down

# Reconstruire avec les nouvelles dépendances
docker-compose up --build -d

# Vérifier les logs
docker logs -f thalric-dashboard
```

## 📱 Étape 3 : Test de Fonctionnement

### 1. Accès PC (Dashboard principal)
```
http://localhost:5000
```

### 2. Accès Tablette (Visionneur de dés)
```
http://[IP_de_votre_PC]:5000/dice-viewer
```

**Pour trouver l'IP de votre PC :**
- **Windows** : `ipconfig` dans l'invite de commande
- **Linux/Mac** : `ip addr show` ou `ifconfig`
- **Le script vous affiche automatiquement l'IP détectée**

### 3. Test des Jets de Dés
1. Ouvrir le dashboard sur PC
2. Ouvrir le visionneur sur tablette
3. Lancer un dé sur le PC (n'importe quelle page)
4. Vérifier que le résultat s'affiche sur la tablette

## 🔧 Étape 4 : Dépannage

### Problème : La tablette ne se connecte pas
```bash
# Vérifier l'IP du PC
hostname -I

# Tester la connectivité depuis la tablette
# Ouvrir un navigateur et aller sur : http://[IP_PC]:5000
```

### Problème : WebSocket ne fonctionne pas
```bash
# Vérifier les logs du conteneur
docker logs -f thalric-dashboard

# Redémarrer le conteneur
docker-compose restart
```

### Problème : Port 5000 occupé
```bash
# Changer le port dans docker-compose.yml
# Remplacer "5000:5000" par "5001:5000"
# Puis accéder via http://localhost:5001
```

### Problème : Pare-feu bloque la connexion
**Windows :**
1. Panneau de configuration → Système et sécurité → Pare-feu Windows
2. Autoriser une application → Ajouter Python.exe
3. Ou autoriser le port 5000

**Linux :**
```bash
sudo ufw allow 5000
```

## 🌐 Étape 5 : Configuration Réseau

### Pour accès depuis d'autres appareils
1. **PC et tablette sur le même Wi-Fi**
2. **Trouver l'IP locale du PC**
3. **Autoriser les connexions externes** (pare-feu)
4. **Tester la connectivité**

### URLs d'accès
- **Dashboard complet** : `http://[IP_PC]:5000`
- **Statistiques** : `http://[IP_PC]:5000/state`
- **Combat** : `http://[IP_PC]:5000/combat`
- **Sorts** : `http://[IP_PC]:5000/spells`
- **Dés** : `http://[IP_PC]:5000/dice`
- **Inventaire** : `http://[IP_PC]:5000/inventory`
- **🎲 Visionneur** : `http://[IP_PC]:5000/dice-viewer`

## ✅ Vérification du Succès

### Indicateurs de bon fonctionnement :
1. ✅ Le dashboard charge sur PC
2. ✅ Le visionneur charge sur tablette
3. ✅ Le statut "Connecté" s'affiche sur la tablette
4. ✅ Les jets de dés PC apparaissent sur tablette
5. ✅ Les animations fonctionnent (critiques, échecs)
6. ✅ L'historique des 20 derniers jets s'affiche

### Pages avec diffusion WebSocket :
- ✅ Jets de sauvegarde
- ✅ Tests de compétences
- ✅ Attaques d'armes
- ✅ Lancement de sorts
- ✅ Utilisation de capacités (Healing Hands, Lay on Hands)
- ✅ Jets personnalisés depuis la page Dés

## 🎯 Fonctionnalités du Visionneur

### Affichage en Temps Réel :
- **Type de jet** (Attaque, Sauvegarde, etc.)
- **Formule utilisée** (1d20+5, 2d6+3, etc.)
- **Résultat final** (grand affichage numérique)
- **Détails du calcul** (dés individuels + modificateurs)
- **Timestamp** de chaque jet
- **Indicateurs spéciaux** (Critique, Échec, Dégâts)

### Animations Spéciales :
- 🎯 **Critiques** : Bordure dorée + effet de brillance
- 💀 **Échecs critiques** : Bordure rouge + effet de tremblement
- ⚔️ **Dégâts** : Bordure orange + effet de dégâts
- ✨ **Effets d'entrée** : Glissement + transparence
- 🌟 **Effet shimmer** : Barre de lumière qui traverse

### Interface Tactile :
- **Responsive** : S'adapte aux tablettes et mobiles
- **Mode paysage** : Optimisé pour orientation horizontale
- **Scroll automatique** : Vers les nouveaux résultats
- **Historique** : 20 derniers jets conservés
- **Indicateur de connexion** : Temps réel avec animation

## 📊 Types de Jets Diffusés

### 🎲 Jets de Base :
- Jets de sauvegarde (toutes caractéristiques)
- Tests de compétences (Athlétisme, Persuasion, etc.)
- Jets d'initiative
- Jets de perception

### ⚔️ Jets de Combat :
- Attaques d'armes (Crystal Longsword)
- Dégâts d'armes (base + magique + smite)
- Attaques de sorts
- Jets de critique (règle custom)

### ✨ Jets de Capacités :
- Healing Hands (4d4)
- Lay on Hands (montant choisi)
- Channel Divinity
- Divine Sense

### 🎯 Jets Personnalisés :
- Tous jets depuis la page Dés
- Formules complexes (3d6+2d4+5)
- Jets avec avantage/désavantage
- Génération de statistiques

## 🔗 Architecture WebSocket

### Flux de Données :
```
PC (Dashboard) → Flask-SocketIO → Tablette (Visionneur)
     ↓
   Jet de dé lancé
     ↓
   API traite le jet
     ↓
   broadcast_dice_result()
     ↓
   WebSocket diffuse
     ↓
   Tablette reçoit et affiche
```

### Sécurité :
- **CORS autorisé** pour connexions cross-origin
- **Réseau local** uniquement (pas d'exposition internet)
- **Aucune données sensibles** transmises
- **Reconnexion automatique** en cas de déconnexion

## 🎮 Utilisation en Jeu

### Scenario Typique :
1. **MJ sur PC** : Lance le dashboard complet
2. **Joueurs** : Accèdent au visionneur sur tablettes/téléphones
3. **Session de jeu** : Tous les jets du MJ sont visibles par les joueurs
4. **Immersion** : Résultats spectaculaires avec animations
5. **Historique** : Retour possible sur les jets précédents

### Avantages :
- ✅ **Transparence** : Tous voient les jets du MJ
- ✅ **Spectacle** : Effets visuels immersifs
- ✅ **Praticité** : Pas besoin de répéter les résultats
- ✅ **Engagement** : Joueurs connectés aux jets importants
- ✅ **Historique** : Référence aux jets précédents
- ✅ **Multi-device** : Chaque joueur sur son appareil

## 🛠️ Maintenance et Support

### Logs et Débogage :
```bash
# Voir les logs WebSocket
docker logs -f thalric-dashboard | grep "🎲"

# Vérifier les connexions WebSocket
docker logs -f thalric-dashboard | grep "Client"

# Tester la connectivité
curl http://localhost:5000/dice-viewer
```

### Sauvegarde et Restauration :
```bash
# Sauvegarder la configuration actuelle
cp -r thalric-dashboard thalric-dashboard-backup

# Restaurer en cas de problème
cp -r thalric-dashboard-backup thalric-dashboard
```

### Mise à Jour Future :
```bash
# Arrêter l'application
docker-compose down

# Mettre à jour le code
git pull  # Si vous utilisez git

# Reconstruire
docker-compose up --build -d
```

## 🎉 Conclusion

Après installation, vous disposerez de :

### 💻 Dashboard PC Complet :
- Toutes les fonctionnalités existantes
- Interface de gestion du personnage
- Lancement de tous types de jets
- Gestion de l'inventaire et des sorts

### 📱 Visionneur Tablette :
- Interface dédiée à l'affichage des dés
- Synchronisation temps réel
- Animations et effets visuels
- Optimisé pour l'expérience tactile

### 🌐 Écosystème Multi-Device :
- Connexion réseau local
- Support multiple tablettes
- Pas de configuration complexe
- Fonctionne avec votre setup Docker existant

**🎲 Bon jeu avec Thalric et profitez de votre nouveau système de dés en temps réel ! ⚔️**

---

*Cette solution transforme votre dashboard D&D en véritable table de jeu connectée, où chaque jet devient un spectacle partagé par tous les joueurs !*