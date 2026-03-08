import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const workspacePath = workspaceFolder.uri.fsPath;

    // Watch all .env files recursively
    const watcher = chokidar.watch('**/.env', {
        cwd: workspacePath,
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('change', (relativePath) => {
        const envFullPath = path.join(workspacePath, relativePath);
        if (!fs.existsSync(envFullPath)) return;

        const content = fs.readFileSync(envFullPath, 'utf8');
        const now = new Date();
        const timestamp =
            `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_` +
            `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;

        // Folder containing this .env file
        const envFolder = path.dirname(envFullPath);

        // Each folder has its own .envtracker
        const trackerFolder = path.join(envFolder, '.envtracker');
        const snapshotFolder = path.join(trackerFolder, 'snapshots');

        if (!fs.existsSync(trackerFolder)) fs.mkdirSync(trackerFolder);
        if (!fs.existsSync(snapshotFolder)) fs.mkdirSync(snapshotFolder);

        // Save snapshot
        const snapshotFile = path.join(snapshotFolder, `${timestamp}.env`);
        fs.writeFileSync(snapshotFile, content);

        // Ensure .gitignore exists for this folder
        ensureGitignore(envFolder);

        vscode.window.showInformationMessage(`Env Tracker: Snapshot saved (${relativePath})`);
    });

    context.subscriptions.push({
        dispose: () => watcher.close()
    });

    vscode.window.showInformationMessage('Env Tracker Activated ✅ Watching all .env files');
}

function ensureGitignore(folderPath: string) {
    const gitignorePath = path.join(folderPath, '.gitignore');
    const entry = '.envtracker/';
    let modified = false;

    try {
        if (fs.existsSync(gitignorePath)) {
            const content = fs.readFileSync(gitignorePath, 'utf8');
            if (!content.includes(entry)) {
                fs.appendFileSync(gitignorePath, `\n${entry}\n`);
                modified = true;
            }
        } else {
            fs.writeFileSync(gitignorePath, `${entry}\n`);
            modified = true;
        }

        if (modified) {
            vscode.window.showInformationMessage(
                `Env Tracker: Added '.envtracker/' to ${folderPath}/.gitignore to prevent snapshots from being committed.`
            );
        }
    } catch (error) {
        console.error('Env Tracker: Failed to update .gitignore', error);
    }
}

export function deactivate() {}