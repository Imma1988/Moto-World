/**
 * GameState - Gestão dos estados do jogo
 */

import { Constants } from './Constants.js';
import { events } from './Events.js';

export class GameState {
    constructor() {
        this.currentState = Constants.GameState.LOADING;
        this.previousState = null;
    }

    /**
     * Obter o estado atual
     * @returns {string} Estado atual
     */
    getState() {
        return this.currentState;
    }

    /**
     * Verificar se o jogo está num estado específico
     * @param {string} state - Estado a verificar
     * @returns {boolean}
     */
    is(state) {
        return this.currentState === state;
    }

    /**
     * Mudar de estado
     * @param {string} newState - Novo estado
     */
    setState(newState) {
        if (!this.isValidState(newState)) {
            console.warn(`Estado inválido: ${newState}`);
            return;
        }

        if (this.currentState === newState) return;

        this.previousState = this.currentState;
        this.currentState = newState;

        // Emitir evento de mudança de estado
        events.emit('game.stateChanged', {
            from: this.previousState,
            to: this.currentState
        });

        console.log(`GameState: ${this.previousState} -> ${this.currentState}`);
    }

    /**
     * Verificar se um estado é válido
     * @param {string} state - Estado a verificar
     * @returns {boolean}
     */
    isValidState(state) {
        return Object.values(Constants.GameState).includes(state);
    }

    /**
     * Iniciar o jogo (transição para playing)
     */
    start() {
        this.setState(Constants.GameState.PLAYING);
    }

    /**
     * Pausar o jogo
     */
    pause() {
        if (this.is(Constants.GameState.PLAYING)) {
            this.setState(Constants.GameState.PAUSED);
        }
    }

    /**
     * Retomar o jogo
     */
    resume() {
        if (this.is(Constants.GameState.PAUSED)) {
            this.setState(Constants.GameState.PLAYING);
        }
    }

    /**
     * Terminar o jogo
     */
    gameOver() {
        this.setState(Constants.GameState.GAME_OVER);
    }
}

export default GameState;
