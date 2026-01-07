import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, writeBatch, arrayUnion, arrayRemove, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Admin, Coach, Client } from '@/types';

type UserProfile = Admin | Coach | Client;

/**
 * Obtiene el perfil de un usuario desde la colección 'users' de Firestore.
 * @param uid El ID de usuario de Firebase Auth.
 * @returns El perfil del usuario o null si no existe.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/**
 * Obtiene una lista de perfiles de clientes asignados a un entrenador específico.
 * @param coachId El UID del entrenador.
 * @returns Una promesa que se resuelve con un array de perfiles de clientes.
 */
export const getAssignedClients = async (coachId: string): Promise<Client[]> => {
  try {
    // 1. Apuntamos a la colección 'users'.
    const usersRef = collection(db, 'users');
    
    // 2. Creamos una consulta que filtra por 'role' y 'assignedCoachId'.
    const q = query(
      usersRef, 
      where("role", "==", "client"), 
      where("assignedCoachId", "==", coachId)
    );

    // 3. Ejecutamos la consulta.
    const querySnapshot = await getDocs(q);

    // 4. Mapeamos los resultados al tipo 'Client'.
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
      // Usamos type casting asumiendo que los datos son correctos.
      clients.push(doc.data() as Client); 
    });

    return clients;
  } catch (error) {
    console.error("Error fetching assigned clients:", error);
    // En una app real, manejarías este error de forma más elegante.
    return []; 
  }
};

/**
 * Obtiene todos los usuarios registrados en la plataforma (Admin, Coach, Client).
 * Útil para el dashboard de administrador.
 */
export const getAllUsers = async (): Promise<(Admin | Coach | Client)[]> => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    const users: (Admin | Coach | Client)[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as (Admin | Coach | Client));
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

/**
 * Actualiza los datos de un usuario (Datos Personales).
 */
export const updateUser = async (uid: string, data: Partial<Admin | Coach | Client>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Asigna un cliente a un entrenador.
 * Actualiza ambos documentos en una sola operación (batch).
 */
export const assignClientToCoach = async (coachId: string, clientId: string) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Actualizar el cliente: asignar el ID del coach
    const clientRef = doc(db, 'users', clientId);
    batch.update(clientRef, { assignedCoachId: coachId });

    // 2. Actualizar el coach: agregar el ID del cliente al array
    const coachRef = doc(db, 'users', coachId);
    batch.update(coachRef, { assignedClientIds: arrayUnion(clientId) });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error assigning client:", error);
    throw error;
  }
};

/**
 * Elimina la asignación de un cliente a un entrenador.
 */
export const removeClientFromCoach = async (coachId: string, clientId: string) => {
  try {
    const batch = writeBatch(db);
    
    const clientRef = doc(db, 'users', clientId);
    batch.update(clientRef, { assignedCoachId: '' });

    const coachRef = doc(db, 'users', coachId);
    batch.update(coachRef, { assignedClientIds: arrayRemove(clientId) });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error removing client:", error);
    throw error;
  }
};

/**
 * Obtiene una ficha específica (antropometría o 1rm) de una subcolección del usuario.
 */
