import { useMemo } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

import { WallBreakerTile } from './WallBreakerTile';
import type {
  BoardDimensions,
  WallTileModel,
} from './types';

const BOARD_PADDING = 7;
const CELL_GAP = 4;

type Props = {
  board: WallTileModel[];
  chain: WallTileModel[];
  dimensions: BoardDimensions;
  disabled: boolean;
  onCancel: () => void;
  onComplete: () => void;
  onMove: (tile: WallTileModel) => void;
  onStart: (tile: WallTileModel) => void;
  paper: boolean;
  width: number;
};

export function WallBreakerBoard({
  board,
  chain,
  dimensions,
  disabled,
  onCancel,
  onComplete,
  onMove,
  onStart,
  paper,
  width,
}: Props) {
  const cellSize =
    (width -
      BOARD_PADDING * 2 -
      CELL_GAP * (dimensions.columns - 1)) /
    dimensions.columns;
  const height =
    BOARD_PADDING * 2 +
    cellSize * dimensions.rows +
    CELL_GAP * (dimensions.rows - 1);
  const selectedIds = useMemo(
    () => new Set(chain.map((tile) => tile.id)),
    [chain],
  );

  function getTileAtPoint(x: number, y: number) {
    const column = Math.floor(
      (x - BOARD_PADDING) / (cellSize + CELL_GAP),
    );
    const row = Math.floor(
      (y - BOARD_PADDING) / (cellSize + CELL_GAP),
    );

    if (
      row < 0 ||
      row >= dimensions.rows ||
      column < 0 ||
      column >= dimensions.columns
    ) {
      return null;
    }

    const localX =
      x - BOARD_PADDING - column * (cellSize + CELL_GAP);
    const localY =
      y - BOARD_PADDING - row * (cellSize + CELL_GAP);

    if (localX > cellSize || localY > cellSize) return null;

    const tile =
      board.find(
        (tile) => tile.row === row && tile.column === column,
      ) ?? null;

    return tile?.used ? null : tile;
  }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          const tile = getTileAtPoint(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );
          if (tile) onStart(tile);
        },
        onPanResponderMove: (event) => {
          const tile = getTileAtPoint(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );
          if (tile) onMove(tile);
        },
        onPanResponderRelease: onComplete,
        onPanResponderTerminate: onCancel,
        onPanResponderTerminationRequest: () => false,
      }),
    [
      board,
      cellSize,
      dimensions.columns,
      dimensions.rows,
      disabled,
      onCancel,
      onComplete,
      onMove,
      onStart,
    ],
  );

  return (
    <View
      accessibilityLabel="Duvar Yıkma sayı tahtası"
      testID="wall-breaker-board"
      style={[
        styles.board,
        paper && styles.boardPaper,
        { width, height },
      ]}
      {...responder.panHandlers}
    >
      {board.map((tile) => (
        <View
          key={tile.id}
          style={{
            position: 'absolute',
            left:
              BOARD_PADDING +
              tile.column * (cellSize + CELL_GAP),
            top:
              BOARD_PADDING +
              tile.row * (cellSize + CELL_GAP),
          }}
        >
          <WallBreakerTile
            paper={paper}
            selected={selectedIds.has(tile.id)}
            size={cellSize}
            tile={tile}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(8, 19, 14, 0.76)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 9,
  },
  boardPaper: {
    borderColor: '#D8D0C8',
    backgroundColor: '#E9E3DC',
    shadowColor: '#4A443F',
    shadowOpacity: 0.16,
  },
});