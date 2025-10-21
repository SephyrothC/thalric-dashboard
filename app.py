from flask import Flask, render_template, request, jsonify, send_file
from flask_socketio import SocketIO, emit
import json
import random
import os
from datetime import datetime
from pathlib import Path
from backup_manager import BackupManager
from stats_manager import StatsManager

app = Flask(__name__)
app.config['SECRET_KEY'] = 'thalric_dice_secret_key'

# Configuration WebSocket
socketio = SocketIO(app, cors_allowed_origins="*",
                    logger=True, engineio_logger=True)

# Initialiser les gestionnaires
backup_manager = BackupManager()
stats_manager = StatsManager()

# Fichier du personnage actif
CURRENT_CHARACTER_FILE = 'current_character.txt'
CHARACTERS_DIR = Path('characters')

# ============================================================================
# GESTION MULTI-PERSONNAGES
# ============================================================================

def get_current_character_file():
    """Retourne le nom du fichier du personnage actif"""
    try:
        if os.path.exists(CURRENT_CHARACTER_FILE):
            with open(CURRENT_CHARACTER_FILE, 'r') as f:
                return f.read().strip()
    except:
        pass
    return 'thalric_data.json'

def set_current_character_file(filename):
    """Définit le personnage actif"""
    with open(CURRENT_CHARACTER_FILE, 'w') as f:
        f.write(filename)

