import React, { useState } from 'react';
import {
  Workstation,
  WorkstationEvaluation,
  OS_CATALOG,
  SOFTWARE_CATALOG,
  EXPECTED_DIAGNOSIS_BY_WORKSTATION,
  DIAGNOSIS_OPTIONS,
} from '../data/auditScenario';
import {
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Copy,
  Check,
  Award,
  HelpCircle,
} from 'lucide-react';

interface AuditEvaluationViewProps {
  workstations: Workstation[];
  evaluations: Record<string, WorkstationEvaluation>;
  studentName: string;
  onStudentNameChange: (name: string) => void;
  onSelectWorkstation: (wsId: string) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question:
      'En un ordenador con procesador Intel Core i5 (x86_64) y 16 GB de memoria RAM DDR4 se instala por error Windows 10 Pro de 32 bits. ¿Qué ocurrirá exactamente?',
    options: [
      'El sistema operativo no arrancará porque el procesador es de 64 bits.',
      'El sistema arrancará, pero solo podrá direccionar un máximo teórico de 4 GB de RAM (~3,2 GB útiles) y no podrá ejecutar aplicaciones de 64 bits.',
      'El sistema utilizará los 16 GB de RAM pero divididos en 4 bloques lentos de 4 GB.',
      'Las aplicaciones de 64 bits funcionarán mediante el subsistema WOW64.',
    ],
    correctIndex: 1,
    explanation:
      'Una CPU de 64 bits es retrocompatible con sistemas operativos de 32 bits, pero el SO de 32 bits solo tiene punteros de memoria de 32 bits (2³² = 4 GB), desperdiciando el resto de la RAM e impidiendo ejecutar binarios de 64 bits.',
  },
  {
    id: 'q2',
    question:
      'Se avería la placa base de un PC Dell que venía con licencia Windows 11 Pro OEM preinstalada de fábrica. Compramos un PC clónico nuevo con placa base distinta. ¿Podemos transferir legalmente esa licencia OEM al PC nuevo?',
    options: [
      'Sí, siempre que desinstalemos el disco duro del equipo viejo.',
      'No; las licencias OEM están vinculadas de forma permanente al primer equipo/placa base donde se activaron. Para transferir de equipo se necesita una licencia Retail (FPP) o por Volumen.',
      'Sí, las licencias OEM permiten hasta 3 cambios de ordenador.',
      'Solo si el nuevo procesador tiene la misma arquitectura de 64 bits.',
    ],
    correctIndex: 1,
    explanation:
      'El contrato OEM (Original Equipment Manufacturer) vincula la licencia de forma indisoluble a la placa base del equipo con el que se comercializó. Solo las licencias Retail (FPP) o por Volumen permiten migrar la licencia a un PC distinto.',
  },
  {
    id: 'q3',
    question:
      'Durante la auditoría de una asesoría contable detectamos LibreOffice, 7-Zip y GIMP instalados bajo licencias GNU/GPL y LGPL. ¿Cuál es el dictamen legal respecto a su uso en una empresa con ánimo de lucro?',
    options: [
      'Ilegal: el software GNU/GPL solo puede utilizarse en universidades, ONGs o ámbito doméstico.',
      'Legal únicamente si la empresa paga un canon anual a la Free Software Foundation.',
      '100% Legal y a coste 0 €: las licencias libres (GNU/GPL, LGPL, MPL) garantizan la libertad de ejecutar el programa con cualquier propósito (Libertad 0), incluido el uso comercial y empresarial.',
      'Solo es legal en servidores Linux, pero no en estaciones de trabajo Windows.',
    ],
    correctIndex: 2,
    explanation:
      'La Libertad 0 del Software Libre (GNU/GPL) establece el derecho a usar el programa con cualquier propósito (comercial, empresarial, administrativo o personal) en tantos equipos como se desee y sin pagar licencias.',
  },
  {
    id: 'q4',
    question:
      '¿Qué diferencia legal existe en una empresa entre instalar "TeamViewer Free" (Freeware personal) e instalar "RustDesk" o "LibreOffice" (Software Libre GNU/GPL)?',
    options: [
      'Ninguna, ambos son gratuitos y se pueden usar libremente en cualquier empresa.',
      'El Freeware personal es gratuito en casa pero su contrato EULA prohíbe el uso comercial en oficinas; el Software Libre (GNU/GPL) autoriza expresamente el uso empresarial sin coste.',
      'El Freeware entrega el código fuente y el Software Libre no.',
      'El Freeware caduca a los 30 días como el Shareware.',
    ],
    correctIndex: 1,
    explanation:
      'Muchos programas Freeware propietarios restringen la gratuidad al uso doméstico no comercial. En cambio, el Software Libre (GNU/GPL, AGPL, MPL) permite siempre el uso profesional y corporativo.',
  },
  {
    id: 'q5',
    question:
      'Un terminal de recepción antiguo cuenta con un procesador Intel Atom N270 de 32 bits puro (arquitectura i686) y 2 GB de RAM. ¿Qué combinación de SO y ofimática es técnicamente viable y óptima?',
    options: [
      'Ubuntu Desktop 24.04 de 64 bits (amd64) con LibreOffice de 64 bits.',
      'Windows 11 Pro de 64 bits OEM con Microsoft Office 2024 x64.',
      'Debian 12 de 32 bits (i386) con LibreOffice y 7-Zip compilados para 32 bits (x86) bajo licencia GNU/GPL.',
      'Cualquier sistema de 64 bits funcionará si activamos la memoria virtual en el disco SSD.',
    ],
    correctIndex: 2,
    explanation:
      'Una CPU física de 32 bits carece del conjunto de instrucciones x86_64 (Long Mode). Tanto el kernel del sistema operativo como todas las aplicaciones instaladas deben ser obligatoriamente de 32 bits (i386 / x86).',
  },
];

