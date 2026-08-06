import React, { useState, useEffect } from 'react';
import { AppScreen, PlayerInfo, GameResults } from '@/core/types';
import { socketService } from '@/services/socket';
import { webRTCManager } from '@/services/webrtc';
import { cameraService } from '@/services/camera';
import { useMotionDetector } from '@/motion/useMotionDetector';
import { CountdownOverlay } from '@/components/CountdownOverlay';

// Screens
import { SplashScreen } from '@/screens/SplashScreen';
import { MainMenu } from '@/screens/MainMenu';
import { CreateRoom } from '@/screens/CreateRoom';
import { JoinRoom } from '@/screens/JoinRoom';
import { Lobby } from '@/screens/Lobby';
import { GameSelector } from '@/screens/GameSelector';
import { GameScreen } from '@/screens/GameScreen';
import { ResultsScreen } from '@/screens/ResultsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('jf_player_name') || `Jugador${Math.floor(Math.random() * 900 + 100)}`);
  
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerSlot, setPlayerSlot] = useState<number | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [hostId, setHostId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedGame, setSelectedGame] = useState<string>('jump-logs');
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
  
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      const stream = await cameraService.getStream();
      if (stream) {
        setLocalStream(stream);
        webRTCManager.setLocalStream(stream);
      }
    };
    initCamera();
  }, []);

  // Motion Detection
  useMotionDetector(localStream);

  // Socket & WebRTC setup
  useEffect(() => {
    const socket = socketService.connect();
    
    setIsConnected(socket.connected);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error-message', (msg: string) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    });

    socket.on('room-joined', ({ roomCode, players, hostId, playerSlot: slot, selectedGame: sg }) => {
      setRoomCode(roomCode);
      setPlayers(players);
      setHostId(hostId);
      setPlayerSlot(slot);
      if (sg) setSelectedGame(sg);
      
      webRTCManager.initSignaling(slot);
      setCurrentScreen('lobby');
    });

    socket.on('room-update', ({ players, hostId, selectedGame: sg }) => {
      setPlayers(players);
      setHostId(hostId);
      if (sg) setSelectedGame(sg);
    });

    socket.on('game-started', ({ selectedGame: sg }) => {
      if (sg) setSelectedGame(sg);
      setCountdown(3);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setCurrentScreen('game');
            return null;
          }
          return prev - 1;
        });
      }, 900);
    });

    socket.on('game-results', (results: GameResults) => {
      setGameResults(results);
      setCurrentScreen('results');
    });

    const setupPeers = () => {
      if (playerSlot === null) return;
      players.forEach(p => {
        if (p.slot !== playerSlot && !p.isBot) {
          if (playerSlot < p.slot) {
            webRTCManager.connectToPeer(p.id, p.slot, playerSlot);
          }
        }
      });
    };
    
    setupPeers();

    const cleanupRemoteStream = webRTCManager.onRemoteStream((slot, stream) => {
      setRemoteStreams(prev => ({ ...prev, [slot]: stream }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error-message');
      socket.off('room-joined');
      socket.off('room-update');
      socket.off('game-started');
      socket.off('game-results');
      cleanupRemoteStream();
    };
  }, [playerSlot, players]);

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('jf_player_name', name);
  };

  const isHost = playerSlot !== null && players.find(p => p.slot === playerSlot)?.id === hostId;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={() => setCurrentScreen('main-menu')} />;
      case 'main-menu':
        return (
          <MainMenu 
            playerName={playerName} 
            onPlayerNameChange={handlePlayerNameChange}
            isConnected={isConnected}
            onNavigate={setCurrentScreen}
          />
        );
      case 'create-room':
        return (
          <CreateRoom 
            playerName={playerName}
            isConnected={isConnected}
            onRoomCreated={(code) => socketService.joinRoom(code, playerName)}
            onBack={() => setCurrentScreen('main-menu')}
          />
        );
      case 'join-room':
        return (
          <JoinRoom 
            playerName={playerName}
            isConnected={isConnected}
            onRoomJoined={(code) => socketService.joinRoom(code, playerName)}
            onBack={() => setCurrentScreen('main-menu')}
          />
        );
      case 'lobby':
        return (
          <Lobby 
            roomCode={roomCode}
            players={players}
            hostId={hostId}
            playerSlot={playerSlot}
            localStream={localStream}
            remoteStreams={remoteStreams}
            isConnected={isConnected}
            selectedGame={selectedGame}
            onSelectGame={() => setCurrentScreen('game-selector')}
            onStartGame={() => socketService.startGame(roomCode)}
            onLeaveRoom={() => {
              socketService.leaveRoom(roomCode);
              setCurrentScreen('main-menu');
            }}
            onReadyToggle={() => socketService.toggleReady(roomCode)}
            onFillBots={() => socketService.fillBots(roomCode)}
          />
        );
      case 'game-selector':
        return (
          <GameSelector 
            currentSelection={selectedGame}
            onSelect={(gameId) => {
              socketService.selectGame(roomCode, gameId);
              setSelectedGame(gameId);
              setCurrentScreen('lobby');
            }}
            onBack={() => setCurrentScreen('lobby')}
          />
        );
      case 'game':
        return (
          <GameScreen 
            roomCode={roomCode}
            players={players}
            localSlot={playerSlot ?? 0}
            isHost={isHost}
            localStream={localStream}
            remoteStreams={remoteStreams}
            selectedGameId={selectedGame || 'jump-logs'}
            onGameEnd={(results) => socketService.sendGameEvent(roomCode, 'game-end', results)}
          />
        );
      case 'results':
        return gameResults ? (
          <ResultsScreen 
            results={gameResults}
            isHost={isHost}
            onBackToLobby={() => setCurrentScreen('lobby')}
            onPlayAgain={() => socketService.restartGame(roomCode)}
          />
        ) : null;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('main-menu')} />;
      default:
        return null;
    }
  };

  return (
    <>
      {currentScreen !== 'splash' && currentScreen !== 'game' && (
        <header className="app-header">
          <div className="app-header-inner">
            <h1 className="text-lg text-yellow pixel-text-shadow cursor-pointer" onClick={() => currentScreen !== 'lobby' && setCurrentScreen('main-menu')}>
              🎮 JUMPING FRIENDS
            </h1>
            <div className="flex items-center gap-3">
              {roomCode && <span className="text-xs text-celeste font-mono">SALA: {roomCode}</span>}
              <span className="text-xs text-orange">{playerName}</span>
            </div>
          </div>
        </header>
      )}

      {errorMsg && (
        <div className="fixed top-14 w-full max-w-sm" style={{ zIndex: 50, left: '50%', transform: 'translateX(-50%)' }}>
          <div className="error-box">{errorMsg}</div>
        </div>
      )}

      <main className="w-full min-h-screen">
        {renderScreen()}
      </main>

      <CountdownOverlay count={countdown} />
    </>
  );
};

export default App;
