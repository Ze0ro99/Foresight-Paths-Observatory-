import {
  AppLocale,
  ChokepointNode,
  EncryptedMapNode,
  FullScenarioDossier,
  GlobalSensedSignal,
  RegionViewKey,
  ScenarioProbabilities,
  SignalCorrelationMatch,
  SubseaCableSpan,
  TimeRangeKey,
} from './types';
import { computeGematria, computeQClockProjection } from './decoder-engine';
import { getEncryptedNodeCopy, getScenarioCopy } from './i18n';
import { computeGreatCircleKm, PI_CONST } from './trajectory-engine';

export const ENCRYPTED_MAP_NODES: EncryptedMapNode[] = [
  {
    id: 'enc-economist-london',
    mapSource: 'economist_2027',
    codeSymbol: 'ΠΣV · 2027',
    titleAr: 'عقدة غلاف الإيكونوميست 2027 (ΠΣV وتذبذب السيولة)',
    titleEn: 'The Economist 2027 Cover Node (ΠΣV Liquidity Shock)',
    city: 'لندن / London',
    lat: 51.5074,
    lng: -0.1278,
    gematriaPhrase: 'PI NETWORK SWIFT',
    qClockSector: 17,
    piHarmonicFactor: Number((Math.PI * 1.16).toFixed(3)),
    verifiedInfraFactAr:
      'مركز مقاصة LCH/ICE للسيولة المالية العالمية ومراقبة تذبذب أسعار الفائدة وسندات السيادة الأوروبية.',
    codedNarrativeReadingAr:
      'تموضع رمز (ΠΣV) أسفل الشبكة الحمراء الهابطة وعملات التكديس على غلاف 2027؛ يُقرأ في دوائر فك الشفرات كإشارة تلاقي بين تحديثات ISO 20022 وتداولية Pi/QFS.',
    epistemicTier: 'symbolic',
    qKeyDomain: 'trump_era',
  },
  {
    id: 'enc-giza-orion',
    mapSource: 'great_awakening',
    codeSymbol: 'ORION · 25900',
    titleAr: 'محور الجيزة — خريطة الصحوة الكبرى ودورة المبادرة',
    titleEn: 'Giza Axis — Great Awakening Precession Marker',
    city: 'الجيزة / Giza',
    lat: 29.9792,
    lng: 31.1342,
    gematriaPhrase: 'GREAT AWAKENING',
    qClockSector: 29,
    piHarmonicFactor: Number((Math.PI * 0.992).toFixed(3)),
    verifiedInfraFactAr:
      'بوابة تقاطع مسارات الكابلات البحرية بين البحر الأحمر والمتوسط وموقع رصد جغرافي جيوديسي محوري.',
    codedNarrativeReadingAr:
      'مرسوم في خريطة «الصحوة الكبرى» بوصفه آلة صعود ومحور دورة الـ 25,900 سنة، ويُدمج رمزياً بنسبة النسبة الذهبية وباي (π).',
    epistemicTier: 'symbolic',
    qKeyDomain: 'antiquity',
  },
  {
    id: 'enc-cern-geneva',
    mapSource: 'great_awakening',
    codeSymbol: 'CERN · PORTAL',
    titleAr: 'مركز سيرن وجنيف — عقدة التشفير الفيزيائي',
    titleEn: 'CERN Geneva — Deep State Portal Vector',
    city: 'جنيف / Geneva',
    lat: 46.233,
    lng: 6.0557,
    gematriaPhrase: 'QFS QUANTUM',
    qClockSector: 46,
    piHarmonicFactor: Number((Math.PI * 1.47).toFixed(3)),
    verifiedInfraFactAr:
      'عقدة الحوسبة الشبكية الأوروبية Tier-0 وبوابة تبادل البيانات البحثية ومعايير التسوية السويسرية (BIS).',
    codedNarrativeReadingAr:
      'عقدة سفلية حاسمة في خريطة Q-Web وGreat Awakening تُربط بتقنيات البوابات الكمية والتحول المالي السويسري.',
    epistemicTier: 'symbolic',
    qKeyDomain: 'false_flags',
  },
  {
    id: 'enc-hormuz-tanker',
    mapSource: 'economist_2027',
    codeSymbol: 'CHOKE · TANKER',
    titleAr: 'رمز الناقلة المقيدة بالسلاسل والأنبوب المكسور',
    titleEn: 'Economist 2027 Chained Tanker & Broken Pipeline',
    city: 'مضيق هرمز / Hormuz',
    lat: 26.5667,
    lng: 56.25,
    gematriaPhrase: 'ENERGY CHOKE',
    qClockSector: 26,
    piHarmonicFactor: Number((Math.PI * 1.31).toFixed(3)),
    verifiedInfraFactAr:
      'ممر عبور قرابة 21% من إمدادات النفط والغاز المسال العالمية وموقع رصد عالي الحساسية للملاحة البحرية.',
    codedNarrativeReadingAr:
      'يربط غلاف 2027 بين انكسار خط الأنابيب والناقلة المقيّدة بالسلاسل وتصاعد مخاطر التأمين البحري والطاقة.',
    epistemicTier: 'disputed',
    qKeyDomain: 'false_flags',
  },
  {
    id: 'enc-taipei-chip',
    mapSource: 'economist_2027',
    codeSymbol: 'AI · WAFER · 01',
    titleAr: 'عقدة الرقائق والروبوت الخوارزمي في شرق آسيا',
    titleEn: 'Economist 2027 AI Silicon & Binary Swarm',
    city: 'تايبيه / Taipei',
    lat: 25.033,
    lng: 121.5654,
    gematriaPhrase: 'AI SWARM',
    qClockSector: 25,
    piHarmonicFactor: Number((Math.PI * 1.09).toFixed(3)),
    verifiedInfraFactAr:
      'تركّز أكثر من 60% من تصنيع أشباه الموصلات المتقدمة وكابلات الألياف العابرة للمحيط الهادئ.',
    codedNarrativeReadingAr:
      'تظهر أيقونة الدماغ الثنائي والروبوت المحمل بالبيانات على الغلاف كاستعارة لتسارع وكلاء الذكاء الاصطناعي.',
    epistemicTier: 'plausible',
    qKeyDomain: 'mk_ultra',
  },
  {
    id: 'enc-cheyenne-dumb',
    mapSource: 'q_web',
    codeSymbol: 'D.U.M.B · NORAD',
    titleAr: 'شايان ماونتن — عقدة Q-Web والقيادة الكمية',
    titleEn: 'Cheyenne Mountain — Q-Web Quantum Command',
    city: 'كولورادو / Cheyenne',
    lat: 38.7442,
    lng: -104.8466,
    gematriaPhrase: 'NESARA GESARA',
    qClockSector: 38,
    piHarmonicFactor: Number((Math.PI * 1.24).toFixed(3)),
    verifiedInfraFactAr:
      'مركز رصد فضائي واتصالات محصّنة تحت الصخر الجرانيتي ضمن شبكة القيادة الدفاعية.',
    codedNarrativeReadingAr:
      'تُصنّف في خريطة Q-Web ضمن شبكة القواعد العميقة (D.U.M.B.s) المرتبطة بسردية البث الطارئ وإعادة الضبط.',
    epistemicTier: 'symbolic',
    qKeyDomain: 'trump_era',
  },
  {
    id: 'enc-pinegap-au',
    mapSource: 'q_web',
    codeSymbol: '5G · PINE GAP',
    titleAr: 'باين غاب — محور الإشارات نصف الكرة الجنوبي',
    titleEn: 'Pine Gap — Southern Telemetry Vector',
    city: 'أليس سبرينغز / Pine Gap',
    lat: -23.799,
    lng: 133.737,
    gematriaPhrase: 'PI ISO',
    qClockSector: 53,
    piHarmonicFactor: Number((Math.PI * 0.88).toFixed(3)),
    verifiedInfraFactAr:
      'محطة تتبع فضائية مشتركة لرصد الإشارات في المحيطين الهندي والهادئ.',
    codedNarrativeReadingAr:
      'ترد في الخريطة التفرعية مع روابط الأقمار الصناعية والاتصالات الترددية كعقدة ربط في النصف الجنوبي.',
    epistemicTier: 'symbolic',
    qKeyDomain: 'extraterrestrials',
  },
  {
    id: 'enc-antarctica-ice',
    mapSource: 'great_awakening',
    codeSymbol: 'HIGHJUMP · ICE',
    titleAr: 'أنتاركتيكا — عقدة الجليد والانحراف المغناطيسي',
    titleEn: 'Antarctica — Highjump Anomaly Marker',
    city: 'ماكموردو / Antarctica',
    lat: -77.8419,
    lng: 166.6863,
    gematriaPhrase: 'SOLAR FLASH',
    qClockSector: 47,
    piHarmonicFactor: Number((Math.PI * 1.57).toFixed(3)),
    verifiedInfraFactAr:
      'محطة أبحاث مناخية وجيوفيزيائية رئيسية لرصد الغلاف الجوي والإشعاع الشمسي.',
    codedNarrativeReadingAr:
      'محور مركزي في الربع السفلي لخريطة الصحوة الكبرى تحت عنوان Operation Highjump والانفصال التقني.',
    epistemicTier: 'symbolic',
    qKeyDomain: 'nazi_era',
  },
];

