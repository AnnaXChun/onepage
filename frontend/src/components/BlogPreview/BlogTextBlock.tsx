import { BlockState } from '../../stores/editorStore';

interface BlogTextBlockProps {
  block: BlockState;
}

export default function BlogTextBlock({ block }: BlogTextBlockProps) {
  const content = block.content || '';

  const baseClasses = 'text-text-primary leading-relaxed';

  switch (block.type) {
    case 'text-h1':
      return (
        <h1
          className={`${baseClasses} text-4xl md:text-5xl font-bold tracking-tight`}
          style={{ color: block.config?.textColor as string }}
        >
          {content}
        </h1>
      );
    case 'text-h2':
      return (
        <h2
          className={`${baseClasses} text-2xl md:text-3xl font-bold tracking-tight`}
          style={{ color: block.config?.textColor as string }}
        >
          {content}
        </h2>
      );
    case 'text-paragraph':
      return (
        <p
          className={baseClasses}
          style={{ color: block.config?.textColor as string }}
        >
          {content}
        </p>
      );
    case 'text-list':
      const items = content.split('\n').filter((item: string) => item.trim());
      return (
        <ul className={`${baseClasses} list-disc list-inside space-y-2`}>
          {items.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    default:
      return (
        <p className={baseClasses}>{content}</p>
      );
  }
}
