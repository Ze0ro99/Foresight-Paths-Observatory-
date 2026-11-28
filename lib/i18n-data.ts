import {
  AppLocale,
  EpistemicTier,
  HypothesisId,
  PlatformLayerId,
  QKeyDomainId,
  RegionViewKey,
  ReliabilityGrade,
  ResearchTrack,
  RiskScenarioInput,
  ScenarioId,
  SectorType,
  ThreatMechanismId,
} from './types';

export type LocaleTextMap<T> = Record<AppLocale, T>;

export const SCENARIO_I18N: LocaleTextMap<
  Record<ScenarioId, { title: string; summary: string; earlyWarning: string }>
> = {
  ar: {
    adaptation: {
      title: 'التكيف الهيكلي',
      summary: 'استجابة تنظيمية وهندسية سريعة تفرض تعدد المزودين السحابيين وبروتوكولات عزل الأزمات.',
      earlyWarning: 'إقرار معايير التبديل التلقائي بين السحب السيادية خلال 48 ساعة.',
    },
    fragmentation: {
      title: 'التشظي الرقمي',
      summary: 'تفكك الشبكة العالمية إلى تكتلات إقليمية مغلقة وقيود صارمة على تدفق البيانات والسيولة.',
      earlyWarning: 'إغلاق بوابات التوجيه العابرة للقارات أو تقييد تسويات العملات الرقمية.',
    },
    fragility: {
      title: 'الهشاشة المزمنة',
      summary: 'اتساع فجوة التعقيد التقني مقابل الحوكمة، مما يُبقي الأسواق عرضة لصدمات متكررة.',
      earlyWarning: 'ارتفاع تقلب التداول الخوارزمي وتكرار أعطال نقاط الفشل الوحيدة.',
    },
  },
  en: {
    adaptation: {
      title: 'Structural Adaptation',
      summary: 'Rapid regulatory and engineering response mandating multi-cloud failover and crisis isolation protocols.',
      earlyWarning: 'Enactment of sovereign multi-cloud failover standards within 48 hours.',
    },
    fragmentation: {
      title: 'Digital Fragmentation',
      summary: 'Bifurcation of global networks into enclosed regional blocs with strict liquidity and data border controls.',
      earlyWarning: 'Closure of intercontinental routing gateways or cross-border settlement halts.',
    },
    fragility: {
      title: 'Chronic Fragility',
      summary: 'Widening gap between algorithmic complexity and governance, keeping markets exposed to recurring shocks.',
      earlyWarning: 'Elevated HFT volatility and recurring single-point-of-failure outages.',
    },
  },
  fr: {
    adaptation: {
      title: 'Adaptation Structurelle',
      summary: 'Réponse réglementaire et technique rapide imposant le basculement multi-cloud et les protocoles d’isolation.',
      earlyWarning: 'Adoption des normes de basculement souverain multi-cloud sous 48 heures.',
    },
    fragmentation: {
      title: 'Fragmentation Numérique',
      summary: 'Division du réseau mondial en blocs régionaux fermés avec des restrictions strictes de flux et liquidité.',
      earlyWarning: 'Fermeture des passerelles de routage intercontinentales ou gel des règlements.',
    },
    fragility: {
      title: 'Fragilité Chronique',
      summary: 'Écart croissant entre complexité algorithmique et gouvernance, exposant les marchés aux chocs.',
      earlyWarning: 'Hausse de la volatilité HFT et pannes répétées de points de défaillance uniques.',
    },
  },
  id: {
    adaptation: {
      title: 'Adaptasi Struktural',
      summary: 'Respons regulasi dan rekayasa cepat yang mewajibkan failover multi-cloud dan protokol isolasi krisis.',
      earlyWarning: 'Penerapan standar failover multi-cloud berdaulat dalam waktu 48 jam.',
    },
    fragmentation: {
      title: 'Fragmentasi Digital',
      summary: 'Terpecahnya jaringan global menjadi blok regional tertutup dengan pembatasan ketat arus data dan likuiditas.',
      earlyWarning: 'Penutupan gateway routing lintas benua atau pembatasan kliring lintas batas.',
    },
    fragility: {
      title: 'Kerapuhan Kronis',
      summary: 'Melebarnya kesenjangan antara kompleksitas algoritmik dan tata kelola, membuat pasar rentan terguncang.',
      earlyWarning: 'Lonjakan volatilitas HFT dan gangguan berulang pada titik kegagalan tunggal.',
    },
  },
  vi: {
    adaptation: {
      title: 'Thích Ứng Cấu Trúc',
      summary: 'Phản ứng kỹ thuật và pháp lý nhanh chóng bắt buộc dự phòng đa đám mây và giao thức cô lập khủng hoảng.',
      earlyWarning: 'Ban hành tiêu chuẩn chuyển đổi dự phòng đa đám mây có chủ quyền trong 48 giờ.',
    },
    fragmentation: {
      title: 'Phân Mảnh Số',
      summary: 'Mạng lưới toàn cầu tách thành các khối khu vực khép kín với kiểm soát chặt dòng dữ liệu và thanh khoản.',
      earlyWarning: 'Đóng cửa các cổng định tuyến liên lục địa hoặc hạn chế thanh toán xuyên biên giới.',
    },
    fragility: {
      title: 'Mong Manh Mãn Tính',
      summary: 'Khoảng cách ngày càng rộng giữa độ phức tạp thuật toán và quản trị, khiến thị trường dễ tổn thương.',
      earlyWarning: 'Biến động giao dịch tần suất cao (HFT) tăng và lỗi điểm đơn lặp lại.',
    },
  },
};

export const SECTOR_I18N: LocaleTextMap<Record<SectorType, string>> = {
  ar: { telecom: 'الاتصالات والربط', finance: 'المصارف والتسويات', aviation: 'الطيران والملاحة', energy: 'الطاقة والشبكات', media: 'الفضاء المعلوماتي' },
  en: { telecom: 'Telecom & Routing', finance: 'Banking & Clearing', aviation: 'Aviation & Logistics', energy: 'Energy & Grids', media: 'Information Space' },
  fr: { telecom: 'Télécoms & Routage', finance: 'Banques & Compensation', aviation: 'Aviation & Logistique', energy: 'Énergie & Réseaux', media: 'Espace Informationnel' },
  id: { telecom: 'Telekomunikasi & Routing', finance: 'Perbankan & Kliring', aviation: 'Penerbangan & Logistik', energy: 'Energi & Jaringan', media: 'Ruang Informasi' },
  vi: { telecom: 'Viễn Thông & Định Tuyến', finance: 'Ngân Hàng & Thanh Toán', aviation: 'Hàng Không & Hậu Cần', energy: 'Năng Lượng & Lưới Điện', media: 'Không Gian Thông Tin' },
};

export const TRACK_I18N: LocaleTextMap<Record<ResearchTrack, string>> = {
  ar: { osint: 'المسار 1: OSINT والجنائي الرقمي', ach: 'المسار 2: الفرضيات المتنافسة ACH', semiotics: 'المسار 3: السيميائية والخرائط', contagion: 'المسار 4: العدوى المالية' },
  en: { osint: 'Track 1: OSINT & Forensics', ach: 'Track 2: Competing Hypotheses (ACH)', semiotics: 'Track 3: Dual-Map Semiotics', contagion: 'Track 4: Financial Contagion' },
  fr: { osint: 'Voie 1 : OSINT & Forensique', ach: 'Voie 2 : Hypothèses Concurrentes (ACH)', semiotics: 'Voie 3 : Sémiotique & Cartes', contagion: 'Voie 4 : Contagion Financière' },
  id: { osint: 'Jalur 1: OSINT & Forensik', ach: 'Jalur 2: Hipotesis Bersaing (ACH)', semiotics: 'Jalur 3: Semiotika & Peta', contagion: 'Jalur 4: Penularan Finansial' },
  vi: { osint: 'Luồng 1: OSINT & Pháp Y Số', ach: 'Luồng 2: Giả Thuyết Cạnh Tranh (ACH)', semiotics: 'Luồng 3: Ký Hiệu Học & Bản Đồ', contagion: 'Luồng 4: Lây Lan Tài Chính' },
};

export const THREAT_I18N: LocaleTextMap<
  Record<ThreatMechanismId, { label: string; shortLabel: string; description: string }>
> = {
  ar: {
    bgp_spof: { label: 'اختناق التوجيه ونقاط الفشل الوحيدة (BGP / SPOF)', shortLabel: 'اختناق التوجيه SPOF', description: 'توقف متسلسل في المصادقة السحابية وتبادل المسارات القارية.' },
    algo_contagion: { label: 'العدوى الخوارزمية وهشاشة السيولة (ΠΣV)', shortLabel: 'عدوى السيولة ΠΣV', description: 'استجابة التداول الآلي لصدمات البيانات وتغير أنظمة المقاصة.' },
    narrative_swarm: { label: 'تشعب السرديات التضليلية والهندسة الاجتماعية', shortLabel: 'سرب السرديات Q-Map', description: 'تجميع الحوادث المتفرقة في شبكة ادعاءات مترابطة لتضخيم الذعر.' },
    supply_choke: { label: 'عزل ممرات الطاقة والموانئ اللوجستية', shortLabel: 'عزل ممرات الطاقة', description: 'إغلاق وقائي لبوابات البيانات مما يبطئ سلاسل الإمداد والشحن.' },
    ai_amplification: { label: 'تسارع الأتمتة وتجاوز عتبات الحوكمة', shortLabel: 'تسارع الأتمتة والذكاء', description: 'اتساع الفجوة بين سرعة القرار الآلي وقدرة المراجعة البشرية.' },
  },
  en: {
    bgp_spof: { label: 'Routing Bottleneck & Single Points of Failure (BGP / SPOF)', shortLabel: 'BGP / SPOF Choke', description: 'Cascading stalls across cloud authentication and intercontinental routing tables.' },
    algo_contagion: { label: 'Algorithmic Contagion & Liquidity Fragility (ΠΣV)', shortLabel: 'Liquidity Contagion ΠΣV', description: 'Automated trading feedback triggered by telemetry delays and clearing shocks.' },
    narrative_swarm: { label: 'Disinformation Swarms & Social Engineering', shortLabel: 'Q-Map Narrative Swarm', description: 'Stitching isolated incidents into viral conspiracy graphs to amplify panic.' },
    supply_choke: { label: 'Energy Corridor & Maritime Port Isolation', shortLabel: 'Energy Corridor Choke', description: 'Precautionary gateway air-gapping that slows port clearance and logistics.' },
    ai_amplification: { label: 'Autonomous Acceleration Beyond Governance', shortLabel: 'AI / Automation Drift', description: 'Widening gap between machine execution speed and human oversight.' },
  },
  fr: {
    bgp_spof: { label: 'Engorgement de routage & points uniques de défaillance (BGP / SPOF)', shortLabel: 'Goulot BGP / SPOF', description: 'Arrêts en cascade dans l’authentification cloud et le routage intercontinental.' },
    algo_contagion: { label: 'Contagion algorithmique & fragilité de liquidité (ΠΣV)', shortLabel: 'Contagion ΠΣV', description: 'Réactions automatisées du trading HFT aux retards télémétriques.' },
    narrative_swarm: { label: 'Essaims de désinformation & ingénierie sociale', shortLabel: 'Essaim Q-Map', description: 'Agrégation d’incidents isolés en graphes narratifs anxiogènes.' },
    supply_choke: { label: 'Isolation des corridors énergétiques & ports', shortLabel: 'Goulot Énergie/Ports', description: 'Mise en quarantaine préventive ralentissant le dédouanement maritime.' },
    ai_amplification: { label: 'Accélération autonome au-delà de la gouvernance', shortLabel: 'Dérive IA / Automate', description: 'Écart grandissant entre vitesse machine et validation humaine.' },
  },
  id: {
    bgp_spof: { label: 'Kemacetan Routing & Titik Kegagalan Tunggal (BGP / SPOF)', shortLabel: 'Hambatan BGP / SPOF', description: 'Gangguan beruntun pada autentikasi cloud dan tabel routing lintas benua.' },
    algo_contagion: { label: 'Penularan Algoritmik & Kerapuhan Likuiditas (ΠΣV)', shortLabel: 'Penularan ΠΣV', description: 'Reaksi perdagangan otomatis terhadap keterlambatan telemetri dan kliring.' },
    narrative_swarm: { label: 'Gerombolan Disinformasi & Rekayasa Sosial', shortLabel: 'Narasi Q-Map', description: 'Menghubungkan insiden terpisah menjadi narasi konspirasi untuk memicu kepanikan.' },
    supply_choke: { label: 'Isolasi Koridor Energi & Pelabuhan Maritim', shortLabel: 'Hambatan Energi/Pelabuhan', description: 'Isolasi gateway preventif yang memperlambat kliring logistik.' },
    ai_amplification: { label: 'Akselerasi Otomasi Melampaui Tata Kelola', shortLabel: 'Lonjakan AI / Otomasi', description: 'Kesenjangan kecepatan keputusan mesin dengan pengawasan manusia.' },
  },
  vi: {
    bgp_spof: { label: 'Nghẽn Định Tuyến & Điểm Lỗi Đơn (BGP / SPOF)', shortLabel: 'Nghẽn BGP / SPOF', description: 'Gián đoạn dây chuyền trong xác thực đám mây và bảng định tuyến liên lục địa.' },
    algo_contagion: { label: 'Lây Lan Thuật Toán & Mong Manh Thanh Khoản (ΠΣV)', shortLabel: 'Lây Lan ΠΣV', description: 'Phản ứng giao dịch tự động trước độ trễ dữ liệu và sốc thanh toán.' },
    narrative_swarm: { label: 'Bầy Đàn Tin Giả & Kỹ Nghệ Xã Hội', shortLabel: 'Bầy Đàn Q-Map', description: 'Ghép các sự cố rời rạc thành mạng lưới thuyết âm mưu gây hoảng loạn.' },
    supply_choke: { label: 'Cô Lập Hành Lang Năng Lượng & Cảng Biển', shortLabel: 'Nghẽn Năng Lượng/Cảng', description: 'Ngắt kết nối phòng ngừa làm chậm thông quan cảng và chuỗi cung ứng.' },
    ai_amplification: { label: 'Tăng Tốc Tự Động Vượt Tầm Quản Trị', shortLabel: 'Tăng Tốc AI', description: 'Khoảng cách giữa tốc độ thực thi máy và khả năng giám sát con người.' },
  },
};

export const PLATFORM_I18N: LocaleTextMap<
  Record<PlatformLayerId, { label: string; shortLabel: string }>
> = {
  ar: {
    cloud_routing: { label: 'منصات التوجيه والسحابة (BGP / IAM)', shortLabel: 'البنية السحابية' },
    financial_hft: { label: 'منصات التسويات والتداول الخوارزمي', shortLabel: 'المقاصة والتداول' },
    social_swarm: { label: 'منصات التواصل والتضخيم السردي', shortLabel: 'منصات التواصل' },
    energy_maritime: { label: 'منصات الموانئ والطاقة والطيران', shortLabel: 'الطاقة والملاحة' },
    discourse_media: { label: 'منصات الخطاب الإعلامي والاستشراف', shortLabel: 'الإعلام والاستشراف' },
  },
  en: {
    cloud_routing: { label: 'Cloud & Core Routing (BGP / IAM)', shortLabel: 'Cloud Routing' },
    financial_hft: { label: 'Clearing & Algorithmic Trading (HFT)', shortLabel: 'Clearing & HFT' },
    social_swarm: { label: 'Social Graph & Narrative Amplification', shortLabel: 'Social Platforms' },
    energy_maritime: { label: 'Ports, Energy Grids & Aviation', shortLabel: 'Energy & Maritime' },
    discourse_media: { label: 'Media Discourse & Foresight', shortLabel: 'Media & Foresight' },
  },
  fr: {
    cloud_routing: { label: 'Routage Cloud & Identité (BGP / IAM)', shortLabel: 'Infra Cloud' },
    financial_hft: { label: 'Compensation & Trading Algorithmique', shortLabel: 'Finance HFT' },
    social_swarm: { label: 'Réseaux Sociaux & Amplification Narrative', shortLabel: 'Réseaux Sociaux' },
    energy_maritime: { label: 'Ports, Réseaux d’Énergie & Aviation', shortLabel: 'Énergie & Maritime' },
    discourse_media: { label: 'Discours Médiatique & Prospective', shortLabel: 'Médias & Prospective' },
  },
  id: {
    cloud_routing: { label: 'Routing Cloud & Identitas (BGP / IAM)', shortLabel: 'Infra Cloud' },
    financial_hft: { label: 'Kliring & Perdagangan Algoritmik (HFT)', shortLabel: 'Keuangan HFT' },
    social_swarm: { label: 'Platform Sosial & Amplifikasi Narasi', shortLabel: 'Platform Sosial' },
    energy_maritime: { label: 'Pelabuhan, Jaringan Energi & Penerbangan', shortLabel: 'Energi & Maritim' },
    discourse_media: { label: 'Wacana Media & Prediksi', shortLabel: 'Media & Prediksi' },
  },
  vi: {
    cloud_routing: { label: 'Định Tuyến Đám Mây & Danh Tính (BGP / IAM)', shortLabel: 'Hạ Tầng Đám Mây' },
    financial_hft: { label: 'Thanh Toán Bù Trừ & Giao Dịch Thuật Toán', shortLabel: 'Tài Chính HFT' },
    social_swarm: { label: 'Mạng Xã Hội & Khuếch Đại Tường Thuật', shortLabel: 'Mạng Xã Hội' },
    energy_maritime: { label: 'Cảng Biển, Lưới Điện & Hàng Không', shortLabel: 'Năng Lượng & Biển' },
    discourse_media: { label: 'Truyền Thông & Dự Báo Chiến Lược', shortLabel: 'Truyền Thông' },
  },
};

export const HYPOTHESIS_I18N: LocaleTextMap<
  Record<HypothesisId, { label: string; description: string }>
> = {
  ar: {
    human_error: { label: 'خطأ بشري في تحديث برمجي', description: 'تعديل خاطئ في تهيئة الشبكة أو شهادات التشفير أثناء نشر تحديث روتيني.' },
    infra_failure: { label: 'إخفاق هيكلي في البنية المادية', description: 'انقطاع في الكابلات البحرية أو مراكز التبريد أو نقطة فشل وحيدة سحابية.' },
    cyber_attack: { label: 'عملية سيبرانية موجهة', description: 'استغلال متعمد لبروتوكولات التوجيه BGP أو هجوم سلاسل إمداد برمجية.' },
    disinfo_cascade: { label: 'تضخيم تضليلي لحدث محدود', description: 'عطل تقني جزئي تم تضخيمه عبر حملات هندسة اجتماعية لإحداث ذعر مالي.' },
  },
  en: {
    human_error: { label: 'Human / Config Error', description: 'Misconfiguration of routing policy or TLS certificates during routine deployment.' },
    infra_failure: { label: 'Physical Infrastructure Failure', description: 'Subsea cable cut, cooling loss, or structural cloud single-point-of-failure.' },
    cyber_attack: { label: 'Targeted Cyber Operation', description: 'Intentional BGP hijack or software supply-chain compromise.' },
    disinfo_cascade: { label: 'Disinformation Amplification', description: 'Limited technical glitch inflated by coordinated social engineering into market panic.' },
  },
  fr: {
    human_error: { label: 'Erreur Humaine / Configuration', description: 'Erreur de configuration BGP ou de certificat lors d’une mise à jour de routine.' },
    infra_failure: { label: 'Défaillance Physique d’Infrastructure', description: 'Rupture de câble sous-marin, panne de refroidissement ou point unique cloud.' },
    cyber_attack: { label: 'Cyberopération Ciblée', description: 'Détournement BGP intentionnel ou attaque de chaîne logistique logicielle.' },
    disinfo_cascade: { label: 'Amplification par Désinformation', description: 'Incident technique limité gonflé par ingénierie sociale coordonnée.' },
  },
  id: {
    human_error: { label: 'Kesalahan Konfigurasi Manusia', description: 'Kesalahan kebijakan routing atau sertifikat kriptografi saat pembaruan rutin.' },
    infra_failure: { label: 'Kegagalan Infrastruktur Fisik', description: 'Putusnya kabel bawah laut, gangguan pendinginan, atau titik kegagalan cloud.' },
    cyber_attack: { label: 'Operasi Siber Terarah', description: 'Pembajakan BGP terencana atau kompromi rantai pasok perangkat lunak.' },
    disinfo_cascade: { label: 'Amplifikasi Disinformasi', description: 'Gangguan teknis terbatas yang dibesar-besarkan rekayasa sosial untuk memicu panik.' },
  },
  vi: {
    human_error: { label: 'Lỗi Cấu Hình Con Người', description: 'Sai sót chính sách định tuyến hoặc chứng chỉ bảo mật khi cập nhật định kỳ.' },
    infra_failure: { label: 'Sự Cố Hạ Tầng Vật Lý', description: 'Đứt cáp quang biển, mất làm mát hoặc lỗi điểm đơn đám mây.' },
    cyber_attack: { label: 'Chiến Dịch Mạng Có Chủ Đích', description: 'Cố ý chiếm quyền định tuyến BGP hoặc tấn công chuỗi cung ứng phần mềm.' },
    disinfo_cascade: { label: 'Khuếch Đại Tin Giả', description: 'Sự cố kỹ thuật cục bộ bị thổi phồng qua mạng xã hội để gây hoảng loạn.' },
  },
};

