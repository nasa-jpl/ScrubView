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
exports.CodeError = exports.ErrorPathStep = void 0;
const md5 = __importStar(require("ts-md5"));
const abstractReviewItem_1 = require("./abstractReviewItem");
/**
 * ErrorPathStep
 * Contains the information for one portion of the overall error path as. This
 * is generated as part of the SARIF parsing of an error.
 */
class ErrorPathStep {
    constructor(fileLocation, message) {
        this.fileLocation = fileLocation;
        this._message = message == undefined ? "" : message;
    }
    get message() { return this._message; }
    setMessage(message) {
        this._message = message;
    }
}
exports.ErrorPathStep = ErrorPathStep;
class CodeError extends abstractReviewItem_1.AbstractReviewItem {
    constructor(id, tool, fileLocation, errorType, errorMessage, hash, errorPath) {
        super(id, fileLocation);
        this._tool = tool;
        this._errorType = errorType;
        this._errorMessage = errorMessage;
        this._errorPath = errorPath == undefined ? new Array() : errorPath;
        if (hash == undefined) {
            hash = this._calcHash();
        }
        this._hash = hash;
    }
    // Accessors   
    get tool() { return this._tool; }
    get errorType() { return this._errorType; }
    get errorMessage() { return this._errorMessage; }
    get comments() { return this._comments; }
    get hash() { return this._hash; }
    get errorPath() { return this._errorPath; }
    _calcHash() {
        let inputString = `${this.tool}, ${this.moduleName}, ${this.fileName}, ${this.lineNumber}, ${this.errorType}, ${this.errorMessage}`;
        return md5.Md5.hashAsciiStr(inputString);
    }
    toJSON() {
        return {
            errorId: this.id,
            errorHash: this.hash,
            tool: this.tool,
            moduleName: this.moduleName,
            file: this.fileName,
            line: this.lineNumber,
            errorType: this.errorType,
            errorMessage: this.errorMessage,
            devDisposition: this.devDisposition,
            leadDisposition: this.leadDisposition,
        };
    }
    toString() {
        return this.hash;
    }
    formatErrorTypeForScreen() {
        let errorType = this.errorType.toLowerCase();
        let re = /_/gi;
        errorType = errorType.replace(re, " ");
        let str = errorType.split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
        }
        errorType = str.join(' ');
        return errorType;
    }
}
exports.CodeError = CodeError;
//# sourceMappingURL=codeError.js.map