/**
 * Player - Representação do jogador no mundo
 * Nota: Nesta fase é uma representação simples, preparada para expansão futura
 */

import * as THREE from 'three';
import RAPIER from 'rapier3d-compat';

import { events } from '../core/Events.js';

export class Player {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        // Estado do jogador
        this.currentMotorcycle = null;
        this.isOnMotorcycle = false;
        this.position = new THREE.Vector3(0, 1, 0);
        this.rotation = 0;

        // Visual (representação simples)
        this.mesh = null;

        // Física
        this.body = null;
        this.collider = null;
    }

    /**
     * Criar o jogador
     */
    create() {
        console.log('Player: Creating...');

        this.createVisual();
        this.createPhysics();

        console.log('Player: Creation complete');
        events.emit('player.created');
    }

    /**
     * Criar representação visual simples
     */
    createVisual() {
        // Representação visual muito simples - será expandida na FASE 3
        const geometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff6347,
            roughness: 0.7
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        this.scene.add(this.mesh);
    }

    /**
     * Criar corpo físico
     */
    createPhysics() {
        const startPos = { x: this.position.x, y: this.position.y, z: this.position.z };

        // Corpo dinâmico
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(startPos.x, startPos.y, startPos.z)
            .setLinDamping(0.5)
            .setAngDamping(0.5);

        this.body = this.physicsWorld.createRigidBody(bodyDesc);

        // Collider capsule
        const colliderDesc = RAPIER.ColliderDesc.capsule(0.4, 0.3);
        this.collider = this.physicsWorld.createCollider(colliderDesc, this.body);
    }

    /**
     * Atualizar o jogador
     * @param {number} delta - Delta time
     * @param {Input} input - Sistema de input
     */
    update(delta, input) {
        if (!this.body) return;

        // Quando estiver na mota, o player segue a mota
        if (this.isOnMotorcycle && this.currentMotorcycle) {
            this.syncToMotorcycle();
            return;
        }

        // Movimento básico quando estiver a pé (será expandido na FASE 3)
        // Por enquanto, apenas sincroniza visual com física
        this.syncVisualWithPhysics();
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
     * Sincronizar player com a mota
     */
    syncToMotorcycle() {
        if (!this.currentMotorcycle) return;

        const motoMesh = this.currentMotorcycle.getMesh();
        if (!motoMesh) return;

        // Posicionar o player na mota
        this.mesh.position.copy(motoMesh.position);
        this.mesh.quaternion.copy(motoMesh.quaternion);
    }

    /**
     * Sincronizar objeto físico (chamado pelo Game após physics step)
     */
    syncPhysicsObject() {
        this.syncVisualWithPhysics();
    }

    /**
     * Entrar numa mota
     * @param {Motorcycle} motorcycle 
     */
    enterMotorcycle(motorcycle) {
        if (this.isOnMotorcycle) return;

        this.currentMotorcycle = motorcycle;
        this.isOnMotorcycle = true;

        // Esconder visual do player quando está na mota
        if (this.mesh) {
            this.mesh.visible = false;
        }

        console.log('Player: Entered motorcycle');
        events.emit('player.enteredMotorcycle', { motorcycle });
    }

    /**
     * Sair da mota atual
     */
    leaveMotorcycle() {
        if (!this.isOnMotorcycle || !this.currentMotorcycle) return;

        const motorcycle = this.currentMotorcycle;

        // Posicionar player ao lado da mota
        const motoPosition = motorcycle.getPosition();
        this.body.setTranslation({
            x: motoPosition.x + 1,
            y: 1,
            z: motoPosition.z
        }, true);

        // Mostrar visual do player
        if (this.mesh) {
            this.mesh.visible = true;
        }

        this.currentMotorcycle = null;
        this.isOnMotorcycle = false;

        console.log('Player: Left motorcycle');
        events.emit('player.leftMotorcycle', { motorcycle });
    }

    /**
     * Resetar/respawn o jogador
     */
    reset() {
        if (!this.body) return;

        this.body.setTranslation({ x: 0, y: 1, z: 0 }, true);
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        this.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);

        this.position.set(0, 1, 0);
        this.rotation = 0;

        console.log('Player: Reset');
        events.emit('player.respawned');
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
        return this.position.clone();
    }

    /**
     * Obter mesh visual
     * @returns {THREE.Mesh}
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Limpar recursos
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry?.dispose();
            this.mesh.material?.dispose();
            this.scene.remove(this.mesh);
        }

        if (this.body) {
            this.physicsWorld.removeRigidBody(this.body);
        }
    }
}

export default Player;
