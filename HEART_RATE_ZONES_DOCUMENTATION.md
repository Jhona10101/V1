# Sistema de Zonas de Frecuencia Cardíaca - Implementación

## Descripción General

Se ha implementado un completo sistema de cálculo y visualización de zonas de frecuencia cardíaca basado en la **Fórmula de Karvonen**. Este sistema calcula automáticamente las 6 zonas de entrenamiento cardiovascular basadas en dos parámetros principales:

- **FCMax (Frecuencia Cardíaca Máxima)** en ppm
- **FCRep (Frecuencia Cardíaca de Reposo)** en ppm

## Características Principales

### 1. Cálculo Automático de Zonas
Utiliza la fórmula de Karvonen:
```
FC = ((FCMax - FCRep) × %Intensidad) + FCRep
```

Esta fórmula es más precisa que la clásica (220 - edad) porque considera la frecuencia cardíaca de reposo individual.

### 2. Seis Zonas de Entrenamiento

| Zona | Intensidad | Tipo de Trabajo | Duración |
|------|------------|-----------------|----------|
| **A1** | 50-59% | Aeróbico de larga duración | A partir de 8 min. |
| **A2** | 60-69% | Aeróbico de media duración | 2-8 min. |
| **A3** | 70-79% | Aeróbico de corta duración | 45 seg. - 2 min. |
| **A4** | 80-89% | Mixto (Aeróbico-Anaeróbico) | Variable |
| **A5** | 90-94% | Anaeróbico láctico | Variable |
| **A6** | 95-100% | Anaeróbico aláctico (Velocidad) | Variable |

### 3. Interfaz Visual Mejorada

La tabla incluye:
- **Código de zona con colores** para identificación rápida
- **Rango de intensidad (%)** para cada zona
- **Rango de FCTrab (ppm)** mín y máx calculado
- **Tipo de trabajo cardiovascular** para cada zona
- **Duración recomendada** de los entrenamientos
- **Información de referencia** (FCMax, FCRep, Reserva FC)
- **Leyenda de clasificación** (Intensiva vs Extensiva)

### 4. Integración en la Ficha de Atleta

La tabla aparece automáticamente en la pestaña **"Tests Físicos"** de la ficha de cada atleta cuando:
1. Se selecciona el tipo de atleta (Sedentario o Deportista)
2. Se ingresa la Frecuencia Cardíaca de Reposo (FCRep)
3. Se proporciona FCMax (calculada automáticamente o medida en test)

## Archivos Creados

### 1. Hook de Cálculo
**Archivo:** `src/features/heart-rate-zones/hooks/useHeartRateZones.ts`

Exporta:
- `useHeartRateZones(fcMax: number, fcRep: number): HeartRateZone[]`
- Interface `HeartRateZone` con datos de cada zona

**Funcionalidad:**
- Calcula todas las 6 zonas automáticamente
- Valida que FCMax > FCRep
- Retorna valores redondeados (números enteros)

### 2. Componente de Tabla
**Archivo:** `src/features/heart-rate-zones/components/HeartRateZonesTable.tsx`

**Características:**
- Tabla responsiva con scroll horizontal en móviles
- Colores diferenciados por zona (azul, cian, verde, amarillo, naranja, rojo)
- Información de referencia en panel superior
- Leyenda de clasificación en panel inferior
- Estado vacío con mensaje de instrucciones

### 3. Integración en ClientDetail
**Archivo:** `src/app/(dashboard)/admin/ClientDetail.tsx`

**Cambios:**
- Importa `useHeartRateZones` y `HeartRateZonesTable`
- Calcula dinámicamente las zonas basadas en datos ingresados
- Muestra tabla cuando hay datos válidos de FCMax y FCRep

## Cómo Usar

### Paso 1: Acceder a la Ficha de Atleta
1. Navega al panel de Admin
2. Selecciona un cliente
3. Ve a la pestaña "Tests Físicos"

### Paso 2: Ingresar Datos
En la sección **"Frecuencia Cardíaca"**:
1. Selecciona el tipo de atleta:
   - **Sedentario:** FCMax se calcula (default 200 ppm)
   - **Deportista:** Ingresa FCMax medida en test
2. Ingresa **FCRep (Frecuencia Cardíaca de Reposo)**

### Paso 3: Ver Tabla
La tabla de zonas aparecerá automáticamente con:
- Los 6 rangos de frecuencia cardíaca
- Tipo de trabajo recomendado
- Duración de sesiones

### Paso 4: Guardar (Opcional)
Puedes guardar los datos haciendo click en "Guardar Resultados"

## Ejemplo Práctico

**Datos de un atleta sedentario:**
- FCMax: 200 ppm
- FCRep: 60 ppm
- Reserva FC: 140 ppm

**Tabla generada:**
| Zona | Intensidad | FCTrab Min | FCTrab Max | Tipo |
|------|------------|-----------|-----------|------|
| A1   | 50-59%     | 130       | 142       | Aeróbico larga duración |
| A2   | 60-69%     | 144       | 157       | Aeróbico media duración |
| A3   | 70-79%     | 158       | 171       | Aeróbico corta duración |
| A4   | 80-89%     | 172       | 185       | Mixto |
| A5   | 90-94%     | 186       | 192       | Anaeróbico láctico |
| A6   | 95-100%    | 193       | 200       | Anaeróbico aláctico |

## Referencias Científicas

La **Fórmula de Karvonen** fue desarrollada por Veikko Karvonen en 1957 y es considerada más precisa que la fórmula edad-predeterminada porque:

1. **Personalización:** Considera la FCRep individual del atleta
2. **Precisión:** Mejor aproximación al 70-80% del VO2Max
3. **Aplicabilidad:** Válida para todo rango de edades y niveles de entrenamiento

## Notas Técnicas

- Los valores de ppm se redondean al número entero más cercano
- La tabla requiere ambos valores (FCMax y FCRep) para mostrar datos
- Funciona en modo responsivo (desktop, tablet, móvil)
- Los colores de las zonas facilitan la identificación rápida
- Estilos Tailwind CSS para coherencia visual con la aplicación

## Futuras Mejoras

1. Exportar tabla a PDF
2. Histórico de cambios en zonas (evolución)
3. Gráfico visual de zonas superpuestas
4. Integración con entrenamientos programados
5. Alertas si FCRep aumenta (posible sobreentrenamiento)
6. Cálculo de FCMax a partir de test (Cooper, 1 minuto, etc.)

---

**Implementado:** 4 de Enero de 2026
**Versión:** 1.0
