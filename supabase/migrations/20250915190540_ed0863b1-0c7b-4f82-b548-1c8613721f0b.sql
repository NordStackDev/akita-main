-- Update user roles to new 8-level hierarchy
UPDATE user_roles SET name = 'Admin', level = 1 WHERE name = 'Admin';
UPDATE user_roles SET name = 'CEO', level = 2 WHERE name = 'CEO';
UPDATE user_roles SET name = 'Salgsdirektør', level = 3 WHERE name = 'Salgsdirektør';
UPDATE user_roles SET name = 'Salgschef', level = 4 WHERE name = 'Salgschef';
UPDATE user_roles SET name = 'Teamleder', level = 5 WHERE name = 'Teamleder';

-- Update existing seller roles
UPDATE user_roles SET name = 'Senior Sælger', level = 6 WHERE name = 'Senior Sælger';
UPDATE user_roles SET name = 'Sælger', level = 7 WHERE name = 'Sælger';
UPDATE user_roles SET name = 'Junior Sælger', level = 8 WHERE name = 'Junior Sælger';

-- Insert missing roles if they don't exist
INSERT INTO user_roles (name, level, can_register_sale, can_view_stats, can_edit_data, can_create_user, can_delete_user, can_register_sickleave) 
VALUES 
  ('Senior Sælger', 6, true, true, false, false, false, true),
  ('Junior Sælger', 8, true, false, false, false, false, true)
ON CONFLICT (name) DO UPDATE SET 
  level = EXCLUDED.level,
  can_register_sale = EXCLUDED.can_register_sale,
  can_view_stats = EXCLUDED.can_view_stats;