export const SUBSEA_CABLES: SubseaCableSpan[] = [
  {
    id: 'cable-marea',
    name: 'MAREA Transatlantic',
    from: { lat: 36.85, lng: -75.98, city: 'Virginia Beach' },
    to: { lat: 43.38, lng: -2.99, city: 'Bilbao' },
    capacityTbps: 200,
    status: 'nominal',
  },
  {
    id: 'cable-seamewe5',
    name: 'SEA-ME-WE 5 Corridor',
    from: { lat: 43.3, lng: 5.37, city: 'Marseille' },
    to: { lat: 1.29, lng: 103.85, city: 'Singapore' },
    capacityTbps: 24,
    status: 'elevated_watch',
  },
  {
    id: 'cable-faster',
    name: 'FASTER Transpacific',
    from: { lat: 44.36, lng: -124.05, city: 'Oregon' },
    to: { lat: 35.14, lng: 139.96, city: 'Chiba / Tokyo' },
    capacityTbps: 60,
    status: 'nominal',
  },
  {
    id: 'cable-2africa-redsea',
    name: '2Africa Red Sea Link',
    from: { lat: 29.97, lng: 32.55, city: 'Suez' },
    to: { lat: 19.07, lng: 72.87, city: 'Mumbai' },
    capacityTbps: 180,
    status: 'elevated_watch',
  },
];

