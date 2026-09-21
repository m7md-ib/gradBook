export interface NotebookStats {
  totalMessages: number;
  pendingMessages: number;
  approvedMessages: number;
  totalVisitors: number;
  qrScans: number;
  shareClicks: number;
  mostActiveDay: string | null;
}

export interface JwtAccessPayload {
  sub: string;
  role: 'graduate' | 'admin';
  email: string;
}

export interface StoredFile {
  key: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}
