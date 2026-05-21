
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin');
CREATE TYPE public.order_status AS ENUM ('menunggu', 'diproses', 'selesai');
CREATE TYPE public.payment_status AS ENUM ('menunggu_pembayaran', 'dibayar', 'gagal');

-- user_roles table (separate from auth.users)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security definer helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','superadmin')
  );
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- menus table
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menus"
  ON public.menus FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can insert menus"
  ON public.menus FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admin can update menus"
  ON public.menus FOR UPDATE TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admin can delete menus"
  ON public.menus FOR DELETE TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

-- orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  table_number TEXT NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'menunggu',
  payment_status public.payment_status NOT NULL DEFAULT 'menunggu_pembayaran',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone (anon/auth) can create an order (guest checkout)
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read order by id (needed for tracking page). RLS doesn't filter by id easily, so allow select to all.
CREATE POLICY "Anyone can read orders"
  ON public.orders FOR SELECT TO anon, authenticated USING (true);

-- Only admin can update orders
CREATE POLICY "Admin can update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admin can delete orders"
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

-- order_items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  menu_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order_items"
  ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read order_items"
  ON public.order_items FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can delete order_items"
  ON public.order_items FOR DELETE TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER menus_touch BEFORE UPDATE ON public.menus
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;

-- Storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images','menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read menu images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'menu-images');

CREATE POLICY "Admin upload menu images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admin update menu images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admin delete menu images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin_or_super(auth.uid()));
