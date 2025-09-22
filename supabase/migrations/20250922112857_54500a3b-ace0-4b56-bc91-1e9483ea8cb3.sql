-- Enable pg_stat_statements extension for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics to get fresh data
SELECT pg_stat_statements_reset();

-- Create a function to get database statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
    schemaname text,
    tablename text,
    n_live_tup bigint,
    n_dead_tup bigint,
    last_vacuum timestamp with time zone,
    last_autovacuum timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        schemaname::text,
        relname::text,
        n_live_tup,
        n_dead_tup,
        last_vacuum,
        last_autovacuum
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_dead_tup DESC;
$$;

-- Run maintenance
VACUUM ANALYZE;