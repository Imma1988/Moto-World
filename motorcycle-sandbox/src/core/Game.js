import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Constants } from './Constants.js';
import { Time } from './Time.js';
import { Input } from './Input.js';
import { Events } from './Events.js';
import { GameState, GameStates } from './GameState.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { MotorcycleFactory } from '../motorcycle/MotorcycleFactory.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';
import { HUD } from '../ui/HUD.js';

// Orquestrador principal do jogo. Responsável por inicializar cada
// sistema, correr o game loop e coordenar a ordem de actualização:
// input -> lógica -> física -> renderização.

export class Game {
    constructor(container) {
        this.container = container;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.physicsWorld = null;

        this.events = new Events();
        this.time = new Time();
        this.input = new Input();
        this.gameState = new GameState(this.events);

        this.world = null;
        this.player = null;
        this.motorcycle = null;
        this.thirdPersonCamera = null;
        this.hud = null;

        this.isRunning = false;
        this.accumulator = 0;

        this.handleResize = this.handleResize.bind(this);
    }

    async init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        await this.setupPhysics();

        this.world = new World(this.scene, this.physicsWorld);

        const spawnPoint = this.world.getSpawnPoint();
        this.motorcycle = MotorcycleFactory.createDefault(
            this.scene,
            this.physicsWorld,
            this.world,
            this.input,
            this.events,
            spawnPoint
        );

        this.player = new Player(this.scene);
        this.player.enterMotorcycle(this.motorcycle);

        this.thirdPersonCamera = new ThirdPersonCamera(this.camera, this.physicsWorld, Constants.CAMERA);
        this.hud = new HUD(document.getElementById('hud'));

        window.addEventListener('resize', this.handleResize);

        this.gameState.set(GameStates.PLAYING);
        this.events.emit('game.started');
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: Constants.RENDER.antialias });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, Constants.RENDER.maxPixelRatio));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = Constants.RENDER.shadows;

        this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            Constants.CAMERA.fov,
            window.innerWidth / window.innerHeight,
            Constants.CAMERA.near,
            Constants.CAMERA.far
        );
        this.camera.position.set(0, Constants.CAMERA.height, -Constants.CAMERA.distance);
    }

    async setupPhysics() {
        await RAPIER.init();

        const { gravity, fixedTimeStep } = Constants.PHYSICS;
        this.physicsWorld = new RAPIER.World(gravity);
        this.physicsWorld.timestep = fixedTimeStep;
    }

    start() {
        this.isRunning = true;
        this.time.start();
        requestAnimationFrame(() => this.loop());
    }

    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.loop());

        this.time.update();
        this.updatePhysics(this.time.delta);
        this.updateLogic(this.time.delta);
        this.render();
    }

    updatePhysics(dt) {
        const { fixedTimeStep, maxSubSteps } = Constants.PHYSICS;

        this.accumulator += dt;
        let steps = 0;

        while (this.accumulator >= fixedTimeStep && steps < maxSubSteps) {
            this.motorcycle.fixedUpdate(fixedTimeStep);
            this.physicsWorld.step();
            this.motorcycle.syncPhysicsToVisual(fixedTimeStep);

            this.accumulator -= fixedTimeStep;
            steps++;
        }
    }

    updateLogic(dt) {
        if (!this.gameState.is(GameStates.PLAYING)) return;

        const cameraTarget = this.player.isOnMotorcycle() ? this.motorcycle.getMesh() : this.player.getMesh();
        this.thirdPersonCamera.update(cameraTarget, dt);

        this.hud.update({ speedKmh: this.motorcycle.getSpeedKmh(), state: this.motorcycle.getState() });

        this.input.update();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    stop() {
        this.isRunning = false;
    }
}
