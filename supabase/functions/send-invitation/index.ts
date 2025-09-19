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
  companyName?: string;
  organizationId: string;
  role?: string; // Optional role name, defaults to 'seller'
  appUrl?: string; // Optional app URL to include in email link
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, phone, companyName, organizationId, role = 'seller', appUrl }: InvitationRequest = await req.json();

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

    // Resolve organization id (fallback to inviter's organization if not provided)
    let targetOrganizationId = (organizationId && organizationId.trim() !== '') ? organizationId : null;
    if (!targetOrganizationId) {
      const { data: inviterProfile, error: inviterProfileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (inviterProfileError) {
        console.error('Error fetching inviter profile:', inviterProfileError);
      }

      if (!inviterProfile?.organization_id) {
        return new Response(JSON.stringify({ error: 'Missing organization id. Provide organizationId or ensure inviter profile has organization_id.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      targetOrganizationId = inviterProfile.organization_id;
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
        invited_role: role,
        invited_org_id: role === 'ceo' ? null : targetOrganizationId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        company_name: companyName || '',
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
    
    // Resolve role id robustly: fetch all roles and match by preferred names
    let targetRoleId;
    if ((role || '').toLowerCase().trim() === 'ceo') {
      // Failsafe: find kun CEO-rollen direkte
      const { data: ceoRole, error: ceoRoleError } = await supabase.from('user_roles').select('id').ilike('name', 'ceo').single();
      if (ceoRoleError || !ceoRole) {
        return new Response(JSON.stringify({ error: "CEO role not found in user_roles" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      targetRoleId = ceoRole.id;
    } else {
      // Strict role mapping: match preferred aliases in order, no level-based fallback
      const normalizedRole = (role || '').toLowerCase().trim();
      const roleAliases: Record<string, string[]> = {
        sales: ['seller', 'sales'],
        sælger: ['seller', 'sales'],
        salesman: ['seller', 'sales'],
        salesperson: ['seller', 'sales'],
        admin: ['admin'],
        developer: ['developer'],
      };
      const preferredNames = roleAliases[normalizedRole] ?? [normalizedRole];
      const { data: allRoles, error: rolesFetchError } = await supabase.from('user_roles').select('id, name');
      if (rolesFetchError || !allRoles || allRoles.length === 0) {
        console.error('Error fetching roles:', rolesFetchError);
        return new Response(JSON.stringify({ error: 'Failed to load roles' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const byName = new Map(allRoles.map((r: any) => [String(r.name).toLowerCase(), r]));
      for (const name of preferredNames) {
        const match = byName.get(name);
        if (match && typeof (match as any).id !== 'undefined') {
          targetRoleId = (match as any).id;
          break;
        }
      }
      if (!targetRoleId) {
        // Debug info for easier troubleshooting
        const availableRoles = Array.isArray(allRoles) ? allRoles.map((r: any) => r.name).join(', ') : 'none';
        return new Response(JSON.stringify({ error: `Role '${role}' not found. Available roles: [${availableRoles}]. Please create it in user_roles.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

// Create or update user account
let targetUserId: string | null = null;
const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
  email: email.toLowerCase(),
  // Set a temporary password to satisfy API requirements, but we will NOT ask users to use it
  password: temporaryPassword,
  // Ensure the user must verify via invite link
  email_confirm: false,
  user_metadata: {
    first_name: firstName,
    last_name: lastName,
    phone: phone || '',
    company_name: companyName || '',
    invitation_code: invitationCode,
    role: role,
  }
});

if (createUserError) {
  // If the user already exists, just update metadata and ensure email is unconfirmed so invite link works
  if (createUserError.message?.toLowerCase().includes('already been registered')) {
    const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error('Error listing users:', listErr);
      return new Response(JSON.stringify({ error: 'Failed to locate existing user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const existing = usersList.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Existing user not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    targetUserId = existing.id;

    const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUserId, {
      // Keep temp password but require verification via link
      password: temporaryPassword,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        company_name: companyName || '',
        invitation_code: invitationCode,
        role: role,
      }
    });
    if (updateErr) {
      console.error('Error updating existing user:', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to update existing user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    console.error('Error creating user (non-duplicate):', createUserError);
    return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
} else {
  targetUserId = newUser.user!.id;
}

    // Upsert user into users table
    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert({
        id: targetUserId!,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        organization_id: targetOrganizationId,
        role_id: targetRoleId,
        first_login_completed: false,
        force_password_reset: true,
      }, { onConflict: 'id' });

    if (userUpsertError) {
      console.error('Error upserting user data:', userUpsertError);
      return new Response(JSON.stringify({ error: 'Failed to create user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate Supabase invite verification link with fallback for existing users
    const appOrigin = (appUrl && appUrl.trim().length > 0) ? appUrl : (req.headers.get('origin') || 'http://localhost:5173');

    let linkData: any = null;
    let linkError: any = null;

    // Try standard invite link first
    {
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: email.toLowerCase(),
        options: { redirectTo: `${appOrigin}/app` }
      });
      linkData = data;
      linkError = error;
    }

    // If the user already exists, fall back to a recovery link (password reset)
    if (linkError && (linkError.code === 'email_exists' || linkError.status === 422)) {
      const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email.toLowerCase(),
        options: { redirectTo: `${appOrigin}/app` }
      });
      if (!recoveryError) {
        linkData = recoveryData;
        linkError = null;
      } else {
        linkError = recoveryError; // keep the more relevant error
      }
    }

    if (linkError) {
      console.error('Error generating invite link:', linkError);
      return new Response(JSON.stringify({ error: linkError.message || 'Failed to generate invite/recovery link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verifyLink = (linkData as any)?.properties?.action_link || (linkData as any)?.properties?.email_otp_link || (linkData as any)?.action_link || `${appOrigin}/app/auth`;

// Send invitation email with verification link
const isCEO = role === 'ceo';
const { data: emailData, error: emailError } = await resend.emails.send({
  from: 'AKITA <onboarding@resend.dev>',
  to: [email],
  subject: isCEO ? '👑 CEO invitation til AKITA – Bekræft din konto' : 'Velkommen til AKITA – Bekræft din konto',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff0000, #cc0000); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">
          ${isCEO ? '👑 Du er inviteret som CEO til AKITA!' : 'Velkommen til AKITA!'}
        </h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
          ${isCEO ? 'Opret din organisation og kom i gang' : 'Din salgsplatform er klar til brug'}
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hej ${firstName}!</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          ${isCEO 
            ? 'Du er blevet inviteret som CEO til AKITA platformen! Som CEO vil du kunne oprette og administrere din organisation efter bekræftelse.' 
            : 'Du er blevet inviteret til AKITA. For at komme i gang skal du først bekræfte din email.'
          }
        </p>
        ${companyName ? `
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          <strong>Firma:</strong> ${companyName}
        </p>
        ` : ''}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" 
             style="background: linear-gradient(135deg, #ff0000, #cc0000); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            ${isCEO ? 'Bekræft CEO konto' : 'Bekræft din konto'}
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          Efter bekræftelse bliver du logget ind og ${isCEO ? 'kan oprette din organisation' : 'bliver bedt om at oprette din egen adgangskode'}.
          Du kan derefter tilgå appen via <a href="${appOrigin}/app">${appOrigin}/app</a>.
        </p>
        <p style="color: #a00; line-height: 1.6; margin-top: 16px;">
          Bemærk: Login med engangskode er ikke understøttet. Brug linket ovenfor til at bekræfte din konto.
        </p>
      </div>
      
      <div style="text-align: center; color: #999; font-size: 12px;">
        <p>Denne invitation udløber om 7 dage.</p>
        <p>Hvis du ikke har anmodet om denne invitation, kan du ignorere denne email.</p>
      </div>
    </div>
  `,
});

if (emailError) {
  console.error('Resend email error:', emailError);
  return new Response(JSON.stringify({ 
    success: true,
    emailSent: false,
    verifyLink,
    invitationCode,
    message: 'Link genereret, men email kunne ikke sendes. Del linket manuelt.' 
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

console.log('Invitation sent successfully:', emailData);

return new Response(JSON.stringify({ 
  success: true, 
  emailSent: true,
  verifyLink,
  invitationCode,
  message: 'Invitation sendt' 
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