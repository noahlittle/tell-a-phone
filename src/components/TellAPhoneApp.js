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
  const gainNodeRef = useRef(null);
  const compressorRef = useRef(null);

  const BUFFER_SIZE = 4096; // Increased buffer size for better quality
  const SAMPLE_RATE = 48000; // Higher sample rate for better quality

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

  const handleButtonClick = () => {
    if (isBroadcasting) {
      stopBroadcasting();
    } else {
      startBroadcasting();
    }
  };

  return (
    <div>
      <h1>High-Quality Audio Broadcaster</h1>
      <button onClick={handleButtonClick}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
    </div>
  );
};

export default AudioBroadcaster;