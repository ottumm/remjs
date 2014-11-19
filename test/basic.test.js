var superagent = require('superagent')
var expect = require('expect.js')
var _ = require('lodash')
var scaffold = require('./test_scaffold');

describe('REM rest api basic functionality (no schema validation):', function(){
	var scaffolding = scaffold.create({
    'employees': {},
    'departments': {
      children: ['employees']
    }
  });

  before(function(){
    scaffolding.start();
  })
  after(function() {
    scaffolding.destroy();
  })

  var url = scaffolding.baseURL();
  console.log( "Base URL: %s", url );
	
  it('fetch an empty collection', function(done){
  	superagent.get(url + '/departments')
  		.end(function(e,res){
  			expect(e).to.eql(null);
  			expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be(0);
  			done();
  		})
  })

  var departmentName = "TPSReportDepartment";
  var departmentPurpose = "NONE";

  var departmentID = null;

  it('create new department', function(done){
    superagent.post(url + '/departments')
      .send({
        name: departmentName,
        purpose: departmentPurpose
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(201);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body._id.length).to.eql(16);
        departmentID = res.body._id;
        console.log( res.body);
        done();
      })
  });
  it('fetch new department', function(done){
    superagent.get(url + '/departments/' + departmentID)
      .end(function(e,res){
        console.log( res.body );
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body._id).to.eql(departmentID);
        expect(res.body['name']).to.eql(departmentName);
        expect(res.body['purpose']).to.eql(departmentPurpose);
        done()
      })
  })

  it('create new employee (no department)', function(done){
    superagent.post(url + '/employees')
      .send({
        'name': "useless mcgee",
        'DOB': new Date()
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(201);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body._id.length).to.eql(16);
        done();
      })
  });

  it('get the empty "TPSReportDepartment" employees list', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(0);
        done()
      })
  })
  var employees = [];
  _.forEach( ['George Washington','Abraham Lincoln','Johnny Appleseed'], function(dummy_name) {
    it('add an employee', function(done){
      superagent.post(url + '/departments/' + departmentID + '/employees')
        .send({
          name: dummy_name
        })
        .end(function(e,res){
          expect(e).to.eql(null);
          expect(res.status).to.eql(201);
          expect(res.body).to.be.an('object');
          expect(res.body).not.to.be.an('array');
          expect(res.body._id.length).to.eql(16);
          expect(res.body.name).to.eql(dummy_name);
          expect(res.body.departments_id).to.eql(departmentID);
          employees.push(res.body._id);
          done();
        })
    })
  })

  it('check that all the employees show up', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(employees.length);
        var ticklist = _.clone(employees);
        _.forEach( res.body, function( employee, i ) {
          ticklist = _.without( ticklist, employee._id );
        } );
        expect(ticklist.length).to.eql(0);
        done()
      })
  })

  it('try getting an employee individually', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees/' + employees[0])
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).not.to.be.an('array');
        expect(res.body._id).to.eql(employees[0]);
        expect(res.body.departments_id).to.eql(departmentID);
        done()
      })
  })

  it('try to create an employee and overwrite departments_id (should fail)', function(done) {
    superagent.post(url + '/departments/' + departmentID + '/employees')
      .send({
        name: 'BOGUS',
        departments_id: 'HAXORS'
      })
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(400);
        done()
      })
  })

  it('delete the employees', function(done) {
    _.forEach( employees, function( employee_id ) {
      superagent.del(url + '/departments/' + departmentID + '/employees/'+ employee_id)
        .end(function(e,res){
          expect(e).to.eql(null);
          expect(res.status).to.eql(200);
          employees = _.without( employees, employee_id );
          if ( employees.length == 0 )
            done();
          })
    });
  })
  it('get the empty employees list again', function(done) {
    superagent.get(url + '/departments/' + departmentID + '/employees')
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.eql(0);
        done();
      })
  })

  it('delete the department', function(done){
    superagent.del(url + '/departments/' + departmentID)
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(200);
        done();
      })
  })

  it('fetch the non-existent deleted department (should fail)', function(done){
    superagent.get(url + '/departments/' + departmentID)
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.status).to.eql(404);
        done();
      })
  })
})