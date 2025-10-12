import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 px-4 text-center text-sm text-muted-foreground">
      <div className="flex justify-center gap-x-4 mb-2">
        <Link href="/privacy-policy" className="hover:underline hover:text-primary">
          Privacy Policy
        </Link>
        <span>|</span>
        <Link href="/cookie-policy" className="hover:underline hover:text-primary">
          Cookie Policy
        </Link>
        <span>|</span>
        <Link href="/content-policy" className="hover:underline hover:text-primary">
          Content Policy
        </Link>
      </div>
      <div>
        © {currentYear} VLKN
      </div>
    </footer>
  );
}
