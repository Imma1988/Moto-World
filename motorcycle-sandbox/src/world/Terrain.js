import * as THREE from 'three';
import { createBoxTerrainPiece } from './ColliderBuilder.js';
import { SurfaceType } from './SurfaceType.js';
import { OFFROAD_ZONE, MAP_HALF_EXTENT } from './MapLayout.js';

// Terreno: um grande chão base plano (estrada aberta, zona urbana, zona
// de saltos assentam todos nele), mais um conjunto de "faixas" inclinadas
// na zona off-road que dão sensação de colinas/subidas/descidas.
//
// Nota de implementação: em vez de um heightfield contínuo do Rapier
// (cuja disposição exacta dos dados não consigo verificar sem executar o
// projecto), o relevo é feito com a mesma técnica de caixa rodada já
// validada na rampa da Fase 1 — um pequeno número de plataformas
// inclinadas, não milhares de peças.

const GROUND_HALF_SIZE = MAP_HALF_EXTENT + 60; // margem de segurança acima da área jogável

// Três faixas empilhadas ao longo de Z (rotação em torno de X), dando
// subida-crista-descida-subida ao atravessar a zona de sul para norte.
// `angleDeg` é a rotação X real aplicada à caixa (com sinal). Os valores
// de `y` (altura do centro de cada faixa) foram calculados à mão para
// que as bordas partilhadas entre faixas fiquem à mesma altura, e para
// que a extremidade sul (z=-100) fique perto de y=0 (liga ao chão base):
//   altura(z) = y - (z - centroZ) * sin(ângulo)
//   Faixa A: z=-100 -> 0.00, z=-33 -> 4.68
//   Faixa B: z=-33  -> 4.68, z=33  -> 1.22   (continua a faixa A)
//   Faixa C: z=33   -> 1.23, z=100 -> 4.15   (continua a faixa B)
const OFFROAD_BANDS = [
    { z: [-100, -33], angleDeg: -4, y: 2.34 },
    { z: [-33, 33], angleDeg: 3, y: 2.95 },
    { z: [33, 100], angleDeg: -2.5, y: 2.69 },
];

// Exportada para que Obstacles/World possam colocar objectos à altura
// correcta do terreno off-road (que não é plano).
export function estimateOffroadHeightAt(z) {
    const band = OFFROAD_BANDS.find((b) => z >= b.z[0] && z <= b.z[1]) ?? OFFROAD_BANDS[1];
    const centerZ = (band.z[0] + band.z[1]) / 2;
    const angle = THREE.MathUtils.degToRad(band.angleDeg);

    return band.y - (z - centerZ) * Math.sin(angle);
}

export class Terrain {
    constructor(scene, physicsWorld, world) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.world = world;

        this.createBaseGround();
        this.createOffroadBands();
        this.createOffroadBumps();
    }

    createBaseGround() {
        const { mesh, collider } = createBoxTerrainPiece(this.scene, this.physicsWorld, {
            size: { x: GROUND_HALF_SIZE * 2, y: 1, z: GROUND_HALF_SIZE * 2 },
            position: { x: 0, y: -0.5, z: 0 },
            color: 0x4a7c3a,
            friction: 1.0,
        });
        mesh.receiveShadow = true;

        this.world.registerSurface(collider, SurfaceType.ROAD);
    }

    createOffroadBands() {
        const width = OFFROAD_ZONE.halfWidth * 2;

        OFFROAD_BANDS.forEach(({ z, angleDeg, y }) => {
            const length = z[1] - z[0];
            const centerZ = (z[0] + z[1]) / 2;
            const angle = THREE.MathUtils.degToRad(angleDeg);

            const { collider } = createBoxTerrainPiece(this.scene, this.physicsWorld, {
                size: { x: width, y: 1, z: length },
                position: { x: OFFROAD_ZONE.centerX, y, z: centerZ },
                rotationX: angle,
                color: 0x6b4a2f,
                friction: 0.6,
                castShadow: true,
            });

            this.world.registerSurface(collider, SurfaceType.OFFROAD);
        });
    }

    // Pequenas elevações aleatórias (não rodadas) só para dar sensação de
    // irregularidade à suspensão — ficam bem dentro do curso da
    // suspensão, colocadas em cima da faixa correspondente a cada Z.
    createOffroadBumps() {
        const bumpCount = 10;

        for (let i = 0; i < bumpCount; i++) {
            const x = OFFROAD_ZONE.centerX + (Math.random() * 2 - 1) * (OFFROAD_ZONE.halfWidth - 10);
            const z = OFFROAD_ZONE.centerZ + (Math.random() * 2 - 1) * (OFFROAD_ZONE.halfDepth - 10);
            const height = 0.15 + Math.random() * 0.2;
            const footprint = 3 + Math.random() * 2;
            const baseHeight = estimateOffroadHeightAt(z);

            const { collider } = createBoxTerrainPiece(this.scene, this.physicsWorld, {
                size: { x: footprint, y: height, z: footprint },
                position: { x, y: baseHeight + height / 2, z },
                color: 0x5c4028,
                friction: 0.6,
            });

            this.world.registerSurface(collider, SurfaceType.OFFROAD);
        }
    }
}
