/**
 * Input - Sistema centralizado de gestão de inputs
 */

import { Constants } from './Constants.js';
import { events } from './Events.js';

export class Input {
    constructor() {
        // Estado atual das teclas
        this.keys = new Map();
        
        // Mapeamento de ações para teclas (pode ser reconfigurado)
        this.bindings = {
            accelerate: [...Constants.Input.ACCELERATE],
            brake: [...Constants.Input.BRAKE],
            left: [...Constants.Input.LEFT],
            right: [...Constants.Input.RIGHT],
            handbrake: [...Constants.Input.HANDBRAKE],
            interact: [...Constants.Input.INTERACT],
            reset: [...Constants.Input.RESET]
        };

        // Estado das ações
        this.actions = {
            accelerate: false,
            brake: false,
            left: false,
            right: false,
            handbrake: false,
            interact: false,
            reset: false
        };

        // Valores analógicos (para suporte futuro a gamepads)
        this.values = {
            throttle: 0,  // 0 a 1
            brake: 0,     // 0 a 1
            steer: 0      // -1 a 1
        };

        this.setupListeners();
    }

    /**
     * Configurar event listeners para teclado
     */
    setupListeners() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    /**
     * Handler para keydown
     * @param {KeyboardEvent} e 
     */
    onKeyDown(e) {
        const code = e.code;
        
        if (this.keys.get(code)) return; // Evitar repetição
        
        this.keys.set(code, true);
        this.updateActions();

        // Emitir evento de tecla pressionada
        events.emit('input.keyDown', { code, action: this.getActionFromCode(code) });
    }

    /**
     * Handler para keyup
     * @param {KeyboardEvent} e 
     */
    onKeyUp(e) {
        const code = e.code;
        this.keys.set(code, false);
        this.updateActions();

        // Emitir evento de tecla libertada
        events.emit('input.keyUp', { code, action: this.getActionFromCode(code) });
    }

    /**
     * Obter ação associada a um código de tecla
     * @param {string} code 
     * @returns {string|null}
     */
    getActionFromCode(code) {
        for (const [action, codes] of Object.entries(this.bindings)) {
            if (codes.includes(code)) {
                return action;
            }
        }
        return null;
    }

    /**
     * Atualizar estado das ações baseado nas teclas pressionadas
     */
    updateActions() {
        // Ações booleanas
        this.actions.accelerate = this.isAnyPressed(this.bindings.accelerate);
        this.actions.brake = this.isAnyPressed(this.bindings.brake);
        this.actions.left = this.isAnyPressed(this.bindings.left);
        this.actions.right = this.isAnyPressed(this.bindings.right);
        this.actions.handbrake = this.isAnyPressed(this.bindings.handbrake);
        this.actions.interact = this.isAnyPressed(this.bindings.interact);
        this.actions.reset = this.isAnyPressed(this.bindings.reset);

        // Valores analógicos (teclado = digital, mas preparado para gamepad)
        this.values.throttle = this.actions.accelerate ? 1 : 0;
        this.values.brake = this.actions.brake ? 1 : 0;
        
        if (this.actions.left && this.actions.right) {
            this.values.steer = 0;
        } else if (this.actions.left) {
            this.values.steer = -1;
        } else if (this.actions.right) {
            this.values.steer = 1;
        } else {
            this.values.steer = 0;
        }
    }

    /**
     * Verificar se alguma tecla de uma lista está pressionada
     * @param {string[]} codes 
     * @returns {boolean}
     */
    isAnyPressed(codes) {
        return codes.some(code => this.keys.get(code) === true);
    }

    /**
     * Verificar se uma ação está ativa
     * @param {string} action 
     * @returns {boolean}
     */
    isActionPressed(action) {
        return this.actions[action] || false;
    }

    /**
     * Obter valor analógico de uma ação
     * @param {string} action 
     * @returns {number}
     */
    getActionValue(action) {
        return this.values[action] || 0;
    }

    /**
     * Obter estado completo dos inputs
     * @returns {Object}
     */
    getState() {
        return {
            actions: { ...this.actions },
            values: { ...this.values }
        };
    }

    /**
     * Reconfigurar binding de uma ação
     * @param {string} action 
     * @param {string[]} codes 
     */
    setBinding(action, codes) {
        if (this.bindings.hasOwnProperty(action)) {
            this.bindings[action] = codes;
        }
    }

    /**
     * Limpar todos os inputs (útil quando o jogo perde foco)
     */
    clear() {
        this.keys.clear();
        this.updateActions();
    }
}

export default Input;
