"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Radio, Rocket, Mail, Lock, User, PenTool, Zap, Link, BadgeDollarSign, FileText, Newspaper, ArrowRight, Home, CheckCircle, SearchCheck, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import Modal from './Modal'; // Make sure to create this component in a separate file

const Landing = ({ onLogin }) => {
  const [currentWord, setCurrentWord] = useState('side project');
  const [fade, setFade] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

 // const URL = 'http://localhost:3001';
  const URL = 'https://api.raydeeo.com';

  useEffect(() => {
    if (resetToken) {
      setCurrentView('reset');
      window.history.replaceState({}, document.title, "/");
    }
  }, [resetToken]);

  const words = ['side project', 'startup', 'SaaS', 'website', 'ProductHunt launch', 'app', 'small business', 'chrome extension', 'blog', 'tech startup', 'podcast', 'YouTube channel', 'AI startup', 'social media empire'];
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentWord(prevWord => {
          const currentIndex = words.indexOf(prevWord);
          return words[(currentIndex + 1) % words.length];
        });
        setFade(false);
      }, 500);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const newsWebsites = [
    "MarketWatch", "The Globe and Mail", "Benzinga", "BarChart", "Business Insurance", "Chronicle Journal",
    "Minyanville", "Starkville Daily News", "Benzinga", "The Global Tribune",
    "Big Spring Herald", "BarChart", "The Pilot News", "The Globe and Mail", "Newport Vermont Daily Express",
    "AM News", "Punxsutawney Spirit", "Benzinga", "Wapakoneta Daily News",
    "Benton Courier", "The News Universe", "Benzinga","St. Marys Daily Press",
    "Star Tribune", "BarChart", "WRAL", "Investor Place", "The Globe and Mail", "StreetInsider"
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post(URL + '/register', { name, email, password });
      setSuccessMessage(response.data.message);
      setCurrentView('login');
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred during registration');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(URL + '/login', { email, password });
      localStorage.setItem('token', response.data.token);
      onLogin();
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred during login');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const response = await axios.post(URL + '/api/forgot-password', { email });
      setSuccessMessage(response.data.message);
      setCurrentView('login');
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while processing your request');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    try {
      setCurrentView('login');
      const response = await axios.post(URL + '/api/reset-password', { token: resetToken, password });
      setSuccessMessage(response.data.message);
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred while resetting the password');
    }
  };

  const renderHomeButton = () => (
    <Button
      variant="ghost"
      onClick={() => setCurrentView('home')}
      className="absolute top-4 left-4 p-2"
    >
      <Home className="h-6 w-6" />
    </Button>
  );

  const renderAuthForm = () => {
    switch (currentView) {
      case 'register':
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
            {renderHomeButton()}
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
              <Radio className="h-8 w-8 text-gray-900 mx-auto" />
                <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
              </CardHeader>
              <CardContent>
              {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}
              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <div className="relative">
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="Enter your name" 
                        className="pl-10" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        className="pl-10" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Create a password" 
                        className="pl-10" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">Register</Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="ghost" onClick={() => setCurrentView('login')}>Already have an account? Log in</Button>
              </CardFooter>
            </Card>
          </div>
        );
      case 'login':
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
            {renderHomeButton()}
            <Card className="w-full max-w-md">
              <CardHeader>
                <Radio className="h-8 w-8 text-gray-900 mx-auto" />
                <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
              </CardHeader>
              <CardContent>
              {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}
              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        className="pl-10" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your password" 
                        className="pl-10" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">Log In</Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="ghost" onClick={() => setCurrentView('forgot')}>Forgot password?</Button>
                <Button variant="ghost" onClick={() => setCurrentView('register')}>Don&apos;t have an account?</Button> 
              </CardFooter>
            </Card>
          </div>
        );
        case 'forgot':
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
              {renderHomeButton()}
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleForgotPassword}>
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="Enter your email" 
                          className="pl-10" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">Reset Password</Button>
                  </form>
                </CardContent>
                <CardFooter className="justify-center">
                  <Button variant="ghost" onClick={() => setCurrentView('login')}>Back to Login</Button>
                </CardFooter>
              </Card>
            </div>
          );
          case 'reset':
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
            {renderHomeButton()}
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword}>
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter your new password" 
                        className="pl-10" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        placeholder="Confirm your new password" 
                        className="pl-10" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">Reset Password</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <>
            <nav className="bg-white shadow-md">
              <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <Radio className="h-8 w-8 text-gray-900 mr-2" />
                  <span className="text-2xl font-bold text-gray-900">Raydeeo</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => setCurrentView('register')}>
                    <Rocket className="mr-2" /> Get Started
                  </Button>
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 relative">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="text-center max-w-4xl mx-auto">
                  <h1 className="font-serif text-5xl font-bold mb-6 leading-tight">
                    Catapult your <br/>
                    <span className={`text-gray-700 underline decoration-gray-400 inline-block transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
                      {currentWord}
                    </span> <br/>
                    into the public eye.
                  </h1>
                  <p className="text-xl mb-8 text-gray-700">Get your <b>press release</b> written, reviewed, and distributed with Raydeeo.</p>
                  <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <Badge variant="outline" className="text-lg py-1 px-3 bg-white">
                      <Newspaper className="w-5 h-5 mr-2" />
                      400+ Premium News Websites
                    </Badge>
                    <Badge variant="outline" className="text-lg py-1 px-3 bg-white">
                      <Link className="w-5 h-5 mr-2" />
                      Instant Backlinks
                    </Badge>
                    <Badge variant="outline" className="text-lg py-1 px-3 bg-white">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Journalist Interest
                    </Badge>
                    <Badge variant="outline" className="text-lg py-1 px-3 bg-white">
                    <SearchCheck className="w-5 h-5 mr-2" />
                    Featured on Google News
                  </Badge>
                  </div>
                  <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg px-8 py-6" onClick={() => setCurrentView('register')}>
                  <Rocket className="mr-2" /> Publish Your Press Release for $99 
                  </Button>
                </div>
              </div>
              {/* News Ticker */}
              <div className="absolute bottom-0 left-0 right-0 bg-gray-200 py-2 overflow-hidden">
                <div className="ticker-content flex whitespace-nowrap">
                  {[...newsWebsites, ...newsWebsites].map((site, index) => (
                    <span key={index} className="mx-4 text-gray-600">{site}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6 max-w-6xl">
                <h2 className="font-serif text-4xl font-bold mb-24 text-center">Here&apos;s why <u>people like you</u> choose Raydeeo:</h2>
                <div className="grid md:grid-cols-4 gap-12 mt-10">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <h3 className="font-serif text-2xl font-bold mb-4">PR Writing Made Easy</h3>
                    <p className="text-gray-600">Raydeeo uses AI to guide you through writing your press release to follow the strict PR style guidelines.</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <h3 className="font-serif text-2xl font-bold mb-4">Instant Review</h3>
                    <p className="text-gray-600">Raydeeo uses an automated review process to make sure your press release will be accepted to news sites - and get it distributed quickly!</p>
                  </div>
                  <div className="text-center">
                    <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <h3 className="font-serif text-2xl font-bold mb-4">Wide Coverage</h3>
                    <p className="text-gray-600">Your press release will appear on <b>Google News</b> and be distributed to over 400 news-based websites for maximum exposure, including Benzinga, BarChart and The Globe and Mail.</p>
                  </div>
                  <div className="text-center">
                    <BadgeDollarSign className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <h3 className="font-serif text-2xl font-bold mb-4">Lowest Price</h3>
                    <p className="text-gray-600">Raydeeo is among <u><b>the most affordable</b></u> premium distribution services in the industry at just $99.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-gray-50">
              <div className="container mx-auto px-6 max-w-6xl">
                <h2 className="font-serif text-4xl font-bold mb-12 text-center">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl font-bold mb-2">
                        <FileText className="w-8 h-8 mr-3 text-gray-700" />
                        Provide Your Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Choose to supply your own press release, or answer a few questions and Raydeoo will craft an optimized press release for you!</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl font-bold mb-2">
                        <Sparkles className="w-8 h-8 mr-3 text-gray-700" />
                        Automated Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Raydeeo automatically reviews your release for quality and to ensure it meets guidelines. You can make changes yourself, or use the "Fix It For Me" feature to get it past review.</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl font-bold mb-2">
                        <Radio className="w-8 h-8 mr-3 text-gray-700" />
                        Broad Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Your approved release will be submitted for distribution across our broad network of over 400 news sites.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6 max-w-6xl">
                <h2 className="font-serif text-4xl font-bold mb-12 text-center">What Our Customers Say</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold mb-2">&quot;Raydeeo is a game-changer.&quot;</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">You just can't find this sort of distribution for the same price. Smooth process, would recommend.</p>
                      <p className="text-gray-700 font-semibold">- Michael Reynolds</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold mb-2">&quot;Very easy to use.&quot;</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">The process was smooth from start to finish. Our press release got picked up as promised.</p>
                      <p className="text-gray-700 font-semibold">- Jason Bennett</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold mb-2">&quot;Unbeatable value.&quot;</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">For the price, the reach and quality of service Raydeeo provides is unmatched. Highly recommended!</p>
                      <p className="text-gray-700 font-semibold">- Diaz Yang</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900 text-white">
              <div className="container mx-auto px-6 max-w-6xl text-center">
                <h2 className="font-serif text-4xl font-bold mb-6">Ready to Share Your Project with the World?</h2>
                <p className="text-xl mb-8">Experience the fastest and most affordable <b>premium</b> press release service with Raydeeo today.</p>
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold text-lg px-8 py-6" onClick={() => setCurrentView('register')}>
                  Get Started Now <ArrowRight className="ml-2" />
                </Button>
              </div>
            </section>
          </>
        );
    }
  };

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const termsAndConditions = (
    <>
      <h2>Terms and Conditions</h2>
      <p>Welcome to Raydeeo. These Terms and Conditions govern your use of our website and services.</p>
      <h3>1. Acceptance of Terms</h3>
      <p>By using Raydeeo, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not use our services.</p>
      <h3>2. Use of Service</h3>
      <p>You must be at least 18 years old to use Raydeeo. You are responsible for maintaining the confidentiality of your account and password.</p>
      <h3>3. Content</h3>
      <p>You retain all rights to the content you submit through Raydeeo. By submitting content, you grant Raydeeo a worldwide, non-exclusive license to use, reproduce, and distribute your content for the purpose of providing our services.</p>
      <h3>4. Limitation of Liability</h3>
      <p>Raydeeo and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages resulting from your use of the service.</p>
      <h3>5. Changes to Terms</h3>
      <p>We reserve the right to modify or replace these Terms at any time. It is your responsibility to check the Terms periodically for changes.</p>
      <h3>6. Contact Us</h3>
      <p>If you have any questions about these Terms, please contact us at hello@raydeeo.com.</p>
    </>
  );

  const privacyPolicy = (
    <>
      <h2>Privacy Policy</h2>
      <p>This Privacy Policy describes how Raydeeo collects, uses, and shares your personal information.</p>
      <h3>1. Information We Collect</h3>
      <p>We collect information you provide directly to us, including your name and email address when you register for an account or use our services.</p>
      <h3>2. Use of Information</h3>
      <p>We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to comply with legal obligations.</p>
      <h3>3. Sharing of Information</h3>
      <p>We share your press release content with third parties as necessary to provide our services. We do not sell your personal information to third parties.</p>
      <h3>4. Data Retention</h3>
      <p>We retain your personal information for as long as your account remains active or as needed to provide you services.</p>
      <h3>5. Your Rights</h3>
      <p>You have the right to access, correct, or delete your personal information. Please contact us at hello@raydeeo.com to exercise these rights.</p>
      <h3>6. Changes to This Policy</h3>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
      <h3>7. Contact Us</h3>
      <p>If you have any questions about this Privacy Policy, please contact us at hello@raydeeo.com.</p>
    </>
  );

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen">
    {renderAuthForm()}
    <footer className="py-8 bg-gray-100">
      <div className="container mx-auto px-6 max-w-6xl text-center text-gray-600">
        <p>&copy; 2024 Raydeeo. All rights reserved.</p>
        <div className="mt-4">
          <Button variant="link" onClick={() => setIsTermsModalOpen(true)}>Terms and Conditions</Button>
          <span className="mx-2">|</span>
          <Button variant="link" onClick={() => setIsPrivacyModalOpen(true)}>Privacy Policy</Button>
        </div>
      </div>
    </footer>
    <Modal
      isOpen={isTermsModalOpen}
      onClose={() => setIsTermsModalOpen(false)}
      title="Terms and Conditions"
      content={termsAndConditions}
    />
    <Modal
      isOpen={isPrivacyModalOpen}
      onClose={() => setIsPrivacyModalOpen(false)}
      title="Privacy Policy"
      content={privacyPolicy}
    />
    <style jsx global>{`
      @keyframes ticker {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
      .ticker-content {
        display: inline-block;
        white-space: nowrap;
        padding-right: 100%;
        animation: ticker 60s linear infinite;
      }
      .ticker-content span {
        display: inline-block;
      }
    `}</style>
  </div>
);
};

export default Landing;