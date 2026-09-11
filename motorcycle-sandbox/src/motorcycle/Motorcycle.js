import * as THREE from 'three';
import { MotorcyclePhysics } from './MotorcyclePhysics.js';
import { MotorcycleController } from './MotorcycleController.js';
import { dampFactor } from '../utils/MathUtils.js';

export const MotorcycleState = {
    NORMAL: 'normal',
    AIRBORNE: 'airborne',
    CRASHED: 'crashed',
    RESPAWNING: 'respawning',
};

const MAX_VISUAL_STEER_ANGLE = 0.45; // radianos, só para o garfo/roda dianteira

// Representa a mota: modelo visual procedural + ligação aos componentes
// de física (MotorcyclePhysics) e controlo (MotorcycleController). Esta
// classe não implementa a física em si, apenas orquestra os componentes
// e mantém o estado de alto nível (normal / no ar / crash / respawn).
export class Motorcycle {
    constructor(scene, physicsWorld, world, input, events, spawnPoint, data) {
        this.scene = scene;
        this.world = world;
        this.events = events;
        this.data = data;

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);

        this.physics = new MotorcyclePhysics(physicsWorld, world, data, spawnPoint);
        this.controller = new MotorcycleController(input);

        this.state = MotorcycleState.NORMAL;
        this.crashTimer = 0;
        this.lastControlInput = { throttle: 0, brake: 0, steer: 0, handbrake: false };

        this.wheelSpinAngle = 0;
        this.frontSteerVisual = 0;
    }

    // --- Modelo visual procedural ---

    createMesh() {
        const root = new THREE.Group();

        this.addChassisDetails(root);

        this.rearWheelPivot = new THREE.Group();
        this.rearWheelMesh = this.createWheelMesh();
        this.rearWheelPivot.add(this.rearWheelMesh);
        this.rearWheelPivot.position.set(0, 0, -this.data.wheelBase / 2);
        root.add(this.rearWheelPivot);

        this.frontForkPivot = new THREE.Group();
        this.frontWheelMesh = this.createWheelMesh();
        this.frontForkPivot.add(this.frontWheelMesh);
        this.frontForkPivot.position.set(0, 0, this.data.wheelBase / 2);
        root.add(this.frontForkPivot);

        this.strutMountLocalY = 0.55;
        this.rearStrut = this.createStrutMesh();
        this.frontStrut = this.createStrutMesh();
        root.add(this.rearStrut, this.frontStrut);

        return root;
    }

    addChassisDetails(root) {
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd6392b });
        const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 });

        // Chassis principal
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, this.data.wheelBase + 0.3), bodyMaterial);
        body.position.set(0, 0.5, 0);
        body.castShadow = true;
        root.add(body);

        // Depósito de combustível
        const tank = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), bodyMaterial);
        tank.scale.set(1, 0.8, 1.4);
        tank.position.set(0, 0.68, 0.25);
        tank.castShadow = true;
        root.add(tank);

        // Assento
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.55), darkMaterial);
        seat.position.set(0, 0.72, -0.35);
        seat.castShadow = true;
        root.add(seat);

        // Guiador
        const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), darkMaterial);
        handlebar.rotation.z = Math.PI / 2;
        handlebar.position.set(0, 0.85, this.data.wheelBase / 2 - 0.1);
        root.add(handlebar);

        // Farol
        const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), metalMaterial);
        headlight.rotation.x = Math.PI / 2;
        headlight.position.set(0, 0.62, this.data.wheelBase / 2 + 0.15);
        root.add(headlight);

        // Escape
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.7, 8), metalMaterial);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.position.set(0.18, 0.35, -0.5);
        root.add(exhaust);
    }

    createWheelMesh() {
        const geometry = new THREE.CylinderGeometry(this.data.wheelRadius, this.data.wheelRadius, 0.18, 20);
        const material = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = Math.PI / 2;
        mesh.castShadow = true;
        return mesh;
    }

    createStrutMesh() {
        const geometry = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
        const material = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.5, roughness: 0.5 });
        return new THREE.Mesh(geometry, material);
    }

    // --- Ciclo de actualização ---

    // Chamado uma vez por sub-passo de física fixo, ANTES de
    // physicsWorld.step().
    fixedUpdate(dt) {
        if (this.state === MotorcycleState.RESPAWNING) {
            this.state = MotorcycleState.NORMAL;
        }

        const controlInput = this.controller.readControlInput();
        this.lastControlInput = controlInput;

        if (controlInput.resetRequested) {
            this.respawn();
            return;
        }

        if (this.state === MotorcycleState.CRASHED) {
            this.crashTimer -= dt;
            if (this.crashTimer <= 0) {
                this.respawn();
            }
            return;
        }

        this.physics.setControlInput(controlInput);
        const { crashed } = this.physics.step(dt);

        if (crashed) {
            this.state = MotorcycleState.CRASHED;
            this.crashTimer = this.data.respawnDelay;
            this.events?.emit('motorcycle.crashed');
            return;
        }

        this.state = this.physics.isGrounded ? MotorcycleState.NORMAL : MotorcycleState.AIRBORNE;
    }

    // Chamado depois de cada physicsWorld.step(), copia a transformação
    // física para a malha visual e anima rodas/suspensão/direcção.
    syncPhysicsToVisual(dt) {
        const position = this.physics.getPosition();
        const rotation = this.physics.getRotation();

        this.mesh.position.copy(position);
        this.mesh.quaternion.copy(rotation);

        const forwardSpeed = this.physics.getForwardSpeed();
        this.wheelSpinAngle += (forwardSpeed / this.data.wheelRadius) * dt;
        this.wheelSpinAngle %= Math.PI * 2;
        this.rearWheelMesh.rotation.x = this.wheelSpinAngle;
        this.frontWheelMesh.rotation.x = this.wheelSpinAngle;

        const targetSteerVisual = this.lastControlInput.steer * MAX_VISUAL_STEER_ANGLE;
        this.frontSteerVisual += (targetSteerVisual - this.frontSteerVisual) * dampFactor(12, dt);
        this.frontForkPivot.rotation.y = this.frontSteerVisual;

        this.updateSuspensionVisual(
            this.rearWheelPivot,
            this.rearStrut,
            this.physics.getSuspensionCompression('rear')
        );
        this.updateSuspensionVisual(
            this.frontForkPivot,
            this.frontStrut,
            this.physics.getSuspensionCompression('front')
        );
    }

    updateSuspensionVisual(pivot, strutMesh, compressionRatio) {
        const compression = compressionRatio * this.data.suspensionTravel;
        const wheelLocalY = this.data.wheelRadius - this.data.suspensionRestLength + compression;

        pivot.position.y = wheelLocalY;

        const strutLength = Math.max(0.05, this.strutMountLocalY - wheelLocalY);
        strutMesh.scale.y = strutLength;
        strutMesh.position.set(pivot.position.x, wheelLocalY + strutLength / 2, pivot.position.z);
    }

    respawn() {
        const spawnPoint = this.world.getSpawnPoint();
        this.physics.respawn(spawnPoint);

        this.state = MotorcycleState.RESPAWNING;
        this.crashTimer = 0;

        this.events?.emit('motorcycle.respawned');
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.mesh.position;
    }

    getSpeedKmh() {
        return this.physics.getSpeedKmh();
    }

    getState() {
        return this.state;
    }
}
