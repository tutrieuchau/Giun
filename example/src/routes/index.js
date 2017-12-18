const login = require('./login');
const dashboard = require('./dashboard');
const er404 = require('./404');
const logout = require('./logout');
const register = require('./register');
const post = require('./post');
const user = require('./user');
const category = require('./category');
const conversation = require('./conversation');

module.exports = { login,register,logout,post,user,category,conversation,dashboard,er404};