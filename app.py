from flask import Flask, render_template, request, jsonify
import json
import random

app = Flask(__name__)

# Charger les données du personnage


def load_character_data():
    with open('thalric_data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# Sauvegarder les données du personnage (pour les changements d'état)


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

# Route principale - Page State


@app.route('/')
@app.route('/state')
def state():
    data = load_character_data()
    return render_template('state.html', character=data)

# Route Combat


@app.route('/combat')
def combat():
    data = load_character_data()
    return render_template('combat.html', character=data)

# Route Sorts


@app.route('/spells')
def spells():
    data = load_character_data()
    return render_template('spells.html', character=data)

# Route Inventaire


@app.route('/inventory')
def inventory():
    data = load_character_data()
    return render_template('inventory.html', character=data)

# API - Jet de sauvegarde


@app.route('/api/saving_throw', methods=['POST'])
def saving_throw():
    data = request.json
    ability = data.get('ability')

    character_data = load_character_data()
    saving_throw_bonus = character_data['saving_throws'][ability]

    roll = roll_die(20)
    total = roll + saving_throw_bonus

    return jsonify({
        'roll': roll,
        'bonus': saving_throw_bonus,
        'total': total,
        'critical': roll == 20,
        'fumble': roll == 1
    })

# API - Jet de compétence


@app.route('/api/skill_check', methods=['POST'])
def skill_check():
    data = request.json
    skill = data.get('skill')

    character_data = load_character_data()
    skill_bonus = character_data['skills'][skill]

    roll = roll_die(20)
    total = roll + skill_bonus

    return jsonify({
        'roll': roll,
        'bonus': skill_bonus,
        'total': total,
        'critical': roll == 20,
        'fumble': roll == 1
    })

# API - Modifier les HP


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

# API - Attaque d'arme


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

    damage_rolls = []
    total_damage = 0

    if hit:
        if is_critical:
            # RÈGLE CUSTOM CRITIQUE : Dégâts max + dégâts normaux

            # Dégâts max de base (8 + 3 = 11)
            max_base_damage = 8 + 3
            damage_rolls.append(f"Base MAX: {max_base_damage}")
            total_damage += max_base_damage

            # Dégâts normaux de base
            normal_base = roll_die(8) + 3
            damage_rolls.append(f"Base normal: {normal_base}")
            total_damage += normal_base

            # Dégâts magiques max (8)
            max_magic_damage = 8
            damage_rolls.append(f"Crystal MAX: {max_magic_damage} radiant")
            total_damage += max_magic_damage

            # Dégâts magiques normaux
            normal_magic = roll_die(8)
            damage_rolls.append(f"Crystal normal: {normal_magic} radiant")
            total_damage += normal_magic

            # Improved Divine Smite max (8)
            max_improved_smite = 8
            damage_rolls.append(
                f"Improved Smite MAX: {max_improved_smite} radiant")
            total_damage += max_improved_smite

            # Improved Divine Smite normal
            normal_improved = roll_die(8)
            damage_rolls.append(
                f"Improved Smite normal: {normal_improved} radiant")
            total_damage += normal_improved

        else:
            # Dégâts normaux
            base_damage = roll_die(8) + 3
            damage_rolls.append(f"Base: {base_damage}")
            total_damage += base_damage

            # Dégâts magiques de l'épée de cristal
            magic_damage = roll_die(8)
            damage_rolls.append(f"Crystal: {magic_damage} radiant")
            total_damage += magic_damage

            # Improved Divine Smite (automatique niveau 11)
            improved_smite = roll_die(8)
            damage_rolls.append(f"Improved Smite: {improved_smite} radiant")
            total_damage += improved_smite

        # Divine Smite si utilisé
        if divine_smite_level > 0:
            # 2d8 base + 1d8 par niveau au-dessus de 1
            smite_dice = 2 + (divine_smite_level - 1)

            if is_critical:
                # Divine Smite critique : max + normal
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

        # Radiant Soul si actif (+4 dégâts radiants)
        if radiant_soul_active:
            radiant_bonus = 4
            damage_rolls.append(f"Radiant Soul: {radiant_bonus} radiant")
            total_damage += radiant_bonus

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

# API - Lancer un sort


