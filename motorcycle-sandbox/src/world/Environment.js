import * as THREE from 'three';
import { Constants } from '../core/Constants.js';
import { createStaticBody, attachBoxCollider, createBoxMesh } from './ColliderBuilder.js';
import { SurfaceType } from './SurfaceType.js';
import { MAP_HALF_EXTENT, URBAN_ZONE, OFFROAD_ZONE, JUMP_ZONE, ALL_ROAD_WAYPOINTS } from './MapLayout.js';

const ROAD_DECORATION_MARGIN = 12; // afasta árvores/rochas decorativas das estradas

// Responsável pelo aspecto atmosférico da cena (céu, névoa, iluminação)
// e pela decoração procedural do mundo: vegetação/rochas instanciadas
// (só visuais) e os edifícios simples da zona urbana (com colisão).
// Continua sem geometria "de jogo" central — isso é o Terrain/Road.
export class Environment {
    constructor(scene, physicsWorld, world) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.world = world;

        this.setupSky();
        this.setupLights();
        this.createVegetation();
        this.createUrbanBuildings();
        this.createLampPosts();
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

    // Verdadeiro se (x,z) estiver perto de algum waypoint de estrada —
    // usado só para afastar decoração, não precisa de ser exacto porque
    // estes elementos não têm collider.
    isNearRoad(x, z, margin = ROAD_DECORATION_MARGIN) {
        return ALL_ROAD_WAYPOINTS.some((p) => Math.hypot(p.x - x, p.z - z) < margin);
    }

    isInsideZoneFootprint(x, z, zone, margin = 15) {
        return (
            Math.abs(x - zone.centerX) < zone.halfWidth + margin && Math.abs(z - zone.centerZ) < zone.halfDepth + margin
        );
    }

    // Nota: a zona off-road (Terrain.js) tem terreno inclinado que não
    // está a y=0, por isso é sempre excluída aqui — os elementos
    // decorativos abaixo assumem chão plano.
    isFreeForDecoration(x, z) {
        if (this.isNearRoad(x, z)) return false;
        if (this.isInsideZoneFootprint(x, z, URBAN_ZONE)) return false;
        if (this.isInsideZoneFootprint(x, z, JUMP_ZONE)) return false;
        if (this.isInsideZoneFootprint(x, z, OFFROAD_ZONE, 0)) return false;
        return true;
    }

    // Árvores e rochas decorativas, instanciadas (poucas draw calls
    // mesmo com muitas cópias). Sem collider — são só cenário de fundo.
    createVegetation() {
        this.scatterTrees(140);
        this.scatterDecorativeRocks(50);
    }

    scatterTrees(count) {
        const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.22, 1.6, 6);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4a2f });
        const foliageGeometry = new THREE.ConeGeometry(1.4, 3.2, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6b3a });

        const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
        const foliage = new THREE.InstancedMesh(foliageGeometry, foliageMaterial, count);
        trunks.castShadow = true;
        foliage.castShadow = true;

        const dummy = new THREE.Object3D();
        let placed = 0;
        let attempts = 0;

        while (placed < count && attempts < count * 20) {
            attempts++;

            const x = (Math.random() * 2 - 1) * MAP_HALF_EXTENT;
            const z = (Math.random() * 2 - 1) * MAP_HALF_EXTENT;
            if (!this.isFreeForDecoration(x, z)) continue;

            const scale = 0.8 + Math.random() * 0.6;

            dummy.position.set(x, 0.8 * scale, z);
            dummy.scale.setScalar(scale);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.updateMatrix();
            trunks.setMatrixAt(placed, dummy.matrix);

            // Base do cone (metade da sua altura) assente no topo do
            // tronco (metade da altura do tronco).
            dummy.position.set(x, (1.6 + 1.6) * scale, z);
            dummy.updateMatrix();
            foliage.setMatrixAt(placed, dummy.matrix);

            placed++;
        }

        trunks.count = placed;
        foliage.count = placed;
        trunks.instanceMatrix.needsUpdate = true;
        foliage.instanceMatrix.needsUpdate = true;

        this.scene.add(trunks, foliage);
    }

    scatterDecorativeRocks(count) {
        const geometry = new THREE.IcosahedronGeometry(0.5, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, flatShading: true });
        const rocks = new THREE.InstancedMesh(geometry, material, count);
        rocks.castShadow = true;

        const dummy = new THREE.Object3D();
        let placed = 0;
        let attempts = 0;

        while (placed < count && attempts < count * 20) {
            attempts++;

            const x = (Math.random() * 2 - 1) * MAP_HALF_EXTENT;
            const z = (Math.random() * 2 - 1) * MAP_HALF_EXTENT;
            if (!this.isFreeForDecoration(x, z)) continue;

            const scale = 0.5 + Math.random() * 1.2;
            dummy.position.set(x, 0.3 * scale, z);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            rocks.setMatrixAt(placed, dummy.matrix);
            placed++;
        }

        rocks.count = placed;
        rocks.instanceMatrix.needsUpdate = true;
        this.scene.add(rocks);
    }

    // Alguns blocos simples em torno do cruzamento da zona urbana.
    createUrbanBuildings() {
        const body = createStaticBody(this.physicsWorld);

        const offsets = [
            { dx: -35, dz: -25 },
            { dx: -35, dz: 25 },
            { dx: 35, dz: -25 },
            { dx: 35, dz: 25 },
            { dx: -55, dz: 22 },
            { dx: 55, dz: -22 },
        ];

        offsets.forEach(({ dx, dz }, index) => {
            const width = 10 + Math.random() * 6;
            const depth = 10 + Math.random() * 6;
            const height = 6 + Math.random() * 10;

            const size = { x: width, y: height, z: depth };
            const position = { x: URBAN_ZONE.centerX + dx, y: height / 2, z: URBAN_ZONE.centerZ + dz };
            const color = index % 2 === 0 ? 0x9aa0a6 : 0xb3937a;

            createBoxMesh(this.scene, { size, position, color, castShadow: true });
            const collider = attachBoxCollider(this.physicsWorld, body, { size, position }, 0.9);
            this.world.registerSurface(collider, SurfaceType.ROAD);
        });
    }

    // Alguns postes de iluminação ao longo do cruzamento — só decorativos.
    createLampPosts() {
        const poleGeometry = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const lampGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0x554417 });

        const positions = [
            { x: URBAN_ZONE.centerX - 12, z: URBAN_ZONE.centerZ - 12 },
            { x: URBAN_ZONE.centerX + 12, z: URBAN_ZONE.centerZ - 12 },
            { x: URBAN_ZONE.centerX - 12, z: URBAN_ZONE.centerZ + 12 },
            { x: URBAN_ZONE.centerX + 12, z: URBAN_ZONE.centerZ + 12 },
        ];

        positions.forEach(({ x, z }) => {
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(x, 2.25, z);
            pole.castShadow = true;
            this.scene.add(pole);

            const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
            lamp.position.set(x, 4.5, z);
            this.scene.add(lamp);
        });
    }
}
