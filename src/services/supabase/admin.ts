import { supabase } from '@/lib/supabase';

export interface UserProfile {
  user_id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export const adminService = {
  // Listar todos os usuários
  // Usa uma função do banco de dados que retorna usuários e perfis
  async getAllUsers(): Promise<UserProfile[]> {
    // Tentar chamar função do banco (pode ter nomes diferentes)
    const functionNames = ['get_users_with_emails', 'get_all_user_profiles', 'get_all_users_with_profiles'];
    
    for (const funcName of functionNames) {
      try {
        const { data, error } = await supabase.rpc(funcName);
        
        if (!error && data) {
          return data.map((user: any) => ({
            user_id: user.user_id,
            email: user.email || '',
            is_admin: user.is_admin || false,
            is_active: user.is_active !== false,
            created_at: user.created_at,
          }));
        }
      } catch (err) {
        // Continuar para próxima função
        console.log(`Função ${funcName} não disponível, tentando próxima...`);
      }
    }

    // Fallback: buscar perfis e tentar obter emails via função auxiliar
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      // Buscar emails usando função RPC ou tentando buscar individualmente
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Tentar buscar emails via função RPC primeiro
      const usersWithEmails = await Promise.all(
        (profiles || []).map(async (p: any) => {
          let email = '';
          
          // Se for o usuário atual, usar email direto
          if (p.user_id === currentUser?.id) {
            email = currentUser.email || '';
          } else {
            // Tentar buscar via função RPC
            try {
              const { data: emailData, error: emailError } = await supabase.rpc('get_user_email', { user_uuid: p.user_id });
              if (!emailError && emailData) {
                email = emailData;
              } else {
                // Tentar função alternativa
                const { data: altData } = await supabase.rpc('get_users_with_emails');
                if (altData) {
                  const userData = altData.find((u: any) => u.user_id === p.user_id);
                  if (userData) {
                    email = userData.email || '';
                  }
                }
              }
            } catch (err) {
              // Se todas as tentativas falharem, deixar vazio e será preenchido depois
            }
          }
          
          return {
            user_id: p.user_id,
            email: email || 'Carregando...',
            is_admin: p.is_admin || false,
            is_active: p.is_active !== false,
            created_at: p.created_at,
          };
        })
      );
      
      // Se ainda houver emails faltando, tentar buscar todos de uma vez via função
      if (usersWithEmails.some(u => u.email === 'Carregando...')) {
        try {
          const { data: allUsers } = await supabase.rpc('get_users_with_emails');
          if (allUsers) {
            allUsers.forEach((userData: any) => {
              const index = usersWithEmails.findIndex(u => u.user_id === userData.user_id);
              if (index >= 0 && usersWithEmails[index].email === 'Carregando...') {
                usersWithEmails[index].email = userData.email || 'Email não disponível';
              }
            });
          }
        } catch (err) {
          // Se falhar, manter "Carregando..." ou usar fallback
        }
      }
      
      // Substituir "Carregando..." por fallback se necessário
      return usersWithEmails.map(u => ({
        ...u,
        email: u.email === 'Carregando...' ? 'Email não disponível' : u.email,
      }));
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      throw new Error('Não foi possível carregar a lista de usuários. Execute CRIAR_FUNCAO_GET_USERS_CORRIGIDA.sql no Supabase.');
    }
  },

  // Atualizar permissões do usuário
  async updateUserPermissions(userId: string, updates: { is_admin?: boolean; is_active?: boolean }) {
    // Verificar se o perfil existe
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Atualizar perfil existente
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar permissões:', error);
        throw error;
      }

      return data;
    } else {
      // Criar novo perfil
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          is_admin: updates.is_admin || false,
          is_active: updates.is_active !== false,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar perfil:', error);
        throw error;
      }

      return data;
    }
  },

  // Autorizar usuário
  async authorizeUser(userId: string) {
    return await this.updateUserPermissions(userId, { is_active: true });
  },

  // Bloquear usuário
  async blockUser(userId: string) {
    return await this.updateUserPermissions(userId, { is_active: false });
  },

  // Tornar usuário admin
  async makeAdmin(userId: string) {
    return await this.updateUserPermissions(userId, { is_admin: true });
  },

  // Remover admin
  async removeAdmin(userId: string) {
    return await this.updateUserPermissions(userId, { is_admin: false });
  },
};

