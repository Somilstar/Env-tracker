import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';

export function activate(context: vscode.ExtensionContext) {

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const workspacePath = workspaceFolder.uri.fsPath;

    // Ensure .envtracker is ignored by git
    ensureGitignore(workspacePath);

    const envPath = path.join(workspacePath, '.env');
    const trackerFolder = path.join(workspacePath, '.envtracker');
    const snapshotFolder = path.join(trackerFolder, 'snapshots');

    // Create folders if they don't exist
    if (!fs.existsSync(trackerFolder)) fs.mkdirSync(trackerFolder);
    if (!fs.existsSync(snapshotFolder)) fs.mkdirSync(snapshotFolder);

    // Watch .env for changes
    const watcher = chokidar.watch(envPath, { persistent: true, ignoreInitial: true });

    watcher.on('change', () => {

        if (!fs.existsSync(envPath)) return;

        const content = fs.readFileSync(envPath, 'utf8');

        const now = new Date();

        const timestamp =
            `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_` +
            `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;

        const snapshotFile = path.join(snapshotFolder, `${timestamp}.env`);

        fs.writeFileSync(snapshotFile, content);

        vscode.window.showInformationMessage(`Env Tracker: Snapshot saved (${timestamp})`);
    });

    context.subscriptions.push({
        dispose: () => watcher.close()
    });
}

function ensureGitignore(workspacePath: string) {

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

        } else {

            fs.writeFileSync(gitignorePath, `${entry}\n`);
            modified = true;

        }

        if (modified) {
            vscode.window.showInformationMessage(
                "Env Tracker added '.envtracker/' to your .gitignore to prevent snapshot files from being committed."
            );
        }

    } catch (error) {
        console.error('Env Tracker: Failed to update .gitignore', error);
    }
}

export function deactivate() {}