import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-4 px-4 text-center text-sm text-muted-foreground">
      <div className="mb-2">
        made by{" "}
        <a
          href="https://vlkn.in"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-primary"
        >
          VLKN
        </a>
      </div>
      <div className="flex justify-center gap-x-4">
        <Link href="/privacy-policy" className="hover:underline hover:text-primary">
          Privacy Policy
        </Link>
        <Link href="/cookie-policy" className="hover:underline hover:text-primary">
          Cookie Policy
        </Link>
        <Link href="/content-policy" className="hover:underline hover:text-primary">
          Content Policy
        </Link>
      </div>
    </footer>
  );
}
