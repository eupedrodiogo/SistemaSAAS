export const formatDateKey = (date: Date) => {
   const y = date.getFullYear();
   const m = String(date.getMonth() + 1).padStart(2, '0');
   const d = String(date.getDate()).padStart(2, '0');
   return `${y}-${m}-${d}`;
};

export const isSameDate = (date1: Date, date2: Date) => {
   return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
};

export const safeParseDate = (value: string) => {
   const d = new Date(value);
   return isNaN(d.getTime()) ? new Date() : d;
};

export const safeHour = (t: string) => {
   if (!t || !t.includes(':')) return NaN;
   const h = parseInt(t.split(':')[0]);
   return isNaN(h) ? NaN : h;
};

export const safeMinute = (t: string) => {
   if (!t || !t.includes(':')) return '00';
   const m = t.split(':')[1];
   return m || '00';
};

export const formatPhone = (val: string) => {
   let v = val.replace(/\D/g, '');
   if (v.length > 11) v = v.slice(0, 11);
   if (v.length === 0) return '';
   if (v.length <= 2) return `(${v}`;
   if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
   if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
   return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
};

export const weekDays = [
    { val: 0, label: 'Domingo', short: 'Dom' }, 
    { val: 1, label: 'Segunda', short: 'Seg' }, 
    { val: 2, label: 'Terça', short: 'Ter' }, 
    { val: 3, label: 'Quarta', short: 'Qua' }, 
    { val: 4, label: 'Quinta', short: 'Qui' }, 
    { val: 5, label: 'Sexta', short: 'Sex' }, 
    { val: 6, label: 'Sábado', short: 'Sáb' }
];
