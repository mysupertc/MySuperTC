import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { handleGoogleOAuthCallback } from '@/api/functions';
import { createPageUrl } from '@/utils';

export default function GoogleOAuthCallbackHandler() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(`Google returned an error: ${errorParam}`);
        setStatus('error');
        return;
      }

      if (!code) {
        setError('Authorization code not found. Please try connecting again.');
        setStatus('error');
        return;
      }

      try {
        // This now makes a POST request to your backend function
        const response = await handleGoogleOAuthCallback({ code });
        
        if (response.data?.success) {
          setStatus('success');
          // Redirect to settings page after a short delay
          setTimeout(() => {
            navigate(createPageUrl('Settings'));
          }, 2000);
        } else {
          throw new Error(response.data?.error || 'An unknown error occurred during token exchange.');
        }
      } catch (e) {
        setError(`Failed to connect your Gmail account: ${e.message}`);
        setStatus('error');
      }
    };

    processAuth();
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
      <div className="max-w-md w-full">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mt-6">Processing Authentication...</h1>
            <p className="text-gray-600 mt-2">Please wait while we securely connect your Gmail account. Do not close this window.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mt-6">Connection Successful!</h1>
            <p className="text-gray-600 mt-2">Your Gmail account has been connected. Redirecting you to settings...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-800 mt-6">Connection Failed</h1>
            <p className="text-red-700 bg-red-100 p-4 rounded-lg mt-4">{error}</p>
            <a href={createPageUrl('Settings')} className="mt-6 inline-block text-blue-600 hover:underline">
              Return to Settings and try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}