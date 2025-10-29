// === VARIABLES GLOBALES ===
let currentHP = parseInt(document.getElementById('hp-current')?.textContent) || 0;
let radiantSoulActive = false; // État de Radiant Soul

// WebSocket pour diffusion des dés
let diceSocket = null;

// Cache des conditions actives
let activeConditionsCache = [];
let conditionsCacheTimestamp = 0;
const CACHE_DURATION = 10000; // 10 secondes

// Historique des jets de dés (persistant)
let diceHistory = JSON.parse(localStorage.getItem('diceHistory')) || [];
const MAX_HISTORY_ITEMS = 50;

// Système de thème
let currentTheme = localStorage.getItem('theme') || 'dark';

// Son activé/désactivé
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

// === SYSTÈME DE GESTION DES CONDITIONS ===

/**
 * Récupère les conditions actives (avec cache pour performances)
 */
async function getActiveConditions() {
    const now = Date.now();

    // Utiliser le cache si encore valide
    if (activeConditionsCache.length > 0 && (now - conditionsCacheTimestamp) < CACHE_DURATION) {
        return activeConditionsCache;
    }

    try {
        const res = await fetch('/api/conditions/list');
        if (!res.ok) return [];

        const data = await res.json();
        activeConditionsCache = data.conditions || [];
        conditionsCacheTimestamp = now;

        return activeConditionsCache;
    } catch (err) {
        console.warn('Erreur lors de la récupération des conditions:', err);
        return [];
    }
}

/**
 * Analyse les conditions et retourne les alertes pour un type de jet donné
 * @param {string} rollType - Type de jet: 'attack', 'ability', 'saving_throw', 'skill'
 * @param {string} specificAbility - Caractéristique spécifique (ex: 'str', 'dex', 'con')
 * @returns {Array} Tableau d'objets alerte {type: 'warning'|'danger'|'info', message: string}
 */
async function getConditionAlerts(rollType, specificAbility = null) {
    const conditions = await getActiveConditions();
    if (conditions.length === 0) return [];

    const alerts = [];

    conditions.forEach(condition => {
        const condId = condition.condition_id;

        // Conditions affectant les JETS D'ATTAQUE
        if (rollType === 'attack') {
            if (condId === 'poisoned') {
                alerts.push({
                    type: 'warning',
                    icon: '☠️',
                    message: 'Empoisonné : Désavantage aux jets d\'attaque'
                });
            }
            if (condId === 'prone') {
                alerts.push({
                    type: 'warning',
                    icon: '🤕',
                    message: 'À terre : Désavantage aux jets d\'attaque'
                });
            }
            if (condId === 'blinded') {
                alerts.push({
                    type: 'warning',
                    icon: '👁️',
                    message: 'Aveuglé : Désavantage aux jets d\'attaque'
                });
            }
            if (condId === 'frightened') {
                alerts.push({
                    type: 'warning',
                    icon: '😱',
                    message: 'Effrayé : Désavantage si la source est visible'
                });
            }
            if (condId === 'restrained') {
                alerts.push({
                    type: 'warning',
                    icon: '⛓️',
                    message: 'Entravé : Désavantage aux jets d\'attaque'
                });
            }
            if (condId === 'invisible') {
                alerts.push({
                    type: 'info',
                    icon: '👻',
                    message: 'Invisible : Avantage aux jets d\'attaque'
                });
            }
        }

        // Conditions affectant les JETS DE CARACTÉRISTIQUE et COMPÉTENCES
        if (rollType === 'ability' || rollType === 'skill') {
            if (condId === 'poisoned') {
                alerts.push({
                    type: 'warning',
                    icon: '☠️',
                    message: 'Empoisonné : Désavantage aux jets de caractéristique'
                });
            }
            if (condId === 'frightened') {
                alerts.push({
                    type: 'warning',
                    icon: '😱',
                    message: 'Effrayé : Désavantage aux jets de caractéristique'
                });
            }
            if (condId.startsWith('exhaustion_')) {
                alerts.push({
                    type: 'warning',
                    icon: '😫',
                    message: 'Épuisement : Désavantage aux jets de caractéristique'
                });
            }

            // Échecs automatiques pour certaines caractéristiques
            if (specificAbility === 'str' || specificAbility === 'dex') {
                if (condId === 'paralyzed') {
                    alerts.push({
                        type: 'danger',
                        icon: '⚡',
                        message: `Paralysé : Échec automatique aux jets de ${specificAbility.toUpperCase()}`
                    });
                }
                if (condId === 'petrified') {
                    alerts.push({
                        type: 'danger',
                        icon: '🗿',
                        message: `Pétrifié : Échec automatique aux jets de ${specificAbility.toUpperCase()}`
                    });
                }
                if (condId === 'stunned') {
                    alerts.push({
                        type: 'danger',
                        icon: '💫',
                        message: `Étourdi : Échec automatique aux jets de ${specificAbility.toUpperCase()}`
                    });
                }
                if (condId === 'unconscious') {
                    alerts.push({
                        type: 'danger',
                        icon: '💤',
                        message: `Inconscient : Échec automatique aux jets de ${specificAbility.toUpperCase()}`
                    });
                }
            }

            // Entravé affecte les jets de Dextérité
            if (specificAbility === 'dex' && condId === 'restrained') {
                alerts.push({
                    type: 'warning',
                    icon: '⛓️',
                    message: 'Entravé : Désavantage aux jets de Dextérité'
                });
            }
        }

        // Conditions affectant les JETS DE SAUVEGARDE
        if (rollType === 'saving_throw') {
            // Concentration nécessite un jet de sauvegarde de Constitution
            if (condId === 'concentrating' && specificAbility === 'con') {
                alerts.push({
                    type: 'info',
                    icon: '🎯',
                    message: 'En concentration : Maintenir la concentration (DD 10 ou dégâts/2)'
                });
            }

            // Échecs automatiques pour Force et Dextérité
            if (specificAbility === 'str' || specificAbility === 'dex') {
                if (condId === 'paralyzed' || condId === 'petrified' || condId === 'stunned' || condId === 'unconscious') {
                    alerts.push({
                        type: 'danger',
                        icon: '⚠️',
                        message: `Échec automatique aux sauvegardes de ${specificAbility.toUpperCase()}`
                    });
                }
            }
        }

        // Alertes générales pour certaines conditions graves
        if (condId === 'incapacitated') {
            alerts.push({
                type: 'danger',
                icon: '🚫',
                message: 'Neutralisé : Impossible d\'effectuer des actions ou réactions'
            });
        }
    });

    return alerts;
}

