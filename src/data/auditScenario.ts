export type CpuArch = 'x86_32' | 'x86_64';
export type OsArch = '32-bit' | '64-bit';
export type LicenseType =
  | 'OEM'
  | 'Retail'
  | 'Volumen'
  | 'GNU_GPL'
  | 'Freeware_Personal'
  | 'Trial_Expirado'
  | 'Hogar_Estudiantes'
  | 'Suscripcion'
  | 'Crack_Ilegal';

export type SoftwareCategory =
  | 'ofimatica'
  | 'compresor'
  | 'pdf'
  | 'diseno'
  | 'remoto'
  | 'multimedia'
  | 'contabilidad';

export interface OsOption {
  id: string;
  name: string;
  family: 'Windows' | 'Linux';
  arch: OsArch;
  licenseType: LicenseType;
  costPerSeat: number;
  minRamGb: number;
  maxAddressableRamGb: number;
  boundToOriginalBoardOnly: boolean;
  /** Fecha de fin de soporte del fabricante si ya ha pasado (sin parches de seguridad). */
  endOfSupport?: string;
  description: string;
}

export interface SoftwareCatalogItem {
  id: string;
  name: string;
  version: string;
  category: SoftwareCategory;
  categoryLabel: string;
  arch: OsArch;
  licenseType: LicenseType;
  costPerSeat: number;
  commercialAllowed: boolean;
  isOpenSource: boolean;
  ramFootprintMb: number;
  /** Fecha de fin de soporte del fabricante si ya ha pasado (sin parches de seguridad). */
  endOfSupport?: string;
  description: string;
  recommendedAlternativeId?: string;
}

export interface WorkstationHardware {
  cpuModel: string;
  cpuArch: CpuArch;
  cpuCores: number;
  ramInstalledGb: number;
  ramType: string;
  storageDesc: string;
  motherboardSerial: string;
  originalOemBoardSerial: string; // If different from motherboardSerial, OEM license was transferred!
}

export interface Workstation {
  id: string;
  code: string;
  name: string;
  department: string;
  userRole: string;
  userName: string;
  floorZone: 'contabilidad' | 'diseno' | 'recepcion' | 'direccion' | 'administracion' | 'servidor';
  hardware: WorkstationHardware;
  osId: string;
  osLicenseSerial: string;
  osOriginMotherboardSerial: string; // Matches originalOemBoardSerial or current board
  /**
   * El equipo trae de fábrica una licencia OEM de Windows Pro en su placa actual. Esa licencia
   * vale para 32 y 64 bits y para la actualización gratuita a Windows 11 Pro, así que
   * reinstalar Windows Pro de 64 bits no cuesta nada.
   */
  ownsWindowsProOem: boolean;
  installedSoftwareIds: string[];
  requiredCategories: SoftwareCategory[];
  needsHighMemoryApp64Bit?: boolean; // e.g. Diseño o Contabilidad pesada
  auditorDiagnosisId: string | null; // Student's selected primary diagnosis
  notes: string;
}

export interface AuditFinding {
  id: string;
  severity: 'critical' | 'warning' | 'optimized';
  domain: 'arquitectura' | 'licencia' | 'catalogo';
  title: string;
  technicalDetail: string;
  didacticRule: string;
}

export interface WorkstationEvaluation {
  workstationId: string;
  usableRamGb: number;
  wastedRamGb: number;
  ramEfficiencyPct: number;
  findings: AuditFinding[];
  isArchValid: boolean;
  isLicenseValid: boolean;
  isCatalogOptimized: boolean;
  isDiagnosisCorrect: boolean;
  totalLicenseCost: number;
  scorePct: number;
}

export const DIAGNOSIS_OPTIONS: { id: string; label: string; category: string }[] = [
  {
    id: 'arch_os32_ram_limit',
    label: 'SO de 32 bits en CPU de 64 bits limita los 8+ GB de RAM a solo ~3,2 GB direccionables',
    category: 'Arquitectura (32 vs 64 bits)',
  },
  {
    id: 'arch_cpu32_os64_crash',
    label: 'Incompatibilidad crítica: SO o aplicaciones de 64 bits asignadas a una CPU física de 32 bits (x86)',
    category: 'Arquitectura (32 vs 64 bits)',
  },
  {
    id: 'arch_app32_design_bottleneck',
    label: 'Software de diseño de 32 bits y utilidades sin licencia en estación de trabajo de 64 bits (32 GB RAM)',
    category: 'Arquitectura y Catálogo',
  },
  {
    id: 'lic_oem_transferred',
    label: 'Infracción OEM: Licencia Windows OEM reutilizada tras cambiar de placa base/equipo completo',
    category: 'Licenciamiento (OEM vs Retail)',
  },
  {
    id: 'lic_home_and_freeware_commercial',
    label: 'Incumplimiento EULA: Licencia Hogar/Estudiantes y Freeware solo personal en entorno empresarial',
    category: 'Licenciamiento Comercial',
  },
  {
    id: 'lic_volume_underlicensed_and_redundancy',
    label: 'Catálogo redundante y exceso de coste por herramientas propietarias duplicadas sustituibles por GNU/GPL',
    category: 'Optimización de Catálogo y Volumen',
  },
];

