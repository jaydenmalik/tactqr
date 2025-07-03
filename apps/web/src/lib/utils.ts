export function getWordCount(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Remove extra whitespace and split by whitespace
  const words = text.trim().split(/\s+/);
  
  // Filter out empty strings
  return words.filter(word => word.length > 0).length;
}

export function formatWordCount(count: number): string {
  if (count === 0) return '0 words';
  if (count === 1) return '1 word';
  return `${count} words`;
} 