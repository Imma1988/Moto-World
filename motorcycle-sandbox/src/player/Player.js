import * as THREE from 'three';

// Entidade do jogador. Nesta fase é uma representação visual simples
// (sem animações): tronco, capacete, braços e pernas. Guarda o estado
// "a pé / na mota" e a referência à mota actual, para que a FASE 3
// (entrar/sair da mota) possa ser construída sobre esta base.
//
// IMPORTANTE: o capacete está sempre presente, montado ou a pé.

export const PlayerState = {
    ON_FOOT: 'onFoot',
    ON_MOTORCYCLE: 'onMotorcycle',
};

const SEAT_LOCAL_POSITION = new THREE.Vector3(0, 0.78, -0.35);

export class Player {
    constructor(scene) {
        this.scene = scene;

        this.state = PlayerState.ON_FOOT;
        this.currentMotorcycle = null;

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
    }

    createMesh() {
        const group = new THREE.Group();

        const suitMaterial = new THREE.MeshStandardMaterial({ color: 0x2255cc });
        const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xe0a978 });
        const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 8), suitMaterial);
        torso.position.y = 0.55;
        torso.castShadow = true;
        group.add(torso);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skinMaterial);
        head.position.y = 0.95;
        group.add(head);

        // O capacete está sempre presente, independentemente do estado.
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), helmetMaterial);
        helmet.position.y = 0.97;
        helmet.castShadow = true;
        group.add(helmet);

        const armGeometry = new THREE.CapsuleGeometry(0.055, 0.4, 4, 6);
        const leftArm = new THREE.Mesh(armGeometry, suitMaterial);
        leftArm.position.set(0.22, 0.6, 0.1);
        leftArm.rotation.x = -Math.PI / 4;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, suitMaterial);
        rightArm.position.set(-0.22, 0.6, 0.1);
        rightArm.rotation.x = -Math.PI / 4;
        group.add(rightArm);

        const legGeometry = new THREE.CapsuleGeometry(0.07, 0.45, 4, 6);
        const leftLeg = new THREE.Mesh(legGeometry, suitMaterial);
        leftLeg.position.set(0.12, 0.15, -0.05);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, suitMaterial);
        rightLeg.position.set(-0.12, 0.15, -0.05);
        group.add(rightLeg);

        return group;
    }

    enterMotorcycle(motorcycle) {
        this.currentMotorcycle = motorcycle;
        this.state = PlayerState.ON_MOTORCYCLE;

        this.mesh.position.copy(SEAT_LOCAL_POSITION);
        this.mesh.rotation.set(0, 0, 0);
        motorcycle.getMesh().add(this.mesh);
    }

    leaveMotorcycle() {
        if (!this.currentMotorcycle) return;

        const motorcycleMesh = this.currentMotorcycle.getMesh();
        const worldPosition = new THREE.Vector3();
        this.mesh.getWorldPosition(worldPosition);

        motorcycleMesh.remove(this.mesh);
        this.scene.add(this.mesh);
        this.mesh.position.copy(worldPosition);

        this.currentMotorcycle = null;
        this.state = PlayerState.ON_FOOT;
    }

    isOnMotorcycle() {
        return this.state === PlayerState.ON_MOTORCYCLE;
    }

    getMesh() {
        return this.mesh;
    }
}
