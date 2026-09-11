/**
 * MotorcyclePhysics - Sistema de física arcade para mota usando Rapier
 * Implementa suspensão simplificada, tração, travagem e equilíbrio
 */

import * as THREE from 'three';
import RAPIER from 'rapier3d-compat';
import { MotorcycleData } from './MotorcycleData.js';
import { MathUtils } from '../utils/MathUtils.js';

export class MotorcyclePhysics {
    constructor(world, position, data = null) {
        this.world = world;
        this.data = data || MotorcycleData;
        
        // Estado físico
        this.rigidBody = null;
        this.frontWheelRay = null;
        this.rearWheelRay = null;
        
        // Estado das rodas
        this.frontWheelContact = {
            onGround: false,
            contactPoint: new THREE.Vector3(),
            normal: new THREE.Vector3(0, 1, 0),
            compression: 0
        };
        
        this.rearWheelContact = {
            onGround: false,
            contactPoint: new THREE.Vector3(),
            normal: new THREE.Vector3(0, 1, 0),
            compression: 0
        };
        
        // Inputs físicos
        this.throttle = 0;        // -1 a 1 (negativo = travão/reverso)
        this.steer = 0;           // -1 a 1 (esquerda a direita)
        this.brake = 0;           // 0 a 1
        this.handbrake = false;
        
        // Estado da mota
        this.isAirborne = false;
        this.isCrashed = false;
        this.currentLean = 0;
        this.currentSteerAngle = 0;
        
        // Cria o corpo físico
        this.createBody(position);
    }
    
    /**
     * Cria o rigid body e colisores da mota
     */
    createBody(position) {
        const desc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic)
            .setTranslation(position.x, position.y, position.z)
            .setMass(this.data.mass);
        
        this.rigidBody = this.world.createRigidBody(desc);
        
        // Colisor principal (chassis)
        const chassisShape = new RAPIER.Cuboid(
            this.data.width / 2,
            this.data.height / 3,
            this.data.length / 3
        );
        
        const chassisColliderDesc = new RAPIER.ColliderDesc(chassisShape)
            .setDensity(1.0)
            .setFriction(0.5)
            .setRestitution(0.1);
        
        this.world.createCollider(chassisColliderDesc, this.rigidBody);
        
        // Configurar centro de massa
        this.rigidBody.setCenterOfMass({
            x: 0,
            y: this.data.centerOfMassY,
            z: this.data.centerOfMassZ
        });
        
