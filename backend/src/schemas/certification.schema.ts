import { z } from "zod";

// Available certification statuses
const CERTIFICATION_STATUSES = ["PENDING", "VERIFIED", "REJECTED"] as const;

// Base schema for user certification validation
export const userCertificationSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  certificationName: z.string().min(1, { message: "Certification name is required" }),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL" }),
  status: z.enum(CERTIFICATION_STATUSES).optional().default("PENDING"),
  verifierAdminId: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// Schema for creating a user certification
export const createUserCertificationSchema = userCertificationSchema.omit({ 
  status: true, 
  verifierAdminId: true, 
  rejectionReason: true 
});

// Schema for verifying a certification (admin only)
export const verifyCertificationSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().optional()
    .refine(
      (data) => !(data === undefined && status === "REJECTED"), 
      { message: "Rejection reason is required when rejecting a certification" }
    ),
});

// Schema for user certification query parameters
export const certificationQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(CERTIFICATION_STATUSES).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  sortBy: z.enum(["uploadedAt", "verifiedAt"]).optional().default("uploadedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Types derived from schemas
export type CreateUserCertificationDto = z.infer<typeof createUserCertificationSchema>;
export type VerifyCertificationDto = z.infer<typeof verifyCertificationSchema>;
export type CertificationQueryParams = z.infer<typeof certificationQuerySchema>;

// User certification response type
export interface UserCertificationResponse {
  id: string;
  userId: string;
  certificationName: string;
  imageUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedAt: Date;
  verifiedAt?: Date;
  verifierAdminId?: string;
  rejectionReason?: string;
  user?: {
    id: string;
    username: string;
  };
  verifierAdmin?: {
    id: string;
    username: string;
  };
} 