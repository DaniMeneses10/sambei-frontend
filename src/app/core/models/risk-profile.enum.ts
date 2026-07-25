// Refleja Sambei.Domain.Enum.RiskProfile — mismos valores numéricos.
export enum RiskProfile {
    Conservador = 0,
    Basico = 1,
    Arriesgado = 2
}

export interface RiskProfileOption {
    value: RiskProfile;
    label: string;
    description: string;
    example: string;
}

// Copy completa (con ejemplo concreto) para que elegir sea una decisión, no una pregunta abierta —
// pedido explícito: "dar opciones, no salir con preguntas tontas".
export const RISK_PROFILE_OPTIONS: RiskProfileOption[] = [
    {
        value: RiskProfile.Conservador,
        label: 'Conservador',
        description: 'Preferís estabilidad antes que rendimiento. Menos sobresaltos, menos vaivén.',
        example: 'Ejemplo: mayormente ETFs diversificados (VOO, QQQ), poco o nada en acciones individuales o crypto.'
    },
    {
        value: RiskProfile.Basico,
        label: 'Básico',
        description: 'Un balance entre crecimiento y estabilidad — ni todo seguro, ni todo arriesgado.',
        example: 'Ejemplo: ETFs como base, con una porción menor en acciones individuales o Bitcoin.'
    },
    {
        value: RiskProfile.Arriesgado,
        label: 'Arriesgado',
        description: 'Buscás mayor crecimiento y tolerás más volatilidad en el camino.',
        example: 'Ejemplo: más peso en acciones individuales y crypto, aunque sea menos diversificado.'
    }
];
