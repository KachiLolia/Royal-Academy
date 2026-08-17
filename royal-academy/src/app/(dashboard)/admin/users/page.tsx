"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, UserPlus, Mail, Trash2, Send } from "lucide-react";
import EditUserModal from "./EditUserModal";
import AddUserModal from "./AddUserModal";
import GeneratedCredentialsModal from "./GeneratedCredentialsModal";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  batchId: string | null;
  studentProfile?: {
    admissionNumber: string;
    class?: { name: string };
    section?: { name: string };
  };
  teacherProfile?: { 
    staffId: string;
    assignments?: { subject: { name: string }, class: { name: string } }[];
  };
  parentProfile?: {
    students: {
      student: {
        admissionNumber: string;
        user: { firstName: string; lastName: string };
        class?: { name: string };
      };
      relationship: string;
    }[];
  };
};

export default function UsersPage() {
  const [activeRole, setActiveRole] = useState<"STUDENT" | "TEACHER" | "PARENT">("STUDENT");
  const [activeView, setActiveView] = useState<"ACTIVE" | "PENDING">("ACTIVE");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [structureData, setStructureData] = useState<{ classes: any[], subjects: any[] }>({ classes: [], subjects: [] });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generatedCredentials, setGeneratedCredentials] = useState<any[] | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${activeRole}&status=${activeView}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
    setLoading(false);
    setSelectedIds(new Set());
  };

  useEffect(() => {
    fetchUsers();
  }, [activeRole, activeView]);

  useEffect(() => {
    async function fetchStructure() {
      try {
        const res = await fetch("/api/admin/structure");
        const json = await res.json();
        setStructureData(json);
      } catch (error) {
        console.error("Failed to fetch structure", error);
      }
    }
    fetchStructure();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(users.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleActivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/admin/users/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (data.credentials && data.credentials.length > 0) {
        setGeneratedCredentials(data.credentials);
      }
      fetchUsers();
    } catch (error) {
      console.error("Failed to activate users", error);
    }
  };

  const handleDiscard = async (id?: string) => {
    const ids = id ? [id] : Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm("Are you sure you want to discard these pending users?")) return;

    try {
      await fetch("/api/admin/users/discard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: ids })
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to discard users", error);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const res = await fetch("/api/admin/users/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id })
      });
      const data = await res.json();
      if (data.credentials) {
        setGeneratedCredentials([data.credentials]);
      } else {
        alert("Login details resent successfully!");
      }
    } catch (error) {
      console.error("Failed to resend login details", error);
    }
  };

  // Group pending users by batchId
  const groupedUsers = users.reduce((acc, user) => {
    const key = user.batchId || "Manual entry";
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage {activeRole.toLowerCase()} accounts and credentials.</p>
        </div>
        <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add {activeRole.charAt(0) + activeRole.slice(1).toLowerCase()}
        </Button>
      </div>

      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="flex space-x-1">
          {(["STUDENT", "TEACHER", "PARENT"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeRole === role
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {role.charAt(0) + role.slice(1).toLowerCase()}s
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2 pb-2">
          <Button 
            variant={activeView === "ACTIVE" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveView("ACTIVE")}
          >
            Active
          </Button>
          <Button 
            variant={activeView === "PENDING" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveView("PENDING")}
          >
            Pending Activation
          </Button>
        </div>
      </div>

      {activeView === "PENDING" && selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 flex justify-between items-center">
          <span className="text-indigo-800 font-medium">{selectedIds.size} users selected</span>
          <div className="space-x-3">
            <Button variant="outline" size="sm" onClick={() => handleDiscard()} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" /> Discard Selected
            </Button>
            <Button size="sm" onClick={handleActivate} className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" /> Send Login Details
            </Button>
          </div>
        </div>
      )}

      {activeView === "PENDING" ? (
        <div className="space-y-6">
          {Object.entries(groupedUsers).map(([batchId, batchUsers]) => (
            <Card key={batchId}>
              <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center rounded-t-lg">
                <span className="font-semibold text-gray-700">
                  Batch: {batchId === "Manual entry" ? batchId : new Date(batchId).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">{batchUsers.length} users</span>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-white border-b">
                      <tr>
                        <th className="px-6 py-3 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            checked={batchUsers.length > 0 && batchUsers.every(u => selectedIds.has(u.id))}
                            onChange={(e) => {
                              const newSet = new Set(selectedIds);
                              if (e.target.checked) {
                                batchUsers.forEach(u => newSet.add(u.id));
                              } else {
                                batchUsers.forEach(u => newSet.delete(u.id));
                              }
                              setSelectedIds(newSet);
                            }}
                          />
                        </th>
                        <th className="px-6 py-3">Name</th>
                        {activeRole !== "PARENT" && <th className="px-6 py-3">Identifier</th>}
                        {activeRole !== "STUDENT" && <th className="px-6 py-3">Phone</th>}
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchUsers.map((user) => (
                        <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                              checked={selectedIds.has(user.id)}
                              onChange={() => handleSelectOne(user.id)}
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {user.lastName}, {user.firstName}
                          </td>
                          {activeRole !== "PARENT" && (
                            <td className="px-6 py-4">
                              {activeRole === "STUDENT" && <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{user.studentProfile?.admissionNumber}</span>}
                              {activeRole === "TEACHER" && <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{user.teacherProfile?.staffId}</span>}
                            </td>
                          )}
                          {activeRole !== "STUDENT" && (
                            <td className="px-6 py-4">{user.phone || "-"}</td>
                          )}
                          <td className="px-6 py-4">{user.email || "-"}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => handleDiscard(user.id)} className="text-red-500 hover:text-red-700" title="Discard">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && users.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No pending users found for this role.</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    {activeRole !== "PARENT" && <th className="px-6 py-3">Identifier</th>}
                    {activeRole !== "STUDENT" && <th className="px-6 py-3">Phone Number</th>}
                    <th className="px-6 py-3">Email</th>
                    {activeRole === "STUDENT" && <th className="px-6 py-3">Current Class</th>}
                    {activeRole === "TEACHER" && (
                      <>
                        <th className="px-6 py-3">Subject</th>
                        <th className="px-6 py-3">Class(es)</th>
                      </>
                    )}
                    {activeRole === "PARENT" && <th className="px-6 py-3">Additional Info</th>}
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No active users found for this role.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {user.lastName}, {user.firstName}
                        </td>
                        {activeRole !== "PARENT" && (
                          <td className="px-6 py-4">
                            {activeRole === "STUDENT" && <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{user.studentProfile?.admissionNumber}</span>}
                            {activeRole === "TEACHER" && <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{user.teacherProfile?.staffId}</span>}
                          </td>
                        )}
                        {activeRole !== "STUDENT" && (
                          <td className="px-6 py-4">
                            {user.phone ? user.phone : <span className="text-gray-400">-</span>}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          {user.email ? user.email : <span className="text-gray-400">-</span>}
                        </td>
                        {activeRole === "STUDENT" && (
                          <td className="px-6 py-4">
                            {user.studentProfile?.class?.name} {user.studentProfile?.section?.name}
                          </td>
                        )}
                        {activeRole === "TEACHER" && (
                          <>
                            <td className="px-6 py-4">
                              {user.teacherProfile?.assignments?.map(a => a.subject.name).join(", ") || "-"}
                            </td>
                            <td className="px-6 py-4">
                              {user.teacherProfile?.assignments?.map(a => a.class.name).join(", ") || "-"}
                            </td>
                          </>
                        )}
                        {activeRole === "PARENT" && (
                          <td className="px-6 py-4 text-xs">
                            {user.parentProfile?.students.map(s => `${s.student.user.firstName} - ${s.student.class?.name || 'Unassigned'}`).join(", ") || "-"}
                          </td>
                        )}
                        <td className="px-6 py-4 flex items-center gap-3">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit User"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleResend(user.id)}
                            className="text-gray-600 hover:text-indigo-600"
                            title="Resend Login Details"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {editingUser && activeRole !== "PARENT" && (
        <EditUserModal 
          user={editingUser}
          role={activeRole as "STUDENT" | "TEACHER"}
          structureData={structureData}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {isAddUserModalOpen && (
        <AddUserModal
          role={activeRole}
          structureData={structureData}
          onClose={() => setIsAddUserModalOpen(false)}
          onSuccess={(credentials) => {
            setIsAddUserModalOpen(false);
            fetchUsers();
            if (credentials) {
              setGeneratedCredentials([credentials]);
            }
          }}
        />
      )}

      {generatedCredentials && (
        <GeneratedCredentialsModal 
          credentials={generatedCredentials}
          onClose={() => setGeneratedCredentials(null)}
        />
      )}
    </div>
  );
}
