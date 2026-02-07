'use client';

import { useProjectStore } from '@/stores/projectStore';
import { useState } from 'react';

const NOTES = [
  'C7', 'B6', 'A#6', 'A6', 'G#6', 'G6', 'F#6', 'F6', 'E6', 'D#6', 'D6', 'C#6', 'C6',
  'B5', 'A#5', 'A5', 'G#5', 'G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5', 'C5',
  'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4',
  'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3', 'C3',
  'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2', 'C2',
];

const NOTE_TO_MIDI: { [key: string]: number } = {};
NOTES.forEach((note, index) => {
  NOTE_TO_MIDI[note] = 24 + (NOTES.length - 1 - index);
});

export default function PianoRollView() {
  const { project, selectedTool, selectedTrackId } = useProjectStore();
  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  if (!project) return null;

  const selectedTrack = selectedTrackId ? project.tracks.find((t) => t.id === selectedTrackId) : null;
  
  // Find the first MIDI clip for the selected track
  const trackMidiClips = selectedTrack
    ? project.arrangementClips
        .filter((c) => c.trackId === selectedTrack.id && c.clipType === 'midi')
        .map((c) => project.midiClips.find((mc) => mc.id === c.clipDataId))
        .filter((mc): mc is NonNullable<typeof mc> => mc !== undefined)
    : [];
  
  const activeClip = selectedClip 
    ? project.midiClips.find((c) => c.id === selectedClip)
    : trackMidiClips[0] || null;

  const ticksPerBar = 1920;
  const pixelsPerBar = 100 * zoom;
  const noteHeight = 24;
  const totalNotesHeight = NOTES.length * noteHeight;

  const handleNoteClick = (noteIndex: number, tick: number) => {
    if (selectedTool === 'draw' && activeClip) {
      // Add note logic - will need to create clip if none exists
    } else if (selectedTool === 'erase' && activeClip) {
      // Remove note logic
    }
  };

  const getNoteAtPosition = (noteIndex: number, tick: number) => {
    if (!activeClip) return null;
    return activeClip.notes.find(
      (n) => n.pitch === NOTE_TO_MIDI[NOTES[noteIndex]] && Math.abs(n.startTick - tick) < 100
    );
  };

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-zinc-900 border-b border-zinc-700 flex items-center gap-2 px-4 flex-shrink-0">
        <div className="flex-1 text-sm text-zinc-400">
          {selectedTrack ? `Editing: ${selectedTrack.name}` : 'No track selected'}
        </div>
        <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">Draw</button>
        <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">Select</button>
        <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">Erase</button>
        <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">Slice</button>
      </div>

      {/* Piano Roll Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {!selectedTrack ? (
          <div className="h-full flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <p className="text-lg mb-2">No track selected</p>
              <p className="text-sm">Select a track in the Playlist to start editing</p>
            </div>
          </div>
        ) : (
          <div className="flex" style={{ height: totalNotesHeight }}>
          {/* Piano Keys */}
          <div className="w-16 bg-zinc-900 border-r border-zinc-700 flex-shrink-0" style={{ height: totalNotesHeight }}>
            {NOTES.map((note, index) => {
              const isBlack = note.includes('#');
              return (
                <div
                  key={index}
                  className={`border-b border-zinc-800 flex items-center justify-center text-xs ${
                    isBlack ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-900 text-zinc-300'
                  }`}
                  style={{ height: `${noteHeight}px` }}
                >
                  {note}
                </div>
              );
            })}
          </div>

          {/* Note Grid */}
          <div className="flex-1 relative" style={{ height: totalNotesHeight }}>
            {/* Grid Lines */}
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                className="absolute border-l border-zinc-800"
                style={{ left: `${pixelsPerBar * i}px`, height: '100%' }}
              />
            ))}

            {/* Notes */}
            {activeClip && (() => {
              const clip = activeClip;
              if (!clip) return null;
              return clip.notes.map((note, index) => {
                const noteIndex = NOTES.findIndex((n) => NOTE_TO_MIDI[n] === note.pitch);
                if (noteIndex === -1) return null;
                return (
                  <div
                    key={index}
                    className="absolute bg-blue-500 border border-blue-400 rounded cursor-move"
                    style={{
                      top: `${noteIndex * noteHeight}px`,
                      left: `${(note.startTick / ticksPerBar) * pixelsPerBar}px`,
                      width: `${(note.durationTick / ticksPerBar) * pixelsPerBar}px`,
                      height: `${noteHeight - 2}px`,
                    }}
                  />
                );
              });
            })()}

            {/* Clickable Grid */}
            <div className="absolute inset-0">
              {NOTES.map((_, noteIndex) => (
                <div 
                  key={noteIndex} 
                  className="absolute w-full" 
                  style={{ top: `${noteIndex * noteHeight}px`, height: `${noteHeight}px` }}
                >
                  {Array.from({ length: 32 }, (_, barIndex) => (
                    <div
                      key={barIndex}
                      onClick={() => handleNoteClick(noteIndex, barIndex * ticksPerBar)}
                      className="absolute border-b border-r border-zinc-800 hover:bg-zinc-900/50 cursor-crosshair"
                      style={{
                        left: `${barIndex * pixelsPerBar}px`,
                        width: `${pixelsPerBar}px`,
                        height: '100%',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Velocity Lane */}
      <div className="h-32 bg-zinc-900 border-t border-zinc-700 flex-shrink-0">
        <div className="p-2 text-xs text-zinc-400">Velocity</div>
      </div>
    </div>
  );
}
