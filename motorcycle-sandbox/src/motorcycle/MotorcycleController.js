/**
 * MotorcycleController - Sistema de controlo da mota
 * Converte inputs do jogador em comandos para o sistema físico
 */

import { MathUtils } from '../utils/MathUtils.js';

export class MotorcycleController {
    constructor(inputSystem) {
        this.input = inputSystem;
        
        // Estado dos inputs suavizados
        this.smoothThrottle = 0;
        this.smoothSteer = 0;
        this.smoothBrake = 0;
        
        // Configurações de suavização
        this.throttleSmoothing = 8.0;     // Quão rápido responde o acelerador
        this.steerSmoothing = 6.0;        // Quão rápido responde a direção
        this.brakeSmoothing = 10.0;       // Quão rápido responde o travão
        
        // Deadzone para evitar drift
        this.steerDeadzone = 0.1;
        this.throttleDeadzone = 0.05;
    }
    
    /**
     * Processa inputs e retorna valores suavizados
     */
    processInputs(deltaTime) {
        // Obter inputs brutos
        const throttleInput = this.getThrottleInput();
        const steerInput = this.getSteerInput();
        const brakeInput = this.getBrakeInput();
        const handbrakeInput = this.input.isActionPressed('handbrake');
        
        // Aplicar deadzone à direção
        const steerWithDeadzone = Math.abs(steerInput) < this.steerDeadzone 
            ? 0 
            : steerInput;
        
        // Aplicar deadzone ao acelerador
        const throttleWithDeadzone = Math.abs(throttleInput) < this.throttleDeadzone
            ? 0
            : throttleInput;
        
        // Suavizar throttle (aceleração progressiva)
        this.smoothThrottle = MathUtils.lerp(
            this.smoothThrottle,
            throttleWithDeadzone,
            this.throttleSmoothing * deltaTime
        );
        
        // Suavizar direção
        this.smoothSteer = MathUtils.lerp(
            this.smoothSteer,
            steerWithDeadzone,
            this.steerSmoothing * deltaTime
        );
        
        // Suavizar travão
        this.smoothBrake = MathUtils.lerp(
            this.smoothBrake,
            brakeInput,
            this.brakeSmoothing * deltaTime
        );
        
        return {
            throttle: this.smoothThrottle,
            steer: this.smoothSteer,
            brake: this.smoothBrake,
            handbrake: handbrakeInput
        };
    }
    
    /**
     * Obtém valor de aceleração (-1 a 1)
     * Positivo = acelerar, Negativo = marcha-atrás
     */
    getThrottleInput() {
        let value = 0;
        
        if (this.input.isActionPressed('accelerate')) {
            value += 1.0;
        }
        if (this.input.isActionPressed('brake_reverse')) {
            value -= 0.5;  // Marcha-atrás mais lenta que avanço
        }
        
        return MathUtils.clamp(value, -1, 1);
    }
    
    /**
     * Obtém valor de direção (-1 a 1)
     * Negativo = esquerda, Positivo = direita
     */
    getSteerInput() {
        let value = 0;
        
        if (this.input.isActionPressed('turnLeft')) {
            value -= 1.0;
        }
        if (this.input.isActionPressed('turnRight')) {
            value += 1.0;
        }
        
        return MathUtils.clamp(value, -1, 1);
    }
    
    /**
     * Obtém valor de travagem (0 a 1)
     */
    getBrakeInput() {
        // Travão normal (S / ArrowDown quando não está em reverso)
        if (this.input.isActionPressed('brake_reverse') && this.smoothThrottle >= 0) {
            return 1.0;
        }
        
        // Travão de emergência (Space)
        if (this.input.isActionPressed('handbrake')) {
            return 0.8;
        }
        
        return 0;
    }
    
    /**
     * Verifica se foi pedido respawn
     */
    wantsRespawn() {
        return this.input.isActionPressed('respawn');
    }
    
    /**
     * Reseta estado suavizado (útil após respawn)
     */
    resetSmoothState() {
        this.smoothThrottle = 0;
        this.smoothSteer = 0;
        this.smoothBrake = 0;
    }
}
