import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Credential = {
  name: string;
  username: string;
  password: string;
  role: string;
};

type Props = {
  credentials: Credential[];
  onClose: () => void;
};

export default function GeneratedCredentialsModal({ credentials, onClose }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (cred: Credential, index: number) => {
    const text = `Name: ${cred.name}\nRole: ${cred.role}\nUsername: ${cred.username}\nTemporary Password: ${cred.password}\n\nYou can log in and change your password in your Profile Settings.`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const text = credentials.map(cred => 
      `Name: ${cred.name}\nRole: ${cred.role}\nUsername: ${cred.username}\nTemporary Password: ${cred.password}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text + "\n\nYou can log in and change your password in your Profile Settings.");
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generated Credentials</DialogTitle>
          <DialogDescription>
            Please copy these temporary passwords now. For security reasons, you will not be able to see them again.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-4">
          {credentials.map((cred, index) => (
            <div key={index} className="bg-gray-50 border rounded-lg p-4 relative">
              <div className="absolute top-4 right-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8"
                  onClick={() => handleCopy(cred, index)}
                >
                  {copiedIndex === index ? <Check className="w-4 h-4 text-green-500 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedIndex === index ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-gray-500">Name:</div>
                <div className="col-span-2 font-medium">{cred.name}</div>
                
                <div className="text-gray-500">Role:</div>
                <div className="col-span-2">{cred.role}</div>

                <div className="text-gray-500">Username/Email:</div>
                <div className="col-span-2 font-mono">{cred.username}</div>

                <div className="text-gray-500">Password:</div>
                <div className="col-span-2 font-mono bg-white px-2 py-1 rounded border inline-block">{cred.password}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          {credentials.length > 1 ? (
            <Button variant="outline" onClick={handleCopyAll}>
               {copiedIndex === -1 ? <Check className="w-4 h-4 text-green-500 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
               Copy All
            </Button>
          ) : <div />}
          <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
