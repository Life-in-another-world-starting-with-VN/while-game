import React from 'react';
import { DialogueBoxContainer, CharacterName, DialogueText, LoadingDots } from './styled';

interface DialogueBoxProps {
  characterName: string;
  characterColor?: string;
  text: string;
  onClick?: () => void;
  isLoading?: boolean;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
  characterName,
  characterColor,
  text,
  onClick,
  isLoading = false,
}) => {
  return (
    <DialogueBoxContainer onClick={onClick}>
      <CharacterName color={characterColor}>
        {characterName}
        {isLoading && (
          <LoadingDots>
            <span />
            <span />
            <span />
          </LoadingDots>
        )}
      </CharacterName>
      <DialogueText>{text}</DialogueText>
    </DialogueBoxContainer>
  );
};

export default DialogueBox;
