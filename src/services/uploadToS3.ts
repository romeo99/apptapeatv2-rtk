import s3 from "../config/s3";
import { generateIcon } from "../utils/iconGenerator";

export const uploadToS3 = async (restaurantId: string, src: string) => {
    const file = await generateIcon(restaurantId, src);

    const params = {
        Bucket: 'tapeat-restaurants-logos-for-marker',//import.meta.env.VITE_AWS_BUCKET_NAME,
        Key: file.name,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read',
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};