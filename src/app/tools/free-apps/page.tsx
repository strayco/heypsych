import { IntentPage, intentMetadata } from "../_components/intent-page";

export const revalidate = 86400;
export const generateMetadata = () => intentMetadata("free-apps");

export default function Page() {
  return <IntentPage id="free-apps" />;
}
