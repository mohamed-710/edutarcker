import pkg from 'arabic-persian-reshaper';
const { reshape } = pkg;

import BidiJS from 'bidi-js';

const bidi = BidiJS();


export const formatArabic = (text) => {
    if (!text) return '';
    
    try {
        const reshaped = reshape(text); 
        
        const bidiText = bidi.getReorderedString(reshaped); 
        
        return bidiText;
    } catch (error) {
        console.error("Arabic Formatting Error:", error);
        return text; 
    }
};