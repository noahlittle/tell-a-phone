"use client";
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AudioStreamer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [message, setMessage] = useState('');
  const socketRef = useRef();
  const audioContextRef = useRef();
  const streamSourceRef = useRef();
  const mediaStreamRef = useRef();
  const audioBufferRef = useRef(new Float32Array(4096));
  const audioBufferIndexRef = useRef(0);

  useEffect(() => {
    socketRef.current = io('https://api.raydeeo.com');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setMessage('Connected to server');
      initializeAudioContext();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      setMessage('Disconnected from server');
    });

    socketRef.current.on('newAudioChunk', (chunk) => {
      addAudioChunk(new Float32Array(chunk));
    });

    return () => {
      socketRef.current.disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeAudioContext = () => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    streamSourceRef.current = audioContextRef.current.createBufferSource();
    streamSourceRef.current.connect(audioContextRef.current.destination);
    streamSourceRef.current.start();

    const scriptNode = audioContextRef.current.createScriptProcessor(1024, 1, 1);
    scriptNode.onaudioprocess = processAudio;
    scriptNode.connect(audioContextRef.current.destination);
  };

  const processAudio = (audioProcessingEvent) => {
    const outputBuffer = audioProcessingEvent.outputBuffer;
    const channelData = outputBuffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
      if (audioBufferIndexRef.current < audioBufferRef.current.length) {
        channelData[i] = audioBufferRef.current[audioBufferIndexRef.current];
        audioBufferIndexRef.current++;
      } else {
        channelData[i] = 0;
      }
    }

    if (audioBufferIndexRef.current >= audioBufferRef.current.length) {
      audioBufferIndexRef.current = 0;
    }
  };

  const addAudioChunk = (chunk) => {
    for (let i = 0; i < chunk.length; i++) {
      audioBufferRef.current[audioBufferIndexRef.current] = chunk[i];
      audioBufferIndexRef.current = (audioBufferIndexRef.current + 1) % audioBufferRef.current.length;
    }
  };

  const startBroadcasting = async () => {
    try {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        socketRef.current.emit('audioChunk', Array.from(audioData));
      };

      setIsBroadcasting(true);
      setMessage('Broadcasting started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage('Error accessing microphone');
    }
  };

  const stopBroadcasting = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
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
      <h1>Live Audio Streamer</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>{message}</p>
      <button onClick={handleBroadcastToggle}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
    </div>
  );
};

export default AudioStreamer;