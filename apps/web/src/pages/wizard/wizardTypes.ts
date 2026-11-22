import type { CoverStyle } from '@daftar/shared';
import type { CoverCropValue, CoverElementsVisibility } from '@/components/notebook';

export interface WizardGraduateInfo {
  fullName: string;
  institution: string;
  major: string;
  graduationYear: number;
  graduationDate?: string;
  shortMessage?: string;
}

export interface WizardCoverState {
  sourceType: 'template' | 'custom';
  templateSlug?: string;
  templateImageUrl?: string;
  customImageUrl?: string;
  quote: string;
  elements: CoverElementsVisibility;
  overlayOpacity: number;
  crop?: CoverCropValue;
  style?: CoverStyle;
}

export interface WizardState {
  notebookId: string | null;
  graduateId: string | null;
  slug: string | null;
  notebookType: 'individual' | 'class';
  themeSlug: string | null;
  themeCategorySlug: string | null;
  graduate: WizardGraduateInfo;
  cover: WizardCoverState;
  packageId: string | null;
}

export const WIZARD_STEPS = ['info', 'cover-style', 'cover-customize', 'preview', 'package'] as const;
export type WizardStepId = (typeof WIZARD_STEPS)[number];
