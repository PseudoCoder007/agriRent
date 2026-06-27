import type { ReactNode } from "react";
import { Resend } from "resend";

const BRAND_LINE = "Connecting Farmers. Sharing Equipment. Growing Together.";
const DEFAULT_FROM = "AgriRent <noreply@agrirent.shop>";
const DEFAULT_SUPPORT = "support@agrirent.shop";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type EmailResult = {
  success: boolean;
  message: string;
};

type EmailDocumentProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

type EmailButtonProps = {
  href: string;
  children: ReactNode;
};

type EmailDetailsProps = {
  items: Array<{ label: string; value: ReactNode }>;
};

type EmailMessage = {
  to: string;
  subject: string;
  preview: string;
  text: string;
  body: ReactNode;
};

type Contact = {
  email: string;
  fullName: string | null;
};

type BookingDetails = {
  equipmentTitle: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
};

type BookingRecipientProps = BookingDetails & {
  recipientName: string;
  otherPartyName: string;
  ctaUrl: string;
};

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

function firstName(name: string | null | undefined, fallback: string): string {
  const value = name?.trim();
  if (!value) {
    return fallback;
  }

  return value.split(/\s+/)[0] ?? fallback;
}

function EmailDocument({ preview, title, children }: EmailDocumentProps) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <style>{`
          @media only screen and (max-width: 620px) {
            .agrirent-shell {
              padding: 16px !important;
            }
            .agrirent-container {
              width: 100% !important;
              border-radius: 20px !important;
            }
            .agrirent-pad {
              padding: 24px 20px !important;
            }
            .agrirent-button {
              display: block !important;
              width: 100% !important;
              box-sizing: border-box !important;
              text-align: center !important;
            }
            .agrirent-stack {
              display: block !important;
              width: 100% !important;
            }
          }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#eef5ea",
          color: "#16311f",
          fontFamily:
            '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
            opacity: 0,
            color: "transparent",
          }}
        >
          {preview}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              <td className="agrirent-shell" style={{ padding: "32px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  align="center"
                  className="agrirent-container"
                  style={{
                    maxWidth: 620,
                    margin: "0 auto",
                    borderRadius: 28,
                    backgroundColor: "#ffffff",
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(22, 49, 31, 0.08)",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        className="agrirent-pad"
                        style={{
                          padding: "32px 40px 12px",
                          background:
                            "linear-gradient(180deg, #f4fbf3 0%, #ffffff 100%)",
                        }}
                      >
                        <EmailBrand />
                      </td>
                    </tr>
                    <tr>
                      <td className="agrirent-pad" style={{ padding: "8px 40px 36px" }}>
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  align="center"
                  style={{ maxWidth: 620, margin: "0 auto" }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "18px 8px 0",
                          fontSize: 12,
                          lineHeight: "18px",
                          color: "#5c6b61",
                          textAlign: "center",
                        }}
                      >
                        If you need help, email{" "}
                        <a
                          href={`mailto:${DEFAULT_SUPPORT}`}
                          style={{ color: "#15803d", textDecoration: "none" }}
                        >
                          {DEFAULT_SUPPORT}
                        </a>
                        .<br />
                        <span style={{ color: "#8a9b8e" }}>
                          You are receiving this because you have an AgriRent
                          account.
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function EmailBrand() {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td style={{ paddingRight: 14, verticalAlign: "middle" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background:
                  "linear-gradient(135deg, #22c55e 0%, #16a34a 52%, #15803d 100%)",
                boxShadow: "0 10px 24px rgba(22, 163, 74, 0.24)",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ width: "100%", height: "100%" }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "middle",
                        padding: "8px 0 0",
                      }}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 64 64"
                        fill="none"
                        style={{ display: "block", margin: "0 auto" }}
                      >
                        <path
                          d="M16.8 22.8C16.8 18.2 20.6 14.4 25.2 14.4H39.3C43.9 14.4 47.7 18.2 47.7 22.8V35.5C47.7 40.1 43.9 43.9 39.3 43.9H28.7L22.6 49.1L23.8 43.9H25.2C20.6 43.9 16.8 40.1 16.8 35.5V22.8Z"
                          fill="white"
                        />
                        <path
                          d="M26.2 38.3L31.9 18.7L37.7 38.3"
                          stroke="white"
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
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "top",
                        fontWeight: 800,
                        fontSize: 14,
                        color: "#ffffff",
                        letterSpacing: "0.08em",
                        lineHeight: "22px",
                      }}
                    >
                      AR
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
          <td style={{ verticalAlign: "middle" }}>
            <div
              style={{
                fontSize: 26,
                lineHeight: "30px",
                fontWeight: 800,
                color: "#12311f",
                letterSpacing: "-0.03em",
              }}
            >
              AgriRent
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                lineHeight: "19px",
                color: "#54705d",
                maxWidth: 420,
              }}
            >
              {BRAND_LINE}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <a
      href={href}
      className="agrirent-button"
      style={{
        display: "inline-block",
        padding: "14px 22px",
        backgroundColor: "#15803d",
        color: "#ffffff",
        borderRadius: 14,
        fontWeight: 700,
        fontSize: 15,
        lineHeight: "20px",
        textDecoration: "none",
        boxShadow: "0 12px 28px rgba(21, 128, 61, 0.22)",
      }}
    >
      {children}
    </a>
  );
}

function EmailDetails({ items }: EmailDetailsProps) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{
        border: "1px solid #d8e4d9",
        borderRadius: 18,
        overflow: "hidden",
        marginTop: 24,
      }}
    >
      <tbody>
        {items.map((item, index) => (
          <tr key={item.label}>
            <td
              style={{
                width: "42%",
                padding: "14px 16px",
                fontSize: 13,
                fontWeight: 700,
                color: index % 2 === 0 ? "#39503e" : "#2d4232",
                backgroundColor: index % 2 === 0 ? "#f7fbf6" : "#ffffff",
                verticalAlign: "top",
              }}
              className="agrirent-stack"
            >
              {item.label}
            </td>
            <td
              style={{
                padding: "14px 16px",
                fontSize: 14,
                lineHeight: "22px",
                color: "#16311f",
                backgroundColor: index % 2 === 0 ? "#f7fbf6" : "#ffffff",
              }}
              className="agrirent-stack"
            >
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmailSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div
        style={{
          fontSize: 12,
          lineHeight: "18px",
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#15803d",
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 28,
          lineHeight: "34px",
          letterSpacing: "-0.04em",
          color: "#12311f",
        }}
      >
        {title}
      </h1>
      <div
        style={{
          marginTop: 18,
          fontSize: 16,
          lineHeight: "26px",
          color: "#304637",
        }}
      >
        {children}
      </div>
    </>
  );
}

function bulletList(items: string[]) {
  return (
    <ul style={{ margin: "16px 0 0", paddingLeft: 20 }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (!resend) {
    console.warn("Resend is not configured. Skipping email send.", {
      to: message.to,
      subject: message.subject,
    });
    return {
      success: false,
      message: "Resend is not configured",
    };
  }

  // Dynamically imported so Next.js's RSC bundler does not statically resolve
  // react-dom/server into this module's import graph (this file is reachable
  // from Server Actions via auth.service.ts) — see Next.js error:
  // "You're importing a component that imports react-dom/server."
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html = `<!DOCTYPE html>${renderToStaticMarkup(
    <EmailDocument preview={message.preview} title={message.subject}>
      {message.body}
    </EmailDocument>
  )}`;

  return resend.emails
    .send({
      from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
      to: message.to,
      subject: message.subject,
      html,
      text: message.text,
    })
    .then(({ error }) => {
      if (error) {
        console.error("email.send failed", error, {
          to: message.to,
          subject: message.subject,
        });
        return { success: false, message: "Could not send email" };
      }

      return { success: true, message: "Email sent" };
    })
    .catch((error) => {
      console.error("email.send threw", error, {
        to: message.to,
        subject: message.subject,
      });
      return { success: false, message: "Could not send email" };
    });
}

function buildDashboardUrl(role: "farmer" | "owner"): string {
  return `${getSiteUrl()}/${role}/dashboard`;
}

function buildLoginUrl(): string {
  return `${getSiteUrl()}/login`;
}

function buildResetPasswordUrl(): string {
  return `${getSiteUrl()}/reset-password`;
}

function buildResetCallbackUrl(): string {
  return `${getSiteUrl()}/auth/reset-callback`;
}

export {
  BRAND_LINE,
  DEFAULT_FROM,
  DEFAULT_SUPPORT,
  type EmailResult,
  type EmailDocumentProps,
  type EmailButtonProps,
  type EmailDetailsProps,
  type EmailMessage,
  type Contact,
  type BookingDetails,
  type BookingRecipientProps,
  getSiteUrl,
  formatMoney,
  formatDate,
  formatDateRange,
  firstName,
  EmailDocument,
  EmailBrand,
  EmailButton,
  EmailDetails,
  EmailSection,
  bulletList,
  sendEmail,
  buildDashboardUrl,
  buildLoginUrl,
  buildResetPasswordUrl,
  buildResetCallbackUrl,
};
