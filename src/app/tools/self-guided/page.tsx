import { IntentPage, intentMetadata } from "../_components/intent-page";

export const revalidate = 86400;
export const generateMetadata = () => intentMetadata("self-guided");

export default function Page() {
  return <IntentPage id="self-guided" />;
}
