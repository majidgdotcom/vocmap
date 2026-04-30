import { AddKeywordsInput, KeywordEntity } from '@vocmap/shared';

import { KeywordDomain } from '../domain/keyword.domain';
import { IKeywordRepository } from './keyword.repository.interface';

export class KeywordUseCases {
  constructor(private readonly repo: IKeywordRepository) {}

  async addKeywords(
    userId: string,
    todoId: string,
    input: AddKeywordsInput,
  ): Promise<KeywordEntity[]> {
    const keywords = KeywordDomain.createMany({
      todoId,
      userId,
      keywords: input.keywords,
    });

    const saved = await this.repo.addMany(keywords);

    // Keep todo.keywordIds in sync — fetch current list then merge
    const existing = await this.repo.findByTodo(todoId, userId);
    const allIds = [...new Set(existing.map((k) => k.keywordId))];
    await this.repo.syncTodoKeywordIds(userId, todoId, allIds);

    return saved;
  }

  async getKeywords(userId: string, todoId: string): Promise<KeywordEntity[]> {
    return this.repo.findByTodo(todoId, userId);
  }

  async deleteKeyword(userId: string, todoId: string, keywordId: string): Promise<void> {
    const keyword = await this.repo.findById(userId, todoId, keywordId);
    if (!keyword) throw new KeywordNotFoundError(keywordId);
    KeywordDomain.assertOwnership(keyword, userId);

    await this.repo.delete(userId, todoId, keywordId);

    // Sync keywordIds on todo
    const remaining = await this.repo.findByTodo(todoId, userId);
    await this.repo.syncTodoKeywordIds(
      userId,
      todoId,
      remaining.map((k) => k.keywordId),
    );
  }
}

export class KeywordNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(keywordId: string) {
    super(`Keyword ${keywordId} not found`);
    this.name = 'KeywordNotFoundError';
  }
}
