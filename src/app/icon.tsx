import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="iconLeaf" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22C55E" />
            <stop offset="1" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <path
          d="M13 22.5C13 16.2 18.2 11 24.5 11H39.5C45.8 11 51 16.2 51 22.5V36.3C51 42.6 45.8 47.8 39.5 47.8H28.2L20.6 54.2C19.6 55 18.1 54.1 18.4 52.8L19.8 47.8H24.5C18.2 47.8 13 42.6 13 36.3V22.5Z"
          fill="#F8FAFC"
          opacity="0.92"
        />
        <path
          d="M16.8 22.8C16.8 18.2 20.6 14.4 25.2 14.4H39.3C43.9 14.4 47.7 18.2 47.7 22.8V35.5C47.7 40.1 43.9 43.9 39.3 43.9H28.7L22.6 49.1L23.8 43.9H25.2C20.6 43.9 16.8 40.1 16.8 35.5V22.8Z"
          fill="url(#iconLeaf)"
        />
        <path d="M26.2 38.3L31.9 18.7L37.7 38.3" stroke="white" strokeOpacity="0.9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28.4 31.4H35.5" stroke="white" strokeOpacity="0.72" strokeWidth="2.1" strokeLinecap="round" />
        <circle cx="42.2" cy="24.4" r="1.8" fill="#FACC15" />
        <circle cx="20.9" cy="36.4" r="1.7" fill="#DCFCE7" />
        <circle cx="45" cy="32.7" r="1.5" fill="#16A34A" opacity="0.9" />
      </svg>
    ),
    {
      ...size,
    }
  );
}

