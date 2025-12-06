

import React from "react";
import '../styles/Onboarding.css';

export const OnboardScreen1 = ({ nextScreen }) => (
  <div className="onboard-screen">
    <div className="top-nav">
      <div className="arrow" onClick={nextScreen}>➜</div>
      <button className="skip-btn" onClick={nextScreen}>Skip</button>
    </div>
    <div className="image-area">
      <img src="/img/Family11.png" alt="Family" />
    </div>
    <div className="text-area">
      <h2>Welcome to Family Hub</h2>
      <p>Your seamless solution for managing family life, together</p>
    </div>
    <button className="next-btn" onClick={nextScreen}>Next</button>
    <div className="progress-row">
      <div className="progress active"></div>
      <div className="progress"></div>
      <div className="progress"></div>
      <div className="progress"></div>
    </div>
  </div>
);

export const OnboardScreen2 = ({ nextScreen }) => (
  <div className="onboard-screen">
    <div className="top-nav">
      <div className="arrow" onClick={nextScreen}>➜</div>
      <button className="skip-btn" onClick={nextScreen}>Skip</button>
    </div>
    <div className="image-area">
      <img src="/img/Family12.png" alt="Organize" />
    </div>
    <div className="text-area">
      <h2>Stay Organized, Together</h2>
      <p>Manage schedules, share memories, and keep everyone in sync</p>
    </div>
    <button className="next-btn" onClick={nextScreen}>Next</button>
    <div className="progress-row">
      <div className="progress"></div>
      <div className="progress active"></div>
      <div className="progress"></div>
      <div className="progress"></div>
    </div>
  </div>
);

export const OnboardScreen3 = ({ nextScreen }) => (
  <div className="onboard-screen">
    <div className="top-nav">
      <div className="arrow" onClick={nextScreen}>➜</div>
      <button className="skip-btn" onClick={nextScreen}>Skip</button>
    </div>
    <div className="image-area">
      <img src="/img/Family13.png" alt="Connect" />
    </div>
    <div className="text-area">
      <h2>Connect & Communicate</h2>
      <p>Stay in touch with real-time chat and stay on the same page</p>
    </div>
    <button className="next-btn" onClick={nextScreen}>Next</button>
    <div className="progress-row">
      <div className="progress"></div>
      <div className="progress"></div>
      <div className="progress active"></div>
      <div className="progress"></div>
    </div>
  </div>
);

export const OnboardScreen4 = ({ nextScreen }) => (
  <div className="onboard-screen">
    <div className="top-nav">
      <div className="arrow" onClick={nextScreen}>➜</div>
      <button className="skip-btn" onClick={nextScreen}>Skip</button>
    </div>
    <div className="image-area">
      <img src="/img/Family14.png" alt="Protection" />
    </div>
    <div className="text-area">
      <h2>Family Protection & Peace of Mind</h2>
      <p>Safe, secure, and private for your family</p>
    </div>
    <button className="next-btn" onClick={nextScreen}>Next</button>
    <div className="progress-row">
      <div className="progress"></div>
      <div className="progress"></div>
      <div className="progress"></div>
      <div className="progress active"></div>
    </div>
  </div>

);

