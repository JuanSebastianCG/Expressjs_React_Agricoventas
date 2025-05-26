import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Inicializar el cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Función para crear un middleware de multer con S3
export const createS3Upload = (folderName: string) => {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_S3_BUCKET || 'agricoventas-uploads',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${folderName}/${uuidv4()}${fileExtension}`;
        cb(null, fileName);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no soportado. Solo se permiten JPG, PNG y WEBP.'));
      }
    },
  });
};

// Exportar middlewares específicos para diferentes tipos de carga
export const uploadProductImage = createS3Upload('products');
export const uploadProfileImage = createS3Upload('profiles');
export const uploadCertificationImage = createS3Upload('certifications');

// Función para transformar la URL de S3 a una URL pública
export const getS3Url = (key: string): string => {
  const bucket = process.env.AWS_S3_BUCKET || 'agricoventas-uploads';
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// Función para obtener solo la clave (key) de una URL de S3
export const getS3KeyFromUrl = (url: string): string | null => {
  const bucket = process.env.AWS_S3_BUCKET || 'agricoventas-uploads';
  const regex = new RegExp(`https://${bucket}.s3.[a-z0-9-]+.amazonaws.com/(.*)`);
  const match = url.match(regex);
  return match ? match[1] : null;
}; 