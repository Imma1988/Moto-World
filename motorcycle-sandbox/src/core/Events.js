// Sistema de eventos simples (publish/subscribe). Permite que sistemas
// comuniquem entre si sem se conhecerem directamente, evitando
// dependências circulares.
//
// Exemplos de eventos que serão usados em fases futuras:
//   player.enteredMotorcycle, player.leftMotorcycle,
//   motorcycle.crashed, motorcycle.respawned,
//   challenge.started, challenge.completed, wanted.levelChanged

export class Events {
    constructor() {
        this.listeners = new Map();
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
    }

    off(eventName, callback) {
        this.listeners.get(eventName)?.delete(callback);
    }

    emit(eventName, payload) {
        this.listeners.get(eventName)?.forEach((callback) => callback(payload));
    }
}
