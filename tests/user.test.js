const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, userOneId, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should sign up a new user', async () => {
  const response = await request(app).post('/users')
    .send({
      name: 'Andres',
      email: 'andres@example.com',
      password: 'MyPass777?'
    })
    .expect(201)

    // Assert that db was changed correctly

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Assertions about the response

    expect(response.body).toMatchObject({
      user: {
        name: 'Andres',
        email: 'andres@example.com',
      },
      token: user.tokens[0].token
    })

    // Password shouldn't be the same sent as plain text

    expect(user.password).not.toBe('MyPass777?')
})

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)

  const user = await User.findById(userOne._id)

  expect(response.body)
    .toMatchObject({
      token: user.tokens[1].token
    })
});

test('Should not login nonexistent user', async () => {
  await request(app).post('/users/login').send({
    email: 'idontexist@gmail.com',
    password: 'iamanincorrectpassword'
  }).expect(400)
});

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
});

test('Should not get profile for unauth user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
});

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

  expect(await User.findById(userOneId)).toBeNull()
});

test('Should not delete account for unauth user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer))
});

test('Should update valid user fields', async () => {
  await request(app).patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Ants'
    })
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user.name).toBe('Ants')
})

test('Should not update invalid user fields', async () => {
  await request(app).patch('/users/me')
  .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
  .send({
    location: 'iamlocation'
  }).expect(400)
})