import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating developer user...');

    // Create developer user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'emilmh.tc@gmail.com',
      password: 'Krj66pgw!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Developer',
        last_name: 'Admin',
      }
    });

    if (authError && !authError.message.includes('already been registered')) {
      console.error('Error creating auth user:', authError);
      return new Response(JSON.stringify({ error: 'Failed to create auth user', details: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Auth user created or already exists:', authUser?.user?.id);

    // Get or use the user ID
    let userId = authUser?.user?.id;
    
    if (!userId) {
      // If user already exists, get the user by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError);
        return new Response(JSON.stringify({ error: 'Failed to find existing user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const existingUser = users.find(u => u.email === 'emilmh.tc@gmail.com');
      if (existingUser) {
        userId = existingUser.id;
        console.log('Using existing user ID:', userId);
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Could not create or find user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get developer role ID and organization ID
    const { data: devRole, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', 'developer')
      .single();

    if (roleError || !devRole) {
      console.error('Error finding developer role:', roleError);
      return new Response(JSON.stringify({ error: 'Developer role not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = '00000000-0000-0000-0000-000000000001';

    // Create user record in users table
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: 'emilmh.tc@gmail.com',
        first_name: 'Developer',
        last_name: 'Admin',
        organization_id: orgId,
        role_id: devRole.id,
        first_login_completed: true,
        force_password_reset: false,
        status: 'active'
      }, {
        onConflict: 'email'
      });

    if (userInsertError) {
      console.error('Error inserting user data:', userInsertError);
      return new Response(JSON.stringify({ error: 'Failed to create user profile', details: userInsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        organization_id: orgId,
        role_id: devRole.id
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail the whole operation for profile creation
    }

    console.log('Developer user created successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Developer user created successfully',
      userId,
      email: 'emilmh.tc@gmail.com'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in create-dev-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);