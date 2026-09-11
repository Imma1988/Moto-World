import { Game } from './core/Game.js';

// Ponto de entrada da aplicação. Apenas inicia o jogo — toda a lógica
// vive dentro dos sistemas em src/.

const container = document.getElementById('game-container');
const loadingScreen = document.getElementById('loading-screen');

const game = new Game(container);

game.init()
    .then(() => {
        loadingScreen?.remove();
        game.start();
    })
    .catch((error) => {
        console.error('Falha ao inicializar o jogo:', error);
        if (loadingScreen) {
            loadingScreen.textContent = 'Erro ao carregar o jogo. Ver consola.';
        }
    });