export const OS_CATALOG: OsOption[] = [
  {
    id: 'win10_pro_32_oem',
    name: 'Windows 10 Pro (32 bits / x86) — OEM',
    family: 'Windows',
    arch: '32-bit',
    licenseType: 'OEM',
    costPerSeat: 115, // 0 si el equipo ya trae su licencia OEM (ver ownsWindowsProOem)
    minRamGb: 1,
    maxAddressableRamGb: 3.2,
    boundToOriginalBoardOnly: true,
    endOfSupport: '14/10/2025',
    description: 'Preinstalado de fábrica. Límite de direccionamiento de memoria de 2³² bytes (4 GB teóricos, ~3,2 GB útiles). Vinculado a la placa base original. La licencia de Windows 10 Pro vale igual para 32 y 64 bits: pasar a 64 bits no exige comprar otra. Sin soporte de seguridad desde el 14/10/2025.',
  },
  {
    id: 'win11_pro_64_oem',
    name: 'Windows 11 Pro (64 bits / x64) — OEM',
    family: 'Windows',
    arch: '64-bit',
    licenseType: 'OEM',
    costPerSeat: 115,
    minRamGb: 4,
    maxAddressableRamGb: 2048,
    boundToOriginalBoardOnly: true,
    description: 'Licencia OEM del propio equipo. Si el PC vino con Windows 10/11 Pro OEM, instalar Windows 11 Pro de 64 bits es gratis (misma licencia digital). No puede transferirse a otra placa base ni a otro PC.',
  },
  {
    id: 'win11_pro_64_retail',
    name: 'Windows 11 Pro (64 bits / x64) — Retail (FPP)',
    family: 'Windows',
    arch: '64-bit',
    licenseType: 'Retail',
    costPerSeat: 185,
    minRamGb: 4,
    maxAddressableRamGb: 2048,
    boundToOriginalBoardOnly: false,
    description: 'Licencia completa transferible (Full Packaged Product). Permite migrar la licencia a un PC o placa base nueva siempre que se desactive en la anterior.',
  },
  {
    id: 'win11_ent_64_vol',
    name: 'Windows 11 Enterprise (64 bits / x64) — Volumen (VLK)',
    family: 'Windows',
    arch: '64-bit',
    licenseType: 'Volumen',
    costPerSeat: 140,
    minRamGb: 4,
    maxAddressableRamGb: 2048,
    boundToOriginalBoardOnly: false,
    description: 'Licencia de actualización por Volumen: exige que el equipo tenga ya una licencia Windows Pro de base y un acuerdo corporativo (Open Value con mínimo habitual de 5 licencias, o suscripción CSP). Es un SO de escritorio: no sustituye a Windows Server.',
  },
  {
    id: 'ubuntu_2404_64_gpl',
    name: 'Ubuntu Desktop 24.04 LTS (64 bits / amd64) — GNU/GPL',
    family: 'Linux',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    minRamGb: 2,
    maxAddressableRamGb: 2048,
    boundToOriginalBoardOnly: false,
    description: 'Distribución Linux de soporte extendido (64 bits). Licencia libre (GNU/GPL y afines), coste 0 €, uso comercial ilimitado y sin restricción de hardware.',
  },
  {
    id: 'debian_12_32_gpl',
    name: 'Debian 12 Bookworm LXQt (32 bits / i386) — GNU/GPL',
    family: 'Linux',
    arch: '32-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    minRamGb: 1,
    maxAddressableRamGb: 3.5,
    boundToOriginalBoardOnly: false,
    description: 'Sistema ligero de 32 bits para rescatar hardware x86 antiguo (Intel Atom, Pentium M). Es la última versión de Debian con instalador i386 (Debian 13 ya no lo ofrece) y tiene soporte LTS hasta junio de 2028. Licencia libre.',
  },
];

