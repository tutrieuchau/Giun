const login = require('./login');
const dashboard = require('./dashboard');
const er404 = require('./404');
const logout = require('./logout');
const register = require('./register');
const post = require('./post');
const user = require('./user');
const profile = require('./profile');

module.exports = { login,register,logout,post,user,profile,dashboard,er404};