        // Inicializar raios para detecção das rodas
        this.setupWheelRays();
    }
    
    /**
     * Configura os raios para detecção de contacto das rodas
     */
    setupWheelRays() {
        const halfWheelbase = this.data.wheelbase / 2;
        const wheelOffset = this.data.width / 2;
        
        // Ray dianteiro
        this.frontWheelRay = {
            start: new RAPIER.Vector3(0, this.data.suspensionRestLength + 0.2, halfWheelbase),
            end: new RAPIER.Vector3(0, -this.data.wheelRadius + 0.05, halfWheelbase),
            length: this.data.suspensionRestLength + this.data.wheelRadius
        };
        
        // Ray traseiro
        this.rearWheelRay = {
            start: new RAPIER.Vector3(0, this.data.suspensionRestLength + 0.2, -halfWheelbase),
            end: new RAPIER.Vector3(0, -this.data.wheelRadius + 0.05, -halfWheelbase),
            length: this.data.suspensionRestLength + this.data.wheelRadius
        };
    }
    
    /**
     * Detecta contacto das rodas com o chão usando raycasting
     */
    detectWheelContacts() {
        const rotation = this.rigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        
        // Transformar posições dos raios para espaço do mundo
        const bodyPos = this.rigidBody.translation();
        
        // Ray frontal
        const frontStartWorld = this.transformPoint(
            bodyPos, quat, this.frontWheelRay.start
        );
        const frontEndWorld = this.transformPoint(
            bodyPos, quat, this.frontWheelRay.end
        );
        
        const frontHit = this.castRay(frontStartWorld, frontEndWorld);
        this.updateWheelContact(this.frontWheelContact, frontHit, frontStartWorld);
        
        // Ray traseiro
        const rearStartWorld = this.transformPoint(
            bodyPos, quat, this.rearWheelRay.start
        );
        const rearEndWorld = this.transformPoint(
            bodyPos, quat, this.rearWheelRay.end
        );
        
        const rearHit = this.castRay(rearStartWorld, rearEndWorld);
        this.updateWheelContact(this.rearWheelContact, rearHit, rearStartWorld);
        
        // Determinar se está no ar
        this.isAirborne = !this.frontWheelContact.onGround && !this.rearWheelContact.onGround;
    }
    
    /**
     * Transforma ponto do espaço local para espaço do mundo
     */
    transformPoint(bodyPos, quat, localPoint) {
        const point = new THREE.Vector3(localPoint.x, localPoint.y, localPoint.z);
        point.applyQuaternion(quat);
        point.add(new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z));
        return point;
    }
    
    /**
     * Lança um ray e retorna informação de colisão
     */
    castRay(from, to) {
        const ray = new RAPIER.Ray(
            new RAPIER.Vector3(from.x, from.y, from.z),
            new RAPIER.Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize()
        );
        
        const hit = this.world.castRay(
            ray,
            this.frontWheelRay.length,
            true,
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
        );
        
        if (hit && hit.toi < this.frontWheelRay.length) {
            return {
                distance: hit.toi,
                point: new THREE.Vector3(
                    from.x + (to.x - from.x) * (hit.toi / this.frontWheelRay.length),
                    from.y + (to.y - from.y) * (hit.toi / this.frontWheelRay.length),
                    from.z + (to.z - from.z) * (hit.toi / this.frontWheelRay.length)
                )
            };
        }
        
        return null;
    }
    
    /**
     * Atualiza estado de contacto de uma roda
     */
    updateWheelContact(contact, hit, rayStart) {
        if (hit && hit.distance < this.frontWheelRay.length * 0.95) {
            contact.onGround = true;
            contact.contactPoint.copy(hit.point);
            contact.compression = MathUtils.clamp(
                (this.frontWheelRay.length - hit.distance) / this.frontWheelRay.length,
                0, 1
            );
        } else {
            contact.onGround = false;
            contact.compression = 0;
        }
    }
    
    /**
     * Aplica forças de suspensão às rodas
     */
    applySuspensionForces() {
        const suspensionForce = this.data.suspensionStrength;
        const damping = this.data.suspensionDamping;
        
        // Força na roda dianteira
        if (this.frontWheelContact.onGround) {
            const force = suspensionForce * this.frontWheelContact.compression;
            const dampingForce = -damping * this.rigidBody.linvel().y;
            
            const totalForce = force + dampingForce;
            if (totalForce > 0) {
                this.rigidBody.applyImpulse(
                    new RAPIER.Vector3(0, totalForce, 0),
                    true
                );
            }
        }
        
        // Força na roda traseira
        if (this.rearWheelContact.onGround) {
            const force = suspensionForce * this.rearWheelContact.compression;
            const dampingForce = -damping * this.rigidBody.linvel().y;
            
            const totalForce = force + dampingForce;
            if (totalForce > 0) {
                this.rigidBody.applyImpulse(
                    new RAPIER.Vector3(0, totalForce, 0),
                    true
                );
            }
        }
    }
    
    /**
     * Aplica força de aceleração/travagem
     */
    applyDriveForce(dt) {
        if (this.isAirborne) return;
        
        // Direção forward baseada na rotação da mota
        const rotation = this.rigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
        
        // Calcular força de tração (apenas roda traseira)
        let driveForce = 0;
        
        if (this.throttle > 0) {
            // Aceleração
            driveForce = this.throttle * this.data.acceleration * this.data.mass;
        } else if (this.throttle < 0 && this.getSpeed() < this.data.reverseSpeed) {
            // Marcha-atrás (limitada)
            driveForce = this.throttle * this.data.acceleration * 0.3 * this.data.mass;
        }
        
        // Travagem
        if (this.brake > 0 || this.handbrake) {
            const brakeForce = (this.brake + (this.handbrake ? 0.8 : 0)) * this.data.braking * this.data.mass;
            const speed = this.getSpeed();
            
            // Travagem proporcional à velocidade
            if (speed > 0.5) {
                const brakeMagnitude = Math.min(brakeForce, speed * this.data.mass * 2);
                driveForce -= Math.sign(this.getForwardVelocity()) * brakeMagnitude;
            }
        }
        
        if (driveForce !== 0) {
            // Aplicar força na roda traseira
            const halfWheelbase = this.data.wheelbase / 2;
            const rearPos = new THREE.Vector3(0, 0, -halfWheelbase).applyQuaternion(quat);
            
            this.rigidBody.applyImpulseAtPoint(
                new RAPIER.Vector3(
                    forward.x * driveForce * dt,
                    forward.y * driveForce * dt,
                    forward.z * driveForce * dt
                ),
                new RAPIER.Vector3(
                    rearPos.x,
                    rearPos.y + 0.2,
                    rearPos.z
                ),
                true
            );
        }
    }
    
    /**
     * Aplica força de direção
     */
    applySteeringForce(dt) {
        if (this.isAirborne) {
            // Controlo limitado no ar
            this.applyAirControl(dt);
            return;
        }
        
        const speed = this.getSpeed();
        const speedFactor = MathUtils.clamp(speed / 10, 0.3, 1.0);
        
        // Atualizar ângulo de direção suavemente
        const targetSteer = this.steer * this.data.steering * speedFactor;
        this.currentSteerAngle = MathUtils.lerp(
            this.currentSteerAngle,
            targetSteer,
            this.data.steeringSpeed * dt
        );
        
        // Aplicar força lateral para virar
        if (Math.abs(this.currentSteerAngle) > 0.01 && speed > 1.0) {
            const rotation = this.rigidBody.rotation();
            const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
            
            // Direção perpendicular (lateral)
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
            const steerForce = -this.currentSteerAngle * speed * this.data.grip * this.data.mass * 0.5;
            
            const halfWheelbase = this.data.wheelbase / 2;
            const frontPos = new THREE.Vector3(0, 0, halfWheelbase).applyQuaternion(quat);
            
            this.rigidBody.applyImpulseAtPoint(
                new RAPIER.Vector3(
                    right.x * steerForce * dt,
                    right.y * steerForce * dt,
                    right.z * steerForce * dt
                ),
                new RAPIER.Vector3(
                    frontPos.x,
                    frontPos.y + 0.2,
                    frontPos.z
                ),
                true
            );
        }
    }
    
    /**
     * Controlo limitado quando no ar
     */
    applyAirControl(dt) {
        if (Math.abs(this.steer) < 0.1) return;
        
        const rotation = this.rigidBody.rotation();
        const airRotationForce = this.data.airRotation * this.data.airControl;
        
        // Aplicar rotação suave no ar
        this.rigidBody.applyTorqueImpulse(
            new RAPIER.Vector3(0, this.steer * airRotationForce * dt, 0),
            true
        );
    }
    
    /**
     * Aplica assistência de equilíbrio
     */
    applyBalanceAssist(dt) {
        if (this.isAirborne) return;
        
        const rotation = this.rigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        
        // Obter vetor up local
        const upLocal = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
        
        // Calcular ângulo de inclinação atual
        const leanAngle = Math.asin(upLocal.x);
        this.currentLean = leanAngle;
        
        // Calcular torque de correção
        const balanceTorque = -leanAngle * this.data.balanceAssist * this.data.mass;
        const angularVel = this.rigidBody.angvel();
        const dampingTorque = -angularVel.x * this.data.balanceDamping;
        
        // Aplicar torque de equilíbrio
        this.rigidBody.applyTorqueImpulse(
            new RAPIER.Vector3(
                (balanceTorque + dampingTorque) * dt,
                0,
                0
            ),
            true
        );
        
        // Inclinação visual baseada na direção e velocidade
        if (!this.isAirborne) {
            const speed = this.getSpeed();
            const targetLean = this.currentSteerAngle * speed * 0.15;
            const clampedLean = MathUtils.clamp(targetLean, -this.data.maxLeanAngle, this.data.maxLeanAngle);
            
            // Suavizar inclinação
            this.currentLean = MathUtils.lerp(this.currentLean, clampedLean, this.data.leanSpeed * dt);
        }
    }
    
    /**
     * Verifica se a mota está capotada/crashada
     */
    checkCrash() {
        if (this.isCrashed) return;
        
        const rotation = this.rigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const upLocal = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
        
        // Se o up estiver muito desviado do vertical
        if (upLocal.y < 0.3 || Math.abs(upLocal.x) > Math.sin(this.data.crashThreshold)) {
            this.isCrashed = true;
        }
    }
    
    /**
     * Obtém velocidade atual em m/s
     */
    getSpeed() {
        const vel = this.rigidBody.linvel();
        return Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    }
    
    /**
     * Obtém velocidade forward (positiva = frente, negativa = trás)
     */
    getForwardVelocity() {
        const vel = this.rigidBody.linvel();
        const rotation = this.rigidBody.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
        
        return vel.x * forward.x + vel.y * forward.y + vel.z * forward.z;
    }
    
    /**
     * Obtém posição atual
     */
    getPosition() {
        const pos = this.rigidBody.translation();
        return new THREE.Vector3(pos.x, pos.y, pos.z);
    }
    
    /**
     * Obtém rotação atual como Quaternion
     */
    getRotation() {
        const rot = this.rigidBody.rotation();
        return new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    }
    
    /**
     * Define inputs de controlo
     */
    setInputs(throttle, steer, brake, handbrake) {
        this.throttle = throttle;
        this.steer = steer;
        this.brake = brake;
        this.handbrake = handbrake;
    }
    
    /**
     * Reseta a mota para uma posição segura
     */
    respawn(position, rotation) {
        this.isCrashed = false;
        this.isAirborne = false;
        this.currentLean = 0;
        this.currentSteerAngle = 0;
        this.throttle = 0;
        this.steer = 0;
        this.brake = 0;
        this.handbrake = false;
        
        // Resetar velocidades
        this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // Reposicionar
        this.rigidBody.setTranslation(
            new RAPIER.Vector3(position.x, position.y + 1, position.z),
            true
        );
        this.rigidBody.setRotation(
            new RAPIER.Vector3(rotation.x, rotation.y, rotation.z, rotation.w),
            true
        );
    }
    
    /**
     * Atualiza física (chamado no fixed timestep)
     */
    update(dt) {
        this.detectWheelContacts();
        this.applySuspensionForces();
        this.applyDriveForce(dt);
        this.applySteeringForce(dt);
        this.applyBalanceAssist(dt);
        this.checkCrash();
    }
    
    /**
     * Limpeza
     */
    destroy() {
        if (this.rigidBody) {
            this.world.removeRigidBody(this.rigidBody);
            this.rigidBody.free();
        }
    }
}
