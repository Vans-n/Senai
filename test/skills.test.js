const request = require('supertest');
const app = require('../server');

function uniqueEmail(prefix) {
  return `${prefix}_${Date.now()}@example.com`;
}

describe('Skills API and recommendations', () => {
  let userA = null;
  let userB = null;
  let tokenA = null;
  let tokenB = null;

  test('Create two users and authenticate', async () => {
    const emailA = uniqueEmail('userA');
    const emailB = uniqueEmail('userB');

    const resA = await request(app).post('/api/users').send({ name: 'User A', email: emailA, password: 'Password1!' });
    expect(resA.statusCode).toBe(201);
    userA = resA.body.user;

    const resB = await request(app).post('/api/users').send({ name: 'User B', email: emailB, password: 'Password1!' });
    expect(resB.statusCode).toBe(201);
    userB = resB.body.user;

    const loginA = await request(app).post('/api/auth/login').send({ email: emailA, password: 'Password1!' });
    expect(loginA.statusCode).toBe(200);
    tokenA = loginA.body.token;

    const loginB = await request(app).post('/api/auth/login').send({ email: emailB, password: 'Password1!' });
    expect(loginB.statusCode).toBe(200);
    tokenB = loginB.body.token;
  });

  test('UserB teaches Golang; UserA wants to learn Golang; recommendation returns UserB', async () => {
    // UserB adds teach skill
    const teachRes = await request(app)
      .post('/api/skills/me/skills')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ skillName: 'Golang', type: 'teach' });
    expect(teachRes.statusCode).toBe(201);

    // UserA adds learn skill
    const learnRes = await request(app)
      .post('/api/skills/me/skills')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ skillName: 'Golang', type: 'learn' });
    expect(learnRes.statusCode).toBe(201);

    // Get recommendations for UserA
    const rec = await request(app)
      .get('/api/skills/recommendations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send();

    expect(rec.statusCode).toBe(200);
    expect(Array.isArray(rec.body.recommendations)).toBe(true);
    const found = rec.body.recommendations.find(r => r.user && r.user.email === userB.email);
    expect(found).toBeDefined();
    expect(found.matchedSkills).toContain('Golang');
  });
});
