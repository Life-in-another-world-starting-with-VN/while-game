/**
 * ErrorMessage Component
 * 
 * Displays user-friendly error messages with optional retry functionality
 */

import React from 'react';
import styled from 'styled-components';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorContainer = styled.div`
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ErrorText = styled.p`
  color: #c33;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.6;
  }
`;

const RetryButton = styled(Button)`
  background-color: #4a90e2;
  color: white;
`;

const DismissButton = styled(Button)`
  background-color: #ddd;
  color: #333;
`;

/**
 * ErrorMessage component for displaying user-friendly error messages
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  onDismiss,
  className,
}) => {
  return (
    <ErrorContainer className={className}>
      <ErrorText>{message}</ErrorText>
      {(onRetry || onDismiss) && (
        <ButtonContainer>
          {onRetry && (
            <RetryButton onClick={onRetry}>
              다시 시도
            </RetryButton>
          )}
          {onDismiss && (
            <DismissButton onClick={onDismiss}>
              닫기
            </DismissButton>
          )}
        </ButtonContainer>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessage;
