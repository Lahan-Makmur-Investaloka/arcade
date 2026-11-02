import Link from "next/link";
import RacingEntry from "./racing-entry";
import "./racing-foundation.css";

export default function TekadRacingPage() {
  return (
    <main className="racing-shell">
      <header className="racing-nav">
        <Link href="/" className="racing-brand"><img src="/branding/icon-192.png" width="40" height="40" alt="" /><span>TEKAD ARCADE</span></Link>
        <Link href="/" className="hub-back">Semua game</Link>
      </header>
      <h1 className="racing-title">TEKAD Racing</h1>
      <RacingEntry />
    </main>
  );
}
