"use client";

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, User } from 'lucide-react'

const socket = io('http://localhost:3001');

export default function WalkieTalkie() {
  const [username, setUsername] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    socket.on('speakerUpdate', (speaker) => setCurrentSpeaker(speaker));
    socket.on('userCount', (count) => setUserCount(count));

    return () => {
      socket.off('speakerUpdate');
      socket.off('userCount');
    };
  }, []);

  const handleStartSpeaking = () => {
    if (!currentSpeaker) {
      setIsSpeaking(true);
      socket.emit('startSpeaking', username);
    }
  };

  const handleStopSpeaking = () => {
    setIsSpeaking(false);
    socket.emit('stopSpeaking', username);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Walkie Talkie App</CardTitle>
          <CardDescription>Connect and talk with others!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User size={20} />
                <span>{userCount} connected</span>
              </div>
              {currentSpeaker && (
                <div className="text-sm font-medium">
                  {currentSpeaker === username ? 'You are speaking' : `${currentSpeaker} is speaking`}
                </div>
              )}
            </div>
            <Button
              className="w-full h-20 text-lg"
              onMouseDown={handleStartSpeaking}
              onMouseUp={handleStopSpeaking}
              onTouchStart={handleStartSpeaking}
              onTouchEnd={handleStopSpeaking}
              disabled={!username || (currentSpeaker && currentSpeaker !== username)}
            >
              {isSpeaking ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
              {isSpeaking ? 'Release to Stop' : 'Hold to Speak'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}