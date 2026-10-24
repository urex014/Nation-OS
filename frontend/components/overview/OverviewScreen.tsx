import Link from "next/link";
import { CitizenQuery } from "@/components/overview/CitizenQuery";
import { IndicatorRow } from "@/components/overview/IndicatorRow";
import { JurisdictionBoard } from "@/components/overview/JurisdictionBoard";
import { KpiGrid } from "@/components/overview/KpiGrid";
import { PriorityList } from "@/components/overview/PriorityList";
import { ProjectTable } from "@/components/overview/ProjectTable";
import { RevenueCurve } from "@/components/overview/RevenueCurve";
import type { Overview } from "@/lib/types";

export function OverviewScreen({ data }: { data: Overview }) {
  return (
    <>
      {data.note ? <p className="note">{data.note}</p> : null}
      {data.jurisdictionId !== "all" ? (
        <p>
          <Link href="/">Show the national position</Link>
        </p>
      ) : null}
      <KpiGrid metrics={data.metrics} />
      <IndicatorRow indicators={data.indicators} />
      <div className="split">
        <RevenueCurve {...data.revenueTrajectory} />
        <PriorityList priorities={data.priorities} />
      </div>
      <JurisdictionBoard jurisdictions={data.jurisdictions} current={data.jurisdictionId} />
      <ProjectTable projects={data.projects} />
      <CitizenQuery />
    </>
  );
}
