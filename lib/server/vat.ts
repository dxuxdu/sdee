import { NextRequest } from 'next/server';

// VAT/GST Rates (Matching Legacy Logic)
const VAT_RATES: Record<string, number> = {
    // European Union + UK
    'AT': 20, 'BE': 21, 'BG': 20, 'CY': 19, 'CZ': 21, 'DE': 19, 'DK': 25, 
    'EE': 20, 'ES': 21, 'FI': 24, 'FR': 20, 'GR': 24, 'HR': 25, 'HU': 27, 
    'IE': 23, 'IT': 22, 'LT': 21, 'LU': 17, 'LV': 21, 'MT': 18, 'NL': 21, 
    'PL': 23, 'PT': 23, 'RO': 19, 'SE': 25, 'SI': 22, 'SK': 20, 'GB': 20,

    // Other Europe
    'CH': 8.1, 'NO': 25, 'IS': 24, 'TR': 20, 'UA': 20, 'RS': 20,

    // Asia Pacific
    'AU': 10,  'NZ': 15,  'JP': 10,  'CN': 13,  'IN': 18,
    'KR': 10,  'SG': 9,   'ID': 11,  'MY': 6,   'TH': 7,   'VN': 10,
    'PH': 12,

    // Americas
    'CA': 5,
    'MX': 16,  'BR': 17,  'AR': 21,  'CL': 19,  'CO': 19,  'PE': 18,

    // Middle East / Africa
    'ZA': 15,  'EG': 14,  'SA': 15,  'AE': 5,   'IL': 17,  'NG': 7.5
};

export class VatCalculator {
    /**
     * Get country code from request IP
     */
    static getCountryFromRequest(req: NextRequest): string {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const cleanIp = ip.split(',')[0].replace(/^.*:/, '').trim(); // Handle ::ffff: prefix and multiple IPs
        
        let country = 'US';
        try {
            // Lazy load geoip-lite to prevent build/runtime errors if data files are missing
            // This prevents the "ENOENT: no such file or directory" error during module evaluation
            const geoip = require('geoip-lite');
            const geo = geoip.lookup(cleanIp);
            if (geo) country = geo.country;
        } catch (e) {
            console.error('⚠️ GeoIP Lookup failed:', e);
            // Default to US on error
        }
        
        console.log(`🌍 VAT: IP=${cleanIp}, Country=${country}`);
        return country;
    }

    /**
     * Calculate tax amount (exclusive - adds tax on top)
     */
    static calculateTax(baseAmount: number, country: string) {
        let vatRate = VAT_RATES[country] !== undefined ? VAT_RATES[country] : 20;
        vatRate += 2; // Small increase as requested in legacy

        const taxAmount = Number(((baseAmount * vatRate) / 100).toFixed(2));
        const totalAmount = Number((baseAmount + taxAmount).toFixed(2));

        return {
            vatRate,
            taxAmount,
            totalAmount,
            subtotal: baseAmount
        };
    }

    /**
     * Calculate tax for an inclusive total (Total remains fixed, tax is derived from it)
     */
    static calculateInclusiveTax(totalAmount: number, country: string) {
        let vatRate = VAT_RATES[country] !== undefined ? VAT_RATES[country] : 20;
        vatRate += 2; // Small increase as requested in legacy

        // subtotal = total / (1 + rate/100)
        const subtotal = Number((totalAmount / (1 + (vatRate / 100))).toFixed(2));
        const taxAmount = Number((totalAmount - subtotal).toFixed(2));

        return {
            vatRate,
            taxAmount,
            totalAmount,
            subtotal
        };
    }
}
