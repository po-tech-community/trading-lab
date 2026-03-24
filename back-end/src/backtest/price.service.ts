/**
 * Price SERVICE – fetches historical close prices from external APIs.
 *
 * Supported symbols:
 *   Crypto (CoinGecko): BTC, ETH
 *   Stocks (AlphaVantage): AAPL, TSLA
 *
 * Input:  symbol, startDate, endDate
 * Output: array of { date: string, close: number }
 *
 * @see doc/developer-tasks.md L1-BE-1
 */

import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PricePoint {
    date: string;  // 'YYYY-MM-DD'
    close: number;
}

// Which symbols each provider supports
const COINGECKO_SYMBOLS: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
};

const ALPHAVANTAGE_SYMBOLS = ['AAPL', 'TSLA'];

@Injectable()
export class PriceService {
    private readonly logger = new Logger(PriceService.name);

    constructor(private readonly configService: ConfigService) { }

    /**
     * Main entry point. Routes to the correct provider based on symbol.
     */
    async fetchPrices(
        symbol: string,
        startDate: string,
        endDate: string,
    ): Promise<PricePoint[]> {
        const upper = symbol.toUpperCase();

        if (COINGECKO_SYMBOLS[upper]) {
            return this.fetchFromCoinGecko(upper, startDate, endDate);
        }

        if (ALPHAVANTAGE_SYMBOLS.includes(upper)) {
            return this.fetchFromAlphaVantage(upper, startDate, endDate);
        }

        throw new BadRequestException(
            `Symbol "${symbol}" is not supported. Supported symbols: BTC, ETH, AAPL, TSLA`,
        );
    }

    // ---------------------------------------------------------------------------
    // CoinGecko – crypto prices
    // ---------------------------------------------------------------------------

    private async fetchFromCoinGecko(
        symbol: string,
        startDate: string,
        endDate: string,
    ): Promise<PricePoint[]> {
        const coinId = COINGECKO_SYMBOLS[symbol];

        // CoinGecko uses Unix timestamps (seconds)
        const from = Math.floor(new Date(startDate).getTime() / 1000);
        const to = Math.floor(new Date(endDate).getTime() / 1000);

        const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
        const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

        this.logger.log(`Fetching CoinGecko prices for ${symbol} from ${startDate} to ${endDate}`);

        let data: any;
        try {
            const res = await fetch(url, {
                headers: {
                    'x-cg-demo-api-key': apiKey ?? '',
                },
            });

            // CoinGecko returns 429 when rate limited
            if (res.status === 429) {
                throw new InternalServerErrorException(
                    'CoinGecko rate limit reached. Please wait a moment and try again.',
                );
            }

            if (!res.ok) {
                throw new InternalServerErrorException(
                    `CoinGecko API error: ${res.status} ${res.statusText}`,
                );
            }

            data = await res.json();
        } catch (err) {
            if (
                err instanceof InternalServerErrorException ||
                err instanceof BadRequestException
            ) {
                throw err;
            }
            throw new InternalServerErrorException(
                'Failed to reach CoinGecko API. Please try again later.',
            );
        }

        // CoinGecko returns prices as [[timestamp_ms, price], ...]
        // One data point per day when range > 90 days
        if (!data.prices || data.prices.length === 0) {
            throw new BadRequestException(
                `No price data found for ${symbol} in the given date range.`,
            );
        }

        // Convert to { date, close } — keep only one entry per day
        const seen = new Set<string>();
        const result: PricePoint[] = [];

        for (const [timestampMs, price] of data.prices) {
            const date = new Date(timestampMs).toISOString().split('T')[0]; // 'YYYY-MM-DD'
            if (!seen.has(date)) {
                seen.add(date);
                result.push({ date, close: price });
            }
        }

        return result;
    }

    // ---------------------------------------------------------------------------
    // AlphaVantage – stock prices
    // ---------------------------------------------------------------------------

    private async fetchFromAlphaVantage(
        symbol: string,
        startDate: string,
        endDate: string,
    ): Promise<PricePoint[]> {
        const apiKey = this.configService.get<string>('ALPHAVANTAGE_API_KEY');

        if (!apiKey) {
            throw new InternalServerErrorException(
                'AlphaVantage API key is not configured. Add ALPHAVANTAGE_API_KEY to your .env file.',
            );
        }

        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
        this.logger.log(`Fetching AlphaVantage prices for ${symbol} from ${startDate} to ${endDate}`);

        let data: any;
        try {
            const res = await fetch(url);

            if (!res.ok) {
                throw new InternalServerErrorException(
                    `AlphaVantage API error: ${res.status} ${res.statusText}`,
                );
            }

            data = await res.json();

        } catch (err) {
            if (
                err instanceof InternalServerErrorException ||
                err instanceof BadRequestException
            ) {
                throw err;
            }
            throw new InternalServerErrorException(
                'Failed to reach AlphaVantage API. Please try again later.',
            );
        }
        // AlphaVantage returns this message when rate limited (25/day on free tier)
        if (data['Information'] || data['Note']) {
            throw new InternalServerErrorException(
                'AlphaVantage rate limit reached (25 requests/day on free tier). Please try again tomorrow.',
            );
        }

        const timeSeries = data['Time Series (Daily)'];

        if (!timeSeries) {
            throw new BadRequestException(
                `No price data found for ${symbol}. Check if the symbol is correct.`,
            );
        }

        // Filter to date range and convert to { date, close }
        const start = new Date(startDate);
        const end = new Date(endDate);

        const result: PricePoint[] = Object.entries(timeSeries)
            .filter(([date]) => {
                const d = new Date(date);
                return d >= start && d <= end;
            })
            .map(([date, values]: [string, any]) => ({
                date,
                close: parseFloat(values['4. close']),
            }))
            .sort((a, b) => a.date.localeCompare(b.date)); // oldest → newest

        if (result.length === 0) {
            throw new BadRequestException(
                `No price data found for ${symbol} between ${startDate} and ${endDate}.`,
            );
        }

        return result;
    }
}