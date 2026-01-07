const defaultCalculatedData = {
    percentFat: 0, fatMass: 0, boneMass: 0, residualMass: 0, muscleMass: 0, leanMass: 0, idealWeight: 0,
    bmi: 0, icc: 0, cormic: 0, wingspanDiff: 0, wingspanText: '', endomorphy: 0, mesomorphy: 0, ectomorphy: 0, xCoord: 0, yCoord: 0,
    activityLevel: 'Sedentario', weight: 0, height: 0, sittingHeight: 0, armSpan: 0, sex: 'Masculino',
    skinfoldTriceps: 0, skinfoldSubscapular: 0, skinfoldSupraspinale: 0, skinfoldAbdominal: 0, skinfoldCalf: 0,
    breadthWrist: 0, breadthElbow: 0, breadthKnee: 0,
    girthArm: 0, girthCalf: 0, girthWaist: 0, girthHip: 0,
};

export const calculateAnthropometricData = (data: any) => {
  if (!data || Object.keys(data).length === 0) {
    return defaultCalculatedData;
  }

  const val = (key: string) => parseFloat(data[key]) || 0;

  const weight = val('weight');
  const height = val('height');
  const sittingHeight = val('sittingHeight');
  const armSpan = val('armSpan');
  const sex = data.sex || 'Masculino';
  const activityLevel = data.activityLevel || 'Sedentario';

  // Pliegues (mm)
  const tri = val('skinfoldTriceps');
  const sub = val('skinfoldSubscapular');
  const sup = val('skinfoldSupraspinale');
  const abd = val('skinfoldAbdominal');
  const calfSk = val('skinfoldCalf');

  // Diámetros (cm) -> convertir a metros para fórmulas
  const wrist_m = val('breadthWrist') / 100;
  const knee_m = val('breadthKnee') / 100; // Femur
  const height_m = height / 100;

  // Perímetros (cm)
  const armGirth = val('girthArm');
  const calfGirth = val('girthCalf');
  const waist = val('girthWaist');
  const hip = val('girthHip');

  // --- CÁLCULOS ---

  // 1. % Grasa (Fórmula Faulkner: 4 pliegues)
  const sum4 = tri + sub + sup + abd;
  const percentFat = sum4 > 0 ? (sum4 * 0.153 + 5.78) : 0;

  // 2. Peso Grasa (PG)
  const fatMass = weight * (percentFat / 100);

  // 3. Peso Óseo (PO) - Fórmula Rocha
  let boneMass = 0;
  if (height_m > 0 && wrist_m > 0 && knee_m > 0) {
    boneMass = 3.02 * Math.pow((Math.pow(height_m, 2) * wrist_m * knee_m * 400), 0.712);
  }

  // 4. Peso Residual (PR) - Fórmula Wurch
  const residualCoeff = sex === 'Femenino' ? 0.209 : 0.241;
  const residualMass = weight * residualCoeff;

  // 5. Peso Muscular (PM) - Por fraccionamiento
  const muscleMass = weight - (fatMass + boneMass + residualMass);

  // 6. Masa Corporal Magra (MCM)
  const leanMass = weight - fatMass;

  // 7. Peso Ideal (PI) - Fórmula basada en MCM
  let idealWeight = 0;
  if (leanMass > 0) {
    const factor = activityLevel === 'Deportista' ? 1.12 : 1.15;
    idealWeight = leanMass * factor;
  }

  // 8. IMC
  const bmi = height_m > 0 ? weight / (height_m * height_m) : 0;
  
  // 9. ICC (Cintura/Cadera)
  const icc = hip > 0 ? waist / hip : 0;

  // 10. Índice Córmico
  const cormic = height > 0 ? (sittingHeight / height) * 100 : 0;
  
  // 11. Talla vs Envergadura (texto, no para gráfico)
  let wingspanText = '';
  if (height > 0 && armSpan > 0) {
    const diff = armSpan - height;
    if (Math.abs(diff) < 1) wingspanText = 'Proporcionada';
    else if (armSpan > height) wingspanText = `+${diff.toFixed(1)} cm`;
    else wingspanText = `${diff.toFixed(1)} cm`;
  }
  const wingspanDiff = armSpan > 0 && height > 0 ? armSpan - height : 0;


  // --- SOMATOTIPO (Heath-Carter) ---
  const sum3Skinfolds = tri + sub + sup;
  const correctedSum3 = height > 0 ? sum3Skinfolds * (170.18 / height) : 0;
  const endoRaw = -0.7182 + (0.1451 * correctedSum3) - (0.00068 * Math.pow(correctedSum3, 2)) + (0.0000014 * Math.pow(correctedSum3, 3));
  const endomorphy = Math.max(0.1, endoRaw);

  const correctedArmGirth = armGirth - (tri / 10);
  const correctedCalfGirth = calfGirth - (calfSk / 10);
  const mesoRaw = (0.858 * val('breadthElbow')) + (0.601 * val('breadthKnee')) + (0.188 * correctedArmGirth) + (0.161 * correctedCalfGirth) - (0.131 * height) + 4.5;
  const mesomorphy = Math.max(0.1, mesoRaw);

  const ponderalIndex = weight > 0 ? height / Math.pow(weight, 0.3333) : 0;
  let ectoRaw = 0.1;
  if (ponderalIndex >= 40.75) {
    ectoRaw = 0.732 * ponderalIndex - 28.58;
  } else if (ponderalIndex > 38.25) {
    ectoRaw = 0.463 * ponderalIndex - 17.63;
  } else {
    ectoRaw = 0.1;
  }
  const ectomorphy = Math.max(0.1, ectoRaw);
  
  // Coordenadas Somatocarta
  const xCoord = ectomorphy - endomorphy;
  const yCoord = 2 * mesomorphy - (endomorphy + ectomorphy);

  return {
    ...data,
    percentFat,
    fatMass,
    boneMass,
    residualMass,
    muscleMass,
    leanMass,
    idealWeight,
    bmi,
    icc,
    cormic,
    wingspanDiff,
    wingspanText,
    endomorphy,
    mesomorphy,
    ectomorphy,
    xCoord,
    yCoord,
  };
};
