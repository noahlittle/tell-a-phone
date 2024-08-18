"use client";

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MicIcon, MicOffIcon, UserIcon, ClockIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const AudioBroadcaster = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [queuePosition, setQueuePosition] = useState(null);
  const [broadcastTimeLeft, setBroadcastTimeLeft] = useState(10);
  const [currentBroadcaster, setCurrentBroadcaster] = useState(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const streamRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorRef = useRef(null);
  const broadcastTimerRef = useRef(null);

  const BUFFER_SIZE = 4096;
  const SAMPLE_RATE = 48000;
  const BROADCAST_DURATION = 10; // 10 seconds

  useEffect(() => {
    socketRef.current = io('https://api.raydeeo.com:3001', {
      withCredentials: true,
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setQueuePosition(null);
      setCurrentBroadcaster(null);
      stopBroadcasting();
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

    socketRef.current.on('queuePosition', (position) => {
      setQueuePosition(position);
    });

    socketRef.current.on('startBroadcasting', () => {
      startBroadcasting();
    });

    socketRef.current.on('stopBroadcasting', () => {
      stopBroadcasting();
    });

    socketRef.current.on('broadcastStatus', ({ broadcaster, timeLeft }) => {
      setCurrentBroadcaster(broadcaster);
      setBroadcastTimeLeft(timeLeft);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (currentBroadcaster) {
      const timer = setInterval(() => {
        setBroadcastTimeLeft((prevTime) => Math.max(0, prevTime - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentBroadcaster]);

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
      
      source.connect(gainNodeRef.current);
      gainNodeRef.current.connect(compressorRef.current);
      compressorRef.current.connect(analyserRef.current);
      analyserRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      scriptProcessorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        socketRef.current.emit('audio', Array.from(pcmData));
      };
      setIsBroadcasting(true);
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
    setIsBroadcasting(false);
    socketRef.current.emit('stopBroadcasting');
  };

  const handleButtonClick = () => {
    if (isBroadcasting) {
      stopBroadcasting();
    } else {
      socketRef.current.emit('requestBroadcast');
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
          <Button
            onClick={handleButtonClick}
            variant={isBroadcasting ? "destructive" : "default"}
            className="w-full"
            disabled={queuePosition !== null && queuePosition !== 0}
          >
            {isBroadcasting ? (
              <>
                <MicOffIcon className="mr-2 h-4 w-4" /> Stop Broadcasting
              </>
            ) : (
              <>
                <MicIcon className="mr-2 h-4 w-4" /> 
                {queuePosition === null ? "Request to Broadcast" : 
                 queuePosition === 0 ? "Start Broadcasting" : 
                 `Queued (Position: ${queuePosition + 1})`}
              </>
            )}
          </Button>
          {currentBroadcaster && (
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center">
                <ClockIcon className="h-4 w-4" />
                <span>{broadcastTimeLeft}s left</span>
              </div>
              <Progress value={(broadcastTimeLeft / BROADCAST_DURATION) * 100} />
              <div className="text-center text-sm">
                {currentBroadcaster === socketRef.current.id ? "You are broadcasting" : "Listening"}
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4" />
            <span>{onlineUsers} online</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioBroadcaster;