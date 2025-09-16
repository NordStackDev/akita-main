import { supabase } from "@/integrations/supabase/client";

/**
 * Utility functions for soft delete operations
 */

/**
 * Soft delete an organization
 */
export const softDeleteOrganization = async (id: string) => {
  return await supabase
    .from("organizations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
};

/**
 * Soft delete a company
 */
export const softDeleteCompany = async (id: string) => {
  return await supabase
    .from("companies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
};

/**
 * Soft delete a user
 */
export const softDeleteUser = async (id: string) => {
  return await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
};

/**
 * Restore a soft deleted organization
 */
export const restoreOrganization = async (id: string) => {
  return await supabase
    .from("organizations")
    .update({ deleted_at: null })
    .eq("id", id);
};

/**
 * Restore a soft deleted company
 */
export const restoreCompany = async (id: string) => {
  return await supabase
    .from("companies")
    .update({ deleted_at: null })
    .eq("id", id);
};

/**
 * Restore a soft deleted user
 */
export const restoreUser = async (id: string) => {
  return await supabase
    .from("users")
    .update({ deleted_at: null })
    .eq("id", id);
};

/**
 * Get all soft deleted organizations
 */
export const getSoftDeletedOrganizations = async () => {
  return await supabase
    .from("organizations")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
};

/**
 * Get all soft deleted companies
 */
export const getSoftDeletedCompanies = async () => {
  return await supabase
    .from("companies")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
};

/**
 * Get all soft deleted users
 */
export const getSoftDeletedUsers = async () => {
  return await supabase
    .from("users")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
};