export const RELIABILITY_I18N: LocaleTextMap<Record<ReliabilityGrade, string>> = {
  ar: {
    A1: 'A1 — سجل تقني أولي موثق',
    B2: 'B2 — مصدر مؤسسي موثوق غالباً',
    C3: 'C3 — إشارة إعلامية غير محققة بالكامل',
    D4: 'D4 — ضوضاء سردية / ادعاء غير موثق',
  },
  en: {
    A1: 'A1 — Verified Primary Telemetry',
    B2: 'B2 — Usually Reliable Institutional Source',
    C3: 'C3 — Partially Unverified Media Signal',
    D4: 'D4 — Narrative Noise / Unverified Claim',
  },
  fr: {
    A1: 'A1 — Télémétrie Primaire Vérifiée',
    B2: 'B2 — Source Institutionnelle Fiable',
    C3: 'C3 — Signal Médiatique Partiellement Vérifié',
    D4: 'D4 — Bruit Narratif / Allégation Non Vérifiée',
  },
  id: {
    A1: 'A1 — Telemetri Primer Terverifikasi',
    B2: 'B2 — Sumber Institusional Tepercaya',
    C3: 'C3 — Sinyal Media Belum Terverifikasi Penuh',
    D4: 'D4 — Kebisingan Narasi / Klaim Tak Terbukti',
  },
  vi: {
    A1: 'A1 — Dữ Liệu Đo Lường Sơ Cấp Đã Xác Minh',
    B2: 'B2 — Nguồn Tổ Chức Đáng Tin Cậy',
    C3: 'C3 — Tín Hiệu Truyền Thông Chưa Xác Minh Đầy Đủ',
    D4: 'D4 — Nhiễu Thông Tin / Tuyên Bố Chưa Kiểm Chứng',
  },
};

export const EPISTEMIC_I18N: LocaleTextMap<
  Record<EpistemicTier, { label: string; signal: string; desc: string; rule: string }>
> = {
  ar: {
    documented: { label: 'موثق', signal: 'إشارة خضراء', desc: 'مدعوم بأدلة أولية أو سجلات تقنية ومصرفية رسمية متعددة.', rule: 'يظهر في طبقة الأحداث الموثقة ويُسمح بإسقاطه كإحداثي مرجعي على الخريطة.' },
    plausible: { label: 'محتمل', signal: 'إشارة صفراء', desc: 'توجد قرائن ومصادر متعددة لكن التفسير السببي ما يزال غير محسوم.', rule: 'يُوسم بتنبيه مراجعة مصادر ويتطلب تأكيداً من مشاركين موثقين بـ KYC.' },
    disputed: { label: 'مختلف عليه', signal: 'إشارة صفراء متنازع عليها', desc: 'تتعارض بشأنه المصادر الموثوقة أو توجد تفسيرات متناقضة.', rule: 'تُلزم المنصة بعرض الأدلة المؤيدة والمعارضة جنباً إلى جنب.' },
    speculative: { label: 'تخميني', signal: 'إشارة برتقالية', desc: 'يفتقر إلى دليل داعم كافٍ أو يعتمد على إفادات غير موثقة.', rule: 'يُحصر في تبويب التحليلات الافتراضية ولا يُدمج مع سجل الأحداث الموثقة.' },
    symbolic: { label: 'رمزي / تنبيه', signal: 'تنبيه طارئ أحمر', desc: 'ربط بالجيماتريا أو التوقيتات الرمزية؛ أو تنبيه سيبراني/ميداني طارئ.', rule: 'يُعرض مع تنبيه ثابت بأن التجاور البصري أو التطابق الرقمي لا يثبت سببية واقعية.' },
  },
  en: {
    documented: { label: 'Documented', signal: 'Green Signal', desc: 'Backed by raw telemetry and multiple authoritative institutional records.', rule: 'Appears on the verified map layer as a primary coordinate anchor.' },
    plausible: { label: 'Plausible', signal: 'Yellow Signal', desc: 'Corroborated by secondary feeds though root causality remains open.', rule: 'Marked for source audit and KYC-verified community confirmation.' },
    disputed: { label: 'Disputed', signal: 'Amber Conflict', desc: 'Credible sources report conflicting causal interpretations.', rule: 'Platform displays supporting and falsifying evidence side-by-side.' },
    speculative: { label: 'Speculative', signal: 'Orange Signal', desc: 'Lacks sufficient empirical corroboration or relies on unverified posts.', rule: 'Isolated inside speculative labs; never mixed into verified map records.' },
    symbolic: { label: 'Symbolic / Alert', signal: 'Red Alert', desc: 'Gematria/map symbolism pairing or critical operational anomaly.', rule: 'Displays an explicit disclaimer that symbolic resonance does not imply causation.' },
  },
  fr: {
    documented: { label: 'Documenté', signal: 'Signal Vert', desc: 'Appuyé par la télémétrie brute et plusieurs registres officiels.', rule: 'Affiché sur la couche vérifiée comme coordonnée de référence.' },
    plausible: { label: 'Plausible', signal: 'Signal Jaune', desc: 'Corroboré par plusieurs flux mais causalité encore ouverte.', rule: 'Marqué pour audit des sources et validation KYC communautaire.' },
    disputed: { label: 'Contesté', signal: 'Conflit Ambre', desc: 'Des sources fiables présentent des interprétations contradictoires.', rule: 'Affiche côte à côte les preuves à l’appui et de réfutation.' },
    speculative: { label: 'Spéculatif', signal: 'Signal Orange', desc: 'Manque de preuves empiriques ou repose sur des affirmations non vérifiées.', rule: 'Cantonné aux laboratoires hypothétiques hors couche vérifiée.' },
    symbolic: { label: 'Symbolique / Alerte', signal: 'Alerte Rouge', desc: 'Association gématrique/cartographique ou alerte critique.', rule: 'Affiche un avertissement que la coïncidence symbolique n’est pas une preuve.' },
  },
  id: {
    documented: { label: 'Terdokumentasi', signal: 'Sinyal Hijau', desc: 'Didukung telemetri mentah dan berbagai catatan resmi lembaga.', rule: 'Ditampilkan pada lapisan peta terverifikasi sebagai titik referensi utama.' },
    plausible: { label: 'Masuk Akal', signal: 'Sinyal Kuning', desc: 'Didukung beberapa sumber sekunder namun kausalitas akhir belum final.', rule: 'Ditandai untuk tinjauan sumber dan konfirmasi komunitas KYC.' },
    disputed: { label: 'Diperdebatkan', signal: 'Konflik Kuning', desc: 'Sumber tepercaya melaporkan interpretasi penyebab yang saling bertentangan.', rule: 'Platform menampilkan bukti pendukung dan penyangkal secara berdampingan.' },
    speculative: { label: 'Spekulatif', signal: 'Sinyal Oranye', desc: 'Kurang bukti empiris atau bersumber dari klaim yang belum diverifikasi.', rule: 'Dibatasi di tab analisis spekulatif dan tidak dicampur ke log utama.' },
    symbolic: { label: 'Simbolik / Peringatan', signal: 'Peringatan Merah', desc: 'Korelasi gematria/peta simbolik atau peringatan anomali kritis.', rule: 'Menampilkan peringatan tegas bahwa kecocokan simbolik bukan bukti sebab-akibat.' },
  },
  vi: {
    documented: { label: 'Đã Xác Thực', signal: 'Tín Hiệu Xanh', desc: 'Được chứng minh bởi dữ liệu đo lường thô và hồ sơ tổ chức chính thức.', rule: 'Hiển thị trên lớp bản đồ xác thực làm tọa độ tham chiếu chính.' },
    plausible: { label: 'Hợp Lý', signal: 'Tín Hiệu Vàng', desc: 'Có nhiều nguồn phụ xác nhận nhưng nguyên nhân gốc vẫn đang mở.', rule: 'Gắn nhãn kiểm tra nguồn và chờ xác nhận cộng đồng KYC.' },
    disputed: { label: 'Tranh Chấp', signal: 'Cảnh Báo Hổ Phách', desc: 'Các nguồn uy tín đưa ra giải thích nhân quả trái ngược nhau.', rule: 'Nền tảng hiển thị song song bằng chứng ủng hộ và bác bỏ.' },
    speculative: { label: 'Suy Đoán', signal: 'Tín Hiệu Cam', desc: 'Thiếu bằng chứng thực nghiệm hoặc dựa trên tuyên bố chưa kiểm chứng.', rule: 'Giới hạn trong phòng phân tích giả định, không trộn vào dữ liệu xác thực.' },
    symbolic: { label: 'Biểu Tượng / Cảnh Báo', signal: 'Cảnh Báo Đỏ', desc: 'Liên kết gematria/bản đồ biểu tượng hoặc cảnh báo sự cố khẩn cấp.', rule: 'Hiển thị cảnh báo rõ rằng trùng hợp biểu tượng không chứng minh quan hệ nhân quả.' },
  },
};

export const QKEY_I18N: LocaleTextMap<Record<QKeyDomainId, { label: string; examples: string }>> = {
  ar: {
    antiquity: { label: 'العصور القديمة', examples: 'الحضارات القديمة، مصر وروما وأتلانتس والجذور الرمزية الباكرة.' },
    premodern: { label: 'ما قبل الحداثة', examples: 'الجمعيات السرية، فرسان الهيكل، الفاتيكان، والمؤسسات ما قبل الصناعية.' },
    extraterrestrials: { label: 'الكائنات الفضائية', examples: 'مشروع الكتاب الأزرق، المنطقة 51، وسرديات البرنامج الفضائي السري.' },
    nazi_era: { label: 'الحقبة النازية', examples: 'عملية مشبك الورق وبرامج نقل العلماء بعد 1945.' },
    mk_ultra: { label: 'التحكم بالعقول MK-Ultra', examples: 'تجارب السيطرة الذهنية، الحرب النفسية، واستغلال المنصات الإعلامية.' },
    depopulation: { label: 'تخفيض السكان', examples: 'المزاعم المرتبطة بأجندات ضبط السكان والأوبئة المصنّعة.' },
    false_flags: { label: 'العمليات المضللة', examples: 'عملية نورثوودز وإعادة تأويل الحوادث السيبرانية كرسائل مشفرة.' },
    weather_warfare: { label: 'حرب الطقس والممرات', examples: 'مزاعم الهندسة الجيولوجية واضطرابات الطاقة والممرات البحرية.' },
    trump_era: { label: 'حقبة ترامب وQAnon', examples: 'قطرات Q، ويكيليكس، الجدل حول QFS، وتواريخ البث الطارئ.' },
  },
  en: {
    antiquity: { label: 'Antiquity', examples: 'Ancient civilizations, Giza, Rome, Atlantis, and early symbolic cycles.' },
    premodern: { label: 'Premodern', examples: 'Secret societies, Knights Templar, Vatican, and pre-industrial guilds.' },
    extraterrestrials: { label: 'Extraterrestrials', examples: 'Project Blue Book, Area 51, and Secret Space Program lore.' },
    nazi_era: { label: 'Nazi Era', examples: 'Operation Paperclip and post-1945 aerospace defense myths.' },
    mk_ultra: { label: 'MK-Ultra', examples: 'Psychological operations, cognitive warfare, and media swarms.' },
    depopulation: { label: 'Depopulation', examples: 'Claims linking engineered crises to demographic agendas.' },
    false_flags: { label: 'False Flags', examples: 'Operation Northwoods and reframing cyber outages as coded comms.' },
    weather_warfare: { label: 'Weather & Corridors', examples: 'Geoengineering claims and maritime/energy supply shocks.' },
    trump_era: { label: 'Trump Era & QAnon', examples: 'Q drops, QFS narratives, and emergency broadcast dates.' },
  },
  fr: {
    antiquity: { label: 'Antiquité', examples: 'Civilisations anciennes, Gizeh, Rome et cycles symboliques.' },
    premodern: { label: 'Prémoderne', examples: 'Sociétés secrètes, Templiers, Vatican et institutions anciennes.' },
    extraterrestrials: { label: 'Extraterrestres', examples: 'Projet Livre Bleu, Zone 51 et récits spatiaux secrets.' },
    nazi_era: { label: 'Ère Nazie', examples: 'Opération Paperclip et transferts scientifiques d’après-1945.' },
    mk_ultra: { label: 'MK-Ultra', examples: 'Guerre psychologique et manipulation algorithmique des médias.' },
    depopulation: { label: 'Dépopulation', examples: 'Thèses liant crises sanitaires et contrôle démographique.' },
    false_flags: { label: 'Faux Drapeaux', examples: 'Opération Northwoods et réinterprétation des cyberpannes.' },
    weather_warfare: { label: 'Météo & Corridors', examples: 'Allégations de géo-ingénierie et blocages énergétiques.' },
    trump_era: { label: 'Ère Trump & QAnon', examples: 'Drops Q, récits QFS et alertes d’urgence recyclées.' },
  },
  id: {
    antiquity: { label: 'Zaman Kuno', examples: 'Peradaban kuno, Giza, Roma, Atlantis, dan siklus simbolik awal.' },
    premodern: { label: 'Pra-Modern', examples: 'Perkumpulan rahasia, Templar, Vatikan, dan lembaga pra-industri.' },
    extraterrestrials: { label: 'Ekstraterestrial', examples: 'Project Blue Book, Area 51, dan narasi program luar angkasa.' },
    nazi_era: { label: 'Era Nazi', examples: 'Operasi Paperclip dan mitos transfer ilmuwan pasca-1945.' },
    mk_ultra: { label: 'MK-Ultra', examples: 'Operasi psikologis, perang kognitif, dan amplifikasi media.' },
    depopulation: { label: 'Depopulasi', examples: 'Klaim yang mengaitkan krisis rekayasa dengan agenda populasi.' },
    false_flags: { label: 'Operasi Bendera Palsu', examples: 'Operasi Northwoods dan pembingkaian insiden siber sebagai kode.' },
    weather_warfare: { label: 'Perang Cuaca & Koridor', examples: 'Klaim rekayasa iklim dan gangguan jalur energi maritim.' },
    trump_era: { label: 'Era Trump & QAnon', examples: 'Tetesan Q, narasi QFS, dan tanggal siaran darurat.' },
  },
  vi: {
    antiquity: { label: 'Thời Cổ Đại', examples: 'Nền văn minh cổ đại, Giza, La Mã và các chu kỳ biểu tượng.' },
    premodern: { label: 'Tiền Hiện Đại', examples: 'Hội kín, Hiệp sĩ Dòng Đền, Vatican và các thiết chế cổ.' },
    extraterrestrials: { label: 'Ngoài Hành Tinh', examples: 'Dự án Sách Xanh, Khu vực 51 và truyền thuyết không gian.' },
    nazi_era: { label: 'Thời Đức Quốc Xã', examples: 'Chiến dịch Kẹp Giấy và huyền thoại chuyển giao khoa học sau 1945.' },
    mk_ultra: { label: 'Kiểm Soát Tâm Trí MK-Ultra', examples: 'Chiến tranh tâm lý và thao túng thuật toán truyền thông.' },
    depopulation: { label: 'Giảm Dân Số', examples: 'Các tuyên bố gắn khủng hoảng với chương trình kiểm soát dân số.' },
    false_flags: { label: 'Chiến Dịch Cờ Giả', examples: 'Chiến dịch Northwoods và diễn giải sự cố mạng thành mật mã.' },
    weather_warfare: { label: 'Thời Tiết & Hành Lang Biển', examples: 'Cáo buộc địa kỹ thuật và gián đoạn tuyến năng lượng hàng hải.' },
    trump_era: { label: 'Kỷ Nguyên Trump & QAnon', examples: 'Q-drops, câu chuyện QFS và ngày phát sóng khẩn cấp.' },
  },
};

export const REGION_LABELS_I18N: LocaleTextMap<Record<RegionViewKey, string>> = {
  ar: { global: 'العالم', mena: 'الشرق الأوسط MENA', europe: 'أوروبا', americas: 'الأمريكتان', asia: 'آسيا والمحيط' },
  en: { global: 'Global', mena: 'Middle East (MENA)', europe: 'Europe', americas: 'Americas', asia: 'Asia-Pacific' },
  fr: { global: 'Monde', mena: 'Moyen-Orient (MENA)', europe: 'Europe', americas: 'Amériques', asia: 'Asie-Pacifique' },
  id: { global: 'Global', mena: 'Timur Tengah (MENA)', europe: 'Eropa', americas: 'Amerika', asia: 'Asia-Pasifik' },
  vi: { global: 'Toàn Cầu', mena: 'Trung Đông (MENA)', europe: 'Châu Âu', americas: 'Châu Mỹ', asia: 'Châu Á - TBD' },
};

export const PI_REALITY_VS_MYTH_I18N: LocaleTextMap<
  { axis: string; myth: string; reality: string }[]
> = {
  ar: [
    {
      axis: 'دلالة الثابت الرياضي باي (3.14) والتسعير الحقيقي',
      myth: 'ترويج تسعيرات كونية ثابتة غير مرتبطة بالسيولة الفعلية بدعوى تفعيل اتفاقيات QFS سرية.',
      reality: 'الرمز 3.14 تيمّن بالثابت الرياضي وتاريخ التأسيس (14 مارس 2019)، ويعتمد التسعير الواقعي داخل التطبيق على أوراكل السوق الموثق (PiRC-203) وفواصل الحماية السعرية.',
    },
    {
      axis: 'مرونة شبكة Pi عند انقطاع الإنترنت',
      myth: 'شبكة لامركزية تعمل خارج الإنترنت العادي وتستوعب انهيار النظام البنكي العالمي.',
      reality: 'تعتمد على بروتوكول Stellar SCP الذي يفضل الأمان على الاستمرارية؛ انكسار تقاطع النصاب يعلق العقد في Joining SCP.',
    },
    {
      axis: 'معيار المراسلات المصرفية ISO 20022',
      myth: 'مفتاح تفعيل سري لتحويل البنوك إلى النظام الكمي وإلغاء الديون فوراً.',
      reality: 'معيار تنسيق رسائل وبيانات عناوين منظمة تمر به SWIFT والبنوك عبر ترقيات مجدولة حتى نوفمبر 2026.',
    },
    {
      axis: 'البدائل الجيوسياسية (BRICS Pay وmBridge)',
      myth: 'تحالف سري عبر الأقمار يطلق أنظمة نقدية مغلقة فجأة.',
      reality: 'مشاريع بين-حكومية وبنكية معلنة: BRICS Pay وتجارب 2027، ومنصة mBridge عبر بنوك مركزية ومراقبة BIS.',
    },
  ],
  en: [
    {
      axis: 'Pi Constant (3.14) vs Market-Oracle Pricing',
      myth: 'Circulating unverified fixed symbolic valuations disconnected from actual liquidity and order books.',
      reality: 'The 3.14 motif commemorates the mathematical constant and Pi Day (March 14, 2019); live app pricing relies strictly on verified PiRC-203 median oracles and PiRC-254 spread circuit breakers.',
    },
    {
      axis: 'Pi Network Resilience During Outages',
      myth: 'A network running independently of global internet routing able to absorb a total banking blackout.',
      reality: 'Built on Stellar SCP, which prioritizes Safety over Liveness; quorum intersection breaks halt nodes in Joining SCP.',
    },
    {
      axis: 'ISO 20022 Banking Messaging Standard',
      myth: 'A secret activation switch converting all central banks to quantum ledgers overnight.',
      reality: 'Structured financial XML/messaging specification adopted gradually by SWIFT and clearing houses through scheduled migrations.',
    },
    {
      axis: 'Geopolitical Rails (BRICS Pay & mBridge)',
      myth: 'Covert satellite coalitions replacing global settlement without public institutional documentation.',
      reality: 'Publicly documented central-bank and commercial pilots: BRICS Pay commercial trials and BIS-supervised mBridge wholesale settlements.',
    },
  ],
  fr: [
    {
      axis: 'Constante Pi (3,14) et Tarification Oracle Réelle',
      myth: 'Promotion de valeurs symboliques fixes déconnectées de la liquidité réelle du marché.',
      reality: 'La référence 3,14 célèbre la constante mathématique et le Pi Day ; la tarification applicative repose sur l’oracle PiRC-203 et le disjoncteur PiRC-254.',
    },
    {
      axis: 'Résilience Pi Network hors connexion',
      myth: 'Un réseau fonctionnant hors d’Internet capable d’absorber un effondrement bancaire mondial.',
      reality: 'Basé sur Stellar SCP privilégiant la sûreté sur la vivacité ; la perte de quorum suspend les nœuds en état Joining SCP.',
    },
    {
      axis: 'Norme bancaire ISO 20022',
      myth: 'Un interrupteur secret basculant instantanément les banques vers des registres quantiques.',
      reality: 'Standard structuré de messagerie financière déployé progressivement par SWIFT et les chambres de compensation.',
    },
    {
      axis: 'Rails géopolitiques (BRICS Pay & mBridge)',
      myth: 'Alliances satellitaires secrètes remplaçant la finance mondiale du jour au lendemain.',
      reality: 'Projets interbancaires publics documentés : pilotes BRICS Pay et règlements institutionnels mBridge supervisés par la BRI.',
    },
  ],
  id: [
    {
      axis: 'Konstanta Pi (3.14) vs Harga Oracle Pasar Nyata',
      myth: 'Menyebarkan angka valuasi simbolik tetap yang terputus dari likuiditas dan buku pesanan aktual.',
      reality: 'Angka 3.14 merujuk konstanta matematika & Pi Day (14 Maret 2019); harga di aplikasi wajib mengikuti oracle median PiRC-203 dan pemutus sirkuit PiRC-254.',
    },
    {
      axis: 'Ketahanan Jaringan Pi Saat Internet Terputus',
      myth: 'Jaringan berjalan di luar infrastruktur internet dan mampu menampung keruntuhan perbankan.',
      reality: 'Menggunakan konsensus Stellar SCP yang mengutamakan Keamanan di atas Liveness; hilangnya kuorum menjeda node pada Joining SCP.',
    },
    {
      axis: 'Standar Pesan Perbankan ISO 20022',
      myth: 'Tombol rahasia yang mengubah seluruh sistem perbankan menjadi buku besar kuantum seketika.',
      reality: 'Standar format pesan finansial terstruktur yang diadopsi bertahap oleh SWIFT dan bank sentral sesuai jadwal.',
    },
    {
      axis: 'Jalur Geopolitik (BRICS Pay & mBridge)',
      myth: 'Koalisi satelit rahasia meluncurkan sistem moneter tertutup tanpa jejak institusional.',
      reality: 'Proyek antarbank sentral resmi: uji coba komersial BRICS Pay serta platform mBridge yang diawasi BIS.',
    },
  ],
  vi: [
    {
      axis: 'Hằng Số Pi (3.14) và Định Giá Theo Oracle Thị Trường',
      myth: 'Lan truyền các mức định giá biểu tượng cố định tách rời khỏi thanh khoản và sổ lệnh thực tế.',
      reality: 'Con số 3.14 kỷ niệm hằng số toán học và Ngày Pi (14/03/2019); định giá thực tế trong ứng dụng dùng oracle PiRC-203 và cầu dao ngắt mạch PiRC-254.',
    },
    {
      axis: 'Khả Năng Chịu Đựng Mạng Pi Khi Đứt Cáp Internet',
      myth: 'Mạng chạy hoàn toàn ngoài Internet truyền thống khi hệ thống ngân hàng sụp đổ.',
      reality: 'Sử dụng đồng thuận Stellar SCP ưu tiên An toàn (Safety) hơn Tính sống (Liveness); mất giao điểm quorum sẽ tạm dừng ở Joining SCP.',
    },
    {
      axis: 'Chuẩn Thông Điệp Ngân Hàng ISO 20022',
      myth: 'Công tắc bí mật chuyển đổi ngay lập tức các ngân hàng sang sổ cái lượng tử.',
      reality: 'Chuẩn định dạng dữ liệu tài chính có cấu trúc được SWIFT và các hệ thống thanh toán triển khai theo lộ trình.',
    },
    {
      axis: 'Hạ Tầng Địa Chính Trị (BRICS Pay & mBridge)',
      myth: 'Liên minh vệ tinh bí mật thay thế hệ thống thanh toán toàn cầu trong im lặng.',
      reality: 'Các dự án ngân hàng trung ương công khai: thử nghiệm thương mại BRICS Pay và nền tảng mBridge do BIS giám sát.',
    },
  ],
};

