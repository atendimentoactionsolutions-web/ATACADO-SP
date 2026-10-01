"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { Users, Plus, ShieldCheck, Trash2, CheckCircle2, UserPlus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    try {
      setSaving(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (data.success) {
        setName("");
        setEmail("");
        setPassword("");
        setModalOpen(false);
        loadUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Remover o acesso de "${user.name}"?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-12">
      <AdminHeader
        title="Controle de Usuários"
        subtitle="Gerencie administradores e operadores do sistema iFindz"
      />

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#86868b]">
              Acesso seguro com criptografia bcrypt e sessões via cookies HTTP-only
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl border border-[#e5e5ea] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#fbfbfd] border-b border-[#e5e5ea] text-[#86868b]">
                  <th className="py-3 px-4 font-semibold">Nome</th>
                  <th className="py-3 px-3 font-semibold">E-mail</th>
                  <th className="py-3 px-3 font-semibold">Perfil</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Criado em</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#86868b]">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#fbfbfd]">
                      <td className="py-3.5 px-4 font-semibold text-[#1d1d1f] flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold text-[11px]">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>

                      <td className="py-3.5 px-3 text-[#1d1d1f] font-mono">{u.email}</td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#e3f2fd] text-[#0d47a1]">
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#1b5e20] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                          <span>Ativo</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-[#86868b]">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg text-[#86868b] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remover usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Novo Usuário */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-[#e5e5ea]">
            <h3 className="text-base font-bold text-[#1d1d1f]">Cadastrar Novo Administrador</h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              Crie credenciais de acesso seguras para a equipe
            </p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: João Silva"
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  E-mail de Login *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@ifindz.com.br"
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] text-xs text-[#1d1d1f] border border-transparent focus:border-[#0071e3] focus:outline-none"
                >
                  <option value="ADMIN">Administrador Geral</option>
                  <option value="OPERATOR">Operador / Vendas</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed]"
                >
                  {saving ? "Salvando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
