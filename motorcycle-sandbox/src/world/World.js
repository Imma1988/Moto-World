import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Constants } from '../core/Constants.js';
import { Environment } from './Environment.js';

// Mundo básico: chão físico + alguns elementos geométricos de referência,
// suficiente para testar deslocação e escala. Não é uma cidade — isso
// pertence a uma fase futura.

export class World {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.environment = new Environment(scene);

        this.createGround();
        this.createReferenceProps();
    }

    createGround() {
        const size = Constants.WORLD.groundSize;
        const thickness = 1;

        const geometry = new THREE.BoxGeometry(size, thickness, size);
        const material = new THREE.MeshStandardMaterial({ color: 0x4a7c3a });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = -thickness / 2;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -thickness / 2, 0);
        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, thickness / 2, size / 2);
        this.physicsWorld.createCollider(colliderDesc, rigidBody);
    }

    // Alguns blocos espalhados apenas para dar noção de escala e distância
    // durante os testes de câmara/deslocação.
    createReferenceProps() {
        const positions = [
            { x: 15, y: 0, z: 10 },
            { x: -20, y: 0, z: 25 },
            { x: 30, y: 0, z: -15 },
            { x: -35, y: 0, z: -30 },
        ];

        positions.forEach((position) => this.createBlock(position));
    }

    createBlock({ x, y, z }) {
        const size = 2;

        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: 0xb0552f });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + size / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y + size / 2, z);
        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2);
        this.physicsWorld.createCollider(colliderDesc, rigidBody);
    }
}
