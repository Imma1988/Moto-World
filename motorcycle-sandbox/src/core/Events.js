/**
 * Events - Sistema simples de eventos para comunicação entre módulos
 */

export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Registar um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a chamar quando o evento ocorrer
     * @param {Object} context - Contexto opcional para o callback
     */
    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push({ callback, context });
    }

    /**
     * Remover um listener de um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a remover
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const listeners = this.listeners.get(event);
        const index = listeners.findIndex(l => l.callback === callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emitir um evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados opcionais a passar aos listeners
     */
    emit(event, data = null) {
        if (!this.listeners.has(event)) return;

        const listeners = this.listeners.get(event);
        for (const { callback, context } of listeners) {
            if (context) {
                callback.call(context, data);
            } else {
                callback(data);
            }
        }
    }

    /**
     * Remover todos os listeners de um evento ou de todos os eventos
     * @param {string} [event] - Nome do evento opcional
     */
    clear(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Instância global única para uso em todo o jogo
export const events = new EventBus();

export default events;
