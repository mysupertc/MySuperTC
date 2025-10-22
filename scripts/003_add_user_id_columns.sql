-- Migration to add user_id columns if they don't exist
-- This is a safety migration in case tables were created without user_id

-- Add user_id to transactions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    
    CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
  END IF;
END $$;

-- Add user_id to tasks if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.tasks 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    
    CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
  END IF;
END $$;

-- Add user_id to clients if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.clients 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    
    CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients(user_id);
  END IF;
END $$;

-- Add user_id to calendar_events if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calendar_events' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.calendar_events 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    
    CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON public.calendar_events(user_id);
  END IF;
END $$;

-- Add user_id to checklist_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'checklist_items' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.checklist_items 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
  END IF;
END $$;
