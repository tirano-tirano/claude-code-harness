/**
 * 統合テストテンプレート
 *
 * このテンプレートを使用して、API Routeの統合テストを作成する。
 * ファイル名: [APIルート名].test.ts
 *
 * ★重要ポイント:
 * - 実DBを使う（モックしない）
 * - レスポンスだけでなく、DBの変更も確認する
 * - テストデータのクリーンアップを忘れない
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// import { GET, POST, PUT, DELETE } from '@/app/api/[resource]/route';
// import { db } from '@/lib/db';

// ============================================
// テストデータ管理
// ============================================

// async function cleanupTestData() {
//   await db.resource.deleteMany({
//     where: { id: { startsWith: 'test-' } }
//   });
// }

// async function seedTestData() {
//   await db.resource.createMany({
//     data: [
//       { id: 'test-1', name: 'Test 1' },
//       { id: 'test-2', name: 'Test 2' },
//     ]
//   });
// }

// ============================================
// リクエストヘルパー
// ============================================

function createRequest(
  method: string,
  url: string,
  options: {
    body?: object;
    headers?: Record<string, string>;
  } = {}
) {
  const { body, headers = {} } = options;

  return new Request(`http://localhost${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ============================================
// テスト本体
// ============================================

describe('API: /api/resources', () => {
  beforeEach(async () => {
    // テストデータのクリーンアップ
    // await cleanupTestData();
    // await seedTestData();
  });

  afterEach(async () => {
    // await cleanupTestData();
  });

  // ============================================
  // GET - 一覧取得
  // ============================================

  describe('GET /api/resources', () => {
    it('リソース一覧を取得できる', async () => {
      // const request = createRequest('GET', '/api/resources');
      // const response = await GET(request);
      // const body = await response.json();

      // expect(response.status).toBe(200);
      // expect(body).toHaveLength(2);
      // expect(body[0]).toMatchObject({
      //   id: 'test-1',
      //   name: 'Test 1',
      // });
    });

    it('空の一覧を取得できる', async () => {
      // await cleanupTestData();  // データを空にする

      // const request = createRequest('GET', '/api/resources');
      // const response = await GET(request);
      // const body = await response.json();

      // expect(response.status).toBe(200);
      // expect(body).toHaveLength(0);
    });
  });

  // ============================================
  // GET - 単一取得
  // ============================================

  describe('GET /api/resources/[id]', () => {
    it('IDでリソースを取得できる', async () => {
      // const request = createRequest('GET', '/api/resources/test-1');
      // const response = await GET(request, { params: { id: 'test-1' } });
      // const body = await response.json();

      // expect(response.status).toBe(200);
      // expect(body.id).toBe('test-1');
      // expect(body.name).toBe('Test 1');
    });

    it('存在しないIDで404', async () => {
      // const request = createRequest('GET', '/api/resources/nonexistent');
      // const response = await GET(request, { params: { id: 'nonexistent' } });

      // expect(response.status).toBe(404);
    });
  });

  // ============================================
  // POST - 作成
  // ============================================

  describe('POST /api/resources', () => {
    it('リソースを作成できる', async () => {
      // const request = createRequest('POST', '/api/resources', {
      //   body: { name: 'New Resource' },
      // });
      // const response = await POST(request);
      // const body = await response.json();

      // // レスポンスを検証
      // expect(response.status).toBe(201);
      // expect(body.id).toBeDefined();
      // expect(body.name).toBe('New Resource');

      // // DBに実際に保存されたか検証（★重要）
      // const saved = await db.resource.findUnique({
      //   where: { id: body.id }
      // });
      // expect(saved).not.toBeNull();
      // expect(saved.name).toBe('New Resource');
    });

    it('バリデーションエラーで400', async () => {
      // const request = createRequest('POST', '/api/resources', {
      //   body: { name: '' },  // 空は無効
      // });
      // const response = await POST(request);
      // const body = await response.json();

      // expect(response.status).toBe(400);
      // expect(body.error).toContain('name');

      // // DBに保存されていないことを確認
      // const count = await db.resource.count({
      //   where: { name: '' }
      // });
      // expect(count).toBe(0);
    });

    it('重複でエラー（必要な場合）', async () => {
      // const request = createRequest('POST', '/api/resources', {
      //   body: { name: 'Test 1' },  // 既存と重複
      // });
      // const response = await POST(request);

      // expect(response.status).toBe(409);
    });
  });

  // ============================================
  // PUT - 更新
  // ============================================

  describe('PUT /api/resources/[id]', () => {
    it('リソースを更新できる', async () => {
      // const request = createRequest('PUT', '/api/resources/test-1', {
      //   body: { name: 'Updated Name' },
      // });
      // const response = await PUT(request, { params: { id: 'test-1' } });
      // const body = await response.json();

      // expect(response.status).toBe(200);
      // expect(body.name).toBe('Updated Name');

      // // DBが更新されたか確認（★重要）
      // const updated = await db.resource.findUnique({
      //   where: { id: 'test-1' }
      // });
      // expect(updated.name).toBe('Updated Name');
    });

    it('存在しないIDで404', async () => {
      // const request = createRequest('PUT', '/api/resources/nonexistent', {
      //   body: { name: 'Test' },
      // });
      // const response = await PUT(request, { params: { id: 'nonexistent' } });

      // expect(response.status).toBe(404);
    });

    it('バリデーションエラーで400', async () => {
      // const request = createRequest('PUT', '/api/resources/test-1', {
      //   body: { name: '' },
      // });
      // const response = await PUT(request, { params: { id: 'test-1' } });

      // expect(response.status).toBe(400);

      // // DBが変更されていないことを確認
      // const unchanged = await db.resource.findUnique({
      //   where: { id: 'test-1' }
      // });
      // expect(unchanged.name).toBe('Test 1');  // 元のまま
    });
  });

  // ============================================
  // DELETE - 削除
  // ============================================

  describe('DELETE /api/resources/[id]', () => {
    it('リソースを削除できる', async () => {
      // const request = createRequest('DELETE', '/api/resources/test-1');
      // const response = await DELETE(request, { params: { id: 'test-1' } });

      // expect(response.status).toBe(204);

      // // DBから削除されたか確認（★重要）
      // const deleted = await db.resource.findUnique({
      //   where: { id: 'test-1' }
      // });
      // expect(deleted).toBeNull();
    });

    it('存在しないIDで404', async () => {
      // const request = createRequest('DELETE', '/api/resources/nonexistent');
      // const response = await DELETE(request, { params: { id: 'nonexistent' } });

      // expect(response.status).toBe(404);
    });
  });

  // ============================================
  // 認証・認可
  // ============================================

  describe('認証・認可', () => {
    it('未認証で401', async () => {
      // const request = createRequest('GET', '/api/resources');
      // // 認証ヘッダーなし
      // const response = await GET(request);

      // expect(response.status).toBe(401);
    });

    it('他のユーザーのリソースにアクセスで403', async () => {
      // const request = createRequest('GET', '/api/resources/other-user-resource', {
      //   headers: { Authorization: 'Bearer user-a-token' },
      // });
      // const response = await GET(request, { params: { id: 'other-user-resource' } });

      // expect(response.status).toBe(403);
    });
  });
});

// ============================================
// 外部APIのモック例
// ============================================

// vi.mock('@/lib/email', () => ({
//   sendEmail: vi.fn().mockResolvedValue({ success: true }),
// }));

// describe('メール送信を含むAPI', () => {
//   it('作成時にメールが送信される', async () => {
//     const { sendEmail } = await import('@/lib/email');
//
//     const request = createRequest('POST', '/api/resources', {
//       body: { name: 'Test', notify: true },
//     });
//     await POST(request);
//
//     expect(sendEmail).toHaveBeenCalled();
//   });
// });

// ============================================
// テスト作成後のチェックリスト
// ============================================

/*
□ 実DBを使っているか（モックしていないか）
□ レスポンスを検証しているか
□ DBの変更を確認しているか（★重要）
□ 正常系・異常系の両方をテストしているか
□ バリデーションエラーをテストしているか
□ 認証・認可をテストしているか
□ テストデータのクリーンアップをしているか
*/
