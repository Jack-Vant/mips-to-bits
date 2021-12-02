const div_infiles = document.querySelector("#infiles");
let hlc = 0;
function highlightDropzone(e) {
    hlc++;
    div_infiles.classList.remove("highlight-1", "highlight-2");
    if (e.target.id == "infiles")
        div_infiles.classList.add("highlight-1");
    else
        div_infiles.classList.add("highlight-2");
}
function unhighlightDropzone() {
    if (--hlc == 0)
        div_infiles.classList.remove("highlight-1", "highlight-2");
}
document.body.addEventListener("dragenter", highlightDropzone);
document.body.addEventListener("dragleave", unhighlightDropzone);
const files = {};
function removeFile(div, file_name) {
    delete files[file_name];
    div.remove();
}
function createIcon(iconName) {
    const xmlns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttributeNS(null, "class", "icon");
    const use = document.createElementNS(xmlns, "use");
    use.setAttributeNS(null, "href", `./svgs/${iconName}.svg#main`);
    svg.appendChild(use);
    return svg;
}
function appendSrcFileElement(file_name) {
    const div_bloc = document.createElement("div");
    div_bloc.className = "bloc";
    const div_file = document.createElement("div");
    div_file.className = "file file-src";
    const span = document.createElement("span");
    span.textContent = file_name;
    const btn = document.createElement("button");
    btn.className = "btn btn-remove";
    btn.title = "Remove file";
    btn.addEventListener("click", () => removeFile(div_bloc, file_name));
    const icon = createIcon("trash-alt");
    btn.appendChild(icon);
    div_file.appendChild(span);
    div_file.appendChild(document.createTextNode("\n"));
    div_file.appendChild(btn);
    div_bloc.appendChild(div_file);
    div_infiles.appendChild(div_bloc);
}
function pushSrcFiles(new_files) {
    if (new_files instanceof FileList)
        for (const file of new_files) {
            if (files[file.name] != undefined)
                continue;
            files[file.name] = file;
            appendSrcFileElement(file.name);
        }
}
div_infiles.addEventListener("dragover", e => e.preventDefault());
div_infiles.addEventListener("drop", (e) => {
    e.preventDefault();
    const dt_files = e.dataTransfer?.files;
    pushSrcFiles(dt_files);
    unhighlightDropzone();
});
const input_files = document.querySelector("#input_files");
input_files.addEventListener("change", () => { pushSrcFiles(input_files.files); });
input_files.disabled = false;
const btn_files = document.querySelector("#btn_files");
btn_files.addEventListener("click", () => input_files.click());
btn_files.disabled = false;
import * as MtB from "./MtB.js";
const div_outfiles = document.querySelector("div#outfiles");
const ul_errList = document.querySelector("ul#errlist");
function appendError(error) {
    const li = document.createElement("li");
    li.textContent = error;
    ul_errList.appendChild(li);
}
function handleErrors(err) {
    if (err instanceof Array)
        for (const e of err)
            appendError(e);
    else if (err instanceof Error)
        appendError(err.message);
    else
        appendError(err);
}
let urls = [];
function appendOutFileElement(cf) {
    const div_bloc = document.createElement("div");
    div_bloc.className = "bloc";
    const div_file = document.createElement("div");
    div_file.className = "file file-out";
    const a = document.createElement("a");
    const url = window.URL.createObjectURL(cf);
    urls.push(url); // <-- !
    a.href = url;
    a.download = cf.name;
    a.text = cf.name;
    const icon = createIcon("check-square");
    div_file.appendChild(a);
    div_file.appendChild(document.createTextNode("\n"));
    div_file.appendChild(icon);
    div_bloc.appendChild(div_file);
    div_outfiles.appendChild(div_bloc);
}
async function run() {
    const base = Number.parseInt(document.querySelector("#enc").value);
    ul_errList.replaceChildren(); // Clear <ul>
    div_outfiles.replaceChildren(); // Clear outfiles
    for (const url of urls)
        window.URL.revokeObjectURL(url); // Clear urls
    urls = [];
    for (const f in files) {
        try {
            const lines = MtB.convert(files[f].name, await files[f].text(), base);
            const cf = new File(lines, files[f].name.replace("asm", "txt"), { type: "text/plain" });
            appendOutFileElement(cf);
        }
        catch (err) {
            handleErrors(err);
        }
    }
}
const button_run = document.querySelector("button#run_btn");
button_run.addEventListener("click", run);
button_run.disabled = false;
