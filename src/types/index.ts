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
  anthropometricDataId: string;
  oneRmSheetId: string;
  personalSheetId: string;
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
  exerciseId: string; // ID del ejercicio (e.g., 'bench-press')
  maxWeightKg: number;
  date: string; // ISO format
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