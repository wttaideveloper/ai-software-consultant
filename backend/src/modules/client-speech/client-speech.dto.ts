/**
 * The entire public shape of this module: text, and nothing else.
 *
 * No id, no storage key, no audio URL — there is deliberately nothing here that
 * could refer back to the recording, because the recording does not survive the
 * request that carried it.
 */
export type SpeechTranscriptionDto = {
  text: string;
};

export function toSpeechTranscriptionDto(text: string): SpeechTranscriptionDto {
  return { text };
}