export const getClientSheet = async (clientId: string, sheetName: 'anthropometry' | 'onerm' | 'physicalTests') => {
  try {
    // Para antropometría, obtenemos el registro más reciente del historial para mostrarlo.
    if (sheetName === 'anthropometry') {
      const historyCollectionRef = collection(db, 'users', clientId, 'anthropometryHistory');
      const q = query(historyCollectionRef, orderBy('savedAt', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      return null;
    }
    // Para otras fichas, se mantiene la lógica original.
    const sheetRef = doc(db, 'users', clientId, 'sheets', sheetName);
    const sheetSnap = await getDoc(sheetRef);
    return sheetSnap.exists() ? sheetSnap.data() : null;
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    return null;
  }
};

/**
 * Obtiene el historial completo de fichas de antropometría de un cliente.
 */
export const getAnthropometryHistory = async (clientId: string): Promise<any[]> => {
  try {
    const historyCollectionRef = collection(db, 'users', clientId, 'anthropometryHistory');
    const q = query(historyCollectionRef, orderBy('savedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error(`Error fetching anthropometry history:`, error);
    return [];
  }
};

/**
 * Guarda o actualiza una ficha específica.
 */
export const saveClientSheet = async (clientId: string, sheetName: 'anthropometry' | 'onerm' | 'physicalTests', data: any, savedBy?: { uid: string, name: string }) => {
  try {
    // Para antropometría, siempre creamos un nuevo registro en el historial.
    if (sheetName === 'anthropometry' && savedBy) {
      const cleanAnthroData: { [key: string]: any } = {};
      const numericKeys = [
        'weight', 'height', 'sittingHeight', 'armSpan', 
        'skinfoldTriceps', 'skinfoldSubscapular', 'skinfoldSupraspinale', 'skinfoldAbdominal', 'skinfoldCalf',
        'breadthWrist', 'breadthElbow', 'breadthKnee',
        'girthArm', 'girthCalf', 'girthWaist', 'girthHip', 'age'
      ];

      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value === undefined) return; // Ignorar completamente los campos no definidos

        if (numericKeys.includes(key)) {
          // Para campos numéricos, intentar convertir a número. Si no es válido (ej. ''), guardar null.
          const parsed = parseFloat(value);
          cleanAnthroData[key] = isNaN(parsed) ? null : parsed;
        } else {
          // Para campos de texto (sex, activityLevel), guardar null si está vacío.
          cleanAnthroData[key] = value === '' ? null : value;
        }
      });

      const historyCollectionRef = collection(db, 'users', clientId, 'anthropometryHistory');
      const historySnapshot = await getDocs(historyCollectionRef);
      const recordName = `Registro ${historySnapshot.size + 1}`;
      const newRecordRef = doc(historyCollectionRef);

      await setDoc(newRecordRef, {
        ...cleanAnthroData,
        id: newRecordRef.id,
        name: recordName,
        savedAt: new Date(),
        savedBy: savedBy,
      });
    } else {
      // Para otras fichas, mantenemos la lógica de sobreescritura con limpieza genérica.
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === '') {
          cleanData[key] = null;
        }
      });
      const sheetRef = doc(db, 'users', clientId, 'sheets', sheetName);
      await setDoc(sheetRef, { ...cleanData, updatedAt: new Date() }, { merge: true });
    }
  } catch (error) {
    console.error(`Error saving ${sheetName}:`, error);
    throw error;
  }
};

/**
 * Elimina un registro de historial de antropometría de un cliente.
 */
export const deleteAnthropometryRecord = async (clientId: string, recordId: string): Promise<void> => {
  try {
    const recordRef = doc(db, 'users', clientId, 'anthropometryHistory', recordId);
    await deleteDoc(recordRef);
  } catch (error) {
    console.error("Error deleting anthropometry record:", error);
    throw error;
  }
};

// --- CARDIO SESSIONS WITH CYCLES ---

interface CycleFeedback {
  cycleId: number;
  plannedIntensity: number;
  plannedTime: number;
  intensityMet: boolean;
  timeCompleted: boolean;
}

/**
 * Guarda una sesión completa de cardio, incluyendo el feedback detallado de cada ciclo.
 * @param clientId El ID del cliente que realizó la sesión.
 * @param coachId El ID del entrenador asignado al cliente.
 * @param exercise Un objeto con el ID y el nombre del ejercicio.
 * @param feedback Un array con el feedback de cada ciclo completado.
 * @returns El ID de la sesión guardada.
 */
export const saveCardioSessionWithCycles = async (
  clientId: string,
  coachId: string,
  exercise: { id: string; name: string },
  feedback: CycleFeedback[]
): Promise<string> => {
  try {
    const sessionCollectionRef = collection(db, 'users', clientId, 'cardioSessions');
    const newSessionRef = doc(sessionCollectionRef);
    
    const sessionData = {
      id: newSessionRef.id,
      clientId,
      coachId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      createdAt: new Date(),
      cycleFeedback: feedback,
    };

    await setDoc(newSessionRef, sessionData);
    
    return newSessionRef.id;
  } catch (error) {
    console.error("Error saving cardio session with cycles:", error);
    throw error;
  }
};

// Backwards-compatible alias: older code imports `saveCardioExerciseSession`.
export const saveCardioExerciseSession = saveCardioSessionWithCycles;

/**
 * Obtiene el historial de sesiones de cardio (con ciclos) de un cliente.
 * @param clientId El ID del cliente.
 * @returns Una promesa que se resuelve con un array de sesiones de cardio.
 */
