-- Add comprehensive RLS policies for all remaining tables (FIXED)

-- User association tables policies
CREATE POLICY "Users can view their region associations" ON public.user_region
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view their office associations" ON public.user_office
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view their team associations" ON public.user_team
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view their department associations" ON public.user_department
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Client and project policies
CREATE POLICY "Users can view clients in their organization" ON public.clients
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can view projects in their organization" ON public.projects
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view their project associations" ON public.user_project
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view their product access" ON public.user_product
  FOR SELECT USING (user_id = auth.uid());

-- Standplace policies
CREATE POLICY "Users can view standplaces in their organization" ON public.standplaces
  FOR SELECT USING (
    location_id IN (
      SELECT l.id FROM public.locations l
      JOIN public.offices o ON l.office_id = o.id
      WHERE o.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Location usage policies
CREATE POLICY "Users can view location usage in their organization" ON public.location_usage
  FOR SELECT USING (
    location_id IN (
      SELECT l.id FROM public.locations l
      JOIN public.offices o ON l.office_id = o.id
      WHERE o.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Customer info policies
CREATE POLICY "Users can view mobile info for their customers" ON public.customer_mobile_info
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.sales s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view bank info for their customers" ON public.customer_bank_info
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.sales s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view insurance info for their customers" ON public.customer_insurance_info
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.sales s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- External provider policies
CREATE POLICY "Users can view external providers in their organization" ON public.external_providers
  FOR SELECT USING (true); -- Global for integration purposes

-- Customer form policies
CREATE POLICY "Users can view customer forms in their organization" ON public.customer_forms
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can create customer forms" ON public.customer_forms
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Gamification policies
CREATE POLICY "Users can view pins" ON public.pins
  FOR SELECT USING (true); -- Global visibility for gamification

CREATE POLICY "Users can view user pins in their organization" ON public.user_pins
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Promotion system policies
CREATE POLICY "Users can view promotion rules" ON public.promotion_rules
  FOR SELECT USING (true); -- Global visibility for career progression

CREATE POLICY "Users can view promotion progress in their organization" ON public.user_promotion_progress
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view promotions in their organization" ON public.user_promotions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Sick leave policies
CREATE POLICY "Users can view sick leaves in their organization" ON public.sickleaves
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can create their own sick leave" ON public.sickleaves
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Challenge policies
CREATE POLICY "Users can view challenges" ON public.challenges
  FOR SELECT USING (true); -- Global visibility for competitions

CREATE POLICY "Users can view challenge participants in their organization" ON public.challenge_participant
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can participate in challenges" ON public.challenge_participant
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Message policies (FIXED type casting)
CREATE POLICY "Users can view messages sent to them or from their organization" ON public.messages
  FOR SELECT USING (
    sender_user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
    OR (recipient_id IS NOT NULL AND recipient_id::uuid = auth.uid())
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_user_id = auth.uid());

-- Budget policies
CREATE POLICY "Users can view budget for their role" ON public.budget
  FOR SELECT USING (
    role_id IN (
      SELECT role_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

-- Test policies (FIXED type casting)
CREATE POLICY "Users can view tests sent to them or their level" ON public.tests
  FOR SELECT USING (
    (sent_to_id IS NOT NULL AND sent_to_id::uuid = auth.uid())
    OR sent_to_level IN (
      SELECT r.name FROM public.users u 
      JOIN public.user_roles r ON u.role_id = r.id 
      WHERE u.id = auth.uid()
    )
  );

-- Allow INSERT policies for key tables where users need to create records
CREATE POLICY "Users can insert mobile customer info" ON public.customer_mobile_info
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert bank customer info" ON public.customer_bank_info
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert insurance customer info" ON public.customer_insurance_info
  FOR INSERT WITH CHECK (true);

-- Allow location creation for FM users
CREATE POLICY "Users can create locations" ON public.locations
  FOR INSERT WITH CHECK (
    office_id IN (
      SELECT id FROM public.offices 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can create standplaces" ON public.standplaces
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT l.id FROM public.locations l
      JOIN public.offices o ON l.office_id = o.id
      WHERE o.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- UPDATE policies for user's own data
CREATE POLICY "Users can update customers they created" ON public.customers
  FOR UPDATE USING (
    id IN (
      SELECT customer_id FROM public.sales 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update locations they have access to" ON public.locations
  FOR UPDATE USING (
    office_id IN (
      SELECT o.id FROM public.offices o
      JOIN public.user_office uo ON o.id = uo.office_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Admin override policies for higher-level users
CREATE POLICY "Managers can manage users in their organization" ON public.users
  FOR UPDATE USING (
    public.get_user_role_level(auth.uid()) <= 5 
    AND organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "Managers can create users in their organization" ON public.users
  FOR INSERT WITH CHECK (
    public.get_user_role_level(auth.uid()) <= 5 
    AND organization_id = public.get_user_organization_id(auth.uid())
  );

-- Allow managers to assign users to teams/offices
CREATE POLICY "Managers can assign users to offices" ON public.user_office
  FOR INSERT WITH CHECK (
    public.get_user_role_level(auth.uid()) <= 5
    AND user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Managers can assign users to teams" ON public.user_team
  FOR INSERT WITH CHECK (
    public.get_user_role_level(auth.uid()) <= 5
    AND user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );