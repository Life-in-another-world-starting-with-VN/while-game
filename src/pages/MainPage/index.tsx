import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LogoBlock from './components/LogoBlock';
import MenuButton from './components/MenuButton';
import Icon from './components/Icon';
import {
  Content,
  BackgroundImage,
  Overlay,
  HeroCard,
  HeroTitle,
  HeroDescription,
  HeroHighlights,
  HighlightCard,
  HighlightLabel,
  HighlightValue,
  HeroActions,
  PrimaryAction,
  SecondaryAction,
  HeroEyebrow,
} from './components/CharacterDisplay';
import Play from '../../assets/MainBtnicon/play.svg';
import Option from '../../assets/MainBtnicon/option.svg';
import Exit from '../../assets/MainBtnicon/exit.svg';
import startBg from '../../assets/start-bg.png';
import { PageContainer } from './styled';
import ExitModal from './components/ExitModal';
import { useAuth } from '../../hooks/useAuth';

function MainPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <PageContainer>
      <Sidebar>
        <LogoBlock />
        <MenuButton onClick={() => handleNavigate('/Game')}>
          <Icon src={Play} /> 게임 시작
        </MenuButton>
        <MenuButton onClick={() => handleNavigate('/Settings')}>
          <Icon src={Option} /> 설정
        </MenuButton>
        <MenuButton onClick={handleLogoutClick}>
          <Icon src={Exit} /> 로그아웃
        </MenuButton>
      </Sidebar>
      <Content>
        <BackgroundImage src={startBg} alt="게임 시작 배경" />
        <Overlay />
        <HeroCard>
          <HeroEyebrow>오늘의 여정</HeroEyebrow>
          <HeroTitle>다시 플레이하는 지루함에서 벗어나세요</HeroTitle>
          <HeroDescription>
            실시간 감정 감지와 선택 기반 전개가 결합된 WHILE에서 나만의 스토리를 만들어 보세요.
            마지막으로 플레이 했던 장면부터 바로 이어서 플레이할 수 있습니다.
          </HeroDescription>
          <HeroHighlights>
            <HighlightCard>
              <HighlightLabel>핵심 기능</HighlightLabel>
              <HighlightValue>실시간 감정 인식</HighlightValue>
            </HighlightCard>
            <HighlightCard>
              <HighlightLabel>플레이 스타일</HighlightLabel>
              <HighlightValue>선택지 기반 전개</HighlightValue>
            </HighlightCard>
            <HighlightCard>
              <HighlightLabel>환경 설정</HighlightLabel>
              <HighlightValue>완전 맞춤화 지원</HighlightValue>
            </HighlightCard>
          </HeroHighlights>
          <HeroActions>
            <PrimaryAction type="button" onClick={() => handleNavigate('/Game')}>
              지금 플레이
            </PrimaryAction>
            <SecondaryAction type="button" onClick={() => handleNavigate('/Settings')}>
              환경설정 바로가기
            </SecondaryAction>
          </HeroActions>
        </HeroCard>
      </Content>
      <ExitModal
        isOpen={isLogoutModalOpen}
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </PageContainer>
  );
}

export default MainPage;
