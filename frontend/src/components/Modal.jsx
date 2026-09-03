import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/* =========================================================
   DESIGN TOKENS
========================================================= */

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-5xl",
};

const CONTAINER = {
  bottom:
    "fixed inset-x-0 bottom-0 flex items-end justify-center p-4 sm:p-6",

  top:
    "fixed inset-x-0 top-0 flex items-start justify-center p-4 sm:p-6",

  left:
    "fixed inset-y-0 left-0 flex items-center justify-start p-4 sm:p-6",

  right:
    "fixed inset-y-0 right-0 flex items-center justify-end p-4 sm:p-6",

  center:
    "fixed inset-0 flex items-center justify-center p-4",
};

const SHAPE = {
  bottom: "rounded-3xl",
  top: "rounded-3xl",
  left: "h-full max-h-[min(100%,640px)] rounded-3xl",
  right: "h-full max-h-[min(100%,640px)] rounded-3xl",
  center: "rounded-3xl",
};

/*
 * Slight movement + scale + opacity gives the sheet a
 * polished floating transition without being too dramatic.
 */
const VARIANTS = {
  bottom: {
    hidden: {
      y: "18%",
      scale: 0.985,
      opacity: 0,
    },

    visible: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
  },

  top: {
    hidden: {
      y: "-18%",
      scale: 0.985,
      opacity: 0,
    },

    visible: {
      y: 0,
      scale: 1,
      opacity: 1,
    },
  },

  left: {
    hidden: {
      x: "-18%",
      scale: 0.985,
      opacity: 0,
    },

    visible: {
      x: 0,
      scale: 1,
      opacity: 1,
    },
  },

  right: {
    hidden: {
      x: "18%",
      scale: 0.985,
      opacity: 0,
    },

    visible: {
      x: 0,
      scale: 1,
      opacity: 1,
    },
  },

  center: {
    hidden: {
      scale: 0.94,
      opacity: 0,
    },

    visible: {
      scale: 1,
      opacity: 1,
    },
  },
};

