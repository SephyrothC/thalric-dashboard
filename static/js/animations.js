// ============================================================================
// SYSTÈME D'ANIMATIONS & EFFETS VISUELS
// ============================================================================

// === SYSTÈME DE PARTICULES ===

/**
 * Créer une particule pour les effets visuels
 */
function createParticle(x, y, options = {}) {
    const defaults = {
        color: '#FFD700',
        size: 8,
        velocity: { x: (Math.random() - 0.5) * 4, y: -(Math.random() * 3 + 2) },
        lifetime: 1500,
        gravity: 0.2,
        fade: true,
        glow: true,
        symbol: null // Can be emoji or text
    };

    const config = { ...defaults, ...options };

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${config.size}px;
        height: ${config.size}px;
        background: ${config.color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        ${config.glow ? `box-shadow: 0 0 10px ${config.color}, 0 0 20px ${config.color};` : ''}
        transition: opacity ${config.lifetime * 0.7}ms ease-out;
    `;

    // Si c'est un symbole (emoji), changer le style
    if (config.symbol) {
        particle.textContent = config.symbol;
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: ${config.size * 2}px;
            pointer-events: none;
            z-index: 10000;
            ${config.glow ? `text-shadow: 0 0 10px ${config.color}, 0 0 20px ${config.color};` : ''}
            transition: opacity ${config.lifetime * 0.7}ms ease-out;
        `;
    }

    document.body.appendChild(particle);

    let posX = x;
    let posY = y;
    let velX = config.velocity.x;
    let velY = config.velocity.y;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / config.lifetime;

        if (progress >= 1) {
            particle.remove();
            return;
        }

        // Appliquer la gravité
        velY += config.gravity;

        // Mettre à jour la position
        posX += velX;
        posY += velY;

        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;

        // Fade out
        if (config.fade && progress > 0.7) {
            particle.style.opacity = 1 - ((progress - 0.7) / 0.3);
        }

        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
}

/**
 * Explosion de particules pour les critiques
 */
function criticalParticlesBurst(x, y) {
    // Particules dorées
    for (let i = 0; i < 20; i++) {
        createParticle(x, y, {
            color: '#FFD700',
            size: 6 + Math.random() * 4,
            velocity: {
                x: (Math.random() - 0.5) * 8,
                y: -(Math.random() * 5 + 3)
            },
            lifetime: 1000 + Math.random() * 500,
            glow: true
        });
    }

    // Étoiles brillantes
    for (let i = 0; i < 8; i++) {
        createParticle(x, y, {
            symbol: '✨',
            size: 8,
            velocity: {
                x: (Math.random() - 0.5) * 6,
                y: -(Math.random() * 4 + 2)
            },
            lifetime: 1500,
            glow: true,
            color: '#FFD700'
        });
    }

    // Cercles d'impact
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            createShockwave(x, y, '#FFD700');
        }, i * 100);
    }
}

/**
 * Particules sombres pour les échecs critiques
 */
function fumbleParticlesBurst(x, y) {
    // Particules rouges sombres
    for (let i = 0; i < 15; i++) {
        createParticle(x, y, {
            color: '#DC143C',
            size: 5 + Math.random() * 3,
            velocity: {
                x: (Math.random() - 0.5) * 6,
                y: -(Math.random() * 3 + 1)
            },
            lifetime: 800 + Math.random() * 400,
            glow: true
        });
    }

    // Crânes
    for (let i = 0; i < 5; i++) {
        createParticle(x, y, {
            symbol: '💀',
            size: 6,
            velocity: {
                x: (Math.random() - 0.5) * 4,
                y: -(Math.random() * 3 + 1)
            },
            lifetime: 1200,
            glow: true,
            color: '#DC143C'
        });
    }
}

/**
 * Onde de choc circulaire
 */
function createShockwave(x, y, color) {
    const shockwave = document.createElement('div');
    shockwave.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        border: 3px solid ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        animation: shockwave-expand 0.6s ease-out forwards;
    `;

    document.body.appendChild(shockwave);

    setTimeout(() => shockwave.remove(), 600);
}

// === ANIMATIONS SCREEN SHAKE ===

/**
 * Secouer l'écran pour les échecs critiques
 */
function shakeScreen(intensity = 'medium') {
    const intensities = {
        light: { distance: 5, duration: 300 },
        medium: { distance: 10, duration: 500 },
        heavy: { distance: 15, duration: 700 }
    };

    const config = intensities[intensity] || intensities.medium;

    const body = document.body;
    const originalTransform = body.style.transform;

    let startTime = null;
    const shake = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = elapsed / config.duration;

        if (progress < 1) {
            const intensity = (1 - progress) * config.distance;
            const offsetX = (Math.random() - 0.5) * intensity;
            const offsetY = (Math.random() - 0.5) * intensity;

            body.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            requestAnimationFrame(shake);
        } else {
            body.style.transform = originalTransform;
        }
    };

    requestAnimationFrame(shake);
}

// === ANIMATIONS POUR SORTS ===

/**
 * Animation de sort magique avec traînée lumineuse
 */
function spellCastAnimation(element, spellType = 'default') {
    const spellEffects = {
        fire: { color: '#FF4500', particles: '🔥', count: 15 },
        ice: { color: '#00CED1', particles: '❄️', count: 12 },
        lightning: { color: '#FFD700', particles: '⚡', count: 10 },
        holy: { color: '#FFD700', particles: '✨', count: 20 },
        dark: { color: '#8B008B', particles: '💀', count: 15 },
        healing: { color: '#32CD32', particles: '💚', count: 18 },
        default: { color: '#9370DB', particles: '✨', count: 12 }
    };

    const effect = spellEffects[spellType] || spellEffects.default;

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Créer un halo lumineux
    const halo = document.createElement('div');
    halo.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0px;
        height: 0px;
        background: radial-gradient(circle, ${effect.color}88 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
        animation: spell-halo-expand 0.8s ease-out forwards;
    `;
    document.body.appendChild(halo);
    setTimeout(() => halo.remove(), 800);

    // Particules en spirale
    for (let i = 0; i < effect.count; i++) {
        setTimeout(() => {
            const angle = (i / effect.count) * Math.PI * 2;
            const radius = 50;
            createParticle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, {
                symbol: effect.particles,
                size: 8,
                velocity: {
                    x: Math.cos(angle) * 2,
                    y: Math.sin(angle) * 2 - 2
                },
                lifetime: 1000,
                color: effect.color,
                glow: true
            });
        }, i * 50);
    }

    // Animation de l'élément lui-même
    element.style.animation = 'spell-cast-pulse 0.6s ease-out';
    setTimeout(() => {
        element.style.animation = '';
    }, 600);
}

