export interface NotebookThemeStyle {
  paperColor: string;
  accentColor: string;
  inkColor: string;
  headingFont: string;
  bodyFont: string;
  coverGradientFrom: string;
  coverGradientTo: string;
}

export const FALLBACK_THEME: NotebookThemeStyle = {
  paperColor: '#FBF6EC',
  accentColor: '#B8905A',
  inkColor: '#2B241B',
  headingFont: 'Aref Ruqaa',
  bodyFont: 'Cairo',
  coverGradientFrom: '#F3E7D3',
  coverGradientTo: '#D9C09B',
};

export interface CoverElementsVisibility {
  showName: boolean;
  showMajor: boolean;
  showInstitution: boolean;
  showGraduationYear: boolean;
  showGraduationDate: boolean;
  showQuote: boolean;
}

export const DEFAULT_COVER_ELEMENTS: CoverElementsVisibility = {
  showName: true,
  showMajor: true,
  showInstitution: true,
  showGraduationYear: true,
  showGraduationDate: false,
  showQuote: true,
};

export type NotebookPageContent =
  | { kind: 'intro'; graduateName: string; institution: string; major: string; profilePhotoUrl: string | null; welcomeMessage: string | null; showProfilePhoto: boolean }
  | { kind: 'write-cta' }
  | {
      kind: 'message';
      id: string;
      authorName: string;
      body: string;
      relationship: string;
      reaction: string | null;
      photoUrl: string | null;
      featured: boolean;
      pageNumber: number | null;
    }
  | { kind: 'gallery-divider' }
  | { kind: 'gallery'; items: Array<{ id: string; imageUrl: string; caption: string | null }> }
  | { kind: 'timeline-divider' }
  | {
      kind: 'timeline';
      items: Array<{ id: string; title: string; description: string | null; date: string | null }>;
    }
  | { kind: 'end'; graduateName: string };
