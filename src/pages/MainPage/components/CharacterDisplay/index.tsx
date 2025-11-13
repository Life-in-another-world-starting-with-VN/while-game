import styled from 'styled-components';

export const Content = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(2.5rem, 6vw, 4rem) clamp(2rem, 7vw, 6rem);
  overflow: hidden;
  color: #10223d;
`;

export const BackgroundImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(110%) brightness(0.75);
  transform: scale(1.05);
`;

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    rgba(16, 34, 61, 0.6) 0%,
    rgba(16, 34, 61, 0.35) 45%,
    rgba(255, 255, 255, 0.55) 100%
  );
`;

export const HeroCard = styled.div`
  position: relative;
  max-width: 560px;
  width: 100%;
  padding: clamp(2.5rem, 5vw, 3.75rem);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 26px 60px rgba(16, 34, 61, 0.25);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3vw, 1.8rem);
  z-index: 1;

  @media (max-width: 768px) {
    padding: 2.25rem;
    border-radius: 26px;
    gap: 1.5rem;
  }
`;

export const HeroEyebrow = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.18rem;
  text-transform: uppercase;
  color: rgba(16, 34, 61, 0.55);
`;

export const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2.2rem, 2.8vw, 3.15rem);
  line-height: 1.1;
  color: #0c1c3f;
  text-align: center;
`;

export const HeroDescription = styled.p`
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(16, 34, 61, 0.78);
`;

export const HeroHighlights = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

export const HighlightCard = styled.div`
  padding: 1rem 1.2rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(16, 34, 61, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const HighlightLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15rem;
  text-transform: uppercase;
  color: rgba(16, 34, 61, 0.5);
`;

export const HighlightValue = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: #0c1c3f;
`;

export const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const actionButtonBase = `
  padding: 0.9rem 1.9rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
`;

export const PrimaryAction = styled.button`
  ${actionButtonBase}
  color: #ffffff;
  background: linear-gradient(90deg, #627bff 0%, #8e9dff 100%);
  box-shadow: 0 18px 34px rgba(78, 97, 255, 0.35);
  border: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 22px 40px rgba(78, 97, 255, 0.43);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 12px 26px rgba(78, 97, 255, 0.32);
  }
`;

export const SecondaryAction = styled.button`
  ${actionButtonBase}
  color: #0c1c3f;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(12, 28, 63, 0.14);
  box-shadow: 0 16px 30px rgba(16, 34, 61, 0.16);

  &:hover {
    background: rgba(255, 255, 255, 0.96);
    transform: translateY(-1px);
    box-shadow: 0 20px 34px rgba(16, 34, 61, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 12px 24px rgba(16, 34, 61, 0.15);
  }
`;