@app.route('/api/cast_spell', methods=['POST'])
def cast_spell():
    data = request.json
    spell_name = data.get('spell')
    spell_level = data.get('level', 1)
    is_attack_spell = data.get('is_attack', False)

    character_data = load_character_data()

    # Déterminer le niveau minimum du sort
    spell_min_level = 1  # Par défaut niveau 1

    # Chercher le sort dans les différents niveaux pour connaître son niveau minimum
    for level_key, spells in character_data['spells'].items():
        if level_key == 'cantrips':
            continue
        if level_key.startswith('level_'):
            level_num = int(level_key.split('_')[1])
            if spell_name in spells:
                spell_min_level = level_num
                break

    # Le niveau effectif de lancement est le maximum entre le niveau choisi et le niveau minimum du sort
    effective_level = max(spell_level, spell_min_level)

    # Vérifier les emplacements de sorts au niveau effectif
    current_slots = character_data['spellcasting']['spell_slots_current'].get(
        str(effective_level), 0)
    if current_slots <= 0:
        return jsonify({'error': f'Pas d\'emplacements de niveau {effective_level} disponibles (requis pour ce sort)'})

    # Utiliser un emplacement au niveau effectif
    character_data['spellcasting']['spell_slots_current'][str(
        effective_level)] -= 1
    save_character_data(character_data)

    result = {
        'spell_name': spell_name,
        'spell_min_level': spell_min_level,
        'level_requested': spell_level,
        'level_cast': effective_level,
        'slots_remaining': character_data['spellcasting']['spell_slots_current'][str(effective_level)]
    }

    # Si c'est un sort d'attaque
    if is_attack_spell:
        attack_roll = roll_die(20)
        spell_attack_bonus = character_data['spellcasting']['spell_attack_bonus']
        attack_total = attack_roll + spell_attack_bonus

        result.update({
            'attack_roll': attack_roll,
            'attack_bonus': spell_attack_bonus,
            'attack_total': attack_total,
            'hit': attack_total >= 15,  # AC assumée
            'critical': attack_roll == 20
        })

    return jsonify(result)

# API - Utiliser une capacité


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

        # Cas spécial pour Healing Hands - lancer 4d4
        if feature_name == 'healing_hands':
            healing_roll = sum(roll_dice(4, 4))
            result['healing_roll'] = healing_roll
            result['healing_dice'] = '4d4'

        return jsonify(result)

    elif 'pool' in feature and feature['pool'] > 0:
        # Pour Lay on Hands, on ne décrémente pas automatiquement
        return jsonify({
            'success': True,
            'feature': feature_name,
            'pool_remaining': feature['pool']
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Pas d\'utilisations restantes'
        })

# API - Modifier l'inventaire


@app.route('/api/update_inventory', methods=['POST'])
def update_inventory():
    data = request.json
    notes = data.get('notes', '')

    character_data = load_character_data()
    character_data['inventory']['notes'] = notes
    save_character_data(character_data)

    return jsonify({'success': True})

# API - Modifier l'argent


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

# API - Repos court


@app.route('/api/short_rest', methods=['POST'])
def short_rest():
    character_data = load_character_data()

    # Récupérer Channel Divinity
    character_data['features']['channel_divinity']['uses'] = character_data['features']['channel_divinity']['uses_max']

    save_character_data(character_data)
    return jsonify({'message': 'Repos court effectué'})

# API - Repos long


@app.route('/api/long_rest', methods=['POST'])
def long_rest():
    character_data = load_character_data()

    # Récupérer tous les emplacements de sorts
    character_data['spellcasting']['spell_slots_current'] = character_data['spellcasting']['spell_slots'].copy()

    # Récupérer toutes les capacités
    for feature in character_data['features'].values():
        if 'uses_max' in feature:
            feature['uses'] = feature['uses_max']
        if 'pool_max' in feature:
            feature['pool'] = feature['pool_max']

    # HP max
    character_data['stats']['hp_current'] = character_data['stats']['hp_max']

    save_character_data(character_data)
    return jsonify({'message': 'Repos long effectué'})

# API - Obtenir les emplacements de sorts actuels


@app.route('/api/get_spell_slots', methods=['POST'])
def get_spell_slots():
    character_data = load_character_data()
    return jsonify({
        'spell_slots_current': character_data['spellcasting']['spell_slots_current']
    })

# API - Utiliser Lay on Hands


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

    # Décrémenter le pool
    lay_on_hands['pool'] -= amount
    save_character_data(character_data)

    return jsonify({
        'success': True,
        'amount_used': amount,
        'pool_remaining': lay_on_hands['pool'],
        'pool_max': lay_on_hands['pool_max']
    })

# API - Obtenir les utilisations d'une capacité


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

    # Configuration pour Docker/Production
    # Écouter sur toutes les interfaces pour Docker
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'

    print(f"🐲 Démarrage de Thalric Dashboard...")
    print(f"🌐 Serveur : http://{host}:{port}")
    print(f"🔧 Mode debug : {debug}")

    app.run(debug=debug, host=host, port=port)
