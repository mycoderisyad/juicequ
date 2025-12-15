interface AuthAlertProps {
  message: string;
  variant?: "success" | "error" | "info";
  type?: "success" | "error" | "info";
}

export function AuthAlert({ message, variant, type }: AuthAlertProps) {
  if (!message) return null;

  const alertType = variant || type || "info";

  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    error: "bg-red-50 text-red-500",
    info: "bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-lg p-4 text-sm ${styles[alertType]}`}>
      {message}
    </div>
  );
}
