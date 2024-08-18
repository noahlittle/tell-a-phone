"use client";
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AudioStreamer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [message, setMessage] = useState('');
  const socketRef = useRef();
  const audioContextRef = useRef();
  const mediaStreamRef = useRef();
  const audioBufferSourceRef = useRef();
  const audioWorkletNodeRef = useRef();

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

    socketRef.current.on('currentStream', (stream) => {
      playAudioStream(stream);
    });

    socketRef.current.on('newAudioChunk', (chunk) => {
      addAudioChunk(chunk);
    });

    return () => {
      socketRef.current.disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeAudioContext = async () => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    await audioContextRef.current.audioWorklet.addModule('/audio-worklet.js');
    audioWorkletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
    audioWorkletNodeRef.current.connect(audioContextRef.current.destination);
  };

  const playAudioStream = (stream) => {
    const arrayBuffer = new ArrayBuffer(stream.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < stream.length; i++) {
      view[i] = stream[i];
    }
    audioContextRef.current.decodeAudioData(arrayBuffer, (buffer) => {
      if (audioBufferSourceRef.current) {
        audioBufferSourceRef.current.stop();
      }
      audioBufferSourceRef.current = audioContextRef.current.createBufferSource();
      audioBufferSourceRef.current.buffer = buffer;
      audioBufferSourceRef.current.connect(audioWorkletNodeRef.current);
      audioBufferSourceRef.current.start();
    });
  };

  const addAudioChunk = (chunk) => {
    const floatArray = new Float32Array(chunk.length / 4);
    for (let i = 0; i < floatArray.length; i++) {
      floatArray[i] = chunk.readFloatLE(i * 4);
    }
    audioWorkletNodeRef.current.port.postMessage(floatArray);
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
        socketRef.current.emit('audioChunk', new Float32Array(audioData));
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