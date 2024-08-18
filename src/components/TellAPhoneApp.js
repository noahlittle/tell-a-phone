"use client";
import React, { useState, useEffect, useRef } from 'react';

const WebRTCAudioStreamer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [message, setMessage] = useState('');

  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  useEffect(() => {
    wsRef.current = new WebSocket('wss://api.raydeeo.com');

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setMessage('Connected to server');
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      setMessage('Disconnected from server');
    };

    wsRef.current.onmessage = handleSignalingMessage;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleSignalingMessage = async (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'offer':
        await handleOffer(message);
        break;
      case 'answer':
        await handleAnswer(message);
        break;
      case 'ice-candidate':
        await handleIceCandidate(message);
        break;
      default:
        console.warn(`Unhandled message type: ${message.type}`);
    }
  };

  const handleOffer = async (message) => {
    const peerConnection = createPeerConnection(message.senderId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    wsRef.current.send(JSON.stringify({
      type: 'answer',
      answer: answer,
      recipientId: message.senderId
    }));
  };

  const handleAnswer = async (message) => {
    const peerConnection = peerConnectionsRef.current[message.senderId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  };

  const handleIceCandidate = async (message) => {
    const peerConnection = peerConnectionsRef.current[message.senderId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  const createPeerConnection = (peerId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          recipientId: peerId
        }));
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };

    peerConnectionsRef.current[peerId] = peerConnection;
    return peerConnection;
  };

  const startBroadcasting = async () => {
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      for (const peerId in peerConnectionsRef.current) {
        const peerConnection = peerConnectionsRef.current[peerId];
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      const offer = await peerConnectionsRef.current[Object.keys(peerConnectionsRef.current)[0]].createOffer();
      await peerConnectionsRef.current[Object.keys(peerConnectionsRef.current)[0]].setLocalDescription(offer);

      wsRef.current.send(JSON.stringify({
        type: 'offer',
        offer: offer
      }));

      setIsBroadcasting(true);
      setMessage('Broadcasting started');
    } catch (error) {
      console.error('Error starting broadcast:', error);
      setMessage('Error starting broadcast');
    }
  };

  const stopBroadcasting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    for (const peerId in peerConnectionsRef.current) {
      peerConnectionsRef.current[peerId].close();
    }
    peerConnectionsRef.current = {};

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
      <h1>WebRTC Audio Streamer</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>{message}</p>
      <button onClick={handleBroadcastToggle}>
        {isBroadcasting ? 'Stop Broadcasting' : 'Start Broadcasting'}
      </button>
    </div>
  );
};

export default WebRTCAudioStreamer;