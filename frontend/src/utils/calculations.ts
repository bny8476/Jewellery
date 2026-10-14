export interface InterestParams {
    principal: number;
    rate: number;
    startDate: string;
    endDate: string;
    interestType: 'monthly' | 'yearly' | 'daily';
}

/**
 * Calculates the number of days between two dates.
 * Includes the start date (inclusive) if needed, but standard logic is usually exclusive of start, inclusive of end.
 * Here we use standard difference: if start is Jan 1 and end is Jan 5, diff is 4 days.
 * @param start Start date string (YYYY-MM-DD or ISO)
 * @param end End date string (YYYY-MM-DD or ISO)
 * @returns Number of days (minimum 0)
 */
export const calculateDaysDifference = (start: string, end: string): number => {
    const startTime = new Date(start).setHours(0, 0, 0, 0);
    const endTime = new Date(end).setHours(0, 0, 0, 0);

    // Calculate difference in milliseconds
    const diffTime = endTime - startTime;

    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // Ensure non-negative
};

/**
 * Calculates interest based on principal, rate, and time period.
 * 
 * Formulae:
 * - Monthly: (P * R * Days) / (100 * 30)  -- Assuming 30 days month
 * - Yearly: (P * R * Days) / (100 * 365)
 * - Daily: (P * R * Days) / 100
 * 
 * @param params InterestParams object
 * @returns Calculated interest amount (rounded to 2 decimal places)
 */
export const calculateInterest = ({
    principal,
    rate,
    startDate,
    endDate,
    interestType
}: InterestParams): number => {
    const days = calculateDaysDifference(startDate, endDate);

    if (days <= 0 || principal <= 0 || rate <= 0) {
        return 0;
    }

    let interest = 0;

    switch (interestType) {
        case 'monthly': {
            // Rate is per month. 
            // Daily Rate = Rate / 30
            const dailyRateMonthly = rate / 30;
            interest = (principal * dailyRateMonthly * days) / 100;
            break;
        }

        case 'yearly': {
            // Rate is per year.
            // Daily Rate = Rate / 365
            const dailyRateYearly = rate / 365;
            interest = (principal * dailyRateYearly * days) / 100;
            break;
        }

        case 'daily':
            // Rate is per day.
            interest = (principal * rate * days) / 100;
            break;

        default: {
            // Default to monthly if unknown
            const defaultDailyRate = rate / 30;
            interest = (principal * defaultDailyRate * days) / 100;
            break;
        }
    }

    return Math.round(interest * 100) / 100; // Round to 2 decimal places
};
