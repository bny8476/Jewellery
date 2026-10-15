/**
 * Verified local fallback images for each jewelry category/metal
 * Ensures cards never show a broken image box if an external URL 404s.
 */
export const getJewelryFallbackImage = (category?: string, metalType?: string): string => {
  const cat = (category || '').toLowerCase();
  const metal = (metalType || '').toLowerCase();

  if (cat.includes('earring') || cat.includes('jhumka')) {
    return '/images/trend_diamond_earrings.jpg';
  }
  if (cat.includes('bangle') || cat.includes('kada') || cat.includes('bracelet')) {
    return '/images/trend_rose_gold_kada.jpg';
  }
  if (cat.includes('chain')) {
    return '/images/gold_rope_chain.jpg';
  }
  if (cat.includes('pendant')) {
    return '/images/gold_pendant_ganesha.jpg';
  }
  if (cat.includes('coin') || cat.includes('silver')) {
    return metal.includes('silver') ? '/images/silver_pooja_coin.jpg' : '/images/service_appointment.jpg';
  }
  if (cat.includes('ring')) {
    return '/images/cat_diamond.jpg';
  }
  if (cat.includes('bridal')) {
    return '/images/cat_bridal.jpg';
  }
  if (metal.includes('diamond')) {
    return '/images/cat_diamond.jpg';
  }

  return '/images/cat_gold.jpg';
};
