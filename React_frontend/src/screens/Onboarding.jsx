
import React, { useState } from "react";
import { OnboardScreen1, OnboardScreen2, OnboardScreen3, OnboardScreen4 } from "./OnboardingScreens";
import SignUp from "./SignUp";
import Login from "./Login";

const Onboarding = ({ goToScreen }) => {
  const [screen, setScreen] = useState(1);

  const nextScreen = () => {
    if (screen < 4) {
      setScreen(screen + 1);
    } else {
      setScreen("signup"); // Navigate to SignUp after last screen
    }
  };

  const navigateToScreen = (screenName) => {
    setScreen(screenName);
  };

  return (
    <>
      {screen === 1 && <OnboardScreen1 nextScreen={nextScreen} />}
      {screen === 2 && <OnboardScreen2 nextScreen={nextScreen} />}
      {screen === 3 && <OnboardScreen3 nextScreen={nextScreen} />}
      {screen === 4 && <OnboardScreen4 nextScreen={nextScreen} />}
      {screen === "signup" && <SignUp goToScreen={navigateToScreen} onComplete={() => goToScreen("home")} />}
      {screen === "login" && <Login goToScreen={navigateToScreen} onComplete={() => goToScreen("home")} />}
    </>
  );
};

export default Onboarding;


