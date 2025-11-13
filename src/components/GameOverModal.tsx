import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameOverModalProps {
  open: boolean;
  winner: "player" | "avva" | "draw";
  message: string;
  onRestart: () => void;
}

export const GameOverModal = ({ open, winner, message, onRestart }: GameOverModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-center">
            {winner === "player" && "🎉 You Won!"}
            {winner === "avva" && "Avva Won!"}
            {winner === "draw" && "It's a Draw!"}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button size="lg" onClick={onRestart} className="w-full">
            Play Again
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/")} className="w-full gap-2">
            <Home className="w-4 h-4" />
            Back to Main Menu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
