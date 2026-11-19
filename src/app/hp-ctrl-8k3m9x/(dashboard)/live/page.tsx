/**
 * HeyPsych Admin — Live updates. Protected by the dashboard layout's admin
 * session check; the API it calls checks the session again on every request.
 */

import { LiveAdmin } from "./LiveAdmin";

export const metadata = {
  title: "Live updates",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function LiveUpdatesPage() {
  return <LiveAdmin />;
}
