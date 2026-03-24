import { ElementNode, LexicalNode } from 'lexical';
import { BlockType } from '../../types/block';

/**
 * Custom Lexical node for storing block data.
 * Extends ElementNode to support children (for nested content).
 */
export class BlockNode extends ElementNode {
  blockId: string;
  blockType: BlockType;
  blockConfig: string; // JSON stringified BlockConfig

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
export function $createBlockNode(blockId: string, blockType: BlockType, blockConfig?: Record<string, unknown>): BlockNode {
  const configStr = blockConfig ? JSON.stringify(blockConfig) : '{}';
  return new BlockNode(blockId, blockType, configStr);
}

/**
 * Type guard to check if a node is a BlockNode.
 */
export function $isBlockNode(node: LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode;
}
