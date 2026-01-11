import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Client, Admin, Coach } from '@/types';
import { ArrowLeft, Save, Edit2, User, Mail, Phone, Calendar, Weight, Activity, FileText, CheckCircle2, AlertTriangle, Ruler, Dumbbell, Timer, ClipboardList, Calculator, Layers, BarChart, Filter, TrendingUp, Trash2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getClientSheet, saveClientSheet, getAnthropometryHistory, deleteAnthropometryRecord } from '@/services/api/firestore';
import { useUserStore } from '@/store/user.store';
import { calculateAnthropometricData } from '@/features/anthropometry/hooks/useAnthropometricCalculations';
import { useHeartRateZones } from '@/features/heart-rate-zones/hooks/useHeartRateZones';
import { HeartRateZonesTable } from '@/features/heart-rate-zones/components/HeartRateZonesTable';
import { OneRmSheet } from '@/components/features/OneRmSheet';

interface ClientDetailProps {
  client: Client;
  allUsers: (Admin | Coach | Client)[];
  onBack: () => void;
  readOnly?: boolean;
  onUpdate?: () => void;
}

type TabType = 'personal' | 'anthropometry' | 'onerm' | 'tests';

// --- COMPONENTE AUXILIAR (DEFINIDO FUERA PARA EVITAR PÉRDIDA DE FOCO) ---
const handleEnterKey = (e: any) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const inputs = Array.from(document.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'));
    const index = inputs.indexOf(e.currentTarget);
    if (index > -1 && index < inputs.length - 1) {
      (inputs[index + 1] as HTMLElement).focus();
    }
  }
};

const RenderField = ({ label, name, type = "text", icon: Icon, state, onChange, options, suffix, isEditing }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </label>
    {isEditing ? (
      options ? (
        <select
          name={name}
          value={state[name] || ''}
          onChange={onChange}
          onKeyDown={handleEnterKey}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none transition-colors appearance-none"
        >
          <option value="">Seleccionar</option>
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type}
            name={name}
            value={state[name] || ''}
            onChange={onChange}
            onKeyDown={handleEnterKey}
            step="0.1"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
          />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span>}
        </div>
      )
    ) : (
      <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/50 text-slate-200 min-h-[38px] flex items-center text-sm">
        {state[name] ? (
          <>
            {options ? (options.find((o: any) => o.value === state[name])?.label || state[name]) : state[name]}
            {suffix && <span className="text-slate-500 ml-1 text-xs">{suffix}</span>}
          </>
        ) : <span className="text-slate-600 italic">--</span>}
      </div>
    )}
  </div>
);

