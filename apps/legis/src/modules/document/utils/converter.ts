import { NormativeElement, NormativeOriginal } from '../../../domain/types';
import { Block } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function convertNormativeToBlocks(normative: NormativeOriginal): Block[] {
    return normative.elements.map(el => {
        // Map NormativeElement to our Block structure
        // If it's a structural element (title, chapter, etc) or content (article)
        // We treat them all as 'normative' blocks for now as Tiptap extension handles them
        // But we need to ensure the 'type' attribute is correct.
        
        return {
            id: el.id || uuidv4(),
            type: 'normative',
            content: {
                type: el.type,
                index: el.index,
                text: el.text
            },
            linkedDocumentId: undefined // Could be mapped if present
        };
    });
}
