export const RUNNER_SCOPE = {
  REQUEST: 'request',
  FOLDER: 'folder',
  COLLECTION: 'collection',
}

export function createRunnerConfig(overrides = {}) {
  return {
    scope: RUNNER_SCOPE.REQUEST,
    iterations: 1,
    delayMs: 1,
    timeoutMs: 30000,
    stopOnError: false,
    runPreRequest: true,
    runTests: true,
    persistEnvironmentVariables: false,
    executionOrder: 'tree',
    ...overrides,
  }
}

export function createRunnerState() {
  return {
    status: 'idle',
    total: 0,
    completed: 0,
    passed: 0,
    failed: 0,
    results: [],
    currentRequestId: null,
    currentIteration: 0,
    startedAt: null,
    finishedAt: null,
    error: null,
  }
}

export function createRunnerResult({
  request,
  iteration,
  row,
  status = 'passed',
  statusCode = null,
  responseTime = null,
  response = null,
  error = null,
  tests = [],
}) {
  return {
    id: crypto.randomUUID(),
    requestId: request?.id ?? null,
    requestName: request?.name || 'New Request',
    folderId: null,
    folderPath: [],
    iteration,
    row: row ?? {},
    status,
    statusCode,
    responseTime,
    response,
    error,
    tests,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  }
}
