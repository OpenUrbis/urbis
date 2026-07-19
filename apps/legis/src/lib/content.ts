import { JSONContent } from '@tiptap/core';

export const safeJSONParse = (str: string): JSONContent | undefined => {
    try {
        const json = JSON.parse(str);
        if (typeof json === 'object' && json !== null) return json;
        return undefined;
    } catch {
        return undefined;
    }
};

export const getExcerpt = (contentStr: string, maxLength = 120): string => {
    try {
        const json = JSON.parse(contentStr);
        let text = '';
        const traverse = (node: JSONContent) => {
            if (node.text) text += node.text + ' ';
            if (node.content) node.content.forEach(traverse);
        };
        if (json) traverse(json);
        
        const result = text.trim();
        return result.substring(0, maxLength) + (result.length > maxLength ? '...' : '');
    } catch {
        // Fallback for plain text
        const result = contentStr.replace(/<[^>]*>?/gm, '').trim();
        return result.substring(0, maxLength) + (result.length > maxLength ? '...' : '');
    }
};
