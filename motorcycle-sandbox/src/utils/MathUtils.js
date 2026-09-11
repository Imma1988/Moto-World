/**
 * MathUtils - Funções utilitárias de matemática para o jogo
 */

export class MathUtils {
    /**
     * Interpolação linear entre dois valores
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Limita um valor entre mínimo e máximo
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Mapeia um valor de um intervalo para outro
     */
    static mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    /**
     * Verifica se dois vetores são aproximadamente iguais
     */
    static vectorEquals(a, b, epsilon = 0.0001) {
        return Math.abs(a.x - b.x) < epsilon &&
               Math.abs(a.y - b.y) < epsilon &&
               Math.abs(a.z - b.z) < epsilon;
    }

    /**
     * Calcula o ângulo em radianos entre dois pontos no plano XZ
     */
    static angleBetweenPoints(from, to) {
        return Math.atan2(to.x - from.x, to.z - from.z);
    }

    /**
     * Suaviza uma rotação angular com interpolação
     */
    static smoothAngle(current, target, smoothing) {
        let diff = target - current;
        // Normaliza para [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return current + diff * smoothing;
    }

    /**
     * Converte graus para radianos
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Converte radianos para graus
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
}
