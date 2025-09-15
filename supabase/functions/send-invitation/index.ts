import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationId: string;
  roleId?: string; // Optional role ID, defaults to 'Sælger'
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, phone, organizationId, roleId }: InvitationRequest = await req.json();

    // Get auth user from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate invitation code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_invitation_code');

    if (codeError) {
      console.error('Error generating code:', codeError);
      return new Response(JSON.stringify({ error: 'Failed to generate invitation code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const invitationCode = codeData;

    // Store invitation code
    const { error: insertError } = await supabase
      .from('invitation_codes')
      .insert({
        code: invitationCode,
        email: email.toLowerCase(),
        created_by_user_id: user.id,
      });

    if (insertError) {
      console.error('Error storing invitation:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create invitation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user account with temporary password
    const temporaryPassword = `temp_${invitationCode}_${Date.now()}`;
    
    // Get role ID (either provided or default to 'Sælger')
    let targetRoleId = roleId;
    
    if (!targetRoleId) {
      // Get default role ID ('Sælger')
      const { data: defaultRole, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('name', 'Sælger')
        .single();

      if (roleError || !defaultRole) {
        console.error('Error finding Sælger role:', roleError);
        return new Response(JSON.stringify({ error: 'Default role not found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      targetRoleId = defaultRole.id;
    }

    // Create user account
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        invitation_code: invitationCode,
      }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add user to users table
    const { error: userInsertError } = await supabase
      .from('users')
      .insert({
        id: newUser.user!.id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        organization_id: organizationId,
        role_id: targetRoleId,
        first_login_completed: false,
        force_password_reset: true,
      });

    if (userInsertError) {
      console.error('Error inserting user data:', userInsertError);
      // Clean up auth user if user data insert fails
      await supabase.auth.admin.deleteUser(newUser.user!.id);
      return new Response(JSON.stringify({ error: 'Failed to create user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: 'AKITA <noreply@resend.dev>',
      to: [email],
      subject: 'Velkommen til AKITA - Din invitation er klar!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff0000, #cc0000); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Velkommen til AKITA!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Din salgsplatform er klar til brug</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hej ${firstName}!</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Du er blevet inviteret til at bruge AKITA salgsplatformen. For at komme i gang skal du logge ind med din email og følgende engangskode:
            </p>
            
            <div style="background: white; border: 2px solid #ff0000; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Din engangskode:</p>
              <h3 style="margin: 10px 0 0 0; color: #ff0000; font-size: 24px; letter-spacing: 2px; font-family: monospace;">${invitationCode}</h3>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              <strong>Sådan logger du ind første gang:</strong><br>
              1. Gå til AKITA login siden<br>
              2. Indtast din email: <strong>${email}</strong><br>
              3. Indtast din engangskode som adgangskode: <strong>${invitationCode}</strong><br>
              4. Efter første login bliver du bedt om at oprette en ny adgangskode
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${supabaseUrl.replace('https://dlvqoevnmhmgowcchxfm.supabase.co', window.location?.origin || 'https://your-app-url.com')}/app/auth" 
                 style="background: linear-gradient(135deg, #ff0000, #cc0000); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Log ind på AKITA
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Denne invitation udløber om 7 dage.</p>
            <p>Hvis du ikke har anmodet om denne invitation, kan du ignorere denne email.</p>
          </div>
        </div>
      `,
    });

    console.log('Invitation sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      invitationCode,
      message: 'Invitation sent successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-invitation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);