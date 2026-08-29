import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User & Researcher Management (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let coordinatorToken: string;
  let researcherToken: string;
  let createdUserId: string;
  let createdResearcherId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should login as admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@cese-rlim.local', password: 'admin123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.role).toBe('ADMIN');
          adminToken = res.body.accessToken;
        });
    });

    it('should login as coordinator', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'coordinator@cese-rlim.local', password: 'coord123' })
        .expect(200)
        .expect((res) => {
          coordinatorToken = res.body.accessToken;
        });
    });

    it('should login as researcher', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'daniel.tesfaye@astu.edu.et', password: 'researcher123' })
        .expect(200)
        .expect((res) => {
          researcherToken = res.body.accessToken;
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@cese-rlim.local', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('User Management', () => {
    it('GET /users - admin can list users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeDefined();
          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination.total).toBeGreaterThan(0);
        });
    });

    it('GET /users - researcher cannot list users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${researcherToken}`)
        .expect(403);
    });

    it('GET /users - unauthenticated is rejected', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });

    it('POST /users - admin can create user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test-e2e@example.com',
          password: 'password123',
          role: 'RESEARCHER',
        })
        .expect(201)
        .expect((res) => {
          createdUserId = res.body.id;
          expect(res.body.email).toBe('test-e2e@example.com');
          expect(res.body.role).toBe('RESEARCHER');
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('POST /users - rejects duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'test-e2e@example.com',
          password: 'password123',
          role: 'RESEARCHER',
        })
        .expect(409);
    });

    it('POST /users - coordinator cannot create users', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'another@example.com',
          password: 'password123',
          role: 'RESEARCHER',
        })
        .expect(403);
    });

    it('GET /users/:id - admin can get user by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdUserId);
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('PATCH /users/:id - admin can update user', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
        });
    });

    it('PATCH /users/:id/role - admin can change role', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${createdUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'TECHNICIAN' })
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe('TECHNICIAN');
        });
    });

    it('PATCH /users/:id/status - admin can deactivate user', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
        });
    });

    it('deactivated user cannot login', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test-e2e@example.com', password: 'password123' })
        .expect(401);
    });

    it('admin cannot deactivate themselves', async () => {
      const me = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      return request(app.getHttpServer())
        .patch(`/api/v1/users/${me.body.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(403);
    });
  });

  describe('Researcher Management', () => {
    it('GET /researchers - lists researchers', () => {
      return request(app.getHttpServer())
        .get('/api/v1/researchers?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toBeDefined();
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('POST /researchers - admin can create researcher (transactional)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/researchers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'E2E',
          lastName: 'Researcher',
          email: 'e2e-researcher@example.com',
          password: 'password123',
          employeeOrStudentId: 'E2E-RES-001',
          department: 'Electrical Engineering',
          academicPosition: 'Lecturer',
          researchAreas: 'IoT, Embedded Systems',
        })
        .expect(201)
        .expect((res) => {
          createdResearcherId = res.body.id;
          expect(res.body.employeeOrStudentId).toBe('E2E-RES-001');
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('e2e-researcher@example.com');
        });
    });

    it('POST /researchers - rejects duplicate employee ID', () => {
      return request(app.getHttpServer())
        .post('/api/v1/researchers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Another',
          lastName: 'Researcher',
          email: 'another-researcher@example.com',
          password: 'password123',
          employeeOrStudentId: 'E2E-RES-001',
          department: 'Engineering',
        })
        .expect(409);
    });

    it('GET /researchers/:id - returns researcher profile', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/researchers/${createdResearcherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdResearcherId);
          expect(res.body.user).toBeDefined();
        });
    });

    it('PATCH /researchers/:id - admin can update researcher', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/researchers/${createdResearcherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bio: 'Updated bio from E2E test' })
        .expect(200)
        .expect((res) => {
          expect(res.body.bio).toBe('Updated bio from E2E test');
        });
    });

    it('GET /researchers - search works', () => {
      return request(app.getHttpServer())
        .get('/api/v1/researchers?search=E2E')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items.length).toBeGreaterThan(0);
        });
    });
  });
});
