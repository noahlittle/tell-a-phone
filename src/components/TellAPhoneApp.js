"use client";
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AudioBroadcaster = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioPlayerRef = useRef(null);

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

    socketRef.current.on('audio', (audioChunk) => {
      if (audioPlayerRef.current) {
        const blob = new Blob([audioChunk], { type: 'audio/webm; codecs=opus' });
        audioPlayerRef.current.src = URL.createObjectURL(blob);
        audioPlayerRef.current.play().catch(e => console.error('Audio playback error:', e));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startBroadcasting = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          socketRef.current.emit('audio', event.data);
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

  return (
    <div>
      <h1>Audio Broadcaster</h1>
      <button onClick={isBroadcasting ? stopBroadcasting : startBroadcasting}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
      <audio ref={audioPlayerRef} controls />
    </div>
  );
};

export default AudioBroadcaster;