import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-medium text-neutral-900">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6">
          Go Home
        </Link>
      </div>
    </div>
  );
}
