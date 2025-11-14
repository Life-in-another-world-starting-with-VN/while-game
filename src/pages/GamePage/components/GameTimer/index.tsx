import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface GameTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
}

const TimerContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const TimerText = styled.div<{ $isWarning: boolean }>`
  color: ${props => props.$isWarning ? '#ff6b6b' : '#ffffff'};
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  transition: color 0.3s ease;
`;

const GameTimer: React.FC<GameTimerProps> = ({ durationMinutes, onTimeUp }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onTimeUp]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isWarning = remainingSeconds <= 60; // 1분 이하일 때 경고

  return (
    <TimerContainer>
      <TimerText $isWarning={isWarning}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </TimerText>
    </TimerContainer>
  );
};

export default GameTimer;
