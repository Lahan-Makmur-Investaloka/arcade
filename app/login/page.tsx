import Link from "next/link";
import { cookies } from "next/headers";
import { safeReturnTo } from "./safe-return-to";
import LoginForm from './login-form';
import { arcadeGames } from "../arcade-catalog";
import LoginBackdrop from "./login-backdrop";
import { selectionKey } from "../arcade-selection";
import "./login.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  // The backdrop follows the game being opened, as on the arcade home.
  const target = new URL(returnTo, "https://tekad.local").pathname.replace(/\/+$/, "");
  // Without a game in returnTo (header "Login"), use the game last selected on the home, kept in a cookie.
  const selected = (await cookies()).get(selectionKey)?.value;
  const game = arcadeGames.find(item => item.href.replace(/\/+$/, "") === target) ?? arcadeGames.find(item => item.id === selected);

  return <>
    <LoginBackdrop gameId={game?.id} />
    <div className="login-blur" aria-hidden="true" />
    <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <Link className="login-brand" href="/" aria-label="Kembali ke TEKAD Arcade">
        <img src="/branding/icon-192.png" width="40" height="40" alt="" />
        <span>TEKAD <b>ARCADE</b></span>
      </Link>
      <h1 id="login-title">Masuk untuk bermain</h1>
      <p className="login-copy">Gunakan akun Lahans Anda agar progres dan aktivitas bermain tersimpan dengan aman.</p>
      <LoginForm returnTo={returnTo} />
      <Link className="login-back" href="/">← Kembali ke arcade</Link>
    </section>
    </main>
  </>;
}
