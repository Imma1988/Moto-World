import * as THREE from 'three';
import { Constants } from '../core/Constants.js';

// Câmara em terceira pessoa que segue um alvo (mesh) mantendo distância e
// altura configuráveis, com suavização independente do framerate.
// Preparada para no futuro suportar outros modos de câmara (ex: primeira
// pessoa, câmara livre).

export class ThirdPersonCamera {
    constructor(camera, config = Constants.CAMERA) {
        this.camera = camera;
        this.config = config;

        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.hasInitialized = false;
    }

    update(target, dt) {
        if (!target) return;

        const { distance, height, lookAtHeight, smoothing } = this.config;

        const offset = new THREE.Vector3(0, height, -distance).applyQuaternion(target.quaternion);
        const desiredPosition = target.position.clone().add(offset);

        const lookAtOffset = new THREE.Vector3(0, lookAtHeight, 0);
        const desiredLookAt = target.position.clone().add(lookAtOffset);

        if (!this.hasInitialized) {
            this.currentPosition.copy(desiredPosition);
            this.currentLookAt.copy(desiredLookAt);
            this.hasInitialized = true;
        } else {
            const t = 1 - Math.exp(-smoothing * dt);
            this.currentPosition.lerp(desiredPosition, t);
            this.currentLookAt.lerp(desiredLookAt, t);
        }

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
}
