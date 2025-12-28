import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
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
export const getClientSheet = async (clientId: string, sheetName: 'anthropometry' | 'onerm') => {
  try {
    const sheetRef = doc(db, 'users', clientId, 'sheets', sheetName);
    const sheetSnap = await getDoc(sheetRef);
    return sheetSnap.exists() ? sheetSnap.data() : null;
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    return null;
  }
};

/**
 * Guarda o actualiza una ficha específica.
 */
export const saveClientSheet = async (clientId: string, sheetName: 'anthropometry' | 'onerm', data: any) => {
  try {
    const sheetRef = doc(db, 'users', clientId, 'sheets', sheetName);
    await setDoc(sheetRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error(`Error saving ${sheetName}:`, error);
    throw error;
  }
};