/* =========================================================
   MODAL
========================================================= */

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  footer = null,
  className = "",
  zIndex = 50,
  position = "bottom",

  /*
   * Slightly softer spring than the original.
   */
  springStiffness = 380,
  springDamping = 32,
  springMass = 0.9,
}) => {
  const sheetRef = useRef(null);
  const previousActiveElement = useRef(null);
  const wasOpenRef = useRef(false);

  const prefersReducedMotion = useReducedMotion();

  /*
   * Keep the latest onClose without making our modal lifecycle
   * effect depend on the identity of the parent's callback.
   *
   * This is important for mobile keyboard stability.
   */
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  /*
   * Stable callback.
   *
   * Parent re-renders will not recreate this function.
   */
  const handleClose = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  /* =========================================================
     MODAL LIFECYCLE

     Handles:
     - Escape
     - body scroll lock
     - focus trap
     - focus restoration

     IMPORTANT:
     We intentionally do NOT focus the first input when the
     modal opens. Android keyboards can behave badly when focus
     is programmatically moved during modal animation.
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    /*
     * Don't repeat the open lifecycle if the parent simply
     * re-renders while the modal is already open.
     */
    if (wasOpenRef.current) {
      return;
    }

    wasOpenRef.current = true;

    previousActiveElement.current = document.activeElement;

    const handleKeyDown = (e) => {
      /* ---------------------------------------------
         ESCAPE
      --------------------------------------------- */

      if (closeOnEscape && e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      /* ---------------------------------------------
         FOCUS TRAP
      --------------------------------------------- */

      if (e.key !== "Tab" || !sheetRef.current) {
        return;
      }

      const focusable =
        sheetRef.current.querySelectorAll(
          `
            button:not([disabled]),
            [href],
            input:not([disabled]),
            select:not([disabled]),
            textarea:not([disabled]),
            [tabindex]:not([tabindex="-1"])
          `
        );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last =
        focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (
        document.activeElement === last
      ) {
        e.preventDefault();
        first.focus();
      }
    };

    /* ---------------------------------------------
       BODY SCROLL LOCK
    --------------------------------------------- */

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;

    const previousOverflow =
      document.body.style.overflow;

    const previousPaddingRight =
      document.body.style.paddingRight;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    /*
     * DO NOT automatically focus the input.
     *
     * We only focus the modal itself if nothing currently
     * has focus.
     *
     * This avoids Android keyboard flickering.
     */
    const focusTimer = window.setTimeout(() => {
      const activeElement = document.activeElement;

      if (
        sheetRef.current &&
        (!activeElement ||
          activeElement === document.body ||
          !sheetRef.current.contains(
            activeElement
          ))
      ) {
        sheetRef.current.focus({
          preventScroll: true,
        });
      }
    }, 50);

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow =
        previousOverflow;

      document.body.style.paddingRight =
        previousPaddingRight;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      /*
       * Restore focus only when the modal is actually
       * being closed.
       *
       * We don't want cleanup caused by a parent render
       * to steal focus from a text input.
       */
      if (!wasOpenRef.current) {
        return;
      }

      const previous =
        previousActiveElement.current;

      if (
        previous &&
        typeof previous.focus === "function" &&
        document.contains(previous)
      ) {
        requestAnimationFrame(() => {
          try {
            previous.focus({
              preventScroll: true,
            });
          } catch {
            previous.focus();
          }
        });
      }
    };
  }, [
    isOpen,
    closeOnEscape,
    handleClose,
  ]);

  /*
   * Mark the modal as closed.
   */
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen]);

  /* =========================================================
     POSITION / ANIMATION
  ========================================================= */

  const variant =
    VARIANTS[position] || VARIANTS.bottom;

  const shape =
    SHAPE[position] || SHAPE.bottom;

  const container =
    CONTAINER[position] || CONTAINER.bottom;

  const springTransition = prefersReducedMotion
    ? {
        duration: 0.15,
      }
    : {
        type: "spring",
        stiffness: springStiffness,
        damping: springDamping,
        mass: springMass,
      };

  /* =========================================================
     DRAG

     Bottom sheets can still be dragged down, but form controls
     are protected from sheet gestures.
  ========================================================= */

  const dragProps = useMemo(() => {
    if (
      position !== "bottom" ||
      prefersReducedMotion
    ) {
      return {};
    }

    return {
      drag: "y",

      dragConstraints: {
        top: 0,
        bottom: 0,
      },

      dragElastic: {
        top: 0,
        bottom: 0.35,
      },

      onDragStart: (event) => {
        const target = event?.target;

        if (
          target instanceof HTMLElement &&
          target.closest(
            `
              input,
              textarea,
              select,
              button,
              [contenteditable="true"]
            `
          )
        ) {
          return;
        }
      },

      onDragEnd: (_, info) => {
        if (
          info.offset.y > 120 ||
          info.velocity.y > 500
        ) {
          handleClose();
        }
      },
    };
  }, [
    position,
    prefersReducedMotion,
    handleClose,
  ]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0"
          style={{
            zIndex,
          }}
        >
          {/* =================================================
              BACKDROP
          ================================================= */}

          <motion.div
            className="
              fixed
              inset-0
              bg-slate-900/40
              backdrop-blur-[2px]
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            onClick={
              closeOnOutsideClick
                ? handleClose
                : undefined
            }
          />

          {/* =================================================
              MODAL CONTAINER
          ================================================= */}

          <div className={container}>
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={
                title
                  ? "modal-title"
                  : undefined
              }
              tabIndex={-1}
              className={`
                relative
                flex
                w-full
                flex-col
                outline-none

                ${SIZES[size]}
                ${shape}

                max-h-[calc(100dvh-2rem)]
                sm:max-h-[calc(100vh-3rem)]

                overflow-hidden

                border
                border-slate-200/80
                bg-white
                shadow-2xl

                ${className}
              `}
              variants={variant}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={springTransition}
              onClick={(e) => {
                e.stopPropagation();
              }}
              {...dragProps}
            >
              {/* =================================================
                  MOBILE SHEET HANDLE
              ================================================= */}

              {position === "bottom" && (
                <div
                  className="
                    flex
                    shrink-0
                    justify-center
                    pt-3
                    pb-1
                    sm:hidden
                  "
                >
                  <div
                    className="
                      h-1.5
                      w-10
                      rounded-full
                      bg-slate-300
                    "
                  />
                </div>
              )}

              {/* =================================================
                  HEADER
              ================================================= */}

              {(title ||
                showCloseButton) && (
                <div
                  className="
                    sticky
                    top-0
                    z-10
                    flex
                    shrink-0
                    items-start
                    justify-between
                    gap-4
                    border-b
                    border-slate-100
                    bg-white/95
                    px-6
                    py-4
                    backdrop-blur-sm
                  "
                >
                  <div className="min-w-0">
                    {subtitle && (
                      <p
                        className="
                          mb-0.5
                          truncate
                          font-mono
                          text-[11px]
                          uppercase
                          tracking-wider
                          text-slate-400
                        "
                      >
                        {subtitle}
                      </p>
                    )}

                    {title && (
                      <h2
                        id="modal-title"
                        className="
                          truncate
                          text-lg
                          font-semibold
                          tracking-tight
                          text-slate-900
                        "
                      >
                        {title}
                      </h2>
                    )}
                  </div>

                  {showCloseButton && (
                    <motion.button
                      type="button"
                      onClick={handleClose}
                      whileHover={{
                        scale: 1.06,
                      }}
                      whileTap={{
                        scale: 0.92,
                      }}
                      className="
                        flex
                        h-9
                        w-9
                        flex-none
                        items-center
                        justify-center
                        rounded-xl
                        text-slate-400
                        transition-colors
                        hover:bg-slate-100
                        hover:text-slate-900
                      "
                      aria-label="Close"
                    >
                      <X
                        size={18}
                        strokeWidth={2}
                      />
                    </motion.button>
                  )}
                </div>
              )}

              {/* =================================================
                  SCROLLABLE CONTENT

                  flex-1 + min-h-0 prevents the content from
                  forcing the sheet outside the viewport.

                  touch-pan-y allows normal mobile scrolling
                  without touch-none interfering with inputs.
              ================================================= */}

              <div
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  overscroll-contain

                  px-6
                  py-5

                  touch-pan-y

                  [scrollbar-width:none]
                  [-ms-overflow-style:none]
                  [&::-webkit-scrollbar]:hidden
                "
                onPointerDown={(e) => {
                  /*
                   * Don't allow pointer events from form
                   * controls to bubble into sheet interactions.
                   */
                  if (
                    e.target instanceof HTMLElement &&
                    e.target.closest(
                      `
                        input,
                        textarea,
                        select,
                        button,
                        [contenteditable="true"]
                      `
                    )
                  ) {
                    e.stopPropagation();
                  }
                }}
              >
                {children}
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              {footer && (
                <div
                  className="
                    sticky
                    bottom-0
                    shrink-0
                    border-t
                    border-slate-100
                    bg-white/95
                    px-6
                    py-4
                    backdrop-blur-sm
                  "
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;