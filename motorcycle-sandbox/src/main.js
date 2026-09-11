/**
 * main.js - Ponto de entrada da aplicação
 * Apenas inicializa e inicia o jogo
 */

import { Game } from './core/Game.js';

// Elemento DOM para o jogo
const container = document.getElementById('game-container');

if (!container) {
    console.error('Game container not found!');
} else {
    // Criar e inicializar o jogo
    const game = new Game();

    // Inicialização assíncrona (necessária para Rapier)
    game.init()
        .then(() => {
            console.log('Motorcycle Sandbox: Ready');
            
            // Iniciar o game loop
            game.start();
        })
        .catch((error) => {
            console.error('Failed to initialize game:', error);
        });
}
