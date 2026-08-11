import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ to = "/dashboard" }: { to?: string }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to, { replace: true });
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}