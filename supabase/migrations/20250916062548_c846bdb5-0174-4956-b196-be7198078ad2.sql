-- Allow CEOs to create organizations
CREATE POLICY "CEOs can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users u 
    JOIN public.user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.name = 'ceo'
  )
);