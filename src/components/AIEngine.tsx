import { useEffect } from 'react';
import { useGameStore } from '../game/store';

export function AIEngine() {
    const { phase, players, currentPlayerIndex, doubt, passDoubt, playCard, _getNextPlayerIndex, declarationsHistory, direction, continueTurn } = useGameStore();

    useEffect(() => {
        if (phase === 'WAIT_FOR_DOUBT') {
            const nextIdx = _getNextPlayerIndex();
            const nextPlayer = players[nextIdx];

            if (nextPlayer && nextPlayer.isAI) {
                const t = setTimeout(() => {
                    const playerWhoPlayed = players[currentPlayerIndex];
                    const isLastCard = playerWhoPlayed.hand.length === 0;

                    // AI Logic to doubt
                    // Probability: 100% if it's the last card, otherwise 15%
                    const isDoubt = isLastCard || Math.random() < 0.15;

                    if (isDoubt) {
                        doubt(nextPlayer.id);
                    } else {
                        passDoubt(nextPlayer.id);
                    }
                }, 1500);
                return () => clearTimeout(t);
            }
        }

        if (phase === 'RESOLVING_DOUBT') {
            const t = setTimeout(() => {
                continueTurn();
            }, 4000);
            return () => clearTimeout(t);
        }

        if (phase === 'PLAYING') {
            const currentPlayer = players[currentPlayerIndex];
            if (currentPlayer.isAI) {
                const lastDecl = declarationsHistory[declarationsHistory.length - 1];

                const t = setTimeout(() => {
                    // AI decides what to play
                    // Must follow direction
                    const validValues: number[] = [];
                    for (let i = 1; i <= 9; i++) {
                        if (direction === 'UP' && i > lastDecl.declaredValue) validValues.push(i);
                        if (direction === 'DOWN' && i < lastDecl.declaredValue) validValues.push(i);
                    }

                    let playedCard = currentPlayer.hand[0];
                    let declaredValue = lastDecl.declaredValue;

                    // Always try to play true if we have a valid card
                    const truthCards = currentPlayer.hand.filter(c => validValues.includes(c.value));

                    if (truthCards.length > 0) {
                        playedCard = truthCards[Math.floor(Math.random() * truthCards.length)];
                        declaredValue = playedCard.value;
                    } else {
                        // Must lie! Pick a random valid value.
                        if (validValues.length > 0) {
                            declaredValue = validValues[Math.floor(Math.random() * validValues.length)];
                        } else {
                            // Should not happen unless 9 UP or 1 DOWN, which rules prevent via bounce
                            declaredValue = direction === 'UP' ? 9 : 1;
                        }
                        // Pick lowest penalty card without mutating the hand array
                        playedCard = [...currentPlayer.hand].sort((a, b) => parseInt(a.penalty.replace('+X', '10')) - parseInt(b.penalty.replace('+X', '10')))[0];
                    }

                    playCard(currentPlayer.id, playedCard.id, declaredValue);
                }, 1500);

                return () => clearTimeout(t);
            }
        }
    }, [phase, players, currentPlayerIndex, declarationsHistory, direction, continueTurn, doubt, passDoubt, playCard, _getNextPlayerIndex]);

    return null;
}
