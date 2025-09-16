export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      budget: {
        Row: {
          created_at: string
          daily_budget: number | null
          id: string
          monthly_budget: number | null
          role_id: string
          weekly_budget: number | null
        }
        Insert: {
          created_at?: string
          daily_budget?: number | null
          id?: string
          monthly_budget?: number | null
          role_id: string
          weekly_budget?: number | null
        }
        Update: {
          created_at?: string
          daily_budget?: number | null
          id?: string
          monthly_budget?: number | null
          role_id?: string
          weekly_budget?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participant: {
        Row: {
          challenge_id: string
          result: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          result?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          result?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participant_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_bank_info: {
        Row: {
          children: number | null
          civil_status: string | null
          created_at: string
          current_bank: string | null
          customer_id: string
          has_loan: boolean | null
          housing_type: string | null
          id: string
          income: number | null
        }
        Insert: {
          children?: number | null
          civil_status?: string | null
          created_at?: string
          current_bank?: string | null
          customer_id: string
          has_loan?: boolean | null
          housing_type?: string | null
          id?: string
          income?: number | null
        }
        Update: {
          children?: number | null
          civil_status?: string | null
          created_at?: string
          current_bank?: string | null
          customer_id?: string
          has_loan?: boolean | null
          housing_type?: string | null
          id?: string
          income?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_bank_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_forms: {
        Row: {
          customer_id: string
          external_provider_id: string | null
          form_data: Json | null
          id: string
          response_data: Json | null
          status: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          customer_id: string
          external_provider_id?: string | null
          form_data?: Json | null
          id?: string
          response_data?: Json | null
          status?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          customer_id?: string
          external_provider_id?: string | null
          form_data?: Json | null
          id?: string
          response_data?: Json | null
          status?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_forms_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_forms_external_provider_id_fkey"
            columns: ["external_provider_id"]
            isOneToOne: false
            referencedRelation: "external_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_forms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_insurance_info: {
        Row: {
          children: number | null
          civil_status: string | null
          created_at: string
          current_insurances: string | null
          current_insurer: string | null
          customer_id: string
          housing_type: string | null
          id: string
        }
        Insert: {
          children?: number | null
          civil_status?: string | null
          created_at?: string
          current_insurances?: string | null
          current_insurer?: string | null
          customer_id: string
          housing_type?: string | null
          id?: string
        }
        Update: {
          children?: number | null
          civil_status?: string | null
          created_at?: string
          current_insurances?: string | null
          current_insurer?: string | null
          customer_id?: string
          housing_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_insurance_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_mobile_info: {
        Row: {
          created_at: string
          current_provider: string | null
          customer_id: string
          id: string
          phone_number_to_move: string | null
          sim_card_number: string | null
        }
        Insert: {
          created_at?: string
          current_provider?: string | null
          customer_id: string
          id?: string
          phone_number_to_move?: string | null
          sim_card_number?: string | null
        }
        Update: {
          created_at?: string
          current_provider?: string | null
          customer_id?: string
          id?: string
          phone_number_to_move?: string | null
          sim_card_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_mobile_info_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birth_date: string | null
          city: string | null
          contact_number: string | null
          country: string | null
          cpr_number: string | null
          created_at: string
          customer_type: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          postal_code: string | null
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          contact_number?: string | null
          country?: string | null
          cpr_number?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          postal_code?: string | null
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          contact_number?: string | null
          country?: string | null
          cpr_number?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          postal_code?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          office_id: string
          region_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          office_id: string
          region_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          office_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      external_providers: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          name: string
          website_url: string | null
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
          website_url?: string | null
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by_user_id: string | null
          email: string
          expires_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_user_id?: string | null
          email: string
          expires_at?: string
          id?: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_user_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      location_usage: {
        Row: {
          created_at: string
          date: string
          id: string
          location_id: string
          target_group: string | null
          time_period: string | null
          times_used: number | null
          top_performers: Json | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          location_id: string
          target_group?: string | null
          time_period?: string | null
          times_used?: number | null
          top_performers?: Json | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          location_id?: string
          target_group?: string | null
          time_period?: string | null
          times_used?: number | null
          top_performers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "location_usage_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          most_used: boolean | null
          name: string
          office_id: string
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          most_used?: boolean | null
          name: string
          office_id: string
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          most_used?: boolean | null
          name?: string
          office_id?: string
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          id: string
          recipient_id: string | null
          recipient_level: string | null
          sender_user_id: string
          sent_at: string
        }
        Insert: {
          content: string
          id?: string
          recipient_id?: string | null
          recipient_level?: string | null
          sender_user_id: string
          sent_at?: string
        }
        Update: {
          content?: string
          id?: string
          recipient_id?: string | null
          recipient_level?: string | null
          sender_user_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          region_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          region_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offices_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Relationships: []
      }
      pins: {
        Row: {
          created_at: string
          criteria: string | null
          description: string | null
          id: string
          manual_selection: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          id?: string
          manual_selection?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          id?: string
          manual_selection?: boolean | null
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
          points_value: number | null
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          points_value?: number | null
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          points_value?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          profile_image_url: string | null
          role_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          profile_image_url?: string | null
          role_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          profile_image_url?: string | null
          role_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          office_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          office_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          office_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_rules: {
        Row: {
          active: boolean | null
          auto_promotion: boolean | null
          created_at: string
          description: string | null
          from_role_id: string
          id: string
          min_points: number | null
          min_total_points: number | null
          required_months: number | null
          required_weeks: number | null
          self_sufficiency_required: boolean | null
          to_role_id: string
        }
        Insert: {
          active?: boolean | null
          auto_promotion?: boolean | null
          created_at?: string
          description?: string | null
          from_role_id: string
          id?: string
          min_points?: number | null
          min_total_points?: number | null
          required_months?: number | null
          required_weeks?: number | null
          self_sufficiency_required?: boolean | null
          to_role_id: string
        }
        Update: {
          active?: boolean | null
          auto_promotion?: boolean | null
          created_at?: string
          description?: string | null
          from_role_id?: string
          id?: string
          min_points?: number | null
          min_total_points?: number | null
          required_months?: number | null
          required_weeks?: number | null
          self_sufficiency_required?: boolean | null
          to_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_rules_from_role_id_fkey"
            columns: ["from_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_rules_to_role_id_fkey"
            columns: ["to_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount: number | null
          created_at: string
          customer_age: number | null
          customer_gender: string | null
          customer_id: string
          date: string
          id: string
          location_id: string | null
          office_id: string | null
          permission: boolean | null
          points: number | null
          product_id: string
          project_id: string | null
          standplace_id: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_age?: number | null
          customer_gender?: string | null
          customer_id: string
          date?: string
          id?: string
          location_id?: string | null
          office_id?: string | null
          permission?: boolean | null
          points?: number | null
          product_id: string
          project_id?: string | null
          standplace_id?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_age?: number | null
          customer_gender?: string | null
          customer_id?: string
          date?: string
          id?: string
          location_id?: string | null
          office_id?: string | null
          permission?: boolean | null
          points?: number | null
          product_id?: string
          project_id?: string | null
          standplace_id?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_standplace_id_fkey"
            columns: ["standplace_id"]
            isOneToOne: false
            referencedRelation: "standplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sickleaves: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          reported_by_user_id: string | null
          start_date: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          reported_by_user_id?: string | null
          start_date: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          reported_by_user_id?: string | null
          start_date?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sickleaves_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sickleaves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      standplaces: {
        Row: {
          best_day: string | null
          best_time: string | null
          created_at: string
          id: string
          location_id: string
          name: string
          primary_target_group: string | null
        }
        Insert: {
          best_day?: string | null
          best_time?: string | null
          created_at?: string
          id?: string
          location_id: string
          name: string
          primary_target_group?: string | null
        }
        Update: {
          best_day?: string | null
          best_time?: string | null
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          primary_target_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standplaces_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          name: string
          office_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
          office_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
          office_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          content: string | null
          id: string
          name: string
          sent_at: string
          sent_to_id: string | null
          sent_to_level: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          name: string
          sent_at?: string
          sent_to_id?: string | null
          sent_to_level?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          name?: string
          sent_at?: string
          sent_to_id?: string | null
          sent_to_level?: string | null
        }
        Relationships: []
      }
      user_department: {
        Row: {
          created_at: string
          department_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_department_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_department_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_office: {
        Row: {
          created_at: string
          office_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          office_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          office_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_office_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_office_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pins: {
        Row: {
          date_obtained: string
          id: string
          notified_to_superiors: boolean | null
          pin_id: string
          progress_status: string | null
          user_id: string
        }
        Insert: {
          date_obtained?: string
          id?: string
          notified_to_superiors?: boolean | null
          pin_id: string
          progress_status?: string | null
          user_id: string
        }
        Update: {
          date_obtained?: string
          id?: string
          notified_to_superiors?: boolean | null
          pin_id?: string
          progress_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pins_pin_id_fkey"
            columns: ["pin_id"]
            isOneToOne: false
            referencedRelation: "pins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product: {
        Row: {
          granted_at: string
          granted_by_user_id: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by_user_id?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by_user_id?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_granted_by_user_id_fkey"
            columns: ["granted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_project: {
        Row: {
          project_id: string
          user_id: string
        }
        Insert: {
          project_id: string
          user_id: string
        }
        Update: {
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_project_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_project_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promotion_progress: {
        Row: {
          current_role_id: string
          id: string
          last_checked: string | null
          points_last_month: number | null
          points_last_week: number | null
          ready_for_promotion: boolean | null
          rule_id: string
          self_sufficiency: boolean | null
          target_role_id: string
          user_id: string
          weeks_in_a_row_met: number | null
        }
        Insert: {
          current_role_id: string
          id?: string
          last_checked?: string | null
          points_last_month?: number | null
          points_last_week?: number | null
          ready_for_promotion?: boolean | null
          rule_id: string
          self_sufficiency?: boolean | null
          target_role_id: string
          user_id: string
          weeks_in_a_row_met?: number | null
        }
        Update: {
          current_role_id?: string
          id?: string
          last_checked?: string | null
          points_last_month?: number | null
          points_last_week?: number | null
          ready_for_promotion?: boolean | null
          rule_id?: string
          self_sufficiency?: boolean | null
          target_role_id?: string
          user_id?: string
          weeks_in_a_row_met?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_promotion_progress_current_role_id_fkey"
            columns: ["current_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotion_progress_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "promotion_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotion_progress_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotion_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promotions: {
        Row: {
          approved_by: string | null
          auto_promoted: boolean | null
          comment: string | null
          from_role_id: string
          id: string
          promoted_at: string
          rule_id: string | null
          to_role_id: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          auto_promoted?: boolean | null
          comment?: string | null
          from_role_id: string
          id?: string
          promoted_at?: string
          rule_id?: string | null
          to_role_id: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          auto_promoted?: boolean | null
          comment?: string | null
          from_role_id?: string
          id?: string
          promoted_at?: string
          rule_id?: string | null
          to_role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_promotions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotions_from_role_id_fkey"
            columns: ["from_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "promotion_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotions_to_role_id_fkey"
            columns: ["to_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_promotions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_region: {
        Row: {
          region_id: string
          user_id: string
        }
        Insert: {
          region_id: string
          user_id: string
        }
        Update: {
          region_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_region_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_region_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          can_create_user: boolean | null
          can_delete_user: boolean | null
          can_edit_data: boolean | null
          can_register_sale: boolean | null
          can_register_sickleave: boolean | null
          can_view_stats: boolean | null
          created_at: string
          id: string
          level: number
          name: string
        }
        Insert: {
          can_create_user?: boolean | null
          can_delete_user?: boolean | null
          can_edit_data?: boolean | null
          can_register_sale?: boolean | null
          can_register_sickleave?: boolean | null
          can_view_stats?: boolean | null
          created_at?: string
          id?: string
          level: number
          name: string
        }
        Update: {
          can_create_user?: boolean | null
          can_delete_user?: boolean | null
          can_edit_data?: boolean | null
          can_register_sale?: boolean | null
          can_register_sickleave?: boolean | null
          can_view_stats?: boolean | null
          created_at?: string
          id?: string
          level?: number
          name?: string
        }
        Relationships: []
      }
      user_team: {
        Row: {
          created_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_team_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bank_account_number: string | null
          bank_reg_number: string | null
          birth_date: string | null
          channel_type: string | null
          created_at: string
          email: string
          first_login_completed: boolean | null
          first_name: string | null
          force_password_reset: boolean | null
          id: string
          invited_at: string | null
          last_name: string | null
          name: string | null
          onboarding_email_sent_at: string | null
          organization_id: string
          password_hash: string | null
          phone: string | null
          recruiter_id: string | null
          role_id: string | null
          status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          bank_account_number?: string | null
          bank_reg_number?: string | null
          birth_date?: string | null
          channel_type?: string | null
          created_at?: string
          email: string
          first_login_completed?: boolean | null
          first_name?: string | null
          force_password_reset?: boolean | null
          id?: string
          invited_at?: string | null
          last_name?: string | null
          name?: string | null
          onboarding_email_sent_at?: string | null
          organization_id: string
          password_hash?: string | null
          phone?: string | null
          recruiter_id?: string | null
          role_id?: string | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          bank_account_number?: string | null
          bank_reg_number?: string | null
          birth_date?: string | null
          channel_type?: string | null
          created_at?: string
          email?: string
          first_login_completed?: boolean | null
          first_name?: string | null
          force_password_reset?: boolean | null
          id?: string
          invited_at?: string | null
          last_name?: string | null
          name?: string | null
          onboarding_email_sent_at?: string | null
          organization_id?: string
          password_hash?: string | null
          phone?: string | null
          recruiter_id?: string | null
          role_id?: string | null
          status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_auth_user_to_invited_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_developer_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_organization_for_current_user: {
        Args: {
          _name: string
          _primary_color?: string
          _secondary_color?: string
        }
        Returns: string
      }
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organization_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_role_level: {
        Args: { user_uuid: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
