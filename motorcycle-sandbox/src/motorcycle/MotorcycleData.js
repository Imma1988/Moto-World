/**
 * MotorcycleData - Configurações da primeira mota
 * Valores ajustáveis para comportamento físico arcade
 */

export const MotorcycleData = {
    // Identificação
    name: "Starter Bike",
    
    // Física básica
    mass: 180,                    // kg - massa do chassis
    wheelMass: 15,                // kg - massa de cada roda
    
    // Performance
    maxSpeed: 35,                 // m/s (~126 km/h)
    acceleration: 8,              // m/s² - força de aceleração
    braking: 12,                  // m/s² - força de travagem
    reverseSpeed: 5,              // m/s - velocidade máxima em marcha-atrás
    
    // Direção e controlo
    steering: 0.8,                // ângulo máximo de direção (radianos)
    steeringSpeed: 3.0,           // velocidade de rotação do guiador
    minSteeringSpeed: 0.3,        // fator mínimo de direção a baixa velocidade
    maxSteeringSpeed: 1.0,        // fator máximo de direção
    
    // Aderência
    grip: 2.5,                    // aderência lateral em estrada
    offroadGrip: 1.2,             // aderência em off-road
    brakeGrip: 1.8,               // aderência durante travagem
    
    // Suspensão
    suspensionStrength: 35,       // rigidez da suspensão
    suspensionDamping: 8,         // amortecimento da suspensão
    suspensionRestLength: 0.4,    // comprimento em repouso (metros)
    travelMin: 0.15,              // curso mínimo da suspensão
    travelMax: 0.55,              // curso máximo da suspensão
    
    // Equilíbrio e inclinação
    balanceAssist: 4.0,           // força de assistência de equilíbrio
    balanceDamping: 2.0,          // amortecimento do equilíbrio
    maxLeanAngle: 0.7,            // ângulo máximo de inclinação (radianos ~40°)
    leanSpeed: 2.5,               // velocidade de inclinação
    
    // Controlo no ar
    airControl: 0.6,              // fator de controlo quando no ar
    airRotation: 1.5,             // velocidade de rotação no ar
    gravityMultiplier: 1.0,       // multiplicador de gravidade
    
    // Dimensões (para visual e colisores)
    length: 2.2,                  // metros
    width: 0.8,                   // metros
    height: 1.1,                  // metros
    wheelbase: 1.4,               // distância entre eixos (metros)
    wheelRadius: 0.32,            // raio das rodas (metros)
    
    // Centro de massa
    centerOfMassY: 0.5,           // altura do centro de massa
    centerOfMassZ: 0.0,           // offset Z do centro de massa
    
    // Estados e thresholds
    crashThreshold: 1.2,          // ângulo para considerar crash (radianos)
    landingVelocityThreshold: 12, // velocidade de aterragem segura (m/s)
    respawnDelay: 1500,           // ms antes de permitir respawn após crash
    
    // Cores (visual procedural)
    colors: {
        body: 0xcc3333,           // vermelho
        tank: 0x222222,           // preto escuro
        seat: 0x111111,           // preto
        wheels: 0x333333,         // cinzento escuro
        forks: 0xcccccc,          // prateado
        engine: 0x555555,         // cinzento médio
        exhaust: 0x888888,        // cinzento claro
        headlight: 0xffffcc       // amarelo claro
    }
};

// Dados para futuras motas (estrutura preparada)
export const MotorcycleDatabase = [
    MotorcycleData
];

/**
 * Obtém dados de uma mota por índice ou nome
 */
export function getMotorcycleData(indexOrName = 0) {
    if (typeof indexOrName === 'number') {
        return MotorcycleDatabase[indexOrName] || MotorcycleDatabase[0];
    }
    const found = MotorcycleDatabase.find(m => m.name === indexOrName);
    return found || MotorcycleDatabase[0];
}