export const CONSPIRACY_MAPS_I18N: LocaleTextMap<
  Record<string, { name: string; designer: string; geometry: string; layers: string }>
> = {
  ar: {
    'great-awakening': { name: 'خريطة الصحوة الكبرى (Great Awakening Map)', designer: 'بارينيا تشامب (2018) / 2020', geometry: 'تدرج عمودي ثلاثي الطبقات من الدنيوي أسفلاً إلى الكوني والروحي في القمة.', layers: 'السفلية (السلطة والسياسة) · الوسطى (التاريخ البديل) · العليا (التأمل والوميض الشمسي).' },
    'q-web': { name: 'خريطة الدولة العميقة (Deep State Map / Q-Web)', designer: 'ديلان لويس مونرو (2017–2018)', geometry: 'عمود زمني مركزي يتفرع لجناحين: اليسار (التكنولوجيا) واليمين (الحرب).', layers: '9 نطاقات لونية في Q-KEY من العصور القديمة حتى حقبة ترامب.' },
    'world-hierarchy': { name: 'هرم التسلسل العالمي (World Hierarchy Pyramid)', designer: 'ديلان لويس مونرو', geometry: 'هرم طبقي رأسي من 5 درجات متصاعدة رمزياً ومعدنياً.', layers: 'البرونز ← الفضة ← الذهب ← التكتايت ← الأثير (5D).' },
    'cult-of-baal-gar': { name: 'خريطة عبادة بعل + خرائط 5G وRainbow Body', designer: 'مونرو / GAR (2021–2026)', geometry: 'خط زمني رأسي (8 طبقات) + ماندالا دائرية بسبعة مستويات ومقياس أدلة خمسي.', layers: 'الشرق القديم ← روما ← العصور الحديثة؛ وإشارات أخضر/أصفر/أحمر.' },
  },
  en: {
    'great-awakening': { name: 'Great Awakening Map', designer: 'Barenia Champ (2018) / 2020', geometry: 'Three-tier vertical gradient from geopolitical earth nodes up to spiritual cosmology.', layers: 'Lower (Governance/Power) · Middle (Alt-History/Disclosure) · Upper (Cosmic Cycles).' },
    'q-web': { name: 'Deep State Map / Q-Web', designer: 'Dylan Louis Monroe (2017–2018)', geometry: 'Central chronological spine branching into Tech/Occult left wing and War/Finance right wing.', layers: '9 color-coded Q-KEY domains from Antiquity to Modern Era.' },
    'world-hierarchy': { name: 'World Hierarchy Pyramid', designer: 'Dylan Louis Monroe', geometry: 'Five-level hierarchical metal-to-ether lattice topology.', layers: 'Bronze ← Silver ← Gold ← Tektite ← Aether.' },
    'cult-of-baal-gar': { name: 'Historical Timeline + 5-Tier Evidence Matrix', designer: 'Monroe / GAR (2021–2026)', geometry: '8-band vertical timeline paired with radial mandala & 5-level evidence scale.', layers: 'Ancient Near East ← Rome ← Modern Era with Green/Yellow/Orange/Red epistemic tiers.' },
  },
  fr: {
    'great-awakening': { name: 'Carte du Grand Réveil (Great Awakening)', designer: 'Barenia Champ (2018) / 2020', geometry: 'Gradient vertical à 3 niveaux allant du géopolitique vers le symbolisme cosmique.', layers: 'Inférieure (Pouvoir) · Médiane (Divulgation) · Supérieure (Cycles solaires).' },
    'q-web': { name: 'Carte Q-Web / Deep State', designer: 'Dylan Louis Monroe (2017–2018)', geometry: 'Colonne chronologique centrale ramifiée vers Tech/Occulte et Conflit/Finance.', layers: '9 domaines colorés Q-KEY de l’Antiquité à l’ère moderne.' },
    'world-hierarchy': { name: 'Pyramide Hiérarchique Mondiale', designer: 'Dylan Louis Monroe', geometry: 'Structure pyramidale à 5 paliers symboliques.', layers: 'Bronze ← Argent ← Or ← Tektite ← Éther.' },
    'cult-of-baal-gar': { name: 'Frise Historique + Échelle Épistémique à 5 Niveaux', designer: 'Monroe / GAR (2021–2026)', geometry: 'Frise verticale 8 strates + mandala circulaire et échelle de preuve à 5 rangs.', layers: 'Proche-Orient ancien ← Rome ← Moderne avec signaux Vert/Jaune/Orange/Rouge.' },
  },
  id: {
    'great-awakening': { name: 'Peta Great Awakening', designer: 'Barenia Champ (2018) / 2020', geometry: 'Gradien vertikal 3 lapis dari simpul politik bumi hingga simbolisme kosmik.', layers: 'Bawah (Kekuasaan) · Tengah (Sejarah Alternatif) · Atas (Siklus Kosmik).' },
    'q-web': { name: 'Peta Deep State / Q-Web', designer: 'Dylan Louis Monroe (2017–2018)', geometry: 'Sumbu kronologis pusat bercabang ke Teknologi/Okultisme dan Perang/Keuangan.', layers: '9 domain warna Q-KEY dari Zaman Kuno hingga Era Modern.' },
    'world-hierarchy': { name: 'Piramida Hierarki Dunia', designer: 'Dylan Louis Monroe', geometry: 'Kisi piramida 5 tingkat dari logam menuju eter.', layers: 'Perunggu ← Perak ← Emas ← Tektit ← Eter.' },
    'cult-of-baal-gar': { name: 'Garis Waktu + Skala Bukti 5 Tingkat', designer: 'Monroe / GAR (2021–2026)', geometry: 'Garis waktu 8 pita vertikal + mandala sirkular & skala bukti epistemik.', layers: 'Timur Kuno ← Roma ← Modern dengan indikator Hijau/Kuning/Oranye/Merah.' },
  },
  vi: {
    'great-awakening': { name: 'Bản Đồ Đại Thức Tỉnh (Great Awakening)', designer: 'Barenia Champ (2018) / 2020', geometry: 'Phân tầng dọc 3 lớp từ địa chính trị mặt đất đến biểu tượng vũ trụ.', layers: 'Tầng dưới (Quyền lực) · Tầng giữa (Lịch sử) · Tầng trên (Chu kỳ mặt trời).' },
    'q-web': { name: 'Bản Đồ Deep State / Q-Web', designer: 'Dylan Louis Monroe (2017–2018)', geometry: 'Trục thời gian trung tâm chia nhánh Công nghệ và Tài chính/Xung đột.', layers: '9 miền màu Q-KEY từ Cổ đại đến Hiện đại.' },
    'world-hierarchy': { name: 'Kim Tự Tháp Phân Cấp Thế Giới', designer: 'Dylan Louis Monroe', geometry: 'Cấu trúc kim tự tháp 5 tầng theo kim loại và ether.', layers: 'Đồng ← Bạc ← Vàng ← Tektite ← Ether.' },
    'cult-of-baal-gar': { name: 'Trục Thời Gian + Thang Bằng Chứng 5 Cấp', designer: 'Monroe / GAR (2021–2026)', geometry: 'Trục thời gian 8 tầng kết hợp mandala tròn và thang kiểm chứng 5 cấp.', layers: 'Cận Đông cổ ← La Mã ← Hiện đại với tín hiệu Xanh/Vàng/Cam/Đỏ.' },
  },
};

export const ENCRYPTED_NODES_I18N: LocaleTextMap<
  Record<string, { title: string; city: string; infraFact: string; narrative: string }>
> = {
  ar: {
    'enc-economist-london': { title: 'عقدة غلاف الإيكونوميست 2027 (ΠΣV وتذبذب السيولة)', city: 'لندن', infraFact: 'مركز مقاصة LCH/ICE للسيولة المالية العالمية ومراقبة تذبذب أسعار الفائدة وسندات السيادة الأوروبية.', narrative: 'تموضع رمز (ΠΣV) أسفل الشبكة الحمراء الهابطة وعملات التكديس على غلاف 2027؛ يُقرأ في دوائر فك الشفرات كإشارة تلاقي بين تحديثات ISO 20022 وتداولية التسويات.' },
    'enc-giza-orion': { title: 'محور الجيزة — خريطة الصحوة الكبرى ودورة المبادرة', city: 'الجيزة', infraFact: 'بوابة تقاطع مسارات الكابلات البحرية بين البحر الأحمر والمتوسط وموقع رصد جغرافي جيوديسي محوري.', narrative: 'مرسوم في خريطة «الصحوة الكبرى» بوصفه محور دورة الـ 25,900 سنة، ويُدمج رمزياً بنسبة النسبة الذهبية وباي (π).' },
    'enc-cern-geneva': { title: 'مركز سيرن وجنيف — عقدة التشفير الفيزيائي', city: 'جنيف', infraFact: 'عقدة الحوسبة الشبكية الأوروبية Tier-0 وبوابة تبادل البيانات البحثية ومعايير التسوية السويسرية (BIS).', narrative: 'عقدة سفلية حاسمة في خريطة Q-Web وGreat Awakening تُربط بتقنيات البوابات الكمية والتحول المالي السويسري.' },
    'enc-hormuz-tanker': { title: 'رمز الناقلة المقيدة بالسلاسل والأنبوب المكسور', city: 'مضيق هرمز', infraFact: 'ممر عبور قرابة 21% من إمدادات النفط والغاز المسال العالمية وموقع رصد عالي الحساسية للملاحة البحرية.', narrative: 'يربط غلاف 2027 بين انكسار خط الأنابيب والناقلة المقيّدة بالسلاسل وتصاعد مخاطر التأمين البحري والطاقة.' },
    'enc-taipei-chip': { title: 'عقدة الرقائق والروبوت الخوارزمي في شرق آسيا', city: 'تايبيه', infraFact: 'تركّز أكثر من 60% من تصنيع أشباه الموصلات المتقدمة وكابلات الألياف العابرة للمحيط الهادئ.', narrative: 'تظهر أيقونة الدماغ الثنائي والروبوت المحمل بالبيانات على الغلاف كاستعارة لتسارع وكلاء الذكاء الاصطناعي.' },
    'enc-cheyenne-dumb': { title: 'شايان ماونتن — عقدة Q-Web والقيادة الكمية', city: 'شايان / كولورادو', infraFact: 'مركز رصد فضائي واتصالات محصّنة تحت الصخر الجرانيتي ضمن شبكة القيادة الدفاعية.', narrative: 'تُصنّف في خريطة Q-Web ضمن شبكة القواعد العميقة المرتبطة بسردية البث الطارئ وإعادة الضبط.' },
    'enc-pinegap-au': { title: 'باين غاب — محور الإشارات نصف الكرة الجنوبي', city: 'باين غاب / أستراليا', infraFact: 'محطة تتبع فضائية مشتركة لرصد الإشارات في المحيطين الهندي والهادئ.', narrative: 'ترد في الخريطة التفرعية مع روابط الأقمار الصناعية والاتصالات الترددية كعقدة ربط في النصف الجنوبي.' },
    'enc-antarctica-ice': { title: 'أنتاركتيكا — عقدة الجليد والانحراف المغناطيسي', city: 'ماكموردو / أنتاركتيكا', infraFact: 'محطة أبحاث مناخية وجيوفيزيائية رئيسية لرصد الغلاف الجوي والإشعاع الشمسي.', narrative: 'محور مركزي في الربع السفلي لخريطة الصحوة الكبرى تحت عنوان Operation Highjump والانفصال التقني.' },
  },
  en: {
    'enc-economist-london': { title: 'The Economist 2027 Cover Node (ΠΣV Liquidity Shock)', city: 'London', infraFact: 'LCH/ICE global clearing hub monitoring benchmark sovereign bond and FX liquidity stress.', narrative: 'Placement of (ΠΣV) beneath the falling crimson grid on the 2027 cover; read by decoders as an ISO 20022 & digital settlement convergence symbol.' },
    'enc-giza-orion': { title: 'Giza Axis — Great Awakening Precession Marker', city: 'Giza', infraFact: 'Critical Red Sea–Mediterranean subsea fiber junction and primary geodetic monitoring point.', narrative: 'Depicted on the Great Awakening map as the 25,900-year precession hub, paired symbolically with Pi harmonics.' },
    'enc-cern-geneva': { title: 'CERN Geneva — Deep State Portal Vector', city: 'Geneva', infraFact: 'Tier-0 European scientific compute grid and Swiss BIS international clearing coordination hub.', narrative: 'Lower central node across Q-Web and Great Awakening maps linked to quantum computing and Swiss settlement tropes.' },
    'enc-hormuz-tanker': { title: 'Economist 2027 Chained Tanker & Broken Pipeline', city: 'Strait of Hormuz', infraFact: 'Maritime chokepoint carrying ~21% of global petroleum and LNG shipments.', narrative: 'Pairs the 2027 cover chained ship and fractured pipeline artwork with maritime insurance spikes.' },
    'enc-taipei-chip': { title: 'Economist 2027 AI Silicon & Binary Swarm', city: 'Taipei', infraFact: 'Over 60% of advanced semiconductor fabrication and trans-Pacific trunk cables.', narrative: 'Binary brain and rushing robot icons on the 2027 cover representing runaway autonomous AI deployment.' },
    'enc-cheyenne-dumb': { title: 'Cheyenne Mountain — Q-Web Command Node', city: 'Cheyenne / CO', infraFact: 'Hardened aerospace telemetry and deep defense command relay installation.', narrative: 'Classified under Q-Web bunker nodes tied to emergency broadcast system conspiracy narratives.' },
    'enc-pinegap-au': { title: 'Pine Gap — Southern Telemetry Vector', city: 'Pine Gap / AU', infraFact: 'Joint space-tracking and RF telemetry relay covering the Indo-Pacific hemisphere.', narrative: 'Mapped inside the southern hemisphere relay cluster linked to satellite frequency claims.' },
    'enc-antarctica-ice': { title: 'Antarctica — Highjump Anomaly Marker', city: 'McMurdo / Antarctica', infraFact: 'Primary atmospheric, climate, and geomagnetic solar observatory station.', narrative: 'Southern quadrant nexus on the Great Awakening map labeled Operation Highjump.' },
  },
  fr: {
    'enc-economist-london': { title: 'Nœud Couverture 2027 (ΠΣV Choc Liquidité)', city: 'Londres', infraFact: 'Centre mondial de compensation LCH/ICE pour les taux et la liquidité souveraine.', narrative: 'Positionnement du sigle ΠΣV sous la grille rouge sur la couverture 2027, interprété comme convergence ISO 20022.' },
    'enc-giza-orion': { title: 'Axe de Gizeh — Marqueur de Précession', city: 'Gizeh', infraFact: 'Carrefour stratégique des câbles sous-marins Mer Rouge–Méditerranée et repère géodésique.', narrative: 'Illustré sur la carte Great Awakening comme axe du cycle de 25 900 ans couplé au nombre π.' },
    'enc-cern-geneva': { title: 'CERN Genève — Vecteur de Compensation', city: 'Genève', infraFact: 'Nœud de calcul Tier-0 européen et coordination financière internationale BRI (BIS).', narrative: 'Nœud clé reliant portails quantiques et récits de réinitialisation financière suisse.' },
    'enc-hormuz-tanker': { title: 'Pétrolier Enchaîné & Pipeline Brisé (2027)', city: 'Détroit d’Ormuz', infraFact: 'Passage maritime critique acheminant environ 21 % du pétrole et GNL mondial.', narrative: 'Relie les symboles de pipeline brisé et navire enchaîné aux hausses de fret et d’assurance.' },
    'enc-taipei-chip': { title: 'Silicium IA & Essaim Binaire (2027)', city: 'Taipei', infraFact: 'Plus de 60 % de la fabrication avancée de semi-conducteurs et câbles transpacifiques.', narrative: 'Cerveau binaire et robot sur la couverture incarnant l’accélération des agents IA.' },
    'enc-cheyenne-dumb': { title: 'Cheyenne Mountain — Nœud Q-Web', city: 'Cheyenne / CO', infraFact: 'Centre blindé de télémétrie aérospatiale et communications de défense.', narrative: 'Référencé dans Q-Web pour les récits de système de diffusion d’urgence.' },
    'enc-pinegap-au': { title: 'Pine Gap — Vecteur Télémétrique Sud', city: 'Pine Gap / AU', infraFact: 'Station spatiale couvrant les télécommunications de l’Indo-Pacifique.', narrative: 'Nœud de l’hémisphère sud relié aux trajectoires satellitaires.' },
    'enc-antarctica-ice': { title: 'Antarctique — Marqueur Highjump', city: 'McMurdo / Antarctique', infraFact: 'Observatoire principal du climat, de l’atmosphère et du rayonnement solaire.', narrative: 'Secteur inférieur de la carte Great Awakening sous le libellé Operation Highjump.' },
  },
  id: {
    'enc-economist-london': { title: 'Simpul Sampul The Economist 2027 (ΠΣV)', city: 'London', infraFact: 'Pusat kliring global LCH/ICE untuk pemantauan likuiditas obligasi dan suku bunga.', narrative: 'Simbol ΠΣV di bawah kisi merah pada sampul 2027 dibaca sebagai konvergensi ISO 20022 dan penyelesaian digital.' },
    'enc-giza-orion': { title: 'Poros Giza — Penanda Presesi Great Awakening', city: 'Giza', infraFact: 'Simpul kabel serat laut Laut Merah–Mediterania dan titik pemantauan geodesi utama.', narrative: 'Digambarkan dalam peta Great Awakening sebagai poros siklus 25.900 tahun bersama konstanta Pi.' },
    'enc-cern-geneva': { title: 'CERN Jenewa — Vektor Portal & Kliring', city: 'Jenewa', infraFact: 'Pusat komputasi ilmiah Tier-0 Eropa dan koordinasi penyelesaian internasional BIS Swiss.', narrative: 'Simpul bawah utama pada Q-Web terkait narasi komputasi kuantum dan sistem keuangan Swiss.' },
    'enc-hormuz-tanker': { title: 'Tanker Terantai & Pipa Patah (Sampul 2027)', city: 'Selat Hormuz', infraFact: 'Jalur laut vital yang mengangkut sekitar 21% pasokan minyak dan LNG dunia.', narrative: 'Menghubungkan ilustrasi pipa energi patah dan kapal terantai dengan risiko asuransi maritim.' },
    'enc-taipei-chip': { title: 'Simpul Silikon AI & Robot Biner Asia Timur', city: 'Taipei', infraFact: 'Pusat >60% fabrikasi semikonduktor canggih dan kabel fiber lintas Pasifik.', narrative: 'Ikon otak biner dan robot pada sampul 2027 melambangkan akselerasi agen AI otonom.' },
    'enc-cheyenne-dumb': { title: 'Cheyenne Mountain — Komando Q-Web', city: 'Cheyenne / CO', infraFact: 'Fasilitas telemetri antariksa dan komunikasi pertahanan bawah tanah.', narrative: 'Dikelompokkan dalam Q-Web sebagai basis narasi siaran darurat global.' },
    'enc-pinegap-au': { title: 'Pine Gap — Vektor Sinyal Belahan Selatan', city: 'Pine Gap / AU', infraFact: 'Stasiun pelacakan satelit dan telemetri frekuensi radio Indo-Pasifik.', narrative: 'Titik koneksi belahan selatan dalam peta cabang satelit.' },
    'enc-antarctica-ice': { title: 'Antartika — Penanda Anomali Highjump', city: 'McMurdo / Antartika', infraFact: 'Stasiun riset iklim, atmosfer, dan radiasi matahari geofisika utama.', narrative: 'Poros kuadran bawah pada peta Great Awakening dengan label Operation Highjump.' },
  },
  vi: {
    'enc-economist-london': { title: 'Nút Bìa Tạp Chí 2027 (ΠΣV Sốc Thanh Khoản)', city: 'London', infraFact: 'Trung tâm thanh toán bù trừ toàn cầu LCH/ICE giám sát thanh khoản trái phiếu và lãi suất.', narrative: 'Ký hiệu ΠΣV dưới lưới đỏ trên bìa 2027 được giải mã là điểm hội tụ của ISO 20022 và thanh toán số.' },
    'enc-giza-orion': { title: 'Trục Giza — Điểm Tuế Sai Great Awakening', city: 'Giza', infraFact: 'Giao điểm cáp quang biển Biển Đỏ – Địa Trung Hải và trạm trắc địa trọng yếu.', narrative: 'Xuất hiện trên bản đồ Great Awakening như trục chu kỳ 25.900 năm gắn với hằng số Pi.' },
    'enc-cern-geneva': { title: 'CERN Geneva — Nút Tính Toán & Thanh Toán', city: 'Geneva', infraFact: 'Trung tâm tính toán Tier-0 châu Âu và điều phối thanh toán quốc tế BIS Thụy Sĩ.', narrative: 'Nút tầng dưới trên Q-Web gắn với công nghệ lượng tử và kịch bản tái cấu trúc tài chính.' },
    'enc-hormuz-tanker': { title: 'Tàu Dầu Bị Xích & Đường Ống Gãy (Bìa 2027)', city: 'Eo Biển Hormuz', infraFact: 'Huyết mạch hàng hải vận chuyển khoảng 21% nguồn cung dầu mỏ và LNG toàn cầu.', narrative: 'Kết nối hình ảnh đường ống gãy và tàu chở dầu bị xích với rủi ro bảo hiểm hàng hải.' },
    'enc-taipei-chip': { title: 'Nút Chip Bán Dẫn AI & Robot Nhị Phân', city: 'Đài Bắc', infraFact: 'Tập trung hơn 60% sản lượng bán dẫn tiên tiến và cáp quang xuyên Thái Bình Dương.', narrative: 'Biểu tượng bộ não nhị phân và robot lao tới trên bìa 2027 đại diện cho làn sóng tác nhân AI.' },
    'enc-cheyenne-dumb': { title: 'Cheyenne Mountain — Nút Chỉ Huy Q-Web', city: 'Cheyenne / CO', infraFact: 'Trung tâm viễn trắc không gian và liên lạc phòng thủ kiên cố trong lòng núi.', narrative: 'Nằm trong mạng Q-Web gắn với câu chuyện hệ thống phát sóng khẩn cấp.' },
    'enc-pinegap-au': { title: 'Pine Gap — Trạm Tín Hiệu Bán Cầu Nam', city: 'Pine Gap / Úc', infraFact: 'Trạm theo dõi vệ tinh và đo lường vô tuyến khu vực Ấn Độ Dương – Thái Bình Dương.', narrative: 'Nút liên kết vệ tinh tại bán cầu nam trên bản đồ phân nhánh.' },
    'enc-antarctica-ice': { title: 'Nam Cực — Điểm Dị Thường Highjump', city: 'McMurdo / Nam Cực', infraFact: 'Trạm nghiên cứu khí hậu, khí quyển và bức xạ mặt trời địa vật lý hàng đầu.', narrative: 'Trục trung tâm phần dưới bản đồ Great Awakening mang nhãn Operation Highjump.' },
  },
};

