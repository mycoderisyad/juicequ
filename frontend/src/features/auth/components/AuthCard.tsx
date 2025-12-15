interface AuthCardProps {
  children: React.ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/50">
      {children}
    </div>
  );
}

