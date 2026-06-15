'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, Pencil, Trash2, Save, X } from 'lucide-react';
import { MainHeader } from '@/components/MainHeader';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  employeeId: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userName, setUserName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ employeeId: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(savedUser);
    if (!user.isAdmin) {
      router.push('/workspace');
      return;
    }
    setUserName(user.name);
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch {
      toast.error('载入用户列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditForm({ email: user.email, employeeId: user.employeeId, password: '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ email: '', employeeId: '', password: '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const body: any = { id };
      if (editForm.email) body.email = editForm.email;
      if (editForm.employeeId) body.employeeId = editForm.employeeId;
      if (editForm.password) body.password = editForm.password;

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success('修改成功');
      setEditingId(null);
      fetchUsers();
    } catch {
      toast.error('修改失败');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('确定删除该用户？')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('已删除');
      fetchUsers();
    } catch {
      toast.error('删除失败');
    }
  };

  if (isLoading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-slate-50">
        <span className="text-slate-400 font-medium">加载中...</span>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50 flex-col font-sans antialiased text-slate-900">
      <MainHeader userName={userName} activePage="admin-users" isAdmin />

      <div className="flex-1 overflow-auto p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
              <p className="text-sm text-slate-400">管理系统中的所有注册用户</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">用户名</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">邮箱</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">密码</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">注册时间</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    {editingId === user.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-full"
                            value={editForm.employeeId}
                            onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-full"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-full placeholder:text-slate-300"
                            placeholder="输入新密码"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="保存"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                              title="取消"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{user.employeeId}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">****</td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="py-20 text-center text-slate-300 text-sm">暂无注册用户</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