export const SEED_EVENTS_I18N: LocaleTextMap<
  Record<
    string,
    {
      title: string;
      summary: string;
      technicalDetails: string;
      city: string;
      sourceName: string;
      spofNode: string;
      redTeamCounter: string;
      filmTitle: string;
      filmLocation: string;
      filmProtagonists: string;
      filmReality: string;
      filmConflict: string;
      filmDialogue: string;
      achNotes: Record<HypothesisId, string>;
    }
  >
> = {
  ar: {},
  en: {
    'ev-01': {
      title: 'Transatlantic BGP Routing Anomaly at Frankfurt IX',
      summary: 'Independent Internet monitors detected the withdrawal of 1,420 BGP routing prefixes through a Tier-1 carrier in Frankfurt, spiking cloud IAM verification latency.',
      technicalDetails: 'AS3356 rerouted onto congested backup peers; latency jumped from 22ms to 340ms in 90s.',
      city: 'Frankfurt',
      sourceName: 'RIPE RIS / BGPStream Raw Telemetry',
      spofNode: 'Core-IAM-EU Cloud Auth Node',
      redTeamCounter: 'Red Team check: Route churn may reflect automated BGP Flap Damping safety protection rather than hardware collapse.',
      filmTitle: 'Silent Spark in the Routing Layer',
      filmLocation: 'European NOC — Frankfurt (50.11°N, 8.68°E)',
      filmProtagonists: 'Layla Al-Mansour (Principal SRE), Tariq Haddad (OSINT Analyst)',
      filmReality: 'Silent BGP prefix withdrawals elevate identity latency past automated banking timeout thresholds.',
      filmConflict: 'Public media notices nothing yet, yet Layla discovers three clearing systems share one IAM provider.',
      filmDialogue: '"The bug didn’t crash the net, it added 300 milliseconds to handshake auth—and that’s enough to cascade clearing rejections."',
      achNotes: {
        human_error: 'Timing coincides with a scheduled carrier policy maintenance window.',
        infra_failure: 'Zero subsea cable cut or router hardware failure reports logged.',
        cyber_attack: 'No forged RPKI origins observed, lowering hijack probability.',
        disinfo_cascade: 'Raw BGP logs prove technical fault predated all social media chatter.',
      },
    },
    'ev-02': {
      title: 'Unified IAM Gateway Stalls Across Three Major Banks',
      summary: 'Real-time transfer apps and airport boarding kiosks stalled across two hubs due to shared reliance on the same upstream cloud identity verifier.',
      technicalDetails: '64% mTLS Handshake Timeout spike; exposed cross-sector SPOF linking aviation & banking.',
      city: 'Zurich',
      sourceName: 'Preliminary Post-Incident Logs + EUROCONTROL',
      spofNode: 'Core-IAM-EU Cloud Auth Node',
      redTeamCounter: 'Red Team check: Could external actors flood retry tokens during the maintenance window to prolong saturation?',
      filmTitle: 'The Shared Single Point of Failure',
      filmLocation: 'Clearing Ops Room — Zurich (47.38°N, 8.54°E)',
      filmProtagonists: 'Tariq Haddad, Dr. Samir Al-Ali (Chief Liquidity Risk Officer)',
      filmReality: 'Airline check-in stalls simultaneously with bank wire holds, proving hidden vendor concentration.',
      filmConflict: 'Press frames it as an all-out cyberwar while forensic telemetry rules out malware.',
      filmDialogue: '"Three Tier-1 banks and two airlines sitting on one TLS certificate dependency... we didn’t build resilience, we built glass."',
      achNotes: {
        human_error: 'Audit flags conflicting Token TTL expiration rules pushed upstream.',
        infra_failure: 'Retry queue backlogs saturated intermediate proxy memory.',
        cyber_attack: 'Endpoint forensics confirm zero malware or unauthorized intrusion.',
        disinfo_cascade: 'Physical airline and payment stalls are independently verified.',
      },
    },
    'ev-03': {
      title: 'Disinformation Swarm Intersects Monetary Reset Symbol (ΠΣV)',
      summary: 'Coordinated posts blending phishing links with QAnon-map narratives around "liquidity reset & ΠΣV" exploited temporary banking app timeouts.',
      technicalDetails: '14,800 synchronized social accounts linked outages to apocalypse scripts; B2 behavioral noise telemetry.',
      city: 'New York',
      sourceName: 'Social Engineering & Narrative Graph Telemetry',
      spofNode: 'Algorithmic Social Amplification Stack',
      redTeamCounter: 'Red Team check: A share of viral engagement reflects genuine consumer anxiety over delayed payroll transfers.',
      filmTitle: 'When Semiotic Maps Meet Panic',
      filmLocation: 'Information Analysis Lab — New York (40.71°N, 74.01°W)',
      filmProtagonists: 'Nadia Al-Sharif (Semiotic Analyst), Tariq Haddad',
      filmReality: 'Exploiting pre-existing currency anxiety to blow a 45-minute cloud glitch into a systemic bank-run rumor.',
      filmConflict: 'Nadia warns executives that sentiment algorithms react to rumors 12x faster than official press releases.',
      filmDialogue: '"Look at keyword velocity: panic spreads 12 times faster than our signed post-mortem statement."',
      achNotes: {
        human_error: 'Technical delay created the vacuum exploited by rumor bots.',
        infra_failure: 'App slowness lent superficial plausibility to the rumor.',
        cyber_attack: 'Phishing links embedded in panic threads harvest credentials.',
        disinfo_cascade: 'Coordinated bot amplification directly drives retail sell panic.',
      },
    },
    'ev-04': {
      title: 'HFT Algorithms Trigger Cross-Border Liquidity Sell-Off',
      summary: 'High-frequency trading desks reacted automatically to sentiment headlines and shipping uncertainty, widening yield spreads by 64 bps.',
      technicalDetails: '31% order-book depth contraction in 11 min; Circuit Breakers tripped on two venues.',
      city: 'London',
      sourceName: 'Exchange Order Books & Liquidity Telemetry',
      spofNode: 'Clearing Houses & HFT Execution Venues',
      redTeamCounter: 'Red Team check: Spreads remained within capital absorbency tolerances without actual sovereign default.',
      filmTitle: 'Algorithmic Contagion',
      filmLocation: 'Clearing Floor — London (51.51°N, 0.13°W)',
      filmProtagonists: 'Dr. Samir Al-Ali, Layla Al-Mansour',
      filmReality: 'A cloud auth delay + social swarm turns into real FX & bond liquidity drainage via headline scrapers.',
      filmConflict: 'Regulators weigh emergency corridor firewalls versus publishing raw forensic packet proofs immediately.',
      filmDialogue: '"Algorithms don’t read forensic context—they liquidate whenever headline fear crosses sigma 3. Publish the signed BGP trace now!"',
      achNotes: {
        human_error: 'Root spark began at Node 1, though sell-off propagation is automated.',
        infra_failure: 'Delayed price feeds across regional relayers widened arbitrage dispersion.',
        cyber_attack: 'Order flow matches institutional hedging models, not spoofed exchange hacks.',
        disinfo_cascade: 'NLP sentiment scrapers ingested the panic spike and triggered liquidation.',
      },
    },
    'ev-05': {
      title: 'Precautionary Air-Gapping at Maritime Energy Gateways',
      summary: 'Port operators isolated SCADA and customs routing gateways from external transit as a firewall measure, slowing container & LNG clearance.',
      technicalDetails: '4 maritime terminals shifted to Air-Gapped Fallback; digital clearance latency rose +40%.',
      city: 'Suez / Red Sea',
      sourceName: 'Port Authorities & Maritime Monitoring Bulletins',
      spofNode: 'Intercontinental Transit & Maritime SCADA Gateways',
      redTeamCounter: 'Red Team check: Temporary air-gapping demonstrates defensive maturity and can reconnect once IAM stabilizes.',
      filmTitle: 'Locked Digital Borders',
      filmLocation: 'Maritime & Energy Corridor — Suez (29.97°N, 32.55°E)',
      filmProtagonists: 'Layla Al-Mansour, Regional Energy Security Coordinator',
      filmReality: 'Protective isolation spares power turbines while inadvertently reinforcing the Digital Fragmentation scenario.',
      filmConflict: 'Energy safety is preserved, but container queues reveal the hidden cost of sovereign network decoupling.',
      filmDialogue: '"We raised the drawbridges to shield our turbines—and accidentally drew the first hard digital borders in thirty years."',
      achNotes: {
        human_error: 'Deliberate defensive SOP response to upstream IAM latency.',
        infra_failure: 'Physical turbines and port cranes remain 100% undamaged.',
        cyber_attack: 'Precautionary isolation only; zero SCADA compromises detected.',
        disinfo_cascade: 'Offline gateways fueled false maritime blockade rumors.',
      },
    },
    'ev-06': {
      title: 'Open Forensic Publication & Multi-Cloud Failover Activation',
      summary: 'Signed forensic logs confirmed the BGP policy clash, enabling emergency multi-cloud failover across banks and restoring 92% of clearing rails.',
      technicalDetails: 'Latency stabilized at 26ms; 92% payment rails restored and disinfo velocity halved.',
      city: 'Geneva',
      sourceName: 'Joint Engineering Statement & Peer Audit',
      spofNode: 'Core-IAM-EU Cloud Auth Node',
      redTeamCounter: 'Red Team check: Will institutions honor expensive multi-cloud mandates six months after volatility subsides?',
      filmTitle: 'Separating Signal from Noise',
      filmLocation: 'Global Digital Stability Session — Geneva (46.20°N, 6.14°E)',
      filmProtagonists: 'Layla Al-Mansour, Dr. Samir Al-Ali, Nadia Al-Sharif, Tariq Haddad',
      filmReality: 'ACH falsification and radical telemetry transparency restore confidence and tilt probabilities toward Adaptation.',
      filmConflict: 'Crisis averts systemic crash, leaving boardrooms facing one final choice between lasting reform or cyclical fragility.',
      filmDialogue: '"Luck didn’t save us. Stopping speculation and falsifying bad hypotheses with raw data did."',
      achNotes: {
        human_error: 'Full signed audit verified the Token TTL + BGP policy conflict.',
        infra_failure: 'Incident exposed single-vendor concentration though hardware stayed intact.',
        cyber_attack: 'Cryptographic packet logs decisively falsify external intrusion.',
        disinfo_cascade: 'Verified telemetry telemetry halved social panic within 20 minutes.',
      },
    },
  },
  fr: {
    'ev-01': {
      title: 'Anomalie de routage BGP transatlantique à Francfort',
      summary: 'Retrait de 1 420 préfixes BGP sur un opérateur majeur à Francfort, augmentant la latence d’authentification cloud.',
      technicalDetails: 'Reroutage AS3356 via des liens saturés ; latence passée de 22ms à 340ms en 90s.',
      city: 'Francfort',
      sourceName: 'Télémétrie brute RIPE RIS / BGPStream',
      spofNode: 'Nœud d’authentification Core-IAM-EU',
      redTeamCounter: 'Revue Red Team : l’oscillation BGP peut refléter un amortissement automatique (Flap Damping).',
      filmTitle: 'L’Étincelle silencieuse du routage',
      filmLocation: 'NOC Européen — Francfort (50.11°N, 8.68°E)',
      filmProtagonists: 'Layla Al-Mansour, Tariq Haddad',
      filmReality: 'Le retrait silencieux de routes dépasse les délais critiques de vérification bancaire.',
      filmConflict: 'Les médias ignorent tout encore, mais trois chambres de compensation partagent le même fournisseur IAM.',
      filmDialogue: '« Le bug n’a pas coupé Internet, il a ajouté 300 millisecondes — de quoi déclencher les rejets bancaires. »',
      achNotes: {
        human_error: 'Coïncide avec une fenêtre de maintenance routage planifiée.',
        infra_failure: 'Aucune coupure physique de câble sous-marin enregistrée.',
        cyber_attack: 'Aucun certificat RPKI falsifié détecté.',
        disinfo_cascade: 'Les journaux BGP précèdent toute activité sur les réseaux sociaux.',
      },
    },
    'ev-02': {
      title: 'Panne des passerelles IAM de trois grandes banques',
      summary: 'Blocage des virements instantanés et de l’enregistrement aérien en raison d’une dépendance cloud commune.',
      technicalDetails: '64 % de délais expirés mTLS ; découverte d’un point de défaillance unique inter-sectoriel.',
      city: 'Zurich',
      sourceName: 'Rapports initiaux post-incident + EUROCONTROL',
      spofNode: 'Nœud d’authentification Core-IAM-EU',
      redTeamCounter: 'Revue Red Team : des requêtes répétitives ont-elles saturé le serveur proxy durant la panne ?',
      filmTitle: 'Point de défaillance partagé',
      filmLocation: 'Salle de compensation — Zurich (47.38°N, 8.54°E)',
      filmProtagonists: 'Tariq Haddad, Dr. Samir Al-Ali',
      filmReality: 'Banques et compagnies aériennes s’arrêtent simultanément sur la même couche d’identité.',
      filmConflict: 'Les médias parlent de cyberattaque globale tandis que l’audit écarte tout logiciel malveillant.',
      filmDialogue: '« Trois banques et deux transporteurs dépendent d’un seul certificat numérique. »',
      achNotes: {
        human_error: 'Conflit identifié dans la durée de vie des jetons TTL.',
        infra_failure: 'Saturation mémoire des serveurs intermédiaires.',
        cyber_attack: 'L’analyse forensique exclut toute intrusion externe.',
        disinfo_cascade: 'L’arrêt des vols et paiements est physiquement documenté.',
      },
    },
    'ev-03': {
      title: 'Essaim narratif croisant le symbole monétaire ΠΣV',
      summary: 'Diffusion virale de liens d’hameçonnage et récits de réinitialisation QAnon exploitant les lenteurs bancaires.',
      technicalDetails: '14 800 comptes coordonnés reliant la panne aux récits ΠΣV ; télémétrie B2.',
      city: 'New York',
      sourceName: 'Unité de surveillance des graphes narratifs',
      spofNode: 'Plateforme d’amplification algorithmique',
      redTeamCounter: 'Revue Red Team : une part du trafic exprime une inquiétude réelle de clients sur leurs virements.',
      filmTitle: 'Croisement sémiotique et panique',
      filmLocation: 'Laboratoire d’analyse — New York (40.71°N, 74.01°W)',
      filmProtagonists: 'Nadia Al-Sharif, Tariq Haddad',
      filmReality: 'Amplification d’un incident cloud de 45 minutes en rumeur d’effondrement bancaire.',
      filmConflict: 'Les algorithmes de sentiment réagissent 12 fois plus vite que les communiqués officiels.',
      filmDialogue: '« La rumeur circule douze fois plus vite que notre rapport technique signé. »',
      achNotes: {
        human_error: 'Le retard applicatif a créé le vide informationnel.',
        infra_failure: 'La lenteur apparente crédibilise la rumeur.',
        cyber_attack: 'Campagne de phishing ciblant les identifiants.',
        disinfo_cascade: 'L’amplification coordonnée provoque la panique.',
      },
    },
    'ev-04': {
      title: 'Ordres de vente HFT et tension sur les liquidités',
      summary: 'Les fonds algorithmiques liquident face aux gros titres anxiogènes, élargissant les écarts de 64 bps.',
      technicalDetails: 'Baisse de 31 % de la profondeur du carnet d’ordres en 11 minutes ; coupe-circuits activés.',
      city: 'Londres',
      sourceName: 'Carnets de bourse & indicateurs de liquidité',
      spofNode: 'Chambres de compensation & plateformes HFT',
      redTeamCounter: 'Revue Red Team : les écarts restent absorbables sans défaut de crédit souverain.',
      filmTitle: 'Contagion algorithmique',
      filmLocation: 'Salle des marchés — Londres (51.51°N, 0.13°W)',
      filmProtagonists: 'Dr. Samir Al-Ali, Layla Al-Mansour',
      filmReality: 'Un incident technique et une rumeur virale se transforment en sortie de liquidités.',
      filmConflict: 'Couper les flux transfrontaliers ou publier immédiatement les journaux BGP bruts.',
      filmDialogue: '« Les machines vendent sur les gros titres — publiez la preuve BGP signée tout de suite ! »',
      achNotes: {
        human_error: 'L’origine est au nœud 1 mais la propagation boursière est automatique.',
        infra_failure: 'Retard des flux de prix entre places.',
        cyber_attack: 'Ordres conformes aux modèles de couverture bancaires.',
        disinfo_cascade: 'Les lecteurs de sentiment NLP déclenchent les ventes.',
      },
    },
    'ev-05': {
      title: 'Isolation préventive des passerelles portuaires et énergie',
      summary: 'Mise hors-ligne préventive des réseaux SCADA portuaires par mesure défensive, ralentissant la logistique.',
      technicalDetails: '4 terminaux basculés en mode isolé (Air-Gap) ; +40 % de délai de dédouanement.',
      city: 'Suez / Mer Rouge',
      sourceName: 'Autorités portuaires & bulletins maritimes',
      spofNode: 'Passerelles SCADA maritimes et corridors',
      redTeamCounter: 'Revue Red Team : l’isolation temporaire reflète une maturité défensive réversible.',
      filmTitle: 'Frontières numériques verrouillées',
      filmLocation: 'Corridor maritime — Suez (29.97°N, 32.55°E)',
      filmProtagonists: 'Layla Al-Mansour, Coordinateur Énergie',
      filmReality: 'La protection SCADA pousse mécaniquement le système vers la fragmentation numérique.',
      filmConflict: 'L’énergie est protégée au prix d’un engorgement portuaire immédiat.',
      filmDialogue: '« Nous avons fermé les vannes pour protéger les turbines, traçant de nouvelles frontières numériques. »',
      achNotes: {
        human_error: 'Décision préventive face à la panne IAM.',
        infra_failure: 'Les installations portuaires physiques sont intactes.',
        cyber_attack: 'Aucune infection SCADA détectée.',
        disinfo_cascade: 'L’isolation nourrit les rumeurs de blocus.',
      },
    },
    'ev-06': {
      title: 'Publication forensique ouverte & basculement multi-cloud',
      summary: 'La transparence des journaux signés et l’activation multi-cloud rétablissent 92 % des passerelles de paiement.',
      technicalDetails: 'Latence revenue à 26ms ; rétablissement de 92 % des paiements et recul des rumeurs.',
      city: 'Genève',
      sourceName: 'Communiqué d’ingénierie conjoint & audit',
      spofNode: 'Nœud d’authentification Core-IAM-EU',
      redTeamCounter: 'Revue Red Team : les institutions maintiendront-elles le coût du multi-cloud après l’accalmie ?',
      filmTitle: 'Séparer le signal du bruit',
      filmLocation: 'Session stabilité numérique — Genève (46.20°N, 6.14°E)',
      filmProtagonists: 'Layla, Dr. Samir, Nadia, Tariq',
      filmReality: 'La méthode ACH et les preuves ouvertes orientent la trajectoire vers l’adaptation.',
      filmConflict: 'La crise s’achève sans krach, posant le choix de la réforme durable.',
      filmDialogue: '« La chance ne nous a pas sauvés ; la réfutation scientifique des fausses pistes, oui. »',
      achNotes: {
        human_error: 'Conflit TTL et routage confirmé par l’audit.',
        infra_failure: 'Dépendance unique corrigée sans dommage matériel.',
        cyber_attack: 'Signatures cryptographiques innocentent l’intrusion.',
        disinfo_cascade: 'La transparence dissipe la panique en 20 minutes.',
      },
    },
  },
  id: {
    'ev-01': {
      title: 'Anomali Routing BGP Lintas Atlantik di Frankfurt IX',
      summary: 'Monitor internet mendeteksi penarikan 1.420 prefiks BGP via penyedia transit Frankfurt, melonjakkan latensi autentikasi cloud.',
      technicalDetails: 'Rute AS3356 beralih ke jalur padat; latensi naik dari 22ms ke 340ms dalam 90 detik.',
      city: 'Frankfurt',
      sourceName: 'Telemetri Mentah RIPE RIS / BGPStream',
      spofNode: 'Node Autentikasi Cloud Core-IAM-EU',
      redTeamCounter: 'Tinjauan Red Team: Fluktuasi rute bisa merupakan mekanisme perlindungan BGP Flap Damping otomatis.',
      filmTitle: 'Percikan Senyap di Lapisan Routing',
      filmLocation: 'Pusat Operasi Jaringan — Frankfurt (50.11°N, 8.68°E)',
      filmProtagonists: 'Layla Al-Mansour, Tariq Haddad',
      filmReality: 'Penarikan prefiks BGP mendorong waktu otorisasi melebihi batas tunggu perbankan.',
      filmConflict: 'Media belum mengetahui apa pun, namun tiga sistem kliring bergantung pada satu penyedia IAM.',
      filmDialogue: '"Bug ini tidak menjatuhkan internet, hanya menambah 300ms — cukup untuk memicu penolakan transaksi otomatis."',
      achNotes: {
        human_error: 'Waktu cocok dengan jendela pemeliharaan rutin.',
        infra_failure: 'Tidak ada laporan kabel laut putus atau kerusakan fisik.',
        cyber_attack: 'Tidak ada sertifikat RPKI palsu yang terdeteksi.',
        disinfo_cascade: 'Log BGP mentah mendahului semua keramaian media sosial.',
      },
    },
    'ev-02': {
      title: 'Gangguan Gerbang Autentikasi Terpadu Tiga Bank Besar',
      summary: 'Aplikasi transfer instan dan sistem naik pesawat terhenti bersamaan karena ketergantungan pada satu penyedia cloud.',
      technicalDetails: '64% kegagalan mTLS Handshake; terungkap titik kegagalan tunggal lintas sektor keuangan & aviasi.',
      city: 'Zurich',
      sourceName: 'Log Awal Pasca-Insiden + EUROCONTROL',
      spofNode: 'Node Autentikasi Cloud Core-IAM-EU',
      redTeamCounter: 'Tinjauan Red Team: Apakah lonjakan percobaan ulang ikut membebani server perantara saat gangguan?',
      filmTitle: 'Menemukan Titik Kegagalan Bersama',
      filmLocation: 'Ruang Kliring — Zurich (47.38°N, 8.54°E)',
      filmProtagonists: 'Tariq Haddad, Dr. Samir Al-Ali',
      filmReality: 'Bandara dan perbankan berhenti serentak pada ketergantungan cloud yang sama.',
      filmConflict: 'Media menyebut serangan siber total, sementara forensik tidak menemukan malware.',
      filmDialogue: '"Tiga bank besar dan dua maskapai berdiri di atas satu sertifikat digital yang sama."',
      achNotes: {
        human_error: 'Audit menemukan konflik aturan kedaluwarsa Token TTL.',
        infra_failure: 'Antrean tunggu menghabiskan memori server proxy.',
        cyber_attack: 'Pemeriksaan forensik memastikan nihil malware.',
        disinfo_cascade: 'Gangguan bandara dan pembayaran tercatat nyata secara resmi.',
      },
    },
    'ev-03': {
      title: 'Gerombolan Disinformasi Bersinggungan dengan Simbol ΠΣV',
      summary: 'Unggahan terkoordinasi berisi tautan phishing dan narasi peta QAnon tentang reset likuiditas ΠΣV memanfaatkan lambatnya aplikasi bank.',
      technicalDetails: '14.800 akun tersinkronisasi menghubungkan gangguan ke narasi keruntuhan; kelas B2.',
      city: 'New York',
      sourceName: 'Unit Pemantauan Rekayasa Sosial & Peta Narasi',
      spofNode: 'Tumpukan Amplifikasi Algoritmik Sosial',
      redTeamCounter: 'Tinjauan Red Team: Sebagian percakapan viral merupakan kekhawatiran wajar nasabah atas keterlambatan gaji.',
      filmTitle: 'Persimpangan Peta Simbolik dan Kepanikan',
      filmLocation: 'Lab Analisis Informasi — New York (40.71°N, 74.01°W)',
      filmProtagonists: 'Nadia Al-Sharif, Tariq Haddad',
      filmReality: 'Gangguan teknis 45 menit diperbesar menjadi rumor penarikan dana massal.',
      filmConflict: 'Algoritma sentimen bereaksi 12× lebih cepat dari siaran klarifikasi resmi.',
      filmDialogue: '"Rumor bergerak 12 kali lebih cepat dibanding pernyataan forensik resmi kita."',
      achNotes: {
        human_error: 'Keterlambatan aplikasi membuka celah rumor.',
        infra_failure: 'Kelambatan antarmuka memberi kesan seolah rumor benar.',
        cyber_attack: 'Kampanye phishing mencuri kredensial nasabah.',
        disinfo_cascade: 'Amplifikasi bot memicu kepanikan ritel langsung.',
      },
    },
    'ev-04': {
      title: 'Penjualan Algoritmik HFT & Penyempitan Likuiditas Lintas Batas',
      summary: 'Dana HFT bereaksi otomatis terhadap berita bank dan volatilitas pelabuhan, memperlebar selisih imbal hasil hingga 64 bps.',
      technicalDetails: 'Kedalaman buku pesanan turun 31% dalam 11 menit; pemutus sirkuit pasar aktif.',
      city: 'London',
      sourceName: 'Rekaman Bursa & Indikator Likuiditas Agregat',
      spofNode: 'Lembaga Kliring & Mesin Eksekusi HFT',
      redTeamCounter: 'Tinjauan Red Team: Pelebaran spread masih dalam batas serapan tanpa gagal bayar aktual.',
      filmTitle: 'Penularan Algoritmik',
      filmLocation: 'Lantai Perdagangan — London (51.51°N, 0.13°W)',
      filmProtagonists: 'Dr. Samir Al-Ali, Layla Al-Mansour',
      filmReality: 'Gangguan otorisasi plus disinformasi berubah menjadi arus keluar likuiditas nyata.',
      filmConflict: 'Memutus koneksi internasional atau segera membuka log BGP terverifikasi ke publik.',
      filmDialogue: '"Mesin menjual saat indeks ketakutan berita melewati ambang batas — publikasikan log BGP bertanda tangan sekarang!"',
      achNotes: {
        human_error: 'Akar masalah di Node 1 namun eskalasi pasar berjalan otomatis.',
        infra_failure: 'Keterlambatan data harga memperbesar selisih antar bursa.',
        cyber_attack: 'Pola order sesuai model lindung nilai standar bank.',
        disinfo_cascade: 'Algoritma pembaca sentimen memicu aksi jual otomatis.',
      },
    },
    'ev-05': {
      title: 'Isolasi Preventif Gateway Data Pelabuhan & Koridor Energi',
      summary: 'Operator memisahkan jaringan SCADA pelabuhan dan energi dari internet publik untuk mencegah penularan, memperlambat kliring kargo.',
      technicalDetails: '4 fasilitas beralih ke Air-Gapped Fallback; waktu kliring digital naik 40%.',
      city: 'Suez / Laut Merah',
      sourceName: 'Otoritas Pelabuhan & Buletin Maritim',
      spofNode: 'Gateway Transit Benua & SCADA Pelabuhan',
      redTeamCounter: 'Tinjauan Red Team: Isolasi sementara mencerminkan kehati-hatian defensif yang dapat dipulihkan cepat.',
      filmTitle: 'Dinding Digital Terkunci',
      filmLocation: 'Koridor Maritim & Energi — Suez (29.97°N, 32.55°E)',
      filmProtagonists: 'Layla Al-Mansour, Koordinator Keamanan Energi',
      filmReality: 'Keamanan turbin terjaga namun mendorong sistem global menuju Fragmentasi Digital.',
      filmConflict: 'Infrastruktur energi aman dengan biaya penundaan logistik kapal.',
      filmDialogue: '"Kami menutup gerbang demi turbin, tapi justru menggambar perbatasan digital pertama dalam 30 tahun."',
      achNotes: {
        human_error: 'Langkah pencegahan operasional yang disengaja.',
        infra_failure: 'Struktur fisik pelabuhan dan pembangkit utuh 100%.',
        cyber_attack: 'Tidak ada infeksi pada jaringan SCADA.',
        disinfo_cascade: 'Isolasi memicu rumor blokade maritim di media sosial.',
      },
    },
    'ev-06': {
      title: 'Publikasi Laporan Forensik Terbuka & Failover Multi-Cloud',
      summary: 'Rilis log forensik bertanda tangan membuktikan konflik kebijakan BGP dan mengaktifkan failover multi-cloud pada 92% gerbang pembayaran.',
      technicalDetails: 'Latensi kembali ke 26ms; 92% rel pembayaran pulih dan tekanan disinformasi turun separuhnya.',
      city: 'Jenewa',
      sourceName: 'Pernyataan Rekayasa Bersama & Tinjauan Sejawat',
      spofNode: 'Node Autentikasi Cloud Core-IAM-EU',
      redTeamCounter: 'Tinjauan Red Team: Akankah institusi mempertahankan biaya multi-cloud setelah pasar tenang?',
      filmTitle: 'Memisahkan Sinyal dari Kebisingan',
      filmLocation: 'Sidang Stabilitas Digital Global — Jenewa (46.20°N, 6.14°E)',
      filmProtagonists: 'Layla, Dr. Samir, Nadia, Tariq',
      filmReality: 'Transparansi log dan falsifikasi ACH memulihkan kepercayaan pasar ke jalur Adaptasi Struktural.',
      filmConflict: 'Krisis teratasi tanpa kolaps total, menyisakan keputusan antara reformasi wajib atau kerapuhan berulang.',
      filmDialogue: '"Bukan keberuntungan yang menyelamatkan kita — melainkan keberanian membuktikan hipotesis keliru dengan data mentah."',
      achNotes: {
        human_error: 'Audit penuh memastikan konflik Token TTL dan kebijakan BGP.',
        infra_failure: 'Menunjukkan ketergantungan penyedia tunggal tanpa kerusakan fisik.',
        cyber_attack: 'Verifikasi kriptografis log membantah serangan eksternal.',
        disinfo_cascade: 'Transparansi forensik meredam kepanikan digital dalam 20 menit.',
      },
    },
  },
  vi: {
    'ev-01': {
      title: 'Bất Thường Định Tuyến BGP Xuyên Đại Tây Dương Tại Frankfurt',
      summary: 'Hệ thống giám sát độc lập ghi nhận việc rút 1.420 tiền tố định tuyến BGP tại Frankfurt, làm tăng vọt độ trễ xác thực đám mây.',
      technicalDetails: 'Lưu lượng AS3356 chuyển hướng gây nghẽn; độ trễ tăng từ 22ms lên 340ms trong 90 giây.',
      city: 'Frankfurt',
      sourceName: 'Dữ Liệu Thô RIPE RIS / BGPStream',
      spofNode: 'Nút Xác Thực Đám Mây Core-IAM-EU',
      redTeamCounter: 'Đánh giá Red Team: Dao động tuyến có thể do cơ chế tự bảo vệ BGP Flap Damping.',
      filmTitle: 'Tia Lửa Thầm Lặng Ở Tầng Định Tuyến',
      filmLocation: 'Trung Tâm Vận Hành Mạng — Frankfurt (50.11°N, 8.68°E)',
      filmProtagonists: 'Layla Al-Mansour, Tariq Haddad',
      filmReality: 'Thu hồi tuyến âm thầm đẩy thời gian xác thực danh tính vượt ngưỡng chờ của ngân hàng.',
      filmConflict: 'Truyền thông chưa hay biết, nhưng ba hệ thống thanh toán cùng phụ thuộc một nhà cung cấp IAM.',
      filmDialogue: '"Lỗi không đánh sập Internet, nó chỉ thêm 300 mili-giây — vừa đủ để kích hoạt từ chối giao dịch tự động."',
      achNotes: {
        human_error: 'Trùng khung bảo trì định tuyến đã lên lịch.',
        infra_failure: 'Không có báo cáo đứt cáp biển hay lỗi phần cứng.',
        cyber_attack: 'Không phát hiện chứng chỉ RPKI giả mạo.',
        disinfo_cascade: 'Nhật ký BGP xuất hiện trước mọi thảo luận mạng xã hội.',
      },
    },
    'ev-02': {
      title: 'Cổng Xác Thực Chung Của Ba Ngân Hàng Lớn Bị Gián Đoạn',
      summary: 'Ứng dụng chuyển tiền tức thời và quầy thủ tục sân bay bị chậm đồng loạt do dùng chung dịch vụ xác thực đám mây.',
      technicalDetails: '64% lỗi mTLS Handshake Timeout; phát lộ điểm lỗi đơn liên ngành tài chính – hàng không.',
      city: 'Zurich',
      sourceName: 'Nhật Ký Sự Cố Ban Đầu + EUROCONTROL',
      spofNode: 'Nút Xác Thực Đám Mây Core-IAM-EU',
      redTeamCounter: 'Đánh giá Red Team: Liệu lượng yêu cầu thử lại tự động có làm nghẽn máy chủ trung gian?',
      filmTitle: 'Phát Hiện Điểm Lỗi Đơn Chung',
      filmLocation: 'Phòng Thanh Toán — Zurich (47.38°N, 8.54°E)',
      filmProtagonists: 'Tariq Haddad, TS. Samir Al-Ali',
      filmReality: 'Hàng không và ngân hàng cùng khựng lại trên một nhà cung cấp định danh đám mây.',
      filmConflict: 'Báo chí nghi ngờ tấn công mạng toàn diện trong khi pháp y số bác bỏ mã độc.',
      filmDialogue: '"Ba ngân hàng lớn và hai hãng bay cùng đứng trên một phụ thuộc chứng chỉ số."',
      achNotes: {
        human_error: 'Kiểm toán phát hiện xung đột thời hạn Token TTL.',
        infra_failure: 'Hàng đợi tích tụ làm cạn tài nguyên máy chủ trung gian.',
        cyber_attack: 'Không ghi nhận mã độc hay xâm nhập trái phép.',
        disinfo_cascade: 'Sự cố chuyến bay và thanh toán được xác nhận thực tế.',
      },
    },
    'ev-03': {
      title: 'Bầy Đàn Tin Giả Gắn Sự Cố Với Ký Hiệu Tiền Tệ ΠΣV',
      summary: 'Bài đăng chứa liên kết lừa đảo kết hợp kịch bản QAnon về tái thiết thanh khoản ΠΣV lợi dụng sự chậm trễ ứng dụng ngân hàng.',
      technicalDetails: '14.800 tài khoản đồng bộ gắn sự cố với thuyết sụp đổ; xếp hạng nguồn B2.',
      city: 'New York',
      sourceName: 'Đơn Vị Giám Sát Kỹ Nghệ Xã Hội & Đồ Thị Tin Giả',
      spofNode: 'Hệ Thống Khuếch Đại Thuật Toán Mạng Xã Hội',
      redTeamCounter: 'Đánh giá Red Team: Một phần tương tác bắt nguồn từ lo lắng thật của khách hàng về chậm lương.',
      filmTitle: 'Khi Bản Đồ Biểu Tượng Gặp Cơn Hoảng Loạn',
      filmLocation: 'Phòng Phân Tích Thông Tin — New York (40.71°N, 74.01°W)',
      filmProtagonists: 'Nadia Al-Sharif, Tariq Haddad',
      filmReality: 'Thổi phồng sự cố kỹ thuật 45 phút thành tin đồn rút tiền hàng loạt.',
      filmConflict: 'Thuật toán cảm xúc phản ứng nhanh gấp 12 lần thông cáo chính thức.',
      filmDialogue: '"Tin đồn lan nhanh gấp 12 lần thông cáo xác minh có chữ ký của chúng ta."',
      achNotes: {
        human_error: 'Độ trễ kỹ thuật tạo khoảng trống cho tin đồn.',
        infra_failure: 'Ứng dụng chậm làm tin đồn trông có vẻ thuyết phục.',
        cyber_attack: 'Chiến dịch lừa đảo nhằm đánh cắp thông tin đăng nhập.',
        disinfo_cascade: 'Khuếch đại có tổ chức trực tiếp gây hoảng loạn bán tháo.',
      },
    },
    'ev-04': {
      title: 'Lệnh Bán Thuật Toán HFT Kích Hoạt Suy Giảm Thanh Khoản',
      summary: 'Các quỹ giao dịch tần suất cao tự động bán ra theo tiêu đề tin tức và rủi ro cảng biển, nới rộng chênh lệch lợi suất 64 bps.',
      technicalDetails: 'Thanh khoản sổ lệnh giảm 31% trong 11 phút; kích hoạt ngắt mạch ở hai sàn.',
      city: 'London',
      sourceName: 'Sổ Lệnh Sàn Giao Dịch & Chỉ Số Thanh Khoản',
      spofNode: 'Phòng Thanh Toán Bù Trừ & Sàn HFT',
      redTeamCounter: 'Đánh giá Red Team: Chênh lệch giá vẫn nằm trong vùng hấp thụ vốn, chưa có vỡ nợ tín dụng.',
      filmTitle: 'Sự Lây Lan Thuật Toán',
      filmLocation: 'Sàn Giao Dịch — London (51.51°N, 0.13°W)',
      filmProtagonists: 'TS. Samir Al-Ali, Layla Al-Mansour',
      filmReality: 'Trục trặc xác thực cộng tin giả biến thành dòng rút thanh khoản thật.',
      filmConflict: 'Đóng cổng kết nối quốc tế hay công bố ngay dữ liệu BGP gốc để hãm thuật toán.',
      filmDialogue: '"Cỗ máy bán ngay khi chỉ số sợ hãi vượt ngưỡng — công bố bản ghi BGP đã ký ngay lập tức!"',
      achNotes: {
        human_error: 'Nguồn gốc ở nút 1 nhưng lan truyền tài chính là tự động.',
        infra_failure: 'Chậm trễ dữ liệu giá giữa các sàn gây chênh lệch.',
        cyber_attack: 'Lệnh khớp với mô hình phòng ngừa rủi ro chuẩn ngân hàng.',
        disinfo_cascade: 'Thuật toán phân tích cảm xúc thu thập tin giả và bán tháo.',
      },
    },
    'ev-05': {
      title: 'Cô Lập Phòng Ngừa Cổng Dữ Liệu Cảng Biển & Năng Lượng',
      summary: 'Đơn vị vận hành tạm tách mạng SCADA cảng và năng lượng khỏi định tuyến công cộng để ngừa lây lan, làm chậm thông quan.',
      technicalDetails: '4 cảng chuyển sang chế độ cô lập Air-Gap; thời gian thông quan số tăng 40%.',
      city: 'Suez / Biển Đỏ',
      sourceName: 'Cảng Vụ & Bản Tin Giám Sát Hàng Hải',
      spofNode: 'Cổng SCADA Cảng Biển & Hành Lang Năng Lượng',
      redTeamCounter: 'Đánh giá Red Team: Cô lập tạm thời thể hiện năng lực phòng thủ chủ động.',
      filmTitle: 'Những Bức Tường Số Khép Kín',
      filmLocation: 'Hành Lang Hàng Hải — Suez (29.97°N, 32.55°E)',
      filmProtagonists: 'Layla Al-Mansour, Điều Phối An Ninh Năng Lượng',
      filmReality: 'Bảo vệ tua-bin an toàn nhưng vô tình đẩy thế giới về kịch bản Phân Mảnh Số.',
      filmConflict: 'Hạ tầng năng lượng an toàn nhưng ùn ứ container tăng nhanh.',
      filmDialogue: '"Chúng ta đóng cổng để bảo vệ nhà máy, và vô tình vẽ nên biên giới số cứng đầu tiên sau 30 năm."',
      achNotes: {
        human_error: 'Biện pháp phòng ngừa chủ động trước sự cố IAM.',
        infra_failure: 'Hạ tầng vật lý cảng và nhà máy hoàn toàn nguyên vẹn.',
        cyber_attack: 'Không phát hiện xâm nhập trong mạng SCADA.',
        disinfo_cascade: 'Cô lập làm bùng phát tin đồn phong tỏa hàng hải.',
      },
    },
    'ev-06': {
      title: 'Công Bố Hồ Sơ Pháp Y Mở & Kích Hoạt Dự Phòng Đa Đám Mây',
      summary: 'Báo cáo pháp y xác nhận xung đột chính sách BGP, đồng thời kích hoạt giao thức đa đám mây khôi phục 92% cổng thanh toán.',
      technicalDetails: 'Độ trễ trở lại 26ms; 92% cổng thanh toán phục hồi và tin giả giảm một nửa.',
      city: 'Geneva',
      sourceName: 'Tuyên Bố Kỹ Thuật Chung & Đánh Giá Độc Lập',
      spofNode: 'Nút Xác Thực Đám Mây Core-IAM-EU',
      redTeamCounter: 'Đánh giá Red Team: Các tổ chức có duy trì chi phí đa đám mây khi thị trường đã ổn định?',
      filmTitle: 'Tách Tín Hiệu Khỏi Nhiễu Sóng',
      filmLocation: 'Phiên Điều Phối Ổn Định Số — Geneva (46.20°N, 6.14°E)',
      filmProtagonists: 'Layla, TS. Samir, Nadia, Tariq',
      filmReality: 'Kiểm chứng ACH và minh bạch nhật ký khôi phục niềm tin theo hướng Thích Ứng Cấu Trúc.',
      filmConflict: 'Khủng hoảng qua đi không sụp đổ, đặt ra lựa chọn giữa cải cách bắt buộc hay lặp lại mong manh.',
      filmDialogue: '"May mắn không cứu chúng ta — việc dừng suy đoán và bác bỏ giả thuyết sai bằng dữ liệu thô mới cứu chúng ta."',
      achNotes: {
        human_error: 'Hồ sơ ký số xác nhận xung đột TTL và BGP.',
        infra_failure: 'Phơi bày phụ thuộc đơn nhà cung cấp nhưng phần cứng nguyên vẹn.',
        cyber_attack: 'Xác thực mật mã loại bỏ khả năng tấn công bên ngoài.',
        disinfo_cascade: 'Minh bạch pháp y dập tắt hoảng loạn trong 20 phút.',
      },
    },
  },
};

