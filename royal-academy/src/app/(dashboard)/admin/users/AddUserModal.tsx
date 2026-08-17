import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  role: "STUDENT" | "TEACHER" | "PARENT";
  structureData: { classes: any[], subjects: any[] };
  onClose: () => void;
  onSuccess: (credentials?: any) => void;
};

export default function AddUserModal({ role, structureData, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<any>({ role });
  const [childrenIdentifiers, setChildrenIdentifiers] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleChildChange = (index: number, value: string) => {
    const newIdentifiers = [...childrenIdentifiers];
    newIdentifiers[index] = value;
    setChildrenIdentifiers(newIdentifiers);
  };

  const addChild = () => setChildrenIdentifiers([...childrenIdentifiers, '']);
  const removeChild = (index: number) => {
    setChildrenIdentifiers(childrenIdentifiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { ...formData };
      if (role === "PARENT") {
        payload.childrenIdentifiers = childrenIdentifiers.filter(id => id.trim() !== "");
      }

      const res = await fetch("/api/admin/users/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data.credentials);
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch (err) {
      setError("An error occurred");
    }
    setLoading(false);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {role.charAt(0) + role.slice(1).toLowerCase()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" required onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" required onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional for students/teachers)</Label>
            <Input id="phone" name="phone" onChange={handleChange} required={role === "PARENT"} />
          </div>

          {role === "STUDENT" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input id="admissionNumber" name="admissionNumber" required onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <select 
                    id="classId" 
                    name="classId" 
                    className="w-full h-10 px-3 py-2 border rounded-md"
                    onChange={handleChange}
                  >
                    <option value="">Select Class</option>
                    {structureData.classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {role === "TEACHER" && (
            <div className="space-y-2">
              <Label htmlFor="staffId">Staff ID</Label>
              <Input id="staffId" name="staffId" required onChange={handleChange} />
            </div>
          )}

          {role === "PARENT" && (
            <div className="space-y-3 border-t pt-3 mt-3">
              <Label>Link Wards (Children)</Label>
              <p className="text-xs text-gray-500 mb-2">Enter the admission number or email of each child.</p>
              {childrenIdentifiers.map((identifier, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    value={identifier} 
                    onChange={(e) => handleChildChange(index, e.target.value)}
                    placeholder="Admission No. or Email"
                  />
                  {index > 0 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChild(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addChild} className="mt-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add another child
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="sendImmediately" 
              name="sendImmediately" 
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              onChange={handleChange}
            />
            <Label htmlFor="sendImmediately" className="font-normal">
              Create and send login details immediately
            </Label>
          </div>
          <p className="text-xs text-gray-500">
            If unchecked, the user will be added to the Pending Activation tab.
          </p>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600">
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
