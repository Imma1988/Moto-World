import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { createStaticBody, attachBoxCollider, createBoxMesh } from './ColliderBuilder.js';
import { SurfaceType } from './SurfaceType.js';

// Obstáculos simples (caixas, barreiras, pneus, pedras, troncos),
// geometria procedural reutilizada (mesma BoxGeometry/CylinderGeometry
// para todas as instâncias de cada tipo). Cada cluster de obstáculos
// partilha um único rigid body estático.
export class Obstacles {
    constructor(scene, physicsWorld, world) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.world = world;
    }

    // items: array de { type: 'crate'|'barrier'|'tire'|'rock'|'log', x, z, heading?, scale? }
    createCluster(items) {
        const body = createStaticBody(this.physicsWorld);

        items.forEach((item) => {
            switch (item.type) {
                case 'crate':
                    this.addCrate(body, item);
                    break;
                case 'barrier':
                    this.addBarrier(body, item);
                    break;
                case 'tire':
                    this.addTire(body, item);
                    break;
                case 'rock':
                    this.addRock(body, item);
                    break;
                case 'log':
                    this.addLog(body, item);
                    break;
                default:
                    throw new Error(`Tipo de obstáculo desconhecido: ${item.type}`);
            }
        });
    }

    addCrate(body, { x, z, heading = 0, scale = 1, groundY = 0 }) {
        const size = { x: 1.1 * scale, y: 1.1 * scale, z: 1.1 * scale };
        const position = { x, y: groundY + size.y / 2, z };

        createBoxMesh(this.scene, { size, position, rotationY: heading, color: 0xc9a15a, castShadow: true });
        const collider = attachBoxCollider(this.physicsWorld, body, { size, position, rotationY: heading }, 0.7);
        this.world.registerSurface(collider, SurfaceType.ROAD);
    }

    addBarrier(body, { x, z, heading = 0, length = 4, groundY = 0 }) {
        const size = { x: length, y: 0.9, z: 0.25 };
        const position = { x, y: groundY + size.y / 2, z };

        createBoxMesh(this.scene, { size, position, rotationY: heading, color: 0xd94a3a, castShadow: true });
        const collider = attachBoxCollider(this.physicsWorld, body, { size, position, rotationY: heading }, 0.8);
        this.world.registerSurface(collider, SurfaceType.ROAD);
    }

    // Pneu: visualmente um toróide; fisicamente aproximado por um
    // cilindro curto (Rapier não tem uma primitiva de toróide, e um
    // hull convexo seria mais arriscado de validar sem executar).
    addTire(body, { x, z, groundY = 0 }) {
        const radius = 0.45;
        const height = 0.5;

        const geometry = new THREE.TorusGeometry(radius, 0.18, 10, 20);
        const material = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, groundY + radius, z);
        // TorusGeometry por omissão tem o eixo do buraco em Z; rodar para
        // ficar deitado (eixo em Y), a condizer com o collider cilíndrico.
        mesh.rotation.x = Math.PI / 2;
        mesh.castShadow = true;
        this.scene.add(mesh);

        const colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius)
            .setTranslation(x, groundY + height / 2, z)
            .setFriction(0.7);
        const collider = this.physicsWorld.createCollider(colliderDesc, body);
        this.world.registerSurface(collider, SurfaceType.ROAD);
    }

    addRock(body, { x, z, scale = 1, groundY = 0 }) {
        const radius = 0.6 * scale;

        const geometry = new THREE.IcosahedronGeometry(radius, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, flatShading: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, groundY + radius * 0.7, z);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const colliderDesc = RAPIER.ColliderDesc.ball(radius * 0.8)
            .setTranslation(x, groundY + radius * 0.7, z)
            .setFriction(0.9);
        const collider = this.physicsWorld.createCollider(colliderDesc, body);
        this.world.registerSurface(collider, SurfaceType.OFFROAD);
    }

    // Tronco deitado: cilindro rodado 90° para ficar na horizontal,
    // orientável por heading em torno do eixo vertical.
    addLog(body, { x, z, heading = 0, length = 4, groundY = 0 }) {
        const radius = 0.35;

        const geometry = new THREE.CylinderGeometry(radius, radius, length, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0x5b3a21 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, groundY + radius, z);

        const lieDown = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
        const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
        mesh.quaternion.copy(yaw.multiply(lieDown));
        mesh.castShadow = true;
        this.scene.add(mesh);

        const colliderDesc = RAPIER.ColliderDesc.cylinder(length / 2, radius)
            .setTranslation(x, groundY + radius, z)
            .setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w })
            .setFriction(0.8);
        const collider = this.physicsWorld.createCollider(colliderDesc, body);
        this.world.registerSurface(collider, SurfaceType.OFFROAD);
    }
}
