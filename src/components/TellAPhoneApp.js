"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, User } from 'lucide-react'

const socket = io('https://api.raydeeo.com:3001');

export default function WalkieTalkie() {
  const [username, setUsername] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const audioContext = useRef(null);
  const audioStreamRef = useRef(null);
  const audioSourceRef = useRef(null);
  const processorRef = useRef(null);

  useEffect(() => {
    socket.on('speakerUpdate', (speaker) => setCurrentSpeaker(speaker));
    socket.on('userCount', (count) => setUserCount(count));
    
    socket.on('audioChunk', (audioChunk) => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const arrayBuffer = new ArrayBuffer(audioChunk.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioChunk.length; i++) {
        view[i] = audioChunk[i];
      }
      audioContext.current.decodeAudioData(arrayBuffer, (buffer) => {
        const source = audioContext.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.current.destination);
        source.start();
      });
    });

    return () => {
      socket.off('speakerUpdate');
      socket.off('userCount');
      socket.off('audioChunk');
    };
  }, []);

  const handleStartSpeaking = async () => {
    if (!currentSpeaker && username) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        audioSourceRef.current = audioContext.current.createMediaStreamSource(stream);
        processorRef.current = audioContext.current.createScriptProcessor(1024, 1, 1);

        audioSourceRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContext.current.destination);

        processorRef.current.onaudioprocess = (e) => {
          const left = e.inputBuffer.getChannelData(0);
          const uint8Array = new Uint8Array(left.buffer);
          socket.emit('audioChunk', uint8Array);
        };

        setIsSpeaking(true);
        socket.emit('startSpeaking', username);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const handleStopSpeaking = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
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