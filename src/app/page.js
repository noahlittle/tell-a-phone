"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DynamicLanding = dynamic(() => import('../components/Landing'), { 
  ssr: false 
});

const DynamicDashboard = dynamic(() => import('../components/Dashboard'), { 
  ssr: false 
});

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged in (e.g., by checking local storage or a token)
    const checkLoginStatus = () => {
      // This is a placeholder. Replace with your actual auth check logic
      const userToken = localStorage.getItem('userToken');
      setIsLoggedIn(!!userToken);
      setIsLoading(false);
    };

    checkLoginStatus();
  }, []);

  const handleLogin = () => {
    // Perform login logic here
    setIsLoggedIn(true);
    // You might want to save a token in localStorage here
    localStorage.setItem('userToken', 'some_token_value');
  };

  const handleLogout = () => {
    // Perform logout logic here
    setIsLoggedIn(false);
    // Clear the token from localStorage
    localStorage.removeItem('userToken');
  };

  return (
    <main>
      {isLoggedIn ? (
        <DynamicDashboard onLogout={handleLogout} />
      ) : (
        <DynamicLanding onLogin={handleLogin} />
      )}
    </main>
  );
}