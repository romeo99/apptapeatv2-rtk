import { Calculator } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface KeypadButtonProps {
  restaurantId: string | undefined;
  isRegisterMode: boolean;
  onShowKeypad: () => void;
}

interface ButtonPosition {
  x: number;
  y: number;
}

export default function KeypadButton({ restaurantId, isRegisterMode, onShowKeypad }: KeypadButtonProps) {
  const [buttonPosition, setButtonPosition] = useState({ x: -1, y: -1 });
  const [containerWidth, setContainerWidth] = useState(window.innerWidth * (isRegisterMode ? 0.666 : 1));
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMoving, setIsMoving] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();

  // Load saved position
  useEffect(() => {
    async function loadPosition() {
      if (!restaurantId || isInitialized) return;

      try {
        const savedPosition = await getButtonPosition(restaurantId);
        const width = isRegisterMode ? window.innerWidth * 0.666 : window.innerWidth;

        const position = savedPosition ? {
          x: Math.min(Math.max(0, savedPosition.x), width - 56),
          y: Math.min(Math.max(0, savedPosition.y), window.innerHeight - 56)
        } : {
          x: width - 100,
          y: window.innerHeight - 200
        };

        setButtonPosition(position);
        lastPosition.current = position;
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading button position:', error);
        // Set default position on error
        const width = isRegisterMode ? window.innerWidth * 0.666 : window.innerWidth;
        const defaultPosition = {
          x: width - 100,
          y: window.innerHeight - 200
        };
        setButtonPosition(defaultPosition);
        lastPosition.current = defaultPosition;
        setIsInitialized(true);
      }
    }
    loadPosition();
  }, [restaurantId, isRegisterMode, isInitialized]);

  // Debounced save position
  const savePosition = useCallback(async (position: { x: number; y: number }) => {
    try {
      if (!restaurantId) return;
      if (!isInitialized) return;

      // Validate position before saving
      const width = isRegisterMode ? window.innerWidth * 0.666 : window.innerWidth;
      const validPosition = {
        x: Math.min(Math.max(0, position.x), width - 56),
        y: Math.min(Math.max(0, position.y), window.innerHeight - 56)
      };

      await saveButtonPosition(restaurantId, validPosition);
    } catch (error) {
      console.error('Error saving button position:', error);
    }
  }, [restaurantId, isRegisterMode, isInitialized]);

  // Update container width when register mode changes
  useEffect(() => {
    const width = window.innerWidth - (isRegisterMode ? window.innerWidth * 0.333 : 0);
    setContainerWidth(width);

    // Adjust button position with animation when mode changes
    if (buttonPosition.x > width - 56) {
      const newX = Math.min(buttonPosition.x, width - 56);
      smoothMove(newX, buttonPosition.y);
    }
  }, [isRegisterMode, buttonPosition.x, buttonPosition.y]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  const smoothMove = (targetX: number, targetY: number) => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    const animate = () => {
      const currentX = lastPosition.current.x;
      const currentY = lastPosition.current.y;

      const dx = targetX - currentX;
      const dy = targetY - currentY;

      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        lastPosition.current = { x: targetX, y: targetY };
        setButtonPosition({ x: targetX, y: targetY });
        setIsMoving(false);
        return;
      }

      lastPosition.current = {
        x: currentX + dx * 0.3,
        y: currentY + dy * 0.3
      };

      setButtonPosition(lastPosition.current);
      animationFrame.current = requestAnimationFrame(animate);
    };

    lastPosition.current = buttonPosition;
    setIsMoving(true);
    animationFrame.current = requestAnimationFrame(animate);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setIsDragging(true);
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) {
      if (touchStartPos.current) {
        const touch = e.touches[0];
        const moveX = Math.abs(touch.clientX - touchStartPos.current.x);
        const moveY = Math.abs(touch.clientY - touchStartPos.current.y);
        if (moveX > 10 || moveY > 10) {
          clearTimeout(longPressTimer.current);
          setIsDragging(true);
        }
      }
      return;
    }

    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const containerOffset = isRegisterMode ? window.innerWidth * 0.333 : 0;
    const adjustedX = touch.clientX - containerOffset;
    const x = Math.max(0, Math.min(adjustedX - dragOffsetRef.current.x, containerWidth - 56));
    const y = Math.max(0, Math.min(touch.clientY - dragOffsetRef.current.y, window.innerHeight - 56));
    smoothMove(x, y);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    touchStartPos.current = null;
    setIsLongPress(false);
    setIsDragging(false);
    setIsMoving(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    // Save final position
    savePosition(lastPosition.current);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);

      // Create a transparent drag image
      const dragImg = document.createElement('div');
      dragImg.style.opacity = '0';
      document.body.appendChild(dragImg);
      e.dataTransfer.setDragImage(dragImg, 0, 0);
      setTimeout(() => document.body.removeChild(dragImg), 0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore invalid positions

    const adjustedX = e.clientX - (isRegisterMode ? window.innerWidth * 0.333 : 0);
    const x = Math.max(0, Math.min(adjustedX - dragOffsetRef.current.x, containerWidth - 56));
    const y = Math.max(0, Math.min(e.clientY - dragOffsetRef.current.y, window.innerHeight - 56));

    smoothMove(x, y);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsMoving(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    // Save final position
    savePosition(lastPosition.current);
  };

  // Pour importer de manière dynamique, on doit le déclarer ici
  const getButtonPosition = async (restaurantId: string): Promise<ButtonPosition | null> => {
    try {
      // Importer dynamiquement pour éviter les erreurs circulaires
      const { getButtonPosition } = await import('../../../services/uiPreferencesService');
      return getButtonPosition(restaurantId);
    } catch (error) {
      console.error('Error importing getButtonPosition:', error);
      return null;
    }
  };

  const saveButtonPosition = async (restaurantId: string, position: ButtonPosition): Promise<void> => {
    try {
      // Importer dynamiquement pour éviter les erreurs circulaires
      const { saveButtonPosition } = await import('../../../services/uiPreferencesService');
      return saveButtonPosition(restaurantId, position);
    } catch (error) {
      console.error('Error importing saveButtonPosition:', error);
    }
  };

  return (
    <button
      ref={buttonRef}
      style={{
        position: 'fixed',
        left: buttonPosition.x,
        top: buttonPosition.y,
        touchAction: 'none',
        transition: isMoving ? 'none' : 'transform 0.2s',
        zIndex: 50,
        opacity: isLongPress ? 0.7 : 1,
        transform: isLongPress ? 'scale(1.1)' : 'scale(1)'
      }}
      onClick={isDragging ? undefined : onShowKeypad}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all"
    >
      <Calculator className="h-6 w-6 text-white" />
    </button>
  );
}