export const MARITIME_CHOKEPOINTS: ChokepointNode[] = [
  {
    id: 'chk-hormuz',
    nameAr: 'مضيق هرمز',
    nameEn: 'Strait of Hormuz',
    lat: 26.57,
    lng: 56.25,
    dailyOilFlowPct: 21,
    status: 'critical',
  },
  {
    id: 'chk-suez',
    nameAr: 'قناة السويس وباب المندب',
    nameEn: 'Suez & Bab el-Mandeb',
    lat: 12.6,
    lng: 43.33,
    dailyOilFlowPct: 12,
    status: 'elevated',
  },
  {
    id: 'chk-malacca',
    nameAr: 'مضيق ملقا',
    nameEn: 'Strait of Malacca',
    lat: 2.5,
    lng: 101.2,
    dailyOilFlowPct: 28,
    status: 'elevated',
  },
  {
    id: 'chk-panama',
    nameAr: 'قناة بنما',
    nameEn: 'Panama Canal',
    lat: 9.08,
    lng: -79.68,
    dailyOilFlowPct: 5,
    status: 'monitoring',
  },
];

export const REGION_VIEWBOX_PRESETS: Record<
  RegionViewKey,
  {
    labelAr: string;
    labelEn: string;
    centerX: number;
    centerY: number;
    baseScale: number;
  }
