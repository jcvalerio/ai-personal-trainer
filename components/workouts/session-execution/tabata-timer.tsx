/**
 * Tabata Timer Component
 * High-precision interval timer with work/rest phases and visual feedback
 */
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Play, Pause, Square, SkipForward, Volume2, VolumeX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  TimerState, 
  TimerPhase, 
  TabataConfig
} from '@/types/session-execution'
import { SessionExercise } from '@/types/workouts'

interface AudioFeedback {
  type: 'beep' | 'chime' | 'success'
  frequency: number
  duration: number
}

interface TabataTimerProps {
  exercise: SessionExercise
  config: TabataConfig
  initialState?: Partial<TimerState>
  audioEnabled?: boolean
  vibrateEnabled?: boolean
  onPhaseChange?: (phase: TimerPhase, timeRemaining: number) => void
  onRoundComplete?: (round: number) => void
  onSetComplete?: (set: number) => void
  onTimerComplete?: () => void
  onTimerPause?: () => void
  onTimerResume?: () => void
  className?: string
}

interface TimerDisplay {
  minutes: number
  seconds: number
  centiseconds: number
}

// Audio feedback configuration
const AUDIO_FEEDBACK: Record<TimerPhase | 'warning', AudioFeedback> = {
  ready: { type: 'beep', frequency: 800, duration: 200 },
  work: { type: 'beep', frequency: 1000, duration: 300 },
  rest: { type: 'beep', frequency: 600, duration: 200 },
  set_break: { type: 'chime', frequency: 800, duration: 500 },
  transition: { type: 'beep', frequency: 700, duration: 150 },
  completed: { type: 'success', frequency: 1200, duration: 800 },
  warning: { type: 'beep', frequency: 1400, duration: 100 },
  paused: { type: 'beep', frequency: 400, duration: 200 },
  stopped: { type: 'beep', frequency: 400, duration: 200 }
}

