import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Colombian certificates required for selling agricultural products
export const REQUIRED_CERTIFICATIONS = [
  'INVIMA',
  'ICA',
  'REGISTRO_SANITARIO',
  'CERTIFICADO_ORGANICO'
];

/**
 * Checks if a user has all required and verified certificates
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user has all required certificates verified
 */
export async function hasRequiredCertifications(userId: string): Promise<boolean> {
  try {
    // Get all certifications for the user
    const userCertifications = await prisma.userCertification.findMany({
      where: {
        userId,
        status: 'VERIFIED'
      }
    });

    // Check if user has all required certification types and they are verified
    return REQUIRED_CERTIFICATIONS.every(certType => 
      userCertifications.some(cert => cert.certificationType === certType)
    );
  } catch (error) {
    console.error('Error checking user certifications:', error);
    return false;
  }
}

/**
 * Counts how many verified required certificates a user has
 * @param userId - The user ID to check
 * @returns Promise<{ verified: number, total: number }> - Count of verified certificates and total required
 */
export async function getCertificationsCount(userId: string): Promise<{ verified: number, total: number }> {
  try {
    // Get all certifications for the user
    const userCertifications = await prisma.userCertification.findMany({
      where: {
        userId,
        certificationType: {
          in: REQUIRED_CERTIFICATIONS
        }
      }
    });

    const verifiedCount = userCertifications.filter(cert => cert.status === 'VERIFIED').length;
    
    return {
      verified: verifiedCount,
      total: REQUIRED_CERTIFICATIONS.length
    };
  } catch (error) {
    console.error('Error counting user certifications:', error);
    return { verified: 0, total: REQUIRED_CERTIFICATIONS.length };
  }
} 