/**
 * Game - Classe principal que gere o ciclo de vida do jogo (FASE 1)
 */

import * as THREE from 'three';
import RAPIER from 'rapier3d-compat';

import { Constants } from './Constants.js';
import { Time } from './Time.js';
import { Input } from './Input.js';
import { GameState } from './GameState.js';
import { events } from './Events.js';

import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Motorcycle } from '../motorcycle/Motorcycle.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';
import { HUD } from '../ui/HUD.js';

export class Game {
    constructor() {
        // Componentes core
        this.time = new Time();
        this.input = new Input();
        this.gameState = new GameState();

        // Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Rapier physics
        this.physicsWorld = null;

        // Sistemas do jogo
        this.world = null;
        this.player = null;
        this.motorcycle = null;
        this.gameCamera = null;
        this.hud = null;

        // Estado do loop
        this.isRunning = false;
        this.animationId = null;

        // Acumulador para física fixed timestep
        this.physicsAccumulator = 0;
    }

    /**
     * Inicializar o jogo
     */
    async init() {
        console.log('Game: Initializing...');

        // Inicializar Three.js
        this.initThree();

        // Inicializar Rapier physics
        await this.initPhysics();

        // Inicializar sistemas
        this.initSystems();

        // Configurar resize
        this.setupResize();

        // Iniciar game state
        this.gameState.start();

        // Iniciar tempo
        this.time.start();

        console.log('Game: Initialization complete');

        // Emitir evento de inicialização
        events.emit('game.initialized');
    }

    /**
     * Inicializar Three.js (renderer, scene, camera)
     */
    initThree() {
        const container = document.getElementById('game-container');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Céu azul simples
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            Constants.Camera.FOV,
            window.innerWidth / window.innerHeight,
            Constants.Camera.NEAR,
            Constants.Camera.FAR
        );
        this.camera.position.set(0, 5, 10);

        // Renderer
        const pixelRatio = Math.min(window.devicePixelRatio, Constants.Renderer.PIXEL_RATIO_LIMIT);
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: Constants.Renderer.ANTIALIAS,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.shadowMap.enabled = Constants.Renderer.SHADOWS;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(this.renderer.domElement);

        // Iluminação básica
        this.setupLighting();
    }

    /**
     * Configurar iluminação da cena
     */
    setupLighting() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Luz direcional (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
    }

    /**
     * Inicializar mundo físico Rapier
     */
    async initPhysics() {
        await RAPIER.init();

        const gravity = { x: 0, y: Constants.Physics.GRAVITY, z: 0 };
        this.physicsWorld = new RAPIER.World(gravity);

        console.log('Physics: Initialized with gravity', gravity);
    }

    /**
     * Inicializar sistemas do jogo
     */
    initSystems() {
        // Mundo
        this.world = new World(this.scene, this.physicsWorld);
        this.world.create();

        // Jogador (posicionado perto da mota)
        this.player = new Player(this.scene, this.physicsWorld);
        this.player.create(new THREE.Vector3(2, 1, 0));

        // Motociclo (posição inicial)
        const motorcycleStartPos = new THREE.Vector3(0, 2, 0);
        this.motorcycle = new Motorcycle(this.scene, this.physicsWorld, this.input, motorcycleStartPos);

        // Câmara third-person
        this.gameCamera = new ThirdPersonCamera(
            this.camera,
            this.motorcycle.getMesh(),
            Constants.Camera.DEFAULT_DISTANCE,
            Constants.Camera.DEFAULT_HEIGHT,
            Constants.Camera.SMOOTHING
        );

        // HUD
        this.hud = new HUD();
    }

    /**
     * Configurar handler de resize da janela
     */
    setupResize() {
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Handler de resize
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * Iniciar o game loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.loop();

        console.log('Game: Loop started');
        events.emit('game.started');
    }

    /**
     * Parar o game loop
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        console.log('Game: Loop stopped');
    }

    /**
     * Game loop principal
     */
    loop() {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame((timestamp) => this.loop());

        // Atualizar tempo
        this.time.update(timestamp);

        // Apenas atualizar se o jogo estiver em estado PLAYING
        if (this.gameState.is(Constants.GameState.PLAYING)) {
            this.update();
            this.updatePhysics();
        }

        // Renderizar sempre (para não congelar a tela)
        this.render();
    }

    /**
     * Atualizar lógica do jogo
     */
    update() {
        const delta = this.time.getClampedDelta();

        // Atualizar input
        // (input já é atualizado via event listeners)

        // Atualizar player
        this.player.update(delta, this.input);

        // Atualizar motociclo
        this.motorcycle.update(delta);

        // Atualizar câmara para seguir a mota
        this.gameCamera.update(delta);

        // Atualizar HUD com dados da mota
        this.updateHUD();

        // Verificar respawn manual (tecla R)
        // (já tratado no MotorcycleController)
    }

    /**
     * Atualizar HUD com informações da mota
     */
    updateHUD() {
        if (!this.hud || !this.motorcycle) return;

        const speed = this.motorcycle.getSpeed();
        const state = this.motorcycle.getState();

        this.hud.updateSpeed(speed);
        this.hud.updateState(state);
    }

    /**
     * Atualizar física com fixed timestep
     */
    updatePhysics() {
        const delta = this.time.getDelta();
        this.physicsAccumulator += delta;

        const fixedStep = Constants.Physics.FIXED_TIMESTEP;
        const maxSteps = Constants.Physics.MAX_STEPS;
        let steps = 0;

        // Processar física em passos fixos
        while (this.physicsAccumulator >= fixedStep && steps < maxSteps) {
            this.physicsWorld.step();
            this.physicsAccumulator -= fixedStep;
            steps++;
        }

        // Prevenir acumulação excessiva
        if (this.physicsAccumulator > fixedStep * maxSteps) {
            this.physicsAccumulator = fixedStep;
        }

        // Sincronizar objetos físicos com visuais
        this.world.syncPhysicsObjects();
        this.player.syncPhysicsObject();
        // Motorcycle sincroniza internamente no seu update()
    }

    /**
     * Renderizar a cena
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Resetar o jogo / respawn
     */
    reset() {
        console.log('Game: Reset requested');
        events.emit('game.reset');

        // Resetar motociclo
        this.motorcycle.requestRespawn();

        // Resetar player
        this.player.reset();
    }

    /**
     * Obter estado do jogo
     * @returns {Object}
     */
    getState() {
        return {
            gameState: this.gameState.getState(),
            fps: this.time.getFPS(),
            deltaTime: this.time.getDelta()
        };
    }

    /**
     * Limpar recursos
     */
    dispose() {
        this.stop();

        if (this.hud) {
            this.hud.destroy();
            this.hud = null;
        }

        if (this.motorcycle) {
            this.motorcycle.dispose();
            this.motorcycle = null;
        }

        if (this.player) {
            this.player.dispose();
            this.player = null;
        }

        if (this.world) {
            this.world.dispose();
            this.world = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }

        this.physicsWorld = null;
        this.scene = null;
        this.camera = null;
    }
}

export default Game;
