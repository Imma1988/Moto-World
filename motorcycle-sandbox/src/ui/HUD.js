import { MotorcycleState } from '../motorcycle/Motorcycle.js';

// HUD mínimo, apenas para testar a mota: velocidade actual e um aviso
// simples de crash/respawn. Não é o HUD final do jogo (minimapa,
// dinheiro, missões, etc. ficam para fases futuras).
export class HUD {
    constructor(container) {
        this.container = container;

        this.speedElement = document.createElement('div');
        this.speedElement.id = 'hud-speed';
        this.container.appendChild(this.speedElement);

        this.statusElement = document.createElement('div');
        this.statusElement.id = 'hud-status';
        this.container.appendChild(this.statusElement);
    }

    update({ speedKmh, state }) {
        this.speedElement.textContent = `${Math.round(speedKmh)} km/h`;

        if (state === MotorcycleState.CRASHED) {
            this.statusElement.textContent = 'CRASH!';
            this.statusElement.style.display = 'block';
        } else if (state === MotorcycleState.RESPAWNING) {
            this.statusElement.textContent = 'A reiniciar...';
            this.statusElement.style.display = 'block';
        } else {
            this.statusElement.style.display = 'none';
        }
    }
}
