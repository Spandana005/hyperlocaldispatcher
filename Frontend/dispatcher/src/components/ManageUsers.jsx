import React, { useEffect, useState } from "react";
import { getAdminUsers, blockUser, unblockUser } from "../api";
import { toast } from "react-hot-toast";
import { ShieldCheck, UserX, UserCheck, Mail, Phone, Clock } from "lucide-react";
import useAuthStore from "../store/authstore";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId) => {
    if (userId === currentUser?._id) {
      toast.error("You cannot block yourself.");
      return;
    }
    
    // Optimistic UI Update
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isBlocked: true, isActive: false } : u))
    );
    
    try {
      await blockUser(userId);
      toast.success("User blocked successfully");
    } catch (error) {
      toast.error("Failed to block user");
      // Revert Optimistic Update on Error
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: false, isActive: true } : u))
      );
    }
  };

  const handleUnblock = async (userId) => {
    // Optimistic UI Update
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isBlocked: false, isActive: true } : u))
    );

    try {
      await unblockUser(userId);
      toast.success("User unblocked successfully");
    } catch (error) {
      toast.error("Failed to unblock user");
      // Revert Optimistic Update on Error
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: true, isActive: false } : u))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Manage Users
          </h1>
          <p className="text-slate-550 mt-1.5 text-xs font-semibold">
            Control platform access and monitor user accounts.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Name</th>
                <th className="pb-3">Contact Info</th>
                <th className="pb-3">Role</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        u.role === 'admin' ? 'bg-blue-50 text-blue-600' :
                        u.role === 'shop_owner' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{u._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3" /> {u.email}
                      </p>
                      {u.phone && (
                        <p className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                          <Phone className="w-3 h-3" /> {u.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 font-semibold">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'shop_owner' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    {u.isBlocked || !u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                        <UserX className="w-3 h-3" /> Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right pr-2">
                    {u.isBlocked || !u.isActive ? (
                      <button
                        onClick={() => handleUnblock(u._id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(u._id)}
                        disabled={u._id === currentUser?._id}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
