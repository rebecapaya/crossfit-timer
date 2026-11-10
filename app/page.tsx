import Link from "next/link";

export default function Home() {
  return (
    <main className="message">
      <h1>Box Timer</h1>
      <p>
        <Link href="/setup">Set up a workout →</Link>
      </p>
    </main>
  );
}