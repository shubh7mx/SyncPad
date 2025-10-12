import type { SVGProps } from "react";

export function SynonymIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5V19" />
      <path d="M19 12H5" />
      <path d="M19 5l-7 7-7-7" />
      <path d="M19 19l-7-7-7 7" />
    </svg>
  );
}

// Keeping the old icon in case it's needed, but replacing its usage with Lucide's Notepad icon.
export function NotepadIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M4 3v18" />
        <path d="M16 3h2" />
        <path d="M7 7h8" />
        <path d="M7 11h8" />
        <path d="M7 15h5" />
      </svg>
    )
  }
  
