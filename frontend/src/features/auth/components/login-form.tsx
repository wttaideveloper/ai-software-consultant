import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, type LoginFormValues } from "@/features/auth/auth.schema";
import { useLogin } from "@/features/auth/hooks/use-login";
import { setAuthStoragePreference } from "@/store/auth-store";

export function LoginForm() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = (values: LoginFormValues) => {
    setAuthStoragePreference(values.rememberMe ? "local" : "session");
    login.mutate({ email: values.email, password: values.password });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="asc-gradient-surface rounded-2xl border border-border p-6 shadow-md sm:p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Welcome back — enter your details to continue.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register("rememberMe")} />
          <Link
            to="/register"
            className="rounded-sm text-sm font-medium text-accent-text transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Need an account?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full justify-center"
          isLoading={login.isPending}
        >
          Sign in
        </Button>
      </div>
    </form>
  );
}
