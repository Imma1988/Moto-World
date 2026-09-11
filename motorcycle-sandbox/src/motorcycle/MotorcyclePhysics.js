import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { clamp, lerp } from '../utils/MathUtils.js';
import { SurfaceType } from '../world/SurfaceType.js';

const WORLD_UP = new THREE.Vector3(0, 1, 0);

// Física arcade da mota, baseada em Rapier. Em vez de simular uma mota
// real (motor, transmissão, pneus, junções articuladas por roda), usa a
// técnica clássica de "raycast vehicle": um único rigid body para o
// chassis, com dois raios (dianteiro/traseiro) que fazem de suspensão e
// detectam o chão. Equilíbrio, inclinação, direcção, aceleração,
// travagem e aderência são implementados como forças/torques aplicados
// sobre esse corpo. Prioriza controlo e diversão sobre realismo.
export class MotorcyclePhysics {
    constructor(physicsWorld, world, data, spawnPoint) {
        this.physicsWorld = physicsWorld;
        this.world = world;
        this.data = data;

        this.rigidBody = this.createRigidBody(spawnPoint);
        this.collider = this.createCollider(this.rigidBody);

        this.controlInput = { throttle: 0, brake: 0, steer: 0, handbrake: false };

        this.frontWheel = { grounded: false, compression: 0 };
        this.rearWheel = { grounded: false, compression: 0 };

        this.isGrounded = false;
        this.previousGrounded = false;
        this.previousLinvelY = 0;

        this.controlEnabled = true;
    }

