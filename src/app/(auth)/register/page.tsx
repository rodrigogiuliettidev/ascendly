"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Flame className="w-8 h-8 text-[#FF7A00]" />
            <span className="text-3xl font-bold text-white tracking-tight">
              Ascendly
            </span>
          </div>
          <p className="text-[#A1A1A1]">Start your journey today</p>
        </div>

        <Card className="bg-[#121212] border-[#1E1E1E]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white">
              Create your account
            </CardTitle>
            <CardDescription className="text-[#A1A1A1]">
              Join Ascendly and level up your habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-slide-up">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-[#A1A1A1]">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-[#555] focus:border-[#FF7A00] focus:ring-[#FF7A00]/20 rounded-xl h-12 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#A1A1A1]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-[#555] focus:border-[#FF7A00] focus:ring-[#FF7A00]/20 rounded-xl h-12 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#A1A1A1]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-[#555] focus:border-[#FF7A00] focus:ring-[#FF7A00]/20 rounded-xl h-12 transition-all duration-200"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#A1A1A1]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-[#555] focus:border-[#FF7A00] focus:ring-[#FF7A00]/20 rounded-xl h-12 transition-all duration-200 ${
                      confirmPassword && password !== confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#FF7A00] hover:bg-[#FF9F3F] text-white font-semibold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:shadow-[0_0_30px_rgba(255,122,0,0.5)] active:scale-[0.97]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#A1A1A1] text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#FF7A00] hover:text-[#FF9F3F] font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
