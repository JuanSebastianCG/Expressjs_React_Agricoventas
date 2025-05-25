import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotificationContext } from '../../context/NotificationContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    loading, 
    error,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <p>Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No hay notificaciones disponibles</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border-b hover:bg-gray-50 ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {notification.title && (
                      <h4 className="font-medium mb-1">{notification.title}</h4>
                    )}
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Marcar como leída"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Eliminar notificación"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 