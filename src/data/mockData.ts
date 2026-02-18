import { Question, Flashcard, UserProgress, Subject } from "@/types/study";

export const subjects: Subject[] = [
  { id: "1", name: "Direito Penal", icon: "⚖️", questionCount: 240, color: "hsl(0 72% 55%)" },
  { id: "2", name: "Direito Constitucional", icon: "📜", questionCount: 180, color: "hsl(217 91% 60%)" },
  { id: "3", name: "Legislação Especial", icon: "📋", questionCount: 150, color: "hsl(142 71% 45%)" },
  { id: "4", name: "Direito Administrativo", icon: "🏛️", questionCount: 120, color: "hsl(38 92% 55%)" },
  { id: "5", name: "Direitos Humanos", icon: "🤝", questionCount: 90, color: "hsl(271 68% 60%)" },
  { id: "6", name: "Português", icon: "📝", questionCount: 200, color: "hsl(190 80% 50%)" },
];

export const mockQuestions: Question[] = [
  {
    id: "q1",
    subjectId: "1",
    topic: "Crimes contra a pessoa",
    subtopic: "Homicídio",
    difficulty: "média",
    year: 2023,
    board: "FUMARC",
    organ: "PCMG",
    statement: "De acordo com o Código Penal, o homicídio qualificado é considerado crime hediondo. Sobre as qualificadoras do homicídio, assinale a alternativa CORRETA:",
    options: [
      { id: "a", text: "O motivo torpe é aquele que, por sua natureza, demonstra depravação moral do agente." },
      { id: "b", text: "O uso de veneno só qualifica o homicídio quando a vítima tem conhecimento da ingestão." },
      { id: "c", text: "A emboscada não é considerada meio que dificulte a defesa da vítima." },
      { id: "d", text: "O feminicídio foi incluído como qualificadora pela Lei nº 12.033/2009." },
    ],
    correctOption: "a",
    explanation: "A alternativa A está correta. O motivo torpe é aquele moralmente reprovável, que causa repugnância à consciência média da sociedade. Ex.: matar por herança, por dívida de jogo. As demais alternativas apresentam erros: B) o veneno qualifica independente do conhecimento da vítima (dissimulação); C) a emboscada é recurso que dificulta a defesa; D) o feminicídio foi incluído pela Lei 13.104/2015.",
  },
  {
    id: "q2",
    subjectId: "2",
    topic: "Direitos Fundamentais",
    subtopic: "Art. 5º da CF",
    difficulty: "fácil",
    year: 2022,
    board: "CESPE",
    organ: "PRF",
    statement: "Considerando os direitos e garantias fundamentais previstos no art. 5º da Constituição Federal, assinale a alternativa INCORRETA:",
    options: [
      { id: "a", text: "A casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador." },
      { id: "b", text: "É livre a manifestação do pensamento, sendo vedado o anonimato." },
      { id: "c", text: "A prática do racismo constitui crime inafiançável e prescritível." },
      { id: "d", text: "Ninguém será privado de direitos por motivo de crença religiosa." },
    ],
    correctOption: "c",
    explanation: "A alternativa C é a INCORRETA (gabarito da questão). O racismo constitui crime inafiançável e IMPRESCRITÍVEL, conforme art. 5º, XLII da CF/88. As demais alternativas estão corretas conforme o texto constitucional.",
  },
  {
    id: "q3",
    subjectId: "1",
    topic: "Crimes contra o patrimônio",
    subtopic: "Roubo e Furto",
    difficulty: "difícil",
    year: 2023,
    board: "FUMARC",
    organ: "PMMG",
    statement: "Sobre a distinção entre furto qualificado e roubo no Código Penal brasileiro, analise as assertivas e assinale a alternativa CORRETA:",
    options: [
      { id: "a", text: "O furto mediante fraude se confunde com o estelionato em todos os casos." },
      { id: "b", text: "A grave ameaça é elementar do crime de roubo, diferenciando-o do furto." },
      { id: "c", text: "O furto qualificado por escalada tem pena maior que o roubo simples." },
      { id: "d", text: "O roubo impróprio ocorre quando a violência é empregada antes da subtração." },
    ],
    correctOption: "b",
    explanation: "A alternativa B está correta. O roubo (art. 157 do CP) exige violência ou grave ameaça como elementar do tipo, o que o diferencia essencialmente do furto (art. 155). No furto, a subtração ocorre sem violência ou grave ameaça à pessoa.",
  },
];

