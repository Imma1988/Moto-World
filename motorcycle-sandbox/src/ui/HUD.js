/**
 * HUD - Interface de utilizador mínima para teste da mota
 * Mostra velocidade e estado da mota
 */

export class HUD {
    constructor() {
        this.container = null;
        this.speedElement = null;
        this.stateElement = null;
        this.controlsElement = null;
        
        this.create();
    }
    
    /**
     * Cria elementos do HUD
     */
    create() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'game-hud';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        // Velocidade
        const speedContainer = document.createElement('div');
        speedContainer.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 30px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            padding: 15px 25px;
            color: white;
            text-align: right;
        `;
        
        const speedValue = document.createElement('div');
        speedValue.id = 'hud-speed-value';
        speedValue.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            line-height: 1;
        `;
        speedValue.textContent = '0';
        
        const speedLabel = document.createElement('div');
        speedLabel.style.cssText = `
            font-size: 14px;
            opacity: 0.7;
            margin-top: 5px;
        `;
        speedLabel.textContent = 'km/h';
        
        speedContainer.appendChild(speedValue);
        speedContainer.appendChild(speedLabel);
        this.container.appendChild(speedContainer);
        
        this.speedElement = speedValue;
        
        // Estado da mota
        const stateContainer = document.createElement('div');
        stateContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 10px 20px;
            color: white;
            text-align: center;
            min-width: 150px;
        `;
        
        const stateLabel = document.createElement('div');
        stateLabel.style.cssText = `
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 5px;
        `;
        stateLabel.textContent = 'ESTADO';
        
        const stateValue = document.createElement('div');
        stateValue.id = 'hud-state-value';
        stateValue.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
        `;
        stateValue.textContent = 'NORMAL';
        
        stateContainer.appendChild(stateLabel);
        stateContainer.appendChild(stateValue);
        this.container.appendChild(stateContainer);
        
        this.stateElement = stateValue;
        
        // Controles hint
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 8px;
            padding: 12px 15px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
            line-height: 1.6;
        `;
        
        controlsContainer.innerHTML = `
            <div><strong>W / ↑</strong> Acelerar</div>
            <div><strong>S / ↓</strong> Travar</div>
            <div><strong>A / ←</strong> Esquerda</div>
            <div><strong>D / →</strong> Direita</div>
            <div><strong>SPACE</strong> Travão mão</div>
            <div><strong>R</strong> Respawn</div>
        `;
        
        this.container.appendChild(controlsContainer);
        this.controlsElement = controlsContainer;
        
        // Adicionar ao DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Atualiza velocidade mostrada
     * @param {number} speedMps - Velocidade em metros por segundo
     */
    updateSpeed(speedMps) {
        const speedKmh = Math.round(speedMps * 3.6);
        this.speedElement.textContent = speedKmh.toString();
        
        // Mudar cor em alta velocidade
        if (speedKmh > 100) {
            this.speedElement.style.color = '#ff6666';
        } else if (speedKmh > 60) {
            this.speedElement.style.color = '#ffff66';
        } else {
            this.speedElement.style.color = 'white';
        }
    }
    
    /**
     * Atualiza estado da mota
     * @param {string} state - NORMAL, AIRBORNE, CRASHED, RESPAWNING
     */
    updateState(state) {
        this.stateElement.textContent = state;
        
        switch (state) {
            case 'NORMAL':
                this.stateElement.style.color = '#66ff66';
                break;
            case 'AIRBORNE':
                this.stateElement.style.color = '#66ccff';
                break;
            case 'CRASHED':
                this.stateElement.style.color = '#ff6666';
                break;
            case 'RESPAWNING':
                this.stateElement.style.color = '#ffcc66';
                break;
            default:
                this.stateElement.style.color = 'white';
        }
    }
    
    /**
     * Mostra mensagem temporária
     */
    showMessage(text, duration = 2000) {
        const msgElement = document.createElement('div');
        msgElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;
        msgElement.textContent = text;
        
        this.container.appendChild(msgElement);
        
        setTimeout(() => {
            msgElement.remove();
        }, duration);
    }
    
    /**
     * Esconde/mostra HUD
     */
    setVisible(visible) {
        this.container.style.display = visible ? 'block' : 'none';
    }
    
    /**
     * Limpeza
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
