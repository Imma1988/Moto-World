import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

// Pequenas fábricas partilhadas para criar geometria caixa + física
// (Terrain, Road, Ramps e Obstacles usam todas o mesmo padrão: uma caixa
// rodada em X (inclinação) e/ou Y (direcção), com um collider a
// condizer). Evita repetir a mesma conversão THREE.Quaternion -> Rapier
// em cada ficheiro.

export function createStaticBody(physicsWorld, position = { x: 0, y: 0, z: 0 }) {
    const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
    return physicsWorld.createRigidBody(desc);
}

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

// Compõe inclinação (rotationX, em torno do eixo local X) com direcção
// (rotationY, em torno do eixo Y do MUNDO) de forma explícita e sem
// ambiguidade: primeiro inclina, depois orienta o resultado já inclinado
// para o heading pedido. Isto evita depender da ordem intrínseca dos
// ângulos de Euler do Three.js (que rodaria em torno do Y já inclinado,
// introduzindo uma ligeira torção quando os dois ângulos são
// combinados) — importante para rampas com heading ≠ 0.
function composeTiltAndHeading(rotationX, rotationY) {
    const tilt = new THREE.Quaternion().setFromAxisAngle(AXIS_X, rotationX);
    const heading = new THREE.Quaternion().setFromAxisAngle(AXIS_Y, rotationY);
    return heading.multiply(tilt);
}

// Anexa um collider caixa a um rigid body já existente (posição/rotação
// relativas a esse corpo). Permite que várias peças partilhem um único
// rigid body estático — útil para uma estrada inteira ou um quarteirão
// de edifícios, mantendo o número de rigid bodies baixo.
export function attachBoxCollider(physicsWorld, rigidBody, { size, position, rotationX = 0, rotationY = 0 }, friction = 1.0) {
    const quaternion = composeTiltAndHeading(rotationX, rotationY);

    const desc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
        .setTranslation(position.x, position.y, position.z)
        .setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w })
        .setFriction(friction);

    return physicsWorld.createCollider(desc, rigidBody);
}

export function createBoxMesh(scene, { size, position, rotationX = 0, rotationY = 0, color, castShadow = false, receiveShadow = true }) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.quaternion.copy(composeTiltAndHeading(rotationX, rotationY));
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    scene.add(mesh);
    return mesh;
}

// Caso comum: uma caixa isolada com o seu próprio rigid body fixo
// (chão, rampa, obstáculo). Devolve mesh + collider para o chamador
// poder registar a superfície.
export function createBoxTerrainPiece(scene, physicsWorld, options) {
    const { position, friction = 1.0, color, castShadow = false } = options;

    const mesh = createBoxMesh(scene, { ...options, color, castShadow });
    const rigidBody = createStaticBody(physicsWorld, position);
    const collider = attachBoxCollider(physicsWorld, rigidBody, { ...options, position: { x: 0, y: 0, z: 0 } }, friction);

    return { mesh, rigidBody, collider };
}
