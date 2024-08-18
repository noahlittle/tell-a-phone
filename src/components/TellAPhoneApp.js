"use client";
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AudioBroadcaster = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

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
      if (isAudioContextInitialized) {
        playAudio(audioData);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAudioContextInitialized]);

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      setIsAudioContextInitialized(true);
    }
  };

  const startBroadcasting = async () => {
    try {
      initializeAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            socketRef.current.emit('audio', base64data);
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsBroadcasting(true);
    } catch (error) {
      console.error('Error starting broadcast:', error);
    }
  };

  const stopBroadcasting = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsBroadcasting(false);
  };

  const playAudio = async (audioData) => {
    const audioContext = audioContextRef.current;

    try {
      // Remove the data URL prefix to get the raw base64 data
      const base64Data = audioData.split(',')[1];
      const audioBuffer = await decodeAudioData(audioContext, base64Data);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const decodeAudioData = (audioContext, base64Data) => {
    return new Promise((resolve, reject) => {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioContext.decodeAudioData(bytes.buffer, resolve, reject);
    });
  };

  const handleButtonClick = () => {
    initializeAudioContext();
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