import { supabase } from '@/lib/supabase';

export interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_letter: 'A' | 'B' | 'C' | 'D' | 'E';
  is_correct: boolean;
  answered_at: string;
}

export const attemptsService = {
  // Registrar uma tentativa
  async create(attempt: {
    question_id: string;
    selected_letter: 'A' | 'B' | 'C' | 'D' | 'E';
    is_correct: boolean;
  }): Promise<Attempt | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Silenciosamente retorna null se não autenticado
      // A aplicação pode funcionar sem salvar tentativas
      return null;
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id: attempt.question_id,
        selected_letter: attempt.selected_letter,
        is_correct: attempt.is_correct,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar tentativa:', error);
      return null;
    }

    return data;
  },

  // Buscar tentativas do usuário
  async getUserAttempts(filters?: {
    questionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Attempt[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Retorna array vazio se não autenticado
      return [];
    }

    let query = supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('answered_at', { ascending: false });

    if (filters?.questionId) {
      query = query.eq('question_id', filters.questionId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar tentativas:', error);
      return [];
    }

    return data || [];
  },

  // Buscar estatísticas de tentativas do usuário
  async getUserStats(): Promise<{
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { total: 0, correct: 0, incorrect: 0, accuracy: 0 };
    }

    const { data, error } = await supabase
      .from('attempts')
      .select('is_correct')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, correct: 0, incorrect: 0, accuracy: 0 };
    }

    const total = data?.length || 0;
    const correct = data?.filter(a => a.is_correct).length || 0;
    const incorrect = total - correct;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    return { total, correct, incorrect, accuracy };
  },
};

