import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as faceapi from 'face-api.js';

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  background: linear-gradient(180deg, #f2fbff 0%, #fff5f7 100%);
  padding: 40px 16px;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 32px;
  color: #27344f;
  margin: 0;
  text-align: center;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: min(640px, 100%);
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(39, 52, 79, 0.25);
  background: #000;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`;

const StatusCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 28px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 30px rgba(39, 52, 79, 0.15);
  color: #27344f;
  min-width: 260px;
`;

const StatusLabel = styled.span`
  font-size: 20px;
  font-weight: 600;
`;

const Confidence = styled.span`
  font-size: 16px;
  color: #5d6f92;
`;

const Hint = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: #5d6f92;
  text-align: center;
  margin: 0;
  max-width: 560px;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 129, 0.15);
  border: 1px solid rgba(255, 107, 129, 0.4);
  border-radius: 16px;
  padding: 12px 18px;
  color: #c44569;
  font-size: 14px;
  max-width: 480px;
  text-align: center;
`;

type ExpressionKey =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised';

const EXPRESSION_LABEL: Record<ExpressionKey, string> = {
  neutral: '무표정',
  happy: '행복',
  sad: '슬픔',
  angry: '분노',
  fearful: '두려움',
  disgusted: '혐오',
  surprised: '놀람',
};

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const DETECTION_INTERVAL = 500;

function EmotionPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expression, setExpression] = useState<{ label: string; confidence: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;
    let detectionInterval: ReturnType<typeof setInterval> | null = null;
    const isProcessingRef = { current: false };

    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
      } catch {
        throw new Error('감정 분석 모델을 불러오는 중 문제가 발생했습니다.');
      }
    }

    async function initVideo() {
      if (!videoRef.current) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        throw new Error('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      }
    }

    async function detectExpression() {
      const videoEl = videoRef.current;
      if (!videoEl || !isMounted || videoEl.readyState < 2) {
        return;
      }

      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;

      try {
        const detection = await faceapi
          .detectSingleFace(
            videoEl,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          )
          .withFaceExpressions();

        if (!detection || !detection.expressions) {
          setExpression(null);
          return;
        }

        const sorted = detection.expressions.asSortedArray();
        if (sorted.length === 0) {
          setExpression(null);
          return;
        }

        const topExpression = sorted[0];
        const label =
          EXPRESSION_LABEL[topExpression.expression as ExpressionKey] ?? topExpression.expression;
        setExpression({
          label,
          confidence: Math.round(topExpression.probability * 100),
        });
      } finally {
        isProcessingRef.current = false;
      }
    }

    async function setup() {
      try {
        setError(null);
        setIsLoading(true);
        await loadModels();
        await initVideo();

        if (!isMounted) return;

        detectionInterval = setInterval(detectExpression, DETECTION_INTERVAL);
      } catch (setupError) {
        if (setupError instanceof Error) {
          setError(setupError.message);
        } else {
          setError('알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setup();

    return () => {
      isMounted = false;
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <PageContainer>
      <Title>지금 당신의 감정은?</Title>
      <VideoWrapper>
        <Video ref={videoRef} autoPlay muted playsInline />
      </VideoWrapper>

      <StatusCard>
        <StatusLabel>
          {isLoading
            ? '감정 분석 준비 중...'
            : expression
              ? `현재 상태: ${expression.label}`
              : '얼굴을 화면에 맞춰주세요'}
        </StatusLabel>
        {!isLoading && expression && (
          <Confidence>신뢰도 {expression.confidence}%</Confidence>
        )}
      </StatusCard>

      <Hint>
        카메라 권한을 허용하고 얼굴을 화면 정면에 맞춰주세요. 데이터는 전송되지 않고 브라우저 안에서만
        분석됩니다.
      </Hint>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </PageContainer>
  );
}

export default EmotionPage;
