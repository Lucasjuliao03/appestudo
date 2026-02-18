import { supabase } from '@/lib/supabase';

export interface Subject {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export const subjectsService = {
  // Buscar todas as matérias
  async getAll(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar matérias:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar matéria por ID
  async getById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar matéria:', error);
      return null;
    }

    return data;
  },

  // Buscar matéria por slug
  async getBySlug(slug: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Erro ao buscar matéria por slug:', error);
      return null;
    }

    return data;
  },
};

