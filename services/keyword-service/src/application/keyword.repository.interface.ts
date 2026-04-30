import { KeywordEntity } from '@vocmap/shared';

export interface IKeywordRepository {
  addMany(keywords: KeywordEntity[]): Promise<KeywordEntity[]>;
  findByTodo(todoId: string, userId: string): Promise<KeywordEntity[]>;
  findById(userId: string, todoId: string, keywordId: string): Promise<KeywordEntity | null>;
  delete(userId: string, todoId: string, keywordId: string): Promise<void>;
  /** Update the keywordIds array on the parent Todo item (transactionally). */
  syncTodoKeywordIds(
    userId: string,
    todoId: string,
    keywordIds: string[],
  ): Promise<void>;
}
