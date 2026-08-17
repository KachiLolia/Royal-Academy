import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function EditUserModal({ 
  user, 
  role, 
  structureData, 
  onClose, 
  onSuccess 
}: { 
  user: any; 
  role: "STUDENT" | "TEACHER"; 
  structureData: { classes: any[], subjects: any[] }; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Student state
  const [classId, setClassId] = useState(user.studentProfile?.class?.id || "");
  const [sectionId, setSectionId] = useState(user.studentProfile?.section?.id || "");

  // Teacher state
  const [assignments, setAssignments] = useState<{classId: string, subjectId: string}[]>(
    user.teacherProfile?.assignments?.map((a: any) => ({
      classId: a.class.id,
      subjectId: a.subject.id
    })) || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived sections for selected class
  const selectedClass = structureData.classes.find(c => c.id === classId);
  const sections = selectedClass?.sections || [];

  const handleAddAssignment = () => {
    setAssignments([...assignments, { classId: "", subjectId: "" }]);
  };

  const handleUpdateAssignment = (index: number, field: string, value: string) => {
    const newArr = [...assignments];
    newArr[index] = { ...newArr[index], [field]: value };
    setAssignments(newArr);
  };

  const handleRemoveAssignment = (index: number) => {
    const newArr = assignments.filter((_, i) => i !== index);
    setAssignments(newArr);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        role,
        ...(role === "STUDENT" ? { classId, sectionId } : { assignments })
      };
      
      const res = await fetch("/api/admin/users/assign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        onSuccess();
      } else {
        alert("Failed to save assignment.");
      }
    } catch (e) {
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Assignment - {user.firstName} {user.lastName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>

        {role === "STUDENT" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select 
                className="w-full border rounded p-2 text-sm"
                value={classId} 
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSectionId(""); // Reset section when class changes
                }}
              >
                <option value="">Select a class</option>
                {structureData.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            {classId && (
              <div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <select 
                  className="w-full border rounded p-2 text-sm"
                  value={sectionId} 
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  <option value="">Select a section</option>
                  {sections.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {role === "TEACHER" && (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {assignments.map((assignment, index) => (
              <div key={index} className="border p-3 rounded-md bg-gray-50 flex flex-col gap-2 relative">
                <button 
                  onClick={() => handleRemoveAssignment(index)}
                  className="absolute top-2 right-2 text-red-500 text-xs font-medium hover:underline"
                >
                  Remove
                </button>
                <div>
                  <label className="block text-xs font-medium mb-1">Subject</label>
                  <select 
                    className="w-full border rounded p-1 text-sm"
                    value={assignment.subjectId}
                    onChange={(e) => handleUpdateAssignment(index, "subjectId", e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {structureData.subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Class</label>
                  <select 
                    className="w-full border rounded p-1 text-sm"
                    value={assignment.classId}
                    onChange={(e) => handleUpdateAssignment(index, "classId", e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {structureData.classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full text-xs" onClick={handleAddAssignment}>
              + Add Assignment
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