/**
 * Animation de healing avec particules vertes montantes
 */
function healingAnimation(x, y, amount) {
    // Particules vertes montantes
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            createParticle(x + (Math.random() - 0.5) * 40, y, {
                symbol: '💚',
                size: 6,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: -3 - Math.random() * 2
                },
                lifetime: 1500,
                color: '#32CD32',
                glow: true,
                gravity: -0.1 // Flotter vers le haut
            });
        }, i * 80);
    }

    // Afficher le montant de soin
    const healText = document.createElement('div');
    healText.textContent = `+${amount} HP`;
    healText.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y - 50}px;
        font-size: 24px;
        font-weight: bold;
        color: #32CD32;
        text-shadow: 0 0 10px #32CD32, 0 0 20px #32CD32;
        pointer-events: none;
        z-index: 10000;
        animation: float-up-fade 2s ease-out forwards;
        transform: translateX(-50%);
    `;
    document.body.appendChild(healText);
    setTimeout(() => healText.remove(), 2000);
}

/**
 * Animation de dégâts avec impact
 */
function damageAnimation(x, y, amount, isCritical = false) {
    // Particules d'impact
    const color = isCritical ? '#FFD700' : '#DC143C';
    for (let i = 0; i < (isCritical ? 20 : 10); i++) {
        createParticle(x, y, {
            color: color,
            size: 4 + Math.random() * 4,
            velocity: {
                x: (Math.random() - 0.5) * 6,
                y: -(Math.random() * 4 + 2)
            },
            lifetime: 800,
            glow: true
        });
    }

    // Afficher le montant de dégâts
    const damageText = document.createElement('div');
    damageText.textContent = `-${amount}`;
    damageText.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y - 50}px;
        font-size: ${isCritical ? '32px' : '24px'};
        font-weight: bold;
        color: ${color};
        text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
        pointer-events: none;
        z-index: 10000;
        animation: ${isCritical ? 'damage-critical-bounce' : 'float-up-fade'} 2s ease-out forwards;
        transform: translateX(-50%);
    `;
    document.body.appendChild(damageText);
    setTimeout(() => damageText.remove(), 2000);
}

// === TRANSITIONS FLUIDES ===

/**
 * Transition fade lors du changement de page
 */
function initPageTransitions() {
    // Ajouter un fade-in au chargement de la page
    document.addEventListener('DOMContentLoaded', () => {
        document.body.style.animation = 'page-fade-in 0.3s ease-in';
    });

    // Intercepter les clics sur les liens de navigation
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.href && !link.href.startsWith('javascript:')) {
                e.preventDefault();
                document.body.style.animation = 'page-fade-out 0.2s ease-out';
                setTimeout(() => {
                    window.location.href = link.href;
                }, 200);
            }
        });
    });
}

// === HELPER FUNCTIONS ===

/**
 * Obtenir les coordonnées du centre d'un élément
 */
function getElementCenter(element) {
    if (!element) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

/**
 * Trigger une animation par son nom sur un élément
 */
function triggerAnimation(element, animationName, duration = 600) {
    if (!element) return;

    element.style.animation = `${animationName} ${duration}ms ease-out`;
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

// === INITIALISATION ===

// Initialiser les transitions au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTransitions);
} else {
    initPageTransitions();
}

// Ajouter les keyframes CSS nécessaires
const style = document.createElement('style');
style.textContent = `
    @keyframes shockwave-expand {
        from {
            width: 20px;
            height: 20px;
            opacity: 1;
        }
        to {
            width: 150px;
            height: 150px;
            opacity: 0;
        }
    }

    @keyframes spell-halo-expand {
        from {
            width: 0px;
            height: 0px;
            opacity: 1;
        }
        to {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }

    @keyframes spell-cast-pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
            filter: brightness(1.3);
        }
    }

    @keyframes float-up-fade {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-100px);
        }
    }

    @keyframes damage-critical-bounce {
        0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }
        20% {
            transform: translateX(-50%) translateY(-30px) scale(1.3);
        }
        40% {
            transform: translateX(-50%) translateY(-20px) scale(1.2);
        }
        60% {
            transform: translateX(-50%) translateY(-40px) scale(1.25);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-100px) scale(1);
        }
    }

    @keyframes page-fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes page-fade-out {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }

    .particle {
        will-change: transform, opacity;
    }
`;
document.head.appendChild(style);

console.log('✨ Système d\'animations chargé');
