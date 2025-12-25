import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUserStore } from '@/store/user.store';
import { getUserProfile } from '@/services/api/firestore';

export const useAuthListener = () => {
  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado en Firebase. Ahora buscamos su perfil en Firestore.
        setLoading(true);
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // Caso borde: usuario existe en Auth pero no en Firestore.
          // Aquí podrías redirigir a una página de finalización de registro.
          setUser(null);
        }
        setLoading(false);
      } else {
        // No hay usuario autenticado.
        setUser(null);
        setLoading(false);
      }
    });

    // Limpiar el listener cuando el componente se desmonte.
    return () => unsubscribe();
  }, [setUser, setLoading]);
};