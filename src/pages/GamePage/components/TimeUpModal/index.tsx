import React from 'react';
import styled from 'styled-components';
import SurveyQR from '../../../../assets/QR.png'
interface TimeUpModalProps {
  isOpen: boolean;
  onRestart: () => void;
  onExit: () => void;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
const QRWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0 20px;
`;

const QRImage = styled.img`
  width: 140px;
  height: 140px;
  border-radius: 12px;
`;

const QRLabel = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: #555;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 2rem;
  color: #1a202c;
`;

const Message = styled.p`
  margin: 0 0 2.5rem 0;
  color: #4a5568;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${props =>
    props.variant === 'primary'
      ? `
    background: #667eea;
    color: white;
    &:hover {
      background: #5a67d8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  `
      : `
    background: #e2e8f0;
    color: #4a5568;
    &:hover {
      background: #cbd5e0;
    }
  `}

  &:active {
    transform: translateY(0);
  }
`;

const TimeUpModal: React.FC<TimeUpModalProps> = ({ isOpen, onRestart, onExit }) => {
  return (
    <ModalOverlay $isOpen={isOpen}>
      <ModalCard>
        <Icon>⏰</Icon>
        <Title>시연 시간 종료</Title>
        <Message>
          7분 시연 시간이 종료되었습니다.
          <br />
          새로운 게임을 시작하시겠습니까?
        </Message>


        <QRWrapper>
          <QRImage src={SurveyQR} alt="설문조사 QR 코드" />
          <QRLabel>시연이 끝났어요! 설문에 참여해주세요 🙏</QRLabel>
        </QRWrapper>

        <ButtonGroup>
          <Button variant="secondary" onClick={onExit}>
            나가기
          </Button>
          <Button variant="primary" onClick={onRestart}>
            새 게임 시작
          </Button>
        </ButtonGroup>
      </ModalCard>
    </ModalOverlay>
  );
};

export default TimeUpModal;
