import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { WallBreakerScreen } from './src/modes/wall-breaker/WallBreakerScreen';
import { WordWheelScreen } from './src/modes/word-wheel/WordWheelScreen';
import { GameScreen } from './src/screens/GameScreen';

type AppMode = 'classic' | 'wall-breaker' | 'word-wheel';

export default function App() {
  const [mode, setMode] = useState<AppMode>('classic');

  return (
    <>
      <StatusBar style="dark" />
      {mode === 'classic' ? (
        <GameScreen
          onOpenWallBreaker={() => setMode('wall-breaker')}
          onOpenWordWheel={() => setMode('word-wheel')}
        />
      ) : mode === 'wall-breaker' ? (
        <WallBreakerScreen onBack={() => setMode('classic')} />
      ) : (
        <WordWheelScreen onBack={() => setMode('classic')} />
      )}
    </>
  );
}