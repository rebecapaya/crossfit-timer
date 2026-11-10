import type { Metadata } from "next";
import SetupClient from "@/components/SetupClient";

export const metadata: Metadata = {
  title: "Setup",
};

export default function SetupPage() {
  return (
    <div className="setup-page">
      <header className="setup-header">
        <h1>
          Box Timer <span>· Setup</span>
        </h1>
        {/* Phase 4: coach email + "Sign out" button go here */}
      </header>

      <main>
        <SetupClient />
      </main>
    </div>
  );
}