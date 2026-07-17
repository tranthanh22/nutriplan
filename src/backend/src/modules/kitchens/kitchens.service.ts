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
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('kitchen_offers')
      .select('*, kitchen_offer_items(*, dishes(id, name, slug, image_path, dish_nutrition(*)))')
      .eq('kitchen_id', kitchenId)
      .eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    if (!data?.length) throw new NotFoundException('Bếp chưa có offer đang bán');
    return data;
  }
}