export const FORECAST_I18N: LocaleTextMap<
  Record<'fc-fragm' | 'fc-fragi' | 'fc-adapt', { title: string; city: string; mapLink: string; trigger: string }>
> = {
  ar: {
    'fc-fragm': { title: 'تجزئة بوابات العبور القارية وعزل تسويات الطاقة والموانئ', city: 'سنغافورة (ممر ملقا)', mapLink: 'تقاطع رمز أنبوب الطاقة وسفينة الشحن (المجلة 2027) مع عقدة العزل الإقليمي.', trigger: 'استمرار تأخر التخليص البحري فوق 45% أو فرض قيود توجيه سيادية.' },
    'fc-fragi': { title: 'موجة تذبذب خوارزمي ثانوية تقودها شائعات إعادة التسعير (ΠΣV)', city: 'طوكيو', mapLink: 'اقتران الدائرة الحمراء حول رمز ΠΣV (المجلة) بشبكة تشعب السرديات النقدية (خريطة QAnon).', trigger: 'تجاوز معامل التضليل وارتفاع أوامر التحوط الآلي.' },
    'fc-adapt': { title: 'فرض بروتوكول التبديل متعدد السحب وكشف السجلات الجنائية المفتوحة', city: 'جنيف', mapLink: 'تفكيك عقدة التضخيم عبر الشفافية الجنائية وتحويل رمز السينما إلى توثيق مؤسسي.', trigger: 'نشر تقارير A1 موقعة تشفيرياً وخفض زمن الاستجابة دون 40ms.' },
  },
  en: {
    'fc-fragm': { title: 'Continental Gateway Splitting & Port-Energy Settlement Isolation', city: 'Singapore (Malacca)', mapLink: 'Intersection of Economist 2027 broken pipeline & chained tanker symbolism with regional air-gapping.', trigger: 'Maritime clearance delays exceeding 45% or sovereign BGP routing restrictions.' },
    'fc-fragi': { title: 'Secondary HFT Volatility Wave Driven by ΠΣV Repricing Rumors', city: 'Tokyo', mapLink: 'Coupling of the red-circled ΠΣV cover symbol with QAnon financial reset branching nodes.', trigger: 'Social disinformation index crossing high threshold and automated hedging triggers.' },
    'fc-adapt': { title: 'Mandatory Multi-Cloud Failover & Open Signed Forensic Logs', city: 'Geneva', mapLink: 'Neutralizing panic amplification via signed telemetry transparency and institutional audits.', trigger: 'Publication of A1 cryptographically signed telemetry and latency dropping below 40ms.' },
  },
  fr: {
    'fc-fragm': { title: 'Fragmentation des passerelles continentales & isolation énergétique', city: 'Singapour (Malacca)', mapLink: 'Convergence du pipeline brisé et pétrolier enchaîné (2027) avec les coupures régionales.', trigger: 'Retards portuaires > 45 % ou restrictions souveraines de routage BGP.' },
    'fc-fragi': { title: 'Onde de volatilité HFT alimentée par les rumeurs ΠΣV', city: 'Tokyo', mapLink: 'Couplage du sigle ΠΣV cerclé de rouge avec le réseau narratif QAnon.', trigger: 'Franchissement du seuil de désinformation et déclenchement des couvertures auto.' },
    'fc-adapt': { title: 'Basculement multi-cloud obligatoire & publication forensique ouverte', city: 'Genève', mapLink: 'Neutralisation de la panique par transparence télémétrique signée.', trigger: 'Publication de journaux A1 signés et latence revenue sous 40 ms.' },
  },
  id: {
    'fc-fragm': { title: 'Pemecahan Gerbang Benua & Isolasi Penyelesaian Energi-Pelabuhan', city: 'Singapura (Malaka)', mapLink: 'Persimpangan simbol pipa patah & tanker terantai (2027) dengan isolasi jaringan regional.', trigger: 'Keterlambatan kliring maritim >45% atau pembatasan routing BGP berdaulat.' },
    'fc-fragi': { title: 'Gelombang Volatilitas HFT Sekunder Dipicu Rumor Harga ΠΣV', city: 'Tokyo', mapLink: 'Korelasi simbol ΠΣV bertanda lingkaran merah dengan jaringan cabang narasi QAnon.', trigger: 'Lonjakan indeks disinformasi melewati ambang lindung nilai otomatis.' },
    'fc-adapt': { title: 'Kewajiban Failover Multi-Cloud & Rilis Log Forensik Terbuka', city: 'Jenewa', mapLink: 'Netralisasi kepanikan melalui transparansi telemetri bertanda tangan dan audit resmi.', trigger: 'Rilis laporan A1 bertanda tangan kriptografi & latensi turun di bawah 40ms.' },
  },
  vi: {
    'fc-fragm': { title: 'Chia Cắt Cổng Liên Lục Địa & Cô Lập Thanh Toán Cảng – Năng Lượng', city: 'Singapore (Eo Malacca)', mapLink: 'Giao điểm biểu tượng đường ống gãy & tàu xích (2027) với cô lập vùng.', trigger: 'Chậm thông quan hàng hải >45% hoặc áp dụng giới hạn định tuyến BGP.' },
    'fc-fragi': { title: 'Làn Sóng Biến Động HFT Thứ Cấp Do Tin Đồn Định Giá ΠΣV', city: 'Tokyo', mapLink: 'Liên kết ký hiệu ΠΣV khoanh đỏ trên bìa 2027 với nhánh câu chuyện tài chính QAnon.', trigger: 'Chỉ số tin giả vượt ngưỡng kích hoạt phòng vệ giao dịch tự động.' },
    'fc-adapt': { title: 'Bắt Buộc Dự Phòng Đa Đám Mây & Công Khai Nhật Ký Pháp Y Ký Số', city: 'Geneva', mapLink: 'Triệt tiêu hoảng loạn bằng minh bạch đo lường ký số và kiểm toán tổ chức.', trigger: 'Công bố nhật ký A1 ký số và độ trễ ổn định dưới 40ms.' },
  },
};

