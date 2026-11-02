import React, { useState } from 'react';
import {
  Workstation,
  WorkstationEvaluation,
  OS_CATALOG,
  SOFTWARE_CATALOG,
  DIAGNOSIS_OPTIONS,
  EXPECTED_DIAGNOSIS_BY_WORKSTATION,
  CATEGORY_LABELS,
  SoftwareCategory,
} from '../data/auditScenario';
import {
  Monitor,
  Server,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Wrench,
  Plus,
  Trash2,
  KeyRound,
  Info,
} from 'lucide-react';
import { LicenseTooltip } from './LicenseTooltip';

interface OfficeAuditWorkbenchProps {
  workstations: Workstation[];
  evaluations: Record<string, WorkstationEvaluation>;
  selectedId: string;
  onSelectWorkstation: (id: string) => void;
  onUpdateOs: (wsId: string, newOsId: string) => void;
  onToggleSoftware: (wsId: string, softwareId: string) => void;
  onSetDiagnosis: (wsId: string, diagnosisId: string) => void;
  onAutoRemediateWorkstation: (wsId: string) => void;
}

export const OfficeAuditWorkbench: React.FC<OfficeAuditWorkbenchProps> = ({
  workstations,
  evaluations,
  selectedId,
  onSelectWorkstation,
  onUpdateOs,
  onToggleSoftware,
  onSetDiagnosis,
  onAutoRemediateWorkstation,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<SoftwareCategory | 'all'>('all');

  const selectedWs =
    workstations.find((w) => w.id === selectedId) || workstations[0];
  const selectedEval = evaluations[selectedWs.id];
  const currentOs =
    OS_CATALOG.find((o) => o.id === selectedWs.osId) || OS_CATALOG[0];

  const installedSoftwareItems = selectedWs.installedSoftwareIds
    .map((id) => SOFTWARE_CATALOG.find((s) => s.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const availableCatalogForTab =
    activeCategoryTab === 'all'
      ? SOFTWARE_CATALOG
      : SOFTWARE_CATALOG.filter((s) => s.category === activeCategoryTab);

  const isBoardTransferred =
    selectedWs.hardware.motherboardSerial !==
    selectedWs.hardware.originalOemBoardSerial;

  const expectedDiagId = EXPECTED_DIAGNOSIS_BY_WORKSTATION[selectedWs.id];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (4 cols): Interactive Office Floorplan & Workstation Roster */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Plano de Puestos · Oficina Vértice S.L.
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona cada equipo para auditar hardware, licencias y catálogo.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
              {workstations.filter((w) => evaluations[w.id].scorePct === 100).length}/
              {workstations.length} listos
            </span>
          </div>

          {/* Interactive Schematic Office Grid (2x3) */}
          <div className="grid grid-cols-2 gap-2.5 my-3 p-3 rounded-lg bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {workstations.map((ws) => {
              const ev = evaluations[ws.id];
              const isSelected = ws.id === selectedWs.id;
              const hasCritical = ev.findings.some((f) => f.severity === 'critical');
              const isPerfect = ev.scorePct === 100;

              return (
                <button
                  key={ws.id}
                  onClick={() => onSelectWorkstation(ws.id)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-sky-600 dark:border-sky-400 ring-2 ring-sky-500/20'
                      : 'bg-white/90 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {ws.floorZone === 'servidor' ? (
                        <Server className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      )}
                      {ws.code}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold tabular-nums ${
                        isPerfect
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : hasCritical
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isPerfect ? '● 100%' : hasCritical ? `✖ ${ev.scorePct}%` : `▲ ${ev.scorePct}%`}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-1">
                    {ws.department}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums truncate">
                    {ws.hardware.cpuArch === 'x86_32' ? 'CPU 32b' : 'CPU 64b'} · RAM {ev.usableRamGb}/{ws.hardware.ramInstalledGb}G
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detailed Vertical Workstation List */}
          <div className="space-y-2 mt-4">
            {workstations.map((ws) => {
              const ev = evaluations[ws.id];
              const isSelected = ws.id === selectedWs.id;
              const os = OS_CATALOG.find((o) => o.id === ws.osId);
              const criticalCount = ev.findings.filter(
                (f) => f.severity === 'critical'
              ).length;
              const warningCount = ev.findings.filter(
                (f) => f.severity === 'warning'
              ).length;

              return (
                <button
                  key={ws.id}
                  onClick={() => onSelectWorkstation(ws.id)}
                  className={`w-full p-3.5 rounded-lg text-left transition-colors border ${
                    isSelected
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-600 dark:border-sky-500'
                      : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ws.code} — {ws.name}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {ev.totalLicenseCost} €
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center justify-between">
                    <span className="truncate max-w-[180px]">{os?.name}</span>
                    <span className="font-mono shrink-0">
                      {criticalCount > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          ✖ {criticalCount} crít.
                        </span>
                      ) : warningCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          ▲ {warningCount} avisos
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          ✓ Conforme
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column (8 cols): Active Workstation Inspector & Remediation */}
      <div className="lg:col-span-8 space-y-6">
        {/* Top Workstation Header & Hardware Specs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                  {selectedWs.code}
                </span>
                <span>·</span>
                <span>{selectedWs.department}</span>
                <span>·</span>
                <span>Responsable: {selectedWs.userName}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {selectedWs.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-slate-100">
                  Nota de campo inicial:
                </strong>{' '}
                {selectedWs.notes}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Índice de Cumplimiento
                </span>
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    selectedEval.scorePct === 100
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : selectedEval.scorePct >= 60
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {selectedEval.scorePct}%
                </span>
              </div>
              {selectedEval.scorePct < 100 && (
                <button
                  onClick={() => onAutoRemediateWorkstation(selectedWs.id)}
                  className="px-3 py-1.5 text-xs font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  title="Aplica la solución óptima recomendada por el tutor para aprender cómo queda resuelto este equipo"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Aplicar Solución Guiada</span>
                </button>
              )}
            </div>
          </div>

          {/* Hardware Telemetry Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {/* CPU Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Procesador e Instrucciones</span>
                <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                {selectedWs.hardware.cpuModel}
              </p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                Arquitectura:{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {selectedWs.hardware.cpuArch === 'x86_64'
                    ? '64 bits (x86_64 / AMD64)'
                    : '32 bits puro (x86 / IA-32)'}
                </strong>
              </p>
            </div>

            {/* RAM Addressing Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Memoria RAM Direccionable</span>
                <HardDrive className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {selectedEval.usableRamGb} GB útiles / {selectedWs.hardware.ramInstalledGb} GB
                </p>
                <span
                  className={`text-xs font-mono font-semibold tabular-nums ${
                    selectedEval.ramEfficiencyPct === 100
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {selectedEval.ramEfficiencyPct}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  style={{ width: `${selectedEval.ramEfficiencyPct}%` }}
                  className={`h-full transition-all duration-150 ${
                    selectedEval.ramEfficiencyPct === 100
                      ? 'bg-emerald-600'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Motherboard / OEM Binding Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Trazabilidad Placa Base (<LicenseTooltip licenseType="OEM" showIcon={false}>OEM</LicenseTooltip>)
                </span>
                <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-1 truncate">
                Actual: {selectedWs.hardware.motherboardSerial}
              </p>
              <p
                className={`text-xs font-mono mt-1 truncate ${
                  isBoardTransferred
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isBoardTransferred
                  ? `✖ Pegatina OEM de: ${selectedWs.hardware.originalOemBoardSerial}`
                  : '✓ Placa original de fábrica'}
              </p>
            </div>
          </div>

          {/* Live Findings List */}
          <div className="mt-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Estado de Auditoría en Tiempo Real ({selectedEval.findings.length}{' '}
              {selectedEval.findings.length === 1 ? 'registro' : 'registros'})
            </h3>
            {selectedEval.findings.map((finding) => (
              <div
                key={finding.id}
                className={`p-3.5 rounded-lg border text-xs ${
                  finding.severity === 'critical'
                    ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/70 text-red-950 dark:text-red-200'
                    : finding.severity === 'warning'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/70 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/70 text-emerald-950 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {finding.severity === 'critical' ? (
                    <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  ) : finding.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold">{finding.title}</div>
                    <p className="opacity-90">{finding.technicalDetail}</p>
                    <p className="text-[11px] opacity-80 pt-1 border-t border-current/10">
                      <strong>Criterio Didáctico:</strong> {finding.didacticRule}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Auditor Diagnosis Selection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 1. Dictamen Principal del Auditor para {selectedWs.code} (15% de la nota)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identifica cuál era la anomalía principal que presentaba este equipo en el inventario original.
              </p>
            </div>
            {selectedWs.auditorDiagnosisId && (
              <span
                className={`text-xs font-semibold ${
                  selectedWs.auditorDiagnosisId === expectedDiagId
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {selectedWs.auditorDiagnosisId === expectedDiagId
                  ? '✓ Dictamen Correcto'
                  : '✖ Revisa la nota de campo inicial'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {DIAGNOSIS_OPTIONS.map((diag) => {
              const isSelected = selectedWs.auditorDiagnosisId === diag.id;
              const isCorrect = diag.id === expectedDiagId;

              return (
                <button
                  key={diag.id}
                  onClick={() => onSetDiagnosis(selectedWs.id, diag.id)}
                  className={`p-3 rounded-lg border text-left text-xs transition-colors flex flex-col justify-between ${
                    isSelected
                      ? isCorrect
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                        : 'bg-red-50/80 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-100'
                      : 'bg-slate-50/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
                    {diag.category}
                  </span>
                  <span className="font-medium mt-1 leading-snug">{diag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Operating System & License Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 2. Sistema Operativo: Arquitectura (32 vs. 64 bits) y Licencia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Elige un SO compatible con la CPU ({selectedWs.hardware.cpuArch}) que aproveche los {selectedWs.hardware.ramInstalledGb} GB de RAM y cumpla las reglas{' '}
                <LicenseTooltip licenseType="OEM">OEM</LicenseTooltip>,{' '}
                <LicenseTooltip licenseType="Retail">Retail</LicenseTooltip>,{' '}
                <LicenseTooltip licenseType="Volumen">Volumen</LicenseTooltip> o{' '}
                <LicenseTooltip licenseType="GNU_GPL">GNU/GPL</LicenseTooltip>.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 shrink-0">
              Actual: <strong>{currentOs.arch}</strong> ·{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                <LicenseTooltip licenseType={currentOs.licenseType} />
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OS_CATALOG.map((osOption) => {
              const isActive = selectedWs.osId === osOption.id;
              const isIncompatibleCpu =
                selectedWs.hardware.cpuArch === 'x86_32' && osOption.arch === '64-bit';
              const isOemInvalidOnTransferredBoard =
                osOption.licenseType === 'OEM' && isBoardTransferred;

              return (
                <div
                  key={osOption.id}
                  onClick={() => onUpdateOs(selectedWs.id, osOption.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onUpdateOs(selectedWs.id, osOption.id);
                    }
                  }}
                  className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-600 dark:border-sky-400 ring-2 ring-sky-500/20'
                      : 'bg-slate-50/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {osOption.name}
                      </span>
                      <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-400 shrink-0 tabular-nums">
                        {osOption.costPerSeat} €
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {osOption.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                    <span>
                      Arq: <strong>{osOption.arch}</strong> · Lic:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        <LicenseTooltip licenseType={osOption.licenseType} />
                      </strong>
                    </span>
                    {isIncompatibleCpu ? (
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        ✖ Incomp. con CPU 32b
                      </span>
                    ) : isOemInvalidOnTransferredBoard && osOption.id === 'win11_pro_64_oem' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        ▲ Placa transferida
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        ● Compatible
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Workstation Software Catalog Optimizer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Paso 3. Catálogo de Software Ofimático y Utilidades Instaladas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorías requeridas por {selectedWs.department}:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {selectedWs.requiredCategories.map((c) => CATEGORY_LABELS[c]).join(' · ')}
                </strong>
              </p>
            </div>
          </div>

          {/* Currently Installed Software List */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Paquetes instalados actualmente en {selectedWs.code} ({installedSoftwareItems.length}):
            </h4>
            {installedSoftwareItems.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 text-center">
                No hay aplicaciones instaladas. Añade debajo las herramientas necesarias para el puesto.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {installedSoftwareItems.map((app) => {
                  const isArchBad =
                    app.arch === '64-bit' &&
                    (currentOs.arch === '32-bit' || selectedWs.hardware.cpuArch === 'x86_32');
                  const isCategoryRequired = selectedWs.requiredCategories.includes(
                    app.category
                  );

                  return (
                    <div
                      key={app.id}
                      className="p-3 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {app.name}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {app.arch}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span
                            className={`font-mono font-semibold ${
                              app.commercialAllowed
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            <LicenseTooltip licenseType={app.licenseType} /> ({app.costPerSeat} €)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {CATEGORY_LABELS[app.category]}
                          {!isCategoryRequired && ' (Innecesario en este puesto)'}
                          {isArchBad && ' — ✖ INCOMPATIBLE CON SISTEMA DE 32 BITS'}
                          {!app.commercialAllowed && ' — ✖ USO EMPRESARIAL ILEGAL'}
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleSoftware(selectedWs.id, app.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors inline-flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desinstalar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter Tabs to Add / Replace Software */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3">
            <button
              onClick={() => setActiveCategoryTab('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCategoryTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todo el Catálogo
            </button>
            {(
              ['ofimatica', 'compresor', 'pdf', 'diseno', 'remoto', 'contabilidad'] as SoftwareCategory[]
            ).map((cat) => {
              const isReq = selectedWs.requiredCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeCategoryTab === cat
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {CATEGORY_LABELS[cat]} {isReq ? '★' : ''}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {availableCatalogForTab.map((pkg) => {
              const isInstalled = selectedWs.installedSoftwareIds.includes(pkg.id);
              const isReqCat = selectedWs.requiredCategories.includes(pkg.category);

              return (
                <div
                  key={pkg.id}
                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                    isInstalled
                      ? 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'
                      : 'bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {pkg.name}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0 tabular-nums">
                        {pkg.costPerSeat} €
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {pkg.arch} · <LicenseTooltip licenseType={pkg.licenseType} />
                      {isReqCat ? ' · Requerido ★' : ''}
                    </span>

                    <button
                      onClick={() => onToggleSoftware(selectedWs.id, pkg.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        isInstalled
                          ? 'bg-red-100/80 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-200'
                          : 'bg-slate-900 dark:bg-sky-600 text-white hover:bg-slate-800 dark:hover:bg-sky-500'
                      }`}
                    >
                      {isInstalled ? (
                        <>
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Instalar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>
              Las categorías marcadas con ★ son indispensables para el puesto de {selectedWs.department}. Evita duplicar dos programas de la misma categoría.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
