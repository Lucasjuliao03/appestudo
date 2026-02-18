import { supabase } from '@/lib/supabase';

export interface Tema {
  tema: string;
  subtemas: string[];
}

export const filtersService = {
  // Buscar todos os temas únicos
  async getTemas(): Promise<string[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('tema')
      .order('tema');

    if (error) {
      console.error('Erro ao buscar temas:', error);
      return [];
    }

    // Remover duplicatas
    const temasUnicos = Array.from(new Set((data || []).map(q => q.tema)));
    return temasUnicos;
  },

  // Buscar subtemas de um tema específico
  async getSubtemas(tema: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('subtema')
      .eq('tema', tema)
      .not('subtema', 'is', null)
      .order('subtema');

    if (error) {
      console.error('Erro ao buscar subtemas:', error);
      return [];
    }

    // Remover duplicatas e valores nulos
    const subtemasUnicos = Array.from(
      new Set(data?.map(q => q.subtema).filter(s => s !== null) || [])
    ) as string[];
    return subtemasUnicos;
  },

  // Buscar temas com seus subtemas
  async getTemasComSubtemas(): Promise<Tema[]> {
    const temas = await this.getTemas();
    const temasComSubtemas = await Promise.all(
      temas.map(async (tema) => {
        const subtemas = await this.getSubtemas(tema);
        return { tema, subtemas };
      })
    );
    return temasComSubtemas;
  },
};

