import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Trash2, UserPlus, Shield, Mail, Phone, User as UserIcon } from 'lucide-react';

interface UsersManagerProps {
  t: (key: string) => string;
}

export const UsersManager: React.FC<UsersManagerProps> = ({ t }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '',
    fullName: '',
    email: '',
    phone: ''
  });
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
      setNewUser({ username: '', password: '', fullName: '', email: '', phone: '' });
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
    <div className="space-y-6 max-w-5xl mx-auto">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="font-bold text-lg mb-4 flex items-center">
             <Shield className="mr-2 text-blue-600" size={20} />
             Account & Salesperson Management
           </h3>
           <p className="text-sm text-gray-500 mb-6">Manage login accounts and salesperson contact details displayed on quotes.</p>
           
           <form onSubmit={handleCreate} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100">
               <h4 className="text-sm font-bold text-gray-700 uppercase mb-4">Add New User</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username (Login)</label>
                       <input 
                          className="w-full p-2 border rounded" 
                          value={newUser.username}
                          onChange={e => setNewUser({...newUser, username: e.target.value})}
                          placeholder="e.g. john.doe"
                          required
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                       <input 
                          type="password"
                          className="w-full p-2 border rounded" 
                          value={newUser.password}
                          onChange={e => setNewUser({...newUser, password: e.target.value})}
                          placeholder="••••••••"
                          required
                       />
                   </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name (Salesperson)</label>
                       <div className="relative">
                            <UserIcon size={16} className="absolute left-2 top-2.5 text-gray-400" />
                            <input 
                                className="w-full pl-8 p-2 border rounded" 
                                value={newUser.fullName}
                                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                                placeholder="e.g. John Doe"
                            />
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                       <div className="relative">
                            <Mail size={16} className="absolute left-2 top-2.5 text-gray-400" />
                            <input 
                                type="email"
                                className="w-full pl-8 p-2 border rounded" 
                                value={newUser.email}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                                placeholder="john@company.com"
                            />
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                       <div className="relative">
                            <Phone size={16} className="absolute left-2 top-2.5 text-gray-400" />
                            <input 
                                className="w-full pl-8 p-2 border rounded" 
                                value={newUser.phone}
                                onChange={e => setNewUser({...newUser, phone: e.target.value})}
                                placeholder="+1 234..."
                            />
                       </div>
                   </div>
               </div>

               <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 flex items-center font-bold"
                >
                   <UserPlus size={18} className="mr-2" /> Create User
               </button>
           </form>
           {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}

           <div className="overflow-x-auto">
               <table className="w-full">
                   <thead className="bg-gray-100">
                       <tr>
                           <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase">Username</th>
                           <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase">Salesperson Name</th>
                           <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase">Contact Info</th>
                           <th className="p-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                       {users.map(user => (
                           <tr key={user.id} className="hover:bg-gray-50">
                               <td className="p-3 font-medium text-gray-800">{user.username}</td>
                               <td className="p-3 text-gray-600">{user.fullName || '-'}</td>
                               <td className="p-3 text-sm text-gray-500">
                                   {user.email && <div><span className="font-bold text-xs">E:</span> {user.email}</div>}
                                   {user.phone && <div><span className="font-bold text-xs">P:</span> {user.phone}</div>}
                               </td>
                               <td className="p-3 text-right">
                                   {user.username !== 'admin' && (
                                       <button 
                                          onClick={() => handleDelete(user.id)}
                                          className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                          title="Delete User"
                                        >
                                           <Trash2 size={16} />
                                       </button>
                                   )}
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