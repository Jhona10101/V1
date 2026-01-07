# Implementación de Ejercicios Cardiovasculares - Estado Actual

## ✅ Completado

### 1. Tipos de Datos (types/index.ts)
- ✅ Interfaz `BaseExercise` con propiedades comunes
- ✅ Interfaz `StrengthExercise` para ejercicios de fuerza
- ✅ Interfaz `CardioExercise` para ejercicios cardiovasculares
- ✅ Interfaz `RoutineExerciseSession` para ejercicios en rutinas
- ✅ Interfaz `CardioExercisePerformed` para sesiones realizadas
- ✅ Interfaz `CardioExerciseHistory` para historial

### 2. Servicios Firestore (services/api/firestore.ts)
- ✅ `saveCardioExerciseSession()` - Guardar sesión de cardio
- ✅ `getCardioExerciseHistory()` - Obtener historial
- ✅ `addCardioFeedback()` - Agregar feedback del coach
- ✅ `getCardioStats()` - Obtener estadísticas

### 3. Componentes Cardio Creados
- ✅ `CardioExerciseForm.tsx` - Formulario para crear/editar ejercicios cardio
- ✅ `CardioSessionTracker.tsx` - Tracker con timer para cliente
- ✅ `CardioHistoryFeedback.tsx` - Mostrar historial y feedback

### 4. Actualización ExerciseLibrary.tsx
- ✅ Modal de selección de tipo (Fuerza vs Cardio)
- ✅ Integración de CardioExerciseForm para cardio
- ✅ Interfaz ExerciseMachine actualizada para soportar ambos tipos

## 🔄 En Progreso / Pendiente

### 5. Completar ExerciseLibrary.tsx
**Estado:** Parcialmente completado

**Qué falta:**
- Filtrar lista de ejercicios por tipo
- Mostrar iconos diferentes para fuerza vs cardio
- Actualizar displayed fields según tipo
- Testear guardado en BD

**Archivo:** `src/app/(dashboard)/admin/ExerciseLibrary.tsx`

**Cambios necesarios:**
```typescript
// En el grid de ejercicios, agregar:
const strengthExercises = exercises.filter(e => e.type === 'strength' || !e.type);
const cardioExercises = exercises.filter(e => e.type === 'cardio');

// Mostrar tabs para filtrar por tipo
// Mostrar campos específicos según tipo
```

### 6. Actualizar RoutineDesigner.tsx
**Archivo:** `src/app/(dashboard)/coach/RoutineDesigner.tsx`

**Cambios necesarios:**
1. Actualizar interfaz `RoutineExercise` para incluir campos cardio
2. Agregar selector de tipo al agregar ejercicio
3. Mostrar formulario específico según tipo
4. Permitir guardar campos cardio en la rutina

**Pseudo-código:**
```typescript
// Al agregar ejercicio, mostrar selector:
// - Ejercicio de Fuerza (sets, reps, weight, etc.)
// - Ejercicio Cardiovascular (duration, intensity)

// Guardar ambos tipos en la misma estructura
```

### 7. Actualizar ClientDashboard.tsx
**Archivo:** `src/app/(dashboard)/client/ClientDashboard.tsx`

**Cambios necesarios:**
1. Importar `CardioSessionTracker` y `CardioHistoryFeedback`
2. Detectar tipo de ejercicio
3. Mostrar componente específico
4. Manejar submit de sesión cardio
5. Guardar en BD con `saveCardioExerciseSession()`

**Pseudo-código:**
```typescript
// En la sección de rutina semanal:
if (exercise.exerciseType === 'cardio') {
  return <CardioSessionTracker 
    exercise={exercise}
    plannedDuration={exercise.duration}
    plannedIntensity={exercise.intensity}
    onComplete={handleCardioComplete}
  />;
}
```

### 8. Actualizar ClientTrainingProgress.tsx
**Archivo:** `src/app/(dashboard)/coach/ClientTrainingProgress.tsx`

**Cambios necesarios:**
1. Agregar sección para ver cardio realizado
2. Mostrar `CardioHistoryFeedback`
3. Permitir agregar feedback a cada sesión
4. Mostrar estadísticas de cardio

### 9. Testing e Integración
- [ ] Crear ejercicio cardio en ExerciseLibrary
- [ ] Agregar ejercicio cardio a rutina en RoutineDesigner
- [ ] Cliente realiza ejercicio en ClientDashboard
- [ ] Feedback aparece en ClientTrainingProgress
- [ ] Ajustes de UI/UX

## Flujo Completo Esperado

```
1. ADMIN - Crear Ejercicio Cardiovascular
   ExerciseLibrary.tsx
   ↓ (Guardar en BD)
   
2. COACH - Agregar a Rutina
   RoutineDesigner.tsx
   ↓ (Incluir en rutina semanal)
   
3. CLIENT - Realizar Ejercicio
   ClientDashboard.tsx → CardioSessionTracker
   ↓ (Enviar datos al coach)
   
4. COACH - Ver Feedback
   ClientTrainingProgress.tsx → CardioHistoryFeedback
   ↓ (Agregar comentarios)
   
5. CLIENT - Ver Feedback
   ClientDashboard.tsx → CardioHistoryFeedback
```

## Archivos Modificados

- `src/types/index.ts` ✅
- `src/services/api/firestore.ts` ✅
- `src/app/(dashboard)/admin/ExerciseLibrary.tsx` 🔄 (70% completo)
- `src/app/(dashboard)/coach/RoutineDesigner.tsx` ❌ (Sin empezar)
- `src/app/(dashboard)/client/ClientDashboard.tsx` ❌ (Sin empezar)
- `src/app/(dashboard)/coach/ClientTrainingProgress.tsx` ❌ (Sin empezar)

## Componentes Creados

- `src/features/cardio/components/CardioExerciseForm.tsx` ✅
- `src/features/cardio/components/CardioSessionTracker.tsx` ✅
- `src/features/cardio/components/CardioHistoryFeedback.tsx` ✅

## Notas Importantes

1. **Compatibilidad**: Los ejercicios de fuerza existentes deben funcionar sin cambios (usar type='strength' por defecto)

2. **Base de Datos**: Los documentos en `exercises` collection ahora tendrán campo `type` que indica 'strength' o 'cardio'

3. **Retroalimentación**: El flujo de feedback requiere que se guarde cada sesión completada y permita que el coach agregue comentarios

4. **UI Consistencia**: Usar colores:
   - Azul para Fuerza (Dumbbell icon)
   - Verde/Esmeralda para Cardio (Wind icon)

## Próximos Pasos

1. Completar ExerciseLibrary.tsx
2. Actualizar RoutineDesigner.tsx
3. Integrar en ClientDashboard.tsx
4. Agregar visualización en ClientTrainingProgress.tsx
5. Testing e iteraciones UI/UX

---
Actualizado: 4 de Enero de 2026
