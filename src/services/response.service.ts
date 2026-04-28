const responseWrapper = (status: string, event_type: string, body: unknown): { status: string; event: string; body: unknown } => {
    return { status: status, event: event_type, body };
}

export default responseWrapper;