import { IntentPage, intentMetadata } from "../_components/intent-page";

export const revalidate = 86400;
export const generateMetadata = () => intentMetadata("online-therapy");

export default function Page() {
  return <IntentPage id="online-therapy" />;
}
