export type AnalysisMetricStub = {
  analysisRunId: string;
  nodeName: string;
  durationMs: number;
};

export function recordAnalysisMetric(_metric: AnalysisMetricStub) {
  throw new Error("TODO: implement sanitized metrics storage in your branch");
}

