import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";

// Function to get current scenario from localStorage
const getCurrentScenario = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("liveblocks-scenario") || "";
};

// Create a function that returns the extension
export const createBlockInputExtension = () => {
  return Extension.create({
    name: "blockInput",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            // Block typing and content modifications only when auth-hidden
            handleKeyPress: () => getCurrentScenario() === "auth-hidden",
            handleKeyDown: (view, event) => {
              if (getCurrentScenario() !== "auth-hidden") return false;

              // Allow navigation keys (arrows, home, end, etc.)
              const navigationKeys = [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
                "PageUp",
                "PageDown",
                "Tab",
                "Escape",
              ];

              if (navigationKeys.includes(event.key)) {
                return false; // Allow navigation
              }

              // Block all other key presses
              return true;
            },
            handlePaste: () => getCurrentScenario() === "auth-hidden",
            handleDrop: () => getCurrentScenario() === "auth-hidden",
            handleTextInput: () => getCurrentScenario() === "auth-hidden",
            handleDOMEvents: {
              // Block input events that modify content only when auth-hidden
              input: () => getCurrentScenario() === "auth-hidden",
              beforeinput: () => getCurrentScenario() === "auth-hidden",
              compositionstart: () => getCurrentScenario() === "auth-hidden",
              compositionend: () => getCurrentScenario() === "auth-hidden",
              compositionupdate: () => getCurrentScenario() === "auth-hidden",
              cut: () => getCurrentScenario() === "auth-hidden",
              paste: () => getCurrentScenario() === "auth-hidden",
              keydown: (view, event) => {
                if (getCurrentScenario() !== "auth-hidden") return false;

                // Allow navigation keys
                const navigationKeys = [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                  "Tab",
                  "Escape",
                ];

                if (navigationKeys.includes(event.key)) {
                  return false; // Allow navigation
                }

                // Block all other keydown events
                return true;
              },
              // Allow copy for text selection
              copy: () => false,
              // Allow mouse events for selection
              mousedown: () => false,
              mouseup: () => false,
              click: () => false,
              dblclick: () => false,
              contextmenu: () => false,
              focus: () => false,
              blur: () => false,
            },
          },
          // Block all transactions that modify content only when auth-hidden
          appendTransaction: (transactions, oldState, newState) => {
            if (getCurrentScenario() === "auth-hidden") {
              return null; // Prevent any content changes
            }
            return null;
          },
        }),
      ];
    },
  });
};
