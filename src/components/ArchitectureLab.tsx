import React, { useState } from 'react';
import { Cpu, HardDrive, AlertTriangle, CheckCircle2, Layers, Terminal } from 'lucide-react';

export const ArchitectureLab: React.FC = () => {
  const [cpuBits, setCpuBits] = useState<32 | 64>(64);
  const [osBits, setOsBits] = useState<32 | 64>(32);
  const [ramGb, setRamGb] = useState<number>(8);
  const [appBits, setAppBits] = useState<32 | 64>(64);
  const [appMemoryDemandGb, setAppMemoryDemandGb] = useState<number>(3.0);

  // Derived technical states
  const canOsBoot = !(cpuBits === 32 && osBits === 64);
  const mmioReservedGb = osBits === 32 && ramGb >= 4 ? 0.8 : 0;
  const maxOsAddressableGb = !canOsBoot ? 0 : osBits === 32 ? 3.2 : 2048;
  const usableRamGb = !canOsBoot ? 0 : Math.min(ramGb, maxOsAddressableGb);
  const wastedRamGb = !canOsBoot ? ramGb : Math.max(0, +(ramGb - usableRamGb - mmioReservedGb).toFixed(1));

  // App compatibility evaluation
  let appStatus: 'ok_native' | 'ok_wow64' | 'err_os_not_booted' | 'err_arch_mismatch' | 'err_oom_32bit_limit' | 'err_oom_physical' = 'ok_native';
  let appExplanation = '';

  if (!canOsBoot) {
    appStatus = 'err_os_not_booted';
    appExplanation = 'El sistema operativo de 64 bits ni siquiera puede arrancar porque la CPU física solo tiene registros de 32 bits (IA-32).';
  } else if (appBits === 64 && osBits === 32) {
    appStatus = 'err_arch_mismatch';
    appExplanation = 'Error de ejecución (Bad Image / Formato de ejecutable inválido): Un sistema operativo de 32 bits no puede cargar binarios de 64 bits (x86_64).';
  } else if (appBits === 32 && appMemoryDemandGb > 2.0) {
    appStatus = 'err_oom_32bit_limit';
    appExplanation = `Fallo Out of Memory (Límite por proceso de 32 bits): Aunque haya RAM en el equipo, un proceso de 32 bits solo puede direccionar entre 2 GB y 3 GB de espacio virtual propio (solicita ${appMemoryDemandGb.toFixed(1)} GB).`;
  } else if (appMemoryDemandGb > usableRamGb - 0.7) {
    appStatus = 'err_oom_physical';
    appExplanation = `Memoria insuficiente en el SO: Tras descontar ~0,7 GB del propio sistema operativo, solo quedan ${(Math.max(0, usableRamGb - 0.7)).toFixed(1)} GB libres y la aplicación solicita ${appMemoryDemandGb.toFixed(1)} GB.`;
  } else if (appBits === 32 && osBits === 64) {
    appStatus = 'ok_wow64';
    appExplanation = 'Ejecución mediante subsistema WOW64 (Windows 32-bit on Windows 64-bit / multilib): El SO de 64 bits traduce las llamadas del programa de 32 bits sin problema.';
  } else {
    appStatus = 'ok_native';
    appExplanation = `Ejecución nativa en ${osBits} bits: Las instrucciones y punteros de memoria de ${appBits} bits se procesan directamente en los registros de la CPU.`;
  }

  const usablePct = ramGb > 0 ? Math.min(100, (usableRamGb / ramGb) * 100) : 0;
  const mmioPct = ramGb > 0 ? Math.min(100 - usablePct, (mmioReservedGb / ramGb) * 100) : 0;
  const wastedPct = Math.max(0, 100 - usablePct - mmioPct);

  return (
    <div className="space-y-6">
      {/* Header Explanation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Simulador Conceptual Interactivo · Arquitectura de Computadores
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Laboratorio Práctico: Direccionamiento de 32 bits (x86) frente a 64 bits (x86_64)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Experimenta en tiempo real qué ocurre al combinar procesadores, sistemas operativos y aplicaciones de 32 y 64 bits, y comprueba matemáticamente por qué existe la barrera de los 4 GB de RAM.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCpuBits(64);
                setOsBits(32);
                setRamGb(8);
                setAppBits(64);
                setAppMemoryDemandGb(1.5);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Cargar Caso PC-01 (8 GB en SO 32-bit)
            </button>
            <button
              onClick={() => {
                setCpuBits(32);
                setOsBits(64);
                setRamGb(2);
                setAppBits(64);
                setAppMemoryDemandGb(1.0);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Cargar Caso PC-03 (SO 64-bit en CPU 32-bit)
            </button>
            <button
              onClick={() => {
                setCpuBits(64);
                setOsBits(64);
                setRamGb(32);
                setAppBits(32);
                setAppMemoryDemandGb(3.5);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Cargar Caso PC-02 (App 32-bit en 32 GB RAM)
            </button>
          </div>
        </div>
      </div>

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Zone (7 cols): Interactive Visual Stage */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          {/* 1. Architecture Stack Pipeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                1. Cadena de Compatibilidad Hardware → SO → Aplicación
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Bus de Direcciones: {osBits === 32 ? '2³² = 4,29 × 10⁹ bytes' : '2⁶⁴ = 1,84 × 10¹⁹ bytes'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CPU Stage */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>1. Hardware (CPU)</span>
                  <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono tabular-nums">
                  {cpuBits === 64 ? 'x86_64 (64 bits)' : 'x86 IA-32 (32 bits)'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Registros: {cpuBits === 64 ? 'RAX, RBX (64-bit) + EAX (32-bit)' : 'Solo EAX, EBX (32-bit)'}
                </p>
              </div>

              {/* OS Stage */}
              <div
                className={`p-4 rounded-lg border ${
                  !canOsBoot
                    ? 'border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/30'
                    : osBits === 32 && ramGb > 4
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30'
                    : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>2. Kernel / SO</span>
                  <Layers className="w-4 h-4" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono tabular-nums">
                  SO de {osBits} bits
                </p>
                <p className="text-xs font-medium mt-1 text-slate-700 dark:text-slate-300">
                  {!canOsBoot
                    ? '✖ ERROR: CPU no soporta modo 64-bit'
                    : osBits === 32 && ramGb > 4
                    ? `▲ Cuello de botella: Tope 3,2 GB`
                    : '● Arranque y direccionamiento óptimo'}
                </p>
              </div>

              {/* Process Stage */}
              <div
                className={`p-4 rounded-lg border ${
                  appStatus === 'ok_native' || appStatus === 'ok_wow64'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20'
                    : 'border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>3. Binario App</span>
                  <Terminal className="w-4 h-4" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono tabular-nums">
                  App {appBits} bits ({appMemoryDemandGb.toFixed(1)} GB)
                </p>
                <p className="text-xs font-medium mt-1 text-slate-700 dark:text-slate-300">
                  {appStatus === 'ok_native' && '● Ejecución Nativa Directa'}
                  {appStatus === 'ok_wow64' && '● Ejecución vía Subsistema WOW64'}
                  {appStatus === 'err_arch_mismatch' && '✖ Incompatible: App 64-bit en SO 32-bit'}
                  {appStatus === 'err_oom_32bit_limit' && '✖ Crash: Límite 2 GB por proceso 32-bit'}
                  {appStatus === 'err_oom_physical' && '✖ RAM insuficiente en el sistema'}
                  {appStatus === 'err_os_not_booted' && '✖ Sistema Operativo no iniciado'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Physical vs Addressable RAM Map */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  2. Mapa de Direccionamiento de Memoria RAM Física ({ramGb} GB Instalados)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparativa entre la memoria pinchada en la placa base y la que el Sistema Operativo puede utilizar realmente.
                </p>
              </div>
              <div className="text-right font-mono text-xs tabular-nums">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Útil: {usableRamGb.toFixed(1)} GB
                </span>
                <span className="mx-1.5 text-slate-400">·</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  Desaprovechada: {wastedRamGb.toFixed(1)} GB
                </span>
              </div>
            </div>

            {/* Segmented Visual Bar */}
            <div className="w-full h-10 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex border border-slate-300 dark:border-slate-700 font-mono text-xs tabular-nums">
              {usablePct > 0 && (
                <div
                  style={{ width: `${usablePct}%` }}
                  className="bg-emerald-600 text-white flex items-center justify-center px-2 transition-all duration-150 overflow-hidden whitespace-nowrap"
                  title={`RAM Utilizable: ${usableRamGb.toFixed(1)} GB`}
                >
                  {usablePct >= 18 ? `Útil: ${usableRamGb.toFixed(1)} GB (${Math.round(usablePct)}%)` : `${usableRamGb.toFixed(1)}G`}
                </div>
              )}
              {mmioPct > 0 && (
                <div
                  style={{ width: `${mmioPct}%` }}
                  className="bg-amber-500 text-slate-950 flex items-center justify-center px-1.5 transition-all duration-150 overflow-hidden whitespace-nowrap font-semibold"
                  title="Reservada para hardware PCIe / MMIO (0,8 GB)"
                >
                  {mmioPct >= 10 ? 'MMIO 0,8G' : 'HW'}
                </div>
              )}
              {wastedPct > 0 && (
                <div
                  style={{ width: `${wastedPct}%` }}
                  className="bg-red-600/90 text-white flex items-center justify-center px-2 transition-all duration-150 overflow-hidden whitespace-nowrap"
                  title={`RAM Inaccesible: ${wastedRamGb.toFixed(1)} GB`}
                >
                  {wastedPct >= 20
                    ? `Inaccesible (>4 GB): ${wastedRamGb.toFixed(1)} GB (${Math.round(wastedPct)}%)`
                    : `${wastedRamGb.toFixed(1)} GB`}
                </div>
              )}
            </div>

            {/* Legend without decorative pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  ■ RAM Direccionable ({usableRamGb.toFixed(1)} GB)
                </span>
                <span>·</span>
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  ■ Reserva Hardware MMIO ({mmioReservedGb.toFixed(1)} GB)
                </span>
                <span>·</span>
                <span className="font-medium text-red-700 dark:text-red-400">
                  ■ RAM Ignorada por {osBits === 32 ? 'límite de 32 bits' : 'fallo de arranque'} ({wastedRamGb.toFixed(1)} GB)
                </span>
              </div>
            </div>
          </div>

          {/* 3. Live Technical Diagnostic Verdict */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              {appStatus === 'ok_native' || appStatus === 'ok_wow64' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Diagnóstico en Vivo del Simulador de Ejecución
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {appExplanation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Zone (5 cols): Control & Concept Deck */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Panel de Parámetros de Arquitectura
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modifica cada variable para comprobar las reglas de compatibilidad ascendente y descendente.
            </p>

            <div className="space-y-5 mt-5">
              {/* Control 1: CPU Architecture */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <span>1. Arquitectura del Procesador (CPU)</span>
                  <span className="font-mono text-sky-700 dark:text-sky-400">{cpuBits} bits</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setCpuBits(32)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      cpuBits === 32
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    CPU 32 bits (x86 / i686)
                  </button>
                  <button
                    onClick={() => setCpuBits(64)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      cpuBits === 64
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    CPU 64 bits (x86_64)
                  </button>
                </div>
              </div>

              {/* Control 2: OS Architecture */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <span>2. Arquitectura del Sistema Operativo</span>
                  <span className="font-mono text-sky-700 dark:text-sky-400">SO {osBits} bits</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setOsBits(32)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      osBits === 32
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    SO 32 bits (x86 / i386)
                  </button>
                  <button
                    onClick={() => setOsBits(64)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      osBits === 64
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    SO 64 bits (x64 / amd64)
                  </button>
                </div>
              </div>

              {/* Control 3: Physical RAM Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <label htmlFor="ram-slider" className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    <span>3. Memoria RAM Física Instalada:</span>
                  </label>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {ramGb} GB DDR
                  </span>
                </div>
                <input
                  id="ram-slider"
                  type="range"
                  min={2}
                  max={32}
                  step={2}
                  value={ramGb}
                  onChange={(e) => setRamGb(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                  <span>2 GB</span>
                  <span>4 GB (Límite 2³²)</span>
                  <span>8 GB</span>
                  <span>16 GB</span>
                  <span>32 GB</span>
                </div>
              </div>

              {/* Control 4: Application Binary Architecture & RAM Demand */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>4. Binario de Aplicación a Ejecutar</span>
                  <span className="font-mono text-sky-700 dark:text-sky-400">App {appBits} bits</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setAppBits(32)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      appBits === 32
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Programa 32 bits (.exe x86)
                  </button>
                  <button
                    onClick={() => setAppBits(64)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      appBits === 64
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Programa 64 bits (.exe x64)
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <label htmlFor="app-ram-slider">Memoria solicitada por el proceso:</label>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {appMemoryDemandGb.toFixed(1)} GB
                    </span>
                  </div>
                  <input
                    id="app-ram-slider"
                    type="range"
                    min={0.5}
                    max={6.0}
                    step={0.5}
                    value={appMemoryDemandGb}
                    onChange={(e) => setAppMemoryDemandGb(Number(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
                    <span>0,5 GB</span>
                    <span>2,0 GB (Tope proc. 32-bit)</span>
                    <span>4,0 GB</span>
                    <span>6,0 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Didactic Table */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-900 dark:text-slate-200">
              Reglas de Oro para el Examen / Auditoría:
            </p>
            <p>• <strong>CPU 64-bit + SO 32-bit:</strong> Funciona, pero desperdicia toda la RAM que supere ~3,2 GB y bloquea programas de 64 bits.</p>
            <p>• <strong>CPU 32-bit + SO 64-bit:</strong> No arranca jamás (faltan registros e instrucciones de 64 bits en el silicio).</p>
            <p>• <strong>SO 64-bit + App 32-bit:</strong> Funciona gracias a WOW64, pero cada proceso de 32 bits sigue limitado a 2–4 GB de RAM.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
