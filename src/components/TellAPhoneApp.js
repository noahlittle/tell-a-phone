"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { Mic, MicOff, Users, Radio, InfoIcon, Clock, Volume2, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const VoteButton = ({ type, onClick, disabled, voted }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(() => {
    if (!disabled) {
      setIsAnimating(true);
      onClick();
      setTimeout(() => setIsAnimating(false), 300); // Animation duration
    }
  }, [disabled, onClick]);

  const Icon = type === 'upvote' ? ThumbsUp : ThumbsDown;
  const baseColor = type === 'upvote' ? 'green' : 'red';

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden
        ${disabled ? 'opacity-50 bg-gray-500 cursor-not-allowed' : `bg-${baseColor}-500 hover:bg-${baseColor}-600`}
        text-white transition-all duration-300 ease-in-out
      `}
    >
      <Icon className={`w-4 h-4 ${isAnimating ? 'animate-ping' : ''}`} />
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-full h-full bg-${baseColor}-400 opacity-30 animate-ping rounded-full`}></div>
        </div>
      )}
      {voted && (
        <div className={`absolute inset-0 bg-${baseColor}-300 opacity-30`}></div>
      )}
    </Button>
  );
};

const TellAPhoneApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [currentBroadcaster, setCurrentBroadcaster] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10000);
  const [totalTime, setTotalTime] = useState(10000);
  const [hasVoted, setHasVoted] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [showUsernameDialog, setShowUsernameDialog] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [voteStatus, setVoteStatus] = useState(null);
  const [votedType, setVotedType] = useState(null);
  const [currentBroadcastVotes, setCurrentBroadcastVotes] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

// Add this function to handle audio format support
const getSupportedMimeType = useCallback(() => {
  const possibleTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4;codecs=opus'
  ];
  return possibleTypes.find(mimeType => MediaRecorder.isTypeSupported(mimeType)) || '';
}, []);

const setupAudioContext = useCallback(() => {
  if (!audioContext) {
    const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(newAudioContext);
    
    // Resume the AudioContext after user interaction
    const resumeAudioContext = () => {
      if (newAudioContext.state === 'suspended') {
        newAudioContext.resume();
      }
      document.removeEventListener('click', resumeAudioContext);
    };
    document.addEventListener('click', resumeAudioContext);
  }
}, [audioContext]);

// Modified appendAudioChunk function
const appendAudioChunk = useCallback(async (audioChunk) => {
  if (!audioContext || !isAudioEnabled) {
    console.log('AudioContext not initialized or audio disabled');
    return;
  }

  try {
    const arrayBuffer = await audioChunk.arrayBuffer();
    audioContext.decodeAudioData(arrayBuffer, 
      (audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        setAudioSource(source);
      },
      (error) => {
        console.error('Error decoding audio data:', error);
      }
    );
  } catch (error) {
    console.error('Error processing audio chunk:', error);
  }
}, [audioContext, isAudioEnabled]);

