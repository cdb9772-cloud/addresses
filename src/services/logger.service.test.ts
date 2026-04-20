process.env.ENV = "dev"

import loggerService from './logger.service';

describe('Logger Service - Log Levels', () => {

    it('should call info() and flush() without throwing', () => {
        expect(() => {
            loggerService.info({ message: 'info test', path: '/test' }).flush();
        }).not.toThrow();
    });

    it('should call error() and flush() without throwing', () => {
        expect(() => {
            loggerService.error({ message: 'error test', path: '/test' }).flush();
        }).not.toThrow();
    });

    it('should call warning() and flush() without throwing', () => {
        expect(() => {
            loggerService.warning({ message: 'warning test', path: '/test' }).flush();
        }).not.toThrow();
    });

    it('should call debug() and flush() without throwing', () => {
        expect(() => {
            loggerService.debug({ message: 'debug test', path: '/test' }).flush();
        }).not.toThrow();
    });

    it('should call fatal() and flush() without throwing', () => {
        expect(() => {
            loggerService.fatal({ message: 'fatal test', path: '/test' }).flush();
        }).not.toThrow();
    });

});

describe('Logger Service - Stdout Output', () => {
    let stdoutSpy: jest.SpyInstance;

    beforeEach(() => {
        stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        stdoutSpy.mockRestore();
    });

    it('should write to stdout when flush() is called', () => {
        loggerService.info({ message: 'stdout test', path: '/test' }).flush();
        expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should include the log level in the output', () => {
        loggerService.error({ message: 'level check', path: '/test' }).flush();
        const output = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0] as string;
        expect(output).toContain('[level]=error');
    });

    it('should include the message in the output', () => {
        loggerService.info({ message: 'hello world', path: '/test' }).flush();
        const output = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0] as string;
        expect(output).toContain("[message]='hello world'");
    });

    it('should include the path in the output', () => {
        loggerService.info({ message: 'path check', path: '/address/request' }).flush();
        const output = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0] as string;
        expect(output).toContain('[path]=/address/request');
    });

    it('should include a timestamp in the output', () => {
        loggerService.info({ message: 'time check', path: '/test' }).flush();
        const output = stdoutSpy.mock.calls[0][0] as string;
        expect(output).toContain('[time]=');
    });

    it('should include execution_time in the output', () => {
        loggerService.info({ message: 'exec time check', path: '/test' }).flush();
        const output = stdoutSpy.mock.calls[0][0] as string;
        expect(output).toContain('[execution_time]=');
    });

});

describe('Logger Service - Key Pairs', () => {
    let stdoutSpy: jest.SpyInstance;

    beforeEach(() => {
        stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        stdoutSpy.mockRestore();
    });

    it('should include custom key pairs in the output', () => {
        loggerService.info(
            { message: 'keypair test', path: '/test' },
            { userId: '123', action: 'login' }
        ).flush();
        const output = stdoutSpy.mock.calls[stdoutSpy.mock.calls.length - 1][0] as string;
        expect(output).toContain('[userId]=123');
        expect(output).toContain('[action]=login');
    });

    it('should not include key pair brackets when no key pairs are passed', () => {
        loggerService.info({ message: 'no keypairs', path: '/test' }).flush();
        const output = stdoutSpy.mock.calls[0][0] as string;
        // Should only have the standard structured fields
        expect(output).toContain('[time]=');
        expect(output).toContain('[level]=');
        expect(output).toContain('[message]=');
        expect(output).toContain('[path]=');
    });

    it('should handle an empty key pair object gracefully', () => {
        expect(() => {
            loggerService.info({ message: 'empty keypairs', path: '/test' }, {}).flush();
        }).not.toThrow();
    });

});

describe('Logger Service - Chaining', () => {

    it('should support method chaining before flush()', () => {
        expect(() => {
            loggerService
                .info({ message: 'chaining test', path: '/test' })
                .flush();
        }).not.toThrow();
    });

    it('flush() should return void', () => {
        const result = loggerService.info({ message: 'void test', path: '/test' }).flush();
        expect(result).toBeUndefined();
    });

});
