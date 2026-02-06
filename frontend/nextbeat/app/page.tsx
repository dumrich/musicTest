'use client';
import { useState, useRef } from "react";
import * as Tone from "tone";

// A simple grid: 4 Measures x 4 Beats = 16 Steps
// Each step is a Quarter Note ("4n")
const STEPS = 32;
// Full chromatic scale from C2 to C7 (61 notes)
const ROWS = [
  "C7",
  "B6", "A#6", "A6", "G#6", "G6", "F#6", "F6", "E6", "D#6", "D6", "C#6", "C6",
  "B5", "A#5", "A5", "G#5", "G5", "F#5", "F5", "E5", "D#5", "D5", "C#5", "C5",
  "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4",
  "B3", "A#3", "A3", "G#3", "G3", "F#3", "F3", "E3", "D#3", "D3", "C#3", "C3",
  "B2", "A#2", "A2", "G#2", "G2", "F#2", "F2", "E2", "D#2", "D2", "C#2", "C2"
];

export default function GridDAW() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // THE DATA: A 2D Array (Rows x Steps)
  // true = Note On, false = Note Off
  const [grid, setGrid] = useState(
    ROWS.map(() => Array(STEPS).fill(false))
  );

  const synthRef = useRef<Tone.FMSynth | null>(null);

  // Toggle a note on/off
  const toggleNote = (rowIndex: number, stepIndex: number) => {
    const newGrid = [...grid];
    newGrid[rowIndex][stepIndex] = !newGrid[rowIndex][stepIndex];
    setGrid(newGrid);
  };

  const startStop = async () => {
    if (isPlaying) {
      // STOP
      Tone.getTransport().stop();
      Tone.getTransport().cancel(); // Clear the schedule
      setCurrentStep(0);
      setIsPlaying(false);
    } else {
      // START
      await Tone.start();
      setCurrentStep(0);
      
      // Setup Synth
      if (!synthRef.current) {
          synthRef.current = new Tone.FMSynth().toDestination();
      }

      Tone.getTransport().bpm.value = 480;
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      Tone.getTransport().position = 0;

      // --- THE "CHECKER" LOGIC ---
      // Instead of scheduling specific notes, we schedule a "Check" every step
      Tone.getTransport().scheduleRepeat((time) => {
        
        // 1. Calculate which step we are on (0 to 15)
        // We use the Draw class to update the UI safely
        Tone.getDraw().schedule(() => {
          setCurrentStep((prev) => (prev + 1) % STEPS);
        }, time);

        // 2. "Look" at the grid arrays for the current step
        // We need the step index relative to the getTransport()
        // (Math.floor logic effectively "scans" the timeline)
        const step = Math.floor(Tone.getTransport().seconds / Tone.Time("4n").toSeconds()) % STEPS;

        // 3. Loop through our rows (Tracks)
        grid.forEach((row, rowIndex) => {
          // CHECK: Is there a note in this array slot?
          if (row[step] && synthRef.current) {
            const note = ROWS[rowIndex];
            synthRef.current.triggerAttackRelease(note, "8n", time);
          }
        });

      }, "4n"); // Run this check every Quarter Note

      Tone.getTransport().start();
      setIsPlaying(true);
    }
  };

  return (
    <div className="h-screen w-screen bg-zinc-900 text-white font-sans flex flex-col overflow-hidden">
      {/* CONTROLS */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-700">
        <button 
          onClick={startStop}
          className={`px-8 py-3 rounded font-bold transition ${
              isPlaying ? "bg-red-500 hover:bg-red-400" : "bg-green-500 hover:bg-green-400"
          }`}
        >
          {isPlaying ? "STOP" : "PLAY"}
        </button>
      </div>

      {/* THE GRID CONTAINER - Takes up remaining space */}
      <div className="flex-1 bg-black overflow-auto p-4">
        {/* Render Each Row (Track) */}
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center mb-px">
            {/* Row Label */}
            <div className="w-16 text-zinc-500 font-bold text-xs flex-shrink-0">{ROWS[rowIndex]}</div>

            {/* Render Each Step (The "Array Slots") */}
            <div className="flex">
              {row.map((isActive, stepIndex) => {
                // Determine color
                const isCurrent = isPlaying && (currentStep - 1) === stepIndex;
                let bgClass = "bg-zinc-800"; // Default Empty
                if (isActive) bgClass = "bg-blue-500"; // Note is active
                if (isCurrent) bgClass = "bg-white"; // Playhead is here!
                if (isActive && isCurrent) bgClass = "bg-blue-300"; // Playing Active Note

                return (
                  <div
                    key={stepIndex}
                    onClick={() => toggleNote(rowIndex, stepIndex)}
                    className={`
                      border border-zinc-700 cursor-pointer transition-all duration-75
                      hover:border-zinc-500
                      ${bgClass}
                    `}
                    style={{ width: '1.5rem', height: '1.5rem' }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}