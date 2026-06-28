import { cn } from "@/lib/utils";

type AgriMateAIIconVariant = "navbar" | "avatar" | "favicon";

type AgriMateAIIconProps = {
  variant?: AgriMateAIIconVariant;
  className?: string;
  title?: string;
};

export function AgriMateAIIcon({
  variant = "navbar",
  className,
  title = "AgriMate AI",
}: AgriMateAIIconProps) {
  const isFavicon = variant === "favicon";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      className={cn("shrink-0", className)}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="agriMateLeaf" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22C55E" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="agriMateLeafSoft" x1="18" y1="15" x2="46" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ADE80" stopOpacity="0.9" />
          <stop offset="1" stopColor="#16A34A" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {!isFavicon ? (
        <g>
          <path
            d="M13 22.5C13 16.2 18.2 11 24.5 11H39.5C45.8 11 51 16.2 51 22.5V36.3C51 42.6 45.8 47.8 39.5 47.8H28.2L20.6 54.2C19.6 55 18.1 54.1 18.4 52.8L19.8 47.8H24.5C18.2 47.8 13 42.6 13 36.3V22.5Z"
            fill="#F8FAFC"
            opacity="0.92"
            stroke="url(#agriMateLeafSoft)"
            strokeWidth="1.4"
          />
          <path
            d="M16.8 22.8C16.8 18.2 20.6 14.4 25.2 14.4H39.3C43.9 14.4 47.7 18.2 47.7 22.8V35.5C47.7 40.1 43.9 43.9 39.3 43.9H28.7L22.6 49.1L23.8 43.9H25.2C20.6 43.9 16.8 40.1 16.8 35.5V22.8Z"
            fill="url(#agriMateLeaf)"
          />
          <path
            d="M26.2 38.3L31.9 18.7L37.7 38.3"
            stroke="white"
            strokeOpacity="0.88"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28.4 31.4H35.5"
            stroke="white"
            strokeOpacity="0.72"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M38.2 20.4C40.7 20.4 42.8 21.6 44.3 23.6"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M20.4 26.2C22.2 24.3 24.5 23.2 27.1 22.9"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="42.2" cy="24.4" r="1.8" fill="#FACC15" />
          <circle cx="20.9" cy="36.4" r="1.7" fill="#DCFCE7" />
          <circle cx="45" cy="32.7" r="1.5" fill="#16A34A" opacity="0.9" />
        </g>
      ) : (
        <g>
          <path
            d="M20.5 12.5H43.5C50.1 12.5 55.5 17.9 55.5 24.5V34.8C55.5 41.4 50.1 46.8 43.5 46.8H31.8L21.3 54.5L23.2 46.8H20.5C13.9 46.8 8.5 41.4 8.5 34.8V24.5C8.5 17.9 13.9 12.5 20.5 12.5Z"
            fill="#F8FAFC"
            opacity="0.94"
            stroke="url(#agriMateLeafSoft)"
            strokeWidth="1.4"
          />
          <path
            d="M22.1 16.4H42.1C46.6 16.4 50.3 20.1 50.3 24.6V33.8C50.3 38.3 46.6 42 42.1 42H32.7L24.6 48.2L26 42H22.1C17.6 42 13.9 38.3 13.9 33.8V24.6C13.9 20.1 17.6 16.4 22.1 16.4Z"
            fill="url(#agriMateLeaf)"
          />
          <path
            d="M27 36.7L31.9 20.2L36.9 36.7"
            stroke="white"
            strokeOpacity="0.9"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28.7 29.5H35.1"
            stroke="white"
            strokeOpacity="0.7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="40.1" cy="22.8" r="1.7" fill="#FACC15" />
          <circle cx="21.9" cy="33.3" r="1.4" fill="#DCFCE7" />
          <circle cx="43" cy="31.2" r="1.3" fill="#16A34A" opacity="0.95" />
        </g>
      )}
    </svg>
  );
}

