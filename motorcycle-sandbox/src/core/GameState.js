// Máquina de estados simples do jogo. Nesta fase o jogo entra
// directamente em PLAYING, mas a infraestrutura de estados fica pronta
// para menus, pausa e game over em fases futuras.

export const GameStates = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
};

export class GameState {
    constructor(events) {
        this.events = events;
        this.current = GameStates.LOADING;
    }

    set(newState) {
        if (newState === this.current) return;

        const previous = this.current;
        this.current = newState;

        this.events?.emit('gameState.changed', { previous, current: newState });
    }

    is(state) {
        return this.current === state;
    }
}
