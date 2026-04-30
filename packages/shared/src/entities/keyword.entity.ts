export interface KeywordEntity {
  keywordId: string;
  todoId: string;
  userId: string;
  label: string;
  color?: string; // hex color for UI badge
  createdAt: string;
}