export const SEMIOTIC_I18N: LocaleTextMap<
  Record<string, { title: string; visual: string; meaning: string; macro: string }>
> = {
  ar: {},
  en: {
    'sem-01': { title: 'Currency & Clearing Shift Symbol (ΠΣV)', visual: 'Red circle highlighting the alternative settlement coin emblem at the center of the 2027 cover', meaning: 'Visualizes institutional concern over fragile legacy clearing rails versus digital settlement alternatives during shocks.', macro: 'Monetary policy adjustments & sovereign yield spreads (bps)' },
    'sem-02': { title: 'Binary Brain & Autonomous Robot', visual: 'Wired digital brain and charging robot amidst falling 0/1 binary code', meaning: 'Algorithmic trading and AI automation outpacing human governance and circuit-breaker review.', macro: 'Share of HFT volume & compute capital expenditure' },
    'sem-03': { title: 'Fractured Pipeline & Chained Tanker', visual: 'Broken energy pipe on the east side and chained oil tanker', meaning: 'Coupling cyber/routing anomalies with maritime chokepoints and port clearance delays.', macro: 'Port dwell hours & war-risk marine insurance premiums' },
    'sem-04': { title: 'Cinema Projector & Narrative Reboots', visual: 'Film projector reel at lower left ("Hollywood reboots")', meaning: 'Shaping public perception through dramatic narratives vs verifiable institutional logs.', macro: 'Public institutional trust & discourse polarization metrics' },
    'sem-05': { title: 'Financial Reset Branch (Q-Map)', visual: 'Lower financial-reset branch on the QAnon map linking banks & currency claims', meaning: 'Repurposing systemic banking collapse narratives to blow brief app stalls into bank-run fears.', macro: 'Withdrawal hashtag velocity concurrent with ΠΣV alerts' },
    'sem-06': { title: 'Central Branching Hub & Disinfo Swarm', visual: 'Upper-central entangled QAnon graph radiating into dozens of claims', meaning: 'Network topology converting local technical glitches into all-encompassing cross-platform conspiracy scripts.', macro: 'Coordinated account clustering coefficient during outages' },
    'sem-07': { title: 'Blackout & Infrastructure Isolation Path', visual: 'Global blackout and grid/satellite nodes on the Q-Map flank', meaning: 'Psychological pressure on grid operators when rumors coincide with precautionary port isolation.', macro: 'Preventive utility shutoff ratio vs verified physical damage' },
    'sem-08': { title: 'Optimal Timeline Fork Nexus', visual: 'Central "Optimal Timeline Reality" banner connecting all map branches', meaning: 'Cognitive inflection point between transparent adaptation or closed fragmentation.', macro: 'Entropy divergence Hπ between competing narratives and A1 logs' },
  },
  fr: {
    'sem-01': { title: 'Symbole de mutation monétaire (ΠΣV)', visual: 'Cercle rouge autour de l’emblème ΠΣV au centre de la couverture 2027', meaning: 'Représente les tensions entre compensation traditionnelle fragile et alternatives numériques.', macro: 'Écarts de rendement et politique monétaire (bps)' },
    'sem-02': { title: 'Cerveau numérique & robot binaire', visual: 'Cerveau câblé et robot entouré de flux 0/1', meaning: 'Automatisation HFT et IA dépassant la gouvernance humaine en temps de crise.', macro: 'Part du trading algorithmique et dépenses de calcul' },
    'sem-03': { title: 'Pipeline brisé & navire enchaîné', visual: 'Conduite d’énergie brisée et pétrolier bloqué par des chaînes', meaning: 'Passage d’un incident réseau à un blocage logistique portuaire réel.', macro: 'Délais portuaires & primes d’assurance maritime' },
    'sem-04': { title: 'Projecteur cinéma & récits réinventés', visual: 'Projecteur en bas à gauche (Hollywood reboots)', meaning: 'Construction des perceptions publiques entre drame médiatique et preuves techniques.', macro: 'Indices de confiance institutionnelle' },
    'sem-05': { title: 'Axe Effondrement & Reset (Q-Map)', visual: 'Ramifications inférieures liées aux banques et devises', meaning: 'Amplification de pannes applicatives limitées en panique bancaire.', macro: 'Vélocité des mots-clés de retrait bancaire' },
    'sem-06': { title: 'Nœud de ramification & essaim IA', visual: 'Graphe central dense irradiant des dizaines d’allégations', meaning: 'Transformation d’un bug local en récit conspiratif total.', macro: 'Densité des comptes coordonnés pendant les pannes' },
    'sem-07': { title: 'Trajectoire Blackout & isolement', visual: 'Nœuds coupure globale et satellites sur la carte QAnon', meaning: 'Pression psychologique sur les opérateurs lors des isolations préventives.', macro: 'Taux de coupures préventives vs incidents physiques' },
    'sem-08': { title: 'Bifurcation de ligne temporelle', visual: 'Axe central « Optimal Timeline Reality »', meaning: 'Choix stratégique entre adaptation transparente ou fragmentation.', macro: 'Divergence d’entropie Hπ entre récits et journaux A1' },
  },
  id: {
    'sem-01': { title: 'Simbol Pergeseran Moneter (ΠΣV)', visual: 'Lingkaran merah menyoroti lambang koin ΠΣV di tengah sampul 2027', meaning: 'Menggambarkan ketegangan antara jalur kliring tradisional dan alternatif digital saat guncangan.', macro: 'Kebijakan moneter & selisih imbal hasil likuiditas (bps)' },
    'sem-02': { title: 'Otak Digital & Robot Biner', visual: 'Gambar otak bersirkuit dan robot di tengah aliran angka 0/1', meaning: 'Otomasi AI dan HFT yang melaju melampaui kapasitas pengawasan manusia.', macro: 'Porsi volume HFT & belanja komputasi harian' },
    'sem-03': { title: 'Pipa Energi Patah & Kapal Terantai', visual: 'Pipa energi patah di timur dan tanker kargo terbelenggu rantai', meaning: 'Keterkaitan gangguan siber/routing dengan hambatan logistik pelabuhan nyata.', macro: 'Waktu tunggu pelabuhan & tarif asuransi maritim' },
    'sem-04': { title: 'Proyektor Film & Rekonsiliasi Narasi', visual: 'Proyektor bioskop di kiri bawah sampul (Hollywood reboots)', meaning: 'Membentuk persepsi publik antara drama naratif dan dokumentasi forensik nyata.', macro: 'Indeks kepercayaan publik & polarisasi wacana' },
    'sem-05': { title: 'Cabang Reset Keuangan (Q-Map)', visual: 'Ranting bawah peta QAnon yang mengaitkan bank dan mata uang', meaning: 'Memanfaatkan istilah keruntuhan finansial untuk mengubah gangguan kecil menjadi panik.', macro: 'Kecepatan tagar penarikan dana bersamaan dengan gangguan ΠΣV' },
    'sem-06': { title: 'Simpul Percabangan & Gerombolan AI', visual: 'Poros tengah peta QAnon yang menyebar ke puluhan klaim terhubung', meaning: 'Topologi pengubahan gangguan lokal menjadi narasi konspirasi global terkoordinasi.', macro: 'Koefisien akun terkoordinasi saat terjadi pemadaman' },
    'sem-07': { title: 'Jalur Pemadaman Total & Isolasi', visual: 'Simpul pemadaman global, energi, dan satelit di sisi kiri peta QAnon', meaning: 'Tekanan psikologis saat rumor pemadaman total bertepatan dengan isolasi pelabuhan.', macro: 'Rasio penghentian preventif dibanding kerusakan fisik nyata' },
    'sem-08': { title: 'Simpul Percabangan Garis Waktu', visual: 'Sumbu pusat "Optimal Timeline Reality" yang terhubung ke seluruh cabang', meaning: 'Titik balik kognitif antara adaptasi transparan dan fragmentasi tertutup.', macro: 'Deviasi entropi Hπ antara narasi bersaing dan catatan A1' },
  },
  vi: {
    'sem-01': { title: 'Biểu Tượng Dịch Chuyển Tiền Tệ (ΠΣV)', visual: 'Vòng tròn đỏ quanh biểu tượng đồng tiền ΠΣV ở trung tâm bìa 2027', meaning: 'Phản ánh lo ngại về tính mong manh của thanh toán truyền thống trước các giải pháp số.', macro: 'Chính sách tiền tệ & chênh lệch thanh khoản (bps)' },
    'sem-02': { title: 'Bộ Não Số & Robot Nhị Phân', visual: 'Hình ảnh não kết nối mạch và robot giữa dòng mã 0/1', meaning: 'Tự động hóa AI và HFT vượt xa tốc độ giám sát của con người trong khủng hoảng.', macro: 'Tỷ trọng giao dịch thuật toán & chi tiêu hạ tầng tính toán' },
    'sem-03': { title: 'Đường Ống Gãy & Tàu Chở Dầu Bị Xích', visual: 'Đường ống năng lượng gãy và tàu chở dầu quấn xích', meaning: 'Sự cố mạng kéo theo tắc nghẽn thực tế tại cảng biển và chuỗi năng lượng.', macro: 'Thời gian thông quan cảng & phí bảo hiểm hàng hải' },
    'sem-04': { title: 'Máy Chiếu Phim & Tái Tạo Kịch Bản', visual: 'Máy chiếu phim góc dưới bên trái ("Hollywood reboots")', meaning: 'Định hình nhận thức công chúng giữa kịch tính truyền thông và hồ sơ pháp y.', macro: 'Chỉ số niềm tin thể chế & phân cực dư luận' },
    'sem-05': { title: 'Nhánh Tái Thiết Tài Chính (Q-Map)', visual: 'Các nhánh dưới của bản đồ QAnon gắn ngân hàng và tiền tệ', meaning: 'Tận dụng khái niệm tái thiết tiền tệ để khuếch đại lỗi kỹ thuật thành hoảng loạn.', macro: 'Tốc độ lan truyền từ khóa rút tiền trùng lúc sự cố ΠΣV' },
    'sem-06': { title: 'Nút Phân Nhánh Trung Tâm & Bầy Đàn AI', visual: 'Trục trên-giữa bản đồ QAnon tỏa ra hàng chục nút liên kết', meaning: 'Chuyển hóa lỗi cục bộ thành thuyết âm mưu xuyên nền tảng gây nhiễu pháp y.', macro: 'Mật độ tài khoản phối hợp đồng thời khi mất kết nối' },
    'sem-07': { title: 'Nhánh Mất Điện Toàn Cầu & Cô Lập Hạ Tầng', visual: 'Các nút mất điện, năng lượng và vệ tinh ở cạnh bản đồ QAnon', meaning: 'Áp lực tâm lý khi tin đồn mất điện trùng thời điểm cô lập cảng biển.', macro: 'Tỷ lệ ngắt phòng ngừa so với hư hại vật lý thực tế' },
    'sem-08': { title: 'Điểm Rẽ Nhánh Dòng Thời Gian', visual: 'Trục trung tâm "Optimal Timeline Reality" nối mọi nhánh bản đồ', meaning: 'Bước ngoặt nhận thức giữa thích ứng minh bạch hoặc phân mảnh khép kín.', macro: 'Độ lệch entropy Hπ giữa tường thuật cạnh tranh và nhật ký A1' },
  },
};

