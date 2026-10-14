import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Resilient Authentication System (Login & Sign Up)', () => {
  beforeEach(async () => {
    // Clear auth state before each test
    await supabase.auth.signOut();
  });

  it('allows logging in with pre-seeded demo patron credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'patron@rcbjewelry.in',
      password: 'password123',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('patron@rcbjewelry.in');
    expect(data.session).toBeDefined();
    expect(data.session?.access_token).toBeDefined();

    // Verify session retrieval
    const { data: userData } = await supabase.auth.getUser();
    expect(userData.user?.email).toBe('patron@rcbjewelry.in');
  });

  it('allows logging in with pre-seeded admin credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@luxury.com',
      password: 'admin123',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.user_metadata?.role).toBe('admin');
    expect(data.user?.app_metadata?.role).toBe('admin');
  });

  it('returns clean error for invalid password', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'patron@rcbjewelry.in',
      password: 'wrongpassword',
    });

    expect(data.user).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toContain('Invalid email or password');
  });

  it('allows creating a new royal account and immediately logs the user in', async () => {
    const testEmail = `royal.patron.${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'SecurePass987!',
      options: {
        data: {
          role: 'customer',
          full_name: 'Maharaja Vikram'
        }
      }
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(testEmail);
    expect(data.user?.user_metadata?.full_name).toBe('Maharaja Vikram');
    expect(data.session).toBeDefined();

    // Verify session persists
    const { data: sessionData } = await supabase.auth.getSession();
    expect(sessionData.session?.user.email).toBe(testEmail);

    // Can sign out
    await supabase.auth.signOut();
    const { data: afterSignOut } = await supabase.auth.getUser();
    expect(afterSignOut.user).toBeNull();

    // Can sign back in with newly created credentials
    const { data: reSignIn, error: reSignInErr } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'SecurePass987!'
    });
    expect(reSignInErr).toBeNull();
    expect(reSignIn.user?.email).toBe(testEmail);
  });

  it('prevents creating duplicate accounts with the same email', async () => {
    const duplicateEmail = 'duplicate.client@luxury.in';
    
    // First creation
    const res1 = await supabase.auth.signUp({
      email: duplicateEmail,
      password: 'Password123'
    });
    expect(res1.error).toBeNull();

    // Second creation attempt with same email
    const res2 = await supabase.auth.signUp({
      email: duplicateEmail,
      password: 'AnotherPassword'
    });
    expect(res2.error).toBeDefined();
    expect(res2.error?.message).toContain('already exists');
  });

  it('allows logging in with store manager credentials and signs out cleanly', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'manager@luxury.com',
      password: 'manager123'
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('manager@luxury.com');
    expect(data.user?.user_metadata?.role).toBe('manager');

    // Clean logout
    await supabase.auth.signOut();
    const { data: check } = await supabase.auth.getUser();
    expect(check.user).toBeNull();
  });

  it('allows logging in with staff appraiser credentials and signs out cleanly', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'staff@luxury.com',
      password: 'staff123'
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('staff@luxury.com');
    expect(data.user?.user_metadata?.role).toBe('staff');

    // Clean logout
    await supabase.auth.signOut();
    const { data: check } = await supabase.auth.getUser();
    expect(check.user).toBeNull();
  });
});
