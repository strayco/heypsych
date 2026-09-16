/**
 * Component Sheet
 *
 * Side sheet (desktop) or bottom sheet (mobile) for component interactions.
 * Shows: Component info, recommendations, and quick actions.
 */

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Ban, ExternalLink } from "lucide-react";
import type { ComponentId } from "@/domains/architect/schemas/practice-v2";
import {
  COMPONENT_DEFINITIONS,
  type ComponentDefinition,
} from "@/domains/architect/component-mapping";

interface ComponentSheetProps {
  /** Component being viewed (null = closed) */
  componentId: ComponentId | null;
  /** Close handler */
  onClose: () => void;
  /** Handler for "Already handled" action */
  onAlreadyHandled: (componentId: ComponentId, provider?: string) => void;
  /** Handler for "Don't need this" action */
  onNotNeeded: (componentId: ComponentId) => void;
  /** Whether this is mobile view */
  isMobile: boolean;
  /** Recommendation content (rendered by parent) */
  children?: React.ReactNode;
}

export function ComponentSheet({
  componentId,
  onClose,
  onAlreadyHandled,
  onNotNeeded,
  isMobile,
  children,
}: ComponentSheetProps) {
  const [providerInput, setProviderInput] = useState("");
  const [showProviderInput, setShowProviderInput] = useState(false);

  const component = componentId ? COMPONENT_DEFINITIONS[componentId] : null;

  // Reset state when component changes
  useEffect(() => {
    setProviderInput("");
    setShowProviderInput(false);
  }, [componentId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleAlreadyHandled = () => {
    if (componentId) {
      onAlreadyHandled(componentId, providerInput || undefined);
      onClose();
    }
  };

  const handleSelectExternalProvider = (providerName: string) => {
    if (componentId) {
      onAlreadyHandled(componentId, providerName);
      onClose();
    }
  };

  const handleNotNeeded = () => {
    if (componentId) {
      onNotNeeded(componentId);
      onClose();
    }
  };

  if (isMobile) {
    return (
      <MobileSheet isOpen={!!componentId} onClose={onClose}>
        {component && (
          <SheetContent
            component={component}
            showProviderInput={showProviderInput}
            setShowProviderInput={setShowProviderInput}
            providerInput={providerInput}
            setProviderInput={setProviderInput}
            onAlreadyHandled={handleAlreadyHandled}
            onSelectExternalProvider={handleSelectExternalProvider}
            onNotNeeded={handleNotNeeded}
          >
            {children}
          </SheetContent>
        )}
      </MobileSheet>
    );
  }

  return (
    <DesktopSheet isOpen={!!componentId} onClose={onClose}>
      {component && (
        <SheetContent
          component={component}
          showProviderInput={showProviderInput}
          setShowProviderInput={setShowProviderInput}
          providerInput={providerInput}
          setProviderInput={setProviderInput}
          onAlreadyHandled={handleAlreadyHandled}
          onSelectExternalProvider={handleSelectExternalProvider}
          onNotNeeded={handleNotNeeded}
        >
          {children}
        </SheetContent>
      )}
    </DesktopSheet>
  );
}

// Desktop: Right-side panel
function DesktopSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto bg-surface shadow-floating"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-separator bg-surface px-4 py-3">
              <span className="text-sm font-medium text-label-secondary">
                Component Details
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-label-secondary transition-colors hover:bg-fill-secondary hover:text-label-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Mobile: Bottom sheet
function MobileSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface shadow-floating"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 flex justify-center bg-surface pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-fill-secondary" />
            </div>
            <div className="px-4 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Shared content
function SheetContent({
  component,
  showProviderInput,
  setShowProviderInput,
  providerInput,
  setProviderInput,
  onAlreadyHandled,
  onSelectExternalProvider,
  onNotNeeded,
  children,
}: {
  component: ComponentDefinition;
  showProviderInput: boolean;
  setShowProviderInput: (show: boolean) => void;
  providerInput: string;
  setProviderInput: (value: string) => void;
  onAlreadyHandled: () => void;
  onSelectExternalProvider: (providerName: string) => void;
  onNotNeeded: () => void;
  children?: React.ReactNode;
}) {
  const Icon = component.icon;

  return (
    <div className="space-y-6">
      {/* Component header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fill-secondary">
          <Icon className="h-6 w-6 text-label-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-label-primary">
            {component.name}
          </h2>
          <p className="mt-1 text-sm text-label-secondary">
            {component.description}
          </p>
        </div>
      </div>

      {/* Recommendations (from parent) */}
      {children}

      {/* External component (website, malpractice) */}
      {component.isExternal && component.externalLinks && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-label-primary">
            Popular providers
          </h3>
          <div className="space-y-2">
            {component.externalLinks.map((link) => (
              <div
                key={link.name}
                className="flex items-center justify-between rounded-xl border border-separator bg-surface p-3 transition-colors hover:border-accent hover:bg-accent/5"
              >
                <button
                  onClick={() => onSelectExternalProvider(link.name)}
                  className="flex-1 text-left"
                >
                  <span className="text-sm font-medium text-label-primary">
                    {link.name}
                  </span>
                  {link.description && (
                    <p className="text-xs text-label-secondary">
                      {link.description}
                    </p>
                  )}
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-2 rounded-lg p-2 text-label-tertiary transition-colors hover:bg-fill-secondary hover:text-accent"
                  title={`Visit ${link.name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3 border-t border-separator pt-4">
        <h3 className="text-sm font-semibold text-label-primary">
          Quick actions
        </h3>

        {/* Already handled */}
        <div className="space-y-2">
          {showProviderInput ? (
            <div className="space-y-2">
              <input
                type="text"
                value={providerInput}
                onChange={(e) => setProviderInput(e.target.value)}
                placeholder="Provider name (optional)"
                className="w-full rounded-xl border border-separator bg-surface px-4 py-2.5 text-sm text-label-primary placeholder:text-label-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={onAlreadyHandled}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-positive px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-positive/90"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </button>
                <button
                  onClick={() => setShowProviderInput(false)}
                  className="rounded-xl border border-separator px-4 py-2.5 text-sm font-medium text-label-secondary transition-colors hover:bg-fill-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowProviderInput(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-separator bg-surface p-3 text-left transition-colors hover:border-positive hover:bg-positive/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-positive/10 text-positive">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-label-primary">
                  Already handled
                </span>
                <p className="text-xs text-label-secondary">
                  I have this covered elsewhere
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Don't need this */}
        <button
          onClick={onNotNeeded}
          className="flex w-full items-center gap-3 rounded-xl border border-separator bg-surface p-3 text-left transition-colors hover:border-negative/30 hover:bg-negative/5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fill-secondary text-label-secondary">
            <Ban className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-label-primary">
              Don't need this
            </span>
            <p className="text-xs text-label-secondary">
              Remove from my practice
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
