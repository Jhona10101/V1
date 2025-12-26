import { LoginForm } from "@/features/auth/components/LoginForm";

export const LoginPage = () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <LoginForm />
    </div>
  );
};