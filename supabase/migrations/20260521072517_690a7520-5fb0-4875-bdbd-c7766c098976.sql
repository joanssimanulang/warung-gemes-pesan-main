
-- Tables
CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tables" ON public.tables FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can insert tables" ON public.tables FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admin can update tables" ON public.tables FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admin can delete tables" ON public.tables FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

CREATE TRIGGER trg_tables_updated BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Rooms
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  building text,
  floor text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admin can update rooms" ON public.rooms FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admin can delete rooms" ON public.rooms FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

CREATE TRIGGER trg_rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Orders: location_type + room_id, table_number nullable
CREATE TYPE public.location_type AS ENUM ('kantin', 'ruangan');

ALTER TABLE public.orders
  ADD COLUMN location_type public.location_type NOT NULL DEFAULT 'kantin',
  ADD COLUMN room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

ALTER TABLE public.orders ALTER COLUMN table_number DROP NOT NULL;

-- Seed beberapa meja default supaya checkout tetap jalan
INSERT INTO public.tables (label) VALUES ('1'),('2'),('3'),('4'),('5'),('6'),('7'),('8'),('9'),('10');
