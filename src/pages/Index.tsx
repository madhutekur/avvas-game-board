import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import HomePage from "@/components/HomePage";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {!showSplash && <HomePage />}
    </>
  );
};

export default Index;