export const PIRC_STANDARDS_I18N: LocaleTextMap<
  Record<string, { sourceRepo: string; status: string; role: string }>
> = {
  ar: {},
  en: {
    'pi-native-subscriptions': { sourceRepo: 'Pi Developer Documentation (Official)', status: 'Pi Testnet v1 only · simulation supported · no Mainnet claim', role: 'Official Pi SDK subscription contract. This app reads the registered service and simulates subscribe; merchant processing is separate.' },
    pirc2: { sourceRepo: 'Ze0ro99/PiRC (Community Proposal)', status: 'Community design; not an official Pi Core Team standard or a verified deployment', role: 'Optional custom Soroban contract scaffold. It is distinct from the native Pi subscription contract and requires compile, tests, audit, and separate deployment.' },
    pirc1: { sourceRepo: 'Ze0ro99/PiRC (Community Proposal)', status: 'Non-binding community economic model; not official Pi policy or a Launchpad/DEX eligibility guarantee', role: 'Illustrative utility/activity metrics only; it does not establish a guaranteed exchange value or listing eligibility.' },
    'seven-layer': { sourceRepo: 'Ze0ro99/PiRC (Community)', status: 'Optional architectural blueprint — not a mandatory Core Team rule', role: 'Organizes system modules into 7 decoupled layers: Infra, Protocol, Contracts, Service, Interop, App, and Governance.' },
    'ze0ro-proposals': { sourceRepo: 'Ze0ro99/PiRC (Community Proposals)', status: 'Inspirational concepts separated cleanly from official Pi specifications', role: 'Tiered auth (202), oracle pricing (203), health monitor (206), AI audit (208), and circuit breakers (254).' },
    'economic-contract': { sourceRepo: 'Ze0ro99/project-unity-sphere', status: 'Server-side execution guardrails', role: 'Rejects client-claimed prices/entitlements, bans wallet secrets in frontend, and enforces idempotency and read-back verification.' },
  },
  fr: {
    'pi-native-subscriptions': { sourceRepo: 'Documentation Pi Developer (Officiel)', status: 'Pi Testnet v1 uniquement · simulation disponible · aucune affirmation Mainnet', role: 'Contrat d’abonnement officiel Pi SDK. L’application lit le service enregistré et simule subscribe; le traitement marchand est séparé.' },
    pirc2: { sourceRepo: 'Ze0ro99/PiRC (Proposition communautaire)', status: 'Conception communautaire; ni norme officielle Pi Core Team ni déploiement vérifié', role: 'Modèle de contrat Soroban personnalisé, distinct de l’abonnement Pi natif; compilation, tests, audit et déploiement séparés requis.' },
    pirc1: { sourceRepo: 'Ze0ro99/PiRC (Proposition communautaire)', status: 'Modèle économique communautaire non contraignant; aucune garantie de politique Pi, Launchpad ou DEX', role: 'Indicateurs illustratifs d’utilité uniquement; aucune valeur de change ou éligibilité de cotation garantie.' },
    'seven-layer': { sourceRepo: 'Ze0ro99/PiRC (Communautaire)', status: 'Modèle optionnel, non imposé par la Core Team', role: 'Découpage en 7 couches : Infrastructure, Protocole, Contrats, Service, Interop, Application et Gouvernance.' },
    'ze0ro-proposals': { sourceRepo: 'Ze0ro99/PiRC (Propositions communautaires)', status: 'Concepts distincts des spécifications officielles Pi', role: 'Accès gradué (202), oracle de prix (203), santé (206), audit IA (208) et disjoncteurs (254).' },
    'economic-contract': { sourceRepo: 'Ze0ro99/project-unity-sphere', status: 'Garde-fous d’exécution côté serveur', role: 'Rejette les prix/avantages revendiqués par le client, interdit les secrets wallet côté navigateur et impose idempotence et relecture.' },
  },
  id: {
    'pi-native-subscriptions': { sourceRepo: 'Dokumentasi Pi Developer (Resmi)', status: 'Hanya Pi Testnet v1 · simulasi tersedia · bukan klaim Mainnet', role: 'Kontrak langganan resmi Pi SDK. Aplikasi membaca layanan terdaftar dan mensimulasikan subscribe; pemrosesan merchant terpisah.' },
    pirc2: { sourceRepo: 'Ze0ro99/PiRC (Usulan Komunitas)', status: 'Desain komunitas; bukan standar resmi Pi Core Team atau deployment terverifikasi', role: 'Kerangka kontrak Soroban khusus, terpisah dari langganan Pi asli; perlu kompilasi, pengujian, audit, dan deployment terpisah.' },
    pirc1: { sourceRepo: 'Ze0ro99/PiRC (Usulan Komunitas)', status: 'Model ekonomi komunitas yang tidak mengikat; bukan kebijakan Pi atau jaminan Launchpad/DEX', role: 'Metrik utilitas ilustratif; tidak menjamin nilai tukar atau kelayakan listing.' },
    'seven-layer': { sourceRepo: 'Ze0ro99/PiRC (Komunitas)', status: 'Cetak biru arsitektur opsional — bukan aturan wajib Core Team', role: 'Memisahkan sistem menjadi 7 lapis: Infra, Protokol, Kontrak, Layanan, Interop, Aplikasi, dan Tata Kelola.' },
    'ze0ro-proposals': { sourceRepo: 'Ze0ro99/PiRC (Usulan Komunitas)', status: 'Konsep inspirasi yang dipisahkan dari spesifikasi Pi resmi', role: 'Izin bertingkat (202), oracle harga (203), kesehatan (206), audit AI (208), dan pemutus sirkuit (254).' },
    'economic-contract': { sourceRepo: 'Ze0ro99/project-unity-sphere', status: 'Aturan pengaman eksekusi sisi server', role: 'Menolak klaim harga/hak dari browser, melarang rahasia dompet di frontend, dan mewajibkan idempotensi serta verifikasi ulang.' },
  },
  vi: {
    'pi-native-subscriptions': { sourceRepo: 'Tài liệu Pi Developer (Chính thức)', status: 'Chỉ Pi Testnet v1 · hỗ trợ mô phỏng · không khẳng định Mainnet', role: 'Hợp đồng đăng ký chính thức của Pi SDK. Ứng dụng đọc dịch vụ đã đăng ký và mô phỏng subscribe; xử lý của merchant là riêng biệt.' },
    pirc2: { sourceRepo: 'Ze0ro99/PiRC (Đề xuất cộng đồng)', status: 'Thiết kế cộng đồng; không phải tiêu chuẩn chính thức của Pi Core Team hoặc triển khai đã xác minh', role: 'Khung Soroban tùy chỉnh, tách biệt với đăng ký Pi gốc; cần biên dịch, kiểm thử, kiểm toán và triển khai riêng.' },
    pirc1: { sourceRepo: 'Ze0ro99/PiRC (Đề xuất cộng đồng)', status: 'Mô hình kinh tế cộng đồng không ràng buộc; không phải chính sách Pi hoặc bảo đảm Launchpad/DEX', role: 'Chỉ là chỉ số tiện ích minh họa; không bảo đảm tỷ giá hoặc điều kiện niêm yết.' },
    'seven-layer': { sourceRepo: 'Ze0ro99/PiRC (Cộng Đồng)', status: 'Kiến trúc tham khảo tùy chọn — không phải quy chuẩn bắt buộc Core Team', role: 'Phân tách mã nguồn 7 tầng: Hạ tầng, Giao thức, Hợp đồng, Dịch vụ, Liên vận hành, Ứng dụng, Quản trị.' },
    'ze0ro-proposals': { sourceRepo: 'Ze0ro99/PiRC (Đề Xuất Cộng Đồng)', status: 'Tách biệt với tiêu chuẩn Pi chính thức', role: 'Phân quyền (202), oracle giá (203), giám sát sức khỏe (206), kiểm toán AI (208), cầu dao (254).' },
    'economic-contract': { sourceRepo: 'Ze0ro99/project-unity-sphere', status: 'Ràng buộc bảo mật máy chủ', role: 'Từ chối giá/quyền do trình duyệt khai báo, cấm bí mật ví ở frontend và bắt buộc idempotency cùng xác minh lại.' },
  },
};

export const FEE_STRATEGIES_I18N: LocaleTextMap<
  Record<string, { name: string; gasLabel: string; status: string; mechanism: string }>
> = {
  ar: {},
  en: {
    'direct-onchain': { name: 'Native Pi Subscription v1', gasLabel: 'No fixed network fee assumed', status: 'Pi Testnet v1 only · app supports simulate mode · service ID required', mechanism: 'Uses the official Pi SDK subscription contract. Merchant process is required for renewals; no scheduled renewal worker is active.' },
    'x402-batch': { name: 'x402 Batch Settlement (Not Integrated)', gasLabel: 'Not measured · no facilitator configured', status: 'Disabled · no verified settlement integration', mechanism: 'No payment vouchers, facilitator calls, or settlement transactions are issued by this application.' },
    'pirc2-allowance': { name: 'Community Soroban Contract Design', gasLabel: 'Unmeasured · compilation and audit required', status: 'Design scaffold only · not deployed or audited', mechanism: 'A custom Soroban concept, separate from native Pi subscriptions; it needs build, tests, audit, and its own Testnet deployment.' },
    'prepaid-bundle': { name: 'Prepaid Pi Credits (Disabled)', gasLabel: 'No fee quote · payments disabled', status: 'Disabled · no prepaid balance or entitlement', mechanism: 'The application does not create credits, collect payments, or grant premium access through a prepaid bundle.' },
    'pi-ads-subsidy': { name: 'Rewarded Ads Credit (Not Connected)', gasLabel: 'No provider callback verified', status: 'Disabled · no ad-based credit grants', mechanism: 'No credits or subscriptions are granted for ad views without a trusted server-side provider callback.' },
  },
  fr: {
    'direct-onchain': { name: 'Abonnement Pi natif v1', gasLabel: 'Aucun frais réseau fixe supposé', status: 'Pi Testnet v1 uniquement · mode simulation · Service ID requis', mechanism: 'Utilise le contrat officiel Pi SDK. Le merchant doit appeler process pour les renouvellements; aucun worker planifié n’est actif.' },
    'x402-batch': { name: 'Règlement groupé x402 (non intégré)', gasLabel: 'Non mesuré · aucun facilitateur configuré', status: 'Désactivé · aucun règlement vérifié', mechanism: 'L’application n’émet aucun bon de paiement et n’effectue aucun règlement ou transaction x402.' },
    'pirc2-allowance': { name: 'Conception Soroban communautaire', gasLabel: 'Non mesuré · compilation et audit requis', status: 'Modèle uniquement · non déployé et non audité', mechanism: 'Concept Soroban personnalisé, séparé de l’abonnement Pi natif; construction, tests, audit et déploiement Testnet requis.' },
    'prepaid-bundle': { name: 'Crédits Pi prépayés (désactivés)', gasLabel: 'Aucun tarif · paiements désactivés', status: 'Désactivé · aucun crédit ni avantage', mechanism: 'L’application ne crée pas de crédits, ne collecte pas de paiement et ne donne pas d’accès premium via forfait prépayé.' },
    'pi-ads-subsidy': { name: 'Crédit publicitaire récompensé (non connecté)', gasLabel: 'Aucun callback fournisseur vérifié', status: 'Désactivé · aucun crédit publicitaire', mechanism: 'Aucun crédit ni abonnement n’est accordé sans callback fournisseur fiable côté serveur.' },
  },
  id: {
    'direct-onchain': { name: 'Langganan Pi Native v1', gasLabel: 'Tidak mengasumsikan biaya jaringan tetap', status: 'Hanya Pi Testnet v1 · mode simulasi · Service ID diperlukan', mechanism: 'Menggunakan kontrak langganan resmi Pi SDK. Merchant harus memanggil process untuk pembaruan; tidak ada worker terjadwal.' },
    'x402-batch': { name: 'Penyelesaian Batch x402 (Belum Terintegrasi)', gasLabel: 'Belum diukur · fasilitator belum dikonfigurasi', status: 'Dinonaktifkan · belum ada settlement terverifikasi', mechanism: 'Aplikasi tidak menerbitkan voucher pembayaran atau menjalankan settlement/transaksi x402.' },
    'pirc2-allowance': { name: 'Desain Kontrak Soroban Komunitas', gasLabel: 'Belum diukur · perlu kompilasi dan audit', status: 'Kerangka desain saja · belum di-deploy atau diaudit', mechanism: 'Konsep Soroban khusus yang terpisah dari langganan Pi asli; perlu build, tes, audit, dan deployment Testnet.' },
    'prepaid-bundle': { name: 'Kredit Pi Prabayar (Dinonaktifkan)', gasLabel: 'Tidak ada estimasi biaya · pembayaran mati', status: 'Dinonaktifkan · tidak ada saldo atau entitlement', mechanism: 'Aplikasi tidak membuat kredit, mengumpulkan pembayaran, atau memberikan akses premium melalui paket prabayar.' },
    'pi-ads-subsidy': { name: 'Kredit Iklan Berhadiah (Belum Terhubung)', gasLabel: 'Callback penyedia belum diverifikasi', status: 'Dinonaktifkan · tidak ada kredit iklan', mechanism: 'Kredit/berlangganan tidak diberikan dari penayangan iklan tanpa callback server yang tepercaya.' },
  },
  vi: {
    'direct-onchain': { name: 'Đăng ký Pi Native v1', gasLabel: 'Không giả định phí mạng cố định', status: 'Chỉ Pi Testnet v1 · chế độ mô phỏng · cần Service ID', mechanism: 'Dùng hợp đồng đăng ký chính thức của Pi SDK. Merchant phải gọi process để gia hạn; chưa có worker lên lịch.' },
    'x402-batch': { name: 'Thanh toán gộp x402 (Chưa tích hợp)', gasLabel: 'Chưa đo · chưa cấu hình facilitator', status: 'Đã tắt · chưa có tích hợp thanh toán xác minh', mechanism: 'Ứng dụng không phát hành voucher thanh toán và không thực hiện settlement hay giao dịch x402.' },
    'pirc2-allowance': { name: 'Thiết kế Soroban cộng đồng', gasLabel: 'Chưa đo · cần biên dịch và kiểm toán', status: 'Chỉ là khung thiết kế · chưa triển khai hoặc kiểm toán', mechanism: 'Ý tưởng Soroban tùy chỉnh, tách biệt đăng ký Pi gốc; cần build, test, audit và triển khai Testnet riêng.' },
    'prepaid-bundle': { name: 'Tín dụng Pi trả trước (Đã tắt)', gasLabel: 'Không có báo giá · thanh toán bị tắt', status: 'Đã tắt · không có số dư hoặc quyền lợi', mechanism: 'Ứng dụng không tạo tín dụng, thu thanh toán hoặc cấp quyền premium qua gói trả trước.' },
    'pi-ads-subsidy': { name: 'Tín dụng quảng cáo thưởng (Chưa kết nối)', gasLabel: 'Chưa xác minh callback nhà cung cấp', status: 'Đã tắt · không cấp tín dụng quảng cáo', mechanism: 'Không cấp tín dụng hay đăng ký từ lượt xem quảng cáo nếu thiếu callback máy chủ đáng tin cậy.' },
  },
};

export const THREAT_PRESETS_I18N: LocaleTextMap<
  Record<RiskScenarioInput['threatCategory'], { label: string; defaultTitle: string; mitigations: string[] }>