> = {
  global: {
    labelAr: 'العالم',
    labelEn: 'Global',
    centerX: 600,
    centerY: 290,
    baseScale: 1,
  },
  mena: {
    labelAr: 'الشرق الأوسط MENA',
    labelEn: 'Middle East',
    centerX: 735,
    centerY: 205,
    baseScale: 2.25,
  },
  europe: {
    labelAr: 'أوروبا',
    labelEn: 'Europe',
    centerX: 635,
    centerY: 132,
    baseScale: 2.35,
  },
  americas: {
    labelAr: 'الأمريكتان',
    labelEn: 'Americas',
    centerX: 290,
    centerY: 225,
    baseScale: 1.75,
  },
  asia: {
    labelAr: 'آسيا والمحيط',
    labelEn: 'Asia-Pacific',
    centerX: 955,
    centerY: 225,
    baseScale: 1.9,
  },
};

export function timeRangeToMaxHours(range: TimeRangeKey): number {
  switch (range) {
    case '1h':
      return 1;
    case '6h':
      return 6;
    case '24h':
      return 24;
    case '48h':
      return 48;
    case '7d':
      return 168;
    case 'all':
    default:
      return Number.POSITIVE_INFINITY;
  }
}

export function filterSignalsByTimeRange(
  signals: GlobalSensedSignal[],
  range: TimeRangeKey
): GlobalSensedSignal[] {
  const maxHours = timeRangeToMaxHours(range);
  return signals.filter((s) => s.ageHours <= maxHours);
}

/**
 * Enriches any raw global event (USGS, NASA EONET, OSINT) with Gematria 6-cipher values,
 * Pi resonance math, and nearest Encrypted Map node using spherical Great-Circle distance.
 */
export function enrichGlobalSignal(raw: {
  id: string;
  source: GlobalSensedSignal['source'];
  category: GlobalSensedSignal['category'];
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  magnitudeOrSeverity: number;
  severityLabel: string;
  publishedAtIso: string;
  url?: string;
}): GlobalSensedSignal {
  const publishedMs = Date.parse(raw.publishedAtIso);
  const ageHours = Number.isFinite(publishedMs)
    ? Math.max(0.05, Number(((Date.now() - publishedMs) / 3600000).toFixed(2)))
    : 1;

  const gem = computeGematria(`${raw.title} ${raw.locationName}`);
  let nearestNode = ENCRYPTED_MAP_NODES[0];
  let minKm = Number.POSITIVE_INFINITY;

  for (const node of ENCRYPTED_MAP_NODES) {
    const km = computeGreatCircleKm(raw.lat, raw.lng, node.lat, node.lng);
    if (km < minKm) {
      minKm = km;
      nearestNode = node;
    }
  }

  const distanceFactor = Math.max(1, minKm / 500);
  const piResonanceIndex = Number(
    (
      ((raw.magnitudeOrSeverity * 1.4 + (gem.fullReduction % 27)) * PI_CONST) /
      (distanceFactor + 1.5)
    ).toFixed(3)
  );

  return {
    ...raw,
    ageHours,
    gematriaOrdinal: gem.englishOrdinal,
    gematriaReduction: gem.fullReduction,
    piResonanceIndex,
    nearestEncryptedId: nearestNode.id,
    distanceToEncryptedKm: Math.round(minKm),
    // The source event may be documented, but this derived Gematria/Pi/map overlay is symbolic,
    // not evidence of causation, prediction, or a verified relationship to the event.
    epistemicTier: 'symbolic',
  };
}

/**
 * Computes live Q-Clock sweeping longitude & opposite-pole projection for the World Map.
 */
export function computeQClockWorldSweep(tickMinute: number): {
  sector: number;
  activeLng: number;
  oppositeLng: number;
  piAngleDeg: number;
} {
  const proj = computeQClockProjection(tickMinute);
  const activeLng = Number((((proj.sector / 60) * 360) - 180).toFixed(2));
  const oppositeLng = Number((((proj.oppositeSector / 60) * 360) - 180).toFixed(2));
  return {
    sector: proj.sector,
    activeLng,
    oppositeLng,
    piAngleDeg: proj.angleDeg,
  };
}

