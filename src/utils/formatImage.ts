export const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  // If it's already a formatted uc?export=view link, convert it to thumbnail for better compatibility
  const ucMatch = url.match(/uc\?export=view&id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1000`;
  }

  // Handle standard Google Drive links
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && url.includes('drive.google.com')) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
  }
  
  return url;
};
