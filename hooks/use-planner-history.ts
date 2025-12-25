import { useState, useCallback, useRef, useEffect } from "react";
import type { Arc } from "@/types";

export const usePlannerHistory = (initialArcs: Arc[] = []) => {
  const [arcs, setArcs] = useState<Arc[]>(initialArcs);
  const [history, setHistory] = useState<Arc[][]>([initialArcs]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyIndexRef = useRef(0);
  const arcsRef = useRef(arcs);

  useEffect(() => {
    arcsRef.current = arcs;
  }, [arcs]);

  const addToHistory = useCallback((newArcs: Arc[]) => {
    const arcsToAdd = [...newArcs];
    setHistory((prevHistory) => {
      const currentIndex = historyIndexRef.current;
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(arcsToAdd);
      const newIndex = newHistory.length - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      return newHistory;
    });
    setArcs(arcsToAdd);
  }, []);

  const undo = useCallback(() => {
    setHistory((prevHistory) => {
      const currentIndex = historyIndexRef.current;
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setArcs([...prevHistory[newIndex]]);
      }
      return prevHistory;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prevHistory) => {
      const currentIndex = historyIndexRef.current;
      if (currentIndex < prevHistory.length - 1) {
        const newIndex = currentIndex + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setArcs([...prevHistory[newIndex]]);
      }
      return prevHistory;
    });
  }, []);

  const setArcsDirectly = useCallback((newArcs: Arc[]) => {
    setArcs([...newArcs]);
  }, []);

  return {
    arcs,
    setArcs: setArcsDirectly,
    addToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
