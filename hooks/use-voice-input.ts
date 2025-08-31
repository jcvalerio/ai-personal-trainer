/**
 * Voice Input Hook
 * Provides speech-to-text functionality for hands-free workout logging
 */
'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface VoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

interface UseVoiceInputReturn extends VoiceInputState {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  parseWorkoutCommands: (text: string) => WorkoutCommand | null;
}

interface WorkoutCommand {
  type: 'weight' | 'reps' | 'duration' | 'rest' | 'complete_set' | 'skip_set' | 'notes';
  value?: string | number;
  raw: string;
}

// Common workout-related phrases and their meanings
const WORKOUT_COMMANDS = {
  weight: [
    /(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?|kilograms?|kgs?)/i,
    /weight\s+(\d+(?:\.\d+)?)/i,
    /set\s+weight\s+to\s+(\d+(?:\.\d+)?)/i,
  ],
  reps: [
    /(\d+)\s*(?:reps?|repetitions?)/i,
    /(?:did|completed?)\s+(\d+)/i,
    /set\s+reps\s+to\s+(\d+)/i,
  ],
  duration: [
    /(\d+)\s*(?:seconds?|secs?|minutes?|mins?)/i,
    /duration\s+(\d+)/i,
    /lasted\s+(\d+)/i,
  ],
  rest: [
    /rest\s+(?:for\s+)?(\d+)/i,
    /break\s+(?:for\s+)?(\d+)/i,
    /pause\s+(?:for\s+)?(\d+)/i,
  ],
  complete_set: [
    /(?:complete|finish|done)(?:\s+set)?/i,
    /that's\s+(?:it|done|complete)/i,
    /finished/i,
  ],
  skip_set: [
    /skip(?:\s+set)?/i,
    /pass(?:\s+this)?(?:\s+set)?/i,
    /next(?:\s+exercise)?/i,
  ],
  notes: [
    /note:\s*(.+)/i,
    /notes?\s*(.+)/i,
    /comment:\s*(.+)/i,
  ],
};

export function useVoiceInput(options: VoiceInputOptions = {}): UseVoiceInputReturn {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
  });

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language ?? 'en-US';
    recognition.maxAlternatives = options.maxAlternatives ?? 1;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognition.onerror = (event) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Try speaking again.';
          break;
        case 'network':
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isListening: false,
      }));
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: prev.transcript + finalTranscript,
        interimTranscript,
      }));
    };

    recognitionRef.current = recognition;
    setState(prev => ({ ...prev, isSupported: true }));

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [options.continuous, options.interimResults, options.language, options.maxAlternatives]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start speech recognition. Try again.',
      }));
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return;

    recognitionRef.current.stop();
  }, [state.isListening]);

  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));
  }, []);

  const parseWorkoutCommands = useCallback((text: string): WorkoutCommand | null => {
    const normalizedText = text.toLowerCase().trim();

    // Check each command type
    for (const [commandType, patterns] of Object.entries(WORKOUT_COMMANDS)) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          let value: string | number | undefined;
          
          if (match[1]) {
            // Extract numeric value if present
            const numericValue = parseFloat(match[1]);
            value = isNaN(numericValue) ? match[1] : numericValue;
          }

          return {
            type: commandType as WorkoutCommand['type'],
            value,
            raw: text,
          };
        }
      }
    }

    return null;
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    parseWorkoutCommands,
  };
}

// Specialized hook for workout voice commands
export function useWorkoutVoiceInput(language = 'en-US') {
  const voiceInput = useVoiceInput({
    language,
    continuous: false,
    interimResults: true,
  });

  const listenForCommand = useCallback((): Promise<WorkoutCommand | null> => {
    return new Promise((resolve) => {
      if (!voiceInput.isSupported) {
        resolve(null);
        return;
      }

      voiceInput.resetTranscript();
      voiceInput.startListening();

      // Listen for a short period
      const timeout = setTimeout(() => {
        voiceInput.stopListening();
        const command = voiceInput.parseWorkoutCommands(voiceInput.transcript);
        resolve(command);
      }, 3000); // 3 second listening window

      // Clean up timeout if component unmounts
      return () => clearTimeout(timeout);
    });
  }, [voiceInput]);

  return {
    ...voiceInput,
    listenForCommand,
  };
}

// Types for global SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}