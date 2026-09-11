/**
 * Motorcycle - Representação da mota
 * Nota: Física detalhada será implementada na FASE 1
 * Esta classe prepara a arquitetura para receber MotorcyclePhysics, MotorcycleController, etc.
 */

import * as THREE from 'three';
import RAPIER from 'rapier3d-compat';

import { events } from '../core/Events.js';

export class Motorcycle {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        // Estado da mota
        this.speed = 0;
        this.maxSpeed = 50;
        this.acceleration = 10;
        this.brakeForce = 15;
        this.turnSpeed = 2;

        // Visual (grupo de meshes)
        this.mesh = null;
        this.bodyMesh = null;
        this.frontWheel = null;
        this.rearWheel = null;

        // Física
        this.body = null;
        this.colliders = [];

        // Componentes futuros (preparar arquitetura)
        // - MotorcyclePhysics (FASE 1)
        // - MotorcycleController (FASE 1)
        // - MotorcycleAudio (FASE 11)
        // - MotorcycleEffects (futuro)
        
        this.physicsComponent = null;
        this.controllerComponent = null;
        this.audioComponent = null;
    }

    /**
     * Criar a mota
     */
    create() {
        console.log('Motorcycle: Creating...');

        this.createVisual();
        this.createPhysics();

        console.log('Motorcycle: Creation complete');
        events.emit('motorcycle.created');
    }

    /**
     * Criar representação visual procedural
     */
    createVisual() {
        this.mesh = new THREE.Group();

        // Corpo principal da mota
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe74c3c,
            roughness: 0.3,
            metalness: 0.6
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.6;
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);

        // Roda dianteira
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8
        });

        this.frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontWheel.rotation.z = Math.PI / 2;
        this.frontWheel.position.set(0, 0.3, 0.9);
        this.frontWheel.castShadow = true;
        this.mesh.add(this.frontWheel);

        // Roda traseira
        this.rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearWheel.rotation.z = Math.PI / 2;
        this.rearWheel.position.set(0, 0.3, -0.9);
        this.rearWheel.castShadow = true;
        this.mesh.add(this.rearWheel);

        // Guidão
        const handlebarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
        const handlebarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.4,
            metalness: 0.8
        });
        const handlebar = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
        handlebar.rotation.x = Math.PI / 2;
        handlebar.position.set(0, 0.9, 0.5);
        handlebar.castShadow = true;
        this.mesh.add(handlebar);

        // Posição inicial
        this.mesh.position.set(0, 0.5, 0);
        
        this.scene.add(this.mesh);
    }

    /**
     * Criar corpo físico simples
     * Nota: Física completa de mota (duas rodas, suspensão) será implementada na FASE 1
     */
    createPhysics() {
        const startPos = { x: 0, y: 1, z: 0 };

        // Corpo dinâmico simples (será substituído por física de veículo na FASE 1)
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(startPos.x, startPos.y, startPos.z)
            .setLinDamping(0.3)
            .setAngDamping(0.5);

        this.body = this.physicsWorld.createRigidBody(bodyDesc);

        // Collider principal (caixa simples)
        const mainCollider = RAPIER.ColliderDesc.cuboid(0.4, 0.3, 0.75)
            .setTranslation(0, 0.6, 0);
        this.physicsWorld.createCollider(mainCollider, this.body);
        this.colliders.push(mainCollider);

        // Colliders das rodas (para colisão básica)
        const wheelColliderFront = RAPIER.ColliderDesc.cuboid(0.3, 0.3, 0.075)
            .setTranslation(0, 0.3, 0.9);
        this.physicsWorld.createCollider(wheelColliderFront, this.body);

        const wheelColliderRear = RAPIER.ColliderDesc.cuboid(0.3, 0.3, 0.075)
            .setTranslation(0, 0.3, -0.9);
        this.physicsWorld.createCollider(wheelColliderRear, this.body);
    }

    /**
     * Atualizar a mota
     * @param {number} delta - Delta time
     * @param {Input} input - Sistema de input
     */
    update(delta, input) {
        if (!this.body || !this.mesh) return;

        // Controlo básico de movimento (será substituído pela física completa na FASE 1)
        this.handleInput(input, delta);

        // Sincronizar visual com física
        this.syncVisualWithPhysics();

        // Atualizar componentes
        if (this.physicsComponent) {
            this.physicsComponent.update(delta, input);
        }
        if (this.controllerComponent) {
            this.controllerComponent.update(delta, input);
        }
    }

    /**
     * Processar input do jogador
     * @param {Input} input 
     * @param {number} delta 
     */
    handleInput(input, delta) {
        if (!this.body) return;

        // Aceleração básica (implementação temporária até FASE 1)
        if (input.isActionPressed('accelerate')) {
            // Aplicar força para frente (eixo Z negativo no Three.js)
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.mesh.quaternion);
            
            this.body.applyImpulse({
                x: forward.x * this.acceleration * delta,
                y: 0,
                z: forward.z * this.acceleration * delta
            }, true);
        }

        // Travagem
        if (input.isActionPressed('brake')) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.mesh.quaternion);
            
            this.body.applyImpulse({
                x: forward.x * -this.brakeForce * delta,
                y: 0,
                z: forward.z * -this.brakeForce * delta
            }, true);
        }

        // Direção
        if (input.isActionPressed('left')) {
            this.body.setAngvel({ x: 0, y: this.turnSpeed * delta, z: 0 }, true);
        } else if (input.isActionPressed('right')) {
            this.body.setAngvel({ x: 0, y: -this.turnSpeed * delta, z: 0 }, true);
        }

        // Travão de mão
        if (input.isActionPressed('handbrake')) {
            this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
    }

    /**
     * Sincronizar visual com física
     */
    syncVisualWithPhysics() {
        if (!this.body || !this.mesh) return;

        const position = this.body.translation();
        const rotation = this.body.rotation();

        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }

    /**
     * Sincronizar objetos físicos (chamado pelo Game após physics step)
     */
    syncPhysicsObjects() {
        this.syncVisualWithPhysics();
    }

    /**
     * Resetar/respawn a mota
     */
    reset() {
        if (!this.body) return;

        this.body.setTranslation({ x: 0, y: 1, z: 0 }, true);
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);

        this.speed = 0;

        console.log('Motorcycle: Reset');
        events.emit('motorcycle.respawned');
    }

    /**
     * Obter posição atual
     * @returns {THREE.Vector3}
     */
    getPosition() {
        if (this.body) {
            const pos = this.body.translation();
            return new THREE.Vector3(pos.x, pos.y, pos.z);
        }
        return this.mesh?.position.clone() || new THREE.Vector3();
    }

    /**
     * Obter velocidade atual
     * @returns {number}
     */
    getSpeed() {
        if (this.body) {
            const linvel = this.body.linvel();
            return Math.sqrt(linvel.x ** 2 + linvel.z ** 2);
        }
        return this.speed;
    }

    /**
     * Obter mesh visual
     * @returns {THREE.Group}
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Definir componente de física (para FASE 1)
     * @param {MotorcyclePhysics} physics 
     */
    setPhysicsComponent(physics) {
        this.physicsComponent = physics;
    }

    /**
     * Definir componente de controlo (para FASE 1)
     * @param {MotorcycleController} controller 
     */
    setControllerComponent(controller) {
        this.controllerComponent = controller;
    }

    /**
     * Limpar recursos
     */
    dispose() {
        if (this.mesh) {
            // Dispor geometrias e materiais
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    child.material?.dispose();
                }
            });
            this.scene.remove(this.mesh);
        }

        if (this.body) {
            this.physicsWorld.removeRigidBody(this.body);
        }

        this.colliders = [];
    }
}

export default Motorcycle;
