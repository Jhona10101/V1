import { create } from 'zustand';
import { Admin, Coach, Client } from '@/types';

type UserProfile = Admin | Coach | Client;

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true, // Empezamos en true hasta que Firebase verifique el estado
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}));```

---

### **Servicios de Datos (`/src/services/api`)**

Creamos una capa de abstracción (fachada) para todas las operaciones de Firestore. Esto desacopla la lógica de la UI de la implementación de la base de datos.

#### **`src/services/api/firestore.ts`**
```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Admin, Trainer, Client } from '@/types';

type UserProfile = Admin | Trainer | Client;

/**
 * Obtiene el perfil de un usuario desde la colección 'users' de Firestore.
 * @param uid El ID de usuario de Firebase Auth.
 * @returns El perfil del usuario o null si no existe.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    // Es crucial hacer un type casting aquí. Asumimos que los datos en Firestore
    // coinciden con nuestras interfaces de TypeScript.
    return userDocSnap.data() as UserProfile;
  } else {
    console.error("No user profile found in Firestore for UID:", uid);
    return null;
  }
};

// Aquí añadirías más funciones para interactuar con Firestore:
// export const getAnthropometricSheet = async (clientId: string) => { ... };
// export const updateWorkoutRoutine = async (clientId: string, routine: any) => { ... };