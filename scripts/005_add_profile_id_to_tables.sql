-- ======================================================
-- ✅ STEP 1: Add profile_id columns to key tables
-- ======================================================
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.task_templates 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.disclosure_templates 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_profile_id ON public.transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_clients_profile_id ON public.clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_profile_id ON public.email_templates(profile_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_profile_id ON public.task_templates(profile_id);
CREATE INDEX IF NOT EXISTS idx_disclosure_templates_profile_id ON public.disclosure_templates(profile_id);

-- ======================================================
-- ✅ STEP 2: Enable Row Level Security
-- ======================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- ✅ STEP 3: Profiles RLS Policies
-- ======================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ======================================================
-- ✅ STEP 4: Transactions RLS Policies
-- ======================================================
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions FOR DELETE 
USING (auth.uid() = profile_id);

-- ======================================================
-- ✅ STEP 5: Clients RLS Policies
-- ======================================================
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients" 
ON public.clients FOR SELECT 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
CREATE POLICY "Users can insert their own clients" 
ON public.clients FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
CREATE POLICY "Users can update their own clients" 
ON public.clients FOR UPDATE 
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can delete their own clients" 
ON public.clients FOR DELETE 
USING (auth.uid() = profile_id);

-- ======================================================
-- ✅ STEP 6: Contacts (linked via transactions)
-- ======================================================
DROP POLICY IF EXISTS "Users can view contacts for their transactions" ON public.contacts;
CREATE POLICY "Users can view contacts for their transactions" 
ON public.contacts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = contacts.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert contacts for their transactions" ON public.contacts;
CREATE POLICY "Users can insert contacts for their transactions" 
ON public.contacts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = contacts.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update contacts for their transactions" ON public.contacts;
CREATE POLICY "Users can update contacts for their transactions" 
ON public.contacts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = contacts.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = contacts.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete contacts for their transactions" ON public.contacts;
CREATE POLICY "Users can delete contacts for their transactions" 
ON public.contacts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = contacts.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

-- ======================================================
-- ✅ STEP 7: Templates & Items Tables
-- ======================================================

-- Email templates
DROP POLICY IF EXISTS "Users can view their own email templates" ON public.email_templates;
CREATE POLICY "Users can view their own email templates"
ON public.email_templates FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert their own email templates" ON public.email_templates;
CREATE POLICY "Users can insert their own email templates"
ON public.email_templates FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update their own email templates" ON public.email_templates;
CREATE POLICY "Users can update their own email templates"
ON public.email_templates FOR UPDATE USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete their own email templates" ON public.email_templates;
CREATE POLICY "Users can delete their own email templates"
ON public.email_templates FOR DELETE USING (auth.uid() = profile_id);

-- Task templates
DROP POLICY IF EXISTS "Users can view their own task templates" ON public.task_templates;
CREATE POLICY "Users can view their own task templates"
ON public.task_templates FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert their own task templates" ON public.task_templates;
CREATE POLICY "Users can insert their own task templates"
ON public.task_templates FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update their own task templates" ON public.task_templates;
CREATE POLICY "Users can update their own task templates"
ON public.task_templates FOR UPDATE USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete their own task templates" ON public.task_templates;
CREATE POLICY "Users can delete their own task templates"
ON public.task_templates FOR DELETE USING (auth.uid() = profile_id);

-- Disclosure templates
DROP POLICY IF EXISTS "Users can view their own disclosure templates" ON public.disclosure_templates;
CREATE POLICY "Users can view their own disclosure templates"
ON public.disclosure_templates FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert their own disclosure templates" ON public.disclosure_templates;
CREATE POLICY "Users can insert their own disclosure templates"
ON public.disclosure_templates FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update their own disclosure templates" ON public.disclosure_templates;
CREATE POLICY "Users can update their own disclosure templates"
ON public.disclosure_templates FOR UPDATE USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete their own disclosure templates" ON public.disclosure_templates;
CREATE POLICY "Users can delete their own disclosure templates"
ON public.disclosure_templates FOR DELETE USING (auth.uid() = profile_id);

-- Task items (via transaction)
DROP POLICY IF EXISTS "Users can view task items for their transactions" ON public.task_items;
CREATE POLICY "Users can view task items for their transactions"
ON public.task_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = task_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert task items for their transactions" ON public.task_items;
CREATE POLICY "Users can insert task items for their transactions"
ON public.task_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = task_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update task items for their transactions" ON public.task_items;
CREATE POLICY "Users can update task items for their transactions"
ON public.task_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = task_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete task items for their transactions" ON public.task_items;
CREATE POLICY "Users can delete task items for their transactions"
ON public.task_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = task_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

-- Disclosure items (via transaction)
DROP POLICY IF EXISTS "Users can view disclosure items for their transactions" ON public.disclosure_items;
CREATE POLICY "Users can view disclosure items for their transactions"
ON public.disclosure_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = disclosure_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert disclosure items for their transactions" ON public.disclosure_items;
CREATE POLICY "Users can insert disclosure items for their transactions"
ON public.disclosure_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = disclosure_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update disclosure items for their transactions" ON public.disclosure_items;
CREATE POLICY "Users can update disclosure items for their transactions"
ON public.disclosure_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = disclosure_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete disclosure items for their transactions" ON public.disclosure_items;
CREATE POLICY "Users can delete disclosure items for their transactions"
ON public.disclosure_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = disclosure_items.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

-- Email history (optional: allow unlinked)
DROP POLICY IF EXISTS "Users can view email history for their transactions" ON public.email_history;
CREATE POLICY "Users can view email history for their transactions"
ON public.email_history FOR SELECT USING (
  transaction_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = email_history.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert email history for their transactions" ON public.email_history;
CREATE POLICY "Users can insert email history for their transactions"
ON public.email_history FOR INSERT WITH CHECK (
  transaction_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = email_history.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update email history for their transactions" ON public.email_history;
CREATE POLICY "Users can update email history for their transactions"
ON public.email_history FOR UPDATE USING (
  transaction_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = email_history.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete email history for their transactions" ON public.email_history;
CREATE POLICY "Users can delete email history for their transactions"
ON public.email_history FOR DELETE USING (
  transaction_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = email_history.transaction_id 
    AND transactions.profile_id = auth.uid()
  )
);

-- ======================================================
-- ✅ STEP 8: Service Role Bypass (Admin/Server Access)
-- ======================================================
CREATE POLICY "Service role full access - profiles"
ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - transactions"
ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - clients"
ON public.clients FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - contacts"
ON public.contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - email_templates"
ON public.email_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - task_templates"
ON public.task_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - disclosure_templates"
ON public.disclosure_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - email_history"
ON public.email_history FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - task_items"
ON public.task_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access - disclosure_items"
ON public.disclosure_items FOR ALL TO service_role USING (true) WITH CHECK (true);
