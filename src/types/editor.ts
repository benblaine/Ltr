import type { ContentPack, Word, WordGroup } from './content.js';

export interface EditorState {
  pack: ContentPack;
  selectedWordId: string | null;
  selectedGroupId: string | null;
  isDirty: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type EditorView = 'pack' | 'word' | 'group';

export interface WordEditorProps {
  word: Word;
  onSave: (word: Word) => void;
  onCancel: () => void;
}

export interface GroupEditorProps {
  group: WordGroup;
  availableWords: Word[];
  onSave: (group: WordGroup) => void;
  onCancel: () => void;
}
