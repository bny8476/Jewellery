
/**
 * Generates a formatted pledge number (Bill Number).
 * Format: PREFIX-YEAR-SEQUENCE
 * Example: PL-2024-001
 * 
 * @param lastPledgeNumber The last generated pledge number (optional)
 * @param prefix Client specific prefix (default: PL)
 * @returns The new pledge number string
 */
export const generatePledgeNumber = (lastPledgeNumber?: string, prefix: string = 'PL'): string => {
    const currentYear = new Date().getFullYear();

    if (!lastPledgeNumber) {
        return `${prefix}-${currentYear}-0001`;
    }

    // Expected format: PREFIX-YEAR-SEQUENCE e.g. PL-2024-0045
    const parts = lastPledgeNumber.split('-');

    if (parts.length === 3) {
        const lastYear = parseInt(parts[1]);
        const lastSeq = parseInt(parts[2]);

        if (lastYear === currentYear) {
            const nextSeq = lastSeq + 1;
            return `${prefix}-${currentYear}-${nextSeq.toString().padStart(4, '0')}`;
        }
    }

    // Default fallback if format changes or new year
    return `${prefix}-${currentYear}-0001`;
};
