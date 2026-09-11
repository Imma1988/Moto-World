/**
 * Motorcycle - Representação da mota com física arcade completa (FASE 1)
 * Integra MotorcyclePhysics, MotorcycleController e modelo visual procedural
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';

import { events } from '../core/Events.js';
import { MotorcycleData } from './MotorcycleData.js';
import { MotorcyclePhysics } from './MotorcyclePhysics.js';
import { MotorcycleController } from './MotorcycleController.js';
import { MathUtils } from '../utils/MathUtils.js';

export class Motorcycle {
    constructor(scene, physicsWorld, inputSystem, startPosition = null) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.input = inputSystem;
        
        // Dados da mota
        this.data = MotorcycleData;
        
        // Estado da mota
        this.state = 'NORMAL';  // NORMAL, AIRBORNE, CRASHED, RESPAWNING
        this.respawnTimer = 0;
        this.lastCrashTime = 0;
        
        // Visual (grupo de meshes)
        this.mesh = null;
        this.bodyMesh = null;
        this.tankMesh = null;
        this.seatMesh = null;
        this.frontWheel = null;
        this.rearWheel = null;
        this.handlebarMesh = null;
        this.forkFront = null;
        this.forkRear = null;
        this.exhaustMesh = null;
        this.headlightMesh = null;
        
        // Componentes
        this.physicsComponent = null;
        this.controllerComponent = null;
        
        // Criar a mota
        const pos = startPosition || new THREE.Vector3(0, 2, 0);
        this.create(pos);
    }

    /**
     * Criar a mota completa
     */
    create(startPosition) {
        console.log('Motorcycle: Creating at', startPosition);

        this.createVisual();
        this.createPhysics(startPosition);
        this.createController();

        console.log('Motorcycle: Creation complete');
        events.emit('motorcycle.created', { motorcycle: this });
    }

    /**
     * Criar representação visual procedural detalhada
     */
    createVisual() {
        this.mesh = new THREE.Group();

        const colors = this.data.colors;

        // === CORPO PRINCIPAL (Chassis) ===
        const bodyGeometry = new THREE.BoxGeometry(
            this.data.width * 0.7,
            this.data.height * 0.35,
            this.data.length * 0.45
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.body,
            roughness: 0.3,
            metalness: 0.6
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = this.data.centerOfMassY;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.mesh.add(this.bodyMesh);

        // === DEPÓSITO DE COMBUSTÍVEL ===
        const tankGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.35, 8);
        const tankMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.tank,
            roughness: 0.2,
            metalness: 0.8
        });
        this.tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
        this.tankMesh.rotation.x = Math.PI / 2;
        this.tankMesh.position.set(0, this.data.centerOfMassY + 0.25, 0.1);
        this.tankMesh.castShadow = true;
        this.mesh.add(this.tankMesh);

        // === ASSENTO ===
        const seatGeometry = new THREE.BoxGeometry(
            this.data.width * 0.6,
            0.08,
            this.data.length * 0.35
        );
        const seatMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.seat,
            roughness: 0.9,
            metalness: 0.1
        });
        this.seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
        this.seatMesh.position.set(0, this.data.centerOfMassY + 0.12, -0.25);
        this.seatMesh.castShadow = true;
        this.mesh.add(this.seatMesh);

        // === RODAS ===
        const wheelGeometry = new THREE.TorusGeometry(
            this.data.wheelRadius,
            0.08,
            8,
            24
        );
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.wheels,
            roughness: 0.7,
            metalness: 0.5
        });

        // Roda dianteira
        this.frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontWheel.rotation.y = Math.PI / 2;
        this.frontWheel.position.set(0, this.data.wheelRadius, this.data.wheelbase / 2);
        this.frontWheel.castShadow = true;
        this.mesh.add(this.frontWheel);

        // Roda traseira
        this.rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearWheel.rotation.y = Math.PI / 2;
        this.rearWheel.position.set(0, this.data.wheelRadius, -this.data.wheelbase / 2);
        this.rearWheel.castShadow = true;
        this.mesh.add(this.rearWheel);

        // Pneus (detalhe visual)
        const tireGeometry = new THREE.TorusGeometry(
            this.data.wheelRadius,
            0.12,
            6,
            20
        );
        const tireMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.95
        });

        const frontTire = new THREE.Mesh(tireGeometry, tireMaterial);
        frontTire.rotation.y = Math.PI / 2;
        frontTire.position.copy(this.frontWheel.position);
        this.mesh.add(frontTire);

        const rearTire = new THREE.Mesh(tireGeometry, tireMaterial);
        rearTire.rotation.y = Math.PI / 2;
        rearTire.position.copy(this.rearWheel.position);
        this.mesh.add(rearTire);

        // === GARFOS DA SUSPENSÃO (Dianteiro) ===
        const forkGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
        const forkMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.forks,
            roughness: 0.2,
            metalness: 0.9
        });

        this.forkFront = new THREE.Mesh(forkGeometry, forkMaterial);
        this.forkFront.position.set(-this.data.width * 0.35, 0.4, this.data.wheelbase / 2);
        this.forkFront.castShadow = true;
        this.mesh.add(this.forkFront);

        const forkFrontRight = new THREE.Mesh(forkGeometry, forkMaterial);
        forkFrontRight.position.set(this.data.width * 0.35, 0.4, this.data.wheelbase / 2);
        forkFrontRight.castShadow = true;
        this.mesh.add(forkFrontRight);

        // === AMORTECEDOR TRASEIRO ===
        this.forkRear = new THREE.Mesh(forkGeometry, forkMaterial);
        this.forkRear.position.set(0, 0.35, -this.data.wheelbase / 2 - 0.1);
        this.forkRear.castShadow = true;
        this.mesh.add(this.forkRear);

        // === GUIDÃO ===
        const handlebarGeometry = new THREE.CylinderGeometry(0.02, 0.02, this.data.width * 0.9, 8);
        const handlebarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.7
        });
        this.handlebarMesh = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
        this.handlebarMesh.rotation.x = Math.PI / 2;
        this.handlebarMesh.position.set(0, this.data.height * 0.75, this.data.wheelbase / 2 - 0.15);
        this.handlebarMesh.castShadow = true;
        this.mesh.add(this.handlebarMesh);

        // Manetes do guidão
        const leverGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6);
        const leftLever = new THREE.Mesh(leverGeometry, handlebarMaterial);
        leftLever.rotation.z = Math.PI / 2;
        leftLever.position.set(-this.data.width * 0.35, this.data.height * 0.75, this.data.wheelbase / 2 - 0.15);
        this.mesh.add(leftLever);

        const rightLever = new THREE.Mesh(leverGeometry, handlebarMaterial);
        rightLever.rotation.z = Math.PI / 2;
        rightLever.position.set(this.data.width * 0.35, this.data.height * 0.75, this.data.wheelbase / 2 - 0.15);
        this.mesh.add(rightLever);

        // === MOTOR ===
        const engineGeometry = new THREE.BoxGeometry(
            this.data.width * 0.5,
            this.data.height * 0.25,
            this.data.length * 0.25
        );
        const engineMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.engine,
            roughness: 0.4,
            metalness: 0.85
        });
        const engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
        engineMesh.position.set(0, 0.25, 0);
        engineMesh.castShadow = true;
        this.mesh.add(engineMesh);

        // === ESCAPE ===
        const exhaustGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.5, 8);
        const exhaustMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.exhaust,
            roughness: 0.3,
            metalness: 0.9
        });
        this.exhaustMesh = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.exhaustMesh.rotation.x = Math.PI / 2;
        this.exhaustMesh.position.set(this.data.width * 0.35, 0.2, -this.data.wheelbase / 2 + 0.2);
        this.exhaustMesh.castShadow = true;
        this.mesh.add(this.exhaustMesh);

        // === FAROL DIANTEIRO ===
        const headlightGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const headlightMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.headlight,
            emissive: colors.headlight,
            emissiveIntensity: 0.5
        });
        this.headlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
        this.headlightMesh.position.set(0, this.data.height * 0.6, this.data.wheelbase / 2 + 0.05);
        this.mesh.add(this.headlightMesh);

        // Luz spot do farol
        const spotLight = new THREE.SpotLight(0xffffcc, 0.5, 15, Math.PI / 6, 0.5, 1);
        spotLight.position.set(0, this.data.height * 0.6, this.data.wheelbase / 2 + 0.05);
        spotLight.target.position.set(0, 0, this.data.wheelbase / 2 + 5);
        this.mesh.add(spotLight);
        this.mesh.add(spotLight.target);

        // === MATRÍCULA (detalhe traseiro) ===
        const plateGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.02);
        const plateMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
        plateMesh.position.set(0, 0.4, -this.data.wheelbase / 2 - 0.05);
        this.mesh.add(plateMesh);

        // Posição inicial do grupo
        this.mesh.position.set(0, 0, 0);
        
        this.scene.add(this.mesh);
    }

    /**
     * Criar sistema de física
     */
    createPhysics(startPosition) {
        this.physicsComponent = new MotorcyclePhysics(
            this.physicsWorld,
            startPosition,
            this.data
        );
    }

    /**
     * Criar sistema de controlo
     */
    createController() {
        this.controllerComponent = new MotorcycleController(this.input);
    }

    /**
     * Atualizar a mota
     * @param {number} delta - Delta time
     */
    update(delta) {
        if (!this.physicsComponent) return;

        // Processar respawn após crash
        if (this.state === 'CRASHED' || this.state === 'RESPAWNING') {
            this.updateRespawn(delta);
            return;
        }

        // Processar inputs
        const inputs = this.controllerComponent.processInputs(delta);
        
        // Verificar pedido de respawn manual
        if (this.controllerComponent.wantsRespawn()) {
            this.requestRespawn();
            return;
        }

        // Aplicar inputs à física
        this.physicsComponent.setInputs(
            inputs.throttle,
            inputs.steer,
            inputs.brake,
            inputs.handbrake
        );

        // Atualizar física
        this.physicsComponent.update(delta);

        // Atualizar estado
        this.updateState();

        // Sincronizar visual com física
        this.syncVisualWithPhysics();

        // Atualizar rotação das rodas baseado na velocidade
        this.updateWheelRotation();

        // Atualizar inclinação do guiador
        this.updateHandlebarRotation(inputs.steer);
    }

    /**
     * Atualizar estado da mota
     */
    updateState() {
        const wasAirborne = this.state === 'AIRBORNE';
        
        if (this.physicsComponent.isCrashed) {
            this.state = 'CRASHED';
            this.lastCrashTime = Date.now();
            events.emit('motorcycle.crashed', { motorcycle: this });
        } else if (this.physicsComponent.isAirborne) {
            this.state = 'AIRBORNE';
            if (wasAirborne !== this.physicsComponent.isAirborne) {
                events.emit('motorcycle.airborne', { motorcycle: this });
            }
        } else {
            this.state = 'NORMAL';
        }
    }

    /**
     * Atualizar lógica de respawn
     */
    updateRespawn(delta) {
        const now = Date.now();
        
        if (this.state === 'CRASHED') {
            // Aguardar delay antes de permitir respawn
            if (now - this.lastCrashTime >= this.data.respawnDelay) {
                this.state = 'RESPAWNING';
                this.executeRespawn();
            }
        }
    }

    /**
     * Executar respawn
     */
    executeRespawn() {
        const position = this.physicsComponent.getPosition();
        const rotation = this.physicsComponent.getRotation();
        
        // Encontrar posição segura (simples: acima do chão)
        const safePosition = new THREE.Vector3(
            position.x,
            2,
            position.z
        );
        const safeRotation = new THREE.Quaternion(0, 0, 0, 1);
        
        this.physicsComponent.respawn(safePosition, safeRotation);
        this.controllerComponent.resetSmoothState();
        
        this.state = 'NORMAL';
        events.emit('motorcycle.respawned', { motorcycle: this });
    }

    /**
     * Pedir respawn manual (tecla R)
     */
    requestRespawn() {
        if (this.state !== 'CRASHED' && this.state !== 'RESPAWNING') {
            this.lastCrashTime = Date.now();
            this.state = 'RESPAWNING';
            this.executeRespawn();
        }
    }

    /**
     * Sincronizar visual com física
     */
    syncVisualWithPhysics() {
        if (!this.physicsComponent || !this.mesh) return;

        const position = this.physicsComponent.getPosition();
        const rotation = this.physicsComponent.getRotation();

        this.mesh.position.copy(position);
        this.mesh.quaternion.copy(rotation);

        // Aplicar inclinação visual adicional
        if (this.physicsComponent.currentLean !== 0 && !this.physicsComponent.isAirborne) {
            this.mesh.rotateZ(this.physicsComponent.currentLean * 0.5);
        }
    }

    /**
     * Atualizar rotação das rodas baseado no movimento
     */
    updateWheelRotation() {
        if (!this.physicsComponent) return;

        const speed = this.physicsComponent.getForwardVelocity();
        const wheelCircumference = 2 * Math.PI * this.data.wheelRadius;
        const rotationSpeed = speed / wheelCircumference * Math.PI * 2;

        // Roda dianteira
        if (this.frontWheel) {
            this.frontWheel.rotation.x += rotationSpeed * 0.016; // Aproximadamente 60fps
        }

        // Roda traseira
        if (this.rearWheel) {
            this.rearWheel.rotation.x += rotationSpeed * 0.016;
        }
    }

    /**
     * Atualizar rotação do guiador baseado no input de direção
     */
    updateHandlebarRotation(steerInput) {
        if (!this.handlebarMesh) return;

        const maxSteerAngle = this.data.steering * 0.5;
        const targetRotation = steerInput * maxSteerAngle;

        // Suavizar rotação
        this.handlebarMesh.rotation.y = MathUtils.lerp(
            this.handlebarMesh.rotation.y,
            targetRotation,
            this.data.steeringSpeed * 0.016
        );

        // Garfos dianteiros também viram ligeiramente
        if (this.forkFront) {
            this.forkFront.rotation.y = targetRotation * 0.3;
        }
    }

    /**
     * Obter velocidade atual em m/s
     */
    getSpeed() {
        return this.physicsComponent ? this.physicsComponent.getSpeed() : 0;
    }

    /**
     * Obter posição atual
     */
    getPosition() {
        return this.physicsComponent ? this.physicsComponent.getPosition() : new THREE.Vector3();
    }

    /**
     * Obter rotação atual
     */
    getRotation() {
        return this.physicsComponent ? this.physicsComponent.getRotation() : new THREE.Quaternion();
    }

    /**
     * Obter mesh visual
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Obter estado atual
     */
    getState() {
        return this.state;
    }

    /**
     * Limpar recursos
     */
    dispose() {
        if (this.physicsComponent) {
            this.physicsComponent.destroy();
            this.physicsComponent = null;
        }

        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
            this.scene.remove(this.mesh);
            this.mesh = null;
        }

        this.controllerComponent = null;
    }
}

export default Motorcycle;
