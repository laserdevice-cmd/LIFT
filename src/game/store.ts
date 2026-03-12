import { create } from 'zustand';
import { Card, VALUES_DISTRIBUTION, PENALTY_DISTRIBUTION, Penalty, Player, Declaration, Direction } from './constants';

export type GamePhase = 'HOME' | 'PLAYING' | 'WAIT_FOR_DOUBT' | 'RESOLVING_DOUBT' | 'GAME_OVER';

interface GameState {
    phase: GamePhase;
    players: Player[];
    currentPlayerIndex: number;
    deck: Card[];
    discardPile: Card[]; // Discarded and revealed cards
    direction: Direction;
    declarationsHistory: Declaration[]; // Only contains *current stack* of declarations (usually we just need the last valid one, but a history is good)
    vertigoLimit: number;
    message: string;
    gameLog: string[];
    doubters: string[]; // Players who already chose not to doubt this turn

    // Actions
    startGame: (playerNames: string[], aiCount: number, limit: number) => void;
    playCard: (playerId: string, cardId: string, declaredValue: number) => void;
    doubt: (doubterId: string) => void;
    passDoubt: (playerId: string) => void;
    continueTurn: () => void; // After doubt resolution modal, move to next player
    _getNextPlayerIndex: () => number;
    _advanceCurrentPlayer: () => void;
}

const generateDeck = (): Card[] => {
    let values: number[] = [];
    VALUES_DISTRIBUTION.forEach(d => {
        for (let i = 0; i < d.count; i++) values.push(d.value);
    });

    let penalties: Penalty[] = [];
    PENALTY_DISTRIBUTION.forEach(d => {
        for (let i = 0; i < d.count; i++) penalties.push(d.penalty);
    });

    values = values.sort(() => Math.random() - 0.5);
    penalties = penalties.sort(() => Math.random() - 0.5);

    return values.map((v, i) => ({
        id: `card-${i}-${Math.random().toString(36).substring(7)}`,
        value: v,
        penalty: penalties[i],
    }));
};

const drawCards = (deck: Card[], discardPile: Card[], count: number) => {
    const drawn: Card[] = [];
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    for (let i = 0; i < count; i++) {
        if (currentDeck.length === 0) {
            if (currentDiscard.length === 0) break; // No cards left anywhere!
            // Keep last played/valid card if needed? Usually discard pile is fully shuffled
            currentDeck = [...currentDiscard].sort(() => Math.random() - 0.5);
            currentDiscard = [];
        }
        drawn.push(currentDeck.pop()!);
    }
    return { drawn, newDeck: currentDeck, newDiscard: currentDiscard };
};

const getPenaltyAmount = (penaltyStr: Penalty, actualValue: number): number => {
    if (penaltyStr === '+X') return actualValue;
    return parseInt(penaltyStr.replace('+', ''), 10);
};

