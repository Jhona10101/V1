// ...existing code...
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useUserStore } from '@/store/user.store';
import { getUserProfile } from '@/services/api/firestore';
import { UserRole } from '@/types';
import { 
  Mail, 
  Lock, 
  Dumbbell, 
  ArrowRight, 
  ChevronDown, 
  ShieldCheck,
  Chrome,
  User
} from 'lucide-react';

export const Login = () => {
  const { setUser } = useUserStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('client');

  const handleSocialLogin = async (providerName: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    try {
      const provider = providerName === 'google' 
        ? new GoogleAuthProvider() 
        : new OAuthProvider('apple.com');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Verificar si el usuario ya existe en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || 'Usuario',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'client',
          assignedCoachId: '',
          anthropometricDataId: '',
          oneRmSheetId: '',
          personalSheetId: ''
        });
      }

      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setUser(userProfile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(`Error al iniciar con ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
             const userProfile = await getUserProfile(auth.currentUser.uid);
             if (userProfile) setUser(userProfile);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Lógica de seguridad: Forzar rol de admin solo para el correo maestro
        // El resto de usuarios se registran con el rol seleccionado (client/coach)
        let finalRole = role;
        if (email === 'adminvmetrix@vmetriq.com') {
          finalRole = 'admin';
        }

        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email,
          firstName,
          lastName,
          role: finalRole,
          ...(finalRole === 'coach' ? { assignedClientIds: [] } : {}),
          ...(finalRole === 'client' ? { assignedCoachId: '', anthropometricDataId: '', oneRmSheetId: '', personalSheetId: '' } : {}),
          ...(finalRole === 'admin' ? { gymId: 'gym-demo-v1' } : {}),
        });

        await updateProfile(newUser, {
          displayName: `${firstName} ${lastName}`
        });

        const userProfile = await getUserProfile(newUser.uid);
        if (userProfile) setUser(userProfile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError('Correo o contraseña incorrectos.');
      else if (err.code === 'auth/email-already-in-use') setError('Este correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña es muy débil.');
      else setError('Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans selection:bg-emerald-500/30 overflow-hidden text-white">
      {/* Soft background orbs — subtle, centered */}
      <div className="absolute -z-10 inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full max-h-[900px]">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[420px] rounded-full bg-gradient-to-br from-emerald-600/6 via-emerald-500/6 to-transparent blur-3xl opacity-70" />
          <div className="absolute left-1/3 bottom-1/4 -translate-x-1/2 w-[540px] h-[340px] rounded-full bg-gradient-to-tr from-blue-500/6 via-indigo-500/6 to-transparent blur-3xl opacity-60" />
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        {/* Card */}
        <div className="mx-auto bg-white/4 border border-white/8 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-300 shadow-lg ring-1 ring-white/10">
              <Dumbbell className="w-10 h-10 text-black/85" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">V‑METRIQ</h1>
              <p className="text-sm text-zinc-300 uppercase tracking-widest mt-1">Performance Labs</p>
            </div>
          </div>

          {/* Subtitle */}
          <div className="mb-6 text-center">
            <h2 className="text-lg font-medium text-zinc-100">{isLogin ? 'Inicia Sesión' : 'Crea tu Perfil'}</h2>
            <p className="text-sm text-zinc-400 mt-1">{isLogin ? 'Accede con tus credenciales o usa un inicio rápido.' : 'Regístrate y comienza tu viaje de rendimiento.'}</p>
          </div>

          {/* Social buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/6 border border-white/6 hover:bg-white/10 transition text-sm"
              aria-label="Iniciar con Google"
            >
              <Chrome className="w-5 h-5 text-white/90" />
              <span className="text-white/90 font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin('apple')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/6 border border-white/6 hover:bg-white/10 transition text-sm"
              aria-label="Iniciar con Apple"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.05 20.28c-.98.95-2.05 1.72-3.2 1.72-1.15 0-1.53-.72-2.86-.72-1.33 0-1.78.72-2.86.72-1.08 0-2.13-.73-3.2-1.72C3.13 18.5 1 15 1 11.22c0-3.66 2.37-5.58 4.7-5.58 1.23 0 2.22.75 3 1.2.78.45 1.63 1.05 2.3 1.05.67 0 1.52-.6 2.3-1.05.78-.45 1.77-1.2 3-1.2 2.33 0 4.7 1.92 4.7 5.58 0 3.78-2.13 7.28-3.95 9.06zM15.1 4.5c-.83.8-2.12 1.32-3.1 1.32-.23-1.55.45-3.05 1.35-4.05.88-.98 2.33-1.63 3.1-1.63.22 1.6-.45 3.53-1.35 4.36z"/>
              </svg>
              <span className="text-white/90 font-medium">Apple</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-x-0 top-1/2 border-t border-white/6" />
            <span className="relative bg-slate-900 px-3 text-xs text-zinc-400 uppercase tracking-wide">O vía email</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nombre</label>
                  <input
                    required
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Apellido</label>
                  <input
                    required
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full mt-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                  placeholder="atleta@v-metriq.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contraseña</label>
                {isLogin && (
                  <button type="button" className="text-sm text-zinc-300 hover:text-emerald-400 font-semibold transition">Recuperar</button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rol</label>
                <div className="relative mt-1">
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="client">Atleta / Cliente</option>
                    <option value="coach">Coach Pro</option>
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-600/10 border border-red-500/20 text-red-300 text-sm p-3 rounded-lg text-center font-medium">
                {String(error)}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-900 font-semibold tracking-wider shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-200 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-sm">{isLogin ? 'INICIAR ENTRENAMIENTO' : 'CREAR PERFIL'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-900" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-zinc-300 hover:text-white transition px-3 py-2 rounded-full"
            >
              {isLogin ? '¿No tienes cuenta? Comienza ahora' : '¿Ya eres miembro? Identifícate'}
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 opacity-70">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/3 rounded-full border border-white/6">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span className="text-xs font-semibold tracking-wider text-zinc-300">ENCRYPTION ACTIVE</span>
            </div>
            <p className="text-zinc-400 text-xs">&copy; 2024 V‑METRIQ TECHNOLOGY GROUP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// ...existing code...