import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import GameHeader from "@/components/GameHeader";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";

const pieceSymbols: Record<string, string> = {
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
};

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [avvaThinking, setAvvaThinking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for game over
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === "w" ? "Avva" : "You";
        if (winner === "You") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          setAvvaMessage(getRandomMessage("losing"));
          toast({
            title: "Checkmate! You won!",
            description: "Congratulations, you beat Avva!",
          });
        } else {
          setAvvaMessage(getRandomMessage("winning"));
          toast({
            title: "Checkmate! Avva won!",
            description: "Don't worry, try again!",
          });
        }
      } else if (game.isDraw()) {
        toast({
          title: "Draw!",
          description: "The game ended in a draw.",
        });
      }
    }
  }, [game, toast]);

  const makeAvvaMove = () => {
    setAvvaThinking(true);
    setAvvaMessage(getRandomMessage("thinking"));

    setTimeout(() => {
      const possibleMoves = game.moves();
      
      if (possibleMoves.length === 0) return;

      // Simple AI: random move with slight preference for captures
      const captureMoves = possibleMoves.filter(move => move.includes('x'));
      const movesToConsider = captureMoves.length > 0 && Math.random() > 0.3 
        ? captureMoves 
        : possibleMoves;
      
      const randomIndex = Math.floor(Math.random() * movesToConsider.length);
      const move = movesToConsider[randomIndex];
      
      game.move(move);
      setGame(new Chess(game.fen()));
      setAvvaThinking(false);
      
      if (Math.random() > 0.7) {
        setAvvaMessage(getRandomMessage("goodMove"));
      }
    }, 1000 + Math.random() * 1000);
  };

  const onSquareClick = (square: string) => {
    if (avvaThinking || game.turn() === 'b') return;

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
    setAvvaMessage(getRandomMessage("greeting"));
    setAvvaThinking(false);
  };

  const handleHowToPlay = () => {
    toast({
      title: "How to Play Chess",
      description: "Move your pieces to checkmate Avva's king. Drag and drop pieces to make your moves.",
    });
  };

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Chess"
        onRestart={handleRestart}
        onHowToPlay={handleHowToPlay}
        avvaMessage={avvaMessage}
        avvaThinking={avvaThinking}
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

          <Card className="mt-4 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Click a piece, then click where you want to move it
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ChessGame;
