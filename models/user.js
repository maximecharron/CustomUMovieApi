var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var modelHelpers = require('./modelHelpers.js');
var _ = require('underscore');

var userSchema = new mongoose.Schema();
userSchema.add({
    username : String,
    firstname: String,
    lastname : String,
    name : String,
    email: String,
    password: String,
    token: String,
    expiration: Number,
    following: [userSchema],
    picture: String,
    google: String,
    facebook: String
});

userSchema.methods.toDTO = function (following, withToken) {
    var obj = this.toObject();

    var dto = {
        id: obj._id,
        username : obj.username,
        firstname: obj.firstname,
        lastname : obj.lastname,
        name : obj.name || obj.firstname + " " + obj.lastname,
        email: obj.email,
        picture: obj.picture,
        google: obj.google,
        facebook : obj.facebook
    };

    if (following) {
        dto.following = obj.following;
        dto.following.forEach(function (followedUser) {
            followedUser.id = followedUser._id;
            delete followedUser._id;
        });
    }
    if(withToken){
        dto.token = obj.token;
    }

    return dto;
};

userSchema.methods.isFollowingUser = function (userId) {
    for (var i = 0; i < this.following.length; i++) {
        if (this.following[i].id == userId) {
            return true;
        }
    }
    return false;
};

userSchema.methods.unfollow = function (userId) {
    this.following = _.without(this.following, _.findWhere(this.following, {
        id: userId
    }));
};

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.method('toJSON', modelHelpers.toJSON);

var User = mongoose.model('User', userSchema);

exports.schema = userSchema;
exports.model = User;
