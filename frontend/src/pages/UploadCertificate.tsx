import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificationService } from '../services/certificationService';
import { CertificationType, IUserCertification } from '../interfaces/user';

// Mock auth context until we have the real one
// Replace with actual auth context when available
const useAuth = () => {
  return {
    user: { id: 'user-id', userType: 'SELLER' }
  };
};

const UploadCertificate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<CertificationType | ''>('');
  const [certificationName, setCertificationName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCertifications, setUserCertifications] = useState<IUserCertification[]>([]);
  const [certificationStatus, setStatus] = useState<{ verified: number, total: number } | null>(null);

  // Load user's certifications on component mount
  useEffect(() => {
    const loadUserCertifications = async () => {
      try {
        const certs = await certificationService.getUserCertifications(user.id);
        setUserCertifications(certs);
        
        // Get certification status
        const status = await certificationService.verifyUserCertifications(user.id);
        setStatus(status.certificationsCount);
      } catch (err) {
        setError('Failed to load your certifications');
        console.error(err);
      }
    };
    
    loadUserCertifications();
  }, [user.id]);

  // Generate preview when file changes
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Clean up the object URL when component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedType) {
      setError('Please select a certification type');
      return;
    }
    
    if (!certificationName) {
      setError('Please enter a certification name');
      return;
    }
    
    if (!file) {
      setError('Please select a certification image');
      return;
    }
    
    try {
      setLoading(true);
      await certificationService.uploadCertification(
        user.id,
        certificationName,
        selectedType as CertificationType,
        file
      );
      
      // Refresh the certifications list
      const certs = await certificationService.getUserCertifications(user.id);
      setUserCertifications(certs);
      
      // Reset form
      setSelectedType('');
      setCertificationName('');
      setFile(null);
      
      // Get updated status
      const status = await certificationService.verifyUserCertifications(user.id);
      setStatus(status.certificationsCount);
      
      // Show success message
      alert('Certification uploaded successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to upload certification');
    } finally {
      setLoading(false);
    }
  };

  // Get certificate status for a specific type
  const getCertificateStatus = (type: CertificationType) => {
    const cert = userCertifications.find(c => c.certificationType === type);
    if (!cert) return null;
    return cert.status;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-green-1 mb-8">Certification Management</h1>
      
      {/* Certification Status */}
      <div className="bg-green-0-4 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">Certification Status</h2>
        <p className="mb-2">
          You have {certificationStatus?.verified || 0} out of {certificationStatus?.total || 4} required certifications verified.
        </p>
        {certificationStatus?.verified === certificationStatus?.total ? (
          <div className="bg-green-0-5 text-green-1 p-3 rounded font-medium">
            ✅ You have all required certifications and can publish products!
          </div>
        ) : (
          <div className="bg-yellow-100 text-yellow-1 p-3 rounded font-medium">
            ⚠️ You need all required certifications verified before you can publish products.
          </div>
        )}
      </div>
      
      {/* Current Certifications */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Certifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            CertificationType.INVIMA,
            CertificationType.ICA,
            CertificationType.REGISTRO_SANITARIO,
            CertificationType.CERTIFICADO_ORGANICO
          ].map(certType => {
            const status = getCertificateStatus(certType);
            return (
              <div 
                key={certType} 
                className="border rounded-lg p-4 flex flex-col"
              >
                <h3 className="font-medium">{certType.replace(/_/g, ' ')}</h3>
                {status ? (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      status === 'VERIFIED' 
                        ? 'bg-green-0-5 text-green-1' 
                        : status === 'PENDING' 
                          ? 'bg-yellow-100 text-yellow-1' 
                          : 'bg-red-100 text-red-1'
                    }`}>
                      {status}
                    </span>
                    {status === 'REJECTED' && (
                      <p className="text-sm text-red-1 mt-1">
                        {userCertifications.find(c => c.certificationType === certType)?.rejectionReason}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-0-5 text-sm mt-2">Not uploaded</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Upload Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Upload New Certification</h2>
        
        {error && (
          <div className="bg-red-100 text-red-1 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-1 mb-1">
              Certification Type *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CertificationType | '')}
              className="w-full p-2 border border-gray-0-5 rounded focus:border-green-1 focus:ring-1 focus:ring-green-1"
              required
            >
              <option value="">Select certification type</option>
              {Object.values(CertificationType).map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-1 mb-1">
              Certification Name/Number *
            </label>
            <input
              type="text"
              value={certificationName}
              onChange={(e) => setCertificationName(e.target.value)}
              className="w-full p-2 border border-gray-0-5 rounded focus:border-green-1 focus:ring-1 focus:ring-green-1"
              placeholder="Enter certification name or number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-1 mb-1">
              Certification Document *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full"
              accept="image/*,.pdf"
              required
            />
            <p className="text-xs text-gray-0-5 mt-1">
              Upload a clear image or scan of your certification document
            </p>
          </div>
          
          {preview && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <img 
                src={preview} 
                alt="Certification Preview" 
                className="max-h-60 border rounded" 
              />
            </div>
          )}
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-green-1 text-white rounded hover:bg-green-0-9 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Certification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadCertificate; 