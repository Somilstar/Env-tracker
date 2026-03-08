"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chokidar_1 = __importDefault(require("chokidar"));
function activate(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder)
        return;
    const workspacePath = workspaceFolder.uri.fsPath;
    // Ensure .envtracker is ignored by git
    ensureGitignore(workspacePath);
    const envPath = path.join(workspacePath, '.env');
    const trackerFolder = path.join(workspacePath, '.envtracker');
    const snapshotFolder = path.join(trackerFolder, 'snapshots');
    // Create folders if they don't exist
    if (!fs.existsSync(trackerFolder))
        fs.mkdirSync(trackerFolder);
    if (!fs.existsSync(snapshotFolder))
        fs.mkdirSync(snapshotFolder);
    // Watch .env for changes
    const watcher = chokidar_1.default.watch(envPath, { persistent: true, ignoreInitial: true });
    watcher.on('change', () => {
        if (!fs.existsSync(envPath))
            return;
        const content = fs.readFileSync(envPath, 'utf8');
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_` +
            `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
        const snapshotFile = path.join(snapshotFolder, `${timestamp}.env`);
        fs.writeFileSync(snapshotFile, content);
        vscode.window.showInformationMessage(`Env Tracker: Snapshot saved (${timestamp})`);
    });
    context.subscriptions.push({
        dispose: () => watcher.close()
    });
}
function ensureGitignore(workspacePath) {
    const gitignorePath = path.join(workspacePath, '.gitignore');
    const entry = '.envtracker/';
    let modified = false;
    try {
        if (fs.existsSync(gitignorePath)) {
            const content = fs.readFileSync(gitignorePath, 'utf8');
            if (!content.includes(entry)) {
                fs.appendFileSync(gitignorePath, `\n${entry}\n`);
                modified = true;
            }
        }
        else {
            fs.writeFileSync(gitignorePath, `${entry}\n`);
            modified = true;
        }
        if (modified) {
            vscode.window.showInformationMessage("Env Tracker added '.envtracker/' to your .gitignore to prevent snapshot files from being committed.");
        }
    }
    catch (error) {
        console.error('Env Tracker: Failed to update .gitignore', error);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map