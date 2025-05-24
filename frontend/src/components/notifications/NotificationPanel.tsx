import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  // Aquí podrías obtener las notificaciones de tu estado global o API
  const notifications: any[] = []; // Por ahora lo dejamos vacío

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No hay notificaciones disponibles</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div key={index} className="p-4 border-b hover:bg-gray-50">
                {/* Aquí iría el contenido de cada notificación */}
                <p>{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 