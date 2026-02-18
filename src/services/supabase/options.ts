import { supabase } from '@/lib/supabase';

export interface Option {
  id: string;
  question_id: string;
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  is_correct: boolean;
  created_at: string;
}

export const optionsService = {
  // Buscar opções de uma questão
  async getByQuestionId(questionId: string): Promise<Option[]> {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('question_id', questionId)
      .order('letter');

    if (error) {
      console.error('Erro ao buscar opções:', error);
      return [];
    }

    return data || [];
  },

  // Buscar opção específica
  async getById(id: string): Promise<Option | null> {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar opção:', error);
      return null;
    }

    return data;
  },
};

