import React, { useState, useMemo, useEffect } from 'react';
import {
  INITIAL_WORKSTATIONS,
  Workstation,
  evaluateWorkstation,
  EXPECTED_DIAGNOSIS_BY_WORKSTATION,
  OS_CATALOG,
} from './data/auditScenario';
import { OfficeAuditWorkbench } from './components/OfficeAuditWorkbench';
import { ArchitectureLab } from './components/ArchitectureLab';
import { LicenseCatalogOptimizer } from './components/LicenseCatalogOptimizer';
import { AuditEvaluationView } from './components/AuditEvaluationView';
import {
  RotateCcw,
  ExternalLink,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Wallet,
} from 'lucide-react';
import { LicenseTooltip } from './components/LicenseTooltip';

type ActiveTab = 'audit' | 'arch_lab' | 'catalog' | 'evaluation';

const STORAGE_KEY = 'ufees_audit_simulator_v1';

export default function App() {
  const [workstations, setWorkstations] = useState<Workstation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === INITIAL_WORKSTATIONS.length) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_WORKSTATIONS;
  });

  const [selectedWsId, setSelectedWsId] = useState<string>('pc-01');
  const [activeTab, setActiveTab] = useState<ActiveTab>('audit');
  const [studentName, setStudentName] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workstations));
    } catch {
      // ignore storage errors
    }
  }, [workstations]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Evaluate all workstations in real time
  const evaluations = useMemo(() => {
    const map: Record<string, ReturnType<typeof evaluateWorkstation>> = {};
    for (const ws of workstations) {
      map[ws.id] = evaluateWorkstation(ws, workstations);
    }
    return map;
  }, [workstations]);

  // Aggregate Office KPIs
  const officeMetrics = useMemo(() => {
    const evalList = workstations.map((w) => evaluations[w.id]);
    const compliantCount = evalList.filter((e) => e.scorePct === 100).length;
    const totalInstalledRam = workstations.reduce(
      (acc, w) => acc + w.hardware.ramInstalledGb,
      0
    );
    const totalUsableRam = +evalList
      .reduce((acc, e) => acc + e.usableRamGb, 0)
      .toFixed(1);
    const ramPct = Math.round((totalUsableRam / totalInstalledRam) * 100);
    const criticalFindingsCount = evalList.reduce(
      (acc, e) => acc + e.findings.filter((f) => f.severity === 'critical').length,
      0
    );
    const totalCost = evalList.reduce((acc, e) => acc + e.totalLicenseCost, 0);
    const averageScore = Math.round(
      evalList.reduce((acc, e) => acc + e.scorePct, 0) / evalList.length
    );

    return {
      compliantCount,
      totalInstalledRam,
      totalUsableRam,
      ramPct,
      criticalFindingsCount,
      totalCost,
      averageScore,
    };
  }, [workstations, evaluations]);

  // Handlers
  const handleUpdateOs = (wsId: string, newOsId: string) => {
    setWorkstations((prev) =>
      prev.map((ws) => (ws.id === wsId ? { ...ws, osId: newOsId } : ws))
    );
  };

  const handleToggleSoftware = (wsId: string, softwareId: string) => {
    setWorkstations((prev) =>
      prev.map((ws) => {
        if (ws.id !== wsId) return ws;
        const exists = ws.installedSoftwareIds.includes(softwareId);
        const nextIds = exists
          ? ws.installedSoftwareIds.filter((id) => id !== softwareId)
          : [...ws.installedSoftwareIds, softwareId];
        return { ...ws, installedSoftwareIds: nextIds };
      })
    );
  };

  const handleSetDiagnosis = (wsId: string, diagnosisId: string) => {
    setWorkstations((prev) =>
      prev.map((ws) =>
        ws.id === wsId ? { ...ws, auditorDiagnosisId: diagnosisId } : ws
      )
    );
  };

  // Guided optimal remediation for a single workstation
  const handleAutoRemediateWorkstation = (wsId: string) => {
    const optimalConfigByWs: Record<
      string,
      { osId: string; softwareIds: string[] }
    > = {
      'pc-01': {
        osId: 'ubuntu_2404_64_gpl',
        softwareIds: [
          'libreoffice_64_gpl',
          'gnucash_kimai_64_gpl',
          '7zip_64_gpl',
          'pdfsam_64_gpl',
        ],
      },
      'pc-02': {
        osId: 'win11_pro_64_oem',
        softwareIds: [
          'gimp_inkscape_64_gpl',
          'pdfsam_64_gpl',
          '7zip_64_gpl',
          'libreoffice_64_gpl',
        ],
      },
      'pc-03': {
        osId: 'debian_12_32_gpl',
        softwareIds: ['libreoffice_32_gpl', '7zip_32_gpl', 'evince_32_gpl'],
      },
      'pc-04': {
        osId: 'win11_pro_64_retail',
        softwareIds: [
          'libreoffice_64_gpl',
          'pdfsam_64_gpl',
          'rustdesk_64_gpl',
          '7zip_64_gpl',
        ],
      },
      'pc-05': {
        osId: 'win11_pro_64_oem',
        softwareIds: [
          'libreoffice_64_gpl',
          'rustdesk_64_gpl',
          '7zip_64_gpl',
          'pdfsam_64_gpl',
        ],
      },
      'srv-01': {
        osId: 'ubuntu_2404_64_gpl',
        softwareIds: ['7zip_64_gpl', 'rustdesk_64_gpl'],
      },
    };

    const target = optimalConfigByWs[wsId];
    if (!target) return;

    setWorkstations((prev) =>
      prev.map((ws) =>
        ws.id === wsId
          ? {
              ...ws,
              osId: target.osId,
              installedSoftwareIds: target.softwareIds,
              auditorDiagnosisId: EXPECTED_DIAGNOSIS_BY_WORKSTATION[wsId],
            }
          : ws
      )
    );
  };

  // Global Catalog Optimization Actions
  const handleApplyGlobalCatalogAction = (
    actionType:
      | 'compressors_gpl'
      | 'office_gpl'
      | 'pdf_gpl'
      | 'remote_gpl'
      | 'design_gpl'
      | 'os_fix_all'
  ) => {
    setWorkstations((prev) =>
      prev.map((ws) => {
        const is32BitCpu = ws.hardware.cpuArch === 'x86_32';
        const currentOs = OS_CATALOG.find((o) => o.id === ws.osId);
        const use32BitApp = is32BitCpu || currentOs?.arch === '32-bit';

        if (actionType === 'compressors_gpl') {
          const withoutCompressors = ws.installedSoftwareIds.filter(
            (id) =>
              ![
                '7zip_64_gpl',
                '7zip_32_gpl',
                'winrar_trial_64',
                'winrar_comercial_64',
              ].includes(id)
          );
          if (!ws.requiredCategories.includes('compresor')) {
            return { ...ws, installedSoftwareIds: withoutCompressors };
          }
          return {
            ...ws,
            installedSoftwareIds: [
              ...withoutCompressors,
              use32BitApp ? '7zip_32_gpl' : '7zip_64_gpl',
            ],
          };
        }

        if (actionType === 'office_gpl') {
          const withoutOffice = ws.installedSoftwareIds.filter(
            (id) =>
              ![
                'libreoffice_64_gpl',
                'libreoffice_32_gpl',
                'msoffice_home_64',
                'msoffice_ltsc_vol_64',
                'msoffice_pro_retail_32',
              ].includes(id)
          );
          if (!ws.requiredCategories.includes('ofimatica')) {
            return { ...ws, installedSoftwareIds: withoutOffice };
          }
          return {
            ...ws,
            installedSoftwareIds: [
              ...withoutOffice,
              use32BitApp ? 'libreoffice_32_gpl' : 'libreoffice_64_gpl',
            ],
          };
        }

        if (actionType === 'pdf_gpl') {
          const withoutPdf = ws.installedSoftwareIds.filter(
            (id) =>
              ![
                'pdfsam_64_gpl',
                'evince_32_gpl',
                'acrobat_pro_crack_64',
                'acrobat_std_retail_64',
              ].includes(id)
          );
          if (!ws.requiredCategories.includes('pdf')) {
            return { ...ws, installedSoftwareIds: withoutPdf };
          }
          return {
            ...ws,
            installedSoftwareIds: [
              ...withoutPdf,
              use32BitApp ? 'evince_32_gpl' : 'pdfsam_64_gpl',
            ],
          };
        }

        if (actionType === 'remote_gpl') {
          const withoutRemote = ws.installedSoftwareIds.filter(
            (id) =>
              ![
                'rustdesk_64_gpl',
                'teamviewer_free_64',
                'anydesk_comercial_64',
              ].includes(id)
          );
          if (!ws.requiredCategories.includes('remoto')) {
            return { ...ws, installedSoftwareIds: withoutRemote };
          }
          return {
            ...ws,
            installedSoftwareIds: [...withoutRemote, 'rustdesk_64_gpl'],
          };
        }

        if (actionType === 'design_gpl') {
          if (ws.id !== 'pc-02') return ws;
          const withoutDesign = ws.installedSoftwareIds.filter(
            (id) =>
              !['gimp_inkscape_64_gpl', 'gimp_32_gpl', 'photoshop_crack_64'].includes(
                id
              )
          );
          return {
            ...ws,
            installedSoftwareIds: [...withoutDesign, 'gimp_inkscape_64_gpl'],
          };
        }

        if (actionType === 'os_fix_all') {
          if (ws.id === 'pc-01') return { ...ws, osId: 'ubuntu_2404_64_gpl' };
          if (ws.id === 'pc-03') return { ...ws, osId: 'debian_12_32_gpl' };
          if (ws.id === 'pc-04') return { ...ws, osId: 'win11_pro_64_retail' };
          if (ws.id === 'srv-01') return { ...ws, osId: 'ubuntu_2404_64_gpl' };
          return ws;
        }

        return ws;
      })
    );
  };

  const handleResetScenario = () => {
    setWorkstations(INITIAL_WORKSTATIONS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const logoSrc = `${import.meta.env.BASE_URL}assets/aistudio/icono_81a3db5b.png`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="https://www.unfantasmaenelsistema.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
        >
          Un Fantasma en el Sistema
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => setActiveTab('audit')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'audit'
                ? 'text-slate-900 dark:text-slate-100 underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Auditoría de Equipos
          </button>
          <button
            onClick={() => setActiveTab('arch_lab')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'arch_lab'
                ? 'text-slate-900 dark:text-slate-100 underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Laboratorio 32 vs 64 bits
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'catalog'
                ? 'text-slate-900 dark:text-slate-100 underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Catálogo y Licencias
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'evaluation'
                ? 'text-slate-900 dark:text-slate-100 underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Acta y Evaluación
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('evaluation')}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-sky-600 rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
          >
            Emitir Acta ({officeMetrics.averageScore}%)
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Brand & Scenario Banner */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                title="Visitar Un Fantasma en el Sistema"
              >
                {!logoError ? (
                  <img
                    src={logoSrc}
                    alt="Logo Un Fantasma en el Sistema"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-mono text-xs font-bold text-sky-600">
                    UFEES
                  </span>
                )}
              </a>

              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Simulador Didáctico de Sistemas e Implantación</span>
                  <span>·</span>
                  <a
                    href="https://www.unfantasmaenelsistema.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 dark:text-sky-400 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>unfantasmaenelsistema.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h1
                  className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1"
                  style={{ textWrap: 'balance' }}
                >
                  Simulador de Auditoría de Licencias, Arquitecturas (32/64 bits) y Catálogo de Software
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                  Escenario: <strong>Asesoría y Estudio Vértice S.L.</strong> cuenta con 6 equipos heterogéneos. Detecta cuellos de botella de memoria por arquitecturas de 32 vs. 64 bits, regulariza licencias (OEM, Retail, Volumen, GNU/GPL) y optimiza el catálogo ofimático.
                </p>
              </div>
            </div>

            {/* Workspace Toolbar Controls */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setDarkMode((d) => !d)}
                className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Cambiar tema claro / oscuro"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                    <span>Modo Oscuro</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetScenario}
                className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Escenario</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              1. Equipos (6)
            </button>
            <button
              onClick={() => setActiveTab('arch_lab')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
                activeTab === 'arch_lab'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              2. Lab 32/64 bits
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              3. Catálogo y Licencias
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
                activeTab === 'evaluation'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              4. Acta ({officeMetrics.averageScore}%)
            </button>
          </div>

          {/* Full-Width 4-Column KPI Telemetry Row Below Hero Split */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Equipos 100% Auditados
                </p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {officeMetrics.compliantCount} / {workstations.length} puestos
                </p>
              </div>
              <CheckCircle2
                className={`w-5 h-5 ${
                  officeMetrics.compliantCount === workstations.length
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400'
                }`}
              />
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  RAM Direccionable en Oficina
                </p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {officeMetrics.totalUsableRam} / {officeMetrics.totalInstalledRam} GB ({officeMetrics.ramPct}%)
                </p>
              </div>
              <HardDrive className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Incidencias Críticas Activas
                </p>
                <p
                  className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
                    officeMetrics.criticalFindingsCount === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {officeMetrics.criticalFindingsCount} alertas
                </p>
              </div>
              <AlertTriangle
                className={`w-5 h-5 ${
                  officeMetrics.criticalFindingsCount === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              />
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Presupuesto Anual Licencias
                </p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {officeMetrics.totalCost} € / año
                </p>
              </div>
              <Wallet className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </section>

        {/* Active View Content */}
        {activeTab === 'audit' && (
          <OfficeAuditWorkbench
            workstations={workstations}
            evaluations={evaluations}
            selectedId={selectedWsId}
            onSelectWorkstation={setSelectedWsId}
            onUpdateOs={handleUpdateOs}
            onToggleSoftware={handleToggleSoftware}
            onSetDiagnosis={handleSetDiagnosis}
            onAutoRemediateWorkstation={handleAutoRemediateWorkstation}
          />
        )}

        {activeTab === 'arch_lab' && <ArchitectureLab />}

        {activeTab === 'catalog' && (
          <LicenseCatalogOptimizer
            workstations={workstations}
            onApplyGlobalCatalogAction={handleApplyGlobalCatalogAction}
            onSelectWorkstation={(wsId) => {
              setSelectedWsId(wsId);
              setActiveTab('audit');
            }}
          />
        )}

        {activeTab === 'evaluation' && (
          <AuditEvaluationView
            workstations={workstations}
            evaluations={evaluations}
            studentName={studentName}
            onStudentNameChange={setStudentName}
            onSelectWorkstation={(wsId) => {
              setSelectedWsId(wsId);
              setActiveTab('audit');
            }}
          />
        )}
      </main>

      {/* Clean Footer with Author Branding & Link */}
      <footer className="mt-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            {!logoError && (
              <img
                src={logoSrc}
                alt="Un Fantasma en el Sistema"
                referrerPolicy="no-referrer"
                className="w-7 h-7 object-contain"
              />
            )}
            <span>
              Recurso educativo interactivo desarrollado para{' '}
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 underline underline-offset-4"
              >
                Un Fantasma en el Sistema
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>Arquitectura 32/64 bits · Licencias OEM, Retail, Volumen y GNU/GPL</span>
            <span>·</span>
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 dark:text-sky-400 font-medium hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>Visitar web oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
