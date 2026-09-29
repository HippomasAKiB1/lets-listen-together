"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

export interface ConfirmModalOptions {
  title: string;
  message: string;
  variant?: "danger" | "info" | "warning";
  confirmLabel?: string;
  cancelLabel?: string | null;
}

type ConfirmFunction = (options: ConfirmModalOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function useConfirm(): ConfirmFunction {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ModalProvider");
  }
  return context;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmModalOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalBoxRef = useRef<HTMLDivElement | null>(null);

  const confirm = useCallback((options: ConfirmModalOptions): Promise<boolean> => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      triggerElementRef.current = document.activeElement;
    }
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setModalState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const closeWith = useCallback((result: boolean) => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    const resolver = resolverRef.current;
    resolverRef.current = null;
    if (resolver) {
      resolver(result);
    }
    // Return focus to trigger element
    if (triggerElementRef.current) {
      try {
        triggerElementRef.current.focus();
      } catch {}
      triggerElementRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    closeWith(false);
  }, [closeWith]);

  const handleConfirm = useCallback(() => {
    closeWith(true);
  }, [closeWith]);

  // Lock body scroll and trap focus / escape key when open
  useEffect(() => {
    if (!modalState.isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus default button (cancel button if present for safety, else confirm button)
    const timer = setTimeout(() => {
      if (modalState.options?.cancelLabel !== null && cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      } else if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
        return;
      }

      if (e.key === "Tab") {
        const focusableButtons: HTMLButtonElement[] = [];
        if (cancelBtnRef.current) focusableButtons.push(cancelBtnRef.current);
        if (confirmBtnRef.current) focusableButtons.push(confirmBtnRef.current);

        if (focusableButtons.length <= 1) {
          e.preventDefault();
          focusableButtons[0]?.focus();
          return;
        }

        const first = focusableButtons[0];
        const last = focusableButtons[focusableButtons.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalState.isOpen, modalState.options, handleCancel]);

  const { isOpen, options } = modalState;
  const isSingleButton = options?.cancelLabel === null;
  const isDanger = options?.variant === "danger" || !options?.variant;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {isOpen && options && (
        <div
          className="confirm-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 10, 10, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
            backdropFilter: "none",
          }}
          onClick={(e) => {
            // Backdrop click dismisses
            if (modalBoxRef.current && !modalBoxRef.current.contains(e.target as Node)) {
              handleCancel();
            }
          }}
          role="presentation"
        >
          <div
            ref={modalBoxRef}
            className="confirm-modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              border: "2px solid var(--ink)",
              boxShadow: "6px 6px 0px #0A0A0A",
              width: "calc(100vw - 32px)",
              maxWidth: "420px",
              borderRadius: "0px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backdropFilter: "none",
              backgroundImage: "none",
            }}
          >
            {/* Header strip */}
            <header
              className="confirm-modal-header"
              id="confirm-modal-title"
              style={{
                height: "44px",
                minHeight: "44px",
                background: "var(--ink)",
                color: "#E8FF00",
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                fontFamily: "var(--font-display, monospace)",
                fontWeight: 900,
                fontSize: "14px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderBottom: "2px solid var(--ink)",
              }}
            >
              {options.title.toUpperCase()}
            </header>

            {/* Modal Message Body */}
            <div
              className="confirm-modal-body"
              id="confirm-modal-desc"
              style={{
                padding: "24px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "var(--ink)",
                fontWeight: 700,
                textTransform: "uppercase",
                background: "var(--surface)",
              }}
            >
              {options.message.toUpperCase()}
            </div>

            {/* Modal Actions Footer */}
            <footer
              className="confirm-modal-footer"
              style={{
                display: "flex",
                gap: "12px",
                paddingLeft: "24px",
                paddingRight: "24px",
                paddingTop: "0px",
                paddingBottom: "calc(24px + var(--safe-bottom))",
                background: "var(--surface)",
              }}
            >
              {!isSingleButton && (
                <button
                  ref={cancelBtnRef}
                  type="button"
                  onClick={handleCancel}
                  className="confirm-modal-btn-cancel"
                  style={{
                    flex: 1,
                    minHeight: "44px",
                    background: "var(--bg)",
                    color: "var(--ink)",
                    border: "2px solid var(--ink)",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    boxShadow: "2px 2px 0px var(--ink)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0px",
                    padding: "8px 16px",
                  }}
                >
                  {options.cancelLabel || "CANCEL"}
                </button>
              )}
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirm}
                className={`confirm-modal-btn-confirm ${isDanger ? "is-danger" : ""}`}
                style={{
                  flex: 1,
                  minHeight: "44px",
                  background: isDanger ? "#FF2E2E" : "var(--accent)",
                  color: isDanger ? "#FFFFFF" : "#0A0A0A",
                  border: "2px solid var(--ink)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "12px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px var(--ink)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0px",
                  padding: "8px 16px",
                }}
              >
                {options.confirmLabel || (isSingleButton ? "OK" : "CONFIRM")}
              </button>
            </footer>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
