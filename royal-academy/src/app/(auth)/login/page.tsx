"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // Check if identifier is phone number for OTP (starts with 0, length 10 or 11)
    const isOtp = /^\d{10,11}$/.test(identifier);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password, isOtp }),
      });

      const data = await res.json();

      if (res.ok) {
        // Use router.refresh() after push to ensure middleware picks up the new cookie
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Failed to login");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-gray-900/5 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <span className="text-white font-bold text-xl">RA</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome to Royal Academy
          </CardTitle>
          <CardDescription className="text-gray-500">
            Sign in to access your portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <Input 
                id="identifier" 
                type="text" 
                placeholder="m.doe@example.com or 08012345678" 
                className="h-11 bg-white" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password or OTP</Label>
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="h-11 bg-white" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm font-medium">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500">
          <p>
            Parents: Enter your registered phone number and use '123456' as OTP.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
