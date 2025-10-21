# 🚀 Fonctionnalités Avancées - Thalric Dashboard

Ce document décrit toutes les fonctionnalités avancées ajoutées au dashboard Thalric.

---

## 📋 Table des Matières

1. [Système de Backup Automatique](#système-de-backup-automatique)
2. [Multi-Personnages](#multi-personnages)
3. [Import/Export](#importexport)
4. [Statistiques et Graphiques](#statistiques-et-graphiques)
5. [API Reference](#api-reference)

---

## 💾 Système de Backup Automatique

### Description

Le système de backup automatique crée des sauvegardes régulières et manuelles de vos données de personnage pour éviter toute perte de données.

### Fonctionnalités

- ✅ **Backups automatiques** lors de chaque sauvegarde
- ✅ **Backups manuels** à la demande
- ✅ **Backup pré-import** avant toute importation de personnage
- ✅ **Backup pré-restauration** avant de restaurer un ancien backup
- ✅ **Gestion intelligente** : Conservation des 10 derniers backups par catégorie
- ✅ **Téléchargement** de n'importe quel backup
- ✅ **Restauration** en un clic avec confirmation

### Types de Backups

| Type | Description | Quand ? |
|------|-------------|---------|
| `auto` | Backup automatique | À chaque modification du personnage |
| `manual` | Backup manuel | Créé par l'utilisateur |
| `pre_import` | Backup de sécurité | Avant l'import d'un personnage |
| `pre_restore` | Backup de sécurité | Avant la restauration d'un backup |

### Utilisation

**Via l'Interface (/manage):**

1. Accédez à `/manage`
2. Section "💾 Sauvegardes (Backups)"
3. Cliquez sur "➕ Créer un Backup Manuel"
4. Pour restaurer : cliquez sur ↩️ à côté du backup souhaité
5. Pour télécharger : cliquez sur 💾
6. Pour supprimer : cliquez sur 🗑️

**Via l'API:**

```bash
# Lister les backups
curl http://localhost:5000/api/backups/list

# Créer un backup
curl -X POST http://localhost:5000/api/backups/create \
  -H "Content-Type: application/json" \
  -d '{"label": "manual"}'

# Restaurer un backup
curl -X POST http://localhost:5000/api/backups/restore \
  -H "Content-Type: application/json" \
  -d '{"filename": "manual_20251021_143000.json"}'

# Télécharger un backup
curl http://localhost:5000/api/backups/download/manual_20251021_143000.json -O
```

### Stockage

- **Emplacement** : `/backups/`
- **Format** : JSON
- **Nom** : `{label}_{timestamp}.json`
- **Exemple** : `auto_20251021_143522.json`

---

## 👥 Multi-Personnages

### Description

Gérez plusieurs personnages D&D avec une seule instance du dashboard. Basculez facilement entre vos différents héros !

### Fonctionnalités

- ✅ **Personnage principal** : Thalric (non supprimable)
- ✅ **Créer** de nouveaux personnages
- ✅ **Basculer** entre personnages
- ✅ **Supprimer** les personnages secondaires
- ✅ **Structure par défaut** pour nouveaux personnages

### Utilisation

**Créer un Nouveau Personnage:**

1. Allez sur `/manage`
2. Section "👥 Personnages"
3. Cliquez sur "➕ Nouveau Personnage"
4. Entrez le nom (ex: "Gandalf le Gris")
5. Cliquez sur "Créer"

Le personnage sera créé dans `/characters/{nom_sécurisé}.json`

**Changer de Personnage Actif:**

1. Dans la liste des personnages
2. Cliquez sur "✓ Activer" à côté du personnage souhaité
3. Le dashboard se recharge avec les données du nouveau personnage

**Supprimer un Personnage:**

1. Cliquez sur 🗑️ à côté du personnage
2. Confirmez la suppression
3. ⚠️ Le personnage principal (Thalric) ne peut pas être supprimé

### Stockage

**Fichiers:**
- Personnage principal : `/thalric_data.json`
- Autres personnages : `/characters/{nom}.json`
- Personnage actif : `/current_character.txt`

**Structure d'un Nouveau Personnage:**

```json
{
  "character_info": {
    "name": "Nom du Personnage",
    "level": 1,
    "class": "Guerrier",
    "race": "Humain",
    ...
  },
  "stats": {...},
  "skills": {},
  "spells": {},
  "inventory": {}
}
```

---

## 📤 Import/Export

### Description

Partagez vos personnages ou sauvegardez-les localement grâce aux fonctionnalités d'import/export.

### Fonctionnalités

- ✅ **Export JSON** : Téléchargez votre personnage au format JSON
- ✅ **Import Fichier** : Importez un personnage depuis un fichier JSON
- ✅ **Validation** : Vérification du format avant import
- ✅ **Backup automatique** : Un backup est créé avant chaque import

### Export

**Via l'Interface:**

1. Allez sur `/manage`
2. Section "📤 Import / Export"
3. Cliquez sur "📥 Télécharger le Personnage (JSON)"
4. Le fichier est téléchargé : `{Nom_Personnage}_2025-10-21.json`

**Via l'API:**

```bash
curl http://localhost:5000/api/export > mon_personnage.json
```

### Import

**Via l'Interface:**

1. Allez sur `/manage`
2. Section "📤 Import / Export"
3. Cliquez sur "📤 Importer un Personnage"
4. Sélectionnez le fichier JSON
5. Confirmez l'import
6. ⚠️ Un backup `pre_import` est automatiquement créé

**Via l'API:**

```bash
# Import JSON direct
curl -X POST http://localhost:5000/api/import \
  -H "Content-Type: application/json" \
  -d @mon_personnage.json

# Import fichier
curl -X POST http://localhost:5000/api/import/file \
  -F "file=@mon_personnage.json"
```

### Format JSON

Le fichier doit contenir au minimum :

```json
{
  "character_info": {
    "name": "...",
    "level": 1,
    "class": "...",
    "race": "..."
  },
  "stats": {...},
  // ... autres sections
}
```

---

## 📊 Statistiques et Graphiques

### Description

Analysez vos jets de dés avec des statistiques détaillées et des graphiques visuels. Toutes les données sont collectées automatiquement !

### Fonctionnalités

- ✅ **Collecte automatique** de tous les jets
- ✅ **Résumé général** (total, critiques, échecs, moyenne)
- ✅ **Distribution d20** : Visualisez la fréquence de chaque résultat
- ✅ **Stats par type** : Analyse par type de jet (Sauvegarde, Attaque, etc.)
- ✅ **Graphique temporel** : Activité sur les 7 derniers jours
- ✅ **Jets récents** : Historique des 20 derniers jets
- ✅ **Export/Import** des statistiques

### Données Collectées

Pour chaque jet de dé :
- Type de jet (Sauvegarde, Attaque, etc.)
- Formule (1d20+5, 2d6, etc.)
- Résultat final
- Critique / Échec critique
- Timestamp
- Type de dégâts (si applicable)

### Graphiques Disponibles

**1. Distribution des Jets de d20**
- Type : Histogramme (barres)
- Affiche : Fréquence de chaque résultat (1-20)
- Couleurs :
  - 🟢 Vert : Résultat = 20 (Critique)
  - 🔴 Rouge : Résultat = 1 (Échec)
  - 🟡 Or : Résultats normaux

**2. Activité sur 7 Jours**
- Type : Graphique linéaire
- Affiche : Nombre de jets par jour
- Période : 7 derniers jours

### Utilisation

**Via l'Interface (/statistics):**

1. Accédez à `/statistics`
2. Toutes les stats se chargent automatiquement
3. Actualisation toutes les 30 secondes

**Via l'API:**

```bash
# Résumé général
curl http://localhost:5000/api/stats/summary

# Distribution d20
curl http://localhost:5000/api/stats/distribution

# Stats par type
curl http://localhost:5000/api/stats/by_type

# Jets récents (20 derniers)
curl http://localhost:5000/api/stats/recent?limit=20

# Activité par période (7 jours)
curl http://localhost:5000/api/stats/by_period?days=7

# Effacer toutes les stats
curl -X POST http://localhost:5000/api/stats/clear

# Exporter les stats
curl http://localhost:5000/api/stats/export > stats.json
```

### Stockage

- **Fichier** : `/dice_stats.json`
- **Limite** : 1000 derniers jets conservés
- **Format** : JSON structuré

**Structure:**

```json
{
  "rolls": [
    {
      "roll_type": "Sauvegarde STR",
      "formula": "1d20+3",
      "result": 15,
      "critical": false,
      "fumble": false,
      "timestamp": "2025-10-21T14:35:22"
    }
  ],
  "totals": {
    "total_rolls": 150,
    "criticals": 7,
    "fumbles": 8
  },
  "by_type": {
    "Sauvegarde STR": {
      "count": 12,
      "total": 156,
      "min": 5,
      "max": 23,
      "criticals": 1,
      "fumbles": 0
    }
  }
}
```

### Métriques Calculées

**Par Type de Jet:**
- Nombre total de jets
- Résultat moyen
- Min / Max
- Nombre de critiques
- Nombre d'échecs
- Taux de critique (%)
- Taux d'échec (%)

**Global:**
- Total de tous les jets
- Moyenne générale
- Taux de critique global
- Taux d'échec global

---

## 🔌 API Reference

### Endpoints Backups

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/backups/list` | GET | Liste tous les backups |
| `/api/backups/create` | POST | Crée un backup |
| `/api/backups/restore` | POST | Restaure un backup |
| `/api/backups/delete` | POST | Supprime un backup |
| `/api/backups/download/<filename>` | GET | Télécharge un backup |

### Endpoints Personnages

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/characters/list` | GET | Liste tous les personnages |
| `/api/characters/switch` | POST | Change de personnage actif |
| `/api/characters/create` | POST | Crée un nouveau personnage |
| `/api/characters/delete` | POST | Supprime un personnage |

### Endpoints Import/Export

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/export` | GET | Exporte le personnage actuel |
| `/api/import` | POST | Importe un personnage (JSON body) |
| `/api/import/file` | POST | Importe un personnage (fichier) |

### Endpoints Statistiques

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/stats/summary` | GET | Résumé général |
| `/api/stats/distribution` | GET | Distribution d20 |
| `/api/stats/by_type` | GET | Stats par type |
| `/api/stats/recent` | GET | Jets récents |
| `/api/stats/by_period` | GET | Stats temporelles |
| `/api/stats/clear` | POST | Efface les stats |
| `/api/stats/export` | GET | Exporte les stats |

### Pages Web

| Page | Route | Description |
|------|-------|-------------|
| Gestion | `/manage` | Interface de gestion complète |
| Statistiques | `/statistics` | Graphiques et analyses |

---

## 🛡️ Sécurité

### Backups Automatiques

Tous les backups automatiques sont créés **avant** toute opération destructive :
- ✅ Modification du personnage
- ✅ Import de personnage
- ✅ Restauration d'un backup

### Validations

- ✅ Validation du format JSON lors de l'import
- ✅ Vérification de la structure minimale
- ✅ Impossible de supprimer le personnage principal
- ✅ Confirmation requise pour les actions destructives

### Limites

- Backups : 10 par catégorie
- Stats : 1000 derniers jets
- Personnages : Illimités (limité par l'espace disque)

---

## 🚀 Performance

### Optimisations

- ✅ Chargement asynchrone des statistiques
- ✅ Graphiques optimisés avec Chart.js
- ✅ Actualisation auto toutes les 30s sur `/statistics`
- ✅ Backups compression native JSON

### Espace Disque

**Estimation par personnage:**
- Données : ~50 KB
- Backup : ~50 KB
- Stats : ~100 KB (pour 1000 jets)

**Pour 10 backups + 1 personnage + stats:**
- Total : ~650 KB

---

## 📝 Cas d'Usage

### Scénario 1 : Gérer plusieurs personnages de campagne

```
1. Créez "Gandalf" depuis /manage
2. Créez "Aragorn" depuis /manage
3. Jouez avec Gandalf → Stats collectées
4. Basculez vers Aragorn
5. Jouez avec Aragorn → Stats séparées
6. Consultez /statistics pour chaque personnage
```

### Scénario 2 : Partager un personnage

```
1. Allez sur /manage
2. Exportez votre personnage → thalric_2025-10-21.json
3. Envoyez le fichier à un ami
4. L'ami importe le fichier
5. Il joue avec votre personnage !
```

### Scénario 3 : Analyser la chance

```
1. Jouez plusieurs sessions
2. Allez sur /statistics
3. Consultez la distribution d20
4. Si trop de 1 → Changez de dés ! 😄
5. Comparez les taux de critique par type de jet
```

### Scénario 4 : Récupération après erreur

```
1. Erreur lors de l'import d'un personnage corrompu
2. Allez sur /manage
3. Section Backups
4. Restaurez le dernier backup "pre_import"
5. Tout est revenu à la normale !
```

---

## 🔧 Dépannage

### Les backups ne se créent pas

- Vérifiez que le dossier `/backups/` existe et est accessible en écriture
- Vérifiez les logs : `docker logs thalric-dashboard`

### Les stats ne s'affichent pas

- Vérifiez que `/dice_stats.json` existe
- Lancez quelques dés pour commencer à collecter des données
- Actualisez la page `/statistics`

### Erreur lors de l'import

- Vérifiez le format JSON du fichier
- Le fichier doit contenir au moins `character_info`
- Consultez les logs pour plus de détails

### Les graphiques ne s'affichent pas

- Vérifiez la connexion internet (Chart.js est chargé via CDN)
- Vérifiez la console navigateur (F12) pour erreurs JavaScript
- Essayez de vider le cache

---

## 📚 Resources

- **Chart.js** : https://www.chartjs.org/
- **Flask Documentation** : https://flask.palletsprojects.com/
- **D&D 5e SRD** : https://www.dndbeyond.com/sources/basic-rules

---

**🎲 Profitez de vos aventures avec Thalric ! ⚔️**
