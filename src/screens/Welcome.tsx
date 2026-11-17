import { FolderOpen, Lock, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Your dental records, in one place"
      subtitle="Store your chart, allergies, medications, and visit history. Share them with a provider only when you choose."
    >
      <ul className="mb-8 space-y-4">
        <li className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-chart-soft text-chart-cat">
            <Smile className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-medium">Dental chart</h2>
            <p className="text-sm text-slate">Keep a tooth-by-tooth record of fillings, crowns, and treatment.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-document-soft text-document">
            <FolderOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-medium">Health history</h2>
            <p className="text-sm text-slate">Allergies, medications, and documents stay with you between visits.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-medium">Private by default</h2>
            <p className="text-sm text-slate">A clinic sees your record only after you grant access.</p>
          </div>
        </li>
      </ul>

      <div className="space-y-3">
        <button type="button" className="btn-primary" onClick={() => navigate('/create-account')}>
          Create account
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => navigate('/sign-in')}>
          Sign in
        </button>
      </div>
    </AuthLayout>
  );
}
