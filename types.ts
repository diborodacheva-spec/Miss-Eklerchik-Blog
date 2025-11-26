
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  imageUrl: string;
  readTime: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  secondaryImageUrl?: string;
  secondaryImageAlt?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum ViewState {
  HOME = 'HOME',
  ARTICLE = 'ARTICLE',
  ABOUT = 'ABOUT'
}
