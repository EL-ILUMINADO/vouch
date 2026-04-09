import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
            Vouch
          </p>
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-sm text-zinc-400">
            Restricted to authorized personnel only.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