/**
 * Correlates live sensed global signals with the 8 Encrypted Map nodes via Great-Circle km,
 * Pi coupling score, and Q-Clock sector alignment.
 */
export function correlateEncryptedAndGlobalSignals(
  signals: GlobalSensedSignal[],
  qClockSector: number,
  locale: AppLocale = 'ar'
): SignalCorrelationMatch[] {
  const matches: SignalCorrelationMatch[] = [];

  for (const sig of signals) {
    const node =
      ENCRYPTED_MAP_NODES.find((n) => n.id === sig.nearestEncryptedId) ??
      ENCRYPTED_MAP_NODES[0];
    const qClockAligned =
      Math.abs(node.qClockSector - qClockSector) <= 6 ||
      Math.abs(((node.qClockSector + 30) % 60) - qClockSector) <= 6;

    const piCouplingScore = Number(
      (
        sig.piResonanceIndex *
        node.piHarmonicFactor *
        (qClockAligned ? 1.35 : 1)
      ).toFixed(2)
    );

    matches.push({
      signalId: sig.id,
      signalTitle: sig.title,
      encryptedNodeId: node.id,
      encryptedTitle: getEncryptedNodeCopy(node, locale).title,
      distanceKm: sig.distanceToEncryptedKm,
      piCouplingScore,
      qClockAligned,
    });
  }

  return matches.sort((a, b) => b.piCouplingScore - a.piCouplingScore);
}

const WORLD_DOSSIER_TEXT: Record<
  AppLocale,
  {
    liveBadge: string;
    sensorPlatform: string;
    encBadge: string;
    mapSourcePrefix: string;
    phase1Sig: string;
    phase2Sig: string;
    phase3Sig: string;
    phase1Enc: string;
    phase2Enc: string;
    phase3Enc: string;
    liveNow: string;
    realtime: string;
    symStatic: string;
    ongoing: string;
    encEarlyWarning: string;
    sigFilmProtagonists: string;
    encFilmProtagonists: string;
    decodePrefix: string;
    signalPrefix: string;
    nearDistanceNote: string;
  }
