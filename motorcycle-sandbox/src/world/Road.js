import * as THREE from 'three';
import { createStaticBody, attachBoxCollider, createBoxMesh } from './ColliderBuilder.js';
import { SurfaceType } from './SurfaceType.js';

const ROAD_THICKNESS = 0.15;
const ROAD_COLOR = 0x3a3a3a;
const CENTERLINE_COLOR = 0xdcdc6a;
const SEGMENT_OVERLAP = 0.5; // evita pequenas frestas visuais/físicas nas juntas entre segmentos

// Uma estrada é definida por uma lista de waypoints (curva suave entre
// eles) e aproximada por uma sequência de segmentos rectos curtos — a
// mesma técnica de caixa já usada no resto do mundo, em vez de uma malha
// contínua ao longo da curva (mais simples de verificar sem executar o
// projecto). Todos os segmentos de uma estrada partilham um único rigid
// body estático, para manter o número de corpos físicos baixo mesmo com
// estradas compridas e sinuosas.
export class Road {
    constructor(scene, physicsWorld, world, { waypoints, width, segmentLength = 8, surface = SurfaceType.ROAD }) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.world = world;
        this.width = width;

        const controlPoints = waypoints.map((p) => new THREE.Vector3(p.x, 0, p.z));
        const curve = new THREE.CatmullRomCurve3(controlPoints, false);

        const segmentCount = Math.max(2, Math.round(curve.getLength() / segmentLength));
        this.points = curve.getPoints(segmentCount);

        this.body = createStaticBody(physicsWorld);
        this.buildSegments(surface);
    }

    buildSegments(surface) {
        for (let i = 0; i < this.points.length - 1; i++) {
            const a = this.points[i];
            const b = this.points[i + 1];

            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const length = Math.hypot(dx, dz);
            if (length < 1e-4) continue;

            // Mesma convenção usada na orientação da mota: heading=0 é
            // forward=(0,0,1); atan2(dx,dz) dá o heading que aponta de a
            // para b.
            const heading = Math.atan2(dx, dz);
            const position = { x: (a.x + b.x) / 2, y: ROAD_THICKNESS / 2, z: (a.z + b.z) / 2 };
            const size = { x: this.width, y: ROAD_THICKNESS, z: length + SEGMENT_OVERLAP };

            createBoxMesh(this.scene, { size, position, rotationY: heading, color: ROAD_COLOR, receiveShadow: true });

            const collider = attachBoxCollider(this.physicsWorld, this.body, { size, position, rotationY: heading }, 1.0);
            this.world.registerSurface(collider, surface);

            createBoxMesh(this.scene, {
                size: { x: 0.3, y: 0.01, z: length + SEGMENT_OVERLAP },
                position: { x: position.x, y: ROAD_THICKNESS + 0.01, z: position.z },
                rotationY: heading,
                color: CENTERLINE_COLOR,
                receiveShadow: false,
            });
        }
    }
}
