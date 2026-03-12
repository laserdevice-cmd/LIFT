import { useState } from 'react';
import { useGameStore } from './game/store';
import { GameBoard } from './components/GameBoard';

function App() {
  const { phase, startGame, message } = useGameStore();
  const [playerName, setPlayerName] = useState('Giocatore');
  const [aiCount, setAiCount] = useState(3);
  const [limit, setLimit] = useState(15);

  if (phase !== 'HOME' && phase !== 'GAME_OVER') {
    return <GameBoard />;
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>

      <div className="glass-panel main-menu-panel" style={{ padding: '3rem', maxWidth: '700px', width: '100%', textAlign: 'center' }}>
        <h1 className="title" style={{ fontSize: 'calc(var(--font-base) * 6)', fontWeight: 900, marginBottom: '0.5rem', color: '#f8fafc', textShadow: '0 0 30px rgba(59,130,246,0.6)', letterSpacing: '4px' }}>LIFT</h1>
        <p className="subtitle" style={{ fontSize: '1.5rem', color: '#f97316', marginBottom: '3rem', fontWeight: 'bold' }}>L'Ascensore per l'Inferno</p>

        {phase === 'GAME_OVER' && (
          <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', marginBottom: '2.5rem' }}>
            <h2 style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '2rem', marginBottom: '1rem' }}>PARTITA TERMINATA</h2>
            <p style={{ fontSize: '1.4rem' }}>{message}</p>
          </div>
        )}

        <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Il tuo nome:</label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '1.2rem', marginBottom: '2rem' }}
          />

          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Lobby (Avversari AI):</label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setAiCount(n)}
                className={`btn ${aiCount === n ? '' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.75rem', fontSize: '1.1rem' }}
              >
                {n}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Modalità Vertigo (Limite Carte):</label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setLimit(12)}
              className={`btn ${limit === 12 ? 'btn-danger' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
            >
              12 (Last Man)
            </button>
            <button
              onClick={() => setLimit(15)}
              className={`btn ${limit === 15 ? '' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
            >
              15 (Standard)
            </button>
            <button
              onClick={() => setLimit(18)}
              className={`btn ${limit === 18 ? '' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', background: limit === 18 ? '#16a34a' : 'transparent', borderColor: limit === 18 ? '#16a34a' : '#3b82f6' }}
            >
              18 (Chicken)
            </button>
          </div>
        </div>

        <button
          className="btn"
          style={{ width: '100%', fontSize: '1.5rem', padding: '1.25rem' }}
          onClick={() => startGame([playerName || 'Giocatore'], aiCount, limit)}
        >
          ENTRA NELL'ASCENSORE
        </button>
      </div>
    </div>
  );
}

export default App;
