// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getPageUrl } from '../lib/api-utils';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push(getPageUrl('/books'));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to Book Library...</p>
      </div>
    </div>
  );
}