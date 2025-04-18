export const generateIcon = (restaurantId: string, src: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 100;

        if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
        }

        canvas.width = size;
        canvas.height = size;

        // Découper le canvas en cercle
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        // Charger et dessiner l'image
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Permettre les requêtes cross-origin
        img.src = src;
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);

            // Ajouter un contour vert
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 2.5, 0, Math.PI * 2);
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'green';
            ctx.stroke();

            // Convertir en Blob et retourner un fichier
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `${restaurantId}-logo.png`, { type: 'image/png' });
                    resolve(file);
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            }, 'image/png');

            // Convertir en Blob et télécharger
            /* canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'modified-image.png';
                    link.click();
                    URL.revokeObjectURL(url); // Nettoyer l'URL
                }
            }, 'image/png'); */
        };

        img.onerror = (error) => {
            reject(new Error('Failed to load image'));
        };
    });
};