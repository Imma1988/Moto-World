import * as THREE from 'three';
import { Constants } from '../core/Constants.js';

// Responsável pelo aspecto atmosférico da cena: cor de fundo, névoa e
// iluminação. Não contém geometria de jogo (isso é responsabilidade do
// World).

export class Environment {
    constructor(scene) {
        this.scene = scene;

        this.setupSky();
        this.setupLights();
    }

    setupSky() {
        const { skyColor, fogNear, fogFar } = Constants.WORLD;

        this.scene.background = new THREE.Color(skyColor);
        this.scene.fog = new THREE.Fog(skyColor, fogNear, fogFar);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(60, 100, 40);
        sunLight.castShadow = Constants.RENDER.shadows;

        if (Constants.RENDER.shadows) {
            sunLight.shadow.mapSize.set(2048, 2048);
            sunLight.shadow.camera.near = 1;
            sunLight.shadow.camera.far = 300;
            sunLight.shadow.camera.left = -100;
            sunLight.shadow.camera.right = 100;
            sunLight.shadow.camera.top = 100;
            sunLight.shadow.camera.bottom = -100;
        }

        this.scene.add(sunLight);
    }
}