export const SOFTWARE_CATALOG: SoftwareCatalogItem[] = [
  // OFIMÁTICA
  {
    id: 'libreoffice_64_gpl',
    name: 'LibreOffice 24.8 Still (64 bits)',
    version: '24.8.2 x86_64',
    category: 'ofimatica',
    categoryLabel: 'Suite Ofimática',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 280,
    description: 'Suite ofimática libre (MPLv2 / GNU LGPL). Compatible con ODF y DOCX/XLSX. Uso empresarial 100% legal sin coste por puesto.',
  },
  {
    id: 'libreoffice_32_gpl',
    name: 'LibreOffice 7.4 (paquete i386 de Debian 12)',
    version: '7.4.7 i386',
    category: 'ofimatica',
    categoryLabel: 'Suite Ofimática',
    arch: '32-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 190,
    description: 'The Document Foundation ya no publica LibreOffice de 32 bits para Linux; en un sistema i386 se usa el paquete de la distribución (Debian 12 incluye la 7.4 con parches de seguridad). Uso empresarial libre.',
  },
  {
    id: 'msoffice_home_64',
    name: 'Microsoft Office Hogar y Estudiantes 2021 (64 bits)',
    version: '2021 x64',
    category: 'ofimatica',
    categoryLabel: 'Suite Ofimática',
    arch: '64-bit',
    licenseType: 'Hogar_Estudiantes',
    costPerSeat: 149,
    commercialAllowed: false,
    isOpenSource: false,
    ramFootprintMb: 420,
    endOfSupport: '13/10/2026',
    description: '¡PROHIBIDO EN EMPRESAS! El contrato EULA de la edición Hogar y Estudiantes prohíbe expresamente cualquier actividad comercial o con ánimo de lucro. Además, Office 2021 dejó de recibir soporte el 13/10/2026.',
    recommendedAlternativeId: 'libreoffice_64_gpl',
  },
  {
    id: 'msoffice_ltsc_vol_64',
    name: 'Microsoft Office LTSC Standard 2024 (64 bits) — Volumen',
    version: '2024 x64 VLK',
    category: 'ofimatica',
    categoryLabel: 'Suite Ofimática',
    arch: '64-bit',
    licenseType: 'Volumen',
    costPerSeat: 220,
    commercialAllowed: true,
    isOpenSource: false,
    ramFootprintMb: 450,
    description: 'Licencia empresarial por Volumen (VLK). Válida para uso comercial. Ideal solo donde se requieran macros VBA nativas estrictas.',
  },
  {
    id: 'msoffice_pro_retail_32',
    name: 'Microsoft Office Pro 2019 (32 bits) — Retail',
    version: '2019 x86 FPP',
    category: 'ofimatica',
    categoryLabel: 'Suite Ofimática',
    arch: '32-bit',
    licenseType: 'Retail',
    costPerSeat: 295,
    commercialAllowed: true,
    isOpenSource: false,
    ramFootprintMb: 380,
    endOfSupport: '14/10/2025',
    description: 'Versión de 32 bits. Sin soporte de seguridad desde el 14/10/2025. En hojas de cálculo financieras gigantes (>2 GB) en equipos de 64 bits limita el direccionamiento de memoria del proceso.',
  },

  // COMPRESORES DE ARCHIVOS
  {
    id: '7zip_64_gpl',
    name: '7-Zip 24.08 (64 bits)',
    version: '24.08 x64',
    category: 'compresor',
    categoryLabel: 'Compresor de Archivos',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 45,
    description: 'Compresor de código abierto (GNU LGPL). Aprovecha diccionarios de compresión en 64 bits y es gratuito para empresas.',
  },
  {
    id: '7zip_32_gpl',
    name: '7-Zip 24.08 (32 bits / x86)',
    version: '24.08 x86',
    category: 'compresor',
    categoryLabel: 'Compresor de Archivos',
    arch: '32-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 32,
    description: 'Versión de 32 bits compatible con CPUs x86 heredadas. Licencia libre GNU LGPL válida en empresas.',
  },
  {
    id: 'winrar_trial_64',
    name: 'WinRAR 7.0 (64 bits) — Evaluación Expirada (Día 412)',
    version: '7.01 x64 Trial',
    category: 'compresor',
    categoryLabel: 'Compresor de Archivos',
    arch: '64-bit',
    licenseType: 'Trial_Expirado',
    costPerSeat: 0,
    commercialAllowed: false,
    isOpenSource: false,
    ramFootprintMb: 50,
    description: 'Shareware con periodo de prueba de 40 días superado. Seguir usándolo en una empresa sin adquirir licencia incumple la auditoría de software.',
    recommendedAlternativeId: '7zip_64_gpl',
  },
  {
    id: 'winrar_comercial_64',
    name: 'WinRAR 7.0 (64 bits) — Licencia Comercial',
    version: '7.01 x64 Corp',
    category: 'compresor',
    categoryLabel: 'Compresor de Archivos',
    arch: '64-bit',
    licenseType: 'Retail',
    costPerSeat: 36,
    commercialAllowed: true,
    isOpenSource: false,
    ramFootprintMb: 50,
    description: 'Licencia propietaria pagada. Legal, aunque supone un coste evitable existiendo 7-Zip (GNU LGPL).',
  },

  // EDICIÓN Y GESTIÓN PDF
  {
    id: 'pdfsam_64_gpl',
    name: 'PDFsam Basic + Okular (64 bits)',
    version: '5.2.3 x64',
    category: 'pdf',
    categoryLabel: 'Gestión de PDF',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 140,
    description: 'División, fusión y firma de documentos PDF bajo licencia libre GNU AGPLv3 / GPLv2. Coste 0 € para empresas.',
  },
  {
    id: 'evince_32_gpl',
    name: 'Evince / qpdfview (32 bits / x86)',
    version: '43.1 i386',
    category: 'pdf',
    categoryLabel: 'Gestión de PDF',
    arch: '32-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 65,
    description: 'Visor ligero de documentos PDF e impresión para sistemas de 32 bits bajo licencia GNU/GPL.',
  },
  {
    id: 'acrobat_pro_crack_64',
    name: 'Adobe Acrobat Pro DC (parcheado con crack)',
    version: '2023 x64 Patched',
    category: 'pdf',
    categoryLabel: 'Gestión de PDF',
    arch: '64-bit',
    licenseType: 'Crack_Ilegal',
    costPerSeat: 0,
    commercialAllowed: false,
    isOpenSource: false,
    ramFootprintMb: 520,
    description: '¡INFRACCIÓN GRAVE! Binario modificado con parche ilegal. Riesgo de malware y sanción legal severa en auditoría BSA.',
    recommendedAlternativeId: 'pdfsam_64_gpl',
  },
  {
    id: 'acrobat_std_retail_64',
    name: 'Adobe Acrobat Standard (64 bits) — Suscripción Anual',
    version: '2024 x64',
    category: 'pdf',
    categoryLabel: 'Gestión de PDF',
    arch: '64-bit',
    licenseType: 'Suscripcion',
    costPerSeat: 180,
    commercialAllowed: true,
    isOpenSource: false,
    ramFootprintMb: 480,
    description: 'Suscripción comercial oficial (pago anual por usuario). Legal pero costosa si solo se necesita unir, dividir o leer documentos PDF.',
  },

  // DISEÑO GRÁFICO E IMAGEN
  {
    id: 'gimp_inkscape_64_gpl',
    name: 'GIMP 2.10 + Inkscape 1.3 (64 bits)',
    version: 'Suite Gráfica x64',
    category: 'diseno',
    categoryLabel: 'Diseño Gráfico y Vectorial',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 850,
    description: 'Suite de retoque fotográfico y diseño vectorial en 64 bits bajo licencia GNU/GPLv3. Aprovecha los 32 GB de RAM sin límites.',
  },
  {
    id: 'gimp_32_gpl',
    name: 'GIMP 2.10 (Compilación 32 bits / x86)',
    version: '2.10.32 x86 (WOW64)',
    category: 'diseno',
    categoryLabel: 'Diseño Gráfico y Vectorial',
    arch: '32-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 600,
    description: 'Aunque es legal (GNU/GPL), al ser de 32 bits se ejecuta mediante WOW64 y cada proceso queda limitado a 2 GB (4 GB si está compilado como LARGEADDRESSAWARE), por mucha RAM que tenga la estación.',
    recommendedAlternativeId: 'gimp_inkscape_64_gpl',
  },
  {
    id: 'photoshop_crack_64',
    name: 'Suite Diseño Pro (Copia sin licencia / Portable)',
    version: '2024 x64 Unlicensed',
    category: 'diseno',
    categoryLabel: 'Diseño Gráfico y Vectorial',
    arch: '64-bit',
    licenseType: 'Crack_Ilegal',
    costPerSeat: 0,
    commercialAllowed: false,
    isOpenSource: false,
    ramFootprintMb: 1200,
    description: 'Software comercial ejecutándose sin licencia válida en entorno de producción.',
    recommendedAlternativeId: 'gimp_inkscape_64_gpl',
  },

  // SOPORTE REMOTO
  {
    id: 'rustdesk_64_gpl',
    name: 'RustDesk Client (64 bits)',
    version: '1.3.1 x64',
    category: 'remoto',
    categoryLabel: 'Soporte Remoto',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 85,
    description: ' Escritorio remoto de código abierto (GNU AGPLv3) autoalojable en el servidor local de la oficina. Coste 0 €.',
  },
  {
    id: 'teamviewer_free_64',
    name: 'TeamViewer (Edición Gratuita Uso Personal)',
    version: '15.5 x64 Free',
    category: 'remoto',
    categoryLabel: 'Soporte Remoto',
    arch: '64-bit',
    licenseType: 'Freeware_Personal',
    costPerSeat: 0,
    commercialAllowed: false,
    isOpenSource: false,
    ramFootprintMb: 130,
    description: 'Freeware exclusivo para uso personal no comercial. Utilizarlo para asistencia en una oficina vulnera los términos de licencia.',
    recommendedAlternativeId: 'rustdesk_64_gpl',
  },
  {
    id: 'anydesk_comercial_64',
    name: 'AnyDesk Standard (Suscripción Comercial)',
    version: '8.0 x64',
    category: 'remoto',
    categoryLabel: 'Soporte Remoto',
    arch: '64-bit',
    licenseType: 'Suscripcion',
    costPerSeat: 178,
    commercialAllowed: true,
    isOpenSource: false,
    ramFootprintMb: 95,
    description: 'Suscripción comercial propietaria (pago anual). Legal, pero supone un gasto recurrente frente a RustDesk (GNU AGPLv3).',
  },

  // CONTABILIDAD / ERP
  {
    id: 'gnucash_kimai_64_gpl',
    name: 'GnuCash + FacturaScripts (64 bits)',
    version: '5.8 x64',
    category: 'contabilidad',
    categoryLabel: 'Contabilidad y Facturación',
    arch: '64-bit',
    licenseType: 'GNU_GPL',
    costPerSeat: 0,
    commercialAllowed: true,
    isOpenSource: true,
    ramFootprintMb: 240,
    description: 'ERP y contabilidad de doble partida de 64 bits bajo licencia libre GNU/GPLv3. Sin coste por puesto.',
  },
  {
    id: 'erp_fiscal_64_retail',
    name: 'ContaGest Pro 64 bits (ficticio) — Suscripción Anual',
    version: '2025 x64',
    category: 'contabilidad',
    categoryLabel: 'Contabilidad y Facturación',
    arch: '64-bit',
    licenseType: 'Suscripcion',
    costPerSeat: 190,
    commercialAllowed: true,
    isOpenSource: false,
    ramFootprintMb: 390,
    description: 'Programa contable comercial (nombre ficticio) de 64 bits con suscripción anual. Requiere un sistema operativo de 64 bits. Es la herramienta de trabajo de la contable: cambiarla no es decisión del técnico de sistemas.',
  },
];

