import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';

export const getInbox    = () => apiGet('/mails');
export const sendMail    = body => apiPost('/mails', body);
export const getSpam     = () => apiGet('/mails/spam');
export const markAsSpam  = id   => apiPatch(`/mails/${id}/spam`);
export const getMailById = id   => apiGet(`/mails/${id}`);
export const editMail    = (id, body) => apiPatch(`/mails/${id}`, body);
export const deleteMail  = id   => apiDelete(`/mails/${id}`);
