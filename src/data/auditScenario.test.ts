import { describe, expect, it } from 'vitest';
import {
  DIAGNOSIS_OPTIONS,
  EXPECTED_DIAGNOSIS_BY_WORKSTATION,
  GUIDED_REMEDIATION,
  INITIAL_WORKSTATIONS,
  LicenseType,
  OS_CATALOG,
  SOFTWARE_CATALOG,
  Workstation,
  evaluateWorkstation,
} from './auditScenario';
import { LICENSE_TOOLTIP_DATA } from '../components/LicenseTooltip';

const ws = (id: string) => INITIAL_WORKSTATIONS.find((w) => w.id === id)!;
const withOs = (w: Workstation, osId: string, softwareIds = w.installedSoftwareIds): Workstation => ({
  ...w,
  osId,
  installedSoftwareIds: softwareIds,
});
const evalOne = (w: Workstation) =>
  evaluateWorkstation(w, INITIAL_WORKSTATIONS.map((x) => (x.id === w.id ? w : x)));
const titles = (w: Workstation) => evalOne(w).findings.map((f) => f.title).join(' | ');

function remediated(): Workstation[] {
  return INITIAL_WORKSTATIONS.map((w) => ({
    ...w,
    osId: GUIDED_REMEDIATION[w.id].osId,
    installedSoftwareIds: GUIDED_REMEDIATION[w.id].softwareIds,
    auditorDiagnosisId: EXPECTED_DIAGNOSIS_BY_WORKSTATION[w.id],
  }));
}

describe('escenario inicial', () => {
  it('los 6 equipos tienen algo que auditar', () => {
    for (const w of INITIAL_WORKSTATIONS) {
      const e = evaluateWorkstation(w, INITIAL_WORKSTATIONS);
      expect(e.scorePct, w.id).toBeLessThan(100);
      expect(e.findings.some((f) => f.severity !== 'optimized'), w.id).toBe(true);
    }
  });

  it('los diagnósticos esperados y los ids del catálogo existen', () => {
    for (const d of Object.values(EXPECTED_DIAGNOSIS_BY_WORKSTATION)) {
      expect(DIAGNOSIS_OPTIONS.some((o) => o.id === d)).toBe(true);
    }
    for (const w of INITIAL_WORKSTATIONS) {
      expect(OS_CATALOG.some((o) => o.id === w.osId)).toBe(true);
      for (const id of w.installedSoftwareIds) expect(SOFTWARE_CATALOG.some((a) => a.id === id), id).toBe(true);
    }
  });

  it('todos los tipos de licencia tienen ficha en el tooltip', () => {
    const types = new Set<LicenseType>([...OS_CATALOG, ...SOFTWARE_CATALOG].map((x) => x.licenseType));
    for (const t of types) expect(LICENSE_TOOLTIP_DATA[t], t).toBeDefined();
  });
});

describe('solución guiada', () => {
  it('deja los 6 equipos al 100 % y sin hallazgos', () => {
    const all = remediated();
    for (const w of all) {
      const e = evaluateWorkstation(w, all);
      expect(e.scorePct, `${w.id}: ${e.findings.map((f) => f.title).join(' | ')}`).toBe(100);
      expect(e.findings.every((f) => f.severity === 'optimized'), w.id).toBe(true);
    }
  });

  it('PC-01 pasa a 64 bits con su licencia OEM sin coste y conserva su programa contable', () => {
    const all = remediated();
    const e = evaluateWorkstation(all.find((w) => w.id === 'pc-01')!, all);
    expect(e.usableRamGb).toBe(8);
    expect(e.totalLicenseCost).toBe(190); // solo la suscripción del programa contable
  });

  it('el coste total de la oficina regularizada', () => {
    const all = remediated();
    const total = all.reduce((acc, w) => acc + evaluateWorkstation(w, all).totalLicenseCost, 0);
    expect(total).toBe(190 + 185); // ContaGest en PC-01 y Windows 11 Pro Retail en PC-04
  });
});

describe('arquitectura', () => {
  it('SO de 32 bits con 8 GB: solo 3,2 GB útiles', () => {
    const e = evalOne(ws('pc-01'));
    expect(e.usableRamGb).toBe(3.2);
    expect(e.wastedRamGb).toBe(4.8);
    expect(e.isArchValid).toBe(false);
  });

  it('con 4 GB justos también avisa (v1 solo a partir de más de 4 GB)', () => {
    const w = { ...ws('pc-01'), hardware: { ...ws('pc-01').hardware, ramInstalledGb: 4 } };
    expect(titles(w)).toContain('Cuello de botella de RAM');
  });

  it('Ubuntu de 64 bits en el Atom de 32 bits no arranca', () => {
    const e = evalOne(ws('pc-03'));
    expect(e.usableRamGb).toBe(0);
    expect(e.findings.some((f) => f.title.startsWith('Fallo de arranque'))).toBe(true);
  });
});

describe('licencias', () => {
  it('la licencia OEM propia no cuesta nada en 32 ni en 64 bits (v1 cobraba 115 € al PC-01)', () => {
    const pc01 = ws('pc-01');
    expect(evalOne(withOs(pc01, 'win11_pro_64_oem', [])).totalLicenseCost).toBe(0);
    expect(evalOne(withOs(pc01, 'win10_pro_32_oem', [])).totalLicenseCost).toBe(0);
  });

  it('la OEM del Dell viejo en la placa nueva es infracción y se cobra', () => {
    const e = evalOne(withOs(ws('pc-04'), 'win11_pro_64_oem', []));
    expect(e.isLicenseValid).toBe(false);
    expect(e.findings.some((f) => f.title.startsWith('Licencia OEM inválida'))).toBe(true);
    expect(e.totalLicenseCost).toBe(115);
  });

  it('Windows Enterprise por volumen sin licencia Pro de base y usado como servidor', () => {
    const t = titles(ws('srv-01'));
    expect(t).toContain('sin licencia base');
    expect(t).toContain('escritorio usado como servidor');
  });

  it('Office Hogar y Estudiantes: no comercial y sin soporte', () => {
    const t = titles(ws('pc-05'));
    expect(t).toContain('Licencia no conforme en empresa: Microsoft Office Hogar');
    expect(t).toContain('Software sin soporte del fabricante');
  });

  it('Windows 10 se marca como sin soporte', () => {
    expect(titles(ws('pc-01'))).toContain('Windows 10 Pro');
    expect(titles(ws('pc-01'))).toContain('sin soporte');
  });

  it('las suscripciones son legales pero se cuentan', () => {
    const acrobat = SOFTWARE_CATALOG.find((a) => a.id === 'acrobat_std_retail_64')!;
    expect(acrobat.licenseType).toBe('Suscripcion');
    expect(acrobat.commercialAllowed).toBe(true);
  });
});
