// import React, { useState } from 'react';
// import { ChevronRight, Eye, EyeOff } from 'lucide-react';
// import './App.css';

// const App = () => {
//   const [currentScreen, setCurrentScreen] = useState('splash1');
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     username: '',
//     password: '',
//     confirmPassword: ''
//   });

//   const handleInputChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const nextScreen = () => {
//     const screens = ['splash1', 'onboard1', 'onboard2', 'onboard3', 'onboard4', 'signup', 'login'];
//     const currentIndex = screens.indexOf(currentScreen);
//     if (currentIndex < screens.length - 1) {
//       setCurrentScreen(screens[currentIndex + 1]);
//     }
//   };

//   const goToScreen = (screen) => {
//     setCurrentScreen(screen);
//   };

//   // Splash Screen 1
//   const SplashScreen1 = () => (
//     <div className="splash-screen">
//       <div className="splash-content">
//         <div className="icon-container">
//           <svg className="main-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//           </svg>
//         </div>
//         <h1 className="app-title">Family Hub</h1>
//         <div className="progress-dots">
//           <div className="dot active"></div>
//           <div className="dot"></div>
//           <div className="dot"></div>
//         </div>
//         <p className="subtitle">Designed by You</p>
//         <button onClick={nextScreen} className="btn btn-primary">Skip</button>
//       </div>
//     </div>
//   );

//   // Onboarding Screen 1
//   // const OnboardScreen1 = () => (
//   //   <div className="onboard-screen">
//   //     <button onClick={nextScreen} className="btn-icon">
//   //       <ChevronRight size={24} />
//   //     </button>
//   //     <div className="onboard-content">
//   //       <div className="illustration-circle">
//   //         <svg className="illustration-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//   //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
//   //         </svg>
//   //       </div>
//   //       <h2 className="onboard-title">Welcome to Family Hub</h2>
//   //       <p className="onboard-description">Your digital home for staying connected with loved ones</p>
//   //       <button onClick={nextScreen} className="btn btn-primary">Next</button>
//   //     </div>
//   //     <div className="progress-bar">
//   //       <div className="bar active-long"></div>
//   //       <div className="bar"></div>
//   //       <div className="bar"></div>
//   //       <div className="bar"></div>
//   //     </div>
//   //   </div>
//   // );
//   const OnboardScreen1 = ({ nextScreen }) => (
//   <div className="onboard-screen">
//     <div className="top-row">
//       <button onClick={nextScreen} className="top-btn left-arrow">←</button>
//       <button className="top-btn skip-btn" onClick={nextScreen}>Skip</button>
//     </div>

//     <div className="onboard-content">
//       <h2 className="onboard-title">Welcome to Family Hub</h2>
//       <p className="onboard-description">
//         Your digital home for staying connected with loved ones
//       </p>
//       <button onClick={nextScreen} className="btn-primary">Next</button>
//     </div>

