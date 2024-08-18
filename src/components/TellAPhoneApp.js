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

  const websocket = useRef(null);
  const audioContext = useRef(null);
  const audioStreamRef = useRef(null);

  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    websocket.current = new WebSocket('wss://api.raydeeo.com');

    websocket.current.onopen = () => setIsConnected(true);
    websocket.current.onclose = () => setIsConnected(false);

    websocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
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

    return () => {
      websocket.current.close();
    };
  }, []);

  const setUsernameHandler = () => {
    const generatedUsername = Math.random().toString(36).substr(2, 6);
    websocket.current.send(JSON.stringify({ type: 'setUsername', username: generatedUsername }));
  };

  const joinQueue = () => {
    websocket.current.send(JSON.stringify({ type: 'joinQueue' }));
    setIsInQueue(true);
  };

  const vote = (voteType) => {
    websocket.current.send(JSON.stringify({ type: 'vote', vote: voteType }));
  };

  const startBroadcasting = async () => {
    try {
      audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioSource = audioContext.current.createMediaStreamSource(audioStreamRef.current);
      const analyser = audioContext.current.createAnalyser();
      audioSource.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const sendAudioData = () => {
        analyser.getByteFrequencyData(dataArray);
        websocket.current.send(JSON.stringify({ type: 'audio', data: Array.from(dataArray) }));
        if (isBroadcasting) {
          requestAnimationFrame(sendAudioData);
        }
      };

      sendAudioData();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopBroadcasting = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const playAudio = (audioData) => {
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
      {!username ? (
        <button onClick={setUsernameHandler}>Get Username</button>
      ) : (
        <div>
          <p>Your username: {username}</p>
          <p>Connection status: {isConnected ? 'Connected' : 'Disconnected'}</p>
          <p>Listeners: {listenerCount}</p>
          <p>Queue: {queueCount}</p>
          {currentBroadcaster && <p>Current broadcaster: {currentBroadcaster}</p>}
          {!isInQueue && !isBroadcasting && <button onClick={joinQueue}>Join Queue</button>}
          {currentBroadcaster && currentBroadcaster !== username && (
            <div>
              <button onClick={() => vote('up')}>Upvote (+1s)</button>
              <button onClick={() => vote('down')}>Downvote (-1s)</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}