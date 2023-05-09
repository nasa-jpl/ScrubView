"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCollection = exports.User = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const log_1 = require("./utils/log");
/**
 * Defines a User Object
 */
class User {
    constructor(username, displayName, emailAddress) {
        this._username = username;
        this._displayName = displayName;
        this._emailAddress = emailAddress;
    }
    get username() { return this._username; }
    get displayName() { return this._displayName; }
    get emailAddress() { return this._emailAddress; }
    toJSON() {
        return { username: this._username, displayName: this._displayName, emailAddress: this._emailAddress };
    }
}
exports.User = User;
/**
 * Defines a Collection of Users, and the facilities to read & write those users
 * to a file for persistence.
 */
class UserCollection {
    constructor(config) {
        this._users = new Array();
        this._usersFilePath = path.join(config.projectConfiguration.scrubFolder, "users.json");
    }
    fromFile() {
        // Attempt to Read the File
        let userFileData = null;
        try {
            log_1.Log.message(`Reading users file from: ${this._usersFilePath}`);
            userFileData = JSON.parse(fs.readFileSync(this._usersFilePath).toString());
        }
        catch (e) {
            log_1.Log.error(`Error reading users file from ${this._usersFilePath}. A new one will be created. Error: ${e}`);
            this.toFile();
            return;
        }
        this._users = userFileData.users;
    }
    addUser(newUser) {
        this._users.push(newUser);
        this.toFile();
    }
    getUser(username) {
        for (let user of this._users) {
            if (user.username == username)
                return user;
        }
        return null;
    }
    toFile() {
        try {
            fs.writeFileSync(this._usersFilePath, JSON.stringify({ users: this._users }, undefined, 4));
            log_1.Log.message("Saved users file to disk succesfully");
        }
        catch (e) {
            log_1.Log.error(`Error writing users file. Filepath: ${this._usersFilePath}. Error: ${e}`);
        }
    }
    /**
     * Check if a user has previously registered
     * @param username username to check
     * @returns true if has registered
     */
    userIsRegistered(username) {
        // If we can't find the user, they haven't registered yet
        return !(this.getUser(username) == null);
    }
}
exports.UserCollection = UserCollection;
//# sourceMappingURL=userCollection.js.map