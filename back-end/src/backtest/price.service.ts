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
import {
    dateStringToEpochMs,
    epochMsToDateString,
} from '../common/helpers/date.helper';

export interface PricePoint {
    date: number; // epoch milliseconds e.g. 1735689600000
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
        startDate: number,
        endDate: number,
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
    /**
   * Fetches historical prices from CoinGecko API.
   *
   * Flow:
   * 1. Convert epoch ms to Unix seconds (CoinGecko requires seconds, not ms)
   * 2. Build URL with coin ID (e.g. 'bitcoin'), from/to, send API key in header
   * 3. Handle rate limit (429) and other HTTP errors
   * 4. Parse response: CoinGecko returns [[timestamp_ms, price], ...]
   * 5. Deduplicate — keep only one entry per day (CoinGecko may return multiple)
   * 6. Store each day as UTC midnight epoch ms for consistency
   * 7. Return array of { date: epoch_ms, close }
   */

    private async fetchFromCoinGecko(
        symbol: string,
        startDate: number,
        endDate: number,
    ): Promise<PricePoint[]> {
        const coinId = COINGECKO_SYMBOLS[symbol];

        // CoinGecko uses Unix timestamps (seconds)
        const from = Math.floor(startDate / 1000);
        const to = Math.floor(endDate / 1000);

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
            const dayKey = epochMsToDateString(timestampMs);
            if (!seen.has(dayKey)) {
                seen.add(dayKey);
                result.push({ date: dateStringToEpochMs(dayKey), close: price });
            }
        }

        return result;
    }

    // ---------------------------------------------------------------------------
    // AlphaVantage – stock prices
    // ---------------------------------------------------------------------------
    /**
   * Fetches historical prices from AlphaVantage API.
   *
   * Flow:
   * 1. Check API key is configured in .env
   * 2. Call TIME_SERIES_DAILY with outputsize=compact (last 100 trading days, free tier)
   * 3. Handle rate limit — AlphaVantage returns 200 with an 'Information' or 'Note'
   *    field when limited instead of using HTTP 429, so must check manually
   * 4. Parse 'Time Series (Daily)' object: keys are YYYY-MM-DD strings, values contain OHLC
   * 5. Filter entries to the requested date range using epoch ms comparison
   * 6. Convert date strings to epoch ms and parse the close price as a float
   * 7. Sort oldest to newest (AlphaVantage returns newest first) and return
   */

    private async fetchFromAlphaVantage(
        symbol: string,
        startDate: number,
        endDate: number,
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

        const result: PricePoint[] = Object.entries(timeSeries)
            .filter(([dateStr]) => {
                const epochMs = dateStringToEpochMs(dateStr);
                return epochMs >= startDate && epochMs <= endDate;
            })
            .map(([dateStr, values]: [string, any]) => ({
                date: dateStringToEpochMs(dateStr),
                close: parseFloat(values['4. close']),
            }))
            .sort((a, b) => a.date - b.date); // numeric sort instead of string sort

        if (result.length === 0) {
            throw new BadRequestException(
                `No price data found for ${symbol} between ${startDate} and ${endDate}.`,
            );
        }

        return result;
    }
}