// --- COMPONENTE GRÁFICO SOMATOCARTA ---
const Somatochart = ({ points }: { points: {x: number, y: number, name: string, color: string }[] }) => {
  const width = 320;
  const height = 320;
  const centerX = width / 2;
  const centerY = height * 0.65;
  const scale = 10;
  const yShift = 2 * scale;

  const p1 = { x: centerX, y: centerY - 12 * scale - yShift };
  const p2 = { x: centerX + 11 * scale, y: centerY + 9 * scale - yShift };
  const p3 = { x: centerX - 11 * scale, y: centerY + 9 * scale - yShift };

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const R = Math.sqrt(dx*dx + dy*dy);

  const gridLines = [];
  for (let i = -14; i <= 14; i += 1) {
    gridLines.push(<line key={`v-${i}`} x1={centerX + i * scale} y1={0} x2={centerX + i * scale} y2={height} stroke="#334155" strokeWidth="0.5" opacity="0.3" />);
  }
  for (let i = -14; i <= 14; i += 1) {
    gridLines.push(<line key={`h-${i}`} x1={0} y1={centerY + i * scale} x2={width} y2={centerY + i * scale} stroke="#334155" strokeWidth="0.5" opacity="0.3" />);
  }

  return (
    <div className="flex flex-col items-center bg-slate-900/50 p-6 rounded-xl border border-slate-800 w-full">
      <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500" /> Somatocarta (Gráfico)</h4>
      <div className="relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <g>{gridLines}</g>
          <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="#475569" strokeWidth="1" />
          <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="#475569" strokeWidth="1" />
          <line x1={centerX} y1={centerY} x2={p2.x} y2={p2.y} stroke="white" strokeWidth="1.5" opacity="0.8" />
          <line x1={centerX} y1={centerY} x2={p3.x} y2={p3.y} stroke="white" strokeWidth="1.5" opacity="0.8" />
          <line x1={centerX} y1={centerY} x2={p1.x} y2={p1.y} stroke="white" strokeWidth="1.5" opacity="0.8" />
          <path 
            d={`M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y} A ${R} ${R} 0 0 1 ${p3.x} ${p3.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`} 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgb(139 92 246 / 0.7)"
            strokeWidth="2" 
          />
          <text x={p1.x} y={p1.y - 15} textAnchor="middle" className="text-[10px] fill-emerald-400 font-bold uppercase tracking-widest">Mesomorfo</text>
          <text x={p3.x - 20} y={p3.y + 5} textAnchor="end" className="text-[10px] fill-blue-400 font-bold uppercase tracking-widest">Endomorfo</text>
          <text x={p2.x + 20} y={p2.y + 5} textAnchor="start" className="text-[10px] fill-orange-400 font-bold uppercase tracking-widest">Ectomorfo</text>
          
          {points.map((point, index) => {
            const plotX = centerX + point.x * scale;
            const plotY = centerY - point.y * scale - yShift;
            return (
              <g key={index} className="pointer-events-none">
                <circle cx={plotX} cy={plotY} r="6" fill={point.color} stroke="#fff" strokeWidth="2" className="animate-pulse" />
                <text x={plotX} y={plotY - 12} textAnchor="middle" className="text-[10px] fill-white font-bold bg-black/50 px-1 rounded-sm">
                  {point.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  );
};

// --- COMPONENTE DE RESULTADOS CALCULADOS ---
const CalculatedResults = ({ data }: { data: any }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="mt-8 text-center text-slate-500 py-10 bg-slate-900/50 rounded-xl border border-slate-800">
        <h4 className="font-bold text-slate-300 text-base flex items-center justify-center gap-2"><Calculator className="w-5 h-5 text-emerald-500" /> Resultados Calculados</h4>
        <p className="text-sm mt-4">Aún no hay datos para realizar el análisis.</p>
        <p className="text-xs mt-1">Completa y guarda la ficha para ver los resultados.</p>
      </div>
    );
  }

  const {
    percentFat, fatMass, boneMass, residualMass, muscleMass, leanMass, idealWeight,
    bmi, icc, cormic, wingspanText, endomorphy, mesomorphy, ectomorphy, xCoord, yCoord,
    activityLevel, weight
  } = calculateAnthropometricData(data);

  let bmiClass = '';
  let bmiColor = 'text-slate-500';
  if (bmi < 18.5) { bmiClass = 'Bajo Peso'; bmiColor = 'text-blue-400'; }
  else if (bmi < 25) { bmiClass = 'Normal'; bmiColor = 'text-emerald-400'; }
  else if (bmi < 30) { bmiClass = 'Sobrepeso'; bmiColor = 'text-yellow-400'; }
  else { bmiClass = 'Obesidad'; bmiColor = 'text-red-500'; }

  let iccClass = '';
  let iccColor = 'text-slate-500';
  const sex = data.sex || 'Masculino';
  if (sex === 'Masculino') {
    if (icc < 0.95) { iccClass = 'Bajo Riesgo'; iccColor = 'text-emerald-400'; }
    else if (icc <= 1.0) { iccClass = 'Riesgo Moderado'; iccColor = 'text-yellow-400'; }
    else { iccClass = 'Alto Riesgo'; iccColor = 'text-red-500'; }
  } else {
    if (icc < 0.80) { iccClass = 'Bajo Riesgo'; iccColor = 'text-emerald-400'; }
    else if (icc <= 0.85) { iccClass = 'Riesgo Moderado'; iccColor = 'text-yellow-400'; }
    else { iccClass = 'Alto Riesgo'; iccColor = 'text-red-500'; }
  }

  let cormicClass = '';
  if (cormic <= 51) cormicClass = 'Braquicórmico (Tronco corto)';
  else if (cormic <= 53) cormicClass = 'Metriocórmico (Medio)';
  else cormicClass = 'Macrocórmico (Tronco largo)';

  const ResultRow = ({ label, value, unit, subtext, color = "text-white", subtextColor = "text-slate-500", isLarge = false }: any) => (
    <div className="flex justify-between items-center p-2 border-b border-slate-800/50 last:border-0">
      <span className="text-xs text-slate-400 font-medium uppercase">{label}</span>
      <div className="text-right">
        <div className={`font-bold font-mono ${color}`}>{value} <span className="text-[10px] text-slate-500">{unit}</span></div>
        {subtext && <div className={`${isLarge ? 'text-xs font-black uppercase tracking-wider mt-1' : 'text-[10px]'} ${subtextColor}`}>{subtext}</div>}
      </div>
    </div>
  );

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 p-0 overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-white text-sm">Composición Corporal Estimada</h3>
          </div>
          <div className="p-4 space-y-1">
            <ResultRow label="% Grasa (%G)" value={typeof percentFat === 'number' ? percentFat.toFixed(1) : '--'} unit="%" color="text-yellow-400" />
            <ResultRow label="Peso Grasa (PG)" value={typeof fatMass === 'number' ? fatMass.toFixed(1) : '--'} unit="kg" />
            <ResultRow label="Masa Magra (MCM)" value={typeof leanMass === 'number' ? leanMass.toFixed(1) : '--'} unit="kg" color="text-emerald-400" />
            <ResultRow label="Peso Muscular (PM)" value={typeof muscleMass === 'number' ? muscleMass.toFixed(1) : '--'} unit="kg" />
            <ResultRow label="Peso Óseo (PO)" value={typeof boneMass === 'number' ? boneMass.toFixed(1) : '--'} unit="kg" />
            <ResultRow label="Peso Residual (PR)" value={typeof residualMass === 'number' ? residualMass.toFixed(1) : '--'} unit="kg" />
            <ResultRow label="Peso Total (PT)" value={typeof weight === 'number' ? weight.toFixed(1) : '--'} unit="kg" />
            <ResultRow label="Peso Ideal (PI)" value={typeof idealWeight === 'number' ? idealWeight.toFixed(1) : '--'} unit="kg" subtext={`MCM x ${activityLevel === 'Deportista' ? '1.12' : '1.15'} (${activityLevel})`} />
          </div>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 p-0 overflow-hidden h-fit">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-white text-sm">Índices de Salud y Proporción</h3>
          </div>
          <div className="p-4 space-y-1">
            <ResultRow label="IMC" value={typeof bmi === 'number' ? bmi.toFixed(1) : '--'} unit="" subtext={bmiClass} subtextColor={bmiColor} isLarge={true} color={bmi > 25 ? "text-yellow-400" : "text-white"} />
            <ResultRow label="ICC (Cintura/Cadera)" value={typeof icc === 'number' ? icc.toFixed(2) : '--'} unit="" subtext={iccClass} subtextColor={iccColor} isLarge={true} />
            <ResultRow label="Índice Córmico" value={typeof cormic === 'number' ? cormic.toFixed(1) : '--'} unit="" subtext={cormicClass} />
            <div className="flex justify-between items-center p-2 border-b border-slate-800/50 last:border-0">
              <span className="text-xs text-slate-400 font-medium uppercase">Talla vs Envergadura</span>
              <div className="text-right text-xs font-bold text-white">{wingspanText || '--'}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-slate-900/50 border-slate-800 p-0 overflow-hidden h-fit">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-white text-sm">Estudio de Somatotipo</h3>
          </div>
          <div className="p-4 space-y-1">
            <ResultRow label="Endomorfia" value={typeof endomorphy === 'number' ? endomorphy.toFixed(2) : '--'} unit="" color="text-blue-400" isLarge={true} />
            <ResultRow label="Mesomorfia" value={typeof mesomorphy === 'number' ? mesomorphy.toFixed(2) : '--'} unit="" color="text-emerald-400" isLarge={true} />
            <ResultRow label="Ectomorfia" value={typeof ectomorphy === 'number' ? ectomorphy.toFixed(2) : '--'} unit="" color="text-orange-400" isLarge={true} />
          </div>
        </Card>
        <div className="md:col-span-2">
          <Somatochart points={[{ x: xCoord, y: yCoord, name: 'Actual', color: '#f59e0b' }]} />
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA DE ESTADÍSTICAS ANTROPOMÉTRICAS ---
const AnthropometryStatistics = ({ clientId, onBack }: { clientId: string, onBack: () => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedParam, setSelectedParam] = useState<string>('weight');

  const PARAM_GROUPS = [
    {
      label: 'Generales',
      options: [
        { value: 'weight', label: 'Peso Corporal (kg)' },
        { value: 'bmi', label: 'Índice de Masa Corporal (IMC)' },
        { value: 'idealWeight', label: 'Peso Ideal (kg)' },
      ]
    },
    {
      label: 'Composición Corporal',
      options: [
        { value: 'percentFat', label: '% Grasa Corporal (Estimado)' },
        { value: 'fatMass', label: 'Masa Grasa (kg)' },
        { value: 'leanMass', label: 'Masa Magra (MCM) (kg)' },
        { value: 'muscleMass', label: 'Masa Muscular (kg)' },
      ]
    },
    {
      label: 'Índices y Proporciones',
      options: [
        { value: 'icc', label: 'Índice Cintura/Cadera (ICC)' },
        { value: 'cormic', label: 'Índice Córmico' },
        { value: 'wingspanDiff', label: 'Diferencia Talla/Envergadura (cm)'},
      ]
    },
    {
      label: 'Pliegues (mm)',
      options: [
        { value: 'skinfoldTriceps', label: 'Tríceps' },
        { value: 'skinfoldSubscapular', label: 'Subescapular' },
        { value: 'skinfoldSupraspinale', label: 'Supraespinal' },
        { value: 'skinfoldAbdominal', label: 'Abdominal' },
        { value: 'skinfoldCalf', label: 'Pierna (Medial)' },
      ]
    },
    {
      label: 'Perímetros (cm)',
      options: [
        { value: 'girthArm', label: 'Brazo' },
        { value: 'girthCalf', label: 'Pierna' },
        { value: 'girthWaist', label: 'Cintura' },
        { value: 'girthHip', label: 'Cadera' },
      ]
    },
    {
      label: 'Diámetros (cm)',
      options: [
        { value: 'breadthWrist', label: 'Muñeca' },
        { value: 'breadthElbow', label: 'Codo' },
        { value: 'breadthKnee', label: 'Rodilla' },
      ]
    },
    {
      label: 'Somatotipo',
      options: [
        { value: 'endomorphy', label: 'Endomorfia' },
        { value: 'mesomorphy', label: 'Mesomorfia' },
        { value: 'ectomorphy', label: 'Ectomorfia' },
      ]
    }
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const data = await getAnthropometryHistory(clientId);
      const formattedData = data.map(d => {
        const record = {...d, savedAt: d.savedAt?.toDate ? d.savedAt.toDate() : new Date(d.savedAt) };
        return calculateAnthropometricData(record);
      });

      setHistory(formattedData);
      if (formattedData.length > 0) {
        setSelectedIds(formattedData.slice(0, Math.min(3, formattedData.length)).map((r: any) => r.id));
      }
      setLoading(false);
    };
    fetchHistory();
  }, [clientId]);

  const handleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      await deleteAnthropometryRecord(clientId, deletingId);
      setHistory(prev => prev.filter(h => h.id !== deletingId));
      setSelectedIds(prev => prev.filter(id => id !== deletingId));
      setDeletingId(null);
    } catch (error) {
      console.error("Failed to delete record:", error);
    }
  };

  const selectedRecords = history.filter(h => selectedIds.includes(h.id)).sort((a, b) => a.savedAt - b.savedAt);
  const currentParamLabel = PARAM_GROUPS.flatMap(g => g.options).find(p => p.value === selectedParam)?.label || selectedParam;
  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];
  const somatoPoints = selectedRecords.map((record, index) => ({
    x: record.xCoord,
    y: record.yCoord,
    name: record.name,
    color: chartColors[index % chartColors.length]
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-900/50 border-2 border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mt-6">Confirmar Eliminación</h3>
            <p className="text-slate-400 mt-2 text-sm">
              ¿Estás seguro de que quieres eliminar este registro de forma permanente? Esta acción no se puede deshacer.
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={() => setDeletingId(null)}
                className="px-6 py-2 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas y Evolución</h1>
          <p className="text-slate-400 text-sm">Analiza el progreso antropométrico del atleta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-slate-900/50 border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-emerald-400">
              <Filter className="w-5 h-5" />
              <h3 className="font-bold text-white">1. Escoger Parámetro</h3>
            </div>
            <select 
              value={selectedParam} 
              onChange={(e) => setSelectedParam(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            >
              {PARAM_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 flex-1">
            <div className="flex items-center gap-2 mb-4 text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-white">2. Seleccionar Registros</h3>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <ClipboardList className="w-12 h-12 mx-auto text-slate-600" />
                  <h4 className="mt-4 text-md font-semibold text-slate-300">No Hay Registros</h4>
                  <p className="text-sm text-slate-500 mt-1">Cuando guardes una ficha antropométrica, aparecerá aquí para que puedas analizar la evolución.</p>
                </div>
              ) : history.map(record => (
                <div 
                  key={record.id} 
                  className={`p-3 border rounded-lg transition-all flex items-center gap-3 cursor-pointer group ${selectedIds.includes(record.id) ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  onClick={() => handleSelection(record.id)}
                >
                  <input 
                    type="checkbox" 
                    readOnly
                    checked={selectedIds.includes(record.id)} 
                    className="w-5 h-5 rounded-md bg-slate-700 border-slate-600 text-emerald-500 focus:ring-0 focus:ring-offset-0 pointer-events-none"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{record.name || `Registro del ${new Date(record.savedAt).toLocaleDateString()}`}</p>
                    <p className="text-xs text-slate-400">{new Date(record.savedAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                    <p className="text-xs text-slate-500 mt-1">Guardado por: {record.savedBy?.name || 'N/A'}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(record.id);
                      }}
                      className="p-2 rounded-full text-slate-500 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                      aria-label="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800 h-full min-h-[400px] p-6">
            <div className="flex items-center gap-2 mb-6 text-purple-400">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-bold text-white text-lg">3. Comparativa: {currentParamLabel}</h3>
            </div>
            {selectedRecords.length > 1 ? (
              <svg width="100%" height="300" viewBox="0 0 500 300">
                {(() => {
                  const values = selectedRecords.map(r => parseFloat(r[selectedParam]) || 0);
                  const maxValue = Math.max(...values, 1) * 1.1;
                  const barWidth = 40;
                  const containerWidth = 500;
                  const totalSpacing = containerWidth - (selectedRecords.length * barWidth);
                  const barSpacing = totalSpacing / (selectedRecords.length + 1);

                  const points = selectedRecords.map((record, index) => {
                    const value = parseFloat(record[selectedParam]) || 0;
                    const barHeight = Math.max((value / maxValue) * 220, 0);
                    const x = barSpacing + index * (barWidth + barSpacing);
                    const y = 250 - barHeight;
                    return { x, y, value, record, barHeight };
                  });

                  const linePoints = points.map(p => `${p.x + barWidth / 2},${p.y}`).join(' ');

                  return (
                    <g>
                      {points.map((p, index) => (
                        <g key={p.record.id} className="group">
                          <rect
                            x={p.x}
                            y={p.y}
                            width={barWidth}
                            height={p.barHeight}
                            fill={chartColors[index % chartColors.length]}
                            className="transition-opacity opacity-70 group-hover:opacity-100"
                            rx="4"
                          />
                          <text x={p.x + barWidth / 2} y={p.y - 8} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{p.value.toFixed(1)}</text>
                          <text x={p.x + barWidth / 2} y={270} textAnchor="middle" fill="white" fontSize="10">{p.record.name}</text>
                           <text x={p.x + barWidth / 2} y={285} textAnchor="middle" fill="gray" fontSize="9">{new Date(p.record.savedAt).toLocaleDateString()}</text>
                        </g>
                      ))}
                      <polyline
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="2"
                        points={linePoints}
                        strokeDasharray="4 4"
                      />
                       {points.map((p, index) => (
                         <circle key={`c-${p.record.id}`} cx={p.x + barWidth/2} cy={p.y} r="4" fill="white" stroke={chartColors[index % chartColors.length]} strokeWidth="2" />
                       ))}
                    </g>
                  );
                })()}
              </svg>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                <BarChart className="w-12 h-12" />
                <p>Selecciona al menos 2 registros para ver la comparativa.</p>
              </div>
            )}
          </Card>
        </div>

        {selectedRecords.length > 0 && (
          <div className="lg:col-span-3 mt-6">
             <Somatochart points={somatoPoints} />
          </div>
        )}
      </div>
    </div>
  );
};

export const ClientDetail = ({ client, onBack, readOnly = false, onUpdate }: ClientDetailProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { user: currentUser } = useUserStore();

  const [personalData, setPersonalData] = useState<Partial<Client>>(client);
  const [anthroData, setAnthroData] = useState<any>({});
  const [onermData, setOnermData] = useState<any>({});
  const [testsData, setTestsData] = useState<any>({});

  useEffect(() => {
    setPersonalData(client);
  }, [client]);

  useEffect(() => {
    const loadData = async () => {
      if (!client.uid) return;
      try {
        if (activeTab === 'anthropometry') {
          const data = await getClientSheet(client.uid, 'anthropometry');
          setAnthroData(data || {});
        } else if (activeTab === 'onerm') {
          const data = await getClientSheet(client.uid, 'onerm');
          setOnermData(data || {});
        } else if (activeTab === 'tests') {
          const testsPromise = getClientSheet(client.uid, 'physicalTests');
          const anthroPromise = getClientSheet(client.uid, 'anthropometry');
          const [testsResult, anthroResult] = await Promise.all([testsPromise, anthroPromise]);
          setTestsData(testsResult || {});
          setAnthroData(anthroResult || {});
        }
      } catch (error) {
        console.error("Error loading sheet:", error);
      }
    };
    loadData();
    setIsEditing(false);
  }, [activeTab, client.uid]);

  if (showStats) {
    return <AnthropometryStatistics clientId={client.uid} onBack={() => setShowStats(false)} />;
  }

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalData(prev => ({ ...prev, [name]: value }));
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, setFunction: React.Dispatch<any>) => {
    const { name, value } = e.target;
    setFunction((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!client.uid) return;
    setLoading(true);
    try {
      if (activeTab === 'personal') {
        const userRef = doc(db, 'users', client.uid);
        const { uid, ...dataToUpdate } = personalData;
        Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);
        await updateDoc(userRef, dataToUpdate);
      } else if (activeTab === 'anthropometry') {
        const savedBy = {
          uid: currentUser?.uid || 'unknown',
          name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Sistema'
        };
        await saveClientSheet(client.uid, 'anthropometry', anthroData, savedBy);
        const latestData = await getClientSheet(client.uid, 'anthropometry');
        if (latestData) {
          setAnthroData(latestData);
        }
      } else if (activeTab === 'onerm') {
        await saveClientSheet(client.uid, 'onerm', onermData);
      } else if (activeTab === 'tests') {
        // Prepare tests data
        let testsDataToSave = { ...testsData };
        if (anthroData.activityLevel === 'Sedentario') {
          const fcm = 220 - (personalData.age || 0); // Default FCM for sedentary
          testsDataToSave = { ...testsDataToSave, fcm };
        }
        const saveTestsPromise = saveClientSheet(client.uid, 'physicalTests', testsDataToSave);

        // Prepare anthropometry data
        const savedBy = {
          uid: currentUser?.uid || 'unknown',
          name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Sistema'
        };
        const saveAnthroPromise = saveClientSheet(client.uid, 'anthropometry', anthroData, savedBy);

        await Promise.all([saveTestsPromise, saveAnthroPromise]);
      }
      
      setNotification({ type: 'success', message: 'Datos actualizados correctamente.' });
      setIsEditing(false);
      if (onUpdate && activeTab === 'personal') onUpdate();
    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: 'Error al actualizar los datos.' });
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap ${
        activeTab === id 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Ficha del Atleta</h1>
            <p className="text-slate-400 text-sm">Gestión integral del perfil deportivo.</p>
          </div>
        </div>
        
        {!readOnly && (
          <div className="flex gap-2">
            {activeTab === 'anthropometry' && !isEditing && (
              <button 
                  onClick={() => setShowStats(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                  <BarChart className="w-4 h-4" /> Ver Estadísticas
              </button>
            )}
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg font-bold flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Editar Datos
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton id="personal" label="Datos Personales" icon={User} />
        <TabButton id="anthropometry" label="Antropometría" icon={Ruler} />
        <TabButton id="onerm" label="1RM (Fuerza)" icon={Dumbbell} />
        <TabButton id="tests" label="Tests Físicos" icon={ClipboardList} />
      </div>

      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-[70] ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100' 
            : 'bg-red-950/90 border-red-500/30 text-red-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span className="font-medium text-sm tracking-wide">{notification.message}</span>
        </div>
      )}
      
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
          <Card className="md:col-span-1 space-y-6 h-fit">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500">
                {personalData.firstName?.[0]}{personalData.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{personalData.firstName} {personalData.lastName}</h3>
                <p className="text-sm text-slate-500 capitalize">{personalData.role}</p>
              </div>
            </div>
            <div className="space-y-4">
              <RenderField isEditing={isEditing} label="Nombre" name="firstName" icon={User} state={personalData} onChange={handlePersonalChange} />
              <RenderField isEditing={isEditing} label="Apellido" name="lastName" icon={User} state={personalData} onChange={handlePersonalChange} />
              <RenderField isEditing={isEditing} label="Email" name="email" type="email" icon={Mail} state={personalData} onChange={handlePersonalChange} />
              <RenderField isEditing={isEditing} label="Teléfono" name="phone" type="tel" icon={Phone} state={personalData} onChange={handlePersonalChange} />
            </div>
          </Card>
          <Card className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Activity className="w-5 h-5 text-emerald-500" /> Datos Básicos y Objetivos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <RenderField isEditing={isEditing} label="Edad" name="age" type="number" icon={Calendar} state={personalData} onChange={handlePersonalChange} />
              <RenderField isEditing={isEditing} label="Peso Actual (kg)" name="weight" type="number" icon={Weight} state={personalData} onChange={handlePersonalChange} />
              <RenderField isEditing={isEditing} label="Altura (cm)" name="height" type="number" icon={Activity} state={personalData} onChange={handlePersonalChange} />
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Objetivo Principal
                </label>
                {isEditing ? (
                  <textarea
                    name="goal"
                    value={personalData.goal || ''}
                    onChange={handlePersonalChange}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none transition-colors resize-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/50 text-slate-200 min-h-[80px]">
                    {personalData.goal || <span className="text-slate-600 italic">No especificado</span>}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'anthropometry' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <Card className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <User className="w-5 h-5 text-blue-500" /> Datos Básicos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <RenderField isEditing={isEditing} label="Sexo" name="sex" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} options={[{value: 'Masculino', label: 'Masculino'}, {value: 'Femenino', label: 'Femenino'}]} />
                <RenderField isEditing={isEditing} label="Nivel Actividad" name="activityLevel" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} options={[{value: 'Sedentario', label: 'Sedentario'}, {value: 'Deportista', label: 'Deportista'}]} />
                <RenderField isEditing={isEditing} label="Peso" name="weight" type="number" suffix="kg" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Estatura" name="height" type="number" suffix="cm" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Talla Sentado" name="sittingHeight" type="number" suffix="cm" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Envergadura" name="armSpan" type="number" suffix="cm" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Activity className="w-5 h-5 text-emerald-500" /> Pliegues Cutáneos (mm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <RenderField isEditing={isEditing} label="Tríceps" name="skinfoldTriceps" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Subescapular" name="skinfoldSubscapular" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Supraespinal" name="skinfoldSupraspinale" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Abdominal" name="skinfoldAbdominal" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Pierna (Medial)" name="skinfoldCalf" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Ruler className="w-5 h-5 text-purple-500" /> Diámetros Óseos (cm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <RenderField isEditing={isEditing} label="Muñeca" name="breadthWrist" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Codo" name="breadthElbow" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Rodilla" name="breadthKnee" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Ruler className="w-5 h-5 text-yellow-500" /> Perímetros (cm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <RenderField isEditing={isEditing} label="Brazo" name="girthArm" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Pierna" name="girthCalf" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Cintura" name="girthWaist" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
                <RenderField isEditing={isEditing} label="Cadera" name="girthHip" type="number" state={anthroData} onChange={(e: any) => handleSheetChange(e, setAnthroData)} />
              </div>
            </div>
          </Card>

          <CalculatedResults data={anthroData} />
        </div>
      )}

      {activeTab === 'onerm' && (
        <Card className="animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-purple-500" /> Récords Personales (1RM Estimado)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <RenderField isEditing={isEditing} label="Press Banca (kg)" name="benchPress" type="number" state={onermData} onChange={(e: any) => handleSheetChange(e, setOnermData)} />
            <RenderField isEditing={isEditing} label="Sentadilla (kg)" name="squat" type="number" state={onermData} onChange={(e: any) => handleSheetChange(e, setOnermData)} />
            <RenderField isEditing={isEditing} label="Peso Muerto (kg)" name="deadlift" type="number" state={onermData} onChange={(e: any) => handleSheetChange(e, setOnermData)} />
            <RenderField isEditing={isEditing} label="Press Militar (kg)" name="overheadPress" type="number" state={onermData} onChange={(e: any) => handleSheetChange(e, setOnermData)} />
            <RenderField isEditing={isEditing} label="Remo con Barra (kg)" name="barbellRow" type="number" state={onermData} onChange={(e: any) => handleSheetChange(e, setOnermData)} />
            <RenderField isEditing={isEditing} label="Dominadas (Lastre kg)" name="pullups" type="number" state={onermData} onChange={(e: any) => handleSheetChange(e, setOnermData)} />
          </div>
        </Card>
      )}

      {activeTab === 'tests' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Timer className="w-5 h-5 text-red-500" /> Evaluaciones de Rendimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <RenderField isEditing={isEditing} label="VO2 Max (ml/kg/min)" name="vo2max" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
              <RenderField isEditing={isEditing} label="Test de Cooper (metros)" name="cooper" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
              <RenderField isEditing={isEditing} label="Flexiones (1 min)" name="pushups" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
              <RenderField isEditing={isEditing} label="Abdominales (1 min)" name="situps" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
              <RenderField isEditing={isEditing} label="Salto Vertical (cm)" name="verticalJump" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
              <RenderField isEditing={isEditing} label="Plancha (segundos)" name="plank" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><BarChart className="w-5 h-5 text-blue-500" /> Frecuencia Cardiaca</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">Tipo de Atleta</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="activityLevel"
                      value="Sedentario"
                      checked={anthroData.activityLevel === 'Sedentario'}
                      onChange={(e) => handleSheetChange(e, setAnthroData)}
                      disabled={!isEditing}
                      className="form-radio h-4 w-4 text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                    />
                    <span className="text-white">Sedentario</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="activityLevel"
                      value="Deportista"
                      checked={anthroData.activityLevel === 'Deportista'}
                      onChange={(e) => handleSheetChange(e, setAnthroData)}
                      disabled={!isEditing}
                      className="form-radio h-4 w-4 text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                    />
                    <span className="text-white">Deportista</span>
                  </label>
                </div>
              </div>
              {anthroData.activityLevel === 'Sedentario' && (
                <RenderField
                  isEditing={false}
                  label="Frecuencia Cardiaca Máxima (FCM) (Calculado)"
                  name="fcm"
                  state={{ fcm: (220 - (personalData.age || 0)) }}
                  suffix="ppm"
                />
              )}
              {anthroData.activityLevel === 'Deportista' && (
                <RenderField isEditing={isEditing} label="Frecuencia Cardiaca (Test 1 min)" name="heartRate1Min" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
              )}
              <RenderField isEditing={isEditing} label="Frecuencia Cardiaca de Reposo (FCRep)" name="restingHeartRate" type="number" state={testsData} onChange={(e: any) => handleSheetChange(e, setTestsData)} />
            </div>
            
            {/* Tabla de Zonas de Frecuencia Cardíaca */}
            {(() => {
              let fcMax: number | null = null;
              let fcRep: number | null = null;
              
              if (anthroData.activityLevel === 'Sedentario') {
                fcMax = (220 - (personalData.age || 0));
              } else if (anthroData.activityLevel === 'Deportista' && testsData.heartRate1Min) {
                fcMax = parseInt(testsData.heartRate1Min);
              }
              
              if (testsData.restingHeartRate) {
                fcRep = parseInt(testsData.restingHeartRate);
              }
              
              const zones = fcMax && fcRep ? useHeartRateZones(fcMax, fcRep) : [];
              
              return <HeartRateZonesTable zones={zones} fcMax={fcMax || 0} fcRep={fcRep || 0} />;
            })()}
          </Card>
        </div>
      )}

      {activeTab === 'onerm' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
                <Dumbbell className="w-5 h-5 text-blue-500" /> Ficha de 1RM (Fuerza Máxima)
              </h3>
              <p className="text-sm text-slate-400 mt-4">Registra y calcula la máxima fuerza del cliente en cada ejercicio. Puedes calcular automáticamente usando 7 fórmulas científicas o ingresar el 1RM manualmente.</p>
            </div>
            <OneRmSheet clientId={client.uid} />
          </Card>
        </div>
      )}
    </div>
  );
};