// Modify the startBroadcasting function
const startBroadcasting = useCallback(() => {
  if (streamRef.current) {
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      console.error('No supported mime type found for this browser');
      return;
    }

    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: mimeType,
      bitsPerSecond: 128000 // Adjust this value as needed
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0 && socketRef.current) {
        socketRef.current.emit('audioStream', event.data);
      }
    };

    mediaRecorderRef.current.start(100); // Reduce chunk size for more frequent updates
    console.log('Broadcasting started with mime type:', mimeType);
  }
}, [getSupportedMimeType]);

  const stopBroadcasting = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    console.log('Broadcasting stopped');
  }, []);

  useEffect(() => {
    socketRef.current = io('https://api.raydeeo.com');

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    socketRef.current.on('queueUpdate', ({ queue }) => setQueueLength(queue));
    socketRef.current.on('queuePositionUpdate', ({ position }) => setQueuePosition(position));
    socketRef.current.on('leftQueue', () => {
      setIsInQueue(false);
      setQueuePosition(0);
    });
    socketRef.current.on('newBroadcaster', ({ id, username }) => {
      setCurrentBroadcaster({ id, username });
      setHasVoted(false);
    });

    socketRef.current.on('noBroadcaster', () => {
      setCurrentBroadcaster(null);
      setTimeLeft(10000);
      setTotalTime(10000);
      setUpvotes(0);
      setDownvotes(0);
      setTotalDuration(0);
    });

    socketRef.current.on('startBroadcasting', () => {
      setIsBroadcasting(true);
      setIsAudioEnabled(false);
      startBroadcasting();
    });

    socketRef.current.on('stopBroadcasting', () => {
      setIsBroadcasting(false);
      setIsAudioEnabled(true);
      stopBroadcasting();
    });

    socketRef.current.on('broadcastAudio', (audioChunk) => {
      if (!isBroadcasting) {
        appendAudioChunk(audioChunk);
      }
    });

    socketRef.current.on('timeUpdate', ({ timeLeft, totalTime }) => {
      setTimeLeft(timeLeft);
      setTotalTime(totalTime);
    });

    socketRef.current.on('listenerCountUpdate', ({ count }) => {
      setListenerCount(count);
    });

    socketRef.current.on('broadcastStats', ({ upvotes, downvotes, totalDuration }) => {
      setUpvotes(upvotes);
      setDownvotes(downvotes);
      setTotalDuration(totalDuration);
    });

    socketRef.current.on('voteUpdate', ({ username, voteType }) => {
      setCurrentBroadcastVotes(prevVotes => [...prevVotes, { username, voteType }]);
    });
  
    socketRef.current.on('newBroadcaster', () => {
      setCurrentBroadcastVotes([]);
    });

    setupAudioContext();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
      if (audioSource) {
        audioSource.stop();
      }
    };
  }, [appendAudioChunk, startBroadcasting, stopBroadcasting, isBroadcasting, audioContext, audioSource, setupAudioContext]);

  const toggleQueue = useCallback(async () => {
    if (socketRef.current) {
      if (isInQueue) {
        socketRef.current.emit('leaveQueue');
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      } else {
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          socketRef.current.emit('joinQueue');
          setIsInQueue(true);
        } catch (error) {
          console.error('Error accessing microphone:', error);
          alert('Unable to access microphone. Please ensure you have granted the necessary permissions.');
        }
      }
    }
  }, [isInQueue]);

  const handleVote = useCallback((voteType) => {
    if (!hasVoted && currentBroadcaster && currentBroadcaster.id !== socketRef.current.id) {
      socketRef.current.emit('vote', voteType);
      setHasVoted(true);
      setVotedType(voteType);
    }
  }, [hasVoted, currentBroadcaster]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const checkUsername = useCallback((username) => {
    return new Promise((resolve) => {
      socketRef.current.emit('checkUsername', username, (response) => {
        resolve(response.available);
      });
    });
  }, []);

  const handleUsernameChange = useCallback(async (e) => {
    const newUsername = e.target.value.slice(0, 6);
    setUsername(newUsername);
    setUsernameError('');

    if (newUsername.length === 6) {
      setIsCheckingUsername(true);
      const isAvailable = await checkUsername(newUsername);
      setIsCheckingUsername(false);
      if (!isAvailable) {
        setUsernameError('Username is already taken');
      }
    }
  }, [checkUsername]);

  const handleUsernameSubmit = useCallback(() => {
    if (username.length === 6 && !usernameError) {
      socketRef.current.emit('setUsername', username, (response) => {
        if (response.success) {
          setShowUsernameDialog(false);
          setUsernameError('');
        } else {
          setUsernameError(response.message);
        }
      });
    } else if (username.length !== 6) {
      setUsernameError('Username must be exactly 6 characters');
    }
  }, [username, usernameError]);

  const SoundWaveAnimation = () => (
    <div className="ml-2 flex space-x-1">
      <div className="w-1 h-4 bg-blue-400 rounded-full animate-soundwave"></div>
      <div className="w-1 h-4 bg-blue-400 rounded-full animate-soundwave animation-delay-200"></div>
      <div className="w-1 h-4 bg-blue-400 rounded-full animate-soundwave animation-delay-400"></div>
    </div>
  );

  const BroadcasterVoteDisplay = () => (
    <div className="fixed right-4 bottom-1 transform -translate-y-1/2 w-48 bg-gray-800 p-4 rounded-md shadow-lg">
      <Badge className='mb-2'>Votes</Badge>
      <div className="max-h-64 overflow-y-auto mt-2">
        {currentBroadcastVotes.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-white">No votes yet</div>
        ) : (
          currentBroadcastVotes.map((vote, index) => (
            <Badge key={index} className="flex items-center justify-between text-sm mb-1 text-white">
              <span>{vote.username}</span>
              {vote.voteType === 'upvote' ? (
                <ThumbsUp className="w-4 h-4 text-green-400" />
              ) : (
                <ThumbsDown className="w-4 h-4 text-red-400" />
              )}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
  if (showUsernameDialog) {
    return (
      <Dialog open={showUsernameDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-blue-400 mr-2" />
              Raydeeo
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username">Choose Your Username</Label>
              <Input
                id="username"
                value={username}
                onChange={handleUsernameChange}
                placeholder="6 characters"
                maxLength={6}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {isCheckingUsername && <p className="text-yellow-500 text-xs">Checking availability...</p>}
              {usernameError && <p className="text-red-500 text-xs">{usernameError}</p>}
            </div>
            <Button 
              onClick={handleUsernameSubmit} 
              disabled={username.length !== 6 || !!usernameError || isCheckingUsername}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Start Listening!
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">How It Works</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-sm">Join the queue</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-white0" />
                <span className="text-sm">Broadcast for 10s</span>
              </div>
              <div className="flex items-center space-x-2">
                <ThumbsUp className="w-5 h-5 text-green-400" />
                <span className="text-sm">Upvotes add time</span>
              </div>
              <div className="flex items-center space-x-2">
                <ThumbsDown className="w-5 h-5 text-red-400" />
                <span className="text-sm">Downvotes reduce time</span>
              </div>
            </div>
            <div className="border-t border-gray-600 my-4"></div>
            <div className="flex items-start space-x-2 text-yellow-500 text-sm mt-4">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Content is not reviewed. Use at your own risk and be responsible for what you share.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <div className="w-full bg-blue-600 text-white p-2 text-center text-sm">
        Want to start journaling consistently? Try Reverie, a journal that calls you every day. 
        <a href="https://callreverie.com" target="_blank" rel="noopener noreferrer" className="underline ml-1">Learn More</a>
      </div>
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <Card className="w-full max-w-md bg-gray-800 text-gray-100 shadow-lg">
          <CardHeader className="space-y-1 border-b border-gray-700 pb-4">
            <div className='flex items-center'>
              {isConnected ? (
                <Badge variant="secondary" className="mr-2 bg-green-500 text-white w-min mb-2 flex items-center">
                  Connected
                  <div className="w-2 h-2 bg-green-300 rounded-full ml-2 animate-pulse"></div>
                </Badge>
              ) : (
                <Badge variant="destructive" className="mr-2 bg-red-500 text-white w-min mb-2 flex items-center">
                  Disconnected
                  <div className="w-2 h-2 bg-red-300 rounded-full ml-2 animate-pulse"></div>
                </Badge>
              )}
              <Badge variant="secondary" className="ml-auto bg-gray-900 text-white mb-2">
                <Users className="w-5 h-5 mr-2 text-white" />{listenerCount} Listeners
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-white">Raydeeo</CardTitle>
              <Radio className="w-6 h-6 text-blue-400" />
            </div>
            <CardDescription className="text-gray-400">The crowdsourced radio station</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-300">Current Broadcaster:</span>
                {currentBroadcaster ? (
                  <Badge variant="secondary" className="bg-blue-500 text-white">{currentBroadcaster.username}</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400 border-gray-600">None</Badge>
                )}
              </div>
              {currentBroadcaster && (
                <div className='flex w-full'>
                  <div className={`space-y-1 p-2  w-full rounded-md ${isBroadcasting ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`font-bold ${isBroadcasting ? 'text-white' : 'text-gray-300'}`}>
                          {isBroadcasting ? 'LIVE' : 'Listening...'}
                        </span>
                        {!isBroadcasting && <SoundWaveAnimation />}
                      </div>
                      <div className="flex items-center">
                        <Clock className={`w-4 h-4 mr-2 ${isBroadcasting ? 'text-white' : 'text-gray-300'}`} />
                        <span className={isBroadcasting ? 'text-white' : 'text-gray-300'}>
                          {(timeLeft / 1000).toFixed(1)}s
                        </span>
                      </div>
                    </div>
                    <Progress value={(1 - timeLeft / totalTime) * 100} className="w-full" />
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span>{upvotes}</span>
                        <ThumbsDown className="w-4 h-4 text-red-400" />
                        <span>{downvotes}</span>
                      </div>
                      <span>Total: {(totalDuration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                  <div className='mt-1'>
                    {!isBroadcasting && currentBroadcaster && (
                      <div className="flex flex-col items-end space-y-1 ml-2">
                        <VoteButton
                          type="upvote"
                          onClick={() => handleVote('upvote')}
                          disabled={hasVoted || isBroadcasting}
                          voted={votedType === 'upvote'}
                        />
                        <VoteButton
                          type="downvote"
                          onClick={() => handleVote('downvote')}
                          disabled={hasVoted || isBroadcasting}
                          voted={votedType === 'downvote'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                <span>Queue: {queueLength}</span>
              </div>
              {isInQueue ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleQueue}
                        className="bg-yellow-500 text-gray-900 hover:bg-yellow-600"
                      >
                        Position: {queuePosition}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to leave queue</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleQueue}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Radio className='mr-2' /> 
                  {queueLength === 0 && !currentBroadcaster ? ' Go Live!' : ' Join Queue'}
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-gray-700 pt-4 space-y-2">
            <Button 
              variant={isBroadcasting ? "destructive" : "default"} 
              className="w-full"
              disabled={isBroadcasting}
            >
              {isBroadcasting ? (
                <>
                  <Mic className="mr-2" />
                  <span>You're Broadcasting!</span>
                </>
              ) : isInQueue && queuePosition === 1 && currentBroadcaster ? (
                <>
                  <Clock className="mr-2" />
                  <span>You're live in {Math.ceil(timeLeft / 1000)}s</span>
                </>
              ) : (
                <>
                  <MicOff className="mr-2" />
                  <span className="text-sm">You're Muted</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        {isBroadcasting && <BroadcasterVoteDisplay />}
      </div>
    </>
  );
};

export default TellAPhoneApp;