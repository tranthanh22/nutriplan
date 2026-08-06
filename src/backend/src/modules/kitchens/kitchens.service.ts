import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class KitchensService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('kitchens')
      .select('id, name, slug, description, logo_path, address_text, rating_average, rating_count')
      .eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async offers(kitchenId: string) {
    const client = this.supabase.getPublicClient();
    const { data: kitchen, error: kitchenError } = await client
      .from('kitchens')
      .select('id')
      .eq('id', kitchenId)
      .eq('status', 'active')
      .maybeSingle();
    if (kitchenError) throw new InternalServerErrorException(kitchenError.message);
    if (!kitchen) throw new NotFoundException('Bếp hiện không hoạt động');

    const { data, error } = await client
      .from('kitchen_offers')
      .select('*, kitchen_offer_items(*, dishes(id, name, slug, image_path, dish_nutrition(*)))')
      .eq('kitchen_id', kitchenId)
      .eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    if (!data?.length) throw new NotFoundException('Bếp chưa có offer đang bán');
    return data;
  }
}
