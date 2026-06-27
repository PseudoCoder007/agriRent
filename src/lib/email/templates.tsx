import {
  buildDashboardUrl,
  buildLoginUrl,
  formatMoney,
  formatDateRange,
  firstName,
  EmailSection,
  EmailButton,
  EmailDetails,
  bulletList,
  sendEmail,
  type Contact,
  type BookingDetails,
  type BookingRecipientProps,
  type EmailResult,
} from "./components";

function buildBookingBody({
  recipientName,
  otherPartyName,
  equipmentTitle,
  startDate,
  endDate,
  totalAmount,
  ctaUrl,
  intro,
}: BookingRecipientProps & { intro: string }) {
  return (
    <EmailSection eyebrow="Booking update" title={intro}>
      <p style={{ margin: 0 }}>Hi {recipientName},</p>
      <p style={{ marginTop: 14 }}>
        {otherPartyName} just updated your booking for{" "}
        <strong>{equipmentTitle}</strong>.
      </p>
      <EmailDetails
        items={[
          { label: "Equipment", value: equipmentTitle },
          { label: "Dates", value: formatDateRange(startDate, endDate) },
          { label: "Total amount", value: formatMoney(totalAmount) },
          { label: "Other party", value: otherPartyName },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        <EmailButton href={ctaUrl}>Open dashboard</EmailButton>
      </div>
    </EmailSection>
  );
}

export async function sendWelcomeEmail({
  to,
  fullName,
  role,
}: {
  to: string;
  fullName: string | null;
  role: "farmer" | "owner";
}): Promise<EmailResult> {
  const recipient = firstName(fullName, "there");

  return sendEmail({
    to,
    subject: "Welcome to AgriRent",
    preview: "Your AgriRent account is ready.",
    text: [
      `Hi ${recipient},`,
      "",
      "Welcome to AgriRent.",
      `Your ${role} account is ready and you can start using the marketplace right away.`,
      "",
      `Dashboard: ${buildDashboardUrl(role)}`,
      "",
      "Connecting Farmers. Sharing Equipment. Growing Together.",
    ].join("\n"),
    body: (
      <>
        <EmailSection
          eyebrow="Welcome"
          title={`Hi ${recipient}, your AgriRent account is ready`}
        >
          <p style={{ margin: 0 }}>
            Welcome to AgriRent. Your {role} account is ready, and you can
            start browsing, listing, booking, and reviewing equipment right
            away.
          </p>
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl(role)}>
              Open your dashboard
            </EmailButton>
          </div>
          <p style={{ marginTop: 24, marginBottom: 0 }}>
            You will receive booking, review, and account updates from this
            inbox.
          </p>
        </EmailSection>
      </>
    ),
  });
}

export async function sendSignInEmail({
  to,
  fullName,
  role,
}: {
  to: string;
  fullName: string | null;
  role: "farmer" | "owner";
}): Promise<EmailResult> {
  const recipient = firstName(fullName, "there");

  return sendEmail({
    to,
    subject: "New sign-in to your AgriRent account",
    preview: "A new sign-in was completed successfully.",
    text: [
      `Hi ${recipient},`,
      "",
      "A new sign-in to your AgriRent account was completed successfully.",
      `If this was you, no action is needed. Your ${role} dashboard is here:`,
      buildDashboardUrl(role),
      "",
      `If this was not you, update your password immediately at ${buildLoginUrl()}.`,
    ].join("\n"),
    body: (
      <EmailSection
        eyebrow="Sign in"
        title="A new sign-in was completed successfully"
      >
        <p style={{ margin: 0 }}>
          Hi {recipient}, a new sign-in to your AgriRent account was completed
          successfully.
        </p>
        <div style={{ marginTop: 18 }}>
          {bulletList([
            `Account type: ${role}`,
            `Dashboard: ${buildDashboardUrl(role)}`,
            "If this was not you, change your password immediately.",
          ])}
        </div>
        <div style={{ marginTop: 24 }}>
          <EmailButton href={buildDashboardUrl(role)}>
            Open dashboard
          </EmailButton>
        </div>
      </EmailSection>
    ),
  });
}

export async function sendGeneratedRecoveryEmail({
  to,
  fullName,
  recoveryUrl,
}: {
  to: string;
  fullName: string | null;
  recoveryUrl: string;
}): Promise<EmailResult> {
  const recipient = firstName(fullName, "there");

  return sendEmail({
    to,
    subject: "Reset your AgriRent password",
    preview: "Use the secure link below to reset your password.",
    text: [
      `Hi ${recipient},`,
      "",
      "We received a request to reset your AgriRent password.",
      `Open this secure link to continue: ${recoveryUrl}`,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n"),
    body: (
      <EmailSection eyebrow="Password reset" title="Reset your password">
        <p style={{ margin: 0 }}>
          We received a request to reset your AgriRent password.
        </p>
        <div style={{ marginTop: 24 }}>
          <EmailButton href={recoveryUrl}>Choose a new password</EmailButton>
        </div>
        <p style={{ marginTop: 24, marginBottom: 0 }}>
          If you did not request this, you can ignore this email.
        </p>
      </EmailSection>
    ),
  });
}

export async function sendBookingRequestedEmails({
  owner,
  farmer,
  equipmentTitle,
  startDate,
  endDate,
  totalAmount,
}: {
  owner: Contact;
  farmer: Contact;
} & BookingDetails): Promise<EmailResult[]> {
  const ownerName = firstName(owner.fullName, "there");
  const farmerName = firstName(farmer.fullName, "there");

  return Promise.all([
    sendEmail({
      to: owner.email,
      subject: `New booking request for ${equipmentTitle}`,
      preview: "A farmer requested your equipment.",
      text: [
        `Hi ${ownerName},`,
        "",
        `${farmerName} requested a booking for ${equipmentTitle}.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("owner")}`,
      ].join("\n"),
      body: buildBookingBody({
        recipientName: ownerName,
        otherPartyName: farmerName,
        equipmentTitle,
        startDate,
        endDate,
        totalAmount,
        ctaUrl: buildDashboardUrl("owner"),
        intro: `New booking request for ${equipmentTitle}`,
      }),
    }),
    sendEmail({
      to: farmer.email,
      subject: `Booking request sent for ${equipmentTitle}`,
      preview: "Your booking request is now pending review.",
      text: [
        `Hi ${farmerName},`,
        "",
        `Your booking request for ${equipmentTitle} has been sent.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("farmer")}`,
      ].join("\n"),
      body: (
        <EmailSection
          eyebrow="Booking requested"
          title={`Your request for ${equipmentTitle} is pending`}
        >
          <p style={{ margin: 0 }}>Hi {farmerName},</p>
          <p style={{ marginTop: 14 }}>
            Your booking request has been sent and is waiting for the owner to
            review it.
          </p>
          <EmailDetails
            items={[
              { label: "Equipment", value: equipmentTitle },
              { label: "Dates", value: formatDateRange(startDate, endDate) },
              { label: "Total amount", value: formatMoney(totalAmount) },
              { label: "Status", value: "Pending review" },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("farmer")}>
              View your booking
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
  ]);
}

export async function sendBookingApprovedEmails({
  owner,
  farmer,
  equipmentTitle,
  startDate,
  endDate,
  totalAmount,
}: {
  owner: Contact;
  farmer: Contact;
} & BookingDetails): Promise<EmailResult[]> {
  const ownerName = firstName(owner.fullName, "there");
  const farmerName = firstName(farmer.fullName, "there");

  return Promise.all([
    sendEmail({
      to: farmer.email,
      subject: `Booking approved for ${equipmentTitle}`,
      preview: "Your booking request was approved.",
      text: [
        `Hi ${farmerName},`,
        "",
        `Your booking request for ${equipmentTitle} was approved.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("farmer")}`,
      ].join("\n"),
      body: buildBookingBody({
        recipientName: farmerName,
        otherPartyName: ownerName,
        equipmentTitle,
        startDate,
        endDate,
        totalAmount,
        ctaUrl: buildDashboardUrl("farmer"),
        intro: `Booking approved for ${equipmentTitle}`,
      }),
    }),
    sendEmail({
      to: owner.email,
      subject: `You approved a booking for ${equipmentTitle}`,
      preview: "Your approval update was recorded.",
      text: [
        `Hi ${ownerName},`,
        "",
        `You approved the booking request from ${farmerName} for ${equipmentTitle}.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("owner")}`,
      ].join("\n"),
      body: (
        <EmailSection
          eyebrow="Booking approved"
          title={`You approved a booking for ${equipmentTitle}`}
        >
          <p style={{ margin: 0 }}>
            Hi {ownerName}, your approval has been recorded and the farmer has
            been notified.
          </p>
          <EmailDetails
            items={[
              { label: "Farmer", value: farmerName },
              { label: "Equipment", value: equipmentTitle },
              { label: "Dates", value: formatDateRange(startDate, endDate) },
              { label: "Total amount", value: formatMoney(totalAmount) },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("owner")}>
              Open owner dashboard
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
  ]);
}

export async function sendBookingRejectedEmails({
  owner,
  farmer,
  equipmentTitle,
  startDate,
  endDate,
  totalAmount,
}: {
  owner: Contact;
  farmer: Contact;
} & BookingDetails): Promise<EmailResult[]> {
  const ownerName = firstName(owner.fullName, "there");
  const farmerName = firstName(farmer.fullName, "there");

  return Promise.all([
    sendEmail({
      to: farmer.email,
      subject: `Booking declined for ${equipmentTitle}`,
      preview: "Your booking request was declined.",
      text: [
        `Hi ${farmerName},`,
        "",
        `Your booking request for ${equipmentTitle} was declined.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("farmer")}`,
      ].join("\n"),
      body: buildBookingBody({
        recipientName: farmerName,
        otherPartyName: ownerName,
        equipmentTitle,
        startDate,
        endDate,
        totalAmount,
        ctaUrl: buildDashboardUrl("farmer"),
        intro: `Booking declined for ${equipmentTitle}`,
      }),
    }),
    sendEmail({
      to: owner.email,
      subject: `You declined a booking for ${equipmentTitle}`,
      preview: "Your decline update was recorded.",
      text: [
        `Hi ${ownerName},`,
        "",
        `You declined the booking request from ${farmerName} for ${equipmentTitle}.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("owner")}`,
      ].join("\n"),
      body: (
        <EmailSection
          eyebrow="Booking declined"
          title={`You declined a booking for ${equipmentTitle}`}
        >
          <p style={{ margin: 0 }}>
            Hi {ownerName}, your decline has been recorded and the farmer has
            been notified.
          </p>
          <EmailDetails
            items={[
              { label: "Farmer", value: farmerName },
              { label: "Equipment", value: equipmentTitle },
              { label: "Dates", value: formatDateRange(startDate, endDate) },
              { label: "Total amount", value: formatMoney(totalAmount) },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("owner")}>
              Open owner dashboard
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
  ]);
}

export async function sendBookingCancelledEmails({
  owner,
  farmer,
  equipmentTitle,
  startDate,
  endDate,
  totalAmount,
}: {
  owner: Contact;
  farmer: Contact;
} & BookingDetails): Promise<EmailResult[]> {
  const ownerName = firstName(owner.fullName, "there");
  const farmerName = firstName(farmer.fullName, "there");

  return Promise.all([
    sendEmail({
      to: farmer.email,
      subject: `Booking cancelled for ${equipmentTitle}`,
      preview: "Your booking was cancelled.",
      text: [
        `Hi ${farmerName},`,
        "",
        `Your booking for ${equipmentTitle} was cancelled.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("farmer")}`,
      ].join("\n"),
      body: buildBookingBody({
        recipientName: farmerName,
        otherPartyName: ownerName,
        equipmentTitle,
        startDate,
        endDate,
        totalAmount,
        ctaUrl: buildDashboardUrl("farmer"),
        intro: `Booking cancelled for ${equipmentTitle}`,
      }),
    }),
    sendEmail({
      to: owner.email,
      subject: `Booking cancellation recorded for ${equipmentTitle}`,
      preview: "A cancellation update was recorded.",
      text: [
        `Hi ${ownerName},`,
        "",
        `A cancellation was recorded for ${equipmentTitle}.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("owner")}`,
      ].join("\n"),
      body: (
        <EmailSection
          eyebrow="Booking cancelled"
          title={`Booking cancelled for ${equipmentTitle}`}
        >
          <p style={{ margin: 0 }}>
            Hi {ownerName}, the cancellation has been recorded and the other
            party has been notified.
          </p>
          <EmailDetails
            items={[
              { label: "Farmer", value: farmerName },
              { label: "Equipment", value: equipmentTitle },
              { label: "Dates", value: formatDateRange(startDate, endDate) },
              { label: "Total amount", value: formatMoney(totalAmount) },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("owner")}>
              Open owner dashboard
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
  ]);
}

export async function sendBookingCompletedEmails({
  owner,
  farmer,
  equipmentTitle,
  startDate,
  endDate,
  totalAmount,
}: {
  owner: Contact;
  farmer: Contact;
} & BookingDetails): Promise<EmailResult[]> {
  const ownerName = firstName(owner.fullName, "there");
  const farmerName = firstName(farmer.fullName, "there");

  return Promise.all([
    sendEmail({
      to: farmer.email,
      subject: `Booking completed for ${equipmentTitle}`,
      preview: "Your booking was marked as completed.",
      text: [
        `Hi ${farmerName},`,
        "",
        `Your booking for ${equipmentTitle} was marked as completed.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("farmer")}`,
      ].join("\n"),
      body: buildBookingBody({
        recipientName: farmerName,
        otherPartyName: ownerName,
        equipmentTitle,
        startDate,
        endDate,
        totalAmount,
        ctaUrl: buildDashboardUrl("farmer"),
        intro: `Booking completed for ${equipmentTitle}`,
      }),
    }),
    sendEmail({
      to: owner.email,
      subject: `Booking marked completed for ${equipmentTitle}`,
      preview: "A completion update was recorded.",
      text: [
        `Hi ${ownerName},`,
        "",
        `You marked the booking for ${equipmentTitle} as completed.`,
        `Dates: ${formatDateRange(startDate, endDate)}`,
        `Total amount: ${formatMoney(totalAmount)}`,
        "",
        `Open your dashboard: ${buildDashboardUrl("owner")}`,
      ].join("\n"),
      body: (
        <EmailSection
          eyebrow="Booking completed"
          title={`Booking marked completed for ${equipmentTitle}`}
        >
          <p style={{ margin: 0 }}>
            Hi {ownerName}, your completion update has been recorded and the
            farmer has been notified.
          </p>
          <EmailDetails
            items={[
              { label: "Farmer", value: farmerName },
              { label: "Equipment", value: equipmentTitle },
              { label: "Dates", value: formatDateRange(startDate, endDate) },
              { label: "Total amount", value: formatMoney(totalAmount) },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("owner")}>
              Open owner dashboard
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
  ]);
}

export async function sendReviewReceivedEmails({
  owner,
  reviewer,
  equipmentTitle,
  rating,
  comment,
}: {
  owner: Contact;
  reviewer: Contact;
  equipmentTitle: string;
  rating: number;
  comment: string | null;
}): Promise<EmailResult[]> {
  const ownerName = firstName(owner.fullName, "there");
  const reviewerName = firstName(reviewer.fullName, "there");

  return Promise.all([
    sendEmail({
      to: owner.email,
      subject: `New review for ${equipmentTitle}`,
      preview: "Someone left a review for your equipment.",
      text: [
        `Hi ${ownerName},`,
        "",
        `${reviewerName} left a ${rating}-star review for ${equipmentTitle}.`,
        comment ? `Comment: ${comment}` : "",
        "",
        `Open your dashboard: ${buildDashboardUrl("owner")}`,
      ]
        .filter(Boolean)
        .join("\n"),
      body: (
        <EmailSection
          eyebrow="Review received"
          title={`New review for ${equipmentTitle}`}
        >
          <p style={{ margin: 0 }}>
            Hi {ownerName}, {reviewerName} left a {rating}-star review for{" "}
            <strong>{equipmentTitle}</strong>.
          </p>
          <EmailDetails
            items={[
              { label: "Reviewer", value: reviewerName },
              { label: "Rating", value: `${rating} / 5` },
              {
                label: "Comment",
                value: comment ? comment : "No comment was added.",
              },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("owner")}>
              Open owner dashboard
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
    sendEmail({
      to: reviewer.email,
      subject: `Thanks for reviewing ${equipmentTitle}`,
      preview: "Your review was published successfully.",
      text: [
        `Hi ${reviewerName},`,
        "",
        `Thanks for reviewing ${equipmentTitle}. Your ${rating}-star review is now live.`,
        "",
        `Open your dashboard: ${buildDashboardUrl("farmer")}`,
      ].join("\n"),
      body: (
        <EmailSection
          eyebrow="Review sent"
          title={`Thanks for reviewing ${equipmentTitle}`}
        >
          <p style={{ margin: 0 }}>
            Hi {reviewerName}, your review was published successfully.
          </p>
          <EmailDetails
            items={[
              { label: "Equipment", value: equipmentTitle },
              { label: "Rating", value: `${rating} / 5` },
              {
                label: "Comment",
                value: comment ? comment : "No comment was added.",
              },
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <EmailButton href={buildDashboardUrl("farmer")}>
              Open your dashboard
            </EmailButton>
          </div>
        </EmailSection>
      ),
    }),
  ]);
}
