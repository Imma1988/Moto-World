// Controlo de delta time, independente do framerate do monitor.

const MAX_DELTA = 0.1; // evita saltos grandes (ex: aba em segundo plano)

export class Time {
    constructor() {
        this.previousTimestamp = 0;
        this.delta = 0;
        this.elapsed = 0;
    }

    start() {
        this.previousTimestamp = performance.now();
    }

    update() {
        const now = performance.now();
        const rawDelta = (now - this.previousTimestamp) / 1000;
        this.previousTimestamp = now;

        this.delta = Math.min(rawDelta, MAX_DELTA);
        this.elapsed += this.delta;
    }
}
