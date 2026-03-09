export type Deal = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  original_price: number | null;
  deal_price: number;
  quantity_total: number;
  quantity_reserved: number;
  pickup_start: string | null;
  pickup_end: string | null;
  expires_at: string | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;

  quantity_remaining?: number;
  store_name?: string;
  store_address?: string | null;
  store_city?: string | null;
  store_area?: string | null;
  store_phone?: string | null;
  store_pickup_notes?: string | null;
};