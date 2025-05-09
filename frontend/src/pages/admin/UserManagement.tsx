import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import userService, { User, UserUpdateData } from '../../services/userService';
import UserList from '../../components/admin/UserList';
import UserForm from '../../components/admin/UserForm';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAppContext();
  
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Cargar usuarios
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedUsers = await userService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Manejadores de eventos
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateUser = async (data: UserUpdateData) => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedUser = await userService.updateUser(selectedUser.id, data);
      
      // Actualizar la lista de usuarios
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
      );
      
      // Cerrar el modal
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el usuario');
      console.error('Error updating user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await userService.deleteUser(userToDelete.id);
      
      // Actualizar la lista de usuarios
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      
      // Cerrar el modal
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el usuario');
      console.error('Error deleting user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay usuarios activos con role admin, mostrar advertencia
  const activeAdmins = users.filter(u => u.role === 'admin' && u.isActive);
  const showAdminWarning = activeAdmins.length <= 1;

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {showAdminWarning && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Advertencia:</p>
            <p>Debe haber al menos un usuario administrador activo en el sistema.</p>
          </div>
        )}

        {isLoading && users.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <UserList 
            users={users} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}
      </Card>

      {/* Modal para editar usuario */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <UserForm 
            user={selectedUser}
            onSubmit={handleUpdateUser}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={isLoading}
          />
        </div>
      </Modal>

      {/* Modal para confirmar eliminación */}
      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar a ${userToDelete?.fullName || 'este usuario'}? Esta acción no se puede deshacer.`}
        isLoading={isLoading}
      />
    </div>
  );
};

export default UserManagement; 