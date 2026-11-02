'use client';

import { useLayoutEffect, useState } from 'react';
import ArcadeHome from '../arcade-home';
import { selectionKey } from '../arcade-selection';
import { arcadeGames } from '../arcade-catalog';

// Without a game in returnTo, the backdrop shows the game last selected on the home. That choice lives in
// sessionStorage, so nothing is drawn until it is read: no flash of another game before the right one.
export default function LoginBackdrop({ gameId }: { gameId?: string }) {
  const [id, setId] = useState<string | undefined>(gameId);
  useLayoutEffect(() => {
    if (gameId) return;
    let stored: string | null = null;
    try { stored = sessionStorage.getItem(selectionKey); } catch { /* Storage is optional. */ }
    setId(arcadeGames.some(item => item.id === stored) ? stored! : arcadeGames[0].id);
  }, [gameId]);
  return <div className="login-backdrop" aria-hidden="true" inert>{id && <ArcadeHome gameId={id} />}</div>;
}
