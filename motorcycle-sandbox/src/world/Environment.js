/**
 * Environment - Gestão do ambiente (céu, luz, atmosfera)
 * Nota: Funcionalidade básica incluída em World.js e Game.js
 * Esta classe pode ser expandida posteriormente para ciclos dia/noite, clima, etc.
 */

import * as THREE from 'three';
import { events } from '../core/Events.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        
        this.skyColor = new THREE.Color(0x87ceeb);
        this.fogNear = 50;
        this.fogFar = 200;
        
        this.ambientLight = null;
        this.directionalLight = null;
    }

    /**
     * Criar ambiente básico
     */
    create() {
        this.setupSky();
        this.setupFog();
        
        console.log('Environment: Created');
        events.emit('environment.created');
    }

    /**
     * Configurar céu
     */
    setupSky() {
        this.scene.background = this.skyColor;
    }

    /**
     * Configurar neblina
     */
    setupFog() {
        this.scene.fog = new THREE.Fog(this.skyColor, this.fogNear, this.fogFar);
    }

    /**
     * Alterar cor do céu
     * @param {number} color - Cor em hexadecimal
     */
    setSkyColor(color) {
        this.skyColor.setHex(color);
        this.scene.background = this.skyColor;
        
        if (this.scene.fog) {
            this.scene.fog.color = this.skyColor;
        }
    }

    /**
     * Alterar densidade da neblina
     * @param {number} near 
     * @param {number} far 
     */
    setFog(near, far) {
        this.fogNear = near;
        this.fogFar = far;
        this.scene.fog.near = near;
        this.scene.fog.far = far;
    }

    /**
     * Remover neblina
     */
    removeFog() {
        this.scene.fog = null;
    }

    /**
     * Obter cor atual do céu
     * @returns {THREE.Color}
     */
    getSkyColor() {
        return this.skyColor.clone();
    }
}

export default Environment;
