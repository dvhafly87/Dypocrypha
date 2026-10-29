export const DRAFT_PREFIX = 'dypocrypha:project-log-draft:v1:';
export function logDraftKey(user, project, date, logId = null) {
    if (!user || !project || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return DRAFT_PREFIX + [user, String(project), date, logId == null ? 'new' : `edit-${logId}`].map(encodeURIComponent).join(':');
}
export function readLogDraft(storage, key) {
    if (!key) return null;
    const raw = storage.getItem(key);
    if (!raw) return null;
    try {
        const value = JSON.parse(raw);
        return value.version === 1 && typeof value.title === 'string' && value.title.length <= 20 &&
            typeof value.content === 'string' && Number.isFinite(value.savedAt) ? value : null;
    } catch { return null; }
}
export function writeLogDraft(storage, key, value, baseline) {
    if (!key) throw new Error('Draft identity unavailable');
    if ((!value.title.trim() && !value.content.trim()) ||
        (value.title === baseline.title && value.content === baseline.content)) {
        storage.removeItem(key); return null;
    }
    const draft = {...value, version: 1, savedAt: Date.now()};
    storage.setItem(key, JSON.stringify(draft));
    return draft;
}

// Surface unfinished new entries even after the calendar has moved to another day.
export function listNewLogDrafts(storage, user, project) {
    if(!user||!project)return [];
    const prefix=DRAFT_PREFIX+[user,String(project)].map(encodeURIComponent).join(':')+':';
    const drafts=[];
    for(let i=0;i<storage.length;i++){
        const key=storage.key(i);
        if(!key?.startsWith(prefix)||!key.endsWith(':new'))continue;
        const date=key.slice(prefix.length,-4);
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
        const value=readLogDraft(storage,key);
        if(value)drafts.push({...value,date,key});
    }
    return drafts.sort((a,b)=>b.savedAt-a.savedAt);
}