export const INITIAL_WORKSTATIONS: Workstation[] = [
  {
    id: 'pc-01',
    code: 'PC-01',
    name: 'Puesto Contabilidad Principal',
    department: 'Contabilidad y Finanzas',
    userRole: 'Responsable Contable',
    userName: 'Marta Gómez',
    floorZone: 'contabilidad',
    hardware: {
      cpuModel: 'Intel Core i5-10400 @ 2.90GHz',
      cpuArch: 'x86_64',
      cpuCores: 6,
      ramInstalledGb: 8,
      ramType: 'DDR4 2666 MHz',
      storageDesc: '512 GB NVMe SSD',
      motherboardSerial: 'MB-ASUS-H410-8821',
      originalOemBoardSerial: 'MB-ASUS-H410-8821',
    },
    osId: 'win10_pro_32_oem',
    osLicenseSerial: 'OEM-W10P32-00491-AA82',
    osOriginMotherboardSerial: 'MB-ASUS-H410-8821',
    ownsWindowsProOem: true,
    installedSoftwareIds: ['msoffice_pro_retail_32', 'erp_fiscal_64_retail', 'winrar_trial_64', 'pdfsam_64_gpl'],
    requiredCategories: ['ofimatica', 'contabilidad', 'compresor', 'pdf'],
    needsHighMemoryApp64Bit: true,
    auditorDiagnosisId: null,
    notes: 'La usuaria reporta que el sistema solo reconoce 3,2 GB de sus 8 GB de RAM instalados y que el programa contable ContaGest de 64 bits da error de arquitectura al iniciar.',
  },
  {
    id: 'pc-02',
    code: 'PC-02',
    name: 'Estación de Diseño Gráfico y CAD',
    department: 'Diseño y Maquetación',
    userRole: 'Diseñador Senior',
    userName: 'Carlos Ruiz',
    floorZone: 'diseno',
    hardware: {
      cpuModel: 'AMD Ryzen 7 5800X @ 3.80GHz',
      cpuArch: 'x86_64',
      cpuCores: 8,
      ramInstalledGb: 32,
      ramType: 'DDR4 3200 MHz Dual Channel',
      storageDesc: '1 TB NVMe PCIe 4.0',
      motherboardSerial: 'MB-MSI-B550-4410',
      originalOemBoardSerial: 'MB-MSI-B550-4410',
    },
    osId: 'win11_pro_64_oem',
    osLicenseSerial: 'OEM-W11P64-99201-BB10',
    osOriginMotherboardSerial: 'MB-MSI-B550-4410',
    ownsWindowsProOem: true,
    installedSoftwareIds: ['gimp_32_gpl', 'photoshop_crack_64', 'acrobat_pro_crack_64', 'winrar_trial_64', 'libreoffice_64_gpl'],
    requiredCategories: ['diseno', 'pdf', 'compresor', 'ofimatica'],
    needsHighMemoryApp64Bit: true,
    auditorDiagnosisId: null,
    notes: 'Tiene 32 GB de RAM y SO de 64 bits, pero usa GIMP de 32 bits (se cierra al superar 2 GB de RAM por lienzo) junto con software de diseño y PDF activados mediante cracks ilegales.',
  },
  {
    id: 'pc-03',
    code: 'PC-03',
    name: 'Terminal Ligero de Recepción y Etiquetado',
    department: 'Recepción y Logística',
    userRole: 'Recepción / Atención al Cliente',
    userName: 'Elena Vargas',
    floorZone: 'recepcion',
    hardware: {
      cpuModel: 'Intel Atom N270 @ 1.60GHz (32 bits puro)',
      cpuArch: 'x86_32',
      cpuCores: 1,
      ramInstalledGb: 2,
      ramType: 'DDR2 533 MHz',
      storageDesc: '120 GB SATA SSD',
      motherboardSerial: 'MB-INTEL-945GSE-102',
      originalOemBoardSerial: 'MB-INTEL-945GSE-102',
    },
    osId: 'ubuntu_2404_64_gpl',
    osLicenseSerial: 'GPL-UBUNTU-AMD64-FREE',
    osOriginMotherboardSerial: 'MB-INTEL-945GSE-102',
    ownsWindowsProOem: false,
    installedSoftwareIds: ['libreoffice_64_gpl', '7zip_64_gpl', 'pdfsam_64_gpl'],
    requiredCategories: ['ofimatica', 'compresor', 'pdf'],
    needsHighMemoryApp64Bit: false,
    auditorDiagnosisId: null,
    notes: 'Un técnico en prácticas intentó desplegar una imagen estándar de Ubuntu 24.04 (64 bits / amd64) y paquetes de 64 bits en este mini-PC industrial cuya CPU es de 32 bits (x86). El sistema no arranca ("This kernel requires an x86-64 CPU, but only detected an i686 CPU").',
  },
  {
    id: 'pc-04',
    code: 'PC-04',
    name: 'Despacho de Dirección General',
    department: 'Dirección',
    userRole: 'Director Gerente',
    userName: 'Roberto Solís',
    floorZone: 'direccion',
    hardware: {
      cpuModel: 'Intel Core i7-13700 @ 3.40GHz',
      cpuArch: 'x86_64',
      cpuCores: 16,
      ramInstalledGb: 16,
      ramType: 'DDR5 5200 MHz',
      storageDesc: '1 TB NVMe SSD',
      motherboardSerial: 'MB-GIGABYTE-Z790-NEW99',
      originalOemBoardSerial: 'MB-DELL-OPTIPLEX-OLD2018',
    },
    osId: 'win11_pro_64_oem',
    osLicenseSerial: 'OEM-DELL-2018-TRANSFERRED',
    osOriginMotherboardSerial: 'MB-DELL-OPTIPLEX-OLD2018',
    ownsWindowsProOem: false,
    installedSoftwareIds: ['msoffice_home_64', 'acrobat_std_retail_64', 'anydesk_comercial_64', 'winrar_comercial_64'],
    requiredCategories: ['ofimatica', 'pdf', 'remoto', 'compresor'],
    needsHighMemoryApp64Bit: false,
    auditorDiagnosisId: null,
    notes: 'El equipo es nuevo (placa Gigabyte Z790), pero para ahorrar costes se reutilizó la clave Windows OEM de un viejo Dell OptiPlex averiado en 2018. Además utiliza Office Hogar y Estudiantes en la empresa.',
  },
  {
    id: 'pc-05',
    code: 'PC-05',
    name: 'Puesto de Administración y Facturación',
    department: 'Administración',
    userRole: 'Administrativa',
    userName: 'Lucía Fernández',
    floorZone: 'administracion',
    hardware: {
      cpuModel: 'AMD Ryzen 5 5600G @ 3.90GHz',
      cpuArch: 'x86_64',
      cpuCores: 6,
      ramInstalledGb: 16,
      ramType: 'DDR4 3200 MHz',
      storageDesc: '512 GB NVMe SSD',
      motherboardSerial: 'MB-ASROCK-B450-7731',
      originalOemBoardSerial: 'MB-ASROCK-B450-7731',
    },
    osId: 'win11_pro_64_oem',
    osLicenseSerial: 'OEM-W11P64-77310-CC04',
    osOriginMotherboardSerial: 'MB-ASROCK-B450-7731',
    ownsWindowsProOem: true,
    installedSoftwareIds: ['msoffice_home_64', 'teamviewer_free_64', 'winrar_trial_64', 'pdfsam_64_gpl'],
    requiredCategories: ['ofimatica', 'remoto', 'compresor', 'pdf'],
    needsHighMemoryApp64Bit: false,
    auditorDiagnosisId: null,
    notes: 'Hardware y SO OEM legítimos de 64 bits, pero tiene instalado Microsoft Office Hogar y Estudiantes, TeamViewer Free (uso personal) y WinRAR con evaluación expirada.',
  },
  {
    id: 'srv-01',
    code: 'SRV-01',
    name: 'Servidor Local de Archivos y Copias',
    department: 'Sistemas / CPD',
    userRole: 'Servidor Departamental',
    userName: 'Sistemas IT',
    floorZone: 'servidor',
    hardware: {
      cpuModel: 'Intel Xeon E-2336 @ 2.90GHz',
      cpuArch: 'x86_64',
      cpuCores: 6,
      ramInstalledGb: 32,
      ramType: 'DDR4 ECC 3200 MHz',
      storageDesc: '2x 2TB RAID-1 Enterprise SSD',
      motherboardSerial: 'MB-SUPERMICRO-X12-001',
      originalOemBoardSerial: 'MB-SUPERMICRO-X12-001',
    },
    osId: 'win11_ent_64_vol',
    osLicenseSerial: 'VLK-MAK-1OF5-9901',
    osOriginMotherboardSerial: 'MB-SUPERMICRO-X12-001',
    ownsWindowsProOem: false,
    installedSoftwareIds: ['msoffice_ltsc_vol_64', 'acrobat_std_retail_64', 'anydesk_comercial_64', 'winrar_comercial_64', '7zip_64_gpl'],
    requiredCategories: ['compresor', 'remoto'],
    needsHighMemoryApp64Bit: false,
    auditorDiagnosisId: null,
    notes: 'Tiene contratada 1 sola licencia por Volumen (cuando los contratos por Volumen exigen mínimo 5 licencias en la empresa) sobre una placa de servidor que no trae licencia Windows Pro de base, usa un Windows de escritorio como servidor de archivos (máximo 20 conexiones entrantes) y tiene instaladas suites ofimáticas y PDF de pago innecesarias.',
  },
];