> = {
  ar: {
    supply_choke: { label: 'اختناق سلاسل الإمداد والممرات البحرية', defaultTitle: 'اضطراب تخليص الموانئ وتعطل مسارات الطاقة الرقمية', mitigations: ['تفعيل بوابات توجيه متعددة السحب وعزل أنظمة SCADA غير الأساسية تلقائياً.', 'نشر عقد ضمان Soroban/PiRC2 لتجميد العقود الآجلة تلقائياً عند تجاوز التأخير 40%.', 'تشغيل وكيل رصد SoloHost محلي على العقد لمراقبة تغيرات BGP والموانئ.'] },
    web_exploit: { label: 'استغلال ثغرات الويب الحرجة (PHP2Shell / CVE)', defaultTitle: 'موجة استغلال مؤتمتة لثغرات الخوادم ضمن توجيه BOD 22-01', mitigations: ['تفعيل قاطع الدائرة PiRC-254 لحظر استدعاءات MCP غير الموقعة فور رصد شذوذ الحزم.', 'عزل مفاتيح توقيع Pi Wallet خلف خادم التحقق مع فرض Idempotency Keys.', 'ترقيع الخوادم الحرجة خلال 24 ساعة وتوثيق بصمة السجلات بـ SHA-256.'] },
    ai_ransomware: { label: 'هجمات الفدية المسرّعة بالذكاء الاصطناعي (SafePay)', defaultTitle: 'توسع هجمات التشفير المؤتمتة ضد مؤسسات البنية التحتية', mitigations: ['تشغيل نسخ احتياطية معزولة (Immutable Air-Gap) مرتبطة بإنذارات تحالف CISA.', 'فصل مستودع الوكلاء داخل بيئة SoloHost المعزولة مع حدود صلاحية PiRC-202.', 'إلزام المصادقة الثنائية الموثقة بـ Pi KYC لجميع إجراءات الاسترداد الحرجة.'] },
    payment_liquidity: { label: 'اختلال سيولة المدفوعات وتباعد الأوراكل (PI/USD)', defaultTitle: 'اتساع الفارق السعري وتعطل تسويات الدفع الدقيقة (x402)', mitigations: ['تفعيل وضع الفشل الآمن في أوراكل PiRC-203 عند تجاوز الفارق السعري 4.5%.', 'ترحيل المدفوعات الدقيقة 0.0001 Pi إلى قسائم التجميع x402 batch-settlement.', 'تحديد سقف ميزانية أقصى في سماحية Soroban transfer_from لحماية المشتركين.'] },
  },
  en: {
    supply_choke: { label: 'Supply Chain & Maritime Corridor Choke', defaultTitle: 'Port Clearance Stalls & Digital Energy Corridor Disruption', mitigations: ['Model multi-cloud failover options; any routing or SCADA change requires approval from the asset owner.', 'Estimate contract and supply-chain exposure; no contract or payment is frozen automatically.', 'Monitor public BGP and maritime sources with source and timestamp attribution; no external scanning or changes.'] },
    web_exploit: { label: 'Critical Web Exploits (PHP2Shell / BOD 22-01)', defaultTitle: 'Automated Edge Server Exploitation Wave under BOD 22-01', mitigations: ['Correlate indicators with assets the customer owns, then recommend a WAF rule or patch for operator approval.', 'Keep signing secrets server-side and require idempotency plus read-back checks in systems the customer owns.', 'Match findings against CISA KEV/NVD, prioritize patching, and let the asset owner approve the maintenance window.'] },
    ai_ransomware: { label: 'AI-Accelerated Ransomware (SafePay)', defaultTitle: 'Automated Encryption Campaigns Targeting Core Infrastructure', mitigations: ['Maintain immutable, isolated backups and run regular restoration tests.', 'Isolate affected hosts only through an approved EDR/SOAR playbook on owned assets, with an auditable change record.', 'Require MFA or security keys for privileged recovery and dual approval before restoring critical services.'] },
    payment_liquidity: { label: 'Oracle Spread Shock & Micro-Liquidity Strain', defaultTitle: 'PI/USD Oracle Divergence & x402 Settlement Bottleneck', mitigations: ['Compare independent price sources and pause recommendations on divergence; this is not a live transaction breaker.', 'Model settlement alternatives only; keep collection disabled until the provider, fees, and approvals are verified.', 'Set a user-approved budget ceiling; custom Soroban contracts need separate tests, audit, and Testnet deployment.'] },
  },
  fr: {
    supply_choke: { label: 'Goulot Logistique & Corridors Maritimes', defaultTitle: 'Blocage des ports et perturbation des corridors énergétiques', mitigations: ['Modéliser les options de bascule multi-cloud; toute modification de routage ou SCADA exige l’accord du propriétaire.', 'Évaluer l’exposition contractuelle; aucun contrat ou paiement n’est bloqué automatiquement.', 'Surveiller les sources BGP et maritimes publiques avec horodatage; aucune analyse externe ni modification réseau.'] },
    web_exploit: { label: 'Failles Web Critiques (PHP2Shell / BOD 22-01)', defaultTitle: 'Vague d’exploitation automatisée des serveurs (BOD 22-01)', mitigations: ['Corréler les indicateurs aux actifs détenus puis proposer une règle WAF ou un correctif à approuver.', 'Conserver les secrets de signature côté serveur et imposer idempotence et vérification postérieure.', 'Comparer les résultats à CISA KEV/NVD puis laisser le propriétaire approuver la fenêtre de maintenance.'] },
    ai_ransomware: { label: 'Rançongiciels accélérés par IA (SafePay)', defaultTitle: 'Campagnes de chiffrement automatisées sur infrastructures', mitigations: ['Conserver des sauvegardes immuables isolées et tester régulièrement leur restauration.', 'Isoler les hôtes affectés via un playbook EDR/SOAR approuvé sur les actifs détenus et journaliser le changement.', 'Exiger MFA ou clés de sécurité et une double approbation pour la restauration critique.'] },
    payment_liquidity: { label: 'Écart Oracle & Tension Liquidité x402', defaultTitle: 'Divergence PI/USD et congestion des micro-règlements x402', mitigations: ['Comparer plusieurs sources indépendantes et suspendre les recommandations en cas d’écart; aucun coupe-circuit de transaction.', 'Modéliser les options de règlement uniquement; conserver les paiements désactivés jusqu’à vérification du fournisseur.', 'Définir un plafond approuvé par l’utilisateur; les contrats Soroban personnalisés exigent tests, audit et déploiement distincts.'] },
  },
  id: {
    supply_choke: { label: 'Hambatan Rantai Pasok & Koridor Maritim', defaultTitle: 'Gangguan Kliring Pelabuhan & Jalur Energi Digital', mitigations: ['Modelkan opsi failover multi-cloud; perubahan routing atau SCADA memerlukan persetujuan pemilik aset.', 'Nilai paparan kontrak; tidak ada kontrak atau pembayaran yang dihentikan otomatis.', 'Pantau sumber BGP dan maritim publik dengan atribusi waktu; tanpa pemindaian atau perubahan eksternal.'] },
    web_exploit: { label: 'Eksploitasi Web Kritis (PHP2Shell / BOD 22-01)', defaultTitle: 'Gelombang Eksploitasi Otomatis Server dalam Arahan BOD 22-01', mitigations: ['Cocokkan indikator dengan aset milik pelanggan lalu sarankan aturan WAF atau patch untuk disetujui operator.', 'Simpan rahasia penandatanganan di server dan wajibkan idempotensi serta pemeriksaan hasil.', 'Cocokkan temuan dengan CISA KEV/NVD; pemilik aset menyetujui jadwal patch.'] },
    ai_ransomware: { label: 'Ransomware Berkecepatan AI (SafePay)', defaultTitle: 'Serangan Enkripsi Otomatis Terhadap Infrastruktur Vital', mitigations: ['Simpan cadangan immutable terisolasi dan uji pemulihan secara berkala.', 'Isolasi host terdampak melalui playbook EDR/SOAR yang disetujui pada aset sendiri dan catat perubahan.', 'Wajibkan MFA atau security key dan persetujuan ganda sebelum pemulihan layanan kritis.'] },
    payment_liquidity: { label: 'Penyimpangan Oracle & Tekanan Mikro x402', defaultTitle: 'Pelebaran Selisih Harga PI/USD & Kendala Penyelesaian x402', mitigations: ['Bandingkan sumber harga independen dan jeda rekomendasi saat berbeda; bukan pemutus transaksi langsung.', 'Modelkan alternatif penyelesaian saja; penagihan tetap nonaktif sampai penyedia dan biaya diverifikasi.', 'Tetapkan batas anggaran yang disetujui pengguna; kontrak Soroban perlu tes, audit, dan deployment terpisah.'] },
  },
  vi: {
    supply_choke: { label: 'Nghẽn Chuỗi Cung Ứng & Hành Lang Biển', defaultTitle: 'Ùn Ứ Thông Quan Cảng Biển & Tuyến Năng Lượng Số', mitigations: ['Mô hình hóa phương án chuyển đổi đa đám mây; thay đổi định tuyến hoặc SCADA cần chủ sở hữu phê duyệt.', 'Đánh giá rủi ro hợp đồng; không tự động đóng băng hợp đồng hoặc thanh toán.', 'Theo dõi nguồn BGP và hàng hải công khai có dấu thời gian; không quét hoặc thay đổi hệ thống bên ngoài.'] },
    web_exploit: { label: 'Lỗ Hổng Web Nghiêm Trọng (PHP2Shell / BOD 22-01)', defaultTitle: 'Làn Sóng Khai Thác Máy Chủ Tự Động Theo Chỉ Thị BOD 22-01', mitigations: ['Đối chiếu chỉ báo với tài sản thuộc khách hàng rồi đề xuất quy tắc WAF hoặc bản vá để quản trị viên duyệt.', 'Giữ bí mật ký ở máy chủ và yêu cầu idempotency cùng kiểm tra kết quả sau thao tác.', 'Đối chiếu phát hiện với CISA KEV/NVD; chủ sở hữu tài sản phê duyệt lịch vá.'] },
    ai_ransomware: { label: 'Mã Độc Tống Tiền Tăng Tốc AI (SafePay)', defaultTitle: 'Chiến Dịch Mã Hóa Tự Động Nhắm Vào Hạ Tầng Trọng Yếu', mitigations: ['Duy trì bản sao lưu bất biến, cô lập và kiểm tra khôi phục định kỳ.', 'Cô lập máy chủ bị ảnh hưởng bằng playbook EDR/SOAR đã duyệt trên tài sản sở hữu và ghi lại thay đổi.', 'Yêu cầu MFA hoặc khóa bảo mật và hai người phê duyệt trước khi khôi phục dịch vụ trọng yếu.'] },
    payment_liquidity: { label: 'Lệch Oracle & Nghẽn Thanh Khoản Vi Mô (x402)', defaultTitle: 'Giãn Biên Độ Giá PI/USD & Nghẽn Thanh Toán x402', mitigations: ['So sánh các nguồn giá độc lập và tạm dừng khuyến nghị khi lệch; đây không phải cầu dao giao dịch trực tiếp.', 'Chỉ mô phỏng phương án thanh toán; giữ thu tiền tắt đến khi xác minh nhà cung cấp và phí.', 'Đặt giới hạn ngân sách do người dùng duyệt; hợp đồng Soroban cần kiểm thử, kiểm toán và triển khai riêng.'] },
  },
};

export const GOVERNANCE_PROPOSALS_I18N: LocaleTextMap<
  Record<string, { title: string; summary: string }>
> = {
  ar: {},
  en: {
    'prop-01': { title: 'SoloHost PHP2Shell & BGP Anomaly Guard MCP Agent', summary: 'Edge MCP worker correlating CISA BOD 22-01 alerts with live BGP telemetry and signed red/green attestations.' },
    'prop-02': { title: 'PiRC2 Batch Subscription + PiRC-254 Circuit Breaker Contract', summary: 'Soroban contract preventing 0.01 Pi gas drain on 0.0001 Pi micro-plans and halting pulls when oracle spread spikes.' },
  },
  fr: {
    'prop-01': { title: 'Agent MCP de garde PHP2Shell & anomalies BGP sur SoloHost', summary: 'Agent MCP local corrélant alertes CISA BOD 22-01 et télémétrie BGP avec attestations signées.' },
    'prop-02': { title: 'Contrat d’abonnement PiRC2 + Disjoncteur PiRC-254', summary: 'Contrat Soroban évitant les frais de 0,01 Pi sur les micro-plans et stoppant en cas d’écart oracle.' },
  },
  id: {
    'prop-01': { title: 'Agen MCP Pengawas PHP2Shell & Anomali BGP di SoloHost', summary: 'Pekerja MCP yang memadukan peringatan CISA BOD 22-01 dengan telemetri BGP ber-tanda tangan.' },
    'prop-02': { title: 'Kontrak Langganan Batch PiRC2 + Pemutus Sirkuit PiRC-254', summary: 'Kontrak Soroban mencegah pemborosan gas 0,01 Pi dan berhenti otomatis saat selisih oracle melebar.' },
  },
  vi: {
    'prop-01': { title: 'Tác Nhân MCP Giám Sát PHP2Shell & Bất Thường BGP Trên SoloHost', summary: 'Tác nhân MCP đối chiếu cảnh báo CISA BOD 22-01 với dữ liệu BGP trực tiếp kèm chứng thực ký số.' },
    'prop-02': { title: 'Hợp Đồng Gói Gộp PiRC2 + Cầu Dao Ngắt Mạch PiRC-254', summary: 'Hợp đồng Soroban tránh tốn phí 0,01 Pi và tự ngắt khi biên độ oracle vượt ngưỡng an toàn.' },
  },
};

export const HACKATHON_BLUEPRINT_DOCS_I18N: LocaleTextMap<
  { id: string; code: string; title: string; summary: string; highlights: string[] }[]
> = {
  ar: [
    {
      id: 'doc-arch',
      code: 'DOC-01',
      title: 'خريطة المنظومة والحدود المعمارية',
      summary: 'الفصل الواضح بين معايير PiNetwork/PiRC الرسمية وبين مقترحات Ze0ro99/PiRC وطبقات SoloHost وHermes.',
      highlights: ['الاستكشاف المفتوح على .pinet.com دون حجب الضيوف', 'توافر التحقق الخادمي عبر /api/pi/verify (Pi SDK v2.0)', 'فصل PiRC1/PiRC2 عن PiRC-202..254'],
    },
    {
      id: 'doc-econ',
      code: 'DOC-02',
      title: 'خطة الاقتصاد المزدوج وتخطي رسم 0.01 Pi',
      summary: 'تحويل اشتراك 0.0001 Pi إلى نموذج عملي ومربح اقتصادياً عبر x402 batch-settlement وPiRC2.',
      highlights: ['قسائم x402 الموقعة وتجميعها على Testnet/Mainnet', 'باقة 0.1 Pi المسبقة + Pi.Ads (mediator_ack_status)', 'تصدير العقود والوكلاء المدفوع مع Launchpad/PiRC1'],
    },
    {
      id: 'doc-sec',
      code: 'DOC-03',
      title: 'أمان التسعير (ECONOMIC_ENGINE_API_CONTRACT) وخصوصية الكود',
      summary: 'رفض الأسعار الواردة من المتصفح، وحظر تسريب المفاتيح، ومنع التضليل بإلزامية مقياس الأدلة الخمسي.',
      highlights: ['مراجعة كل سعر وعملية دفع بسلطة الخادم ومفاتيح Idempotency', 'تحقيق Read-back بعد إتمام الدفع عبر Pi API', 'إلزام الإبلاغ الموثق والفصل الصارم للخرائط الرمزية'],
    },
    {
      id: 'doc-launch',
      code: 'DOC-04',
      title: 'خطة النشر لهاكاثون Pi Next (حتى 5 يناير 2027 23:59 PST)',
      summary: 'توافق كامل مع معايير هاكاثون Pi Next (انطلاق 19 نوفمبر 2026) وجاهزية المنصة للربع الأول 2027.',
      highlights: ['عداد PiRC1 الحي للنشاط الحقيقي الموثق', 'دعم التشغيل السحابي SoloHost & Hermes بدون حاسوب', 'تقييم صحة التشغيل اللحظي (PiRC-206) وتصويت KYC'],
    },
  ],
  en: [
    {
      id: 'doc-arch',
      code: 'DOC-01',
      title: 'Architecture Boundaries & Pi Ecosystem Alignment',
      summary: 'Explicit separation between official PiNetwork/PiRC specs and community Ze0ro99/PiRC patterns across SoloHost & Hermes.',
      highlights: ['PiNet guest-first browsing across all maps without auth wall', 'Server-side verification gateway at /api/pi/verify (Pi SDK v2.0)', 'Explicit PiRC1/PiRC2 vs PiRC-202..254 distinction'],
    },
    {
      id: 'doc-econ',
      code: 'DOC-02',
      title: 'Dual Monetization & Overcoming the 0.01 Pi Base Fee',
      summary: 'Makes the 0.0001 Pi/month tier economically viable via x402 batch-settlement, PiRC2 allowances, & Pi.Ads.',
      highlights: ['Off-chain x402 vouchers batched to avoid 100× gas drag', '0.1 Pi prepaid bundle + Pi.Ads mediator_ack_status verification', 'Premium Soroban/MCP export driving PiRC1 utility'],
    },
    {
      id: 'doc-sec',
      code: 'DOC-03',
      title: 'Security Contract (ECONOMIC_ENGINE_API_CONTRACT) & Safety',
      summary: 'Server-authoritative pricing rejecting browser claims, zero frontend wallet secrets, & 5-tier epistemic hygiene.',
      highlights: ['HTTP 403 rejection on client price tampering + Idempotency Keys', 'Post-settlement read-back confirmation via Pi Platform API', 'Strict isolation of symbolic maps from empirical OSINT tracks'],
    },
    {
      id: 'doc-launch',
      code: 'DOC-04',
      title: 'Pi Next Hackathon Delivery Plan (Due Jan 5, 2027 23:59 PST)',
      summary: 'Full submission compliance (Nov 19, 2026 kickoff) and Q1 2027 Pi Launchpad readiness.',
      highlights: ['Live PiRC1 verified-utility activity counter', 'Mobile-ready Cloud SoloHost & Hermes execution without a PC', 'PiRC-206 health telemetry & KYC Sybil-resistant governance'],
    },
  ],
  fr: [
    {
      id: 'doc-arch',
      code: 'DOC-01',
      title: 'Architecture & Frontières de l’Écosystème Pi',
      summary: 'Séparation claire entre spécifications officielles PiNetwork/PiRC et propositions communautaires Ze0ro99.',
      highlights: ['Exploration ouverte PiNet (.pinet.com) sans mur de connexion', 'Passerelle serveur /api/pi/verify (Pi SDK v2.0)', 'Distinction PiRC1/PiRC2 vs PiRC-202..254'],
    },
    {
      id: 'doc-econ',
      code: 'DOC-02',
      title: 'Économie Duale & Contournement des Frais de 0,01 Pi',
      summary: 'Rentabilise l’abonnement mensuel 0,0001 Pi via x402 batch-settlement, PiRC2 et Pi.Ads.',
      highlights: ['Bons x402 hors-chaîne groupés évitant le facteur 100× gaz', 'Forfait 0,1 Pi + vérification serveur Pi.Ads', 'Génération d’agents & contrats alimentant l’utilité PiRC1'],
    },
    {
      id: 'doc-sec',
      code: 'DOC-03',
      title: 'Contrat Sécurité (ECONOMIC_ENGINE_API_CONTRACT)',
      summary: 'Tarification serveur autoritaire, aucune clé privée côté client et échelle épistémique à 5 rangs.',
      highlights: ['Rejet HTTP 403 si prix falsifié + clés d’idempotence', 'Relecture post-règlement sur l’API Pi Platform', 'Isolation stricte des cartes symboliques vs OSINT'],
    },
    {
      id: 'doc-launch',
      code: 'DOC-04',
      title: 'Plan de Livraison Hackathon Pi Next (jusqu’au 5 janv. 2027 23:59 PST)',
      summary: 'Conformité complète au calendrier Pi Next (lancé 19 nov. 2026) et préparation Launchpad T1 2027.',
      highlights: ['Compteur d’utilité vérifiée PiRC1 en direct', 'Exécution Cloud SoloHost & Hermes sans ordinateur', 'Santé PiRC-206 & gouvernance anti-Sybil par KYC'],
    },
  ],
  id: [
    {
      id: 'doc-arch',
      code: 'DOC-01',
      title: 'Arsitektur & Pemisahan Standar Ekosistem Pi',
      summary: 'Pemisahan tegas antara spesifikasi resmi PiNetwork/PiRC dan rancangan komunitas Ze0ro99.',
      highlights: ['Akses tamu terbuka di .pinet.com tanpa kunci login paksa', 'Gateway verifikasi server /api/pi/verify (Pi SDK v2.0)', 'Pemisahan PiRC1/PiRC2 vs PiRC-202..254'],
    },
    {
      id: 'doc-econ',
      code: 'DOC-02',
      title: 'Ekonomi Ganda & Mengatasi Biaya Dasar 0,01 Pi',
      summary: 'Membuat langganan 0,0001 Pi layak secara ekonomi melalui batch x402, izin PiRC2, & Pi.Ads.',
      highlights: ['Voucher x402 off-chain mencegah pemborosan gas 100×', 'Paket prabayar 0,1 Pi + verifikasi mediator_ack_status', 'Ekspor agen/kontrak Soroban penggerak utilitas PiRC1'],
    },
    {
      id: 'doc-sec',
      code: 'DOC-03',
      title: 'Kontrak Keamanan (ECONOMIC_ENGINE_API_CONTRACT)',
      summary: 'Harga dikontrol penuh server, bebas kunci rahasia di browser, & disiplin epistemik 5 tingkat.',
      highlights: ['Penolakan HTTP 403 atas manipulasi harga klien + Idempotency', 'Konfirmasi read-back pasca-pembayaran via Pi API', 'Pemisahan ketat peta simbolik dari rekaman OSINT nyata'],
    },
    {
      id: 'doc-launch',
      code: 'DOC-04',
      title: 'Rencana Rilis Hackathon Pi Next (Hingga 5 Jan 2027 23:59 PST)',
      summary: 'Kepatuhan penuh jadwal Pi Next (mulai 19 Nov 2026) & kesiapan Launchpad Q1 2027.',
      highlights: ['Penghitung utilitas terverifikasi PiRC1 secara langsung', 'Eksekusi Cloud SoloHost & Hermes langsung dari ponsel', 'Pemantau kesehatan PiRC-206 & voting KYC anti-Sybil'],
    },
  ],
  vi: [
    {
      id: 'doc-arch',
      code: 'DOC-01',
      title: 'Kiến Trúc & Ranh Giới Hệ Sinh Thái Pi',
      summary: 'Phân tách rõ ràng tiêu chuẩn chính thức PiNetwork/PiRC với đề xuất cộng đồng Ze0ro99.',
      highlights: ['Cho phép khách khám phá mở trên .pinet.com không ép đăng nhập', 'Cổng xác thực máy chủ /api/pi/verify (Pi SDK v2.0)', 'Phân biệt rõ PiRC1/PiRC2 và PiRC-202..254'],
    },
    {
      id: 'doc-econ',
      code: 'DOC-02',
      title: 'Kinh Tế Kép & Giải Pháp Cho Phí Nền 0,01 Pi',
      summary: 'Giúp gói 0,0001 Pi/tháng khả thi nhờ gộp phiếu x402, hợp đồng PiRC2 và quảng cáo Pi.Ads.',
      highlights: ['Phiếu x402 ngoài chuỗi tránh lãng phí gas gấp 100×', 'Gói nạp trước 0,1 Pi + xác thực mediator_ack_status', 'Xuất hợp đồng Soroban/MCP thúc đẩy tiện ích thực PiRC1'],
    },
    {
      id: 'doc-sec',
      code: 'DOC-03',
      title: 'Hợp Đồng Bảo Mật (ECONOMIC_ENGINE_API_CONTRACT)',
      summary: 'Định giá hoàn toàn do máy chủ quyết định, không lộ khóa ví, cùng thang bằng chứng 5 cấp.',
      highlights: ['Chặn HTTP 403 nếu giả mạo giá từ trình duyệt + Idempotency Key', 'Kiểm tra đọc lại (read-back) sau thanh toán qua Pi API', 'Tách biệt bản đồ biểu tượng khỏi dữ liệu OSINT thực nghiệm'],
    },
    {
      id: 'doc-launch',
      code: 'DOC-04',
      title: 'Lộ Trình Hackathon Pi Next (Hạn 5/1/2027 23:59 PST)',
      summary: 'Đáp ứng đầy đủ tiêu chuẩn Pi Next (khởi động 19/11/2026) và sẵn sàng Launchpad Q1 2027.',
      highlights: ['Bộ đếm tiện ích xác thực PiRC1 trực tiếp', 'Chạy Cloud SoloHost & Hermes trên điện thoại không cần PC', 'Giám sát sức khỏe PiRC-206 & bỏ phiếu quản trị KYC'],
    },
  ],
};
