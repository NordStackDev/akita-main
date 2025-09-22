export interface Organization {
  id: string;
  name: string;
  created_at: string;
  company_id: string | null;
  users?: User[];
  deleted_at?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  deleted_at?: string;
  user_roles: {
    name: string;
    level: number;
  };
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  cvr?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  company_type?: string | null;
  created_at?: string;
  organizations?: Organization[];
  deleted_at?: string;
}