> = {
  ar: {
    liveBadge: 'استشعار عالمي حي',
    sensorPlatform: 'طبقة الاستشعار الفيزيائي والرقمي العالمية',
    encBadge: 'عقدة خريطة مشفرة',
    mapSourcePrefix: 'مصدر الخريطة:',
    phase1Sig: '1. الرصد الحي (Sensor)',
    phase2Sig: '2. التشفير والجيماتريا',
    phase3Sig: '3. التداعي الاستراتيجي',
    phase1Enc: '1. الترميز السيميائي',
    phase2Enc: '2. الاسقاط الهندسي (Q-Clock & π)',
    phase3Enc: '3. الواقع البنيوي الموثق',
    liveNow: 'لحظي',
    realtime: 'آني',
    symStatic: 'ثابت رمزي',
    ongoing: 'مستمر',
    encEarlyWarning: 'لا تُعامل هذه العقدة كدليل تشغيلي مستقل دون تطابق إشارات USGS أو CISA أو بيانات الأسواق الحقيقية.',
    sigFilmProtagonists: 'فريق الرصد الجغرافي × وحدة فك الشفرات السحابية',
    encFilmProtagonists: 'محلل السيميائيات × مهندس الشبكات',
    decodePrefix: 'فك شفرة',
    signalPrefix: 'إشارة',
    nearDistanceNote: 'المسافة الكروية نحو أقرب عقدة مشفرة:',
  },
  en: {
    liveBadge: 'Live Global Sensor',
    sensorPlatform: 'Global Physical & Digital Sensor Layer',
    encBadge: 'Encrypted Map Node',
    mapSourcePrefix: 'Map Source:',
    phase1Sig: '1. Live Telemetry (Sensor)',
    phase2Sig: '2. Cipher & Gematria',
    phase3Sig: '3. Strategic Spillover',
    phase1Enc: '1. Semiotic Encoding',
    phase2Enc: '2. Geometric Projection (Q-Clock & π)',
    phase3Enc: '3. Verified Infrastructure Reality',
    liveNow: 'Real-time',
    realtime: 'Instant',
    symStatic: 'Symbolic Anchor',
    ongoing: 'Continuous',
    encEarlyWarning: 'Never treat a symbolic map node as independent proof without matching USGS, CISA, or market telemetry.',
    sigFilmProtagonists: 'Geospatial Sensor Watch × Cloud Decoder Cell',
    encFilmProtagonists: 'Semiotics Analyst × Core Network Architect',
    decodePrefix: 'Decoding',
    signalPrefix: 'Live Signal',
    nearDistanceNote: 'Great-circle distance to nearest encrypted node:',
  },
  fr: {
    liveBadge: 'Capteur Mondial Actif',
    sensorPlatform: 'Couche Mondiale de Télémétrie Physique et Numérique',
    encBadge: 'Nœud de Carte Chiffrée',
    mapSourcePrefix: 'Source carte :',
    phase1Sig: '1. Détection en Direct',
    phase2Sig: '2. Chiffrage & Gématrie',
    phase3Sig: '3. Répercussion Stratégique',
    phase1Enc: '1. Encodage Sémiotique',
    phase2Enc: '2. Projection Géométrique (Q-Clock & π)',
    phase3Enc: '3. Réalité d’Infrastructure Vérifiée',
    liveNow: 'Temps réel',
    realtime: 'Instantané',
    symStatic: 'Ancrage symbolique',
    ongoing: 'Continu',
    encEarlyWarning: 'Ne jamais traiter un nœud symbolique comme preuve sans corrélation USGS, CISA ou boursière.',
    sigFilmProtagonists: 'Veille Géospatiale × Cellule Décodeur Cloud',
    encFilmProtagonists: 'Analyste Sémiotique × Architecte Réseau',
    decodePrefix: 'Décodage',
    signalPrefix: 'Signal',
    nearDistanceNote: 'Distance géodésique au nœud chiffré le plus proche :',
  },
  id: {
    liveBadge: 'Sensor Global Langsung',
    sensorPlatform: 'Lapisan Sensor Fisik & Digital Global',
    encBadge: 'Simpul Peta Terenkripsi',
    mapSourcePrefix: 'Sumber Peta:',
    phase1Sig: '1. Telemetri Langsung',
    phase2Sig: '2. Sandi & Gematria',
    phase3Sig: '3. Dampak Strategis',
    phase1Enc: '1. Pengkodean Semiotik',
    phase2Enc: '2. Proyeksi Geometris (Q-Clock & π)',
    phase3Enc: '3. Realitas Infrastruktur Terverifikasi',
    liveNow: 'Langsung',
    realtime: 'Seketika',
    symStatic: 'Jangkar Simbolik',
    ongoing: 'Berkelanjutan',
    encEarlyWarning: 'Jangan jadikan simpul peta simbolik sebagai bukti tunggal tanpa data USGS, CISA, atau pasar.',
    sigFilmProtagonists: 'Tim Pemantau Geospasial × Unit Dekoder Cloud',
    encFilmProtagonists: 'Analis Semiotika × Arsitek Jaringan Inti',
    decodePrefix: 'Dekode',
    signalPrefix: 'Sinyal',
    nearDistanceNote: 'Jarak geodesik ke simpul terenkripsi terdekat:',
  },
  vi: {
    liveBadge: 'Cảm Biến Toàn Cầu Trực Tiếp',
    sensorPlatform: 'Tầng Cảm Biến Vật Lý & Số Toàn Cầu',
    encBadge: 'Nút Bản Đồ Mã Hóa',
    mapSourcePrefix: 'Nguồn bản đồ:',
    phase1Sig: '1. Đo Lường Trực Tiếp',
    phase2Sig: '2. Mật Mã & Gematria',
    phase3Sig: '3. Tác Động Chiến Lược',
    phase1Enc: '1. Mã Hóa Ký Hiệu Học',
    phase2Enc: '2. Chiếu Hình Học (Q-Clock & π)',
    phase3Enc: '3. Thực Tế Hạ Tầng Xác Thực',
    liveNow: 'Trực tiếp',
    realtime: 'Tức thời',
    symStatic: 'Mốc biểu tượng',
    ongoing: 'Liên tục',
    encEarlyWarning: 'Không coi nút bản đồ biểu tượng là bằng chứng độc lập nếu thiếu dữ liệu USGS, CISA hoặc thị trường.',
    sigFilmProtagonists: 'Tổ Giám Sát Địa Không Gian × Nhóm Giải Mã Cloud',
    encFilmProtagonists: 'Chuyên Gia Ký Hiệu × Kiến Trúc Sư Mạng',
    decodePrefix: 'Giải mã',
    signalPrefix: 'Tín hiệu',
    nearDistanceNote: 'Khoảng cách trắc địa tới nút mã hóa gần nhất:',
  },
};

