// Tipos de superfície reconhecidos pela física da mota (aderência,
// suspensão). Vive no seu próprio ficheiro (em vez de dentro de
// World.js) para que Terrain/Road/Obstacles e MotorcyclePhysics possam
// importá-lo sem criar uma dependência circular com World.js.
export const SurfaceType = {
    ROAD: 'road',
    OFFROAD: 'offroad',
};
