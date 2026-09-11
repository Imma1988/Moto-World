/**
 * World - Gestão do mundo do jogo
 */

import * as THREE from 'three';
import RAPIER from 'rapier3d-compat';

import { Constants } from '../core/Constants.js';
import { events } from '../core/Events.js';

export class World {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        // Objetos do mundo
        this.objects = [];
        this.physicsObjects = [];
        
        // Elementos
        this.ground = null;
        this.groundBody = null;
        this.obstacles = [];
    }

    /**
     * Criar o mundo
     */
    create() {
        console.log('World: Creating...');

        this.createGround();
        this.createObstacles();

        console.log('World: Creation complete');
        events.emit('world.created');
    }

    /**
     * Criar o chão
     */
    createGround() {
        const size = Constants.World.GROUND_SIZE;

        // Visual
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x3a5f0b,
            roughness: 0.8,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Grid helper para referência visual
        const gridHelper = new THREE.GridHelper(size, 20, 0x000000, 0x000000);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // Física
        const groundDesc = RAPIER.RigidBodyDesc.fixed();
        this.groundBody = this.physicsWorld.createRigidBody(groundDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, 0.1, size / 2);
        this.physicsWorld.createCollider(colliderDesc, this.groundBody);
    }

    /**
     * Criar obstáculos procedurais
     */
    createObstacles() {
        const count = Constants.World.OBSTACLE_COUNT;
        const size = Constants.World.GROUND_SIZE / 2 - 10;

        for (let i = 0; i < count; i++) {
            // Posição aleatória
            const x = (Math.random() - 0.5) * 2 * size;
            const z = (Math.random() - 0.5) * 2 * size;

            // Evitar centro (área de spawn)
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

            // Tipo aleatório de obstáculo
            const type = Math.floor(Math.random() * 3);
            
            let mesh, colliderDesc;

            switch (type) {
                case 0: // Caixa
                    {
                        const width = 1 + Math.random() * 2;
                        const height = 1 + Math.random() * 3;
                        const depth = 1 + Math.random() * 2;

                        const geometry = new THREE.BoxGeometry(width, height, depth);
                        const material = new THREE.MeshStandardMaterial({ 
                            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
                            roughness: 0.7
                        });
                        mesh = new THREE.Mesh(geometry, material);
                        mesh.position.set(x, height / 2, z);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2);
                    }
                    break;

                case 1: // Cilindro
                    {
                        const radius = 0.5 + Math.random() * 1;
                        const height = 1 + Math.random() * 4;

                        const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
                        const material = new THREE.MeshStandardMaterial({ 
                            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
                            roughness: 0.7
                        });
                        mesh = new THREE.Mesh(geometry, material);
                        mesh.position.set(x, height / 2, z);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius);
                    }
                    break;

                case 2: // Esfera
                    {
                        const radius = 0.5 + Math.random() * 1.5;

                        const geometry = new THREE.SphereGeometry(radius, 16, 16);
                        const material = new THREE.MeshStandardMaterial({ 
                            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
                            roughness: 0.5
                        });
                        mesh = new THREE.Mesh(geometry, material);
                        mesh.position.set(x, radius, z);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        colliderDesc = RAPIER.ColliderDesc.ball(radius);
                    }
                    break;
            }

            if (mesh && colliderDesc) {
                this.scene.add(mesh);

                // Corpo físico dinâmico para alguns obstáculos
                const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(x, mesh.position.y, z);
                const body = this.physicsWorld.createRigidBody(bodyDesc);
                
                const collider = this.physicsWorld.createCollider(colliderDesc, body);

                // Guardar referência para sincronização
                this.physicsObjects.push({
                    mesh: mesh,
                    body: body,
                    collider: collider
                });

                this.obstacles.push(mesh);
            }
        }

        console.log(`World: Created ${this.obstacles.length} obstacles`);
    }

    /**
     * Sincronizar objetos físicos com visuais
     */
    syncPhysicsObjects() {
        for (const obj of this.physicsObjects) {
            const position = obj.body.translation();
            const rotation = obj.body.rotation();

            obj.mesh.position.set(position.x, position.y, position.z);
            obj.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    /**
     * Obter todos os objetos do mundo
     * @returns {THREE.Object3D[]}
     */
    getObjects() {
        return [...this.obstacles, this.ground];
    }

    /**
     * Limpar o mundo
     */
    dispose() {
        // Remover meshes da cena
        for (const obj of this.obstacles) {
            obj.geometry?.dispose();
            obj.material?.dispose();
            this.scene.remove(obj);
        }

        if (this.ground) {
            this.ground.geometry?.dispose();
            this.ground.material?.dispose();
            this.scene.remove(this.ground);
        }

        this.objects = [];
        this.physicsObjects = [];
        this.obstacles = [];
    }
}

export default World;
