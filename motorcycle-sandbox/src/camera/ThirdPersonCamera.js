import * as THREE from 'three';
import { Constants } from '../core/Constants.js';
import { clamp, lerp, dampFactor } from '../utils/MathUtils.js';

// Câmara em terceira pessoa que segue um alvo (mesh) mantendo distância e
// altura configuráveis, com suavização independente do framerate.
//
// Segue apenas o "heading" (yaw) horizontal do alvo — nunca a inclinação
// (lean) nem o pitch — para que a câmara não role/vibre quando a mota se
// inclina em curvas ou aterra de forma irregular. A posição e o ponto de
// mira reagem à velocidade estimada do alvo (look-ahead + distância
// dinâmica), dando uma ligeira sensação de peso sem efeitos
// cinematográficos.
export class ThirdPersonCamera {
    constructor(camera, config = Constants.CAMERA) {
        this.camera = camera;
        this.config = config;

        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.hasInitialized = false;

        this.previousTargetPosition = null;
        this.smoothedSpeed = 0;
    }

    update(target, dt) {
        if (!target) return;

        const { distance, height, lookAtHeight, positionSmoothing, lookAtSmoothing } = this.config;

        const forwardHoriz = new THREE.Vector3(0, 0, 1).applyQuaternion(target.quaternion);
        forwardHoriz.y = 0;
        if (forwardHoriz.lengthSq() < 1e-6) forwardHoriz.set(0, 0, 1);
        forwardHoriz.normalize();

        const speedRatio = this.updateSpeedEstimate(target, dt);

        const dynamicDistance = distance + speedRatio * this.config.distanceSpeedBoost;
        const cameraOffset = forwardHoriz.clone().multiplyScalar(-dynamicDistance);
        cameraOffset.y = height;
        const desiredPosition = target.position.clone().add(cameraOffset);

        const lookAhead = forwardHoriz.clone().multiplyScalar(speedRatio * this.config.lookAheadDistance);
        const desiredLookAt = target.position.clone().add(lookAhead).add(new THREE.Vector3(0, lookAtHeight, 0));

        if (!this.hasInitialized) {
            this.currentPosition.copy(desiredPosition);
            this.currentLookAt.copy(desiredLookAt);
            this.hasInitialized = true;
        } else {
            this.currentPosition.lerp(desiredPosition, dampFactor(positionSmoothing, dt));
            this.currentLookAt.lerp(desiredLookAt, dampFactor(lookAtSmoothing, dt));
        }

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }

    // Estima a velocidade horizontal do alvo por diferenças de posição
    // entre frames (suavizada), e devolve um rácio 0..1 face à
    // velocidade de referência configurada.
    updateSpeedEstimate(target, dt) {
        if (!this.previousTargetPosition) {
            this.previousTargetPosition = target.position.clone();
            return 0;
        }

        const delta = target.position.clone().sub(this.previousTargetPosition);
        delta.y = 0;
        this.previousTargetPosition.copy(target.position);

        const instantSpeed = dt > 1e-5 ? delta.length() / dt : 0;
        this.smoothedSpeed = lerp(this.smoothedSpeed, instantSpeed, dampFactor(4, dt));

        return clamp(this.smoothedSpeed / this.config.speedReference, 0, 1);
    }
}
