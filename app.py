from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
import random
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'thalric_dice_secret_key'

# Configuration WebSocket
socketio = SocketIO(app, cors_allowed_origins="*",
                    logger=True, engineio_logger=True)

# Charger les données du personnage


def load_character_data():
    with open('thalric_data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# Sauvegarder les données du personnage


def save_character_data(data):
    with open('thalric_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

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


if __name__ == '__main__':
    import os

    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'

    print(f"🐲 Démarrage de Thalric Dashboard avec WebSocket...")
    print(f"🌐 Dashboard : http://{host}:{port}")
    print(f"📱 Visionneur : http://{host}:{port}/dice-viewer")
    print(f"🔧 Mode debug : {debug}")

    # Utiliser socketio.run au lieu de app.run
    socketio.run(app, debug=debug, host=host,
                 port=port, allow_unsafe_werkzeug=True)
