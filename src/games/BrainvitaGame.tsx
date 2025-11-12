import { useState } from "react";
import GameHeader from "@/components/GameHeader";
import { getRandomMessage } from "@/lib/avvaAI";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Undo2, Lightbulb } from "lucide-react";
import confetti from "canvas-confetti";

type Cell = 0 | 1 | 2; // 0 = invalid, 1 = peg, 2 = empty

const initialBoard: Cell[][] = [
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 2, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
];

const BrainvitaGame = () => {
  const [board, setBoard] = useState<Cell[][]>(initialBoard.map(row => [...row]));
  const [selectedPeg, setSelectedPeg] = useState<[number, number] | null>(null);
  const [history, setHistory] = useState<Cell[][][]>([]);
  const [avvaMessage, setAvvaMessage] = useState(getRandomMessage("greeting"));
  const [moves, setMoves] = useState(0);
  const { toast } = useToast();

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Target must be empty
    if (board[toRow]?.[toCol] !== 2) return false;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Must be exactly 2 squares away horizontally or vertically
    if (!((rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2))) {
      return false;
    }

    // Must jump over exactly one peg
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    
    return board[midRow][midCol] === 1;
  };

  const makeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const newBoard = board.map(row => [...row]);
    
    newBoard[fromRow][fromCol] = 2;
    newBoard[toRow][toCol] = 1;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const midRow = fromRow + rowDiff / 2;
    const midCol = fromCol + colDiff / 2;
    newBoard[midRow][midCol] = 2;

    setHistory([...history, board]);
    setBoard(newBoard);
    setMoves(moves + 1);
    setSelectedPeg(null);

    // Check for win
    const pegsLeft = newBoard.flat().filter(cell => cell === 1).length;
    if (pegsLeft === 1 && newBoard[3][3] === 1) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setAvvaMessage(getRandomMessage("losing"));
      toast({
        title: "Perfect! You Won!",
        description: `Completed in ${moves + 1} moves!`,
      });
    } else if (pegsLeft < 10) {
      setAvvaMessage(getRandomMessage("goodMove"));
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] === 0) return;

    if (selectedPeg) {
      const [fromRow, fromCol] = selectedPeg;
      if (isValidMove(fromRow, fromCol, row, col)) {
        makeMove(fromRow, fromCol, row, col);
      } else {
        if (board[row][col] === 1) {
          setSelectedPeg([row, col]);
        } else {
          setSelectedPeg(null);
        }
      }
    } else {
      if (board[row][col] === 1) {
        setSelectedPeg([row, col]);
      }
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousBoard = history[history.length - 1];
      setBoard(previousBoard);
      setHistory(history.slice(0, -1));
      setMoves(moves - 1);
      setSelectedPeg(null);
    }
  };

  const handleHint = () => {
    // Find any valid move
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] === 1) {
          const directions = [
            [2, 0], [-2, 0], [0, 2], [0, -2]
          ];
          for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (newRow >= 0 && newRow < 7 && newCol >= 0 && newCol < 7) {
              if (isValidMove(row, col, newRow, newCol)) {
                setSelectedPeg([row, col]);
                setAvvaMessage("Try jumping from the glowing peg!");
                toast({
                  title: "Hint from Avva",
                  description: "Look at the highlighted peg - it can jump!",
                });
                return;
              }
            }
          }
        }
      }
    }
    toast({
      title: "No moves available",
      description: "Try undoing some moves.",
    });
  };

  const handleRestart = () => {
    setBoard(initialBoard.map(row => [...row]));
    setSelectedPeg(null);
    setHistory([]);
    setMoves(0);
    setAvvaMessage(getRandomMessage("greeting"));
  };

  const pegsLeft = board.flat().filter(cell => cell === 1).length;

  return (
    <div className="min-h-screen bg-background kolam-pattern">
      <GameHeader
        gameName="Brainvita"
        onRestart={handleRestart}
        avvaMessage={avvaMessage}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg">
                <span className="font-semibold">Pegs left: </span>
                <span className="text-primary font-bold">{pegsLeft}</span>
              </div>
              <div className="text-lg">
                <span className="font-semibold">Moves: </span>
                <span className="text-accent font-bold">{moves}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleHint}
                className="gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Hint from Avva
              </Button>
            </div>
          </Card>

          <Card className="p-8">
            <div className="inline-block mx-auto">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell, colIndex) => {
                    const isSelected = 
                      selectedPeg && 
                      selectedPeg[0] === rowIndex && 
                      selectedPeg[1] === colIndex;

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                          w-12 h-12 m-1 rounded-lg flex items-center justify-center
                          ${cell === 0 ? "invisible" : ""}
                          ${cell === 1 ? "cursor-pointer" : ""}
                          ${cell === 2 ? "bg-muted border-2 border-border" : ""}
                          ${cell === 1 && isSelected ? "bg-primary animate-pulse-glow" : ""}
                          ${cell === 1 && !isSelected ? "bg-accent hover:bg-accent/80 border-2 border-accent" : ""}
                        `}
                      >
                        {cell === 1 && (
                          <div className="w-8 h-8 rounded-full bg-foreground"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Jump over pegs to remove them. Goal: Leave only one peg in the center!
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BrainvitaGame;
