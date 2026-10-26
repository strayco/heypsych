// /tools/substance-use — patient need page (src/app/tools/_components/need-page.tsx).
import { NeedPage, needMetadata } from "../_components/need-page";

export const revalidate = 86400;
export const generateMetadata = () => needMetadata("substance-use");

export default function Page() {
  return <NeedPage id="substance-use" />;
}
