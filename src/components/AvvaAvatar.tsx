import { useState, useEffect } from "react";
import avvaImage from "@/assets/avva-avatar.png";

interface AvvaAvatarProps {
  message?: string;
  thinking?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showTooltip?: boolean;
}

const AvvaAvatar = ({ 
  message, 
  thinking = false, 
  size = "md",
  showTooltip = true 
}: AvvaAvatarProps) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div 
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-4 border-accent shadow-lg transition-all duration-300 ${
          thinking ? "animate-pulse-glow" : ""
        }`}
        title={showTooltip ? "Avva – Your Opponent & Cheerleader" : undefined}
      >
        <img 
          src={avvaImage} 
          alt="Avva's Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {thinking && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      )}
      
      {showMessage && message && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-10 animate-in slide-in-from-left-5 fade-in duration-300">
          <div className="relative bg-card border-2 border-accent rounded-2xl px-4 py-3 shadow-lg max-w-xs">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-accent"></div>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-card"></div>
            <p className="text-sm font-medium text-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvvaAvatar;