export const AuditEvaluationView: React.FC<AuditEvaluationViewProps> = ({
  workstations,
  evaluations,
  studentName,
  onStudentNameChange,
  onSelectWorkstation,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [copiedReport, setCopiedReport] = useState(false);

  const evalList = workstations.map((w) => evaluations[w.id]);
  const avgAuditScore = Math.round(
    evalList.reduce((acc, e) => acc + e.scorePct, 0) / evalList.length
  );
  const totalCost = evalList.reduce((acc, e) => acc + e.totalLicenseCost, 0);

  const quizCorrectCount = QUIZ_QUESTIONS.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;
  const quizScorePct = Math.round((quizCorrectCount / QUIZ_QUESTIONS.length) * 100);

  const globalFinalGrade = Math.round(avgAuditScore * 0.7 + quizScorePct * 0.3);

  const buildPlainTextReport = () => {
    const dateStr = new Date().toLocaleDateString('es-ES');
    const lines: string[] = [
      '====================================================================',
      'INFORME TÉCNICO DE AUDITORÍA DE LICENCIAS Y COMPATIBILIDAD DE HARDWARE/SW',
      'Un Fantasma en el Sistema — https://www.unfantasmaenelsistema.com/',
      '====================================================================',
      `Auditor/a: ${studentName.trim() || 'Estudiante sin identificar'}`,
      `Fecha de emisión: ${dateStr}`,
      `Puntuación Práctica en Equipos (70%): ${avgAuditScore}/100`,
      `Cuestionario Normativo y Técnico (30%): ${quizScorePct}/100 (${quizCorrectCount}/${QUIZ_QUESTIONS.length} aciertos)`,
      `NOTA GLOBAL DE LA AUDITORÍA: ${globalFinalGrade}/100`,
      `Coste Anual Resultante en Licencias: ${totalCost} € (Presupuesto máximo: 800 €)`,
      '',
      'DETALLE POR ESTACIÓN DE TRABAJO / SERVIDOR:',
      '--------------------------------------------------------------------',
    ];

    for (const ws of workstations) {
      const ev = evaluations[ws.id];
      const os = OS_CATALOG.find((o) => o.id === ws.osId);
      const apps = ws.installedSoftwareIds
        .map((id) => SOFTWARE_CATALOG.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      const diagLabel =
        DIAGNOSIS_OPTIONS.find((d) => d.id === ws.auditorDiagnosisId)?.label ||
        'Sin dictamen seleccionado';

      lines.push(
        `[${ws.code}] ${ws.name} (${ws.userName} - ${ws.department})`,
        `  • Hardware: ${ws.hardware.cpuModel} [${ws.hardware.cpuArch}] | RAM: ${ws.hardware.ramInstalledGb} GB (Útil: ${ev.usableRamGb} GB)`,
        `  • Sistema Operativo Asignado: ${os?.name || ws.osId}`,
        `  • Catálogo de Software: ${apps || 'Ninguno'}`,
        `  • Dictamen del Auditor: ${diagLabel}`,
        `  • Estado: Arquitectura ${ev.isArchValid ? 'OK' : 'PENDIENTE'} | Licencias ${ev.isLicenseValid ? 'OK' : 'INCUMPLIMIENTO'} | Catálogo ${ev.isCatalogOptimized ? 'OPTIMIZADO' : 'MEJORABLE'} | Puntuación puesto: ${ev.scorePct}%`,
        ''
      );
    }

    return lines.join('\n');
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(buildPlainTextReport());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleDownloadReport = () => {
    const content = buildPlainTextReport();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (studentName.trim() || 'auditor').replace(/\s+/g, '_').toLowerCase();
    a.download = `informe_auditoria_licencias_${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Evaluation & Export Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Evaluación de Competencias · Entrega para Aula Virtual
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Acta Final de Auditoría e Informe de Cumplimiento
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Revisa la calificación obtenida en la remediación de los 6 equipos (70% de la nota) y responde al control técnico de 5 preguntas (30% de la nota) antes de descargar tu acta de auditoría.
            </p>
          </div>

          {/* Student Name + Export Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shrink-0">
            <div>
              <label
                htmlFor="student-name-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Nombre y Apellidos del Auditor/a:
              </label>
              <input
                id="student-name-input"
                type="text"
                placeholder="Ej. Ana Martínez (1º SMR / ASIR)"
                value={studentName}
                onChange={(e) => onStudentNameChange(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-2 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {copiedReport ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Informe Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Acta</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 text-xs font-medium bg-sky-700 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar Informe (.TXT)</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nota Práctica de Equipos (70%)
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {avgAuditScore} / 100
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test Normativo y Técnico (30%)
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {quizScorePct} / 100
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gasto Anual en Licencias
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
              {totalCost} €
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calificación Final Ponderada
            </p>
            <p
              className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                globalFinalGrade >= 85
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : globalFinalGrade >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {globalFinalGrade} / 100
            </p>
          </div>
        </div>
      </div>

      {/* Workstation Audit Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          1. Desglose de Evaluación por Equipo Auditado
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3 font-semibold">Código / Puesto</th>
                <th className="py-2.5 px-3 font-semibold">Arquitectura (35%)</th>
                <th className="py-2.5 px-3 font-semibold">Licencias (35%)</th>
                <th className="py-2.5 px-3 font-semibold">Catálogo (15%)</th>
                <th className="py-2.5 px-3 font-semibold">Dictamen (15%)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Nota Puesto</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {workstations.map((ws) => {
                const ev = evaluations[ws.id];
                return (
                  <tr key={ws.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {ws.code} · {ws.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ws.hardware.cpuModel} · {ws.hardware.ramInstalledGb} GB RAM
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ev.isArchValid ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correcta ({ev.usableRamGb} GB)</span>
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Incompatible</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ev.isLicenseValid ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cumple EULA</span>
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Infracción</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ev.isCatalogOptimized ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Optimizado</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Por depurar</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ev.isDiagnosisCorrect ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acertado</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          {ws.auditorDiagnosisId ? 'Incorrecto' : 'Sin marcar'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                      {ev.scorePct}%
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectWorkstation(ws.id)}
                        className="text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline"
                      >
                        Ir al equipo →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Certification Quiz */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>2. Cuestionario de Verificación Conceptual (5 casos de examen)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Selecciona la respuesta correcta en cada supuesto práctico para completar el 30% restante de la nota de auditoría.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            Aciertos: {quizCorrectCount} / {QUIZ_QUESTIONS.length}
          </span>
        </div>

        <div className="space-y-5">
          {QUIZ_QUESTIONS.map((q, idx) => {
            const selected = selectedAnswers[q.id];
            const hasAnswered = selected !== undefined;
            const isCorrect = selected === q.correctIndex;

            return (
              <div
                key={q.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {idx + 1}. {q.question}
                </p>

                <div className="space-y-2 mt-3">
                  {q.options.map((opt, optIdx) => {
                    const isThisSelected = selected === optIdx;
                    let optionStyle =
                      'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300';
                    if (hasAnswered) {
                      if (optIdx === q.correctIndex) {
                        optionStyle =
                          'border-emerald-400 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium';
                      } else if (isThisSelected && !isCorrect) {
                        optionStyle =
                          'border-red-400 dark:border-red-700 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() =>
                          setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2.5 ${optionStyle}`}
                      >
                        <span className="font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)})
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {isCorrect ? '¡Respuesta correcta! ' : 'Fundamento técnico: '}
                      </span>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
