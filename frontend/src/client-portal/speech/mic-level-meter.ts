import type { MotionValue } from "framer-motion";

/**
 * Drives the waveform from the microphone's actual signal, so the bars react to
 * the visitor's voice instead of miming it. That is the difference between
 * decoration and feedback: if the level stays flat, the mic genuinely is not
 * picking anything up, and the user finds out during the recording rather than
 * after a failed transcription.
 *
 * Writes into a framer-motion `MotionValue` rather than React state on purpose —
 * a 60fps render loop through `setState` would re-render the whole panel every
 * frame, while a MotionValue mutates the DOM directly and re-renders nothing.
 */

/** Weighted blend with the previous frame — raw RMS is far too jittery to read. */
const SMOOTHING = 0.55;
/** Speech rarely exceeds ~0.3 RMS, so scale it up to use the full bar height. */
const LEVEL_GAIN = 3.2;

type AudioContextCapableWindow = {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

/**
 * Starts metering `stream` into `level` (0–1). Returns the stop function; it is
 * always safe to call, and always releases the AudioContext.
 */
export function startMicLevelMeter(
  stream: MediaStream,
  level: MotionValue<number>,
): () => void {
  const candidate = window as unknown as AudioContextCapableWindow;
  const AudioContextCtor = candidate.AudioContext ?? candidate.webkitAudioContext;

  // Metering is a nicety — if the browser won't give us an analyser, recording
  // must carry on regardless, so this degrades to a no-op.
  if (!AudioContextCtor) return () => {};

  let context: AudioContext;

  try {
    context = new AudioContextCtor();
  } catch {
    return () => {};
  }

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);

  const samples = new Uint8Array(analyser.frequencyBinCount);
  let frame = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;

    analyser.getByteTimeDomainData(samples);

    // RMS deviation from the 128 midpoint of the unsigned waveform.
    let sumOfSquares = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const deviation = (samples[index] - 128) / 128;
      sumOfSquares += deviation * deviation;
    }

    const rms = Math.sqrt(sumOfSquares / samples.length);
    const target = Math.min(1, rms * LEVEL_GAIN);

    level.set(level.get() * SMOOTHING + target * (1 - SMOOTHING));
    frame = window.requestAnimationFrame(tick);
  };

  frame = window.requestAnimationFrame(tick);

  return () => {
    stopped = true;
    window.cancelAnimationFrame(frame);
    level.set(0);
    source.disconnect();
    analyser.disconnect();
    void context.close().catch(() => {
      // Already closed — nothing to release.
    });
  };
}
