import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import GameHeader from "@/components/GameHeader";
import { GameOverModal } from "@/components/GameOverModal";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const RULES = [
  "You play as White, Avva plays as Black.",
  "Each piece moves according to standard chess rules.",
  "Pawns promote to queens when reaching the opposite end.",
  "Special moves like castling, en passant, and pawn promotion are supported.",
  "Checkmate wins the game. Stalemate or insufficient material results in a draw.",
  "Click a piece to select it, then click a legal square to move.",
];

const pieceSymbols: Record<string, string> = {
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
};

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "avva" | "draw" | null>(null);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const isPlayerWinner = game.turn() === "b";
        if (isPlayerWinner) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          setGameOver(true);
          setWinner("player");
          setGameOverMessage("Checkmate! You defeated Avva!");
          setAvvaMessage(getRandomMessage("losing"));
        } else {
          setGameOver(true);
          setWinner("avva");
          setGameOverMessage("Checkmate! Better luck next time.");
          setAvvaMessage(getRandomMessage("winning"));
        }
      } else if (game.isDraw()) {
        setGameOver(true);
        setWinner("draw");
        setGameOverMessage("The game ended in a draw.");
      }
    }
  }, [game]);

  const evaluateBoard = (chess: Chess): number => {
    const board = chess.board();
    let score = 0;
    
    const pieceValues: Record<string, number> = {
      p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
    };

    const pawnPositionBonus = [
      [0,  0,  0,  0,  0,  0,  0,  0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5,  5, 10, 25, 25, 10,  5,  5],
      [0,  0,  0, 20, 20,  0,  0,  0],
      [5, -5,-10,  0,  0,-10, -5,  5],
      [5, 10, 10,-20,-20, 10, 10,  5],
      [0,  0,  0,  0,  0,  0,  0,  0]
    ];

    const knightPositionBonus = [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,  0,  0,  0,  0,-20,-40],
      [-30,  0, 10, 15, 15, 10,  0,-30],
      [-30,  5, 15, 20, 20, 15,  5,-30],
      [-30,  0, 15, 20, 20, 15,  0,-30],
      [-30,  5, 10, 15, 15, 10,  5,-30],
      [-40,-20,  0,  5,  5,  0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          const positionBonus = piece.type === 'p' ? pawnPositionBonus[i][j] :
                               piece.type === 'n' ? knightPositionBonus[i][j] : 0;
          
          if (piece.color === 'b') {
            score += value + positionBonus;
          } else {
            score -= value + positionBonus;
          }
        }
      }
    }

    // Bonus for mobility
    const blackMoves = chess.moves().length;
    score += blackMoves * 10;

    return score;
  };

  const minimax = (chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number => {
    if (depth === 0 || chess.isGameOver()) {
      return evaluateBoard(chess);
    }

    const moves = chess.moves();
    
    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const tempChess = new Chess(chess.fen());
        tempChess.move(move);
        const evaluation = minimax(tempChess, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const tempChess = new Chess(chess.fen());
        tempChess.move(move);
        const evaluation = minimax(tempChess, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  const makeAvvaMove = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      const possibleMoves = game.moves();
      
      if (possibleMoves.length === 0) return;

      // Advanced AI with minimax algorithm
      let bestMove = possibleMoves[0];
      let bestValue = -Infinity;
      
      for (const move of possibleMoves) {
        const tempChess = new Chess(game.fen());
        tempChess.move(move);
        const value = minimax(tempChess, 3, -Infinity, Infinity, false);
        
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }
      
      game.move(bestMove);
      setGame(new Chess(game.fen()));
      setAvvaThinking(false);
      
      if (Math.random() > 0.7) {
        setAvvaMessage(getRandomMessage("goodMove"));
      }
    }, 1500 + Math.random() * 1000);
  };

  const onSquareClick = (square: string) => {
    if (avvaThinking || game.turn() === 'b' || gameOver) return;

    if (selectedSquare) {
      try {
        const move = game.move({
          from: selectedSquare as any,
          to: square as any,
          promotion: "q",
        });

        if (move) {
          setGame(new Chess(game.fen()));
          setSelectedSquare(null);
          
          if (!game.isGameOver()) {
            setTimeout(makeAvvaMove, 500);
          }
        } else {
          const piece = game.get(square as any);
          if (piece && piece.color === 'w') {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      } catch {
        setSelectedSquare(null);
      }
    } else {
      const piece = game.get(square as any);
      if (piece && piece.color === 'w') {
        setSelectedSquare(square);
      }
    }
  };

  const renderBoard = () => {
    const board = game.board();
    const squares = [];
    const moves = game.moves({ verbose: true });
    const legalMoves: string[] = selectedSquare ? moves.filter(m => m.from === selectedSquare).map(m => m.to) : [];
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const piece = board[i][j];
        const isLight = (i + j) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isLegalMove = legalMoves.includes(square);
        
        squares.push(
          <div
            key={square}
            onClick={() => onSquareClick(square)}
            className={`
              aspect-square flex items-center justify-center text-4xl cursor-pointer relative
              ${isLight ? "bg-[#F8E9D0]" : "bg-[#704214]"}
              ${isSelected ? "ring-4 ring-[#D4AF37]" : ""}
              ${isLegalMove ? "ring-2 ring-[#3A7BD5]" : ""}
              hover:opacity-80 transition-all
            `}
          >
            {isLegalMove && !piece && (
              <div className="w-3 h-3 rounded-full bg-[#3A7BD5]/40"></div>
            )}
            {piece && (
              <span className={piece.color === 'w' ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'}>
                {pieceSymbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
              </span>
            )}
          </div>
        );
      }
    }
    
    return squares;
  };

  const handleRestart = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setGameOver(false);
    setWinner(null);
    setGameOverMessage("");
    setAvvaMessage(getRandomMessage("greeting"));
    setAvvaThinking(false);
  };

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Chess"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
        rules={RULES}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Turn: {game.turn() === "w" ? "Your Turn (White)" : "Avva's Turn (Black)"}
              </span>
              {game.isCheck() && (
                <span className="text-destructive font-bold">Check!</span>
              )}
            </div>
          </Card>

          <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-accent max-w-[600px] mx-auto">
            <div className="grid grid-cols-8 gap-0 aspect-square">
              {renderBoard()}
            </div>
          </div>

          {!gameOver && (
            <Card className="mt-4 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Click a piece, then click where you want to move it
              </p>
            </Card>
          )}
        </div>
      </main>

      <GameOverModal
        open={gameOver}
        winner={winner || "draw"}
        message={gameOverMessage}
        onRestart={handleRestart}
      />
    </div>
  );
};

export default ChessGame;