/**
 * Affiche les alertes de conditions dans le résultat
 */
function formatConditionAlerts(alerts) {
    if (alerts.length === 0) return '';

    const alertsHTML = alerts.map(alert => {
        let bgColor;
        if (alert.type === 'danger') bgColor = 'var(--danger-red)';
        else if (alert.type === 'warning') bgColor = 'var(--warning-orange)';
        else bgColor = 'var(--info-blue, #2196F3)';

        return `
            <div style="
                margin: 10px 0;
                padding: 10px 15px;
                background: ${bgColor};
                border-left: 4px solid rgba(0,0,0,0.3);
                border-radius: 4px;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span style="font-size: 1.2rem;">${alert.icon}</span>
                <span>${alert.message}</span>
            </div>
        `;
    }).join('');

    return `<div style="margin-top: 15px;">${alertsHTML}</div>`;
}

// === SYSTÈME DE SONS ===
const DiceSounds = {
    critical: () => playSound(800, 0.2, 'square', [
        {freq: 800, time: 0},
        {freq: 1200, time: 0.1},
        {freq: 1600, time: 0.15}
    ]),
    fumble: () => playSound(200, 0.3, 'sawtooth', [
        {freq: 400, time: 0},
        {freq: 200, time: 0.15}
    ]),
    success: () => playSound(600, 0.15, 'sine'),
    click: () => playSound(400, 0.05, 'sine')
};

function playSound(frequency, duration, type = 'sine', sequence = null) {
    if (!soundEnabled) return;

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        if (sequence) {
            sequence.forEach(step => {
                oscillator.frequency.setValueAtTime(step.freq, audioContext.currentTime + step.time);
            });
        }

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.warn('Audio non disponible:', e);
    }
}

// === SYSTÈME DE NOTIFICATIONS TOAST ===
function showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${icons[type] || icons.info} ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span class="toast-close" onclick="this.parentElement.parentElement.remove()">×</span>
        </div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// === SYSTÈME DE THÈME ===
function initTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', currentTheme);

    const icon = document.querySelector('.theme-toggle-icon');
    if (icon) {
        icon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    }

    showToast(`Mode ${currentTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'success', 2000);
}

// === SYSTÈME D'HISTORIQUE DES DÉS ===
function addToDiceHistory(rollData) {
    const historyItem = {
        ...rollData,
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('fr-FR')
    };

    diceHistory.unshift(historyItem);

    // Limiter l'historique
    if (diceHistory.length > MAX_HISTORY_ITEMS) {
        diceHistory = diceHistory.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem('diceHistory', JSON.stringify(diceHistory));
    updateHistoryDisplay();
    updateHistoryBadge();
}

function updateHistoryDisplay() {
    const historyContent = document.querySelector('.history-content');
    if (!historyContent) return;

    historyContent.innerHTML = diceHistory.slice(0, 20).map(item => `
        <div class="history-item ${item.critical ? 'critical' : ''} ${item.fumble ? 'fumble' : ''}">
            <div class="history-item-type">${item.roll_type || 'Jet de dé'}</div>
            <div class="history-item-result">
                ${item.formula ? item.formula + ' = ' : ''}${item.result}
            </div>
            ${item.details ? `<div style="font-size: 0.8rem; color: var(--text-muted);">${item.details}</div>` : ''}
            <div class="history-item-time">${item.timestamp}</div>
        </div>
    `).join('');
}

function toggleHistory() {
    const history = document.querySelector('.dice-history');
    if (history) {
        history.classList.toggle('open');
        if (history.classList.contains('open')) {
            updateHistoryDisplay();
        }
    }
}

function clearHistory() {
    if (confirm('Effacer tout l\'historique des jets de dés ?')) {
        diceHistory = [];
        localStorage.setItem('diceHistory', JSON.stringify(diceHistory));
        updateHistoryDisplay();
        updateHistoryBadge();
        showToast('Historique effacé', 'success');
    }
}

function updateHistoryBadge() {
    const badge = document.querySelector('.history-badge');
    if (badge) {
        const count = diceHistory.length;
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// === RACCOURCIS CLAVIER ===
const KEYBOARD_SHORTCUTS = {
    'h': () => toggleHistory(),
    '?': () => toggleShortcutsHelp(),
    't': () => toggleTheme(),
    's': () => toggleSound(),
    'Escape': () => {
        closeDiceResult();
        closeHistory();
        closeShortcutsHelp();
    }
};

function handleKeyboardShortcut(event) {
    // Ignorer si on est dans un input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    const shortcut = KEYBOARD_SHORTCUTS[event.key];
    if (shortcut) {
        event.preventDefault();
        shortcut();
    }
}

function toggleShortcutsHelp() {
    const help = document.querySelector('.shortcuts-help');
    if (help) {
        help.classList.toggle('open');
    }
}

function closeShortcutsHelp() {
    const help = document.querySelector('.shortcuts-help');
    if (help) {
        help.classList.remove('open');
    }
}

function closeHistory() {
    const history = document.querySelector('.dice-history');
    if (history) {
        history.classList.remove('open');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    showToast(`Sons ${soundEnabled ? 'activés' : 'désactivés'}`, 'info', 2000);
    if (soundEnabled) {
        DiceSounds.click();
    }
}

// === LOADING STATES ===
function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// === INITIALISATION WEBSOCKET ===
function initDiceWebSocket() {
    // Ne pas initialiser WebSocket sur la page viewer
    if (window.location.pathname !== '/dice-viewer') {
        try {
            diceSocket = io();
            console.log('🎲 WebSocket initialisé pour diffusion des dés');
            
            diceSocket.on('connect', function() {
                console.log('📡 WebSocket connecté pour diffusion');
            });
            
            diceSocket.on('disconnect', function() {
                console.log('📡 WebSocket déconnecté');
            });
        } catch (error) {
            console.log('⚠️ WebSocket non disponible:', error);
        }
    }
}

// === UTILITAIRES ===
function showDiceResult(result, rollData = null) {
    const resultsDiv = document.getElementById('dice-results');
    const resultText = document.getElementById('result-text');

    resultText.innerHTML = result;
    resultsDiv.style.display = 'flex';
    resultsDiv.classList.add('fade-in');

    // Ajouter à l'historique si des données sont fournies
    if (rollData) {
        addToDiceHistory(rollData);

        // Jouer le son approprié
        if (rollData.critical) {
            DiceSounds.critical();
        } else if (rollData.fumble) {
            DiceSounds.fumble();
        } else {
            DiceSounds.success();
        }
    }

    // Extraire et diffuser les données si WebSocket disponible
    if (diceSocket && diceSocket.connected) {
        try {
            const extractedData = rollData || extractRollDataFromResult(result);
            if (extractedData) {
                console.log('🎲 Données extraites pour diffusion:', extractedData);
            }
        } catch (error) {
            console.error('Erreur extraction données dé:', error);
        }
    }
}

function extractRollDataFromResult(htmlResult) {
    // Parser le HTML pour extraire les informations de jet
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlResult, 'text/html');
    
    const titleElement = doc.querySelector('h3');
    const diceRollElement = doc.querySelector('.dice-roll');
    
    if (titleElement && diceRollElement) {
        const resultText = diceRollElement.textContent.trim();
        const resultNumber = parseInt(resultText.split(' ')[0]) || 0;
        
        return {
            roll_type: titleElement.textContent.trim(),
            result: resultNumber,
            formula: 'Custom',
            details: resultText,
            timestamp: new Date().toLocaleTimeString()
        };
    }
    
    return null;
}

function closeDiceResult() {
    const resultsDiv = document.getElementById('dice-results');
    resultsDiv.style.display = 'none';
}

function formatBonus(bonus) {
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function makeRequest(url, data, callback, loadingElement = null) {
    // Activer le loading si un élément est fourni
    if (loadingElement) {
        setLoading(loadingElement, true);
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        callback(result);
        if (loadingElement) {
            setLoading(loadingElement, false);
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showDiceResult('<div class="danger">Erreur de connexion au serveur</div>');
        showToast('Erreur de connexion', 'error');
        if (loadingElement) {
            setLoading(loadingElement, false);
        }
    });
}

// === JETS DE SAUVEGARDE ===
async function rollSavingThrow(ability, event) {
    const button = event?.target;

    // Vérifier les conditions AVANT le jet
    const alerts = await getConditionAlerts('saving_throw', ability);
    const alertsHTML = formatConditionAlerts(alerts);

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
            ${alertsHTML}
            <div class="dice-roll ${resultClass}">
                ${data.roll} ${formatBonus(data.bonus)} = ${data.total}
            </div>
            ${resultText ? `<div class="${resultClass}">${resultText}</div>` : ''}
        `;

        const rollData = {
            roll_type: `Sauvegarde ${ability.toUpperCase()}`,
            formula: `1d20${formatBonus(data.bonus)}`,
            result: data.total,
            details: `(${data.roll} ${formatBonus(data.bonus)})`,
            critical: data.critical,
            fumble: data.fumble
        };

        showDiceResult(result, rollData);
    }, button);
}

