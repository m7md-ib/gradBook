import type {
  MessageStatus,
  NotebookStatus,
  NotebookType,
  NotebookVisibility,
  RelationshipType,
} from '@daftar/shared';

export interface Theme {
  slug: string;
  category: string;
  nameAr: string;
  nameEn: string;
  paperColor: string;
  accentColor: string;
  inkColor: string;
  headingFont: string;
  bodyFont: string;
  coverGradientFrom: string;
  coverGradientTo: string;
  active: boolean;
}

export interface CoverTemplate {
  id: string;
  slug: string;
  category: string;
  nameAr: string;
  nameEn: string;
  imageKey: string;
  thumbnailKey: string;
  imageUrl: string;
  thumbnailUrl: string;
  active: boolean;
  sortOrder: number;
}

export interface Package {
  id: string;
  tier: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  priceCents: number;
  currency: string;
  duration: string;
  maxGraduates: number;
  maxMessages: number | null;
  maxGalleryItems: number | null;
  features: string[];
  active: boolean;
  sortOrder: number;
}

export interface GraduateDto {
  id: string;
  notebookId: string;
  fullName: string;
  institution: string;
  major: string;
  graduationYear: number;
  graduationDate: string | null;
  profilePhotoKey: string | null;
  shortMessage: string | null;
  slug: string;
  sortOrder: number;
}

export interface CoverElements {
  showName: boolean;
  showMajor: boolean;
  showInstitution: boolean;
  showGraduationYear: boolean;
  showGraduationDate: boolean;
  showQuote: boolean;
}

export interface NotebookDto {
  id: string;
  ownerUserId: string;
  type: NotebookType;
  status: NotebookStatus;
  slug: string;
  title: string | null;
  themeSlug: string;
  coverSourceType: 'template' | 'custom';
  coverTemplateSlug: string | null;
  coverImageKey: string | null;
  coverImageUrl?: string | null;
  coverOverlayOpacity: string;
  coverQuote: string | null;
  coverElements: CoverElements;
  visibility: NotebookVisibility;
  accessCode: string | null;
  approvalMode: 'auto' | 'manual';
  allowPhotos: boolean;
  allowGallery: boolean;
  musicEnabled: boolean;
  musicTrackId: string | null;
  welcomeMessage: string | null;
  showProfilePhoto: boolean;
  packageTier: string | null;
  duration: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  graduates?: GraduateDto[];
  qrCode?: QrCodeDto | null;
}

export interface QrCodeDto {
  id: string;
  imageKey: string;
  imageUrl: string;
  scanCount: number;
}

export interface PublicGraduate {
  id: string;
  fullName: string;
  institution: string;
  major: string;
  graduationYear: number;
  graduationDate: string | null;
  shortMessage: string | null;
  slug: string;
  profilePhotoUrl: string | null;
}

export interface PublicNotebook {
  id: string;
  slug: string;
  type: NotebookType;
  status: NotebookStatus;
  title: string | null;
  themeSlug: string;
  coverImageUrl: string | null;
  coverTemplateSlug: string | null;
  coverQuote: string | null;
  coverElements: CoverElements;
  coverOverlayOpacity: number;
  visibility: NotebookVisibility;
  approvalMode: 'auto' | 'manual';
  allowPhotos: boolean;
  allowGallery: boolean;
  musicEnabled: boolean;
  musicTrackId: string | null;
  welcomeMessage: string | null;
  showProfilePhoto: boolean;
  expiresAt: string | null;
  graduates: PublicGraduate[];
  messageCount: number;
}

export interface ExpiredNotebookView {
  expired: true;
  title: string | null;
  graduateNames: string[];
}

export interface PublicMessage {
  id: string;
  authorName: string;
  body: string;
  relationship: RelationshipType;
  reaction: string | null;
  featured: boolean;
  pageNumber: number | null;
  targetGraduateId: string | null;
  createdAt: string;
  photoUrl: string | null;
}

export interface OwnerMessage extends PublicMessage {
  notebookId: string;
  status: MessageStatus;
  updatedAt: string;
}

export interface GalleryItemDto {
  id: string;
  notebookId: string;
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  submittedByName: string | null;
  approved: boolean;
  createdAt: string;
}

export interface TimelineItemDto {
  id: string;
  notebookId: string;
  type: string;
  title: string;
  description: string | null;
  date: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'graduate' | 'admin';
  locale: 'ar' | 'en';
  createdAt: string;
}

export interface NotebookStats {
  totalMessages: number;
  pendingMessages: number;
  approvedMessages: number;
  totalVisitors: number;
  qrScans: number;
  shareClicks: number;
  mostActiveDay: string | null;
}

export interface OrderDto {
  id: string;
  userId: string;
  notebookId: string;
  packageId: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
}

export interface CheckoutSessionDto {
  redirectUrl: string;
  providerReference: string;
  clientSecret?: string;
}

export interface ReportDto {
  id: string;
  notebookId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}
