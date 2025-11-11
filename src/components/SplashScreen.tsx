import { useEffect } from "react";
import AvvaAvatar from "./AvvaAvatar";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background kolam-pattern flex items-center justify-center z-50 animate-in fade-in duration-700">
      <div className="text-center space-y-8 px-4 animate-in zoom-in-95 duration-500 delay-200">
        <div className="flex justify-center animate-float">
          <AvvaAvatar size="xl" showTooltip={false} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary">
            Avva's Game Board
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Centenary Edition
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-card border-2 border-accent rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-lg text-foreground italic">
              "Celebrating 100 years of laughter and love — let's play together!"
            </p>
          </div>
        </div>
        
        <div className="flex justify-center gap-2 pt-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
