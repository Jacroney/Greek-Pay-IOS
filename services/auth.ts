import { supabase } from './supabase';
import { UserProfile } from '../types';

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  chapter_id?: string;
  phone_number?: string;
  year?: string;
  major?: string;
}

export const AuthService = {
  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    return { user: authData?.user ?? null, error };
  },

  async signUp(data: SignUpData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          chapter_id: data.chapter_id,
          phone_number: data.phone_number,
          year: data.year,
          major: data.major,
        },
      },
    });

    return { user: authData?.user ?? null, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: Error | null }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { profile: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { profile: null, error: new Error(error.message) };
    }

    return { profile: data as UserProfile, error: null };
  },

  async resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'greekpay://reset-password',
    });
    return { error };
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },

  async deleteAccount() {
    const user = await this.getCurrentUser();
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    // Call Supabase RPC to delete user data and auth account
    const { error } = await supabase.rpc('delete_user_account');

    if (error) {
      return { error: new Error(error.message) };
    }

    // Sign out locally after deletion
    await supabase.auth.signOut();
    return { error: null };
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
};
