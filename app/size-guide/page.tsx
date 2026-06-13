const measureGroups = [
  {
    title: "Tops",
    points: ["Chest", "Shoulder", "Length", "Sleeve"],
  },
  {
    title: "Bottoms",
    points: ["Waist", "Hip", "Inseam", "Length"],
  },
  {
    title: "Co-ords & Sets",
    points: ["Check both top and bottom measurements"],
  },
];

const fitNotes = [
  "Sizing can vary by style, cut and fabric.",
  "Use the measurements on each product page as the main reference.",
  "Compare with a similar item you already own, measured laid flat.",
  "Do not choose size by height and weight alone.",
];

export default function SizeGuidePage() {
  return (
    <main className="support-page size-page">
      <section className="support-hero support-hero-compact">
        <p className="support-kicker">Support</p>
        <h1>Size Guide</h1>
        <p>Use product measurements as the main reference before ordering.</p>
      </section>

      <section className="size-intro">
        <h2>How to measure</h2>
        <p>
          Compare the product measurements with a similar item you already own, measured laid flat. Different styles may fit relaxed, oversized or slim.
        </p>
      </section>

      <section className="measure-grid" aria-label="Measurement guide">
        {measureGroups.map((group) => (
          <article key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="fit-note-list" aria-label="Fit notes">
        {fitNotes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </section>

      <section className="size-help-panel">
        <div>
          <span>Need Help?</span>
          <p>If you are between sizes or unsure about the fit, email us with your height, weight, usual size, item name or link and preferred fit.</p>
        </div>
        <a href="mailto:support@cnfans.co.uk">support@cnfans.co.uk</a>
      </section>
    </main>
  );
}
