const request = require('../src/index');
const supertest = require('supertest');
const expect = require('chai').expect;

describe('GET /user', () => {
    it('Testing route', (done) => {
        supertest(request)
            .get('/user')
            .expect(200)
            .expect((response)=>{
              console.log(response.body);
              expect(response.body.status).to.be.true;
              expect(response.body.message).to.equal('Hello World');
            })
            .end((err, res) => {
                if (err) return done(err);
              
                return done();
            });
    });
});
