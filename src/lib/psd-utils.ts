import { writePsd } from 'ag-psd';

export async function convertImageToPsd(imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas1 = document.createElement('canvas');
      canvas1.width = img.width;
      canvas1.height = img.height;
      const ctx1 = canvas1.getContext('2d');
      if (!ctx1) return reject(new Error('Failed to get canvas context'));
      // Fill with white background for the composite image to prevent black background in some viewers
      ctx1.fillStyle = '#ffffff';
      ctx1.fillRect(0, 0, img.width, img.height);
      ctx1.drawImage(img, 0, 0, img.width, img.height);
      
      const canvas2 = document.createElement('canvas');
      canvas2.width = img.width;
      canvas2.height = img.height;
      const ctx2 = canvas2.getContext('2d');
      if (!ctx2) return reject(new Error('Failed to get canvas context'));
      ctx2.drawImage(img, 0, 0, img.width, img.height);

      const psd = {
        width: img.width,
        height: img.height,
        canvas: canvas1, // 添加合并图层(Composite Image)，解决 Mac 预览和部分软件打开黑屏的问题
        children: [
          {
            name: 'Layer 1',
            canvas: canvas2,
          }
        ]
      };

      try {
        const buffer = writePsd(psd);
        const blob = new Blob([buffer], { type: 'application/vnd.adobe.photoshop' });
        resolve(blob);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for PSD conversion'));
    img.src = imageUrl;
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
