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

  const websocket = useRef(null);
  const audioContext = useRef(null);
  const audioStreamRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (websocket.current) {
        websocket.current.close();
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
      // Attempt to reconnect after 5 seconds
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
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
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
        const audioSource = audioContext.current.createMediaStreamSource(audioStreamRef.current);
        const analyser = audioContext.current.createAnalyser();
        audioSource.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const sendAudioData = () => {
          analyser.getByteFrequencyData(dataArray);
          if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            websocket.current.send(JSON.stringify({ type: 'audio', data: Array.from(dataArray) }));
          }
          if (isBroadcasting) {
            requestAnimationFrame(sendAudioData);
          }
        };

        sendAudioData();
      } catch (error) {
        console.error('Error starting broadcast:', error);
      }
    }
  };

  const stopBroadcasting = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
  };

  const playAudio = (audioData) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const buffer = audioContext.current.createBuffer(1, audioData.length, audioContext.current.sampleRate);
    const channelData = buffer.getChannelData(0);
    audioData.forEach((sample, i) => {
      channelData[i] = sample / 255;
    });

    const source = audioContext.current.createBufferSource();
    source.buffer = buffer;
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
          {currentBroadcaster && <p>Current broadcaster: {currentBroadcaster}</p>}
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