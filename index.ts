import * as monaco from 'monaco-editor';

const project = document.querySelector("body")!.getAttribute("data-project-id");
if(project && document.location.pathname.includes("/-/commits/")) {
    var editor;

    const debounce = (func, wait) => {
        let timeout;
    
        return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
    
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        };
    };

    function historyChange() {
        const current: number = versionHistory.length - 1 - +historyRange.value;
        setModel(versionHistory[current + 1], versionHistory[current]);
    }

    function gitlabFetch(path: string, raw: boolean = false) {
        return fetch(path).then(d => !raw ? d.json() : d.text());
    }

    function setModel(path1: FileContent, path2: FileContent) {
        if(!path1.content) {
            path1.content = gitlabFetch(path1.path, true);
        }
        if(!path2.content) {
            path2.content = gitlabFetch(path2.path, true);
        }
        Promise.all([path1.content, path2.content])
        .then(r => {
            let top = (document.querySelector(".diffViewport") as HTMLElement).style.top;
            const viewState = editor.saveViewState();
            editor.setModel({
                original: monaco.editor.createModel(r[0]),
                modified: monaco.editor.createModel(r[1])
            });
            editor.restoreViewState(viewState!);
        });
    }

    type FileContent = {path: string, content: Promise<string> | undefined};

    var versionHistory: FileContent[];

    function initEditor() {
        const branch = (document.querySelector(".dropdown-toggle-text") as HTMLElement).innerText;
        const pathname = document.location.pathname;
        let file = pathname.substring(pathname.indexOf(branch) + branch.length + 1);
        let prefix = "";
        if(!file) {
            file = (document.querySelector("#fileInput") as HTMLInputElement).value;
            prefix = "https://gitlab.com";
        }
        if(project && file) {

            editor = monaco.editor.createDiffEditor(document.getElementById('monacoEditor') as HTMLElement);

            gitlabFetch(`${prefix}/api/v4/projects/${project}/repository/commits?path=${encodeURIComponent(file)}&ref_name=${encodeURIComponent(branch)}`/*, token*/)
            .then((d:any[]) => {

                console.log(d);

                versionHistory = d.map(i => { return {path: `${prefix}/api/v4/projects/${project}/repository/files/${encodeURIComponent(file)}/raw?ref=` + i.id, content: undefined}});

                historyRange.min = "1";
                historyRange.max = d.length - 1 + "";
                historyRange.value = historyRange.max;
                historyRange.style.visibility = "visible";
                if(d.length > 1) {
                    setModel(versionHistory[1], versionHistory[0]);
                }
            });
        }
    }

    const keyDown = debounce(() => {
        initEditor();
    }, 500);

    const container = document.querySelector(".js-project-commits-show");

    const editorContainer = document.createElement("div");

    const historyRange = document.createElement("input") as HTMLInputElement;
    historyRange.type = "range";
    historyRange.style.width = "100%";
    historyRange.style.visibility = "hidden";
    historyRange.onchange = historyChange;
    const monacoEditor = document.createElement("div") as HTMLDivElement;
    monacoEditor.id = "monacoEditor";
    monacoEditor.style.height = "600px";
    monacoEditor.style.width = "100%";
    editorContainer.appendChild(historyRange);
    editorContainer.appendChild(monacoEditor);
    container?.insertBefore(editorContainer, container.querySelector("#project_" + project));

    const inputs = document.querySelectorAll("table input");
    if(inputs && inputs.length > 0) {
        inputs.forEach(i => (i as HTMLInputElement).oninput = keyDown);
    } else {
        initEditor();
    }
}