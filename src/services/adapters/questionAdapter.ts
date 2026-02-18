import { QuestionWithOptions } from '../supabase/questions';
import { Question as UIQuestion } from '@/types/study';

/**
 * Adapta uma questão do formato Supabase para o formato usado pela UI
 */
export function adaptQuestionFromSupabase(
  supabaseQuestion: QuestionWithOptions,
  subjectName?: string
): UIQuestion {
  // Mapeia as opções do formato Supabase para o formato da UI
  const options = supabaseQuestion.options
    .sort((a, b) => a.letter.localeCompare(b.letter))
    .map((opt) => ({
      id: opt.letter.toLowerCase(),
      text: opt.text,
    }));

  // Determina dificuldade baseada em algum critério (por enquanto, padrão "média")
  // Você pode ajustar isso baseado em dados reais se tiver
  const difficulty: 'fácil' | 'média' | 'difícil' = 'média';

  return {
    id: supabaseQuestion.id,
    subjectId: supabaseQuestion.subject_id,
    topic: supabaseQuestion.tema,
    subtopic: supabaseQuestion.subtema || '',
    difficulty,
    year: new Date(supabaseQuestion.created_at).getFullYear(),
    board: 'FUMARC', // Pode vir do banco se necessário
    organ: supabaseQuestion.cursos || 'PMMG',
    statement: supabaseQuestion.statement,
    options,
    correctOption: supabaseQuestion.correct_letter.toLowerCase(),
    explanation: supabaseQuestion.explanation || '',
  };
}