export const mockFlashcards: Flashcard[] = [
  {
    id: "f1",
    subjectId: "1",
    topic: "Excludentes de Ilicitude",
    front: "Quais são as excludentes de ilicitude previstas no art. 23 do Código Penal?",
    back: "1. Estado de necessidade\n2. Legítima defesa\n3. Estrito cumprimento do dever legal\n4. Exercício regular de direito",
  },
  {
    id: "f2",
    subjectId: "2",
    topic: "Princípios Fundamentais",
    front: "Quais são os fundamentos da República Federativa do Brasil (Art. 1º CF)?",
    back: "I - Soberania\nII - Cidadania\nIII - Dignidade da pessoa humana\nIV - Valores sociais do trabalho e da livre iniciativa\nV - Pluralismo político\n\nMnemônico: SO-CI-DI-VA-PLU",
  },
  {
    id: "f3",
    subjectId: "3",
    topic: "Lei Maria da Penha",
    front: "Qual o conceito de violência doméstica segundo a Lei 11.340/2006?",
    back: "Qualquer ação ou omissão baseada no gênero que cause morte, lesão, sofrimento físico, sexual ou psicológico e dano moral ou patrimonial, no âmbito da unidade doméstica, da família ou em relação íntima de afeto.",
  },
  {
    id: "f4",
    subjectId: "1",
    topic: "Crimes contra a Administração",
    front: "Qual a diferença entre corrupção ativa e passiva?",
    back: "Corrupção PASSIVA (art. 317): Funcionário público solicita ou recebe vantagem indevida.\n\nCorrupção ATIVA (art. 333): Particular oferece ou promete vantagem indevida ao funcionário público.",
  },
];

export const mockProgress: UserProgress = {
  streak: 7,
  xp: 1250,
  level: 4,
  rank: "Cabo",
  dailyGoal: { questionsTarget: 10, questionsCompleted: 6, flashcardsTarget: 10, flashcardsCompleted: 8 },
  weeklyXp: [80, 120, 95, 150, 110, 0, 0],
  subjectPerformance: [
    { subjectId: "1", name: "Direito Penal", accuracy: 72, totalAttempts: 85 },
    { subjectId: "2", name: "Direito Constitucional", accuracy: 65, totalAttempts: 60 },
    { subjectId: "3", name: "Legislação Especial", accuracy: 80, totalAttempts: 40 },
    { subjectId: "4", name: "Direito Administrativo", accuracy: 55, totalAttempts: 30 },
    { subjectId: "5", name: "Direitos Humanos", accuracy: 88, totalAttempts: 25 },
    { subjectId: "6", name: "Português", accuracy: 70, totalAttempts: 50 },
  ],
};

export const ranks = [
  { level: 1, name: "Recruta", xpRequired: 0 },
  { level: 2, name: "Soldado", xpRequired: 200 },
  { level: 3, name: "Cabo", xpRequired: 500 },
  { level: 4, name: "Sargento", xpRequired: 1000 },
  { level: 5, name: "Subtenente", xpRequired: 2000 },
  { level: 6, name: "Tenente", xpRequired: 3500 },
  { level: 7, name: "Capitão", xpRequired: 5500 },
  { level: 8, name: "Major", xpRequired: 8000 },
  { level: 9, name: "Coronel", xpRequired: 12000 },
  { level: 10, name: "Delegado", xpRequired: 18000 },
];
