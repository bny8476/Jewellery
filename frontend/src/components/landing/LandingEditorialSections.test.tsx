import { describe, it, expect } from 'vitest';
import { 
  featuredCollections, 
  bridalCollectionData, 
  divineCollectionData, 
  occasionMosaicData 
} from '../../data/landingCollections';
import { 
  FeaturedCollections, 
  BridalCollectionSection, 
  DivineCollectionSection, 
  OccasionMosaic,
  CollectionCTA,
  CollectionImageCard,
  ServicesExperienceSection
} from './index';

describe('Landing Page 4-Part Luxury-Fashion Editorial Sequence', () => {
  it('exports all 4 section components and sub-components properly', () => {
    expect(FeaturedCollections).toBeDefined();
    expect(BridalCollectionSection).toBeDefined();
    expect(DivineCollectionSection).toBeDefined();
    expect(OccasionMosaic).toBeDefined();
    expect(CollectionCTA).toBeDefined();
    expect(CollectionImageCard).toBeDefined();
  });

  it('verifies Section 1: Featured Collections asymmetric collage data', () => {
    expect(featuredCollections).toHaveLength(3);
    const leftCard = featuredCollections.find(c => c.spanRows);
    expect(leftCard).toBeDefined();
    expect(leftCard?.title).toBe('Layered Luxe');
    expect(leftCard?.subtitle).toBe('Stack it. Style it. Own it.');

    const ethnicGlow = featuredCollections.find(c => c.id === 'ethnic-glow');
    expect(ethnicGlow?.title).toBe('Ethnic Glow');
    expect(ethnicGlow?.subtitle).toBe('Tradition with a timeless touch.');

    const diamondWhisper = featuredCollections.find(c => c.id === 'diamond-whisper');
    expect(diamondWhisper?.title).toBe('Diamond Whisper');
    expect(diamondWhisper?.subtitle).toBe('Delicate. Divine. Breathtaking.');
  });

  it('verifies Section 2: Bridal Collection editorial split data', () => {
    expect(bridalCollectionData.eyebrow).toBe('BRIDAL COLLECTION');
    expect(bridalCollectionData.title).toBe('Where Every Bride');
    expect(bridalCollectionData.italicTitle).toBe('Becomes a Tradition');
    expect(bridalCollectionData.ctaText).toBe('EXPLORE COLLECTION');
    expect(bridalCollectionData.image).toBe('/images/editorial_bridal_temple_heirloom.jpg');
    expect(bridalCollectionData.imageAlt).toContain('Traditional South Indian bridal temple gold jewellery');
    expect(bridalCollectionData.highlights.length).toBeGreaterThan(0);
  });

  it('verifies Section 3: Divine Idols reversed split data', () => {
    expect(divineCollectionData.eyebrow).toBe('SACRED COLLECTION');
    expect(divineCollectionData.title).toBe('Divine Idols');
    expect(divineCollectionData.ctaText).toBe('EXPLORE COLLECTION');
    expect(divineCollectionData.image).toBe('/images/editorial_divine_ganesha_hero.jpg');
    expect(divineCollectionData.imageAlt).toContain('24K pure gold Ganesha');
    expect(divineCollectionData.features.length).toBeGreaterThanOrEqual(3);
  });

  it('verifies Section 4: Jewels for Every Occasion monochrome mosaic data', () => {
    expect(occasionMosaicData.eyebrow).toBe('JEWELS FOR EVERY OCCASION');
    expect(occasionMosaicData.backgroundImage).toBe('/images/yazhini_timeless_journey_model.jpg');
    expect(occasionMosaicData.items).toHaveLength(4);

    const categories = occasionMosaicData.items.map(item => item.category);
    expect(categories).toContain('NECKLACES');
    expect(categories).toContain('BANGLES');
    expect(categories).toContain('EARRINGS');
    expect(categories).toContain('RINGS');
  });

  it('exports and verifies ServicesExperienceSection component', () => {
    expect(ServicesExperienceSection).toBeDefined();
  });
});
