import { supabase } from '@/lib/supabase';
import { questionsService } from './questions';
import { attemptsService } from './attempts';

export interface SubjectPerformance {
  subjectId: string;
  name: string;
  accuracy: number;
  totalAttempts: number;
  correct: number;
  incorrect: number;
}

export const performanceService = {
  // Calcular desempenho por matéria
  async getSubjectPerformance(): Promise<SubjectPerformance[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    // Buscar todas as tentativas do usuário com informações das questões
    const attempts = await attemptsService.getUserAttempts();
    
    if (attempts.length === 0) {
      return [];
    }

    // Buscar todas as questões relacionadas às tentativas
    const questionIds = Array.from(new Set(attempts.map(a => a.question_id)));
    
    // Buscar questões em lotes (Supabase tem limite de 1000 por query)
    const allQuestions: any[] = [];
    for (let i = 0; i < questionIds.length; i += 100) {
      const batch = questionIds.slice(i, i + 100);
      const { data } = await supabase
        .from('questions')
        .select('id, subject_id')
        .in('id', batch);
      
      if (data) {
        allQuestions.push(...data);
      }
    }

    // Criar mapa de question_id -> subject_id
    const questionToSubject = new Map(
      allQuestions.map(q => [q.id, q.subject_id])
    );

    // Buscar todas as matérias
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name');

    if (!subjects) {
      return [];
    }

    // Calcular estatísticas por matéria
    const performanceMap = new Map<string, { correct: number; total: number }>();

    attempts.forEach(attempt => {
      const subjectId = questionToSubject.get(attempt.question_id);
      if (!subjectId) return;

      if (!performanceMap.has(subjectId)) {
        performanceMap.set(subjectId, { correct: 0, total: 0 });
      }

      const stats = performanceMap.get(subjectId)!;
      stats.total++;
      if (attempt.is_correct) {
        stats.correct++;
      }
    });

    // Converter para array de SubjectPerformance
    return subjects.map(subject => {
      const stats = performanceMap.get(subject.id) || { correct: 0, total: 0 };
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

      return {
        subjectId: subject.id,
        name: subject.name,
        accuracy: Math.round(accuracy * 10) / 10, // Arredondar para 1 casa decimal
        totalAttempts: stats.total,
        correct: stats.correct,
        incorrect: stats.total - stats.correct,
      };
    }).filter(p => p.totalAttempts > 0); // Apenas matérias com tentativas
  },
};

