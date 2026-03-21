import ColorThief from 'colorthief';

export interface ColorPalette {
  colors: string[];
  dominant: string;
  mood: string[];
}

const DEFAULT_PALETTE: string[] = ['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#1F2937'];

export async function extractColors(imageUrl: string, colorCount = 5): Promise<ColorPalette> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve) => {
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, colorCount);
        const hexColors = palette.map(([r, g, b]: [number, number, number]) =>
          `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
        );
        resolve({
          colors: hexColors,
          dominant: hexColors[0],
          mood: inferMood(hexColors),
        });
      } catch {
        resolve({
          colors: DEFAULT_PALETTE,
          dominant: DEFAULT_PALETTE[0],
          mood: ['neutral'],
        });
      }
    };
    img.onerror = () => {
      resolve({
        colors: DEFAULT_PALETTE,
        dominant: DEFAULT_PALETTE[0],
        mood: ['neutral'],
      });
    };
    img.src = imageUrl;
  });
}

function inferMood(colors: string[]): string[] {
  const moods: string[] = [];
  // Basic mood inference based on color properties
  // Enhanced mood analysis can be added with MiniMax AI
  return moods;
}