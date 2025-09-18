// === VARIABLES GLOBALES ===
let currentHP = parseInt(document.getElementById('hp-current')?.textContent) || 0;
let radiantSoulActive = false; // État de Radiant Soul

// === UTILITAIRES ===
function showDiceResult(result) {
    const resultsDiv = document.getElementById('dice-results');
    const resultText = document.getElementById('result-text');
    
    resultText.innerHTML = result;
    resultsDiv.style.display = 'flex';
    resultsDiv.classList.add('fade-in');
}

function closeDiceResult() {
    const resultsDiv = document.getElementById('dice-results');
    resultsDiv.style.display = 'none';
}

function formatBonus(bonus) {
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function makeRequest(url, data, callback) {
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(callback)
    .catch(error => {
        console.error('Erreur:', error);
        showDiceResult('<div class="danger">Erreur de connexion</div>');
    });
}

// === JETS DE SAUVEGARDE ===
function rollSavingThrow(ability) {
    makeRequest('/api/saving_throw', { ability: ability }, function(data) {
        let resultClass = '';
        let resultText = '';
        
        if (data.critical) {
            resultClass = 'critical';
            resultText = '🎯 Critique Naturel!';
        } else if (data.fumble) {
            resultClass = 'fumble';
            resultText = '💀 Échec Critique!';
        }
        
        const result = `
            <h3>Jet de Sauvegarde - ${ability.toUpperCase()}</h3>
            <div class="dice-roll ${resultClass}">
                ${data.roll} ${formatBonus(data.bonus)} = ${data.total}
            </div>
            ${resultText ? `<div class="${resultClass}">${resultText}</div>` : ''}
        `;
        
        showDiceResult(result);
    });
}

// === JETS DE COMPÉTENCES ===
function rollSkillCheck(skill, skillName) {
    makeRequest('/api/skill_check', { skill: skill }, function(data) {
        let resultClass = '';
        let resultText = '';
        
        if (data.critical) {
            resultClass = 'critical';
            resultText = '🎯 Critique Naturel!';
        } else if (data.fumble) {
            resultClass = 'fumble';
            resultText = '💀 Échec Critique!';
        }
        
        const result = `
            <h3>Test de ${skillName}</h3>
            <div class="dice-roll ${resultClass}">
                ${data.roll} ${formatBonus(data.bonus)} = ${data.total}
            </div>
            ${resultText ? `<div class="${resultClass}">${resultText}</div>` : ''}
        `;
        
        showDiceResult(result);
    });
}

// === GESTION DES HP ===
function modifyHP(change) {
    makeRequest('/api/modify_hp', { change: change }, function(data) {
        // Mettre à jour l'affichage HP dans le header
        const hpElement = document.getElementById('hp-current');
        if (hpElement) {
            hpElement.textContent = data.hp_current;
            currentHP = data.hp_current;
            
            // Animation de changement
            hpElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                hpElement.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Mettre à jour l'affichage HP dans la carte Points de Vie
        const hpCardElement = document.getElementById('hp-current-card');
        if (hpCardElement) {
            hpCardElement.textContent = data.hp_current;
            
            // Animation de changement pour la carte aussi
            hpCardElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                hpCardElement.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Calculer le nouveau pourcentage
        const hpPercent = Math.round((data.hp_current / data.hp_max) * 100);
        
        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('hp-progress-bar');
        if (progressBar) {
            // Déterminer la couleur selon le pourcentage
            let color1, color2;
            if (hpPercent > 60) {
                color1 = 'var(--success-green)';
                color2 = '#66bb6a';
            } else if (hpPercent > 30) {
                color1 = 'var(--warning-orange)';
                color2 = '#ffb74d';
            } else {
                color1 = 'var(--danger-red)';
                color2 = '#ef5350';
            }
            
            // Mettre à jour le style de la barre
            progressBar.style.background = `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
            progressBar.style.width = `${hpPercent}%`;
        }
        
        // Mettre à jour le texte du pourcentage
        const percentText = document.getElementById('hp-percent-text');
        if (percentText) {
            percentText.textContent = `${hpPercent}%`;
        }
        
        // Afficher le résultat
        const changeText = change > 0 ? `+${change}` : `${change}`;
        const changeColor = change > 0 ? 'success-green' : 'danger-red';
        
        showDiceResult(`
            <h3>Modification des HP</h3>
            <div class="dice-roll" style="color: var(--${changeColor})">
                ${changeText} HP
            </div>
            <div>HP actuels: ${data.hp_current}/${data.hp_max}</div>
        `);
    });
}

function modifyHPFromInput() {
    const input = document.getElementById('hp-change-input');
    if (input && input.value) {
        const change = parseInt(input.value);
        if (!isNaN(change)) {
            modifyHP(change);
            input.value = '';
        }
    }
}

// === ATTAQUES D'ARMES ===
function rollWeaponAttack(weaponKey) {
    const sacredWeapon = document.getElementById('sacred-weapon-check')?.checked || false;
    const smiteLevel = parseInt(document.getElementById('smite-level-select')?.value) || 0;
    
    makeRequest('/api/weapon_attack', {
        weapon: weaponKey,
        sacred_weapon: sacredWeapon,
        divine_smite_level: smiteLevel,
        radiant_soul_active: radiantSoulActive
    }, function(data) {
        let attackClass = '';
        let attackText = '';
        
        if (data.critical) {
            attackClass = 'critical';
            attackText = '🎯 CRITIQUE! (Règle Custom: Dégâts MAX + Normaux)';
        } else if (data.attack_roll === 1) {
            attackClass = 'fumble';
            attackText = '💀 Échec critique';
        }
        
        let result = `
            <h3>Attaque - Crystal Longsword</h3>
            <div class="dice-roll ${attackClass}">
                Attaque: ${data.attack_roll} ${formatBonus(data.attack_bonus)} = ${data.attack_total}
            </div>
            ${attackText ? `<div class="${attackClass}" style="margin-top: 10px;">${attackText}</div>` : ''}
        `;
        
        if (data.hit) {
            result += `
                <div style="margin-top: 20px;">
                    <h4>🗡️ DÉGÂTS</h4>
                    <div class="dice-roll" style="color: var(--warning-orange); font-size: 1.5rem;">
                        ${data.total_damage} dégâts
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 10px;">
                        ${data.damage_rolls.join('<br>')}
                    </div>
                </div>
            `;
            
            if (radiantSoulActive) {
                result += `
                    <div style="margin-top: 10px; padding: 8px; background: var(--primary-gold); color: var(--dark-bg); border-radius: 6px; font-size: 0.9rem;">
                        ✨ Radiant Soul actif - Dégâts radiants bonus inclus
                    </div>
                `;
            }
        } else {
            result += '<div style="color: var(--text-muted); margin-top: 10px;">Attaque ratée</div>';
        }
        
        showDiceResult(result);
        
        // Si Divine Smite a été utilisé, mettre à jour les emplacements de sorts
        if (smiteLevel > 0) {
            // Faire une requête pour obtenir les emplacements actuels
            makeRequest('/api/get_spell_slots', {}, function(slotsData) {
                if (slotsData.spell_slots_current) {
                    updateSpellSlots(smiteLevel, slotsData.spell_slots_current[smiteLevel.toString()]);
                }
            });
        }
        
        // Si Sacred Weapon a été utilisé, mettre à jour Channel Divinity
        if (sacredWeapon) {
            // Faire une requête pour obtenir les utilisations actuelles
            makeRequest('/api/get_feature_uses', { feature: 'channel_divinity' }, function(featureData) {
                if (featureData.uses !== undefined) {
                    updateFeatureUses('channel_divinity', featureData.uses);
                }
            });
        }
    });
}

// === SORTS ===
function castSpell(spellName, isAttack = false) {
    const level = parseInt(document.getElementById('spell-level-select')?.value) || 1;
    
    makeRequest('/api/cast_spell', {
        spell: spellName,
        level: level,
        is_attack: isAttack
    }, function(data) {
        if (data.error) {
            showDiceResult(`<div class="danger">${data.error}</div>`);
            return;
        }
        
        let result = `
            <h3>Sort - ${data.spell_name}</h3>
        `;
        
        // Affichage des niveaux si différents
        if (data.level_requested !== data.level_cast) {
            result += `
                <div style="color: var(--warning-orange); margin-bottom: 10px;">
                    ⚠️ Sort de niveau ${data.spell_min_level} lancé au niveau ${data.level_cast}
                </div>
            `;
        } else {
            result += `<div>Lancé au niveau ${data.level_cast}</div>`;
        }
        
        result += `
            <div style="color: var(--text-muted);">
                Emplacements restants (niv ${data.level_cast}): ${data.slots_remaining}
            </div>
        `;
        
        if (isAttack && data.attack_roll) {
            let attackClass = '';
            if (data.critical) {
                attackClass = 'critical';
            }
            
            result += `
                <div class="dice-roll ${attackClass}" style="margin-top: 15px;">
                    Attaque: ${data.attack_roll} ${formatBonus(data.attack_bonus)} = ${data.attack_total}
                </div>
                <div>${data.hit ? '✅ Touche!' : '❌ Rate'}</div>
            `;
        }
        
        showDiceResult(result);
        
        // Mettre à jour l'affichage des emplacements en temps réel
        updateSpellSlots(data.level_cast, data.slots_remaining);
    });
}

function updateSpellSlots(level, remaining) {
    const slotElement = document.getElementById(`spell-slots-${level}`);
    if (slotElement) {
        slotElement.textContent = remaining;
        
        // Animation de mise à jour
        slotElement.style.transform = 'scale(1.2)';
        slotElement.style.color = remaining > 0 ? 'var(--primary-gold)' : 'var(--danger-red)';
        setTimeout(() => {
            slotElement.style.transform = 'scale(1)';
            slotElement.style.color = remaining > 0 ? 'var(--primary-gold)' : 'var(--text-muted)';
        }, 200);
    }
    
    // Mettre à jour aussi dans la navigation si elle existe
    const navSlotElement = document.getElementById(`nav-spell-slots-${level}`);
    if (navSlotElement) {
        navSlotElement.textContent = remaining;
    }
}

// === UTILISATION DE CAPACITÉS ===
function useFeature(featureName) {
    makeRequest('/api/use_feature', { feature: featureName }, function(data) {
        if (data.success) {
            let result = `<h3>Capacité utilisée</h3><div>${data.feature}</div>`;
            
            if (data.uses_remaining !== undefined) {
                result += `<div>Utilisations restantes: ${data.uses_remaining}</div>`;
                // Mettre à jour l'affichage en temps réel
                updateFeatureUses(featureName, data.uses_remaining);
            }
            
            if (data.pool_remaining !== undefined) {
                result += `<div>Pool restant: ${data.pool_remaining}</div>`;
                // Mettre à jour l'affichage du pool
                updateFeaturePool(featureName, data.pool_remaining);
            }
            
            // Cas spécial pour Healing Hands
            if (data.healing_roll !== undefined) {
                result = `
                    <h3>Healing Hands</h3>
                    <div class="dice-roll" style="color: var(--success-green);">
                        ${data.healing_dice}: ${data.healing_roll} HP soignés
                    </div>
                    <div>Utilisations restantes: ${data.uses_remaining}</div>
                `;
            }
            
            // Cas spécial pour Radiant Soul
            if (featureName === 'radiant_soul') {
                radiantSoulActive = true;
                result = `
                    <h3>✨ Radiant Soul Activé!</h3>
                    <div class="dice-roll" style="color: var(--primary-gold);">
                        Ailes déployées - Vol 30 pieds
                    </div>
                    <div style="color: var(--warning-orange);">
                        +4 dégâts radiants par tour (1 fois/tour)
                    </div>
                    <div>Durée: 1 minute</div>
                    <div>Utilisations restantes: ${data.uses_remaining}</div>
                `;
                
                // Programmer la désactivation après 1 minute (60 secondes)
                setTimeout(() => {
                    radiantSoulActive = false;
                    showDiceResult(`
                        <h3>Radiant Soul terminé</h3>
                        <div>Les ailes disparaissent...</div>
                    `);
                }, 60000); // 60 secondes
            }
            
            showDiceResult(result);
        } else {
            showDiceResult(`<div class="danger">${data.error}</div>`);
        }
    });
}

// Fonction pour mettre à jour l'affichage des utilisations de capacités
function updateFeatureUses(featureName, remainingUses) {
    const usesElement = document.getElementById(`${featureName.replace('_', '-')}-uses`);
    if (usesElement) {
        usesElement.textContent = remainingUses;
        
        // Animation de mise à jour
        usesElement.style.transform = 'scale(1.2)';
        usesElement.style.color = remainingUses > 0 ? 'var(--primary-gold)' : 'var(--danger-red)';
        setTimeout(() => {
            usesElement.style.transform = 'scale(1)';
        }, 200);
    }
}

// Fonction pour mettre à jour l'affichage des pools
function updateFeaturePool(featureName, remainingPool) {
    console.log(`Tentative de mise à jour ${featureName} avec ${remainingPool}`); // Debug
    
    // Convertir les underscores en tirets pour les IDs HTML
    const elementId = featureName.replace(/_/g, '-') + '-pool';
    console.log(`Recherche de l'élément avec ID: ${elementId}`); // Debug
    
    const poolElement = document.getElementById(elementId);
    
    if (poolElement) {
        console.log(`Élément trouvé! Ancienne valeur: ${poolElement.textContent}, Nouvelle: ${remainingPool}`); // Debug
        poolElement.textContent = remainingPool;
        
        // Animation de mise à jour
        poolElement.style.transform = 'scale(1.2)';
        poolElement.style.color = 'var(--warning-orange)';
        setTimeout(() => {
            poolElement.style.transform = 'scale(1)';
            poolElement.style.color = remainingPool > 0 ? 'var(--success-green)' : 'var(--danger-red)';
        }, 200);
    } else {
        console.error(`Élément avec ID ${elementId} non trouvé!`); // Debug
        
        // Essayer avec d'autres sélecteurs possibles
        const alternateElement = document.querySelector(`[id*="lay-on-hands-pool"]`);
        if (alternateElement) {
            console.log('Trouvé avec sélecteur alternatif!'); // Debug
            alternateElement.textContent = remainingPool;
        }
    }
}

// === REPOS ===
function shortRest() {
    if (confirm('Effectuer un repos court? (Récupère Channel Divinity)')) {
        makeRequest('/api/short_rest', {}, function(data) {
            showDiceResult(`<h3>Repos Court</h3><div>${data.message}</div>`);
            
            // Mettre à jour Channel Divinity en temps réel
            updateFeatureUses('channel_divinity', 2); // Récupère toutes les utilisations
            
            // Mise à jour visuelle
            setTimeout(() => {
                const channelElement = document.getElementById('channel-divinity-uses');
                if (channelElement) {
                    channelElement.style.color = 'var(--success-green)';
                    setTimeout(() => {
                        channelElement.style.color = 'var(--primary-gold)';
                    }, 1000);
                }
            }, 500);
        });
    }
}

function longRest() {
    if (confirm('Effectuer un repos long? (Récupère tout)')) {
        makeRequest('/api/long_rest', {}, function(data) {
            showDiceResult(`<h3>Repos Long</h3><div>${data.message}</div>`);
            
            // Mettre à jour toutes les capacités en temps réel
            updateAllFeaturesToMax();
            updateAllSpellSlotsToMax();
            updateHPToMax();
            
            // Animation globale de récupération
            setTimeout(() => {
                animateFullRecovery();
            }, 500);
        });
    }
}

// Fonction pour remettre toutes les capacités au maximum
function updateAllFeaturesToMax() {
    // Channel Divinity
    updateFeatureUses('channel_divinity', 2);
    
    // Divine Sense
    updateFeatureUses('divine_sense', 4);
    
    // Healing Hands
    updateFeatureUses('healing_hands', 1);
    
    // Radiant Soul
    updateFeatureUses('radiant_soul', 1);
    
    // Lay on Hands
    updateFeaturePool('lay_on_hands', 55);
}

// Fonction pour remettre tous les emplacements de sorts au maximum
function updateAllSpellSlotsToMax() {
    updateSpellSlots(1, 4);
    updateSpellSlots(2, 3);
    updateSpellSlots(3, 3);
}

// Fonction pour remettre les HP au maximum
function updateHPToMax() {
    const maxHP = parseInt(document.querySelector('.hp-max')?.textContent) || 85;
    
    // Mettre à jour le header
    const hpElement = document.getElementById('hp-current');
    if (hpElement) {
        hpElement.textContent = maxHP;
    }
    
    // Mettre à jour la carte
    const hpCardElement = document.getElementById('hp-current-card');
    if (hpCardElement) {
        hpCardElement.textContent = maxHP;
    }
    
    // Mettre à jour la barre de progression
    const progressBar = document.getElementById('hp-progress-bar');
    if (progressBar) {
        progressBar.style.background = 'linear-gradient(90deg, var(--success-green) 0%, #66bb6a 100%)';
        progressBar.style.width = '100%';
    }
    
    // Mettre à jour le pourcentage
    const percentText = document.getElementById('hp-percent-text');
    if (percentText) {
        percentText.textContent = '100%';
    }
}

// Animation visuelle pour la récupération complète
function animateFullRecovery() {
    const elements = document.querySelectorAll('[id$="-uses"], [id$="-pool"], #hp-current, #hp-current-card');
    
    elements.forEach(element => {
        if (element) {
            element.style.color = 'var(--success-green)';
            element.style.transform = 'scale(1.3)';
            element.style.textShadow = '0 0 10px var(--success-green)';
            
            setTimeout(() => {
                element.style.color = 'var(--primary-gold)';
                element.style.transform = 'scale(1)';
                element.style.textShadow = 'none';
            }, 2000);
        }
    });
}

// === INVENTAIRE ===
function saveInventoryNotes() {
    const notes = document.getElementById('inventory-notes')?.value || '';
    
    makeRequest('/api/update_inventory', { notes: notes }, function(data) {
        if (data.success) {
            // Animation de sauvegarde
            const textarea = document.getElementById('inventory-notes');
            if (textarea) {
                textarea.style.borderColor = 'var(--success-green)';
                setTimeout(() => {
                    textarea.style.borderColor = 'var(--border-color)';
                }, 1000);
            }
        }
    });
}

function modifyCurrency(type, change) {
    makeRequest('/api/modify_currency', {
        type: type,
        change: change
    }, function(data) {
        const amountElement = document.getElementById(`${type}-amount`);
        if (amountElement) {
            amountElement.textContent = data.amount;
            
            // Animation
            amountElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                amountElement.style.transform = 'scale(1)';
            }, 200);
        }
        
        const changeText = change > 0 ? `+${change}` : `${change}`;
        const changeColor = change > 0 ? 'success-green' : 'danger-red';
        
        showDiceResult(`
            <h3>Modification de l'argent</h3>
            <div class="dice-roll" style="color: var(--${changeColor})">
                ${changeText} ${type.toUpperCase()}
            </div>
            <div>${type.toUpperCase()}: ${data.amount}</div>
        `);
    });
}

// === ÉVÉNEMENTS ===
document.addEventListener('DOMContentLoaded', function() {
    // Fermer les résultats en cliquant en dehors
    document.getElementById('dice-results')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDiceResult();
        }
    });
    
    // Sauvegarde automatique de l'inventaire
    const inventoryNotes = document.getElementById('inventory-notes');
    if (inventoryNotes) {
        let saveTimeout;
        inventoryNotes.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveInventoryNotes, 2000);
        });
    }
    
    // Gestion des touches Entrée pour les inputs
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const target = e.target;
            
            // Input de modification HP
            if (target.id === 'hp-change-input') {
                modifyHPFromInput();
                e.preventDefault();
            }
            
            // Inputs de monnaie
            if (target.classList.contains('currency-input')) {
                const type = target.dataset.currency;
                const change = parseInt(target.value);
                if (!isNaN(change) && change !== 0) {
                    modifyCurrency(type, change);
                    target.value = '';
                }
                e.preventDefault();
            }
        }
    });
    
    // Gestion de l'échappement pour fermer les modales
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDiceResult();
        }
    });
});

