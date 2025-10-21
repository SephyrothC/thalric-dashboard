"""
Gestionnaire de statistiques pour Thalric Dashboard
"""
import json
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict


class StatsManager:
    """Gère les statistiques des jets de dés"""

    def __init__(self, stats_file='dice_stats.json'):
        """
        Initialise le gestionnaire de statistiques

        Args:
            stats_file: Fichier JSON pour stocker les statistiques
        """
        self.stats_file = Path(stats_file)
        self.stats = self._load_stats()

    def _load_stats(self):
        """Charge les statistiques depuis le fichier"""
        try:
            if self.stats_file.exists():
                with open(self.stats_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return {
                    'rolls': [],
                    'totals': {
                        'total_rolls': 0,
                        'criticals': 0,
                        'fumbles': 0,
                        'total_damage': 0,
                        'total_healing': 0
                    },
                    'by_type': {}
                }
        except Exception as e:
            print(f"❌ Erreur lors du chargement des stats: {e}")
            return {'rolls': [], 'totals': {}, 'by_type': {}}

    def _save_stats(self):
        """Sauvegarde les statistiques dans le fichier"""
        try:
            with open(self.stats_file, 'w', encoding='utf-8') as f:
                json.dump(self.stats, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde des stats: {e}")

    def record_roll(self, roll_data):
        """
        Enregistre un jet de dé dans les statistiques

        Args:
            roll_data: Dictionnaire avec les données du jet
                {
                    'roll_type': str,
                    'formula': str,
                    'result': int,
                    'critical': bool,
                    'fumble': bool,
                    'damage_type': str (optional)
                }
        """
        try:
            # Ajouter le timestamp
            roll_entry = {
                **roll_data,
                'timestamp': datetime.now().isoformat()
            }

            # Ajouter aux rolls
            self.stats['rolls'].append(roll_entry)

            # Limiter à 1000 derniers rolls pour ne pas exploser en taille
            if len(self.stats['rolls']) > 1000:
                self.stats['rolls'] = self.stats['rolls'][-1000:]

            # Mettre à jour les totaux
            self.stats['totals']['total_rolls'] = self.stats['totals'].get('total_rolls', 0) + 1

            if roll_data.get('critical'):
                self.stats['totals']['criticals'] = self.stats['totals'].get('criticals', 0) + 1

            if roll_data.get('fumble'):
                self.stats['totals']['fumbles'] = self.stats['totals'].get('fumbles', 0) + 1

            # Statistiques par type
            roll_type = roll_data.get('roll_type', 'Unknown')
            if roll_type not in self.stats['by_type']:
                self.stats['by_type'][roll_type] = {
                    'count': 0,
                    'total': 0,
                    'min': float('inf'),
                    'max': 0,
                    'criticals': 0,
                    'fumbles': 0
                }

            type_stats = self.stats['by_type'][roll_type]
            type_stats['count'] += 1
            type_stats['total'] += roll_data.get('result', 0)
            type_stats['min'] = min(type_stats['min'], roll_data.get('result', 0))
            type_stats['max'] = max(type_stats['max'], roll_data.get('result', 0))

            if roll_data.get('critical'):
                type_stats['criticals'] += 1
            if roll_data.get('fumble'):
                type_stats['fumbles'] += 1

            # Sauvegarder
            self._save_stats()

        except Exception as e:
            print(f"❌ Erreur lors de l'enregistrement du roll: {e}")

    def get_summary(self):
        """
        Retourne un résumé des statistiques

        Returns:
            dict: Résumé des statistiques
        """
        totals = self.stats.get('totals', {})
        total_rolls = totals.get('total_rolls', 0)

        if total_rolls == 0:
            return {
                'total_rolls': 0,
                'criticals': 0,
                'fumbles': 0,
                'critical_rate': 0,
                'fumble_rate': 0,
                'average_result': 0
            }

        criticals = totals.get('criticals', 0)
        fumbles = totals.get('fumbles', 0)

        # Calculer la moyenne des résultats
        all_results = [r.get('result', 0) for r in self.stats.get('rolls', [])]
        avg_result = sum(all_results) / len(all_results) if all_results else 0

        return {
            'total_rolls': total_rolls,
            'criticals': criticals,
            'fumbles': fumbles,
            'critical_rate': round((criticals / total_rolls) * 100, 2),
            'fumble_rate': round((fumbles / total_rolls) * 100, 2),
            'average_result': round(avg_result, 2)
        }

    def get_roll_distribution(self):
        """
        Retourne la distribution des jets de d20

        Returns:
            dict: Distribution des résultats de 1 à 20
        """
        distribution = {i: 0 for i in range(1, 21)}

        # Filtrer les jets de d20 seulement
        for roll in self.stats.get('rolls', []):
            formula = roll.get('formula', '')
            result = roll.get('result', 0)

            # Vérifier si c'est un d20 simple (1d20 avec ou sans modificateur)
            if '1d20' in formula and 1 <= result <= 30:
                # Essayer d'extraire le jet de base
                try:
                    # Pour les jets simples, le détail contient le jet de base
                    details = roll.get('details', '')
                    if '(' in details and ')' in details:
                        # Extraire le premier nombre entre parenthèses
                        import re
                        match = re.search(r'\((\d+)', details)
                        if match:
                            base_roll = int(match.group(1))
                            if 1 <= base_roll <= 20:
                                distribution[base_roll] += 1
                except:
                    pass

        return distribution

    def get_stats_by_type(self):
        """
        Retourne les statistiques groupées par type de jet

        Returns:
            dict: Statistiques par type
        """
        stats_by_type = {}

        for roll_type, stats in self.stats.get('by_type', {}).items():
            count = stats.get('count', 0)
            if count > 0:
                stats_by_type[roll_type] = {
                    'count': count,
                    'average': round(stats.get('total', 0) / count, 2),
                    'min': stats.get('min', 0),
                    'max': stats.get('max', 0),
                    'criticals': stats.get('criticals', 0),
                    'fumbles': stats.get('fumbles', 0),
                    'critical_rate': round((stats.get('criticals', 0) / count) * 100, 2),
                    'fumble_rate': round((stats.get('fumbles', 0) / count) * 100, 2)
                }

        return stats_by_type

    def get_recent_rolls(self, limit=20):
        """
        Retourne les derniers jets

        Args:
            limit: Nombre de jets à retourner

        Returns:
            list: Liste des derniers jets
        """
        return self.stats.get('rolls', [])[-limit:][::-1]

    def get_rolls_by_period(self, days=7):
        """
        Retourne les jets par période

        Args:
            days: Nombre de jours à analyser

        Returns:
            dict: Jets groupés par jour
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        rolls_by_day = defaultdict(int)

        for roll in self.stats.get('rolls', []):
            try:
                roll_date = datetime.fromisoformat(roll['timestamp'])
                if roll_date >= cutoff_date:
                    day_key = roll_date.strftime('%Y-%m-%d')
                    rolls_by_day[day_key] += 1
            except:
                continue

        return dict(rolls_by_day)

    def clear_stats(self):
        """Efface toutes les statistiques"""
        self.stats = {
            'rolls': [],
            'totals': {
                'total_rolls': 0,
                'criticals': 0,
                'fumbles': 0
            },
            'by_type': {}
        }
        self._save_stats()

    def export_stats(self):
        """
        Exporte les statistiques au format JSON

        Returns:
            dict: Toutes les statistiques
        """
        return self.stats.copy()

    def import_stats(self, stats_data):
        """
        Importe des statistiques

        Args:
            stats_data: Dictionnaire de statistiques à importer

        Returns:
            bool: True si succès, False sinon
        """
        try:
            # Valider la structure
            if not isinstance(stats_data, dict):
                return False

            self.stats = stats_data
            self._save_stats()
            return True

        except Exception as e:
            print(f"❌ Erreur lors de l'import des stats: {e}")
            return False
