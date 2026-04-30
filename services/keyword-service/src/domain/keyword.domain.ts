import { v4 as uuidv4 } from 'uuid';

import { KeywordEntity } from '@vocmap/shared';

export class KeywordDomain {
  static create(params: {
    todoId: string;
    userId: string;
    label: string;
    color?: string;
  }): KeywordEntity {
    return {
      keywordId: uuidv4(),
      todoId: params.todoId,
      userId: params.userId,
      label: params.label.trim().toLowerCase(),
      color: params.color,
      createdAt: new Date().toISOString(),
    };
  }

  static createMany(params: {
    todoId: string;
    userId: string;
    keywords: Array<{ label: string; color?: string }>;
  }): KeywordEntity[] {
    return params.keywords.map((kw) =>
      KeywordDomain.create({ ...kw, todoId: params.todoId, userId: params.userId }),
    );
  }

  static assertOwnership(keyword: KeywordEntity, userId: string): void {
    if (keyword.userId !== userId) {
      throw new Error('FORBIDDEN: user does not own this keyword');
    }
  }
}
