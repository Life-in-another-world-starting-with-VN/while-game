import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

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

const DEFAULT_MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const DEFAULT_DETECTION_INTERVAL = 500;

export interface EmotionExpression {
  label: string;
  confidence: number;
}

interface UseEmotionDetectionOptions {
  detectionInterval?: number;
  modelUrl?: string;
}

export function useEmotionDetection(
  options: UseEmotionDetectionOptions = {}
) {
  const { detectionInterval = DEFAULT_DETECTION_INTERVAL, modelUrl = DEFAULT_MODEL_URL } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expression, setExpression] = useState<EmotionExpression | null>(null);
  const isProcessingRef = useRef(false);
  const resumePlaybackCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;
    let detectionIntervalId: ReturnType<typeof setInterval> | null = null;

    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
        ]);
      } catch {
        throw new Error('감정 분석 모델을 불러오는 중 문제가 발생했습니다.');
      }
    }

    async function initVideo() {
      if (!videoRef.current) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('카메라를 지원하지 않는 환경입니다.');
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise.catch(() => {
            if (typeof document === 'undefined') {
              return;
            }
            const handler = () => {
              if (!videoRef.current) return;
              videoRef.current.play().catch(() => undefined);
            };
            document.addEventListener('click', handler, { once: true });
            resumePlaybackCleanupRef.current = () => {
              document.removeEventListener('click', handler);
              resumePlaybackCleanupRef.current = null;
            };
          });
        }
      } catch {
        throw new Error('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      }
    }

    async function detectExpression() {
      const video = videoRef.current;
      if (!video || !isMounted || video.readyState < 2) {
        return;
      }
      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;
      try {
        const detection = await faceapi
          .detectSingleFace(
            video,
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
        detectionIntervalId = setInterval(detectExpression, detectionInterval);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
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
      if (detectionIntervalId) {
        clearInterval(detectionIntervalId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (resumePlaybackCleanupRef.current) {
        resumePlaybackCleanupRef.current();
      }
    };
  }, [detectionInterval, modelUrl]);

  return {
    videoRef,
    isLoading,
    error,
    expression,
  };
}
