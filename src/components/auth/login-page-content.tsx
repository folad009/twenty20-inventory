import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPageContent() {
  return (
    <AuthSplitLayout brand={<AuthBrandPanel />}>
      <LoginForm />
    </AuthSplitLayout>
  );
}
