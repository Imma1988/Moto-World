// Dados de layout do mapa (waypoints de estradas, zonas). Vive à parte
// da lógica de construção (Terrain/Road/Obstacles/Environment) para que
// todos os módulos usem exactamente as mesmas coordenadas em vez de
// duplicar números mágicos.

// Limite jogável "leve": ultrapassar isto despoleta respawn. O chão
// físico (Terrain) é bastante maior do que isto, como margem de
// segurança.
export const MAP_HALF_EXTENT = 260;

export const SPAWN_POINT = { x: 0, y: 0.5, z: 0, heading: 0 };

// Estrada aberta principal: atravessa o mapa de sul a norte, com curvas
// suaves e uma mais apertada perto de z=-100.
export const MAIN_ROAD_WAYPOINTS = [
    { x: 0, z: -220 },
    { x: 20, z: -160 },
    { x: -25, z: -100 },
    { x: 0, z: -40 },
    { x: 0, z: 0 },
    { x: 15, z: 60 },
    { x: 40, z: 120 },
    { x: 30, z: 170 },
    { x: 0, z: 220 },
];
export const MAIN_ROAD_WIDTH = 10;

// Zona urbana: cruzamento simples no topo da estrada principal.
export const URBAN_ZONE = { centerX: 0, centerZ: 220, halfWidth: 75, halfDepth: 55 };
export const URBAN_CROSS_ROAD_WAYPOINTS = [
    { x: -70, z: 220 },
    { x: 0, z: 220 },
    { x: 70, z: 220 },
];
export const URBAN_ROAD_WIDTH = 8;

// Zona off-road: ver Terrain.js para as faixas inclinadas.
export const OFFROAD_ZONE = { centerX: -180, centerZ: 0, halfWidth: 70, halfDepth: 100 };
export const OFFROAD_CONNECTOR_WAYPOINTS = [
    { x: 0, z: -40 },
    { x: -60, z: -65 },
    { x: -105, z: -92 },
];
export const OFFROAD_CONNECTOR_WIDTH = 7;

// Zona de saltos.
export const JUMP_ZONE = { centerX: 180, centerZ: -60, halfWidth: 85, halfDepth: 95 };
export const JUMP_CONNECTOR_WAYPOINTS = [
    { x: 15, z: 60 },
    { x: 100, z: 0 },
    { x: 170, z: -55 },
];
export const JUMP_CONNECTOR_WIDTH = 7;

// Todos os waypoints de estrada, usados apenas para afastar decoração
// (árvores, rochas) das estradas — não precisa de ser exacto, os
// elementos decorativos não têm collider.
export const ALL_ROAD_WAYPOINTS = [
    ...MAIN_ROAD_WAYPOINTS,
    ...URBAN_CROSS_ROAD_WAYPOINTS,
    ...OFFROAD_CONNECTOR_WAYPOINTS,
    ...JUMP_CONNECTOR_WAYPOINTS,
];
