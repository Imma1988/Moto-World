import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

// Representação mínima da mota para a fase de fundação: geometria
// procedural simples + um rigid body básico, apenas para confirmar a
// integração entre Rapier e Three.js.
//
// A condução arcade completa (suspensão, rodas, aderência, derrapagem,
// equilíbrio, etc.) será construída na FASE 1 através de módulos
// dedicados (MotorcyclePhysics, MotorcycleController, MotorcycleData)
// que se vão ligar a esta classe sem a reestruturar.

export class Motorcycle {
    constructor(scene, physicsWorld, spawnPosition) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);

        this.rigidBody = this.createRigidBody(spawnPosition);
    }

    createMesh() {
        const group = new THREE.Group();

        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.7, 1.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd6392b });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 0.35, 0.8);
        frontWheel.castShadow = true;
        group.add(frontWheel);

        const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearWheel.rotation.z = Math.PI / 2;
        rearWheel.position.set(0, 0.35, -0.8);
        rearWheel.castShadow = true;
        group.add(rearWheel);

        return group;
    }

    createRigidBody(spawnPosition) {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(spawnPosition.x, spawnPosition.y, spawnPosition.z)
            .lockRotations();

        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

        // O collider é deslocado para cima em relação à origem do rigid
        // body, para que a origem (usada para posicionar a malha visual)
        // coincida com o ponto de contacto das rodas no chão.
        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.4, 0.5, 1.0)
            .setTranslation(0, 0.5, 0)
            .setMass(180)
            .setFriction(1.0);
        this.physicsWorld.createCollider(colliderDesc, rigidBody);

        return rigidBody;
    }

    // Copia a transformação do corpo físico para a malha visual. Chamado
    // pelo Game a cada passo de física.
    syncPhysicsToVisual() {
        const translation = this.rigidBody.translation();
        const rotation = this.rigidBody.rotation();

        this.mesh.position.set(translation.x, translation.y, translation.z);
        this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.mesh.position;
    }
}
