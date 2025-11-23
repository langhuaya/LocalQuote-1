import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Trash2, UserPlus, Shield } from 'lucide-react';

interface UsersManagerProps {
  t: (key: string) => string;
}

export const UsersManager: React.FC<UsersManagerProps> = ({ t }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    setIsLoading(true);
    setError('');
    try {
      await api.createUser(newUser);
      setNewUser({ username: '', password: '' });
      await loadUsers();
    } catch (err) {
      setError('Failed to create user. Username might exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        await loadUsers();
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="font-bold text-lg mb-4 flex items-center">
             <Shield className="mr-2 text-blue-600" size={20} />
             Account Management
           </h3>
           <p className="text-sm text-gray-500 mb-6">Manage users who can access the SwiftQuote Pro system.</p>
           
           <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-gray-50 p-4 rounded-lg">
               <div className="flex-1 w-full">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                   <input 
                      className="w-full p-2 border rounded" 
                      value={newUser.username}
                      onChange={e => setNewUser({...newUser, username: e.target.value})}
                      placeholder="e.g. john.doe"
                   />
               </div>
               <div className="flex-1 w-full">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                   <input 
                      type="password"
                      className="w-full p-2 border rounded" 
                      value={newUser.password}
                      onChange={e => setNewUser({...newUser, password: e.target.value})}
                      placeholder="••••••••"
                   />
               </div>
               <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center h-[42px]"
                >
                   <UserPlus size={18} className="mr-2" /> Add User
               </button>
           </form>
           {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

           <div className="overflow-x-auto">
               <table className="w-full">
                   <thead className="bg-gray-100">
                       <tr>
                           <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase">ID</th>
                           <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase">Username</th>
                           <th className="p-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                       {users.map(user => (
                           <tr key={user.id} className="hover:bg-gray-50">
                               <td className="p-3 text-gray-500">{user.id}</td>
                               <td className="p-3 font-medium text-gray-800">{user.username}</td>
                               <td className="p-3 text-right">
                                   <button 
                                      onClick={() => handleDelete(user.id)}
                                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                      title="Delete User"
                                    >
                                       <Trash2 size={16} />
                                   </button>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};