//     <div className="progress-bar">
//       <div className="bar active-long"></div>
//       <div className="bar"></div>
//       <div className="bar"></div>
//       <div className="bar"></div>
//     </div>
//   </div>
// );

  // // Onboarding Screen 2
  // const OnboardScreen2 = () => (
  //   <div className="onboard-screen">
  //     <button onClick={nextScreen} className="btn-icon">
  //       <ChevronRight size={24} />
  //     </button>
  //     <div className="onboard-content">
  //       <div className="illustration-circle">
  //         <svg className="illustration-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  //         </svg>
  //       </div>
  //       <h2 className="onboard-title">Stay Organized, Together</h2>
  //       <p className="onboard-description">Manage schedules, share memories, and keep everyone in sync</p>
  //       <button onClick={nextScreen} className="btn btn-primary">Next</button>
  //     </div>
  //     <div className="progress-bar">
  //       <div className="bar"></div>
  //       <div className="bar active-long"></div>
  //       <div className="bar"></div>
  //       <div className="bar"></div>
  //     </div>
  //   </div>
  // );

  // // Onboarding Screen 3
  // const OnboardScreen3 = () => (
  //   <div className="onboard-screen">
  //     <button onClick={nextScreen} className="btn-icon">
  //       <ChevronRight size={24} />
  //     </button>
  //     <div className="onboard-content">
  //       <div className="illustration-circle">
  //         <svg className="illustration-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  //         </svg>
  //       </div>
  //       <h2 className="onboard-title">Connect & Communicate</h2>
  //       <p className="onboard-description">Stay in touch with real-time chat and stay on the same page</p>
  //       <button onClick={nextScreen} className="btn btn-primary">Next</button>
  //     </div>
  //     <div className="progress-bar">
  //       <div className="bar"></div>
  //       <div className="bar"></div>
  //       <div className="bar active-long"></div>
  //       <div className="bar"></div>
  //     </div>
  //   </div>
  // );

  // // Onboarding Screen 4
  // const OnboardScreen4 = () => (
  //   <div className="onboard-screen">
  //     <button onClick={nextScreen} className="btn-icon">
  //       <ChevronRight size={24} />
  //     </button>
  //     <div className="onboard-content">
  //       <div className="illustration-circle">
  //         <svg className="illustration-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  //         </svg>
  //       </div>
  //       <h2 className="onboard-title">Family Protection & Peace of Mind</h2>
  //       <p className="onboard-description">Safe, secure, and private for your family</p>
  //       <button onClick={nextScreen} className="btn btn-primary">Next</button>
  //     </div>
  //     <div className="progress-bar">
  //       <div className="bar"></div>
  //       <div className="bar"></div>
  //       <div className="bar"></div>
  //       <div className="bar active-long"></div>
  //     </div>
  //   </div>
  // );

  // // Sign Up Screen
  // const SignUpScreen = () => (
  //   <div className="form-screen">
  //     <button onClick={nextScreen} className="btn-icon">
  //       <ChevronRight size={24} />
  //     </button>
  //     <div className="form-content">
  //       <div className="form-icon-container">
  //         <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  //         </svg>
  //       </div>
        
  //       <h2 className="form-title">Create Your Parent Account</h2>
  //       <p className="form-subtitle">Join Family Hub and start connecting</p>
        
  //       <div className="form-inputs">
  //         <input
  //           type="text"
  //           name="Family Title"
  //           placeholder="Family Title"
  //           value={formData.name}
  //           onChange={handleInputChange}
  //           className="input-field"
  //         />
          
  //         <input
  //           type="email"
  //           name="email"
  //           placeholder="Email"
  //           value={formData.email}
  //           onChange={handleInputChange}
  //           className="input-field"
  //         />
          
  //         <input
  //           type="text"
  //           name="username"
  //           placeholder="Username"
  //           value={formData.username}
  //           onChange={handleInputChange}
  //           className="input-field"
  //         />
          
  //         <div className="password-field">
  //           <input
  //             type={showPassword ? "text" : "password"}
  //             name="password"
  //             placeholder="Password"
  //             value={formData.password}
  //             onChange={handleInputChange}
  //             className="input-field"
  //           />
  //           <button
  //             type="button"
  //             onClick={() => setShowPassword(!showPassword)}
  //             className="password-toggle"
  //           >
  //             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </button>
  //         </div>
          
  //         <div className="password-field">
  //           <input
  //             type={showConfirmPassword ? "text" : "password"}
  //             name="confirmPassword"
  //             placeholder="Confirm Password"
  //             value={formData.confirmPassword}
  //             onChange={handleInputChange}
  //             className="input-field"
  //           />
  //           <button
  //             type="button"
  //             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  //             className="password-toggle"
  //           >
  //             {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </button>
  //         </div>
  //       </div>
        
  //       <button onClick={nextScreen} className="btn btn-primary btn-full">
  //         Sign Up
  //       </button>
        
  //       <p className="form-link">
  //         Already have a family account? 
  //         <button onClick={() => goToScreen('login')} className="link-button">Log in</button>
  //       </p>
  //     </div>
  //   </div>
  // );

  // // Login Screen
  // const LoginScreen = () => (
  //   <div className="form-screen">
  //     <button onClick={() => goToScreen('signup')} className="btn-icon">
  //       <ChevronRight size={24} />
  //     </button>
  //     <div className="form-content">
  //       <div className="form-icon-container">
  //         <svg className="form-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  //         </svg>
  //       </div>
        
  //       <h2 className="form-title">Welcome Back !</h2>
        
  //       <div className="form-inputs">
  //         <input
  //           type="text"
  //           placeholder="Email or Username"
  //           className="input-field"
  //         />
          
  //         <div className="password-field">
  //           <input
  //             type={showPassword ? "text" : "password"}
  //             placeholder="Password"
  //             className="input-field"
  //           />
  //           <button
  //             type="button"
  //             onClick={() => setShowPassword(!showPassword)}
  //             className="password-toggle"
  //           >
  //             {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //           </button>
  //         </div>
  //       </div>
        
  //       <button className="btn btn-primary btn-full">
  //         Log In
  //       </button>
        
  //       <p className="form-link">
  //         Don't have a family account? 
  //         <button onClick={() => goToScreen('signup')} className="link-button">Sign up</button>
  //       </p>
        
  //       <div className="social-login">
  //         <p className="social-text">Or sign in with</p>
  //         <div className="social-buttons">
  //           <button className="social-btn facebook">
  //             <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
  //               <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  //             </svg>
  //           </button>
  //           <button className="social-btn google">
  //             <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
  //               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  //               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  //               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  //               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  //             </svg>
  //           </button>
  //           <button className="social-btn apple">
  //             <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
  //               <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  //             </svg>
  //           </button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

