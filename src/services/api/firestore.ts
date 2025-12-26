// ... (importaciones existentes y la función getUserProfile)
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Client } from '@/types'; // Asegúrate de importar el tipo Client

// ... (función getUserProfile existente)

/**
 * Obtiene una lista de perfiles de clientes asignados a un entrenador específico.
 * @param trainerId El UID del entrenador.
 * @returns Una promesa que se resuelve con un array de perfiles de clientes.
 */
export const getAssignedClients = async (trainerId: string): Promise<Client[]> => {
  try {
    // 1. Apuntamos a la colección 'users'.
    const usersRef = collection(db, 'users');
    
    // 2. Creamos una consulta que filtra por 'role' y 'assignedTrainerId'.
    const q = query(
      usersRef, 
      where("role", "==", "client"), 
      where("assignedTrainerId", "==", trainerId)
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