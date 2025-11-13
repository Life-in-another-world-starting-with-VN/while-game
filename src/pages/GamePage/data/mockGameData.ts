import type { Character, Scene, MenuItem } from '../../../types/game';
import char1 from '../../../assets/MainCharacter/char1.png';
import char2 from '../../../assets/MainCharacter/char2.png';
import char3 from '../../../assets/MainCharacter/char3.png';

// 캐릭터 목 데이터
export const mockCharacters: Record<string, Character> = {
  unknown: {
    id: 'unknown',
    name: 'unknown',
    displayName: '???',
    color: '#fca1c7', // theme.colors.main
    sprite: char1,
  },
  protagonist: {
    id: 'protagonist',
    name: 'protagonist',
    displayName: '주인공',
    color: '#ffffff',
    sprite: char2,
  },
  friend: {
    id: 'friend',
    name: 'friend',
    displayName: '친구',
    color: '#fcbec2', // theme.colors.sub2
    sprite: char3,
  },
  narrator: {
    id: 'narrator',
    name: 'narrator',
    displayName: '나레이터',
    color: '#ffffff',
    // sprite 없음 - 캐릭터 이미지 표시 안됨
  },
};

// 씬 목 데이터
export const mockScenes: Record<string, Scene> = {
  intro: {
    id: 'intro',
    backgroundImage: undefined, // 검은 배경
    dialogues: [
      {
        id: 'intro_1',
        characterId: 'unknown',
        text: '게임이 시작되었습니다.',
      },
      {
        id: 'intro_2',
        characterId: 'unknown',
        text: '이곳은 어디일까요?',
      },
      {
        id: 'intro_3',
        characterId: 'protagonist',
        text: '...눈을 떴다.',
      },
    ],
    choices: [
      {
        id: 'choice_1',
        text: '주변을 둘러본다 (캐릭터 있음)',
        nextSceneId: 'scene_1',
      },
      {
        id: 'choice_2',
        text: '일어서려고 시도한다 (캐릭터 있음)',
        nextSceneId: 'scene_2',
      },
      {
        id: 'choice_3',
        text: '내레이션만 (캐릭터 없음)',
        nextSceneId: 'scene_narration',
      },
    ],
  },
  scene_1: {
    id: 'scene_1',
    backgroundImage: 'https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileImageView.do?wrtSn=11288686&filePath=L2Rpc2sxL25ld2RhdGEvMjAxNS8wMi9DTFM2OS9OVVJJXzAwMV8wMTcyX251cmltZWRpYV8yMDE1MTIwMw==&thumbAt=Y&thumbSe=b_tbumb&wrtTy=10006', // 배경 1
    dialogues: [
      {
        id: 'scene1_1',
        characterId: 'protagonist',
        text: '천천히 주변을 살펴보았다.',
      },
      {
        id: 'scene1_2',
        characterId: 'friend',
        text: '어? 깨어났구나!',
      },
      {
        id: 'scene1_3',
        characterId: 'protagonist',
        text: '너는...?',
      },
    ],
    nextSceneId: 'scene_2',
  },
  scene_2: {
    id: 'scene_2',
    backgroundImage: 'https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileImageView.do?wrtSn=11288686&filePath=L2Rpc2sxL25ld2RhdGEvMjAxNS8wMi9DTFM2OS9OVVJJXzAwMV8wMTcyX251cmltZWRpYV8yMDE1MTIwMw==&thumbAt=Y&thumbSe=b_tbumb&wrtTy=10006', // 배경 2
    dialogues: [
      {
        id: 'scene2_1',
        characterId: 'protagonist',
        text: '몸을 일으키려 했지만...',
      },
      {
        id: 'scene2_2',
        characterId: 'protagonist',
        text: '아직 힘이 들어가지 않는다.',
      },
      {
        id: 'scene2_3',
        characterId: 'friend',
        text: '무리하지 마!',
      },
    ],
    choices: [
      {
        id: 'choice_continue',
        text: '계속하기',
        nextSceneId: 'scene_narration',
      },
      {
        id: 'choice_restart',
        text: '처음으로',
        nextSceneId: 'intro',
      },
    ],
  },
  scene_narration: {
    id: 'scene_narration',
    backgroundImage: 'https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileImageView.do?wrtSn=11288686&filePath=L2Rpc2sxL25ld2RhdGEvMjAxNS8wMi9DTFM2OS9OVVJJXzAwMV8wMTcyX251cmltZWRpYV8yMDE1MTIwMw==&thumbAt=Y&thumbSe=b_tbumb&wrtTy=10006',
    dialogues: [
      {
        id: 'narration_1',
        characterId: 'narrator',
        text: '이것은 내레이션입니다. 캐릭터 이미지가 표시되지 않습니다.',
      },
      {
        id: 'narration_2',
        characterId: 'narrator',
        text: '배경과 대사창만 표시되는 장면입니다.',
      },
      {
        id: 'narration_3',
        characterId: 'narrator',
        text: '자동 진행 테스트도 가능합니다.',
      },
    ],
    nextSceneId: 'scene_mixed',
  },
  scene_mixed: {
    id: 'scene_mixed',
    backgroundImage: 'https://gongu.copyright.or.kr/gongu/wrt/cmmn/wrtFileImageView.do?wrtSn=11288686&filePath=L2Rpc2sxL25ld2RhdGEvMjAxNS8wMi9DTFM2OS9OVVJJXzAwMV8wMTcyX251cmltZWRpYV8yMDE1MTIwMw==&thumbAt=Y&thumbSe=b_tbumb&wrtTy=10006',
    dialogues: [
      {
        id: 'mixed_1',
        characterId: 'narrator',
        text: '내레이션과 캐릭터가 섞인 장면입니다.',
      },
      {
        id: 'mixed_2',
        characterId: 'protagonist',
        text: '이제 캐릭터가 등장합니다!',
      },
      {
        id: 'mixed_3',
        characterId: 'friend',
        text: '다른 캐릭터로 전환!',
      },
      {
        id: 'mixed_4',
        characterId: 'narrator',
        text: '그리고 다시 내레이션으로...',
      },
    ],
    nextSceneId: 'intro',
  },
};

// 메뉴 아이템 목 데이터
export const mockMenuItems: MenuItem[] = [
  { id: 'dialogueLog', label: '대사록' },
  { id: 'skip', label: '넘기기' },
  { id: 'auto', label: '자동진행' },
  { id: 'settings', label: '설정' },
];

// 초기 게임 상태
export const mockInitialGameState = {
  currentSceneId: 'intro',
  currentDialogueIndex: 0,
  isAutoPlay: false,
  textSpeed: 5,
  autoPlaySpeed: 3000,
  history: [] as string[],
  flags: {},
};
