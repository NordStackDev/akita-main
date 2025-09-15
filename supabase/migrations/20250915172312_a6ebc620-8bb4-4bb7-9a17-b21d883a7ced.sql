-- AKITA Sales Platform - Complete Database Schema
-- This migration creates all tables, relationships, triggers, and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE ORGANIZATIONAL TABLES
-- =============================================

-- Organizations table for multi-tenancy/whitelabel
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#ff0000',
  secondary_color text DEFAULT '#1c1c1c',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Regions within organizations  
CREATE TABLE public.regions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Offices within regions
CREATE TABLE public.offices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  country text DEFAULT 'Denmark',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Departments within offices
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Teams within departments  
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- USER ROLES AND PERMISSIONS
-- =============================================

-- User roles with hierarchical levels and permissions
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  level int NOT NULL, -- 1=Admin, 2=CEO, 3=Salgsdirektør, 4=Salgschef, 5=Teamleder, 6=Senior Sælger, 7=Sælger, 8=Junior Sælger
  can_create_user boolean DEFAULT false,
  can_delete_user boolean DEFAULT false,
  can_edit_data boolean DEFAULT false,
  can_register_sickleave boolean DEFAULT false,
  can_register_sale boolean DEFAULT true,
  can_view_stats boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default roles
INSERT INTO public.user_roles (name, level, can_create_user, can_delete_user, can_edit_data, can_register_sickleave, can_register_sale, can_view_stats) VALUES
('Admin', 1, true, true, true, true, true, true),
('CEO', 2, true, true, true, true, true, true),
('Salgsdirektør', 3, true, false, true, true, true, true),
('Salgschef', 4, true, false, true, true, true, true),
('Teamleder', 5, true, false, false, true, true, true),
('Senior Sælger', 6, false, false, false, false, true, false),
('Sælger', 7, false, false, false, false, true, false),
('Junior Sælger', 8, false, false, false, false, true, false);

-- =============================================
-- USERS AND PROFILES
-- =============================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text,
  last_name text,
  name text,
  birth_date date,
  phone text,
  username text,
  email text NOT NULL,
  password_hash text,
  force_password_reset boolean DEFAULT true,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.user_roles(id),
  bank_reg_number text,
  bank_account_number text,
  recruiter_id uuid REFERENCES public.users(id),
  channel_type text CHECK (channel_type IN ('FM', 'TM')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  invited_at timestamp with time zone,
  onboarding_email_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_org_email UNIQUE (organization_id, email),
  CONSTRAINT unique_org_username UNIQUE (organization_id, username)
);

-- Profiles table for additional user information
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.user_roles(id),
  profile_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- USER ASSOCIATIONS  
-- =============================================

-- User-Region associations
CREATE TABLE public.user_region (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, region_id)
);

-- User-Office associations
CREATE TABLE public.user_office (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_office UNIQUE (user_id, office_id)
);

-- User-Team associations
CREATE TABLE public.user_team (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_team UNIQUE (user_id, team_id)
);

-- User-Department associations
CREATE TABLE public.user_department (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- CLIENTS, PROJECTS AND PRODUCTS
-- =============================================

-- Clients
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Projects under clients
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  office_id uuid REFERENCES public.offices(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User-Project associations
CREATE TABLE public.user_project (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, project_id)
);

-- Products within projects
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  points_value int DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User-Product access (what products a user can sell)
CREATE TABLE public.user_product (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by_user_id uuid REFERENCES public.users(id),
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- =============================================
-- LOCATIONS AND STANDPLACES (FM specific)
-- =============================================

-- Locations for field marketing
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'Denmark',
  latitude float,
  longitude float,
  most_used boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Standplaces within locations (FM specific)
CREATE TABLE public.standplaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  primary_target_group text,
  best_day text,
  best_time text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Location usage tracking
CREATE TABLE public.location_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  date timestamp with time zone NOT NULL DEFAULT now(),
  time_period text,
  target_group text,
  times_used int DEFAULT 1,
  top_performers jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- CUSTOMERS AND CUSTOMER INFO
-- =============================================

-- Main customers table
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text,
  last_name text,
  postal_code text,
  city text,
  country text DEFAULT 'Denmark',
  birth_date date,
  cpr_number text,
  contact_number text,
  email text,
  customer_type text CHECK (customer_type IN ('mobile', 'bank', 'insurance')),
  gender text CHECK (gender IN ('male', 'female', 'other')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Mobile-specific customer information
CREATE TABLE public.customer_mobile_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  phone_number_to_move text,
  current_provider text,
  sim_card_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Bank-specific customer information  
CREATE TABLE public.customer_bank_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  current_bank text,
  civil_status text,
  children int DEFAULT 0,
  housing_type text,
  income float,
  has_loan boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insurance-specific customer information
CREATE TABLE public.customer_insurance_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  current_insurer text,
  current_insurances text,
  civil_status text,
  children int DEFAULT 0,
  housing_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- SALES AND EXTERNAL PROVIDERS
-- =============================================

-- External providers for integrations
CREATE TABLE public.external_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  website_url text,
  contact_info text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Customer forms (for external integrations)
CREATE TABLE public.customer_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  form_data jsonb,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  external_provider_id uuid REFERENCES public.external_providers(id),
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'processed', 'failed')),
  response_data jsonb
);

-- Sales records
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id),
  office_id uuid REFERENCES public.offices(id),
  project_id uuid REFERENCES public.projects(id),
  location_id uuid REFERENCES public.locations(id),
  standplace_id uuid REFERENCES public.standplaces(id),
  date timestamp with time zone NOT NULL DEFAULT now(),
  amount int DEFAULT 0,
  points int DEFAULT 0,
  customer_gender text,
  customer_age int,
  permission boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- GAMIFICATION AND RECOGNITION
