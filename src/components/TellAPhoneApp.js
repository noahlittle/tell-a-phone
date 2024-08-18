"use client";
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AudioBroadcaster = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('https://api.raydeeo.com:3001', {
      withCredentials: true,
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socketRef.current.on('audio', (audioData) => {
      playAudio(audioData);
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

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
    }
  };

  const startBroadcasting = async () => {
    try {
      initAudio();
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);
      scriptProcessorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        socketRef.current.emit('audio', Array.from(inputData));
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
    setIsBroadcasting(false);
  };

  const playAudio = (audioData) => {
    if (!audioContextRef.current) {
      initAudio();
    }
    const buffer = audioContextRef.current.createBuffer(1, audioData.length, audioContextRef.current.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i];
    }
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const handleButtonClick = () => {
    if (isBroadcasting) {
      stopBroadcasting();
    } else {
      startBroadcasting();
    }
  };

  return (
    <div>
      <h1>Audio Broadcaster</h1>
      <button onClick={handleButtonClick}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
    </div>
  );
};

export default AudioBroadcaster;