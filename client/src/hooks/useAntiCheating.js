import { useEffect } from 'react';

const useAntiCheating = (isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    // ✨ FIX: This function now simulates a left-click instead of showing an alert.
    const handleContextMenu = (e) => {
      // Prevent the default right-click menu from appearing.
      e.preventDefault();

      // Find the element that was right-clicked.
      const targetElement = e.target;

      // Programmatically trigger a 'click' event on that element.
      // This will cause buttons, radio inputs, etc., to behave as if they were left-clicked.
      if (targetElement && typeof targetElement.click === 'function') {
        targetElement.click();
      }
    };

    // Prevent keyboard shortcuts for developer tools and copy/paste
    const handleKeyDown = (e) => {
      // Block F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        alert("Developer tools are disabled during the test.");
      }
      // Block Ctrl+Shift+I (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        alert("Developer tools are disabled during the test.");
      }
      // Block Cmd+Option+I (Mac)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        alert("Developer tools are disabled during the test.");
      }
      // Block Ctrl+C (Copy), Ctrl+V (Paste), Ctrl+X (Cut)
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        alert("Copy/Paste/Cut actions are disabled.");
      }
      // Block Cmd+C, Cmd+V, Cmd+X (Mac)
       if (e.metaKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        alert("Copy/Paste/Cut actions are disabled.");
      }
    };
    
    // Prevent clipboard events directly
    const handleClipboardEvents = (e) => {
        e.preventDefault();
        alert("Copy/Paste/Cut actions are disabled.");
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleClipboardEvents);
    document.addEventListener('paste', handleClipboardEvents);
    document.addEventListener('cut', handleClipboardEvents);

    // Cleanup function to remove event listeners when the component unmounts
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleClipboardEvents);
      document.removeEventListener('paste', handleClipboardEvents);
      document.removeEventListener('cut', handleClipboardEvents);
    };
  }, [isActive]);
};

export default useAntiCheating;