export const EXPECTED_DIAGNOSIS_BY_WORKSTATION: Record<string, string> = {
  'pc-01': 'arch_os32_ram_limit',
  'pc-02': 'arch_app32_design_bottleneck',
  'pc-03': 'arch_cpu32_os64_crash',
  'pc-04': 'lic_oem_transferred',
  'pc-05': 'lic_home_and_freeware_commercial',
  'srv-01': 'lic_volume_underlicensed_and_redundancy',
};

/** Configuración corregida de referencia de cada puesto (botón «Aplicar solución guiada»). */
export const GUIDED_REMEDIATION: Record<string, { osId: string; softwareIds: string[] }> = {
  // La licencia OEM Pro del equipo vale para Windows 11 Pro de 64 bits sin coste,
  // y el programa contable es la herramienta de la usuaria: se conserva
  'pc-01': {
    osId: 'win11_pro_64_oem',
    softwareIds: [
      'libreoffice_64_gpl',
      'erp_fiscal_64_retail',
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

export const CATEGORY_LABELS: Record<SoftwareCategory, string> = {
  ofimatica: 'Ofimática',
  compresor: 'Compresor',
  pdf: 'Gestión PDF',
  diseno: 'Diseño Gráfico',
  remoto: 'Soporte Remoto',
  multimedia: 'Multimedia',
  contabilidad: 'Contabilidad / ERP',
};

export function evaluateWorkstation(
  ws: Workstation,
  allWorkstations: Workstation[]
): WorkstationEvaluation {
  const findings: AuditFinding[] = [];
  const os = OS_CATALOG.find((o) => o.id === ws.osId) || OS_CATALOG[0];
  const installedApps = ws.installedSoftwareIds
    .map((id) => SOFTWARE_CATALOG.find((s) => s.id === id))
    .filter((s): s is SoftwareCatalogItem => Boolean(s));

  // Count volume seats across entire office
  const volumeOsCount = allWorkstations.filter((w) => {
    const wOs = OS_CATALOG.find((o) => o.id === w.osId);
    return wOs?.licenseType === 'Volumen';
  }).length;
  const volumeAppCount = allWorkstations.reduce((acc, w) => {
    const countInW = w.installedSoftwareIds.filter((id) => {
      const app = SOFTWARE_CATALOG.find((s) => s.id === id);
      return app?.licenseType === 'Volumen';
    }).length;
    return acc + countInW;
  }, 0);
  const totalVolumeSeatsInCompany = volumeOsCount + volumeAppCount;

  // 1. Evaluate CPU vs OS Architecture
  let isArchValid = true;
  let usableRamGb = ws.hardware.ramInstalledGb;

  if (ws.hardware.cpuArch === 'x86_32' && os.arch === '64-bit') {
    isArchValid = false;
    usableRamGb = 0;
    findings.push({
      id: `${ws.id}-cpu32-os64`,
      severity: 'critical',
      domain: 'arquitectura',
      title: 'Fallo de arranque: SO de 64 bits en procesador de 32 bits (x86)',
      technicalDetail: `El procesador ${ws.hardware.cpuModel} solo soporta el juego de instrucciones IA-32 (x86). No puede ejecutar ${os.name}.`,
      didacticRule: 'Un procesador de 64 bits puede ejecutar un SO de 32 o 64 bits, pero una CPU de 32 bits JAMÁS puede ejecutar un sistema operativo ni aplicaciones de 64 bits.',
    });
  } else if (os.arch === '32-bit') {
    usableRamGb = Math.min(ws.hardware.ramInstalledGb, os.maxAddressableRamGb);
    // Con 4 GB justos ya se pierden ~0,8 GB por el hueco de MMIO bajo los 4 GB
    if (ws.hardware.ramInstalledGb > os.maxAddressableRamGb) {
      isArchValid = false;
      const wasted = +(ws.hardware.ramInstalledGb - usableRamGb).toFixed(1);
      findings.push({
        id: `${ws.id}-os32-ramwaste`,
        severity: 'critical',
        domain: 'arquitectura',
        title: `Cuello de botella de RAM: ${wasted} GB desaprovechados por SO de 32 bits`,
        technicalDetail: `El equipo dispone de ${ws.hardware.ramInstalledGb} GB de RAM física y CPU de 64 bits, pero ${os.name} solo puede direccionar 2³² posiciones (${usableRamGb} GB útiles).`,
        didacticRule: 'En equipos con 4 GB o más de RAM y CPU x86_64, debe instalarse un sistema operativo de 64 bits para direccionar toda la memoria física.',
      });
    }
  }

  // 2. Evaluate OS vs Installed Applications Architecture
  for (const app of installedApps) {
    if (app.arch === '64-bit' && (os.arch === '32-bit' || ws.hardware.cpuArch === 'x86_32')) {
      isArchValid = false;
      findings.push({
        id: `${ws.id}-app64-on-os32-${app.id}`,
        severity: 'critical',
        domain: 'arquitectura',
        title: `Binario de 64 bits incompatible: ${app.name}`,
        technicalDetail: `No se puede ejecutar la aplicación de 64 bits "${app.name}" sobre un entorno de 32 bits (${os.name}).`,
        didacticRule: 'Un sistema operativo de 32 bits no dispone de registros de 64 bits ni subsistema para ejecutar binarios x86_64.',
      });
    } else if (
      app.arch === '32-bit' &&
      os.arch === '64-bit' &&
      ws.needsHighMemoryApp64Bit &&
      (app.category === 'diseno' || app.category === 'ofimatica')
    ) {
      isArchValid = false;
      findings.push({
        id: `${ws.id}-app32-wow64-bottleneck-${app.id}`,
        severity: 'warning',
        domain: 'arquitectura',
        title: `Limitación WOW64 en estación de alto rendimiento: ${app.name}`,
        technicalDetail: `Aunque un SO de 64 bits ejecuta programas de 32 bits mediante WOW64, "${app.name}" queda limitado a 2-4 GB de RAM y desaprovecha los ${ws.hardware.ramInstalledGb} GB del equipo.`,
        didacticRule: 'En estaciones de diseño o cálculo intensivo de 64 bits, sustituye las versiones de 32 bits por compilaciones nativas de 64 bits (x86_64).',
      });
    }
  }

  // 3. Evaluate OS Licensing
  let isLicenseValid = true;
  if (
    os.licenseType === 'OEM' &&
    ws.hardware.motherboardSerial !== ws.hardware.originalOemBoardSerial &&
    ws.osOriginMotherboardSerial === ws.hardware.originalOemBoardSerial
  ) {
    isLicenseValid = false;
    findings.push({
      id: `${ws.id}-oem-transfer-violation`,
      severity: 'critical',
      domain: 'licencia',
      title: 'Licencia OEM inválida: Transferida desde otra placa base',
      technicalDetail: `La clave OEM estaba vinculada a la placa "${ws.hardware.originalOemBoardSerial}" y no es transferible a la placa nueva "${ws.hardware.motherboardSerial}".`,
      didacticRule: 'Las licencias OEM mueren con la placa base del equipo original donde se preinstalaron (salvo sustitución en garantía por el fabricante). Para el PC nuevo hace falta una licencia Retail (FPP) transferible, una licencia nueva para ese equipo o migrar a software libre. Una licencia por Volumen de Windows no sirve sola: es de actualización.',
    });
  }

  if (os.family === 'Windows' && os.licenseType === 'Volumen' && !ws.ownsWindowsProOem) {
    isLicenseValid = false;
    findings.push({
      id: `${ws.id}-os-vol-no-base`,
      severity: 'critical',
      domain: 'licencia',
      title: 'Licencia por Volumen de Windows sin licencia base',
      technicalDetail: `${os.name} es una licencia de actualización y este equipo no tiene ninguna licencia Windows Pro de base.`,
      didacticRule: 'Las licencias por Volumen de Windows para escritorio solo actualizan una licencia previa que cumpla los requisitos (Windows Pro). Sin ella el equipo no está licenciado.',
    });
  }

  if (ws.floorZone === 'servidor' && os.family === 'Windows') {
    isLicenseValid = false;
    findings.push({
      id: `${ws.id}-desktop-os-as-server`,
      severity: 'warning',
      domain: 'licencia',
      title: 'Sistema operativo de escritorio usado como servidor',
      technicalDetail: `${os.name} limita a 20 los dispositivos que pueden conectarse a la vez para compartir archivos o impresoras.`,
      didacticRule: 'Un servidor de archivos de oficina necesita Windows Server con sus CAL o un servidor Linux con Samba (libre), no una licencia de escritorio.',
    });
  }

  if (os.licenseType === 'Volumen' && totalVolumeSeatsInCompany < 5) {
    isLicenseValid = false;
    findings.push({
      id: `${ws.id}-os-vol-min5`,
      severity: 'warning',
      domain: 'licencia',
      title: `Contrato por Volumen (VLK) incompleto (${totalVolumeSeatsInCompany}/5 licencias activas)`,
      technicalDetail: `Se ha asignado ${os.name} pero la oficina solo suma ${totalVolumeSeatsInCompany} licencias por volumen (el mínimo habitual de un acuerdo VLK/Open es de 5 licencias elegibles).`,
      didacticRule: 'Las licencias por Volumen son rentables y válidas cuando se estandarizan al menos 5 activos bajo el mismo contrato corporativo; para puestos aislados usa Retail, una licencia OEM nueva o software libre.',
    });
  }

  // 4. Evaluate Software Licenses
  for (const app of installedApps) {
    if (!app.commercialAllowed) {
      isLicenseValid = false;
      const reasonMap: Record<string, string> = {
        Crack_Ilegal: 'Software pirata / activador ilegal (infracción grave de propiedad intelectual y riesgo de seguridad).',
        Trial_Expirado: 'Shareware con periodo de prueba vencido en explotación comercial.',
        Hogar_Estudiantes: 'Licencia Hogar y Estudiantes prohibida en empresas o actividades con ánimo de lucro.',
        Freeware_Personal: 'Freeware restringido a uso doméstico/personal; prohibido en entornos profesionales.',
      };
      findings.push({
        id: `${ws.id}-app-lic-${app.id}`,
        severity: 'critical',
        domain: 'licencia',
        title: `Licencia no conforme en empresa: ${app.name}`,
        technicalDetail: reasonMap[app.licenseType] || 'El contrato EULA prohíbe el uso empresarial de esta licencia.',
        didacticRule: 'En una auditoría empresarial, todo el software debe contar con factura de licencia comercial (OEM/Retail/Volumen) o licencia libre permisiva/copyleft (GNU/GPL, LGPL, MPL, MIT) que autorice el uso comercial.',
      });
    } else if (app.licenseType === 'Volumen' && totalVolumeSeatsInCompany < 5) {
      isLicenseValid = false;
      findings.push({
        id: `${ws.id}-app-vol-min5-${app.id}`,
        severity: 'warning',
        domain: 'licencia',
        title: `Umbral de licencia por Volumen insuficiente en ${app.name} (${totalVolumeSeatsInCompany}/5)`,
        technicalDetail: 'Los acuerdos de licencia por volumen (VLK) exigen un mínimo de 5 licencias corporativas o sustitución por alternativa libre GNU/GPL.',
        didacticRule: 'Alcanza al menos 5 licencias por volumen en la empresa o migra el catálogo a alternativas libres como LibreOffice (GNU LGPL/MPL).',
      });
    }
  }

  // 5. Evaluate Software Catalog Optimization
  let isCatalogOptimized = true;

  // Missing required categories
  for (const reqCat of ws.requiredCategories) {
    const covered = installedApps.some(
      (a) =>
        a.category === reqCat &&
        a.commercialAllowed &&
        !(a.arch === '64-bit' && (os.arch === '32-bit' || ws.hardware.cpuArch === 'x86_32'))
    );
    if (!covered) {
      isCatalogOptimized = false;
      findings.push({
        id: `${ws.id}-missing-cat-${reqCat}`,
        severity: 'critical',
        domain: 'catalogo',
        title: `Falta herramienta esencial para el puesto: ${CATEGORY_LABELS[reqCat]}`,
        technicalDetail: `El perfil de ${ws.department} necesita al menos una aplicación válida y compatible de "${CATEGORY_LABELS[reqCat]}".`,
        didacticRule: 'La optimización del catálogo no consiste solo en desinstalar software ilegal, sino en garantizar que cada puesto conserve todas las utilidades que necesita para trabajar.',
      });
    }
  }

  // Software o SO sin soporte del fabricante: sin parches de seguridad
  const unsupported = [
    ...(os.endOfSupport ? [{ name: os.name, date: os.endOfSupport }] : []),
    ...installedApps.filter((a) => a.endOfSupport).map((a) => ({ name: a.name, date: a.endOfSupport! })),
  ];
  if (unsupported.length > 0) {
    isCatalogOptimized = false;
    findings.push({
      id: `${ws.id}-end-of-support`,
      severity: 'warning',
      domain: 'catalogo',
      title: `Software sin soporte del fabricante: ${unsupported.map((u) => u.name).join(', ')}`,
      technicalDetail: unsupported.map((u) => `${u.name}: sin parches desde el ${u.date}.`).join(' '),
      didacticRule: 'Un programa fuera de soporte no recibe parches de seguridad. En una auditoría se señala aunque la licencia sea legal y debe planificarse su sustitución.',
    });
  }

  // Redundant duplicate apps in the same category
  const categoryCounts: Record<string, SoftwareCatalogItem[]> = {};
  for (const app of installedApps) {
    categoryCounts[app.category] = categoryCounts[app.category] || [];
    categoryCounts[app.category].push(app);
  }
  for (const [cat, appsInCat] of Object.entries(categoryCounts)) {
    if (appsInCat.length > 1) {
      isCatalogOptimized = false;
      findings.push({
        id: `${ws.id}-dup-cat-${cat}`,
        severity: 'warning',
        domain: 'catalogo',
        title: `Duplicidad en catálogo (${CATEGORY_LABELS[cat as SoftwareCategory]}): ${appsInCat.map((a) => a.name).join(' + ')}`,
        technicalDetail: 'Mantener dos herramientas para la misma función consume espacio, complica el mantenimiento y encarece las licencias.',
        didacticRule: 'Homogeneiza el catálogo dejando una única solución estándar por categoría en cada puesto.',
      });
    }
  }

  // Unneeded categories installed (e.g. Office/PDF on file server SRV-01)
  const unneededApps = installedApps.filter(
    (app) => !ws.requiredCategories.includes(app.category)
  );
  if (unneededApps.length > 0) {
    isCatalogOptimized = false;
    findings.push({
      id: `${ws.id}-unneeded-apps`,
      severity: 'warning',
      domain: 'catalogo',
      title: `Software innecesario para el rol del equipo: ${unneededApps.map((a) => a.name).join(', ')}`,
      technicalDetail: `Este puesto (${ws.userRole}) no requiere ${unneededApps.map((a) => CATEGORY_LABELS[a.category]).join(', ')}.`,
      didacticRule: 'En servidores y terminales específicos, desinstala las suites ofimáticas o licencias comerciales que no correspondan a la función del equipo para reducir superficie de ataque y costes.',
    });
  }

  // Check if expensive proprietary tools are used where a 0€ GNU/GPL alternative solves the exact need (especially on non-accounting roles)
  const paidAvoidableApps = installedApps.filter(
    (a) =>
      a.costPerSeat > 0 &&
      (a.category === 'compresor' || a.category === 'pdf' || a.category === 'remoto')
  );
  if (paidAvoidableApps.length > 0) {
    isCatalogOptimized = false;
    findings.push({
      id: `${ws.id}-cost-optimization`,
      severity: 'warning',
      domain: 'catalogo',
      title: `Gasto evitable en utilidades propietarias (${paidAvoidableApps.reduce((s, a) => s + a.costPerSeat, 0)} €)`,
      technicalDetail: `Se están pagando licencias propietarias (${paidAvoidableApps.map((a) => a.name).join(', ')}) cuando existen equivalentes GNU/GPL (7-Zip, PDFsam Basic, RustDesk) a coste 0 €.`,
      didacticRule: 'Optimizar el catálogo de utilidades mediante software libre GNU/GPL (7-Zip, PDFsam, RustDesk) elimina costes recurrentes manteniendo 100% de legalidad.',
    });
  }

  // La licencia OEM Pro que trae el equipo cubre 32/64 bits y la actualización a Windows 11 Pro
  const osCost =
    os.family === 'Windows' && os.licenseType === 'OEM' && ws.ownsWindowsProOem
      ? 0
      : os.costPerSeat;

  const appsCost = installedApps.reduce((sum, app) => sum + app.costPerSeat, 0);
  const totalLicenseCost = osCost + appsCost;

  const isDiagnosisCorrect =
    ws.auditorDiagnosisId === EXPECTED_DIAGNOSIS_BY_WORKSTATION[ws.id];

  const wastedRamGb = Math.max(0, +(ws.hardware.ramInstalledGb - usableRamGb).toFixed(1));
  const ramEfficiencyPct =
    ws.hardware.ramInstalledGb > 0
      ? Math.round((usableRamGb / ws.hardware.ramInstalledGb) * 100)
      : 0;

  let scorePct = 0;
  if (isArchValid) scorePct += 35;
  if (isLicenseValid) scorePct += 35;
  if (isCatalogOptimized) scorePct += 15;
  if (isDiagnosisCorrect) scorePct += 15;

  if (findings.length === 0) {
    findings.push({
      id: `${ws.id}-all-clear`,
      severity: 'optimized',
      domain: 'arquitectura',
      title: 'Equipo 100% auditado, compatible y optimizado',
      technicalDetail: `Arquitectura ${os.arch} alineada con CPU (${ws.hardware.cpuArch}), ${usableRamGb} GB de RAM activos, licencias en regla y catálogo depurado.`,
      didacticRule: 'Cumplimiento normativo y técnico alcanzado.',
    });
  }

  return {
    workstationId: ws.id,
    usableRamGb,
    wastedRamGb,
    ramEfficiencyPct,
    findings,
    isArchValid,
    isLicenseValid,
    isCatalogOptimized,
    isDiagnosisCorrect,
    totalLicenseCost,
    scorePct,
  };
}
