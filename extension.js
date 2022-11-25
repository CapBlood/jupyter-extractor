const vscode = require('vscode');
const fs = require('fs');
const path = require('path');


function get_code(cell) {
	const text_doc = cell.document;
	
	var firstLine = text_doc.lineAt(0);
	var lastLine = text_doc.lineAt(text_doc.lineCount - 1);
	var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
	
	return text_doc.getText(textRange);
}

function get_all_code(cells) {
	const code = cells.map(get_code).join("\n\n\n");

	return code;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('jupyter-extractor.helloWorld', function () {
		if (!vscode.window.activeNotebookEditor) {
			return vscode.window.showErrorMessage('Please open a notebook first!');
		}

		vscode.window.showInputBox().then(
			filename => {
				const notebook_uri = vscode.window.activeNotebookEditor.notebook.uri
				const notebook_path = notebook_uri.fsPath;
				const notebook_folder = path.dirname(notebook_path);
				const notebook_range = vscode.window.activeNotebookEditor.selection;
				const notebook_cells = vscode.window.activeNotebookEditor.notebook.getCells(notebook_range);
				
				const code = get_all_code(notebook_cells);
				
				fs.writeFile(path.join(notebook_folder, filename), code, (err) => {
					if (err) {
						return vscode.window.showErrorMessage(
							'Failed to create a Python module!'
						);
					}
					
					vscode.window.showInformationMessage('Created a Python module');
				});

				const edit = vscode.NotebookEdit.deleteCells(notebook_range);
				const workspace_edit = new vscode.WorkspaceEdit();
				workspace_edit.set(notebook_uri, [edit]);

				vscode.workspace.applyEdit(workspace_edit);
			}
		)
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