def load_character_data(character_file=None):
    """Charge les données d'un personnage"""
    if character_file is None:
        character_file = get_current_character_file()

    try:
        with open(character_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Si le fichier n'existe pas, créer un personnage par défaut
        return create_default_character()

def save_character_data(data, character_file=None, create_backup=True):
    """Sauvegarde les données d'un personnage"""
    if character_file is None:
        character_file = get_current_character_file()

    # Créer un backup automatique avant de sauvegarder
    if create_backup and os.path.exists(character_file):
        backup_manager.create_backup('auto')

    with open(character_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def create_default_character():
    """Crée un personnage par défaut"""
    return {
        "character_info": {
            "name": "Nouveau Personnage",
            "level": 1,
            "class": "Guerrier",
            "subclass": "",
            "race": "Humain",
            "subrace": "",
            "background": "Soldat"
        },
        "stats": {
            "strength": 10,
            "dexterity": 10,
            "constitution": 10,
            "intelligence": 10,
            "wisdom": 10,
            "charisma": 10,
            "proficiency_bonus": 2,
            "ac": 10,
            "hp_max": 10,
            "hp_current": 10,
            "speed": 30,
            "passive_perception": 10
        },
        "saving_throws": {
            "strength": 0,
            "dexterity": 0,
            "constitution": 0,
            "intelligence": 0,
            "wisdom": 0,
            "charisma": 0
        },
        "skills": {},
        "weapons": {},
        "armor": {},
        "magic_items": {},
        "spellcasting": {
            "spell_save_dc": 10,
            "spell_attack_bonus": 0,
            "spell_slots": {},
            "spell_slots_current": {}
        },
        "spells": {
            "cantrips": [],
            "level_1": [],
            "level_2": [],
            "level_3": []
        },
        "features": {},
        "inventory": {
            "currency": {
                "copper": 0,
                "silver": 0,
                "electrum": 0,
                "gold": 0,
                "platinum": 0
            },
            "notes": ""
        }
    }

def list_characters():
    """Liste tous les personnages disponibles"""
    characters = []

    # Créer le dossier characters s'il n'existe pas
    CHARACTERS_DIR.mkdir(exist_ok=True)

    # Personnage principal
    if os.path.exists('thalric_data.json'):
        characters.append({
            'filename': 'thalric_data.json',
            'name': 'Thalric Cœur d\'Argent',
            'is_main': True
        })

    # Autres personnages dans le dossier characters
    for char_file in CHARACTERS_DIR.glob('*.json'):
        try:
            with open(char_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                characters.append({
                    'filename': str(char_file),
                    'name': data.get('character_info', {}).get('name', char_file.stem),
                    'is_main': False
                })
        except:
            continue

    return characters

# Calculer le modificateur d'une stat


def get_modifier(stat_value):
    return (stat_value - 10) // 2

# Lancer un dé


def roll_die(sides):
    return random.randint(1, sides)

# Lancer plusieurs dés


def roll_dice(num_dice, sides):
    return [roll_die(sides) for _ in range(num_dice)]

# ============================================================================
# WEBSOCKET FUNCTIONS
# ============================================================================


@socketio.on('connect')
def handle_connect():
    """Connexion d'un client WebSocket"""
    print(f'Client connecté: {request.sid}')
    emit('status', {'msg': 'Connecté au visionneur de dés Thalric'})


@socketio.on('disconnect')
def handle_disconnect():
    """Déconnexion d'un client WebSocket"""
    print(f'Client déconnecté: {request.sid}')


def broadcast_dice_result(dice_data):
    """Diffuser un résultat de dé à tous les clients connectés"""
    # Formater les données pour l'affichage
    formatted_data = {
        'timestamp': datetime.now().strftime('%H:%M:%S'),
        'character': 'Thalric Cœur d\'Argent',
        'roll_type': dice_data.get('roll_type', 'Jet de dé'),
        'formula': dice_data.get('formula', ''),
        'result': dice_data.get('result', 0),
        'details': dice_data.get('details', ''),
        'is_critical': dice_data.get('critical', False),
        'is_fumble': dice_data.get('fumble', False),
        'damage_type': dice_data.get('damage_type', ''),
        'animation_class': get_animation_class(dice_data)
    }

    # Enregistrer dans les statistiques
    stats_manager.record_roll({
        'roll_type': dice_data.get('roll_type', 'Jet de dé'),
        'formula': dice_data.get('formula', ''),
        'result': dice_data.get('result', 0),
        'critical': dice_data.get('critical', False),
        'fumble': dice_data.get('fumble', False),
        'damage_type': dice_data.get('damage_type', '')
    })

    # Diffuser à tous les clients connectés
    socketio.emit('new_dice_roll', formatted_data)
    print(
        f"🎲 Diffusion: {formatted_data['roll_type']} = {formatted_data['result']}")


def get_animation_class(dice_data):
    """Déterminer la classe d'animation selon le type de jet"""
    if dice_data.get('critical'):
        return 'critical-success'
    elif dice_data.get('fumble'):
        return 'critical-failure'
    elif dice_data.get('damage_type'):
        return 'damage-roll'
    else:
        return 'normal-roll'

# ============================================================================
# ROUTES PRINCIPALES
# ============================================================================


@app.route('/')
@app.route('/state')
def state():
    data = load_character_data()
    return render_template('state.html', character=data)


@app.route('/combat')
def combat():
    data = load_character_data()
    return render_template('combat.html', character=data)


@app.route('/spells')
def spells():
    data = load_character_data()
    return render_template('spells.html', character=data)


@app.route('/inventory')
def inventory():
    data = load_character_data()
    return render_template('inventory.html', character=data)


@app.route('/dice')
def dice_roller():
    data = load_character_data()
    return render_template('dice.html', character=data)


@app.route('/dice-viewer')
def dice_viewer():
    """Page du visionneur de dés pour la tablette"""
    return render_template('dice_viewer.html')

# ============================================================================
# API ENDPOINTS AVEC WEBSOCKET
# ============================================================================


@app.route('/api/saving_throw', methods=['POST'])
def saving_throw():
    data = request.json
    ability = data.get('ability')

    character_data = load_character_data()
    saving_throw_bonus = character_data['saving_throws'][ability]

    roll = roll_die(20)
    total = roll + saving_throw_bonus

    # Préparer les données pour diffusion
    dice_data = {
        'roll_type': f'Jet de Sauvegarde - {ability.title()}',
        'formula': f'1d20+{saving_throw_bonus}',
        'result': total,
        'details': f'({roll} + {saving_throw_bonus})',
        'critical': roll == 20,
        'fumble': roll == 1
    }

    # Diffuser le résultat en temps réel
    broadcast_dice_result(dice_data)

    return jsonify({
        'roll': roll,
        'bonus': saving_throw_bonus,
        'total': total,
        'critical': roll == 20,
        'fumble': roll == 1
    })


@app.route('/api/skill_check', methods=['POST'])
def skill_check():
    data = request.json
    skill = data.get('skill')

    character_data = load_character_data()
    skill_bonus = character_data['skills'][skill]

    roll = roll_die(20)
    total = roll + skill_bonus

    # Diffuser le résultat
    dice_data = {
        'roll_type': f'Test de {skill.title()}',
        'formula': f'1d20+{skill_bonus}',
        'result': total,
        'details': f'({roll} + {skill_bonus})',
        'critical': roll == 20,
        'fumble': roll == 1
    }
    broadcast_dice_result(dice_data)

    return jsonify({
        'roll': roll,
        'bonus': skill_bonus,
        'total': total,
        'critical': roll == 20,
        'fumble': roll == 1
    })


@app.route('/api/weapon_attack', methods=['POST'])
def weapon_attack():
    data = request.json
    weapon_key = data.get('weapon')
    sacred_weapon = data.get('sacred_weapon', False)
    divine_smite_level = data.get('divine_smite_level', 0)
    radiant_soul_active = data.get('radiant_soul_active', False)

    character_data = load_character_data()
    weapon = character_data['weapons'][weapon_key]

    # Jet d'attaque
    attack_roll = roll_die(20)
    attack_bonus = weapon['attack_bonus']
    if sacred_weapon:
        attack_bonus += 3

    attack_total = attack_roll + attack_bonus

    # Si l'attaque touche (on assume AC 15 pour l'exemple)
    hit = attack_total >= 15 or attack_roll == 20
    is_critical = attack_roll == 20

    # Diffuser le jet d'attaque
    attack_data = {
        'roll_type': f'Attaque - {weapon["name"]}',
        'formula': f'1d20+{attack_bonus}',
        'result': attack_total,
        'details': f'({attack_roll} + {attack_bonus})',
        'critical': is_critical,
        'fumble': attack_roll == 1
    }
    broadcast_dice_result(attack_data)

    damage_rolls = []
    total_damage = 0

    if hit:
        if is_critical:
            # RÈGLE CUSTOM CRITIQUE : Dégâts max + dégâts normaux
            max_base_damage = 8 + 3
            damage_rolls.append(f"Base MAX: {max_base_damage}")
            total_damage += max_base_damage

            normal_base = roll_die(8) + 3
            damage_rolls.append(f"Base normal: {normal_base}")
            total_damage += normal_base

            max_magic_damage = 8
            damage_rolls.append(f"Crystal MAX: {max_magic_damage} radiant")
            total_damage += max_magic_damage

            normal_magic = roll_die(8)
            damage_rolls.append(f"Crystal normal: {normal_magic} radiant")
            total_damage += normal_magic

            max_improved_smite = 8
            damage_rolls.append(
                f"Improved Smite MAX: {max_improved_smite} radiant")
            total_damage += max_improved_smite

            normal_improved = roll_die(8)
            damage_rolls.append(
                f"Improved Smite normal: {normal_improved} radiant")
            total_damage += normal_improved

        else:
            base_damage = roll_die(8) + 3
            damage_rolls.append(f"Base: {base_damage}")
            total_damage += base_damage

            magic_damage = roll_die(8)
            damage_rolls.append(f"Crystal: {magic_damage} radiant")
            total_damage += magic_damage

            improved_smite = roll_die(8)
            damage_rolls.append(f"Improved Smite: {improved_smite} radiant")
            total_damage += improved_smite

        # Divine Smite si utilisé
        if divine_smite_level > 0:
            smite_dice = 2 + (divine_smite_level - 1)

            if is_critical:
                max_smite = smite_dice * 8
                normal_smite = sum(roll_dice(smite_dice, 8))
                smite_damage = max_smite + normal_smite
                damage_rolls.append(
                    f"Divine Smite CRIT (lv{divine_smite_level}): {max_smite} MAX + {normal_smite} = {smite_damage} radiant")
            else:
                smite_damage = sum(roll_dice(smite_dice, 8))
                damage_rolls.append(
                    f"Divine Smite (lv{divine_smite_level}): {smite_damage} radiant")

            total_damage += smite_damage

        # Radiant Soul si actif
        if radiant_soul_active:
            radiant_bonus = 4
            damage_rolls.append(f"Radiant Soul: {radiant_bonus} radiant")
            total_damage += radiant_bonus

        # Diffuser les dégâts
        damage_data = {
            'roll_type': f'Dégâts - {weapon["name"]}',
            'formula': weapon['damage'],
            'result': total_damage,
            'details': ' + '.join(damage_rolls),
            'damage_type': 'physical',
            'critical': is_critical
        }

        # Petit délai pour l'effet visuel
        socketio.sleep(0.5)
        broadcast_dice_result(damage_data)

    return jsonify({
        'attack_roll': attack_roll,
        'attack_bonus': attack_bonus,
        'attack_total': attack_total,
        'hit': hit,
        'critical': is_critical,
        'damage_rolls': damage_rolls,
        'total_damage': total_damage,
        'sacred_weapon_used': sacred_weapon
    })


@app.route('/api/cast_spell', methods=['POST'])
def cast_spell():
    data = request.json
    spell_name = data.get('spell')
    spell_level = data.get('level', 1)
    is_attack_spell = data.get('is_attack', False)

    character_data = load_character_data()

    # Déterminer le niveau minimum du sort
    spell_min_level = 1

    for level_key, spells in character_data['spells'].items():
        if level_key == 'cantrips':
            continue
        if level_key.startswith('level_'):
            level_num = int(level_key.split('_')[1])
            if spell_name in spells:
                spell_min_level = level_num
                break

    effective_level = max(spell_level, spell_min_level)

    current_slots = character_data['spellcasting']['spell_slots_current'].get(
        str(effective_level), 0)
    if current_slots <= 0:
        return jsonify({'error': f'Pas d\'emplacements de niveau {effective_level} disponibles'})

    character_data['spellcasting']['spell_slots_current'][str(
        effective_level)] -= 1
    save_character_data(character_data)

    # Diffuser le lancement de sort
    spell_data = {
        'roll_type': f'Sort - {spell_name.replace("_", " ").title()}',
        'formula': f'Niveau {effective_level}',
        'result': f'Lancé',
        'details': f'DD {character_data["spellcasting"]["spell_save_dc"]}',
    }
    broadcast_dice_result(spell_data)

    result = {
        'spell_name': spell_name,
        'spell_min_level': spell_min_level,
        'level_requested': spell_level,
        'level_cast': effective_level,
        'slots_remaining': character_data['spellcasting']['spell_slots_current'][str(effective_level)]
    }

    if is_attack_spell:
        attack_roll = roll_die(20)
        spell_attack_bonus = character_data['spellcasting']['spell_attack_bonus']
        attack_total = attack_roll + spell_attack_bonus

        # Diffuser l'attaque de sort
        attack_data = {
            'roll_type': f'Attaque de Sort - {spell_name.replace("_", " ").title()}',
            'formula': f'1d20+{spell_attack_bonus}',
            'result': attack_total,
            'details': f'({attack_roll} + {spell_attack_bonus})',
            'critical': attack_roll == 20,
            'fumble': attack_roll == 1
        }
        broadcast_dice_result(attack_data)

        result.update({
            'attack_roll': attack_roll,
            'attack_bonus': spell_attack_bonus,
            'attack_total': attack_total,
            'hit': attack_total >= 15,
            'critical': attack_roll == 20
        })

    return jsonify(result)


@app.route('/api/roll_custom_dice', methods=['POST'])
def roll_custom_dice():
    """API pour les jets de dés personnalisés"""
    data = request.json
    count = data.get('count', 1)
    sides = data.get('sides', 20)
    modifier = data.get('modifier', 0)
    label = data.get('label', 'Jet de dé')

    # Lancer les dés
    rolls = [roll_die(sides) for _ in range(count)]
    total_dice = sum(rolls)
    final_total = total_dice + modifier

    # Créer la formule
    formula = f"{count}d{sides}"
    if modifier > 0:
        formula += f"+{modifier}"
    elif modifier < 0:
        formula += str(modifier)

    # Préparer pour diffusion
    dice_data = {
        'roll_type': label,
        'formula': formula,
        'result': final_total,
        'details': f"[{', '.join(map(str, rolls))}]{f' + {modifier}' if modifier != 0 else ''}",
        'critical': count == 1 and sides == 20 and rolls[0] == 20,
        'fumble': count == 1 and sides == 20 and rolls[0] == 1
    }

    # Diffuser
    broadcast_dice_result(dice_data)

    return jsonify({
        'rolls': rolls,
        'total': final_total,
        'formula': formula,
        'success': True
    })

# ============================================================================
# AUTRES API ENDPOINTS (sans modification)
# ============================================================================


@app.route('/api/modify_hp', methods=['POST'])
def modify_hp():
    data = request.json
    change = data.get('change')

    character_data = load_character_data()
    current_hp = character_data['stats']['hp_current']
    max_hp = character_data['stats']['hp_max']

    new_hp = max(0, min(max_hp, current_hp + change))
    character_data['stats']['hp_current'] = new_hp

    save_character_data(character_data)

    return jsonify({
        'hp_current': new_hp,
        'hp_max': max_hp,
        'change': new_hp - current_hp
    })


@app.route('/api/use_feature', methods=['POST'])
def use_feature():
    data = request.json
    feature_name = data.get('feature')

    character_data = load_character_data()
    feature = character_data['features'][feature_name]

    if 'uses' in feature and feature['uses'] > 0:
        feature['uses'] -= 1
        save_character_data(character_data)

        result = {
            'success': True,
            'feature': feature_name,
            'uses_remaining': feature['uses']
        }

        if feature_name == 'healing_hands':
            healing_roll = sum(roll_dice(4, 4))
            result['healing_roll'] = healing_roll
            result['healing_dice'] = '4d4'

            # Diffuser le jet de soins
            heal_data = {
                'roll_type': 'Healing Hands',
                'formula': '4d4',
                'result': healing_roll,
                'details': f'{healing_roll} HP soignés',
                'damage_type': 'healing'
            }
            broadcast_dice_result(heal_data)

        return jsonify(result)
    else:
        return jsonify({
            'success': False,
            'error': 'Pas d\'utilisations restantes'
        })


@app.route('/api/use_lay_on_hands', methods=['POST'])
def use_lay_on_hands():
    data = request.json
    amount = data.get('amount', 0)

    character_data = load_character_data()
    lay_on_hands = character_data['features']['lay_on_hands']

    if amount <= 0:
        return jsonify({'success': False, 'error': 'Montant invalide'})

    if lay_on_hands['pool'] < amount:
        return jsonify({'success': False, 'error': 'Pool insuffisant'})

    lay_on_hands['pool'] -= amount
    save_character_data(character_data)

    # Diffuser l'utilisation de Lay on Hands
    heal_data = {
        'roll_type': 'Lay on Hands',
        'formula': f'{amount} HP',
        'result': amount,
        'details': f'{amount} HP soignés',
        'damage_type': 'healing'
    }
    broadcast_dice_result(heal_data)

    return jsonify({
        'success': True,
        'amount_used': amount,
        'pool_remaining': lay_on_hands['pool'],
        'pool_max': lay_on_hands['pool_max']
    })


@app.route('/api/update_inventory', methods=['POST'])
def update_inventory():
    data = request.json
    notes = data.get('notes', '')

    character_data = load_character_data()
    character_data['inventory']['notes'] = notes
    save_character_data(character_data)

    return jsonify({'success': True})


@app.route('/api/modify_currency', methods=['POST'])
def modify_currency():
    data = request.json
    currency_type = data.get('type')
    change = data.get('change')

    character_data = load_character_data()
    current = character_data['inventory']['currency'][currency_type]
    new_amount = max(0, current + change)
    character_data['inventory']['currency'][currency_type] = new_amount

    save_character_data(character_data)

    return jsonify({
        'type': currency_type,
        'amount': new_amount,
        'change': new_amount - current
    })


@app.route('/api/short_rest', methods=['POST'])
def short_rest():
    character_data = load_character_data()
    character_data['features']['channel_divinity']['uses'] = character_data['features']['channel_divinity']['uses_max']
    save_character_data(character_data)
    return jsonify({'message': 'Repos court effectué'})


@app.route('/api/long_rest', methods=['POST'])
def long_rest():
    character_data = load_character_data()

    character_data['spellcasting']['spell_slots_current'] = character_data['spellcasting']['spell_slots'].copy()

    for feature in character_data['features'].values():
        if 'uses_max' in feature:
            feature['uses'] = feature['uses_max']
        if 'pool_max' in feature:
            feature['pool'] = feature['pool_max']

    character_data['stats']['hp_current'] = character_data['stats']['hp_max']

    save_character_data(character_data)
    return jsonify({'message': 'Repos long effectué'})


@app.route('/api/get_spell_slots', methods=['POST'])
def get_spell_slots():
    character_data = load_character_data()
    return jsonify({
        'spell_slots_current': character_data['spellcasting']['spell_slots_current']
    })


@app.route('/api/get_feature_uses', methods=['POST'])
def get_feature_uses():
    data = request.json
    feature_name = data.get('feature')

    character_data = load_character_data()
    feature = character_data['features'].get(feature_name, {})

    return jsonify({
        'uses': feature.get('uses'),
        'uses_max': feature.get('uses_max'),
        'pool': feature.get('pool'),
        'pool_max': feature.get('pool_max')
    })


# ============================================================================
# API BACKUP MANAGEMENT
# ============================================================================

@app.route('/api/backups/list', methods=['GET'])
def list_backups():
    """Liste tous les backups disponibles"""
    backups = backup_manager.list_backups()
    total_size = backup_manager.get_total_backup_size()
    return jsonify({
        'backups': backups,
        'total_size': total_size,
        'count': len(backups)
    })

@app.route('/api/backups/create', methods=['POST'])
def create_backup():
    """Crée un nouveau backup manuel"""
    data = request.json
    label = data.get('label', 'manual')
    filename = backup_manager.create_backup(label)
    return jsonify({
        'success': filename is not None,
        'filename': filename
    })

@app.route('/api/backups/restore', methods=['POST'])
def restore_backup():
    """Restaure un backup"""
    data = request.json
    filename = data.get('filename')
    success = backup_manager.restore_backup(filename)
    return jsonify({'success': success})

@app.route('/api/backups/delete', methods=['POST'])
def delete_backup():
    """Supprime un backup"""
    data = request.json
    filename = data.get('filename')
    success = backup_manager.delete_backup(filename)
    return jsonify({'success': success})

@app.route('/api/backups/download/<filename>', methods=['GET'])
def download_backup(filename):
    """Télécharge un backup"""
    backup_path = backup_manager.backup_dir / filename
    if backup_path.exists():
        return send_file(backup_path, as_attachment=True)
    return jsonify({'error': 'Backup non trouvé'}), 404

# ============================================================================
# API STATISTICS
# ============================================================================

@app.route('/api/stats/summary', methods=['GET'])
def get_stats_summary():
    """Retourne le résumé des statistiques"""
    summary = stats_manager.get_summary()
    return jsonify(summary)

@app.route('/api/stats/distribution', methods=['GET'])
def get_roll_distribution():
    """Retourne la distribution des jets de d20"""
    distribution = stats_manager.get_roll_distribution()
    return jsonify(distribution)

@app.route('/api/stats/by_type', methods=['GET'])
def get_stats_by_type():
    """Retourne les stats par type de jet"""
    stats = stats_manager.get_stats_by_type()
    return jsonify(stats)

@app.route('/api/stats/recent', methods=['GET'])
def get_recent_rolls():
    """Retourne les jets récents"""
    limit = request.args.get('limit', 20, type=int)
    rolls = stats_manager.get_recent_rolls(limit)
    return jsonify({'rolls': rolls})

@app.route('/api/stats/by_period', methods=['GET'])
def get_stats_by_period():
    """Retourne les stats par période"""
    days = request.args.get('days', 7, type=int)
    stats = stats_manager.get_rolls_by_period(days)
    return jsonify(stats)

@app.route('/api/stats/clear', methods=['POST'])
def clear_stats():
    """Efface toutes les statistiques"""
    stats_manager.clear_stats()
    return jsonify({'success': True})

@app.route('/api/stats/export', methods=['GET'])
def export_stats():
    """Exporte les statistiques"""
    stats = stats_manager.export_stats()
    return jsonify(stats)

# ============================================================================
# API MULTI-CHARACTERS
# ============================================================================

@app.route('/api/characters/list', methods=['GET'])
def api_list_characters():
    """Liste tous les personnages"""
    characters = list_characters()
    current = get_current_character_file()
    return jsonify({
        'characters': characters,
        'current': current
    })

@app.route('/api/characters/switch', methods=['POST'])
def switch_character():
    """Change de personnage actif"""
    data = request.json
    filename = data.get('filename')

    if not filename or not os.path.exists(filename):
        return jsonify({'error': 'Personnage introuvable'}), 404

    set_current_character_file(filename)
    character_data = load_character_data(filename)

    return jsonify({
        'success': True,
        'character': character_data.get('character_info', {})
    })

@app.route('/api/characters/create', methods=['POST'])
def create_character():
    """Crée un nouveau personnage"""
    data = request.json
    name = data.get('name', 'Nouveau Personnage')

    # Créer le personnage
    character_data = create_default_character()
    character_data['character_info']['name'] = name

    # Générer un nom de fichier sûr
    safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    safe_name = safe_name.replace(' ', '_').lower()
    filename = CHARACTERS_DIR / f"{safe_name}.json"

    # S'assurer que le fichier n'existe pas déjà
    counter = 1
    while filename.exists():
        filename = CHARACTERS_DIR / f"{safe_name}_{counter}.json"
        counter += 1

    # Sauvegarder
    save_character_data(character_data, str(filename), create_backup=False)

    return jsonify({
        'success': True,
        'filename': str(filename),
        'character': character_data.get('character_info', {})
    })

@app.route('/api/characters/delete', methods=['POST'])
def delete_character():
    """Supprime un personnage"""
    data = request.json
    filename = data.get('filename')

    # Ne pas permettre de supprimer le personnage principal
    if filename == 'thalric_data.json':
        return jsonify({'error': 'Impossible de supprimer le personnage principal'}), 400

    try:
        if os.path.exists(filename):
            os.remove(filename)
            return jsonify({'success': True})
        return jsonify({'error': 'Personnage introuvable'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# API IMPORT/EXPORT
# ============================================================================

@app.route('/api/export', methods=['GET'])
def export_character():
    """Exporte le personnage actuel"""
    character_data = load_character_data()
    return jsonify(character_data)

@app.route('/api/import', methods=['POST'])
def import_character():
    """Importe un personnage"""
    try:
        data = request.json

        # Valider la structure minimale
        if not isinstance(data, dict) or 'character_info' not in data:
            return jsonify({'error': 'Format de personnage invalide'}), 400

        # Créer un backup avant d'importer
        backup_manager.create_backup('pre_import')

        # Sauvegarder
        save_character_data(data, create_backup=False)

        return jsonify({
            'success': True,
            'character': data.get('character_info', {})
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/import/file', methods=['POST'])
def import_character_file():
    """Importe un personnage depuis un fichier"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'Nom de fichier vide'}), 400

        # Lire le contenu
        content = file.read().decode('utf-8')
        data = json.loads(content)

        # Valider
        if not isinstance(data, dict) or 'character_info' not in data:
            return jsonify({'error': 'Format de personnage invalide'}), 400

        # Créer un backup
        backup_manager.create_backup('pre_import')

        # Sauvegarder
        save_character_data(data, create_backup=False)

        return jsonify({
            'success': True,
            'character': data.get('character_info', {})
        })

    except json.JSONDecodeError:
        return jsonify({'error': 'Fichier JSON invalide'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ROUTES PAGES
# ============================================================================

@app.route('/manage')
def manage():
    """Page de gestion (backups, personnages, stats)"""
    data = load_character_data()
    return render_template('manage.html', character=data)

@app.route('/statistics')
def statistics():
    """Page de statistiques avec graphiques"""
    data = load_character_data()
    return render_template('statistics.html', character=data)

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    import os

    # Créer les dossiers nécessaires
    CHARACTERS_DIR.mkdir(exist_ok=True)
    backup_manager.backup_dir.mkdir(exist_ok=True)

    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'

    print(f"🐲 Démarrage de Thalric Dashboard avec WebSocket...")
    print(f"🌐 Dashboard : http://{host}:{port}")
    print(f"📱 Visionneur : http://{host}:{port}/dice-viewer")
    print(f"📊 Statistiques : http://{host}:{port}/statistics")
    print(f"⚙️  Gestion : http://{host}:{port}/manage")
    print(f"🔧 Mode debug : {debug}")

    # Utiliser socketio.run au lieu de app.run
    socketio.run(app, debug=debug, host=host,
                 port=port, allow_unsafe_werkzeug=True)
