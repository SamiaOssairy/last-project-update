
// import React, { useState } from "react";
// import '../styles/Auth.css';

// const SignUp = ({ goToScreen }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     username: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const handleInputChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   return (
//     <div className="form-screen">
//       <div className="form-content">
//         <h2 className="form-title">Create Your Parent Account</h2>
//         <p className="form-subtitle">Join Family Hub and start connecting</p>

//         <div className="form-inputs">
//           <input
//             type="text"
//             name="name"
//             placeholder="Family Title"
//             value={formData.name}
//             onChange={handleInputChange}
//             className="input-field"
//           />
//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={handleInputChange}
//             className="input-field"
//           />
//           <input
//             type="text"
//             name="username"
//             placeholder="Username"
//             value={formData.username}
//             onChange={handleInputChange}
//             className="input-field"
//           />
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
//             className="password-toggle"
//             onClick={() => setShowPassword(!showPassword)}
//           >
//             {showPassword ? "Hide" : "Show"}
//           </button>
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
//             className="password-toggle"
//             onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//           >
//             {showConfirmPassword ? "Hide" : "Show"}
//           </button>
//         </div>

//         <button className="btn btn-primary btn-full">Sign Up</button>

//         <p className="form-link">
//           Already have an account?{" "}
//           <button onClick={() => goToScreen("login")} className="link-button">
//             Log in
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default SignUp;


// import React, { useState } from "react";
// import "../styles/Auth.css"; // Changed from Onboarding.css

// const SignUp = ({ goToScreen }) => {
//   const [formData, setFormData] = useState({ name: "", email: "", username: "", password: "", confirmPassword: "" });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleSignUp = () => goToScreen("home");

//   return (
//   <div className="onboard-screen">
//      <div className="image-area">
//       <img src="/img/family5.png" alt="Organize" />
//     </div>
    
//     <h2 className="signup-title">Create Your Parent Account</h2>

//     <div className="centered-form">
//       <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="input-field" />
//       <input type="email" name="email" placeholder="Family Title" value={formData.email} onChange={handleInputChange} className="input-field" />
//       <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleInputChange} className="input-field" />
//       <div className="password-field">
//         <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} className="input-field" />
//         <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
//         </button>
//       </div>
//       <div className="password-field">
//         <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} className="input-field" />
//         <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
//         </button>
//       </div>
//     </div>
    
//     <button className="next-btn bottom-btn" onClick={handleSignUp}>Sign Up</button>
//     <div className="bottom-link">
//        Already have a Family Account ?
//         <button onClick={() => goToScreen("Login")}>Login</button>
//       </div>
//   </div>
  
//   );
// };

// export default SignUp;

import React, { useState } from "react";
import "../styles/Auth.css";
import { authAPI } from "../services/api";

const SignUp = ({ goToScreen }) => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    familyTitle: "",
    username: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSignUp = async () => {
    setError("");
    
    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!formData.familyTitle.trim()) {
      setError("Please enter your family title");
      return;
    }
    if (!formData.username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!formData.password.trim()) {
      setError("Please enter your password");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Prepare data for backend API
      const signupData = {
        mail: formData.email,
        password: formData.password,
        Title: formData.familyTitle,
        username: formData.username,
        birth_date: new Date().toISOString().split('T')[0]
      };

      console.log('Sending signup data:', signupData);
      const response = await authAPI.signup(signupData);
      console.log('Signup response:', response);
      
      // Save token and user info to localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        familyTitle: response.data.familyTitle,
        memberType: response.data.memberType
      }));
      
      alert('Account created successfully! Please login with your credentials.');
      
      // Navigate to login page
      goToScreen("login");
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboard-screen">
      <div className="top-link">
        =
      </div>

      <div className="image-area">
        <img src="/img/Family15.png" alt="Family" />
      </div>
      
      <h2 className="signup-title">Create Your Parent Account</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="centered-form">
        <input 
          type="text" 
          name="name" 
          placeholder="Full Name" 
          value={formData.name} 
          onChange={handleInputChange} 
          className="input-field" 
        />
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          value={formData.email} 
          onChange={handleInputChange} 
          className="input-field" 
        />
        <input 
          type="text" 
          name="familyTitle" 
          placeholder="Family Title" 
          value={formData.familyTitle} 
          onChange={handleInputChange} 
          className="input-field" 
        />
        <input 
          type="text" 
          name="username" 
          placeholder="Username" 
          value={formData.username} 
          onChange={handleInputChange} 
          className="input-field" 
        />
        <div className="password-field">
          <input 
            type={showPassword ? "text" : "password"} 
            name="password" 
            placeholder="Password" 
            value={formData.password} 
            onChange={handleInputChange} 
            className="input-field" 
          />
          <button 
            type="button" 
            className="password-toggle" 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🔓' : '🔒'}
          </button>
        </div>
        <div className="password-field">
          <input 
            type={showConfirmPassword ? "text" : "password"} 
            name="confirmPassword" 
            placeholder="Confirm Password" 
            value={formData.confirmPassword} 
            onChange={handleInputChange} 
            className="input-field" 
          />
          <button 
            type="button" 
            className="password-toggle" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? '🔓' : '🔒'}
          </button>
        </div>
      </div>
      
      <button className="next-btn bottom-btn" onClick={handleSignUp} disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>

      <div className="bottom-link">
        Already have Family Account ?
        <button onClick={() => goToScreen("login")}>Login</button>
      </div>
    </div>
  );
};

export default SignUp;
