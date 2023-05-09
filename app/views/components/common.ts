import * as comments from "../../types/commentObjects"
import { Log } from "../../types/utils/log";

export function getLeadDispositionBadge(disposition : comments.LeadDispositions) : string 
{
    let spanClass;
    switch(disposition)
    {
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

export function getDevDispositionBadge(disposition : comments.DeveloperDispositions) : string 
{
    let devDispositionSpanClass;
    switch(disposition)
    {
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

export function dispositionToBadge(dispositionComment : comments.AbstractComment) : string 
{
    if(dispositionComment instanceof comments.DevDispositionComment)
    {
        // Add the Developer Disposition Badge
        let dispoText = comments.DeveloperDispositions[dispositionComment.disposition].replace(new RegExp("_", 'g'), " ");
        let spanClass = getDevDispositionBadge(dispositionComment.disposition);
        return `<span class='badge ${spanClass}'>${dispoText}</span>`;
    }
    else if(dispositionComment instanceof comments.LeadDispositionComment)
    {
        // Add the Lead Disposition Badge
        let dispoText = comments.LeadDispositions[dispositionComment.disposition].replace(new RegExp("_", 'g'), " ");
        let spanClass = getLeadDispositionBadge(dispositionComment.disposition);
        return `<span class='badge ${spanClass}'>${dispoText}</span>`;
    }
    else 
    {
        return "";
    }
}