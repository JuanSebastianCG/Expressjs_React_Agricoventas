import React, { useState, useEffect } from 'react';
import { certificationService } from '../services/certificationService';
import { IUserCertification } from '../interfaces/user';

// Mock auth context until we have the real one
// Replace with actual auth context when available
const useAuth = () => {
  return {
    user: { id: 'admin-id', userType: 'ADMIN' }
  };
};

const AdminCertificationApproval: React.FC = () => {
  const { user } = useAuth();
  const [pendingCertifications, setPendingCertifications] = useState<IUserCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Load pending certifications on component mount
  useEffect(() => {
    const loadPendingCertifications = async () => {
      try {
        setLoading(true);
        const certifications = await certificationService.getPendingCertifications();
        setPendingCertifications(certifications);
      } catch (err) {
        console.error(err);
        setError('Failed to load pending certifications');
      } finally {
        setLoading(false);
      }
    };
    
    loadPendingCertifications();
  }, []);

  // Function to approve a certification
  const handleApprove = async (certificationId: string) => {
    try {
      setProcessingId(certificationId);
      await certificationService.approveCertification(certificationId, user.id);
      
      // Remove the approved certification from the list
      setPendingCertifications(prev => prev.filter(cert => cert.id !== certificationId));
      
      // Show success message
      alert('Certification approved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to approve certification');
    } finally {
      setProcessingId(null);
    }
  };

  // Function to reject a certification
  const handleReject = async (certificationId: string) => {
    try {
      if (!rejectionReason) {
        alert('Please provide a rejection reason');
        return;
      }
      
      setProcessingId(certificationId);
      await certificationService.rejectCertification(certificationId, user.id, rejectionReason);
      
      // Remove the rejected certification from the list
      setPendingCertifications(prev => prev.filter(cert => cert.id !== certificationId));
      
      // Reset rejection reason
      setRejectionReason('');
      
      // Show success message
      alert('Certification rejected successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to reject certification');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading pending certifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 text-red-1 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-green-1 mb-8">Certification Approval</h1>

      {pendingCertifications.length === 0 ? (
        <div className="bg-green-0-4 text-green-1 p-4 rounded">
          No pending certifications to review!
        </div>
      ) : (
        <>
          <p className="mb-6">
            You have {pendingCertifications.length} pending certification{pendingCertifications.length !== 1 && 's'} to review.
          </p>

          <div className="space-y-8">
            {pendingCertifications.map(cert => (
              <div key={cert.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {cert.certificationType.replace(/_/g, ' ')}
                    </h2>
                    <span className="bg-yellow-100 text-yellow-1 px-2 py-1 rounded text-xs font-medium">
                      PENDING
                    </span>
                  </div>
                  <p className="text-sm text-gray-1 mt-1">
                    Certification Name: <span className="font-medium">{cert.certificationName}</span>
                  </p>
                  <p className="text-sm text-gray-1">
                    Submitted: {new Date(cert.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-1">
                    Seller: {cert.user?.username || 'Unknown'} ({cert.userId})
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50">
                  <div className="mb-4">
                    <img 
                      src={cert.imageUrl} 
                      alt="Certification Document" 
                      className="max-h-96 mx-auto border"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-1 mb-1">
                        Rejection Reason (required for rejection):
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full p-2 border rounded focus:border-green-1 focus:ring-1 focus:ring-green-1"
                        placeholder="Provide a reason if rejecting..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleApprove(cert.id)}
                        disabled={processingId === cert.id}
                        className="flex-1 py-2 px-4 bg-green-1 text-white rounded hover:bg-green-0-9 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1 disabled:opacity-50"
                      >
                        {processingId === cert.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(cert.id)}
                        disabled={processingId === cert.id}
                        className="flex-1 py-2 px-4 bg-red-1 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {processingId === cert.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCertificationApproval; 