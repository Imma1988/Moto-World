import { Constants } from './Constants.js';

// Sistema de input centralizado. Traduz códigos de tecla em "acções"
// nomeadas (ver Constants.CONTROLS), para que o resto do jogo nunca
// precise de conhecer teclas específicas. Isto permite remapear os
// controlos no futuro sem alterar a lógica da mota ou do jogador.

export class Input {
    constructor() {
        this.keyToAction = this.buildKeyMap(Constants.CONTROLS);

        this.held = new Set();
        this.justPressed = new Set();

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    buildKeyMap(controls) {
        const map = new Map();
        for (const [action, keys] of Object.entries(controls)) {
            keys.forEach((key) => map.set(key, action));
        }
        return map;
    }

    onKeyDown(event) {
        const action = this.keyToAction.get(event.code);
        if (!action) return;

        if (!this.held.has(action)) {
            this.justPressed.add(action);
        }
        this.held.add(action);
    }

    onKeyUp(event) {
        const action = this.keyToAction.get(event.code);
        if (!action) return;

        this.held.delete(action);
    }

    isPressed(action) {
        return this.held.has(action);
    }

    // Verdadeiro apenas no frame em que a tecla foi premida (útil para
    // acções de disparo único como "interact" ou "reset").
    wasJustPressed(action) {
        return this.justPressed.has(action);
    }

    // Deve ser chamado uma vez por frame, depois da lógica ter lido
    // wasJustPressed, para limpar o estado de disparo único.
    update() {
        this.justPressed.clear();
    }

    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}
