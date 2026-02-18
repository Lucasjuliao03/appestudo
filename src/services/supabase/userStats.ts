import { supabase } from '@/lib/supabase';

export interface UserStats {
  user_id: string;
  xp_total: number;
  streak_current: number;
  streak_best: number;
  last_activity_date: string | null;
}

export const userStatsService = {
  // Buscar estatísticas do usuário
  async get(): Promise<UserStats | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Se não existir, criar registro inicial
      if (error.code === 'PGRST116') {
        return await this.create();
      }
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }

    return data;
  },

  // Criar registro inicial de estatísticas
  async create(): Promise<UserStats | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .insert({
        user_id: user.id,
        xp_total: 0,
        streak_current: 0,
        streak_best: 0,
        last_activity_date: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar estatísticas:', error);
      return null;
    }

    return data;
  },

  // Atualizar estatísticas
  async update(updates: Partial<Omit<UserStats, 'user_id'>>): Promise<UserStats | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      return null;
    }

    return data;
  },

  // Adicionar XP
  async addXP(amount: number): Promise<UserStats | null> {
    const current = await this.get();
    if (!current) {
      // Se não existe, criar registro inicial
      const created = await this.create();
      if (!created) return null;
      
      return await this.update({
        xp_total: amount,
      });
    }

    const newXp = current.xp_total + amount;
    console.log(`📊 Adicionando ${amount} XP. Atual: ${current.xp_total}, Novo: ${newXp}`);
    
    return await this.update({
      xp_total: newXp,
    });
  },

  // Atualizar streak
  async updateStreak(isCorrect: boolean): Promise<UserStats | null> {
    const current = await this.get();
    if (!current) return null;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = current.last_activity_date;

    let newStreak = current.streak_current;
    let newBest = current.streak_best;

    if (lastActivity === today) {
      // Já respondeu hoje, não atualiza streak
      return current;
    }

    if (isCorrect) {
      // Verifica se é dia consecutivo
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Dia consecutivo
          newStreak = current.streak_current + 1;
        } else if (diffDays > 1) {
          // Perdeu o streak
          newStreak = 1;
        } else {
          // Mesmo dia
          newStreak = current.streak_current;
        }
      } else {
        // Primeira atividade
        newStreak = 1;
      }

      if (newStreak > newBest) {
        newBest = newStreak;
      }
    } else {
      // Resposta incorreta não quebra o streak, mas não incrementa
      newStreak = current.streak_current;
    }

    return await this.update({
      streak_current: newStreak,
      streak_best: newBest,
      last_activity_date: today,
    });
  },
};

