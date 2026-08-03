const SAMPLE_RATE = 12_000;

type ToneStep = {
  brightness?: number;
  duration: number;
  frequency: number;
  volume: number;
};

function writeAscii(view: DataView, offset: number, value: string) {
  Array.from(value).forEach((character, index) => {
    view.setUint8(offset + index, character.charCodeAt(0));
  });
}

function toBase64(bytes: Uint8Array) {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    encoded += alphabet[(chunk >> 18) & 63];
    encoded += alphabet[(chunk >> 12) & 63];
    encoded += index + 1 < bytes.length ? alphabet[(chunk >> 6) & 63] : '=';
    encoded += index + 2 < bytes.length ? alphabet[chunk & 63] : '=';
  }

  return encoded;
}

function createToneSource(steps: ToneStep[]) {
  const stepSamples = steps.map((step) =>
    Math.max(1, Math.round(step.duration * SAMPLE_RATE)),
  );
  const sampleCount = stepSamples.reduce((total, count) => total + count, 0);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);

  let outputIndex = 0;
  steps.forEach((step, stepIndex) => {
    const count = stepSamples[stepIndex];
    for (let sampleIndex = 0; sampleIndex < count; sampleIndex += 1) {
      const attack = Math.min(1, sampleIndex / (SAMPLE_RATE * 0.012));
      const release = Math.min(
        1,
        (count - sampleIndex - 1) / (SAMPLE_RATE * 0.035),
      );
      const envelope = Math.max(0, Math.min(attack, release));
      const phase =
        (2 * Math.PI * step.frequency * sampleIndex) / SAMPLE_RATE;
      const brightness = step.brightness ?? 0;
      const wave =
        (Math.sin(phase) +
          brightness * Math.sin(phase * 2) +
          brightness * 0.35 * Math.sin(phase * 3)) /
        (1 + brightness * 1.35);
      view.setInt16(
        44 + outputIndex * 2,
        Math.round(wave * envelope * step.volume * 32_767),
        true,
      );
      outputIndex += 1;
    }
  });

  return {
    uri: `data:audio/wav;base64,${toBase64(new Uint8Array(buffer))}`,
  };
}

export const SUCCESS_SOUND = createToneSource([
  { brightness: 0.28, duration: 0.08, frequency: 523.25, volume: 0.28 },
  { brightness: 0.3, duration: 0.08, frequency: 659.25, volume: 0.29 },
  { brightness: 0.32, duration: 0.1, frequency: 783.99, volume: 0.3 },
  { brightness: 0.34, duration: 0.22, frequency: 1046.5, volume: 0.32 },
]);

export const WRONG_SOUND = createToneSource([
  { duration: 0.14, frequency: 293.66, volume: 0.22 },
  { duration: 0.2, frequency: 196, volume: 0.24 },
]);

export const REVEAL_SOUND = createToneSource([
  { brightness: 0.18, duration: 0.05, frequency: 523.25, volume: 0.2 },
  { brightness: 0.24, duration: 0.07, frequency: 783.99, volume: 0.23 },
]);

export const REVEAL_COMPLETE_SOUND = createToneSource([
  { brightness: 0.3, duration: 0.07, frequency: 880, volume: 0.25 },
  { brightness: 0.34, duration: 0.09, frequency: 1174.66, volume: 0.27 },
  { brightness: 0.38, duration: 0.2, frequency: 1567.98, volume: 0.29 },
]);

export const DELETE_SOUND = createToneSource([
  { brightness: 0.12, duration: 0.04, frequency: 392, volume: 0.2 },
  { brightness: 0.08, duration: 0.09, frequency: 246.94, volume: 0.22 },
]);

export const LETTER_SOUND = createToneSource([
  { brightness: 0.24, duration: 0.065, frequency: 659.25, volume: 0.2 },
]);
