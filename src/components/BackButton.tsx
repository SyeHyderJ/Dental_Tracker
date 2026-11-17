import { useNavigate } from 'react-router-dom';

export default function BackButton({ to = "/dashboard" }: { to?: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="btn-secondary w-auto px-3 py-2 text-sm"
    >
      Back
    </button>
  );
}
