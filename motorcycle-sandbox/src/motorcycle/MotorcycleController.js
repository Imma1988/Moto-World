// Traduz o estado do Input (acções nomeadas, ver core/Input.js e
// core/Constants.js) num "control input" simples e neutro que a física
// consome. Mantém a física completamente desligada de teclas/DOM.
export class MotorcycleController {
    constructor(input) {
        this.input = input;
    }

    readControlInput() {
        const throttle = this.input.isPressed('accelerate') ? 1 : 0;
        const brake = this.input.isPressed('brake') ? 1 : 0;

        const left = this.input.isPressed('left') ? 1 : 0;
        const right = this.input.isPressed('right') ? 1 : 0;
        const steer = left - right;

        const handbrake = this.input.isPressed('handbrake');
        const resetRequested = this.input.wasJustPressed('reset');

        return { throttle, brake, steer, handbrake, resetRequested };
    }
}
