import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LicenseType } from '../data/auditScenario';
import { HelpCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

export interface LicenseTooltipInfo {
  code: LicenseType;
  shortName: string;
  fullName: string;
  commercialAllowed: boolean;
  commercialSummary: string;
  hardwareBinding: string;
  legalRestrictions: string;
}

export const LICENSE_TOOLTIP_DATA: Record<LicenseType, LicenseTooltipInfo> = {
  OEM: {
    code: 'OEM',
    shortName: 'OEM',
    fullName: 'Original Equipment Manufacturer (Licencia de Fabricante)',
    commercialAllowed: true,
    commercialSummary: 'Válida en empresa solo en el equipo original.',
    hardwareBinding: 'Vinculada permanentemente a la 1ª placa base donde se activó.',
    legalRestrictions:
      'Prohibido transferirla a otro PC o reutilizarla si se cambia la placa base por actualización. Solo incluye soporte del ensamblador.',
  },
  Retail: {
    code: 'Retail',
    shortName: 'Retail (FPP)',
    fullName: 'Full Packaged Product (Licencia Comercial Completa)',
    commercialAllowed: true,
    commercialSummary: '100% válida en empresa (ediciones Pro / Comerciales).',
    hardwareBinding: 'Transferible de un ordenador a otro (1 puesto activo simultáneo).',
    legalRestrictions:
      'Permite cambiar de placa base o migrar la licencia a un PC nuevo siempre que se desinstale previamente del equipo antiguo y se conserve la factura.',
  },
  Volumen: {
    code: 'Volumen',
    shortName: 'Volumen (VLK)',
    fullName: 'Volume Licensing Key (Contrato Corporativo MAK / KMS)',
    commercialAllowed: true,
    commercialSummary: 'Válida para flotas empresariales e instituciones.',
    hardwareBinding: 'Reasignable entre equipos de la misma organización.',
    legalRestrictions:
      'Exige un mínimo contractual (habitualmente 5 licencias activas en la empresa). Prohibido vender o ceder claves VLK de forma individual fuera de la empresa.',
  },
  GNU_GPL: {
    code: 'GNU_GPL',
    shortName: 'GNU/GPL',
    fullName: 'GNU General Public License / LGPL / MPL (Software Libre)',
    commercialAllowed: true,
    commercialSummary: '100% legal en empresas sin límite de puestos ni coste (0 €).',
    hardwareBinding: 'Sin restricción de hardware, CPU ni número de instalaciones.',
    legalRestrictions:
      'Garantiza las 4 libertades del software libre (incluido uso comercial). La única restricción legal (Copyleft) aplica si modificas y redistribuyes el código fuente, que debe mantener la misma licencia libre.',
  },
  Hogar_Estudiantes: {
    code: 'Hogar_Estudiantes',
    shortName: 'Hogar y Estudiantes',
    fullName: 'Licencia Doméstica / Académica No Comercial',
    commercialAllowed: false,
    commercialSummary: 'PROHIBIDA en empresas, oficinas y actividades con ánimo de lucro.',
    hardwareBinding: '1 equipo doméstico (no corporativo).',
    legalRestrictions:
      'El contrato EULA prohíbe expresamente su uso en actividades mercantiles, profesionales o administrativas de una empresa, aunque la clave sea original.',
  },
  Freeware_Personal: {
    code: 'Freeware_Personal',
    shortName: 'Freeware Personal',
    fullName: 'Software Propietario Gratuito Solo para Uso Doméstico',
    commercialAllowed: false,
    commercialSummary: 'PROHIBIDO en entornos profesionales o corporativos.',
    hardwareBinding: 'Sin coste en uso particular; bloqueado en uso comercial.',
    legalRestrictions:
      'A diferencia del Software Libre (GNU/GPL), el Freeware personal (ej. TeamViewer Free) es código cerrado cuyo autor prohíbe usar gratis dentro de una empresa.',
  },
  Trial_Expirado: {
    code: 'Trial_Expirado',
    shortName: 'Trial Expirado',
    fullName: 'Shareware / Versión de Evaluación Vencida',
    commercialAllowed: false,
    commercialSummary: 'INCUMPLIMIENTO tras superar el plazo de prueba (ej. 40 días).',
    hardwareBinding: 'Temporal durante evaluación.',
    legalRestrictions:
      'El Shareware (como WinRAR) obliga por licencia a adquirir la licencia comercial o desinstalar el programa una vez concluido el periodo de evaluación.',
  },
  Crack_Ilegal: {
    code: 'Crack_Ilegal',
    shortName: 'Crack / Sin Licencia',
    fullName: 'Software Modificado Ilegalmente o Activador No Oficial',
    commercialAllowed: false,
    commercialSummary: 'DELITO / INFRACCIÓN GRAVE contra la propiedad intelectual.',
    hardwareBinding: 'Nulo (binario alterado).',
    legalRestrictions:
      'Expone a la empresa a fuertes sanciones económicas en auditorías de fabricantes (BSA) y supone un vector crítico de entrada de troyanos y ransomware.',
  },
};

interface LicenseTooltipProps {
  licenseType: LicenseType;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export const LicenseTooltip: React.FC<LicenseTooltipProps> = ({
  licenseType,
  children,
  showIcon = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'top',
  });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const info = LICENSE_TOOLTIP_DATA[licenseType] || LICENSE_TOOLTIP_DATA.GNU_GPL;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 310;
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceAbove > 210 ? 'top' : 'bottom';

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    const viewportWidth = window.innerWidth;
    if (left < 12) left = 12;
    if (left + tooltipWidth > viewportWidth - 12) {
      left = viewportWidth - tooltipWidth - 12;
    }

    const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8;
    setCoords({ top, left, placement });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-label={`Información legal sobre licencia ${info.shortName}`}
        onMouseEnter={() => {
          updatePosition();
          setIsOpen(true);
        }}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => {
          updatePosition();
          setIsOpen(true);
        }}
        onBlur={() => setIsOpen(false)}
        onClick={(e) => {
          // Allow mobile/touch users to tap the tooltip trigger without accidentally toggling a parent card if they tap the question icon
          e.stopPropagation();
          updatePosition();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 underline decoration-dotted decoration-current/60 underline-offset-3 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xs ${className}`}
      >
        <span>{children ?? info.shortName}</span>
        {showIcon && <HelpCircle className="w-3 h-3 opacity-75 shrink-0" />}
      </span>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: 310,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
              zIndex: 9999,
            }}
            className="pointer-events-none p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 border border-slate-700 shadow-xl text-xs leading-relaxed"
          >
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <span className="font-mono font-bold text-sky-400 block">
                  Licencia {info.shortName}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {info.fullName}
                </span>
              </div>
              {info.commercialAllowed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
            </div>

            <div className="space-y-1.5 mt-2 text-[11px]">
              <p>
                <strong className="text-slate-300">Uso en empresa: </strong>
                <span
                  className={
                    info.commercialAllowed
                      ? 'text-emerald-300 font-medium'
                      : 'text-red-300 font-medium'
                  }
                >
                  {info.commercialSummary}
                </span>
              </p>
              <p>
                <strong className="text-slate-300">Hardware / Placa: </strong>
                <span className="text-slate-200">{info.hardwareBinding}</span>
              </p>
              <p className="pt-1 border-t border-slate-800/80 text-slate-300">
                <strong className="text-sky-300">Restricción EULA: </strong>
                {info.legalRestrictions}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
