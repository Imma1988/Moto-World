// Constantes globais de configuração. Centraliza valores para evitar
// "números mágicos" espalhados pelo código e facilitar afinações futuras.

export const Constants = {
    RENDER: {
        antialias: true,
        shadows: true,
        maxPixelRatio: 2,
    },

    CAMERA: {
        fov: 60,
        near: 0.1,
        far: 1000,
        distance: 8,
        height: 3.5,
        lookAtHeight: 1.2,
        smoothing: 6, // maior = câmara "cola-se" mais depressa ao alvo
    },

    WORLD: {
        groundSize: 200,
        skyColor: 0x8fd3f4,
        fogNear: 60,
        fogFar: 220,
    },

    PHYSICS: {
        gravity: { x: 0, y: -9.81, z: 0 },
        fixedTimeStep: 1 / 60,
        maxSubSteps: 5,
    },

    SPAWN: {
        motorcycle: { x: 0, y: 2, z: 0 },
    },

    // Mapeamento de acções para teclas. Vários códigos podem apontar para a
    // mesma acção. A lógica do jogo nunca deve ler códigos de tecla
    // directamente, apenas nomes de acções.
    CONTROLS: {
        accelerate: ['KeyW', 'ArrowUp'],
        brake: ['KeyS', 'ArrowDown'],
        left: ['KeyA', 'ArrowLeft'],
        right: ['KeyD', 'ArrowRight'],
        handbrake: ['Space'],
        interact: ['KeyE'],
        reset: ['KeyR'],
    },
};
