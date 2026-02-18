import { supabase } from '@/lib/supabase';
import { optionsService } from './options';

export interface Question {
  id: string;
  source: string;
  ext_id: number;
  subject_id: string;
  tema: string;
  subtema: string | null;
  tipo: string;
  statement: string;
  explanation: string | null;
  correct_letter: 'A' | 'B' | 'C' | 'D' | 'E';
  cursos: string | null;
  image_ref: string | null;
  created_at: string;
}

export interface QuestionWithOptions extends Question {
  options: Array<{
    id: string;
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
    is_correct: boolean;
  }>;
}

export const questionsService = {
  // Buscar questões com filtros opcionais
  async getAll(filters?: {
    subjectId?: string;
    tema?: string;
    subtema?: string;
    tipo?: string;
    limit?: number;
    offset?: number;
  }): Promise<QuestionWithOptions[]> {
    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }
    if (filters?.tema) {
      query = query.eq('tema', filters.tema);
    }
    if (filters?.subtema) {
      query = query.eq('subtema', filters.subtema);
    }
    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar questões:', error);
      throw error;
    }

    // Buscar opções para cada questão
    const questionsWithOptions = await Promise.all(
      (data || []).map(async (question) => {
        const options = await optionsService.getByQuestionId(question.id);
        return {
          ...question,
          options: options || [],
        };
      })
    );

    return questionsWithOptions;
  },

  // Buscar questão por ID
  async getById(id: string): Promise<QuestionWithOptions | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar questão:', error);
      return null;
    }

    if (!data) return null;

    const options = await optionsService.getByQuestionId(id);

    return {
      ...data,
      options: options || [],
    };
  },

  // Contar questões com filtros
  async count(filters?: {
    subjectId?: string;
    tema?: string;
    subtema?: string;
    tipo?: string;
  }): Promise<number> {
    let query = supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });

    if (filters?.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }
    if (filters?.tema) {
      query = query.eq('tema', filters.tema);
    }
    if (filters?.subtema) {
      query = query.eq('subtema', filters.subtema);
    }
    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Erro ao contar questões:', error);
      return 0;
    }

    return count || 0;
  },

  // Contar flashcards (questões com explicação)
  async countFlashcards(filters?: {
    subjectId?: string;
    tema?: string;
    subtema?: string;
  }): Promise<number> {
    let query = supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .not('explanation', 'is', null);

    if (filters?.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }
    if (filters?.tema) {
      query = query.eq('tema', filters.tema);
    }
    if (filters?.subtema) {
      query = query.eq('subtema', filters.subtema);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Erro ao contar flashcards:', error);
      return 0;
    }

    return count || 0;
  },

  // Verificar quais questões têm explicação (retorna Set de IDs)
  async getFlashcardIds(questionIds: string[]): Promise<Set<string>> {
    if (questionIds.length === 0) {
      return new Set();
    }

    // Buscar questões que têm explicação e estão na lista de IDs
    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .in('id', questionIds)
      .not('explanation', 'is', null);

    if (error) {
      console.error('Erro ao buscar flashcards:', error);
      return new Set();
    }

    return new Set((data || []).map(q => q.id));
  },
};

