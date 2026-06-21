import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  brand: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AuthSplitLayout({ brand, children, className }: AuthSplitLayoutProps) {
  return (
    <div className={cn("auth-split-layout", className)}>
      {brand}
      <main className="auth-form-panel">{children}</main>
    </div>
  );
}
