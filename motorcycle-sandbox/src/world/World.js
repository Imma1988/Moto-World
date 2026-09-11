import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Constants } from '../core/Constants.js';
import { Environment } from './Environment.js';

// Mundo básico: chão físico + alguns elementos geométricos de referência,
// suficiente para testar deslocação, saltos e escala. Não é uma cidade —
// isso pertence a uma fase futura.
//
// O World é também a autoridade sobre:
// - o ponto de spawn/respawn seguro (getSpawnPoint);
// - o tipo de superfície sob um determinado collider (getSurfaceAt),
//   usado pela física da mota para variar a aderência.

export const SurfaceType = {
    ROAD: 'road',
    OFFROAD: 'offroad',
};

export class World {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.surfaceByColliderHandle = new Map();

        this.environment = new Environment(scene);

        this.createGround();
        this.createOffroadPatch();
        this.createRamp();
        this.createReferenceProps();
    }

    getSpawnPoint() {
        return { ...Constants.WORLD.safeSpawn };
    }

    registerSurface(collider, surfaceType) {
        this.surfaceByColliderHandle.set(collider.handle, surfaceType);
    }

    getSurfaceAt(colliderHandle) {
        return this.surfaceByColliderHandle.get(colliderHandle) ?? SurfaceType.ROAD;
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

        const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, thickness / 2, size / 2).setFriction(1.0);
        const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

        this.registerSurface(collider, SurfaceType.ROAD);
    }

    // Zona de terra batida para testar a diferença de aderência road/offroad.
    createOffroadPatch() {
        const size = 24;
        const thickness = 0.08;
        const position = { x: -40, y: thickness / 2, z: 30 };

        const geometry = new THREE.BoxGeometry(size, thickness, size);
        const material = new THREE.MeshStandardMaterial({ color: 0x6b4a2f });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, thickness / 2, size / 2).setFriction(0.6);
        const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

        this.registerSurface(collider, SurfaceType.OFFROAD);
    }

    // Rampa simples para testar saltos.
    createRamp() {
        const length = 9;
        const width = 4;
        const thickness = 0.4;
        const angle = THREE.MathUtils.degToRad(18);
        const position = { x: 0, y: (length / 2) * Math.sin(angle), z: 16 };

        const geometry = new THREE.BoxGeometry(width, thickness, length);
        const material = new THREE.MeshStandardMaterial({ color: 0x8a8a8a });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.x = -angle;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-angle, 0, 0));

        const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(position.x, position.y, position.z)
            .setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w });
        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, thickness / 2, length / 2).setFriction(1.0);
        const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

        this.registerSurface(collider, SurfaceType.ROAD);
    }

    // Alguns blocos espalhados apenas para dar noção de escala e distância
    // durante os testes de câmara/deslocação, e para testar colisões.
    createReferenceProps() {
        const positions = [
            { x: 15, y: 0, z: -10 },
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
        const collider = this.physicsWorld.createCollider(colliderDesc, rigidBody);

        this.registerSurface(collider, SurfaceType.ROAD);
    }
}
