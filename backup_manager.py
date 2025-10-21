"""
Gestionnaire de sauvegardes automatiques pour Thalric Dashboard
"""
import os
import json
import shutil
from datetime import datetime
from pathlib import Path


class BackupManager:
    """Gère les sauvegardes automatiques des données de personnages"""

    def __init__(self, data_file='thalric_data.json', backup_dir='backups', max_backups=10):
        """
        Initialise le gestionnaire de backups

        Args:
            data_file: Fichier de données principal
            backup_dir: Répertoire de sauvegarde
            max_backups: Nombre maximum de backups à conserver
        """
        self.data_file = data_file
        self.backup_dir = Path(backup_dir)
        self.max_backups = max_backups

        # Créer le dossier de backup s'il n'existe pas
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(self, label='auto'):
        """
        Crée une sauvegarde du fichier de données

        Args:
            label: Label pour identifier le backup (auto, manual, pre-import, etc.)

        Returns:
            str: Nom du fichier de backup créé ou None si erreur
        """
        try:
            if not os.path.exists(self.data_file):
                print(f"⚠️  Fichier {self.data_file} introuvable")
                return None

            # Générer le nom du fichier de backup
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"{label}_{timestamp}.json"
            backup_path = self.backup_dir / backup_filename

            # Copier le fichier
            shutil.copy2(self.data_file, backup_path)

            print(f"✅ Backup créé: {backup_filename}")

            # Nettoyer les anciens backups
            self._cleanup_old_backups(label)

            return backup_filename

        except Exception as e:
            print(f"❌ Erreur lors de la création du backup: {e}")
            return None

    def _cleanup_old_backups(self, label='auto'):
        """
        Supprime les anciens backups pour respecter max_backups

        Args:
            label: Label des backups à nettoyer
        """
        try:
            # Lister tous les backups du label donné
            backups = sorted(
                [f for f in self.backup_dir.glob(f"{label}_*.json")],
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )

            # Supprimer les backups en excès
            for old_backup in backups[self.max_backups:]:
                old_backup.unlink()
                print(f"🗑️  Ancien backup supprimé: {old_backup.name}")

        except Exception as e:
            print(f"⚠️  Erreur lors du nettoyage des backups: {e}")

    def list_backups(self):
        """
        Liste tous les backups disponibles

        Returns:
            list: Liste de dictionnaires avec les infos des backups
        """
        try:
            backups = []

            for backup_file in sorted(self.backup_dir.glob("*.json"),
                                     key=lambda x: x.stat().st_mtime,
                                     reverse=True):
                stat = backup_file.stat()
                backups.append({
                    'filename': backup_file.name,
                    'size': stat.st_size,
                    'size_mb': round(stat.st_size / 1024 / 1024, 2),
                    'created': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                    'timestamp': stat.st_mtime
                })

            return backups

        except Exception as e:
            print(f"❌ Erreur lors de la liste des backups: {e}")
            return []

    def restore_backup(self, backup_filename):
        """
        Restaure un backup

        Args:
            backup_filename: Nom du fichier de backup à restaurer

        Returns:
            bool: True si succès, False sinon
        """
        try:
            backup_path = self.backup_dir / backup_filename

            if not backup_path.exists():
                print(f"❌ Backup {backup_filename} introuvable")
                return False

            # Créer un backup du fichier actuel avant de restaurer
            self.create_backup('pre_restore')

            # Restaurer le backup
            shutil.copy2(backup_path, self.data_file)

            print(f"✅ Backup {backup_filename} restauré")
            return True

        except Exception as e:
            print(f"❌ Erreur lors de la restauration: {e}")
            return False

    def delete_backup(self, backup_filename):
        """
        Supprime un backup

        Args:
            backup_filename: Nom du fichier de backup à supprimer

        Returns:
            bool: True si succès, False sinon
        """
        try:
            backup_path = self.backup_dir / backup_filename

            if not backup_path.exists():
                print(f"❌ Backup {backup_filename} introuvable")
                return False

            backup_path.unlink()
            print(f"✅ Backup {backup_filename} supprimé")
            return True

        except Exception as e:
            print(f"❌ Erreur lors de la suppression: {e}")
            return False

    def get_backup_content(self, backup_filename):
        """
        Lit le contenu d'un backup sans le restaurer

        Args:
            backup_filename: Nom du fichier de backup

        Returns:
            dict: Contenu du backup ou None si erreur
        """
        try:
            backup_path = self.backup_dir / backup_filename

            if not backup_path.exists():
                return None

            with open(backup_path, 'r', encoding='utf-8') as f:
                return json.load(f)

        except Exception as e:
            print(f"❌ Erreur lors de la lecture du backup: {e}")
            return None

    def get_total_backup_size(self):
        """
        Calcule la taille totale des backups

        Returns:
            dict: Taille totale en bytes et MB
        """
        try:
            total_bytes = sum(f.stat().st_size for f in self.backup_dir.glob("*.json"))

            return {
                'bytes': total_bytes,
                'mb': round(total_bytes / 1024 / 1024, 2),
                'gb': round(total_bytes / 1024 / 1024 / 1024, 3)
            }

        except Exception as e:
            print(f"❌ Erreur lors du calcul de la taille: {e}")
            return {'bytes': 0, 'mb': 0, 'gb': 0}
