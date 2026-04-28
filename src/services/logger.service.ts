import { ILoggerBody, ILoggerTransports } from '../interfaces/logger.interface';

class Logger {
    private cache: Array<string>;
    private host: string;
    private writeToStdOut: boolean;
    private startTime: number;

    public constructor(transport: ILoggerTransports) {
        this.cache = Array<string>();
        this.host = transport.host || '';
        this.writeToStdOut = transport.writeToStdOut || true;
        this.startTime = Date.now();
    }

    /**
     * @description This method accepts a structured log format and saves it to an internal cache to be flushed
     *              at a later time.
     * @param logType A interface that accepts the request path and the log message
     * @param fieldSet An empty object that extending the logging frame with custom structured key value pairs.
     */
    public fatal(logType: ILoggerBody, logKeyPairs: Record<string, unknown> = {}): Logger {
        this.log(logType, 'fatal', logKeyPairs);
        return this;
    }

    /**
     * @description This method accepts a structured log format and saves it to an internal cache to be flushed
     *              at a later time.
     * @param logType A interface that accepts the request path and the log message
     * @param logKeyPairs An empty object that extending the logging frame with custom structured key value pairs.
     */
    public error(logType: ILoggerBody, logKeyPairs: Record<string, unknown> = {}): Logger {
        this.log(logType, 'error', logKeyPairs);
        return this;
    }

    /**
     * @description This method accepts a structured log format and saves it to an internal cache to be flushed
     *              at a later time.
     * @param logType A interface that accepts the request path and the log message
     * @param logKeyPairs An empty object that extending the logging frame with custom structured key value pairs.
     */
    public warning(logType: ILoggerBody, logKeyPairs: Record<string, unknown> = {}): Logger {
        this.log(logType, 'warning', logKeyPairs);
        return this;
    }

    /**
     * @description This method accepts a structured log format and saves it to an internal cache to be flushed
     *              at a later time.
     * @param logType A interface that accepts the request path and the log message
     * @param logKeyPairs An empty object that extending the logging frame with custom structured key value pairs.
     */
    public info(logType: ILoggerBody, logKeyPairs: Record<string, unknown> = {}): Logger {
        this.log(logType, 'info', logKeyPairs);
        return this;
    }

    /**
     * @description This method accepts a structured log format and saves it to an internal cache to be flushed
     *              at a later time.
     * @param logType A interface that accepts the request path and the log message
     * @param logKeyPairs An empty object that extending the logging frame with custom structured key value pairs.
     */
    public debug(logType: ILoggerBody, logKeyPairs: Record<string, unknown> = {}): Logger {
        this.log(logType, 'debug', logKeyPairs);
        return this;
    }

    /**
     * @description Clears the internal log cache amd reset startTime for executionTime
     */
    public clearCache(): void {
        this.cache = [];
        this.startTime = Date.now();
    }

    /**
     * @description write log to transport (log file, standard out or log aggregator service (i.e: datadog))
     */
    public flush(): void {
        this.writeToStandardOut();
        this.clearCache();
    }

    /**
     * @description write log console (stdout).
     */
    private writeToStandardOut(): void {
        if (this.writeToStdOut) {
            for (let log of this.cache) {
                process.stdout.write(`${log}\n`);
            }
        }
    }

    /**
     * @description write log to an aggregation service (like Prometheus | Grafana Loki).
     */
    private sendLogsToAggregatorService(): void {
        //TODO: Implement logic to send log to a log aggregattion service like Prometheus | Grafana Loki.
    }

    private log(logType: ILoggerBody, level: string, logKeyPairs?:  Record<string, unknown>): void {
        const keySetValues = this.parseLogKeyPairs(logKeyPairs);
        const logMessage = `[time]=${this.timeStamp()} [level]=${level} [message]='${logType.message}' ${keySetValues}[path]=${logType.path} [execution_time]=${this.executionTime()}ms`;

        this.cache.push(logMessage);
    }

    /**
     * @description calculation request execution time.
     * @returns The execution time of the request.
     */
    private executionTime(): number {
        return Date.now() - this.startTime;
    }

    /**
     * @description creates a timestamp for the log object.
     * @returns The timestamp the log was created.
     */
    private timeStamp(): string {
        // const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let currentTime = new Date();
        let timeStamp = currentTime.toString()

        return `${timeStamp} `;
    }

    /**
     * @param logKeyPair An object containing a key value pair of added log values.
     * @returns A formatted string in a structured log format.
     */
    private parseLogKeyPairs(logKeyPairs: Record<string, unknown> = {}): string {
        let formattedKeyPairs = '';
        if (Object.keys(logKeyPairs).length === 0) {
            return formattedKeyPairs;
        }

        for (let key in logKeyPairs) {
            formattedKeyPairs += `[${key}]=${logKeyPairs[key]} `;
        }

        return formattedKeyPairs;
    }
}

export default new Logger({ host: '', writeToStdOut: true });