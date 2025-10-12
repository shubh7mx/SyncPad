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