export function buildWorldSignalDossier(
  selection:
    | { kind: 'global_signal'; signal: GlobalSensedSignal }
    | { kind: 'encrypted_node'; node: EncryptedMapNode },
  probabilities: ScenarioProbabilities,
  locale: AppLocale = 'ar'
): FullScenarioDossier {
  const dominantCopy = getScenarioCopy(probabilities.dominant, locale);
  const dominantPct = probabilities[probabilities.dominant];
  const wd = WORLD_DOSSIER_TEXT[locale];

  if (selection.kind === 'global_signal') {
    const sig = selection.signal;
    const linkedNode =
      ENCRYPTED_MAP_NODES.find((n) => n.id === sig.nearestEncryptedId) ??
      ENCRYPTED_MAP_NODES[0];
    const linkedCopy = getEncryptedNodeCopy(linkedNode, locale);

    return {
      kind: 'global_signal',
      id: sig.id,
      badgeLabel: `${wd.liveBadge} · ${sig.source}`,
      headline: sig.title,
      subheadline: `${sig.locationName} · ${sig.severityLabel}`,
      city: sig.locationName,
      coordinatesLabel: `${sig.lat.toFixed(2)}°, ${sig.lng.toFixed(2)}°`,
      platformLabel: wd.sensorPlatform,
      threatLabel: `π-Resonance = ${sig.piResonanceIndex}`,
      epistemicTier: sig.epistemicTier,
      qKeyDomain: linkedNode.qKeyDomain,
      scenarioId: probabilities.dominant,
      scenarioTitle: dominantCopy.title,
      scenarioProbability: dominantPct,
      executiveNarrative: `${sig.title} (${sig.lat.toFixed(2)}°, ${sig.lng.toFixed(2)}° · ${sig.source}). ${wd.nearDistanceNote} ${sig.distanceToEncryptedKm} km → ${linkedCopy.title} (π=${sig.piResonanceIndex}).`,
      stages: [
        {
          phase: wd.phase1Sig,
          title: sig.severityLabel,
          detail: `${sig.publishedAtIso} — Δt ${sig.ageHours}h`,
          timeframe: wd.liveNow,
        },
        {
          phase: wd.phase2Sig,
          title: `Ordinal ${sig.gematriaOrdinal} · Reduction ${sig.gematriaReduction}`,
          detail: `Q-Clock #${linkedNode.qClockSector} · π = ${sig.piResonanceIndex}`,
          timeframe: wd.realtime,
        },
        {
          phase: wd.phase3Sig,
          title: `${linkedNode.codeSymbol}`,
          detail: linkedCopy.infraFact,
          timeframe: '+2h',
        },
      ],
      triggerOrCause: `${sig.source} (${sig.epistemicTier})`,
      earlyWarning: linkedCopy.infraFact,
      dualMapInsight: `${linkedCopy.title} (${sig.distanceToEncryptedKm} km) — ${linkedCopy.narrative}`,
      backendSummary: `Gematria Ordinal=${sig.gematriaOrdinal} · FullReduction=${sig.gematriaReduction} · PiResonance=${sig.piResonanceIndex} · NearestEncrypted=${linkedNode.id}`,
      filmScene: {
        id: `scene-${sig.id}`,
        act: 'II',
        sceneNumber: 9,
        timecode: sig.publishedAtIso.slice(11, 19) + ' UTC',
        location: sig.locationName,
        title: `${wd.signalPrefix} ${sig.source} — ${sig.locationName}`,
        protagonists: wd.sigFilmProtagonists,
        groundedReality: sig.title,
        dramaticConflict: `${linkedCopy.narrative} (${sig.distanceToEncryptedKm} km · ${linkedNode.codeSymbol})`,
        dialogueExcerpt:
          locale === 'ar'
            ? `«الإحداثي يقع على بعد ${sig.distanceToEncryptedKm} كم فقط من العقدة المشفرة — افصل البيانات الفيزيائية فوراً عن الضجيج.»`
            : `"The live sensor sits just ${sig.distanceToEncryptedKm} km from ${linkedNode.codeSymbol}—separate physical telemetry from viral noise immediately."`,
        linkedEventId: sig.id,
        dominantScenarioAtBeat: probabilities.dominant,
      },
    };
  }

  const node = selection.node;
  const nodeCopy = getEncryptedNodeCopy(node, locale);
  const gem = computeGematria(node.gematriaPhrase);

  return {
    kind: 'encrypted_node',
    id: node.id,
    badgeLabel: `${wd.encBadge} · ${node.codeSymbol}`,
    headline: nodeCopy.title,
    subheadline: `${nodeCopy.city} · Q-Clock #${node.qClockSector}`,
    city: nodeCopy.city,
    coordinatesLabel: `${node.lat.toFixed(2)}°, ${node.lng.toFixed(2)}°`,
    platformLabel: `${wd.mapSourcePrefix} ${node.mapSource}`,
    threatLabel: `π-Harmonic = ${node.piHarmonicFactor}`,
    epistemicTier: node.epistemicTier,
    qKeyDomain: node.qKeyDomain,
    scenarioId: probabilities.dominant,
    scenarioTitle: dominantCopy.title,
    scenarioProbability: dominantPct,
    executiveNarrative: `${nodeCopy.narrative} — ${nodeCopy.infraFact}`,
    stages: [
      {
        phase: wd.phase1Enc,
        title: `${node.gematriaPhrase}`,
        detail: `Ordinal: ${gem.englishOrdinal} · Reduction: ${gem.fullReduction} (Root ${gem.digitalRoot}) · Sumerian: ${gem.englishSumerian}`,
        timeframe: wd.symStatic,
      },
      {
        phase: wd.phase2Enc,
        title: `${node.qClockSector * 6}° · π = ${node.piHarmonicFactor}`,
        detail: `Q-Clock Sector #${node.qClockSector}/60 (+180° opposite vector)`,
        timeframe: '6°/step',
      },
      {
        phase: wd.phase3Enc,
        title: nodeCopy.city,
        detail: nodeCopy.infraFact,
        timeframe: wd.ongoing,
      },
    ],
    triggerOrCause: `${node.mapSource} (${node.epistemicTier})`,
    earlyWarning: wd.encEarlyWarning,
    dualMapInsight: `${node.codeSymbol} · Q-KEY (${node.qKeyDomain}) · π = ${node.piHarmonicFactor}`,
    backendSummary: `MapSource=${node.mapSource} · Ordinal=${gem.englishOrdinal} · Sumerian=${gem.englishSumerian} · QClock=${node.qClockSector}`,
    filmScene: {
      id: `scene-${node.id}`,
      act: 'III',
      sceneNumber: 12,
      timecode: '01:14:20',
      location: nodeCopy.city,
      title: `${wd.decodePrefix} ${node.codeSymbol}`,
      protagonists: wd.encFilmProtagonists,
      groundedReality: nodeCopy.infraFact,
      dramaticConflict: nodeCopy.narrative,
      dialogueExcerpt:
        locale === 'ar'
          ? `«الرمز على الغلاف لم يكن نبوءة — بل استغلال نفس النقطة التي تتقاطع عندها الكابلات والسيولة.»`
          : `"The cover symbol wasn't a prophecy—it sits right on top of the cables and clearing rails everybody depends on."`,
      linkedEventId: node.id,
      dominantScenarioAtBeat: probabilities.dominant,
    },
  };
}
