import React, { useState } from 'react';
import { User } from '../../services/userService';
import Button from '../common/Button';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onEdit, onDelete }) => {
  const [filter, setFilter] = useState('');
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase()) ||
    user.fullName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          className="w-full p-2 border rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left border-b">Nombre</th>
            <th className="px-4 py-2 text-left border-b">Usuario</th>
            <th className="px-4 py-2 text-left border-b">Email</th>
            <th className="px-4 py-2 text-left border-b">Rol</th>
            <th className="px-4 py-2 text-left border-b">Estado</th>
            <th className="px-4 py-2 text-left border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{user.fullName}</td>
                <td className="px-4 py-2 border-b">{user.username}</td>
                <td className="px-4 py-2 border-b">{user.email}</td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2 border-b">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onEdit(user)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => onDelete(user)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                No se encontraron usuarios que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList; 