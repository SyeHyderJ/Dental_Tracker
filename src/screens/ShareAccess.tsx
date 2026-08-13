import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function ShareAccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Array<any>>([]);

  // Fetch provider connections for the current user
  useEffect(() => {
    if (user) {
      const fetchConnections = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .rpc('get_my_provider_connections');
          if (error) throw error;
          setConnections(data || []);
          // Update pending requests
          setPendingRequests((data || []).filter((c: any) => c.status === 'pending'));
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchConnections();
    }
  }, [user]);

  const handleRevoke = async (connectionId: string) => {
    if (!window.confirm('Are you sure you want to revoke access for this provider?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('provider_connections')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .match({ id: connectionId, patient_id: user?.id });
      if (error) throw error;
      // Remove the connection from state (since we don't display revoked connections)
      setConnections(prev => prev.filter(c => c.connection_id !== connectionId));
      setPendingRequests(prev => prev.filter(c => c.connection_id !== connectionId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGrantAccess = async () => {
    const email = emailInput.trim();
    if (!email) {
      setGrantError('Please enter a provider email');
      return;
    }
    setGrantLoading(true);
    setGrantError(null);
    setGrantSuccess(null);
    try {
      // Find provider by email
      const { data: providerData, error: providerError } = await supabase
        .rpc('find_provider_by_email', { lookup_email: email });
      if (providerError) throw providerError;
      if (!providerData || providerData.length === 0) {
        setGrantError('No provider found with that email');
        return;
      }
      const provider = providerData[0];
      // Insert connection
      const { error: insertError } = await supabase
        .from('provider_connections')
        .insert([
          {
            patient_id: user?.id,
            provider_id: provider.provider_id,
            status: 'active',
          }
        ]);
      if (insertError) {
        // Handle unique violation (active connection already exists)
        if (insertError.code === '23505') { // unique_violation
          setGrantError('You\'ve already shared access with this provider');
        } else {
          throw insertError;
        }
      } else {
        setGrantSuccess(`Access granted to ${provider.provider_name}`);
        setEmailInput('');
        // Refresh connections
        const { data, error } = await supabase
          .rpc('get_my_provider_connections');
        if (!error) {
          setConnections(data || []);
          setPendingRequests((data || []).filter((c: any) => c.status === 'pending'));
        }
      }
    } catch (err: any) {
      setGrantError(err.message);
    } finally {
      setGrantLoading(false);
    }
  };

  const handleApprove = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('provider_connections')
        .update({ status: 'active' })
        .match({ id: connectionId, patient_id: user?.id });
      if (error) throw error;
      // Update state
      setConnections(prev =>
        prev.map(c =>
          c.id === connectionId ? { ...c, status: 'active' } : c
        )
      );
      setPendingRequests(prev => prev.filter(c => c.id !== connectionId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeny = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('provider_connections')
        .update({ status: 'revoked' })
        .match({ id: connectionId, patient_id: user?.id });
      if (error) throw error;
      // Update state
      setConnections(prev =>
        prev.map(c =>
          c.id === connectionId ? { ...c, status: 'revoked' } : c
        )
      );
      setPendingRequests(prev => prev.filter(c => c.id !== connectionId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-t-indigo-600 w-12 h-12"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/sign-in', { replace: true });
    return null;
  }

  const activeConnections = connections.filter(c => c.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Share Access
              </h1>
              <p className="mt-2 text-xl text-gray-500">
                Grant providers access to your dental records
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/provider/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Errors & Success */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        {grantError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{grantError}</p>
          </div>
        )}
        {grantSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
            <p>{grantSuccess}</p>
          </div>
        )}

        {/* Connected Providers List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connected Providers
          </h2>
          {activeConnections.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              You haven't shared your records with any providers yet.
            </p>
          ) : (
            <div className="space-y-4">
              {activeConnections.map(conn => (
                <div key={conn.connection_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {conn.provider_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Connected: {new Date(conn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(conn.connection_id)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Revoke Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests Section (only show if there are pending requests) */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pending Requests
            </h2>
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {req.provider_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Requested: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeny(req.id)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grant Access Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Grant Access
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter a provider's email to share your dental records with them.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); handleGrantAccess(); }} className="space-y-4">
            <div>
              <label htmlFor="provider-email" className="block text-sm font-medium text-gray-700 mb-2">
                Provider Email
              </label>
              <input
                id="provider-email"
                type="email"
                autoComplete="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                disabled={grantLoading}
              />
            </div>
            <button
              type="submit"
              disabled={grantLoading}
              className="w-full flex items-center justify-center px-5 py-3.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors duration-200"
            >
              {grantLoading ? 'Granting...' : 'Grant Access'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}