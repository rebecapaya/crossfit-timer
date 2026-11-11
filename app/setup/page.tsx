import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import SetupClient from "@/components/SetupClient";

export const metadata: Metadata = {
  title: "Setup",
};

export const instant = false;

export default async function SetupPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="setup-page">
      <header className="setup-header">
        <h1>
          Box Timer <span>· Setup</span>
        </h1>

        <div className="setup-user">
          <span className="setup-user-email">{session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-signout">Sign out</button>
          </form>
        </div>
      </header>

      <main>
        <SetupClient />
      </main>
    </div>
  );
}