export const getCardioSessionsHistory = async (clientId: string): Promise<any[]> => {
  try {
    const historyRef = collection(db, 'users', clientId, 'cardioSessions');
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    const sessions: any[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data());
    });
    
    return sessions;
  } catch (error) {
    console.error("Error fetching cardio sessions history:", error);
    return [];
  }
};


// ===== FUNCIONES PARA 1RM =====

/**
 * Calcula el 1RM usando todas las fórmulas de los autores y retorna el promedio
 */
export const calculate1RMAverage = (weightKg: number, reps: number): { [key: string]: number; average: number } => {
  // Evitar divisiones por cero o valores inválidos
  if (weightKg <= 0 || reps <= 0) return { average: 0, brzycki: 0, eppley: 0, lander: 0, mayhew: 0, wathen: 0, oConner: 0, lombardi: 0 };

  // 1. Brzycki: 1MR = kg × 100 / (102,78 - 2,78 × Rep)
  const brzycki = (weightKg * 100) / (102.78 - 2.78 * reps);

  // 2. Eppley: 1MR = (1 + 0,033 × Rep) × Kg
  const eppley = (1 + 0.033 * reps) * weightKg;

  // 3. Lander: % 1MR = 101,3 - 2,67123 × Rep → 1MR = kg × 100 / (101,3 - 2,67123 × Rep)
  const lander = (weightKg * 100) / (101.3 - 2.67123 * reps);

  // 4. Mayhew: % 1MR = 52,2 + 41,9 × e^(-0,055 × Rep) → 1MR = 100 × kg / %1MR
  const mayhewPercent = 52.2 + 41.9 * Math.exp(-0.055 * reps);
  const mayhew = (100 * weightKg) / mayhewPercent;

  // 5. Wathen: % MR = 48,8 + 53,8 × e^(-0,075 × Rep) → 1MR = 100 × kg / %1MR
  const wathenPercent = 48.8 + 53.8 * Math.exp(-0.075 * reps);
  const wathen = (100 * weightKg) / wathenPercent;

  // 6. O'Conner: 1MR = Peso × (1 + 0,025 × Rep)
  const oConner = weightKg * (1 + 0.025 * reps);

  // 7. Lombardi: 1 MR = Kg × (Rep)^0,1
  const lombardi = weightKg * Math.pow(reps, 0.1);

  // Calcular promedio
  const average = (brzycki + eppley + lander + mayhew + wathen + oConner + lombardi) / 7;

  return {
    brzycki: Math.round(brzycki * 100) / 100,
    eppley: Math.round(eppley * 100) / 100,
    lander: Math.round(lander * 100) / 100,
    mayhew: Math.round(mayhew * 100) / 100,
    wathen: Math.round(wathen * 100) / 100,
    oConner: Math.round(oConner * 100) / 100,
    lombardi: Math.round(lombardi * 100) / 100,
    average: Math.round(average * 100) / 100
  };
};

/**
 * Guarda un registro de 1RM para un cliente
 */
export const saveOneRmRecord = async (clientId: string, record: any) => {
  try {
    const recordsRef = collection(db, `users/${clientId}/oneRmRecords`);
    const newRecordRef = doc(recordsRef);
    
    await setDoc(newRecordRef, {
      ...record,
      calculationDate: new Date().toISOString()
    });
    
    return newRecordRef.id;
  } catch (error) {
    console.error("Error saving 1RM record:", error);
    throw error;
  }
};

/**
 * Obtiene todos los registros 1RM de un cliente
 */
export const getOneRmRecords = async (clientId: string): Promise<any[]> => {
  try {
    const recordsRef = collection(db, `users/${clientId}/oneRmRecords`);
    const snapshot = await getDocs(recordsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting 1RM records:", error);
    return [];
  }
};

/**
 * Actualiza un registro 1RM existente
 */
export const updateOneRmRecord = async (clientId: string, recordId: string, updates: any) => {
  try {
    const recordRef = doc(db, `users/${clientId}/oneRmRecords`, recordId);
    await updateDoc(recordRef, updates);
  } catch (error) {
    console.error("Error updating 1RM record:", error);
    throw error;
  }
};

/**
 * Obtiene o crea el 1RM para un ejercicio específico
 */
export const getOneRmForExercise = async (clientId: string, exerciseId: string): Promise<any | null> => {
  try {
    const recordsRef = collection(db, `users/${clientId}/oneRmRecords`);
    const q = query(recordsRef, where('exerciseId', '==', exerciseId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error("Error getting 1RM for exercise:", error);
    return null;
  }
};
