import { supabase } from '@/lib/supabase';

export interface UserSettings {
  user_id: string;
  display_name: string | null;
  daily_questions_target: number;
  daily_flashcards_target: number;
  created_at: string;
  updated_at: string;
}

export const userSettingsService = {
  // Buscar configurações do usuário
  async get(): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Se não existir, criar com valores padrão
      if (error.code === 'PGRST116') {
        return await this.create();
      }
      console.error('Erro ao buscar configurações:', error);
      return null;
    }

    return data;
  },

  // Criar configurações padrão
  async create(): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        display_name: null,
        daily_questions_target: 10,
        daily_flashcards_target: 10,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar configurações:', error);
      return null;
    }

    return data;
  },

  // Atualizar configurações
  async update(updates: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configurações:', error);
      return null;
    }

    return data;
  },
};

