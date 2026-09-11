/**
 * Time - Gestão do tempo e delta time
 */

export class Time {
    constructor() {
        this.startTime = 0;
        this.currentTime = 0;
        this.previousTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
    }

    /**
     * Iniciar o contador de tempo
     */
    start() {
        this.startTime = performance.now();
        this.previousTime = this.startTime;
        this.currentTime = this.startTime;
    }

    /**
     * Atualizar o tempo (chamar a cada frame)
     * @param {number} timestamp - Timestamp atual
     */
    update(timestamp) {
        this.currentTime = timestamp;
        this.deltaTime = (this.currentTime - this.previousTime) / 1000; // Converter para segundos
        this.previousTime = this.currentTime;
        this.elapsedTime = (this.currentTime - this.startTime) / 1000;

        // Contar frames para cálculo de FPS
        this.frameCount++;

        // Atualizar FPS a cada segundo
        if (this.currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = this.currentTime;
        }
    }

    /**
     * Obter delta time em segundos
     * @returns {number}
     */
    getDelta() {
        return this.deltaTime;
    }

    /**
     * Obter tempo total decorrido em segundos
     * @returns {number}
     */
    getElapsed() {
        return this.elapsedTime;
    }

    /**
     * Obter FPS atual
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Obter timestamp atual
     * @returns {number}
     */
    getTime() {
        return this.currentTime;
    }

    /**
     * Limitar delta time para evitar saltos grandes (ex: quando a tab perde foco)
     * @param {number} maxDelta - Delta máximo em segundos
     * @returns {number} Delta limitado
     */
    getClampedDelta(maxDelta = 0.1) {
        return Math.min(this.deltaTime, maxDelta);
    }
}

export default Time;
