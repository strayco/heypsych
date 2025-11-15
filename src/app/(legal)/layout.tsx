import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">{children}</main>

      {/* Footer Navigation */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
          </nav>
          <p className="mt-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} HeyPsych. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
