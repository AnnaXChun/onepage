import api from './api';

export async function aiWrite(
  blockId: string,
  existingText: string,
  mode: 'replace' | 'append'
): Promise<string> {
  const response = await api.post('/api/ai/write', {
    blockId,
    existingText,
    mode
  });
  return response.data.content;
}
