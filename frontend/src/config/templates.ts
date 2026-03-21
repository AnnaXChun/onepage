export interface TemplateConfig {
  id: number;
  slug: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'Blog' | 'Resume' | 'Personal Intro' | 'Portfolio';
  isPremium: boolean;
  price: number;
  tags: string[];
  color: string;
  blocksJsonPath?: string;
}

export const TEMPLATE_CATEGORIES = ['all', 'Blog', 'Resume', 'Personal Intro', 'Portfolio'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 1,
    slug: 'minimal-simple',
    name: 'Minimal',
    description: 'Clean and simple single-column layout',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop',
    category: 'Personal Intro',
    isPremium: false,
    price: 0,
    tags: ['Free', 'Minimal'],
    color: 'from-zinc-700 to-zinc-900',
    blocksJsonPath: '/templates/minimal-simple/blocks.json',
  },
  {
    id: 2,
    slug: 'gallery-display',
    name: 'Gallery',
    description: 'Image-focused grid layout',
    thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&h=800&fit=crop',
    category: 'Portfolio',
    isPremium: false,
    price: 0,
    tags: ['Free', 'Photo'],
    color: 'from-purple-700 to-zinc-900',
    blocksJsonPath: '/templates/gallery-display/blocks.json',
  },
  {
    id: 3,
    slug: 'vintage-style',
    name: 'Vintage',
    description: 'Warm retro aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=800&fit=crop',
    category: 'Personal Intro',
    isPremium: true,
    price: 9.9,
    tags: ['Pro', 'Style'],
    color: 'from-amber-700 to-zinc-900',
    blocksJsonPath: '/templates/vintage-style/blocks.json',
  },
  {
    id: 4,
    slug: 'ultra-minimal',
    name: 'Ultra',
    description: 'Maximum whitespace, essential elements only',
    thumbnail: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=600&h=800&fit=crop',
    category: 'Personal Intro',
    isPremium: true,
    price: 9.9,
    tags: ['Pro', 'Minimal'],
    color: 'from-slate-700 to-zinc-900',
    blocksJsonPath: '/templates/ultra-minimal/blocks.json',
  },
  {
    id: 5,
    slug: 'creative-card',
    name: 'Creative',
    description: 'Card-based creative layout',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&h=800&fit=crop',
    category: 'Portfolio',
    isPremium: true,
    price: 19.9,
    tags: ['Pro', 'Creative'],
    color: 'from-blue-700 to-zinc-900',
    blocksJsonPath: '/templates/creative-card/blocks.json',
  },
  {
    id: 6,
    slug: 'paper-fold',
    name: 'Paper',
    description: 'Elegant folded paper aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=800&fit=crop',
    category: 'Personal Intro',
    isPremium: true,
    price: 9.9,
    tags: ['Pro', 'Style'],
    color: 'from-amber-600 to-zinc-900',
    blocksJsonPath: '/templates/paper-fold/blocks.json',
  },
  {
    id: 7,
    slug: 'retro-wave',
    name: 'Retro',
    description: '80s retro wave aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600&h=800&fit=crop',
    category: 'Blog',
    isPremium: true,
    price: 9.9,
    tags: ['Pro', 'Retro'],
    color: 'from-pink-600 to-purple-900',
    blocksJsonPath: '/templates/retro-wave/blocks.json',
  },
  {
    id: 8,
    slug: 'glass-morphism',
    name: 'Glass',
    description: 'Modern glass morphism effect',
    thumbnail: 'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=600&h=800&fit=crop',
    category: 'Blog',
    isPremium: true,
    price: 14.9,
    tags: ['Pro', 'Glass'],
    color: 'from-blue-500 to-zinc-900',
    blocksJsonPath: '/templates/glass-morphism/blocks.json',
  },
  {
    id: 9,
    slug: 'neon-pulse',
    name: 'Neon',
    description: 'Vibrant neon light effects',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=800&fit=crop',
    category: 'Blog',
    isPremium: true,
    price: 9.9,
    tags: ['Pro', 'Neon'],
    color: 'from-violet-600 to-zinc-900',
    blocksJsonPath: '/templates/neon-pulse/blocks.json',
  },
  {
    id: 10,
    slug: 'zen-minimal',
    name: 'Zen',
    description: 'Calm and zen-like minimal',
    thumbnail: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=600&h=800&fit=crop',
    category: 'Personal Intro',
    isPremium: true,
    price: 9.9,
    tags: ['Pro', 'Zen'],
    color: 'from-emerald-600 to-zinc-900',
    blocksJsonPath: '/templates/zen-minimal/blocks.json',
  },
];

export function getTemplateById(id: number): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplateBySlug(slug: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplatesByCategory(category: TemplateCategory): TemplateConfig[] {
  if (category === 'all') return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === category);
}
