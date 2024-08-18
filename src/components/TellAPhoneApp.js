"use client";
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AudioBroadcaster = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [message, setMessage] = useState('');
  const socketRef = useRef();
  const audioContextRef = useRef();
  const mediaStreamRef = useRef();

  useEffect(() => {
    socketRef.current = io('https://api.raydeeo.com');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setMessage('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setMessage('Disconnected from server');
    });

    socketRef.current.on('broadcastGranted', () => {
      setIsBroadcasting(true);
      setMessage('Broadcasting started');
      startBroadcasting();
    });

    socketRef.current.on('broadcastDenied', () => {
      setMessage('Someone else is currently broadcasting');
    });

    socketRef.current.on('broadcastEnded', () => {
      setIsBroadcasting(false);
      setMessage('Broadcast ended');
      stopBroadcasting();
    });

    socketRef.current.on('incomingAudio', (audioChunk) => {
      playAudio(audioChunk);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const startBroadcasting = async () => {
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        socketRef.current.emit('audioChunk', audioData);
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage('Error accessing microphone');
    }
  };

  const stopBroadcasting = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const playAudio = (audioChunk) => {
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioChunk.length, audioContext.sampleRate);
    buffer.getChannelData(0).set(audioChunk);
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  };

  const handleBroadcastClick = () => {
    socketRef.current.emit('requestBroadcast');
  };

  return (
    <div>
      <h1>Audio Broadcaster</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>{message}</p>
      <button onClick={handleBroadcastClick} disabled={isBroadcasting}>
        {isBroadcasting ? 'Broadcasting...' : 'Start Broadcasting'}
      </button>
    </div>
  );
};

export default AudioBroadcaster;