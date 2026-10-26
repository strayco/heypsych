/**
 * Legal and company pages (About, Privacy, Terms).
 *
 * The site footer already carries About, Privacy, and Terms, so this layout
 * adds no second footer. It only sets the page surface.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-canvas min-h-screen">{children}</div>;
}
