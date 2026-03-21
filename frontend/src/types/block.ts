export type BlockType =
  | 'text-h1' | 'text-h2' | 'text-paragraph' | 'text-list'
  | 'image-single' | 'image-gallery'
  | 'social-links' | 'contact-form' | 'divider'
  | 'text-container';

export interface BlockConfig {
  aspectRatio?: string;
  rounded?: boolean;
  allowedBlockTypes?: BlockType[];
}

export interface BlockDefinition {
  id: string;
  type: BlockType;
  selector: string;
  placeholder: string;
  defaultContent: string;
  config: BlockConfig;
}

export interface BlockManifest {
  version: string;
  blocks: BlockDefinition[];
}