export function TabataTimer({
  exercise,
  config,
  initialState,
  audioEnabled = true,
  vibrateEnabled = true,
  onPhaseChange,
  onRoundComplete,
  onSetComplete,
  onTimerComplete,
  onTimerPause,
  onTimerResume,
  className = ''
}: TabataTimerProps) {
  const t = useTranslations('workouts.session.timer')
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>(() => ({
    protocol: 'tabata',
    phase: 'ready',
    currentRound: 1,
    totalRounds: config.rounds,
    timeRemaining: 3000, // 3 second ready countdown
    phaseTotal: 3000,
    elapsedTime: 0,
    isRunning: false,
    isPaused: false,
    ...initialState
  }))

  const [currentSet, setCurrentSet] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(audioEnabled)
  
  // Refs for performance and cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastTickRef = useRef<number>(Date.now())
  const warningPlayedRef = useRef<boolean>(false)

  // Initialize audio context
  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('Audio context not available:', error)
      }
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [soundEnabled])

  // Audio feedback function
  const playSound = useCallback((phase: TimerPhase | 'warning') => {
    if (!soundEnabled || !audioContextRef.current) {
      return
    }

    const feedback = AUDIO_FEEDBACK[phase]
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(feedback.frequency, ctx.currentTime)
    oscillator.type = feedback.type === 'beep' ? 'square' : 'sine'
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + feedback.duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + feedback.duration / 1000)
  }, [soundEnabled])

  // Haptic feedback
  const vibrate = useCallback((pattern: number | number[]) => {
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }, [vibrateEnabled])

  // Get next phase configuration
  const getNextPhaseConfig = useCallback((currentPhase: TimerPhase, round: number, set: number) => {
    switch (currentPhase) {
      case 'ready':
        return {
          phase: 'work' as TimerPhase,
          duration: config.workSeconds * 1000,
          round,
          set
        }
      case 'work':
        if (round >= config.rounds) {
          if (set >= config.sets) {
            return {
              phase: 'completed' as TimerPhase,
              duration: 0,
              round,
              set
            }
          } else {
            return {
              phase: 'set_break' as TimerPhase,
              duration: config.setBreakSeconds * 1000,
              round: 1,
              set: set + 1
            }
          }
        } else {
          return {
            phase: 'rest' as TimerPhase,
            duration: config.restSeconds * 1000,
            round,
            set
          }
        }
      case 'rest':
        return {
          phase: 'work' as TimerPhase,
          duration: config.workSeconds * 1000,
          round: round + 1,
          set
        }
      case 'set_break':
        return {
          phase: 'work' as TimerPhase,
          duration: config.workSeconds * 1000,
          round: 1,
          set
        }
      default:
        return {
          phase: 'completed' as TimerPhase,
          duration: 0,
          round,
          set
        }
    }
  }, [config])

  // Timer tick function
  const tick = useCallback(() => {
    const now = Date.now()
    const deltaTime = now - lastTickRef.current
    lastTickRef.current = now

    setTimerState(prevState => {
      if (!prevState.isRunning || prevState.isPaused) {
        return prevState
      }

      const newTimeRemaining = Math.max(0, prevState.timeRemaining - deltaTime)
      const newElapsedTime = prevState.elapsedTime + deltaTime

      // Warning at 3 seconds remaining
      if (newTimeRemaining <= 3000 && newTimeRemaining > 2900 && !warningPlayedRef.current) {
        playSound('warning')
        vibrate(100)
        warningPlayedRef.current = true
      }

      // Phase complete
      if (newTimeRemaining <= 0) {
        warningPlayedRef.current = false
        
        const nextPhase = getNextPhaseConfig(prevState.phase, prevState.currentRound, currentSet)
        
        // Call appropriate callbacks
        if (prevState.phase === 'work' || prevState.phase === 'rest') {
          onRoundComplete?.(prevState.currentRound)
        }
        if (nextPhase.phase === 'set_break' || nextPhase.phase === 'completed') {
          onSetComplete?.(currentSet)
        }
        if (nextPhase.phase === 'completed') {
          onTimerComplete?.()
        }

        // Update set counter
        if (nextPhase.set !== currentSet) {
          setCurrentSet(nextPhase.set)
        }

        // Play sound and vibration for phase change
        playSound(nextPhase.phase)
        switch (nextPhase.phase) {
          case 'work':
            vibrate([100, 50, 100])
            break
          case 'rest':
            vibrate(200)
            break
          case 'set_break':
            vibrate([100, 100, 100, 100, 100])
            break
          case 'completed':
            vibrate([200, 100, 200, 100, 200])
            break
        }

        // Call phase change callback
        onPhaseChange?.(nextPhase.phase, nextPhase.duration)

        return {
          ...prevState,
          phase: nextPhase.phase,
          currentRound: nextPhase.round,
          timeRemaining: nextPhase.duration,
          phaseTotal: nextPhase.duration,
          elapsedTime: newElapsedTime,
          isRunning: nextPhase.phase !== 'completed',
          completedAt: nextPhase.phase === 'completed' ? new Date() : undefined
        }
      }

      // Call phase change callback with updated time
      onPhaseChange?.(prevState.phase, newTimeRemaining)

      return {
        ...prevState,
        timeRemaining: newTimeRemaining,
        elapsedTime: newElapsedTime
      }
    })
  }, [playSound, vibrate, getNextPhaseConfig, onPhaseChange, onRoundComplete, onSetComplete, onTimerComplete, currentSet])

  // Timer control functions
  const startTimer = useCallback(() => {
    if (timerState.phase === 'completed') {
      return
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startedAt: prev.startedAt || new Date()
    }))
    
    lastTickRef.current = Date.now()
    playSound(timerState.phase)
  }, [timerState.phase, playSound])

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: true }))
    playSound('paused')
    vibrate(150)
    onTimerPause?.()
  }, [playSound, vibrate, onTimerPause])

  const resumeTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: true, isPaused: false }))
    lastTickRef.current = Date.now()
    playSound(timerState.phase)
    onTimerResume?.()
  }, [timerState.phase, playSound, onTimerResume])

  const stopTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isRunning: false, isPaused: false, phase: 'stopped' }))
    playSound('stopped')
    vibrate(200)
  }, [playSound, vibrate])

  const skipPhase = useCallback(() => {
    if (timerState.phase === 'completed') {
      return
    }
    
    const nextPhase = getNextPhaseConfig(timerState.phase, timerState.currentRound, currentSet)
    
    setTimerState(prev => ({
      ...prev,
      phase: nextPhase.phase,
      currentRound: nextPhase.round,
      timeRemaining: nextPhase.duration,
      phaseTotal: nextPhase.duration
    }))

    if (nextPhase.set !== currentSet) {
      setCurrentSet(nextPhase.set)
    }

    playSound(nextPhase.phase)
    onPhaseChange?.(nextPhase.phase, nextPhase.duration)
  }, [timerState.phase, timerState.currentRound, currentSet, getNextPhaseConfig, playSound, onPhaseChange])

  // Start/stop interval based on timer state
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(tick, 10) // 10ms precision
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState.isRunning, timerState.isPaused, tick])

  // Format time for display
  const formatTime = useCallback((timeMs: number): TimerDisplay => {
    const totalSeconds = Math.max(0, Math.ceil(timeMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centiseconds = Math.floor((timeMs % 1000) / 10)
    
    return { minutes, seconds, centiseconds }
  }, [])

  const timeDisplay = formatTime(timerState.timeRemaining)
  const progressPercentage = timerState.phaseTotal > 0 
    ? ((timerState.phaseTotal - timerState.timeRemaining) / timerState.phaseTotal) * 100 
    : 0

  // Phase styling
  const getPhaseStyles = (phase: TimerPhase) => {
    switch (phase) {
      case 'ready':
        return {
          background: 'bg-purple-500',
          text: 'text-white',
          border: 'border-purple-600'
        }
      case 'work':
        return {
          background: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-600'
        }
      case 'rest':
        return {
          background: 'bg-orange-500',
          text: 'text-white',
          border: 'border-orange-600'
        }
      case 'set_break':
        return {
          background: 'bg-blue-500',
          text: 'text-white',
          border: 'border-blue-600'
        }
      case 'completed':
        return {
          background: 'bg-emerald-500',
          text: 'text-white',
          border: 'border-emerald-600'
        }
      default:
        return {
          background: 'bg-gray-500',
          text: 'text-white',
          border: 'border-gray-600'
        }
    }
  }

  const phaseStyles = getPhaseStyles(timerState.phase)

  return (
    <Card className={`${className} transition-all duration-300`}>
      <CardContent className={`p-8 ${phaseStyles.background} ${phaseStyles.text} rounded-lg`}>
        {/* Exercise Information */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{exercise.name}</h2>
          <div className="text-lg opacity-90">
            {t('timer.tabata.phase.' + timerState.phase)} - {t('set')} {currentSet}/{config.sets}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="text-8xl font-mono font-bold mb-2">
            {timeDisplay.minutes > 0 && `${timeDisplay.minutes}:`}
            {String(timeDisplay.seconds).padStart(2, '0')}
            {timerState.timeRemaining < 10000 && (
              <span className="text-4xl">.{String(Math.floor(timeDisplay.centiseconds / 10))}</span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mb-4">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-white/20"
            />
          </div>

          {/* Round Counter */}
          <div className="text-xl">
            {timerState.phase !== 'set_break' && timerState.phase !== 'completed' && (
              <>
                {t('round')} {timerState.currentRound}/{config.rounds}
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-4">
          {!timerState.isRunning && !timerState.isPaused && timerState.phase !== 'completed' && (
            <Button
              size="lg"
              onClick={startTimer}
              className="bg-white/20 hover:bg-white/30 text-white text-lg px-8"
            >
              <Play className="w-6 h-6 mr-2" />
              {t('start')}
            </Button>
          )}
          
          {timerState.isRunning && !timerState.isPaused && (
            <Button
              size="lg"
              onClick={pauseTimer}
              className="bg-white/20 hover:bg-white/30 text-white text-lg px-8"
            >
              <Pause className="w-6 h-6 mr-2" />
              {t('pause')}
            </Button>
          )}

          {timerState.isPaused && (
            <Button
              size="lg"
              onClick={resumeTimer}
              className="bg-white/20 hover:bg-white/30 text-white text-lg px-8"
            >
              <Play className="w-6 h-6 mr-2" />
              {t('resume')}
            </Button>
          )}

          <Button
            size="lg"
            onClick={stopTimer}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20"
          >
            <Square className="w-5 h-5 mr-2" />
            {t('stop')}
          </Button>

          {timerState.phase !== 'completed' && (
            <Button
              size="lg"
              onClick={skipPhase}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              {t('skip')}
            </Button>
          )}
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center">
          <Button
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/20"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 mr-2" />
            ) : (
              <VolumeX className="w-4 h-4 mr-2" />
            )}
            {soundEnabled ? t('soundOn') : t('soundOff')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}