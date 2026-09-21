import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
            AC
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Amanda Cruz</h1>
          <p className="mt-1 text-sm text-muted">Entre para acessar a agenda</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
