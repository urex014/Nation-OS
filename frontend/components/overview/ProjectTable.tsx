import type { OverviewProject } from "@/lib/types";

export function ProjectTable({ projects }: { projects: OverviewProject[] }) {
  return (
    <section className="panel">
      <h2 className="eyebrow" id="project-table-label">
        Appropriated items
      </h2>
      {projects.length === 0 ? (
        <p className="quiet">No appropriated items are loaded for this jurisdiction.</p>
      ) : (
        <div
          className="table-wrap"
          tabIndex={0}
          role="region"
          aria-labelledby="project-table-label"
        >
          <table className="data">
            <thead>
              <tr>
                <th>Item</th>
                <th>Agency</th>
                <th>Approved</th>
                <th>Progress</th>
                <th>Expected</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td data-label="Item">{project.name}</td>
                  <td data-label="Agency">{project.agency}</td>
                  <td data-label="Approved">{project.approved}</td>
                  <td data-label="Progress">
                    {project.progress == null ? (
                      "—"
                    ) : (
                      <span className="progress">
                        <span className="meter" aria-hidden="true">
                          <span style={{ width: `${project.progress}%` }} />
                        </span>
                        {project.progress}%
                      </span>
                    )}
                  </td>
                  <td data-label="Expected">{project.expected}</td>
                  <td data-label="Status">
                    <span className={`badge badge-${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
