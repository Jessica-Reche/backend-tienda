const request = require('../src/index');
const supertest = require('supertest');
const expect = require('chai').expect;

describe('ENDPOINTS', () => {
    it('Testing products', (done) => {
        supertest(request)
            .get('/product/getProducts')
            .expect(200)
            .expect((response) => {
                expect(response.body.status).to.be.true;
            })
            .end((err, res) => {
                if (err) return done(err);
                return done();
            });
    });
});

it('Testing get users', (done) => {
    supertest(request)
        .get('/user/users')
        .expect(400)
        .expect((response) => {
            console.log(response.body);
            expect(response.body.status).to.be.false;
            expect(response.body.message).to.equal('The token is required.');
        }
        )
        .end((err, res) => {
            if (err) return done(err);
            return done();
        });
});


it('Testing login users failed', (done) => {
    supertest(request)
        .post('/user/login')
        .send({
            email: ' ',
            password: ' '
        })
        .expect(401)
        .expect((response) => {
            console.log(response.body);
            expect(response.body.status).to.be.false;
            expect(response.body.message).to.equal('Email or pasword is incorrect');
        })
        .end((err, res) => {
            if (err) return done(err);
            return done();
        });
});

it('Testing login user sucess', (done) => {
    supertest(request)
        .post('/user/login')
        .send({
            email: 'shiva@admin.com',
            username: 'Shiva',
            password: '123'
        })
        .expect(200)
        .expect((response) => {
            console.log(response.body.message);
            expect(response.body.status).to.be.true;
            expect(response.body.message).to.equal('Login successfull');
            expect(response.body.token).to.be.a('string');
            expect(response.body.user.rol.name).to.equal('admin');

        })
        .end((err, res) => {
            console.log(res.body.message);
            if (err) return done(err);
            return done();
        });
});






