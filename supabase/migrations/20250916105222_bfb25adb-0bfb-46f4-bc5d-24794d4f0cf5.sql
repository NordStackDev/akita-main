-- Add deleted_at columns to all relevant tables for soft delete functionality

-- Add deleted_at to organizations table
ALTER TABLE public.organizations 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to companies table  
ALTER TABLE public.companies 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to users table
ALTER TABLE public.users 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to customers table
ALTER TABLE public.customers 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to sales table
ALTER TABLE public.sales 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to locations table
ALTER TABLE public.locations 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to offices table
ALTER TABLE public.offices 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to teams table
ALTER TABLE public.teams 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to products table
ALTER TABLE public.products 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to projects table
ALTER TABLE public.projects 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to regions table
ALTER TABLE public.regions 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update RLS policies to filter out soft deleted records

-- Update organizations RLS policies
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (id = get_user_organization_id(auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins and developers can select all organizations" ON public.organizations;
CREATE POLICY "Admins and developers can select all organizations" 
ON public.organizations 
FOR SELECT 
USING (is_admin_or_developer() AND deleted_at IS NULL);

-- Update companies RLS policies  
DROP POLICY IF EXISTS "Users can view companies through organizations" ON public.companies;
CREATE POLICY "Users can view companies through organizations" 
ON public.companies 
FOR SELECT 
USING (id IN ( SELECT o.company_id
   FROM organizations o
  WHERE (o.id = get_user_organization_id(auth.uid()) AND o.deleted_at IS NULL)) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins and developers can select all companies" ON public.companies;
CREATE POLICY "Admins and developers can select all companies" 
ON public.companies 
FOR SELECT 
USING (is_admin_or_developer() AND deleted_at IS NULL);

-- Update users RLS policies
DROP POLICY IF EXISTS "Users can view their organization members" ON public.users;
CREATE POLICY "Users can view their organization members" 
ON public.users 
FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()) AND deleted_at IS NULL);

-- Update other table policies to include deleted_at filters
-- Update offices policy
DROP POLICY IF EXISTS "Users can view offices in their organization" ON public.offices;
CREATE POLICY "Users can view offices in their organization" 
ON public.offices 
FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()) AND deleted_at IS NULL);

-- Update teams policy
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
CREATE POLICY "Users can view teams in their organization" 
ON public.teams 
FOR SELECT 
USING (office_id IN ( SELECT offices.id
   FROM offices
  WHERE (offices.organization_id = get_user_organization_id(auth.uid()) AND offices.deleted_at IS NULL)) AND deleted_at IS NULL);

-- Update locations policy
DROP POLICY IF EXISTS "Users can view locations in their organization" ON public.locations;
CREATE POLICY "Users can view locations in their organization" 
ON public.locations 
FOR SELECT 
USING (office_id IN ( SELECT offices.id
   FROM offices
  WHERE (offices.organization_id = get_user_organization_id(auth.uid()) AND offices.deleted_at IS NULL)) AND deleted_at IS NULL);

-- Update regions policy
DROP POLICY IF EXISTS "Users can view regions in their organization" ON public.regions;
CREATE POLICY "Users can view regions in their organization" 
ON public.regions 
FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()) AND deleted_at IS NULL);

-- Update customers policy
DROP POLICY IF EXISTS "Users can view customers from their sales" ON public.customers;
CREATE POLICY "Users can view customers from their sales" 
ON public.customers 
FOR SELECT 
USING (id IN ( SELECT s.customer_id
   FROM (sales s
     JOIN users u ON ((s.user_id = u.id)))
  WHERE (u.organization_id = get_user_organization_id(auth.uid()) AND u.deleted_at IS NULL AND s.deleted_at IS NULL)) AND deleted_at IS NULL);

-- Update sales policy
DROP POLICY IF EXISTS "Users can view sales in their organization" ON public.sales;
CREATE POLICY "Users can view sales in their organization" 
ON public.sales 
FOR SELECT 
USING (user_id IN ( SELECT users.id
   FROM users
  WHERE (users.organization_id = get_user_organization_id(auth.uid()) AND users.deleted_at IS NULL)) AND deleted_at IS NULL);

-- Create indexes for better performance on deleted_at columns
CREATE INDEX idx_organizations_deleted_at ON public.organizations(deleted_at);
CREATE INDEX idx_companies_deleted_at ON public.companies(deleted_at);
CREATE INDEX idx_users_deleted_at ON public.users(deleted_at);
CREATE INDEX idx_customers_deleted_at ON public.customers(deleted_at);
CREATE INDEX idx_sales_deleted_at ON public.sales(deleted_at);
CREATE INDEX idx_locations_deleted_at ON public.locations(deleted_at);
CREATE INDEX idx_offices_deleted_at ON public.offices(deleted_at);
CREATE INDEX idx_teams_deleted_at ON public.teams(deleted_at);
CREATE INDEX idx_products_deleted_at ON public.products(deleted_at);
CREATE INDEX idx_projects_deleted_at ON public.projects(deleted_at);
CREATE INDEX idx_regions_deleted_at ON public.regions(deleted_at);