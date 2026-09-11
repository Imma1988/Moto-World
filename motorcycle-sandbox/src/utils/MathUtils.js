// Pequenas funções matemáticas partilhadas por vários sistemas
// (física da mota, câmara, etc.) para evitar duplicar as mesmas fórmulas.

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Factor de suavização exponencial independente do framerate.
// Usar como: current = lerp(current, target, dampFactor(rate, dt))
export function dampFactor(rate, dt) {
    return 1 - Math.exp(-rate * dt);
}
