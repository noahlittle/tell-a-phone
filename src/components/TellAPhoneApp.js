"use client";
import React, { useState, useEffect, useRef } from 'react';

const AudioStreamer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [message, setMessage] = useState('');
  const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const scheduledAudioRef = useRef([]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    wsRef.current = new WebSocket('wss://api.raydeeo.com:3001');

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setMessage('Connected to server');
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      setMessage('Disconnected from server');
      // Attempt to reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessage('Error connecting to server');
    };

    wsRef.current.onmessage = handleAudioMessage;
  };

  const initAudioContext = () => {
    if (!isAudioContextInitialized) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceNodeRef.current = audioContextRef.current.createBufferSource();
        sourceNodeRef.current.connect(audioContextRef.current.destination);
        sourceNodeRef.current.start();
        setIsAudioContextInitialized(true);
      } catch (error) {
        console.error('Error initializing AudioContext:', error);
        setMessage('Error initializing audio playback');
      }
    }
  };

  const handleAudioMessage = async (event) => {
    if (!isAudioContextInitialized) return;

    const data = JSON.parse(event.data);
    if (data.type === 'audio') {
      const audioBuffer = await decodeAudioData(data.audio);
      scheduleAudioPlayback(audioBuffer);
    }
  };

  const decodeAudioData = (audioData) => {
    const arrayBuffer = new Uint8Array(audioData).buffer;
    return new Promise((resolve, reject) => {
      audioContextRef.current.decodeAudioData(arrayBuffer, resolve, reject);
    });
  };

  const scheduleAudioPlayback = (audioBuffer) => {
    const playbackTime = audioContextRef.current.currentTime + 0.1; // Schedule 100ms ahead
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(playbackTime);

    scheduledAudioRef.current.push({ source, endTime: playbackTime + audioBuffer.duration });
    cleanupScheduledAudio();
  };

  const cleanupScheduledAudio = () => {
    const currentTime = audioContextRef.current.currentTime;
    scheduledAudioRef.current = scheduledAudioRef.current.filter(({ source, endTime }) => {
      if (endTime < currentTime) {
        source.stop();
        source.disconnect();
        return false;
      }
      return true;
    });
  };

  const startBroadcasting = async () => {
    try {
      initAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            audio: Array.from(new Uint8Array(event.data))
          }));
        }
      };

      mediaRecorderRef.current.start(100); // Capture in 100ms chunks
      setIsBroadcasting(true);
      setMessage('Broadcasting started');
    } catch (error) {
      console.error('Error starting broadcast:', error);
      setMessage('Error starting broadcast: ' + error.message);
    }
  };

  const stopBroadcasting = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsBroadcasting(false);
    setMessage('Broadcasting stopped');
  };

  const handleBroadcastToggle = () => {
    if (isBroadcasting) {
      stopBroadcasting();
    } else {
      startBroadcasting();
    }
  };

  return (
    <div>
      <h1>Audio Streamer</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>{message}</p>
      <button onClick={handleBroadcastToggle}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
    </div>
  );
};

export default AudioStreamer;