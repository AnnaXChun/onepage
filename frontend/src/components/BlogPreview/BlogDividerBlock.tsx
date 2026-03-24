import { BlockState } from '../../stores/editorStore';

interface BlogDividerBlockProps {
  block: BlockState;
}

export default function BlogDividerBlock({ block }: BlogDividerBlockProps) {
  return (
    <hr className="border-border" />
  );
}
