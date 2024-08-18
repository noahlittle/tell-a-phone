"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function TellAPhoneApp() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [currentBroadcaster, setCurrentBroadcaster] = useState(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [remainingTime, setRemainingTime] = useState(10);

  const websocket = useRef(null);
  const audioContext = useRef(null);
  const audioStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    websocket.current = new WebSocket('wss://api.raydeeo.com');

    websocket.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    websocket.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 5000);
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      switch (data.type) {
        case 'usernameSet':
          setUsername(data.username);
          break;
        case 'listenerCount':
          setListenerCount(data.count);
          break;
        case 'queueUpdate':
          setQueueCount(data.count);
          break;
        case 'newBroadcaster':
          setCurrentBroadcaster(data.username);
          setRemainingTime(10);
          if (data.username === username) {
            setIsBroadcasting(true);
            startBroadcasting();
          }
          break;
        case 'broadcastEnded':
          setCurrentBroadcaster(null);
          setIsBroadcasting(false);
          stopBroadcasting();
          break;
        case 'audio':
          playAudio(data.data);
          break;
        case 'voteReceived':
          setRemainingTime(prev => data.vote === 'up' ? prev + 1 : prev - 1);
          break;
      }
    };
  };

  const setUsernameHandler = () => {
    const generatedUsername = Math.random().toString(36).substr(2, 6);
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify({ type: 'setUsername', username: generatedUsername }));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  const joinQueue = () => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify({ type: 'joinQueue' }));
      setIsInQueue(true);
    } else {
      console.error('WebSocket is not connected');
    }
  };

  const vote = (voteType) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify({ type: 'vote', vote: voteType }));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasMicPermission(false);
    }
  };

  const startBroadcasting = async () => {
    if (!hasMicPermission) {
      await requestMicPermission();
    }
    
    if (hasMicPermission) {
      try {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            websocket.current.send(JSON.stringify({ type: 'audio', data: event.data }));
          }
        };
        
        mediaRecorderRef.current.start(100); // Send audio data every 100ms
        
        timerRef.current = setInterval(() => {
          setRemainingTime(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.error('Error starting broadcast:', error);
      }
    }
  };

  const stopBroadcasting = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const playAudio = async (audioData) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const arrayBuffer = await audioData.arrayBuffer();
    const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
    
    const source = audioContext.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.current.destination);
    source.start();
  };

  return (
    <div>
      <h1>TellAPhone</h1>
      <p>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {!username ? (
        <button onClick={setUsernameHandler}>Get Username</button>
      ) : (
        <div>
          <p>Your username: {username}</p>
          <p>Listeners: {listenerCount}</p>
          <p>Queue: {queueCount}</p>
          {currentBroadcaster && (
            <p>Current broadcaster: {currentBroadcaster} (Time remaining: {remainingTime}s)</p>
          )}
          {!hasMicPermission && (
            <button onClick={requestMicPermission}>Allow Microphone Access</button>
          )}
          {!isInQueue && !isBroadcasting && hasMicPermission && (
            <button onClick={joinQueue}>Join Queue</button>
          )}
          {currentBroadcaster && currentBroadcaster !== username && (
            <div>
              <button onClick={() => vote('up')}>Upvote (+1s)</button>
              <button onClick={() => vote('down')}>Downvote (-1s)</button>
            </div>
          )}
          {isBroadcasting && <p>You are currently broadcasting!</p>}
        </div>
      )}
    </div>
  );
}