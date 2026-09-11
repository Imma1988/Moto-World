import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Constants } from './Constants.js';
import { Input } from './Input.js';
import { Time } from './Time.js';
import { GameState } from './GameState.js';
import { EventBus } from './Events.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Motorcycle } from '../motorcycle/Motorcycle.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';

let scene, camera, renderer;
let world, physicsWorld;
let player, motorcycle, thirdPersonCamera;
let isInitialized = false;
let animationId;

// Variáveis para o loop de física fixo
let lastTime = 0;
let physicsAccumulator = 0;
const fixedTimeStep = 1 / 60; // 60Hz para física

export async function init() {
    try {
        // Inicializar Rapier
        await RAPIER.init();
        
        // Remover ecrã de loading
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 500);
        }

        // Criar cena Three.js
        scene = new THREE.Scene();
        scene.background = new THREE.Color(Constants.SKY_COLOR);
        scene.fog = new THREE.Fog(Constants.SKY_COLOR, Constants.FOG_NEAR, Constants.FOG_FAR);

        // Criar câmara
        camera = new THREE.PerspectiveCamera(
            Constants.CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            Constants.CAMERA_NEAR,
            Constants.CAMERA_FAR
        );
        camera.position.set(0, 5, -10);

        // Criar renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(renderer.domElement);

        // Criar iluminação
        setupLighting();

        // Inicializar mundo físico
        const gravity = { x: 0, y: -9.81, z: 0 };
        physicsWorld = new RAPIER.World(gravity);

        // Inicializar sistemas
        Input.init();
        GameState.setState('playing');

        // Criar mundo do jogo
        world = new World(scene, physicsWorld);

        // Criar jogador e mota
        player = new Player(scene, physicsWorld, Constants.INITIAL_PLAYER_POS);
        
        // Criar mota e associar ao jogador
        const motorcycleData = {
            name: "Starter Bike",
            mass: 200,
            maxSpeed: 180,
            acceleration: 80,
            braking: 150,
            steering: 2.5,
            grip: 10,
            offroadGrip: 5,
            airControl: 0.5,
            leanAngle: 0.8,
            suspensionStrength: 35,
            suspensionDamping: 5
        };
        
        motorcycle = new Motorcycle(scene, physicsWorld, Constants.INITIAL_MOTORCYCLE_POS, motorcycleData);
        player.mountMotorcycle(motorcycle);

        // Configurar câmara para seguir a mota
        thirdPersonCamera = new ThirdPersonCamera(camera, motorcycle.mesh, {
            distance: Constants.CAMERA_DISTANCE,
            height: Constants.CAMERA_HEIGHT,
            smoothing: Constants.CAMERA_SMOOTHING
        });

        // Event Listeners
        window.addEventListener('resize', onWindowResize);
        
        isInitialized = true;
        lastTime = performance.now();
        
        // Iniciar loop
        requestAnimationFrame(gameLoop);
        
        console.log("Jogo inicializado com sucesso!");
        
    } catch (error) {
        console.error("Erro ao inicializar o jogo:", error);
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = "Erro ao carregar: " + error.message;
            loadingText.style.color = "#ff4444";
        }
    }
}

function setupLighting() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Luz direcional (Sol)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    scene.add(dirLight);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function gameLoop(currentTime) {
    if (!isInitialized) return;

    animationId = requestAnimationFrame(gameLoop);

    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Limitar deltaTime para evitar saltos grandes
    const safeDelta = Math.min(deltaTime, 0.1);

    // Acumular tempo para física fixa
    physicsAccumulator += safeDelta;

    // Atualizar inputs
    Input.update();

    // Atualizar lógica do jogo (variável)
    update(safeDelta);

    // Atualizar física (passo fixo)
    while (physicsAccumulator >= fixedTimeStep) {
        updatePhysics(fixedTimeStep);
        physicsAccumulator -= fixedTimeStep;
    }

    // Renderizar
    render();
}

function update(deltaTime) {
    // Atualizar estados
    GameState.update(deltaTime);
    
    // Atualizar jogador
    if (player) player.update(deltaTime);
    
    // Atualizar mota
    if (motorcycle) motorcycle.update(deltaTime);
    
    // Atualizar câmara
    if (thirdPersonCamera && motorcycle) {
        thirdPersonCamera.update(deltaTime);
    }
    
    // Atualizar HUD
    updateHUD();
}

function updatePhysics(deltaTime) {
    if (physicsWorld) {
        physicsWorld.step();
    }
    
    // Sincronizar objetos físicos com visuais após o step
    if (motorcycle) motorcycle.syncPhysicsToVisuals();
    if (player) player.syncPhysicsToVisuals();
}

function render() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function updateHUD() {
    if (!motorcycle) return;
    
    const speedElement = document.getElementById('speed-value');
    const stateElement = document.getElementById('state-value');
    
    if (speedElement) {
        // Converter m/s para km/h aproximado
        const speedKmh = Math.abs(motorcycle.getSpeed() * 3.6).toFixed(0);
        speedElement.textContent = speedKmh;
    }
    
    if (stateElement) {
        stateElement.textContent = motorcycle.getState();
    }
}

export function stop() {
    isInitialized = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (renderer) {
        renderer.dispose();
    }
}