// === FONCTIONS D'AIDE POUR LES TEMPLATES ===

// Calculer le modificateur d'une statistique
function getModifier(statValue) {
    return Math.floor((statValue - 10) / 2);
}

// Formater un modificateur pour l'affichage
function formatModifier(modifier) {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// Animer un élément
function animateElement(element, animation = 'pulse') {
    if (!element) return;
    
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.2s ease';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

// === FONCTIONS SPÉCIFIQUES PAR PAGE ===

// Page State - Gestion des HP rapides
function quickHeal(amount) {
    modifyHP(amount);
}

function quickDamage(amount) {
    modifyHP(-amount);
}

// Page Combat - Gestion des options d'attaque
function toggleAttackOption(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
        animateElement(checkbox.parentElement);
    }
}

// Fonction spécifique pour Lay on Hands avec mise à jour en temps réel
function useLay(amount) {
    const healAmount = parseInt(amount);
    if (isNaN(healAmount) || healAmount <= 0) {
        showDiceResult('<div class="danger">Veuillez entrer un montant valide</div>');
        return;
    }
    
    console.log(`Utilisation de Lay on Hands: ${healAmount} HP`); // Debug
    
    makeRequest('/api/use_lay_on_hands', { amount: healAmount }, function(data) {
        console.log('Réponse API Lay on Hands:', data); // Debug
        
        if (data.success) {
            showDiceResult(`
                <h3>Lay on Hands</h3>
                <div class="dice-roll" style="color: var(--success-green);">
                    +${healAmount} HP soignés
                </div>
                <div>Pool restant: ${data.pool_remaining}/${data.pool_max}</div>
            `);
            
            // Mettre à jour le pool en temps réel
            console.log(`Appel updateFeaturePool avec: lay_on_hands, ${data.pool_remaining}`); // Debug
            updateFeaturePool('lay_on_hands', data.pool_remaining);
            
            // Vider l'input
            document.getElementById('lay-on-hands-amount').value = '';
        } else {
            showDiceResult(`<div class="danger">${data.error}</div>`);
        }
    });
}

// Page Sorts - Changement de niveau de sort
function updateSpellLevel(level) {
    const selectElement = document.getElementById('spell-level-select');
    if (selectElement) {
        selectElement.value = level;
        animateElement(selectElement);
    }
}

// Page Inventaire - Raccourcis pour les monnaies
function addGold(amount) {
    modifyCurrency('gold', amount);
}

function spendGold(amount) {
    modifyCurrency('gold', -amount);
}

// === UTILITAIRES DE DÉBOGAGE ===
function debugLog(message, data = null) {
    if (window.DEBUG) {
        console.log(`[Thalric Debug] ${message}`, data);
    }
}

// Activer le mode debug depuis la console
function enableDebug() {
    window.DEBUG = true;
    console.log('Mode debug activé pour Thalric Dashboard');
}

// === GESTION DES ERREURS ===
window.addEventListener('error', function(e) {
    debugLog('Erreur JavaScript:', e.error);
    
    // Afficher une erreur utilisateur friendly
    showDiceResult(`
        <div class="danger">
            <h3>Erreur</h3>
            <div>Une erreur s'est produite. Veuillez rafraîchir la page.</div>
        </div>
    `);
});

// === FONCTIONS DE VALIDATION ===
function validateHPChange(value) {
    const num = parseInt(value);
    if (isNaN(num)) return false;
    
    // Limites raisonnables pour éviter les erreurs
    return num >= -200 && num <= 200;
}

function validateCurrencyChange(value) {
    const num = parseInt(value);
    if (isNaN(num)) return false;
    
    // Les changements négatifs sont autorisés mais limités
    return num >= -10000 && num <= 10000;
}

// === CONFIRMATION D'ACTIONS IMPORTANTES ===
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

function confirmSpellCast(spellName, level, callback) {
    const message = `Lancer ${spellName} au niveau ${level}?`;
    confirmAction(message, callback);
}

function confirmFeatureUse(featureName, callback) {
    const message = `Utiliser ${featureName}?`;
    confirmAction(message, callback);
}