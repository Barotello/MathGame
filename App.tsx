import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { WallBreakerScreen } from './src/modes/wall-breaker/WallBreakerScreen';
import { GameScreen } from './src/screens/GameScreen';

type AppMode = 'classic' | 'wall-breaker';

export default function App() {
  const [mode, setMode] = useState<AppMode>('classic');

  return (
    <>
      <StatusBar style="light" />
      {mode === 'classic' ? (
        <GameScreen
          onOpenWallBreaker={() => setMode('wall-breaker')}
        />
      ) : (
        <WallBreakerScreen onBack={() => setMode('classic')} />
      )}
    </>
  );
}