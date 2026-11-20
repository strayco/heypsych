/**
 * HeyPsych Admin — Consensus Score. Protected by the dashboard layout's admin
 * session check; the API it calls checks the session again on every request.
 */

import { ConsensusAdmin } from "./ConsensusAdmin";

export const metadata = {
  title: "Consensus Score",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ConsensusPage() {
  return <ConsensusAdmin />;
}
