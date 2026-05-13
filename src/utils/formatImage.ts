export const formatImageUrl = (url: string | null | undefined): string => {
  if (!url || url === 'null' || url === 'undefined') return '';
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';

  // If it's already a formatted uc?export=view link, convert it to thumbnail for better compatibility
  const ucMatch = trimmedUrl.match(/uc\?export=view&id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1000`;
  }

  // Handle standard Google Drive links
  const driveMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmedUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && trimmedUrl.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  }
  
  return trimmedUrl;
};
