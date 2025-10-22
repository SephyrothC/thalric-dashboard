"""
Gestionnaire des conditions et états pour Thalric Dashboard
Gère les conditions D&D 5e et leurs effets sur le personnage
"""
import json
from datetime import datetime, timedelta
from pathlib import Path


class ConditionsManager:
    """Gère les conditions actives du personnage"""

    # Définitions des conditions D&D 5e
    CONDITIONS_DEFINITIONS = {
        'blinded': {
            'name': 'Aveuglé',
            'name_en': 'Blinded',
            'icon': '👁️‍🗨️',
            'color': '#6c757d',
            'effects': [
                'Échec automatique aux tests basés sur la vue',
                'Désavantage aux jets d\'attaque',
                'Les attaques contre vous ont l\'avantage'
            ]
        },
        'charmed': {
            'name': 'Charmé',
            'name_en': 'Charmed',
            'icon': '💖',
            'color': '#e83e8c',
            'effects': [
                'Ne peut pas attaquer le charmeur',
                'Le charmeur a l\'avantage aux tests sociaux'
            ]
        },
        'deafened': {
            'name': 'Assourdi',
            'name_en': 'Deafened',
            'icon': '🔇',
            'color': '#6c757d',
            'effects': [
                'Échec automatique aux tests basés sur l\'ouïe'
            ]
        },
        'frightened': {
            'name': 'Effrayé',
            'name_en': 'Frightened',
            'icon': '😨',
            'color': '#ffc107',
            'effects': [
                'Désavantage aux jets de caractéristique et d\'attaque tant que la source est visible',
                'Ne peut pas se rapprocher volontairement de la source'
            ]
        },
        'grappled': {
            'name': 'Empoigné',
            'name_en': 'Grappled',
            'icon': '🤝',
            'color': '#17a2b8',
            'effects': [
                'Vitesse réduite à 0',
                'Ne bénéficie d\'aucun bonus à la vitesse'
            ]
        },
        'incapacitated': {
            'name': 'Neutralisé',
            'name_en': 'Incapacitated',
            'icon': '😵',
            'color': '#dc3545',
            'effects': [
                'Ne peut pas effectuer d\'action ni de réaction'
            ]
        },
        'invisible': {
            'name': 'Invisible',
            'name_en': 'Invisible',
            'icon': '👻',
            'color': '#6610f2',
            'effects': [
                'Impossible à voir sans magie ou sens spécial',
                'Avantage aux jets d\'attaque',
                'Les attaques contre vous ont le désavantage',
                'Considéré fortement obscurci pour se cacher'
            ]
        },
        'paralyzed': {
            'name': 'Paralysé',
            'name_en': 'Paralyzed',
            'icon': '🥶',
            'color': '#20c997',
            'effects': [
                'Neutralisé (ne peut pas agir ni réagir)',
                'Échec automatique aux jets de Force et Dextérité',
                'Les attaques contre vous ont l\'avantage',
                'Attaques au corps à corps à 5 ft sont des coups critiques'
            ]
        },
        'petrified': {
            'name': 'Pétrifié',
            'name_en': 'Petrified',
            'icon': '🗿',
            'color': '#6c757d',
            'effects': [
                'Transformé en substance inanimée',
                'Neutralisé',
                'Échec automatique aux jets de Force et Dextérité',
                'Les attaques contre vous ont l\'avantage',
                'Résistance à tous les dégâts',
                'Immunité au poison et aux maladies'
            ]
        },
        'poisoned': {
            'name': 'Empoisonné',
            'name_en': 'Poisoned',
            'icon': '☠️',
            'color': '#28a745',
            'effects': [
                'Désavantage aux jets d\'attaque',
                'Désavantage aux jets de caractéristique'
            ]
        },
        'prone': {
            'name': 'À terre',
            'name_en': 'Prone',
            'icon': '⬇️',
            'color': '#795548',
            'effects': [
                'Désavantage aux jets d\'attaque',
                'Attaques au corps à corps contre vous ont l\'avantage',
                'Attaques à distance contre vous ont le désavantage',
                'Coûte la moitié du mouvement pour se relever'
            ]
        },
        'restrained': {
            'name': 'Entravé',
            'name_en': 'Restrained',
            'icon': '⛓️',
            'color': '#607d8b',
            'effects': [
                'Vitesse réduite à 0',
                'Désavantage aux jets d\'attaque',
                'Désavantage aux jets de sauvegarde de Dextérité',
                'Les attaques contre vous ont l\'avantage'
            ]
        },
        'stunned': {
            'name': 'Étourdi',
            'name_en': 'Stunned',
            'icon': '💫',
            'color': '#fd7e14',
            'effects': [
                'Neutralisé (ne peut pas agir ni réagir)',
                'Échec automatique aux jets de sauvegarde de Force et Dextérité',
                'Les attaques contre vous ont l\'avantage',
                'Peut parler de façon hésitante'
            ]
        },
        'unconscious': {
            'name': 'Inconscient',
            'name_en': 'Unconscious',
            'icon': '😴',
            'color': '#343a40',
            'effects': [
                'Neutralisé et ne peut pas bouger ni parler',
                'Lâche ce qu\'il tient et tombe à terre',
                'Échec automatique aux jets de Force et Dextérité',
                'Les attaques contre vous ont l\'avantage',
                'Attaques au corps à corps à 5 ft sont des coups critiques',
                'Inconscient de l\'environnement'
            ]
        },
        'exhaustion_1': {
            'name': 'Épuisement (Niv. 1)',
            'name_en': 'Exhaustion 1',
            'icon': '😓',
            'color': '#f44336',
            'effects': [
                'Désavantage aux jets de caractéristique'
            ]
        },
        'exhaustion_2': {
            'name': 'Épuisement (Niv. 2)',
            'name_en': 'Exhaustion 2',
            'icon': '😫',
            'color': '#e91e63',
            'effects': [
                'Désavantage aux jets de caractéristique',
                'Vitesse réduite de moitié'
            ]
        },
        'exhaustion_3': {
            'name': 'Épuisement (Niv. 3)',
            'name_en': 'Exhaustion 3',
            'icon': '😩',
            'color': '#9c27b0',
            'effects': [
                'Désavantage aux jets de caractéristique',
                'Vitesse réduite de moitié',
                'Désavantage aux jets d\'attaque et de sauvegarde'
            ]
        },
        'exhaustion_4': {
            'name': 'Épuisement (Niv. 4)',
            'name_en': 'Exhaustion 4',
            'icon': '🥵',
            'color': '#673ab7',
            'effects': [
                'Désavantage aux jets de caractéristique',
                'Vitesse réduite de moitié',
                'Désavantage aux jets d\'attaque et de sauvegarde',
                'Maximum de points de vie réduit de moitié'
            ]
        },
        'exhaustion_5': {
            'name': 'Épuisement (Niv. 5)',
            'name_en': 'Exhaustion 5',
            'icon': '💀',
            'color': '#3f51b5',
            'effects': [
                'Désavantage aux jets de caractéristique',
                'Vitesse réduite de moitié',
                'Désavantage aux jets d\'attaque et de sauvegarde',
                'Maximum de points de vie réduit de moitié',
                'Vitesse réduite à 0'
            ]
        },
        'exhaustion_6': {
            'name': 'Épuisement (Niv. 6)',
            'name_en': 'Exhaustion 6',
            'icon': '☠️',
            'color': '#000000',
            'effects': [
                'Mort'
            ]
        },
        'concentrating': {
            'name': 'Concentré',
            'name_en': 'Concentrating',
            'icon': '🧠',
            'color': '#2196f3',
            'effects': [
                'Maintient un sort nécessitant la concentration',
                'Perte de concentration si dégâts (jet de CON DD 10 ou 1/2 dégâts)',
                'Perte de concentration si neutralisé ou tué',
                'Un seul sort de concentration à la fois'
            ]
        }
    }

    def __init__(self, character_file='thalric_data.json'):
        """
        Initialise le gestionnaire de conditions

        Args:
            character_file: Fichier JSON du personnage
        """
        self.character_file = Path(character_file)
        self.conditions = self._load_conditions()

    def _load_conditions(self):
        """Charge les conditions depuis le fichier du personnage"""
        try:
            if self.character_file.exists():
                with open(self.character_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('conditions', [])
            return []
        except Exception as e:
            print(f"❌ Erreur lors du chargement des conditions: {e}")
            return []

    def _save_conditions(self):
        """Sauvegarde les conditions dans le fichier du personnage"""
        try:
            if self.character_file.exists():
                with open(self.character_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                data['conditions'] = self.conditions

                with open(self.character_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                return True
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde des conditions: {e}")
            return False

    def add_condition(self, condition_id, duration_type='permanent', duration_value=None, source='', notes=''):
        """
        Ajoute une condition au personnage

        Args:
            condition_id: ID de la condition (ex: 'poisoned')
            duration_type: Type de durée ('instant', 'rounds', 'minutes', 'hours', 'long_rest', 'permanent')
            duration_value: Valeur de la durée (nombre de rounds/minutes/heures)
            source: Source de la condition (nom du sort, capacité, etc.)
            notes: Notes personnalisées

        Returns:
            dict: La condition ajoutée ou None si erreur
        """
        if condition_id not in self.CONDITIONS_DEFINITIONS:
            print(f"⚠️  Condition inconnue: {condition_id}")
            return None

        # Vérifier si la condition existe déjà
        for cond in self.conditions:
            if cond['id'] == condition_id:
                print(f"⚠️  Condition {condition_id} déjà active")
                return None

        condition_def = self.CONDITIONS_DEFINITIONS[condition_id]

        # Calculer l'expiration si applicable
        expires_at = None
        if duration_type == 'rounds' and duration_value:
            # Les rounds sont immédiats, pas de timestamp
            pass
        elif duration_type == 'minutes' and duration_value:
            expires_at = (datetime.now() + timedelta(minutes=duration_value)).isoformat()
        elif duration_type == 'hours' and duration_value:
            expires_at = (datetime.now() + timedelta(hours=duration_value)).isoformat()

        new_condition = {
            'id': condition_id,
            'name': condition_def['name'],
            'icon': condition_def['icon'],
            'color': condition_def['color'],
            'effects': condition_def['effects'],
            'duration_type': duration_type,
            'duration_value': duration_value,
            'expires_at': expires_at,
            'source': source,
            'notes': notes,
            'added_at': datetime.now().isoformat()
        }

        self.conditions.append(new_condition)
        self._save_conditions()

        print(f"✅ Condition ajoutée: {condition_def['name']}")
        return new_condition

    def remove_condition(self, condition_id):
        """
        Retire une condition du personnage

        Args:
            condition_id: ID de la condition à retirer

        Returns:
            bool: True si retiré, False sinon
        """
        for i, cond in enumerate(self.conditions):
            if cond['id'] == condition_id:
                removed = self.conditions.pop(i)
                self._save_conditions()
                print(f"✅ Condition retirée: {removed['name']}")
                return True

        print(f"⚠️  Condition {condition_id} non trouvée")
        return False

    def get_active_conditions(self):
        """
        Retourne toutes les conditions actives (non expirées)

        Returns:
            list: Liste des conditions actives
        """
        now = datetime.now()
        active = []

        for cond in self.conditions:
            # Vérifier l'expiration
            if cond.get('expires_at'):
                expires = datetime.fromisoformat(cond['expires_at'])
                if now > expires:
                    # Condition expirée, la retirer
                    print(f"⏰ Condition expirée: {cond['name']}")
                    continue

            active.append(cond)

        # Nettoyer les conditions expirées
        self.conditions = active
        self._save_conditions()

        return active

    def update_condition(self, condition_id, duration_value=None, notes=None):
        """
        Met à jour une condition existante

        Args:
            condition_id: ID de la condition à mettre à jour
            duration_value: Nouvelle valeur de durée (optionnel)
            notes: Nouvelles notes (optionnel)

        Returns:
            bool: True si mis à jour, False sinon
        """
        for cond in self.conditions:
            if cond['id'] == condition_id:
                if duration_value is not None:
                    cond['duration_value'] = duration_value

                    # Recalculer l'expiration si applicable
                    if cond['duration_type'] == 'minutes':
                        cond['expires_at'] = (datetime.now() + timedelta(minutes=duration_value)).isoformat()
                    elif cond['duration_type'] == 'hours':
                        cond['expires_at'] = (datetime.now() + timedelta(hours=duration_value)).isoformat()

                if notes is not None:
                    cond['notes'] = notes

                self._save_conditions()
                print(f"✅ Condition mise à jour: {cond['name']}")
                return True

        print(f"⚠️  Condition {condition_id} non trouvée")
        return False

    def decrement_round_conditions(self):
        """
        Décrémente d'un round toutes les conditions avec durée en rounds

        Returns:
            list: Liste des conditions qui ont expiré
        """
        expired = []

        for cond in self.conditions[:]:  # Copie pour itération safe
            if cond['duration_type'] == 'rounds' and cond.get('duration_value'):
                cond['duration_value'] -= 1

                if cond['duration_value'] <= 0:
                    print(f"⏰ Condition expirée: {cond['name']}")
                    expired.append(cond)
                    self.conditions.remove(cond)

        if expired:
            self._save_conditions()

        return expired

    def clear_all_conditions(self):
        """Retire toutes les conditions"""
        self.conditions = []
        self._save_conditions()
        print("✅ Toutes les conditions ont été retirées")
        return True

    def get_condition_definition(self, condition_id):
        """
        Retourne la définition d'une condition

        Args:
            condition_id: ID de la condition

        Returns:
            dict: Définition de la condition ou None
        """
        return self.CONDITIONS_DEFINITIONS.get(condition_id)

    def get_all_conditions_definitions(self):
        """
        Retourne toutes les définitions de conditions disponibles

        Returns:
            dict: Dictionnaire de toutes les conditions
        """
        return self.CONDITIONS_DEFINITIONS
