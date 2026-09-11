import * as THREE from 'three';

// Entidade do jogador. Nesta fase é apenas uma representação visual
// simples (sem animações), mas já guarda o estado "a pé / na mota" e a
// referência à mota actual, para que a FASE 3 (entrar/sair da mota)
// possa ser construída sobre esta base.

export const PlayerState = {
    ON_FOOT: 'onFoot',
    ON_MOTORCYCLE: 'onMotorcycle',
};

export class Player {
    constructor(scene) {
        this.scene = scene;

        this.state = PlayerState.ON_FOOT;
        this.currentMotorcycle = null;

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
    }

    createMesh() {
        const geometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x2255cc });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        return mesh;
    }

    enterMotorcycle(motorcycle) {
        this.currentMotorcycle = motorcycle;
        this.state = PlayerState.ON_MOTORCYCLE;
        this.mesh.visible = false;
    }

    leaveMotorcycle() {
        this.currentMotorcycle = null;
        this.state = PlayerState.ON_FOOT;
        this.mesh.visible = true;
    }

    isOnMotorcycle() {
        return this.state === PlayerState.ON_MOTORCYCLE;
    }

    getMesh() {
        return this.mesh;
    }
}
