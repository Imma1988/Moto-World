import * as THREE from 'three';
import { createBoxTerrainPiece } from './ColliderBuilder.js';
import { SurfaceType } from './SurfaceType.js';

// Três perfis de rampa (a mesma trigonometria da rampa da Fase 1,
// parametrizada). `angleDeg` é a inclinação; a subida total é
// length*sin(angle).
const RAMP_PROFILES = {
    small: { length: 5, width: 4, thickness: 0.3, angleDeg: 12 }, // salto curto, baixa velocidade
    medium: { length: 8, width: 4.5, thickness: 0.35, angleDeg: 20 }, // salto médio, testa controlo no ar
    large: { length: 14, width: 5.5, thickness: 0.4, angleDeg: 24 }, // salto longo, precisa de zona de aterragem livre
};

export class Ramps {
    constructor(scene, physicsWorld, world) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.world = world;
    }

    // Cria uma rampa do tipo indicado com o ponto de ENTRADA (a base, não
    // o centro da caixa) em (x, z), virada para `heading` radianos
    // (mesma convenção da mota: 0 = +Z).
    create(profileName, { x, z, heading = 0 }) {
        const profile = RAMP_PROFILES[profileName];
        if (!profile) {
            throw new Error(`Perfil de rampa desconhecido: ${profileName}`);
        }

        const { length, width, thickness, angleDeg } = profile;
        const angle = THREE.MathUtils.degToRad(angleDeg);

        // Mesma trigonometria da Fase 1: o centro da caixa fica elevado
        // (length/2)*sin(angle) para que a extremidade de entrada (local
        // -Z, antes da rotação) fique a y=0.
        const centerRise = (length / 2) * Math.sin(angle);
        const horizontalHalfLength = (length / 2) * Math.cos(angle);

        const forward = { x: Math.sin(heading), z: Math.cos(heading) };
        const center = {
            x: x + forward.x * horizontalHalfLength,
            y: centerRise,
            z: z + forward.z * horizontalHalfLength,
        };

        const { collider } = createBoxTerrainPiece(this.scene, this.physicsWorld, {
            size: { x: width, y: thickness, z: length },
            position: center,
            rotationX: -angle,
            rotationY: heading,
            color: 0x8a8a8a,
            friction: 1.0,
            castShadow: true,
        });

        this.world.registerSurface(collider, SurfaceType.ROAD);
    }
}
