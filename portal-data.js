/* Centralne dane demonstracyjne portalu LEAP.
 * Nie zawierają danych identyfikacyjnych ani kontaktowych uczestników.
 * Ten plik jest jedynym źródłem danych początkowych dla wszystkich widoków.
 */
(() => {
  const timelineStages = [
    'Kandydat', 'Pre-screening telefoniczny', 'Kwalifikacja lekarska', 'T0',
    'USG', 'Laboratorium', 'Randomization readiness', 'Randomizacja',
    'LLLT/sham 1–10', 'T1', 'LTP Module', 'REHAB W0', 'REHAB W4',
    'REHAB W8', 'REHAB W12', 'Follow-up'
  ];

  const stationCatalog = [
    ['registration', 'Rejestracja i completeness', 'REG'],
    ['screening', 'Screening support', 'SCR'],
    ['consent', 'Wsparcie consent/assent', 'CON'],
    ['prom', 'PROM', 'PROM'],
    ['nprs', 'Ocena bólu / NPRS', 'NPRS'],
    ['anthropometry', 'Antropometria', 'ANT'],
    ['tanita', 'Tanita', 'TAN'],
    ['maturation', 'Pomiary dojrzewania', 'MAT'],
    ['rom', 'ROM', 'ROM'],
    ['muscle-length', 'Długość mięśni', 'ML'],
    ['beighton', 'Beighton', 'BEI'],
    ['fpi', 'Foot Posture Index', 'FPI'],
    ['ybt', 'Y-Balance Test', 'YBT'],
    ['hhd-q', 'HHD quadriceps', 'HQ'],
    ['hhd-h', 'HHD hamstrings', 'HH'],
    ['hhd-pf', 'HHD plantarflexors', 'HPF'],
    ['pain-provocation', 'Testy prowokujące ból', 'PPT'],
    ['movement-quality', 'Ocena jakości ruchu', 'MQR'],
    ['opencap-setup', 'OpenCap setup', 'OCS'],
    ['opencap-recording', 'OpenCap recording', 'OCR'],
    ['opencap-files', 'OpenCap file management', 'OCF'],
    ['crf', 'CRF completeness', 'CRF'],
    ['lllt', 'Operator LLLT/sham', 'LLLT'],
    ['rehab-osd', 'REHAB Osgood–Schlatter', 'ROS'],
    ['rehab-sever', 'REHAB Sever', 'RSE'],
    ['follow-up', 'Follow-up', 'FU'],
    ['data-qc', 'Data QC', 'DQC'],
    ['t1-blinded', 'Zaślepiona ocena T1', 'T1', true]
  ].map(([id, name, short, blindedOutcome = false]) => ({ id, name, short, blindedOutcome }));

  const team = [
    {
      id: 'pi', name: 'Bartosz Wilczyński', slug: 'bartosz-wilczynski',
      primaryRole: 'Principal Investigator / Scientific and Clinical Oversight',
      secondaryRoles: ['Data Governance', 'Biomechanics Analysis Oversight'],
      teamCategories: ['Governance and clinical oversight'], status: 'Active',
      availability: ['Elastycznie'], backupMemberId: 'karol', supervisorId: null,
      openTasksCount: 3, nextAssignmentId: 'block-002',
      certifications: ['Clinical Lead', 'Safety escalation', 'Protocol sign-off'],
      notesPublic: 'Finalne decyzje protokołowe, bezpieczeństwo, metodologia, analiza i publikacje.',
      responsibilities: [
        'Finalne decyzje protokołowe i amendments', 'Safety escalation i przypadki niejednoznaczne',
        'Finalny sign-off metodologiczny', 'Rozwój naukowy, analizy i publikacje',
        'Miesięczny quality review', 'Nadzór nad algorytmem rehabilitacji i LTP Module',
        'Governance danych'
      ],
      exclusions: ['Umawianie rodzin', 'Rutynowe uzupełnianie braków po innych', 'Automatyczne zastępstwo na każdym bloku']
    },
    {
      id: 'magda', name: 'Magda', slug: 'magda',
      primaryRole: 'Project Operations Coordinator', secondaryRoles: ['Central Scheduling Owner'],
      teamCategories: ['Core operations'], status: 'Active',
      availability: ['Czwartek', 'Piątek', 'Elastycznie'], backupMemberId: 'pi', supervisorId: 'pi',
      openTasksCount: 4, nextAssignmentId: 'block-001',
      certifications: ['Participant flow', 'Central calendar', 'Operational communication'],
      notesPublic: 'Jedyny właściciel operacyjnego przepływu uczestnika i centralnego harmonogramu.',
      responsibilities: [
        'Pierwszy kontakt operacyjny z rodzicami', 'Centralny kalendarz i wszystkie wizyty',
        'Przypomnienia i zmiany terminów', 'Koordynacja lekarza, USG, laboratorium, T0, interwencji, REHAB i follow-up',
        'Centralny tracker uczestników', 'Eskalowanie zatorów do właścicieli'
      ],
      exclusions: ['Podejmowanie formalnych decyzji medycznych']
    },
    {
      id: 'karol', name: 'Karol de Tillier', slug: 'karol-de-tillier',
      primaryRole: 'Senior Clinical Governance Lead', secondaryRoles: ['Clinical Lead', 'Trainer'],
      teamCategories: ['Governance and clinical oversight', 'Clinical backup / specialist support'],
      status: 'Active', availability: ['Czwartek', 'Piątek'], backupMemberId: 'mateusz-nowosad', supervisorId: 'pi',
      openTasksCount: 2, nextAssignmentId: 'block-001',
      certifications: ['Clinical Lead', 'Reliability substudy', 'Operator audit'],
      notesPublic: 'Standard kliniczny T0/W12, trudne screeningi, szkolenia i audyty.',
      responsibilities: ['Standard kliniczny T0/W12', 'Trudne screeningi', 'Szkolenie zespołu', 'Reliability substudy', 'Audyty kliniczne', 'Zastępstwo PI w części klinicznej'],
      exclusions: ['Codzienny harmonogram', 'Formalna kwalifikacja lekarska']
    },
    {
      id: 'mateusz-nowosad', name: 'Mateusz Nowosad', slug: 'mateusz-nowosad',
      primaryRole: 'Senior Clinical Assessor / Clinical Backup', secondaryRoles: ['Trainer'],
      teamCategories: ['Governance and clinical oversight', 'Clinical backup / specialist support'],
      status: 'Backup', availability: ['Wybrane piątki'], backupMemberId: 'karol', supervisorId: 'karol',
      openTasksCount: 1, nextAssignmentId: 'block-004',
      certifications: ['Reliability substudy', 'Senior assessor'],
      notesPublic: 'Wsparcie trudniejszych testów, reliability substudy i audyt operatorów.',
      responsibilities: ['Reliability substudy', 'Trudniejsze testy', 'Wybrane T0/W12', 'Szkolenie i audyt operatorów'],
      exclusions: ['Stała obecność na wszystkich blokach']
    },
    {
      id: 'filip', name: 'Filip Koska', slug: 'filip-koska',
      primaryRole: 'Photobiomodulation Intervention Lead', secondaryRoles: ['LEAP-LASER Module Lead'],
      teamCategories: ['Core operations'], status: 'Active',
      availability: ['Elastycznie'], backupMemberId: 'student-4', supervisorId: 'pi',
      openTasksCount: 3, nextAssignmentId: 'lllt-007',
      certifications: ['LLLT/sham operator', 'Device parameters', 'Intervention documentation'],
      notesPublic: 'Właściciel organizacji i kompletności modułu LLLT/sham.',
      responsibilities: ['Dostępność operatorów', '10 sesji w 2 tygodnie', 'Adherence', 'Parametry urządzenia', 'Utrzymanie zaślepienia', 'AE i deviations interwencji'],
      exclusions: ['PGIC po interwencji', 'Zaślepione testy T1', 'Niezależne umawianie rodzin']
    },
    {
      id: 'maciej', name: 'Maciej Budek', slug: 'maciej-budek',
      primaryRole: 'OpenCap Acquisition and Data Integrity Coordinator', secondaryRoles: ['OpenCap Trainer'],
      teamCategories: ['Core operations'], status: 'Active',
      availability: ['Czwartek', 'Piątek'], backupMemberId: 'weronika', supervisorId: 'pi',
      openTasksCount: 2, nextAssignmentId: 'block-001',
      certifications: ['OpenCap setup', 'OpenCap recording', 'OpenCap file management'],
      notesPublic: 'Gotowość stanowiska, nagrania, eksport, backup i first-line QC do 48 godzin.',
      responsibilities: ['Kalibracja kamer', 'Nagrania OpenCap', 'Nazewnictwo i eksport', 'Kopie zapasowe', 'First-line QC', 'Raport braków do 48 godzin'],
      exclusions: ['Finalna interpretacja biomechaniczna']
    },
    {
      id: 'alicja', name: 'Alicja Odalska', slug: 'alicja-odalska',
      primaryRole: 'OSD Rehabilitation Case Lead', secondaryRoles: ['T0/W12 Flexible Assessor'],
      teamCategories: ['Module owners'], status: 'Active',
      availability: ['Elastycznie', 'Wybrane piątki'], backupMemberId: 'natalia', supervisorId: 'pi',
      openTasksCount: 3, nextAssignmentId: 'rehab-002',
      certifications: ['REHAB Osgood–Schlatter', 'LTP Module', 'KOOS-Child'],
      notesPublic: 'Prowadzi 12-tygodniowy program REHAB dla zmian Osgood–Schlatter.',
      responsibilities: ['REHAB W0/W4/W8/W12', 'LTP i algorytm rehabilitacji', 'Activity ladder', 'KOOS-Child', 'Kompletność REHAB OSD', 'Wsparcie T0/W12'],
      exclusions: ['Formalna kwalifikacja lekarska']
    },
    {
      id: 'natalia', name: 'Natalia Patalan', slug: 'natalia-patalan',
      primaryRole: 'Sever Rehabilitation Case Lead', secondaryRoles: ['T0/W12 Flexible Assessor'],
      teamCategories: ['Module owners'], status: 'Active',
      availability: ['Elastycznie', 'Piątek'], backupMemberId: 'alicja', supervisorId: 'pi',
      openTasksCount: 4, nextAssignmentId: 'rehab-003',
      certifications: ['REHAB Sever — onboarding', 'OxAFQ-C'],
      notesPublic: 'Prowadzi 12-tygodniowy program rehabilitacji dla uczestników ze zmianami Severa.',
      responsibilities: ['REHAB W0/W4/W8/W12', 'LTP i algorytm rehabilitacji', 'Activity ladder', 'OxAFQ-C', 'Kompletność REHAB Sever', 'Wsparcie T0/W12'],
      exclusions: ['Samodzielna praca przed ukończeniem wdrożenia']
    },
    {
      id: 'weronika', name: 'Weronika Roda', slug: 'weronika-roda',
      primaryRole: 'Control Cohort and Female Recruitment Coordinator',
      secondaryRoles: ['T0/W12 Flexible Assessor'],
      teamCategories: ['Module owners', 'T0/W12 flexible assessment pool'], status: 'Active',
      availability: ['Czwartek', 'Piątek'], backupMemberId: 'julia', supervisorId: 'pi',
      openTasksCount: 2, nextAssignmentId: 'block-002',
      certifications: ['YBT', 'OpenCap support', 'PROM', 'CRF completeness'],
      notesPublic: 'Rekrutacja kontroli i dziewcząt oraz obowiązkowa pula wykonawcza T0/W12.',
      responsibilities: ['Rekrutacja zdrowych kontroli', 'Rekrutacja dziewcząt', 'Matching candidates', 'Kompletność T0 kontroli', 'Regularne stacje T0/W12'],
      exclusions: ['Niezależne zarządzanie LLLT, REHAB lub follow-up']
    },
    {
      id: 'julia', name: 'Julia Poterała', slug: 'julia-poterala',
      primaryRole: 'Follow-up Module Owner', secondaryRoles: ['T0/W12 Flexible Assessor'],
      teamCategories: ['Module owners', 'T0/W12 flexible assessment pool'], status: 'Active',
      availability: ['Czwartek', 'Piątek', 'Elastycznie'], backupMemberId: 'weronika', supervisorId: 'pi',
      openTasksCount: 3, nextAssignmentId: 'block-001',
      certifications: ['Follow-up', 'PROM', 'CRF completeness', 'Antropometria'],
      notesPublic: 'Właściciel follow-up i obowiązkowa pula wykonawcza T0/W12.',
      responsibilities: ['SOP i formularz follow-up', 'Skrypt kontaktu', 'Return to sport i nawroty', 'Kompletność follow-up', 'Regularne stacje T0/W12'],
      exclusions: ['Niezależne umawianie terminów bez Magdy']
    },
    {
      id: 'marta', name: 'Marta Gołuch', slug: 'marta-goluch',
      primaryRole: 'KOOS-Child Instrument Custodian', secondaryRoles: [],
      teamCategories: ['Module owners'], status: 'Active', availability: ['Elastycznie'],
      backupMemberId: 'alicja', supervisorId: 'pi', openTasksCount: 1, nextAssignmentId: null,
      certifications: ['KOOS-Child administration', 'KOOS-Child scoring'],
      notesPublic: 'Wersja, instrukcja, scoring, braki odpowiedzi i szkolenie KOOS-Child.',
      responsibilities: ['Właściwa wersja KOOS-Child', 'Scoring', 'Reguły braków', 'Kontrola wersji', 'Szkolenie'],
      exclusions: []
    },
    {
      id: 'sandra', name: 'Sandra Potrykus', slug: 'sandra-potrykus',
      primaryRole: 'OxAFQ-C Instrument Custodian', secondaryRoles: [],
      teamCategories: ['Module owners'], status: 'Active', availability: ['Elastycznie'],
      backupMemberId: 'natalia', supervisorId: 'pi', openTasksCount: 1, nextAssignmentId: null,
      certifications: ['OxAFQ-C child', 'OxAFQ-C proxy'],
      notesPublic: 'Wersje child/proxy, instrukcja, scoring, braki odpowiedzi i szkolenie OxAFQ-C.',
      responsibilities: ['Wersje OxAFQ-C', 'Scoring', 'Reguły braków', 'Kontrola wersji', 'Szkolenie'],
      exclusions: []
    },
    {
      id: 'nikodem', name: 'Nikodem Przeworski', slug: 'nikodem-przeworski',
      primaryRole: 'Flexible Assessment Pool / Backup Assessor', secondaryRoles: [],
      teamCategories: ['T0/W12 flexible assessment pool', 'Clinical backup / specialist support'],
      status: 'Backup', availability: ['Piątek'], backupMemberId: 'tymon', supervisorId: 'karol',
      openTasksCount: 1, nextAssignmentId: 'block-002',
      certifications: ['HHD', 'Pain provocation'],
      notesPublic: 'Przydzielany do konkretnych stacji zgodnie z certyfikacją.',
      responsibilities: ['HHD', 'Pain provocation', 'Wsparcie T0/W12'], exclusions: []
    },
    {
      id: 'tymon', name: 'Tymon Środa', slug: 'tymon-sroda',
      primaryRole: 'Flexible Assessment Pool / Backup Assessor', secondaryRoles: [],
      teamCategories: ['T0/W12 flexible assessment pool', 'Clinical backup / specialist support'],
      status: 'Backup', availability: ['Piątek'], backupMemberId: 'nikodem', supervisorId: 'karol',
      openTasksCount: 1, nextAssignmentId: 'block-004',
      certifications: ['ROM', 'Antropometria'],
      notesPublic: 'Przydzielany do konkretnych stacji zgodnie z certyfikacją.',
      responsibilities: ['ROM', 'Antropometria', 'Wsparcie T0/W12'], exclusions: []
    },
    ...[
      [1, 'Zuza Sroka', 'zuza-sroka'],
      [2, 'Zuzia Trzonkowska', 'zuzia-trzonkowska'],
      [3, 'Student 3', 'student-3'],
      [4, 'Student 4', 'student-4']
    ].map(([number, name, slug]) => ({
      id: `student-${number}`, name, slug,
      primaryRole: 'Certified T0/W12 Research Assessor', secondaryRoles: ['Flexible Assessor'],
      teamCategories: ['T0/W12 flexible assessment pool'], status: number === 4 ? 'Onboarding' : 'Active',
      availability: number % 2 ? ['Czwartek', 'Piątek'] : ['Piątek'],
      backupMemberId: `student-${number === 4 ? 1 : number + 1}`, supervisorId: 'karol',
      openTasksCount: number === 4 ? 3 : 1, nextAssignmentId: number < 3 ? 'block-001' : 'block-002',
      certifications: number === 4 ? ['Program pełnej certyfikacji — w toku'] : ['T0/W12 core stations'],
      notesPublic: 'Docelowo pełna certyfikacja wszystkich podstawowych stacji i wzajemna zastępowalność.',
      responsibilities: ['Stacje T0/W12 po certyfikacji', 'CRF completeness', 'Pomiary T0 i W12'],
      exclusions: ['Formalna kwalifikacja', 'Tanner staging', 'Randomizacja', 'Safety escalation', 'Zmiany protokołu']
    })),
    {
      id: 'data-qc-vacant', name: 'VACANT', slug: 'data-qc-vacant',
      primaryRole: 'Data and Documentation Coordinator', secondaryRoles: ['Tymczasowy nadzór PI'],
      teamCategories: ['Core operations'], status: 'Vacant', availability: ['Nieobsadzone'],
      backupMemberId: 'pi', supervisorId: 'pi', openTasksCount: 6, nextAssignmentId: null,
      certifications: [], notesPublic: 'Rola nieobsadzona; tymczasowy nadzór sprawuje PI.',
      responsibilities: ['CRF completeness', 'Missing-data report', 'Data queries', 'Deviation log', 'Wersjonowanie dokumentów', 'Database lock readiness'],
      exclusions: []
    }
  ];

  const makeTimeline = (participantId, currentIndex, overdueIndex = -1) =>
    timelineStages.map((stage, index) => ({
      id: `${participantId}-stage-${index + 1}`, participantId, stageType: stage,
      plannedDate: index <= currentIndex + 1 ? `2026-${String(7 + Math.floor(index / 5)).padStart(2, '0')}-${String(2 + (index * 3) % 24).padStart(2, '0')}` : null,
      completedDate: index < currentIndex ? `2026-${String(7 + Math.floor(index / 5)).padStart(2, '0')}-${String(1 + (index * 3) % 24).padStart(2, '0')}` : null,
      ownerId: index < 3 ? 'magda' : index < 10 ? (index === 8 ? 'filip' : 'karol') : index < 15 ? 'alicja' : 'julia',
      assessorIds: index < currentIndex ? ['student-1'] : [],
      status: index < currentIndex ? 'Completed' : index === overdueIndex ? 'Overdue' : index === currentIndex ? 'In progress' : 'Not started',
      requiredDocuments: index === 2 ? ['Kwalifikacja lekarska'] : index === 3 ? ['CRF T0', 'PROM'] : [],
      completenessPercent: index < currentIndex ? 100 : index === currentIndex ? 65 : 0,
      deviationIds: [], notes: ''
    }));

  const participantSeed = [
    ['LEAP-001', 'LEAP-PHEN', 'OSD', 'M', '13–15', 'Piłka nożna', 'Active', 'LLLT/sham 1–10', 8, ['LLLT 6/10']],
    ['LEAP-002', 'LEAP-REHAB', 'OSD', 'F', '13–15', 'Koszykówka', 'Active', 'REHAB W8', 13, ['REHAB W8']],
    ['LEAP-003', 'LEAP-REHAB', 'Sever', 'M', '10–12', 'Lekkoatletyka', 'Active', 'REHAB W4', 12, ['REHAB W4']],
    ['LEAP-004', 'LEAP-REHAB', 'OSD', 'M', '13–15', 'Siatkówka', 'Active', 'Follow-up', 15, ['Follow-up overdue']],
    ['LEAP-005', 'LEAP-REHAB', 'OSD', 'F', '13–15', 'Piłka ręczna', 'Active', 'REHAB W12', 14, ['OxAFQ-C W12 missing']],
    ['LEAP-006', 'LEAP-PHEN', 'Sever', 'M', '10–12', 'Piłka nożna', 'Screening', 'T0', 3, []],
    ['LEAP-007', 'LEAP-PHEN', 'OSD', 'F', '13–15', 'Biegi', 'Candidate', 'Pre-screening telefoniczny', 1, []],
    ['LEAP-008', 'LEAP-PHEN', 'Sever', 'M', '10–12', 'Tenis', 'Active', 'T1', 9, []],
    ['LEAP-009', 'LEAP-PHEN', 'OSD', 'M', '13–15', 'Piłka nożna', 'Active', 'Laboratorium', 5, []],
    ['LEAP-010', 'LEAP-REHAB', 'Sever', 'F', '10–12', 'Gimnastyka', 'Active', 'REHAB W0', 11, []],
    ['CTRL-001', 'Healthy Control', 'Healthy', 'F', '13–15', 'Siatkówka', 'Screening', 'T0', 3, ['Matching pending']],
    ['CTRL-002', 'Healthy Control', 'Healthy', 'M', '10–12', 'Piłka nożna', 'Active', 'T0', 3, []],
    ['CTRL-003', 'Healthy Control', 'Healthy', 'F', '10–12', 'Pływanie', 'Candidate', 'Pre-screening telefoniczny', 1, []]
  ];

  const participants = participantSeed.map(([id, studyId, diagnosis, sex, ageBand, sport, status, currentStage, stageIndex, alerts]) => ({
    id, studyId, cohort: studyId === 'Healthy Control' ? 'Healthy control' : 'Clinical',
    diagnosis, sex, ageBand, sport, status, currentStage,
    operationsCoordinatorId: 'magda',
    moduleOwnerIds: diagnosis === 'OSD' ? ['alicja'] : diagnosis === 'Sever' ? ['natalia'] : ['weronika'],
    timeline: makeTimeline(id, stageIndex, id === 'LEAP-004' ? 15 : -1),
    openQueries: id === 'LEAP-005' || id === 'LEAP-009' ? 1 : 0, alerts
  }));

  const blocks = [
    {
      id: 'block-001', date: '2026-08-06', startTime: '10:00', endTime: '13:00',
      location: 'GUMed, Zakład Immunobiologii i Mikrobiologii Środowiska, ul. Dębinki 7, budynek 15, II piętro',
      type: 'T0', participantIds: ['LEAP-006', 'LEAP-007', 'CTRL-001'], clinicalLeadId: 'karol',
      rooms: 3, status: 'Ready with warnings', readinessScore: 82,
      notes: 'Kontrola gotowości OpenCap o 09:30.',
      stationAssignments: [
        ['registration', 'julia', 'weronika', '10:00', '13:00', ['LEAP-006', 'LEAP-007', 'CTRL-001'], 'Certified'],
        ['anthropometry', 'student-1', 'tymon', '10:00', '12:00', ['LEAP-006', 'LEAP-007'], 'Certified'],
        ['rom', 'student-2', 'julia', '10:00', '13:00', ['LEAP-006', 'CTRL-001'], 'Certified'],
        ['ybt', 'weronika', 'student-3', '10:00', '13:00', ['LEAP-007', 'CTRL-001'], 'Certified'],
        ['hhd-q', 'nikodem', null, '10:00', '12:00', ['LEAP-006', 'LEAP-007'], 'Certified'],
        ['opencap-recording', 'maciej', 'weronika', '10:00', '13:00', ['LEAP-006', 'CTRL-001'], 'Certified']
      ]
    },
    {
      id: 'block-002', date: '2026-08-07', startTime: '09:00', endTime: '13:00',
      location: 'GUMed, Zakład Immunobiologii i Mikrobiologii Środowiska, ul. Dębinki 7, budynek 15, II piętro',
      type: 'Mixed', participantIds: ['LEAP-005', 'LEAP-008', 'CTRL-002'], clinicalLeadId: 'pi',
      rooms: 4, status: 'Staffing gap', readinessScore: 68,
      notes: 'Brak zastępcy HHD; możliwe wydłużenie do 14:00.',
      stationAssignments: [
        ['registration', 'julia', 'student-1', '09:00', '13:00', ['LEAP-005', 'LEAP-008', 'CTRL-002'], 'Certified'],
        ['prom', 'marta', 'julia', '09:00', '11:00', ['LEAP-005'], 'Certified'],
        ['pain-provocation', 'karol', 'mateusz-nowosad', '09:00', '12:00', ['LEAP-005', 'LEAP-008'], 'Certified'],
        ['ybt', 'weronika', 'student-2', '09:00', '13:00', ['CTRL-002'], 'Certified'],
        ['hhd-q', 'nikodem', null, '09:00', '12:00', ['LEAP-005', 'LEAP-008'], 'Certified'],
        ['t1-blinded', 'student-3', 'julia', '10:00', '12:00', ['LEAP-008'], 'Supervised']
      ]
    },
    {
      id: 'block-003', date: '2026-08-13', startTime: '10:00', endTime: '13:00',
      location: 'GUMed, Zakład Immunobiologii i Mikrobiologii Środowiska, ul. Dębinki 7, budynek 15, II piętro',
      type: 'T0', participantIds: ['LEAP-009', 'CTRL-003'], clinicalLeadId: 'karol',
      rooms: 3, status: 'Draft', readinessScore: 54, notes: 'Do potwierdzenia dostępność lekarza.',
      stationAssignments: [
        ['anthropometry', 'tymon', 'student-1', '10:00', '12:00', ['LEAP-009', 'CTRL-003'], 'Certified'],
        ['opencap-recording', 'maciej', 'weronika', '10:00', '13:00', ['LEAP-009'], 'Certified']
      ]
    },
    {
      id: 'block-004', date: '2026-08-14', startTime: '09:00', endTime: '14:00',
      location: 'GUMed, Zakład Immunobiologii i Mikrobiologii Środowiska, ul. Dębinki 7, budynek 15, II piętro',
      type: 'W12', participantIds: ['LEAP-002', 'LEAP-003', 'LEAP-010'], clinicalLeadId: 'mateusz-nowosad',
      rooms: 4, status: 'Planned', readinessScore: 76, notes: 'Blok W12; utrzymać operatorów z T0, jeśli możliwe.',
      stationAssignments: [
        ['prom', 'julia', 'marta', '09:00', '13:00', ['LEAP-002', 'LEAP-003', 'LEAP-010'], 'Certified'],
        ['rom', 'tymon', 'student-2', '09:00', '13:00', ['LEAP-002', 'LEAP-003'], 'Certified'],
        ['hhd-q', 'nikodem', 'student-3', '09:00', '13:00', ['LEAP-002', 'LEAP-010'], 'Certified']
      ]
    }
  ].map(block => {
    const stationAssignments = block.stationAssignments.map((assignment, index) => ({
      id: `${block.id}-assignment-${index + 1}`, blockId: block.id,
      stationId: assignment[0], memberId: assignment[1], backupMemberId: assignment[2],
      startTime: assignment[3], endTime: assignment[4], participantIds: assignment[5],
      competencyStatusAtAssignment: assignment[6], conflictWarnings: [], status: 'Planned'
    }));
    const invitedMemberIds = [...new Set([
      block.clinicalLeadId,
      ...stationAssignments.flatMap(assignment => [assignment.memberId, assignment.backupMemberId])
    ].filter(Boolean))];
    return { ...block, invitedMemberIds, stationAssignments };
  });

  const competencies = [];
  const certifiedCore = ['registration', 'prom', 'nprs', 'anthropometry', 'tanita', 'rom', 'muscle-length', 'beighton', 'fpi', 'ybt', 'hhd-q', 'hhd-h', 'hhd-pf', 'pain-provocation', 'movement-quality', 'opencap-setup', 'opencap-recording', 'crf'];
  const personSkillMap = {
    pi: ['screening', 'consent', 'pain-provocation', 'data-qc'],
    karol: ['screening', 'consent', 'nprs', 'rom', 'muscle-length', 'beighton', 'fpi', 'ybt', 'hhd-q', 'hhd-h', 'hhd-pf', 'pain-provocation', 'movement-quality', 'crf'],
    'mateusz-nowosad': ['screening', 'nprs', 'rom', 'hhd-q', 'hhd-h', 'hhd-pf', 'pain-provocation', 'movement-quality'],
    filip: ['lllt'],
    maciej: ['opencap-setup', 'opencap-recording', 'opencap-files', 'data-qc'],
    alicja: ['prom', 'nprs', 'rom', 'movement-quality', 'rehab-osd', 'crf'],
    natalia: ['prom', 'nprs', 'rehab-sever', 'crf'],
    weronika: ['registration', 'prom', 'anthropometry', 'tanita', 'ybt', 'opencap-setup', 'crf'],
    julia: ['registration', 'prom', 'anthropometry', 'nprs', 'crf', 'follow-up'],
    marta: ['prom'], sandra: ['prom'],
    nikodem: ['hhd-q', 'hhd-h', 'hhd-pf', 'pain-provocation'],
    tymon: ['anthropometry', 'tanita', 'rom', 'muscle-length']
  };

  team.forEach(member => {
    stationCatalog.forEach(station => {
      let status = personSkillMap[member.id]?.includes(station.id) ? 'Certified' : 'Not trained';
      if (member.id.startsWith('student-')) {
        const number = Number(member.id.slice(-1));
        const index = certifiedCore.indexOf(station.id);
        status = index < 0 ? 'Not trained' : number === 4 ? 'Training' : index % 4 < number ? 'Certified' : 'Supervised';
      }
      if (member.id === 'natalia' && station.id === 'rehab-sever') status = 'Supervised';
      if (member.id === 'student-3' && station.id === 't1-blinded') status = 'Supervised';
      if ((member.id === 'julia' || member.id === 'weronika') && certifiedCore.includes(station.id) && status === 'Not trained') status = 'Training';
      if (member.id === 'data-qc-vacant') status = 'Not trained';
      competencies.push({
        id: `${member.id}-${station.id}`, memberId: member.id, stationId: station.id, status,
        trainerId: status === 'Not trained' ? null : 'karol',
        trainingDate: status === 'Not trained' ? null : '2026-06-12',
        certifiedDate: status === 'Certified' ? '2026-07-04' : null,
        lastAuditDate: status === 'Certified' ? '2026-07-18' : null,
        trainingTrials: status === 'Certified' ? 7 : status === 'Training' ? 3 : 0,
        supervisedSessions: status === 'Certified' ? 3 : status === 'Supervised' ? 2 : 0,
        sopDocumentId: `sop-${station.id}`, notes: ''
      });
    });
  });

  const moduleRecords = [
    { id: 'lllt-001', participantId: 'LEAP-001', moduleType: 'LLLT/sham', ownerId: 'filip', status: 'In progress', adherence: 60, sessions: 6, totalSessions: 10, nextAction: 'Sesja 7', nextActionDate: '2026-08-01', dataCompleteness: 100, blinding: 'Maintained', alerts: [] },
    { id: 'lllt-008', participantId: 'LEAP-008', moduleType: 'LLLT/sham', ownerId: 'filip', status: 'Completed', adherence: 100, sessions: 10, totalSessions: 10, nextAction: 'Zaślepiona ocena T1', nextActionDate: '2026-08-07', dataCompleteness: 95, blinding: 'Maintained', alerts: ['T1 assessor required'] },
    { id: 'rehab-002', participantId: 'LEAP-002', moduleType: 'REHAB OSD', ownerId: 'alicja', status: 'In progress', adherence: 88, week: 'W8', ltp: 'Completed', deficitModule: 'Strength', secondModule: 'Motor control', nextAction: 'W12', nextActionDate: '2026-08-14', dataCompleteness: 92, alerts: [] },
    { id: 'rehab-003', participantId: 'LEAP-003', moduleType: 'REHAB Sever', ownerId: 'natalia', status: 'In progress', adherence: 74, week: 'W4', ltp: 'Completed', deficitModule: 'ROM', secondModule: null, nextAction: 'W8', nextActionDate: '2026-08-12', dataCompleteness: 84, alerts: ['Dzienniczek: 1 tydzień brak'] },
    { id: 'rehab-010', participantId: 'LEAP-010', moduleType: 'REHAB Sever', ownerId: 'natalia', status: 'Planned', adherence: 0, week: 'W0', ltp: 'Pending', deficitModule: null, secondModule: null, nextAction: 'W0 + LTP', nextActionDate: '2026-08-05', dataCompleteness: 45, alerts: [] },
    { id: 'control-001', participantId: 'CTRL-001', moduleType: 'Healthy control', ownerId: 'weronika', status: 'Screening', matchingStatus: 'Candidate', matchedCaseId: 'LEAP-005', nextAction: 'Potwierdź matching', nextActionDate: '2026-08-03', dataCompleteness: 50, alerts: ['Matching pending'] },
    { id: 'control-002', participantId: 'CTRL-002', moduleType: 'Healthy control', ownerId: 'weronika', status: 'Active', matchingStatus: 'Matched', matchedCaseId: 'LEAP-006', nextAction: 'T0', nextActionDate: '2026-08-07', dataCompleteness: 80, alerts: [] },
    { id: 'control-003', participantId: 'CTRL-003', moduleType: 'Healthy control', ownerId: 'weronika', status: 'Candidate', matchingStatus: 'Unmatched', matchedCaseId: null, nextAction: 'Pre-screening', nextActionDate: '2026-08-04', dataCompleteness: 20, alerts: [] },
    { id: 'follow-004', participantId: 'LEAP-004', moduleType: 'Follow-up', ownerId: 'julia', status: 'Overdue', contactAttempt: 2, contactWindow: '2026-07-20–2026-07-27', returnToSport: 'Unknown', recurrence: 'Unknown', nextAction: 'Próba kontaktu 3', nextActionDate: '2026-07-29', dataCompleteness: 25, alerts: ['Follow-up overdue'] }
  ];

  const dataQueries = [
    { id: 'dq-001', participantId: 'LEAP-005', moduleType: 'REHAB OSD', fieldOrFile: 'KOOS-Child W12', issueType: 'missing PROM', description: 'Brakuje formularza KOOS-Child dla W12.', assignedToId: 'alicja', createdById: 'pi', createdAt: '2026-07-30', dueDate: '2026-07-31', status: 'Open', reminders: 1, resolution: '' },
    { id: 'dq-002', participantId: 'LEAP-009', moduleType: 'T0', fieldOrFile: 'OpenCap LEAP-009_T0', issueType: 'OpenCap QC failed', description: 'Nieprawidłowa kalibracja kamery 3; wymagany ponowny QC.', assignedToId: 'maciej', createdById: 'pi', createdAt: '2026-07-27', dueDate: '2026-07-29', status: 'Overdue', reminders: 2, resolution: '' },
    { id: 'dq-003', participantId: 'LEAP-003', moduleType: 'REHAB Sever', fieldOrFile: 'Dzienniczek W3', issueType: 'missing CRF', description: 'Brak jednego tygodnia dzienniczka aktywności.', assignedToId: 'natalia', createdById: 'magda', createdAt: '2026-07-29', dueDate: '2026-08-02', status: 'In progress', reminders: 0, resolution: '' },
    { id: 'dq-004', participantId: 'LEAP-008', moduleType: 'LLLT/sham', fieldOrFile: 'Sesja 4', issueType: 'protocol deviation', description: 'Sesja wykonana 28 godzin po planowanym oknie; deviation niewielki.', assignedToId: 'filip', createdById: 'filip', createdAt: '2026-07-25', dueDate: '2026-08-01', status: 'Open', reminders: 0, resolution: '' },
    { id: 'dq-005', participantId: 'LEAP-004', moduleType: 'Follow-up', fieldOrFile: 'Formularz follow-up', issueType: 'follow-up overdue', description: 'Dwie nieskuteczne próby kontaktu.', assignedToId: 'julia', createdById: 'magda', createdAt: '2026-07-28', dueDate: '2026-07-30', status: 'Overdue', reminders: 2, resolution: '' },
    { id: 'dq-006', participantId: 'LEAP-001', moduleType: 'LLLT/sham', fieldOrFile: 'AE log', issueType: 'adverse event incomplete', description: 'Łagodne przejściowe zaczerwienienie — brak finalnej klasyfikacji.', assignedToId: 'filip', createdById: 'filip', createdAt: '2026-07-31', dueDate: '2026-08-01', status: 'Open', reminders: 0, resolution: '' }
  ];

  const tasks = [
    { id: 'task-001', priority: 'High', subject: 'LEAP-005', description: 'Brakuje KOOS-Child W12', ownerId: 'alicja', dueDate: '2026-07-31', status: 'Open', targetView: 'data-quality' },
    { id: 'task-002', priority: 'Critical', subject: 'LEAP-009', description: 'OpenCap QC niezatwierdzony — 2 dni po terminie', ownerId: 'maciej', dueDate: '2026-07-29', status: 'Overdue', targetView: 'data-quality' },
    { id: 'task-003', priority: 'High', subject: 'LLLT', description: 'Operator zastępczy nieprzypisany na 7 sierpnia', ownerId: 'filip', dueDate: '2026-08-02', status: 'Open', targetView: 'modules' },
    { id: 'task-004', priority: 'High', subject: 'T0 piątek', description: 'Brak jednej osoby na stacji HHD', ownerId: 'magda', dueDate: '2026-08-03', status: 'Open', targetView: 'stations' },
    { id: 'task-005', priority: 'Medium', subject: 'Student 4', description: 'Dokończyć pięć prób treningowych YBT', ownerId: 'karol', dueDate: '2026-08-10', status: 'In progress', targetView: 'competencies' }
  ];

  const documents = [
    ['sop-master', 'Master Protocol v1.1', 'Master Protocol', '1.1', 'Active', '2026-03-01', 'pi', '#'],
    ['sop-screening', 'SOP screeningu i kwalifikacji', 'screening', '1.2', 'Active', '2026-06-10', 'karol', '#'],
    ['sop-consent', 'SOP consent/assent', 'consent/assent', '1.0', 'Active', '2026-05-15', 'pi', '#'],
    ['sop-t0', 'SOP bloku T0', 'T0', '2.0', 'Active', '2026-07-01', 'karol', '#'],
    ['sop-rom', 'SOP ROM i długości mięśni', 'ROM', '1.1', 'Active', '2026-07-05', 'karol', '#'],
    ['sop-hhd-q', 'SOP HHD kończyny dolnej', 'HHD', '1.3', 'Active', '2026-07-12', 'karol', '#'],
    ['sop-ybt', 'SOP Y-Balance Test', 'YBT', '1.0', 'Active', '2026-06-20', 'karol', '#'],
    ['sop-opencap-recording', 'SOP OpenCap acquisition', 'OpenCap', '1.2', 'Active', '2026-07-18', 'maciej', '#'],
    ['sop-lllt', 'SOP LLLT/sham', 'LLLT/sham', '2.1', 'Active', '2026-07-25', 'filip', '#'],
    ['sop-rehab-osd', 'Algorytm REHAB Osgood–Schlatter', 'REHAB OSD', '1.0', 'Draft', '2026-08-05', 'alicja', '#'],
    ['sop-rehab-sever', 'Algorytm REHAB Sever', 'REHAB Sever', '0.9', 'Draft', '2026-08-05', 'natalia', '#'],
    ['sop-follow-up', 'SOP follow-up', 'follow-up', '0.8', 'Draft', '2026-08-10', 'julia', '#'],
    ['sop-data-qc', 'SOP Data Quality i queries', 'data management', '1.0', 'Active', '2026-07-15', 'pi', '#'],
    ['sop-file-naming', 'Konwencja nazw plików', 'file naming', '1.1', 'Active', '2026-07-20', 'maciej', '#'],
    ['sop-archived', 'SOP T0 — wersja historyczna', 'T0', '1.0', 'Archived', '2026-03-01', 'karol', '#']
  ].map(([id, title, category, version, status, effectiveDate, ownerId, url], index) => ({
    id, title, category, version, status, effectiveDate, ownerId, url,
    lastModified: effectiveDate,
    acknowledgements: team.filter(member => member.status !== 'Vacant' && (index + member.name.length) % 3 !== 0).map(member => member.id)
  }));

  const auditLog = [
    { id: 'log-001', at: '2026-07-31 09:12', userId: 'magda', action: 'Zmieniono termin T0 dla LEAP-006' },
    { id: 'log-002', at: '2026-07-31 08:48', userId: 'maciej', action: 'Zgłoszono OpenCap QC failure dla LEAP-009' },
    { id: 'log-003', at: '2026-07-30 16:22', userId: 'filip', action: 'Uzupełniono sesję LLLT 6/10 dla LEAP-001' },
    { id: 'log-004', at: '2026-07-30 12:05', userId: 'karol', action: 'Certyfikowano Zuzia Trzonkowska — ROM' },
    { id: 'log-005', at: '2026-07-29 15:41', userId: 'julia', action: 'Dodano drugą próbę kontaktu follow-up LEAP-004' }
  ];

  window.LEAP_DEMO_DATA = {
    version: 2,
    meta: {
      projectName: 'LEAP Research Operations',
      activeDateRange: '31 lipca – 14 sierpnia 2026',
      location: 'GUMed, Zakład Immunobiologii i Mikrobiologii Środowiska, ul. Dębinki 7, budynek 15, II piętro',
      generatedAt: '2026-07-31',
      demo: true
    },
    roles: [
      { id: 'pi-admin', label: 'PI / Admin', memberId: 'pi' },
      { id: 'operations', label: 'Operations Coordinator', memberId: 'magda' },
      { id: 'module-owner', label: 'Module Owner', memberId: 'filip' },
      { id: 'assessor', label: 'Assessor', memberId: 'student-1' },
      { id: 'unblinded', label: 'Unblinded Intervention Operator', memberId: 'filip' },
      { id: 'viewer', label: 'Viewer', memberId: 'marta' }
    ],
    stations: stationCatalog,
    team, competencies, participants, blocks, moduleRecords, dataQueries, tasks, documents, auditLog,
    notificationOutbox: []
  };
})();
