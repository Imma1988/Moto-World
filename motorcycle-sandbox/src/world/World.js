import { Environment } from './Environment.js';
import { Terrain, estimateOffroadHeightAt } from './Terrain.js';
import { Road } from './Road.js';
import { Ramps } from './Ramps.js';
import { Obstacles } from './Obstacles.js';
import { SpawnManager } from './SpawnManager.js';
import { SurfaceType } from './SurfaceType.js';
import {
    MAP_HALF_EXTENT,
    SPAWN_POINT,
    MAIN_ROAD_WAYPOINTS,
    MAIN_ROAD_WIDTH,
    URBAN_CROSS_ROAD_WAYPOINTS,
    URBAN_ROAD_WIDTH,
    URBAN_ZONE,
    OFFROAD_CONNECTOR_WAYPOINTS,
    OFFROAD_CONNECTOR_WIDTH,
    OFFROAD_ZONE,
    JUMP_CONNECTOR_WAYPOINTS,
    JUMP_CONNECTOR_WIDTH,
    JUMP_ZONE,
} from './MapLayout.js';

// Orquestrador do mundo: liga Terrain (chão/relevo), Road (estrada
// principal + secundárias), Ramps, Obstacles, Environment (céu/luz/
// decoração) e SpawnManager. Cada sistema constrói-se a si próprio; o
// World só compõe e mantém o registo de superfícies e o limite do mapa
// — não é ele a criar geometria directamente.
export class World {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        this.surfaceByColliderHandle = new Map();

        this.spawnManager = new SpawnManager();
        this.spawnManager.register('player', SPAWN_POINT);

        this.environment = new Environment(scene, physicsWorld, this);
        this.terrain = new Terrain(scene, physicsWorld, this);

        this.buildRoads();
        this.buildRamps();
        this.buildObstacles();
    }

    buildRoads() {
        this.mainRoad = new Road(this.scene, this.physicsWorld, this, {
            waypoints: MAIN_ROAD_WAYPOINTS,
            width: MAIN_ROAD_WIDTH,
        });

        this.urbanRoad = new Road(this.scene, this.physicsWorld, this, {
            waypoints: URBAN_CROSS_ROAD_WAYPOINTS,
            width: URBAN_ROAD_WIDTH,
        });

        this.offroadConnector = new Road(this.scene, this.physicsWorld, this, {
            waypoints: OFFROAD_CONNECTOR_WAYPOINTS,
            width: OFFROAD_CONNECTOR_WIDTH,
        });

        this.jumpConnector = new Road(this.scene, this.physicsWorld, this, {
            waypoints: JUMP_CONNECTOR_WAYPOINTS,
            width: JUMP_CONNECTOR_WIDTH,
        });
    }

    buildRamps() {
        const ramps = new Ramps(this.scene, this.physicsWorld, this);

        ramps.create('small', { x: 140, z: -100, heading: 0 });
        ramps.create('medium', { x: 185, z: -35, heading: 0 });
        ramps.create('large', { x: 225, z: 15, heading: 0 });
    }

    buildObstacles() {
        const obstacles = new Obstacles(this.scene, this.physicsWorld, this);

        // Pequeno grupo perto da entrada da zona de saltos, longe das rampas.
        obstacles.createCluster([
            { type: 'crate', x: 108, z: -75 },
            { type: 'crate', x: 110, z: -73, heading: 0.4 },
            { type: 'tire', x: 106, z: -78 },
            { type: 'barrier', x: 115, z: -85, heading: Math.PI / 2 },
        ]);

        // Barreiras junto ao cruzamento urbano.
        obstacles.createCluster([
            { type: 'barrier', x: URBAN_ZONE.centerX - 20, z: URBAN_ZONE.centerZ + 15, heading: Math.PI / 2 },
            { type: 'barrier', x: URBAN_ZONE.centerX + 20, z: URBAN_ZONE.centerZ - 15, heading: Math.PI / 2 },
        ]);

        // Obstáculos naturais espalhados pela zona off-road, à altura
        // correcta do terreno inclinado.
        const offroadItems = [];
        for (let i = 0; i < 8; i++) {
            const x = OFFROAD_ZONE.centerX + (Math.random() * 2 - 1) * (OFFROAD_ZONE.halfWidth - 15);
            const z = OFFROAD_ZONE.centerZ + (Math.random() * 2 - 1) * (OFFROAD_ZONE.halfDepth - 15);
            const groundY = estimateOffroadHeightAt(z);

            offroadItems.push(
                i % 2 === 0
                    ? { type: 'rock', x, z, groundY, scale: 0.8 + Math.random() * 0.8 }
                    : { type: 'log', x, z, groundY, heading: Math.random() * Math.PI }
            );
        }
        obstacles.createCluster(offroadItems);
    }

    getSpawnPoint(name = 'player') {
        return this.spawnManager.get(name);
    }

    isOutOfBounds(position) {
        return Math.abs(position.x) > MAP_HALF_EXTENT || Math.abs(position.z) > MAP_HALF_EXTENT;
    }

    registerSurface(collider, surfaceType) {
        this.surfaceByColliderHandle.set(collider.handle, surfaceType);
    }

    getSurfaceAt(colliderHandle) {
        return this.surfaceByColliderHandle.get(colliderHandle) ?? SurfaceType.ROAD;
    }
}
