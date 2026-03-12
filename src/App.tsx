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

      <div className="glass-panel main-menu-panel" style={{ padding: '2.5rem', maxWidth: '650px', width: '100%', textAlign: 'center' }}>
        <h1 className="title" style={{ fontSize: 'calc(var(--font-base) * 5)', fontWeight: 900, marginBottom: '0.5rem', color: '#f8fafc', textShadow: '0 0 30px rgba(59,130,246,0.6)', letterSpacing: '4px' }}>LIFT</h1>
        <p className="subtitle" style={{ fontSize: '1.25rem', color: '#f97316', marginBottom: '2rem', fontWeight: 'bold' }}>L'Ascensore per l'Inferno</p>

        {phase === 'GAME_OVER' && (
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.75rem', marginBottom: '0.5rem' }}>PARTITA TERMINATA</h2>
            <p style={{ fontSize: '1.25rem' }}>{message}</p>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Il tuo nome:</label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem' }}
          />

          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Lobby (Avversari AI):</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setAiCount(n)}
                className={`btn ${aiCount === n ? '' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
              >
                {n}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Modalità Vertigo (Limite Carte):</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setLimit(12)}
              className={`btn ${limit === 12 ? 'btn-danger' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
            >
              12 (Last Man)
            </button>
            <button
              onClick={() => setLimit(15)}
              className={`btn ${limit === 15 ? '' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
            >
              15 (Standard)
            </button>
            <button
              onClick={() => setLimit(18)}
              className={`btn ${limit === 18 ? '' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', background: limit === 18 ? '#16a34a' : 'transparent', borderColor: limit === 18 ? '#16a34a' : '#3b82f6' }}
            >
              18 (Chicken)
            </button>
          </div>
        </div>

        <button
          className="btn"
          style={{ width: '100%', fontSize: '1.4rem', padding: '1rem' }}
          onClick={() => startGame([playerName || 'Giocatore'], aiCount, limit)}
        >
          ENTRA NELL'ASCENSORE
        </button>
      </div>
    </div>
  );
}

export default App;
