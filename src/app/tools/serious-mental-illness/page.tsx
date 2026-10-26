// /tools/serious-mental-illness — patient need page (src/app/tools/_components/need-page.tsx).
import { NeedPage, needMetadata } from "../_components/need-page";

export const revalidate = 86400;
export const generateMetadata = () => needMetadata("serious-mental-illness");

export default function Page() {
  return <NeedPage id="serious-mental-illness" />;
}
