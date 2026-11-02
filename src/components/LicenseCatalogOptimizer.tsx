import React, { useState } from 'react';
import {
  Workstation,
  SOFTWARE_CATALOG,
  OS_CATALOG,
  CATEGORY_LABELS,
  SoftwareCategory,
  LicenseType,
} from '../data/auditScenario';
import { ShieldCheck, Scale, Sparkles, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { LicenseTooltip } from './LicenseTooltip';

interface LicenseCatalogOptimizerProps {
  workstations: Workstation[];
  onApplyGlobalCatalogAction: (actionType: 'compressors_gpl' | 'office_gpl' | 'pdf_gpl' | 'remote_gpl' | 'design_gpl' | 'os_fix_all') => void;
  onSelectWorkstation: (wsId: string) => void;
}

interface LicenseReferenceRow {
  type: string;
  code: string;
  licenseTypeKey: LicenseType;
  commercialValid: string;
  hardwareTransfer: string;
  sourceCodeAccess: string;
  typicalCost: string;
  auditKeyRule: string;
}

const LICENSE_REFERENCE_MATRIX: LicenseReferenceRow[] = [
  {
    type: 'OEM (Original Equipment Manufacturer)',
    code: 'OEM',
    licenseTypeKey: 'OEM',
    commercialValid: 'Sí (en su equipo original)',
    hardwareTransfer: 'NO transferible (vinculada a la 1ª placa base)',
    sourceCodeAccess: 'Cerrado (Propietario)',
    typicalCost: 'Económico (incluido con PC nuevo)',
    auditKeyRule: 'Si se cambia la placa base por actualización o se traslada a otro PC, la licencia OEM queda invalidada.',
  },
  {
    type: 'Retail / FPP (Full Packaged Product)',
    code: 'Retail',
    licenseTypeKey: 'Retail',
    commercialValid: 'Sí (ediciones Pro / Business)',
    hardwareTransfer: 'SÍ transferible a otro PC (1 activo a la vez)',
    sourceCodeAccess: 'Cerrado (Propietario)',
    typicalCost: '150 € – 300 € por puesto',
    auditKeyRule: 'Puede migrarse de un equipo viejo a uno nuevo siempre que se desinstale del equipo anterior y se conserve la factura.',
  },
  {
    type: 'Volumen (VLK / MAK / KMS / CSP)',
    code: 'Volumen',
    licenseTypeKey: 'Volumen',
    commercialValid: 'Sí (corporativo)',
    hardwareTransfer: 'SÍ reasignable dentro de la organización',
    sourceCodeAccess: 'Cerrado (Propietario)',
    typicalCost: '140 € – 220 € / puesto (mín. 5 licencias)',
    auditKeyRule: 'Exige alcanzar el mínimo contractual (habitualmente 5 licencias en la empresa) y mantener el registro de puestos activos.',
  },
  {
    type: 'GNU/GPL, LGPL, AGPL, MPL (Software Libre)',
    code: 'GNU/GPL',
    licenseTypeKey: 'GNU_GPL',
    commercialValid: 'SÍ (100% permitido en empresas sin límite)',
    hardwareTransfer: 'Libre e ilimitada en cualquier número de equipos',
    sourceCodeAccess: 'Abierto (4 libertades del software libre)',
    typicalCost: '0 € en licencias',
    auditKeyRule: 'La GPL garantiza el uso comercial y empresarial sin restricciones ni pago de regalías; obliga a mantener la misma licencia si se redistribuye código modificado.',
  },
  {
    type: 'Hogar y Estudiantes / Académica',
    code: 'Hogar',
    licenseTypeKey: 'Hogar_Estudiantes',
    commercialValid: 'NO (Prohibido en empresas)',
    hardwareTransfer: 'Solo ámbito doméstico / educativo',
    sourceCodeAccess: 'Cerrado (Propietario)',
    typicalCost: '99 € – 149 € (uso no comercial)',
    auditKeyRule: 'Aunque tenga clave original comprada en tienda, su uso en una oficina o actividad mercantil constituye incumplimiento del EULA.',
  },
  {
    type: 'Freeware Uso Personal / Shareware Trial',
    code: 'Freeware / Trial',
    licenseTypeKey: 'Freeware_Personal',
    commercialValid: 'NO en empresas (ej. TeamViewer Free, WinRAR vencido)',
    hardwareTransfer: 'Variable',
    sourceCodeAccess: 'Cerrado (Propietario)',
    typicalCost: '0 € doméstico / Pago obligatorio en empresa',
    auditKeyRule: 'No confundir "Freeware" (gratuito a veces solo para casa) con "Software Libre" (GNU/GPL). En auditorías se penaliza usar TeamViewer Free o WinRAR sin licencia.',
  },
];

export const LicenseCatalogOptimizer: React.FC<LicenseCatalogOptimizerProps> = ({
  workstations,
  onApplyGlobalCatalogAction,
  onSelectWorkstation,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SoftwareCategory | 'all'>('all');
  const [lastBulkFeedback, setLastBulkFeedback] = useState<string | null>(null);

  const handleBulkAction = (
    actionType: 'compressors_gpl' | 'office_gpl' | 'pdf_gpl' | 'remote_gpl' | 'design_gpl' | 'os_fix_all',
    message: string
  ) => {
    onApplyGlobalCatalogAction(actionType);
    setLastBulkFeedback(message);
  };

  const filteredCatalog =
    selectedCategoryFilter === 'all'
      ? SOFTWARE_CATALOG
      : SOFTWARE_CATALOG.filter((item) => item.category === selectedCategoryFilter);

  return (
    <div className="space-y-6">
      {/* Section 1: Quick Standardization & Optimization Policies */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-sky-700 dark:text-sky-400">
              Políticas de Homogeneización y Ahorro de Costes
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Optimizador del Catálogo de Software Ofimático y Utilidades
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Aplica políticas de estandarización en toda la oficina respetando automáticamente la arquitectura de cada equipo (32 bits en PC-03 y 64 bits en el resto) y sustituyendo licencias irregulares o redundantes por alternativas libres{' '}
              <LicenseTooltip licenseType="GNU_GPL">GNU/GPL</LicenseTooltip>.
            </p>
          </div>
          {lastBulkFeedback && (
            <div className="px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shrink-0">
              <Check className="w-4 h-4 shrink-0" />
              <span>{lastBulkFeedback}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {/* Policy 1: Compressors */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Utilidades de Compresión · Ahorro y Legalidad
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Estandarizar 7-Zip (GNU LGPL) en toda la oficina
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Elimina los WinRAR con evaluación expirada (412 días) y las licencias duplicadas, instalando 7-Zip x64 en puestos de 64 bits y 7-Zip x86 en el terminal de 32 bits.
              </p>
            </div>
            <button
              onClick={() =>
                handleBulkAction(
                  'compressors_gpl',
                  'Compresores migrados a 7-Zip (GNU LGPL) según arquitectura (32/64 bits).'
                )
              }
              className="mt-4 w-full px-4 py-2 text-xs font-medium bg-slate-900 dark:bg-sky-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Desplegar 7-Zip (0 €)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Policy 2: Office Suites */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Catálogo Ofimático · Erradicación EULA Hogar
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Migrar Ofimática a LibreOffice (GNU/MPL)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Reemplaza las ediciones ilegales de Office Hogar y Estudiantes y el Office de 32 bits por LibreOffice 64 bits (y 32 bits en Recepción), y retira la ofimática innecesaria del Servidor.
              </p>
            </div>
            <button
              onClick={() =>
                handleBulkAction(
                  'office_gpl',
                  'Suites ofimáticas normalizadas con LibreOffice (64-bit / 32-bit) y limpiadas en SRV-01.'
                )
              }
              className="mt-4 w-full px-4 py-2 text-xs font-medium bg-slate-900 dark:bg-sky-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Estandarizar LibreOffice (0 €)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Policy 3: PDF Tools */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión Documental PDF · Eliminación de Cracks
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Sustituir Acrobat Crack/Pago por PDFsam + Evince
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Desinstala el Adobe Acrobat Pro pirata en Diseño y las suscripciones redundantes en Dirección/Servidor, desplegando PDFsam Basic (64-bit) y Evince (32-bit).
              </p>
            </div>
            <button
              onClick={() =>
                handleBulkAction(
                  'pdf_gpl',
                  'Herramientas PDF migradas a PDFsam Basic (x64) y Evince (x86) bajo licencia GNU/GPL.'
                )
              }
              className="mt-4 w-full px-4 py-2 text-xs font-medium bg-slate-900 dark:bg-sky-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Normalizar Catálogo PDF (0 €)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Policy 4: Remote Support */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asistencia Remota · Fin de Freeware Personal
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Reemplazar TeamViewer Free / AnyDesk por RustDesk
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Sustituye TeamViewer edición gratuita (prohibido en empresas) y licencias propietarias caras por RustDesk (GNU AGPLv3) en Dirección, Administración y Servidor.
              </p>
            </div>
            <button
              onClick={() =>
                handleBulkAction(
                  'remote_gpl',
                  'Soporte remoto unificado con RustDesk (GNU AGPLv3) a coste 0 €.'
                )
              }
              className="mt-4 w-full px-4 py-2 text-xs font-medium bg-slate-900 dark:bg-sky-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Unificar con RustDesk (0 €)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Policy 5: Graphic Design 64-bit */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diseño Gráfico · Salto a 64 bits Nativo
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Actualizar Diseño (PC-02) a GIMP + Inkscape 64 bits
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Retira la copia pirata de diseño y la versión de 32 bits de GIMP (limitada por WOW64), instalando la suite nativa de 64 bits bajo licencia GNU/GPLv3.
              </p>
            </div>
            <button
              onClick={() =>
                handleBulkAction(
                  'design_gpl',
                  'Estación de Diseño (PC-02) actualizada a GIMP + Inkscape 64 bits nativo (GNU/GPL).'
                )
              }
              className="mt-4 w-full px-4 py-2 text-xs font-medium bg-slate-900 dark:bg-sky-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Actualizar Suite Gráfica x64</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Policy 6: OS & Architecture Remediation */}
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistemas Operativos · Arquitectura y OEM
              </p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                Corregir SO en PC-01, PC-03, PC-04 y SRV-01
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Pasa PC-01 a 64 bits para desbloquear sus 8 GB RAM, instala Debian 12 (32 bits) en el Atom x86 de PC-03, regulariza la licencia OEM transferida en PC-04 y pasa SRV-01 a Linux LTS.
              </p>
            </div>
            <button
              onClick={() =>
                handleBulkAction(
                  'os_fix_all',
                  'Sistemas operativos alineados en arquitectura (32/64 bits) y licencias OEM/Retail/GPL regularizadas.'
                )
              }
              className="mt-4 w-full px-4 py-2 text-xs font-medium bg-sky-700 hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Regularizar todos los SO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Matrix Comparison of License Types */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Tabla Técnica de Referencia: Tipos de Licencia en Auditoría Informática</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Criterios legales y técnicos para distinguir{' '}
              <LicenseTooltip licenseType="OEM">OEM</LicenseTooltip>,{' '}
              <LicenseTooltip licenseType="Retail">Retail (FPP)</LicenseTooltip>,{' '}
              <LicenseTooltip licenseType="Volumen">Volumen (VLK)</LicenseTooltip>,{' '}
              <LicenseTooltip licenseType="GNU_GPL">GNU/GPL</LicenseTooltip> y licencias restringidas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4 font-semibold">Tipo de Licencia</th>
                <th className="py-3 px-4 font-semibold">¿Válida en Empresa?</th>
                <th className="py-3 px-4 font-semibold">Transferencia de Hardware</th>
                <th className="py-3 px-4 font-semibold">Código Fuente</th>
                <th className="py-3 px-4 font-semibold">Coste Orientativo</th>
                <th className="py-3 pl-4 font-semibold">Regla Crítica de Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {LICENSE_REFERENCE_MATRIX.map((row) => (
                <tr key={row.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    <LicenseTooltip licenseType={row.licenseTypeKey}>
                      {row.type}
                    </LicenseTooltip>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {row.commercialValid}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {row.hardwareTransfer}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {row.sourceCodeAccess}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {row.typicalCost}
                  </td>
                  <td className="py-3 pl-4 text-slate-600 dark:text-slate-400 max-w-md">
                    {row.auditKeyRule}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Full Software Repository & Current Deployment Count */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Repositorio de Software y Despliegue Actual en la Oficina
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consulta qué paquetes están instalados en los {workstations.length} equipos y pasa el cursor sobre cada licencia para ver sus restricciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todas ({SOFTWARE_CATALOG.length})
            </button>
            {(['ofimatica', 'compresor', 'pdf', 'diseno', 'remoto', 'contabilidad'] as SoftwareCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategoryFilter === cat
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">Aplicación</th>
                <th className="py-2.5 px-3 font-semibold">Categoría</th>
                <th className="py-2.5 px-3 font-semibold">Arquitectura</th>
                <th className="py-2.5 px-3 font-semibold">Tipo Licencia</th>
                <th className="py-2.5 px-3 font-semibold">Estado Legal Empresa</th>
                <th className="py-2.5 px-3 font-semibold text-right">Coste / Puesto</th>
                <th className="py-2.5 pl-3 font-semibold">Equipos con este paquete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCatalog.map((item) => {
                const installedOn = workstations.filter((w) =>
                  w.installedSoftwareIds.includes(item.id)
                );
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.categoryLabel}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.arch}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                      <LicenseTooltip licenseType={item.licenseType} />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.commercialAllowed ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Autorizado</span>
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Infracción EULA</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {item.costPerSeat} €
                    </td>
                    <td className="py-3 pl-3">
                      {installedOn.length === 0 ? (
                        <span className="text-slate-400">Ninguno</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {installedOn.map((w) => (
                            <button
                              key={w.id}
                              onClick={() => onSelectWorkstation(w.id)}
                              className="text-xs font-mono font-medium text-sky-700 dark:text-sky-400 hover:underline whitespace-nowrap"
                            >
                              {w.code}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
