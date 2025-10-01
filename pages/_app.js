import '../styles/globals.css';
import Link from 'next/link';
import { getPageUrl } from '../lib/api-utils';

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <Link href={getPageUrl('/books')} className="text-2xl font-bold hover:text-blue-200 transition-colors">
            📚 Book Library
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}