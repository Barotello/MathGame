import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { WordWheelScreen } from './src/modes/word-wheel/WordWheelScreen';
import { GameScreen } from './src/screens/GameScreen';

type AppMode = 'classic' | 'word-wheel';

export default function App() {
  const [mode, setMode] = useState<AppMode>('classic');

  return (
    <>
      <StatusBar style="dark" />
      {mode === 'classic' ? (
        <GameScreen
          onOpenWordWheel={() => setMode('word-wheel')}
        />
      ) : (
        <WordWheelScreen onOpenMath={() => setMode('classic')} />
      )}
    </>
  );
}