export const useGameStore = create<GameState>((set, get) => ({
    phase: 'HOME',
    players: [],
    currentPlayerIndex: 0,
    deck: [],
    discardPile: [],
    direction: 'UP',
    declarationsHistory: [],
    vertigoLimit: 15,
    message: '',
    gameLog: [],
    doubters: [],

    startGame: (playerNames, aiCount, limit) => {
        let initialDeck = generateDeck();
        const players: Player[] = [];

        // Create humans
        playerNames.forEach((name, i) => {
            const pCards = initialDeck.splice(-7, 7);
            players.push({
                id: `p-${i}`,
                name,
                isAI: false,
                hand: pCards,
                isEliminated: false
            });
        });

        // Pool of potential bot names
        const botNamesPool = [
            "Caronte", "Minosse", "Lucifero", "SatanBot", "Vertigo",
            "Abisso", "Malfidato", "Bugiardo", "BluffKing", "Oscuro",
            "Pinnacolo", "Zolfo", "Fiammetta", "Cenere", "Rovina"
        ];
        // Shuffle the pool to pick unique names
        const shuffledBotNames = [...botNamesPool].sort(() => Math.random() - 0.5);

        // Create AIs
        for (let i = 0; i < aiCount; i++) {
            const pCards = initialDeck.splice(-7, 7);
            players.push({
                id: `ai-${i}`,
                name: shuffledBotNames[i % shuffledBotNames.length] || `Bot ${i + 1}`,
                isAI: true,
                hand: pCards,
                isEliminated: false
            });
        }

        // First card on table (floor)
        const firstCard = initialDeck.pop()!;
        let startingDirection: Direction = 'UP';
        if (firstCard.value === 9) startingDirection = 'DOWN';
        else if (firstCard.value === 1) startingDirection = 'UP';

        const startDecl: Declaration = {
            playerId: 'system',
            cardId: firstCard.id,
            declaredValue: firstCard.value,
            isResolved: true
        };

        set({
            phase: 'PLAYING',
            players,
            currentPlayerIndex: 0,
            deck: initialDeck,
            discardPile: [firstCard],
            direction: startingDirection,
            declarationsHistory: [startDecl],
            vertigoLimit: limit,
            message: `Partita iniziata! Piano terra: ${firstCard.value} (${startingDirection}). Tocca a ${players[0].name}.`,
            gameLog: [`L'ascensore parte dal piano ${firstCard.value} in direzione ${startingDirection}.`],
            doubters: [],
        });
    },

    playCard: (playerId, cardId, declaredValue) => {
        const state = get();
        if (state.phase !== 'PLAYING') return;

        const player = state.players.find(p => p.id === playerId);
        if (!player) return;

        // Remove card from hand
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const playedCard = player.hand[cardIndex];
        const newHand = [...player.hand];
        newHand.splice(cardIndex, 1);

        const newPlayers = state.players.map(p =>
            p.id === playerId ? { ...p, hand: newHand } : p
        );

        const newDeclaration: Declaration = {
            playerId,
            cardId: playedCard.id,
            declaredValue,
            isResolved: false
        };

        const nextIdx = state._getNextPlayerIndex();
        const nextPlayer = state.players[nextIdx];

        // The card goes to discard ONLY visually for now, actually it is in limbo on top of the stack.
        set({
            players: newPlayers,
            declarationsHistory: [...state.declarationsHistory, newDeclaration],
            discardPile: [...state.discardPile, playedCard], // We add to discardpile right away. If doubt is false, we pop it.
            phase: 'WAIT_FOR_DOUBT',
            message: `${player.name} ha dichiarato un ${declaredValue}. ${nextPlayer.name} dubita?`,
            gameLog: [...state.gameLog, `${player.name} ha dichiarato un ${declaredValue}.`],
            doubters: [playerId], // player cannot doubt themselves
        });
    },

    passDoubt: (playerId) => {
        const state = get();
        if (state.phase !== 'WAIT_FOR_DOUBT') return;

        const nextPlayerId = state.players[state._getNextPlayerIndex()].id;
        if (playerId !== nextPlayerId) return;

        // If the next player passes, the declaration becomes resolved
        const decls = [...state.declarationsHistory];
        const lastDecl = decls[decls.length - 1];
        lastDecl.isResolved = true;

        // Check bounce
        let newDirection = state.direction;
        let bounceMsg = '';
        if (lastDecl.declaredValue === 9) {
            newDirection = 'DOWN';
            bounceMsg = `L'ascensore ha scontrato il tetto! Direzione invertita: DOWN!`;
        } else if (lastDecl.declaredValue === 1) {
            newDirection = 'UP';
            bounceMsg = `L'ascensore ha toccato il suolo! Direzione invertita: UP!`;
        }

        const logLines = [...state.gameLog];
        if (bounceMsg) logLines.push(bounceMsg);

        // Check win condition (if player who played has 0 cards)
        const playingPlayer = state.players.find(p => p.id === lastDecl.playerId)!;
        if (playingPlayer.hand.length === 0) {
            set({
                phase: 'GAME_OVER',
                declarationsHistory: decls,
                direction: newDirection,
                message: `${playingPlayer.name} ha svuotato la mano e VINCE LA PARTITA!`,
                gameLog: logLines,
            });
            return;
        }

        set({
            phase: 'PLAYING',
            declarationsHistory: decls,
            direction: newDirection,
            doubters: [],
            gameLog: logLines,
        });

        get()._advanceCurrentPlayer();
    },

    doubt: (doubterId) => {
        const state = get();
        if (state.phase !== 'WAIT_FOR_DOUBT') return;

        const nextPlayerId = state.players[state._getNextPlayerIndex()].id;
        if (doubterId !== nextPlayerId) return;

        const doubter = state.players.find(p => p.id === doubterId)!;
        const decls = [...state.declarationsHistory];
        const lastDecl = decls[decls.length - 1];
        const accused = state.players.find(p => p.id === lastDecl.playerId)!;

        const playedCard = state.discardPile[state.discardPile.length - 1];
        const isHonest = playedCard.value === lastDecl.declaredValue;

        let penaltyCount = getPenaltyAmount(playedCard.penalty, playedCard.value);

        let newDeck = [...state.deck];
        let newDiscard = [...state.discardPile];
        let newPlayers = [...state.players];
        let newDirection = state.direction;
        let logMsg = '';
        let msg = '';
        let resolvedDecls = decls;

        if (isHonest) {
            // Accuser failed
            const { drawn, newDeck: d1, newDiscard: d2 } = drawCards(newDeck, newDiscard, penaltyCount);
            newDeck = d1;
            newDiscard = d2;

            newPlayers = newPlayers.map(p => {
                if (p.id === doubter.id) return { ...p, hand: [...p.hand, ...drawn] };
                return p;
            });

            lastDecl.isResolved = true; // The truthful declaration remains valid
            msg = `NON SEI MIO AMICO! ${doubter.name} dubita di ${accused.name}. Ma ${accused.name} DICEVA IL VERO! Carta: ${playedCard.value}. ${doubter.name} pesca ${penaltyCount} carte.`;
            logMsg = `Dubbio fallito. ${doubter.name} pesca ${penaltyCount} carte per penalità ${playedCard.penalty}.`;

            if (lastDecl.declaredValue === 9) {
                newDirection = 'DOWN';
                logMsg += ` L'ascensore ha scontrato il tetto! Direzione invertita: DOWN!`;
            } else if (lastDecl.declaredValue === 1) {
                newDirection = 'UP';
                logMsg += ` L'ascensore ha toccato il suolo! Direzione invertita: UP!`;
            }
        } else {
            // Liar caught
            // Accused takes back their card + penalty
            newDiscard.pop(); // Remove the lied card from discard pile

            const { drawn, newDeck: d1, newDiscard: d2 } = drawCards(newDeck, newDiscard, penaltyCount);
            newDeck = d1;
            newDiscard = d2;

            newPlayers = newPlayers.map(p => {
                if (p.id === accused.id) return { ...p, hand: [...p.hand, playedCard, ...drawn] };
                return p;
            });

            resolvedDecls.pop(); // Remove the invalid declaration
            msg = `NON SEI MIO AMICO! ${doubter.name} dubita di ${accused.name} e LO SMASCHERA! La carta era un ${playedCard.value}! ${accused.name} riprende la carta e pesca ${penaltyCount} carte.`;
            logMsg = `Bugiardo smascherato! ${accused.name} ha giocato ${playedCard.value} invece di ${lastDecl.declaredValue}. Pesca ${penaltyCount} carte per penalità ${playedCard.penalty}.`;
        }

        // Check Vertigo for all players (since someone just drew cards)
        newPlayers = newPlayers.map(p => {
            if (!p.isEliminated && p.hand.length >= state.vertigoLimit) {
                // The eliminated player's hand goes to discard!
                newDiscard.push(...p.hand);
                logMsg += ` VERTIGO! ${p.name} precipita per aver superato il limite di portanza!`;
                return { ...p, isEliminated: true, hand: [] };
            }
            return p;
        });

        set({
            phase: 'RESOLVING_DOUBT',
            players: newPlayers,
            deck: newDeck,
            discardPile: newDiscard,
            direction: newDirection,
            declarationsHistory: resolvedDecls,
            message: msg,
            gameLog: [...state.gameLog, logMsg],
        });
    },

    continueTurn: () => {
        const state = get();

        // Check if anyone won by emptying their hand (e.g. after a failed doubt on their last card)
        const winner = state.players.find(p => !p.isEliminated && p.hand.length === 0);
        if (winner) {
            set({
                phase: 'GAME_OVER',
                message: `${winner.name} ha svuotato la mano e VINCE LA PARTITA!`,
                gameLog: [...state.gameLog, `${winner.name} ha vinto liberandosi di tutte le carte.`],
            });
            return;
        }

        // Check game over by elimination
        const alivePlayers = state.players.filter(p => !p.isEliminated);
        if (alivePlayers.length <= 1) {
            if (alivePlayers.length === 1) {
                set({
                    phase: 'GAME_OVER',
                    message: `${alivePlayers[0].name} è l'ultimo rimasto in vita e VINCE LA PARTITA!`,
                    gameLog: [...state.gameLog, `Tutti gli altri sono caduti. ${alivePlayers[0].name} sopravvive!`]
                });
            } else {
                set({
                    phase: 'GAME_OVER',
                    message: `TUTTI ELIMINATI! Nessun vincitore!`,
                    gameLog: [...state.gameLog, `L'ascensore è precipitato con tutti a bordo!`]
                });
            }
            return;
        }

        // Set playing phase
        set({ phase: 'PLAYING', doubters: [] });
        get()._advanceCurrentPlayer();
    },

    _getNextPlayerIndex: () => {
        const state = get();
        let nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
        while (state.players[nextIdx].isEliminated) {
            nextIdx = (nextIdx + 1) % state.players.length;
        }
        return nextIdx;
    },

    _advanceCurrentPlayer: () => {
        const state = get();
        const nextIdx = state._getNextPlayerIndex();

        set({
            currentPlayerIndex: nextIdx,
            message: `Tocca a ${state.players[nextIdx].name}.`,
        });
    }

}));
