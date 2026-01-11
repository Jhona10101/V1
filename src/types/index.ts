// Roles de Usuario
export type UserRole = 'admin' | 'coach' | 'client';

// Interfaz Base para todos los usuarios
export interface BaseUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePictureUrl?: string;
}

// Interfaces específicas por rol
export interface Admin extends BaseUser {
  role: 'admin';
  gymId: string;
}

export interface Coach extends BaseUser {
  role: 'coach';
  assignedClientIds: string[]; // Array de UIDs de clientes asignados
}

export interface Client extends BaseUser {
  role: 'client';
  assignedCoachId: string; // UID del entrenador asignado
  phone?: string;
  height?: number;
  weight?: number;
  age?: number;
  goal?: string;
}

// --- Fichas Técnicas ---

// Ficha 1: Antropométrica
export interface AnthropometricRecord {
  id: string; // Timestamp en ISO format
  weightKg: number;
  heightCm: number;
  tricepsSkinfold: number;
  subscapularSkinfold: number;
  bicepsSkinfold: number;
  suprailiacSkinfold: number;
  // Resultados calculados (se guardan para histórico)
  imc: number;
  bodyFatPercentage: number;
  leanMassKg: number;
}

export interface AnthropometricSheet {
  sheetId: string;
  clientId: string;
  history: AnthropometricRecord[];
}

// Ficha 2: 1RM (Fuerza Máxima)
export interface OneRmRecord {
  exerciseId: string; // ID del ejercicio
  exerciseName: string; // Nombre del ejercicio para referencia
  oneRmKg: number; // 1RM calculado o ingresado
  method: 'calculated' | 'manual'; // Método utilizado
  // Si es calculated:
  weightUsedKg?: number; // Peso utilizado en el test
  repsPerformed?: number; // Repeticiones realizadas
  calculationDate: string; // ISO format
  // Autores y sus cálculos individuales (para transparencia)
  calculations?: {
    brzycki: number;
    eppley: number;
    lander: number;
    mayhew: number;
    wathen: number;
    oConner: number;
    lombardi: number;
    average: number; // Promedio de todos
  };
}

export interface OneRmSheet {
  sheetId: string;
  clientId: string;
  records: OneRmRecord[];
}

// Ficha 3: Personal (Consolidado)
export interface PersonalSheet {
  sheetId: string;
  clientId: string;
  dateOfBirth: string; // ISO format
  gender: 'male' | 'female' | 'other';
  goals: string; // Texto libre con objetivos
  medicalNotes?: string;
}

// --- Ejercicios y Máquinas ---

// Tipo base para ejercicios
export type ExerciseType = 'strength' | 'cardio';

// Interfaz base para todos los ejercicios
export interface BaseExercise {
  id: string;
  title: string;
  type: ExerciseType;
  lastMaintenance: string; // ISO Date
  nextMaintenance: string; // ISO Date
  createdAt?: string; // ISO Date
  updatedAt?: string; // ISO Date
}

// Ejercicio de Fuerza
export interface StrengthExercise extends BaseExercise {
  type: 'strength';
  muscleGroup: string;
  machineName: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  defaultTempo: string; // Ej: "3-0-1-0"
  defaultSpeed: 'Baja' | 'Moderada' | 'Alta';
  defaultRestTime: number; // Segundos
  gifUrl?: string;
  videoUrl?: string;
}

// Ejercicio Cardiovascular
export interface CardioExercise extends BaseExercise {
  type: 'cardio';
  equipment: string; // Ej: "Cinta de Correr", "Bicicleta Estática", "Elíptica"
  defaultDuration: number; // Minutos
  defaultIntensity: 'Baja' | 'Moderada' | 'Alta'; // O número 1-10
  defaultRestTime: number; // Segundos entre series (si aplica)
  gifUrl?: string;
  videoUrl?: string;
}

// Unión de tipos de ejercicio
export type Exercise = StrengthExercise | CardioExercise;

// Ejercicio en una Rutina (puede ser de fuerza o cardio)
export interface RoutineExerciseSession {
  id: string; // ID único para la instancia en la rutina
  exerciseId: string; // ID referencia a la BD
  exerciseType: ExerciseType; // Para identificar tipo rápidamente
  name: string;
  // Campos para ejercicio de fuerza
  sets?: number;
  reps?: number;
  weight?: number;
  speed?: string;
  tempo?: string;
  // Campos para ejercicio cardiovascular
  duration?: number;
  intensity?: 'Baja' | 'Moderada' | 'Alta' | number;
  // Comunes
  restTime: number;
  notes?: string;
  gifUrl?: string;
  videoUrl?: string;
}

// Sesión de ejercicio cardiovascular realizada por el cliente
export interface CardioExercisePerformed {
  id: string; // ID único
  clientId: string;
  exerciseId: string;
  exerciseName: string;
  date: string; // ISO date
  time: string; // ISO time
  plannedDuration: number; // Minutos planeados
  actualDuration: number; // Minutos completados
  plannedIntensity: 'Baja' | 'Moderada' | 'Alta' | number;
  actualIntensity: 'Baja' | 'Moderada' | 'Alta' | number; // Lo que el cliente hizo
  notes?: string;
  feedback?: string; // Retroalimentación del coach
  coachId: string; // UID del entrenador
}

// Historial de ejercicio cardio
export interface CardioExerciseHistory {
  clientId: string;
  exercises: CardioExercisePerformed[];
}