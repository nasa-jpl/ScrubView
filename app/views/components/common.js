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
exports.dispositionToBadge = exports.getDevDispositionBadge = exports.getLeadDispositionBadge = void 0;
const comments = __importStar(require("../../types/commentObjects"));
function getLeadDispositionBadge(disposition) {
    let spanClass;
    switch (disposition) {
        case comments.LeadDispositions.Code_Fix_Requested:
            spanClass = "badge-warning";
            break;
        case comments.LeadDispositions.No_Action:
            spanClass = "badge-success";
            break;
        default:
            spanClass = "badge-secondary";
            break;
    }
    return spanClass;
}
exports.getLeadDispositionBadge = getLeadDispositionBadge;
function getDevDispositionBadge(disposition) {
    let devDispositionSpanClass;
    switch (disposition) {
        case comments.DeveloperDispositions.Agree:
            devDispositionSpanClass = "badge-success";
            break;
        case comments.DeveloperDispositions.Disagree:
            devDispositionSpanClass = "badge-danger";
            break;
        case comments.DeveloperDispositions.Discuss:
            devDispositionSpanClass = "badge-warning";
            break;
        default:
            devDispositionSpanClass = "badge-secondary";
            break;
    }
    return devDispositionSpanClass;
}
exports.getDevDispositionBadge = getDevDispositionBadge;
function dispositionToBadge(dispositionComment) {
    if (dispositionComment instanceof comments.DevDispositionComment) {
        // Add the Developer Disposition Badge
        let dispoText = comments.DeveloperDispositions[dispositionComment.disposition].replace(new RegExp("_", 'g'), " ");
        let spanClass = getDevDispositionBadge(dispositionComment.disposition);
        return `<span class='badge ${spanClass}'>${dispoText}</span>`;
    }
    else if (dispositionComment instanceof comments.LeadDispositionComment) {
        // Add the Lead Disposition Badge
        let dispoText = comments.LeadDispositions[dispositionComment.disposition].replace(new RegExp("_", 'g'), " ");
        let spanClass = getLeadDispositionBadge(dispositionComment.disposition);
        return `<span class='badge ${spanClass}'>${dispoText}</span>`;
    }
    else {
        return "";
    }
}
exports.dispositionToBadge = dispositionToBadge;
//# sourceMappingURL=common.js.map