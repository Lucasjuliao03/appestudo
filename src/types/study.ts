export interface Subject {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
  color: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  subjectId: string;
  topic: string;
  subtopic: string;
  difficulty: "fácil" | "média" | "difícil";
  year: number;
  board: string;
  organ: string;
  statement: string;
  options: QuestionOption[];
  correctOption: string;
  explanation: string;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  topic: string;
  front: string;
  back: string;
}

export interface DailyGoal {
  questionsTarget: number;
  questionsCompleted: number;
  flashcardsTarget: number;
  flashcardsCompleted: number;
}

export interface SubjectPerformance {
  subjectId: string;
  name: string;
  accuracy: number;
  totalAttempts: number;
}

export interface UserProgress {
  streak: number;
  xp: number;
  level: number;
  rank: string;
  dailyGoal: DailyGoal;
  weeklyXp: number[];
  subjectPerformance: SubjectPerformance[];
}
