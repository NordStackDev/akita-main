-- Enable pg_stat_statements extension for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics to get fresh data  
SELECT pg_stat_statements_reset();

-- Create a function to get database statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
    schemaname text,
    tablename text,
    n_tup_ins bigint,
    n_tup_upd bigint,
    n_tup_del bigint,
    n_live_tup bigint,
    n_dead_tup bigint,
    last_vacuum timestamp with time zone,
    last_autovacuum timestamp with time zone,
    last_analyze timestamp with time zone,
    last_autoanalyze timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        schemaname::text,
        relname::text,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_dead_tup DESC;
$$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);  
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_date_desc ON public.sales(date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_organizations_company_id ON public.organizations(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_office_id ON public.locations(office_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_office_composite ON public.user_office(user_id, office_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC) WHERE deleted_at IS NULL;