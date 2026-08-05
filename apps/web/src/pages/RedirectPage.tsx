import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function RedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code) {
      // Rediriger via le worker de redirection
      window.location.href = `https://peage.io/go/${code}`;
      
      // Si la redirection échoue après 5 secondes
      const timeout = setTimeout(() => setError(true), 5000);
      return () => clearTimeout(timeout);
    }
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-500 mb-6">
            The link you're looking for doesn't exist or has expired.
          </p>
          <a href="/" className="btn btn-primary">
            Go to Peage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500">Redirecting you...</p>
      </div>
    </div>
  );
}
