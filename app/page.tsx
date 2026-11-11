import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

const ALLOWED_DOMAIN = (process.env.ALLOWED_DOMAIN ?? "yaqbot.com").toLowerCase();

// Reads the session cookie on every request, so it can't be prerendered
export const instant = false;

export default async function Home({ searchParams }: PageProps<"/">) {
  // Already signed in: go straight to the setup page
  const session = await auth();
  if (session?.user) redirect("/setup");

  // Auth.js comes back here with ?error=... when the sign-in fails
  const { error } = await searchParams;
  const errorMessage = !error
    ? null
    : error === "AccessDenied"
      ? `Only @${ALLOWED_DOMAIN} accounts can sign in`
      : "Something went wrong, please try again";

  return (
    <main className="login">
      <div className="login-card">
        <h1>Box Timer</h1>
        <p>Coaches: sign in to set up a workout</p>

        {errorMessage && (
          <p className="login-error" role="alert">
            {errorMessage}
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/setup" });
          }}
        >
          <button type="submit" className="btn-google">
            Sign in with Google
          </button>
        </form>

        <p className="login-hint">Got a QR code? Just scan it with the phone.</p>
      </div>
    </main>
  );
}