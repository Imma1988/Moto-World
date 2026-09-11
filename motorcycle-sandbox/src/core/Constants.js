/**
 * Constants - Valores globais e configurações do jogo
 */

export const Constants = {
    // Estados do jogo
    GameState: {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    },

    // Configurações de física
    Physics: {
        GRAVITY: -9.81,
        FIXED_TIMESTEP: 1 / 60,
        MAX_STEPS: 5
    },

    // Configurações da câmara
    Camera: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 1000,
        DEFAULT_DISTANCE: 5,
        DEFAULT_HEIGHT: 2,
        SMOOTHING: 0.1
    },

    // Configurações do renderer
    Renderer: {
        PIXEL_RATIO_LIMIT: 2,
        ANTIALIAS: true,
        SHADOWS: true
    },

    // Inputs
    Input: {
        ACCELERATE: ['KeyW', 'ArrowUp'],
        BRAKE: ['KeyS', 'ArrowDown'],
        LEFT: ['KeyA', 'ArrowLeft'],
        RIGHT: ['KeyD', 'ArrowRight'],
        HANDBRAKE: ['Space'],
        INTERACT: ['KeyE'],
        RESET: ['KeyR']
    },

    // Mundo
    World: {
        GROUND_SIZE: 200,
        OBSTACLE_COUNT: 20
    }
};

export default Constants;
