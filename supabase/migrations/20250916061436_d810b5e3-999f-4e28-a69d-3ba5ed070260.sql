-- Insert CEO role if it doesn't exist
INSERT INTO user_roles (name, level, can_edit_data, can_delete_user, can_create_user, can_register_sale, can_register_sickleave, can_view_stats)
VALUES ('ceo', 1, true, true, true, true, true, true)
ON CONFLICT (name) DO NOTHING;