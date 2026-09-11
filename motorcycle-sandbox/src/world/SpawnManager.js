// Regista pontos de spawn seguros por nome (jogador/mota nesta fase;
// preparado para veículos e eventos futuros usarem os seus próprios
// pontos sem alterar esta classe).
export class SpawnManager {
    constructor() {
        this.points = new Map();
    }

    register(name, point) {
        this.points.set(name, { ...point });
    }

    get(name) {
        const point = this.points.get(name);
        if (!point) {
            throw new Error(`SpawnManager: ponto de spawn "${name}" não foi registado.`);
        }
        return { ...point };
    }
}
