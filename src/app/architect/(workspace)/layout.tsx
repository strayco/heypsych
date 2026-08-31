// src/app/architect/(workspace)/layout.tsx
// Workspace layout - hides site header/footer for focused app experience

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        Hide the public site header and footer using stable ID selectors.
        The architect workspace provides its own focused application shell.
        IDs are defined in header.tsx (#site-header) and footer.tsx (#site-footer).
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* Hide public site chrome for architect workspace routes */
            #site-header,
            #site-footer {
              display: none !important;
            }

            /* Ensure the main content area fills the viewport */
            main {
              min-height: 100vh;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
