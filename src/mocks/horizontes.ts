/**
 * Fixtures do bloco "Hoje" (prompt dos horizontes, D2): previsão do INMET por município (formato da API de 22/11/2026,
 * sem quantidade de chuva) e as três camadas de GET /api/horizontes/{slug}. Textos e números ilustrativos.
 */
const recifeDate = (offsetDays: number): string => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(Date.now() + offsetDays * 86400e3)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};

const seen = () => new Date(Date.now() - 40 * 60e3).toISOString();

const period = (period: 'MANHA' | 'TARDE' | 'NOITE' | 'DIA', summary: string, tempMin = 24, tempMax = 32) => ({
  period, summary, iconCode: '29', tempMax, tempMin, humidityMax: 90, humidityMin: 45, windDir: 'E-NE', windIntensity: 'Fraco/Moderado',
  firstSeenAt: seen(), lastSeenAt: seen(),
});

export const forecastFixture = (municipality = 'Recife', ibge = '2611606') => ({
  source: 'INMET',
  sourceLabel: 'previsão oficial do INMET',
  attribution: 'INMET — Instituto Nacional de Meteorologia (https://portal.inmet.gov.br)',
  note: 'A previsão do INMET por município não traz quantidade de chuva. "Visto às" é quando o MAPi viu a previsão; o INMET não publica a hora de emissão.',
  ibge, municipality,
  lastCollectedAt: seen(), ageMinutes: 40, stale: false, reason: null, reasonText: null,
  days: [
    { date: recifeDate(0), periods: [period('MANHA', 'Poucas nuvens'), period('TARDE', 'Pancadas de chuva isoladas'), period('NOITE', 'Muitas nuvens com chuva fraca')] },
    { date: recifeDate(1), periods: [period('MANHA', 'Poucas nuvens', 25, 33), period('TARDE', 'Poucas nuvens', 25, 33), period('NOITE', 'Poucas nuvens', 25, 33)] },
  ],
});

export const forecastSemDadoFixture = () => ({
  ...forecastFixture(), days: [], ageMinutes: null, stale: true, reason: 'SEM_PREVISAO',
  reasonText: 'Ainda não há previsão do INMET gravada para este município. Isto não quer dizer tempo bom.',
});

export const avisoFixture = () => ({
  warningId: 1, sequenceId: 1, externalId: 1, source: 'INMET', firstSeenAt: seen(), lastSeenAt: seen(),
  validFrom: new Date(Date.now() - 6 * 3600e3).toISOString(), validTo: new Date(Date.now() + 18 * 3600e3).toISOString(),
  severity: 'Perigo Potencial', colorHex: '#FFE600', description: 'Chuvas intensas',
  risks: ['Chuva entre 20 e 30 mm/h ou até 50 mm/dia.'], instructions: [], geocodes: ['2611606'], municipalities: 'Recife', altered: false, closed: false,
});

export const horizonsFixture = (slug: string, opts: { aviso?: boolean; semPrevisao?: boolean; inTest?: boolean; level?: string } = {}) => ({
  slug, name: 'Av. Mascarenhas de Morais', municipality: 'Recife', ibge: '2611606', generatedAt: new Date().toISOString(),
  official: {
    origin: 'INMET', attribution: 'INMET — Instituto Nacional de Meteorologia (https://avisos.inmet.gov.br)',
    warnings: opts.aviso ? [avisoFixture()] : [], warningsReason: null, warningsReasonText: null, warningsCheckedAt: seen(),
    forecast: opts.semPrevisao ? forecastSemDadoFixture() : forecastFixture(),
  },
  dayRisk: {
    available: false, origin: 'MAPi', version: 'day_risk_v0', reason: 'NAO_VALIDADO',
    reasonText: 'O "dia de risco" do MAPi não venceu a climatologia na avaliação de 22/11/2026. Fica só a previsão do INMET para o dia.',
    report: 'projeto-mapi-ai: reports/day_risk/RELATORIO.md',
  },
  nextHour: opts.inTest
    ? { origin: 'MAPi', level: null, worstHorizonHours: null, experimental: true, inTest: true, issuedAt: seen(), ageMinutes: 4, reason: null, reasonText: null }
    : { origin: 'MAPi', level: opts.level ?? 'ATENCAO', worstHorizonHours: 3, experimental: true, inTest: false, issuedAt: seen(), ageMinutes: 4,
      reason: opts.level === 'SEM_DADO' ? 'SEM_CICLO' : null,
      reasonText: opts.level === 'SEM_DADO' ? 'O alerta ainda não avaliou este ponto. Sem dado não é "sem alerta".' : null },
});
