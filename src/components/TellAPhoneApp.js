"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, User } from 'lucide-react'

const socket = io('https://api.raydeeo.com');

export default function WalkieTalkie() {
  const [username, setUsername] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const peerConnections = useRef({});

  useEffect(() => {
    socket.on('speakerUpdate', (speaker) => setCurrentSpeaker(speaker));
    socket.on('userCount', (count) => setUserCount(count));

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleNewICECandidate);

    return () => {
      socket.off('speakerUpdate');
      socket.off('userCount');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, []);

  const handleStartSpeaking = async () => {
    if (!currentSpeaker) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        setIsSpeaking(true);
        socket.emit('startSpeaking', username);

        // Create and send offers to all connected peers
        Object.values(peerConnections.current).forEach(pc => {
          createAndSendOffer(pc);
        });
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const handleStopSpeaking = () => {
    setIsSpeaking(false);
    socket.emit('stopSpeaking', username);
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  };

  const createPeerConnection = (recipientId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, recipientId);
      }
    };

    pc.ontrack = (event) => {
      // Handle incoming audio track
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    if (audioStream) {
      audioStream.getTracks().forEach(track => pc.addTrack(track, audioStream));
    }

    peerConnections.current[recipientId] = pc;
    return pc;
  };

  const createAndSendOffer = async (pc) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', offer, pc.id);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer, senderId) => {
    const pc = createPeerConnection(senderId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', answer, senderId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer, senderId) => {
    const pc = peerConnections.current[senderId];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleNewICECandidate = async (candidate, senderId) => {
    const pc = peerConnections.current[senderId];
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
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