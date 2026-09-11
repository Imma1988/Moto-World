/**
 * ThirdPersonCamera - Câmara em terceira pessoa que segue um alvo
 */

import * as THREE from 'three';
import { Constants } from '../core/Constants.js';

export class ThirdPersonCamera {
    /**
     * @param {THREE.PerspectiveCamera} camera - Câmera do Three.js
     * @param {THREE.Object3D} target - Alvo a seguir
     * @param {number} distance - Distância do alvo
     * @param {number} height - Altura acima do alvo
     * @param {number} smoothing - Fator de suavização (0-1)
     */
    constructor(camera, target, distance = 5, height = 2, smoothing = 0.1) {
        this.camera = camera;
        this.target = target;
        
        // Configurações
        this.distance = distance;
        this.height = height;
        this.smoothing = smoothing;
        
        // Posição desejada da câmera
        this.desiredPosition = new THREE.Vector3();
        
        // Posição atual (para interpolação)
        this.currentPosition = new THREE.Vector3();
        
        // Offset vertical adicional (para ajustes)
        this.verticalOffset = 0;
        
        // Rotação horizontal (yaw) - para futura rotação manual
        this.yaw = 0;
        
        // Rotação vertical (pitch) - limitada
        this.pitch = Math.PI / 6; // 30 graus
        this.minPitch = 0;
        this.maxPitch = Math.PI / 3; // 60 graus
        
        // Colisão com objetos (raycasting futuro)
        this.checkCollisions = false;
        this.collisionLayers = [];
        
        // Ideal offset atrás e acima do alvo
        this.offset = new THREE.Vector3(0, this.height, this.distance);
    }

    /**
     * Atualizar a posição da câmera
     * @param {number} delta - Delta time
     */
    update(delta) {
        if (!this.target) return;

        // Calcular posição desejada baseada no alvo
        this.calculateDesiredPosition();

        // Suavizar movimento da câmera
        this.smoothPosition(delta);

        // Aplicar posição à câmera
        this.camera.position.copy(this.currentPosition);

        // Olhar para o alvo
        this.camera.lookAt(this.target.position);
    }

    /**
     * Calcular posição desejada da câmera
     */
    calculateDesiredPosition() {
        if (!this.target) return;

        // Obter posição do alvo
        const targetPos = this.target.position;
        const targetQuat = this.target.quaternion;

        // Calcular offset baseado na rotação do alvo
        const idealOffset = this.offset.clone();
        idealOffset.applyQuaternion(targetQuat);

        // Posição ideal
        this.desiredPosition.copy(targetPos).add(idealOffset);

        // Verificar colisões (opcional, será expandido no futuro)
        if (this.checkCollisions) {
            this.adjustForCollisions(targetPos);
        }
    }

    /**
     * Suavizar movimento da câmera
     * @param {number} delta 
     */
    smoothPosition(delta) {
        // Interpolação linear suave (lerp)
        const t = Math.min(this.smoothing * delta * 60, 1);
        this.currentPosition.lerp(this.desiredPosition, t);
    }

    /**
     * Ajustar posição para evitar colisões (placeholder para expansão futura)
     * @param {THREE.Vector3} targetPos 
     */
    adjustForCollisions(targetPos) {
        // Será implementado raycasting no futuro para evitar que a câmera atravesse objetos
        // Por enquanto, apenas mantém a posição desejada
    }

    /**
     * Definir novo alvo
     * @param {THREE.Object3D} target 
     */
    setTarget(target) {
        this.target = target;
    }

    /**
     * Definir distância do alvo
     * @param {number} distance 
     */
    setDistance(distance) {
        this.distance = Math.max(1, distance);
        this.offset.z = this.distance;
    }

    /**
     * Definir altura da câmera
     * @param {number} height 
     */
    setHeight(height) {
        this.height = Math.max(0.5, height);
        this.offset.y = this.height;
    }

    /**
     * Definir fator de suavização
     * @param {number} smoothing - Valor entre 0 e 1
     */
    setSmoothing(smoothing) {
        this.smoothing = Math.max(0, Math.min(1, smoothing));
    }

    /**
     * Adicionar offset vertical
     * @param {number} offset 
     */
    addVerticalOffset(offset) {
        this.verticalOffset += offset;
        this.offset.y = this.height + this.verticalOffset;
    }

    /**
     * Resetar offset vertical
     */
    resetVerticalOffset() {
        this.verticalOffset = 0;
        this.offset.y = this.height;
    }

    /**
     * Rotacionar câmera horizontalmente (para controle manual futuro)
     * @param {number} deltaYaw 
     */
    rotateYaw(deltaYaw) {
        this.yaw += deltaYaw;
    }

    /**
     * Rotacionar câmera verticalmente (para controle manual futuro)
     * @param {number} deltaPitch 
     */
    rotatePitch(deltaPitch) {
        this.pitch += deltaPitch;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    }

    /**
     * Ativar/desativar verificação de colisões
     * @param {boolean} enabled 
     */
    setCollisionCheck(enabled) {
        this.checkCollisions = enabled;
    }

    /**
     * Obter posição atual da câmera
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.camera.position.clone();
    }

    /**
     * Obter direção da câmera
     * @returns {THREE.Vector3}
     */
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    /**
     * Reposicionar instantaneamente (sem suavização)
     */
    reposition() {
        if (!this.target) return;

        this.calculateDesiredPosition();
        this.currentPosition.copy(this.desiredPosition);
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.target.position);
    }
}

export default ThirdPersonCamera;