    createRigidBody(spawnPoint) {
        const heading = spawnPoint.heading ?? 0;
        const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, heading, 0));

        const desc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(spawnPoint.x, spawnPoint.y, spawnPoint.z)
            .setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w })
            .setLinearDamping(0.15)
            .setAngularDamping(0.6);

        return this.physicsWorld.createRigidBody(desc);
    }

    createCollider(rigidBody) {
        // Caixa simples a aproximar o chassis. As rodas em si não têm
        // collider próprio — o contacto com o chão é feito por raycast.
        const desc = RAPIER.ColliderDesc.cuboid(0.35, 0.35, this.data.wheelBase / 2 + 0.15)
            .setTranslation(0, 0.35, 0)
            .setMass(this.data.mass)
            .setFriction(0.3);

        return this.physicsWorld.createCollider(desc, rigidBody);
    }

    setControlInput(input) {
        this.controlInput = input;
    }

    // Chamado uma vez por sub-passo de física, ANTES de physicsWorld.step().
    // Devolve { crashed } para que a Motorcycle possa reagir.
    step(dt) {
        const translation = this.rigidBody.translation();
        const position = new THREE.Vector3(translation.x, translation.y, translation.z);
        const rot = this.rigidBody.rotation();
        const quaternion = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
        const bodyUp = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

        const forwardHoriz = new THREE.Vector3(forward.x, 0, forward.z);
        if (forwardHoriz.lengthSq() < 1e-6) forwardHoriz.set(0, 0, 1);
        forwardHoriz.normalize();

        const lateralAxis = new THREE.Vector3().crossVectors(forwardHoriz, WORLD_UP).normalize();

        this.frontWheel = this.raycastWheel(position, forwardHoriz, this.data.wheelBase / 2, dt);
        this.rearWheel = this.raycastWheel(position, forwardHoriz, -this.data.wheelBase / 2, dt);

        const groundedNow = this.frontWheel.grounded || this.rearWheel.grounded;

        let crashed = false;

        if (this.controlEnabled) {
            if (groundedNow && !this.previousGrounded) {
                if (Math.abs(this.previousLinvelY) > this.data.crashImpactSpeed) {
                    crashed = true;
                }
            }

            const currentRoll = this.computeCurrentRoll(bodyUp, forwardHoriz, lateralAxis);

            if (groundedNow) {
                if (Math.abs(currentRoll) > this.data.crashTiltAngle) {
                    crashed = true;
                }

                if (!crashed) {
                    this.applyGroundedControl(dt, forwardHoriz, lateralAxis, currentRoll);
                }
            } else {
                this.applyAirControl(dt, forwardHoriz, bodyUp);
            }

            if (crashed) {
                this.controlEnabled = false;
            }
        }

        const linvel = this.rigidBody.linvel();
        this.previousGrounded = groundedNow;
        this.previousLinvelY = linvel.y;
        this.isGrounded = groundedNow;

        return { crashed, grounded: groundedNow };
    }

    // Lança um raio vertical a partir de um ponto do chassis deslocado ao
    // longo do eixo longitudinal (roda dianteira ou traseira), aplicando
    // uma força de mola+amortecedor (suspensão) quando encontra chão.
    raycastWheel(chassisPosition, forwardHoriz, longitudinalOffset, dt) {
        const origin = chassisPosition.clone().addScaledVector(forwardHoriz, longitudinalOffset);
        const restLength = this.data.suspensionRestLength;
        const maxLength = restLength + this.data.suspensionTravel;

        const ray = new RAPIER.Ray({ x: origin.x, y: origin.y, z: origin.z }, { x: 0, y: -1, z: 0 });
        const hit = this.physicsWorld.castRay(ray, maxLength, true, undefined, undefined, this.collider);

        if (!hit) {
            return { grounded: false, compression: 0, surface: null };
        }

        const distance = hit.timeOfImpact ?? hit.toi ?? maxLength;
        const compression = Math.max(0, restLength - distance);

        const linvel = this.rigidBody.linvel();
        const springForce = compression * this.data.suspensionStrength;
        const dampingForce = -linvel.y * this.data.suspensionDamping;
        const totalForce = Math.max(0, springForce + dampingForce);

        this.rigidBody.applyImpulseAtPoint(
            { x: 0, y: totalForce * dt, z: 0 },
            { x: origin.x, y: chassisPosition.y, z: origin.z },
            true
        );

        const surface = this.world.getSurfaceAt(hit.collider.handle);

        return { grounded: true, compression, surface };
    }

    // Ângulo de inclinação actual (roll) em torno do eixo longitudinal,
    // isolado do pitch (subida/descida de rampas) através da projecção
    // do vector "up" do corpo no plano perpendicular ao avanço.
    computeCurrentRoll(bodyUp, forwardHoriz, lateralAxis) {
        const upOnPlane = bodyUp.clone().addScaledVector(forwardHoriz, -bodyUp.dot(forwardHoriz));

        if (upOnPlane.lengthSq() < 1e-6) return 0;
        upOnPlane.normalize();

        const cosRoll = clamp(upOnPlane.dot(WORLD_UP), -1, 1);
        const rollAngle = Math.acos(cosRoll);
        const sign = Math.sign(upOnPlane.dot(lateralAxis)) || 1;

        return rollAngle * sign;
    }

    applyGroundedControl(dt, forwardHoriz, lateralAxis, currentRoll) {
        const data = this.data;
        const input = this.controlInput;

        const linvel = this.rigidBody.linvel();
        const horizontalVel = new THREE.Vector3(linvel.x, 0, linvel.z);
        const forwardSpeed = horizontalVel.dot(forwardHoriz);
        const lateralSpeed = horizontalVel.dot(lateralAxis);

        // --- Direcção (yaw) ---
        const speedRatio = clamp(Math.abs(forwardSpeed) / data.maxSpeed, 0, 1);
        const steerSpeedFactor = lerp(1.0, 0.4, speedRatio);
        const targetYawRate = input.steer * data.steering * steerSpeedFactor;
        const currentYawRate = this.rigidBody.angvel().y;
        const yawTorque = (targetYawRate - currentYawRate) * data.steerResponsiveness;
        this.rigidBody.applyTorqueImpulse({ x: 0, y: yawTorque * dt, z: 0 }, true);

        // --- Inclinação + assistência de equilíbrio ---
        const leanSpeedFactor = clamp(Math.abs(forwardSpeed) / 8, 0, 1);
        const targetLean = clamp(-input.steer * leanSpeedFactor * data.leanAngle, -data.leanAngle, data.leanAngle);
        const angvel = this.rigidBody.angvel();
        const rollRateScalar = new THREE.Vector3(angvel.x, angvel.y, angvel.z).dot(forwardHoriz);
        const balanceTorqueMag =
            (targetLean - currentRoll) * data.balanceStrength - rollRateScalar * data.balanceDamping;
        const balanceTorque = forwardHoriz.clone().multiplyScalar(balanceTorqueMag * dt);
        this.rigidBody.applyTorqueImpulse({ x: balanceTorque.x, y: balanceTorque.y, z: balanceTorque.z }, true);

        // --- Aderência lateral ---
        const surface = this.rearWheel.surface ?? this.frontWheel.surface ?? SurfaceType.ROAD;
        const baseGrip = surface === SurfaceType.OFFROAD ? data.offroadGrip : data.grip;
        const leanRatio = clamp(Math.abs(currentRoll) / data.leanAngle, 0, 1);
        const highSpeedPenalty = lerp(1.0, 0.65, speedRatio);
        const leanPenalty = lerp(1.0, 0.7, leanRatio);
        const brakeTurnPenalty = input.brake > 0.5 && Math.abs(input.steer) > 0.3 ? 0.6 : 1.0;
        const handbrakePenalty = input.handbrake ? 0.5 : 1.0;
        const effectiveGrip = clamp(
            baseGrip * highSpeedPenalty * leanPenalty * brakeTurnPenalty * handbrakePenalty,
            0,
            1
        );

        const lateralDeltaV = -lateralSpeed * effectiveGrip;
        this.rigidBody.applyImpulse(
            { x: lateralAxis.x * lateralDeltaV * data.mass, y: 0, z: lateralAxis.z * lateralDeltaV * data.mass },
            true
        );

        // --- Aceleração / travagem ---
        let longForce = 0;

        if (input.throttle > 0) {
            const accelFactor = clamp(1 - forwardSpeed / data.maxSpeed, 0, 1);
            longForce += data.acceleration * input.throttle * accelFactor;
        }

        const handbrakeMultiplier = input.handbrake ? data.handbrakeMultiplier : 1;

        if (input.brake > 0) {
            if (forwardSpeed > 0.3) {
                longForce -= data.braking * input.brake * handbrakeMultiplier;
            } else if (forwardSpeed > -data.reverseMaxSpeed) {
                longForce -= data.acceleration * 0.25 * input.brake;
            }
        }

        let deltaV = (longForce / data.mass) * dt;

        // Não deixar a travagem/aceleração inverter o sentido da
        // velocidade numa única iteração — evita "ricochetes".
        if (longForce < 0 && Math.sign(forwardSpeed) !== 0) {
            const resultingSpeed = forwardSpeed + deltaV;
            if (Math.sign(resultingSpeed) !== Math.sign(forwardSpeed)) {
                deltaV = -forwardSpeed;
            }
        }

        this.rigidBody.applyImpulse(
            { x: forwardHoriz.x * deltaV * data.mass, y: 0, z: forwardHoriz.z * deltaV * data.mass },
            true
        );
    }

    applyAirControl(dt, forwardHoriz, bodyUp) {
        const data = this.data;
        const input = this.controlInput;

        // Auto-nivelamento fraco para nunca ficar permanentemente virada
        // ao contrário, mais controlo limitado do jogador sobre pitch/yaw.
        const rightAxis = new THREE.Vector3().crossVectors(WORLD_UP, forwardHoriz).normalize();
        const correctionAxis = new THREE.Vector3().crossVectors(bodyUp, WORLD_UP);
        const angvel = this.rigidBody.angvel();

        const torque = correctionAxis
            .multiplyScalar(data.airControlStrength)
            .addScaledVector(new THREE.Vector3(angvel.x, 0, angvel.z), -data.airControlStrength * 0.15);

        const pitchInput = input.throttle - input.brake;
        torque.addScaledVector(rightAxis, pitchInput * data.airControlStrength * 0.5);
        torque.addScaledVector(WORLD_UP, input.steer * data.airControlStrength * 0.3);

        this.rigidBody.applyTorqueImpulse({ x: torque.x * dt, y: torque.y * dt, z: torque.z * dt }, true);
    }

    respawn(spawnPoint) {
        const heading = spawnPoint.heading ?? 0;
        const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, heading, 0));

        this.rigidBody.setTranslation({ x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z }, true);
        this.rigidBody.setRotation({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }, true);
        this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

        this.controlEnabled = true;
        this.previousGrounded = false;
        this.previousLinvelY = 0;
        this.frontWheel = { grounded: false, compression: 0 };
        this.rearWheel = { grounded: false, compression: 0 };
    }

    getPosition() {
        const t = this.rigidBody.translation();
        return new THREE.Vector3(t.x, t.y, t.z);
    }

    getRotation() {
        const r = this.rigidBody.rotation();
        return new THREE.Quaternion(r.x, r.y, r.z, r.w);
    }

    getForwardSpeed() {
        const rot = this.rigidBody.rotation();
        const quaternion = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
        const linvel = this.rigidBody.linvel();
        return new THREE.Vector3(linvel.x, 0, linvel.z).dot(new THREE.Vector3(forward.x, 0, forward.z).normalize());
    }

    getSpeedKmh() {
        const linvel = this.rigidBody.linvel();
        const horizontalSpeed = Math.hypot(linvel.x, linvel.z);
        return horizontalSpeed * 3.6;
    }

    getSuspensionCompression(which) {
        const wheel = which === 'front' ? this.frontWheel : this.rearWheel;
        return clamp(wheel.compression / this.data.suspensionTravel, 0, 1);
    }
}
