// frontend/src/components/PedigreeGraph.tsx

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import PatientModal from "./PatientModal";
import "../styles/PedigreeGraph.css"; // подключаем css

type Node = {
  id: number;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  generation: number;
  is_proband?: boolean;
  family_hyperchol?: boolean;
};

type Link = {
  source: number;
  target: number;
  type: string;
};

const colors = {
  vertical: "#1f77b4",
  horizontal: "#2ca02c",
  spouse: "#d62728",
  nodeFill: "#fff",
  probandFill: "#ffe082",
};

const legendItems = [
  { label: "Parent/Child", color: colors.vertical },
  { label: "Sibling", color: colors.horizontal },
  { label: "Spouse", color: colors.spouse },
  { label: "Proband", color: colors.probandFill },
];

const PedigreeGraph: React.FC<{ data: { nodes: Node[]; links: Link[] }; width?: number; height?: number }> = ({
  data,
  width = 1000,
  height = 600,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    if (!data || !data.nodes) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const nodes: Node[] = data.nodes.map((d) => ({ ...d }));
    const links: Link[] = data.links.slice();

    // группа для графа (будет зумироваться)
    const zoomG = svg
      .attr("width", width)
      .attr("height", height)
      .classed("pedigree-graph", true)
      .append("g");

    // zoom применяется только к zoomG
    svg.call(
      d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
      })
    );

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance((d: any) => (d.type === "vertical" ? 100 : 200))
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collision", d3.forceCollide().radius(35))
      .force("y", d3.forceY<Node>((d) => d.generation * 150).strength(0.5))
      .force("x", d3.forceX(width / 2).strength(0.05));

    const link = zoomG
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) => colors[d.type] || "#999")
      .attr("stroke-width", 2);

    const node = zoomG
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .on("click", (_, d) => setSelectedPatientId(d.id))
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("rect")
      .attr("x", -22)
      .attr("y", -22)
      .attr("width", 44)
      .attr("height", 44)
      .attr("fill", (d) => (d.is_proband ? colors.probandFill : colors.nodeFill))
      .attr("stroke", (d) => (d.family_hyperchol ? "red" : "#333"))
      .attr("stroke-width", (d) => (d.family_hyperchol ? 3 : 1.5));

    node
      .append("text")
      .text((d) => `${d.given_name || ""} ${d.family_name || ""}`.trim() || String(d.id))
      .attr("text-anchor", "middle")
      .attr("dy", 4);

    // легенда теперь фиксированная — вне zoomG
    const legend = svg.append("g").attr("class", "legend").attr("transform", `translate(${width - 180}, 20)`);
    legendItems.forEach((it, i) => {
      const y = i * 20;
      const row = legend.append("g").attr("transform", `translate(0, ${y})`);
      row.append("rect").attr("width", 14).attr("height", 14).attr("fill", it.color);
      row.append("text").attr("x", 20).attr("y", 12).text(it.label);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
  }, [data, width, height]);

  return (
    <>
      <svg ref={ref}></svg>
      {selectedPatientId && (
        <PatientModal patientId={selectedPatientId} onClose={() => setSelectedPatientId(null)} onSaved={() => {}} />
      )}
    </>
  );
};

export default PedigreeGraph;
