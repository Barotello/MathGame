import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { WallBreakerScreen } from './src/modes/wall-breaker/WallBreakerScreen';
import { WordWheelScreen } from './src/modes/word-wheel/WordWheelScreen';
import { GameScreen } from './src/screens/GameScreen';

type AppMode = 'classic' | 'wall-breaker' | 'word-wheel';

export default function App() {
  const [mode, setMode] = useState<AppMode>('classic');
  const [openGeneralSettings, setOpenGeneralSettings] = useState(false);

  return (
    <>
      <StatusBar style="dark" />
      {mode === 'classic' ? (
        <GameScreen
          openSettingsInitially={openGeneralSettings}
          onOpenWallBreaker={() => {
            setOpenGeneralSettings(false);
            setMode('wall-breaker');
          }}
          onOpenWordWheel={() => {
            setOpenGeneralSettings(false);
            setMode('word-wheel');
          }}
        />
      ) : mode === 'wall-breaker' ? (
        <WallBreakerScreen onBack={() => setMode('classic')} />
      ) : (
        <WordWheelScreen
          onBack={() => setMode('classic')}
          onOpenSettings={() => {
            setOpenGeneralSettings(true);
            setMode('classic');
          }}
        />
      )}
    </>
  );
}
