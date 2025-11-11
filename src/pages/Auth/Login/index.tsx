import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../../hooks/useAuth";
import { login as loginService } from "../../../services/authService";
import type { LoginRequest } from "../../../types/api-v2";

type FormData = {
  username: string;
  password: string;
};

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f4ff;
  padding: 32px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #101828;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: #475467;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #344054;
`;

const Input = styled.input`
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #d0d5dd;
  font-size: 16px;
  color: #101828;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #3478f6;
    box-shadow: 0 0 0 4px rgba(52, 120, 246, 0.15);
    outline: none;
  }

  &::placeholder {
    color: #98a2b3;
  }
`;

const SubmitButton = styled.button`
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #3478f6;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;

  &:hover {
    background: #2364d9;
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background: #98a2b3;
    cursor: not-allowed;
  }
`;

const Message = styled.p<{ $tone: "success" | "error" }>`
  margin: 0;
  font-size: 14px;
  color: ${({ $tone }) => ($tone === "success" ? "#039855" : "#d92d20")};
  background: ${({ $tone }) =>
    $tone === "success" ? "rgba(3, 152, 85, 0.1)" : "rgba(217, 45, 32, 0.12)"};
  border-radius: 12px;
  padding: 12px 14px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  font-size: 14px;
  color: #475467;
`;

const FooterLink = styled(Link)`
  margin-left: 6px;
  color: #3478f6;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

function LoginPage() {
  const [formData, setFormData] = useState<FormData>({ username: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const loginRequest: LoginRequest = {
        username: formData.username,
        password: formData.password,
      };

      const response = await loginService(loginRequest);

      if (!response.refresh_token) {
        setFeedback({
          type: "error",
          text: "서버에서 리프레시 토큰을 받지 못했습니다. 다시 시도해 주세요.",
        });
        return;
      }

      login({
        refreshToken: response.refresh_token,
        accessToken: response.access_token || null,
        user: null,
      });

      setFeedback({ type: "success", text: "로그인에 성공했습니다!" });
      setFormData({ username: "", password: "" });
      navigate("/", { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "로그인에 실패했습니다. 정보를 확인하고 다시 시도해 주세요.";
      setFeedback({ type: "error", text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <TitleBlock>
          <Title>로그인</Title>
          <Subtitle>계정으로 로그인하고 진행 상황을 이어가세요.</Subtitle>
        </TitleBlock>

        {feedback ? <Message $tone={feedback.type}>{feedback.text}</Message> : null}

        <Form onSubmit={handleSubmit}>
          <Field>
            사용자 이름
            <Input
              name="username"
              type="text"
              placeholder="닉네임을 입력하세요"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </Field>
          <Field>
            비밀번호
            <Input
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </Field>
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "처리 중..." : "로그인"}
          </SubmitButton>
        </Form>
        <Footer>
          아직 계정이 없으신가요?
          <FooterLink to="/register">회원가입</FooterLink>
        </Footer>
      </Card>
    </PageContainer>
  );
}

export default LoginPage;
