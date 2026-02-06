import { create } from 'zustand';
import type { Project, Track, MidiClip, Pattern, ArrangementClip, ViewMode, Tool, Selection, TimeSignature } from '@/types/project';

interface ProjectState {
  project: Project | null;
  currentView: ViewMode;
  selectedTool: Tool;
  selection: Selection;
  playheadPosition: number; // in bars
  loopStart: number | null;
  loopEnd: number | null;
  isPlaying: boolean;
  isRecording: boolean;
  metronomeEnabled: boolean;
  
  // Actions
  setProject: (project: Project) => void;
  setCurrentView: (view: ViewMode) => void;
  setSelectedTool: (tool: Tool) => void;
  setSelection: (selection: Selection) => void;
  setPlayheadPosition: (position: number) => void;
  setLoopRegion: (start: number | null, end: number | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setMetronomeEnabled: (enabled: boolean) => void;
  
  // Project mutations
  addTrack: (track: Track) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
  addMidiClip: (clip: MidiClip) => void;
  updateMidiClip: (clipId: string, updates: Partial<MidiClip>) => void;
  deleteMidiClip: (clipId: string) => void;
  addPattern: (pattern: Pattern) => void;
  updatePattern: (patternId: string, updates: Partial<Pattern>) => void;
  deletePattern: (patternId: string) => void;
  addArrangementClip: (clip: ArrangementClip) => void;
  updateArrangementClip: (clipId: string, updates: Partial<ArrangementClip>) => void;
  deleteArrangementClip: (clipId: string) => void;
  setTempo: (tempo: number) => void;
  setTimeSignature: (timeSignature: TimeSignature) => void;
}

const createDefaultProject = (): Project => ({
  id: 'default-project',
  title: 'Untitled Project',
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  tracks: [],
  patterns: [],
  midiClips: [],
  arrangementClips: [],
  automationLanes: [],
  mixer: {
    channels: [],
  },
});

export const useProjectStore = create<ProjectState>((set) => ({
  project: createDefaultProject(),
  currentView: 'playlist',
  selectedTool: 'select',
  selection: { clips: [], notes: [], track: null },
  playheadPosition: 0,
  loopStart: null,
  loopEnd: null,
  isPlaying: false,
  isRecording: false,
  metronomeEnabled: false,
  
  setProject: (project) => set({ project }),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelection: (selection) => set({ selection }),
  setPlayheadPosition: (position) => set({ playheadPosition: position }),
  setLoopRegion: (start, end) => set({ loopStart: start, loopEnd: end }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
  
  addTrack: (track) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        tracks: [...state.project.tracks, track],
        mixer: {
          ...state.project.mixer,
          channels: [
            ...state.project.mixer.channels,
            {
              id: `mixer-${track.id}`,
              trackId: track.id,
              volume: 0.8,
              pan: 0,
              mute: false,
              solo: false,
              inserts: [],
              sends: {},
            },
          ],
        },
      },
    };
  }),
  
  updateTrack: (trackId, updates) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
      },
    };
  }),
  
  deleteTrack: (trackId) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        tracks: state.project.tracks.filter((t) => t.id !== trackId),
        arrangementClips: state.project.arrangementClips.filter((c) => c.trackId !== trackId),
        mixer: {
          ...state.project.mixer,
          channels: state.project.mixer.channels.filter((c) => c.trackId !== trackId),
        },
      },
    };
  }),
  
  addMidiClip: (clip) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        midiClips: [...state.project.midiClips, clip],
      },
    };
  }),
  
  updateMidiClip: (clipId, updates) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        midiClips: state.project.midiClips.map((c) =>
          c.id === clipId ? { ...c, ...updates } : c
        ),
      },
    };
  }),
  
  deleteMidiClip: (clipId) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        midiClips: state.project.midiClips.filter((c) => c.id !== clipId),
        arrangementClips: state.project.arrangementClips.filter(
          (c) => !(c.clipType === 'midi' && c.clipDataId === clipId)
        ),
      },
    };
  }),
  
  addPattern: (pattern) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        patterns: [...state.project.patterns, pattern],
      },
    };
  }),
  
  updatePattern: (patternId, updates) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        patterns: state.project.patterns.map((p) =>
          p.id === patternId ? { ...p, ...updates } : p
        ),
      },
    };
  }),
  
  deletePattern: (patternId) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        patterns: state.project.patterns.filter((p) => p.id !== patternId),
        arrangementClips: state.project.arrangementClips.filter(
          (c) => !(c.clipType === 'pattern' && c.clipDataId === patternId)
        ),
      },
    };
  }),
  
  addArrangementClip: (clip) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        arrangementClips: [...state.project.arrangementClips, clip],
      },
    };
  }),
  
  updateArrangementClip: (clipId, updates) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        arrangementClips: state.project.arrangementClips.map((c) =>
          c.id === clipId ? { ...c, ...updates } : c
        ),
      },
    };
  }),
  
  deleteArrangementClip: (clipId) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        arrangementClips: state.project.arrangementClips.filter((c) => c.id !== clipId),
      },
    };
  }),
  
  setTempo: (tempo) => set((state) => {
    if (!state.project) return state;
    return {
      project: { ...state.project, tempo },
    };
  }),
  
  setTimeSignature: (timeSignature) => set((state) => {
    if (!state.project) return state;
    return {
      project: { ...state.project, timeSignature },
    };
  }),
}));
