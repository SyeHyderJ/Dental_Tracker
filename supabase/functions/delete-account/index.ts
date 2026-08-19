import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// ──────────────────────────────────────────────────────────────
//  Handler
// ──────────────────────────────────────────────────────────────
serve(async (req) => {
  // 1️⃣ Extract and verify JWT from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const jwt = authHeader.substring(7);

  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ Client A: Verify identity – uses ANON key + forwards JWT            │
  // │ (Only for `supabase.auth.getUser()` – we need the anon key to call  │
  // │  auth APIs, but we forward the user’s JWT so that `getUser()`       │
  // │  returns the caller’s identity)                                     │
  // └─────────────────────────────────────────────────────────────────────┘
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = user.id;

  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ Client B: Pure service‑role client – NO Authorization header        │
  // │ (Used for ALL delete operations and `auth.admin.deleteUser`. This   │
  // │  bypasses RLS entirely, guaranteeing we can delete rows even if     │
  // │  the user’s role lacks RLS delete permissions.)                     │
  // └─────────────────────────────────────────────────────────────────────┘
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  // 2️⃣ Sequential deletion with explicit error reporting per step
  try {
    // Step 1: Delete provider_connections where user is patient (patient_id = user)
    try {
      await adminClient.from('provider_connections').delete().eq('patient_id', userId);
    } catch (err: any) {
      throw new Error(`Failed at provider_connections (patient): ${err.message}`);
    }

    // Step 2: Delete provider_connections where user is provider (provider_id = user)
    try {
      await adminClient.from('provider_connections').delete().eq('provider_id', userId);
    } catch (err: any) {
      throw new Error(`Failed at provider_connections (provider): ${err.message}`);
    }

    // Step 3: Delete appointments
    try {
      await adminClient.from('appointments').delete().eq('user_id', userId);
    } catch (err: any) {
      throw new Error(`Failed at appointments: ${err.message}`);
    }

    // Step 4: Delete tooth_records
    try {
      await adminClient.from('tooth_records').delete().eq('user_id', userId);
    } catch (err: any) {
      throw new Error(`Failed at tooth_records: ${err.message}`);
    }

    // Step 5: Delete profiles
    try {
      await adminClient.from('profiles').delete().eq('user_id', userId);
    } catch (err: any) {
      throw new Error(`Failed at profiles: ${err.message}`);
    }

    // Step 6: Finally delete the auth user (requires service_role)
    try {
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
      if (authError) throw authError;
    } catch (err: any) {
      throw new Error(`Failed at auth admin deleteUser: ${err.message}`);
    }

    // All steps succeeded
    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    // Log for debugging; return a generic error to the caller
    console.error('Account deletion error:', err);
    return new Response(
      JSON.stringify({ error: `Account deletion failed: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});