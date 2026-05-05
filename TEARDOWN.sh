#!/bin/bash
# ── 1. Delete CloudFormation stacks ──────────────────────────────────────────
aws cloudformation delete-stack --stack-name vocmap-todo-service-dev
aws cloudformation delete-stack --stack-name vocmap-keyword-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-todo-service-dev
aws cloudformation wait stack-delete-complete --stack-name vocmap-keyword-service-dev

# ── 2. Remove service directories from your project ──────────────────────────
# Run from the vocmap project root:
# rm -rf services/todo-service
# rm -rf services/keyword-service

# ── 3. Remove frontend files ──────────────────────────────────────────────────
# Run from frontend/src:
# rm -rf components/todo
# rm -rf components/keyword
# rm -f  hooks/useSelectedTodo.ts
# rm -f  hooks/useTodoForm.ts
# rm -f  pages/TodosPage.tsx
# rm -f  services/todo.service.ts
# rm -f  services/keyword.service.ts
# rm -f  store/slices/selected-todo.slice.ts
# rm -f  store/slices/keyword-filter.slice.ts
# rm -f  viewmodels/todo.viewmodel.ts

# ── 4. Remove from .env.local ─────────────────────────────────────────────────
# Delete these two lines:
# VITE_API_TODO_URL=...
# VITE_API_KEYWORD_URL=...
