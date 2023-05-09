import * as fs from 'fs';
import * as path from 'path';
import { Configuration } from "./utils/configuration";
import { Log } from './utils/log';

interface UserFile 
{
    users : Array<User>
}

/**
 * Defines a User Object
 */
export class User
{
    protected _username : string;
    protected _displayName : string;
    protected _emailAddress : string;

    get username() : string { return this._username; }
    get displayName() : string { return this._displayName; }
    get emailAddress() : string { return this._emailAddress; }

    constructor(username : string, displayName : string, emailAddress : string)
    {
        this._username = username;
        this._displayName = displayName;
        this._emailAddress = emailAddress;
    }

    toJSON()
    {
        return {username: this._username, displayName: this._displayName, emailAddress: this._emailAddress};
    }
}

/**
 * Defines a Collection of Users, and the facilities to read & write those users
 * to a file for persistence. 
 */
export class UserCollection
{
    protected _users : Array<User>;
    protected _usersFilePath : string;

    constructor(config : Configuration)
    {
        this._users = new Array<User>();
        this._usersFilePath = path.join(config.projectConfiguration.scrubFolder, "users.json");
    }

    public fromFile()
    {
        // Attempt to Read the File
        let userFileData = null;
        try
        {
            Log.message(`Reading users file from: ${this._usersFilePath}`);
            userFileData = JSON.parse(fs.readFileSync(this._usersFilePath).toString());
        }
        catch(e){
            Log.error(`Error reading users file from ${this._usersFilePath}. A new one will be created. Error: ${e}`);
            this.toFile();
            return;
        }

        this._users = (<UserFile>userFileData).users;
    }

    public addUser(newUser : User)
    {
        this._users.push(newUser);
        this.toFile();
    }

    public getUser(username : string) : User | null
    {
        for(let user of this._users)
        {
            if(user.username == username)
                return user;
        }
        return null;
    }

    protected toFile()
    {
        try{
            fs.writeFileSync(this._usersFilePath, JSON.stringify({users:this._users}, undefined, 4));
            Log.message("Saved users file to disk succesfully");
        }
        catch(e) {
            Log.error(`Error writing users file. Filepath: ${this._usersFilePath}. Error: ${e}`);
        }
    }

    /**
     * Check if a user has previously registered
     * @param username username to check
     * @returns true if has registered 
     */
    public userIsRegistered(username : string) : boolean 
    {
        // If we can't find the user, they haven't registered yet
        return !(this.getUser(username) == null);
    }

}