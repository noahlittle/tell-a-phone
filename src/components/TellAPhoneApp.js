"use client";

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MicIcon, MicOffIcon, UserIcon, ListOrderedIcon, TimerIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

const AudioBroadcaster = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [queuePosition, setQueuePosition] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentBroadcaster, setCurrentBroadcaster] = useState(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const streamRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorRef = useRef(null);

  const BUFFER_SIZE = 4096;
  const SAMPLE_RATE = 48000;
  const BROADCAST_LIMIT = 10; // 10 seconds

  const connectToServer = () => {
    if (username.length !== 6) {
      alert('Username must be exactly 6 characters long.');
      return;
    }

    socketRef.current = io('https://api.raydeeo.com:3001', {
      withCredentials: true,
      transports: ['websocket'],
      auth: { username }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsBroadcasting(false);
      setQueuePosition(null);
      setQueueLength(0);
      setCurrentBroadcaster(null);
      setIsInQueue(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    socketRef.current.on('audio', (audioData) => {
      playAudio(audioData);
    });

    socketRef.current.on('userCount', (count) => {
      setOnlineUsers(count);
    });

    socketRef.current.on('queueUpdate', ({ queue, currentBroadcaster }) => {
      setQueueLength(queue.length);
      const userPosition = queue.indexOf(username);
      setQueuePosition(userPosition);
      setIsInQueue(userPosition !== -1);
      setCurrentBroadcaster(currentBroadcaster);
      setIsBroadcasting(currentBroadcaster === username);
    });

    socketRef.current.on('timeLeft', (time) => {
      setTimeLeft(time);
    });

    socketRef.current.on('isBroadcasting', (status) => {
      setIsBroadcasting(status);
      if (status) {
        startBroadcasting();
      } else {
        stopBroadcasting();
      }
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      analyserRef.current = audioContextRef.current.createAnalyser();
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
      gainNodeRef.current = audioContextRef.current.createGain();
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();

      // Set up compressor
      compressorRef.current.threshold.setValueAtTime(-24, audioContextRef.current.currentTime);
      compressorRef.current.knee.setValueAtTime(40, audioContextRef.current.currentTime);
      compressorRef.current.ratio.setValueAtTime(12, audioContextRef.current.currentTime);
      compressorRef.current.attack.setValueAtTime(0, audioContextRef.current.currentTime);
      compressorRef.current.release.setValueAtTime(0.25, audioContextRef.current.currentTime);

      // Set up gain
      gainNodeRef.current.gain.setValueAtTime(1.2, audioContextRef.current.currentTime);
    }
  };

  const startBroadcasting = async () => {
    try {
      initAudio();
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE,
          channelCount: 1
        } 
      });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Connect nodes: source -> gain -> compressor -> analyser -> scriptProcessor
      source.connect(gainNodeRef.current);
      gainNodeRef.current.connect(compressorRef.current);
      compressorRef.current.connect(analyserRef.current);
      analyserRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      scriptProcessorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        socketRef.current.emit('audio', Array.from(pcmData));
      };
    } catch (error) {
      console.error('Error starting broadcast:', error);
    }
  };

  const stopBroadcasting = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }
    if (compressorRef.current) {
      compressorRef.current.disconnect();
    }
  };

  const playAudio = (audioData) => {
    if (!audioContextRef.current) {
      initAudio();
    }
    const buffer = audioContextRef.current.createBuffer(1, audioData.length, SAMPLE_RATE);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < audioData.length; i++) {
      // Convert back from 16-bit PCM to float
      channelData[i] = audioData[i] / 0x7FFF;
    }
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const joinQueue = () => {
    socketRef.current.emit('joinQueue');
  };

  const leaveQueue = () => {
    socketRef.current.emit('leaveQueue');
  };

  const handleQueueButtonClick = () => {
    if (isInQueue) {
      leaveQueue();
    } else {
      joinQueue();
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Audio Broadcaster
          <Badge variant={isConnected ? "success" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {!isConnected ? (
            <>
              <Input
                type="text"
                placeholder="Enter 6-char username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={6}
              />
              <Button onClick={connectToServer} className="w-full">
                Connect
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleQueueButtonClick}
                variant={isInQueue ? "destructive" : "default"}
                className="w-full"
              >
                {isInQueue ? (
                  <>
                    <MicOffIcon className="mr-2 h-4 w-4" /> Leave Queue
                  </>
                ) : (
                  <>
                    <MicIcon className="mr-2 h-4 w-4" /> Join Queue
                  </>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>{onlineUsers} online</span>
              </div>
              <div className="flex items-center space-x-2">
                <ListOrderedIcon className="h-4 w-4" />
                <span>{queueLength} in queue</span>
              </div>
              {currentBroadcaster && (
                <Badge variant="secondary">
                  {currentBroadcaster === username ? "You are" : `${currentBroadcaster} is`} broadcasting
                </Badge>
              )}
              {isInQueue && queuePosition > 0 && (
                <Badge variant="secondary">
                  Queue Position: {queuePosition + 1}
                </Badge>
              )}
              {isBroadcasting && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center">
                    <TimerIcon className="h-4 w-4" />
                    <span>{timeLeft}s left</span>
                  </div>
                  <Progress value={(timeLeft / BROADCAST_LIMIT) * 100} />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioBroadcaster;