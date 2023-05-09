"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogMessageViewer = void 0;
const abstractComponent_1 = require("./abstractComponent");
const log_1 = require("../../types/utils/log");
class LogMessageViewer extends abstractComponent_1.AbstractComponent {
    constructor(state) {
        super(state, "LogMessageViewer");
        // Subscribe to onModuleChanged
        log_1.Log.getInstance().on("onLogMessage", (message, level) => {
            this.showMessage(message, level);
        });
    }
    showMessage(message, level) {
        let displayElement = $("#log-message-text");
        let statusBarElement = $("#status-bar");
        // Filter & Color
        switch (level) {
            case log_1.LogLevels.DEBUG:
                return; // Skip These
            case log_1.LogLevels.INFO:
                statusBarElement.css("color", "var(--color-text-primary)");
                statusBarElement.css("background-color", "unset");
                break;
            case log_1.LogLevels.WARNING:
                statusBarElement.css("color", "black");
                statusBarElement.css("background-color", "var(--warning)");
                break;
            case log_1.LogLevels.ERROR:
                statusBarElement.css("color", "black");
                statusBarElement.css("background-color", "var(--danger)");
                break;
        }
        displayElement.text(message);
        statusBarElement.css("display", "block");
        // Start the Fade out Timer for 10 seconds
        setTimeout(() => {
            statusBarElement.fadeOut();
        }, 10000);
    }
    render() {
        // Load Template
        this.loadTemplateToParent();
    }
}
exports.LogMessageViewer = LogMessageViewer;
//# sourceMappingURL=logMessageViewer.js.map