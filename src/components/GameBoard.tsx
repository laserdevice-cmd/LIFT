import { useState } from 'react';
import { useGameStore } from '../game/store';
import { AIEngine } from './AIEngine';
import { ArrowUp, ArrowDown, AlertTriangle, PlayCircle } from 'lucide-react';

export function GameBoard() {
    const {
        phase, players, currentPlayerIndex, declarationsHistory, direction,
        message, gameLog, playCard, doubt, passDoubt, vertigoLimit, _getNextPlayerIndex, discardPile
    } = useGameStore();

    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [declaredValue, setDeclaredValue] = useState<number>(0);

    const currentPlayer = players[currentPlayerIndex];
    const humanPlayer = players.find(p => !p.isAI);
    const lastDecl = declarationsHistory.length > 0 ? declarationsHistory[declarationsHistory.length - 1] : null;
    const playedCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

    const nextPlayerIndex = phase === 'WAIT_FOR_DOUBT' ? _getNextPlayerIndex() : -1;
    const isMyTurnToDoubt = phase === 'WAIT_FOR_DOUBT' && humanPlayer && players[nextPlayerIndex]?.id === humanPlayer.id;

    const handlePlayCard = () => {
        if (selectedCardId && declaredValue > 0) {
            playCard(humanPlayer!.id, selectedCardId, declaredValue);
            setSelectedCardId(null);
            setDeclaredValue(0);
        }
    };

    const getValidValues = () => {
        if (!lastDecl) return [];
        if (direction === 'UP') {
            return Array.from({ length: 9 - lastDecl.declaredValue }, (_, i) => lastDecl.declaredValue + i + 1);
        } else {
            return Array.from({ length: lastDecl.declaredValue - 1 }, (_, i) => i + 1);
        }
    };
    const validValues = getValidValues();

    return (
        <div className="app-container">
            <AIEngine />

            {/* Header Log */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ textAlign: 'center', padding: '1rem 2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {message}
                    </h2>
                    <div className={`direction-indicator ${direction}`} style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '9999px', fontWeight: 'bold', alignItems: 'center' }}>
                        {direction === 'UP' ? <ArrowUp /> : <ArrowDown />}
                        <span style={{ marginLeft: '0.5rem' }}>{direction}</span>
                    </div>
                </div>
            </div>

            {/* Players Ring */}
            <div className="player-list">
                {players.map((p, i) => (
                    <div
                        key={p.id}
                        className={`player-avatar ${i === currentPlayerIndex ? 'current' : ''} ${p.isEliminated ? 'eliminated' : ''}`}
                    >
                        <div className="card-count" style={{ color: p.hand.length >= vertigoLimit - 2 ? 'var(--neon-red)' : 'white' }}>
                            {p.hand.length}
                        </div>
                        <div className="player-name">{p.name} {p.isEliminated ? '💀' : ''}</div>
                    </div>
                ))}
            </div>

            {/* Main Board Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem' }}>

                {/* Left Side: Elevator Floors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>Piani</div>

                    <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {direction === 'UP' && <ArrowUp size={28} className="direction-indicator UP" style={{ border: 'none', padding: 0 }} />}
                    </div>

                    {[9, 8, 7, 6, 5, 4, 3, 2, 1].map(floor => (
                        <div
                            key={floor}
                            style={{
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '12px',
                                fontWeight: '900',
                                fontSize: '1.25rem',
                                background: lastDecl?.declaredValue === floor ? (direction === 'UP' ? 'var(--neon-blue)' : 'var(--neon-orange)') : 'rgba(30, 41, 59, 0.5)',
                                color: lastDecl?.declaredValue === floor ? 'white' : '#475569',
                                boxShadow: lastDecl?.declaredValue === floor ? (direction === 'UP' ? '0 0 20px var(--neon-blue)' : '0 0 20px var(--neon-orange)') : 'none',
                                border: lastDecl?.declaredValue === floor ? 'none' : '1px solid #334155',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {floor}
                        </div>
                    ))}

                    <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {direction === 'DOWN' && <ArrowDown size={28} className="direction-indicator DOWN" style={{ border: 'none', padding: 0 }} />}
                    </div>
                </div>

                {/* Right Side: Active Card */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lastDecl && playedCard && (
                        <div
                            className={`playing-card glass-panel ${phase !== 'RESOLVING_DOUBT' && lastDecl.playerId !== 'system' ? 'back' : ''}`}
                            style={{ cursor: 'default', transform: 'scale(1.3)', margin: '0 2rem' }}
                        >
                            {phase === 'RESOLVING_DOUBT' || lastDecl.playerId === 'system' ? (
                                <>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{lastDecl.playerId === 'system' ? 'Partenza' : 'Svelata'}</div>
                                    <div className="card-value">{playedCard.value}</div>
                                    <div className="card-penalty" style={{ marginTop: '8px', fontSize: '1.2rem', padding: '2px 8px' }}>{playedCard.penalty}</div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>RISCHIO</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--neon-red)', textShadow: '0 0 15px rgba(239, 68, 68, 0.8)' }}>
                                        {playedCard.penalty}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions / Hand */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                {humanPlayer && !humanPlayer.isEliminated ? (
                    <>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                            La tua mano ({humanPlayer.hand.length}/{vertigoLimit})
                        </h3>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {humanPlayer.hand.map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => {
                                        if (phase === 'PLAYING' && currentPlayer.id === humanPlayer.id) {
                                            setSelectedCardId(card.id);
                                            if (validValues.length > 0) {
                                                if (validValues.includes(card.value)) {
                                                    setDeclaredValue(card.value);
                                                } else {
                                                    setDeclaredValue(validValues[0] || (direction === 'UP' ? 9 : 1));
                                                }
                                            }
                                        }
                                    }}
                                    className={`playing-card ${selectedCardId === card.id ? 'selected' : ''}`}
                                >
                                    <div className="card-value">{card.value}</div>
                                    <div className="card-penalty-small">{card.penalty}</div>
                                </div>
                            ))}
                        </div>

                        {/* Play Controls */}
                        {phase === 'PLAYING' && currentPlayer.id === humanPlayer.id && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', border: '1px solid #334155', maxWidth: '500px', margin: '0 auto' }}>
                                <div style={{ marginBottom: '0.5rem', fontWeight: 'semibold' }}>Cosa dichiari?</div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                    {validValues.map(v => (
                                        <button
                                            key={v}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer',
                                                background: declaredValue === v ? '#2563eb' : '#334155',
                                                color: 'white', border: 'none',
                                                boxShadow: declaredValue === v ? '0 0 10px #3b82f6' : 'none'
                                            }}
                                            onClick={() => setDeclaredValue(v)}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                    {validValues.length === 0 && (
                                        <button
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer',
                                                background: '#2563eb', color: 'white', border: 'none',
                                                boxShadow: '0 0 10px #3b82f6'
                                            }}
                                            onClick={() => setDeclaredValue(direction === 'UP' ? 9 : 1)}
                                        >
                                            {direction === 'UP' ? 9 : 1}
                                        </button>
                                    )}
                                </div>
                                <button
                                    className="btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    disabled={!selectedCardId || !declaredValue}
                                    onClick={handlePlayCard}
                                >
                                    <PlayCircle size={20} />
                                    GIOCA CARTA
                                </button>
                            </div>
                        )}

                        {/* Doubt Controls */}
                        {isMyTurnToDoubt && (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', border: '1px solid #334155', maxWidth: '500px', margin: '0 auto' }}>
                                <button className="btn btn-danger" style={{ fontWeight: 'bold', fontSize: '1.125rem' }} onClick={() => doubt(humanPlayer.id)}>
                                    <AlertTriangle size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                    NON SEI MIO AMICO!
                                </button>
                                <button className="btn btn-outline" onClick={() => passDoubt(humanPlayer.id)}>
                                    PASSO
                                </button>
                            </div>
                        )}

                        {phase === 'RESOLVING_DOUBT' && (
                            <div style={{ textAlign: 'center', padding: '1rem', color: '#fb923c', fontWeight: 'bold' }}>
                                Risoluzione del dubbio in corso...
                            </div>
                        )}

                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', fontWeight: 'bold', padding: '2rem' }}>
                        {humanPlayer ? 'SEI STATO ELIMINATO (VERTIGO)' : 'SPECTATOR MODE'}
                    </div>
                )}
            </div>

            {/* Footer Log */}
            <div className="glass-panel" style={{ marginTop: 'auto', height: '6rem', overflowY: 'auto', padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#94a3b8', width: '100%', maxWidth: '768px', margin: '0 auto', display: 'flex', flexDirection: 'column-reverse' }}>
                {[...gameLog].reverse().map((log, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                ))}
            </div>

        </div>
    );
}
