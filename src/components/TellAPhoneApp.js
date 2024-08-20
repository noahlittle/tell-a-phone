"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, User, Volume2, ThumbsUp, ThumbsDown } from 'lucide-react'

const socket = io('https://api.raydeeo.com:3001');

// Audio settings
const SAMPLE_RATE = 48000;
const BUFFER_SIZE = 2048;
const INITIAL_BROADCAST_TIME = 10; // Initial broadcast time in seconds

export default function WalkieTalkie() {
  const [username, setUsername] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(INITIAL_BROADCAST_TIME);
  const [userCount, setUserCount] = useState(0);
  const [volume, setVolume] = useState(1);
  const [queueLength, setQueueLength] = useState(0);
  const [inQueue, setInQueue] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorRef = useRef(null);

  useEffect(() => {
    socket.on('speakerUpdate', ({ speaker, timeLeft, totalTime, upvotes, downvotes }) => {
      setCurrentSpeaker(speaker);
      setTimeLeft(timeLeft);
      setTotalTime(totalTime);
      setUpvotes(upvotes);
      setDownvotes(downvotes);
      setHasVoted(false);
      if (speaker === username) {
        setIsSpeaking(true);
        initAudio();
      } else if (isSpeaking) {
        stopSpeaking();
      }
    });
    socket.on('timeUpdate', ({ timeLeft, upvotes, downvotes }) => {
      setTimeLeft(timeLeft);
      setUpvotes(upvotes);
      setDownvotes(downvotes);
    });
    socket.on('userCount', (count) => setUserCount(count));
    socket.on('queueUpdate', (newQueue) => {
      setQueueLength(newQueue.length);
      setInQueue(newQueue.includes(username));
    });
    
    socket.on('audioChunk', (audioChunk) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      }
      
      const floatArray = new Float32Array(audioChunk);
      const buffer = audioContextRef.current.createBuffer(1, floatArray.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(floatArray);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      source.start();
    });

    return () => {
      socket.off('speakerUpdate');
      socket.off('timeUpdate');
      socket.off('userCount');
      socket.off('queueUpdate');
      socket.off('audioChunk');
    };
  }, [username, volume, isSpeaking]);

  const initAudio = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
      gainNodeRef.current = audioContextRef.current.createGain();
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();

      compressorRef.current.threshold.setValueAtTime(-24, audioContextRef.current.currentTime);
      compressorRef.current.knee.setValueAtTime(30, audioContextRef.current.currentTime);
      compressorRef.current.ratio.setValueAtTime(12, audioContextRef.current.currentTime);
      compressorRef.current.attack.setValueAtTime(0.003, audioContextRef.current.currentTime);
      compressorRef.current.release.setValueAtTime(0.25, audioContextRef.current.currentTime);

      sourceRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(compressorRef.current);
      compressorRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const outputData = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = Math.max(-1, Math.min(1, inputData[i])); // Clipping
        }
        socket.emit('audioChunk', outputData);
      };
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };

  const stopSpeaking = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
    if (compressorRef.current) {
      compressorRef.current.disconnect();
    }
    setIsSpeaking(false);
  };

  const handleJoinQueue = () => {
    if (username && !inQueue) {
      socket.emit('joinQueue', username);
    }
  };

  const handleLeaveQueue = () => {
    if (username && inQueue) {
      socket.emit('leaveQueue', username);
    }
  };

  const handleVote = (voteType) => {
    if (!hasVoted && currentSpeaker && currentSpeaker !== username) {
      socket.emit('vote', { voteType });
      setHasVoted(true);
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
            {currentSpeaker && (
              <div className="space-y-2">
                <Progress value={((totalTime - timeLeft) / totalTime) * 100} className="w-full" />
                <div className="flex justify-between text-sm">
                  <span>{timeLeft}s left</span>
                  <span>👍 {upvotes} | 👎 {downvotes}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                className="flex-grow"
                onClick={inQueue ? handleLeaveQueue : handleJoinQueue}
                disabled={!username}
              >
                {inQueue ? 'Leave Queue' : 'Join Queue'}
              </Button>
              <Badge variant="secondary" className="ml-2">
                {queueLength} in queue
              </Badge>
            </div>
            {currentSpeaker && currentSpeaker !== username && (
              <div className="flex justify-center space-x-4">
                <Button onClick={() => handleVote('upvote')} disabled={hasVoted}>
                  <ThumbsUp className="mr-2" />
                  +1s
                </Button>
                <Button onClick={() => handleVote('downvote')} disabled={hasVoted}>
                  <ThumbsDown className="mr-2" />
                  -1s
                </Button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Volume2 size={20} />
              <Slider
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={1}
                step={0.01}
                className="flex-grow"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}