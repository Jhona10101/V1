/**
 * Hook para calcular las zonas de frecuencia cardíaca usando la fórmula de Karvonen
 * FC Trabajo = ((FCMax - FCRep) × Intensidad%) + FCRep
 */

export interface HeartRateZone {
  zone: string;
  zoneCode: string;
  minIntensity: number;
  maxIntensity: number;
  minBpm: number;
  maxBpm: number;
  description: string;
  trainingType: string;
  duration: string;
  direction: string;
}

export const useHeartRateZones = (fcMax: number, fcRep: number): HeartRateZone[] => {
  if (!fcMax || !fcRep || fcMax <= fcRep) {
    return [];
  }

  // Fórmula de Karvonen: FC = ((FCMax - FCRep) × %Intensidad) + FCRep
  const calculateFCForIntensity = (intensity: number): number => {
    return Math.round(((fcMax - fcRep) * (intensity / 100)) + fcRep);
  };

  const zones: HeartRateZone[] = [
    {
      zone: 'A1',
      zoneCode: 'A1',
      minIntensity: 50,
      maxIntensity: 59,
      minBpm: calculateFCForIntensity(50),
      maxBpm: calculateFCForIntensity(59),
      description: 'Larga duración',
      trainingType: 'Aeróbico de larga duración',
      duration: 'A partir de los 8 min.',
      direction: 'Larga duración',
    },
    {
      zone: 'A2',
      zoneCode: 'A2',
      minIntensity: 60,
      maxIntensity: 69,
      minBpm: calculateFCForIntensity(60),
      maxBpm: calculateFCForIntensity(69),
      description: 'Media duración',
      trainingType: 'Aeróbico de media duración',
      duration: '2 min. a 8 min.',
      direction: 'Media duración',
    },
    {
      zone: 'A3',
      zoneCode: 'A3',
      minIntensity: 70,
      maxIntensity: 79,
      minBpm: calculateFCForIntensity(70),
      maxBpm: calculateFCForIntensity(79),
      description: 'Corta duración',
      trainingType: 'Aeróbico de corta duración',
      duration: '45 s. a 2 min.',
      direction: 'Corta duración',
    },
    {
      zone: 'A4',
      zoneCode: 'A4',
      minIntensity: 80,
      maxIntensity: 89,
      minBpm: calculateFCForIntensity(80),
      maxBpm: calculateFCForIntensity(89),
      description: 'Mixto',
      trainingType: 'Aeróbico - Anaeróbico',
      duration: '',
      direction: 'Mixto',
    },
    {
      zone: 'A5',
      zoneCode: 'A5',
      minIntensity: 90,
      maxIntensity: 94,
      minBpm: calculateFCForIntensity(90),
      maxBpm: calculateFCForIntensity(94),
      description: 'Lactato',
      trainingType: 'Anaeróbico láctico',
      duration: '',
      direction: 'Lactato',
    },
    {
      zone: 'A6',
      zoneCode: 'A6',
      minIntensity: 95,
      maxIntensity: 100,
      minBpm: calculateFCForIntensity(95),
      maxBpm: calculateFCForIntensity(100),
      description: 'Velocidad',
      trainingType: 'Anaeróbico aláctico',
      duration: '',
      direction: 'Velocidad',
    },
  ];

  return zones;
};
