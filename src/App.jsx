const { useEffect, useRef, useState } = React;

const ARENA_WIDTH = 920;
const ARENA_HEIGHT = 620;
const PLAYER_WIDTH = 96;
const PLAYER_Y = ARENA_HEIGHT - 36;

function createItem(level) {
  return {
    id: crypto.randomUUID(),
    x: 42 + Math.random() * (ARENA_WIDTH - 84),
    y: -30,
    speed: 2.4 + Math.random() * 1.8 + level * 0.26,
    type: Math.random() < Math.min(0.22 + level * 0.015, 0.38) ? "bomb" : "coin",
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function App() {
  const arenaRef = useRef(null);
  const keys = useRef({ left: false, right: false });
  const playerXRef = useRef(ARENA_WIDTH / 2);
  const bestRef = useRef(Number(localStorage.getItem("arcade-best") || 0));
  const [running, setRunning] = useState(true);
  const [items, setItems] = useState([]);
  const [playerX, setPlayerX] = useState(ARENA_WIDTH / 2);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(bestRef.current);

  const level = Math.floor(score / 80) + 1;
  const gameOver = lives <= 0;

  function startGame() {
    setScore(0);
    setLives(3);
    setItems([]);
    setPlayerX(ARENA_WIDTH / 2);
    playerXRef.current = ARENA_WIDTH / 2;
    setRunning(true);
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.current.left = true;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.current.right = true;
      if (event.key === " " && !running) startGame();
    }

    function onKeyUp(event) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.current.left = false;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.current.right = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;

    let frameId;
    let lastSpawn = performance.now();

    function tick(now) {
      setPlayerX((current) => {
        const movement = (keys.current.right ? 8 : 0) - (keys.current.left ? 8 : 0);
        const next = clamp(current + movement, PLAYER_WIDTH / 2, ARENA_WIDTH - PLAYER_WIDTH / 2);
        playerXRef.current = next;
        return next;
      });

      setItems((currentItems) => {
        let nextItems = currentItems.map((item) => ({ ...item, y: item.y + item.speed }));

        if (now - lastSpawn > Math.max(340, 760 - level * 44)) {
          nextItems = [...nextItems, createItem(level)];
          lastSpawn = now;
        }

        const caught = [];
        nextItems = nextItems.filter((item) => {
          const isNearPlayer = item.y > PLAYER_Y - 26 && item.y < PLAYER_Y + 22;
          const isInBucket = Math.abs(item.x - playerXRef.current) < PLAYER_WIDTH / 2 + 12;

          if (isNearPlayer && isInBucket) {
            caught.push(item);
            return false;
          }

          if (item.y > ARENA_HEIGHT + 42) {
            if (item.type === "coin") caught.push({ ...item, missed: true });
            return false;
          }

          return true;
        });

        if (caught.length) {
          setScore((current) => {
            const gained = caught.filter((item) => item.type === "coin" && !item.missed).length * 10;
            const next = current + gained;
            if (next > bestRef.current) {
              localStorage.setItem("arcade-best", String(next));
              bestRef.current = next;
              setBest(next);
            }
            return next;
          });

          setLives((current) => {
            const damage = caught.filter((item) => item.type === "bomb" || item.missed).length;
            const next = current - damage;
            if (next <= 0) setRunning(false);
            return next;
          });
        }

        return nextItems;
      });

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [running, level]);

  function moveByPointer(event) {
    const rect = arenaRef.current.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const next = clamp((event.clientX - rect.left) * scaleX, PLAYER_WIDTH / 2, ARENA_WIDTH - PLAYER_WIDTH / 2);
    playerXRef.current = next;
    setPlayerX(next);
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark">A</div>
          <div>
            <h1>Arcade Catch</h1>
            <p className="subtitle">Catch coins, dodge bombs, survive the speed-up.</p>
          </div>
        </div>
        <div className="stats">
          <div className="stat"><span>Score</span><strong>{score}</strong></div>
          <div className="stat"><span>Lives</span><strong>{Math.max(lives, 0)}</strong></div>
          <div className="stat"><span>Best</span><strong>{best}</strong></div>
          <div className="stat"><span>Level</span><strong>{level}</strong></div>
        </div>
      </header>

      <section className="game-wrap">
        <div
          ref={arenaRef}
          className="arena"
          onPointerMove={moveByPointer}
          onPointerDown={moveByPointer}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`item ${item.type}`}
              style={{
                left: `${(item.x / ARENA_WIDTH) * 100}%`,
                top: `${(item.y / ARENA_HEIGHT) * 100}%`,
              }}
            >
              {item.type === "coin" ? "$" : "!"}
            </div>
          ))}

          <div className="player" style={{ left: `${(playerX / ARENA_WIDTH) * 100}%` }} />
          <div className="hint">Move with mouse, touch, arrow keys, or A/D</div>

          {gameOver && (
            <div className="overlay">
              <div className="panel">
                <h2>Game Over</h2>
                <p>
                  Collect the yellow coins for points. Avoid red danger drops and do not let coins fall past you.
                </p>
                <button className="primary" onClick={startGame} onPointerDown={startGame}>
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
