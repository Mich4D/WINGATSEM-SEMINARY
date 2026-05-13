export const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Only compress images
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output type, keep PNG as PNG, otherwise use WebP/JPEG
        let outputType = 'image/jpeg';
        if (file.type === 'image/png') outputType = 'image/png';
        else if (file.type === 'image/webp') outputType = 'image/webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};
