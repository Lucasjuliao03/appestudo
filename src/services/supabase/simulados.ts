import { supabase } from '@/lib/supabase';

export interface Simulado {
  id: string;
  user_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
  time_spent_seconds: number;
  xp_earned: number;
  temas_selecionados: string[] | null;
  subtemas_selecionados: string[] | null;
  created_at: string;
}

export interface RankingUser {
  user_id: string;
  display_name: string | null;
  email: string;
  total_questions: number;
  total_correct: number;
  accuracy: number;
}

export const simuladosService = {
  // Criar novo simulado
  async create(simulado: {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    accuracy: number;
    time_spent_seconds: number;
    xp_earned: number;
    temas_selecionados?: string[];
    subtemas_selecionados?: string[];
  }): Promise<Simulado | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('simulados')
      .insert({
        user_id: user.id,
        ...simulado,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar simulado:', error);
      return null;
    }

    return data;
  },

  // Buscar simulados do usuário
  async getUserSimulados(limit?: number): Promise<Simulado[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    let query = supabase
      .from('simulados')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar simulados:', error);
      return [];
    }

    if (!data) return [];

    // Remover duplicatas baseado no ID
    const unique = Array.from(
      new Map(data.map(s => [s.id, s])).values()
    );

    return unique;
  },

  // Buscar ranking
  async getRanking(limit: number = 50): Promise<RankingUser[]> {
    // Usar função RPC para calcular ranking
    try {
      const { data, error } = await supabase.rpc('get_ranking', { limit_count: limit });
      
      if (error) {
        console.error('Erro ao buscar ranking via RPC:', error);
        console.log('Tentando fallback...');
        // Fallback: buscar diretamente
        return await this.getRankingFallback(limit);
      }

      if (!data || data.length === 0) {
        console.log('Nenhum dado retornado do RPC, tentando fallback...');
        return await this.getRankingFallback(limit);
      }

      // Remover duplicatas
      const unique = Array.from(
        new Map(data.map((u: RankingUser) => [u.user_id, u])).values()
      );

      return unique;
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      return await this.getRankingFallback(limit);
    }
  },

  // Fallback para ranking (quando RPC falha)
  async getRankingFallback(limit: number): Promise<RankingUser[]> {
    try {
      // Buscar todos os simulados agregados
      const { data: simulados, error } = await supabase
        .from('simulados')
        .select('user_id, total_questions, correct_answers')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar simulados no fallback:', error);
        return [];
      }

      if (!simulados || simulados.length === 0) {
        return [];
      }

      // Agregar por usuário
      const userStats = new Map<string, { total: number; correct: number }>();
      
      simulados.forEach(s => {
        const current = userStats.get(s.user_id) || { total: 0, correct: 0 };
        userStats.set(s.user_id, {
          total: current.total + s.total_questions,
          correct: current.correct + s.correct_answers,
        });
      });

      // Buscar nomes e emails dos usuários
      const ranking: RankingUser[] = [];
      const userIds = Array.from(userStats.keys());
      
      if (userIds.length === 0) {
        return [];
      }

      // Buscar settings de todos os usuários de uma vez
      const { data: allSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('user_id, display_name')
        .in('user_id', userIds);

      if (settingsError) {
        console.warn('Erro ao buscar settings no fallback:', settingsError);
      }

      const settingsMap = new Map<string, string | null>();
      allSettings?.forEach(s => {
        settingsMap.set(s.user_id, s.display_name);
      });

      // Buscar emails usando a função RPC get_user_email (em paralelo para melhor performance)
      const emailMap = new Map<string, string>();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Para o usuário atual, usar o email da sessão
      if (currentUser) {
        emailMap.set(currentUser.id, currentUser.email || '');
      }

      // Buscar emails de outros usuários em paralelo (limitado a 10 por vez para evitar sobrecarga)
      const emailPromises: Promise<void>[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (userId) => {
          if (!emailMap.has(userId)) {
            try {
              const { data: emailData, error: emailError } = await supabase.rpc('get_user_email', { 
                user_uuid: userId 
              });
              if (!emailError && emailData) {
                emailMap.set(userId, emailData);
              } else {
                // Fallback: usar parte do ID
                emailMap.set(userId, `Usuário ${userId.substring(0, 8)}...`);
              }
            } catch (err) {
              emailMap.set(userId, `Usuário ${userId.substring(0, 8)}...`);
            }
          }
        });
        emailPromises.push(...batchPromises);
      }

      // Aguardar todas as buscas de email
      await Promise.all(emailPromises);
      
      // Construir ranking
      for (const [userId, stats] of userStats.entries()) {
        const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        
        const displayName = settingsMap.get(userId) || null;
        const email = emailMap.get(userId) || `Usuário ${userId.substring(0, 8)}...`;

        ranking.push({
          user_id: userId,
          display_name: displayName,
          email,
          total_questions: stats.total,
          total_correct: stats.correct,
          accuracy: Math.round(accuracy * 100) / 100, // Arredondar para 2 casas decimais
        });
      }

      // Ordenar por total de questões e acurácia
      return ranking
        .sort((a, b) => {
          if (b.total_questions !== a.total_questions) {
            return b.total_questions - a.total_questions;
          }
          return b.accuracy - a.accuracy;
        })
        .slice(0, limit);
    } catch (err) {
      console.error('Erro no fallback de ranking:', err);
      return [];
    }
  },
};

