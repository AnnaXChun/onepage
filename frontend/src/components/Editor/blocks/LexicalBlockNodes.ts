import { ElementNode, LexicalNode } from 'lexical';
import { BlockType, BlockConfig } from '../../../types/block';

/**
 * Base class for all block nodes in Lexical editor.
 * Stores block metadata separate from content.
 */
export class BlockNode extends ElementNode {
  blockId: string;
  blockType: BlockType;
  blockConfig: string;

  constructor(blockId: string, blockType: BlockType, blockConfig: string = '{}', key?: string) {
    super(key);
    this.blockId = blockId;
    this.blockType = blockType;
    this.blockConfig = blockConfig;
  }

  static getType(): string {
    return 'block';
  }

  static clone(node: BlockNode): BlockNode {
    return new BlockNode(node.blockId, node.blockType, node.blockConfig, node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.setAttribute('data-block-id', this.blockId);
    dom.setAttribute('data-block-type', this.blockType);
    return dom;
  }

  updateDOM(prevNode: BlockNode): boolean {
    return prevNode.blockId !== this.blockId || prevNode.blockType !== this.blockType;
  }

  getConfig(): BlockConfig {
    try {
      return JSON.parse(this.blockConfig);
    } catch {
      return {};
    }
  }

  setConfig(config: BlockConfig): void {
    this.blockConfig = JSON.stringify(config);
  }

  getJSON(): Record<string, unknown> {
    return {
      ...super.getJSON(),
      blockId: this.blockId,
      blockType: this.blockType,
      blockConfig: this.blockConfig,
    };
  }

  static importJSON(json: Record<string, unknown>): BlockNode {
    return new BlockNode(
      json.blockId as string,
      json.blockType as BlockType,
      json.blockConfig as string
    );
  }
}

/**
 * Factory function to create a new BlockNode.
 */
export function $createBlockNode(
  blockId: string,
  blockType: BlockType,
  blockConfig?: BlockConfig
): BlockNode {
  const configStr = blockConfig ? JSON.stringify(blockConfig) : '{}';
  return new BlockNode(blockId, blockType, configStr);
}

/**
 * Type guard to check if a node is a BlockNode.
 */
export function $isBlockNode(node: LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode;
}

/**
 * Social Links Node - stores platform/URL pairs
 */
export class SocialLinksNode extends BlockNode {
  socialLinks: string; // JSON array of {platform, url}

  constructor(blockId: string, blockConfig: string = '{}', key?: string) {
    super(blockId, 'social-links', blockConfig, key);
    this.socialLinks = '[]';
  }

  static getType(): string {
    return 'social-links-block';
  }

  static clone(node: SocialLinksNode): SocialLinksNode {
    return new SocialLinksNode(node.blockId, node.blockConfig, node.__key);
  }

  getLinks(): Array<{ platform: string; url: string }> {
    try {
      return JSON.parse(this.socialLinks);
    } catch {
      return [];
    }
  }

  setLinks(links: Array<{ platform: string; url: string }>): void {
    this.socialLinks = JSON.stringify(links);
  }

  getJSON(): Record<string, unknown> {
    return {
      ...super.getJSON(),
      socialLinks: this.socialLinks,
    };
  }

  static importJSON(json: Record<string, unknown>): SocialLinksNode {
    const node = new SocialLinksNode(
      json.blockId as string,
      json.blockConfig as string
    );
    node.socialLinks = (json.socialLinks as string) || '[]';
    return node;
  }
}

/**
 * Divider Node - stores style (solid/dashed/dotted)
 */
export class DividerNode extends BlockNode {
  dividerStyle: 'solid' | 'dashed' | 'dotted';

  constructor(blockId: string, blockConfig: string = '{}', key?: string) {
    super(blockId, 'divider', blockConfig, key);
    this.dividerStyle = 'solid';
  }

  static getType(): string {
    return 'divider-block';
  }

  static clone(node: DividerNode): DividerNode {
    const cloned = new DividerNode(node.blockId, node.blockConfig, node.__key);
    cloned.dividerStyle = node.dividerStyle;
    return cloned;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.setAttribute('data-block-id', this.blockId);
    dom.setAttribute('data-block-type', 'divider');
    dom.className = 'divider-block';
    return dom;
  }

  getJSON(): Record<string, unknown> {
    return {
      ...super.getJSON(),
      dividerStyle: this.dividerStyle,
    };
  }

  static importJSON(json: Record<string, unknown>): DividerNode {
    const node = new DividerNode(
      json.blockId as string,
      json.blockConfig as string
    );
    node.dividerStyle = (json.dividerStyle as 'solid' | 'dashed' | 'dotted') || 'solid';
    return node;
  }
}

/**
 * Contact Form Node - stores form fields
 */
export class ContactFormNode extends BlockNode {
  formFields: string; // JSON array of {type, label, required}

  constructor(blockId: string, blockConfig: string = '{}', key?: string) {
    super(blockId, 'contact-form', blockConfig, key);
    this.formFields = '[]';
  }

  static getType(): string {
    return 'contact-form-block';
  }

  static clone(node: ContactFormNode): ContactFormNode {
    const cloned = new ContactFormNode(node.blockId, node.blockConfig, node.__key);
    cloned.formFields = node.formFields;
    return cloned;
  }

  getFields(): Array<{ type: string; label: string; required: boolean }> {
    try {
      return JSON.parse(this.formFields);
    } catch {
      return [];
    }
  }

  setFields(fields: Array<{ type: string; label: string; required: boolean }>): void {
    this.formFields = JSON.stringify(fields);
  }

  getJSON(): Record<string, unknown> {
    return {
      ...super.getJSON(),
      formFields: this.formFields,
    };
  }

  static importJSON(json: Record<string, unknown>): ContactFormNode {
    const node = new ContactFormNode(
      json.blockId as string,
      json.blockConfig as string
    );
    node.formFields = (json.formFields as string) || '[]';
    return node;
  }
}

/**
 * Image Node - stores url, aspectRatio, rounded
 */
export class ImageNode extends BlockNode {
  imageUrl: string;
  aspectRatio: string;
  rounded: boolean;

  constructor(blockId: string, blockConfig: string = '{}', key?: string) {
    super(blockId, 'image-single', blockConfig, key);
    this.imageUrl = '';
    this.aspectRatio = '16/9';
    this.rounded = false;
  }

  static getType(): string {
    return 'image-block';
  }

  static clone(node: ImageNode): ImageNode {
    const cloned = new ImageNode(node.blockId, node.blockConfig, node.__key);
    cloned.imageUrl = node.imageUrl;
    cloned.aspectRatio = node.aspectRatio;
    cloned.rounded = node.rounded;
    return cloned;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.setAttribute('data-block-id', this.blockId);
    dom.setAttribute('data-block-type', this.blockType);
    dom.className = 'image-block';
    return dom;
  }

  getJSON(): Record<string, unknown> {
    return {
      ...super.getJSON(),
      imageUrl: this.imageUrl,
      aspectRatio: this.aspectRatio,
      rounded: this.rounded,
    };
  }

  static importJSON(json: Record<string, unknown>): ImageNode {
    const node = new ImageNode(
      json.blockId as string,
      json.blockConfig as string
    );
    node.imageUrl = (json.imageUrl as string) || '';
    node.aspectRatio = (json.aspectRatio as string) || '16/9';
    node.rounded = (json.rounded as boolean) || false;
    return node;
  }
}
