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
        // Suavizações independentes: a posição da câmara "atrasa-se" mais
        // (sensação de peso / camera lag), o ponto para onde olha reage
        // um pouco mais depressa para não parecer andar à deriva.
        positionSmoothing: 4,
        lookAtSmoothing: 8,
        // Velocidade (m/s) usada para normalizar os efeitos abaixo a 0..1.
        speedReference: 30,
        distanceSpeedBoost: 2.5, // distância extra à velocidade de referência
        lookAheadDistance: 3.0, // quanto a câmara "olha à frente" à velocidade de referência
    },

    // O tamanho do mapa, waypoints de estradas e ponto de spawn vivem em
    // world/MapLayout.js (dados de conteúdo do mundo, não afinações do
    // motor de jogo) — para evitar duas fontes de verdade.
    WORLD: {
        skyColor: 0x8fd3f4,
        fogNear: 90,
        fogFar: 300,
    },

    PHYSICS: {
        gravity: { x: 0, y: -9.81, z: 0 },
        fixedTimeStep: 1 / 60,
        maxSubSteps: 5,
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
