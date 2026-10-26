import { IntentPage, intentMetadata } from "../_components/intent-page";

export const revalidate = 86400;
export const generateMetadata = () => intentMetadata("peer-support");

export default function Page() {
  return <IntentPage id="peer-support" />;
}