-- =============================================

-- Pins/badges system
CREATE TABLE public.pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  criteria text,
  manual_selection boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User pins/badges
CREATE TABLE public.user_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pin_id uuid NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  date_obtained timestamp with time zone NOT NULL DEFAULT now(),
  progress_status text,
  notified_to_superiors boolean DEFAULT false
);

-- =============================================
-- PROMOTION SYSTEM
-- =============================================

-- Promotion rules
CREATE TABLE public.promotion_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_role_id uuid NOT NULL REFERENCES public.user_roles(id),
  to_role_id uuid NOT NULL REFERENCES public.user_roles(id),
  description text,
  min_points int DEFAULT 0,
  required_weeks int DEFAULT 0,
  required_months int DEFAULT 0,
  min_total_points int DEFAULT 0,
  self_sufficiency_required boolean DEFAULT false,
  auto_promotion boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User promotion progress tracking
CREATE TABLE public.user_promotion_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_role_id uuid NOT NULL REFERENCES public.user_roles(id),
  target_role_id uuid NOT NULL REFERENCES public.user_roles(id),
  rule_id uuid NOT NULL REFERENCES public.promotion_rules(id),
  points_last_week int DEFAULT 0,
  points_last_month int DEFAULT 0,
  weeks_in_a_row_met int DEFAULT 0,
  ready_for_promotion boolean DEFAULT false,
  self_sufficiency boolean DEFAULT false,
  last_checked timestamp with time zone DEFAULT now()
);

-- User promotions history
CREATE TABLE public.user_promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_role_id uuid NOT NULL REFERENCES public.user_roles(id),
  to_role_id uuid NOT NULL REFERENCES public.user_roles(id),
  promoted_at timestamp with time zone NOT NULL DEFAULT now(),
  auto_promoted boolean DEFAULT false,
  approved_by uuid REFERENCES public.users(id),
  rule_id uuid REFERENCES public.promotion_rules(id),
  comment text
);

-- =============================================
-- ADDITIONAL FEATURES
-- =============================================

-- Sick leave tracking
CREATE TABLE public.sickleaves (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  type text DEFAULT 'sick',
  reported_by_user_id uuid REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Challenges/competitions
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Challenge participants
CREATE TABLE public.challenge_participant (
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  result text,
  PRIMARY KEY (challenge_id, user_id)
);

-- Internal messaging system
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_level text,
  recipient_id uuid,
  content text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Budget management
CREATE TABLE public.budget (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id uuid NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  daily_budget int DEFAULT 0,
  weekly_budget int DEFAULT 0,
  monthly_budget int DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tests/assessments
CREATE TABLE public.tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text,
  sent_to_level text,
  sent_to_id uuid,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to auto-populate name field from first_name and last_name
CREATE OR REPLACE FUNCTION public.update_user_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = CONCAT(NEW.first_name, ' ', NEW.last_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to handle new user onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new user
    INSERT INTO public.profiles (user_id, organization_id, role_id)
    VALUES (NEW.id, NEW.organization_id, NEW.role_id);
    
    -- Mark onboarding email as needing to be sent
    NEW.onboarding_email_sent_at = NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_name_trigger
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_name();

CREATE TRIGGER on_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_region ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_office ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_mobile_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promotion_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sickleaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_uuid uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Helper function to get user's role level
CREATE OR REPLACE FUNCTION public.get_user_role_level(user_uuid uuid)
RETURNS int AS $$
  SELECT r.level 
  FROM public.users u 
  JOIN public.user_roles r ON u.role_id = r.id 
  WHERE u.id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (id = public.get_user_organization_id(auth.uid()));

-- Users policies
CREATE POLICY "Users can view users in their organization" ON public.users
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Profiles policies  
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Sales policies
CREATE POLICY "Users can view sales in their organization" ON public.sales
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can create their own sales" ON public.sales
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Customers policies
CREATE POLICY "Users can view customers from their sales" ON public.customers
  FOR SELECT USING (
    id IN (
      SELECT customer_id FROM public.sales s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can create customers" ON public.customers
  FOR INSERT WITH CHECK (true); -- Allow creation, will be linked through sales

-- Region/Office/Department/Team policies (organization-scoped)
CREATE POLICY "Users can view regions in their organization" ON public.regions
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can view offices in their organization" ON public.offices
  FOR SELECT USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can view departments in their organization" ON public.departments
  FOR SELECT USING (
    region_id IN (
      SELECT id FROM public.regions 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

CREATE POLICY "Users can view teams in their organization" ON public.teams
  FOR SELECT USING (
    office_id IN (
      SELECT id FROM public.offices 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Locations policies
CREATE POLICY "Users can view locations in their organization" ON public.locations
  FOR SELECT USING (
    office_id IN (
      SELECT id FROM public.offices 
      WHERE organization_id = public.get_user_organization_id(auth.uid())
    )
  );

-- Products policies
CREATE POLICY "Users can view products they have access to" ON public.products
  FOR SELECT USING (
    id IN (
      SELECT product_id FROM public.user_product 
      WHERE user_id = auth.uid()
    )
  );

-- User roles policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view user roles" ON public.user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies (level 1-2 can see and modify everything in their org)
CREATE POLICY "Admins can manage their organization" ON public.users
  FOR ALL USING (
    public.get_user_role_level(auth.uid()) <= 2 
    AND organization_id = public.get_user_organization_id(auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON public.users(organization_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;