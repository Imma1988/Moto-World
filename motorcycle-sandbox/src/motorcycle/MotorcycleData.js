// Dados configuráveis da mota. Cada mota (no futuro, quando existirem
// várias) terá o seu próprio objecto de dados como este. Todos os valores
// estão em unidades SI (metros, segundos, kg, radianos) e podem ser
// afinados livremente sem tocar em MotorcyclePhysics.js.

export const DefaultMotorcycleData = {
    name: 'Street 250',

    // Corpo
    mass: 180, // kg
    wheelBase: 1.35, // distância entre eixo dianteiro e traseiro
    wheelRadius: 0.33,

    // Condução
    maxSpeed: 38, // m/s (~137 km/h)
    reverseMaxSpeed: 2.5,
    acceleration: 5200, // força de aceleração (N)
    braking: 9000, // força de travagem (N)
    handbrakeMultiplier: 1.8,

    steering: 2.4, // velocidade angular máxima de guiada (rad/s)
    steerResponsiveness: 6, // rapidez com que a direcção atinge a velocidade angular alvo
    leanAngle: Math.PI / 6, // ângulo máximo de inclinação (30°)

    // Aderência (0 = sem aderência lateral, 1 = aderência total)
    grip: 0.92,
    offroadGrip: 0.55,

    // Suspensão (por roda). suspensionStrength calibrado para que o peso
    // estático da mota comprima a mola apenas ~35-40% do curso total.
    suspensionRestLength: 0.42,
    suspensionTravel: 0.22,
    suspensionStrength: 11000, // rigidez da mola (N/m)
    suspensionDamping: 650, // amortecimento (N·s/m)

    // Equilíbrio. Valores de torque calibrados para a inércia aproximada
    // do collider do chassis — podem precisar de afinação depois de
    // testar no browser.
    balanceStrength: 320, // torque de correcção de inclinação
    balanceDamping: 55,
    airControlStrength: 30, // torque disponível no ar (bem mais fraco que balanceStrength)

    // Limites de segurança / crash
    crashTiltAngle: (75 * Math.PI) / 180,
    crashImpactSpeed: 13, // m/s de velocidade vertical de impacto
    respawnDelay: 2.0, // segundos após crash até respawn automático
};