//   return (
//     <div className="app-container">
//       {currentScreen === 'splash1' && <SplashScreen1 />}
//       {currentScreen === 'onboard1' && <OnboardScreen1 />}
//       {currentScreen === 'onboard2' && <OnboardScreen2 />}
//       {currentScreen === 'onboard3' && <OnboardScreen3 />}
//       {currentScreen === 'onboard4' && <OnboardScreen4 />}
//       {currentScreen === 'signup' && <SignUpScreen />}
//       {currentScreen === 'login' && <LoginScreen />}
//     </div>
//   );
// };

// export default App;

///////////////////////////////////////////////////////////
// import OnboardScreen1 from "./screens/Onboarding";
// import "./styles/Onboarding.css";

// function App() {
//   const nextScreen = () => {
//     console.log("Next screen...");
//   };

//   return <OnboardScreen1 nextScreen={nextScreen} />;
// }

// export default App;

///////////////
// Onboarding.jsx
import React, { useState } from "react";
import Onboarding from "./screens/Onboarding";
import SignUp from "./screens/SignUp";
import Login from "./screens/Login";
import HomePage from "./screens/Home";

function App() {
  const [screen, setScreen] = useState("onboarding"); // "onboarding" | "signup" | "login" | "home"
  const [userName, setUserName] = useState("");
  const [familyTitle, setFamilyTitle] = useState("");

  const goToScreen = (name) => setScreen(name);

  const handleLoginSuccess = (userData) => {
    setUserName(userData.username || "");
    setFamilyTitle(userData.familyTitle || "");
    setScreen("home");
  };

  const handleSignUpSuccess = () => {
    setScreen("login");
  };

  const handleLogout = () => {
    setUserName("");
    setFamilyTitle("");
    setScreen("login");
  };

  return (
    <>
      {screen === "onboarding" && <Onboarding goToScreen={goToScreen} />}
      {screen === "signup" && <SignUp goToScreen={goToScreen} />}
      {screen === "login" && <Login goToScreen={goToScreen} onComplete={handleLoginSuccess} />}
      {screen === "home" && <HomePage userName={userName} familyTitle={familyTitle} onLogout={handleLogout} />}
    </>
  );
}

export default App;


