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

function extract_cells(filename) {
	if (!filename) {
		return vscode.window.showErrorMessage('You must enter a filename.')
	}

	const filename_with_ext = `${filename}.py`;

	const notebook_range = vscode.window.activeNotebookEditor.selection;
	if (!notebook_range || notebook_range.isEmpty == true) {
		return vscode.window.showErrorMessage('You must select cells.');
	}

	const notebook_uri = vscode.window.activeNotebookEditor.notebook.uri
	const notebook_path = notebook_uri.fsPath;
	const notebook_folder = path.dirname(notebook_path);
	const notebook_cells = vscode.window.activeNotebookEditor.notebook.getCells(notebook_range);
	
	const code = get_all_code(notebook_cells);
	
	fs.writeFile(path.join(notebook_folder, filename_with_ext), code, (err) => {
		if (err) {
			return vscode.window.showErrorMessage(
				'Failed to create a Python module.'
			);
		}
		
		vscode.window.showInformationMessage('Created a Python module.');
	});

	// const edit = vscode.NotebookEdit.deleteCells(notebook_range);
	const import_code = `import ${filename}`;
	const new_cells = [new vscode.NotebookCellData(vscode.NotebookCellKind.Code, import_code, 'python')];
	const edit = vscode.NotebookEdit.replaceCells(notebook_range, new_cells);
	const workspace_edit = new vscode.WorkspaceEdit();
	workspace_edit.set(notebook_uri, [edit]);

	vscode.workspace.applyEdit(workspace_edit);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('jupyter-extractor.extractCellCode', function () {
		if (!vscode.window.activeNotebookEditor) {
			return vscode.window.showErrorMessage('Please open a notebook first!');
		}

		vscode.window.showInputBox().then(extract_cells)
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
