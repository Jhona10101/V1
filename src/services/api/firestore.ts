import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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