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

    WORLD: {
        groundSize: 200,
        skyColor: 0x8fd3f4,
        fogNear: 60,
        fogFar: 220,
        // Ponto seguro usado no início do jogo e em respawns. O World é
        // quem expõe este valor (getSpawnPoint()) — outros sistemas nunca
        // devem ler Constants.WORLD.safeSpawn directamente.
        safeSpawn: { x: 0, y: 0.5, z: 0, heading: 0 },
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
