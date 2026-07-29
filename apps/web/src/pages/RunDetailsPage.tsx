export function RunDetailsPage() {
  return (
    <section className="panel">
      <h1>Run Details Shell</h1>
      <p className="muted">TODO: show sanitized run metrics, node status, model metadata, retries, and warnings.</p>
      <ul className="todo-list">
        <li>Requested and actual model.</li>
        <li>Latency and token metadata when available.</li>
        <li>Node durations and failures.</li>
        <li>No transcript, prompts, API keys, or reasoning traces.</li>
      </ul>
    </section>
  );
}

