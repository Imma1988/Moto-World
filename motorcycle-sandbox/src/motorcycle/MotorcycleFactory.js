import { Motorcycle } from './Motorcycle.js';
import { DefaultMotorcycleData } from './MotorcycleData.js';

// Ponto único de criação de motas. Nesta fase só existe um perfil de
// dados (DefaultMotorcycleData), mas isolar a criação aqui evita que o
// Game precise de conhecer MotorcycleData directamente, e prepara o
// terreno para múltiplas motas na FASE 6.
export const MotorcycleFactory = {
    createDefault(scene, physicsWorld, world, input, events, spawnPoint) {
        return new Motorcycle(scene, physicsWorld, world, input, events, spawnPoint, DefaultMotorcycleData);
    },
};
