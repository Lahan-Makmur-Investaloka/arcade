// Chronicles runs outside React, so it needs the same session lifecycle checks.
(() => {
  let checking = false;
  let account = null;
  const login = () => location.replace('/login?returnTo=' + encodeURIComponent(location.pathname + location.search + location.hash));
  async function check() {
    if (checking || document.visibilityState === 'hidden') return;
    checking = true;
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (response.status === 401) { login(); return; }
      if (!response.ok) return;
      const { user } = await response.json();
      if (!user || (account && account !== user.guid)) { login(); return; }
      account = user.guid;
    } catch { /* Retry on focus or the next interval during temporary network loss. */ }
    finally { checking = false; }
  }
  addEventListener('focus', check);
  addEventListener('storage', event => { if (event.key === 'tekad-arcade-auth-event') login(); });
  document.addEventListener('visibilitychange', check);
  setInterval(check, 60000);
  void check();
})();