// === JETS DE COMPÉTENCES ===
async function rollSkillCheck(skill, skillName, event) {
    const button = event?.target;

    // Mapping des compétences vers leurs caractéristiques
    const skillAbilities = {
        'acrobatics': 'dex', 'sleight_of_hand': 'dex', 'stealth': 'dex',
        'arcana': 'int', 'history': 'int', 'investigation': 'int', 'nature': 'int', 'religion': 'int',
        'animal_handling': 'wis', 'insight': 'wis', 'medicine': 'wis', 'perception': 'wis', 'survival': 'wis',
        'deception': 'cha', 'intimidation': 'cha', 'performance': 'cha', 'persuasion': 'cha',
        'athletics': 'str'
    };

    const ability = skillAbilities[skill] || null;

    // Vérifier les conditions AVANT le jet
    const alerts = await getConditionAlerts('skill', ability);
    const alertsHTML = formatConditionAlerts(alerts);

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
            ${alertsHTML}
            <div class="dice-roll ${resultClass}">
                ${data.roll} ${formatBonus(data.bonus)} = ${data.total}
            </div>
            ${resultText ? `<div class="${resultClass}">${resultText}</div>` : ''}
        `;

        const rollData = {
            roll_type: `Test de ${skillName}`,
            formula: `1d20${formatBonus(data.bonus)}`,
            result: data.total,
            details: `(${data.roll} ${formatBonus(data.bonus)})`,
            critical: data.critical,
            fumble: data.fumble
        };

        showDiceResult(result, rollData);
    }, button);
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

// === TEMPORARY HIT POINTS ===

/**
 * Définir les Temporary HP
 * Règle: Les temp HP ne se cumulent pas, on garde le maximum
 */
function setTempHP() {
    const input = document.getElementById('temp-hp-input');
    const newTempHP = parseInt(input.value) || 0;

    if (newTempHP <= 0) {
        showDiceResult('<div class="danger">⚠️ Montant invalide</div>');
        return;
    }

    makeRequest('/api/set_temp_hp', {
        temp_hp: newTempHP
    }, function(data) {
        if (data.success) {
            updateTempHP(data.temp_hp);

            let message = `<h3>⚡ Temporary Hit Points</h3>`;
            if (data.replaced) {
                message += `<div style="color: var(--warning-orange);">Remplacé ${data.old_temp_hp} Temp HP par ${data.temp_hp}</div>`;
            } else {
                message += `<div style="color: var(--info-blue);">+${data.temp_hp} Temporary Hit Points obtenus</div>`;
            }
            message += `<div style="margin-top: 10px; font-size: 0.9rem; color: var(--text-muted);">
                Les Temp HP sont perdus en premier lors des dégâts
            </div>`;

            showDiceResult(message);
            input.value = 0;
        } else {
            showDiceResult(`<div class="danger">❌ ${data.error}</div>`);
        }
    });
}

/**
 * Retirer tous les Temporary HP
 */
function clearTempHP() {
    makeRequest('/api/clear_temp_hp', {}, function(data) {
        if (data.success) {
            updateTempHP(0);
            showDiceResult(`
                <h3>🗑️ Temp HP Retirés</h3>
                <div>${data.removed} Temporary HP retirés</div>
            `);
        }
    });
}

/**
 * Mettre à jour l'affichage des Temp HP
 */
function updateTempHP(tempHP) {
    const display = document.getElementById('temp-hp-display');
    if (display) {
        display.textContent = tempHP;

        // Animation
        display.style.transform = 'scale(1.3)';
        display.style.color = tempHP > 0 ? 'var(--info-blue)' : 'var(--text-muted)';
        setTimeout(() => {
            display.style.transform = 'scale(1)';
        }, 300);
    }
}

// === ATTAQUES D'ARMES ===
async function rollWeaponAttack(weaponKey) {
    const sacredWeapon = document.getElementById('sacred-weapon-check')?.checked || false;
    const smiteLevel = parseInt(document.getElementById('smite-level-select')?.value) || 0;

    // Vérifier les conditions AVANT l'attaque
    const alerts = await getConditionAlerts('attack');
    const alertsHTML = formatConditionAlerts(alerts);

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
            ${alertsHTML}
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
async function castSpell(spellName, isAttack = false) {
    const level = parseInt(document.getElementById('spell-level-select')?.value) || 1;

    // Vérifier les conditions AVANT le sort d'attaque
    let alertsHTML = '';
    if (isAttack) {
        const alerts = await getConditionAlerts('attack');
        alertsHTML = formatConditionAlerts(alerts);
    }

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

            result += alertsHTML + `
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

// === LANCEUR DE DÉS PERSONNALISÉ ===
function rollCustomDice() {
    const count = parseInt(document.getElementById('dice-count')?.value) || 1;
    const sides = parseInt(document.getElementById('dice-type')?.value) || 20;
    const modifier = parseInt(document.getElementById('dice-modifier')?.value) || 0;
    
    makeRequest('/api/roll_custom_dice', {
        count: count,
        sides: sides,
        modifier: modifier,
        label: `Jet personnalisé ${count}d${sides}${modifier !== 0 ? (modifier > 0 ? '+' + modifier : modifier) : ''}`
    }, function(data) {
        if (data.success) {
            const result = `
                <h3>Jet Personnalisé</h3>
                <div class="dice-roll">
                    ${data.total}
                </div>
                <div>Formule: ${data.formula}</div>
                <div>Détails: [${data.rolls.join(', ')}]</div>
            `;
            showDiceResult(result);
        }
    });
}

// === ÉVÉNEMENTS ===
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le thème
    initTheme();

    // Initialiser WebSocket
    initDiceWebSocket();

    // Initialiser les raccourcis clavier
    document.addEventListener('keydown', handleKeyboardShortcut);

    // Mettre à jour le badge de l'historique
    updateHistoryBadge();

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