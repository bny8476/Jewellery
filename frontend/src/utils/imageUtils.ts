/**
 * Verified local fallback images for each jewelry category/metal
 * Ensures cards never show a broken image box if an external URL 404s.
 */
export const getJewelryFallbackImage = (category?: string, metalType?: string): string => {
  const cat = (category || '').toLowerCase();
  const metal = (metalType || '').toLowerCase();

  if (cat.includes('earring') || cat.includes('jhumka')) {
    return '/images/earring_peacock_jhumkas.jpg';
  }
  if (cat.includes('tennis') || cat.includes('bracelet')) {
    return '/images/diamond_tennis_bracelet.jpg';
  }
  if (cat.includes('bangle') || cat.includes('kada')) {
    return metal.includes('diamond') || metal.includes('rose') ? '/images/trend_rose_gold_kada.jpg' : '/images/mens_gold_kada.jpg';
  }
  if (cat.includes('chain')) {
    return metal.includes('silver') ? '/images/chain_sterling_silver.jpg' : '/images/gold_rope_chain.jpg';
  }
  if (cat.includes('mangalsutra')) {
    return '/images/necklace_diamond_mangalsutra.jpg';
  }
  if (cat.includes('pendant')) {
    return '/images/pendant_colombian_emerald.jpg';
  }
  if (cat.includes('coin') || cat.includes('bullion')) {
    return metal.includes('silver') ? '/images/silver_pooja_coin.jpg' : '/images/gold_coin_1g.jpg';
  }
  if (cat.includes('ring')) {
    return metal.includes('platinum') ? '/images/ring_platinum_couple_bands.jpg' : '/images/ring_solitaire_diamond.jpg';
  }
  if (cat.includes('bridal')) {
    return '/images/cat_bridal.jpg';
  }
  if (cat.includes('necklace')) {
    return '/images/necklace_south_sea_pearl.jpg';
  }
  if (metal.includes('diamond')) {
    return '/images/ring_solitaire_diamond.jpg';
  }

  return '/images/cat_gold.jpg';
};
