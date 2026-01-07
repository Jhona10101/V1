import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUserStore } from '@/store/user.store';
import { getUserProfile } from '@/services/api/firestore';

export const useAuthListener = () => {
  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      try {
        if (firebaseUser) {
          // Usuario autenticado en Firebase. Ahora buscamos su perfil en Firestore.
          setLoading(true);
          const userProfile = await getUserProfile(firebaseUser.uid);
          
          if (isMounted) {
            if (userProfile) {
              setUser(userProfile);
            } else {
              // Caso borde: usuario existe en Auth pero no en Firestore.
              // Aquí podrías redirigir a una página de finalización de registro.
              setUser(null);
            }
            setLoading(false);
          }
        } else {
          // No hay usuario autenticado.
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error in auth listener:', error);
          setLoading(false);
        }
      }
    });

    // Limpiar el listener cuando el componente se desmonte.
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setUser, setLoading]);
};