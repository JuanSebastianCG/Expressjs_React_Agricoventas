import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createS3Upload, getS3ObjectUrl } from '../utils/s3Upload';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Constantes para middlewares de subida a S3
const PROFILE_MIME_TYPES = /^image\/(jpeg|png|gif|webp)$/;
const PRODUCT_MIME_TYPES = /^image\/(jpeg|png|gif|webp)$/;
const CERTIFICATION_MIME_TYPES = /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/;

// Middlewares para subida de archivos a S3 - nombres actualizados para coincidir con el frontend
export const handleProfileImageUpload = createS3Upload('profiles', PROFILE_MIME_TYPES).single('profileImage');
export const handleProductImageUpload = createS3Upload('products', PRODUCT_MIME_TYPES).single('productImage');
export const handleMultipleProductImagesUpload = createS3Upload('products', PRODUCT_MIME_TYPES).array('productImages', 5);
export const handleCertificationUpload = createS3Upload('certifications', CERTIFICATION_MIME_TYPES).single('certificationDocument');

export class UploadController {
  /**
   * Sube una imagen de perfil a S3
   */
  async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      // Verificar si se subió el archivo correctamente
      if (!req.file) {
        sendErrorResponse(res, 'No se ha proporcionado ninguna imagen', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Con multer-s3, el archivo ya está subido a S3
      const file = req.file as Express.MulterS3.File;
      const imageUrl = file.location || getS3ObjectUrl(file.key);

      console.log(`Imagen de perfil subida a S3: ${imageUrl}`);

      // Actualizar el perfil del usuario con la nueva URL de imagen
      const userId = req.user?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { profileImage: imageUrl }
        });
      }

      sendSuccessResponse(res, {
        imageUrl,
        message: 'Imagen de perfil subida correctamente'
      });
    } catch (error: any) {
      console.error('Error al subir imagen de perfil:', error);
      sendErrorResponse(res, `Error al subir la imagen: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Sube un documento de certificación a S3
   */
  async uploadCertificationDocument(req: Request, res: Response): Promise<void> {
    try {
      // Verificar si se subió el archivo correctamente
      if (!req.file) {
        sendErrorResponse(res, 'No se ha proporcionado ningún documento de certificación', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Con multer-s3, el archivo ya está subido a S3
      const file = req.file as Express.MulterS3.File;
      const documentUrl = file.location || getS3ObjectUrl(file.key);

      console.log(`Documento de certificación subido a S3: ${documentUrl}`);
      
      // Procesar la información adicional del formulario
      const userId = req.user?.userId;
      const { 
        certificationType, 
        certificateNumber, 
        issuedDate, 
        expiryDate, 
        certificationName 
      } = req.body;

      // Si tenemos toda la información necesaria, guardar la certificación
      if (userId && certificationType && certificateNumber && issuedDate && expiryDate && certificationName) {
        try {
          const existingCert = await prisma.userCertification.findFirst({
            where: { userId, certificationType },
          });

          let certification;
          if (existingCert) {
            certification = await prisma.userCertification.update({
              where: { id: existingCert.id },
              data: {
                certificationName,
                certificateNumber,
                issuedDate: new Date(issuedDate),
                expiryDate: new Date(expiryDate),
                imageUrl: documentUrl,
                status: 'PENDING',
                uploadedAt: new Date(),
                verifiedAt: null,
                verifierAdminId: null,
                rejectionReason: null,
              },
            });
          } else {
            certification = await prisma.userCertification.create({
              data: {
                userId,
                certificationName,
                certificationType,
                certificateNumber,
                issuedDate: new Date(issuedDate),
                expiryDate: new Date(expiryDate),
                imageUrl: documentUrl,
                status: 'PENDING',
              },
            });
          }

          sendSuccessResponse(res, {
            message: 'Documento de certificación subido/actualizado exitosamente',
            documentUrl,
            certification,
          });
        } catch (dbError: any) {
          console.error("Error al guardar certificación en la base de datos:", dbError);
          sendErrorResponse(res, `Error al guardar la certificación: ${dbError.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      } else {
        // Solo devolver la URL del documento si no tenemos toda la información
        sendSuccessResponse(res, {
          documentUrl,
          message: 'Documento de certificación subido correctamente'
        });
      }
    } catch (error: any) {
      console.error('Error al subir documento de certificación:', error);
      sendErrorResponse(res, `Error al subir el documento: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Sube una imagen de producto a S3
   */
  async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      // Verificar si se subió el archivo correctamente
      if (!req.file) {
        sendErrorResponse(res, 'No se ha proporcionado ninguna imagen', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Con multer-s3, el archivo ya está subido a S3
      const file = req.file as Express.MulterS3.File;
      const imageUrl = file.location || getS3ObjectUrl(file.key);

      console.log(`Imagen de producto subida a S3: ${imageUrl}`);
      
      // Procesar información adicional
      const { productId, isPrimary = 'false', altText = '', displayOrder = '0' } = req.body;
      const sellerId = req.user?.userId;

      // Si tenemos productId y sellerId, guardar en la base de datos
      if (productId && sellerId) {
        try {
          const product = await prisma.product.findUnique({ where: { id: productId } });
          
          if (!product) {
            sendErrorResponse(res, 'Producto no encontrado', HttpStatusCode.NOT_FOUND);
            return;
          }
          
          if (product.sellerId !== sellerId && req.user?.userType !== 'ADMIN') {
            sendErrorResponse(res, 'No tienes permiso para añadir imágenes a este producto', HttpStatusCode.FORBIDDEN);
            return;
          }

          const primaryBool = isPrimary === 'true';
          const orderNum = parseInt(displayOrder, 10);

          if (primaryBool) {
            await prisma.productImage.updateMany({
              where: { productId: productId, isPrimary: true },
              data: { isPrimary: false },
            });
          }

          const newProductImage = await prisma.productImage.create({
            data: {
              productId,
              imageUrl,
              altText,
              isPrimary,
              displayOrder: orderNum,
            },
          });

          sendSuccessResponse(res, {
            message: 'Imagen de producto subida exitosamente',
            imageUrl,
            productImage: newProductImage,
          });
        } catch (dbError: any) {
          console.error("Error al guardar imagen de producto en la base de datos:", dbError);
          sendErrorResponse(res, `Error al guardar la imagen: ${dbError.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      } else {
        // Solo devolver la URL de la imagen si no tenemos toda la información
        sendSuccessResponse(res, {
          imageUrl,
          message: 'Imagen de producto subida correctamente'
        });
      }
    } catch (error: any) {
      console.error('Error al subir imagen de producto:', error);
      sendErrorResponse(res, `Error al subir la imagen: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Sube múltiples imágenes de producto a S3
   */
  async uploadMultipleProductImages(req: Request, res: Response): Promise<void> {
    try {
      // Verificar si se subieron archivos correctamente
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        sendErrorResponse(res, 'No se han proporcionado imágenes', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Con multer-s3, los archivos ya están subidos a S3
      const files = req.files as Express.MulterS3.File[];
      const imageUrls = files.map(file => file.location || getS3ObjectUrl(file.key));

      console.log(`${imageUrls.length} imágenes de producto subidas a S3`);
      
      // Procesar información adicional
      const { productId } = req.body;
      const sellerId = req.user?.userId;

      // Si tenemos productId y sellerId, guardar en la base de datos
      if (productId && sellerId) {
        try {
          const product = await prisma.product.findUnique({ where: { id: productId } });
          
          if (!product) {
            sendErrorResponse(res, 'Producto no encontrado', HttpStatusCode.NOT_FOUND);
            return;
          }
          
          if (product.sellerId !== sellerId && req.user?.userType !== 'ADMIN') {
            sendErrorResponse(res, 'No tienes permiso para añadir imágenes a este producto', HttpStatusCode.FORBIDDEN);
            return;
          }

          const uploadedImagesData = [];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imageUrl = file.location || getS3ObjectUrl(file.key);
            const isPrimary = i === 0 && !(await prisma.productImage.findFirst({ where: { productId, isPrimary: true } }));
            
            const lastImage = await prisma.productImage.findFirst({
              where: { productId },
              orderBy: { displayOrder: 'desc' },
            });
            const displayOrder = (lastImage?.displayOrder || 0) + 1 + i;

            const newProductImage = await prisma.productImage.create({
              data: {
                productId,
                imageUrl,
                altText: product.name,
                isPrimary,
                displayOrder,
              },
            });
            uploadedImagesData.push(newProductImage);
          }

          sendSuccessResponse(res, {
            message: `${files.length} imágenes de producto subidas exitosamente`,
            imageUrls,
            productImages: uploadedImagesData,
          });
        } catch (dbError: any) {
          console.error("Error al guardar imágenes de producto en la base de datos:", dbError);
          sendErrorResponse(res, `Error al guardar las imágenes: ${dbError.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      } else {
        // Solo devolver las URLs de las imágenes si no tenemos toda la información
        sendSuccessResponse(res, {
          imageUrls,
          message: `${imageUrls.length} imágenes subidas correctamente`
        });
      }
    } catch (error: any) {
      console.error('Error al subir imágenes de producto:', error);
      sendErrorResponse(res, `Error al subir las imágenes: ${error.message}`, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
} 