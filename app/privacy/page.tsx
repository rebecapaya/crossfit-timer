import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="privacy">
      <h1>Privacy policy</h1>
      <p>
        Box Timer is an internal tool for the coaches of the box. This page explains what data it
        uses.
      </p>

      <h2>Google sign-in</h2>
      <p>
        Coaches sign in with Google. We only receive the account&apos;s name and email address, and
        we use them solely to check that the account belongs to the allowed domain. They are not
        stored in any database or shared with anyone.
      </p>

      <h2>Cookies</h2>
      <p>
        After signing in, a session cookie keeps the coach logged in. It is deleted when the coach
        signs out or when it expires.
      </p>

      <h2>Workouts</h2>
      <p>
        Workout settings are not stored on our servers. They travel inside the timer link (and its
        QR code) and are only read by the browser that opens it.
      </p>

      <h2>Contact</h2>
      <p>For any question about this policy, write to rebecapaya17@gmail.com.</p>
    </main>
  );
}