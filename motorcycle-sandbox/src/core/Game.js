import * as THREE from 'three';
import RAPIER from 'rapier3d'; // O import map resolve isto para a URL correta
import { Constants } from '../core/Constants.js';
import { Time } from '../core/Time.js';
import { Input } from '../core/Input.js';
import { GameState } from '../core/GameState.js';
import { Events } from '../core/Events.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Motorcycle } from '../motorcycle/Motorcycle.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';
import { HUD } from '../ui/HUD.js';

export class Game {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.physicsWorld = null;
        this.gravity = new RAPIER.Vector3(0, -9.81, 0);
        
        this.input = null;
        this.time = null;
        this.gameState = null;
        this.events = null;
        
        this.world = null;
        this.player = null;
        this.motorcycle = null;
        this.thirdPersonCamera = null;
        this.hud = null;
        
        this.isInitialized = false;
        this.isRunning = false;
        
        // Fixed timestep variables
        this.fixedTimeStep = 1.0 / 60.0;
        this.accumulator = 0;
        this.maxSubSteps = 5; // Previne "spiral of death" se o frame demorar muito
    }

    async init() {
        try {
            // 1. Inicializar sistemas base
            this.container = document.getElementById('game-container');
            if (!this.container) {
                throw new Error("Elemento #game-container não encontrado no HTML");
            }

            this.events = new Events();
            this.time = new Time();
            this.input = new Input();
            this.gameState = new GameState();
            this.hud = new HUD();

            // 2. Configurar Three.js
            this.setupThreeJS();

            // 3. Configurar Rapier Physics (Assíncrono)
            await this.setupPhysics();

            // 4. Criar Objetos do Jogo
            this.world = new World(this.scene, this.physicsWorld);
            
            // Criar Mota e Jogador
            const spawnPoint = { x: 0, y: 5, z: 0 };
            this.motorcycle = new Motorcycle(this.scene, this.physicsWorld, spawnPoint, this.events);
            this.player = new Player(this.scene, this.physicsWorld, spawnPoint, this.events);
            
            // Montar o jogador na mota imediatamente
            this.player.enterMotorcycle(this.motorcycle);

            // 5. Configurar Câmara
            this.thirdPersonCamera = new ThirdPersonCamera(
                this.camera, 
                this.motorcycle.getMesh(), 
                Constants.CAMERA
            );

            // 6. Estado Inicial
            this.gameState.setState('playing');
            this.isInitialized = true;

            // Emitir evento de jogo iniciado
            this.events.emit('game.started');

            console.log("Jogo inicializado com sucesso!");
            
            // Esconder loading screen se existir
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.style.display = 'none';

        } catch (error) {
            console.error("Erro crítico na inicialização:", error);
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `<h1 style="color:red">Erro ao iniciar</h1><p>${error.message}</p>`;
            }
            throw error;
        }
    }

    setupThreeJS() {
        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(Constants.WORLD.skyColor);
        this.scene.fog = new THREE.Fog(
            Constants.WORLD.skyColor, 
            Constants.WORLD.fogNear, 
            Constants.WORLD.fogFar
        );

        // Câmera
        this.camera = new THREE.PerspectiveCamera(
            Constants.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            Constants.CAMERA.near,
            Constants.CAMERA.far
        );
        this.camera.position.set(0, 5, -10);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: Constants.RENDER.antialias,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = Constants.RENDER.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);

        // Iluminação
        this.setupLights();

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLights() {
        // Luz Ambiente
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Luz Direcional (Sol)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = Constants.RENDER.shadows;
        
        if (Constants.RENDER.shadows) {
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 0.5;
            dirLight.shadow.camera.far = 500;
            dirLight.shadow.camera.left = -50;
            dirLight.shadow.camera.right = 50;
            dirLight.shadow.camera.top = 50;
            dirLight.shadow.camera.bottom = -50;
        }
        
        this.scene.add(dirLight);
    }

    async setupPhysics() {
        // Inicializar o motor de física
        await RAPIER.init();
        
        this.physicsWorld = new RAPIER.World(this.gravity);
        this.physicsWorld.timestep = this.fixedTimeStep;
        
        console.log("Física Rapier inicializada.");
    }

    start() {
        if (!this.isInitialized) {
            console.warn("Tentativa de iniciar jogo antes da inicialização completa.");
            return;
        }
        this.isRunning = true;
        this.time.start();
        requestAnimationFrame(() => this.loop());
    }

    loop() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.loop());

        // Atualizar Delta Time
        this.time.update();
        const delta = this.time.delta;

        // Acumulador para Fixed Timestep na física
        this.accumulator += delta;
        
        // Limitar o número de passos de física para evitar lag espiral
        let steps = 0;
        while (this.accumulator >= this.fixedTimeStep && steps < this.maxSubSteps) {
            this.updatePhysics(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
            steps++;
        }

        // Interpolação simples (opcional, aqui usamos o estado mais recente para simplicidade)
        // Se quisesse interpolação perfeita, renderizaríamos entre o estado anterior e atual
        
        this.updateLogic(delta);
        this.render();
    }

    updatePhysics(dt) {
        if (!this.physicsWorld) return;

        // Passo de simulação física
        this.physicsWorld.step();

        // Sincronizar objetos físicos com visuais
        if (this.motorcycle) this.motorcycle.syncPhysicsToVisual();
        if (this.player) this.player.syncPhysicsToVisual();
        // Nota: O World poderia ter objetos dinâmicos também, mas por enquanto só o chão (estático)
    }

    updateLogic(dt) {
        if (this.gameState.currentState !== 'playing') return;

        // Atualizar Inputs
        this.input.update();

        // Atualizar Lógica dos Objetos
        if (this.motorcycle) {
            this.motorcycle.update(dt, this.input);
        }

        if (this.player) {
            this.player.update(dt, this.input);
        }

        // Atualizar Câmara
        if (this.thirdPersonCamera && this.motorcycle) {
            // A câmara segue a mota se o jogador estiver montado
            const target = this.player.isOnMotorcycle ? this.motorcycle.getMesh() : this.player.getMesh();
            this.thirdPersonCamera.update(target, dt);
        }

        // Atualizar HUD
        if (this.hud && this.motorcycle) {
            this.hud.update({
                speed: this.motorcycle.getCurrentSpeed(),
                gear: this.motorcycle.getCurrentGear(), // Opcional
                state: this.motorcycle.getState()
            });
        }
    }

    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    stop() {
        this.isRunning = false;
        if (this.physicsWorld) {
            // Limpeza se necessário
        }
    }
}
