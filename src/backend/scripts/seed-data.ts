import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

const INGREDIENTS = [
  { name: 'Ức gà', normalized_name: 'uc_ga', default_unit: 'gam', is_active: true },
  { name: 'Thịt bò', normalized_name: 'thit_bo', default_unit: 'gam', is_active: true },
  { name: 'Tôm tươi', normalized_name: 'tom_tuoi', default_unit: 'gam', is_active: true },
  { name: 'Cá hồi', normalized_name: 'ca_hoi', default_unit: 'gam', is_active: true },
  { name: 'Trứng gà', normalized_name: 'trung_ga', default_unit: 'quả', is_active: true },
  { name: 'Đậu phụ', normalized_name: 'dau_phu', default_unit: 'gam', is_active: true },
  { name: 'Gạo lứt', normalized_name: 'gao_lut', default_unit: 'gam', is_active: true },
  { name: 'Yến mạch', normalized_name: 'yen_mach', default_unit: 'gam', is_active: true },
  { name: 'Khoai lang', normalized_name: 'khoai_lang', default_unit: 'gam', is_active: true },
  { name: 'Bông cải xanh', normalized_name: 'bong_cai_xanh', default_unit: 'gam', is_active: true },
  { name: 'Rau bina (Cải bó xôi)', normalized_name: 'rau_bina', default_unit: 'gam', is_active: true },
  { name: 'Bơ quả', normalized_name: 'bo_qua', default_unit: 'quả', is_active: true },
  { name: 'Nấm đùi gà', normalized_name: 'nam_dui_ga', default_unit: 'gam', is_active: true },
  { name: 'Chuối chín', normalized_name: 'chuoi_chin', default_unit: 'quả', is_active: true },
  { name: 'Táo tây', normalized_name: 'tao_tay', default_unit: 'quả', is_active: true },
  { name: 'Sữa tươi không đường', normalized_name: 'sua_tuoi_khong_duong', default_unit: 'ml', is_active: true },
  { name: 'Sữa chua không đường', normalized_name: 'sua_chua_khong_duong', default_unit: 'hũ', is_active: true },
  { name: 'Hạnh nhân', normalized_name: 'hanh_nhan', default_unit: 'gam', is_active: true },
];

const DIET_TYPES = [
  { code: 'standard', name: 'Tiêu chuẩn', emoji: '🍽️', description: 'Không có hạn chế đặc biệt', is_active: true },
  { code: 'vegetarian', name: 'Ăn chay thanh đạm', emoji: '🥦', description: 'Không ăn thịt, có thể ăn trứng & sữa', is_active: true },
  { code: 'vegan', name: 'Ăn chay thuần (Vegan)', emoji: '🌱', description: 'Không dùng sản phẩm từ động vật', is_active: true },
  { code: 'keto', name: 'Keto / Low-Carb', emoji: '🥑', description: 'Ít tinh bột, giàu chất béo tốt', is_active: true },
  { code: 'paleo', name: 'Paleo', emoji: '🍖', description: 'Thực phẩm tự nhiên, không chế biến sẵn', is_active: true },
  { code: 'gluten_free', name: 'Không Gluten', emoji: '🌾', description: 'Né tránh lúa mì & ngũ cốc có gluten', is_active: true },
];

async function main() {
  console.log('Seeding ingredients into database...');
  const { data: ingData, error: ingError } = await supabase
    .from('ingredients')
    .upsert(INGREDIENTS, { onConflict: 'normalized_name' })
    .select();

  if (ingError) {
    console.error('Error seeding ingredients:', ingError.message);
  } else {
    console.log(`Successfully seeded ${ingData?.length || 0} ingredients.`);
  }

  console.log('Seeding diet_types into database...');
  const { data: dietData, error: dietError } = await supabase
    .from('diet_types')
    .upsert(DIET_TYPES, { onConflict: 'code' })
    .select();

  if (dietError) {
    console.error('Error seeding diet_types:', dietError.message);
    if (dietError.message.includes('relation "public.diet_types" does not exist')) {
      console.log('diet_types table does not exist on remote database yet.');
    }
  } else {
    console.log(`Successfully seeded ${dietData?.length || 0} diet_types.`);
  }
}

main().catch(console.error);
